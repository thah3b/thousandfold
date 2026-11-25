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
const PX_SKIN = { human: '#f6cfa0', elf: '#fbe0c6', dwarf: '#eab088', orc: '#9cc06a', halfling: '#f6c896', beastfolk: '#d89a6c', dragonkin: '#ec8a68', undead: '#c4cbe0', sylph: '#e2f2fa', starborn: '#d8c9f8', hollowkin: '#98a8a2' };
const PX_HAIR = ['#3a2a20', '#6b4426', '#b5762e', '#e8c870', '#f2eee6', '#a83e2c', '#2b2f44', '#6a4a8a', '#ee9ab8', '#4a7a3a'];
const PX_EYES = ['#6b3a1f', '#2f5aa8', '#3f7a32', '#a8722a', '#6a3a9a', '#3a3a4a'];
const PX_RACE_EYE = { undead: '#5fd8f0', hollowkin: '#e8fff6', starborn: '#b08aff', dragonkin: '#e8a020' };
// [outfit, accent, prop, hat, cape, robe]
const PX_CLASS = {
  warrior: ['#b8463a', '#e8c15a', 'sword', 'helm', '#7a2a24', false], archer: ['#4f8a3a', '#c9a36a', 'bow', 'feather', '#3a5a2a', false],
  mage: ['#f2ece0', '#e8c15a', 'staff', 'wizard', '#6a4ab0', true], rogue: ['#3a3a4a', '#a8463a', 'dagger', 'bandana', '#26262e', false],
  necromancer: ['#3a2a4a', '#8fe0a0', 'skullstaff', 'hood', '#1f1a2a', true], healer: ['#f2ece0', '#6fd0e8', 'orbstaff', 'circlet', '#d9a84a', true],
  farmer: ['#7a8a3a', '#c9a36a', 'scythe', 'straw', null, false], merchant: ['#8a4a8a', '#e8c15a', 'bag', 'cap', '#5a2a5a', false],
  beastmaster: ['#8a5a36', '#6aa84a', 'whip', 'fur', null, false], alchemist: ['#3a7a6a', '#e0573a', 'flask', 'goggles', null, true],
  bard: ['#c0574a', '#e8c15a', 'lute', 'feathercap', '#3a5ab0', false], monk: ['#e08a3a', '#5a3a20', null, 'headband', null, false],
  summoner: ['#5a4ab0', '#9fe2f2', 'orbstaff', 'circlet', '#2a2a6a', true], runesmith: ['#6a6a7a', '#6fd0e8', 'hammer', 'helm', '#3a4a5a', false],
  tidecaller: ['#2f6fa8', '#9fe2f2', 'trident', 'circlet', '#1f4a6a', true], wayfinder: ['#8a6a3a', '#e8c15a', 'map', 'hat', '#5a3a22', false],
};
PxGrid.prototype.layer = function (fn) { const t = new PxGrid(this.w, this.h); fn(t); t.outline(); t.p.forEach((c, i) => { if (c) this.p[i] = c; }); return this; };
const PX_HATS = {
  wizard: (g, C) => { const P = pxPal(C.o); g.poly([[9, 9], [23, 9], [20, 3], [27, 1], [18, 0.5], [13, 3]], P.a); g.poly([[17, 9], [23, 9], [20, 3], [27, 1], [22, 2.2]], P.b); g.ell(16, 10.4, 14, 2.5, null, P); g.rect(9, 7, 14, 2, PXC.gold).rect(9, 8, 14, 1, PXC.goldD); for (const x of [11, 20]) g.set(x, 7, '#fff3b0'); g.poly([[16, 5], [18.6, 8], [16, 11], [13.4, 8]], '#3b82e4'); g.set(15, 7, '#cfeaff').set(16, 9, '#2a5aa8'); },
  helm: (g, C) => { const M = pxPal(PXC.metal); g.ell(16, 11.5, 12, 8.4, null, M, (x, y) => y <= 12); g.rect(4, 10, 3, 9, M.b).rect(25, 10, 3, 9, M.b).rect(4, 10, 1, 9, M.c); g.rect(4, 12, 24, 1, M.d); g.rect(15, 4, 2, 8, C.a).set(15, 5, '#fff3b0'); g.ell(18, 2.4, 4, 2, null, pxPal(C.a)); },
  hood: (g, C) => { const P = pxPal(C.o), inHead = (x, y) => pxInHead(x, y, -0.6); g.ell(16, 14.5, 13.4, 12.8, null, P, (x, y) => y <= 26 && (y <= 9 || !inHead(x, y))); for (let x = 6; x < 27; x++) if (inHead(x, 10)) g.set(x, 10, P.d); g.set(16, 3, P.c).set(14, 4, P.c); },
  bandana: (g, C) => { const P = pxPal(C.a); g.rect(5, 9, 23, 3, P.a).rect(5, 11, 23, 1, P.b); g.poly([[25, 10], [30, 13], [28, 15]], P.b).poly([[25, 10], [29, 9], [30, 12]], P.a); },
  circlet: (g, C) => { g.rect(5, 9, 23, 1, PXC.gold).rect(5, 10, 23, 1, PXC.goldD); g.poly([[16, 7], [18, 9.5], [16, 12], [14, 9.5]], C.a); g.set(15, 9, '#ffffff'); },
  straw: (g, C) => { const W = pxPal('#e8c878'); g.ell(16, 10.6, 15.5, 2.6, null, W); g.ell(16, 7, 7.5, 4.6, null, W, (x, y) => y <= 9); g.rect(9, 8, 15, 2, '#b8463a'); for (let x = 3; x < 30; x += 3) g.set(x, 11, W.b); },
  cap: (g, C) => { const P = pxPal(C.o); g.ell(16, 9.8, 11.6, 7, null, P, (x, y) => y <= 10); g.poly([[16, 9], [29, 10], [28, 12.5], [16, 11.5]], P.b); g.set(16, 3, C.a).set(17, 3, C.a); },
  fur: (g, C) => { const P = pxPal('#9a7250'); g.ell(16, 9.5, 12.6, 7.4, null, P, (x, y) => y <= 11); for (let x = 4; x <= 28; x += 2) g.ell(x, 11.5, 1.4, 1.4, '#efe4c8'); g.set(10, 5, P.d).set(20, 4, P.d); },
  goggles: (g, C) => { g.rect(4, 9, 25, 2, '#5e3b22'); for (const x of [11, 21]) { g.ell(x, 9.6, 3.2, 2.8, '#8a6a40'); g.ell(x, 9.6, 2.1, 1.8, '#9fe2f2'); g.set(x - 1, 9, '#ffffff'); } },
  feathercap: (g, C) => { PX_HATS.cap(g, C); g.poly([[21, 6], [29, 0], [31, 1], [23, 8]], C.a); g.line(22, 7, 30, 1, pxTone(C.a, -0.3)); },
  feather: (g, C) => { g.poly([[22, 10], [27, 1], [30, 2], [25, 11]], '#f2ece0'); g.line(23, 10, 28, 2, '#c0574a'); },
  headband: (g, C) => { g.rect(5, 9, 23, 2, '#c0574a').rect(5, 10, 23, 1, '#8a3a30'); g.poly([[25, 10], [30, 14], [28, 16]], '#a8463a').poly([[25, 10], [31, 11], [30, 13]], '#c0574a'); },
  hat: (g, C) => { const P = pxPal('#6b4a32'); g.ell(16, 10.4, 15, 2.4, null, P); g.ell(16, 7, 7, 4.6, null, P, (x, y) => y <= 9); g.rect(9, 8, 15, 1, C.a); g.poly([[21, 8], [27, 3], [28, 4], [23, 9]], '#c0574a'); },
  lamp: (g, C) => { const P = pxPal('#e0c068'); g.ell(16, 10.5, 12, 7.6, null, P, (x, y) => y <= 11); g.rect(4, 11, 24, 1, '#a8822e'); g.rect(13, 7, 6, 3, '#5a5a6a'); g.ell(16, 6, 2.4, 2.4, '#fff6a0'); g.set(15, 5, '#ffffff'); },
  turban: (g, C) => { const P = pxPal('#e8dcc0'); g.ell(16, 9, 12.5, 7.6, null, P, (x, y) => y <= 11); g.line(6, 10, 24, 3, '#c9b890').line(8, 11, 26, 5, '#c9b890'); g.ell(16, 6.5, 1.8, 1.8, '#3b82c4'); g.set(15, 6, '#cfeaff'); },
  wide: (g, C) => { const P = pxPal('#4a4038'); g.ell(16, 10.4, 15.5, 2.4, null, P); g.ell(16, 7.4, 6.5, 4.2, null, P, (x, y) => y <= 9); },
  crown: (g, C) => { g.rect(9, 5, 15, 4, PXC.gold).rect(9, 8, 15, 1, PXC.goldD); for (const x of [9, 13.5, 18.5, 23]) g.poly([[x - 1, 5], [x + 0.5, 1], [x + 2, 5]], PXC.gold); g.set(12, 6, '#e0573a').set(16, 6, '#3b82c4').set(20, 6, '#e0573a'); },
};
const PX_PROPS = {
  staff: (g, C) => { g.line(10, 35, 5, 9, PXC.wood, PXC.woodD); g.rect(3, 8, 5, 2, PXC.gold); g.ell(5, 4.5, 3.4, 3.4, null, pxPal(C.a === PXC.gold ? '#7fe8d8' : C.a)); g.set(4, 3, '#ffffff').set(3, 4, '#ffffff'); },
  orbstaff: (g, C) => { g.line(10, 35, 5, 9, '#e8dcc0', '#b9ab8e'); g.poly([[2, 9], [5, 7], [8, 9], [5, 11]], PXC.gold); g.ell(5, 4.5, 3.6, 3.6, null, pxPal(C.a)); g.set(4, 3, '#ffffff').set(3, 4, '#ffffff'); },
  skullstaff: (g, C) => { g.line(10, 35, 5, 9, '#4a3a4a', '#2a2030'); g.ell(5, 5, 3.6, 3.2, null, pxPal(PXC.bone)); g.rect(3, 5, 2, 2, PXC.dark).rect(6, 5, 2, 2, PXC.dark); g.set(3, 5, C.a).set(6, 5, C.a); g.rect(4, 8, 3, 1, PXC.boneD); },
  sword: (g, C) => { const M = pxPal(PXC.metal); g.line(8, 25, 2, 6, M.a, M.b); g.line(7, 24, 2, 8, M.c); g.line(4, 28, 11, 24, C.a, pxTone(C.a, -0.3)); g.line(9, 28, 11, 32, PXC.woodD); g.set(11, 32, C.a); },
  dagger: (g, C) => { const M = pxPal(PXC.metal); g.line(8, 26, 4, 17, M.a, M.b); g.line(6, 28, 11, 26, C.a); g.line(9, 29, 10, 31, PXC.woodD); },
  hammer: (g, C) => { const M = pxPal('#9aa0ac'); g.line(10, 34, 6, 12, PXC.wood, PXC.woodD); g.rect(1, 6, 11, 7, M.a).rect(1, 6, 11, 1, M.c).rect(1, 12, 11, 1, M.d).rect(9, 7, 3, 5, M.b); g.rect(5, 8, 2, 3, C.a); },
  bow: (g, C) => { for (let y = 10; y <= 34; y++) { const x = Math.round(8 - 6 * Math.sin(Math.PI * (y - 10) / 24)); g.set(x, y, PXC.wood).set(x + 1, y, PXC.woodD); } g.line(8, 10, 8, 34, '#f2ece0'); g.rect(1, 21, 3, 3, C.a); },
  trident: (g, C) => { const M = pxPal(PXC.metal); g.line(10, 35, 6, 8, M.b, M.d); g.rect(1, 7, 10, 2, M.a); for (const x of [1, 5, 9]) g.rect(x, 1, 2, 6, M.a).set(x, 1, M.c); g.ell(6, 10, 1.6, 1.6, C.a); },
  scythe: (g, C) => { g.line(10, 35, 6, 3, PXC.wood, PXC.woodD); g.poly([[7, 2], [1, 2], [0, 9], [3, 5], [8, 5]], PXC.metal); g.line(1, 3, 6, 3, '#ffffff'); },
  bag: (g, C) => { g.ell(5, 29.5, 4.6, 4.2, null, pxPal('#b08454')); g.rect(3, 24, 5, 2, '#b08454').rect(3, 25, 5, 1, '#6b4426'); g.rect(4, 29, 2, 2, PXC.gold); },
  whip: (g, C) => { g.line(10, 30, 7, 25, PXC.wood, PXC.woodD); g.line(7, 25, 3, 18, '#6b4426').line(3, 18, 1, 26, '#6b4426').line(1, 26, 4, 33, '#6b4426'); },
  flask: (g, C) => { g.rect(4, 20, 3, 4, PXC.glass).rect(4, 18, 3, 2, PXC.cork); g.ell(5.5, 27.5, 4.2, 4.2, PXC.glass); g.ell(5.5, 27.5, 4.2, 4.2, null, pxPal(C.a), (x, y) => y >= 27); g.set(3, 25, '#ffffff').set(3, 26, '#ffffff'); },
  lute: (g, C) => { g.line(5, 23, 2, 10, PXC.woodD, '#3a2414'); g.rect(1, 9, 3, 2, PXC.woodD); g.ell(5.5, 28.5, 4.6, 5, null, pxPal('#c89058')); g.ell(5.5, 27.5, 1.4, 1.4, '#4a2a14'); g.rect(3, 31, 5, 1, '#6b4426'); },
  map: (g, C) => { g.rect(1, 24, 9, 7, '#ecd9a8').rect(1, 24, 1, 7, '#c9b07a').rect(9, 24, 1, 7, '#c9b07a'); g.set(3, 26, '#a8463a').set(4, 27, '#a8463a').set(6, 28, '#a8463a').set(7, 27, '#c0574a').set(8, 26, '#c0574a').set(7, 25, '#c0574a').set(8, 28, '#c0574a'); },
};
// look = { race, gender, cls, hair, eye, outfit, accent, hat, prop, cape, mark, beard, elder }
const PX_HEAD = [16, 14.8, 10.6, 9.4];
const pxInHead = (x, y, pad) => ((x + 0.5 - PX_HEAD[0]) / (PX_HEAD[2] + (pad || 0))) ** 2 + ((y + 0.5 - PX_HEAD[1]) / (PX_HEAD[3] + (pad || 0))) ** 2 <= 1;
function pxChibiGrid(look) {
  const g = new PxGrid(32, 36), L = look, sk = PX_SKIN[L.race] || PX_SKIN.human, cl = PX_CLASS[L.cls] || PX_CLASS.warrior;
  const o = L.outfit || cl[0], ac = L.accent || cl[1], hair = L.hair || '#3a2a20', robe = L.robe !== undefined ? L.robe : cl[5];
  const cape = L.cape !== undefined ? L.cape : cl[4], C = { o, a: ac }, S = pxPal(sk), H = pxPal(hair), O = pxPal(o), A = pxPal(ac);
  const female = L.gender === 'Female', boot = pxPal('#7a4e2c'), eyeC = PX_RACE_EYE[L.race] || L.eye || PX_EYES[0];
  const hat = L.hat === undefined ? cl[3] : L.hat, prop = L.prop === undefined ? cl[2] : L.prop, sparkles = [];
  if (L.race === 'sylph') g.layer(t => { for (const x of [4, 28]) { t.ell(x, 26, 4, 6.5, '#cfeefa'); t.ell(x, 26, 2.2, 4.5, '#eefaff'); } });
  if (cape) g.layer(t => { const P = pxPal(cape); t.poly([[10, 24], [22, 24], [27, 34.5], [5, 34.5]], P.a); t.poly([[17, 24], [22, 24], [27, 34.5], [19, 34.5]], P.b); t.rect(6, 33, 21, 1, P.d); });
  if (female) g.layer(t => t.ell(16, 19, 12.6, 12.5, null, H, (x, y) => y >= 12 && y <= 31));
  if (prop && PX_PROPS[prop]) g.layer(t => PX_PROPS[prop](t, C));
  if (/staff/.test(prop || '')) sparkles.push([1, 1], [9, 2], [0, 7], [10, 6]);
  // legs and torso
  g.layer(t => {
    if (robe) { t.poly([[10.5, 29], [21.5, 29], [24, 33.5], [8, 33.5]], O.a); t.poly([[16, 29], [21.5, 29], [24, 33.5], [18, 33.5]], O.b); t.rect(8, 32, 16, 2, A.a).rect(8, 33, 16, 1, A.b); t.rect(15, 29, 2, 3, A.a); t.rect(10, 34, 4, 1, boot.a).rect(18, 34, 4, 1, boot.b); }
    else { const pn = pxPal(pxTone(o, -0.45)); t.rect(12, 29, 3, 3, pn.a).rect(17, 29, 3, 3, pn.b); t.rect(11, 31, 4, 4, boot.a).rect(17, 31, 4, 4, boot.b).rect(11, 31, 4, 1, boot.c).rect(17, 31, 4, 1, boot.c).rect(11, 34, 4, 1, boot.d).rect(17, 34, 4, 1, boot.d); }
    t.rect(11, 23, 10, 7, O.a).rect(18, 23, 3, 7, O.b).rect(11, 24, 10, 1, O.c);
    t.poly([[12.5, 23], [19.5, 23], [16, 27.5]], A.a); t.poly([[14, 23], [18, 23], [16, 25.6]], S.b);
    if (robe) { t.rect(15, 26, 2, 2, '#4fa8e8'); t.set(15, 26, '#cfeaff'); }
    t.rect(11, 28, 10, 2, '#6b4426').rect(11, 29, 10, 1, '#4a2e18'); t.rect(15, 28, 2, 2, PXC.gold);
  });
  // arms and hands
  g.layer(t => { t.rect(8, 24, 3, 5, O.a).rect(8, 24, 1, 5, O.c).rect(8, 28, 3, 1, A.a); t.rect(21, 24, 3, 5, O.b).rect(21, 28, 3, 1, A.b); t.ell(9.5, 30, 1.9, 1.7, S.a); t.ell(22.5, 30, 1.9, 1.7, S.b); });
  // head and face
  g.layer(t => {
    if (L.race === 'elf') { t.poly([[7, 13], [0, 8], [7, 18]], S.a).poly([[25, 13], [32, 8], [25, 18]], S.b); t.line(5, 13, 2, 10, S.b).line(27, 13, 30, 10, S.d); }
    else { t.ell(5.5, 16.5, 1.6, 2.2, S.b); t.ell(26.5, 16.5, 1.6, 2.2, S.b); }
    t.ell(PX_HEAD[0], PX_HEAD[1], PX_HEAD[2], PX_HEAD[3], S.a);
    for (let y = 5; y < 25; y++) for (let x = 5; x < 28; x++) { if (!pxInHead(x, y)) continue; const nx = (x + 0.5 - 16) / 10.6, ny = (y + 0.5 - 14.8) / 9.4; if (!pxInHead(x, y, -1.2) && (nx > 0.35 || ny > 0.6)) t.set(x, y, S.b); else if (nx < -0.45 && ny < -0.2) t.set(x, y, S.c); }
    const lt = pxTone(eyeC, 0.4), dk = pxTone(eyeC, -0.45);
    for (const x0 of [10, 19]) {
      t.rect(x0, 14, 4, 1, PX.out); if (female) t.set(x0 === 10 ? 9 : 23, 13, PX.out).set(x0 === 10 ? 9 : 23, 14, PX.out);
      t.rect(x0, 15, 4, 3, eyeC).rect(x0 + 3, 15, 1, 2, dk).rect(x0, 18, 4, 1, lt);
      t.set(x0, 15, '#ffffff').set(x0 + 1, 15, '#ffffff').set(x0, 16, '#ffffff').set(x0 + 2, 17, lt);
      if (L.race === 'hollowkin') { t.rect(x0, 15, 4, 4, '#26302c'); t.rect(x0 + 1, 16, 2, 2, eyeC); }
      if (L.race === 'undead') t.set(x0, 15, eyeC).set(x0 + 1, 15, '#ffffff');
    }
    if (!['undead', 'hollowkin'].includes(L.race)) { t.rect(7, 19, 3, 1, '#f39696'); t.rect(22, 19, 3, 1, '#f39696'); }
    t.set(15, 20, '#a8503a').set(16, 20, '#a8503a').set(14, 19, S.b).set(17, 19, S.b);
    if (L.race === 'orc') { t.rect(13, 19, 1, 2, PXC.white); t.rect(18, 19, 1, 2, PXC.white); }
    if (L.race === 'undead') { t.line(22, 20, 25, 21, '#6a6a8a'); t.set(23, 19, '#6a6a8a').set(24, 22, '#6a6a8a'); }
    if (L.race === 'dragonkin') { for (const [x, y] of [[7, 17], [8, 18], [6, 18], [24, 17], [23, 18], [25, 18]]) t.set(x, y, S.d); }
    const mk = L.mark;
    if (mk === 'Old scar') t.line(22, 15, 24, 20, '#c45a5a');
    if (mk === 'Warpaint') { t.rect(7, 19, 4, 1, '#b8463a').rect(21, 19, 4, 1, '#b8463a'); }
    if (mk === 'Freckles') { for (const [x, y] of [[8, 20], [10, 20], [9, 21], [22, 20], [24, 20], [23, 21]]) t.set(x, y, S.d); }
    if (mk === 'Runic tattoo') { t.set(25, 14, '#6fd0e8').set(25, 16, '#6fd0e8').set(24, 15, '#6fd0e8'); }
    if (mk === 'Birthmark') t.set(21, 21, S.d);
  });
  if (L.beard || (L.race === 'dwarf' && !female)) g.layer(t => { const B = pxPal(L.elder ? '#f2eee6' : hair); t.ell(16, 22, 8, 5.5, null, B, (x, y) => y >= 19); t.rect(11, 19, 10, 1, B.a); t.set(15, 22, B.b).set(17, 23, B.b).set(13, 21, B.c); });
  // hair: a rounded cap and chunky bangs
  g.layer(t => {
    t.ell(16, 11.6, 11.5, 8.2, null, H, (x, y) => y <= 12);
    t.rect(6, 10, 21, 2, H.a);
    const side = female ? 24 : 19;
    const locks = [[5, 9.5, 6, side], [8, 13, 10.5, 14], [12, 17, 15, 15.5], [15.5, 20, 17.5, 14], [19, 24, 21.5, 14], [22.5, 27, 26, side]];
    for (const [x0, x1, tx, ty] of locks) t.poly([[x0, 11], [x1, 11], [tx, ty]], tx > 16 ? H.b : H.a);
    t.rect(5, 12, 3, side - 15, H.a).rect(5, 12, 1, side - 15, H.c).rect(25, 12, 3, side - 15, H.b);
    t.set(10, 6, H.c).set(11, 5, H.c).set(12, 5, H.c).set(9, 7, H.c);
    if (L.race === 'beastfolk') { t.poly([[6, 9], [7, 0], [12, 5]], H.a).poly([[20, 5], [25, 0], [26, 9]], H.b); t.poly([[7.6, 7], [8, 2.5], [10.6, 5]], '#f3a8a8').poly([[21.4, 5], [24, 2.5], [24.4, 7]], '#f3a8a8'); }
    if (L.race === 'dragonkin') { t.line(9, 5, 6, 0, PXC.bone, PXC.boneD); t.line(22, 5, 25, 0, PXC.bone, PXC.boneD); }
  });
  if (hat && PX_HATS[hat]) g.layer(t => PX_HATS[hat](t, C));
  if (L.race === 'starborn') sparkles.push([26, 5], [25, 4], [27, 4], [26, 3]);
  for (const [x, y] of sparkles) g.set(x, y, L.race === 'starborn' && y < 6 && x > 20 ? '#ffe89a' : pxTone(ac === PXC.gold ? '#7fe8d8' : ac, 0.4));
  return g;
}
function pxChibi(look, size, opt) {
  const k = 'c2:' + [look.race, look.gender, look.cls, look.hair, look.eye, look.outfit, look.accent, look.hat, look.prop, look.cape, look.robe, look.mark, look.beard, look.elder].join('|');
  const o = opt || {}; return pxImg(k, size, () => pxChibiGrid(look), { ...o, h: o.h || Math.round(size * 36 / 32) });
}
// A player character's look.
function pxLookOf(c) {
  const h = pxHash(c.name || '?');
  return { race: c.race || 'human', gender: c.gender || 'Male', cls: c.cls || 'warrior', hair: c.race === 'undead' ? '#d9d4c8' : PX_HAIR[h % PX_HAIR.length], eye: PX_EYES[(h >>> 5) % PX_EYES.length], mark: c.mark };
}
// NPCs: a stable look from the name, with a few role hats.
const PX_NPC_ROLES = [[/Elder/, { hat: null, beard: true, elder: true, hair: '#e8e4d8', outfit: '#8a3a2a', prop: 'staff' }], [/Warden/, { hat: 'hood', outfit: '#3f6a32', prop: 'bow' }], [/Foreman/, { hat: 'lamp', outfit: '#6a5a4a', prop: 'hammer' }], [/Ferryman/, { hat: 'wide', outfit: '#4a5a5a', prop: 'staff' }], [/Caravaneer/, { hat: 'turban', outfit: '#c08850', prop: 'bag' }], [/Huntress|Hunter/, { hat: 'fur', outfit: '#6b4a32', prop: 'bow' }], [/Ser |Sir |Knight|Paladin/, { hat: 'helm', prop: 'sword' }], [/King|Queen|Jarl/, { hat: 'crown' }], [/Brother|Sister|Mother|Father/, { hat: 'hood' }]];
function pxNpcLook(name, cls) {
  const h = pxHash(name), races = RACES.filter(r => !r.secret).map(r => r.id);
  const base = { race: races[h % races.length], gender: (h >>> 4) % 2 ? 'Female' : 'Male', cls: cls || CLASSES[(h >>> 6) % CLASSES.length].id, hair: PX_HAIR[(h >>> 9) % PX_HAIR.length], eye: PX_EYES[(h >>> 12) % PX_EYES.length] };
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
