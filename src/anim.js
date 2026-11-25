// ============================================================
// ACTION ANIMATIONS (v1.5) — a little pixel scene of your hero
// doing whatever is running: swinging a pickaxe at a rock,
// chopping a tree, fishing, hammering at the anvil, stirring a
// cauldron, fighting a monster, exploring or travelling.
// Pure CSS animation over cached pixel sprites; one scene is kept
// alive in the Active actions panel so it never restarts.
// ============================================================

// ---------- Station sprites (32×32) ----------
const PX_STATIONS = {
  rock: (g, P) => { g.ell(16, 22, 13, 9, null, pxPal('#7a6a60')); g.ell(11, 18, 6, 5, null, pxPal('#8a7a70')); for (const [x, y] of [[9, 20], [18, 17], [22, 24], [13, 26], [24, 19]]) { g.ell(x, y, 2.2, 1.8, null, P); g.set(x - 1, y - 1, P.c); } g.rect(3, 29, 26, 2, '#4a3d36'); },
  tree: (g, P) => { const L = pxPal(pxMix(PXC.leaf, P.a, 0.2)); g.rect(13, 16, 6, 15, PXC.bark).rect(17, 16, 2, 15, PXC.barkD).rect(10, 29, 12, 2, PXC.barkD); g.ell(16, 11, 11, 8, null, L); g.ell(9, 14, 6, 5, null, L); g.ell(23, 14, 6, 5, null, L); g.ell(16, 5, 6, 4, null, L); for (const [x, y] of [[10, 9], [20, 7], [15, 13], [24, 13]]) g.set(x, y, L.c); },
  crop: (g, P) => { g.rect(2, 26, 28, 5, '#6b4a32').rect(2, 26, 28, 1, '#8a6040'); for (const x of [7, 16, 25]) { g.line(x, 26, x, 14, PXC.leafD); g.ell(x - 3, 21, 2.6, 1.4, PXC.leaf); g.ell(x + 3, 18, 2.6, 1.4, PXC.leaf); g.ell(x, 11, 3, 3, null, P); g.set(x - 1, 10, P.c); } },
  bush: (g, P) => { const L = pxPal('#4f8a3a'); g.ell(16, 21, 13, 9, null, L); g.ell(9, 17, 6, 5, null, L); g.ell(23, 17, 6, 5, null, L); for (const [x, y] of [[8, 15], [16, 13], [24, 16], [12, 22], [21, 23], [17, 19]]) { g.ell(x, y, 1.6, 1.6, P.a); g.set(x, y, P.c); } g.rect(4, 29, 24, 2, '#4a3d36'); },
  rack: (g, P) => { g.rect(4, 6, 2, 25, PXC.wood).rect(26, 6, 2, 25, PXC.wood).rect(3, 6, 26, 2, PXC.woodD); g.poly([[8, 8], [24, 8], [26, 20], [22, 27], [10, 27], [6, 20]], P.a); g.poly([[16, 8], [24, 8], [26, 20], [22, 27], [16, 27]], P.b); g.set(12, 14, P.d).set(19, 18, P.d).set(14, 22, P.d); },
  pond: (g, P) => { g.ell(16, 22, 15, 8, null, pxPal('#3f7aa8')); g.ell(16, 22, 15, 8, null, null, (x, y) => false); for (const [x, y] of [[7, 20], [8, 20], [20, 23], [21, 23], [13, 26], [25, 19]]) g.set(x, y, '#9fd8f0'); g.rect(1, 21, 2, 3, '#5f9a4a').rect(29, 20, 2, 4, '#5f9a4a'); },
  anvil: (g, P) => { g.rect(9, 24, 14, 7, PXC.bark).rect(9, 24, 14, 1, PXC.wood); g.rect(12, 19, 8, 5, '#4a4f5a'); g.rect(5, 14, 22, 5, '#5a606c').rect(5, 14, 22, 1, '#8a909c'); g.poly([[27, 14], [31, 15], [27, 18]], '#5a606c'); g.rect(10, 12, 12, 2, '#ff8a3a').rect(10, 12, 12, 1, '#ffd08a'); },
  cauldron: (g, P) => { for (const [x, h] of [[9, 4], [14, 6], [19, 5], [23, 4]]) g.rect(x, 31 - h, 2, h, x % 2 ? '#ff8a3a' : '#ffd36b'); g.ell(16, 20, 11, 8, null, pxPal('#3a3a44')); g.ell(16, 14, 10, 2.6, P.a); g.rect(4, 13, 24, 2, '#26262e'); g.set(12, 13, P.c).set(19, 14, P.c); },
  campfire: (g, P) => { g.line(6, 30, 26, 25, PXC.bark, PXC.barkD); g.line(6, 25, 26, 30, PXC.bark, PXC.barkD); g.poly([[10, 27], [16, 12], [22, 27]], '#ff8a3a'); g.poly([[13, 27], [16, 17], [19, 27]], '#ffd36b'); g.rect(4, 9, 22, 3, '#3a3a44').rect(26, 10, 5, 1, '#3a3a44'); g.ell(14, 8, 7, 1.6, P.a); },
  loom: (g, P) => { g.rect(4, 4, 2, 27, PXC.wood).rect(26, 4, 2, 27, PXC.wood).rect(4, 4, 24, 2, PXC.woodD).rect(4, 24, 24, 2, PXC.woodD); g.rect(7, 7, 18, 16, P.a); for (let y = 8; y < 23; y += 3) g.rect(7, y, 18, 1, P.b); for (let x = 9; x < 25; x += 4) g.rect(x, 7, 1, 16, P.c); },
  pedestal: (g, P) => { g.rect(10, 20, 12, 11, '#6a6a7a').rect(8, 29, 16, 2, '#4a4a5a').rect(8, 19, 16, 2, '#8a8a9a'); g.ell(16, 12, 6, 6, null, P); g.set(14, 10, '#ffffff').set(15, 9, '#ffffff'); },
  gembench: (g, P) => { g.rect(4, 20, 24, 3, PXC.wood).rect(6, 23, 2, 8, PXC.woodD).rect(24, 23, 2, 8, PXC.woodD); g.poly([[16, 6], [22, 12], [16, 19], [10, 12]], P.a); g.poly([[16, 6], [16, 19], [10, 12]], P.c); g.poly([[10, 12], [22, 12], [16, 6]], P.b); g.set(14, 10, '#ffffff'); },
  dummy: (g, P) => { g.rect(15, 10, 2, 21, PXC.wood).rect(9, 30, 14, 1, PXC.woodD); g.ell(16, 18, 6, 7, '#d9b26a'); g.ell(16, 7, 4, 4, '#d9b26a'); g.rect(8, 15, 16, 2, '#c9a05a'); g.line(13, 15, 19, 21, '#a8463a').line(19, 15, 13, 21, '#a8463a'); },
};
// Extra hand tools for crafting scenes (16×16).
const PX_TOOLS2 = {
  hammer: g => { g.line(3, 14, 9, 6, PXC.wood, PXC.woodD); g.rect(6, 1, 8, 5, '#8a909c').rect(6, 1, 8, 1, '#cfd4dc'); },
  ladle: g => { g.line(3, 14, 11, 4, PXC.wood, PXC.woodD); g.ell(12, 3.5, 3, 2.4, '#8a909c'); },
  needle: g => { g.line(3, 13, 12, 3, '#cfd4dc'); g.set(12, 2, '#cfd4dc').set(11, 3, '#ffffff'); g.line(12, 3, 14, 9, '#c0574a'); },
  wand: g => { g.line(3, 14, 10, 5, '#5a3a6a', '#3a2a4a'); g.ell(11.5, 3.5, 2.4, 2.4, '#bfa8ff'); g.set(11, 3, '#ffffff'); },
  scroll: g => { g.rect(2, 4, 12, 9, '#ecd9a8').rect(1, 3, 2, 11, '#c9b07a').rect(13, 3, 2, 11, '#c9b07a'); g.set(5, 7, '#a8463a').set(6, 8, '#a8463a').set(9, 6, '#a8463a').set(10, 9, '#c0574a'); },
  dumbbell: g => { g.rect(3, 7, 10, 2, '#8a909c'); g.rect(1, 4, 3, 8, '#4a4f5a').rect(12, 4, 3, 8, '#4a4f5a'); },
};
const SKILL_SCENE = {
  mining: ['rock', 'tool', 'swing'], woodcutting: ['tree', 'tool_woodcutting', 'swing'], farming: ['crop', 'tool_farming', 'swing'],
  fishing: ['pond', 'tool_fishing', 'fish'], herbalism: ['bush', 'tool_herbalism', 'swing'], skinning: ['rack', 'tool_skinning', 'swing'],
  blacksmithing: ['anvil', 'hammer', 'swing'], alchemy: ['cauldron', 'ladle', 'stir'], cooking: ['campfire', 'ladle', 'stir'],
  tailoring: ['loom', 'needle', 'stir'], enchanting: ['pedestal', 'wand', 'cast'], jewelcrafting: ['gembench', 'hammer', 'swing'],
  training: ['dummy', 'dumbbell', 'lift'],
};
const SCENE_SKY = { emberfall: ['#f6c48a', '#a8603a'], woods: ['#b8e0c0', '#4f8a3a'], ironpeak: ['#c8d0dc', '#6a6a72'], marsh: ['#b0c8b0', '#4a6a3a'], desert: ['#f8dca0', '#d9b26a'], frost: ['#dcefff', '#e8f4f8'], void: ['#4a3a6a', '#2a2040'], chasm: ['#6a4030', '#3a2420'], glade: ['#3a4a7a', '#3f6a4a'], undercity: ['#6a5a4a', '#4a3a2a'], starfall: ['#2a2a5a', '#5a4a6a'] };
const sceneSky = (loc, indoor) => indoor ? ['#8a6a4a', '#5a3e28'] : (SCENE_SKY[loc] || ['#9ccfe8', '#6aa84a']);

function stationImg(kind, color, size) { return pxImg(`st:${kind}:${color}`, size, () => { const g = new PxGrid(32, 32); PX_STATIONS[kind](g, pxPal(color)); return g.outline(); }, { cls: 'sc-st' }); }
function toolImg(kind, color, size) {
  if (PX_TOOLS2[kind]) return pxImg(`tl:${kind}`, size, () => { const g = new PxGrid(16, 16); PX_TOOLS2[kind](g); return g.outline(); }, { cls: 'sc-tl' });
  return pxImg(`i:${kind}:${color}`, size, () => pxItemGrid(kind, color), { cls: 'sc-tl' });
}
const animOn = () => account.settings.anim !== false && !account.settings.reduced;

// What the scene shows: the chosen running action, else a fight, else the newest one.
function sceneAction() {
  if (!ch) return null;
  const dgf = typeof dgSceneFoe === 'function' ? dgSceneFoe() : null;
  if (dgf && !(ch.sceneFocus && ch.actions.find(a => a.res === ch.sceneFocus))) return dgf;
  if (!ch.actions.length) return null;
  const f = ch.sceneFocus && ch.actions.find(a => a.res === ch.sceneFocus);
  return ACT((f || ch.actions.find(a => ACT(a.res).kind === 'combat') || ch.actions[ch.actions.length - 1]).res);
}
function sceneKey(a) {
  const L = pxLookOf(ch), pet = ch.petActive || '';
  return [a ? a.id : ch.travel ? 'travel:' + ch.travel.to : 'idle', ch.loc, JSON.stringify(L), pet, animOn()].join('|');
}
function sceneHtml(a) {
  const L = { ...pxLookOf(ch), prop: null, pose: 'idle' }, on = animOn();
  const hero = pxChibi(L, 72, { cls: 'sc-hero-img' });
  const pet = ch.petActive && (ch.pets || []).find(p => p.uid === ch.petActive);
  const petHtml = pet && SPECIES[pet.sp] ? `<span class="sc-pet ${SP(pet.sp).tags.includes('Flying') ? 'fly' : ''}">${pxPet(pet.sp, 30, pet)}</span>` : '';
  const travel = !a && ch.travel, kind = a ? a.kind : travel ? 'travel' : 'idle';
  const indoor = a && SKILLS[a.skill] && SKILLS[a.skill].kind === 'craft';
  const [sky, ground] = sceneSky(travel ? ch.travel.to : ch.loc, indoor);
  let mode = 'idle', target = '', tool = '', pop = '', label = '', extra = '';
  if (kind === 'combat') {
    const cl = PX_CLASS[ch.cls] || PX_CLASS.warrior, wcol = cl[1];
    mode = 'fight'; tool = toolImg('weapon', wcol, 40); target = `<span class="sc-mon">${monsterIcon(a, a.boss ? 84 : 72)}</span>`;
    pop = `<span class="sc-dmg">-${N(Math.max(1, Math.round(D('slaying').attack)))}</span>`; label = `Fighting ${a.name}`;
  } else if (kind === 'explore') { mode = 'walk'; extra = `<span class="sc-prop">${toolImg('scroll', '', 30)}</span>`; label = `Exploring ${REGION_BY[a.id.slice(2)] ? REGION_BY[a.id.slice(2)].name : ''}`; }
  else if (kind === 'travel') { mode = 'walk'; label = `Travelling to ${REGION_BY[ch.travel.to].name}`; }
  else if (kind === 'idle') { mode = 'idle'; label = 'Resting'; extra = '<span class="sc-zzz">z<b>z</b><i>z</i></span>'; }
  else {
    const S = SKILL_SCENE[a.skill] || SKILL_SCENE.mining, color = a.color || (a.out && ITEMS[a.out] ? (RARITIES[ITEMS[a.out].rarity] || RARITIES[0]).color : '#c8a060');
    mode = S[2]; target = stationImg(S[0], kind === 'train' ? '#d9b26a' : color, 72); tool = toolImg(S[1], (RARITIES[2] || {}).color || '#c8ccd4', 40);
    const icon = kind === 'train' ? `<b>+${esc(a.stat || '')}</b>` : actIcon(a, 22);
    pop = `<span class="sc-popi">${icon}</span>`; label = `${SKILLS[a.skill].verb} ${a.name}`;
  }
  const fx = mode === 'swing' || mode === 'fight' ? '<span class="sc-fx"><i></i><i></i><i></i><i></i></span>' : mode === 'stir' || mode === 'cast' ? '<span class="sc-bub"><i></i><i></i><i></i></span>' : '';
  const line = mode === 'fish' ? '<span class="sc-line"></span><span class="sc-float"></span>' : '';
  return `<div class="scene sc-${mode} ${on ? 'on' : ''}" style="--sky:${sky};--ground:${ground}" aria-label="${esc(label)}">
    <span class="sc-ground"></span><span class="sc-target">${target}</span>${line}${fx}
    <span class="sc-hero">${hero}${tool ? `<span class="sc-tool">${tool}</span>` : ''}${extra}</span>${petHtml}
    ${pop ? `<span class="sc-pop">${pop}</span>` : ''}<span class="sc-label">${esc(label)}</span></div>`;
}
// Keep one scene alive in an element; rebuild only when what it shows changes.
function mountScene(el) {
  if (!el || !ch) return;
  if (account.settings.anim === false) { el.innerHTML = ''; el.dataset.key = ''; return; }
  const a = sceneAction(), k = sceneKey(a);
  if (el.dataset.key === k) return;
  el.dataset.key = k; el.innerHTML = sceneHtml(a);
  const sc = el.firstElementChild; if (sc) sc.style.setProperty('--ph', -Math.round(performance.now()) + 'ms'); // keep every scene in phase, even when rebuilt
}
function refreshScenes() { if (!ch) return; const v = typeof actView === 'function' ? actView() : 'full', sc = document.getElementById('actscene'); if (sc) { sc.hidden = v !== 'full'; if (v === 'full') mountScene(sc); } document.querySelectorAll('.scene-slot').forEach(mountScene); }
const ANIM_HANDLERS = { scenefocus: id => { ch.sceneFocus = id; refreshScenes(); } };
