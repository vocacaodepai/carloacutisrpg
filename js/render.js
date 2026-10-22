// Desenho procedural em pixel art: chão, objetos, pessoas e cachorro.
// Nenhuma imagem externa: tudo é desenhado com retângulos, então o jogo roda offline e leve.

export const T = 32; // tamanho do tile em pixels

export const BLOCKED_GROUND = new Set(['wallint', 'wallbot', 'wallside', 'cwall']);

const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};

const R = (c, col, x, y, w, h) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
};
const tri = (c, col, x1, y1, x2, y2, x3, y3) => {
  c.fillStyle = col;
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill();
};
const circ = (c, col, x, y, r) => {
  c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
};
const arch = (c, col, x, y, w, h) => { // janela/porta em arco; (x,y) = canto superior esquerdo
  c.fillStyle = col; c.beginPath();
  c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0);
  c.lineTo(x + w, y + h); c.closePath(); c.fill();
};

function speckle(c, tx, ty, x, y, cols, n, s = 3) {
  for (let i = 0; i < n; i++) {
    R(c, cols[(hash(tx, ty, i + 99) * cols.length) | 0],
      x + ((hash(tx, ty, i) * (T - s)) | 0), y + ((hash(tx, ty, i + 50) * (T - s)) | 0), s, s);
  }
}

// ---------------------------------------------------------------- chão
export function drawTile(c, k, tx, ty) {
  const x = tx * T, y = ty * T;
  switch (k) {
    case 'grass':
      R(c, '#5aa845', x, y, T, T);
      speckle(c, tx, ty, x, y, ['#6cbb55', '#4a9438', '#7acb62'], 7);
      break;
    case 'road': case 'roadA': case 'roadB': case 'roadL': case 'roadR':
      R(c, '#4b4e5a', x, y, T, T);
      speckle(c, tx, ty, x, y, ['#555866', '#424450'], 5, 2);
      if (k === 'roadA' && tx % 2 === 0) R(c, '#e8d878', x + 4, y + T - 4, 24, 4);
      if (k === 'roadB' && tx % 2 === 0) R(c, '#e8d878', x + 4, y, 24, 4);
      if (k === 'roadL' && ty % 2 === 0) R(c, '#e8d878', x + T - 4, y + 4, 4, 24);
      if (k === 'roadR' && ty % 2 === 0) R(c, '#e8d878', x, y + 4, 4, 24);
      break;
    case 'walk':
      R(c, '#cfc9ba', x, y, T, T);
      R(c, '#b9b3a3', x + T - 1, y, 1, T); R(c, '#b9b3a3', x, y + T - 1, T, 1);
      speckle(c, tx, ty, x, y, ['#c0baab', '#d8d2c4'], 3, 2);
      break;
    case 'cobble':
      R(c, '#b8a07f', x, y, T, T);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
        const ox = (j % 2) * 4;
        R(c, hash(tx * 4 + i, ty * 4 + j) > .5 ? '#c4ad8c' : '#ad9473', x + i * 8 + ox - (ox ? 0 : 0), y + j * 8, 7, 7);
      }
      break;
    case 'wood':
      R(c, '#b57f48', x, y, T, T);
      R(c, '#9a6b3a', x, y + 10, T, 1); R(c, '#9a6b3a', x, y + 21, T, 1);
      R(c, '#9a6b3a', x + (ty % 2 ? 8 : 22), y, 1, 10);
      R(c, '#9a6b3a', x + (ty % 2 ? 24 : 12), y + 11, 1, 10);
      R(c, '#9a6b3a', x + (ty % 2 ? 14 : 4), y + 22, 1, 10);
      break;
    case 'mat':
      drawTile(c, 'wood', tx, ty);
      R(c, '#5a3a2a', x + 4, y + 8, 24, 16); R(c, '#7a5238', x + 6, y + 10, 20, 12);
      break;
    case 'aisle': // tapete vermelho: tiles 5 e 6 da igreja (borda dourada nas laterais externas)
      R(c, '#8e2b33', x, y, T, T);
      if (tx % 2 === 1) R(c, '#c9a24a', x, y, 3, T); else R(c, '#c9a24a', x + T - 3, y, 3, T);
      break;
    case 'marble':
      R(c, (tx + ty) & 1 ? '#e7e1d1' : '#d3ccb9', x, y, T, T);
      R(c, 'rgba(0,0,0,.05)', x, y + T - 1, T, 1);
      break;
    case 'wallint':
      R(c, '#ecdcb8', x, y, T, 22); R(c, '#c9b48a', x, y + 18, T, 4); R(c, '#7d5a3c', x, y + 22, T, 10);
      break;
    case 'wallbot':
      R(c, '#6b4f36', x, y, T, T); R(c, '#85654a', x, y, T, 6);
      break;
    case 'wallside':
      R(c, '#6b4f36', x, y, T, T); R(c, '#85654a', x, y, 5, T);
      break;
    case 'cwall':
      R(c, '#a79d8b', x, y, T, T);
      R(c, '#8c8372', x, y + 15, T, 2); R(c, '#8c8372', x, y + T - 1, T, 1);
      R(c, '#8c8372', x + (ty % 2 ? 10 : 22), y, 2, 15); R(c, '#8c8372', x + (ty % 2 ? 24 : 8), y + 17, 2, 15);
      break;
    default:
      R(c, '#f0f', x, y, T, T);
  }
}

// ---------------------------------------------------------------- objetos
const shadow = (c, x, y, w) => R(c, 'rgba(0,0,0,.18)', x + 4, y, w, 6);

function house(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T, roofH = 44;
  shadow(c, x, y + h - 2, w);
  R(c, o.wall || '#e9d8a6', x, y + roofH - 6, w, h - roofH + 6);
  R(c, 'rgba(0,0,0,.08)', x, y + h - 6, w, 6);
  R(c, o.roof || '#b5533c', x - 4, y, w + 8, roofH);
  for (let i = 8; i < roofH; i += 8) R(c, 'rgba(0,0,0,.14)', x - 4, y + i, w + 8, 2);
  R(c, 'rgba(255,255,255,.2)', x - 4, y, w + 8, 3);
  R(c, 'rgba(0,0,0,.25)', x, y + roofH - 6, w, 6);
  for (let j = 2; j <= o.h - 2; j++) {
    for (let i = 0; i < o.w; i++) {
      if (i % 2 !== 0 || i === o.door) continue;
      const wx = x + i * T + 6, wy = y + j * T + 6;
      R(c, '#fff', wx - 2, wy - 2, 24, 26); R(c, '#8fc6e6', wx, wy, 20, 22);
      R(c, '#fff', wx + 9, wy, 2, 22); R(c, '#fff', wx, wy + 10, 20, 2);
      R(c, 'rgba(255,255,255,.35)', wx + 2, wy + 2, 6, 8);
      R(c, '#b9a77c', wx - 3, wy + 24, 26, 3);
    }
  }
  if (o.door != null) {
    const dx = x + o.door * T, dy = y + (o.h - 1) * T;
    R(c, '#4a2f20', dx + 3, dy + 1, 26, 31); R(c, '#7a5232', dx + 6, dy + 4, 20, 28);
    R(c, '#5e3e26', dx + 15, dy + 4, 2, 28); R(c, '#e8c84a', dx + 21, dy + 18, 3, 3);
    R(c, '#b8b0a0', dx + 1, dy + 30, 30, 2);
  }
  if (o.label) {
    const cx = x + w / 2, tw = o.label.length * 6 + 10, py = y + roofH + 2;
    R(c, '#2b3a55', cx - tw / 2, py, tw, 12); R(c, '#e8e0c8', cx - tw / 2 + 1, py + 1, tw - 2, 10);
    c.fillStyle = '#2b3a55'; c.font = 'bold 8px monospace'; c.textAlign = 'center'; c.fillText(o.label, cx, py + 9);
  }
  if (o.flag) {
    R(c, '#777', x + w - 14, y - 26, 2, 32); R(c, '#2e8b3a', x + w - 12, y - 26, 5, 8);
    R(c, '#f4f4f4', x + w - 7, y - 26, 5, 8); R(c, '#d33', x + w - 2, y - 26, 5, 8);
  }
}

function church(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T, b = y + h;
  shadow(c, x, b - 2, w);
  R(c, '#dccfb0', x, y + 40, w, h - 40);
  for (let j = 60; j < h; j += 16) R(c, 'rgba(0,0,0,.07)', x, y + j, w, 2);
  // campanário (colunas 0-1)
  R(c, '#cdbf9d', x, y - 20, 2 * T, h + 20);
  R(c, 'rgba(0,0,0,.1)', x + 2 * T - 4, y - 20, 4, h + 20);
  for (let j = 0; j < h + 20; j += 16) R(c, 'rgba(0,0,0,.07)', x, y - 20 + j, 2 * T, 2);
  tri(c, '#7a4a3a', x - 4, y - 20, x + T, y - 62, x + 2 * T + 4, y - 20);
  R(c, '#e8c84a', x + T - 1, y - 86, 3, 26); R(c, '#e8c84a', x + T - 7, y - 78, 15, 3);
  arch(c, '#3a2f2a', x + T - 8, y - 2, 16, 30);
  R(c, '#5a4a3e', x + T - 8, y + 6, 16, 2);
  // nave
  tri(c, '#8a5a44', x + 2 * T - 4, y + 44, x + 5 * T, y - 10, x + w + 4, y + 44);
  tri(c, '#9b6a52', x + 2 * T + 8, y + 40, x + 5 * T, y + 2, x + w - 8, y + 40);
  R(c, '#e8c84a', x + 5 * T - 1, y - 30, 3, 22); R(c, '#e8c84a', x + 5 * T - 6, y - 24, 13, 3);
  // rosácea
  const rx = x + 5 * T, ry = y + 70;
  circ(c, '#a99b7a', rx, ry, 18); circ(c, '#2e4a7a', rx, ry, 15);
  const cols = ['#d94f4f', '#e8c84a', '#4f8fd9', '#e8c84a'];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    c.fillStyle = cols[i % 4]; c.beginPath(); c.moveTo(rx, ry);
    c.arc(rx, ry, 13, a, a + Math.PI / 4 - 0.12); c.closePath(); c.fill();
  }
  circ(c, '#f4efe0', rx, ry, 3);
  // janelas laterais
  for (const wx of [x + 2.5 * T, x + 7 * T]) {
    arch(c, '#a99b7a', wx - 2, b - 96, 24, 62); arch(c, '#4a73a8', wx, b - 94, 20, 58);
    R(c, '#a99b7a', wx + 9, b - 94, 2, 58);
  }
  // portal
  const dx = x + o.door * T, left = dx - T / 2;
  R(c, '#bfb08c', left, b - 86 + 20, 2 * T, 66); arch(c, '#bfb08c', left, b - 86, 2 * T, 86);
  arch(c, '#4a2f20', dx + 1, b - 62, 30, 62); arch(c, '#6a4630', dx + 5, b - 56, 22, 56);
  R(c, '#4a2f20', dx + 15, b - 40, 2, 40); R(c, '#e8c84a', dx + 12, b - 20, 3, 3); R(c, '#e8c84a', dx + 18, b - 20, 3, 3);
  R(c, '#b8b0a0', dx - 8, b - 4, 48, 4);
}

function tree(c, o, t) {
  const x = o.x * T, y = o.y * T, sw = Math.sin(t * 1.2 + o.x) * 0.6;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 16, y + 30, 14, 4, 0, 0, 7); c.fill();
  R(c, '#6b4a2c', x + 12, y + 12, 8, 20); R(c, '#55391f', x + 12, y + 12, 3, 20);
  circ(c, '#3d8f3a', x + 16 + sw, y - 4, 18); circ(c, '#4aa645', x + 8 + sw, y + 2, 13);
  circ(c, '#4aa645', x + 25 + sw, y + 2, 13); circ(c, '#5ec058', x + 14 + sw, y - 10, 9);
}

function bush(c, o) {
  const x = o.x * T, y = o.y * T;
  c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(x + 16, y + 29, 13, 4, 0, 0, 7); c.fill();
  circ(c, '#3d8f3a', x + 16, y + 18, 11); circ(c, '#4aa645', x + 9, y + 21, 8); circ(c, '#4aa645', x + 23, y + 21, 8);
}

function lamp(c, o) {
  const x = o.x * T, y = o.y * T;
  R(c, '#2e3340', x + 14, y - 22, 4, 52); R(c, '#2e3340', x + 10, y + 26, 12, 4);
  R(c, '#2e3340', x + 9, y - 28, 14, 8); R(c, '#ffe9a0', x + 11, y - 26, 10, 5);
}

function sign(c, o) {
  const x = o.x * T, y = o.y * T;
  R(c, '#5e3e26', x + 14, y + 8, 4, 22);
  R(c, '#7a5232', x + 4, y - 4, 24, 16); R(c, '#e8dcb0', x + 6, y - 2, 20, 12);
  R(c, '#9a8858', x + 9, y + 1, 14, 2); R(c, '#9a8858', x + 9, y + 5, 10, 2);
}

function bench(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T;
  R(c, '#4a3320', x + 3, y + 22, 4, 8); R(c, '#4a3320', x + w - 7, y + 22, 4, 8);
  R(c, '#9a6b3a', x, y + 12, w, 10); R(c, '#b9824a', x, y + 12, w, 3);
  R(c, '#8a5c30', x, y + 2, w, 8); R(c, '#a8723c', x, y + 2, w, 2);
}

function fountain(c, o, t) {
  const x = o.x * T, y = o.y * T, cx = x + T, cy = y + T + 4;
  c.fillStyle = 'rgba(0,0,0,.18)'; c.beginPath(); c.ellipse(cx, cy + 8, 30, 12, 0, 0, 7); c.fill();
  c.fillStyle = '#9aa0a8'; c.beginPath(); c.ellipse(cx, cy, 30, 22, 0, 0, 7); c.fill();
  c.fillStyle = '#6fb5e0'; c.beginPath(); c.ellipse(cx, cy, 25, 17, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
  for (let i = 0; i < 2; i++) {
    const r = ((t * 12 + i * 10) % 20);
    c.beginPath(); c.ellipse(cx, cy, 5 + r, 3 + r * .6, 0, 0, 7); c.stroke();
  }
  R(c, '#b9bec6', cx - 4, cy - 16, 8, 14); R(c, '#cfe9f7', cx - 2, cy - 22, 4, 8);
  circ(c, '#cfe9f7', cx, cy - 24, 3);
}

// ---- interiores
function sofa(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T;
  R(c, '#7b4040', x, y - 4, w, 36); R(c, '#8a4a4a', x, y - 6, w, 16);
  R(c, '#a85a5a', x + 7, y + 10, w - 14, 20); R(c, '#8f4747', x + w / 2 - 1, y + 10, 2, 20);
  R(c, '#6d3a3a', x, y + 4, 8, 28); R(c, '#6d3a3a', x + w - 8, y + 4, 8, 28);
}
function table(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T;
  R(c, '#8a5c30', x + 4, y + 18, 5, h - 20); R(c, '#8a5c30', x + w - 9, y + 18, 5, h - 20);
  R(c, '#c58f55', x + 2, y + 6, w - 4, h - 14); R(c, '#f3e9d0', x + 8, y + 12, w - 16, h - 26);
  R(c, '#fff', x + 14, y + 16, 8, 6); R(c, '#c0392b', x + 15, y + 17, 6, 2);
}
function rug(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T, h = o.h * T;
  R(c, '#b84a4a', x + 2, y + 2, w - 4, h - 4);
  R(c, '#f0d7a0', x + 8, y + 8, w - 16, 2); R(c, '#f0d7a0', x + 8, y + h - 10, w - 16, 2);
  R(c, '#f0d7a0', x + 8, y + 8, 2, h - 16); R(c, '#f0d7a0', x + w - 10, y + 8, 2, h - 16);
  R(c, '#a03c3c', x + 14, y + 14, w - 28, h - 28);
}
function shelf(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T;
  R(c, '#6b4a2c', x, y - 20, w, 52);
  const cols = ['#c0392b', '#2e86c1', '#27ae60', '#f1c40f', '#8e44ad', '#e67e22'];
  for (let r = 0; r < 3; r++) {
    R(c, '#4a3320', x + 2, y - 16 + r * 17 + 13, w - 4, 3);
    for (let i = 0; i < Math.floor((w - 6) / 5); i++)
      R(c, cols[(i + r * 2) % cols.length], x + 3 + i * 5, y - 15 + r * 17 + (i % 3), 4, 12 - (i % 3));
  }
}
function counter(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T;
  R(c, '#d9d2c2', x, y - 6, w, 38); R(c, '#a89c84', x, y + 16, w, 16); R(c, '#8a7e68', x, y + 16, w, 2);
  for (let i = 0; i < o.w; i++) R(c, '#8a7e68', x + i * T + 15, y + 18, 2, 14);
  R(c, '#b8c4cc', x + 8, y - 2, 26, 14); R(c, '#8fa0aa', x + 11, y + 1, 20, 8);
  R(c, '#444', x + w - 40, y - 2, 30, 14); circ(c, '#222', x + w - 31, y + 5, 4); circ(c, '#222', x + w - 19, y + 5, 4);
}
function window_(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T;
  R(c, '#fff', x + 8, y + 1, w - 16, 21); R(c, '#8fc6e6', x + 10, y + 3, w - 20, 17);
  R(c, '#fff', x + w / 2 - 1, y + 3, 2, 17);
  R(c, '#d97a7a', x + 6, y, 6, 22); R(c, '#d97a7a', x + w - 12, y, 6, 22);
}
function computer(c, o) {
  const x = o.x * T, y = o.y * T;
  R(c, '#8a6a44', x + 2, y + 10, 28, 22); R(c, '#6b4f30', x + 2, y + 10, 28, 3);
  R(c, '#d8d0b8', x + 6, y - 10, 20, 18); R(c, '#1d3a2a', x + 9, y - 7, 14, 11);
  R(c, '#5fd08a', x + 10, y - 5, 8, 1); R(c, '#5fd08a', x + 10, y - 2, 11, 1); R(c, '#5fd08a', x + 10, y + 1, 6, 1);
  R(c, '#c9c1a8', x + 8, y + 16, 16, 5);
}
function plant(c, o) {
  const x = o.x * T, y = o.y * T;
  R(c, '#a0522d', x + 9, y + 20, 14, 12); R(c, '#8a4524', x + 9, y + 20, 14, 3);
  circ(c, '#2f8f46', x + 16, y + 10, 9); circ(c, '#3fae5a', x + 10, y + 14, 6); circ(c, '#3fae5a', x + 22, y + 14, 6);
}
function pew(c, o) {
  const x = o.x * T, y = o.y * T, w = o.w * T;
  R(c, '#6a3f20', x + 3, y + 24, 4, 8); R(c, '#6a3f20', x + w - 7, y + 24, 4, 8);
  R(c, '#7a4a2a', x + 2, y + 12, w - 4, 14); R(c, '#9a6238', x + 2, y + 12, w - 4, 3);
  R(c, '#8a5a34', x + 2, y - 2, w - 4, 12); R(c, '#a8703f', x + 2, y - 2, w - 4, 2);
}
function altar(c, o, t) {
  const x = o.x * T, y = o.y * T, w = o.w * T, cx = x + w / 2;
  R(c, '#efe9d8', x, y + 8, w, 24); R(c, '#c9a24a', x, y + 8, w, 3); R(c, '#c9a24a', x, y + 28, w, 3);
  for (const px of [x + 10, x + w - 15]) {
    R(c, '#f4efe0', px, y - 12, 5, 20);
    circ(c, '#ffd54a', px + 2.5, y - 16 + Math.sin(t * 9 + px) * .8, 3.2);
  }
  R(c, '#c9a24a', cx - 13, y - 14, 26, 24); R(c, '#a8832e', cx - 13, y - 14, 26, 3);
  R(c, '#e8d48a', cx - 9, y - 9, 18, 15); R(c, '#c9a24a', cx - 1, y - 7, 2, 11); R(c, '#c9a24a', cx - 4, y - 4, 8, 2);
}
function cross(c, o) {
  const x = o.x * T, y = o.y * T, cx = x + o.w * T / 2;
  R(c, '#6b4a2c', cx - 3, y, 6, 30); R(c, '#6b4a2c', cx - 12, y + 7, 24, 5);
  R(c, '#c9a24a', cx - 1, y, 2, 30); R(c, '#c9a24a', cx - 12, y + 9, 24, 1);
}
function cwindow(c, o) {
  const x = o.x * T, y = o.y * T;
  arch(c, '#cfc6b2', x + 5, y - 4, 22, 32); arch(c, '#2a3f6b', x + 8, y - 1, 16, 28);
  R(c, '#d94f4f', x + 9, y + 10, 6, 8); R(c, '#e8c84a', x + 17, y + 10, 6, 8);
  R(c, '#4f8fd9', x + 9, y + 19, 6, 7); R(c, '#4fb97a', x + 17, y + 19, 6, 7);
}
function candles(c, o, t) {
  const x = o.x * T, y = o.y * T;
  R(c, '#6b4a2c', x + 14, y + 14, 4, 16); R(c, '#6b4a2c', x + 6, y + 28, 20, 4);
  R(c, '#8a6a44', x + 4, y + 10, 24, 5);
  for (let i = 0; i < 4; i++) {
    R(c, '#f4efe0', x + 6 + i * 6, y + 2, 3, 9);
    circ(c, '#ffd54a', x + 7.5 + i * 6, y + Math.sin(t * 8 + i) * .6, 2);
  }
}

const OBJ = {
  house, church, tree, bush, lamp, sign, bench, fountain, sofa, table, rug, shelf, counter,
  window: window_, computer, plant, pew, altar, cross, cwindow, candles,
};

export function drawObject(c, o, t) {
  const fn = OBJ[o.type];
  if (fn) fn(c, o, t);
}

// ---------------------------------------------------------------- gente
export const STYLES = {
  carlo:  { skin: '#f1c9a0', hair: '#4a3220', hs: 'tuft', top: '#3b6fb6', stripe: '#e8e8e8', bottom: '#35508a', shoes: '#f0f0f0' },
  mae:    { skin: '#f1c9a0', hair: '#2a1a14', hs: 'long', top: '#c05a7a', bottom: '#3a3a4a', shoes: '#2a2a2a' },
  pai:    { skin: '#efc29a', hair: '#3a2a22', hs: 'short', top: '#5a6a7a', collar: '#e8e8e8', bottom: '#2a2a2a', shoes: '#1a1a1a' },
  padre:  { skin: '#efc29a', hair: '#cfcfcf', hs: 'short', top: '#262626', collar: '#f4f4f4', bottom: '#262626', shoes: '#111', robe: true },
  velha:  { skin: '#f1c9a0', hair: '#d5d5d5', hs: 'bun', top: '#7a5a8a', bottom: '#4a3a52', shoes: '#3a2a2a' },
  giulia: { skin: '#f1c9a0', hair: '#8a5a32', hs: 'bun', top: '#f1c40f', bottom: '#2e7d6b', shoes: '#c0392b' },
};

export function drawPerson(c, x, y, dir, walk, st, sc = 1) {
  const u = 2 * sc, side = dir === 'left' || dir === 'right', fl = dir === 'left' ? -1 : 1;
  const sw = walk ? Math.sin(walk) : 0;
  const bob = walk ? -Math.abs(Math.cos(walk)) * 0.5 : 0;
  const P = (col, ox, oy, w, h) => R(c, col, x + ox * u, y + oy * u, w * u, h * u);
  const PF = (col, ox, oy, w, h) => P(col, fl > 0 ? ox : -(ox + w), oy, w, h);

  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x, y - 1, 6 * u, 2 * u, 0, 0, 7); c.fill();

  // pernas
  if (!side) {
    const ll = -Math.max(0, sw) * 1.4, rl = -Math.max(0, -sw) * 1.4;
    P(st.bottom, -3.6, -5 + ll, 3.2, 5); P(st.shoes, -3.8, -1.4 + ll, 3.6, 1.6);
    P(st.bottom, 0.4, -5 + rl, 3.2, 5); P(st.shoes, 0.2, -1.4 + rl, 3.6, 1.6);
  } else {
    const a = sw * 2;
    PF(st.bottom, -2 - a, -5, 3.4, 5); PF(st.shoes, -2.2 - a, -1.4, 4.4, 1.6);
    PF(st.bottom, -1.4 + a, -5, 3.4, 5); PF(st.shoes, -1.0 + a, -1.4, 4.4, 1.6);
  }
  if (st.robe) P(st.top, -4.4, -6 + bob, 8.8, 5.8);

  // tronco e braços
  P(st.top, -4, -13 + bob, 8, 8.4);
  if (st.stripe) P(st.stripe, -4, -9.6 + bob, 8, 1.2);
  if (st.collar && dir !== 'up') P(st.collar, -1.5, -13 + bob, 3, 1.6);
  if (!side) {
    P(st.top, -5.9, -12.6 + bob + sw * 0.9, 2, 6); P(st.skin, -5.9, -6.8 + bob + sw * 0.9, 2, 1.6);
    P(st.top, 3.9, -12.6 + bob - sw * 0.9, 2, 6); P(st.skin, 3.9, -6.8 + bob - sw * 0.9, 2, 1.6);
  } else {
    PF(st.top, -1.2 + sw * 1.8, -12.6 + bob, 2.6, 6); PF(st.skin, -1.2 + sw * 1.8, -6.8 + bob, 2.6, 1.6);
  }

  // cabeça
  const hy = -21 + bob, h = st.hair;
  P(st.skin, -4, hy, 8, 8);
  if (dir === 'up') {
    P(h, -4.5, hy - .6, 9, 8.8);
    if (st.hs === 'long') P(h, -4.5, hy + 8, 9, 5);
  } else if (!side) {
    P(h, -4.5, hy - .6, 9, 3.2); P(h, -4.5, hy - .6, 1.4, 6); P(h, 3.1, hy - .6, 1.4, 6);
    if (st.hs === 'long') { P(h, -4.8, hy + 2, 1.8, 10); P(h, 3, hy + 2, 1.8, 10); }
    if (st.hs === 'tuft') P(h, -1, hy - 1.6, 3, 1.6);
  } else {
    PF(h, -4.5, hy - .6, 9, 3.2); PF(h, -4.5, hy - .6, 4.5, 7.5);
    if (st.hs === 'long') PF(h, -5, hy + 2, 3.2, 10);
    if (st.hs === 'tuft') PF(h, 0, hy - 1.6, 3, 1.6);
  }
  if (st.hs === 'bun') P(h, -2, hy - 3, 4, 3.2);
  if (dir === 'down') {
    P('#2a2018', -2.6, hy + 4, 1.3, 1.8); P('#2a2018', 1.3, hy + 4, 1.3, 1.8);
    P('#b4655a', -1, hy + 6.4, 2, .6);
  } else if (side) {
    PF('#2a2018', 1.8, hy + 4, 1.3, 1.8);
  }
}

export function drawDog(c, x, y, dir, t, sit, moving) {
  const u = 2, fl = dir === 'left' ? -1 : 1;
  const P = (col, ox, oy, w, h) => R(c, col, x + (fl > 0 ? ox : -(ox + w)) * u, y + oy * u, w * u, h * u);
  c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(x, y - 1, 7 * u, 2 * u, 0, 0, 7); c.fill();
  const wag = Math.sin(t * 14);
  const body = '#c98a3d', dark = '#8a5a22', white = '#f3e6cf';
  if (sit) {
    P(dark, -7.5, -3 + wag * .4, 2.4, 3);
    P(body, -5, -7, 6, 7); P(white, 0, -6, 2, 5);
    P(body, 0, -12, 5, 5); P(white, 4, -9.4, 2.2, 2.4); P('#222', 5.4, -9.6, 1, 1); P('#222', 2.6, -10.6, 1, 1.2);
    P(dark, 0, -12.6, 1.8, 3);
  } else {
    const a = moving ? Math.sin(t * 16) * 1.2 : 0;
    P(dark, -7, -8 + wag * .6, 2.6, 3.4);
    P(dark, -4.4 + a, -3, 1.8, 3); P(dark, -2 - a, -3, 1.8, 3); P(dark, 1.6 - a, -3, 1.8, 3); P(dark, 3.4 + a, -3, 1.8, 3);
    P(body, -5, -8, 10, 5.2); P(white, 2.6, -6.4, 2.6, 3.6);
    P(body, 3.5, -11, 5, 5); P(white, 7.6, -8.6, 2.2, 2.4); P('#222', 9, -8.8, 1, 1); P('#222', 6, -9.8, 1, 1.2);
    P(dark, 3.5, -11.6, 1.8, 3);
  }
}
