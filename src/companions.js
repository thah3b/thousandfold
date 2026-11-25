// ============================================================
// COMPANIONS, EGO WEAPONS, GROWTH WEAPONS (Phase 6)
// ============================================================
// Companion: [name, title, role text, base mods (at level 99, bond 0, no gear), liked gift type, chapter lines x3, chapter goal]
// Effect multiplier = (0.25 + 0.75 * level/99) * (1 + bond/200) * (1 + gear score) * (1 + tree)
const COMPANIONS = {
  healer: ['Ser Aldren', 'the Paladin', 'Stands in front, taunts and shields you. Heals him and he heals you back.', { dmgTaken:-.12, hp:.12, regen:.25 }, 'potion',
    ['Aldren polishes a dented shield. "It saved a village once. I could not save the village twice."', 'He kneels at a roadside shrine. "Pray with me, or guard me while I pray. Either is welcome."', '"I swore an oath to a dead order. Today I swear it to you." He offers his hand.'], ['kills', 150]],
  warrior: ['Pip', 'the Squire', 'Carries your spare blade and learns every swing you make.', { atk:.08, def:.08 }, 'food',
    ['Pip trips over your shield. Again. "I’m fine! I meant to do that."', '"Teach me the low guard? I practised all night." His knuckles are raw.', 'Pip blocks a blow meant for you and grins. "Did you see? Did you SEE?"'], ['kills', 200]],
  archer: ['Wren', 'the Scout', 'Ranges ahead, marks weak spots and spots loot first.', { crit:.04, loot:.06, explore:.06 }, 'food',
    ['Wren returns with mud to the knees. "Three trails. Two are traps."', '"I grew up in these trees. They used to feel bigger."', 'Wren hands you her lucky arrow. "Shoot straight. Come back."'], ['explore', 300]],
  mage: ['Bramble', 'the Owl Familiar', 'Reads spellbooks over your shoulder and hoots at your mistakes.', { atk:.07, skillYield:{ enchanting:.06, alchemy:.04 } }, 'trophy',
    ['Bramble lands on your head and refuses to move.', 'The owl taps a page with one talon, then taps it again, harder.', 'Bramble speaks, once, very clearly: "Better." Then never again.'], ['craft', 200]],
  rogue: ['Nix', 'the Lookout', 'Watches the door, counts the coin, knows a fence in every town.', { gold:.12, dodge:.03 }, 'trophy',
    ['Nix flips a coin you are sure was in your pocket.', '"Old crew wants me back. I told them I’m retired. They laughed."', 'Nix returns every coin they ever lifted from you, in a neat little pile.'], ['gold', 50000]],
  necromancer: ['Rattlebones', 'the Skeletal Retainer', 'Fights without fear, mostly because it has no face to make one.', { atk:.06, lifesteal:.02, hp:.05 }, 'trophy',
    ['Rattlebones rearranges its own ribs, humming.', 'It stares at a grave for a long time. You let it.', 'Rattlebones offers you a bone. You think it is a gift. It is a finger. Its own.'], ['kills', 250]],
  farmer: ['Hayward', 'the Scarecrow Golem', 'Guards the fields, carries the sacks, frightens the crows and the bandits.', { skillYield:{ farming:.12, herbalism:.05 }, dmgTaken:-.06 }, 'food',
    ['Hayward plants a single seed and watches it all night.', 'Crows land on Hayward’s shoulders. He lets them stay.', 'Hayward brings you the first pumpkin of the season. It is enormous.'], ['farm', 2000]],
  merchant: ['Gully', 'the Porter', 'Carries more than seems possible and haggles while you are not looking.', { sell:.08, discount:.03 }, 'food',
    ['Gully adds up your ledger in their head. It is correct.', '"Never pay full price. Not for anything. Not even for this advice."', 'Gully shows you a second ledger: everything they ever saved you. It is long.'], ['gold', 100000]],
  beastmaster: ['Ash', 'the Tracker', 'Reads tracks like books and knows where the good hides are.', { skillYield:{ skinning:.10 }, atk:.05 }, 'food',
    ['Ash sniffs the wind. You are fairly sure Ash is human.', '"The wolves here know me. Mind your manners."', 'Ash shows you the den where they were raised. It is empty now. Ash smiles anyway.'], ['skin', 1500]],
  alchemist: ['Fizzwick', 'the Homunculus', 'A small helper in a jar who measures, stirs and occasionally explodes.', { potion:.10, skillYield:{ alchemy:.06 } }, 'potion',
    ['Fizzwick taste-tests a potion. Turns blue. Turns back.', '"Master, I have improved the recipe." The recipe is on fire.', 'Fizzwick names a potion after you. It glows your favourite colour.'], ['craft', 200]],
  bard: ['Tam', 'the Drummer', 'Keeps the rhythm of every march and every swing.', { xp:.06, luckStrike:.006 }, 'food',
    ['Tam drums on the table, the cart, your helmet.', '"Every hero needs a song. Yours is still missing a chorus."', 'Tam plays the finished song. The whole inn joins in on the chorus.'], ['explore', 300]],
  monk: ['Little Kai', 'the Novice', 'Copies your stance, fetches water, meditates beside you.', { dodge:.03, regen:.18 }, 'food',
    ['Kai balances on one foot for an hour and falls over.', '"Abbot Toma says you are a good teacher. Are you?"', 'Kai bows to you exactly as you bowed to your own master.'], ['kills', 200]],
  summoner: ['Wisp', 'the Bound Spirit', 'A small, bright spirit that scouts and sparks.', { atk:.06, explore:.06 }, 'trophy',
    ['Wisp circles your head when it is happy. It is always happy.', 'Wisp flickers near old ruins, as if remembering.', 'Wisp chooses to stay, though the binding has long since faded.'], ['explore', 300]],
  runesmith: ['Clank', 'the Forge Golem', 'Works the bellows and hauls the ore, tireless and very loud.', { skillYield:{ blacksmithing:.08, mining:.05 }, def:.06 }, 'bar',
    ['Clank hammers a dent out of its own arm.', 'Clank carves a rune into its chest. It looks like your name.', 'Clank’s forge-heart burns brighter around you.'], ['craft', 200]],
  tidecaller: ['Pearl', 'the Sea Otter', 'Dives for fish, cracks shells and is extremely pleased with itself.', { skillYield:{ fishing:.12 }, dodge:.02 }, 'food',
    ['Pearl holds your hand while you sleep by the river.', 'Pearl brings you a shiny stone. And another. And another.', 'Pearl brings you the shiniest stone yet. It is a pearl. Of course it is.'], ['fish', 2000]],
  wayfinder: ['Old Mags', 'the Guide', 'Has walked every road twice and complains about all of them.', { travel:.12, bonusFind:.012, explore:.04 }, 'food',
    ['Mags points at a hill. "Went up that in a blizzard. Twice."', '"Every map is wrong. Mine are less wrong."', 'Mags gives you her oldest map, the one with her own name on it.'], ['explore', 400]],
};
const COMPANION_TREE = [['Fierce Loyalty', 3, { eff:.10 }], ['Thick Skin', 3, { hp:.02 }], ['Teamwork', 3, { atk:.02 }], ['Shared Craft', 3, { gyield:.02, cyield:.02 }]];
const COMPANION_SLOTS = { weapon: ['weapon'], armour: ['head','chest','legs','boots','gloves','offhand'], trinket: ['ring','amulet'] };
const GIFT_TYPES = { food:'meals and cooked food', potion:'potions', trophy:'monster trophies', bar:'metal bars' };
const COMPANION_UNLOCK_LEVEL = 10;
const CHAPTER_GOALS = { kills:'Win {n} fights together', explore:'Explore {n} times together', craft:'Craft {n} items together', gold:'Earn {n} gold together', farm:'Harvest {n} crops together', skin:'Skin {n} hides together', fish:'Catch {n} fish together' };

// Ego weapons: personality, likes/dislikes (event weights per occurrence), abilities at bond 50/75/100, lines.
const EGOS = {
  grimjaw: { name:'Grimjaw', epithet:'the Bloodthirsty Blade', slot:'weapon', lvl:29, stats:{ STR:20 }, source:'gorrak_the_mountain_king', chance:0.02,
    likes:{ bossKills:3, kills:0.004 }, dislikes:{ idleMin:0.08 }, likeText:'boss kills and fighting', dislikeText:'long stretches without a fight',
    abilities:[{ atk:.08 }, { crit:.03, critDmg:.15 }, { atk:.15, lifesteal:.03 }],
    lines:{ greet:'"Finally, a hand worth holding me."', like:'"YES. Again!"', dislike:'"Are we... farming? Wake me when something bleeds."', sulk:'"I am not speaking to you. Find me a boss."', awaken:'"We are one edge now. Let them come."' },
    chapters:['Grimjaw was forged for a king who never drew it. It has been hungry ever since.', 'It remembers every blade it ever broke, and names them to you, slowly.', 'At last it tells you its true name. It is not Grimjaw. It asks you to keep calling it that anyway.'] },
  vesperine: { name:'Vesperine', epithet:'the Vain Staff', slot:'weapon', lvl:51, stats:{ INT:30, WIS:18 }, source:'the_sandbound_king', chance:0.02,
    likes:{ rare:3, upgrade:2, masterwork:4 }, dislikes:{ sold:0.0005 }, likeText:'rare drops, upgrades and fine craftsmanship', dislikeText:'selling things in bulk like a common merchant',
    abilities:[{ loot:.06 }, { quality:.03, enchant:.03 }, { loot:.12, cyield:.08 }],
    lines:{ greet:'"Oh. You. Well, I suppose you’ll do."', like:'"Exquisite. Finally, something worthy of me."', dislike:'"Selling? By the cartload? How vulgar."', sulk:'"I shan’t glow for you. Not until you find something beautiful."', awaken:'"Darling, we are magnificent."' },
    chapters:['Vesperine was carved for a queen’s coronation and has never forgiven anyone for the queen.', 'It admits, once, that it was afraid in the tomb. It asks you never to mention it.', 'It shows you how it truly looks under the gilding: plain, old wood. It trusts you with that.'] },
  old_thunk: { name:'Old Thunk', epithet:'the Lazy Hammer', slot:'weapon', lvl:12, stats:{ STR:10, VIT:6 }, source:'event:stone10k', chance:1,
    likes:{ gathered:0.0004, offlineH:2 }, dislikes:{ kills:0.006, travel:1 }, likeText:'quiet gathering and time spent away', dislikeText:'fighting and long trips',
    abilities:[{ skillYield:{ mining:.10 } }, { gyield:.06 }, { gyield:.10, offlineH:2 }],
    lines:{ greet:'"Mm. Five more minutes."', like:'"Ahh. Rock. Rock is nice."', dislike:'"Fighting? Again? My head hurts."', sulk:'"Not moving. Can’t make me."', awaken:'"Fine. FINE. I’m awake. Let’s dig a mountain."' },
    chapters:['Old Thunk was a quarry hammer for three hundred years. It has strong opinions about stone.', 'It tells you the best rock it ever hit. It describes it for an hour.', 'It admits it likes you. Then it pretends to be asleep.'] },
  whisper: { name:'Whisper', epithet:'the Gossiping Dagger', slot:'weapon', lvl:34, stats:{ DEX:18, AGI:14 }, source:'will_o_wisp', chance:0.03,
    likes:{ travel:3, explore:0.02, newRegion:10 }, dislikes:{ sameRegionH:0.6 }, likeText:'travel, exploring and new places', dislikeText:'staying in one place for hours',
    abilities:[{ travel:.10 }, { explore:.10, bonusFind:.01 }, { travel:.15, explore:.15, dodge:.04 }],
    lines:{ greet:'"Oh, you’ll want to hear what the innkeeper said about you."', like:'"New road, new rumours!"', dislike:'"This town again? I’ve heard all its secrets."', sulk:'"I know something you don’t. And I’m not telling."', awaken:'"Every road, every secret. Let’s go everywhere."' },
    chapters:['Whisper belonged to a spy who never came home. It still has a message to deliver.', 'It tells you who the message was for. They died long ago.', 'Whisper decides you are the message now. You are not sure what that means.'] },
  lumen: { name:'Saint Lumen’s Mace', epithet:'the Pious', slot:'weapon', lvl:79, stats:{ WIS:40, VIT:30 }, source:'the_hollow_sovereign', chance:0.02,
    likes:{ potions:1, undead:0.05 }, dislikes:{ goldK:0.002 }, likeText:'tending your health and smiting the undead', dislikeText:'piling up gold',
    abilities:[{ regen:.25 }, { hp:.08, dmgTaken:-.05 }, { hp:.12, regen:.5, xp:.05 }],
    lines:{ greet:'"Peace be with you. And with me."', like:'"Rest, rot. Rest at last."', dislike:'"Gold, gold, gold. Have you tried prayer?"', sulk:'"I will pray for you. Silently. Very silently."', awaken:'"The light remembers you now."' },
    chapters:['Lumen was a saint who became a mace when there was no one left to heal.', 'It recites the names of everyone it could not save. It takes a long time.', 'For the first time, it adds a name it did save: yours.'] },
  kaeli: { name:'Kaeli', epithet:'the Homesick Bow', slot:'weapon', lvl:14, stats:{ DEX:14, PER:10 }, source:'silver_hart', chance:0.03,
    likes:{ homeMin:0.03, fished:0.0006 }, dislikes:{ farMin:0.02 }, likeText:'the Whispering Woods and quiet rivers', dislikeText:'cold, dark and faraway places',
    abilities:[{ crit:.03 }, { skillYield:{ fishing:.08 }, fightSpeed:.03 }, { crit:.05, fightSpeed:.05, atk:.08 }],
    lines:{ greet:'"Do you smell pine? I smell pine."', like:'"Home. We’re home."', dislike:'"It’s so cold here. Can we go back?"', sulk:'"I want to go home."', awaken:'"Home isn’t a forest. It’s whoever carries me."' },
    chapters:['Kaeli was strung from a tree that grew where the Lanternbough stands now.', 'She shows you where her tree was. There is a lantern hanging there.', 'Kaeli stops asking to go home. She says she already is.'] },
};
const EGO_BOND = { sulk: 20, ab1: 50, ab2: 75, awaken: 100, chapters: [25, 50, 75] };
const FAR_REGIONS = ['frost', 'void', 'chasm'];
const UNDEAD = ['bog_wraith', 'mummified_guard', 'null_wraith', 'the_sandbound_king', 'the_hollow_sovereign', 'shattered_seraph', 'trial_necromancer_2', 'trial_necromancer_3'];

// Growth weapon: one universal blade. Paths are chosen by how you play when it reaches level 20.
const GROWTH = {
  maxLevel: 60, evolveAt: [20, 40], costBase: 100, costGrowth: 1.15, killXp: 0.1, attackBase: 3, attackPerLevel: 1.6,
  names: { seed: 'Seedling Blade', holy: ['Dawnblade', 'Sunforged Dawnblade'], assassin: ['Nightfang', 'Eclipse Fang'], berserk: ['Bloodreaver', 'Crimson Tyrant'], harvest: ['Verdant Edge', 'Worldroot Blade'] },
  passives: { holy: [{ regen:.2, xp:.04 }, { regen:.4, hp:.08, xp:.06 }], assassin: [{ crit:.04 }, { crit:.07, critDmg:.25 }], berserk: [{ atk:.06 }, { atk:.12, lifesteal:.03 }], harvest: [{ gyield:.06 }, { gyield:.12, stamina:1 }] },
  pathText: { holy: 'Holy: most of its kills were undead.', assassin: 'Assassin: you rely on critical hits (15%+ crit).', berserk: 'Berserker: a fighter’s blade, fed on battle.', harvest: 'Harvest: it grew more from your gathering than your fighting.' },
};
const EGO_HINTS = { grimjaw:'Miners say a king under Ironpeak keeps a hungry blade.', vesperine:'A crowned corpse in the desert will not part with its staff.', old_thunk:'Something heavy sleeps in the first quarry. Keep swinging at the stone.', whisper:'Follow a light in the marsh that should not be there.', lumen:'A hollow ruler in the Rift holds a holy relic it cannot use.', kaeli:'A silver deer in the Woods is guarding something that wants to go home.' };
ACHIEVEMENTS.push(
  { id:'comp1', cat:'Social', name:'Never Alone', desc:'Recruit your companion.', pts:10, goal:1, stat:'compRecruited' },
  { id:'comp2', cat:'Social', name:'Sworn', desc:'Your companion swears an oath to you.', pts:25, goal:1, stat:'compSworn' },
  { id:'ego1', cat:'Combat', name:'It Speaks', desc:'Find a sentient weapon.', pts:15, goal:1, stat:'egosFound' },
  { id:'ego6', cat:'Combat', name:'A Chorus of Steel', desc:'Find every sentient weapon.', pts:50, goal:6, stat:'egosFound' },
  { id:'egoawake', cat:'Combat', name:'Awakening', desc:'Awaken a sentient weapon.', pts:25, goal:1, stat:'egoAwake' },
  { id:'growth3', cat:'Combat', name:'Fully Grown', desc:'Evolve a Growth weapon to its final form.', pts:25, goal:3, stat:'growthTier' });
