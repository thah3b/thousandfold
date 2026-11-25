// ============================================================
// SPRITES (v1.1) — pixel art and pixel chibi, drawn in code.
// Every sprite is a small pixel grid, outlined automatically,
// rendered once to a PNG data URL and cached by key.
// ============================================================
const PX = { cache: new Map(), out: '#1b1210' };

// ---------- Colour helpers ----------
function pxRgb(h) {
  if (typeof h !== 'string' || h[0] !== '#') return [150, 150, 150, 255];
  let s = h.slice(1); if (s.length === 3) s = s.split('').map(c => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255, s.length >= 8 ? parseInt(s.slice(6, 8), 16) : 255];
}
const pxHex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
function pxTone(h, f) { const [r, g, b] = pxRgb(h); return f < 0 ? pxHex(r * (1 + f), g * (1 + f), b * (1 + f)) : pxHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f); }
function pxMix(a, b, t) { const A = pxRgb(a), B = pxRgb(b); return pxHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
const pxAlpha = (h, a) => pxTone(h, 0) + Math.round(a * 255).toString(16).padStart(2, '0');
function pxHash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function pxRand(seed) { let a = seed >>> 0 || 1; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const pxPal = c => ({ a: c, b: pxTone(c, -0.32), d: pxTone(c, -0.55), c: pxTone(c, 0.38) });

// ---------- Grid ----------
class PxGrid {
  constructor(w, h) { this.w = w; this.h = h; this.p = new Array(w * h).fill(0); }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.p[y * this.w + x]; }
  set(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.p[y * this.w + x] = c || 0; return this; }
  dot(x, y, c) { return c ? this.set(x, y, c) : this; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); return this; }
  // Filled ellipse. pal = {a,b,c} adds soft shading (light top-left, dark bottom-right).
  ell(cx, cy, rx, ry, c, pal, keep) {
    for (let y = Math.floor(cy - ry - 1); y <= cy + ry + 1; y++) for (let x = Math.floor(cx - rx - 1); x <= cx + rx + 1; x++) {
      const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry; if (nx * nx + ny * ny > 1) continue;
      if (keep && !keep(x, y)) continue;
      let col = c; if (pal) col = nx * 0.6 + ny > 0.55 ? pal.b : nx * 0.7 + ny < -0.75 ? pal.c : pal.a;
      this.set(x, y, col);
    }
    return this;
  }
  line(x0, y0, x1, y1, c, t) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); this.set(x, y, c); if (t) this.set(x + 1, y, t === true ? c : t); }
    return this;
  }
  poly(pts, c) {
    let y0 = Infinity, y1 = -Infinity; for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= y1; y++) for (let x = 0; x < this.w; x++) {
      const px = x + 0.5, py = y + 0.5; let ins = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) ins = !ins; }
      if (ins) this.set(x, y, c);
    }
    return this;
  }
  rows(rows, pal, ox, oy) { rows.forEach((r, y) => Array.from(r).forEach((ch, x) => { if (ch !== '.' && ch !== ' ' && pal[ch] !== undefined) this.set((ox || 0) + x, (oy || 0) + y, pal[ch]); })); return this; }
  recolor(from, to) { this.p = this.p.map(v => v === from ? to : v); return this; }
  outline(col) {
    const o = col || PX.out, q = this.p.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.p[y * this.w + x]) continue;
      if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) q[y * this.w + x] = o;
    }
    this.p = q; return this;
  }
  flip() { const q = this.p.slice(); for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) q[y * this.w + x] = this.p[y * this.w + this.w - 1 - x]; this.p = q; return this; }
}

// ---------- Rendering ----------
function pxSvgString(g) {
  let body = '';
  for (let y = 0; y < g.h; y++) { let x = 0; while (x < g.w) { const c = g.p[y * g.w + x]; if (!c) { x++; continue; } let e = x + 1; while (e < g.w && g.p[y * g.w + e] === c) e++; const A = pxRgb(c); body += `<rect x="${x}" y="${y}" width="${e - x}" height="1" fill="${pxHex(A[0], A[1], A[2])}"${A[3] < 255 ? ` fill-opacity="${(A[3] / 255).toFixed(2)}"` : ''}/>`; x = e; } }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${g.w} ${g.h}" shape-rendering="crispEdges">${body}</svg>`;
}
function pxEncode(g) {
  try {
    if (typeof document !== 'undefined' && document.createElement) {
      const cv = document.createElement('canvas'); cv.width = g.w; cv.height = g.h; const x = cv.getContext('2d');
      if (x) { const im = x.createImageData(g.w, g.h); g.p.forEach((c, i) => { if (!c) return; const A = pxRgb(c); im.data.set(A, i * 4); }); x.putImageData(im, 0, 0); return cv.toDataURL('image/png'); }
    }
  } catch (e) { /* fall through to SVG */ }
  return 'data:image/svg+xml,' + encodeURIComponent(pxSvgString(g));
}
function pxURL(key, make) { let u = PX.cache.get(key); if (!u) { u = pxEncode(make()); PX.cache.set(key, u); } return u; }
function pxImg(key, size, make, opt) {
  const o = opt || {}, h = o.h || size;
  return `<img class="${o.cls || 'ico'} px" src="${pxURL(key, make)}" width="${size}" height="${h}"${o.style ? ` style="${o.style}"` : ''} alt="" aria-hidden="true" draggable="false">`;
}

// ---------- Fixed colours ----------
const PXC = {
  rockL: '#8a786c', rock: '#6b5a50', rockD: '#4a3d36', bark: '#6b4a32', barkD: '#4a3222', wood: '#9a6a40', woodD: '#5e3b22',
  leaf: '#5fae46', leafD: '#3f7a32', leafL: '#8fd06a', metal: '#cfd4dc', metalD: '#8a909c', metalL: '#ffffff', gold: '#e8c15a', goldD: '#a8822e',
  glass: '#d9eef2', glassD: '#9cc3cc', cork: '#a87a4e', dark: '#2a1d17', white: '#fff6e6', eye: '#1a1410', blush: '#f08a8a', bone: '#ece3cf', boneD: '#b9ab8e',
};

// ============================================================
// ITEMS AND RESOURCES (16×16)
// ============================================================
const PX_ORE = [
  '................',
  '................',
  '......LLLL......',
  '....LLRRRRLL....',
  '...LRRcaRRRRr...',
  '..LRRcabRRRcar..',
  '..LRRabbRRRabr..',
  '.LRRRRRRcaRRRrr.',
  '.LRcaRRRabbRRrr.',
  '.RRabbRRRRRRrrr.',
  '.RRRbRRrRRcarrr.',
  '..rRRRrrrRabrr..',
  '...rrrrrrrrrr...',
];
const PX_SHAPES = {
  ore: (g, P) => g.rows(PX_ORE, { L: PXC.rockL, R: PXC.rock, r: PXC.rockD, a: P.a, b: P.b, c: P.c }),
  log: (g, P) => { g.rect(1, 5, 11, 7, PXC.bark).rect(1, 10, 11, 2, PXC.barkD); for (const [x, y] of [[2, 6], [3, 6], [6, 8], [7, 8], [8, 8], [3, 9], [9, 6]]) g.set(x, y, PXC.barkD); g.set(4, 4, PXC.leaf).set(5, 3, PXC.leaf).set(5, 4, PXC.leafD); g.ell(12, 8.5, 3, 4.5, P.b).ell(12, 8.5, 2.2, 3.4, P.a).ell(12, 8.5, 1.2, 2, P.c).set(12, 8, P.b); },
  crop: (g, P) => { g.line(8, 14, 8, 7, PXC.leafD); g.ell(5, 10, 3, 1.6, PXC.leaf).ell(11, 11, 3, 1.6, PXC.leaf).set(4, 10, PXC.leafL).set(10, 11, PXC.leafL); g.ell(8, 5.5, 4, 4, null, P); g.set(8, 1, PXC.leafD).set(9, 1, PXC.leaf); },
  fish: (g, P) => { g.ell(7.5, 8.5, 6, 3.6, null, P); g.poly([[12, 8.5], [15, 4], [15, 13]], P.b); g.poly([[6, 5.5], [10, 3], [10, 6]], P.b); g.set(4, 7, PXC.eye).set(3, 7, PXC.white); for (let x = 6; x < 11; x += 2) g.set(x, 9, P.c); },
  herb: (g, P) => { g.line(8, 14, 9, 4, PXC.leafD); const L = [[5, 11, -1], [11, 9, 1], [5, 7, -1], [11, 5, 1], [8, 3, 0]]; for (const [x, y] of L) g.ell(x, y, 2.6, 1.7, null, P); g.set(8, 14, PXC.leafD); },
  pelt: (g, P) => { g.rows(['..aa........aa..', '..aaa......aaa..', '...aaaaaaaaaa...', '...acaaaaaaaab...', '...acaaaaaaaab...', '..aaaaaaaaaaaab..', '.aaaaaaaaaaaaaab.', '.aa.aaaaaaaaa.bb.', '....aaaaaaaab....', '....aaaaaaabb....', '...aaa.bb.bbb...', '...aa......bb...'], P, 0, 2); g.set(6, 6, P.b).set(9, 7, P.b).set(7, 10, P.b); },
  // gear
  weapon: (g, P) => { for (let i = 0; i < 8; i++) { g.set(6 + i, 9 - i, PXC.metalL).set(7 + i, 9 - i, PXC.metal).set(7 + i, 10 - i, PXC.metalD); } g.line(3, 8, 7, 12, P.a).line(4, 8, 8, 12, P.b); g.line(5, 11, 2, 14, PXC.wood).set(3, 13, PXC.woodD); g.set(1, 14, P.a).set(1, 15, P.b).set(2, 15, P.b); },
  offhand: (g, P) => { for (let y = 2; y <= 14; y++) { const hw = y < 9 ? 6 : Math.max(0, 6 - Math.round((y - 8) * 1.1)); for (let x = 8 - hw; x < 8 + hw; x++) g.set(x, y, x === 8 - hw || x === 7 + hw || y === 2 ? PXC.gold : x < 8 ? P.a : P.b); } g.rect(7, 3, 2, 10, PXC.gold).rect(3, 6, 10, 2, PXC.gold); g.set(4, 4, P.c).set(4, 5, P.c); },
  head: (g, P) => g.rows(['................', '................', '.....aaaaaa.....', '....acccaaaa....', '...accaaaaaab...', '...acaaaaaaab...', '...aaaaaaaaab...', '...aakkkkkkab...', '...aak.aa.kab...', '...aak.aa.kab...', '...aaa.aa.aab...', '...bbb.bb.bbb...'], { ...P, k: P.d }),
  chest: (g, P) => g.rows(['................', '................', '....aa....aa....', '..aaca....acaa..', '.acaaaaaaaaaaab.', '.aaaaaGaaGaaaab.', '.bbaaaaaaaaaabb.', '..b.aaaaaaaa.b..', '....acaaaaab....', '....aaaaaaab....', '....kkkGkkkk....', '....aaaaaaab....', '....bbbbbbbb....'], { ...P, k: P.d, G: PXC.gold }),
  legs: (g, P) => g.rows(['................', '................', '....kkkGkkkk....', '....aaaaaaab....', '....acaaaaab....', '....aca..aab....', '....aca..aab....', '....aca..aab....', '....aaa..aab....', '....aaa..aab....', '....aab..aab....', '....bbb..bbb....'], { ...P, k: P.d, G: PXC.gold }),
  boots: (g, P) => g.rows(['................', '................', '................', '.....aaab.......', '.....acab.......', '.....acab.......', '.....aaab.......', '.....kkkk.......', '.....aaab.......', '.....acaaaab....', '.....aaaaaaab...', '.....bbbbbbbb...', '.....wwwwwwww...'], { ...P, k: P.d, w: PXC.woodD }),
  gloves: (g, P) => g.rows(['................', '................', '......a.a.a.....', '.....acacaca....', '.....acaaaaa....', '..a..aaaaaab....', '..aa.aaaaaab....', '...aaaaaaaab....', '....aaaaaaab....', '....aaaaaab.....', '....kkkkkkk.....', '....aaaaaab.....', '....bbbbbbb.....'], { ...P, k: P.d }),
  ring: (g, P) => { g.ell(8, 10, 5, 4.5, PXC.gold).ell(8, 10, 3, 2.5, 0); for (let y = 12; y < 16; y++) for (let x = 0; x < 16; x++) if (g.get(x, y)) g.set(x, y, PXC.goldD); g.ell(8, 4.5, 2.6, 2.6, null, P).set(7, 3, PXC.metalL); },
  amulet: (g, P) => { g.line(3, 1, 7, 7, PXC.gold).line(12, 1, 8, 7, PXC.gold); g.poly([[8, 6], [12, 10.5], [8, 15], [4, 10.5]], P.a); g.poly([[8, 6], [8, 15], [4, 10.5]], P.c); g.set(8, 10, PXC.metalL); },
  tool: (g, P) => { g.line(9, 3, 3, 14, PXC.wood, PXC.woodD); g.rows(['.....aaaaaa.....', '...aacccccaaa...', '..ab........ba..', '.ab..........b..', '.b..............'], P, 0, 1); },
  tool_woodcutting: (g, P) => { g.line(10, 2, 4, 14, PXC.wood, PXC.woodD); g.poly([[8, 2], [13, 1], [14, 6], [10, 7]], P.a); g.poly([[13, 1], [14, 6], [12, 5]], P.b); g.set(9, 3, P.c); },
  tool_farming: (g, P) => { g.line(11, 2, 4, 14, PXC.wood, PXC.woodD); g.rect(8, 1, 6, 2, P.a).rect(12, 3, 2, 3, P.b); },
  tool_fishing: (g, P) => { g.line(2, 14, 12, 2, PXC.wood); g.line(12, 2, 14, 10, '#e8e4d8'); g.set(14, 11, '#e0573a').set(14, 12, PXC.white); g.ell(4.5, 12, 1.6, 1.6, P.a); },
  tool_herbalism: (g, P) => { g.line(4, 14, 7, 9, PXC.wood, PXC.woodD); for (let i = 0; i < 7; i++) { const a = Math.PI * (0.9 + i * 0.13); g.set(9 + Math.cos(a) * -4.5, 6 + Math.sin(a) * -4.5, i < 2 ? P.b : P.a); } g.set(8, 8, P.a); },
  tool_skinning: (g, P) => { g.rect(3, 11, 5, 3, PXC.wood).rect(3, 13, 5, 1, PXC.woodD); g.poly([[7, 11], [14, 4], [13, 9], [8, 14]], P.a); g.line(8, 11, 13, 5, P.c); },
  // consumables and materials
  potion: (g, P) => { g.rect(6, 1, 4, 2, PXC.cork).rect(7, 3, 2, 3, PXC.glass); g.ell(8, 10, 5.2, 4.8, PXC.glass); g.ell(8, 10, 5.2, 4.8, null, P, (x, y) => y >= 9); g.set(5, 8, PXC.metalL).set(5, 9, PXC.metalL).set(6, 7, PXC.metalL); },
  elixir: (g, P) => { g.rect(6, 1, 4, 2, PXC.cork).rect(5, 3, 6, 12, PXC.glass).rect(5, 7, 6, 8, P.a).rect(9, 7, 2, 8, P.b).rect(5, 7, 6, 1, P.c); g.set(6, 4, PXC.metalL).set(6, 5, PXC.metalL); },
  food: (g, P) => { g.ell(8, 8.5, 5.5, 3.5, null, P, (x, y) => y < 9); g.set(6, 6, PXC.white).set(10, 6, P.d); g.ell(8, 9, 7, 4.5, PXC.wood, null, (x, y) => y >= 9); g.rect(2, 9, 12, 1, PXC.woodD); g.set(4, 2, '#ffffff99').set(5, 1, '#ffffff99').set(11, 3, '#ffffff99'); },
  stone: (g, P) => { g.poly([[8, 1], [14, 5], [12, 14], [4, 14], [2, 5]], '#5a5a6a'); g.poly([[8, 1], [14, 5], [8, 7], [2, 5]], '#7a7a8c'); g.poly([[8, 7.5], [10.5, 10.5], [8, 13], [5.5, 10.5]], P.a); g.set(7, 9, P.c); },
  bar: (g, P) => g.rows(['................', '................', '................', '................', '................', '................', '.....cccccc.....', '....caaaaaab....', '...caaaaaaaab...', '..aaaaaaaaaaab..', '..bbbbbbbbbbbb..', '..dddddddddddd..'], P),
  leather: (g, P) => { g.ell(8, 9, 6.5, 4, null, P); g.ell(12, 9, 2.5, 3.5, P.b).ell(12, 9, 1.4, 2.2, P.d); g.line(3, 7, 9, 7, P.c); },
  crate: (g, P) => { g.rect(2, 4, 12, 10, PXC.wood).rect(2, 4, 12, 1, '#c08850').rect(2, 13, 12, 1, PXC.woodD); for (const y of [7, 10]) g.rect(2, y, 12, 1, PXC.woodD); g.rect(7, 2, 3, 12, P.a).rect(9, 2, 1, 12, P.b); },
  egg: (g, P) => { g.ell(8, 9, 4.8, 6, null, P); g.set(6, 7, P.c).set(9, 11, P.d).set(10, 6, P.d).set(6, 12, P.d); g.set(6, 5, PXC.white); },
  coin: (g, P) => { g.ell(8, 8, 5.5, 5.5, PXC.goldD).ell(7.5, 7.5, 5, 5, PXC.gold).ell(7.5, 7.5, 3, 3, P.a).set(5, 5, PXC.white); },
  orb: (g, P) => { g.ell(8, 8, 5.5, 5.5, null, P); g.set(6, 5, PXC.white).set(5, 6, PXC.white); },
  hood: (g, P) => g.rows(['................', '................', '......aaaa......', '....aaccaaaa....', '...acaaaaaaab...', '...aaakkkkaab...', '..aaakkkkkkaab..', '..aakkkkkkkkab..', '..aakkkkkkkkab..', '..aaakkkkkkaab..', '.aaaaaaaaaaaabb.', '.bbbbbbbbbbbbbb.'], { ...P, k: PXC.dark }),
};
// Junk: one little sprite each, matched by name.
const PX_JUNK = [
  [/Pebble/, (g, P) => g.ell(8, 10, 4, 3, null, pxPal('#a99a8a')).set(6, 9, '#fff')],
  [/Shell/, (g, P) => { g.ell(8, 9, 5.5, 4.5, null, pxPal('#f2d2b6'), (x, y) => y <= 11); for (let x = 4; x <= 12; x += 2) g.line(8, 12, x, 6, '#c89a7a'); g.rect(6, 12, 4, 2, '#e0b896'); }],
  [/Nest/, (g, P) => { g.ell(8, 10, 6.5, 3.5, '#8a6a40').ell(8, 9, 4.5, 1.6, '#5e4426'); g.ell(6, 8, 1.6, 2, '#bfe3f2').ell(10, 8, 1.6, 2, '#bfe3f2'); for (const x of [3, 6, 9, 12]) g.set(x, 11, '#b99a60'); }],
  [/Twig/, (g, P) => { g.line(2, 13, 13, 3, PXC.wood).line(8, 8, 11, 9, PXC.wood); g.set(12, 2, PXC.leaf).set(13, 2, PXC.leaf).set(11, 10, PXC.leaf); }],
  [/Button/, (g, P) => { g.ell(8, 8, 5, 5, null, pxPal('#c45a5a')); for (const [x, y] of [[7, 7], [9, 7], [7, 9], [9, 9]]) g.set(x, y, '#5a1f1f'); }],
  [/Figurine/, (g, P) => { g.ell(8, 4.5, 2.5, 2.5, null, pxPal('#c08a5a')); g.poly([[5, 15], [11, 15], [9.5, 7], [6.5, 7]], '#a8744a'); g.set(7, 4, PXC.eye).set(9, 4, PXC.eye); }],
  [/Boot/, (g, P) => PX_SHAPES.boots(g, pxPal('#6b4a32'))],
  [/Bottle/, (g, P) => { g.poly([[2, 11], [5, 13], [13, 5], [10, 3]], '#9fd0c0'); g.line(3, 11, 11, 4, '#f2e6c8'); g.rect(12, 2, 2, 2, PXC.cork); }],
  [/Flower/, (g, P) => { g.line(8, 15, 8, 8, PXC.leafD); for (const [x, y] of [[8, 4], [5, 6], [11, 6], [6, 9], [10, 9]]) g.ell(x, y, 2, 2, '#e88ab8'); g.ell(8, 6.5, 1.5, 1.5, '#ffe08a'); }],
  [/Beetle/, (g, P) => { g.ell(8, 9, 4.5, 5, null, pxPal('#3fb6a0')); g.line(8, 5, 8, 14, '#1f5e54'); g.ell(8, 4, 2, 1.5, '#1f5e54'); for (const y of [7, 10, 13]) g.set(3, y, PX.out).set(12, y, PX.out); g.set(6, 7, '#bff5ea'); }],
  [/Arrowhead/, (g, P) => { g.poly([[8, 1], [12, 9], [8, 7.5], [4, 9]], '#8a8a96'); g.poly([[8, 1], [8, 7.5], [4, 9]], '#b8b8c4'); g.rect(7, 8, 2, 6, PXC.wood); }],
  [/Tooth/, (g, P) => { g.line(2, 2, 8, 6, '#a87a4e').line(14, 2, 8, 6, '#a87a4e'); g.poly([[5.5, 6], [10.5, 6], [8, 15]], PXC.bone); g.line(9, 7, 8, 13, PXC.boneD); }],
];
// Monster trophies: matched by the last words of the name, tinted by its theme.
const PX_TROPHY = [
  [/Tail$/, (g, P) => { g.line(3, 13, 6, 9, P.a, P.b).line(6, 9, 10, 7, P.a, P.b).line(10, 7, 12, 3, P.a, P.b); g.ell(12.5, 3, 1.6, 1.6, P.c); }],
  [/Shell|Carapace/, (g, P) => { g.ell(8, 9, 6, 5, null, P, (x, y) => y <= 12); for (let x = 4; x <= 12; x += 2) g.line(8, 13, x, 5, P.b); g.rect(6, 12, 4, 2, P.d); }],
  [/Scale|Sunscale/, (g, P) => { g.ell(8, 8, 5, 6, null, P); g.line(8, 3, 8, 13, P.b); g.set(6, 5, P.c).set(6, 6, P.c); }],
  [/Tooth|Fang|Tusk|Claw|Horn|Antler|Stinger|Bristle/, (g, P) => { g.poly([[4, 14], [9, 14], [12, 6], [13, 1], [10, 4], [6, 9]], PXC.bone); g.line(9, 13, 12, 4, PXC.boneD); g.rect(4, 13, 6, 2, P.a); }],
  [/Wing|Feather|Plume/, (g, P) => { g.poly([[3, 14], [6, 8], [11, 2], [13, 3], [10, 9], [5, 13]], P.a); g.line(3, 14, 12, 3, P.d); g.poly([[6, 8], [11, 2], [8, 8]], P.c); }],
  [/Crown/, (g, P) => { g.rect(3, 7, 10, 6, PXC.gold).rect(3, 12, 10, 1, PXC.goldD); for (const x of [3, 7, 11]) g.rect(x + (x === 7 ? 0 : 0), 4, 2, 3, PXC.gold); g.set(8, 9, P.a).set(5, 10, '#e0573a').set(11, 10, '#3b82c4'); }],
  [/Mask|Head/, (g, P) => { g.ell(8, 8, 5.5, 6, null, P); g.rect(5, 7, 2, 2, PX.out).rect(9, 7, 2, 2, PX.out); g.line(6, 11, 10, 11, P.d); }],
  [/Foot|Ear/, (g, P) => { g.ell(8, 10, 3.5, 3, null, P); for (const [x, y] of [[4, 6], [7, 4.5], [10, 4.5], [12.5, 6]]) g.ell(x, y, 1.4, 1.6, P.a); }],
  [/Slime|Tear|Earwax|Ember$|Rime$/, (g, P) => { g.poly([[8, 1], [12, 9], [4, 9]], P.a); g.ell(8, 10, 4.5, 4.5, null, P); g.set(6, 9, PXC.white).set(6, 10, PXC.white); }],
  [/Shard|Fragment|Core|Heart|Heartstone|Stone|Iron|Light/, (g, P) => { g.poly([[8, 1], [13, 6], [11, 14], [5, 14], [3, 6]], P.a); g.poly([[8, 1], [8, 14], [5, 14], [3, 6]], P.c); g.poly([[8, 1], [13, 6], [8, 7]], P.b); }],
  [/Dust|Smoke|Essence/, (g, P) => { g.ell(8, 10.5, 5, 4.2, null, pxPal('#a87a4e')); g.rect(6, 5, 4, 2, '#8a5a36'); g.ell(8, 3, 3, 1.8, P.c); g.set(5, 2, P.a).set(11, 1, P.a); }],
  [/Eye/, (g, P) => { g.ell(8, 8, 6, 4, PXC.white); g.ell(8, 8, 2.6, 2.6, P.a); g.ell(8, 8, 1.2, 1.2, PX.out); g.set(7, 7, '#ffffff'); }],
  [/Fur|Bundle|Linen|Bark/, (g, P) => { g.ell(8, 9, 6, 4, null, P); g.rect(7, 5, 2, 8, P.d); g.line(3, 7, 6, 7, P.c); }],
];
const PX_SECRET_SPRITES = () => typeof SECRET_SPRITES !== 'undefined' ? SECRET_SPRITES : [];
function pxThemeColor(name, fallback) { const m = PX_MON_COL.find(([re]) => re.test(name)); return m ? m[1] : fallback; }
function pxItemGrid(shape, color, jk) {
  const g = new PxGrid(16, 16), P = pxPal(color);
  if (jk) jk(g, P); else (PX_SHAPES[shape] || PX_SHAPES.orb)(g, P);
  return g.outline();
}
const PX_RES_SHAPE = { mining: 'ore', woodcutting: 'log', farming: 'crop', fishing: 'fish', herbalism: 'herb', skinning: 'pelt' };
function pxRes(r, size, glow) {
  const shape = PX_RES_SHAPE[r.skill] || 'ore';
  return pxImg(`r:${shape}:${r.color}`, size || 34, () => pxItemGrid(shape, r.color), glow ? { style: `filter:drop-shadow(0 0 3px ${r.color})` } : null);
}
function pxItemShape(it) {
  if (it.gear) return it.slot === 'tool' && PX_SHAPES['tool_' + it.toolSkill] ? 'tool_' + it.toolSkill : PX_SHAPES[it.slot] ? it.slot : 'tool';
  const t = it.type, n = it.name || '';
  if (t === 'potion') return 'potion';
  if (t === 'elixir') return 'elixir';
  if (t === 'food') return 'food';
  if (t === 'stone') return 'stone';
  if (t === 'egg') return 'egg';
  if (t === 'material') return /Bar$/.test(n) ? 'bar' : 'leather';
  if (t === 'supply' || t === 'upgrade') return 'crate';
  if (t === 'keepsake') return /Coin/.test(n) ? 'coin' : /Ring/.test(n) ? 'ring' : /Hood|Cloak/.test(n) ? 'hood' : 'orb';
  if (/Coin|Gold/.test(n)) return 'coin';
  return 'orb';
}
function pxItem(it, color, size) {
  const sec = PX_SECRET_SPRITES().find(([re]) => re.test(it.name || ''));
  if (sec) return pxImg(`s:${it.name}`, size, () => pxItemGrid(null, color, sec[1]));
  if (it.type === 'trophy' || !PX_SHAPES[pxItemShape(it)] || pxItemShape(it) === 'orb') { const t = PX_TROPHY.find(([re]) => re.test(it.name || '')); if (t) { const tc = pxThemeColor(it.name, color === RARITIES[0].color ? '#b08a6a' : color); return pxImg(`t:${t[0].source}:${tc}`, size, () => pxItemGrid(null, tc, t[1])); } }
  if (it.type === 'junk') { const j = PX_JUNK.find(([re]) => re.test(it.name || '')); if (j) return pxImg(`j:${it.name}`, size, () => pxItemGrid(null, color, j[1])); }
  const shape = pxItemShape(it);
  return pxImg(`i:${shape}:${color}`, size, () => pxItemGrid(shape, color));
}

// ============================================================
// CHIBI CHARACTERS (18×20) — players, NPCs and companions
// ============================================================
const PX_SKIN = { human: '#f1c27d', elf: '#f5d6b8', dwarf: '#e0a878', orc: '#8fb35a', halfling: '#f0c08a', beastfolk: '#c98a5e', dragonkin: '#e07a5a', undead: '#b7bfd6', sylph: '#d6eef8', starborn: '#cdbdf5', hollowkin: '#8a9a94' };
const PX_HAIR = ['#3a2a20', '#6b4426', '#b5762e', '#e0c068', '#d9d4c8', '#9e3b2a', '#2b2f44', '#5a3a6a', '#e8a0b8', '#4a6a3a'];
const PX_CLASS = {
  warrior: ['#b8463a', '#c8ccd4', 'sword', 'helm'], archer: ['#4f8a3a', '#c9a36a', 'bow', 'feather'], mage: ['#4a5ab8', '#e8c15a', 'staff', 'wizard'],
  rogue: ['#3a3a4a', '#8a3a3a', 'dagger', 'bandana'], necromancer: ['#3a2a4a', '#8fe0a0', 'skullstaff', 'hood'], healer: ['#e8e4d8', '#e8c15a', 'staff', 'circlet'],
  farmer: ['#7a8a3a', '#c9a36a', 'scythe', 'straw'], merchant: ['#8a4a8a', '#e8c15a', 'bag', 'cap'], beastmaster: ['#8a5a36', '#4f8a3a', 'whip', 'fur'],
  alchemist: ['#3a7a6a', '#e0573a', 'flask', 'goggles'], bard: ['#c0574a', '#e8c15a', 'lute', 'feathercap'], monk: ['#e08a3a', '#3a2a20', null, 'headband'],
  summoner: ['#5a4ab0', '#9fe2f2', 'orbstaff', 'circlet'], runesmith: ['#6a6a7a', '#6fd0e8', 'hammer', 'helm'], tidecaller: ['#2f6fa8', '#9fe2f2', 'trident', 'circlet'], wayfinder: ['#8a6a3a', '#e8c15a', 'map', 'hat'],
};
const PX_HATS = {
  helm: (g, C) => { g.ell(9, 6.5, 6, 4.5, C.m, null, (x, y) => y <= 6); g.rect(3, 6, 12, 1, C.md); g.set(9, 1, C.a).set(9, 0, C.a); },
  wizard: (g, C) => { g.poly([[3, 6], [15, 6], [11, 3], [12, -1], [8, 2]], C.o); g.rect(3, 5, 12, 2, C.od); g.set(10, 2, C.a); },
  hood: (g, C) => { const inHead = (x, y) => ((x + 0.5 - 9) / 5.6) ** 2 + ((y + 0.5 - 8) / 5.1) ** 2 <= 1; g.ell(9, 8, 7, 6.6, C.o, null, (x, y) => y <= 12 && (y <= 5 || !inHead(x, y))); g.rect(4, 5, 10, 1, C.od); },
  bandana: (g, C) => { g.rect(4, 5, 11, 2, C.a); g.set(15, 6, C.a).set(16, 7, C.a); },
  circlet: (g, C) => { g.rect(4, 5, 11, 1, PXC.gold); g.set(9, 4, C.a).set(9, 5, C.a); },
  straw: (g, C) => { g.ell(9, 5.5, 8.5, 1.6, '#e0c068').ell(9, 3.8, 4.5, 2.6, '#e0c068', null, (x, y) => y <= 4); g.rect(5, 4, 9, 1, '#b8463a'); },
  cap: (g, C) => { g.ell(9, 4.5, 6, 3, C.o, null, (x, y) => y <= 5); g.rect(9, 5, 7, 1, C.od); },
  fur: (g, C) => { g.ell(9, 5.5, 6.5, 3.5, '#b08a60', null, (x, y) => y <= 6); for (let x = 3; x <= 15; x += 2) g.set(x, 6, '#e8dcc0'); },
  goggles: (g, C) => { g.rect(4, 5, 11, 1, '#5e3b22'); g.ell(7, 5, 1.6, 1.6, '#9fe2f2').ell(11, 5, 1.6, 1.6, '#9fe2f2'); },
  feathercap: (g, C) => { g.ell(9, 4.5, 6, 3, C.o, null, (x, y) => y <= 5); g.line(13, 4, 16, 0, C.a).line(14, 4, 17, 1, C.a); },
  feather: (g, C) => { g.line(14, 5, 16, 1, '#e8dcc0').set(15, 2, '#c0574a'); },
  headband: (g, C) => { g.rect(4, 5, 11, 1, '#c0574a'); g.set(15, 6, '#c0574a').set(16, 7, '#c0574a'); },
  hat: (g, C) => { g.ell(9, 5.5, 8, 1.5, '#6b4a32').ell(9, 3.8, 4.5, 2.6, '#6b4a32', null, (x, y) => y <= 4); g.rect(5, 4, 9, 1, C.a); },
  lamp: (g, C) => { g.ell(9, 6.5, 6, 4.5, '#e0c068', null, (x, y) => y <= 6); g.rect(3, 6, 12, 1, '#a8822e'); g.ell(9, 3.5, 1.5, 1.5, '#fff6a0'); },
  turban: (g, C) => { g.ell(9, 4.5, 6.5, 3.5, '#e8dcc0', null, (x, y) => y <= 6); g.line(4, 6, 13, 2, '#c9b890'); g.set(9, 3, '#3b82c4'); },
  wide: (g, C) => { g.ell(9, 5.5, 8.5, 1.8, '#4a4038').ell(9, 3.5, 4, 2.6, '#4a4038', null, (x, y) => y <= 4); },
  crown: (g, C) => { g.rect(5, 3, 9, 3, PXC.gold); for (const x of [5, 9, 13]) g.set(x, 2, PXC.gold).set(x, 1, PXC.gold); g.set(9, 4, '#e0573a'); },
};
const PX_PROPS = {
  sword: (g, C) => { g.line(15, 16, 15, 7, PXC.metal).line(16, 16, 16, 8, PXC.metalD); g.rect(13, 16, 5, 1, C.a); g.set(15, 17, PXC.wood).set(15, 18, PXC.wood); },
  dagger: (g, C) => { g.line(15, 16, 15, 12, PXC.metal); g.rect(14, 16, 3, 1, C.a); g.set(15, 17, PXC.wood); },
  hammer: (g, C) => { g.line(15, 18, 15, 10, PXC.wood); g.rect(13, 8, 5, 3, PXC.metalD).rect(13, 8, 5, 1, PXC.metal); g.set(15, 9, C.a); },
  bow: (g, C) => { for (let y = 8; y <= 18; y++) g.set(y < 10 || y > 16 ? 15 : 16, y, PXC.wood); g.line(14, 8, 14, 18, PXC.white); },
  staff: (g, C) => { g.line(15, 19, 15, 7, PXC.wood); g.ell(15.5, 6, 1.8, 1.8, C.a); g.set(15, 5, PXC.white); },
  orbstaff: (g, C) => { g.line(15, 19, 15, 8, PXC.wood); g.ell(15.5, 6, 2, 2, C.a); g.set(15, 5, PXC.white); },
  skullstaff: (g, C) => { g.line(15, 19, 15, 8, '#4a3a4a'); g.ell(15.5, 6.5, 2, 2, PXC.bone); g.set(15, 6, PXC.eye).set(16, 6, PXC.eye); },
  trident: (g, C) => { g.line(15, 19, 15, 7, PXC.metalD); g.rect(13, 7, 5, 1, PXC.metal); for (const x of [13, 15, 17]) g.set(x, 6, PXC.metal).set(x, 5, PXC.metal); },
  scythe: (g, C) => { g.line(15, 19, 15, 5, PXC.wood); g.line(15, 5, 11, 4, PXC.metal).line(15, 6, 12, 5, PXC.metalD); },
  bag: (g, C) => { g.ell(15, 16, 2.5, 2.5, '#a87a4e'); g.set(15, 13, C.a).set(15, 16, PXC.gold); },
  whip: (g, C) => { g.line(14, 16, 16, 12, PXC.wood); g.line(16, 12, 17, 17, '#6b4a32'); },
  flask: (g, C) => { g.ell(15.5, 16, 2, 2, PXC.glass); g.rect(15, 13, 1, 2, PXC.glass); g.set(15, 16, C.a).set(16, 16, C.a).set(15, 17, C.a); },
  lute: (g, C) => { g.ell(15, 16, 2.4, 2.4, '#c08850'); g.line(15, 14, 17, 9, PXC.woodD); g.set(15, 16, PXC.woodD); },
  map: (g, C) => { g.rect(13, 14, 5, 4, '#ecd9a8'); g.set(14, 15, '#c0574a').set(16, 16, '#3b82c4'); },
};
// look = { race, gender, cls, hair, outfit, accent, hat, prop, mark, beard, elder, eyes }
function pxChibiGrid(look) {
  const g = new PxGrid(18, 20), L = look, sk = PX_SKIN[L.race] || PX_SKIN.human, cl = PX_CLASS[L.cls] || PX_CLASS.warrior;
  const o = L.outfit || cl[0], ac = L.accent || cl[1], hair = L.hair || '#3a2a20';
  const C = { o, od: pxTone(o, -0.35), a: ac, m: PXC.metal, md: PXC.metalD }, S = pxPal(sk), H = pxPal(hair);
  const female = L.gender === 'Female';
  // wings behind (sylph)
  if (L.race === 'sylph') { g.ell(4, 14, 2.2, 3, '#bfe7f7').ell(14, 14, 2.2, 3, '#bfe7f7'); }
  // long hair behind
  if (female) { g.rect(3, 6, 3, 8, H.b).rect(12, 6, 3, 8, H.b); }
  // body
  g.rect(6, 13, 6, 4, o).rect(6, 16, 6, 1, C.od);
  g.rect(5, 13, 1, 3, o).rect(12, 13, 1, 3, o).set(5, 16, sk).set(12, 16, sk);
  g.rect(6, 15, 6, 1, ac);
  g.rect(7, 13, 4, 1, pxTone(o, 0.25));
  g.rect(6, 17, 2, 2, C.od).rect(10, 17, 2, 2, C.od).rect(6, 18, 2, 1, PXC.dark).rect(10, 18, 2, 1, PXC.dark);
  // head
  g.ell(9, 8, 5.6, 5.1, null, S);
  // ears
  if (L.race === 'elf') { g.set(3, 8, sk).set(2, 7, sk).set(14, 8, sk).set(15, 7, sk); }
  else g.set(3, 9, S.b).set(14, 9, S.b);
  // hair top + fringe
  g.ell(9, 6.2, 6, 3.8, null, H, (x, y) => y <= 5);
  for (let x = 4; x <= 13; x++) if ((x * 7 + 3) % 4 !== 0) g.set(x, 6, H.a);
  g.set(4, 7, H.b).set(13, 7, H.b);
  if (L.race === 'beastfolk') { g.poly([[3, 5], [5, 0], [7, 4]], H.a).poly([[11, 4], [13, 0], [15, 5]], H.a); g.set(5, 3, S.c).set(13, 3, S.c); }
  if (L.race === 'dragonkin') { g.line(5, 3, 3, 0, PXC.bone).line(13, 3, 15, 0, PXC.bone); g.set(5, 10, S.b).set(13, 10, S.b); }
  // face
  const eye = L.race === 'undead' ? '#6fe0f0' : L.race === 'hollowkin' ? '#e8fff6' : PXC.eye;
  g.rect(6, 8, 1, 2, eye).rect(11, 8, 1, 2, eye);
  if (L.race !== 'hollowkin') g.set(6, 8, eye === PXC.eye ? '#4a3a6a' : eye);
  if (!['undead', 'hollowkin', 'orc'].includes(L.race)) g.set(5, 10, PXC.blush).set(12, 10, PXC.blush);
  g.set(8, 11, S.d).set(9, 11, S.d);
  if (L.race === 'orc') g.set(7, 11, PXC.white).set(10, 11, PXC.white);
  if (L.race === 'undead') g.set(13, 9, '#5a5a7a').set(13, 10, '#5a5a7a');
  if (L.race === 'starborn') g.set(12, 4, '#ffe08a').set(12, 3, '#fff6c0');
  // marks
  if (L.mark === 'Old scar') g.set(11, 10, '#c86a6a').set(12, 11, '#c86a6a');
  if (L.mark === 'Warpaint') g.rect(5, 9, 2, 1, '#b8463a').rect(11, 9, 2, 1, '#b8463a');
  if (L.mark === 'Freckles') g.set(7, 10, S.d).set(10, 10, S.d).set(8, 10, S.b);
  if (L.mark === 'Runic tattoo') g.set(13, 8, '#6fd0e8').set(4, 8, '#6fd0e8');
  if (L.mark === 'Birthmark') g.set(11, 11, S.d);
  // beard
  if (L.beard || L.race === 'dwarf' && !female) { const bc = L.elder ? '#e8e4d8' : hair; g.ell(9, 11.5, 4.5, 2.6, bc, null, (x, y) => y >= 10); g.set(8, 11, S.d).set(9, 11, S.d); }
  // hat and prop
  const hat = L.hat === undefined ? cl[3] : L.hat, prop = L.prop === undefined ? cl[2] : L.prop;
  if (hat && PX_HATS[hat]) PX_HATS[hat](g, C);
  if (prop && PX_PROPS[prop]) PX_PROPS[prop](g, C);
  return g.outline();
}
function pxChibi(look, size, opt) {
  const k = 'c:' + [look.race, look.gender, look.cls, look.hair, look.outfit, look.accent, look.hat, look.prop, look.mark, look.beard, look.elder].join('|');
  const o = opt || {}; return pxImg(k, size, () => pxChibiGrid(look), { ...o, h: o.h || Math.round(size * 20 / 18) });
}
// A player character's look.
function pxLookOf(c) {
  const h = pxHash(c.name || '?');
  return { race: c.race || 'human', gender: c.gender || 'Male', cls: c.cls || 'warrior', hair: c.race === 'undead' ? '#d9d4c8' : PX_HAIR[h % PX_HAIR.length], mark: c.mark };
}
// NPCs: a stable look from the name, with a few role hats.
const PX_NPC_ROLES = [[/Elder/, { hat: null, beard: true, elder: true, hair: '#e8e4d8', outfit: '#8a3a2a', prop: 'staff' }], [/Warden/, { hat: 'hood', outfit: '#3f6a32', prop: 'bow' }], [/Foreman/, { hat: 'lamp', outfit: '#6a5a4a', prop: 'hammer' }], [/Ferryman/, { hat: 'wide', outfit: '#4a5a5a', prop: 'staff' }], [/Caravaneer/, { hat: 'turban', outfit: '#c08850', prop: 'bag' }], [/Huntress|Hunter/, { hat: 'fur', outfit: '#6b4a32', prop: 'bow' }], [/Ser |Sir |Knight|Paladin/, { hat: 'helm', prop: 'sword' }], [/King|Queen|Jarl/, { hat: 'crown' }], [/Brother|Sister|Mother|Father/, { hat: 'hood' }]];
function pxNpcLook(name, cls) {
  const h = pxHash(name), races = RACES.filter(r => !r.secret).map(r => r.id);
  const base = { race: races[h % races.length], gender: (h >>> 4) % 2 ? 'Female' : 'Male', cls: cls || CLASSES[(h >>> 6) % CLASSES.length].id, hair: PX_HAIR[(h >>> 9) % PX_HAIR.length] };
  if (/Ilsabet|Dagna|Saffi|Velka|Wren|Mira|Lyra|Nell|Ada|ess$|a$/.test(name.split(/\s/).pop())) base.gender = 'Female';
  if (/Brannoch|Orrin|Aldren|Pip/.test(name)) base.gender = 'Male';
  const role = PX_NPC_ROLES.find(([re]) => re.test(name));
  return role ? { ...base, ...role[1] } : base;
}
function npcSprite(name, size, cls, framed) { const S = size || 48; return pxChibi(pxNpcLook(name, cls), S, { cls: 'npcpx', h: framed ? Math.round(S * 1.125) : undefined, style: framed ? `flex:none;width:${S}px;height:${Math.round(S * 1.125)}px;object-fit:contain;background:linear-gradient(#5a4a3a,#2a1d17);border:1px solid rgba(0,0,0,.35);border-radius:10px;box-sizing:border-box;padding:3px 2px 0` : 'flex:none' }); }

// ============================================================
// PETS (20×20) — chibi creatures from species tags
// ============================================================
const PX_PET_HATS = {
  party_hat: (g, t) => { g.poly([[7, t + 1], [13, t + 1], [10, t - 5]], '#e8572e'); g.set(10, t - 5, '#ffe08a').set(9, t - 1, '#ffe08a').set(11, t - 2, '#ffe08a'); },
  wizard_hat: (g, t) => { g.poly([[5, t + 1], [15, t + 1], [12, t - 3], [13, t - 6], [9, t - 3]], '#4a5ab8'); g.rect(5, t, 10, 1, '#2f3a80'); g.set(11, t - 2, '#ffe08a'); },
  flower_crown: (g, t) => { for (const [x, c] of [[6, '#e88ab8'], [8, '#ffe08a'], [10, '#9fe2f2'], [12, '#e88ab8'], [14, '#ffe08a']]) g.set(x, t, c).set(x - 1, t, PXC.leaf); },
  pirate_hat: (g, t) => { g.ell(10, t, 6.5, 2, '#2a2a34'); g.rect(4, t, 13, 1, '#1a1a22'); g.set(10, t - 1, PXC.white); },
  tiny_crown: (g, t) => { g.rect(8, t - 1, 5, 2, PXC.gold); g.set(8, t - 2, PXC.gold).set(10, t - 2, PXC.gold).set(12, t - 2, PXC.gold).set(10, t, '#e0573a'); },
};
function pxPetGrid(sp, hat) {
  const S = SP(sp), g = new PxGrid(20, 20), tags = S.tags, n = S.name, rnd = pxRand(pxHash(sp));
  const base = pxMix(PET_TAG_COLOR[tags[0]] || '#b07a4a', '#ffffff', 0.08 + rnd() * 0.12), c2 = PET_TAG_COLOR[tags[1] || tags[0]] || base;
  const P = pxPal(base), P2 = pxPal(c2), has = t => tags.includes(t), nm = re => re.test(n);
  const rx = 4.2 + S.size * 0.75, ry = rx * 0.88, fly = has('Flying') && !nm(/Whale|Turtle/), cy = 19 - ry - 1 - (fly ? 1.5 : 0), cx = 10;
  const top = Math.floor(cy - ry);
  // behind-body parts
  if (fly && !nm(/Wisp|Lantern|Moth/)) { const w = 2.6 + S.size * 0.5; g.ell(cx - rx - 0.5, cy - 1, w, w * 0.75, null, pxPal(pxTone(c2, 0.25))); g.ell(cx + rx + 0.5, cy - 1, w, w * 0.75, null, pxPal(pxTone(c2, 0.25))); }
  if (nm(/Moth/)) { g.ell(cx - rx, cy - 1, 3.2, 3.6, '#ffe6a0').ell(cx + rx, cy - 1, 3.2, 3.6, '#ffe6a0'); g.set(cx - rx, cy - 1, '#e0a040').set(cx + rx, cy - 1, '#e0a040'); }
  if (nm(/Fox|Cat|Wolf|Pup|Hound|Kit|Mouse|Rimecat|Kirin|Stalker|Scorp/)) { const tx = cx + rx - 0.5; g.ell(tx + 1.5, cy - 1, 1.8, 3, nm(/Fox/) ? P.a : P.b); if (nm(/Fox/)) g.set(Math.floor(tx + 1.5), Math.floor(cy - 3.5), PXC.white); if (nm(/Scorp|Stalker/)) g.line(tx, cy, tx + 2, cy - 5, P.b).set(tx + 1, cy - 6, '#ffe08a'); }
  if (nm(/Whale/)) g.poly([[cx + rx - 1, cy], [cx + rx + 4, cy - 4], [cx + rx + 4, cy + 3]], P.b);
  if (nm(/Serpent|Wyrm|Drake|Dragon|Wyvern|Gecko/)) g.ell(cx + rx, cy + ry - 1.5, 3, 1.5, P.b);
  // body
  if (nm(/Wisp|Lantern/)) { g.ell(cx, cy, rx, ry, null, P); g.poly([[cx - rx + 1, cy + 1], [cx + rx - 1, cy + 1], [cx + 1, cy + ry + 3], [cx - 1, cy + ry + 1]], P.a); }
  else g.ell(cx, cy, rx, ry, null, P);
  if (nm(/Tortoise|Turtle|Shellback/)) { g.ell(cx + 0.5, cy - 1, rx * 0.9, ry * 0.7, null, pxPal(has('Mystic') ? '#9fe2f2' : '#6a8a4a'), (x, y) => y <= cy); for (let x = Math.ceil(cx - rx + 2); x < cx + rx - 1; x += 3) g.set(x, Math.floor(cy - ry * 0.4), '#3a4a2a'); }
  if (has('Ground') && !nm(/Tortoise|Turtle|Shellback/)) { g.set(cx - 2, top + 1, P.d).set(cx + 1, top + 1, P.d).set(cx + 3, top + 2, P.d); }
  // belly
  g.ell(cx, cy + ry * 0.45, rx * 0.55, ry * 0.4, pxTone(base, 0.35), null, (x, y) => g.get(x, y));
  // ears / crests
  if (nm(/Hare/)) { g.ell(cx - 2, top - 2, 1, 3, P.a).ell(cx + 2, top - 2, 1, 3, P.a).set(cx - 2, top - 2, PXC.blush).set(cx + 2, top - 2, PXC.blush); }
  else if (nm(/Mouse/)) { g.ell(cx - rx + 1, top + 1, 2, 2, P.a).ell(cx + rx - 1, top + 1, 2, 2, P.a).set(cx - rx + 1, top + 1, PXC.blush).set(cx + rx - 1, top + 1, PXC.blush); }
  else if (nm(/Owl|Owlet/)) { g.poly([[cx - rx + 1, top + 2], [cx - rx + 1, top - 2], [cx - 1, top + 1]], P.b).poly([[cx + rx - 1, top + 2], [cx + rx - 1, top - 2], [cx + 1, top + 1]], P.b); }
  else if (has('Beast') || nm(/Fox|Cat|Wolf|Pup|Hound|Kit/)) { g.poly([[cx - rx + 0.5, top + 2.5], [cx - rx + 1.5, top - 2], [cx - 0.8, top + 1]], P.a).poly([[cx + rx - 0.5, top + 2.5], [cx + rx - 1.5, top - 2], [cx + 0.8, top + 1]], P.a); g.set(cx - rx + 1.5, top, P.d).set(cx + rx - 1.5, top, P.d); }
  if (nm(/Kirin/)) g.line(cx, top, cx + 1, top - 3, '#ffe08a');
  if (nm(/Hedgehog/)) for (let x = Math.ceil(cx - rx); x <= cx + rx; x += 2) g.set(x, top + 1 - (Math.abs(x - cx) < rx - 1 ? 1 : 0), P.d);
  if (has('Fire') && !nm(/Mouse|Fox/)) { g.set(cx, top - 1, '#ffb040').set(cx, top - 2, '#ffe08a').set(cx - 1, top, '#e8572e').set(cx + 1, top, '#e8572e'); }
  if (has('Frost')) { g.set(cx - 2, top, '#e6fbff').set(cx - 2, top - 1, '#e6fbff').set(cx + 2, top, '#e6fbff').set(cx + 2, top - 1, '#e6fbff').set(cx, top - 1, '#bfefff'); }
  if (has('Water') && !nm(/Whale|Turtle|Frog/)) g.poly([[cx - 1, top + 1], [cx + 2, top - 2], [cx + 2, top + 1]], P2.b);
  if (nm(/Serpent|Wyrm|Drake|Dragon|Wyvern/)) { g.line(cx - 2, top + 1, cx - 3, top - 2, PXC.bone).line(cx + 2, top + 1, cx + 3, top - 2, PXC.bone); }
  if (nm(/Phoenix|Thunderbird/)) { g.line(cx, top, cx - 1, top - 3, '#ffe08a').line(cx + 1, top, cx + 2, top - 3, '#ffb040'); }
  if (nm(/Moth/)) { g.line(cx - 1, top, cx - 2, top - 3, PX.out).line(cx + 1, top, cx + 2, top - 3, PX.out); }
  if (nm(/Frog/)) { g.ell(cx - 2.5, top + 0.5, 1.8, 1.8, P.a).ell(cx + 2.5, top + 0.5, 1.8, 1.8, P.a); }
  // face
  const ey = Math.floor(cy - ry * 0.15), ex = Math.max(2, Math.round(rx * 0.42));
  if (nm(/Wisp|Lantern/)) { g.set(cx - ex, ey, PXC.white).set(cx + ex - 1, ey, PXC.white); }
  else {
    const fy = nm(/Frog/) ? top + 0 : ey;
    g.rect(cx - ex - 1, fy, 1, 2, PXC.eye).rect(cx + ex, fy, 1, 2, PXC.eye).set(cx - ex - 1, fy, '#ffffff').set(cx + ex, fy, '#ffffff');
    if (nm(/Owl|Owlet|Griffin|Roc|Phoenix|Thunderbird|Pegasus/)) g.set(cx, ey + 1, '#f0b040').set(cx - 1, ey + 1, '#f0b040');
    else if (nm(/Mole|Pup|Hound|Wolf|Fox/)) g.set(cx, ey + 1, PXC.eye).set(cx - 1, ey + 1, PXC.eye);
    else g.set(cx, ey + 2, P.d).set(cx - 1, ey + 2, P.d);
    if (!has('Ground') || S.size < 2) g.set(cx - ex - 2, ey + 2, PXC.blush).set(cx + ex + 1, ey + 2, PXC.blush);
  }
  // feet
  if (!fly && !nm(/Wisp|Lantern|Serpent|Whale/)) { const fy2 = Math.floor(cy + ry) - 0; g.rect(cx - 3, fy2, 2, 1, P.d).rect(cx + 1, fy2, 2, 1, P.d); }
  if (has('Mystic')) { g.set(cx, top + 2, '#ffe08a'); g.set(2, 4, '#e6d0ff').set(17, 6, '#e6d0ff').set(3, 12, '#c9a8ff'); }
  if (S.rarity >= 3) g.set(cx - rx + 1, cy + ry - 2, '#ffe08a').set(17, 3, '#ffe08a').set(16, 2, '#fff6c0');
  if (hat && PX_PET_HATS[hat]) PX_PET_HATS[hat](g, Math.max(3, top));
  return g.outline();
}
function pxPet(sp, size, p) {
  const hat = p && p.hat, aura = p && p.aura && PET_AURAS.find(a => a[0] === p.aura);
  return pxImg(`p:${sp}:${hat || ''}`, size, () => pxPetGrid(sp, hat), { cls: 'petpx', style: `flex:none${aura ? `;filter:drop-shadow(0 0 4px ${aura[3]}) drop-shadow(0 0 2px ${aura[3]})` : ''}` });
}
const pxEgg = (key, size) => { const it = ITEM(key), col = RARITIES[it.rarity] ? RARITIES[it.rarity].color : '#cccccc'; return pxImg(`e:${col}`, size, () => pxItemGrid('egg', col), { style: 'flex:none' }); };

// ============================================================
// MONSTERS AND BOSSES (20×20, bosses 24×24)
// ============================================================
const PX_MON_KIND = [
  ['spirit', /Wraith|Wisp|Horror|Null|Star Eater|Djinn|Seraph|Sovereign|Phantom|Ghost|Lich|Herald|Spirit|Elemental|Shadow|Faceless|Silence|Echo|Spark|Sickness|Plague|Double|Eater/i],
  ['serpent', /Wyrm|Serpent|Hydra|Basilisk|Leech|Lurker|Snapper|Leviathan|Tide/i],
  ['croc', /Crocodile|Lizard|Sunscale/i],
  ['insect', /Beetle|Scarab|Mite|Scorpion|Mudcrab|Crab/i],
  ['flyer', /Bat\b|Harpy|Wyvern|Phoenix|Imp\b|Moth/i],
  ['blob', /Toad|Thornling|Sprite|Pumpkin|Homunculus|Reagent/i],
  ['beast', /Rat\b|Wolf|Jackal|Hog\b|Boar|Hare|Weasel|fang|Mole|Stag|Hart\b|Ram\b|Cinderhorn|Sphinx|Hound|Mammoth|Direwolf|Beast/i],
  ['golem', /Golem|Colossus|Titan|Warden|Smokejaw|Treant|Sentinel|Behemoth|Guardian/i],
  ['humanoid', /./],
];
const PX_MON_COL = [[/Ember|Cinder|Ash|Magma|Smoke|Fire|Phoenix|Imp|Sun/, '#e0603a'], [/Frost|Ice|Snow|Rime|Yeti|Hrim|White/, '#a7d8ee'], [/Moss|Thorn|Bramble|Bog|Swamp|Reed|Dryad|Forest|Hydra|Toad|Leech|Croc/, '#6a9a4a'], [/Sand|Dune|Scarab|Scorpion|Mummified|Sphinx|Jackal/, '#d9b26a'], [/Void|Null|Rift|Star|Hollow|Seraph|Wraith/, '#8a6ad0'], [/Stone|Rock|Golem|Crystal|Mountain|Gorrak|Troll|Titan/, '#8a8a96'], [/Golden/, '#e8c15a'], [/Silver|Spectral|Wisp/, '#cfe0f0'], [/Wolf|Hog|Boar|Bat|Rat|Mole|Hare|Weasel|Hart|Stag|Ram/, '#8a6a52'], [/Deep|Serpent|World|Lurker|Snapper/, '#3f7a9a']];
function pxMonGrid(name, boss) {
  const W = boss ? 24 : 20, g = new PxGrid(W, W), h = pxHash(name), rnd = pxRand(h);
  const kind = PX_MON_KIND.find(([, re]) => re.test(name))[0];
  const cm = PX_MON_COL.find(([re]) => re.test(name)), base = cm ? pxMix(cm[1], '#' + (h & 0xffffff).toString(16).padStart(6, '0'), 0.12) : pxMix('#8a7a6a', '#' + (h & 0xffffff).toString(16).padStart(6, '0'), 0.45);
  const P = pxPal(base), cx = W / 2, B = boss ? 1.25 : 1, eyeC = /Void|Null|Rift|Wraith|Horror|Hollow/.test(name) ? '#e6d0ff' : boss ? '#ffe08a' : '#ff5a3a';
  const eyes = (x1, x2, y) => { g.set(x1, y, eyeC).set(x2, y, eyeC); };
  let top = 4;
  if (kind === 'beast') {
    const by = W * 0.62; g.ell(cx + 1, by, 6 * B, 3.6 * B, null, P); top = by - 3.6 * B - 3;
    for (const lx of [cx - 3 * B, cx - 1, cx + 3, cx + 5 * B]) g.rect(lx, by + 2.5 * B, 2, 3, P.b);
    g.ell(cx - 4.5 * B, by - 2.5 * B, 3.2 * B, 3 * B, null, P); g.poly([[cx - 6 * B, by - 4.5 * B], [cx - 5.5 * B, by - 8 * B], [cx - 3.5 * B, by - 5 * B]], P.b).poly([[cx - 3.5 * B, by - 5 * B], [cx - 2.5 * B, by - 8 * B], [cx - 1.5 * B, by - 4.5 * B]], P.a);
    g.ell(cx - 7.5 * B, by - 1.5 * B, 1.6, 1.3, P.b); g.set(cx - 8.5 * B, by - 2 * B, PX.out);
    g.line(cx + 7 * B, by - 1, cx + 9 * B, by - 4, P.b);
    if (/Stag|Hart|Ram|Cinderhorn/.test(name)) { g.line(cx - 5 * B, by - 6 * B, cx - 7 * B, by - 10 * B, PXC.bone).line(cx - 3 * B, by - 6 * B, cx - 1 * B, by - 10 * B, PXC.bone); top = by - 10 * B; }
    if (/Hog|Boar/.test(name)) g.set(cx - 7 * B, by - 0.5 * B, PXC.white).set(cx - 6 * B, by, PXC.white);
    eyes(cx - 6 * B, cx - 4 * B, by - 3 * B);
  } else if (kind === 'insect') {
    const by = W * 0.6; g.ell(cx, by, 6 * B, 4.5 * B, null, P); g.line(cx, by - 4.5 * B, cx, by + 4 * B, P.d);
    for (let i = -1; i <= 1; i++) { g.line(cx - 6 * B, by + i * 2.5, cx - 8.5 * B, by + i * 3 + 2, PX.out).line(cx + 6 * B, by + i * 2.5, cx + 8.5 * B, by + i * 3 + 2, PX.out); }
    g.ell(cx, by - 5 * B, 3 * B, 2.2 * B, null, pxPal(P.b)); top = by - 7.5 * B;
    if (/Scorpion/.test(name)) { g.line(cx + 4, by - 2, cx + 7, by - 8 * B, P.b).line(cx + 7, by - 8 * B, cx + 5, by - 10 * B, P.b).set(cx + 5, by - 10 * B, '#ffe08a'); }
    if (/Crab|Scorpion/.test(name)) { g.ell(cx - 7 * B, by - 4, 2, 1.6, P.a).ell(cx + 7 * B, by - 4, 2, 1.6, P.a); }
    eyes(cx - 1.5, cx + 1, by - 5.5 * B);
  } else if (kind === 'flyer') {
    const by = W * 0.5; g.poly([[cx - 2, by - 1], [cx - 9 * B, by - 6 * B], [cx - 8 * B, by + 1], [cx - 6 * B, by - 1], [cx - 4, by + 3]], P.b).poly([[cx + 2, by - 1], [cx + 9 * B, by - 6 * B], [cx + 8 * B, by + 1], [cx + 6 * B, by - 1], [cx + 4, by + 3]], P.b);
    g.ell(cx, by, 3.6 * B, 4.2 * B, null, P); g.poly([[cx - 3, by - 3 * B], [cx - 2.5, by - 7 * B], [cx - 0.5, by - 4 * B]], P.a).poly([[cx + 3, by - 3 * B], [cx + 2.5, by - 7 * B], [cx + 0.5, by - 4 * B]], P.a);
    if (/Phoenix/.test(name)) g.poly([[cx - 2, by + 3], [cx + 2, by + 3], [cx + 3, by + 9 * B], [cx, by + 6], [cx - 3, by + 9 * B]], '#ffb040');
    top = by - 7 * B; eyes(cx - 2, cx + 1, by - 1);
  } else if (kind === 'blob') {
    const by = W * 0.62; g.ell(cx, by, 6.5 * B, 5 * B, null, P); g.ell(cx, by + 2.5 * B, 4.5 * B, 2 * B, pxTone(base, 0.3), null, (x, y) => g.get(x, y));
    if (/Thorn/.test(name)) for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.1 + i * 0.16); g.set(cx + Math.cos(a) * 7 * B, by + Math.sin(a) * 5.6 * B, P.d); }
    if (/Toad/.test(name)) { g.ell(cx - 3 * B, by - 4.5 * B, 2, 2, P.a).ell(cx + 3 * B, by - 4.5 * B, 2, 2, P.a); eyes(cx - 3 * B, cx + 3 * B, by - 4.5 * B); }
    else eyes(cx - 2, cx + 2, by - 1.5);
    g.line(cx - 2, by + 1, cx + 2, by + 1, P.d); top = by - 6.5 * B;
  } else if (kind === 'serpent' || kind === 'croc') {
    if (kind === 'croc') { const by = W * 0.65; g.ell(cx + 1, by, 7.5 * B, 2.8 * B, null, P); g.ell(cx - 6 * B, by - 1, 3.6 * B, 1.8 * B, null, P); for (const lx of [cx - 3, cx + 4]) g.rect(lx, by + 2, 2, 2, P.b); g.line(cx + 8 * B, by, cx + 9.5 * B, by - 2, P.b); for (let x = cx - 9 * B; x < cx - 3; x += 2) g.set(x, by, PXC.white); for (let x = cx - 2; x < cx + 7; x += 2) g.set(x, by - 2.5 * B, P.d); eyes(cx - 5 * B, cx - 4 * B, by - 2.5 * B); top = by - 4; }
    else {
      const heads = /Hydra/.test(name) ? 3 : 1, by = W * 0.72;
      g.ell(cx, by, 7 * B, 3 * B, null, P); g.ell(cx + 2, by - 1.5, 4 * B, 2, pxTone(base, 0.25), null, (x, y) => g.get(x, y) && y < by);
      for (let k = 0; k < heads; k++) { const hx = heads === 1 ? cx - 3 * B : cx - 5 + k * 5, hy = W * 0.3 + (k === 1 ? -2 : 0); g.line(hx + 1, by - 2, hx, hy + 2, P.a, P.b); g.ell(hx, hy, 2.8 * B, 2.3 * B, null, P); g.set(hx - 3 * B, hy + 1, PXC.white); g.set(hx - 1, hy - 1, eyeC); if (/Wyrm|World|Basilisk/.test(name)) g.line(hx + 1, hy - 2, hx + 3, hy - 4.5 * B, PXC.bone); }
      top = W * 0.3 - 4;
    }
  } else if (kind === 'spirit') {
    const by = W * 0.45; g.ell(cx, by, 5.5 * B, 5.5 * B, null, P); g.poly([[cx - 5.5 * B, by], [cx + 5.5 * B, by], [cx + 4 * B, by + 8 * B], [cx + 1.5, by + 6 * B], [cx - 1, by + 8.5 * B], [cx - 3, by + 6 * B], [cx - 5 * B, by + 8 * B]], P.a);
    for (let y = by; y < by + 8 * B; y++) if (g.get(cx + 4, y)) g.set(cx + 4, y, P.b);
    g.rect(cx - 3, by - 1, 2, 2, PX.out).rect(cx + 1, by - 1, 2, 2, PX.out); g.set(cx - 2, by - 1, eyeC).set(cx + 2, by - 1, eyeC);
    if (/Seraph/.test(name)) { g.poly([[cx - 5, by], [cx - 10 * B, by - 6], [cx - 9, by + 3]], '#f2ecd8').poly([[cx + 5, by], [cx + 10 * B, by - 6], [cx + 9, by + 3]], '#f2ecd8'); g.ell(cx, by - 7 * B, 3, 1, 0); g.line(cx - 3, by - 7 * B, cx + 3, by - 7 * B, '#ffe08a'); }
    if (/Djinn/.test(name)) g.set(cx, by - 5.5 * B, '#3b82c4');
    top = by - 5.5 * B;
  } else if (kind === 'golem') {
    const by = W * 0.58; g.rect(cx - 5 * B, by - 4 * B, 10 * B, 8 * B, P.a).rect(cx - 5 * B, by + 2 * B, 10 * B, 2 * B, P.b).rect(cx - 5 * B, by - 4 * B, 10 * B, 1, P.c);
    g.rect(cx - 8 * B, by - 3 * B, 3 * B, 7 * B, P.b).rect(cx + 5 * B, by - 3 * B, 3 * B, 7 * B, P.b); g.rect(cx - 3 * B, by - 8 * B, 6 * B, 4 * B, P.a).rect(cx - 3 * B, by - 8 * B, 6 * B, 1, P.c);
    g.rect(cx - 4 * B, by + 4 * B, 3 * B, 3, P.d).rect(cx + 1 * B, by + 4 * B, 3 * B, 3, P.d);
    const glow = /Magma|Smoke|Colossus|Titan/.test(name) ? '#ffb040' : /Warden|World/.test(name) ? '#8fe0a0' : '#6fd0e8';
    g.set(cx - 2, by - 6 * B, glow).set(cx + 1, by - 6 * B, glow); g.line(cx - 2, by - 2, cx + 1, by + 1, glow);
    top = by - 8 * B;
  } else {
    // humanoid
    const big = /Troll|Giant|Ogre|Yeti|King|Jarl|Brute/.test(name) ? 1.25 : /Imp|Goblin|Bandit/.test(name) ? 0.9 : 1, s = B * big, by = W * 0.42;
    const skin = /Bandit|Guard|Mummified/.test(name) ? (/Mummified/.test(name) ? '#e8dcc0' : '#e0a878') : base, SP2 = pxPal(skin);
    g.rect(cx - 4 * s, by + 3 * s, 8 * s, 6 * s, /Bandit/.test(name) ? '#4a3a3a' : SP2.b).rect(cx - 6 * s, by + 3.5 * s, 2 * s, 4.5 * s, SP2.a).rect(cx + 4 * s, by + 3.5 * s, 2 * s, 4.5 * s, SP2.a);
    g.rect(cx - 3.5 * s, by + 9 * s, 3 * s, 2.5 * s, PXC.dark).rect(cx + 0.5 * s, by + 9 * s, 3 * s, 2.5 * s, PXC.dark);
    g.ell(cx, by, 4.5 * s, 4 * s, null, SP2);
    if (/Troll|Ogre|Goblin/.test(name)) { g.set(cx - 2, by + 2 * s, PXC.white).set(cx + 2, by + 2 * s, PXC.white); g.poly([[cx - 4.5 * s, by - 1], [cx - 7 * s, by - 3], [cx - 4 * s, by + 1]], SP2.a).poly([[cx + 4.5 * s, by - 1], [cx + 7 * s, by - 3], [cx + 4 * s, by + 1]], SP2.a); }
    if (/Yeti/.test(name)) for (let x = cx - 4; x <= cx + 4; x += 2) g.set(x, by - 4 * s, '#ffffff');
    if (/Bandit/.test(name)) g.rect(cx - 4 * s, by + 0.5, 8 * s, 1.5, '#3a2a2a');
    if (/Mummified/.test(name)) for (let y = by - 3; y < by + 9 * s; y += 2) g.line(cx - 4, y, cx + 4, y + 1, '#b9ab8e');
    if (/Imp/.test(name)) g.line(cx - 3, by - 3 * s, cx - 4, by - 6 * s, PXC.dark).line(cx + 3, by - 3 * s, cx + 4, by - 6 * s, PXC.dark);
    if (/Dryad|Sprite/.test(name)) { for (const [x, y] of [[-4, -3], [-2, -5], [1, -5], [3, -4]]) g.ell(cx + x * s, by + y * s, 1.6, 1.6, PXC.leaf); }
    if (/Giant|Jarl|Frost Giant/.test(name)) g.ell(cx, by + 3 * s, 3.2 * s, 2 * s, '#e8f4f8', null, (x, y) => y >= by + 2 * s);
    g.dot(cx - 1.8 * s, by - 0.5, eyeC).dot(cx + 1.2 * s, by - 0.5, eyeC);
    g.line(cx + 6 * s, by + 8 * s, cx + 8 * s, by - 1 * s, /Troll|Ogre|Giant|Yeti/.test(name) ? '#8a5a36' : PXC.metal);
    top = by - 4 * s;
  }
  if (boss) { const t = Math.max(1, Math.floor(top) - 2), cxx = Math.floor(cx) - 3; g.rect(cxx, t + 1, 7, 2, PXC.gold); for (const x of [0, 3, 6]) g.set(cxx + x, t, PXC.gold); g.set(cxx + 3, t + 1, '#e0573a'); }
  g.outline();
  return g;
}
function monsterIcon(e, size) { const boss = !!(e.boss || e.role === 'boss' || e.world); return pxImg(`m:${e.name}:${boss ? 1 : 0}`, size || 56, () => pxMonGrid(e.name, boss), { cls: 'monpx', style: 'flex:none' }); }

// ============================================================
// GAME ICON (32×32): a folded paper gem with an ember spark
// ============================================================
function pxIconGrid() {
  const g = new PxGrid(32, 32);
  // rounded dark tile
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) { const dx = Math.max(0, Math.abs(x + 0.5 - 16) - 11), dy = Math.max(0, Math.abs(y + 0.5 - 16) - 11); const d = dx * dx + dy * dy; if (d <= 25) g.set(x, y, d > 12 && (dx > 0 || dy > 0) && d > 16 ? '#7a4a32' : x === 0 || y === 0 || x === 31 || y === 31 ? '#7a4a32' : pxMix('#4a3328', '#1d1512', y / 31)); }
  // folded gem: four facets, two tones each (paper folds)
  const T = [16, 4], L = [5, 15], R = [27, 15], B = [16, 28], M = [16, 15];
  g.poly([T, L, M], '#ffb36b').poly([T, M, R], '#e8572e').poly([L, B, M], '#c2402a').poly([M, B, R], '#8a2a1f');
  g.line(16, 5, 16, 27, '#ffd8a0'); g.line(6, 15, 26, 15, '#5a1a14');
  // inner fold
  g.poly([[16, 9], [11, 15], [16, 21], [21, 15]], '#ffe08a'); g.poly([[16, 9], [16, 21], [21, 15]], '#f0b040');
  g.set(14, 12, '#ffffff').set(13, 13, '#ffffff');
  // sparks
  for (const [x, y] of [[26, 6], [27, 5], [25, 5], [26, 4], [7, 25], [24, 26]]) g.set(x, y, '#ffe08a');
  return g;
}
const gameIcon = size => pxImg('icon', size || 48, pxIconGrid, { cls: 'gameicon', style: 'flex:none;image-rendering:pixelated' });
function pxInstallIcon() {
  try {
    const url = pxURL('icon', pxIconGrid);
    let big = url; const g = pxIconGrid(), k = 6, cv = document.createElement('canvas'); cv.width = cv.height = g.w * k; const x = cv.getContext('2d');
    if (x) { g.p.forEach((c, i) => { if (!c) return; x.fillStyle = pxTone(c, 0); x.fillRect((i % g.w) * k, Math.floor(i / g.w) * k, k, k); }); big = cv.toDataURL('image/png'); }
    for (const [rel, href] of [['icon', url], ['apple-touch-icon', big]]) { let l = document.querySelector(`link[rel="${rel}"]`); if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); } l.href = href; }
  } catch (e) { /* no DOM */ }
}
if (typeof document !== 'undefined') pxInstallIcon();
