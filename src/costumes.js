// ============================================================
// v3.0 — Costumes: full sets that go over your Wardrobe look in one tap.
// Original designs, plus figures from public-domain stories and folklore.
// Bought once with gold or Thousandium; yours on every character.
// Cosmetic only.
// ============================================================
const COS_BASE = { hat: null, cape: null, back: null, face: null, prop: null, pattern: null, pat2: null, robe: false };
const CS_ = (id, name, blurb, gold, th, look) => ({ id, name, blurb, gold, th, look: { ...COS_BASE, ...look } });
const COSTUMES = [
  CS_('scarecrow', 'Patchwork Scarecrow', 'Straw hat, patched clothes and a trusty pitchfork. Crows beware.', 6000, 15, { hat: 'straw', outfit: '#8a6a3a', accent: '#c9a36a', pattern: 'check', prop: 'pitchfork', face: 'plaster' }),
  CS_('jester', 'Court Jester', 'Bells on, colours split down the middle. The king laughs; you get paid.', 8000, 20, { hat: 'jester', outfit: '#c0302a', accent: '#e8c15a', pattern: 'split', pat2: '#2a5ab0', prop: 'bauble' }),
  CS_('outlaw', 'Hooded Outlaw', 'From the old greenwood ballads: feathered cap, quiver and a steady bow.', 8000, 20, { hat: 'feathercap', outfit: '#3f7a32', accent: '#c9a36a', pattern: 'sash', pat2: '#8a5a32', back: 'quiver', prop: 'bow', cape: '#2f5a2a' }),
  CS_('pirate', 'Pirate Captain', 'Tricorn, gold-trimmed coat, one good eye and a cutlass.', 10000, 25, { hat: 'pirate', outfit: '#9a2a24', accent: '#e8c15a', pattern: 'coat', prop: 'cutlass', face: 'eyepatch' }),
  CS_('ninja', 'Shadow Ninja', 'A wrapped hood, a face cloth and a quick blade. You were never here.', 10000, 25, { hat: 'ninjahood', face: 'ninja', outfit: '#26262e', accent: '#a8463a', pattern: 'sash', pat2: '#a8463a', prop: 'dagger' }),
  CS_('witch', 'Woodland Witch', 'Wide-brimmed hat, a sparkling robe and a broom that mostly flies.', 10000, 25, { hat: 'witch', outfit: '#4a2a6a', accent: '#8fe0a0', robe: true, pattern: 'sparkle', prop: 'broom' }),
  CS_('mummy', 'Ancient Mummy', 'Wrapped head to toe after three thousand years of napping.', 10000, 25, { hat: 'mummy', outfit: '#e8dcc0', accent: '#c9b890', pattern: 'bandage', skin: '#e8dcc0', eyeC: '#ffd23a', beard: 'none' }),
  CS_('detective', 'Great Detective', 'Deerstalker, check coat, cape and a magnifying glass. Elementary.', 10000, 25, { hat: 'deerstalker', outfit: '#8a7a5a', accent: '#5a4a30', pattern: 'check', cape: '#6a5a40', prop: 'magnifier' }),
  CS_('sheriff', 'Frontier Sheriff', 'Wide hat, leather vest, a shiny star and a lasso.', 10000, 25, { hat: 'cowboy', outfit: '#c9a36a', accent: '#8a3a2a', pattern: 'vest', prop: 'lasso' }),
  CS_('merlin', 'Merlin’s Robes', 'The legendary court wizard: starry robes, a long white beard and a crystal staff.', 12000, 30, { hat: 'starwizard', outfit: '#2a3a8a', accent: '#e8c15a', robe: true, pattern: 'stars', beard: 'long', hair: '#f2eee6', prop: 'staff', cape: '#1f2a6a' }),
  CS_('werewolf', 'Moonlit Werewolf', 'Wolf hood, shaggy fur and golden eyes. Howling not included.', 12000, 30, { hat: 'wolfhood', outfit: '#5a4a3a', accent: '#8a7a6a', pattern: 'fur', eyeC: '#e8c020', face: 'fangs' }),
  CS_('viking', 'Viking Raider', 'Horned helm, braided beard, a fur-trimmed tunic and an axe.', 12000, 30, { hat: 'viking', outfit: '#6b4a32', accent: '#c9a36a', pattern: 'fur', prop: 'axe', cape: '#5a3a22', beard: 'braided', hair: '#b5762e' }),
  CS_('count', 'Count of the Night', 'From the old gothic novel: pale skin, slick hair, fangs and a red-lined cape.', 15000, 35, { hs: 'slick', hair: '#1a1a22', outfit: '#1a1a2a', accent: '#a8202a', pattern: 'suit', cape: '#1a1a2a|#a8202a', face: 'fangs', skin: '#e8e4ee', eyeC: '#c0302a', beard: 'none' }),
  CS_('knight', 'Knight of the Round Table', 'Great helm, white tabard with a red cross, sword and a blue cape.', 15000, 35, { hat: 'greathelm', outfit: '#9aa0ac', accent: '#c0302a', pattern: 'tabard', pat2: '#f2ece0', prop: 'sword', cape: '#2a3a8a' }),
  CS_('musketeer', 'Royal Musketeer', 'Plumed hat, blue tabard, a rapier and a dashing goatee.', 15000, 35, { hat: 'musketeer', outfit: '#2a3a7a', accent: '#f2ece0', pattern: 'tabard', pat2: '#2a5ab0', prop: 'rapier', cape: '#2a5ab0', beard: 'goatee', hs: 'long' }),
  CS_('robot', 'Robo-Buddy', 'A friendly boxy robot with a screen face and glowing circuits.', 15000, 35, { hat: 'robot', outfit: '#9aa8b8', accent: '#3ec6ff', pattern: 'circuit', skin: '#9aa8b8', beard: 'none' }),
  CS_('alien', 'Little Green Visitor', 'Bobbly antennae, a silver suit and a ray gun. Takes you to their leader.', 15000, 35, { hat: 'antenna', outfit: '#c0c8d8', accent: '#7fe8a0', pattern: 'astro', prop: 'raygun', skin: '#8fd46a', eyeC: '#1a1a22', hs: 'bald', beard: 'none' }),
  CS_('samurai', 'Samurai Lord', 'Crested helmet, laced red armour and a katana.', 18000, 40, { hat: 'kabuto', outfit: '#8a1f1f', accent: '#e8c15a', pattern: 'lamellar', prop: 'katana' }),
  CS_('jackfrost', 'Jack Frost', 'The winter sprite of folklore: frosted hair, icy wings and a crystal staff.', 18000, 40, { hs: 'spiky', hair: '#dff4ff', outfit: '#7ec8f0', accent: '#f2fbff', pattern: 'frost', back: 'icewings', prop: 'icestaff', skin: '#e2f2fa', eyeC: '#7fd8f0' }),
  CS_('pharaoh', 'Pharaoh', 'Striped headdress, golden collar and a royal crook.', 20000, 45, { hat: 'nemes', outfit: '#f2ece0', accent: '#e8c15a', robe: true, pattern: 'collar', prop: 'crook' }),
  CS_('comet', 'Captain Comet', 'An original hero: purple suit, comet badge, domino mask and a teal cape.', 20000, 45, { face: 'domino', outfit: '#5a2a9a', accent: '#ff8a1f', pattern: 'emblem', pat2: '#ff8a1f', cape: '#1fa3a3', hs: 'spiky' }),
  CS_('dragonling', 'Dragon Hatchling', 'A cosy dragon onesie with horns, a belly patch and little wings.', 20000, 45, { hat: 'dragonhood', outfit: '#4fa84a', accent: '#f2e0a0', pattern: 'belly', back: 'dragonwings' }),
  CS_('fairy', 'Fairy Queen', 'Flower crown, shimmering robe, fairy wings and a star wand.', 20000, 45, { hat: 'flower', outfit: '#ee9ab8', accent: '#fff3b0', robe: true, pattern: 'sparkle', back: 'fairywings', prop: 'wand' }),
  CS_('astronaut', 'Astronaut', 'Space helmet, a white suit with a control panel, jetpack and flag.', 25000, 50, { hat: 'astro', outfit: '#eef0f4', accent: '#3b82e4', pattern: 'astro', back: 'jetpack', prop: 'flag' }),
  CS_('exosuit', 'Clockwork Exosuit', 'Brass armour with goggle helm, gears, a steam jetpack and a big wrench.', 30000, 55, { hat: 'exohelm', outfit: '#b8863a', accent: '#6a4a2a', pattern: 'gears', back: 'jetpack', prop: 'wrench' }),
  CS_('paladin', 'Star Paladin', 'Gleaming white plate, a winged helm and a humming beam blade.', 30000, 60, { hat: 'starhelm', outfit: '#eef2f6', accent: '#3ec6ff', pattern: 'plate', prop: 'beamblade', cape: '#2a5ab0' }),
];
const COSTUME_BY = Object.fromEntries(COSTUMES.map(c => [c.id, c]));
const costumeOwned = id => !!((typeof account !== 'undefined' && account && account.costumes) || {})[id];
const costumeWorn = c => { const co = c && c.costume && COSTUME_BY[c.costume]; return co && costumeOwned(co.id) ? co : null; };
const cosLook = (base, co) => { const L = { ...base, ...co.look }; if (base.gender === 'Female' && co.look.beard && co.look.beard !== 'none') L.beard = base.beard; return L; };
const costumeGold = (c, co) => Math.round(co.gold * priceIndex(c, 1));

function tabCostumes() {
  const owned = COSTUMES.filter(co => costumeOwned(co.id)).length, on = costumeWorn(ch);
  const base = pxLookOf({ ...ch, costume: null }), sz = window.innerWidth <= 720 ? 72 : 96;
  const card = co => {
    const own = costumeOwned(co.id), wearing = on && on.id === co.id, g = costumeGold(ch, co);
    return `<div class="card coscard ${wearing ? 'on' : ''} ${own ? '' : 'buy'}">
      ${pxChibi(cosLook(base, co), sz, { cls: 'cosimg' })}
      <b>${esc(co.name)}</b><span class="mute" style="font-size:12px;line-height:1.3">${esc(co.blurb)}</span>
      <div class="row" style="gap:6px;flex-wrap:wrap;justify-content:center;margin-top:auto">${wearing ? '<button class="sm" data-act="cosoff">Take off</button>' : own ? `<button class="sm pri" data-act="coswear" data-arg="${co.id}">Wear</button>`
        : `<button class="sm" data-act="cosbuy" data-arg="${co.id}|gold" ${ch.gold >= g ? '' : 'disabled'}>${N(g)} gold</button><button class="sm" data-act="cosbuy" data-arg="${co.id}|th" ${account.shards >= co.th ? '' : 'disabled'}>${co.th} Thousandium</button>`}</div></div>`;
  };
  return `<div class="spread"><h2>Costumes</h2><span class="chip">${owned} of ${COSTUMES.length} owned · Thousandium <b class="gold">${N(account.shards)}</b></span></div>
    <p class="mute" style="margin:4px 0 12px">Full sets that go over your Wardrobe look in one tap. Buy each once with gold or Thousandium and it's yours on every character. Your pose and anything a costume doesn't cover (like hair or eyes) stay as you set them in the Wardrobe. Cosmetic only.</p>
    <div class="row" style="gap:12px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><div class="card" style="padding:6px">${heroShowcase(ch, window.innerWidth <= 720 ? 80 : 120, { cls: 'small' })}</div>
      <div>${on ? `Wearing <b>${esc(on.name)}</b> <button class="sm" data-act="cosoff">Take off</button>` : '<span class="mute">No costume on.</span>'}<div style="margin-top:6px"><button class="sm ghost" data-act="tab" data-arg="wardrobe">Open the Wardrobe</button></div></div></div>
    <div class="cosgrid">${[...COSTUMES].sort((a, b) => costumeOwned(b.id) - costumeOwned(a.id)).map(card).join('')}</div>`;
}
function cosChanged() { dirty = true; save(); renderMain(); renderSide(); if (typeof profilePublish === 'function') profilePublish(true); }
const COSTUME_HANDLERS = {
  coswear: id => { if (!costumeOwned(id)) return; ch.costume = id; ch.counters.dressed = (ch.counters.dressed || 0) + 1; checkProgress(); cosChanged(); },
  cosoff: () => { ch.costume = null; cosChanged(); },
  cosbuy: a => {
    const [id, cur] = a.split('|'), co = COSTUME_BY[id]; if (!co || costumeOwned(id)) return;
    const cost = cur === 'th' ? `${co.th} Thousandium` : `${N(costumeGold(ch, co))} gold`;
    modal(`<h3>Buy ${esc(co.name)}?</h3><div style="display:flex;justify-content:center;margin:8px 0">${pxChibi(cosLook(pxLookOf({ ...ch, costume: null }), co), 120)}</div>
      <p>Costs <b>${cost}</b>. It's yours on every character, and you'll put it on now.</p>
      <div class="row" style="justify-content:flex-end;gap:6px"><button data-act="close">Cancel</button><button class="pri" data-act="cosbuyok" data-arg="${a}">Buy</button></div>`);
  },
  cosbuyok: a => {
    closeModal(); const [id, cur] = a.split('|'), co = COSTUME_BY[id]; if (!co || costumeOwned(id)) return;
    if (cur === 'th') { if (account.shards < co.th) { toast(`You need ${co.th} Thousandium.`); return; } account.shards -= co.th; }
    else { const g = costumeGold(ch, co); if (ch.gold < g) { toast(`You need ${N(g)} gold.`); return; } ch.gold -= g; }
    account.costumes = account.costumes || {}; account.costumes[id] = Date.now(); ch.costume = id;
    addLog('sys', `Costume bought: ${co.name} (${cur === 'th' ? `${co.th} Thousandium` : `${N(costumeGold(ch, co))} gold`}).`);
    toast(`<b>${esc(co.name)}</b> is yours.`, 'gold'); renderTop(); cosChanged();
  },
};
