// ============================================================
// v3.0 — Wardrobe+ sprite parts: hair styles, beards, face pieces,
// back pieces (wings, balloons…), outfit patterns, pose faces,
// plus new hats and held items. All original pixel art.
// Grid 32×36. Head ellipse (16,14.8) r 10.6×9.4; eyes at x 10–13 and
// 19–22, rows 14–18; mouth row 20; torso x 11–20, rows 23–29.
// ============================================================
const pxMir = pts => pts.map(([x, y]) => [32 - x, y]);
const pxBoth = (t, pts, col) => { t.poly(pts, col); t.poly(pxMir(pts), col); };
// The classic cap + bangs, with side locks down to row `side`.
function pxHairBase(t, H, side) {
  t.ell(16, 11.6, 11.5, 8.2, null, H, (x, y) => y <= 12);
  t.rect(6, 10, 21, 2, H.a);
  const locks = [[5, 9.5, 6, side], [8, 13, 10.5, 14], [12, 17, 15, 15.5], [15.5, 20, 17.5, 14], [19, 24, 21.5, 14], [22.5, 27, 26, side]];
  for (const [x0, x1, tx, ty] of locks) t.poly([[x0, 11], [x1, 11], [tx, ty]], tx > 16 ? H.b : H.a);
  t.rect(5, 12, 3, side - 15, H.a).rect(5, 12, 1, side - 15, H.c).rect(25, 12, 3, side - 15, H.b);
  t.set(10, 6, H.c).set(11, 5, H.c).set(12, 5, H.c).set(9, 7, H.c);
}
const pxCap = (t, H, maxY) => t.ell(16, 11.6, 11.5, 8.2, null, H, (x, y) => y <= (maxY || 11));
const PX_HAIRSTYLES = {
  short: { front: (t, H) => pxHairBase(t, H, 19) },
  long: { back: (t, H) => t.ell(16, 19, 12.6, 12.5, null, H, (x, y) => y >= 12 && y <= 31), front: (t, H) => pxHairBase(t, H, 24) },
  spiky: { front: (t, H) => { for (const p of [[[5, 10], [2, 2], [10, 6]], [[9, 7], [9, -1], [15, 5]], [[14, 6], [17, -1], [20, 6]], [[19, 6], [25, 0], [25, 9]], [[24, 9], [31, 4], [27, 12]]]) t.poly(p, H.a); pxHairBase(t, H, 17); t.set(9, 1, H.c).set(17, 0, H.c); } },
  bob: { front: (t, H) => { pxCap(t, H, 12); t.rect(5, 11, 4, 10, H.a).rect(24, 11, 4, 10, H.b).rect(5, 11, 1, 10, H.c); t.set(5, 20, 0).set(27, 20, 0); t.rect(6, 10, 21, 3, H.a).rect(6, 12, 21, 1, H.b); t.set(11, 6, H.c).set(12, 5, H.c); } },
  ponytail: { back: (t, H) => { t.ell(28, 19, 3.2, 8, null, H); t.set(28, 26, H.b); }, front: (t, H) => { pxHairBase(t, H, 18); t.rect(25, 11, 3, 2, '#c0574a'); } },
  buns: { front: (t, H) => { pxHairBase(t, H, 18); t.ell(7, 5, 3.6, 3.4, null, H); t.ell(25, 5, 3.6, 3.4, null, H); } },
  mohawk: { front: (t, H) => { t.ell(16, 11.6, 11.3, 8, null, { a: H.d, b: H.d, c: H.b }, (x, y) => y <= 8); t.poly([[12, 10], [20, 10], [21, 3], [19, 0], [17, 2], [15, -1], [13, 2], [11, 3]], H.a); t.line(14, 2, 14, 9, H.c); } },
  bald: { front: (t, H) => { } },
  braids: { back: (t, H) => t.ell(16, 18, 12.4, 10, null, H, (x, y) => y >= 12 && y <= 25), front: (t, H) => { pxHairBase(t, H, 21); for (const x of [4.5, 27.5]) { for (let y = 22; y <= 30; y += 2.5) t.ell(x, y, 1.9, 1.5, null, H); t.rect(Math.floor(x) - 1, 31, 3, 1, PXC.gold); } } },
  curly: { front: (t, H) => { pxCap(t, H, 10); for (let x = 6; x <= 26; x += 3) t.ell(x, 9.5 + (x % 2), 2.3, 2.2, null, H); for (const [x, y] of [[6, 14], [6, 18], [26, 14], [26, 18], [5.5, 22], [26.5, 22]]) t.ell(x, y, 2.1, 2.1, null, H); t.set(10, 5, H.c).set(14, 4, H.c); } },
  slick: { front: (t, H) => { t.ell(16, 11, 11.4, 7.4, null, H, (x, y) => y <= 10); t.poly([[12, 9.5], [20, 9.5], [16, 12.6]], H.a); t.rect(5, 10, 2, 6, H.a).rect(26, 10, 2, 6, H.b); t.line(10, 5, 14, 9, H.c).line(19, 4, 22, 8, H.c); } },
  topknot: { front: (t, H) => { pxHairBase(t, H, 18); t.ell(16, 2.2, 3, 2.4, null, H); t.rect(14, 4, 5, 1, '#c0574a'); } },
  afro: { back: (t, H) => t.ell(16, 12, 15.2, 11.6, null, H, (x, y) => y <= 23), front: (t, H) => { pxCap(t, H, 10); t.rect(4, 10, 4, 9, H.a).rect(25, 10, 4, 9, H.b); for (const [x, y] of [[9, 3], [14, 1], [20, 2], [25, 5], [5, 8], [27, 11]]) t.set(x, y, H.c); } },
  sidepart: { front: (t, H) => { pxCap(t, H, 11); t.poly([[5, 10], [27, 9], [27, 12], [18, 13], [9, 16], [5, 18]], H.a); t.poly([[18, 12], [27, 11], [26, 15]], H.b); t.rect(5, 12, 3, 6, H.a).rect(25, 12, 3, 4, H.b); t.line(9, 7, 20, 6, H.c); } },
};
// Beards: B = palette of the hair colour. flat = drawn without an outline.
const PX_BEARDS = {
  stubble: Object.assign((g, B) => { for (let x = 8; x <= 24; x++) for (let y = 20; y <= 24; y++) if ((x + y) % 2 === 0 && pxInHead(x, y, -0.4) && (y >= 21 || x < 12 || x > 20)) g.set(x, y, B.b); }, { flat: true }),
  moustache: (t, B) => { t.rect(12, 19, 8, 1, B.a).set(11, 20, B.a).set(20, 20, B.a).set(15, 19, B.b); },
  goatee: (t, B) => { t.rect(13, 19, 6, 1, B.a); t.rect(14, 21, 4, 3, B.a).set(15, 24, B.a).set(16, 24, B.b).set(17, 22, B.b); },
  short: (t, B) => { t.ell(16, 21.4, 7.6, 3.4, null, B, (x, y) => y >= 20); t.rect(12, 19, 8, 1, B.a); t.set(15, 21, '#7a3a2a').set(16, 21, '#7a3a2a'); },
  full: (t, B) => { t.ell(16, 21.6, 7.6, 4.3, null, B, (x, y) => y >= 19); t.rect(11, 19, 10, 1, B.a); t.set(15, 21, '#7a3a2a').set(16, 21, '#7a3a2a').set(13, 22, B.c).set(18, 23, B.b); },
  big: (t, B) => { t.ell(16, 22, 8, 5.5, null, B, (x, y) => y >= 19); t.rect(11, 19, 10, 1, B.a); t.set(15, 22, B.b).set(17, 23, B.b).set(13, 21, B.c); },
  long: (t, B) => { PX_BEARDS.full(t, B); t.poly([[10, 23], [22, 23], [16, 32]], B.a); t.line(14, 24, 15, 29, B.b).line(18, 24, 17, 29, B.b); t.set(13, 24, B.c); },
  braided: (t, B) => { PX_BEARDS.full(t, B); for (const x of [13, 18]) { for (let y = 25; y <= 29; y += 2) t.rect(x, y, 2, 2, y % 4 === 1 ? B.a : B.b); t.rect(x, 30, 2, 1, PXC.gold); } },
  chops: (t, B) => { t.ell(7.6, 20.6, 2.3, 3.2, null, B); t.ell(24.4, 20.6, 2.3, 3.2, null, B); t.rect(10, 20, 4, 1, B.a).rect(18, 20, 4, 1, B.b).rect(13, 19, 6, 1, B.a); },
};
// Face pieces. flat = thin overlays drawn without an outline.
const pxFlat = fn => Object.assign(fn, { flat: true });
const PX_FACES = {
  glasses: pxFlat((g) => { const k = '#2a2a34'; for (const x0 of [10, 19]) { g.rect(x0 - 1, 13, 6, 1, k).rect(x0 - 1, 19, 6, 1, k).rect(x0 - 1, 13, 1, 7, k).rect(x0 + 4, 13, 1, 7, k); } g.rect(14, 15, 5, 1, k); }),
  roundglasses: pxFlat((g) => { const k = PXC.goldD; for (const x0 of [10, 19]) { g.rect(x0, 13, 4, 1, k).rect(x0, 19, 4, 1, k).rect(x0 - 1, 14, 1, 5, k).rect(x0 + 4, 14, 1, 5, k); } g.rect(14, 15, 5, 1, k); }),
  sunglasses: pxFlat((g) => { for (const x0 of [9, 18]) { g.rect(x0, 14, 6, 4, '#1a1a22').rect(x0 + 1, 18, 4, 1, '#1a1a22'); g.set(x0 + 1, 15, '#6a6a7a').set(x0 + 2, 15, '#6a6a7a'); } g.rect(15, 15, 3, 1, '#1a1a22'); }),
  eyepatch: pxFlat((g) => { g.rect(19, 14, 5, 5, '#1a1a1a'); g.set(20, 15, '#3a3a3a'); g.line(6, 10, 19, 14, '#1a1a1a').line(24, 15, 27, 13, '#1a1a1a'); }),
  monocle: pxFlat((g) => { const k = PXC.gold; g.rect(19, 13, 4, 1, k).rect(19, 19, 4, 1, k).rect(18, 14, 1, 5, k).rect(23, 14, 1, 5, k); g.line(23, 20, 25, 26, PXC.goldD); }),
  domino: pxFlat((g, C) => { const m = '#2a2440', eye = (x, y) => y >= 14 && y <= 18 && ((x >= 10 && x <= 13) || (x >= 19 && x <= 22)); for (let y = 13; y <= 19; y++) for (let x = 7; x <= 25; x++) if (!eye(x, y) && pxInHead(x, y) && !(y === 19 && (x < 9 || x > 23)) && !(y >= 18 && x >= 14 && x <= 18)) g.set(x, y, y === 13 ? pxTone(m, 0.25) : m); }),
  ninja: pxFlat((g, C) => { const m = pxTone(C.o, -0.15); for (let y = 19; y <= 25; y++) for (let x = 4; x <= 28; x++) if (pxInHead(x, y)) g.set(x, y, y === 19 ? pxTone(m, 0.25) : m); g.line(13, 21, 19, 21, pxTone(m, -0.3)); }),
  fangs: pxFlat((g) => { g.set(14, 21, '#ffffff').set(17, 21, '#ffffff'); }),
  plaster: pxFlat((g) => { g.rect(21, 20, 4, 2, '#f2d6b0'); g.set(22, 20, '#d8b890').set(23, 21, '#d8b890'); }),
  heartcheeks: pxFlat((g) => { for (const x of [7, 22]) { g.set(x, 19, '#ff5a8a').set(x + 2, 19, '#ff5a8a').rect(x, 20, 3, 1, '#ff5a8a').set(x + 1, 21, '#ff5a8a'); } }),
  starpaint: pxFlat((g) => { const k = '#ffd23a'; g.set(23, 18, k).rect(22, 19, 3, 1, k).set(23, 20, k); g.set(8, 19, '#6fd0e8').set(9, 20, '#6fd0e8'); }),
  clownnose: (t) => { t.ell(16, 19, 1.8, 1.6, '#e8302a'); t.set(15, 18, '#ff9a9a'); },
};
// Back pieces: drawn behind everything.
const PX_BACKS = {
  batwings: (t) => { const W = '#3a2a3a', M = '#5a3a5a', p = [[11, 22], [2, 12], [0, 25], [3, 22], [4, 28], [7, 24], [9, 29]]; pxBoth(t, p, W); pxBoth(t, [[10, 22], [3, 14], [2, 22], [5, 21], [6, 25]], M); t.line(10, 22, 2, 12, '#1f141f'); t.line(22, 22, 30, 12, '#1f141f'); },
  angelwings: (t) => { for (const [x, y, rx, ry] of [[5, 18, 5, 6.5], [3, 24, 3.2, 5], [6, 27, 2.6, 3.6]]) { t.ell(x, y, rx, ry, null, pxPal('#f6f2ea')); t.ell(32 - x, y, rx, ry, null, pxPal('#f6f2ea')); } for (const x of [3, 5, 27, 29]) t.line(x, 14, x, 26, '#d8d2c8'); },
  fairywings: (t) => { for (const s of [1, -1]) { const X = x => s > 0 ? x : 32 - x; t.ell(X(5), 18, 4.6, 6.2, '#c9f0ff'); t.ell(X(5.5), 28, 3, 3.8, '#f6d0ff'); t.ell(X(5), 18, 2.4, 3.8, '#eafaff'); t.set(X(4), 15, '#ffffff').set(X(6), 27, '#ffffff'); } },
  butterfly: (t) => { for (const s of [1, -1]) { const X = x => s > 0 ? x : 32 - x; t.ell(X(4.5), 18, 4.8, 6, '#ff9a3a'); t.ell(X(5.5), 28, 3.4, 4, '#e8572e'); t.ell(X(3.5), 17, 1.4, 1.4, '#2a1a10'); t.set(X(5), 21, '#fff3b0').set(X(3), 14, '#fff3b0').set(X(5), 29, '#2a1a10'); } },
  dragonwings: (t) => { const p = [[11, 22], [1, 9], [3, 15], [0, 18], [3, 21], [1, 25], [5, 25], [8, 29]]; pxBoth(t, p, '#2f7a3a'); pxBoth(t, [[10, 22], [3, 12], [4, 17], [3, 20], [6, 23]], '#6fc85a'); t.line(11, 22, 1, 9, '#e8c15a'); t.line(21, 22, 31, 9, '#e8c15a'); },
  flamewings: (t) => { pxBoth(t, [[11, 22], [1, 8], [4, 15], [0, 17], [4, 21], [1, 26], [8, 28]], '#e8572e'); pxBoth(t, [[10, 22], [3, 12], [5, 17], [3, 20], [7, 24]], '#ffa23a'); pxBoth(t, [[9, 22], [5, 16], [6, 21]], '#ffe08a'); },
  icewings: (t) => { pxBoth(t, [[11, 21], [2, 8], [5, 18]], '#9fe2f2'); pxBoth(t, [[11, 23], [0, 18], [6, 24]], '#bfefff'); pxBoth(t, [[11, 25], [3, 30], [8, 27]], '#7ec8f0'); t.set(4, 11, '#ffffff').set(28, 11, '#ffffff'); },
  balloons: (t) => { t.line(22, 25, 29, 16, '#e8e4d8').line(22, 25, 29, 23, '#e8e4d8').line(11, 25, 3, 17, '#e8e4d8'); t.ell(29.4, 13.6, 2.5, 3.1, null, pxPal('#e8572e')); t.ell(29.6, 20.4, 2.3, 2.8, null, pxPal('#3b82e4')); t.ell(2.6, 14.4, 2.4, 3, null, pxPal('#ffd23a')); },
  backpack: (t) => { t.rect(5, 18, 22, 12, '#8a5a32').rect(5, 18, 22, 2, '#a8743a').rect(4, 22, 2, 6, '#6b4426').rect(26, 22, 2, 6, '#6b4426'); },
  quiver: (t) => { t.poly([[23, 14], [27, 13], [29, 30], [25, 31]], '#8a5a32'); t.line(24, 15, 28, 14, '#6b4426'); for (const x of [23, 25, 27]) { t.line(x, 13, x + 1, 9, '#d8d2c8'); t.set(x + 1, 8, '#e8572e'); } },
  jetpack: (t) => { for (const x of [3, 24]) { t.rect(x, 16, 5, 12, '#9aa0ac').rect(x, 16, 5, 1, '#d8dce6').rect(x + 4, 17, 1, 11, '#6a707c'); t.rect(x + 1, 28, 3, 1, '#4a4e58'); t.poly([[x + 0.5, 29], [x + 4.5, 29], [x + 2.5, 34]], '#ff9a3a'); t.set(x + 2, 30, '#ffe08a'); } },
  shell: (t) => { t.ell(16, 25, 14, 8.5, null, pxPal('#4f8a3a')); for (const [x, y] of [[4, 22], [28, 22], [3, 27], [29, 27]]) t.set(x, y, '#c9e07a'); },
  greatsword: (t) => { const M = pxPal(PXC.metal); t.line(26, 3, 7, 33, M.a, M.b); t.line(22, 4, 29, 9, PXC.gold, PXC.goldD); t.line(27, 2, 30, -1, '#5a3a22'); },
  kite: (t) => { t.poly([[28, 10], [31.5, 14], [28, 20], [24.5, 14]], '#e8572e'); t.poly([[28, 10], [31.5, 14], [28, 14]], '#ffd23a'); t.line(28, 20, 23, 28, '#e8e4d8'); t.set(29, 22, '#3b82e4').set(28, 24, '#3b82e4'); },
};
// Outfit patterns: painted straight onto the body (no outline).
function pxRecolor(g, x0, y0, x1, y1, from, to) { const map = new Map([[from.a, to.a], [from.b, to.b], [from.c, to.c], [from.d, to.d]]); for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const c = g.get(x, y); if (map.has(c)) g.set(x, y, map.get(c)); } }
const PX_PATTERNS = {
  stars: (g, C, robe) => { for (const [x, y] of [[12, 25], [19, 24], [18, 27], [9, 26], [22, 26]].concat(robe ? [[11, 31], [19, 30], [15, 32], [22, 32]] : [])) g.set(x, y, '#ffe89a'); },
  bandage: (g) => { for (let y = 23; y <= 34; y += 2) for (let x = 8; x <= 24; x++) { const c = g.get(x, y); if (c && c !== PX.out) g.set(x, y, '#cfc2a0'); } },
  split: (g, C) => { if (C.p2) pxRecolor(g, 16, 23, 24, 35, pxPal(C.o), pxPal(C.p2)); },
  plate: (g, C) => { const M = pxPal(C.o); g.rect(11, 25, 10, 1, M.d).rect(11, 27, 10, 1, M.d); g.set(13, 24, M.c).set(14, 24, M.c); for (const x of [8.5, 23.5]) { for (let y = 23; y <= 25; y++) for (let i = -2; i <= 2; i++) g.set(x + i, y, y === 23 ? M.c : M.a); } },
  tabard: (g, C) => { const T = C.p2 || '#f2ece0'; g.rect(13, 23, 6, 7, T).rect(13, 29, 6, 1, pxTone(T, -0.2)); g.rect(15, 24, 2, 5, C.a).rect(14, 25, 4, 1, C.a); },
  coat: (g, C) => { const P = pxPal(C.o); g.rect(11, 28, 10, 2, P.b); for (let y = 24; y <= 29; y += 2) g.set(16, y, PXC.gold); g.line(12, 23, 14, 27, C.a).line(20, 23, 18, 27, C.a); },
  suit: (g, C) => { const V = pxPal(C.o); g.rect(11, 23, 3, 6, V.d).rect(18, 23, 3, 6, V.d); g.poly([[13, 23], [19, 23], [16, 28]], '#f2ece0'); g.rect(15, 23, 2, 1, C.a).set(14, 23, C.a).set(17, 23, C.a); },
  fur: (g) => { for (let x = 11; x <= 20; x += 2) g.set(x, 23, '#efe4c8').set(x + 1, 24, '#d8ccb0'); for (const x of [8, 9, 10, 21, 22, 23]) g.set(x, 28, '#efe4c8'); },
  emblem: (g, C) => { const E = C.p2 || C.a; g.ell(16, 25.6, 2.6, 2.2, pxTone(E, -0.35)); g.ell(16, 25.6, 1.8, 1.4, E); g.set(17, 24, '#fff6c4').set(15, 26, pxTone(E, 0.4)).set(14, 27, pxTone(E, 0.4)); },
  gears: (g) => { g.ell(16, 25.5, 2.6, 2.6, '#e8c15a'); g.set(16, 25, '#6a4a2a').set(15, 25, '#6a4a2a'); for (const [x, y] of [[16, 22], [13, 25], [19, 25], [16, 28]]) g.set(x, y, '#e8c15a'); for (const [x, y] of [[11, 24], [20, 24], [11, 27], [20, 27]]) g.set(x, y, '#fff3b0'); },
  circuit: (g) => { const k = '#3ec6ff'; g.line(12, 24, 12, 27, k).line(12, 27, 15, 27, k).line(19, 24, 19, 26, k).line(17, 26, 19, 26, k); g.rect(14, 24, 3, 2, '#1a2a3a'); g.set(15, 24, '#7fe8ff'); },
  astro: (g) => { g.rect(13, 24, 6, 3, '#3a3a4a'); g.set(14, 25, '#e8302a').set(16, 25, '#4fc35a').set(18, 25, '#3b82e4'); g.rect(8, 25, 3, 1, '#3b82e4'); },
  collar: (g) => { for (let x = 11; x <= 20; x++) { g.set(x, 23, x % 2 ? PXC.gold : '#2a4aa8'); g.set(x, 24, x % 2 ? '#2a4aa8' : PXC.gold); } for (let x = 12; x <= 19; x++) g.set(x, 25, '#4fb0a0'); },
  lamellar: (g, C) => { const P = pxPal(C.o); for (let y = 23; y <= 28; y += 2) g.rect(11, y, 10, 1, P.d); for (let x = 12; x <= 20; x += 3) for (let y = 24; y <= 28; y += 2) g.set(x, y, PXC.gold); },
  check: (g, C) => { const P = pxPal(C.o); for (let y = 23; y <= 29; y++) for (let x = 8; x <= 23; x++) { const c = g.get(x, y); if ((c === P.a || c === P.b) && (Math.floor(x / 2) + Math.floor(y / 2)) % 2) g.set(x, y, c === P.a ? P.c : P.a); } },
  vest: (g, C) => { const V = pxPal(pxTone(C.o, -0.3)); g.rect(11, 23, 4, 6, V.a).rect(17, 23, 4, 6, V.b); g.set(13, 25, PXC.gold).set(12, 26, PXC.gold).set(14, 26, PXC.gold).set(13, 27, PXC.gold).set(13, 26, '#fff3b0'); },
  belly: (g) => { g.ell(16, 26.5, 3.6, 3.4, '#f2e0a0'); for (const y of [25, 27]) g.rect(14, y, 5, 1, '#d8c07a'); },
  sparkle: (g, C, robe) => { for (const [x, y] of [[12, 24], [19, 26], [10, 27], [22, 25]].concat(robe ? [[11, 31], [20, 32], [16, 30]] : [])) g.set(x, y, '#ffffff'); },
  frost: (g) => { for (const [x, y] of [[13, 25], [18, 24], [16, 28], [9, 26], [22, 27]]) { g.set(x, y, '#ffffff'); g.set(x + 1, y, '#dff4ff'); } },
  sash: (g, C) => { g.line(11, 23, 20, 29, C.p2 || C.a); g.line(12, 23, 20, 28, C.p2 || C.a); },
  stripes: (g, C) => { const P = pxPal(C.o), Q = pxPal(C.p2 || '#f2ece0'); for (let y = 24; y <= 34; y += 2) for (let x = 8; x <= 24; x++) { const c = g.get(x, y); if (c === P.a) g.set(x, y, Q.a); else if (c === P.b) g.set(x, y, Q.b); } },
};
// Pose faces (painted after the head).
function pxEyesShut(g, S) { for (const x0 of [10, 19]) g.rect(x0, 14, 4, 5, S.a); }
const PX_POSE_FACE = {
  sleepy: (g, S) => { pxEyesShut(g, S); for (const x0 of [10, 19]) g.rect(x0, 17, 4, 1, PX.out); g.set(15, 20, '#a8503a').set(16, 20, S.a); for (const [x, y] of [[26, 5], [27, 5], [28, 5], [27, 6], [26, 7], [27, 7], [28, 7], [29, 2], [30, 2], [30, 3], [29, 4], [30, 4]]) g.set(x, y, '#cfe3ff'); },
  happy: (g, S) => { pxEyesShut(g, S); for (const x0 of [10, 19]) g.set(x0, 17, PX.out).set(x0 + 1, 16, PX.out).set(x0 + 2, 16, PX.out).set(x0 + 3, 17, PX.out); g.rect(14, 20, 4, 2, '#8a3a2a'); g.set(15, 21, '#f08a8a').set(16, 21, '#f08a8a'); },
  love: (g, S) => { pxEyesShut(g, S); const k = '#ff4a7a'; for (const x0 of [9, 19]) { g.set(x0, 15, k).set(x0 + 1, 15, k).set(x0 + 3, 15, k).set(x0 + 4, 15, k).rect(x0, 16, 5, 1, k).rect(x0 + 1, 17, 3, 1, k).set(x0 + 2, 18, k); g.set(x0, 15, '#ffb0c8'); } for (const [x, y] of [[27, 6], [29, 6], [27, 7], [28, 7], [29, 7], [28, 8]]) g.set(x, y, k); },
  angry: (g) => { g.line(9, 12, 13, 14, PX.out).line(23, 12, 19, 14, PX.out); g.rect(14, 21, 4, 1, '#8a3a2a'); for (const [x, y] of [[25, 6], [27, 6], [26, 7], [25, 8], [27, 8]]) g.set(x, y, '#e8302a'); },
  starry: (g, S) => { pxEyesShut(g, S); const k = '#ffd23a'; for (const x0 of [10, 19]) { g.rect(x0 + 1, 14, 2, 5, k).rect(x0, 16, 4, 1, k).set(x0 + 1, 16, '#ffffff'); } g.rect(15, 20, 2, 2, '#8a3a2a'); },
  cry: (g) => { const k = '#6fc8ff'; g.line(10, 19, 10, 23, k).line(22, 19, 22, 23, k); g.set(14, 21, '#a8503a').set(15, 20, '#a8503a').set(16, 20, '#a8503a').set(17, 21, '#a8503a'); },
  both: (g) => { g.rect(15, 20, 2, 2, '#8a3a2a'); g.set(15, 21, '#f08a8a'); },
  shrug: (g) => { g.rect(14, 20, 4, 1, '#a8503a'); g.line(9, 12, 13, 12, PX.out).line(19, 12, 23, 12, PX.out); },
  think: (g) => { for (const [x, y] of [[25, 8], [28, 6], [31, 4]]) g.set(x, y, '#ffffff'); },
  peace: (g) => { g.set(14, 20, '#a8503a').set(17, 20, '#a8503a'); },
};
const S0 = '#a8503a';
// ---------- New hats ----------
Object.assign(PX_HATS, {
  starwizard: (g, C) => { PX_HATS.wizard(g, C); for (const [x, y] of [[14, 6], [19, 4], [12, 3], [22, 7]]) g.set(x, y, '#ffe89a'); },
  witch: (g, C) => { const P = pxPal('#2a2230'); g.ell(16, 10.6, 15.5, 2.4, null, P); g.poly([[10, 10], [22, 10], [20, 4], [26, 0], [17, 2]], P.a); g.poly([[17, 10], [22, 10], [20, 4], [26, 0]], P.b); g.rect(10, 8, 12, 2, C.a); g.set(15, 8, PXC.gold).set(16, 8, PXC.gold); },
  cowboy: (g) => { const P = pxPal('#8a5a32'); g.ell(16, 10.4, 15.6, 2.2, null, P); g.set(1, 9, P.a).set(30, 9, P.a).set(0, 8, P.a).set(31, 8, P.a); g.ell(16, 6.6, 7, 4.6, null, P, (x, y) => y <= 9); g.set(16, 3, P.d).set(15, 3, P.d); g.rect(9, 8, 15, 1, '#3a2414'); },
  viking: (g) => { const M = pxPal(PXC.metal); g.ell(16, 11.5, 11.8, 8.2, null, M, (x, y) => y <= 11); g.rect(4, 10, 25, 2, M.b); g.rect(15, 11, 2, 6, M.a); for (const s of [1, -1]) { const X = x => s > 0 ? x : 31 - x; g.poly([[X(6), 8], [X(1), 1], [X(2), 0], [X(9), 6]].map(([x, y]) => [x, y]), PXC.bone); g.set(X(1), 1, PXC.boneD); } },
  musketeer: (g, C) => { const P = pxPal('#2a2a34'); g.ell(16, 10.4, 15.4, 2.6, null, P); g.ell(15, 7, 7, 4.2, null, P, (x, y) => y <= 9); g.poly([[18, 8], [30, 1], [31, 4], [26, 8]], '#f6f2ea'); g.poly([[20, 7], [29, 3], [29, 5]], C.a); g.rect(8, 8, 15, 1, C.a); },
  deerstalker: (g) => { const P = pxPal('#8a7a5a'); g.ell(16, 9.8, 11.8, 7.6, null, P, (x, y) => y <= 11); for (let y = 3; y <= 11; y++) for (let x = 4; x <= 28; x++) if (g.get(x, y) === P.a && (x + y) % 3 === 0) g.set(x, y, P.b); g.poly([[16, 10], [28, 11], [27, 13], [16, 12]], P.b); g.poly([[16, 10], [4, 11], [5, 13], [16, 12]], P.b); g.rect(15, 1, 2, 2, P.d); },
  jester: (g, C) => { const A = pxPal(C.o), B = pxPal(C.p2 || C.a); g.rect(6, 8, 21, 3, A.a); g.poly([[6, 10], [12, 9], [1, 3]], A.a); g.poly([[13, 9], [19, 9], [16, -1]], B.a); g.poly([[20, 9], [26, 10], [31, 3]], A.b); for (const [x, y] of [[1, 3], [16, 0], [30, 3]]) g.ell(x, y + 0.5, 1.6, 1.6, '#ffd23a'); g.rect(6, 10, 21, 1, PXC.gold); },
  antenna: (g) => { g.line(12, 7, 9, 1, '#3a4a2a').line(20, 7, 23, 1, '#3a4a2a'); g.ell(8.5, 1, 1.8, 1.8, '#c8ff6a'); g.ell(23.5, 1, 1.8, 1.8, '#c8ff6a'); },
  robot: (g, C) => { const M = pxPal('#9aa8b8'); g.rect(4, 4, 25, 21, M.a).rect(4, 4, 25, 1, M.c).rect(27, 4, 2, 21, M.b).rect(4, 24, 25, 1, M.d); g.rect(8, 10, 17, 10, '#1a2a3a'); g.rect(10, 13, 3, 3, '#3ec6ff').rect(20, 13, 3, 3, '#3ec6ff'); g.set(10, 13, '#cff6ff').set(20, 13, '#cff6ff'); g.rect(13, 18, 7, 1, '#3ec6ff').set(12, 17, '#3ec6ff').set(20, 17, '#3ec6ff'); g.line(16, 4, 16, 1, M.b); g.ell(16, 0.8, 1.4, 1.2, '#e8302a'); g.rect(2, 12, 2, 5, M.b).rect(29, 12, 2, 5, M.b); },
  astro: (g) => { const W = pxPal('#f2f2f6'); for (let y = 1; y <= 27; y++) for (let x = 1; x <= 31; x++) { const o = ((x + 0.5 - 16) / 14) ** 2 + ((y + 0.5 - 14.5) / 13) ** 2, i = ((x + 0.5 - 16) / 11.4) ** 2 + ((y + 0.5 - 15.5) / 10) ** 2; if (o <= 1 && i > 1) g.set(x, y, y < 8 ? W.c : x > 22 ? W.b : W.a); } g.rect(10, 26, 12, 2, '#9aa0ac'); g.set(9, 7, '#ffffff').set(10, 6, '#ffffff').set(8, 9, '#cfeaff'); },
  mummy: (g) => { const B = '#e8dcc0', D = '#c9b890', eye = (x, y) => y >= 15 && y <= 17 && ((x >= 10 && x <= 13) || (x >= 19 && x <= 22)); for (let y = 3; y <= 25; y++) for (let x = 3; x <= 29; x++) if (pxInHead(x, y, 1) && !eye(x, y)) g.set(x, y, (y + Math.floor(x / 7)) % 3 === 0 ? D : B); g.line(20, 4, 28, 8, D); g.set(27, 22, B).set(28, 23, B); },
  greathelm: (g, C) => { const M = pxPal(PXC.metal); g.ell(16, 13, 11.8, 12, null, M, (x, y) => y <= 25); g.rect(5, 15, 23, 2, '#1a1a1a'); g.rect(15, 17, 2, 6, '#1a1a1a'); for (const x of [10, 12, 20, 22]) g.set(x, 20, '#1a1a1a'); g.rect(15, 1, 2, 14, C.a); },
  starhelm: (g, C) => { const W = pxPal('#eef2f6'); g.ell(16, 11, 12, 8, null, W, (x, y) => y <= 12); g.rect(4, 10, 3, 9, W.b).rect(25, 10, 3, 9, W.b); g.rect(5, 11, 23, 1, PXC.gold); g.poly([[16, 3], [18.5, 6.5], [16, 10], [13.5, 6.5]], C.a); g.set(15, 5, '#cff6ff'); g.poly([[4, 10], [0, 4], [6, 8]], PXC.gold); g.poly([[28, 10], [32, 4], [26, 8]], PXC.gold); },
  exohelm: (g) => { const B = pxPal('#b8863a'); g.ell(16, 11, 12, 8, null, B, (x, y) => y <= 12); g.rect(4, 13, 25, 2, '#6a4a2a'); for (const x of [12, 21]) { g.ell(x, 16, 3.4, 3.2, '#8a6a3a'); g.ell(x, 16, 2.3, 2.1, '#6fd0e8'); g.set(x - 1, 15, '#e8fbff'); } g.set(8, 5, B.c).set(9, 4, B.c); for (const x of [7, 25]) g.set(x, 9, '#fff3b0'); },
  kabuto: (g) => { const P = pxPal('#3a1f1f'); g.ell(16, 10, 12.4, 7.6, null, P, (x, y) => y <= 11); g.poly([[3, 10], [29, 10], [31, 16], [26, 13], [6, 13], [1, 16]], P.b); g.rect(4, 11, 24, 1, PXC.gold); g.poly([[16, 6], [8, -1], [10, -1], [16, 3], [22, -1], [24, -1]], PXC.gold); g.set(16, 5, '#e8302a'); },
  nemes: (g) => { for (let y = 3; y <= 12; y++) for (let x = 4; x <= 28; x++) if (((x + 0.5 - 16) / 12) ** 2 + ((y + 0.5 - 12) / 9) ** 2 <= 1) g.set(x, y, y % 2 ? PXC.gold : '#2a4aa8'); for (const x0 of [3, 25]) for (let y = 11; y <= 25; y++) g.rect(x0, y, 4, 1, y % 2 ? PXC.gold : '#2a4aa8'); g.rect(6, 11, 21, 1, PXC.gold); g.set(16, 9, '#4fc35a').set(16, 10, '#4fc35a').set(15, 8, '#4fc35a'); },
  dragonhood: (g, C) => { const P = pxPal(C.o), inHead = (x, y) => pxInHead(x, y, -0.6); g.ell(16, 14.5, 13.4, 12.8, null, P, (x, y) => y <= 26 && (y <= 9 || !inHead(x, y))); g.line(9, 4, 6, -1, PXC.bone).line(23, 4, 26, -1, PXC.bone); for (const x of [12, 20]) { g.ell(x, 4.5, 2, 1.8, '#ffffff'); g.set(x, 4, '#1a1a1a'); } for (const [x, y] of [[29, 14], [30, 18], [29, 22]]) g.poly([[x - 1, y], [x + 2.5, y + 1], [x - 1, y + 2]], P.c); },
  wolfhood: (g) => { const P = pxPal('#7a7a84'), inHead = (x, y) => pxInHead(x, y, -0.6); g.ell(16, 14.5, 13.4, 12.8, null, P, (x, y) => y <= 26 && (y <= 9 || !inHead(x, y))); g.poly([[5, 7], [6, -1], [12, 4]], P.a).poly([[20, 4], [26, -1], [27, 7]], P.b); g.poly([[7, 5], [7.5, 1.5], [10, 4]], '#f3a8a8').poly([[22, 4], [24.5, 1.5], [25, 5]], '#f3a8a8'); g.rect(11, 6, 10, 2, '#efe4c8'); },
  ninjahood: (g, C) => { const P = pxPal(pxTone(C.o, -0.15)); g.ell(16, 11, 12, 8.2, null, P, (x, y) => y <= 13); g.rect(4, 12, 3, 8, P.a).rect(26, 12, 3, 8, P.b); g.rect(5, 10, 23, 2, C.a); g.poly([[27, 10], [31, 14], [29, 15]], C.a).poly([[27, 11], [31, 9], [31, 11]], pxTone(C.a, -0.3)); },
});
// ---------- New held items ----------
Object.assign(PX_PROPS, {
  cutlass: (g, C) => { const M = pxPal(PXC.metal); g.line(8, 26, 2, 18, M.a, M.b); g.line(2, 18, 0, 13, M.c); g.ell(9.5, 27, 2.2, 1.6, PXC.gold); g.line(10, 28, 11, 31, PXC.woodD); },
  katana: (g) => { g.line(9, 26, 0, 11, '#dfe6ee'); g.line(8, 25, 0, 12, '#a9b2bf'); g.rect(7, 26, 4, 1, PXC.goldD); g.line(10, 27, 11, 32, '#2a2a34'); },
  rapier: (g) => { g.line(9, 26, 0, 12, '#dfe6ee'); g.ell(9.5, 27.5, 2, 1.4, PXC.gold); g.line(10, 28, 11, 31, '#3a2414'); },
  axe: (g) => { g.line(10, 34, 5, 13, PXC.wood, PXC.woodD); const M = pxPal(PXC.metal); g.poly([[0, 12], [5, 13], [5, 19], [0, 21], [-1, 16]], M.a); g.line(0, 13, 0, 20, M.c); },
  crook: (g) => { for (let i = 0; i <= 20; i++) { const x = Math.round(10 - i * 5 / 20), y = 35 - i; g.set(x, y, i % 4 < 2 ? PXC.gold : '#2a4aa8'); g.set(x + 1, y, i % 4 < 2 ? PXC.goldD : '#1f357a'); } g.rect(2, 12, 4, 1, PXC.gold).set(1, 13, PXC.gold).set(1, 14, PXC.gold).set(2, 15, PXC.gold); },
  flag: (g, C) => { g.line(10, 35, 7, 4, '#9aa0ac'); g.rect(0, 4, 7, 5, '#f6f2ea').rect(0, 8, 7, 1, '#d8d2c8'); g.set(3, 6, C.a).set(2, 6, C.a).set(3, 5, C.a).set(4, 6, C.a).set(3, 7, C.a); },
  magnifier: (g) => { g.line(10, 31, 7, 27, PXC.wood, PXC.woodD); g.ell(5, 24, 3.4, 3.4, PXC.goldD); g.ell(5, 24, 2.4, 2.4, '#cfeaff'); g.set(4, 23, '#ffffff'); },
  lasso: (g) => { g.ell(5, 27, 4.5, 3.4, '#c9a36a'); g.ell(5, 27, 3, 2, 0); g.line(9, 29, 10, 33, '#c9a36a'); },
  beamblade: (g, C) => { g.rect(9, 27, 2, 5, '#9aa0ac').set(9, 28, '#4a4e58'); g.line(9, 26, 1, 11, C.a, pxTone(C.a, 0.6)); },
  wand: (g) => { g.line(9, 30, 5, 20, '#f2ece0'); const k = '#ffd23a'; g.set(4, 17, k).rect(3, 18, 3, 1, k).set(4, 19, k).set(2, 18, k).set(6, 18, k); g.set(4, 18, '#ffffff'); },
  raygun: (g) => { g.rect(2, 26, 8, 3, '#c0c8d8').rect(2, 26, 8, 1, '#e8eef6'); g.rect(0, 27, 2, 1, '#7fe8a0'); g.rect(7, 29, 2, 3, '#6a707c'); g.set(5, 25, '#e8302a').set(4, 25, '#e8302a'); },
  wrench: (g) => { g.line(10, 32, 5, 22, '#9aa0ac', '#6a707c'); g.rect(2, 18, 6, 4, '#9aa0ac'); g.rect(4, 18, 2, 2, 0); },
  bauble: (g, C) => { g.line(10, 33, 5, 19, PXC.wood); g.ell(4.5, 16, 2.6, 2.6, '#f6cfa0'); g.poly([[2, 15], [0, 11], [5, 14]], C.a).poly([[7, 15], [9, 11], [4, 14]], C.p2 || C.o); g.set(0, 11, '#ffd23a').set(9, 11, '#ffd23a'); },
  icestaff: (g) => { g.line(10, 35, 5, 10, '#cfeaff', '#7ec8f0'); g.poly([[4, 1], [7, 6], [4, 11], [1, 6]], '#bfefff'); g.set(3, 5, '#ffffff'); },
  pitchfork: (g) => { g.line(10, 35, 6, 9, PXC.wood, PXC.woodD); g.rect(2, 8, 8, 1, PXC.metal); for (const x of [2, 5, 8]) g.rect(x, 3, 1, 5, PXC.metal); },
  carrot: (g) => { g.poly([[5, 25], [10, 28], [3, 32]], '#f08a2a'); g.set(5, 28, '#c8641a'); g.line(5, 25, 3, 22, '#4fa84a').line(6, 25, 7, 22, '#4fa84a'); },
});
