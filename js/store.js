// Data layer: Supabase sync with an offline write queue and a local cache.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_KEY, DB_SCHEMA } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: { schema: DB_SCHEMA },
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit' },
});

const LS = {
  get: (k, d) => { try { const v = localStorage.getItem('np.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem('np.' + k, JSON.stringify(v)); } catch { /* storage full or blocked */ } },
};

export const state = {
  user: null,
  family: null,
  members: [],
  invites: [],
  children: [],
  childId: LS.get('childId', null),
  ratings: [],      // {id, child_id, unit_id, check_idx, rating, context, rated_at}
  sessions: [],     // {id, child_id, unit_id, episode_key, started_at, watched_seconds, completed, is_rewatch}
  reviews: [],      // {child_id, unit_id, due_date, step}
  overrides: [],    // {child_id, unit_id, unlocked}
  online: navigator.onLine,
};

// ---------- offline queue ----------
let queue = LS.get('queue', []);
const saveQueue = () => LS.set('queue', queue);
export const pendingCount = () => queue.length;

async function send(op) {
  const t = sb.from(op.table);
  let res;
  if (op.kind === 'upsert') res = await t.upsert(op.row, { onConflict: op.onConflict });
  else if (op.kind === 'delete') res = await t.delete().match(op.match);
  if (res.error) throw res.error;
}

export async function flush() {
  if (!navigator.onLine || !state.user) return;
  const rest = [];
  for (const op of queue) {
    try { await send(op); } catch (e) { rest.push(op); if (!navigator.onLine) break; }
  }
  queue = rest; saveQueue();
}

function enqueue(op) { queue.push(op); saveQueue(); flush(); }

window.addEventListener('online', () => { state.online = true; flush(); });
window.addEventListener('offline', () => { state.online = false; });

// ---------- cache ----------
function cacheChild() {
  if (!state.childId) return;
  LS.set('cache.' + state.childId, { ratings: state.ratings, sessions: state.sessions, reviews: state.reviews, overrides: state.overrides });
}
function loadCachedChild() {
  const c = LS.get('cache.' + state.childId, null);
  if (c) Object.assign(state, c);
}

// ---------- loading ----------
export async function loadFamily() {
  await sb.rpc('accept_invites');
  const { data: mem, error } = await sb.from('family_members').select('family_id, role, user_id');
  if (error) throw error;
  const mine = (mem || []).find(m => m.user_id === state.user.id);
  if (!mine) { state.family = null; return; }
  const [{ data: fam }, { data: kids }, { data: inv }] = await Promise.all([
    sb.from('families').select('*').eq('id', mine.family_id).single(),
    sb.from('children').select('*').eq('family_id', mine.family_id).order('created_at'),
    sb.from('family_invites').select('*').eq('family_id', mine.family_id).order('created_at'),
  ]);
  state.family = { ...fam, role: mine.role };
  state.members = (mem || []).filter(m => m.family_id === mine.family_id);
  state.invites = inv || [];
  state.children = kids || [];
  LS.set('family', { family: state.family, children: state.children });
  if (!state.children.find(c => c.id === state.childId)) state.childId = state.children[0]?.id || null;
  LS.set('childId', state.childId);
}

export function loadCachedFamily() {
  const f = LS.get('family', null);
  if (f) { state.family = f.family; state.children = f.children; }
  if (state.childId) loadCachedChild();
}

export async function loadChild() {
  if (!state.childId) return;
  loadCachedChild();
  if (!navigator.onLine) return;
  await flush();
  const id = state.childId;
  const [r, s, q, o] = await Promise.all([
    sb.from('ratings').select('*').eq('child_id', id).order('rated_at'),
    sb.from('sessions').select('*').eq('child_id', id).order('started_at'),
    sb.from('review_queue').select('*').eq('child_id', id),
    sb.from('unit_overrides').select('*').eq('child_id', id),
  ]);
  for (const x of [r, s, q, o]) if (x.error) throw x.error;
  // keep any rows still waiting in the queue
  const pend = t => queue.filter(op => op.table === t && op.kind === 'upsert').map(op => op.row);
  const merge = (rows, t, key) => { const m = new Map(rows.map(x => [key(x), x])); pend(t).forEach(x => m.set(key(x), x)); return [...m.values()]; };
  state.ratings = merge(r.data, 'ratings', x => x.id);
  state.sessions = merge(s.data, 'sessions', x => x.id);
  state.reviews = merge(q.data, 'review_queue', x => x.unit_id);
  state.overrides = merge(o.data, 'unit_overrides', x => x.unit_id);
  cacheChild();
}

export function setChild(id) { state.childId = id; LS.set('childId', id); }

// ---------- writes ----------
export function logSession({ unit_id, episode_key, is_rewatch }) {
  const row = { id: crypto.randomUUID(), child_id: state.childId, unit_id, episode_key, started_at: new Date().toISOString(), watched_seconds: 0, completed: false, is_rewatch };
  state.sessions.push(row); cacheChild();
  enqueue({ table: 'sessions', kind: 'upsert', row, onConflict: 'id' });
  return row;
}
export function updateSession(row, patch) {
  Object.assign(row, patch); cacheChild();
  enqueue({ table: 'sessions', kind: 'upsert', row: { ...row }, onConflict: 'id' });
}
export function rate({ unit_id, check_idx, rating, context = 'unit', note = null }) {
  const row = { id: crypto.randomUUID(), child_id: state.childId, unit_id, check_idx, rating, context, note, rated_at: new Date().toISOString() };
  state.ratings.push(row); cacheChild();
  enqueue({ table: 'ratings', kind: 'upsert', row, onConflict: 'id' });
  return row;
}
export function setReview(unit_id, due_date, step) {
  const row = { child_id: state.childId, unit_id, due_date, step, updated_at: new Date().toISOString() };
  state.reviews = state.reviews.filter(x => x.unit_id !== unit_id).concat(row); cacheChild();
  enqueue({ table: 'review_queue', kind: 'upsert', row, onConflict: 'child_id,unit_id' });
}
export function clearReview(unit_id) {
  state.reviews = state.reviews.filter(x => x.unit_id !== unit_id); cacheChild();
  enqueue({ table: 'review_queue', kind: 'delete', match: { child_id: state.childId, unit_id } });
}
export function setOverride(unit_id, unlocked) {
  if (unlocked) {
    const row = { child_id: state.childId, unit_id, unlocked: true };
    state.overrides = state.overrides.filter(x => x.unit_id !== unit_id).concat(row);
    enqueue({ table: 'unit_overrides', kind: 'upsert', row, onConflict: 'child_id,unit_id' });
  } else {
    state.overrides = state.overrides.filter(x => x.unit_id !== unit_id);
    enqueue({ table: 'unit_overrides', kind: 'delete', match: { child_id: state.childId, unit_id } });
  }
  cacheChild();
}

// ---------- family admin (online only) ----------
export async function createFamily(familyName, childName) {
  const { error } = await sb.rpc('create_family', { family_name: familyName, child_name: childName });
  if (error) throw error;
  await loadFamily();
}
export async function addChild(name) {
  const { error } = await sb.from('children').insert({ family_id: state.family.id, first_name: name.trim() });
  if (error) throw error;
  await loadFamily();
}
export async function invite(email) {
  const { error } = await sb.from('family_invites').insert({ family_id: state.family.id, email: email.trim().toLowerCase() });
  if (error) throw error;
  await loadFamily();
}
export async function removeInvite(id) {
  const { error } = await sb.from('family_invites').delete().eq('id', id);
  if (error) throw error;
  await loadFamily();
}
