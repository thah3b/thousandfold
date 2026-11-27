// ============================================================
// v3.1 — Fun titles (activity jokes; most give no stats) and the Pioneers perk.
// Earned once per character in ch.funTitles[id] (kept even if the condition stops being true).
// ============================================================
const FUN_TITLES = [
  { id: 'unlucky', name: 'The Unlucky', desc: 'Lose 5 Blackjack hands in a row.', check: c => (c.counters.bjLoseMax || 0) >= 5 },
  { id: 'wrongbed', name: 'Woke Up on the Wrong Side of the Bed', desc: 'Lose 10 Blackjack hands in a row.', check: c => (c.counters.bjLoseMax || 0) >= 10 },
  { id: 'unluckiest', name: 'Unluckiest Man Alive', desc: 'Lose 15 Blackjack hands in a row.', check: c => (c.counters.bjLoseMax || 0) >= 15 },
  { id: 'brokeboy', name: 'Broke Boy', desc: 'Lose all the gold you’re holding in one Blackjack hand (the Bank doesn’t count).', check: c => !!c.counters.brokeBoy },
  { id: 'lucky7', name: 'Lucky Seven', desc: 'Win 7 Blackjack hands in a row.', check: c => (c.counters.bjWinMax || 0) >= 7 },
  { id: 'cardshark', name: 'Card Shark', desc: 'Play 1,000 Blackjack rounds.', check: c => { const S = (c.casino || {}).stats || {}; return ((S.gold || {}).rounds || 0) + ((S.th || {}).rounds || 0) >= 1000; } },
  { id: 'lazyhobo', name: 'Lazy Hobo', desc: 'Have nothing running for 5 minutes while the game is open.', check: c => (c.counters.idleMax || 0) >= 300 },
  { id: 'napper', name: 'Professional Napper', desc: 'Have nothing running for a whole hour while the game is open.', check: c => (c.counters.idleMax || 0) >= 3600 },
  { id: 'touchgrass', name: 'Touched Grass', desc: 'Come back after a full day away.', check: c => (c.counters.longestAway || 0) >= 86400 },
  { id: 'insomniac', name: 'Insomniac', desc: 'Be playing between 3 and 4 in the morning.', check: c => !!c.counters.insomniac },
  { id: 'butterfingers', name: 'Butterfingers', desc: 'Fail 5 gear upgrades in a row.', check: c => (c.counters.upFailMax || 0) >= 5 },
  { id: 'catchrelease', name: 'Catch and Release', desc: 'Release 100 pets.', check: c => (c.counters.released || 0) >= 100 },
  { id: 'crazypet', name: 'Crazy Pet Person', desc: 'Own 100 pets at the same time.', check: c => (c.pets || []).length >= 100 },
  { id: 'dressup', name: 'Dress-Up Champion', desc: 'Own 10 costumes.', check: () => Object.keys((typeof account !== 'undefined' && account && account.costumes) || {}).length >= 10 },
  { id: 'speedrunner', name: 'Speedrunner', desc: 'Ascend twice within one hour.', check: c => !!c.counters.speedAsc },
  { id: 'gatecrasher', name: 'Gatecrasher', desc: 'Set foot in Hell’s Gate.', check: c => !!(c.visited || {}).hell },
  { id: 'heavensdoor', name: 'Knocking on Heaven’s Door', desc: 'Set foot in Heaven’s Gate.', check: c => !!(c.visited || {}).heaven },
  { id: 'hellwalker', name: 'Hellwalker', desc: 'Defeat Malphas, Duke of Cinders.', check: c => !!(c.bossKilled || {}).e_malphas_duke_of_cinders, y: 0.02, stat: 'VIT', amt: 10 },
  { id: 'dawnbreaker', name: 'Dawnbreaker', desc: 'Defeat the Arbiter of Dawn.', check: c => !!(c.bossKilled || {}).e_the_arbiter_of_dawn, y: 0.03, stat: 'WIS', amt: 15 },
  { id: 'pioneer', name: 'The Pioneer', desc: 'One of the first 10 players on the leaderboards. Comes with its own title style, frame, background and cape.', check: () => !!(typeof account !== 'undefined' && account && account.pioneer), y: 0.02, stat: 'LUCK', amt: 5 },
];
const FUN_BY = Object.fromEntries(FUN_TITLES.map(t => [t.id, t]));

function funTitlesCheck(quiet, notes) {
  if (!ch) return; ch.funTitles = ch.funTitles || {};
  for (const t of FUN_TITLES) if (!ch.funTitles[t.id] && t.check(ch)) {
    ch.funTitles[t.id] = Date.now();
    const msg = `Title earned: ${t.name}${t.y ? ` (+${pct(t.y)} yield, +${t.amt} ${t.stat})` : ''}`;
    quiet ? notes && notes.push(msg) : addLog('lucky', msg); dirty = true; // log only: no pop-up
  }
}
// Called every tick (sec = seconds, quiet = offline catch-up).
function funTick(sec, quiet) {
  if (quiet || sec > 5) return; // only while the game is open
  const C = ch.counters;
  if (!ch.actions.length) { C.idleNow = (C.idleNow || 0) + sec; C.idleMax = Math.max(C.idleMax || 0, C.idleNow); } else C.idleNow = 0;
  const h = new Date().getHours(); if (h === 3 && !C.insomniac) C.insomniac = 1;
  if ((funTick.n = (funTick.n || 0) + 1) % 10 === 0) funTitlesCheck(false);
  if (funTick.n % 300 === 5) pioneerCheck();
}
// Blackjack hooks (casino.js): per settled hand.
function funHand(res) {
  const C = ch.counters;
  if (res === 'win' || res === 'bj') { C.bjWin = (C.bjWin || 0) + 1; C.bjWinMax = Math.max(C.bjWinMax || 0, C.bjWin); C.bjLose = 0; }
  else if (res === 'lose' || res === 'bust') { C.bjLose = (C.bjLose || 0) + 1; C.bjLoseMax = Math.max(C.bjLoseMax || 0, C.bjLose); C.bjWin = 0; }
}
function funRound(r) { if (r.cur === 'gold' && r.staked > 0 && r.net < 0 && ch.gold < 1) ch.counters.brokeBoy = 1; funTitlesCheck(false); }

// ---------- The Pioneers: the first 10 accounts on the leaderboards (server decides). ----------
async function pioneerCheck() {
  if (typeof account === 'undefined' || !account || account.pioneer || typeof rpc !== 'function') return;
  if (typeof cloud === 'undefined' || cloud.provider !== 'supabase' || cloud.state !== 'ready') return;
  if (account.pioneerAsked && Date.now() - account.pioneerAsked < 30 * 60 * 1000) return;
  account.pioneerAsked = Date.now();
  try { const n = await rpc('tf_pioneer_rank'); if (n) { account.pioneer = n; addLog('lucky', `You are Pioneer #${n}: one of the first 10 players. Your Pioneer title, title style, frame, background and cape are unlocked.`); funTitlesCheck(false); save(); renderMain(); } } catch (e) { }
}
