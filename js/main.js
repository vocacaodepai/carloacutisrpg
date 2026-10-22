import { T, BLOCKED_GROUND, drawTile, drawObject, drawPerson, drawDog, STYLES } from './render.js';
import { CHAPTERS } from './chapters.js';
import { chapter1 } from './chapter1.js';

const SCRIPTS = { 1: chapter1 };
const W = 320, H = 224;
const SPEED = 84;
const SAVE_KEY = 'carlo-rpg-save-v1';

const $ = (id) => document.getElementById(id);
const cv = $('c'), ctx = cv.getContext('2d');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ estado
const S = {
  mode: 'title', // title | play | busy
  chapter: null, maps: null, map: null,
  px: 0, py: 0, dir: 'down', walkT: 0, moving: false,
  dog: { on: false, x: 0, y: 0, dir: 'right', t: 0, moving: false },
  flags: {}, stats: { fe: 0, caridade: 0, alegria: 0 }, objective: '', time: 0,
};
window.__rpg = S; // útil para depuração e testes

const held = { up: false, down: false, left: false, right: false };
let inputWait = null;
let choiceState = null;
let toastTimer = 0;

function loadSave() {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY)) || { done: [] }; } catch { return { done: [] }; }
}
function writeSave(d) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch { /* sem armazenamento */ } }

// ------------------------------------------------------------------ mapas
const tileOf = (v) => Math.floor(v / T);

function prepMap(m) {
  m.blocked = new Uint8Array(m.w * m.h);
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
    if (BLOCKED_GROUND.has(m.ground(x, y))) m.blocked[y * m.w + x] = 1;
  }
  for (const o of m.objects) {
    if (o.solid === false) continue;
    for (let ty = o.y; ty < o.y + o.h; ty++) for (let tx = o.x; tx < o.x + o.w; tx++) {
      if (o.enter && tx === o.x + o.door && ty === o.y + o.h - 1) continue;
      m.blocked[ty * m.w + tx] = 1;
    }
  }
  m.cache = document.createElement('canvas');
  m.cache.width = m.w * T; m.cache.height = m.h * T;
  const c = m.cache.getContext('2d');
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) drawTile(c, m.ground(x, y), x, y);
  for (const n of m.npcs) {
    n.px = n.x * T + T / 2; n.py = n.y * T + 28;
    n.t = Math.random() * 6;
  }
}

function npcAtTile(tx, ty) {
  return S.map.npcs.find((n) => !n.hidden && tileOf(n.px) === tx && tileOf(n.py - 2) === ty);
}
function blockedTile(tx, ty, withNpc = true) {
  const m = S.map;
  if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return true;
  if (m.blocked[ty * m.w + tx]) return true;
  return withNpc && !!npcAtTile(tx, ty);
}
function canStand(x, y) {
  return !(blockedTile(tileOf(x - 7), tileOf(y - 7)) || blockedTile(tileOf(x + 7), tileOf(y - 7))
    || blockedTile(tileOf(x - 7), tileOf(y - 1)) || blockedTile(tileOf(x + 7), tileOf(y - 1)));
}

function setMap(id, tx, ty, dir) {
  S.map = S.maps[id]; S.map.id = id;
  S.px = tx * T + T / 2; S.py = ty * T + 28; S.dir = dir || 'down';
  S.dog.x = S.px; S.dog.y = S.py;
  held.up = held.down = held.left = held.right = false;
}

// ------------------------------------------------------------------ UI: diálogo, escolhas, cartões, fade
const dlg = $('dialog'), whoEl = $('who'), textEl = $('text'), choicesEl = $('choices'), nextEl = $('next');

function waitA() { return new Promise((res) => { inputWait = res; }); }
function pressA() {
  if (inputWait) { const r = inputWait; inputWait = null; r(); return; }
  if (choiceState) { choiceState.confirm(choiceState.i); return; }
  if (S.mode === 'play') interact();
}

function typeText(text) {
  return new Promise((res) => {
    let i = 0;
    const id = setInterval(() => {
      i += 1; textEl.textContent = text.slice(0, i);
      if (i >= text.length) { clearInterval(id); inputWait = null; res(); }
    }, 20);
    inputWait = () => { clearInterval(id); textEl.textContent = text; inputWait = null; res(); };
  });
}

async function say(who, ...texts) {
  for (const t of texts) {
    dlg.hidden = false; choicesEl.hidden = true; choicesEl.innerHTML = '';
    whoEl.textContent = who; whoEl.hidden = !who; nextEl.hidden = true; textEl.textContent = '';
    await typeText(t);
    nextEl.hidden = false;
    await waitA();
    dlg.hidden = true;
  }
}

function choose(prompt, options) {
  return new Promise((res) => {
    dlg.hidden = false; whoEl.hidden = true; nextEl.hidden = true;
    textEl.textContent = prompt; choicesEl.hidden = false; choicesEl.innerHTML = '';
    const st = {
      i: 0,
      confirm(i) { choiceState = null; choicesEl.hidden = true; dlg.hidden = true; res(i); },
    };
    const btns = options.map((label, i) => {
      const b = document.createElement('div');
      b.className = 'choice'; b.textContent = label;
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); st.confirm(i); });
      choicesEl.appendChild(b);
      return b;
    });
    const mark = () => btns.forEach((b, i) => b.classList.toggle('on', i === st.i));
    st.move = (d) => { st.i = (st.i + d + btns.length) % btns.length; mark(); };
    mark();
    choiceState = st;
  });
}

const overlay = $('overlay');
function showOverlay(html) { overlay.innerHTML = html; overlay.hidden = false; }
function hideOverlay() { overlay.hidden = true; overlay.innerHTML = ''; }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function card({ kicker, title, text }) {
  showOverlay(`<div class="card"><div class="kicker">${esc(kicker || '')}</div><h2>${esc(title || '')}</h2>
    <p>${esc(text || '').replace(/\n/g, '<br>')}</p><div class="cta">Continuar ▶</div></div>`);
  overlay.dataset.mode = 'card';
  await waitA();
  hideOverlay();
}

const fadeEl = $('fade');
async function fade(toBlack, instant = false) {
  fadeEl.style.transition = instant ? 'none' : '';
  fadeEl.style.opacity = toBlack ? '1' : '0';
  if (!instant) await sleep(340);
}

function toast(msg) {
  const el = $('toast');
  el.textContent = msg; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 2200);
}

function hud() {
  $('obj').textContent = S.objective ? '▸ ' + S.objective : '';
  const s = S.stats;
  $('stats').textContent = `✝ ${s.fe}  ♥ ${s.caridade}  ☺ ${s.alegria}`;
}

// ------------------------------------------------------------------ API para os capítulos
const G = {
  say, choose, card, fade,
  get flags() { return S.flags; },
  get stats() { return S.stats; },
  setObjective(t) { S.objective = t; hud(); },
  addStat(k, n = 1) { S.stats[k] += n; hud(); },
  npc(id) { for (const m of Object.values(S.maps)) { const n = m.npcs.find((x) => x.id === id); if (n) return n; } return null; },
  startFollow(npc) {
    S.dog.on = true; S.dog.x = npc.px; S.dog.y = npc.py; S.dog.dir = 'right';
    npc.hidden = true;
  },
  stopFollow() { S.dog.on = false; },
  async finishChapter() {
    const ch = S.chapter;
    const save = loadSave();
    if (!save.done.includes(ch.id)) save.done.push(ch.id);
    writeSave(save);
    S.mode = 'busy';
    await fade(true);
    $('hud').hidden = true;
    await ch.outro(G);
    S.mode = 'title';
    showTitle();
    await fade(false);
  },
};

// ------------------------------------------------------------------ interação
async function runScript(fn) {
  if (S.mode !== 'play') return;
  S.mode = 'busy';
  try { await fn(); } finally { if (S.mode === 'busy') S.mode = 'play'; }
}

const VEC = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

function interact() {
  const [vx, vy] = VEC[S.dir];
  const reach = vx ? [20, 30] : [24, 34];
  for (const d of reach) {
    const tx = tileOf(S.px + vx * d), ty = tileOf(S.py - 6 + vy * d);
    const n = npcAtTile(tx, ty);
    if (n) {
      n.dir = OPP[S.dir];
      runScript(() => n.talk(G, n));
      return;
    }
    const it = S.map.interacts.find((i) => tx >= i.x && tx < i.x + i.w && ty >= i.y && ty < i.y + i.h);
    if (it) { runScript(() => it.run(G)); return; }
  }
}

async function doWarp(w) {
  S.mode = 'busy';
  await fade(true);
  setMap(w.to, w.tx, w.ty, w.dir);
  await fade(false);
  try { if (w.after) await w.after(G); } finally { S.mode = 'play'; }
}

let lastWarpMsg = null;
function checkWarp() {
  const tx = tileOf(S.px), ty = tileOf(S.py - 2);
  const w = S.map.warps.find((q) => q.x === tx && q.y === ty);
  if (!w) { lastWarpMsg = null; return; }
  const msg = w.guard && w.guard(G);
  if (msg) {
    const key = `${S.map.id}:${tx},${ty}`;
    if (lastWarpMsg !== key) { lastWarpMsg = key; toast(msg); }
    return;
  }
  doWarp(w);
}

// ------------------------------------------------------------------ atualização
function update(dt) {
  S.time += dt;
  for (const n of S.map?.npcs || []) n.t += dt;
  if (S.mode !== 'play') { S.moving = false; return; }

  let dx = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  let dy = (held.down ? 1 : 0) - (held.up ? 1 : 0);
  S.moving = !!(dx || dy);
  if (S.moving) {
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    S.dir = Math.abs(dx) >= Math.abs(dy) && dx ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const nx = S.px + dx * SPEED * dt, ny = S.py + dy * SPEED * dt;
    let moved = false;
    if (canStand(nx, S.py)) { S.px = nx; moved = true; }
    if (canStand(S.px, ny)) { S.py = ny; moved = true; }
    S.walkT += dt * 11;
    if (!moved) S.walkT = 0;
    checkWarp();
  } else {
    S.walkT = 0;
  }
  updateDog(dt);
}

function updateDog(dt) {
  const d = S.dog;
  if (!d.on) return;
  const ddx = S.px - d.x, ddy = S.py - d.y, dist = Math.hypot(ddx, ddy);
  d.moving = false;
  if (dist > 130) { d.x = S.px; d.y = S.py; return; }
  if (dist > 26) {
    const step = Math.min(100 * dt, dist - 24), sx = (ddx / dist) * step, sy = (ddy / dist) * step;
    if (!blockedTile(tileOf(d.x + sx), tileOf(d.y - 2), false)) d.x += sx;
    if (!blockedTile(tileOf(d.x), tileOf(d.y + sy - 2), false)) d.y += sy;
    if (Math.abs(sx) > 0.01) d.dir = sx > 0 ? 'right' : 'left';
    d.moving = true; d.t += dt;
  }
}

// ------------------------------------------------------------------ desenho
function render() {
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#10131f'; ctx.fillRect(0, 0, W, H);
  const m = S.map;
  if (!m) return;
  const mw = m.w * T, mh = m.h * T;
  let cx = mw <= W ? (mw - W) / 2 : Math.max(0, Math.min(S.px - W / 2, mw - W));
  let cy = mh <= H ? (mh - H) / 2 : Math.max(0, Math.min(S.py - 26 - H / 2, mh - H));
  cx = Math.round(cx); cy = Math.round(cy);

  ctx.save();
  ctx.translate(-cx, -cy);
  ctx.drawImage(m.cache, 0, 0);

  const items = [];
  for (const o of m.objects) items.push({ z: (o.type === 'rug' || o.type === 'window' || o.type === 'cwindow' || o.type === 'cross') ? -1e6 + o.y : (o.y + o.h) * T, draw: () => drawObject(ctx, o, S.time) });
  for (const n of m.npcs) {
    if (n.hidden) continue;
    items.push({
      z: n.py,
      draw: () => (n.kind === 'dog'
        ? drawDog(ctx, n.px, n.py, n.dir, n.t, !!n.sit, false)
        : drawPerson(ctx, n.px, n.py, n.dir, 0, STYLES[n.style], n.sc || 1)),
    });
  }
  items.push({ z: S.py, draw: () => drawPerson(ctx, S.px, S.py, S.dir, S.moving ? S.walkT : 0, STYLES.carlo, 0.85) });
  if (S.dog.on) items.push({ z: S.dog.y, draw: () => drawDog(ctx, S.dog.x, S.dog.y, S.dog.dir, S.dog.t, false, S.dog.moving) });
  items.sort((a, b) => a.z - b.z);
  for (const it of items) it.draw();
  ctx.restore();
}

let last = performance.now();
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000); last = ts;
  update(dt); render();
  requestAnimationFrame(frame);
}

// ------------------------------------------------------------------ telas
function showTitle() {
  hideOverlay();
  $('hud').hidden = true; dlg.hidden = true;
  const save = loadSave();
  showOverlay(`<div class="title">
      <div class="cross">✝</div>
      <h1>A Caminhada<br>de Carlo</h1>
      <p class="sub">A vida de Carlo Acutis, de Londres e Milão até Assis</p>
      <div class="menu">
        <div class="btn" data-act="new">${save.done.length ? 'Jogar capítulo 1 de novo' : 'Novo jogo'}</div>
        <div class="btn alt" data-act="chapters">Capítulos</div>
      </div></div>`);
  overlay.dataset.mode = 'title';
}

function showChapters() {
  const save = loadSave();
  const rows = CHAPTERS.map((c) => `<div class="chap ${c.ready ? 'ready' : 'locked'}" data-chap="${c.id}">
      <b>${c.id}</b><span><i>${esc(c.title)}</i><small>${esc(c.years)} · ${esc(c.place)}</small></span>
      <em>${save.done.includes(c.id) ? '✔' : c.ready ? '▶' : 'em breve'}</em></div>`).join('');
  showOverlay(`<div class="chapters"><h2>Capítulos</h2>${rows}<div class="btn alt" data-act="back">Voltar</div></div>`);
  overlay.dataset.mode = 'chapters';
}

overlay.addEventListener('pointerdown', (e) => {
  const mode = overlay.dataset.mode;
  if (mode === 'card') { e.preventDefault(); pressA(); return; }
  const act = e.target.closest('[data-act]')?.dataset.act;
  const chap = e.target.closest('[data-chap]');
  if (act === 'new') startChapter(1);
  else if (act === 'chapters') showChapters();
  else if (act === 'back') showTitle();
  else if (chap && chap.classList.contains('ready')) startChapter(Number(chap.dataset.chap));
});

async function startChapter(id) {
  const ch = SCRIPTS[id];
  if (!ch || S.mode === 'play' || S.mode === 'busy') return;
  S.mode = 'busy';
  hideOverlay();
  S.chapter = ch;
  S.flags = {}; S.stats = { fe: 0, caridade: 0, alegria: 0 };
  S.dog = { on: false, x: 0, y: 0, dir: 'right', t: 0, moving: false };
  S.maps = ch.maps(G);
  Object.values(S.maps).forEach(prepMap);
  setMap(ch.start.map, ch.start.x, ch.start.y, ch.start.dir);
  S.objective = ch.objective; hud();
  await fade(true, true);
  await ch.intro(G);
  $('hud').hidden = false;
  await fade(false);
  S.mode = 'play';
}

// ------------------------------------------------------------------ entrada (teclado e toque)
const KEYMAP = {
  ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
};
const ACTION_KEYS = new Set(['z', 'Z', 'Enter', ' ', 'e', 'E']);

window.addEventListener('keydown', (e) => {
  if (e.repeat && ACTION_KEYS.has(e.key)) return;
  const dir = KEYMAP[e.key];
  if (choiceState && (dir === 'up' || dir === 'down')) { e.preventDefault(); choiceState.move(dir === 'down' ? 1 : -1); return; }
  if (dir) { held[dir] = true; e.preventDefault(); return; }
  if (ACTION_KEYS.has(e.key)) { e.preventDefault(); pressA(); }
});
window.addEventListener('keyup', (e) => { const d = KEYMAP[e.key]; if (d) held[d] = false; });
window.addEventListener('blur', () => { held.up = held.down = held.left = held.right = false; });

document.querySelectorAll('#pad [data-d]').forEach((b) => {
  const d = b.dataset.d;
  const on = (e) => { e.preventDefault(); held[d] = true; b.classList.add('on'); b.setPointerCapture?.(e.pointerId); };
  const off = (e) => { e.preventDefault(); held[d] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on);
  b.addEventListener('pointerup', off);
  b.addEventListener('pointercancel', off);
  b.addEventListener('lostpointercapture', off);
});
$('btnA').addEventListener('pointerdown', (e) => { e.preventDefault(); pressA(); });
dlg.addEventListener('pointerdown', (e) => { if (!choiceState) { e.preventDefault(); pressA(); } });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// ------------------------------------------------------------------ início
showTitle();
fadeEl.style.opacity = '0';
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
