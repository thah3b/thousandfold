// ============================================================
// FASHION (v1.2) — the wardrobe: cosmetic hats, outfits, capes,
// held items, hair dye and poses, plus the hero showcase.
// Cosmetic only: nothing here changes stats.
// ============================================================
const FASHION_SLOTS = [['hat', 'Hats'], ['outfit', 'Outfits'], ['cape', 'Capes'], ['prop', 'Held items'], ['hair', 'Hair dye'], ['pose', 'Poses']];
// src: free · gold (price in level-1 gold, scaled by your price level) · lvl · asc · secrets · species · events · bosses · ach (points) · cls (that class's own look)
const F = (id, slot, name, val, src) => ({ id, slot, name, val, src: src || { free: true } });
const FASHIONS = [
  // Hats
  F('hat_none', 'hat', 'Bare head', null), F('hat_beanie', 'hat', 'Cosy Beanie', 'beanie'), F('hat_headband', 'hat', 'Headband', 'headband'),
  F('hat_bandana', 'hat', 'Bandana', 'bandana', { gold: 400 }), F('hat_straw', 'hat', 'Straw Hat', 'straw', { gold: 400 }), F('hat_cap', 'hat', 'Merchant’s Cap', 'cap', { gold: 600 }),
  F('hat_feather', 'hat', 'Feather', 'feather', { gold: 600 }), F('hat_hat', 'hat', 'Wayfarer’s Hat', 'hat', { gold: 800 }), F('hat_goggles', 'hat', 'Tinker Goggles', 'goggles', { gold: 900 }),
  F('hat_fur', 'hat', 'Fur Hood', 'fur', { gold: 900 }), F('hat_feathercap', 'hat', 'Bard’s Cap', 'feathercap', { gold: 1200 }), F('hat_hood', 'hat', 'Deep Hood', 'hood', { gold: 1200 }),
  F('hat_circlet', 'hat', 'Silver Circlet', 'circlet', { gold: 1500 }), F('hat_helm', 'hat', 'Crested Helm', 'helm', { gold: 2000 }), F('hat_wizard', 'hat', 'Wizard Hat', 'wizard', { gold: 2500 }),
  F('hat_chef', 'hat', 'Chef’s Toque', 'chef', { gold: 1500 }), F('hat_catears', 'hat', 'Cat Ears', 'catears', { gold: 3000 }), F('hat_bunny', 'hat', 'Bunny Ears', 'bunny', { gold: 3000 }),
  F('hat_pirate', 'hat', 'Pirate Tricorn', 'pirate', { gold: 5000 }), F('hat_lamp', 'hat', 'Miner’s Lamp', 'lamp', { lvl: 20 }), F('hat_turban', 'hat', 'Desert Wrap', 'turban', { lvl: 30 }),
  F('hat_wide', 'hat', 'Ferryman’s Hat', 'wide', { lvl: 40 }), F('hat_tiara', 'hat', 'Tiara', 'tiara', { lvl: 50 }), F('hat_flower', 'hat', 'Flower Crown', 'flower', { species: 5 }),
  F('hat_halo', 'hat', 'Halo', 'halo', { secrets: 3 }), F('hat_horns', 'hat', 'Fiend Horns', 'horns', { bosses: 25 }), F('hat_pumpkin', 'hat', 'Pumpkin Head', 'pumpkin', { events: 1 }),
  F('hat_santa', 'hat', 'Festive Hat', 'santa', { events: 3 }), F('hat_crown', 'hat', 'Crown', 'crown', { asc: 1 }),
  // Outfits: [outfit, accent, robe]
  F('out_traveller', 'outfit', 'Traveller’s Tunic', ['#7a6a5a', '#c9a36a', false]), F('out_village', 'outfit', 'Village Blues', ['#4a6a9a', '#e8dcc0', false]),
  F('out_forest', 'outfit', 'Forest Ranger', ['#3f6a32', '#c9a36a', false], { gold: 1000 }), F('out_harvest', 'outfit', 'Harvest Overalls', ['#5a7ab0', '#e8c878', false], { gold: 1000 }),
  F('out_ember', 'outfit', 'Ember Coat', ['#c0402a', '#ffb040', false], { gold: 2000 }), F('out_night', 'outfit', 'Night Silk', ['#26263a', '#9a7ae8', false], { gold: 2500 }),
  F('out_captain', 'outfit', 'Sea Captain', ['#2a4a7a', '#e8c15a', false], { gold: 3000 }), F('out_snow', 'outfit', 'Snowfall Robe', ['#f2ece0', '#e8c15a', true], { gold: 4000 }),
  F('out_royal', 'outfit', 'Royal Robe', ['#7a2a6a', '#e8c15a', true], { gold: 8000 }), F('out_petkeeper', 'outfit', 'Petkeeper’s Apron', ['#6a8a5a', '#f2ece0', false], { species: 10 }),
  F('out_festival', 'outfit', 'Festival Finery', ['#e8572e', '#ffe08a', false], { events: 2 }), F('out_mystery', 'outfit', 'Robe of Riddles', ['#3a2a5a', '#8fe0a0', true], { secrets: 5 }),
  F('out_slayer', 'outfit', 'Boss Slayer’s Garb', ['#5a1f1f', '#e8c15a', false], { bosses: 10 }), F('out_veteran', 'outfit', 'Veteran’s Plate', ['#8a909c', '#e8c15a', false], { lvl: 60 }),
  F('out_ascended', 'outfit', 'Ascended Vestments', ['#f2ece0', '#9fe2f2', true], { asc: 1 }), F('out_legend', 'outfit', 'Legend’s Robe', ['#1f1a2a', '#ffd86b', true], { lvl: 99 }),
  F('out_achiever', 'outfit', 'Gilded Regalia', ['#c89a2a', '#fff3b0', true], { ach: 500 }),
  // Capes
  F('cape_none', 'cape', 'No cape', null), F('cape_crimson', 'cape', 'Crimson Cape', '#9a2a24'), F('cape_forest', 'cape', 'Forest Cape', '#2f5a2a', { gold: 800 }),
  F('cape_royal', 'cape', 'Royal Purple', '#5a3aa8', { gold: 1500 }), F('cape_midnight', 'cape', 'Midnight Cape', '#1a1a2a', { gold: 1500 }), F('cape_frost', 'cape', 'Frost Cape', '#7ec8f0', { gold: 2500 }),
  F('cape_ember', 'cape', 'Ember Cape', '#e8572e', { events: 1 }), F('cape_gold', 'cape', 'Cloth of Gold', '#c89a2a', { lvl: 75 }), F('cape_star', 'cape', 'Starry Cape', '#2a2a6a', { ach: 250 }),
  // Held items
  F('prop_none', 'prop', 'Empty hands', null), F('prop_lantern', 'prop', 'Lantern', 'lantern'), F('prop_map', 'prop', 'Old Map', 'map'),
  F('prop_rod', 'prop', 'Fishing Rod', 'rod', { gold: 500 }), F('prop_broom', 'prop', 'Broom', 'broom', { gold: 500 }), F('prop_bag', 'prop', 'Coin Purse', 'bag', { gold: 800 }),
  F('prop_balloon', 'prop', 'Balloon', 'balloon', { gold: 1000 }), F('prop_dagger', 'prop', 'Dagger', 'dagger', { gold: 1000 }), F('prop_bow', 'prop', 'Longbow', 'bow', { gold: 1500 }),
  F('prop_sword', 'prop', 'Sword', 'sword', { gold: 1500 }), F('prop_lute', 'prop', 'Lute', 'lute', { gold: 1500 }), F('prop_flask', 'prop', 'Bubbling Flask', 'flask', { gold: 1500 }),
  F('prop_scythe', 'prop', 'Scythe', 'scythe', { gold: 2000 }), F('prop_whip', 'prop', 'Whip', 'whip', { gold: 2000 }), F('prop_hammer', 'prop', 'Rune Hammer', 'hammer', { gold: 2500 }),
  F('prop_staff', 'prop', 'Crystal Staff', 'staff', { gold: 3000 }), F('prop_orbstaff', 'prop', 'Orb Staff', 'orbstaff', { gold: 3000 }), F('prop_trident', 'prop', 'Trident', 'trident', { gold: 3000 }),
  F('prop_skullstaff', 'prop', 'Skull Staff', 'skullstaff', { bosses: 5 }), F('prop_banner', 'prop', 'Guild Banner', 'banner', { lvl: 35 }),
  // Hair dye
  ...[['Raven', '#3a2a20'], ['Chestnut', '#6b4426'], ['Copper', '#b5762e'], ['Golden', '#e8c870'], ['Snow', '#f2eee6'], ['Crimson', '#a83e2c'], ['Midnight', '#2b2f44'], ['Violet', '#6a4a8a'], ['Rose', '#ee9ab8'], ['Moss', '#4a7a3a']]
    .map(([n, c]) => F('hair_' + n.toLowerCase(), 'hair', n, c)),
  F('hair_sky', 'hair', 'Sky', '#7ec8f0', { gold: 1000 }), F('hair_mint', 'hair', 'Mint', '#8fe0b8', { gold: 1000 }), F('hair_ember', 'hair', 'Ember', '#ff7a3a', { gold: 1500 }),
  F('hair_starlight', 'hair', 'Starlight', '#c9b8ff', { secrets: 8 }),
  // Poses
  F('pose_idle', 'pose', 'Standing', 'idle'), F('pose_wave', 'pose', 'Wave', 'wave'), F('pose_wink', 'pose', 'Wink', 'wink', { lvl: 10 }),
  F('pose_cast', 'pose', 'Spark', 'cast', { lvl: 25 }), F('pose_cheer', 'pose', 'Cheer', 'cheer', { lvl: 50 }),
];
const FASHION_BY = Object.fromEntries(FASHIONS.map(f => [f.id, f]));
ACHIEVEMENTS.push(
  { id: 'fash_1', cat: 'Collection', name: 'Dressed Up', desc: 'Change your look in the Wardrobe.', pts: 10, goal: 1, stat: 'dressed' },
  { id: 'fash_30', cat: 'Collection', name: 'Fashionista', desc: 'Own 30 wardrobe pieces.', pts: 25, goal: 30, stat: 'fashions' },
);

// ---------- Ownership ----------
const fashionPrice = (c, f) => Math.round(f.src.gold * priceIndex(c, 1));
function fashionReq(c, f) {
  const s = f.src, K = c.counters || {};
  if (s.free) return null;
  if (s.gold) return (c.wardrobe || {})[f.id] ? null : `${N(fashionPrice(c, f))} gold`;
  if (s.lvl) return c.level >= s.lvl ? null : `Reach level ${s.lvl}`;
  if (s.asc) return (c.ascension || 0) >= s.asc ? null : 'Ascend once';
  if (s.secrets) return Object.keys(c.secrets || {}).length >= s.secrets ? null : `Find ${s.secrets} secrets`;
  if (s.species) return Object.keys(c.petDex || {}).length >= s.species ? null : `Collect ${s.species} pet species`;
  if (s.events) return (K.eventsJoined || 0) >= s.events ? null : `Take part in ${s.events} world event${s.events > 1 ? 's' : ''}`;
  if (s.bosses) return (K.bossWins || 0) >= s.bosses ? null : `Win ${s.bosses} boss fights`;
  if (s.ach) { const pts = ACHIEVEMENTS.filter(a => c.ach && c.ach[a.id]).reduce((t, a) => t + a.pts, 0); return pts >= s.ach ? null : `Earn ${s.ach} achievement points`; }
  return null;
}
const fashionOwned = (c, f) => fashionReq(c, f) === null;
const fashionCount = c => FASHIONS.filter(f => fashionOwned(c, f)).length;
// The look overrides for a character's chosen fashion. Unset slots keep the class look.
function fashionLook(c) {
  const fa = c.fashion || {}, out = {};
  for (const [slot] of FASHION_SLOTS) {
    const f = FASHION_BY[fa[slot]]; if (!f) continue;
    if (slot === 'outfit') { out.outfit = f.val[0]; out.accent = f.val[1]; out.robe = f.val[2]; }
    else out[slot] = f.val;
  }
  return out;
}
const fashionWorn = (c, slot) => (c.fashion || {})[slot] || null;

// ---------- Hero showcase: the big character with the active pet ----------
const SHOWCASE_BG = 'linear-gradient(180deg,#9ccfe8 0%,#cfe6ee 58%,#7ab85a 58%,#5e9a44 74%,#4a7a36 100%)';
function heroShowcase(c, size, opt) {
  const o = opt || {}, S = size || 160, L = o.look || pxLookOf(c);
  const pet = o.pet !== undefined ? o.pet : c.petActive && (c.pets || []).find(p => p.uid === c.petActive);
  const sp = pet && pet.sp && SPECIES[pet.sp] ? pet.sp : null, fly = sp && SP(sp).tags.includes('Flying');
  const hero = pxChibi(L, S, { cls: 'hsc-hero' });
  const petImg = sp ? `<span class="hsc-pet ${fly ? 'fly' : ''}" title="${esc(pet.name || SP(sp).name)}">${pxPet(sp, Math.round(S * 0.42), pet)}</span>` : '';
  return `<div class="hsc ${o.cls || ''}" style="--sz:${S}px;background:${SHOWCASE_BG}"><i class="hsc-sun"></i><i class="hsc-cloud c1"></i><i class="hsc-cloud c2"></i>${hero}${petImg}</div>`;
}

// ---------- Wardrobe tab ----------
let wdSlot = 'hat';
function tabWardrobe() {
  ch.fashion = ch.fashion || {}; ch.wardrobe = ch.wardrobe || {};
  const owned = fashionCount(ch); ch.counters.fashions = owned;
  const base = { ...pxLookOf({ ...ch, fashion: {} }) }, cur = pxLookOf(ch);
  const items = FASHIONS.filter(f => f.slot === wdSlot), worn = fashionWorn(ch, wdSlot);
  const cell = (id, name, look, state, act, arg, note) => `<button class="card wdcell ${state}" data-act="${act}" data-arg="${arg}" ${state === 'locked' ? 'aria-disabled="true"' : ''}>
      ${pxChibi(look, 64, { cls: 'wdimg' })}<b>${esc(name)}</b><span class="mute">${note}</span></button>`;
  const clsCell = cell('cls', 'Class look', { ...cur, ...pickSlot(base, wdSlot) }, worn ? 'own' : 'on', 'wdwear', wdSlot + '|', worn ? 'Your class default' : 'Wearing');
  const cells = items.map(f => {
    const req = fashionReq(ch, f), on = worn === f.id, look = { ...cur, ...pickSlot(fashionLook({ fashion: { [wdSlot]: f.id } }), wdSlot, f) };
    if (!req) return cell(f.id, f.name, look, on ? 'on' : 'own', 'wdwear', `${wdSlot}|${f.id}`, on ? 'Wearing' : 'Owned');
    if (f.src.gold) return cell(f.id, f.name, look, 'buy', 'wdbuy', f.id, `Buy · ${req}`);
    return cell(f.id, f.name, look, 'locked', 'noop', '', `🔒 ${esc(req)}`);
  });
  return `<div class="spread"><h2>Wardrobe</h2><span class="chip">${owned} of ${FASHIONS.length} owned</span></div>
    <p class="mute" style="margin:4px 0 12px">Change how ${esc(ch.name)} looks. Everything here is cosmetic: stats never change. Pieces you haven’t earned show how to get them.</p>
    <div class="wardrobe"><div class="card wdstage">${heroShowcase(ch, 176)}
      <div class="mute" style="font-size:13px;margin-top:8px">${esc(ch.name)} · ${esc(race().name)} ${esc(CLASSES.find(k => k.id === ch.cls).name)}${ch.petActive ? '' : ' · <a href="#" data-act="tab" data-arg="pets">Set an active pet</a> to have it join you here'}</div>
      <div class="row" style="gap:6px;margin-top:8px"><button class="sm ghost" data-act="wdreset">Reset to class look</button></div></div>
      <div><div class="row" style="gap:6px;margin-bottom:10px">${FASHION_SLOTS.map(([id, n]) => `<button class="chip ${wdSlot === id ? 'on' : ''}" data-act="wdslot" data-arg="${id}">${n}</button>`).join('')}</div>
      <div class="wdgrid">${wdSlot === 'pose' || wdSlot === 'hair' ? '' : clsCell}${cells.join('')}</div></div></div>`;
}
// Only the part of a look that a slot changes.
function pickSlot(look, slot, f) {
  if (slot === 'outfit') return { outfit: look.outfit, accent: look.accent, robe: look.robe };
  if (slot === 'pose') return { pose: look.pose || 'idle' };
  if (f && f.val === null) return { [slot]: null };
  return { [slot]: look[slot] };
}
const FASHION_HANDLERS = {
  wdslot: s => { wdSlot = s; renderMain(); },
  wdwear: a => {
    const [slot, id] = a.split('|'); ch.fashion = ch.fashion || {};
    if (id) { const f = FASHION_BY[id]; if (!f || !fashionOwned(ch, f)) return; ch.fashion[slot] = id; } else delete ch.fashion[slot];
    ch.counters.dressed = (ch.counters.dressed || 0) + 1; ch.counters.fashions = fashionCount(ch);
    dirty = true; save(); checkProgress(); renderMain(); renderSide();
  },
  wdbuy: id => {
    const f = FASHION_BY[id]; if (!f || !f.src.gold || (ch.wardrobe || {})[id]) return;
    const cost = fashionPrice(ch, f); if (ch.gold < cost) { toast(`You need ${N(cost)} gold for the ${esc(f.name)}.`); return; }
    ch.gold -= cost; ch.wardrobe = ch.wardrobe || {}; ch.wardrobe[id] = Date.now(); ch.fashion = ch.fashion || {}; ch.fashion[f.slot] = id;
    ch.counters.dressed = (ch.counters.dressed || 0) + 1; ch.counters.fashions = fashionCount(ch);
    addLog('sys', `Bought and put on: ${f.name} (${N(cost)} gold).`); toast(`<b>${esc(f.name)}</b> is yours.`, 'gold');
    dirty = true; save(); checkProgress(); renderTop(); renderMain(); renderSide();
  },
  wdreset: () => { ch.fashion = {}; dirty = true; save(); renderMain(); renderSide(); },
  noop: () => { },
};
