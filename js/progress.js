// Pure progression rules: unlocking, unit status, review scheduling, interleaving.
import { REVIEW_INTERVALS, INTERLEAVE_EVERY } from './config.js';

export const RATINGS = [
  { key: 'not_yet', label: 'Not yet' },
  { key: 'emerging', label: 'Emerging' },
  { key: 'secure', label: 'Secure' },
];

// Local calendar dates (YYYY-MM-DD) — avoids UTC off-by-one in India
const ymd = x => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
export const today = () => ymd(new Date());
export const addDays = (d, n) => { const [y, m, dd] = d.split('-').map(Number); return ymd(new Date(y, m - 1, dd + n)); };

// Latest rating per check for a unit (unit or review context)
export function latestRatings(state, unitId) {
  const out = {};
  for (const r of state.ratings) {
    if (r.unit_id !== unitId) continue;
    const prev = out[r.check_idx];
    if (!prev || prev.rated_at <= r.rated_at) out[r.check_idx] = r;
  }
  return out;
}

export function unitLevel(state, unit) {
  const lr = latestRatings(state, unit.id);
  const vals = unit.checks.map((_, i) => lr[i]?.rating);
  if (vals.every(v => v === 'secure')) return 'secure';
  if (vals.every(v => v === 'secure' || v === 'emerging')) return 'emerging';
  if (vals.some(Boolean)) return 'started';
  return 'none';
}

export const isDone = (state, unit) => ['secure', 'emerging'].includes(unitLevel(state, unit));

// Status for every unit in path order: locked | open | done | secure
export function pathStatus(content, state) {
  const res = {};
  let prevDone = true;
  for (const u of content.units) {
    const lvl = unitLevel(state, u);
    const override = state.overrides.some(o => o.unit_id === u.id && o.unlocked);
    let st;
    if (lvl === 'secure') st = 'secure';
    else if (lvl === 'emerging') st = 'done';
    else if (prevDone || override) st = 'open';
    else st = 'locked';
    if (st === 'done' || st === 'secure') { /* keep chain */ }
    res[u.id] = st;
    prevDone = st === 'done' || st === 'secure';
  }
  return res;
}

export function currentUnit(content, state) {
  const st = pathStatus(content, state);
  return content.units.find(u => st[u.id] === 'open') || content.units[content.units.length - 1];
}

export const watchedSet = state => new Set(state.sessions.filter(s => s.completed).map(s => s.episode_key));
export const startedSet = state => new Set(state.sessions.map(s => s.episode_key));

export function nextEpisode(unit, state) {
  const w = watchedSet(state);
  return unit.episodes.find(k => !w.has(k)) || unit.episodes[0] || null;
}

// Called after a check rating in the unit context.
// First time all checks are secure -> schedule first review.
export function afterUnitRating(state, unit, setReview) {
  if (unitLevel(state, unit) === 'secure' && !state.reviews.some(r => r.unit_id === unit.id)) {
    setReview(unit.id, addDays(today(), REVIEW_INTERVALS[0]), 0);
  }
}

// Called when a review is completed with the given ratings array.
export function afterReview(state, unitId, ratings, setReview, clearReview) {
  const rq = state.reviews.find(r => r.unit_id === unitId);
  const step = rq ? rq.step : 0;
  if (ratings.some(r => r === 'not_yet')) {
    const back = Math.max(0, step - 1);
    setReview(unitId, addDays(today(), 1), back);
    return 'back';
  }
  if (ratings.every(r => r === 'secure')) {
    const nxt = step + 1;
    if (nxt >= REVIEW_INTERVALS.length) { clearReview(unitId); return 'graduated'; }
    setReview(unitId, addDays(today(), REVIEW_INTERVALS[nxt]), nxt);
    return 'forward';
  }
  setReview(unitId, addDays(today(), REVIEW_INTERVALS[step]), step);
  return 'same';
}

export const dueReviews = (content, state) =>
  state.reviews.filter(r => r.due_date <= today()).map(r => content.units.find(u => u.id === r.unit_id)).filter(Boolean);

// Interleaving: every Nth new session, suggest a mixed review of two finished units.
export function interleaveSuggestion(content, state) {
  const n = state.sessions.filter(s => !s.is_rewatch).length;
  if (n === 0 || n % INTERLEAVE_EVERY !== INTERLEAVE_EVERY - 1) return null;
  const st = pathStatus(content, state);
  const done = content.units.filter(u => (st[u.id] === 'done' || st[u.id] === 'secure') && u.episodes.length);
  if (done.length < 2) return null;
  // deterministic per day so it does not jump around on re-render
  const seed = [...today()].reduce((a, c) => a + c.charCodeAt(0), 0) + n;
  const a = done[seed % done.length];
  const b = done[(seed * 7 + 3) % done.length] === a ? done[(seed + 1) % done.length] : done[(seed * 7 + 3) % done.length];
  return [a, b];
}

// Curriculum coverage: code -> {units:[], status:'secure'|'done'|'started'|'none'}
export function coverage(content, state, field) {
  const map = {};
  const rank = { none: 0, started: 1, done: 2, secure: 3 };
  for (const u of content.units) {
    const lvl = unitLevel(state, u);
    const s = lvl === 'secure' ? 'secure' : lvl === 'emerging' ? 'done' : lvl === 'started' ? 'started' : 'none';
    for (const raw of u[field]) {
      const code = field === 'ncf' ? raw.split(' ')[0] : raw;
      map[code] = map[code] || { units: [], status: 'none' };
      map[code].units.push(u.id);
      if (rank[s] > rank[map[code].status]) map[code].status = s;
    }
  }
  return map;
}
