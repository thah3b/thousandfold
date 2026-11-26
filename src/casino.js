// ============================================================
// v2.4 — Casino. First game: Blackjack.
// 8-deck shoe, cut card at 70–80%. Blackjack pays 3:2. Dealer stands on all 17s
// and peeks for blackjack (Ace or ten-value up). Double on any first two cards,
// double after split, split up to 4 hands, split Aces get one card each.
// Insurance on a dealer Ace pays 2:1. No surrender.
// Side bets on the deal: Perfect Pairs (player's two cards) and 21+3 (player's
// two cards + dealer's up card). Wager gold (this character) or Thousandium
// (account). Casino winnings never count as "gold earned" on the leaderboards.
// ============================================================
const CS = {
  decks: 8,
  cur: {
    gold: { name: 'Gold', min: 1, max: Infinity, sideMax: Infinity },
    th: { name: 'Thousandium', min: 1, max: Infinity, sideMax: Infinity },
  },
  pp: [['Perfect pair', 25], ['Coloured pair', 12], ['Mixed pair', 6]],
  t3: [['Suited three of a kind', 100], ['Straight flush', 40], ['Three of a kind', 30], ['Straight', 10], ['Flush', 5]],
  histMax: 500,
};
const CS_RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const CS_SUITS = ['♠', '♥', '♦', '♣'];
const csRank = c => c % 13, csSuit = c => Math.floor(c / 13) % 4;
const csRed = c => csSuit(c) === 1 || csSuit(c) === 2;
const csVal = c => { const r = csRank(c); return r === 0 ? 11 : r >= 9 ? 10 : r + 1; };
const csName = c => CS_RANKS[csRank(c)] + CS_SUITS[csSuit(c)];
function csTotal(cards) {
  let t = 0, aces = 0;
  for (const c of cards) { t += csVal(c); if (csRank(c) === 0) aces++; }
  while (t > 21 && aces) { t -= 10; aces--; }
  return { t, soft: aces > 0 };
}
const csIsBJ = cards => cards.length === 2 && csTotal(cards).t === 21;

// Lifetime gold result at the casino (for the Casino losses leaderboard). Not touched by "Reset stats".
// Started from the gold stats for characters that played before v2.5c. null = never played.
function csLifetimeNet(c) {
  if (!c || !c.counters) return null;
  if (c.counters.casinoNet == null) { const S = c.casino && c.casino.stats && c.casino.stats.gold; if (!S || !S.rounds) return null; c.counters.casinoNet = S.won - S.lost; c.counters.casinoRounds = S.rounds; }
  return Math.round(c.counters.casinoNet);
}
// ---------- State ----------
function csState() {
  const c = ch.casino = ch.casino || {};
  c.cur = c.cur || 'gold'; c.view = c.view || 'table';
  c.bets = c.bets || { gold: { main: 100, pp: 0, t3: 0 }, th: { main: 1, pp: 0, t3: 0 } };
  c.spot = c.spot || 'main';
  c.stats = c.stats || {};
  for (const k of ['gold', 'th']) c.stats[k] = c.stats[k] || { rounds: 0, hands: 0, wagered: 0, won: 0, lost: 0, wins: 0, losses: 0, pushes: 0, bj: 0, best: 0, worst: 0, ppHits: 0, t3Hits: 0, insWins: 0, base: { w: 0, won: 0, lost: 0 }, hist: [] };
  c.chart = c.chart || { series: 'bal', range: 200 };
  if (!c.shoe || !c.shoe.length) csShuffle(c);
  return c;
}
const csBal = cur => cur === 'th' ? account.shards : ch.gold;
function csPay(cur, n) { if (cur === 'th') account.shards += n; else ch.gold += n; }
function csRand(n) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
function csShuffle(c) {
  const s = []; for (let d = 0; d < CS.decks; d++) for (let i = 0; i < 52; i++) s.push(i);
  for (let i = s.length - 1; i > 0; i--) { const j = csRand(i + 1); [s[i], s[j]] = [s[j], s[i]]; }
  c.shoe = s; c.pos = 0; c.cut = Math.floor(s.length * (0.7 + csRand(11) / 100)); c.shuffled = true;
}
function csDraw(c) { if (c.pos >= c.shoe.length) csShuffle(c); return c.shoe[c.pos++]; }

// ---------- Side bets ----------
function csPP(a, b) {
  if (csRank(a) !== csRank(b)) return null;
  if (csSuit(a) === csSuit(b)) return 0;
  return csRed(a) === csRed(b) ? 1 : 2;
}
function csT3(cards) {
  const r = cards.map(csRank).sort((x, y) => x - y), s = cards.map(csSuit);
  const flush = s[0] === s[1] && s[1] === s[2], trips = r[0] === r[1] && r[1] === r[2];
  const run = (x) => x[1] === x[0] + 1 && x[2] === x[1] + 1;
  const straight = run(r) || (r[0] === 0 && r[1] === 11 && r[2] === 12); // Q-K-A
  if (trips && flush) return 0; if (straight && flush) return 1; if (trips) return 2; if (straight) return 3; if (flush) return 4;
  return null;
}

// ---------- A round ----------
// r = { cur, bet, pp, t3, hands:[{cards, bet, done, dbl, splitAces}], act, dealer:[], phase, ins, notes:[], paid }
let csTimer = null, csSeen = new Set();
function csCanDeal() {
  const c = csState(), b = c.bets[c.cur], L = CS.cur[c.cur];
  const total = b.main + b.pp + b.t3;
  if (b.main < L.min) return `Minimum bet is ${N(L.min)}.`;
  if (total > csBal(c.cur)) return `Not enough ${L.name}.`;
  return '';
}
function csDeal() {
  const c = csState(); if (c.round && c.round.phase !== 'done') return;
  const err = csCanDeal(); if (err) { c.msg = err; renderMain(); return; }
  if (c.pos >= c.cut) { csShuffle(c); }
  const b = c.bets[c.cur];
  csPay(c.cur, -(b.main + b.pp + b.t3));
  const r = c.round = { cur: c.cur, bet: b.main, pp: b.pp, t3: b.t3, staked: b.main + b.pp + b.t3, back: 0, hands: [{ cards: [], bet: b.main }], act: 0, dealer: [], phase: 'play', ins: 0, notes: [] };
  c.msg = ''; c.bigWin = null; csSeen = new Set();
  r.hands[0].cards.push(csDraw(c)); r.dealer.push(csDraw(c)); r.hands[0].cards.push(csDraw(c)); r.dealer.push(csDraw(c));
  // Side bets settle straight away.
  const h = r.hands[0].cards;
  if (r.pp) { const k = csPP(h[0], h[1]); if (k !== null) { const w = r.pp * (CS.pp[k][1] + 1); r.back += w; r.notes.push(['pp', `${CS.pp[k][0]}! Perfect Pairs pays ${CS.pp[k][1]}:1 (+${N(w - r.pp)})`]); c.stats[r.cur].ppHits++; } else r.notes.push(['ppx', 'Perfect Pairs: no pair']); }
  if (r.t3) { const k = csT3([h[0], h[1], r.dealer[0]]); if (k !== null) { const w = r.t3 * (CS.t3[k][1] + 1); r.back += w; r.notes.push(['t3', `${CS.t3[k][0]}! 21+3 pays ${CS.t3[k][1]}:1 (+${N(w - r.t3)})`]); c.stats[r.cur].t3Hits++; } else r.notes.push(['t3x', '21+3: no hand']); }
  if (r.back) csPay(r.cur, r.back);
  if (csRank(r.dealer[0]) === 0 && csBal(r.cur) >= Math.ceil(r.bet / 2)) r.phase = 'insurance';
  else csPeek();
  save(); renderTop(); renderMain(); csBigWinStart();
}
function csInsurance(take) {
  const c = csState(), r = c.round; if (!r || r.phase !== 'insurance') return;
  if (take) { r.ins = Math.ceil(r.bet / 2); csPay(r.cur, -r.ins); r.staked += r.ins; }
  r.phase = 'play'; csPeek(); save(); renderTop(); renderMain(); csBigWinStart();
}
// Dealer checks the hole card when showing an Ace or a ten-value card.
function csPeek() {
  const r = ch.casino.round, up = csVal(r.dealer[0]);
  const dBJ = (up === 11 || up === 10) && csIsBJ(r.dealer), pBJ = csIsBJ(r.hands[0].cards);
  if (dBJ || pBJ) { r.hands[0].done = true; csSettle(); return; }
  csAutoStand();
}
const csHand = () => ch.casino.round.hands[ch.casino.round.act];
// Move past finished hands (21, bust, split Aces); start the dealer when all are done.
function csAutoStand() {
  const r = ch.casino.round;
  while (r.act < r.hands.length) {
    const h = r.hands[r.act];
    if (h.cards.length === 1) h.cards.push(csDraw(ch.casino)); // second card for a split hand
    const t = csTotal(h.cards).t;
    if (h.done || t >= 21 || (h.splitAces && h.cards.length >= 2)) { h.done = true; r.act++; continue; }
    return;
  }
  csDealerPlay();
}
function csAction(a) {
  const c = csState(), r = c.round; if (!r || r.phase !== 'play' || r.act >= r.hands.length) return;
  const h = csHand();
  if (a === 'hit') h.cards.push(csDraw(c));
  else if (a === 'stand') h.done = true;
  else if (a === 'double') {
    if (h.cards.length !== 2 || csBal(r.cur) < h.bet) return;
    csPay(r.cur, -h.bet); r.staked += h.bet; h.bet *= 2; h.dbl = true; h.cards.push(csDraw(c)); h.done = true;
  } else if (a === 'split') {
    if (!csCanSplit(r, h)) return;
    csPay(r.cur, -h.bet); r.staked += h.bet;
    const aces = csRank(h.cards[0]) === 0;
    const nh = { cards: [h.cards.pop()], bet: h.bet, splitAces: aces, split: true };
    h.splitAces = aces; h.split = true;
    r.hands.splice(r.act + 1, 0, nh);
  }
  csAutoStand(); save(); renderTop(); renderMain(); csBigWinStart();
}
const csCanSplit = (r, h) => h.cards.length === 2 && csVal(h.cards[0]) === csVal(h.cards[1]) && r.hands.length < 4 && !h.splitAces && csBal(r.cur) >= h.bet;

// Dealer draws to 17 (stands on soft 17), one card at a time so you can watch.
function csDealerPlay() {
  const r = ch.casino.round; r.phase = 'dealer';
  const live = r.hands.some(h => csTotal(h.cards).t <= 21);
  const step = () => {
    const t = csTotal(r.dealer).t;
    if (live && t < 17) { r.dealer.push(csDraw(ch.casino)); save(); if (tab === 'casino') renderMain(); csTimer = setTimeout(step, account.settings.reduced ? 0 : 550); return; }
    csSettle();
    if (tab === 'casino') { renderTop(); renderMain(); csBigWinStart(); }
  };
  clearTimeout(csTimer);
  if (account.settings.reduced) { while (live && csTotal(r.dealer).t < 17) r.dealer.push(csDraw(ch.casino)); csSettle(); return; }
  csTimer = setTimeout(step, 450);
}
function csSettle() {
  const c = ch.casino, r = c.round, S = c.stats[r.cur];
  const d = csTotal(r.dealer).t, dBJ = csIsBJ(r.dealer);
  let pay = 0;
  if (r.ins) { if (dBJ) { pay += r.ins * 3; S.insWins++; r.notes.push(['ins', `Insurance pays 2:1 (+${N(r.ins * 2)})`]); } else r.notes.push(['insx', 'Insurance lost']); }
  for (const h of r.hands) {
    const t = csTotal(h.cards).t, bj = csIsBJ(h.cards) && !h.split;
    let res;
    if (bj && !dBJ) { res = 'bj'; pay += h.bet + Math.floor(h.bet * 3 / 2); S.bj++; }
    else if (bj && dBJ) { res = 'push'; pay += h.bet; }
    else if (t > 21) res = 'bust';
    else if (dBJ) res = 'lose';
    else if (d > 21 || t > d) { res = 'win'; pay += h.bet * 2; }
    else if (t === d) { res = 'push'; pay += h.bet; }
    else res = 'lose';
    h.res = res; S.hands++;
    if (res === 'win' || res === 'bj') S.wins++; else if (res === 'push') S.pushes++; else S.losses++;
  }
  csPay(r.cur, pay); r.back += pay;
  const net = r.back - r.staked;
  S.rounds++; S.wagered += r.staked;
  if (r.cur === 'gold') { csLifetimeNet(ch); ch.counters.casinoNet += net; ch.counters.casinoRounds = (ch.counters.casinoRounds || 0) + 1; }
  if (net > 0) S.won += net; else S.lost += -net;
  S.best = Math.max(S.best, net); S.worst = Math.min(S.worst, net);
  S.hist.push([Math.round(Date.now() / 1000), csBal(r.cur), r.staked, net]);
  if (S.hist.length > CS.histMax) { const o = S.hist.shift(); S.base.w += o[2]; if (o[3] > 0) S.base.won += o[3]; else S.base.lost -= o[3]; }
  r.net = net; r.phase = 'done'; csCheckBigWin(r);
  const cn = r.cur === 'th' ? 'Thousandium' : 'gold';
  if (r.hands.some(h => h.res === 'bj')) addLog('lucky', `Blackjack! Won ${N(Math.floor(r.bet * 3 / 2))} ${cn} at the Casino.`);
  for (const [k, s] of r.notes) if ((k === 'pp' || k === 't3') && / pays (1[2-9]|[2-9]\d|\d{3}):1/.test(s)) addLog('lucky', `Casino: ${s.replace(/ \(\+.*\)$/, '')}`);
  save();
}

// ---------- Table view (layout after online live-dealer tables: controls on the left, felt on the right) ----------
function csCard(c, key, hidden) {
  const isNew = !csSeen.has(key); csSeen.add(key);
  const cls = `cscard ${hidden ? 'back' : csRed(c) ? 'red' : 'blk'} ${isNew && !account.settings.reduced ? 'deal' : ''}`;
  if (hidden) return `<div class="${cls}" aria-label="Face-down card"></div>`;
  const r = CS_RANKS[csRank(c)], s = CS_SUITS[csSuit(c)];
  return `<div class="${cls}" aria-label="${r}${s}"><span class="tl">${r}<br>${s}</span><span class="pip">${s}</span><span class="br">${r}<br>${s}</span></div>`;
}
function csTotalLabel(cards, final) { const { t, soft } = csTotal(cards); if (csIsBJ(cards)) return 'BJ'; return soft && t < 21 && !final ? `${t - 10}/${t}` : `${t}`; }
const CS_RES = { win: ['Win', 'win'], bj: ['Blackjack', 'bj'], push: ['Push', 'push'], lose: ['Lose', 'lose'], bust: ['Bust', 'lose'] };
// Typed amounts: "2500", "2.5k", "10m", "1b".
function csParse(v) { const m = String(v || '').trim().toLowerCase().replace(/[, _]/g, '').match(/^(\d*\.?\d+)([kmb])?$/); if (!m) return 0; return Math.floor(+m[1] * ({ k: 1e3, m: 1e6, b: 1e9 }[m[2]] || 1)); }
function csBetBox(k, label, c, L, locked) {
  const v = c.bets[c.cur][k];
  return `<label class="csbet"><span class="spread"><span>${label}</span><span class="mute num" id="csv-${k}">${v ? N(v) : ''}</span></span>
    <span class="csbetrow"><input id="csin-${k}" class="csin" data-k="${k}" inputmode="decimal" autocomplete="off" value="${v || ''}" placeholder="0" ${locked ? 'disabled' : ''}>
    <button class="sm" data-act="csbetop" data-arg="${k}|half" ${locked ? 'disabled' : ''}>½</button><button class="sm" data-act="csbetop" data-arg="${k}|dbl" ${locked ? 'disabled' : ''}>2×</button><button class="sm" data-act="csbetop" data-arg="${k}|max" ${locked ? 'disabled' : ''}>Max</button></span></label>`;
}
function csTableHtml() {
  const c = csState(), r = c.round, L = CS.cur[c.cur];
  const live = r && r.phase !== 'done', showHole = r && (r.phase === 'dealer' || r.phase === 'done');
  const bubble = (txt, cls) => `<span class="csbub ${cls || ''}">${txt}</span>`;
  // Dealer
  const dTot = r ? (showHole ? csTotalLabel(r.dealer, true) : (csVal(r.dealer[0]) === 11 ? '1/11' : csVal(r.dealer[0]))) : '';
  const dBust = r && showHole && csTotal(r.dealer).t > 21;
  const dealer = `<div class="csdealer"><div class="cscards">${r ? r.dealer.map((x, i) => csCard(x, (i === 1 && !showHole ? 'dh' : 'd') + i, i === 1 && !showHole)).join('') : '<div class="cscard ghost"></div><div class="cscard ghost"></div>'}</div>
    ${r ? bubble(dBust ? `${dTot} · Bust` : dTot, dBust ? 'lose' : '') : ''}<div class="csfeltlbl">DEALER</div></div>`;
  // Felt text, like a real table
  const felt = `<div class="csfelt"><span>BLACKJACK PAYS 3 TO 2</span><span class="mute">Dealer stands on all 17s · Insurance pays 2 to 1</span></div>`;
  // Player hands
  const hands = r ? r.hands.map((h, i) => {
    const on = r.phase === 'play' && i === r.act, res = h.res && CS_RES[h.res], t = csTotal(h.cards).t;
    return `<div class="cshand ${on ? 'on' : ''} ${res ? 'r-' + res[1] : ''}"><div class="cscards">${h.cards.map((x, j) => csCard(x, `h${i}-${j}`)).join('')}</div>
      ${bubble(csTotalLabel(h.cards, h.done || r.phase !== 'play'), t > 21 ? 'lose' : csIsBJ(h.cards) && !h.split ? 'bj' : '')}
      ${res ? `<span class="csres ${res[1]}">${res[0]}</span>` : ''}<span class="cshbet">${N(h.bet)}${h.dbl ? ' · 2×' : ''}</span></div>`;
  }).join('') : '';
  // Bet spots on the felt
  const b = r ? { pp: r.pp, main: r.bet, t3: r.t3 } : c.bets[c.cur];
  const note = k => r && r.notes.find(n => n[0] === k || n[0] === k + 'x');
  const spot = (k, n) => { const nt = note(k), hit = nt && nt[0] === k; return `<div class="csspot2 ${hit ? 'hit' : nt ? 'miss' : ''}"><span class="csstack">${b[k] ? N(b[k]) : ''}</span><span class="lbl">${n}</span>${hit ? `<span class="cssidewin">${esc(nt[1].replace(/ \(.*$/, ''))}</span>` : ''}</div>`; };
  const spots = `<div class="csspots2">${spot('pp', 'PERFECT PAIRS')}${spot('main', 'MAIN')}${spot('t3', '21+3')}</div>`;
  // Controls
  let act;
  if (r && r.phase === 'insurance') act = `<div class="csq">Insurance? Dealer shows an Ace. Costs <b>${N(Math.ceil(r.bet / 2))}</b>, pays 2:1 if the dealer has Blackjack.</div>
    <div class="csgrid2"><button class="pri" data-act="csins" data-arg="1">Insure</button><button data-act="csins" data-arg="0">No insurance</button></div>`;
  else {
    const h = r && r.phase === 'play' ? csHand() : null;
    const can = { hit: !!h, stand: !!h, double: !!h && h.cards.length === 2 && csBal(r.cur) >= h.bet, split: !!h && csCanSplit(r, h) };
    act = `<div class="csgrid2"><button data-act="csact" data-arg="hit" ${can.hit ? '' : 'disabled'}>Hit <kbd>H</kbd></button><button data-act="csact" data-arg="stand" ${can.stand ? '' : 'disabled'}>Stand <kbd>S</kbd></button>
      <button data-act="csact" data-arg="split" ${can.split ? '' : 'disabled'}>Split <kbd>P</kbd></button><button data-act="csact" data-arg="double" ${can.double ? '' : 'disabled'}>Double <kbd>D</kbd></button></div>`;
  }
  const err = live ? '' : csCanDeal(), total = c.bets[c.cur].main + c.bets[c.cur].pp + c.bets[c.cur].t3;
  const panel = `<div class="cspanel card">
    ${csBetBox('main', 'Main bet', c, L, live)}${csBetBox('pp', 'Perfect Pairs', c, L, live)}${csBetBox('t3', '21+3', c, L, live)}
    <div class="spread mute" style="font-size:13px;margin:2px 0 10px"><span>Total bet</span><b class="num" id="cstotal" style="color:var(--ink)">${N(total)}</b></div>
    <button class="pri csbig" data-act="csdeal" id="csdealbtn" ${live || err ? 'disabled' : ''}>${r && !live ? 'Bet again' : 'Bet'} <kbd>Space</kbd></button>
    <p class="mute" id="csmsg" style="font-size:13px;margin:6px 0 10px;min-height:18px">${esc(live ? (r.phase === 'dealer' ? 'Dealer is drawing…' : '') : (c.msg || err || 'No table limit: bet up to what you hold.'))}</p>
    ${act}
    <p class="mute" style="font-size:12px;margin:10px 0 0">Type amounts like 2500, 25k or 1.5m.</p></div>`;
  const result = r && r.phase === 'done' ? `<div class="csbanner ${r.net > 0 ? 'win' : r.net < 0 ? 'lose' : 'push'}">${r.net > 0 ? `You won <b>${N(r.net)}</b>` : r.net < 0 ? `You lost <b>${N(-r.net)}</b>` : 'Push · your bet is returned'}</div>` : '';
  const left = c.shoe.length - c.pos;
  return `<div class="cswrap">${panel}<div class="cstable">
      <div class="csshoe" title="${left} cards left in the shoe"><span>${left}</span></div>
      ${dealer}${felt}${result}<div class="cshands">${hands}</div>${spots}
      ${r && r.notes.some(n => n[0] === 'ins' || n[0] === 'insx') ? `<div class="csnotes">${r.notes.filter(n => n[0].startsWith('ins')).map(([k, s]) => `<span class="chip ${k === 'ins' ? 'on' : ''}">${esc(s)}</span>`).join('')}</div>` : ''}
    </div></div>
    <p class="mute" style="font-size:13px;margin:10px 0 0">8-deck shoe${c.pos >= c.cut ? ' · shuffle next hand' : ''} · Blackjack pays 3:2 · Dealer stands on all 17s · Insurance pays 2:1 · Double on any two cards, also after a split · Split up to 4 hands · Split Aces get one card</p>
    <details class="card" style="margin-top:10px"><summary><b>Side bet payouts</b></summary>
      <div class="cspays"><div><b>Perfect Pairs</b>${CS.pp.map(([n, p]) => `<div class="spread"><span>${n}</span><b>${p}:1</b></div>`).join('')}</div>
      <div><b>21+3</b>${CS.t3.map(([n, p]) => `<div class="spread"><span>${n}</span><b>${p}:1</b></div>`).join('')}</div></div>
      <p class="mute" style="font-size:13px;margin:8px 0 0">Perfect Pairs uses your first two cards. 21+3 uses your first two cards and the dealer's up card. Both pay the moment the cards are dealt.</p></details>
    ${csBigWinHtml(c)}`;
}
// Typing a bet updates the numbers without redrawing the table.
document.addEventListener('input', e => {
  const el = e.target; if (!el.classList || !el.classList.contains('csin') || typeof ch === 'undefined' || !ch) return;
  const c = csState(), k = el.dataset.k; c.bets[c.cur][k] = csParse(el.value); c.msg = '';
  const v = document.getElementById('csv-' + k); if (v) v.textContent = c.bets[c.cur][k] ? N(c.bets[c.cur][k]) : '';
  csPanelRefresh();
});
function csPanelRefresh() {
  const c = csState(), b = c.bets[c.cur], L = CS.cur[c.cur], err = csCanDeal();
  const t = document.getElementById('cstotal'); if (t) t.textContent = N(b.main + b.pp + b.t3);
  const d = document.getElementById('csdealbtn'); if (d) d.disabled = !!err;
  const m = document.getElementById('csmsg'); if (m) m.textContent = err || 'No table limit: bet up to what you hold.';
  const sp = document.querySelectorAll('.csspots2 .csstack'); if (sp.length === 3 && !(c.round && c.round.phase !== 'done')) [b.pp, b.main, b.t3].forEach((v, i) => sp[i].textContent = v ? N(v) : '');
}
// Keyboard: H hit, S stand, D double, P split, Space bet.
document.addEventListener('keydown', e => {
  if (typeof tab === 'undefined' || tab !== 'casino' || e.ctrlKey || e.metaKey || e.altKey || document.getElementById('modal')) return;
  const inInput = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  const c = ch && ch.casino; if (!c) return;
  if (c.bigWin) { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); CASINO_HANDLERS.csbigok(); } return; }
  if (e.key === 'Enter' && inInput) { e.preventDefault(); csDeal(); return; }
  if (inInput) return;
  const k = e.key.toLowerCase(), m = { h: 'hit', s: 'stand', d: 'double', p: 'split' }[k];
  if (m && c.round && c.round.phase === 'play') { e.preventDefault(); csAction(m); }
  else if (e.key === ' ' && c.view === 'table' && !(c.round && c.round.phase !== 'done')) { e.preventDefault(); csDeal(); }
});

// ---------- Big win ----------
// Shown when a round pays back at least 3× what you put on the table at the deal
// (a won double, a won split, a fat side bet…). Tap or wait to close.
const CS_TIERS = [[25, 'MEGA WIN'], [10, 'HUGE WIN'], [3, 'BIG WIN']];
function csCheckBigWin(r) {
  const base = r.bet + r.pp + r.t3, mult = r.back / Math.max(1, base);
  const tier = r.net > 0 && CS_TIERS.find(t => mult >= t[0]);
  if (!tier) return;
  ch.casino.bigWin = { amt: r.net, back: r.back, mult: Math.floor(mult * 10) / 10, tier: tier[1], cur: r.cur, at: Date.now() };
  addLog('lucky', `Casino ${tier[1].toLowerCase()}: +${N(r.net)} ${r.cur === 'th' ? 'Thousandium' : 'gold'} (${Math.floor(mult * 10) / 10}× your bet).`);
}
function csBigWinHtml(c) {
  const w = c.bigWin; if (!w) return '';
  if (Date.now() - w.at > 8000) { c.bigWin = null; return ''; }
  const coins = account.settings.reduced ? '' : Array.from({ length: 26 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${((i * 0.13) % 1.2).toFixed(2)}s;animation-duration:${(1.6 + (i % 5) * 0.25).toFixed(2)}s"></i>`).join('');
  return `<div class="csbw ${w.tier === 'MEGA WIN' ? 'mega' : w.tier === 'HUGE WIN' ? 'huge' : ''}" data-act="csbigok" role="dialog" aria-label="${w.tier}">
    <div class="csbwcoins">${coins}</div>
    <div class="csbwbox"><div class="csbwt">${w.tier}</div><div class="csbwamt num" data-to="${w.amt}">${account.settings.reduced ? '+' + N(w.amt) : '+0'}</div>
    <div class="csbwsub">${w.cur === 'th' ? 'Thousandium' : 'gold'} · ${w.mult}× your bet</div><div class="mute" style="font-size:13px;margin-top:10px">Tap to continue</div></div></div>`;
}
let csBwTimer = null;
function csBigWinStart() {
  const el = document.querySelector('.csbwamt'); if (!el || account.settings.reduced) return;
  const to = +el.dataset.to, t0 = performance.now(), dur = 1400;
  const step = t => { const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = '+' + N(Math.floor(to * e)); if (k < 1 && document.body.contains(el)) requestAnimationFrame(step); };
  requestAnimationFrame(step);
  clearTimeout(csBwTimer); csBwTimer = setTimeout(() => { if (ch && ch.casino && ch.casino.bigWin) CASINO_HANDLERS.csbigok(); }, 4200);
}

// ---------- Stats view ----------
const CS_SERIES = [['bal', 'Money'], ['net', 'Net won or lost'], ['w', 'Wagered'], ['won', 'Won'], ['lost', 'Lost']];
function csPoints(S) {
  let w = S.base.w, won = S.base.won, lost = S.base.lost;
  return S.hist.map(([t, bal, st, net]) => { w += st; if (net > 0) won += net; else lost -= net; return { t, bal, st, net, w, won, lost, nv: won - lost }; });
}
function csChart(S, cur) {
  const c = ch.casino, key = c.chart.series, all = csPoints(S);
  const pts = c.chart.range ? all.slice(-c.chart.range) : all;
  if (pts.length < 2) return `<div class="cschart empty mute">Play a few hands and your graph will appear here.</div>`;
  const val = p => key === 'net' ? p.nv : p[key];
  const W = 720, H = 240, P = { l: 64, r: 14, t: 14, b: 26 };
  let lo = Math.min(...pts.map(val)), hi = Math.max(...pts.map(val));
  if (key === 'net') { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
  if (hi === lo) { hi += 1; lo -= key === 'bal' ? 1 : 0; }
  const pad = (hi - lo) * 0.08; hi += pad; if (lo !== 0) lo -= pad;
  const x = i => P.l + (W - P.l - P.r) * (i / (pts.length - 1)), y = v => P.t + (H - P.t - P.b) * (1 - (v - lo) / (hi - lo));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => lo + (hi - lo) * f);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(val(p)).toFixed(1)}`).join('');
  const area = `${path}L${x(pts.length - 1).toFixed(1)},${y(Math.max(lo, Math.min(hi, key === 'net' ? 0 : lo))).toFixed(1)}L${x(0).toFixed(1)},${y(Math.max(lo, Math.min(hi, key === 'net' ? 0 : lo))).toFixed(1)}Z`;
  const first = all.length - pts.length + 1;
  const data = JSON.stringify(pts.map((p, i) => [i + first, p.t, val(p), p.net, p.st]));
  return `<div class="cschart" data-cur="${cur}" data-series="${key}"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(CS_SERIES.find(s => s[0] === key)[1])} over your last ${pts.length} rounds">
      ${ticks.map(v => `<line class="grid" x1="${P.l}" x2="${W - P.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}"/><text class="ax" x="${P.l - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end">${csShort(v, (hi - lo) / 4)}</text>`).join('')}
      ${key === 'net' && lo < 0 ? `<line class="zero" x1="${P.l}" x2="${W - P.r}" y1="${y(0).toFixed(1)}" y2="${y(0).toFixed(1)}"/>` : ''}
      <path class="area" d="${area}"/><path class="line" d="${path}"/>
      <text class="ax" x="${P.l}" y="${H - 6}">Round ${first}</text><text class="ax" x="${W - P.r}" y="${H - 6}" text-anchor="end">Round ${all.length}</text>
      <line class="xh" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" style="display:none"/><circle class="dot" r="5" style="display:none"/>
      <rect class="hit" x="${P.l}" y="0" width="${W - P.l - P.r}" height="${H}" fill="transparent"/></svg>
    <div class="cstip" style="display:none"></div><span hidden class="csdata" data-noi18n>${esc(data)}</span>
    <span hidden class="csgeom" data-noi18n>${JSON.stringify({ W, H, P, lo, hi, n: pts.length })}</span></div>`;
}
function csShort(v, step) {
  const a = Math.abs(v), s = v < 0 ? '−' : '', u = a >= 1e9 ? [1e9, 'B'] : a >= 1e6 ? [1e6, 'M'] : a >= 1e4 ? [1e3, 'K'] : [1, ''];
  const dec = step ? Math.max(0, Math.min(3, Math.ceil(-Math.log10(step / u[0])))) : (u[0] > 1 ? 1 : 0);
  return s + (a / u[0]).toFixed(u[0] === 1 ? 0 : dec) + u[1];
}
// Hover: crosshair + tooltip on the nearest round.
document.addEventListener('pointermove', e => {
  const box = e.target.closest && e.target.closest('.cschart'); if (!box || !box.querySelector('.csdata')) return;
  const svg = box.querySelector('svg'), g = JSON.parse(box.querySelector('.csgeom').textContent), d = JSON.parse(box.querySelector('.csdata').textContent);
  const rc = svg.getBoundingClientRect(), sx = (e.clientX - rc.left) / rc.width * g.W;
  const i = Math.max(0, Math.min(g.n - 1, Math.round((sx - g.P.l) / (g.W - g.P.l - g.P.r) * (g.n - 1))));
  const [round, t, v, net, st] = d[i];
  const px = g.P.l + (g.W - g.P.l - g.P.r) * (i / Math.max(1, g.n - 1)), py = g.P.t + (g.H - g.P.t - g.P.b) * (1 - (v - g.lo) / (g.hi - g.lo));
  const xh = svg.querySelector('.xh'), dot = svg.querySelector('.dot'), tip = box.querySelector('.cstip');
  xh.setAttribute('x1', px); xh.setAttribute('x2', px); xh.style.display = ''; dot.setAttribute('cx', px); dot.setAttribute('cy', py); dot.style.display = '';
  const name = (CS_SERIES.find(s => s[0] === box.dataset.series) || [, ''])[1];
  tip.innerHTML = `<b>Round ${round}</b> · ${new Date(t * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}<br>${esc(name)}: <b>${N(v)}</b><br>This round: bet ${N(st)}, ${net > 0 ? `<span class="verd">won ${N(net)}</span>` : net < 0 ? `<span class="bad">lost ${N(-net)}</span>` : 'even'}`;
  tip.style.display = ''; const left = px / g.W * rc.width; tip.style.left = Math.min(rc.width - 190, Math.max(0, left - 95)) + 'px';
});
document.addEventListener('pointerleave', e => { const box = e.target.closest && e.target.closest('.cschart'); if (!box) return; box.querySelectorAll('.xh,.dot,.cstip').forEach(n => n.style.display = 'none'); }, true);

function csStatsHtml() {
  const c = csState(), cur = c.statCur || c.cur, S = c.stats[cur], cn = cur === 'th' ? 'Thousandium' : 'gold';
  const net = S.won - S.lost, decided = S.wins + S.losses + S.pushes;
  const tile = (n, v, cls) => `<div class="cstile"><span class="mute">${n}</span><b class="num ${cls || ''}">${v}</b></div>`;
  const recent = csPoints(S).slice(-12).reverse();
  return `<div class="row" style="gap:6px;margin-bottom:10px">${['gold', 'th'].map(k => `<button class="chip ${cur === k ? 'on' : ''}" data-act="csstatcur" data-arg="${k}">${CS.cur[k].name}</button>`).join('')}</div>
    <div class="cstiles">${tile(`Your ${cn}`, N(csBal(cur)), 'gold')}${tile('Rounds', N(S.rounds))}${tile('Wagered', N(S.wagered))}${tile('Won', N(S.won), 'verd')}${tile('Lost', N(S.lost), 'bad')}${tile('Net', (net > 0 ? '+' : net < 0 ? '−' : '') + N(Math.abs(net)), net > 0 ? 'verd' : net < 0 ? 'bad' : '')}
      ${tile('Hands won', decided ? Math.round(S.wins / decided * 100) + '%' : '—')}${tile('Blackjacks', N(S.bj))}${tile('Biggest win', N(Math.max(0, S.best)))}${tile('Side bet hits', N(S.ppHits + S.t3Hits))}</div>
    <div class="card" style="margin-top:12px"><div class="spread" style="flex-wrap:wrap;gap:8px"><h3 style="margin:0">${esc(CS_SERIES.find(s => s[0] === c.chart.series)[1])}</h3>
      <div class="row" style="gap:6px">${CS_SERIES.map(([k, n]) => `<button class="chip ${c.chart.series === k ? 'on' : ''}" data-act="csseries" data-arg="${k}">${n}</button>`).join('')}</div></div>
      <div class="row" style="gap:6px;margin:8px 0">${[[50, 'Last 50'], [200, 'Last 200'], [0, 'All']].map(([v, n]) => `<button class="sm ${c.chart.range === v ? 'pri' : 'ghost'}" data-act="csrange" data-arg="${v}">${n}</button>`).join('')}<span class="mute" style="font-size:13px">${cn} · one point per round</span></div>
      ${csChart(S, cur)}</div>
    <div class="card" style="margin-top:12px"><h3 style="margin:0 0 6px">Recent rounds</h3>${recent.length ? `<table class="simtab cstab"><thead><tr><th>When</th><th>Bet</th><th>Result</th><th>${esc(cn[0].toUpperCase() + cn.slice(1))} after</th></tr></thead><tbody>${recent.map(p => `<tr><td>${new Date(p.t * 1000).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td><td class="num">${N(p.st)}</td><td class="num ${p.net > 0 ? 'verd' : p.net < 0 ? 'bad' : 'mute'}">${p.net > 0 ? '+' + N(p.net) : p.net < 0 ? '−' + N(-p.net) : 'Push'}</td><td class="num">${N(p.bal)}</td></tr>`).join('')}</tbody></table>` : '<p class="mute" style="margin:0">No rounds yet.</p>'}
      <p class="mute" style="font-size:13px;margin:8px 0 0">Wagered counts every bet: main, side bets, doubles, splits and insurance. Won and lost are the net result of each round. Casino winnings don't count toward the gold-earned leaderboard.</p>
      <div class="row" style="margin-top:8px"><button class="sm ghost" data-act="csreset">Reset ${esc(CS.cur[cur].name)} stats</button></div></div>`;
}

function tabCasino() {
  const c = csState();
  if (c.round && c.round.phase === 'dealer' && !csTimer) csDealerPlay();
  const curs = ['gold', 'th'].map(k => `<button class="chip ${c.cur === k ? 'on' : ''}" data-act="cscur" data-arg="${k}" ${c.round && c.round.phase !== 'done' ? 'disabled' : ''}>${CS.cur[k].name} <b class="gold">${N(csBal(k))}</b></button>`).join('');
  return `<div class="spread"><h2>Casino</h2><div class="row" style="gap:6px">${curs}</div></div>
    <p class="mute" style="margin:4px 0 10px">Blackjack at the Golden Hearth. Bet gold or Thousandium. Wins and losses are yours to keep, so play what you can afford to lose.</p>
    <div class="row" style="gap:6px;margin-bottom:12px">${[['table', '🂡 Blackjack'], ['stats', '📈 Stats']].map(([k, n]) => `<button class="chip ${c.view === k ? 'on' : ''}" data-act="csview" data-arg="${k}">${n}</button>`).join('')}</div>
    ${c.view === 'stats' ? csStatsHtml() : csTableHtml()}`;
}

const CASINO_HANDLERS = {
  cscur: k => { const c = csState(); if (c.round && c.round.phase !== 'done') return; c.cur = k; c.statCur = k; c.msg = ''; renderMain(); },
  csview: k => { csState().view = k; renderMain(); },
  csbetop: a => { const [k, op] = a.split('|'), c = csState(), b = c.bets[c.cur], L = CS.cur[c.cur], cap = k === 'main' ? L.max : L.sideMax;
    if (op === 'half') b[k] = Math.floor(b[k] / 2); else if (op === 'dbl') b[k] = Math.max(1, b[k]) * 2;
    else { const other = (k === 'main' ? 0 : b.main) + (k === 'pp' ? 0 : b.pp) + (k === 't3' ? 0 : b.t3); b[k] = Math.max(0, Math.floor(csBal(c.cur) - other)); }
    const el = document.getElementById('csin-' + k); if (el) el.value = b[k] || ''; const v = document.getElementById('csv-' + k); if (v) v.textContent = b[k] ? N(b[k]) : ''; c.msg = ''; csPanelRefresh(); },
  csbigok: () => { const c = csState(); c.bigWin = null; clearTimeout(csBwTimer); const el = document.querySelector('.csbw'); if (el) el.remove(); },
  csdeal: () => csDeal(),
  csins: a => csInsurance(a === '1'),
  csact: a => csAction(a),
  csstatcur: k => { csState().statCur = k; renderMain(); },
  csseries: k => { csState().chart.series = k; renderMain(); },
  csrange: v => { csState().chart.range = +v; renderMain(); },
  csreset: () => { const c = csState(), cur = c.statCur || c.cur; modal(`<h3>Reset ${esc(CS.cur[cur].name)} stats?</h3><p>Your graph and totals start again from zero. Your ${esc(CS.cur[cur].name)} isn't touched.</p><div class="row"><button class="pri" data-act="csresetok" data-arg="${cur}">Reset</button><button data-act="close">Cancel</button></div>`); },
  csresetok: cur => { closeModal(); delete ch.casino.stats[cur]; csState(); save(); renderMain(); },
};
