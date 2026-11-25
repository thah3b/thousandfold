// ============================================================
// GAME DATA — typed-by-convention content tables.
// ============================================================
const STATS = [
  { id:'STR', name:'Strength', short:'Hit harder, carry more, break more rock.', long:'Physical damage, carry weight, and a small yield bonus to heavy gathering (Mining, Woodcutting) and Blacksmithing.' },
  { id:'INT', name:'Intellect', short:'Stronger spells and sharper crafting.', long:'Magic damage, max mana, and a small yield bonus to Alchemy, Enchanting and Research.' },
  { id:'DEX', name:'Dexterity', short:'Do more things at once with better precision.', long:'Accuracy, crit chance, ranged damage, fine-crafting yield, and +1 Stamina per 10 points (soft-capped).' },
  { id:'AGI', name:'Agility', short:'Move faster, avoid hits, get there sooner.', long:'Dodge, combat turn speed, travel speed, and a small action speed bonus (capped at 30%).' },
  { id:'VIT', name:'Vitality', short:'Survive longer and fight tougher enemies.', long:'Max HP, defense, resistances and HP regen.' },
  { id:'WIS', name:'Wisdom', short:'Learn faster and heal better.', long:'Healing power, mana regen, XP gain and enchanting power.' },
  { id:'LUCK', name:'Luck', short:'More rare finds and surprises.', long:'Rare drop chance, egg and pet chance, Lucky Strike chance, and secret event odds.' },
  { id:'CHARM', name:'Charm', short:'Cheaper deals and friendlier NPCs.', long:'Shop discounts (capped), reputation gain, market fee reduction (capped), companion bond gain, extra dialogue.' },
  { id:'PER', name:'Perception', short:'Notice what others walk past.', long:'Finds hidden map nodes, rare resource spawns, bonus finds while gathering, and secrets.' },
];
const STAT_IDS = STATS.map(s => s.id);

const RACES = [
  { id:'human', name:'Human', color:'#d9a066', stat:'WIS', passive:'Adaptable: +5% XP from every source.', fx:{ xp:0.05 } },
  { id:'elf', name:'Elf', color:'#7fd1a6', stat:'INT', passive:'Arcane Blood: +10% Alchemy and Enchanting yield.', fx:{ skillYieldR:{ alchemy:0.10, enchanting:0.10 } } },
  { id:'dwarf', name:'Dwarf', color:'#c98a4b', stat:'STR', passive:'Stonesense: +10% Mining and Blacksmithing speed.', fx:{ skillSpeed:{ mining:0.10, blacksmithing:0.10 } } },
  { id:'orc', name:'Orc', color:'#8fb35a', stat:'STR', passive:'Heavy Hands: +5% Mining and Woodcutting yield.', fx:{ skillYieldR:{ mining:0.05, woodcutting:0.05 } } },
  { id:'halfling', name:'Halfling', color:'#e6c35c', stat:'LUCK', passive:'Small Fortune: +50% Lucky Strike chance.', fx:{ luckStrikeMult:0.5 } },
  { id:'beastfolk', name:'Beastfolk', color:'#c47a5a', stat:'PER', passive:'Keen Nose: bonus-find chance doubled.', fx:{ bonusFindMult:1.0 } },
  { id:'dragonkin', name:'Dragonkin', color:'#e0573a', stat:'VIT', passive:'Hoard Instinct: +5% gold from selling.', fx:{ sell:0.05 } },
  { id:'undead', name:'Undead-touched', color:'#9aa3c7', stat:'VIT', passive:'Restless: +1 hour offline cap.', fx:{ offlineH:1 } },
  { id:'sylph', name:'Sylph', color:'#a7d8f0', stat:'AGI', passive:'Windborne: +5% action speed on every skill.', fx:{ speed:0.05 } },
  { id:'starborn', name:'Starborn', color:'#c9b8ff', secret:true, stat:'LUCK', passive:'???', fx:{} },
  { id:'hollowkin', name:'Hollowkin', color:'#6f7f7a', secret:true, stat:'PER', passive:'???', fx:{} },
];

const ORIGINS = [
  { id:'orphan', name:'Orphan', stat:'LUCK', item:'copper_coin', qty:1, gold:0, flavor:'You grew up in the alleys. A lucky coin is all you kept.' },
  { id:'noble', name:'Noble', stat:'CHARM', item:'signet_ring', qty:1, gold:250, flavor:'Born to a minor house, you left with a ring and a purse.' },
  { id:'soldier', name:'Soldier', stat:'VIT', item:'g:pickaxe_0:1:0', qty:1, gold:0, flavor:'Sapper duty taught you how walls (and rocks) come down.' },
  { id:'farmhand', name:'Farmhand', stat:'STR', item:'g:sturdy_mattock:1:0', qty:1, gold:0, flavor:'Years of turning stony fields gave you a strong back.' },
  { id:'scholar', name:'Scholar', stat:'INT', item:'potion_prod', qty:2, gold:0, flavor:'You left the academy with notes and two borrowed tonics.' },
  { id:'outcast', name:'Outcast', stat:'PER', item:'hooded_cloak', qty:1, gold:0, flavor:'Living at the edges, you learned to notice everything.' },
];

const START_REGIONS = [
  { id:'emberfall', name:'Emberfall Village', npc:'Elder Brannoch', gear:'Ember-warmed gloves', flavor:'A forge town built around a hearth that has burned for a thousand years.', rumor:'Old folk say the hearth hums on the longest night.' },
  { id:'woods', name:'Whispering Woods', npc:'Warden Ilsabet', gear:'Bark-weave hood', flavor:'Lantern-lit treehouses above a forest that talks back.', rumor:'One of the oaks never answers. Nobody asks why.' },
  { id:'ironpeak', name:'Ironpeak Foothills', npc:'Foreman Dagna', gear:'Miner’s lamp', flavor:'Switchback mining camps under a mountain that rings like a bell.', rumor:'Count the bell strikes at dawn. Sometimes there is one too many.' },
  { id:'marsh', name:'Sunken Marsh Outpost', npc:'Ferryman Orrin', gear:'Waxed waders', flavor:'Stilt houses, slow boats and a smell you get used to.', rumor:'A big fellow lives past the reeds. He does not like visitors.' },
  { id:'oasis', name:'Ashen Oasis', npc:'Caravaneer Saffi', gear:'Sun-veil', flavor:'A palm ring around black glass dunes and a market that never closes.', rumor:'The third well is dry by day and full by moonlight.' },
  { id:'frost', name:'Frostspire Hamlet', npc:'Huntress Velka', gear:'Fur-lined boots', flavor:'Smoke-blackened lodges under a spire of blue ice.', rumor:'Footprints lead into the ice wall and do not come out.' },
];

const CLASSES = [
  { id:'warrior', name:'Warrior', res:'Rage', role:'Frontline fighter', pri:'STR', sec:'VIT', specs:['Berserker','Guardian','Duelist'] },
  { id:'archer', name:'Archer', res:'Focus', role:'Ranged damage', pri:'DEX', sec:'AGI', specs:['Sniper','Ranger','Hunter'] },
  { id:'mage', name:'Mage', res:'Mana', role:'Spell damage', pri:'INT', sec:'WIS', specs:['Elementalist','Arcanist','Spellblade'] },
  { id:'rogue', name:'Rogue', res:'Energy / Combo', role:'Burst and Thieving', pri:'AGI', sec:'DEX', specs:['Assassin','Shadowdancer','Swashbuckler'] },
  { id:'necromancer', name:'Necromancer', res:'Soul Fragments', role:'Minions and life drain', pri:'INT', sec:'VIT', specs:['Lich Scholar','Bone Lord','Plague Doctor'] },
  { id:'healer', name:'Healer', res:'Faith', role:'Healing, paired with a Paladin', pri:'WIS', sec:'VIT', specs:['Saint','Cleric','Oracle'] },
  { id:'farmer', name:'Farmer', res:'Vigor', role:'Gathering powerhouse, scythe fighter', pri:'STR', sec:'VIT', specs:['Master Harvester','Beast Rancher','Grove Warden'], gather:0.10, skillYield:{ cooking:0.10, herbalism:0.05 }, now:'+10% yield on all gathering, +10% Cooking yield.' },
  { id:'merchant', name:'Merchant', res:'Coin Sense', role:'Trading and gold find', pri:'CHARM', sec:'LUCK', specs:['Magnate','Smuggler','Quartermaster'], sell:0.10, now:'+10% gold from selling.' },
  { id:'beastmaster', name:'Beastmaster', res:'Bond', role:'Pets and taming', pri:'CHARM', sec:'AGI', specs:['Packlord','Wyrmtamer','Wildspeaker'] },
  { id:'alchemist', name:'Alchemist', res:'Reagents', role:'Potions and throwables', pri:'INT', sec:'DEX', specs:['Transmuter','Grenadier','Apothecary'], potionMult:0.15, now:'Potions are 15% stronger.' },
  { id:'bard', name:'Bard', res:'Inspiration', role:'Party buffs and luck', pri:'CHARM', sec:'LUCK', specs:['Skald','Troubadour','Warchanter'] },
  { id:'monk', name:'Monk', res:'Chi', role:'Unarmed, agile, self-healing', pri:'AGI', sec:'WIS', specs:['Iron Fist','Windwalker','Ascetic'] },
  { id:'summoner', name:'Summoner', res:'Essence', role:'Temporary spirit allies', pri:'WIS', sec:'INT', specs:['Conjurer','Spiritbinder','Stormcaller'] },
  { id:'runesmith', name:'Runesmith', res:'Runes', role:'Rune-forging bruiser', pri:'STR', sec:'INT', specs:['Runeforger','Glyphguard'], skillYield:{ mining:0.05, blacksmithing:0.05, enchanting:0.05 }, now:'+5% Mining, Blacksmithing and Enchanting yield.' },
  { id:'tidecaller', name:'Tidecaller', res:'Tide', role:'Water magic, crowd control', pri:'WIS', sec:'AGI', specs:['Stormherald','Deepwarden'] },
  { id:'wayfinder', name:'Wayfinder', res:'Bearings', role:'Explorer and secret hunter', pri:'PER', sec:'LUCK', specs:['Pathfinder','Cartographer','Relic Hunter'], bonusFind:0.02, now:'+2% bonus-find chance.' },
];


// Content tables (chains, recipes, gear, items, titles, achievements) live in content.js.

const LATER = [
  ['guild','Guild',13,'Shared banks, guild quests and raids.'],
  ['lore','Lore',13,'Your Lore Journal and its cryptic clues.'],
];

const PROFANITY = ['fuck','shit','cunt','bitch','nigg','fag','rape','whore','slut','dick','cock','pussy','nazi','retard','twat','wank'];
