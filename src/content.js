// ============================================================
// CONTENT — skills, gathering chains, items, gear, recipes, titles, achievements.
// Numbers that are derived (value, xp, level, time) come from BALANCE.
// ============================================================
const SKILLS = {
  mining:        { name:'Mining', kind:'gather', verb:'Mine', past:'Mined', tool:'Pickaxe', titleStat:'DEX', yieldStat:'STR' },
  woodcutting:   { name:'Woodcutting', kind:'gather', verb:'Chop', past:'Chopped', tool:'Axe', titleStat:'STR', yieldStat:'STR' },
  farming:       { name:'Farming', kind:'gather', verb:'Harvest', past:'Harvested', tool:'Hoe', titleStat:'VIT' },
  fishing:       { name:'Fishing', kind:'gather', verb:'Fish', past:'Caught', tool:'Rod', titleStat:'PER' },
  herbalism:     { name:'Herbalism', kind:'gather', verb:'Gather', past:'Gathered', tool:'Sickle', titleStat:'WIS' },
  skinning:      { name:'Skinning', kind:'gather', verb:'Skin', past:'Skinned', tool:'Skinning Knife', titleStat:'AGI' },
  blacksmithing: { name:'Blacksmithing', kind:'craft', verb:'Forge', past:'Forged', titleStat:'INT', yieldStat:'STR' },
  alchemy:       { name:'Alchemy', kind:'craft', verb:'Brew', past:'Brewed', titleStat:'INT', yieldStat:'INT' },
  cooking:       { name:'Cooking', kind:'craft', verb:'Cook', past:'Cooked', titleStat:'INT' },
  tailoring:     { name:'Tailoring', kind:'craft', verb:'Sew', past:'Sewed', titleStat:'INT', yieldStat:'DEX' },
  enchanting:    { name:'Enchanting', kind:'craft', verb:'Imbue', past:'Imbued', titleStat:'INT', yieldStat:'INT' },
  jewelcrafting: { name:'Jewelcrafting', kind:'craft', verb:'Cut', past:'Crafted', titleStat:'INT', yieldStat:'DEX' },
  slaying:       { name:'Slaying', kind:'combat', verb:'Fight', past:'Defeated', titleStat:'STR' },
  exploration:   { name:'Exploration', kind:'explore', verb:'Explore', past:'Explored', titleStat:'PER' },
  training:      { name:'Training', kind:'train', verb:'Train', past:'Trained', titleStat:'VIT' },
  beastmastery:  { name:'Beastmastery', kind:'pet', verb:'Raise', past:'Raised', titleStat:'CHARM' },
};
const SKILL_IDS = Object.keys(SKILLS);
const GATHER_SKILLS = SKILL_IDS.filter(s => SKILLS[s].kind === 'gather');
const CRAFT_SKILLS = SKILL_IDS.filter(s => SKILLS[s].kind === 'craft');

const TITLE_NAMES = {
  mining: ['Beginner Miner','Apprentice Miner','Journeyman Miner','Expert Miner','Master Miner','King of the Mines'],
  woodcutting: ['Twig Snapper','Apprentice Woodcutter','Journeyman Lumberjack','Expert Feller','Master Forester','Lord of the Timberlands'],
  farming: ['Seed Sower','Apprentice Farmer','Journeyman Grower','Expert Cultivator','Master Agronomist','Sovereign of the Fields'],
  fishing: ['Puddle Dabbler','Apprentice Angler','Journeyman Fisher','Expert Netcaster','Master Angler','Ruler of the Tides'],
  herbalism: ['Weed Puller','Apprentice Herbalist','Journeyman Gatherer','Expert Botanist','Master Herbalist','Keeper of the Green'],
  skinning: ['Pelt Plucker','Apprentice Skinner','Journeyman Tanner','Expert Furrier','Master Skinner','Hidelord'],
  blacksmithing: ['Anvil Tapper','Apprentice Smith','Journeyman Smith','Expert Smith','Master Smith','Forge King'],
  alchemy: ['Bottle Washer','Apprentice Alchemist','Journeyman Brewer','Expert Alchemist','Master Alchemist','Grand Transmuter'],
  cooking: ['Pot Stirrer','Apprentice Cook','Journeyman Cook','Expert Chef','Master Chef','Feastlord'],
  tailoring: ['Thread Puller','Apprentice Tailor','Journeyman Tailor','Expert Weaver','Master Tailor','Royal Couturier'],
  enchanting: ['Spark Dabbler','Apprentice Enchanter','Journeyman Enchanter','Expert Runecaster','Master Enchanter','Archmagister'],
  jewelcrafting: ['Bead Stringer','Apprentice Jeweler','Journeyman Jeweler','Expert Gemcutter','Master Jeweler','Crown Jeweler'],
  slaying: ['Rat Catcher','Apprentice Slayer','Journeyman Slayer','Expert Hunter','Master Slayer','Bane of Legends'],
  exploration: ['Wanderer','Apprentice Explorer','Journeyman Pathfinder','Expert Cartographer','Master Explorer','Worldwalker'],
  beastmastery: ['Egg Sitter','Apprentice Keeper','Journeyman Tamer','Expert Beastmaster','Master of Beasts','Lord of the Wild Kingdom'],
  training: ['Sweaty Beginner','Apprentice Trainee','Journeyman Athlete','Expert Athlete','Master of Discipline','Living Statue'],
};
const TITLE_STEPS = [[10,0.05,5],[100,0.08,10],[1000,0.12,15],[10000,0.18,25],[100000,0.28,50],[1000000,0.50,100]];
const SKILL_TITLES = Object.fromEntries(SKILL_IDS.map(s => [s, { stat: SKILLS[s].titleStat, line: TITLE_STEPS.map(([n, y, st], i) => [n, TITLE_NAMES[s][i], y, st]) }]));
const GRANDMASTER_BONUS = { yield: 0.02, stat: 'PER', statAmt: 2 };
const SECRET_TITLES = [
  { id:'hoard', name:'Dragon’s Hoard', desc:'Gather 100,000 resources without selling any.', yield:0.03, stat:'LUCK', amt:3 },
  { id:'nightowl', name:'Night Shift', desc:'Be working at the stroke of midnight.', yield:0.02, stat:'PER', amt:2 },
];

const RARITIES = [
  { id:'common', name:'Common', color:'#b9b2a8' }, { id:'uncommon', name:'Uncommon', color:'#62c46d' },
  { id:'rare', name:'Rare', color:'#4f9bff' }, { id:'epic', name:'Epic', color:'#b273ff' },
  { id:'legendary', name:'Legendary', color:'#ff8f2e' }, { id:'mythic', name:'Mythic', color:'#ff4f7a' },
];
const REGION_BANDS = ['Emberfall Village','Whispering Woods','Ironpeak Mountains','Sunken Marsh','Ashen Desert','Frostspire','Void Rift','Worldheart Chasm'];
const ORE_REGIONS = [0,0,0,0,0,1,1,1,1,2,2,2,2,2,3,3,3,3,4,4,4,4,4,5,5,5,5,5,6,6,6,6,6,7,7,7];

// ---- Gathering chains: "Name|colour|flavour", in progression order. The last entry is god-tier.
const CHAIN_DEFS = {
  mining: `Stone|#9c948a|Grey, honest, everywhere. Every legend starts here.
Coal|#4a4542|Black lumps that keep every forge in the realm alight.
Tin|#c7cdd1|Soft and bright. It cries when you bend it.
Copper|#d0783f|Warm metal that greens with age, like old coins.
Iron|#8b8f96|The backbone of swords, ploughs and gates.
Silver|#dfe4ea|Moon-pale and cold. Some creatures hate the touch of it.
Gold|#f1c34a|Heavy, soft and the cause of most arguments.
Quartz|#f3eef0|Clear crystal that hums faintly when struck.
Jade|#3fae7a|Smooth green stone, said to keep travellers safe.
Amethyst|#9a63d6|Violet crystal that keeps a clear head.
Sapphire|#2f67d8|Deep blue, the colour of the sky before rain.
Ruby|#d8264a|Red as a heartbeat and nearly as warm.
Emerald|#1fa860|Green fire locked in stone.
Diamond|#c9f1ff|Nothing scratches it. Plenty of people try.
Obsidian|#2b2235|Volcanic glass with edges sharper than steel.
Cobalt|#2c4fc9|A blue metal that stains everything it touches.
Moonstone|#cfd8f2|Glows softly through the night.
Sunstone|#ff9d2e|Warm to the touch even in snow.
Bloodstone|#7c1424|Dark green flecked with red. Healers prize it.
Darksteel|#3a3f4a|Forged in the deep, it drinks the light.
Orichalcum|#d6a14a|The fabled red-gold of sunken empires.
Adamantite|#5fbf9a|Unbreakable, and almost unworkable.
Mithril|#bfe0ff|Light as silk, strong as a mountain.
Starmetal|#8fa2ff|Fell from the sky. Still remembers the stars.
Dragonstone|#e04a2c|Scaled stone that is warm, like it is breathing.
Frostiron|#9fe2f2|Iron so cold it burns.
Voidstone|#4b2a6b|Looks like a hole in the world. It is not. Probably.
Etherium|#7ff0e0|Half there. Your pick passes through it twice.
Hell Ore|#ff4a1a|Smoulders forever. Handle with tongs.
Heaven Ore|#fff2b0|Radiant and weightless. It tries to float away.
Magic Ore|#c25cff|Raw magic, set into stone.
Chronite|#e3c27a|Ticks faintly. Swing at it and you have already swung.
Soulstone|#7fa7ff|Whispers in voices you almost know.
Primordial Ore|#a0743f|Older than the gods. It was here first.
Worldheart Ore|#ff6b8a|A sliver of the world’s own beating heart.
God Ore|#ffd86b|The last ore. To break it is to be remembered.`,
  woodcutting: `Pine|#6b8f4e|Sticky with sap and smells like winter.
Birch|#e6ddc8|Papery white bark that peels in curls.
Oak|#8a6a3f|Slow-growing and stubborn. Good for doors.
Willow|#9bbf6a|Bends in every wind and never breaks.
Maple|#c8642e|Sweet sap, bright leaves, fine grain.
Ash|#b8a888|Springy wood for spear shafts and tool handles.
Cedar|#a8563a|Moths hate it. Chests love it.
Elm|#7d6a4a|Wet-proof wood for pipes and keels.
Yew|#5e3b2a|Bowyers pay well. Graveyards grow it best.
Redwood|#9c3d2a|Trunks so wide a cart can pass through.
Teak|#a47a42|Oily, golden, and it laughs at rain.
Ironwood|#5c5650|Sinks in water. Blunts careless axes.
Mahogany|#6d2e22|Deep red wood for rich men’s tables.
Ebony|#231c1c|Black heartwood, heavy as stone.
Silverbark|#cfd6dc|Shines at night like a birch dipped in moonlight.
Bloodwood|#7a1220|Weeps red sap when cut.
Ghostwood|#c6ccd8|Pale and cold. You can almost see through it.
Moonwillow|#a8b8ff|Only sways when the moon is up.
Sunpine|#ffc24a|Needles that glow like embers at noon.
Frostfir|#a7e3f2|Rimed bark that never thaws.
Emberoak|#e35a2a|Its acorns are warm. Its heart smoulders.
Stormcedar|#5a6fa8|Lightning strikes it on purpose.
Elderwood|#6e7b4e|Ancient trees that remember the first spring.
Spiritwood|#9fe0c8|Faces drift across the grain.
Dragonwood|#b83a24|Bark like scales. It does not like axes.
Starbark|#8fa2ff|Speckled with tiny lights that wink back.
Voidwood|#3d2a5c|Grows downward, into nothing.
Dryad’s Heart|#5fbf7a|Cut it gently. It is someone’s home.
Celestial Oak|#fff0b0|Its canopy holds up a little piece of sky.
Yggdrasil Bough|#ffd86b|A branch from the tree that holds the nine worlds.`,
  farming: `Potato|#c8a36a|Humble, filling, and grows anywhere.
Wheat|#e3c46a|Golden fields from horizon to horizon.
Carrot|#e8772e|Good for the eyes, or so grandmothers say.
Cabbage|#8fc46a|Layers on layers. Soup awaits.
Onion|#d8b0c8|Makes grown warriors weep.
Flax|#7fa6d8|Blue flowers, strong fibres. Spun into linen.
Barley|#d6c07a|Brewers bless every grain of it.
Corn|#f2d14a|Tall rows that whisper on windy nights.
Cotton|#f4f1ea|Soft white bolls for softer cloth.
Tomato|#e04a3a|A fruit that insists it is a vegetable.
Pumpkin|#e8862e|Grows huge if you sing to it. Allegedly.
Garlic|#efe6d8|Keeps away colds, and possibly worse.
Strawberry|#e8384a|Summer in one bite.
Pepper|#d8302a|Hot enough to make a dwarf cough.
Rice|#f0ecd8|Paddies that mirror the sky.
Grape|#7a3c8a|Half of every festival begins here.
Melon|#9fd06a|Heavy, sweet and perfect on hot days.
Sugarcane|#b8d08a|Chew it and smile.
Cocoa|#7a4a2a|Bitter beans that become something wonderful.
Sunberry|#ffb02e|Berries that keep a little daylight inside.
Moonmelon|#c8d0ff|Ripens only under a full moon.
Frostberry|#9fe2f2|Sweetest after the first hard frost.
Emberpepper|#ff5a1a|Smoulders on the vine. Pick with gloves.
Goldenwheat|#ffd24a|Each grain glints like a tiny coin.
Starfruit|#f8e86a|Five-pointed and faintly glowing.
Silkpod|#f0e8ff|Pods full of fibre finer than spider silk.
Spirit Gourd|#9fe0c8|Rattles with voices when shaken.
Dragon Plum|#c8243a|Hot stones for pits. Dragons fight over them.
Golden Apple|#ffcf3a|From the garden at the edge of the west.
Ambrosia|#ffe6a0|Food of the gods. One taste is enough.`,
  fishing: `Shrimp|#f0a08a|Tiny, curly and always in a hurry.
Sardine|#a8b8c8|Packed tight, wherever they go.
Anchovy|#8a9aa8|Salty little silver darts.
Trout|#c8a08a|Speckled river fish that loves cold water.
Perch|#a8b86a|Striped and suspicious.
Pike|#6a8a5a|All teeth and bad temper.
Salmon|#f07a5a|Swims upstream out of sheer stubbornness.
Carp|#c8a050|Lives forever in the village pond.
Catfish|#6a5a4a|Whiskered bottom-dweller with opinions.
Bass|#5a7a4a|Big mouth, bigger fight.
Cod|#a8a8a0|Flaky, fried, beloved.
Tuna|#3a5a8a|Fast as a thrown spear.
Eel|#4a5a3a|Slips out of every hand.
Lobster|#d8402a|Armoured, clacking and delicious.
Swordfish|#5a7ab8|Duels fishermen and often wins.
Monkfish|#7a6a5a|Ugly as sin, sweet as butter.
Shark|#6a7a8a|Smells one drop of blood a mile away.
Manta Ray|#3a4a6a|Glides like a cloak in the current.
Anglerfish|#3a2a3a|Brings its own lantern to the deep.
Glowfin|#7ff0e0|Lights up the reef at night.
Frostfin|#a7e3f2|Swims under the ice and never slows.
Ember Koi|#ff6a2a|Warms the pond it lives in.
Moonperch|#c8d0ff|Only bites when the moon is on the water.
Stormray|#5a6fa8|Crackles when it breaks the surface.
Abyssal Eel|#2a1a4a|From where sunlight has never been.
Sea Serpent|#2a8a7a|A young one. Its mother is somewhere nearby.
Kraken Spawn|#7a2a5a|Eight arms and a grudge.
Leviathan Fry|#3a6a9a|Already the size of a rowboat.
Golden Carp|#ffcf3a|Said to grant one small wish. It never has.
Salmon of Knowledge|#ffd86b|Taste it and know everything. Mind your thumb.`,
  herbalism: `Mint|#6fc48a|Fresh, bright and everywhere.
Sage|#9aae8a|Grey-green leaves for wise teas.
Thyme|#7a9a5a|Tiny leaves, big flavour.
Chamomile|#f2e6a0|Calms nerves and settles stomachs.
Lavender|#a88ad8|Smells like a quiet afternoon.
Nettle|#5a8a4a|Stings, then heals. Typical.
Yarrow|#e8e0c8|Soldiers pack it for wounds.
Mugwort|#8a9a7a|Strange dreams if you sleep on it.
Valerian|#d8c8d8|Puts cats into a frenzy and people to sleep.
Mandrake|#8a6a4a|Wear earplugs when you pull it.
Wolfsbane|#6a4aa8|Beautiful, and absolutely do not eat it.
Silverleaf|#cfd6dc|Leaves like thin coins.
Moonpetal|#c8d0ff|Opens only at night.
Sunbloom|#ffc24a|Turns to follow the sun across the sky.
Bloodroot|#c8243a|Bleeds red when picked.
Ghostcap|#d8dce8|A pale mushroom that whispers.
Frostlily|#a7e3f2|Blooms in snow and wilts in warmth.
Emberthorn|#ff5a1a|Thorny stems that glow like coals.
Dragon’s Tongue|#e04a2c|Forked leaves, spicy as fire.
Starflower|#fff0a0|Five petals, each a tiny star.
Dreamshade|#6a4a8a|Sleep beside it and see the future, poorly.
Spirit Lotus|#9fe0c8|Floats a hand above the water.
Phoenix Fern|#ff8a2e|Burns away each autumn and returns in spring.
Voidbloom|#3d2a5c|Petals the colour of nothing.
Elysian Lily|#fff6d8|Grows in fields where heroes rest.
Soma Vine|#e8c86a|Pressed for the drink of ancient hymns.
Moly|#f0f0ff|White flower, black root. Proof against enchantment.
Lotus-Eater’s Bloom|#f0a8c8|One sniff and you forget your way home.
Tree of Life Leaf|#5fbf7a|A single leaf can bring a field back to green.
Herb of Immortality|#ffd86b|Found at the bottom of the sea. A snake stole it once.`,
  skinning: `Rabbit Pelt|#c8b89a|Soft and small. Lucky feet not included.
Deer Hide|#a87a4a|Supple leather for boots and belts.
Boar Hide|#6a4a3a|Bristly and tough.
Wolf Pelt|#8a8a8a|Thick grey fur for long winters.
Bear Hide|#5a3a2a|Heavy enough to stop an arrow.
Elk Hide|#9a6a3a|Broad hides from broad beasts.
Lizard Skin|#7aa85a|Scaled, flexible, a little shiny.
Crocodile Hide|#4a6a3a|Armour that grew on its own.
Panther Pelt|#2a2a2a|Black as a moonless night.
Troll Hide|#6a7a5a|It keeps trying to heal itself.
Wyvern Scale|#5a8a7a|Every scale is a small shield.
Basilisk Hide|#7a8a3a|Don’t look at it too long.
Griffin Pelt|#c8a06a|Half fur, half feather, all expensive.
Manticore Hide|#a84a2a|Spikes removed. Mostly.
Chimera Hide|#8a5a8a|Three textures, one very confused animal.
Hydra Scale|#3a7a5a|Cut one, two grow back. Handy.
Nemean Lion Pelt|#e8b84a|No blade can pierce it. Except its own claws.
Frost Giant Hide|#a7c8e8|Enough leather for a small village.
Phoenix Plume|#ff7a2e|Warm, weightless and never quite still.
Jörmungandr Scale|#3a8a8a|One scale from the serpent that circles the world.`,
};
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
const GRANDMASTER_TITLES = { stone:'Stone Sage', iron:'Iron Will', gold:'Goldhand', diamond:'Diamond Delver', mithril:'Mithril Marvel', god_ore:'Godbreaker', yggdrasil_bough:'Worldtree Warden', ambrosia:'Gardener of the Gods', salmon_of_knowledge:'All-Knowing Angler', herb_of_immortality:'The Undying Botanist', jormungandr_scale:'Serpent Flayer' };

function buildResources(B) {
  const out = [];
  for (const [skill, txt] of Object.entries(CHAIN_DEFS)) {
    const c = B.chains[skill], rows = txt.trim().split('\n').map(l => l.split('|')), n = rows.length;
    const step = (B.maxReq - 1) / (n - 1), xpGrowth = Math.pow(B.level.g, step) / B.chainHoursGrowth;
    rows.forEach(([name, color, flavor], k) => {
      const i = k + 1, id = slug(name).replace(/^hell_ore$/, 'hell_ore');
      const base = i <= c.flatUntil ? c.start : c.start + (c.end - c.start) * (i - c.flatUntil) / (n - c.flatUntil);
      out.push({ id: skill === 'mining' && name === 'Primordial Ore' ? 'primordial' : skill === 'mining' && name === 'Worldheart Ore' ? 'worldheart' : id,
        name, color, flavor, skill, index: i, chainLen: n,
        baseTime: Math.round(base * 100) / 100,
        stamina: 1 + Math.floor((i - 1) / c.staminaEvery),
        baseYield: 1,
        value: Math.max(1, Math.round(Math.pow(c.valueGrowth, i - 1))),
        xp: Math.round(Math.pow(xpGrowth, i - 1) * 10) / 10,
        reqLevel: Math.min(B.maxReq, Math.round(1 + (i - 1) * step)),
        band: skill === 'mining' ? ORE_REGIONS[k] : Math.min(7, Math.floor(k / n * 8)),
        region: REGION_BANDS[skill === 'mining' ? ORE_REGIONS[k] : Math.min(7, Math.floor(k / n * 8))],
        rarity: Math.min(5, Math.floor(k / n * 6)),
        type: 'resource',
      });
    });
  }
  // v3.1: four resources past each chain's god-tier, gathered in Hell's Gate (A5) and Heaven's Gate (A10).
  for (const [skill, list] of Object.entries(GATE_RES)) {
    const chain = out.filter(r => r.skill === skill), last = chain[chain.length - 1];
    list.forEach(([name, color, flavor], k) => {
      const hell = k < 2, m = [[3, 2], [6, 3], [14, 5], [30, 8]][k];
      out.push({ id: slug(name), name, color, flavor, skill, index: last.index + 1 + k, chainLen: last.chainLen + 4,
        baseTime: Math.round(last.baseTime * (1.1 + 0.1 * k) * 100) / 100, stamina: last.stamina + 1 + Math.floor(k / 2), baseYield: 1,
        value: Math.round(last.value * m[0]), xp: Math.round(last.xp * m[1] * 10) / 10, reqLevel: 99,
        band: hell ? 8 : 9, region: hell ? 'Hell’s Gate' : 'Heaven’s Gate', rarity: 5, type: 'resource', asc: hell ? 5 : 10 });
    });
  }
  for (const r of out) r.grandTitle = GRANDMASTER_TITLES[r.id] || (r.name + ' Grandmaster');
  return out;
}
// Name|colour|flavour: two Hell's Gate, then two Heaven's Gate, per gathering skill.
const GATE_RES = {
  mining: [['Brimstone', '#e8b020', 'Yellow stone that smokes when you look at it. The doorman sells it by the bucket.'], ['Infernal Obsidian', '#3a1020', 'Black glass with a red heartbeat inside.'],
    ['Seraphite', '#e8f4ff', 'A pale crystal that rings like a choir when struck.'], ['Halo Gold', '#ffe27a', 'Gold so pure it floats a finger above your palm.']],
  woodcutting: [['Charwood', '#4a2a1a', 'Trees that grow already burnt. They never stop smouldering.'], ['Hellbark', '#8a2a1a', 'Bark as hard as iron and twice as angry.'],
    ['Cloudwood', '#f2f4fa', 'Light enough to float. Tie your logs down.'], ['Seraph Willow', '#c8e8d8', 'Its branches bow to everyone who passes.']],
  farming: [['Ember Pepper', '#e8302a', 'Hot enough to light a candle. The imps eat them like sweets.'], ['Brimstone Squash', '#d8781a', 'Grows in ash, tastes of smoke, keeps for a hundred years.'],
    ['Manna Wheat', '#f8e8a8', 'Falls from the sky each morning. You just have to catch it.'], ['Golden Nectarine', '#ffb84a', 'One bite and you forget you were ever hungry.']],
  fishing: [['Lava Eel', '#ff6a1a', 'Swims through molten rock and complains about the cold.'], ['Cinder Koi', '#c0302a', 'A fish of living embers. Do not hold it for long.'],
    ['Cloud Carp', '#d8ecff', 'Swims through the sky above the steps. Bring a long line.'], ['Starlight Ray', '#b8a8ff', 'Glides on light. Its tail leaves a little comet behind.']],
  herbalism: [['Hellbloom', '#a8102a', 'A flower that blooms only when somebody is grumpy nearby.'], ['Sulfur Thistle', '#d8c020', 'Smells terrible. Heals wonderfully.'],
    ['Halo Lily', '#fffbe8', 'A lily with a tiny ring of light above each petal.'], ['Seraph Sage', '#a8e8c8', 'One sniff and you feel forgiven for something.']],
  skinning: [['Hellhound Hide', '#5a1a1a', 'Warm to the touch, forever. Great for winter boots.'], ['Imp Leather', '#7a2a4a', 'Thin, tough and covered in tiny rude tattoos.'],
    ['Pegasus Down', '#f8f8ff', 'Soft as a cloud and just as hard to keep in a bag.'], ['Seraph Plume', '#ffe8a0', 'A feather of light. It casts no shadow.']],
};

// ---- Plain items (materials, consumables, supplies, junk, keepsakes)
const ITEMS = {
  copper_coin: { name:'Lucky Copper Coin', type:'keepsake', rarity:1, value:1, bind:true, desc:'Worn smooth by a nervous thumb.' },
  signet_ring: { name:'House Signet Ring', type:'keepsake', rarity:2, value:50, bind:true, desc:'Your family crest. Too precious to wear in a mine.' },
  hooded_cloak: { name:'Outcast’s Hood', type:'keepsake', rarity:1, value:5, bind:true, desc:'Deep pockets, deeper shadows.' },
  vial: { name:'Glass Vial', type:'supply', rarity:0, value:2, cost:6, desc:'Alchemy needs something to pour into.' },
  thread: { name:'Spool of Thread', type:'supply', rarity:0, value:2, cost:5, desc:'For Tailoring.' },
  spice: { name:'Spice Pouch', type:'supply', rarity:0, value:3, cost:8, desc:'For Cooking. Salt, pepper and a secret.' },
  polish: { name:'Polishing Cloth', type:'supply', rarity:0, value:4, cost:15, desc:'For Jewelcrafting.' },
  reforge_destiny: { name:'Reforge Destiny', type:'upgrade', rarity:5, value:0, bind:true, desc:'Use to change your class. Your tier is kept; class talents are refunded.' },
  satchel: { name:'Satchel of Holding', type:'upgrade', rarity:3, value:0, desc:'Use to add 5 inventory slots, permanently.' },
  // potions (made by Alchemy, some sold for gold)
  potion_prod: { name:'Production Potion', type:'potion', cat:'yield', rarity:1, power:0.20, mins:30, cost:500, desc:'+20% yield for 30 minutes.' },
  potion_prod2: { name:'Greater Production Potion', type:'potion', cat:'yield', rarity:2, power:0.35, mins:60, cost:6000, desc:'+35% yield for 60 minutes.' },
  potion_prod3: { name:'Mythic Production Potion', type:'potion', cat:'yield', rarity:5, power:0.50, mins:60, cost:90000, desc:'+50% yield for 60 minutes.' },
  miners_brew: { name:'Miner’s Brew', type:'potion', cat:'yield', skill:'mining', rarity:2, power:0.40, mins:30, cost:3000, desc:'+40% Mining yield for 30 minutes.' },
  woodsmans_ale: { name:'Woodsman’s Ale', type:'potion', cat:'yield', skill:'woodcutting', rarity:2, power:0.40, mins:30, cost:3000, desc:'+40% Woodcutting yield for 30 minutes.' },
  harvesters_tonic: { name:'Harvester’s Tonic', type:'potion', cat:'yield', skill:'farming', rarity:2, power:0.40, mins:30, cost:3000, desc:'+40% Farming yield for 30 minutes.' },
  anglers_draught: { name:'Angler’s Draught', type:'potion', cat:'yield', skill:'fishing', rarity:2, power:0.40, mins:30, cost:3000, desc:'+40% Fishing yield for 30 minutes.' },
  lucky_draught: { name:'Lucky Draught', type:'potion', cat:'proc', rarity:2, power:0.03, mins:30, cost:2000, desc:'+3% Lucky Strike chance for 30 minutes.' },
  grand_lucky: { name:'Grand Lucky Draught', type:'potion', cat:'proc', rarity:3, power:0.06, mins:60, desc:'+6% Lucky Strike chance for 60 minutes.' },
  scholar_tea: { name:'Scholar’s Tea', type:'potion', cat:'xp', rarity:1, power:0.25, mins:30, cost:1200, desc:'+25% XP for 30 minutes.' },
  sage_tea: { name:'Greater Scholar’s Tea', type:'potion', cat:'xp', rarity:3, power:0.40, mins:60, desc:'+40% XP for 60 minutes.' },
  clover_tonic: { name:'Clover Tonic', type:'potion', cat:'luck', rarity:2, power:0.04, mins:30, cost:2500, desc:'+4% bonus-find chance for 30 minutes.' },
  // Shop-only higher tiers (no level or stat requirement; just gold)
  potion_prod4: { name:'Ascendant Production Potion', type:'potion', cat:'yield', rarity:5, power:0.75, mins:60, shopOnly:true, desc:'+75% yield for 60 minutes.' },
  potion_prod5: { name:'Celestial Production Potion', type:'potion', cat:'yield', rarity:5, power:1.00, mins:60, shopOnly:true, desc:'+100% yield for 60 minutes.' },
  potion_prod6: { name:'Divine Production Potion', type:'potion', cat:'yield', rarity:5, power:1.50, mins:60, shopOnly:true, desc:'+150% yield for 60 minutes.' },
  sage_draught: { name:'Sage’s Draught', type:'potion', cat:'xp', rarity:4, power:0.60, mins:60, shopOnly:true, desc:'+60% XP for 60 minutes.' },
  archsage_elixir: { name:'Archsage Elixir', type:'potion', cat:'xp', rarity:5, power:0.80, mins:60, shopOnly:true, desc:'+80% XP for 60 minutes.' },
  enlightenment: { name:'Elixir of Enlightenment', type:'potion', cat:'xp', rarity:5, power:1.20, mins:60, shopOnly:true, desc:'+120% XP for 60 minutes.' },
  fortunes_favor: { name:'Fortune’s Favor', type:'potion', cat:'proc', rarity:4, power:0.09, mins:60, shopOnly:true, desc:'+9% Lucky Strike chance for 60 minutes.' },
  jackpot_tonic: { name:'Jackpot Tonic', type:'potion', cat:'proc', rarity:5, power:0.12, mins:60, shopOnly:true, desc:'+12% Lucky Strike chance for 60 minutes.' },
  destiny_draught: { name:'Draught of Destiny', type:'potion', cat:'proc', rarity:5, power:0.15, mins:60, shopOnly:true, desc:'+15% Lucky Strike chance for 60 minutes.' },
  fourleaf_elixir: { name:'Four-Leaf Elixir', type:'potion', cat:'luck', rarity:3, power:0.06, mins:60, shopOnly:true, desc:'+6% bonus-find chance for 60 minutes.' },
  rainbow_tonic: { name:'Rainbow Tonic', type:'potion', cat:'luck', rarity:4, power:0.08, mins:60, shopOnly:true, desc:'+8% bonus-find chance for 60 minutes.' },
  eye_of_fortune: { name:'Eye of Fortune', type:'potion', cat:'luck', rarity:5, power:0.12, mins:60, shopOnly:true, desc:'+12% bonus-find chance for 60 minutes.' },
  // enchant stones
  lesser_stone: { name:'Lesser Enchant Stone', type:'stone', rarity:1, desc:'Upgrades gear from +0 to +3.' },
  greater_stone: { name:'Greater Enchant Stone', type:'stone', rarity:2, desc:'Upgrades gear from +3 to +6.' },
  grand_stone: { name:'Grand Enchant Stone', type:'stone', rarity:3, desc:'Upgrades gear from +6 to +9.' },
  mythic_stone: { name:'Mythic Enchant Stone', type:'stone', rarity:5, desc:'The final step: +9 to +10.' },
};
const JUNK = {
  mining: [['shiny_pebble','Shiny Pebble',12],['fossil_shell','Fossil Shell',40]],
  woodcutting: [['birds_nest','Bird’s Nest',15],['carved_twig','Carved Twig',30]],
  farming: [['lost_button','Lost Button',10],['clay_figurine','Clay Figurine',45]],
  fishing: [['old_boot','Old Boot',8],['bottle_message','Message in a Bottle',60]],
  herbalism: [['pressed_flower','Pressed Flower',14],['beetle_shell','Jewel Beetle Shell',35]],
  skinning: [['old_arrowhead','Old Arrowhead',18],['tooth_charm','Tooth Charm',50]],
};
for (const [skill, list] of Object.entries(JUNK)) for (const [id, name, value] of list) ITEMS[id] = { name, type:'junk', rarity:0, value, desc:`Vendor trash found while ${SKILLS[skill].name.toLowerCase()}. Sell it.` };
const POTION_CATS = { yield:'Yield', proc:'Bonus Proc', xp:'XP', luck:'Luck', food:'Food' };

// ---- Gear bases
const SLOTS = ['head','chest','legs','boots','gloves','weapon','offhand','ring1','ring2','amulet'];
const SLOT_NAMES = { head:'Head', chest:'Chest', legs:'Legs', boots:'Boots', gloves:'Gloves', weapon:'Weapon', offhand:'Offhand', ring1:'Ring', ring2:'Ring', amulet:'Amulet', tool:'Tool' };
const GEAR = {
  worn_pickaxe: { name:'Worn Pickaxe', slot:'tool', toolSkill:'mining', speed:0.02, rarity:0, value:2, lvl:1, desc:'Chipped, but it still swings.' },
  worn_axe: { name:'Worn Hatchet', slot:'tool', toolSkill:'woodcutting', speed:0.02, rarity:0, value:2, lvl:1, desc:'More notch than edge.' },
  worn_hoe: { name:'Worn Hoe', slot:'tool', toolSkill:'farming', speed:0.02, rarity:0, value:2, lvl:1, desc:'Grandfather’s, probably.' },
  worn_rod: { name:'Willow Switch Rod', slot:'tool', toolSkill:'fishing', speed:0.02, rarity:0, value:2, lvl:1, desc:'A stick, a string, and hope.' },
  worn_sickle: { name:'Worn Sickle', slot:'tool', toolSkill:'herbalism', speed:0.02, rarity:0, value:2, lvl:1, desc:'Rusty but sharp enough.' },
  worn_knife: { name:'Worn Skinning Knife', slot:'tool', toolSkill:'skinning', speed:0.02, rarity:0, value:2, lvl:1, desc:'Keep it away from your thumbs.' },
  sturdy_mattock: { name:'Sturdy Mattock', slot:'tool', toolSkill:'mining', speed:0.05, rarity:0, value:40, lvl:1, desc:'Farm tool, rock tool, same thing.' },
};
const STARTER_TOOLS = { mining:'worn_pickaxe', woodcutting:'worn_axe', farming:'worn_hoe', fishing:'worn_rod', herbalism:'worn_sickle', skinning:'worn_knife' };
const TOOL_SPEED = [0.04, 0.07, 0.10, 0.13, 0.17, 0.21, 0.26];
const TIER_RARITY = [0, 0, 1, 2, 3, 3, 4];

// ---- Recipes (inputs reference resource ids or item ids). Derived numbers fill in below.
const RECIPES = [];
function R(skill, id, name, inputs, opt) { RECIPES.push(Object.assign({ skill, id: 'r_' + id, out: id, name, inputs, qty: 1 }, opt || {})); }
function item(id, def) { ITEMS[id] = def; return id; }
function gear(id, def) { GEAR[id] = def; return id; }

const METALS = [
  ['bronze','Bronze',{ copper:1, tin:1 },'pine'], ['iron','Iron',{ iron:2 },'maple'], ['steel','Steel',{ iron:1, coal:2 },'yew'],
  ['darksteel','Darksteel',{ darksteel:2, coal:2 },'mahogany'], ['adamantite','Adamantite',{ adamantite:2, coal:3 },'moonwillow'],
  ['mithril','Mithril',{ mithril:2, coal:3 },'stormcedar'], ['starmetal','Starmetal',{ starmetal:2, coal:4 },'starbark'],
];
// Bars
METALS.forEach(([m, M, ins], t) => { item(m + '_bar', { name: M + ' Bar', type:'material', rarity: TIER_RARITY[t], desc:`Smelted ${M.toLowerCase()}, ready for the anvil.` }); R('blacksmithing', m + '_bar', M + ' Bar', ins, { cat:'Bars' }); });
item('silver_bar', { name:'Silver Bar', type:'material', rarity:1, desc:'For rings and charms.' }); R('blacksmithing', 'silver_bar', 'Silver Bar', { silver:2 }, { cat:'Bars' });
item('gold_bar', { name:'Gold Bar', type:'material', rarity:2, desc:'Soft, heavy, beautiful.' }); R('blacksmithing', 'gold_bar', 'Gold Bar', { gold:2 }, { cat:'Bars' });
// Metal gear and tools
const p = (base, t) => Math.round(base * Math.pow(1.55, t));
METALS.forEach(([m, M, , wood], t) => {
  const r = TIER_RARITY[t], bar = m + '_bar', n = t + 1;
  const armour = [
    ['sword', 'Sword', 'weapon', { [bar]:2, [wood]:1 }, { attack: p(5, t), stats: { STR: 2 * n } }, 'Weapons'],
    ['shield', 'Shield', 'offhand', { [bar]:3 }, { defense: p(4, t), stats: { VIT: 2 * n } }, 'Armour'],
    ['helm', 'Helm', 'head', { [bar]:2 }, { defense: p(3, t), stats: { VIT: n } }, 'Armour'],
    ['plate', 'Platebody', 'chest', { [bar]:5 }, { defense: p(6, t), stats: { VIT: 3 * n } }, 'Armour'],
    ['greaves', 'Greaves', 'legs', { [bar]:3 }, { defense: p(4, t), stats: { STR: n } }, 'Armour'],
  ];
  for (const [k, N, slot, ins, st, cat] of armour) { gear(`${k}_${t}`, Object.assign({ name: `${M} ${N}`, slot, rarity: r, desc: `${M} ${N.toLowerCase()}.` }, st)); R('blacksmithing', `${k}_${t}`, `${M} ${N}`, ins, { cat, gearOut: true }); }
  const tools = [['pickaxe', 'Pickaxe', 'mining'], ['axe', 'Axe', 'woodcutting'], ['hoe', 'Hoe', 'farming'], ['sickle', 'Sickle', 'herbalism'], ['knife', 'Skinning Knife', 'skinning']];
  for (const [k, N, sk] of tools) { gear(`${k}_${t}`, { name: `${M} ${N}`, slot:'tool', toolSkill: sk, speed: TOOL_SPEED[t], rarity: r, desc: `+${Math.round(TOOL_SPEED[t] * 100)}% ${SKILLS[sk].name} speed.` }); R('blacksmithing', `${k}_${t}`, `${M} ${N}`, { [bar]: k === 'sickle' || k === 'knife' ? 1 : 2, [wood]: 1 }, { cat:'Tools', gearOut: true }); }
});
// Tailoring: leather, cloth, leather & cloth gear, fishing rods
const LEATHERS = [['rough','Rough','rabbit_pelt'], ['wolf','Wolfhide','wolf_pelt'], ['scaled','Scaled','lizard_skin'], ['troll','Troll','troll_hide'], ['griffin','Griffin','griffin_pelt'], ['hydra','Hydra','hydra_scale'], ['ember','Emberhide','phoenix_plume']];
LEATHERS.forEach(([k, K, hide], t) => {
  item(k + '_leather', { name: K + ' Leather', type:'material', rarity: TIER_RARITY[t], desc:'Tanned and ready to stitch.' });
  R('tailoring', k + '_leather', K + ' Leather', { [hide]:2 }, { cat:'Leather & cloth' });
  gear(`boots_${t}`, { name:`${K} Boots`, slot:'boots', defense: p(2, t), stats:{ AGI: 2 * (t + 1) }, rarity: TIER_RARITY[t], desc:'Light on the feet.' });
  R('tailoring', `boots_${t}`, `${K} Boots`, { [k + '_leather']:2, thread:2 }, { cat:'Armour', gearOut: true });
  gear(`gloves_${t}`, { name:`${K} Gloves`, slot:'gloves', defense: p(2, t), stats:{ DEX: 2 * (t + 1) }, rarity: TIER_RARITY[t], desc:'Nimble fingers, safe fingers.' });
  R('tailoring', `gloves_${t}`, `${K} Gloves`, { [k + '_leather']:2, thread:2 }, { cat:'Armour', gearOut: true });
  const wood = METALS[t][3];
  gear(`rod_${t}`, { name:`${CHAIN_DEFS.woodcutting.split('\n').map(l => l.split('|')[0]).find(n => slug(n) === wood)} Rod`, slot:'tool', toolSkill:'fishing', speed: TOOL_SPEED[t], rarity: TIER_RARITY[t], desc:`+${Math.round(TOOL_SPEED[t] * 100)}% Fishing speed.` });
  R('tailoring', `rod_${t}`, GEAR[`rod_${t}`].name, { [wood]:2, thread:3 }, { cat:'Tools', gearOut: true });
});
const CLOTHS = [['linen','Linen','flax',0], ['cotton','Cotton','cotton',2], ['silk','Silk','silkpod',5]];
CLOTHS.forEach(([k, K, crop, t]) => {
  item(k + '_cloth', { name: K + ' Cloth', type:'material', rarity: TIER_RARITY[t], desc:'Woven and ready to cut.' });
  R('tailoring', k + '_cloth', K + ' Cloth', { [crop]:3 }, { cat:'Leather & cloth' });
  gear(`hood_${k}`, { name:`${K} Hood`, slot:'head', defense: p(1, t), stats:{ INT: 2 * (t + 1), WIS: t + 1 }, rarity: TIER_RARITY[t], desc:'Keeps the thoughts in.' });
  R('tailoring', `hood_${k}`, `${K} Hood`, { [k + '_cloth']:2, thread:2 }, { cat:'Armour', gearOut: true });
  gear(`robe_${k}`, { name:`${K} Robe`, slot:'chest', defense: p(2, t), stats:{ INT: 3 * (t + 1), WIS: 2 * (t + 1) }, rarity: TIER_RARITY[t], desc:'Flowing, and full of pockets.' });
  R('tailoring', `robe_${k}`, `${K} Robe`, { [k + '_cloth']:4, thread:3 }, { cat:'Armour', gearOut: true });
});
// Jewelcrafting
const JEWELS = [
  ['ring','Quartz Ring','silver_bar','quartz','LUCK'], ['amulet','Jade Amulet','silver_bar','jade','CHARM'], ['ring','Amethyst Ring','silver_bar','amethyst','WIS'],
  ['ring','Sapphire Ring','gold_bar','sapphire','DEX'], ['ring','Ruby Ring','gold_bar','ruby','STR'], ['amulet','Emerald Amulet','gold_bar','emerald','PER'],
  ['ring','Diamond Ring','gold_bar','diamond','LUCK'], ['amulet','Moonstone Amulet','mithril_bar','moonstone','WIS'], ['amulet','Sunstone Amulet','gold_bar','sunstone','CHARM'],
  ['amulet','Bloodstone Amulet','gold_bar','bloodstone','VIT'], ['ring','Dragonstone Ring','starmetal_bar','dragonstone','STR'], ['amulet','Soulstone Amulet','starmetal_bar','soulstone','INT'],
];
JEWELS.forEach(([kind, name, bar, gem, stat]) => {
  const id = slug(name), gi = CHAIN_DEFS.mining.split('\n').findIndex(l => slug(l.split('|')[0]) === gem) + 1;
  gear(id, { name, slot: kind === 'ring' ? 'ring' : 'amulet', stats:{ [stat]: Math.round(3 + gi * 0.8) }, rarity: Math.min(5, Math.floor(gi / 6)), desc:`+${stat}. Cut from ${gem}.` });
  R('jewelcrafting', id, name, { [bar]:1, [gem]:2, polish:1 }, { cat: kind === 'ring' ? 'Rings' : 'Amulets', gearOut: true });
});
// Alchemy
[['potion_prod',{ mint:3, sage:2, vial:1 }], ['scholar_tea',{ chamomile:3, vial:1 }], ['miners_brew',{ nettle:3, coal:5, vial:1 }],
 ['woodsmans_ale',{ yarrow:3, barley:3, vial:1 }], ['harvesters_tonic',{ lavender:3, wheat:3, vial:1 }], ['anglers_draught',{ valerian:3, sardine:3, vial:1 }],
 ['lucky_draught',{ mandrake:2, vial:1 }], ['clover_tonic',{ silverleaf:3, vial:1 }], ['potion_prod2',{ moonpetal:3, sunbloom:2, vial:1 }],
 ['grand_lucky',{ starflower:3, vial:1 }], ['sage_tea',{ dreamshade:3, vial:1 }], ['potion_prod3',{ phoenix_fern:3, spirit_lotus:2, vial:1 }],
].forEach(([id, ins]) => R('alchemy', id, ITEMS[id].name, ins, { cat: ITEMS[id].cat === 'yield' ? 'Yield potions' : 'Other potions' }));
// Cooking — food buffs (one at a time; also heals once Combat arrives)
const FOODS = [
  ['baked_potato','Baked Potato',{ potato:2, spice:1 },{ xp:0.05 },15], ['bread','Farmhouse Bread',{ wheat:3 },{ gyield:0.05 },20],
  ['grilled_trout','Grilled Trout',{ trout:2, spice:1 },{ xp:0.08 },20], ['veg_stew','Vegetable Stew',{ carrot:2, cabbage:2, onion:1 },{ stamina:1 },20],
  ['salmon_fillet','Salmon Fillet',{ salmon:2, spice:1 },{ xp:0.10 },30], ['pumpkin_pie','Pumpkin Pie',{ pumpkin:2, wheat:2 },{ gyield:0.10 },30],
  ['garlic_lobster','Garlic Butter Lobster',{ lobster:1, garlic:2 },{ stamina:1, xp:0.05 },30], ['fish_stew','Hearty Fish Stew',{ tuna:2, potato:2, pepper:1 },{ stamina:2 },30],
  ['swordfish_steak','Swordfish Steak',{ swordfish:2, spice:1 },{ xp:0.15 },30], ['sunberry_tart','Sunberry Tart',{ sunberry:2, wheat:2 },{ gyield:0.15 },30],
  ['starfruit_sorbet','Starfruit Sorbet',{ starfruit:2, frostberry:2 },{ proc:0.03 },30], ['deep_feast','Feast of the Deep',{ sea_serpent:1, rice:3, goldenwheat:2 },{ stamina:2, gyield:0.10 },60],
  ['ambrosial_banquet','Ambrosial Banquet',{ ambrosia:1, golden_apple:1, salmon_of_knowledge:1 },{ stamina:3, xp:0.25 },60],
  ['hellfire_chili','Hellfire Chili',{ ember_pepper:2, lava_eel:1, brimstone_squash:1 },{ stamina:3, gyield:0.15 },60],
  ['manna_feast','Feast of Manna',{ manna_wheat:2, cloud_carp:1, golden_nectarine:1 },{ stamina:4, xp:0.30 },60],
];
const HEAL_FOODS = [['cooked_shrimp','Cooked Shrimp','shrimp'],['cooked_trout','Cooked Trout','trout'],['cooked_pike','Cooked Pike','pike'],['cooked_salmon','Cooked Salmon','salmon'],['cooked_tuna','Seared Tuna','tuna'],['cooked_lobster','Boiled Lobster','lobster'],['cooked_swordfish','Grilled Swordfish','swordfish'],['cooked_shark','Shark Steak','shark'],['cooked_angler','Anglerfish Stew','anglerfish'],['cooked_frostfin','Frostfin Fillet','frostfin'],['cooked_abyssal','Abyssal Eel Roast','abyssal_eel'],['cooked_kraken','Kraken Calamari','kraken_spawn'],['roast_lava_eel','Roast Lava Eel','lava_eel'],['cloud_carp_fillet','Cloud Carp Fillet','cloud_carp']];
const fxText = f => Object.entries(f).map(([k, v]) => k === 'stamina' ? `+${v} Stamina` : k === 'xp' ? `+${Math.round(v * 100)}% XP` : k === 'gyield' ? `+${Math.round(v * 100)}% gathering yield` : `+${Math.round(v * 100)}% Lucky Strike`).join(', ');
FOODS.forEach(([id, name, ins, fx, mins], k) => {
  item(id, { name, type:'food', cat:'food', fx, mins, rarity: Math.min(5, Math.floor(k / 2.6)), desc:`${fxText(fx)} for ${mins} minutes.` });
  R('cooking', id, name, ins, { cat:'Meals' });
});
HEAL_FOODS.forEach(([id, name, fish], k) => {
  item(id, { name, type:'food', cat:'food', fx:{}, mins:0, rarity: Math.min(5, Math.floor(k / 2)), desc:'Heals in combat. Eaten automatically when your HP runs low.' });
  R('cooking', id, name, { [fish]:1 }, { cat:'Combat food' });
});
// Enchanting
[['lesser_stone',{ quartz:3, mint:2 }], ['greater_stone',{ amethyst:3, moonpetal:2 }], ['grand_stone',{ diamond:2, starflower:2 }], ['mythic_stone',{ magic_ore:2, elysian_lily:2 }]]
  .forEach(([id, ins]) => R('enchanting', id, ITEMS[id].name, ins, { cat:'Enchant stones' }));

// Derive recipe numbers and output values from inputs (dependency order is the order they were defined).
function finishContent(B, RES) {
  for (const it of Object.values(ITEMS)) if (it.type === 'potion') { const E = B.economy; it.cost = Math.max(10, Math.round(E.potionUnit[it.skill ? 'skill' : it.cat] * Math.pow(it.power, E.potionExp) * it.mins / 60)); if (it.shopOnly) it.value = Math.round(it.cost * 0.2); }
  const ref = {};
  for (const r of RES) ref[r.id] = { value: r.value, xp: r.xp, lvl: r.reqLevel };
  for (const [id, it] of Object.entries(ITEMS)) if (it.type === 'supply') ref[id] = { value: it.value, xp: 0.5, lvl: 1 };
  for (const rc of RECIPES) {
    let v = 0, x = 0, l = 1;
    for (const [i, q] of Object.entries(rc.inputs)) { const r = ref[i]; if (!r) throw new Error('Unknown input ' + i + ' in ' + rc.id); v += r.value * q; x += r.xp * q; l = Math.max(l, r.lvl); }
    rc.lvl = l; rc.xp = Math.round(x * B.craft.xpMult * 10) / 10 + 1;
    rc.baseTime = Math.round((B.craft.baseTimeMin + (B.craft.baseTimeMax - B.craft.baseTimeMin) * (l - 1) / 98) * 100) / 100;
    rc.stamina = 1 + Math.floor((l - 1) / 33);
    const outVal = Math.max(1, Math.ceil(v * B.craft.valueMult / rc.qty));
    const tgt = rc.gearOut ? GEAR[rc.out] : ITEMS[rc.out];
    tgt.value = tgt.value || outVal; tgt.lvl = tgt.lvl || l;
    // shop cost stays the designed base; the shop applies a floor of 1.5x value so buying to resell never pays
    if (tgt.type === 'food') { tgt.heal = Math.round(30 + l * 25 * (Object.keys(tgt.fx || {}).length ? 0.6 : 1)); if (!Object.keys(tgt.fx || {}).length) tgt.desc = `Heals ${tgt.heal} HP. Eaten automatically in combat when HP runs low.`; else tgt.desc += ` Heals ${tgt.heal} HP.`; }
    ref[rc.out] = { value: tgt.value, xp: rc.xp, lvl: l };
  }
  // Potions sell for at most half their level-1 shop price, so tiers stay in order and buying to resell never pays.
  for (const it of Object.values(ITEMS)) if (it.type === 'potion') it.value = Math.max(1, Math.min(it.value || 1, Math.round(it.cost * 0.5)));
}

// ---- Shop & daily merchant
const SHOP = {
  tools: ['pickaxe_0','axe_0','hoe_0','rod_0','sickle_0','knife_0','pickaxe_1','axe_1','hoe_1','rod_1','sickle_1','knife_1'],
  supplies: ['vial','thread','spice','polish'],
  potions: [['Yield', ['potion_prod','potion_prod2','potion_prod3','potion_prod4','potion_prod5','potion_prod6']],
    ['XP', ['scholar_tea','sage_tea','sage_draught','archsage_elixir','enlightenment']],
    ['Lucky Strike', ['lucky_draught','grand_lucky','fortunes_favor','jackpot_tonic','destiny_draught']],
    ['Bonus find', ['clover_tonic','fourleaf_elixir','rainbow_tonic','eye_of_fortune']],
    ['One skill', ['miners_brew','woodsmans_ale','harvesters_tonic','anglers_draught']]],
};
const MERCHANT_POOL = [
  { key:'satchel', price:25000, stock:1 }, { key:'potion_prod2', price:4500, stock:3 }, { key:'grand_lucky', price:9000, stock:2 },
  { key:'sage_tea', price:7000, stock:2 }, { key:'lesser_stone', price:1200, stock:5 }, { key:'greater_stone', price:9000, stock:2 },
  { key:'g:pickaxe_2:2:0', price:6000, stock:1 }, { key:'g:axe_2:2:0', price:6000, stock:1 }, { key:'g:rod_2:2:0', price:6000, stock:1 },
  { key:'g:quartz_ring:3:0', price:5000, stock:1 }, { key:'g:jade_amulet:3:0', price:5000, stock:1 },
];

// ---- Achievements (recognition only, no rewards)
const ACHIEVEMENTS = [
  { id:'first_swing', cat:'Gathering', name:'First Swing', desc:'Gather your first resource.', pts:5, goal:1, stat:'gathered' },
  { id:'pebbles', cat:'Gathering', name:'Pebble Pusher', desc:'Gather 100 resources.', pts:10, goal:100, stat:'gathered' },
  { id:'quarry', cat:'Gathering', name:'Quarry Hand', desc:'Gather 10,000 resources.', pts:25, goal:1e4, stat:'gathered' },
  { id:'mountain', cat:'Gathering', name:'Mountain Mover', desc:'Gather 1,000,000 resources.', pts:50, goal:1e6, stat:'gathered' },
  { id:'mastered', cat:'Gathering', name:'Muscle Memory', desc:'Bring any resource or recipe to Mastered (T7).', pts:10, goal:1, stat:'mastered' },
  { id:'mastered10', cat:'Gathering', name:'Many Hands', desc:'Master 10 resources or recipes.', pts:25, goal:10, stat:'mastered' },
  { id:'grandmaster', cat:'Gathering', name:'One Hundred Thousand Swings', desc:'Reach Grandmaster on anything.', pts:50, goal:1, stat:'grand' },
  { id:'halfway', cat:'Gathering', name:'Halfway Down', desc:'Unlock 18 ores.', pts:25, goal:18, stat:'oresUnlocked' },
  { id:'godbreaker', cat:'Gathering', name:'The Last Ore', desc:'Mine God Ore.', pts:100, goal:1, stat:'godore' },
  { id:'allround', cat:'Gathering', name:'Jack of All Trades', desc:'Reach level 10 in every gathering skill.', pts:25, goal:10, stat:'minGatherLvl' },
  { id:'two_hands', cat:'Gathering', name:'Two Hands', desc:'Run 2 actions at once.', pts:5, goal:2, stat:'maxActive' },
  { id:'juggler', cat:'Gathering', name:'Juggler', desc:'Run 5 actions at once.', pts:25, goal:5, stat:'maxActive' },
  { id:'first_craft', cat:'Crafting', name:'Made by Hand', desc:'Craft anything.', pts:5, goal:1, stat:'crafted' },
  { id:'crafts1k', cat:'Crafting', name:'Production Line', desc:'Craft 1,000 items.', pts:25, goal:1000, stat:'crafted' },
  { id:'fine', cat:'Crafting', name:'Fine Work', desc:'Craft a Fine or better item.', pts:10, goal:1, stat:'fine' },
  { id:'masterwork', cat:'Crafting', name:'Masterwork', desc:'Craft a Masterwork item.', pts:25, goal:1, stat:'masterwork' },
  { id:'plus5', cat:'Crafting', name:'Daring Enchanter', desc:'Upgrade an item to +5.', pts:15, goal:5, stat:'maxPlus' },
  { id:'plus10', cat:'Crafting', name:'Perfectly Honed', desc:'Upgrade an item to +10.', pts:50, goal:10, stat:'maxPlus' },
  { id:'dressed', cat:'Crafting', name:'Fully Dressed', desc:'Fill every gear slot.', pts:15, goal:10, stat:'slotsFilled' },
  { id:'first_sale', cat:'Economy', name:'Open for Business', desc:'Sell an item.', pts:5, goal:1, stat:'sold' },
  { id:'thousand', cat:'Economy', name:'Thousandaire', desc:'Earn 1,000 gold.', pts:10, goal:1e3, stat:'goldEarned' },
  { id:'goldrush', cat:'Economy', name:'Gold Rush', desc:'Earn 1,000,000 gold.', pts:50, goal:1e6, stat:'goldEarned' },
  { id:'tooled', cat:'Economy', name:'Tooled Up', desc:'Buy or craft a better tool.', pts:5, goal:1, stat:'toolsBought' },
  { id:'drink', cat:'Economy', name:'Bottoms Up', desc:'Drink a potion or eat a meal.', pts:5, goal:1, stat:'potions' },
  { id:'merchant', cat:'Economy', name:'Rare Find', desc:'Buy from the daily merchant.', pts:10, goal:1, stat:'merchantBuys' },
  { id:'saver', cat:'Economy', name:'Nest Egg', desc:'Hold 100,000 gold in savings.', pts:15, goal:1e5, stat:'savingsPeak' },
  { id:'junk', cat:'Economy', name:'One Person’s Trash', desc:'Find 50 pieces of vendor junk.', pts:10, goal:50, stat:'junk' },
  { id:'first_blood', cat:'Combat', name:'First Blood', desc:'Win a fight.', pts:5, goal:1, stat:'kills' },
  { id:'kills1k', cat:'Combat', name:'Monster Hunter', desc:'Win 1,000 fights.', pts:25, goal:1000, stat:'kills' },
  { id:'kills100k', cat:'Combat', name:'Legend of the Wilds', desc:'Win 100,000 fights.', pts:50, goal:1e5, stat:'kills' },
  { id:'boss1', cat:'Combat', name:'Giant Slayer', desc:'Defeat a region boss.', pts:15, goal:1, stat:'bossKinds' },
  { id:'boss8', cat:'Combat', name:'Eight Crowns', desc:'Defeat every region boss.', pts:100, goal:8, stat:'bossKinds' },
  { id:'unique', cat:'Combat', name:'One of a Kind', desc:'Loot a unique item.', pts:15, goal:1, stat:'uniques' },
  { id:'tutorial', cat:'Exploration', name:'Out into the World', desc:'Finish your home region’s tutorial.', pts:10, goal:1, stat:'tutorial' },
  { id:'regions4', cat:'Exploration', name:'Well Travelled', desc:'Visit 4 regions.', pts:15, goal:4, stat:'regionsVisited' },
  { id:'regions8', cat:'Exploration', name:'Seen It All', desc:'Visit every region.', pts:50, goal:8, stat:'regionsVisited' },
  { id:'mapped', cat:'Exploration', name:'Cartographer', desc:'Fully explore a region.', pts:15, goal:1, stat:'regionsMapped' },
  { id:'hidden', cat:'Exploration', name:'Keen Eye', desc:'Find a hidden place.', pts:15, goal:1, stat:'hiddenFound' },
  { id:'lv10', cat:'Exploration', name:'Finding Your Feet', desc:'Reach character level 10.', pts:10, goal:10, stat:'level' },
  { id:'lv25', cat:'Exploration', name:'Ready to Advance', desc:'Reach character level 25.', pts:25, goal:25, stat:'level' },
  { id:'lv60', cat:'Exploration', name:'Veteran', desc:'Reach character level 60.', pts:50, goal:60, stat:'level' },
  { id:'lv99', cat:'Exploration', name:'Living Legend', desc:'Reach character level 99.', pts:100, goal:99, stat:'level' },
  { id:'lucky', cat:'Secrets', name:'Lucky Strike', desc:'Trigger a Lucky Strike.', pts:5, goal:1, stat:'lucky' },
  { id:'triple', cat:'Secrets', name:'Triple Threat', desc:'Roll a triple Lucky Strike.', pts:10, goal:1, stat:'triple' },
  { id:'vein', cat:'Secrets', name:'Bountiful', desc:'Hit a Rich Vein, Bountiful Harvest or Feeding Frenzy.', pts:10, goal:1, stat:'veins' },
  { id:'hoard_a', cat:'Secrets', name:'???', real:'Dragon’s Hoard', desc:'Gather 100,000 resources without selling any.', pts:15, goal:1e5, stat:'unsold', hidden:true },
  { id:'night_a', cat:'Secrets', name:'???', real:'Night Shift', desc:'Be working at midnight.', pts:10, goal:1, stat:'midnight', hidden:true },
  { id:'stonehearted', cat:'Secrets', name:'???', real:'Stonehearted', desc:'Bring Stone to Grandmaster.', pts:25, goal:1, stat:'stoneGrand', hidden:true },
  { id:'boot', cat:'Secrets', name:'???', real:'If the Boot Fits', desc:'Fish up an Old Boot.', pts:5, goal:1, stat:'boot', hidden:true },
];
const ACH_CATS = ['Gathering','Combat','Crafting','Exploration','Pets','Social','Economy','Secrets'];
const NODE_BONUS = { mining:'Rich Vein', woodcutting:'Heartwood Grove', farming:'Bountiful Harvest', fishing:'Feeding Frenzy', herbalism:'Wild Bloom', skinning:'Migration' };
