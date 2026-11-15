import { sb, state, loadFamily, loadCachedFamily, loadChild, setChild, logSession, updateSession, rate, setReview, clearReview,
  setOverride, createFamily, addChild, invite, removeInvite, flush, pendingCount } from './store.js';
import { RATINGS, pathStatus, currentUnit, nextEpisode, watchedSet, unitLevel, latestRatings, afterUnitRating, afterReview,
  dueReviews, interleaveSuggestion, coverage, today } from './progress.js';

let content = null;
const $ = (s, el = document) => el.querySelector(s);
const view = $('#view');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const unitById = id => content.units.find(u => u.id === id);
const stageOf = n => content.stages.find(s => s.n === n);
const child = () => state.children.find(c => c.id === state.childId);

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2600);
}

const icon = {
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="5" y="10" width="14" height="10" rx="2" fill="currentColor"/></svg>',
  star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/></svg>',
  tick: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  music: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 17V5l11-2v12" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="6.5" cy="17.5" r="2.5" fill="currentColor"/><circle cx="17.5" cy="15.5" r="2.5" fill="currentColor"/></svg>',
  hands: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="12" width="6" height="6" rx="1" fill="currentColor"/><rect x="9" y="6" width="6" height="12" rx="1" fill="currentColor" opacity=".7"/><rect x="15" y="9" width="6" height="9" rx="1" fill="currentColor" opacity=".45"/></svg>',
};

// ------------------------------------------------------------------ nav
function renderNav() {
  const n = $('#nav');
  if (!state.user || !state.family) { n.innerHTML = ''; return; }
  const due = dueReviews(content, state).length;
  const kids = state.children.length > 1
    ? `<select id="childSel" aria-label="Child">${state.children.map(c => `<option value="${c.id}" ${c.id === state.childId ? 'selected' : ''}>${esc(c.first_name)}</option>`).join('')}</select>`
    : `<span class="who">${esc(child()?.first_name || '')}</span>`;
  n.innerHTML = `${kids}
    <a href="#/review" class="navlink">Review${due ? ` <b class="pill">${due}</b>` : ''}</a>
    <a href="#/explore" class="navlink">Explore</a>
    <button class="navlink grown" id="grownBtn" title="Press and hold">Grown-ups</button>`;
  const sel = $('#childSel');
  if (sel) sel.onchange = async () => { setChild(sel.value); await safe(loadChild); route(); };
  holdToOpen($('#grownBtn'), () => { location.hash = '#/grownups'; });
}

function holdToOpen(btn, fn) {
  let t;
  const start = e => { e.preventDefault(); btn.classList.add('holding'); t = setTimeout(() => { btn.classList.remove('holding'); fn(); }, 1200); };
  const stop = () => { clearTimeout(t); btn.classList.remove('holding'); };
  btn.addEventListener('pointerdown', start); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => btn.addEventListener(ev, stop));
  btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fn(); });
}

// ------------------------------------------------------------------ sign in / setup
function renderSignIn(msg = '') {
  view.innerHTML = `<section class="card narrow">
    <h1>Number Path</h1>
    <p class="lead">A step-by-step maths path through the Numberblocks episodes, for one family.</p>
    <form id="signin" class="stack">
      <label>Grown-up's email<input type="email" name="email" required autocomplete="email" placeholder="you@example.com"></label>
      <button class="btn primary" type="submit">Email me a sign-in link</button>
    </form>
    <p class="muted small">${esc(msg) || 'Open the link on this device and in this browser.'}</p>
  </section>`;
  $('#signin').onsubmit = async e => {
    e.preventDefault();
    const email = new FormData(e.target).get('email');
    const btn = e.target.querySelector('button'); btn.disabled = true; btn.textContent = 'Sending…';
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + location.pathname, shouldCreateUser: true } });
    if (error) { btn.disabled = false; btn.textContent = 'Email me a sign-in link'; toast(error.message); return; }
    view.innerHTML = `<section class="card narrow"><h1>Check your email</h1><p class="lead">A sign-in link is on its way to <b>${esc(email)}</b>. Open it on this device.</p></section>`;
  };
}

function renderSetup() {
  view.innerHTML = `<section class="card narrow">
    <h1>Set up your family</h1>
    <p class="lead">Only the child's first name is stored.</p>
    <form id="setup" class="stack">
      <label>Family name<input name="family" required maxlength="40" placeholder="e.g. Home"></label>
      <label>Child's first name<input name="child" required maxlength="40"></label>
      <button class="btn primary" type="submit">Start the path</button>
    </form>
    <p class="muted small">If someone in your family has invited you, ask them to add this email in Grown-ups, then sign in again.</p>
  </section>`;
  $('#setup').onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try { await createFamily(f.get('family'), f.get('child')); await loadChild(); location.hash = '#/'; route(); }
    catch (err) { toast(err.message); }
  };
}

// ------------------------------------------------------------------ home: path map
function stone(u, st, isCurrent) {
  const s = stageOf(u.stage);
  const label = u.kind === 'bridge' ? u.id : u.id.replace('.R', ' ★');
  const badge = st === 'locked' ? icon.lock : st === 'secure' ? icon.star : st === 'done' ? icon.tick : '';
  return `<a class="stone ${st} ${u.kind} ${isCurrent ? 'current' : ''}" style="--c:${s.colour}" href="#/unit/${u.id}" ${st === 'locked' ? 'aria-disabled="true"' : ''}>
    <span class="disc">${badge ? `<span class="badge">${badge}</span>` : ''}<span class="num">${esc(label)}</span></span>
    <span class="lbl">${esc(u.title)}${u.kind === 'bridge' ? '<em>bridge · no video</em>' : ''}</span>
  </a>`;
}

function renderHome() {
  const st = pathStatus(content, state);
  const cur = currentUnit(content, state);
  const due = dueReviews(content, state);
  const mix = interleaveSuggestion(content, state);
  const name = child()?.first_name || '';
  const nextK = nextEpisode(cur, state);
  let html = `<section class="hero" style="--c:${stageOf(cur.stage).colour}">
      <div>
        <p class="eyebrow">${esc(name ? name + "'s next step" : 'Next step')}</p>
        <h1>${esc(cur.title)}</h1>
        <p class="lead">${esc(cur.idea)}</p>
        <a class="btn primary big" href="#/unit/${cur.id}">${icon.play} Start today's session</a>
      </div>
      ${nextK ? `<div class="hero-next">Up next<br><b>${esc(content.episodes[nextK].title)}</b></div>` : ''}
    </section>`;
  if (due.length || mix) {
    html += `<section class="nudges">`;
    if (due.length) html += `<a class="nudge" href="#/review"><b>${due.length} review${due.length > 1 ? 's' : ''} due</b><span>Quick look back at ${due.map(u => esc(u.title)).slice(0, 2).join(', ')}${due.length > 2 ? '…' : ''}</span></a>`;
    if (mix) html += `<a class="nudge mix" href="#/mix/${mix[0].id}/${mix[1].id}"><b>Mix it up</b><span>Today, try one episode each from ${esc(mix[0].title)} and ${esc(mix[1].title)}.</span></a>`;
    html += `</section>`;
  }
  html += `<div class="path">`;
  for (const s of content.stages) {
    const us = content.units.filter(u => u.stage === s.n);
    const done = us.filter(u => ['done', 'secure'].includes(st[u.id])).length;
    html += `<section class="band" style="--c:${s.colour}">
      <header><h2><span class="dot"></span>Stage ${s.n} · ${s.name}</h2><p>${s.range} · ${done}/${us.length} done</p></header>
      <div class="stones">${us.map(u => stone(u, st[u.id], u.id === cur.id)).join('')}</div>
    </section>`;
  }
  html += `</div>`;
  view.innerHTML = html;
  view.querySelectorAll('.stone.locked').forEach(a => a.addEventListener('click', e => { e.preventDefault(); toast('Finish the earlier steps first — or a grown-up can unlock it.'); }));
}

// ------------------------------------------------------------------ unit page
function epRow(k, unit, { extra = false } = {}) {
  const e = content.episodes[k];
  const w = watchedSet(state).has(k);
  const ico = e.kind === 'song' ? icon.music : icon.play;
  return `<li class="ep ${w ? 'watched' : ''}">
    <button class="epbtn" data-ep="${k}" data-unit="${unit ? unit.id : ''}">
      <span class="thumb">${e.yt ? `<img loading="lazy" alt="" onerror="this.remove()" src="https://i.ytimg.com/vi/${e.yt}/mqdefault.jpg">` : ''}<span class="pl">${ico}</span></span>
      <span class="meta"><b>${esc(e.title)}</b><small>${esc(e.label)}${e.provisional ? ' · placement to confirm' : ''}${extra ? ' · extra' : ''}</small></span>
      ${w ? `<span class="seen">${icon.tick}</span>` : ''}
    </button></li>`;
}

function checksBlock(unit, context = 'unit') {
  const lr = latestRatings(state, unit.id);
  return `<ol class="checks">${unit.checks.map((c, i) => `<li>
      <p>${esc(c)}</p>
      <div class="seg" role="group" aria-label="Rating">
        ${RATINGS.map(r => `<button class="${context === 'unit' && lr[i]?.rating === r.key ? 'on' : ''} r-${r.key}" data-check="${i}" data-r="${r.key}">${r.label}</button>`).join('')}
      </div></li>`).join('')}</ol>`;
}

function renderUnit(id) {
  const u = unitById(id);
  if (!u) return renderNotFound();
  const st = pathStatus(content, state)[u.id];
  const s = stageOf(u.stage);
  const idx = content.units.indexOf(u);
  const prev = content.units[idx - 1];
  const warm = prev ? prev.prompts[0] : null;
  const nextK = nextEpisode(u, state);
  const lvl = unitLevel(state, u);
  view.innerHTML = `<article class="unit" style="--c:${s.colour}">
    <a class="back" href="#/">← Path</a>
    <header class="unithead">
      <p class="eyebrow">Stage ${s.n} · ${s.name} · ${u.kind === 'bridge' ? 'Bridge unit' : 'Unit ' + esc(u.id)}</p>
      <h1>${esc(u.title)}</h1>
      <p class="lead">${esc(u.idea)}</p>
      ${st === 'locked' ? `<p class="note">This step is still locked. You can look around; a grown-up can unlock it in Grown-ups.</p>` : ''}
      ${lvl === 'secure' ? `<p class="note good">${icon.star} Secure — this unit will come back for review.</p>` : ''}
    </header>

    <ol class="session">
      ${warm ? `<li><h3><span>1</span>Warm-up</h3><p>${esc(warm)} <span class="muted">(from ${esc(prev.title)})</span></p></li>` : ''}
      <li><h3><span>${warm ? 2 : 1}</span>Watch</h3>
        ${u.episodes.length ? `<p class="muted">Watch one episode together. Pause once and ask what will happen next.</p>
        <ul class="eps">${u.episodes.map(k => epRow(k, u)).join('')}</ul>` : `<p class="muted">Bridge unit: no video. Go straight to the activity.</p>`}
        ${u.extras.length ? `<details class="extras"><summary>Extras (${u.extras.length})</summary><ul class="eps">${u.extras.map(k => epRow(k, u, { extra: true })).join('')}</ul></details>` : ''}
      </li>
      <li><h3><span>${warm ? 3 : 2}</span>Talk</h3><ul class="prompts">${u.prompts.map(p => `<li>${esc(p)}</li>`).join('')}</ul></li>
      <li><h3><span>${warm ? 4 : 3}</span>Do ${icon.hands}</h3>
        <p><b>You need:</b> ${esc(u.activity.materials)}</p>
        <ol class="steps">${u.activity.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
        <a class="btn ghost small" href="#/print/${u.id}">Printable card</a>
      </li>
      <li class="grownup"><h3><span>${warm ? 5 : 4}</span>Check <small>for grown-ups</small></h3>
        <p class="muted">Watch what your child does, then choose. Emerging or Secure on every check opens the next step.</p>
        ${checksBlock(u)}
      </li>
    </ol>
    <footer class="unitfoot">
      <p class="small muted">NCF-FS: ${u.ncf.map(c => `<abbr title="${esc(content.ncf[c.split(' ')[0]] || '')}">${esc(c)}</abbr>`).join(', ') || '—'} · NIPUN: ${u.nipun.map(c => `<abbr title="${esc(content.nipun[c] || '')}">${esc(c)}</abbr>`).join(', ') || '—'}</p>
    </footer>
  </article>`;
  wireEpisodes(u);
  view.querySelectorAll('.checks button').forEach(b => b.onclick = () => {
    const i = +b.dataset.check;
    rate({ unit_id: u.id, check_idx: i, rating: b.dataset.r });
    afterUnitRating(state, u, setReview);

    b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    const after = unitLevel(state, u);
    if (after === 'secure') toast('Secure! It will come back for a quick review.');
    else if (after === 'emerging') toast('Next step unlocked.');
    renderNav();

  });
  if (nextK) { const btn = view.querySelector(`.epbtn[data-ep="${nextK}"]`); btn && btn.classList.add('next'); }
}

function wireEpisodes(unit) {
  view.querySelectorAll('.epbtn').forEach(b => b.onclick = () => openPlayer(b.dataset.ep, b.dataset.unit || (unit && unit.id) || 'explore'));
}

// ------------------------------------------------------------------ player
let ytReady;
function loadYT() {
  if (ytReady) return ytReady;
  ytReady = new Promise(res => {
    window.onYouTubeIframeAPIReady = () => res(window.YT);
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(s);
  });
  return ytReady;
}

async function openPlayer(key, unitId) {
  const e = content.episodes[key];
  const m = $('#modal');
  const unit = unitById(unitId);
  const searchUrl = 'https://www.youtube.com/@Numberblocks/search?query=' + encodeURIComponent(e.title);
  m.hidden = false;
  m.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(e.title)}">
    <div class="sheethead"><div><b>${esc(e.title)}</b><small>${esc(e.label)}</small></div><button class="btn ghost" id="closeP">Done</button></div>
    ${e.yt ? `<div class="frame"><div id="ytp"></div></div>` : `<div class="nofile"><p>This one is not on YouTube as a single video.</p><a class="btn primary" target="_blank" rel="noopener" href="${searchUrl}">Search the channel</a></div>`}
    ${unit ? `<div class="after"><b>Talk about it</b><ul>${unit.prompts.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>` : ''}
  </div>`;
  const rewatch = watchedSet(state).has(key);
  const row = logSession({ unit_id: unitId, episode_key: key, is_rewatch: rewatch });
  let player = null, ended = false;
  const close = () => {
    let secs = 0, dur = 0;
    try { if (player) { secs = Math.round(player.getCurrentTime() || 0); dur = Math.round(player.getDuration() || 0); } } catch { /* player gone */ }
    const done = ended || (dur > 0 && secs / dur > 0.8);
    updateSession(row, { watched_seconds: secs, completed: done || !e.yt });
    try { player && player.destroy(); } catch { /* ignore */ }
    m.hidden = true; m.innerHTML = '';
    route();
  };
  $('#closeP').onclick = close;
  m.onclick = ev => { if (ev.target === m) close(); };
  document.addEventListener('keydown', function esc_(ev) { if (ev.key === 'Escape' && !m.hidden) { document.removeEventListener('keydown', esc_); close(); } });
  if (e.yt) {
    const YT = await loadYT();
    player = new YT.Player('ytp', {
      host: 'https://www.youtube-nocookie.com', videoId: e.yt,
      playerVars: { rel: 0, playsinline: 1, modestbranding: 1, iv_load_policy: 3, origin: location.origin },
      events: { onStateChange: ev => { if (ev.data === 0) ended = true; } },
    });
  }
}

// ------------------------------------------------------------------ review
function renderReview() {
  const due = dueReviews(content, state);
  const upcoming = state.reviews.filter(r => r.due_date > today()).sort((a, b) => a.due_date.localeCompare(b.due_date));
  view.innerHTML = `<section class="page">
    <h1>Review</h1>
    <p class="lead">Secured units come back after about 2 days, 1 week and 3 weeks. Rewatch one episode or redo the activity, then check again.</p>
    ${due.length ? due.map(u => `<article class="revcard" style="--c:${stageOf(u.stage).colour}" data-unit="${u.id}">
        <h2>${esc(u.title)}</h2>
        <ul class="eps">${u.episodes.slice(0, 2).map(k => epRow(k, u)).join('')}</ul>
        ${checksBlock(u, 'review')}
        <button class="btn primary" data-finish="${u.id}">Save review</button>
      </article>`).join('') : `<p class="empty">Nothing due today.</p>`}
    ${upcoming.length ? `<h2>Coming up</h2><ul class="list">${upcoming.map(r => `<li>${esc(unitById(r.unit_id)?.title)} <span class="muted">${r.due_date}</span></li>`).join('')}</ul>` : ''}
  </section>`;
  wireEpisodes(null);
  const picks = {};
  view.querySelectorAll('.revcard .checks button').forEach(b => b.onclick = () => {
    const uid = b.closest('.revcard').dataset.unit;
    picks[uid] = picks[uid] || {}; picks[uid][b.dataset.check] = b.dataset.r;
    b.parentElement.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
  });
  view.querySelectorAll('[data-finish]').forEach(b => b.onclick = () => {
    const u = unitById(b.dataset.finish);
    const p = picks[u.id] || {};
    if (Object.keys(p).length < u.checks.length) return toast('Rate every check first.');
    const arr = u.checks.map((_, i) => p[i]);
    arr.forEach((r, i) => rate({ unit_id: u.id, check_idx: i, rating: r, context: 'review' }));
    const res = afterReview(state, u.id, arr, setReview, clearReview);
    toast({ back: 'Back a step — it will come round again tomorrow.', forward: 'Great — next review scheduled.', graduated: 'Fully secure. No more reviews needed.', same: 'Saved. Same gap next time.' }[res]);
    renderNav(); renderReview();
  });
}

function renderMix(a, b) {
  const ua = unitById(a), ub = unitById(b);
  if (!ua || !ub) return renderNotFound();
  view.innerHTML = `<section class="page"><a class="back" href="#/">← Path</a><h1>Mix it up</h1>
    <p class="lead">Mixing earlier ideas helps them stick. Watch one from each, then ask the first talk question from each.</p>
    ${[ua, ub].map(u => `<article class="revcard" style="--c:${stageOf(u.stage).colour}"><h2>${esc(u.title)}</h2>
      <ul class="eps">${u.episodes.slice(0, 3).map(k => epRow(k, u)).join('')}</ul><p class="prompt">${esc(u.prompts[0])}</p></article>`).join('')}
  </section>`;
  wireEpisodes(null);
}

// ------------------------------------------------------------------ explore
function renderExplore() {
  const songs = Object.entries(content.episodes).filter(([, e]) => e.kind === 'song').map(([k]) => k);
  const specials = Object.entries(content.episodes).filter(([, e]) => e.kind === 'special').map(([k]) => k);
  const rest = content.explore.filter(k => content.episodes[k].kind === 'episode');
  view.innerHTML = `<section class="page"><h1>Explore</h1>
    <p class="lead">Free watching. These do not unlock anything.</p>
    <h2>Numbersongs</h2><ul class="eps grid">${songs.map(k => epRow(k, null)).join('')}</ul>
    <h2>Specials</h2><ul class="eps grid">${specials.map(k => epRow(k, null)).join('')}</ul>
    <h2>More episodes</h2><p class="muted small">Not yet placed in the path.</p><ul class="eps grid">${rest.map(k => epRow(k, null)).join('')}</ul>
  </section>`;
  wireEpisodes(null);
}

// ------------------------------------------------------------------ grown-ups
function renderGrownups() {
  const st = pathStatus(content, state);
  const ncf = coverage(content, state, 'ncf');
  const nip = coverage(content, state, 'nipun');
  const label = { secure: 'Secure', done: 'Done', started: 'Started', none: '—' };
  const recent = [...state.sessions].sort((a, b) => b.started_at.localeCompare(a.started_at)).slice(0, 12);
  const isOwner = state.family?.role === 'owner';
  const covRows = (map, dict) => Object.keys(dict).map(code => {
    const c = map[code];
    return `<tr class="cv-${c ? c.status : 'gap'}"><td><b>${esc(code)}</b></td><td>${esc(dict[code])}</td><td>${c ? c.units.join(', ') : '<i>not in app</i>'}</td><td>${c ? label[c.status] : 'Gap'}</td></tr>`;
  }).join('');
  view.innerHTML = `<section class="page grown">
    <h1>Grown-ups</h1>
    <p class="muted small">${pendingCount() ? `${pendingCount()} change(s) waiting to sync. ` : 'All changes synced. '}${state.online ? '' : 'Offline.'}</p>

    <h2>Progress by unit</h2>
    <table class="tbl"><thead><tr><th>Unit</th><th>Title</th><th>Status</th><th>Unlock</th></tr></thead><tbody>
    ${content.units.map(u => `<tr><td>${esc(u.id)}</td><td>${esc(u.title)}</td><td><span class="tag t-${st[u.id]}">${st[u.id]}</span></td>
      <td>${st[u.id] === 'locked' || state.overrides.some(o => o.unit_id === u.id) ? `<label class="sw"><input type="checkbox" data-ov="${u.id}" ${state.overrides.some(o => o.unit_id === u.id) ? 'checked' : ''}> open</label>` : ''}</td></tr>`).join('')}
    </tbody></table>

    <h2>NCF Foundational Stage 2022 — CG-8</h2>
    <table class="tbl cov"><thead><tr><th>Code</th><th>Competency</th><th>Units</th><th>Status</th></tr></thead><tbody>${covRows(ncf, content.ncf)}</tbody></table>
    <h2>NIPUN Bharat numeracy Lakshyas</h2>
    <table class="tbl cov"><thead><tr><th>Code</th><th>Target</th><th>Units</th><th>Status</th></tr></thead><tbody>${covRows(nip, content.nipun)}</tbody></table>

    <h2>Recent watching</h2>
    ${recent.length ? `<ul class="list">${recent.map(s => `<li>${esc(content.episodes[s.episode_key]?.title || s.episode_key)} <span class="muted">${new Date(s.started_at).toLocaleString()} · ${Math.round(s.watched_seconds / 60)} min${s.completed ? ' · finished' : ''}${s.is_rewatch ? ' · rewatch' : ''}</span></li>`).join('')}</ul>` : '<p class="empty">Nothing yet.</p>'}

    <h2>Family</h2>
    <p>${esc(state.family?.name)} · ${state.members.length} grown-up${state.members.length > 1 ? 's' : ''} · signed in as ${esc(state.user?.email)}</p>
    <div class="cols">
      <form id="addChild" class="stack"><label>Add a child (first name)<input name="n" maxlength="40" required></label><button class="btn">Add</button></form>
      ${isOwner ? `<form id="inv" class="stack"><label>Invite a grown-up by email<input type="email" name="e" required></label><button class="btn">Invite</button>
        <p class="muted small">They sign in with that email and join automatically.</p></form>` : ''}
    </div>
    ${state.invites.length ? `<ul class="list">${state.invites.map(i => `<li>${esc(i.email)} <span class="muted">${i.accepted_at ? 'joined' : 'pending'}</span> ${isOwner && !i.accepted_at ? `<button class="link" data-rminv="${i.id}">remove</button>` : ''}</li>`).join('')}</ul>` : ''}
    <p><button class="btn ghost" id="signout">Sign out</button> <span class="muted small">Also signs this browser out of EpiCompass, which shares the login.</span></p>
    <p class="muted small">Videos play from the official Numberblocks YouTube channel. This private family app is not affiliated with Alphablocks Ltd or the BBC.</p>
  </section>`;
  view.querySelectorAll('[data-ov]').forEach(c => c.onchange = () => { setOverride(c.dataset.ov, c.checked); toast(c.checked ? 'Unlocked.' : 'Lock restored.'); renderGrownups(); });
  $('#addChild').onsubmit = async e => { e.preventDefault(); try { await addChild(new FormData(e.target).get('n')); toast('Added.'); renderNav(); renderGrownups(); } catch (err) { toast(err.message); } };
  const inv = $('#inv'); if (inv) inv.onsubmit = async e => { e.preventDefault(); try { await invite(new FormData(e.target).get('e')); toast('Invite saved.'); renderGrownups(); } catch (err) { toast(err.message); } };
  view.querySelectorAll('[data-rminv]').forEach(b => b.onclick = async () => { try { await removeInvite(b.dataset.rminv); renderGrownups(); } catch (err) { toast(err.message); } });
  $('#signout').onclick = async () => {
    // Sign-in is shared with EpiCompass on this domain: sign out of this device only and clear only Number Path data.
    await sb.auth.signOut({ scope: 'local' });
    Object.keys(localStorage).filter(k => k.startsWith('np.')).forEach(k => localStorage.removeItem(k));
    location.hash = '#/'; location.reload();
  };
}

// ------------------------------------------------------------------ print card
function renderPrint(id) {
  const u = unitById(id); if (!u) return renderNotFound();
  view.innerHTML = `<article class="printcard" style="--c:${stageOf(u.stage).colour}">
    <p class="noprint"><a class="back" href="#/unit/${u.id}">← Back</a> <button class="btn" onclick="print()">Print</button></p>
    <p class="eyebrow">Stage ${u.stage} · ${esc(u.id)}</p><h1>${esc(u.title)}</h1><p class="lead">${esc(u.idea)}</p>
    <h3>You need</h3><p>${esc(u.activity.materials)}</p>
    <h3>Do</h3><ol>${u.activity.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
    <h3>Talk</h3><ul>${u.prompts.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <h3>Check</h3><ul class="boxes">${u.checks.map(s => `<li>${esc(s)} <span>☐ Not yet ☐ Emerging ☐ Secure</span></li>`).join('')}</ul>
  </article>`;
}

function renderNotFound() { view.innerHTML = `<section class="page"><h1>Not found</h1><a href="#/">Back to the path</a></section>`; }

// ------------------------------------------------------------------ router
function route() {
  if (!content) return;
  if (!state.user) return renderSignIn();
  if (!state.family) return renderSetup();
  renderNav();
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/');
  const [p, a, b] = parts;
  if (!p) renderHome();
  else if (p === 'unit') renderUnit(decodeURIComponent(a));
  else if (p === 'review') renderReview();
  else if (p === 'mix') renderMix(a, b);
  else if (p === 'explore') renderExplore();
  else if (p === 'grownups') renderGrownups();
  else if (p === 'print') renderPrint(decodeURIComponent(a));
  else renderNotFound();
  view.focus({ preventScroll: true });
  if (!location.hash.startsWith('#/print')) window.scrollTo(0, 0);
}

async function safe(fn) { try { await fn(); } catch (e) { console.warn(e); if (navigator.onLine) toast('Could not reach the server — working offline.'); } }

async function boot() {
  content = await (await fetch('data/content.json', { cache: 'no-cache' })).json();
  const { data: { session } } = await sb.auth.getSession();
  if (/access_token|error_description/.test(location.hash)) {
    const err = new URLSearchParams(location.hash.slice(1)).get('error_description');
    history.replaceState(null, '', location.pathname + '#/');
    if (err && !session) { renderSignIn(err); return; }
  }
  state.user = session?.user || null;
  if (state.user) {
    loadCachedFamily();
    if (navigator.onLine) { await safe(loadFamily); await safe(loadChild); }
  }
  route();
  sb.auth.onAuthStateChange(async (ev, s) => {
    if (ev === 'SIGNED_IN' && !state.user) { state.user = s.user; await safe(loadFamily); await safe(loadChild); route(); }
    if (ev === 'SIGNED_OUT') { state.user = null; route(); }
  });
  window.addEventListener('hashchange', route);
  window.addEventListener('online', async () => { await flush(); renderNav(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}

boot();
