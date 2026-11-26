// ============================================================
// v2.1 — Daily games. First game: Runeword, a fantasy Wordle.
// Everyone gets the same word on the same calendar day. One try a day per account.
// Win: a boost to XP and yield for every character until midnight (+5%, +1% per streak
// day after the first, up to +15%) and 1–3 shards. A loss or a missed day ends the streak.
// ============================================================
const RW = { len: 5, tries: 6, epoch: [2026, 10, 25] }; // #1 = 25 Nov 2026 (local date)
const rwDayNo = (t = Date.now()) => { const d = new Date(t), e = new Date(RW.epoch[0], RW.epoch[1], RW.epoch[2]); return Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - e) / 86400000) + 1; };
const rwMidnight = (t = Date.now()) => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(); };
const rwAnswer = n => RW_ANSWERS[((n - 1) % RW_ANSWERS.length + RW_ANSWERS.length) % RW_ANSWERS.length];
function rwState() {
  const m = account.mg = account.mg || {};
  m.rw = m.rw || { streak: 0, best: 0, played: 0, wins: 0, dist: [0, 0, 0, 0, 0, 0], last: 0, lastWin: 0, cur: null };
  const n = rwDayNo(), r = m.rw;
  if (!r.cur || r.cur.day !== n) r.cur = { day: n, guesses: [], done: false, won: false };
  // A day missed since the last win ends the streak.
  if (r.streak && r.lastWin < n - 1) r.streak = 0;
  return r;
}
// Score a guess: 2 = right place, 1 = in the word, 0 = not in the word (handles repeated letters).
function rwScore(guess, ans) {
  const out = Array(RW.len).fill(0), left = {};
  for (let i = 0; i < RW.len; i++) if (guess[i] === ans[i]) out[i] = 2; else left[ans[i]] = (left[ans[i]] || 0) + 1;
  for (let i = 0; i < RW.len; i++) if (!out[i] && left[guess[i]]) { out[i] = 1; left[guess[i]]--; }
  return out;
}
const rwBoostPct = streak => Math.min(15, 5 + Math.max(0, streak - 1));
// Used by the engine: the extra XP and yield from today's win (0 if none).
function dailyBoost(now) { const b = account && account.mg && account.mg.boost; return b && b.until > (now || Date.now()) ? b.pct / 100 : 0; }
const rwPlayedToday = () => { const r = rwState(); return r.cur.done; };

let rwInput = '', rwMsg = '', rwShake = false;
function rwType(k) {
  const r = rwState(); if (r.cur.done) return;
  if (k === 'ENTER') return rwSubmit();
  if (k === 'BACK') rwInput = rwInput.slice(0, -1);
  else if (/^[A-Z]$/.test(k) && rwInput.length < RW.len) rwInput += k;
  rwMsg = ''; rwRenderBoard();
}
function rwSubmit() {
  const r = rwState(), cur = r.cur, ans = rwAnswer(cur.day);
  if (rwInput.length < RW.len) { rwMsg = 'Not enough letters.'; rwShake = true; return rwRenderBoard(); }
  if (!RW_ALLOWED.has(rwInput)) { rwMsg = 'Not in the word list.'; rwShake = true; return rwRenderBoard(); }
  cur.guesses.push(rwInput); rwInput = '';
  const won = cur.guesses[cur.guesses.length - 1] === ans;
  if (won || cur.guesses.length >= RW.tries) {
    cur.done = true; cur.won = won; r.played++;
    if (won) {
      r.wins++; r.streak = r.lastWin === cur.day - 1 ? r.streak + 1 : 1; r.lastWin = cur.day; r.best = Math.max(r.best, r.streak); r.dist[cur.guesses.length - 1]++;
      const pct = rwBoostPct(r.streak), shards = cur.guesses.length <= 2 ? 3 : cur.guesses.length <= 4 ? 2 : 1;
      account.mg.boost = { pct, until: rwMidnight(), day: cur.day };
      account.shards = (account.shards || 0) + shards;
      if (ch) { ch.counters.rwWins = Math.max(ch.counters.rwWins || 0, r.wins); ch.counters.rwStreak = Math.max(ch.counters.rwStreak || 0, r.best); if (cur.guesses.length <= 2) ch.counters.rwTwo = 1; }
      cur.reward = { pct, shards };
      addLog('lucky', `Runeword #${cur.day} solved in ${cur.guesses.length}: +${pct}% XP and yield until midnight, +${shards} shard${shards > 1 ? 's' : ''}.`);
      toast(`<b>Runeword solved!</b> +${pct}% XP and yield until midnight · +${shards} shard${shards > 1 ? 's' : ''}`, 'gold');
    } else {
      r.streak = 0; addLog('sys', `Runeword #${cur.day}: the word was ${ans}. A new one tomorrow.`);
    }
    if (ch) checkProgress();
  }
  save(); renderMain(); if (typeof renderBnav === 'function') renderBnav();
}
function rwShareText() {
  const r = rwState(), cur = r.cur, ans = rwAnswer(cur.day);
  const rows = cur.guesses.map(g => rwScore(g, ans).map(v => ['⬛', '\u{1F7E8}', '\u{1F7E9}'][v]).join('')).join('\n');
  return `Thousandfold Runeword #${cur.day} ${cur.won ? cur.guesses.length : 'X'}/${RW.tries}${r.streak > 1 ? ` \u{1F525}${r.streak}` : ''}\n${rows}\nthah3b.github.io/thousandfold`;
}
function rwBoardHtml() {
  const r = rwState(), cur = r.cur, ans = rwAnswer(cur.day), rows = [];
  for (let i = 0; i < RW.tries; i++) {
    const g = cur.guesses[i], live = !g && i === cur.guesses.length && !cur.done, sc = g ? rwScore(g, ans) : null, word = g || (live ? rwInput : '');
    rows.push(`<div class="rw-row ${live && rwShake ? 'shake' : ''}">${Array.from({ length: RW.len }, (_, j) => `<span class="rw-t ${sc ? ['no', 'in', 'ok'][sc[j]] : word[j] ? 'typed' : ''}" ${sc ? `aria-label="${word[j]} ${['not in the word', 'in the word, wrong place', 'right place'][sc[j]]}"` : ''}>${word[j] || ''}</span>`).join('')}</div>`);
  }
  rwShake = false;
  const keys = {}; for (const g of cur.guesses) rwScore(g, ans).forEach((v, j) => { keys[g[j]] = Math.max(keys[g[j]] == null ? -1 : keys[g[j]], v); });
  const kb = ['QWERTYUIOP', 'ASDFGHJKL', '+ZXCVBNM-'].map(row => `<div class="rw-krow">${[...row].map(k => k === '+' ? '<button class="rw-k wide" data-act="rwkey" data-arg="ENTER">Enter</button>' : k === '-' ? '<button class="rw-k wide" data-act="rwkey" data-arg="BACK" aria-label="Delete">⌫</button>' : `<button class="rw-k ${keys[k] == null ? '' : ['no', 'in', 'ok'][keys[k]]}" data-act="rwkey" data-arg="${k}">${k}</button>`).join('')}</div>`).join('');
  return `<div class="rw-board" aria-label="Runeword board">${rows.join('')}</div><div class="rw-msg" role="status">${esc(rwMsg)}</div>${cur.done ? '' : `<div class="rw-kb">${kb}</div>`}`;
}
function rwRenderBoard() { const el = document.getElementById('rwboard'); if (el) el.innerHTML = rwBoardHtml(); else renderMain(); }
function tabGames() {
  const r = rwState(), cur = r.cur, b = account.mg.boost, active = dailyBoost() > 0;
  const winPct = r.played ? Math.round(r.wins / r.played * 100) : 0, maxD = Math.max(1, ...r.dist);
  const result = cur.done ? `<div class="card rw-result">${cur.won ? `<b class="verd">Solved in ${cur.guesses.length}!</b> +${cur.reward ? cur.reward.pct : rwBoostPct(r.streak)}% XP and yield for all your characters until midnight${cur.reward ? `, and +${cur.reward.shards} shard${cur.reward.shards > 1 ? 's' : ''}` : ''}.` : `<b>Out of tries.</b> The word was <b>${rwAnswer(cur.day)}</b>. Your streak starts again tomorrow.`}
      <div class="row" style="gap:6px;margin-top:8px"><button class="pri" data-act="rwshare">Copy result</button><span class="mute" style="font-size:13px">Next word in <b data-live="rwnext"></b></span></div></div>` : '';
  return `<h2>Daily games</h2><p class="mute">A new puzzle every day, the same for everyone. Win for a boost to XP and yield for all your characters until midnight, plus shards. Keep a streak going for a bigger boost (up to +15%).</p>
    <div class="cols rw-wrap"><div class="card"><div class="spread"><h3 style="margin:0">Runeword #${cur.day}</h3><span class="mute" style="font-size:13px">Guess the 5-letter word in 6 tries</span></div>
      <div id="rwboard">${rwBoardHtml()}</div></div>
      <div>${result}
        <div class="card"><b>Your Runeword</b><div class="rw-stats"><div><b>${r.played}</b><span>Played</span></div><div><b>${winPct}%</b><span>Won</span></div><div><b>${r.streak}</b><span>Streak</span></div><div><b>${r.best}</b><span>Best</span></div></div>
          <div class="rw-dist">${r.dist.map((v, i) => `<div><span>${i + 1}</span><i style="width:${Math.max(6, v / maxD * 100)}%" class="${cur.won && cur.guesses.length === i + 1 ? 'on' : ''}">${v}</i></div>`).join('')}</div>
          <p class="mute" style="font-size:13px;margin:8px 0 0">${active ? `Today’s boost: <b class="verd">+${b.pct}%</b> XP and yield.` : 'No boost active today.'} Next win: +${rwBoostPct(cur.won ? r.streak + 1 : (r.lastWin >= cur.day - 1 ? r.streak + 1 : 1))}%.</p></div>
        <div class="card"><b>How to play</b><p class="mute" style="font-size:14px;margin:6px 0 0">Type a 5-letter word and press Enter. <span class="rw-t ok sm">A</span> is in the right place, <span class="rw-t in sm">B</span> is in the word but somewhere else, <span class="rw-t no sm">C</span> isn’t in the word. Answers are fantasy words (swords, spells, monsters, places…); any common English word can be a guess. More daily games are on the way.</p></div>
      </div></div>`;
}
const GAMES_HANDLERS = {
  rwkey: k => rwType(k),
  rwshare: async () => { const t = rwShareText(); try { await navigator.clipboard.writeText(t); toast('Result copied. Paste it anywhere to share.', 'verd'); } catch (e) { modal(`<h3>Your result</h3><textarea rows="8" style="width:100%" readonly>${esc(t)}</textarea><div class="row" style="justify-content:flex-end;margin-top:8px"><button data-act="close">Close</button></div>`); } },
};
if (typeof document !== 'undefined') document.addEventListener('keydown', e => {
  if (typeof tab === 'undefined' || tab !== 'games' || screen !== 'game' || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) || document.querySelector('.modal')) return;
  if (e.key === 'Enter') { e.preventDefault(); rwType('ENTER'); } else if (e.key === 'Backspace') { e.preventDefault(); rwType('BACK'); } else if (/^[a-z]$/i.test(e.key)) rwType(e.key.toUpperCase());
});
ACHIEVEMENTS.push(
  { id: 'rw_1', cat: 'Daily games', name: 'Word Seeker', desc: 'Solve a Runeword.', pts: 10, goal: 1, stat: 'rwWins' },
  { id: 'rw_30', cat: 'Daily games', name: 'Runecaster', desc: 'Solve 30 Runewords.', pts: 25, goal: 30, stat: 'rwWins' },
  { id: 'rw_s7', cat: 'Daily games', name: 'Week of Words', desc: 'Reach a 7-day Runeword streak.', pts: 25, goal: 7, stat: 'rwStreak' },
  { id: 'rw_s30', cat: 'Daily games', name: 'Unbroken Rune', desc: 'Reach a 30-day Runeword streak.', pts: 50, goal: 30, stat: 'rwStreak' },
  { id: 'rw_two', cat: 'Daily games', name: 'Lucky Guess', desc: 'Solve a Runeword in 2 tries or fewer.', pts: 15, goal: 1, stat: 'rwTwo' },
);
