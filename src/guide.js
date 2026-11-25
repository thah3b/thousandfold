// ============================================================
// GAME GUIDE (v1.0): a readable explanation of every system, in
// Settings. It also drops gentle hints; the answers stay secret.
// ============================================================
const REGION_TALK = {
  emberfall: 'The smiths say the great hearth has a voice, if you give it a reason to sing after dark. The fields around the village are older than the maps, and patient explorers keep finding corners nobody drew.',
  woods: 'Everything in these woods talks back, except one old oak. Walk every path under the lanterns and you might meet the one who has been listening the whole time.',
  ironpeak: 'Bellhold counts its bells at dawn. Count carefully, and know the mountain end to end, because the miners swear the number is wrong.',
  marsh: 'Keep exploring the reeds long enough and you may stumble onto a hut with a very rude, badly spelled sign. Its owner hates visitors and loves onions. Nobody is sure what grows from the beans he keeps.',
  desert: 'Three wells feed Glassmarket. The third keeps strange hours, and the night fishermen who sit beside it never explain why.',
  frost: 'Footprints lead into the ice wall and don’t come out. Only the very nimble, who know every corner of the spire, ever follow them.',
  void: 'The watchers keep a log of the crack in the sky, one line at the stroke of every midnight. The lucky ones have seen something fall.',
  chasm: 'Deepforge children sing that the world has a heartbeat, and that only the sturdy, who know every step of the chasm, ever hear it.',
};
const regionTalk = r => r.hint || REGION_TALK[r.id] || '';

const GUIDE = () => [
  ['Getting started', `<p>Pick a skill on the left and start an action. Actions keep running while you do other things, and even while you’re away (up to your offline cap). Each running action uses stamina; Dexterity and some perks give you more.</p>
    <p>Your first ten quests (the tutorial) teach the basics and open the world map. After that, the <b>Quests</b> tab has region stories, a daily and weekly board, and your class advancement.</p>`],
  ['Gathering and proficiency', `<p>Every resource has its own <b>proficiency</b>, the number of times you’ve gathered it. Proficiency tiers (T1 to T10) make that one resource faster, then give bonus yield. At 1,000 gathers (and the right skill level) the next resource in the chain unlocks.</p>
    <p><b>Lucky Strikes</b> (Luck) give extra yield; <b>bonus finds</b> (Perception) turn up extras and junk. Old anglers swear they once hooked something that squeaked, and veteran miners tell of a sword stuck so deep in the rock that nobody has ever pulled it free.</p>`],
  ['Crafting', `<p>Crafting turns resources into gear, potions, meals and tools. Intelligence raises the chance of Fine and Masterwork quality. Every crafting skill starts with one easy recipe; more open as you level.</p>`],
  ['Stats', `<p>Each level gives stat points. <b>STR</b> heavy yield and attack, <b>DEX</b> stamina and crits, <b>AGI</b> speed and dodge, <b>VIT</b> HP and defense, <b>INT</b> craft quality, <b>WIS</b> XP, <b>CHARM</b> shop prices, <b>LUCK</b> rare finds and Lucky Strikes, <b>PER</b> bonus finds and hidden places. Some secrets ask for a lot of one stat.</p>`],
  ['Regions and travel', `<p>Travel between regions on the Map. Each region has its own resources, monsters, a town, a story and three areas you open by exploring. Every region also hides <b>one place off the beaten path</b>: you need enough Perception and plenty of exploring, and even then it takes a while. Keep at it: persistence always pays off in the end.</p>
    ${REGIONS.filter(r => !r.secret).map(r => `<p><b>${esc(r.name)}.</b> <i>${esc(REGION_TALK[r.id] || '')}</i></p>`).join('')}
    <p class="mute">Rumour has it that some places aren’t on any map at all.</p>`],
  ['Combat', `<p>Pick a monster on the Combat tab and you fight it on repeat. Your combat power against its recommended power decides how fast fights go and how much you get hurt. Bosses have a mechanic that one stat counters; the boss card tells you which. Eat food to heal between fights.</p>`],
  ['Classes, talents and Ascension', `<p>Your class sets your innate bonus and talent trees. Advance at levels 25, 60 and 99 by finishing your trainer’s trial; at tier 2 you choose a specialization. At level 99 in your final tier you can <b>Ascend</b>: your level starts again at 1, you keep everything else, and you earn permanent bonuses plus a <b>perk point</b> for the Ascension perk tree (Class tab).</p>`],
  ['Pets, companions and sentient weapons', `<p>Eggs drop from bosses, events and quests. Hatch them in an incubator, feed them, and they level up, evolve, and give bonuses (and some combine for combos). Your class companion joins you on a story of its own. Sentient (ego) weapons are rare boss drops with moods: give them what they like.</p>`],
  ['Events and daily rewards', `<p>Every week brings a world event that all players share, and holidays bring their own. Do 1,000 actions during an event to take part. Log in every day for a growing streak reward. Day 7 is the best one.</p>`],
  ['Guilds, friends and trading', `<p>Sign in to add friends, chat, send gifts, trade safely, use the Auction House, and join a guild with a shared bank and a weekly goal. Your public profile shows off your characters; you can hide it from the Account tab.</p>`],
  ['Secrets and the Lore Journal', `<p>The world is full of secrets: places that aren’t on maps, rumours that turn out to be true, things that happen only at certain hours, and oddities that show up for the patient. The <b>Secrets</b> tab tracks what you’ve found and shows hints for regions you’ve visited. The <b>Lore Journal</b> fills in as you travel and grow, and some pages know more than they let on.</p>
    <p>A few tips: listen to what the locals say about each region. Times are your own clock. Some secrets need you to know a place end to end. And the title screen is surprisingly ticklish.</p>`],
  ['Saves and accounts', `<p>Your game saves in this browser automatically. Guests should copy a <b>save code</b> (Settings) now and then; clearing browser data loses an unsaved game. Signing in keeps your characters in the cloud and lets you play on any device.</p>`],
];
function guideCard() {
  return `<div class="card"><div class="spread"><h3>Game Guide</h3><span class="mute" style="font-size:13px">tap a topic</span></div>
    <div class="guide">${GUIDE().map(([t, body]) => `<details><summary><b>${esc(t)}</b></summary><div class="guidebody">${body}</div></details>`).join('')}</div></div>`;
}
