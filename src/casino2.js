// ============================================================
// v3.2 — Casino: Baccarat (2 decks) and Prediction (a simulated, 100% random market).
// Both use the Blackjack table's currency switch, typed bets, big-win screen and
// Casino losses leaderboard. Each game keeps its own stats (c.stats2[game][cur]).
// ============================================================
const BC = {
  decks: 2,
  spots: [['bp', 'Player', '1:1'], ['bt', 'Tie', '8:1'], ['bb', 'Banker', '0.95:1'], ['bpp', 'Player Pair', '11:1'], ['bbp', 'Banker Pair', '11:1']],
  road: 60,
};
const PD = { steps: 10, stepMs: 280, recent: 10 };
const csRandF = () => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; };
const cs2Stats = () => ({ rounds: 0, wagered: 0, won: 0, lost: 0, wins: 0, losses: 0, pushes: 0, best: 0, worst: 0, base: { w: 0, won: 0, lost: 0 }, hist: [] });
function cs2State() {
  const c = csState();
  c.stats2 = c.stats2 || {};
  for (const g of ['bac', 'pred']) { c.stats2[g] = c.stats2[g] || {}; for (const k of ['gold', 'th']) c.stats2[g][k] = c.stats2[g][k] || cs2Stats(); }
  for (const k of ['gold', 'th']) { const b = c.bets[k]; for (const s of ['bp', 'bb', 'bt', 'bpp', 'bbp']) if (b[s] == null) b[s] = 0; if (b.pr == null) b.pr = k === 'gold' ? 100 : 1; }
  c.bac = c.bac || { road: [] }; if (!c.bac.shoe || !c.bac.shoe.length) bcShuffle(c.bac);
  c.pred = c.pred || { recent: [], side: 'up' };
  return c;
}
// Shared bookkeeping for a finished round of either game.
function cs2Record(game, cur, staked, back) {
  const c = ch.casino, S = c.stats2[game][cur], net = back - staked;
  S.rounds++; S.wagered += staked; if (net > 0) { S.won += net; S.wins++; } else if (net < 0) { S.lost -= net; S.losses++; } else S.pushes++;
  S.best = Math.max(S.best, net); S.worst = Math.min(S.worst, net);
  S.hist.push([Math.round(Date.now() / 1000), csBal(cur), staked, net]);
  if (S.hist.length > CS.histMax) { const o = S.hist.shift(); S.base.w += o[2]; if (o[3] > 0) S.base.won += o[3]; else S.base.lost -= o[3]; }
  if (cur === 'gold') { csLifetimeNet(ch); ch.counters.casinoNet = (ch.counters.casinoNet || 0) + net; ch.counters.casinoRounds = (ch.counters.casinoRounds || 0) + 1; }
  return net;
}
// A gold/Thousandium bet box with ½ / 2× / Max, for one game's own bet keys.
function cs2BetBox(k, label, keys, locked) {
  const c = ch.casino, v = c.bets[c.cur][k];
  return `<label class="csbet"><span class="spread"><span>${label}</span><span class="mute num" id="csv-${k}">${v ? N(v) : ''}</span></span>
    <span class="csbetrow"><input id="csin-${k}" class="csin cs2in" data-k="${k}" inputmode="decimal" autocomplete="off" value="${v || ''}" placeholder="0" ${locked ? 'disabled' : ''}>
    <button class="sm" data-act="cs2betop" data-arg="${k}|half|${keys}" ${locked ? 'disabled' : ''}>½</button><button class="sm" data-act="cs2betop" data-arg="${k}|dbl|${keys}" ${locked ? 'disabled' : ''}>2×</button><button class="sm" data-act="cs2betop" data-arg="${k}|max|${keys}" ${locked ? 'disabled' : ''}>Max</button></span></label>`;
}
const bcStake = b => b.bp + b.bb + b.bt + b.bpp + b.bbp;

// ================= Baccarat =================
function bcShuffle(B) {
  const s = []; for (let d = 0; d < BC.decks; d++) for (let i = 0; i < 52; i++) s.push(i);
  for (let i = s.length - 1; i > 0; i--) { const j = csRand(i + 1); [s[i], s[j]] = [s[j], s[i]]; }
  B.shoe = s; B.pos = 0; B.cut = Math.floor(s.length * (0.72 + csRand(9) / 100));
}
const bcVal = x => { const r = csRank(x); return r >= 9 ? 0 : r + 1; };
const bcTot = cards => cards.reduce((t, x) => t + bcVal(x), 0) % 10;
function bcDraw(B) { if (B.pos >= B.shoe.length) bcShuffle(B); return B.shoe[B.pos++]; }
function bcCanDeal() {
  const c = cs2State(), b = c.bets[c.cur], t = bcStake(b);
  if (!t) return 'Put a bet on Player, Banker or Tie.';
  if (!(b.bp + b.bb + b.bt)) return 'Side bets need a bet on Player, Banker or Tie too.';
  if (t > csBal(c.cur)) return `You only have ${N(csBal(c.cur))} ${c.cur === 'th' ? 'Thousandium' : 'gold'}.`;
  return '';
}
// One hand of punto banco from shoe B with bets b. Pure: no rendering or saving.
function bcPlay(B, b) {
  const P = [bcDraw(B)], K = [bcDraw(B)]; P.push(bcDraw(B)); K.push(bcDraw(B));
  // Punto banco drawing rules.
  let p = bcTot(P), k = bcTot(K), p3 = null;
  if (p < 8 && k < 8) {
    if (p <= 5) { p3 = bcDraw(B); P.push(p3); }
    const v = p3 == null ? null : bcVal(p3);
    const bankerDraws = v == null ? k <= 5 : k <= 2 || (k === 3 && v !== 8) || (k === 4 && v >= 2 && v <= 7) || (k === 5 && v >= 4 && v <= 7) || (k === 6 && (v === 6 || v === 7));
    if (bankerDraws) K.push(bcDraw(B));
  }
  p = bcTot(P); k = bcTot(K);
  const win = p > k ? 'P' : k > p ? 'B' : 'T', ppair = csRank(P[0]) === csRank(P[1]), bpair = csRank(K[0]) === csRank(K[1]);
  let back = 0; const notes = [];
  if (b.bp) { if (win === 'P') back += b.bp * 2; else if (win === 'T') { back += b.bp; notes.push('Player bet pushes on a tie'); } }
  if (b.bb) { if (win === 'B') back += b.bb + Math.floor(b.bb * 0.95); else if (win === 'T') { back += b.bb; notes.push('Banker bet pushes on a tie'); } }
  if (b.bt && win === 'T') { back += b.bt * 9; notes.push(`Tie pays 8:1 (+${N(b.bt * 8)})`); }
  if (b.bpp && ppair) { back += b.bpp * 12; notes.push(`Player Pair pays 11:1 (+${N(b.bpp * 11)})`); }
  if (b.bbp && bpair) { back += b.bbp * 12; notes.push(`Banker Pair pays 11:1 (+${N(b.bbp * 11)})`); }
  return { P, K, p, k, win, ppair, bpair, back, notes };
}
let bcTimer = null;
function bcDeal() {
  const c = cs2State(), B = c.bac; if (B.round && B.round.phase !== 'done') return;
  const err = bcCanDeal(); if (err) { c.msg = err; renderMain(); return; }
  if (B.pos >= B.cut) bcShuffle(B);
  const b = { ...c.bets[c.cur] }, staked = bcStake(b); csPay(c.cur, -staked);
  B.round = { cur: c.cur, ...bcPlay(B, b), bets: b, staked, shown: 0, phase: 'deal' };
  const P = B.round.P, K = B.round.K;

  csSeen = new Set(); c.msg = '';
  // Reveal the cards one by one (P, B, P, B, then any third cards), then settle.
  const order = [['P', 0], ['K', 0], ['P', 1], ['K', 1]].concat(P[2] != null ? [['P', 2]] : [], K[2] != null ? [['K', 2]] : []);
  B.round.order = order; renderMain();
  clearInterval(bcTimer);
  bcTimer = setInterval(() => {
    const r = B.round; if (!r || tab !== 'casino') { if (r) { r.shown = r.order.length; bcSettle(); } clearInterval(bcTimer); bcTimer = null; return; }
    r.shown++; if (r.shown >= r.order.length) { clearInterval(bcTimer); bcTimer = null; bcSettle(); }
    renderTop(); renderMain(); if (r.phase === 'done') csBigWinStart();
  }, account.settings.reduced ? 60 : 520);
}
function bcSettle() {
  const c = ch.casino, B = c.bac, r = B.round; if (!r || r.phase === 'done') return;
  csPay(r.cur, r.back); r.net = cs2Record('bac', r.cur, r.staked, r.back); r.phase = 'done';
  B.road.push(r.win + (r.ppair ? 'p' : '') + (r.bpair ? 'b' : '')); if (B.road.length > BC.road) B.road.shift();
  csCheckBigWin({ bet: r.staked, pp: 0, t3: 0, back: r.back, net: r.net, cur: r.cur });
  const cn = r.cur === 'th' ? 'Thousandium' : 'gold', who = { P: 'Player', B: 'Banker', T: 'Tie' }[r.win];
  addLog(r.net > 0 ? 'lucky' : 'sys', `Baccarat: ${who} ${r.p}–${r.k}. ${r.net > 0 ? `Won ${N(r.net)}` : r.net < 0 ? `Lost ${N(-r.net)}` : 'Push'} ${cn}.`);
  save();
}
function bcTableHtml() {
  const c = cs2State(), B = c.bac, r = B.round, live = r && r.phase !== 'done';
  const seen = (side, i) => r && r.order.slice(0, r.shown).some(([s, j]) => s === side && j === i);
  const hand = (side, cards, lbl) => {
    const vis = r ? cards.map((x, i) => seen(side, i) ? x : null).filter(x => x != null) : [];
    const tot = vis.length ? bcTot(vis) : '';
    const won = r && r.phase === 'done' && ((side === 'P' && r.win === 'P') || (side === 'K' && r.win === 'B'));
    return `<div class="bchand ${won ? 'won' : ''} ${side === 'P' ? 'p' : 'b'}"><div class="bclbl">${lbl}</div><div class="cscards">${r ? cards.map((x, i) => seen(side, i) ? csCard(x, `${side}${i}`) : '').join('') : '<div class="cscard ghost"></div><div class="cscard ghost"></div>'}</div>${vis.length ? `<span class="csbub ${won ? 'bj' : ''}">${tot}</span>` : ''}</div>`;
  };
  const b = r ? r.bets : c.bets[c.cur];
  const spot = ([k, n, pay]) => { const hit = r && r.phase === 'done' && ((k === 'bp' && r.win === 'P') || (k === 'bb' && r.win === 'B') || (k === 'bt' && r.win === 'T') || (k === 'bpp' && r.ppair) || (k === 'bbp' && r.bpair));
    return `<div class="bcspot ${k} ${hit ? 'hit' : ''}"><span class="csstack">${b[k] ? N(b[k]) : ''}</span><span class="lbl">${n.toUpperCase()}</span><span class="pay">${pay}</span></div>`; };
  const keys = 'bp,bb,bt,bpp,bbp', err = live ? '' : bcCanDeal();
  const panel = `<div class="cspanel card">
    ${cs2BetBox('bp', 'Player', keys, live)}${cs2BetBox('bb', 'Banker', keys, live)}${cs2BetBox('bt', 'Tie', keys, live)}
    <details ${b.bpp || b.bbp ? 'open' : ''} id="bcside"><summary class="mute" style="font-size:14px">Pair side bets</summary>${cs2BetBox('bpp', 'Player Pair', keys, live)}${cs2BetBox('bbp', 'Banker Pair', keys, live)}</details>
    <div class="spread mute" style="font-size:13px;margin:6px 0 10px"><span>Total bet</span><b class="num" id="bctotal" style="color:var(--ink)">${N(bcStake(c.bets[c.cur]))}</b></div>
    <button class="pri csbig" data-act="bcdeal" id="bcdealbtn" ${live || err ? 'disabled' : ''}>${r && !live ? 'Deal again' : 'Deal'} <kbd>Space</kbd></button>
    <p class="mute" id="bcmsg" style="font-size:13px;margin:6px 0 0;min-height:18px">${esc(live ? 'Dealing…' : (c.msg || err || 'No table limit: bet up to what you hold.'))}</p>
    <p class="mute" style="font-size:12px;margin:10px 0 0">Type amounts like 2500, 25k or 1.5m.</p></div>`;
  const result = r && r.phase === 'done' ? `<div class="csbanner ${r.net > 0 ? 'win' : r.net < 0 ? 'lose' : 'push'}">${{ P: 'Player wins', B: 'Banker wins', T: 'Tie' }[r.win]} ${r.p}–${r.k} · ${r.net > 0 ? `you won ${N(r.net)}` : r.net < 0 ? `you lost ${N(-r.net)}` : 'your bets are returned'}</div>` : '';
  const road = B.road.length ? `<div class="bcroad" title="Last ${B.road.length} results, oldest first">${B.road.map(x => `<i class="${x[0]}" title="${{ P: 'Player', B: 'Banker', T: 'Tie' }[x[0]]}${x.includes('p') ? ' · Player pair' : ''}${x.includes('b') ? ' · Banker pair' : ''}">${x[0]}${x.length > 1 ? '<s></s>' : ''}</i>`).join('')}</div>` : '<p class="mute" style="font-size:13px;margin:0">Results show up here, oldest first.</p>';
  const left = B.shoe.length - B.pos, cnt = B.road.reduce((o, x) => (o[x[0]]++, o), { P: 0, B: 0, T: 0 });
  return `<div class="cswrap">${panel}<div class="cstable bctable">
      <div class="csshoe" title="${left} cards left in the shoe"><span>${left}</span></div>
      <div class="bchands">${hand('P', r ? r.P : [], 'PLAYER')}${hand('K', r ? r.K : [], 'BANKER')}</div>
      <div class="csfelt"><span>BACCARAT · 2 DECKS</span><span class="mute">Banker pays 0.95 to 1 · Tie pays 8 to 1 · Pairs pay 11 to 1</span></div>
      ${result}<div class="bcspots">${BC.spots.map(spot).join('')}</div>
      ${r && r.phase === 'done' && r.notes.length ? `<div class="csnotes">${r.notes.map(s => `<span class="chip ${/pays/.test(s) ? 'on' : ''}">${esc(s)}</span>`).join('')}</div>` : ''}
    </div></div>
    <div class="card" style="margin-top:10px"><div class="spread"><b>Bead road</b><span class="mute" style="font-size:13px">Player ${cnt.P} · Banker ${cnt.B} · Tie ${cnt.T}</span></div>${road}</div>
    <details class="card" style="margin-top:10px"><summary><b>How Baccarat works</b></summary><p class="mute" style="font-size:14px;margin:8px 0 0">Bet on the hand that ends closer to 9: Player or Banker, or a Tie. Cards count face value, Aces count 1, tens and pictures count 0, and only the last digit of the total counts (7 + 8 = 5). Both hands get two cards; an 8 or 9 is a natural and ends the round. Otherwise the Player draws a third card on 0–5, and the Banker draws by the standard table (it depends on the Player's third card). Player pays 1:1, Banker pays 0.95:1 (5% commission), Tie pays 8:1 and Player and Banker bets push on a Tie. Pair bets win if that hand's first two cards are the same rank. 2-deck shoe, reshuffled near the cut card.</p></details>
    ${csBigWinHtml(c)}`;
}

// ================= Prediction =================
// A random market: each round moves from 0% to a final change anywhere between −100% and +100%
// (every value equally likely), in PD.steps segments. Up bets get stake × (1 + change), Down bets
// get stake × (1 − change). Even game: no house edge.
function pdPath() {
  const end = Math.round((csRandF() * 2 - 1) * 1000) / 10, pts = [0];
  for (let i = 1; i < PD.steps; i++) {
    const lin = end * i / PD.steps, wig = (csRandF() * 2 - 1) * 28 * Math.sin(Math.PI * i / PD.steps);
    pts.push(Math.round(Math.max(-115, Math.min(115, lin + wig)) * 10) / 10);
  }
  pts.push(end); return pts;
}
function pdCanStart() {
  const c = cs2State(), v = c.bets[c.cur].pr;
  if (!v) return 'Type how much to put in.';
  if (v > csBal(c.cur)) return `You only have ${N(csBal(c.cur))} ${c.cur === 'th' ? 'Thousandium' : 'gold'}.`;
  return '';
}
let pdTimer = null;
function pdStart() {
  const c = cs2State(), P = c.pred; if (P.round && P.round.phase !== 'done') return;
  const err = pdCanStart(); if (err) { c.msg = err; renderMain(); return; }
  const stake = c.bets[c.cur].pr; csPay(c.cur, -stake);
  P.round = { cur: c.cur, side: P.side, stake, path: pdPath(), shown: 0, phase: 'run' }; c.msg = '';
  renderMain(); clearInterval(pdTimer);
  pdTimer = setInterval(() => {
    const r = P.round; if (!r || tab !== 'casino') { if (r) { r.shown = PD.steps; pdSettle(); } clearInterval(pdTimer); pdTimer = null; return; }
    r.shown++; if (r.shown >= PD.steps) { clearInterval(pdTimer); pdTimer = null; pdSettle(); }
    pdDraw();
  }, account.settings.reduced ? 40 : PD.stepMs);
}
function pdSettle() {
  const c = ch.casino, P = c.pred, r = P.round; if (!r || r.phase === 'done') return;
  const end = r.path[PD.steps], mult = r.side === 'up' ? 1 + end / 100 : 1 - end / 100;
  r.back = Math.floor(r.stake * mult); r.end = end; r.phase = 'done';
  csPay(r.cur, r.back); r.net = cs2Record('pred', r.cur, r.stake, r.back);
  P.recent.unshift({ end, path: r.path, side: r.side, net: r.net, cur: r.cur }); P.recent = P.recent.slice(0, PD.recent);
  const cn = r.cur === 'th' ? 'Thousandium' : 'gold';
  addLog(r.net > 0 ? 'lucky' : 'sys', `Prediction: market ${end >= 0 ? '+' : ''}${end}% (you picked ${r.side === 'up' ? 'Up' : 'Down'}). ${r.net > 0 ? `Won ${N(r.net)}` : r.net < 0 ? `Lost ${N(-r.net)}` : 'Even'} ${cn}.`);
  save(); renderTop(); renderMain();
}
// The chart: y from −100% to +100% (a little headroom), x = PD.steps segments.
function pdSvg(path, shown, w, h, mini) {
  const pad = mini ? 2 : 34, top = mini ? 2 : 14, bot = mini ? 2 : 22, W = w - pad - (mini ? 2 : 12), H = h - top - bot;
  const X = i => pad + W * i / PD.steps, Y = v => top + H / 2 - (Math.max(-115, Math.min(115, v)) / 120) * (H / 2);
  const pts = path ? path.slice(0, shown + 1) : [], last = pts[pts.length - 1] || 0, col = last >= 0 ? '#3fbf6f' : '#e8574a';
  const grid = mini ? `<line x1="${pad}" x2="${pad + W}" y1="${Y(0)}" y2="${Y(0)}" class="pdmid"/>` : [100, 50, 0, -50, -100].map(v => `<line x1="${pad}" x2="${pad + W}" y1="${Y(v)}" y2="${Y(v)}" class="${v === 0 ? 'pdmid' : 'pdgrid'}"/><text x="${pad - 6}" y="${Y(v) + 4}" class="pdax">${v > 0 ? '+' : ''}${v}%</text>`).join('');
  const line = pts.length > 1 ? `<polyline points="${pts.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')}" fill="none" stroke="${col}" stroke-width="${mini ? 2 : 3}" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const fill = pts.length > 1 && !mini ? `<polygon points="${X(0)},${Y(0)} ${pts.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')} ${X(pts.length - 1).toFixed(1)},${Y(0)}" fill="${col}" opacity=".12"/>` : '';
  const dot = pts.length && !mini ? `<circle cx="${X(pts.length - 1)}" cy="${Y(last)}" r="5" fill="${col}"/><text x="${Math.min(X(pts.length - 1) + 8, pad + W - 40)}" y="${Y(last) - 8}" class="pdnow" fill="${col}">${last >= 0 ? '+' : ''}${last}%</text>` : '';
  return `<svg viewBox="0 0 ${w} ${h}" class="${mini ? 'pdmini' : 'pdchart'}" role="img" aria-label="${mini ? 'Past round' : 'Market chart'}">${grid}${fill}${line}${dot}</svg>`;
}
function pdDraw() { const el = document.getElementById('pdchart'); const r = ch.casino.pred.round; if (el && r) el.innerHTML = pdSvg(r.path, r.shown, 380, 240); }
function pdTableHtml() {
  const c = cs2State(), P = c.pred, r = P.round, live = r && r.phase !== 'done', err = live ? '' : pdCanStart(), stake = c.bets[c.cur].pr;
  const side = live ? r.side : P.side;
  const panel = `<div class="cspanel card">
    <div class="pdsides"><button class="pdup ${side === 'up' ? 'on' : ''}" data-act="pdside" data-arg="up" ${live ? 'disabled' : ''}>▲ Up</button><button class="pddown ${side === 'down' ? 'on' : ''}" data-act="pdside" data-arg="down" ${live ? 'disabled' : ''}>▼ Down</button></div>
    ${cs2BetBox('pr', 'Amount', 'pr', live)}
    <div class="mute" style="font-size:13px;margin:4px 0 10px" id="pdrange">If the market ends +100% you get ${N(side === 'up' ? stake * 2 : 0)} back · at −100% you get ${N(side === 'up' ? 0 : stake * 2)}.</div>
    <button class="pri csbig" data-act="pdstart" id="pdstartbtn" ${live || err ? 'disabled' : ''}>${live ? 'Market moving…' : 'Start round'} <kbd>Space</kbd></button>
    <p class="mute" id="pdmsg" style="font-size:13px;margin:6px 0 0;min-height:18px">${esc(live ? '' : (c.msg || err || 'No limit: put in up to what you hold.'))}</p>
    <p class="mute" style="font-size:12px;margin:10px 0 0">Pick a direction. You win or lose by exactly how far the market moves: +37% on an Up pick pays back 1.37×, −85% leaves 15%.</p></div>`;
  const res = r && r.phase === 'done' ? `<div class="csbanner ${r.net > 0 ? 'win' : r.net < 0 ? 'lose' : 'push'}">Market ${r.end >= 0 ? '+' : ''}${r.end}% · you picked ${r.side === 'up' ? 'Up' : 'Down'} · ${r.net > 0 ? `you won ${N(r.net)}` : r.net < 0 ? `you lost ${N(-r.net)}` : 'even'}</div>` : '';
  const recent = P.recent.length ? `<div class="pdrecent">${P.recent.map((s, i) => `<div class="pdrec ${s.end >= 0 ? 'up' : 'down'}" title="${i === 0 ? 'Latest' : i + 1 + ' rounds ago'}">${pdSvg(s.path, PD.steps, 120, 54, true)}<b class="num">${s.end >= 0 ? '+' : ''}${s.end}%</b></div>`).join('')}</div>` : '<p class="mute" style="font-size:13px;margin:0">Your last 10 rounds show up here, newest first.</p>';
  const ups = P.recent.filter(s => s.end >= 0).length;
  return `<div class="cswrap">${panel}<div class="cstable pdtable"><div id="pdchart">${pdSvg(r ? r.path : null, r ? r.shown : 0, 380, 240)}</div>${res}</div></div>
    <div class="card" style="margin-top:10px"><div class="spread"><b>Recent sessions</b><span class="mute" style="font-size:13px">${P.recent.length ? `${ups} up · ${P.recent.length - ups} down` : ''}</span></div>${recent}</div>
    <p class="mute" style="font-size:13px;margin:10px 0 0">The market is simulated and 100% random: every round ends anywhere from −100% to +100%, each value equally likely, whatever happened before. Past rounds don't predict the next one.</p>`;
}

// ---------- Input, keys, handlers ----------
document.addEventListener('input', e => {
  const el = e.target; if (!el.classList || !el.classList.contains('cs2in') || typeof ch === 'undefined' || !ch) return;
  const c = cs2State(); cs2Refresh();
});
function cs2Refresh() {
  const c = cs2State(), b = c.bets[c.cur];
  if (c.view === 'bac') { const t = document.getElementById('bctotal'); if (t) t.textContent = N(bcStake(b)); const err = bcCanDeal(), d = document.getElementById('bcdealbtn'); if (d) d.disabled = !!err; const m = document.getElementById('bcmsg'); if (m) m.textContent = err || 'No table limit: bet up to what you hold.'; }
  if (c.view === 'pred') { const err = pdCanStart(), d = document.getElementById('pdstartbtn'); if (d) d.disabled = !!err; const m = document.getElementById('pdmsg'); if (m) m.textContent = err || 'No limit: put in up to what you hold.';
    const rg = document.getElementById('pdrange'), up = c.pred.side === 'up'; if (rg) rg.textContent = (langNow() === "vi" ? trVI : x => x)(`If the market ends +100% you get ${N(up ? b.pr * 2 : 0)} back · at −100% you get ${N(up ? 0 : b.pr * 2)}.`); }
}
document.addEventListener('keydown', e => {
  if (typeof tab === 'undefined' || tab !== 'casino' || !ch || !ch.casino || e.ctrlKey || e.metaKey || e.altKey || document.getElementById('modal')) return;
  const c = ch.casino; if (c.bigWin) return;
  const inInput = e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  if (c.view === 'bac' && (e.key === ' ' && !inInput || e.key === 'Enter' && inInput)) { e.preventDefault(); bcDeal(); }
  if (c.view === 'pred') {
    if (e.key === ' ' && !inInput || e.key === 'Enter' && inInput) { e.preventDefault(); pdStart(); }
    else if (!inInput && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && !(c.pred.round && c.pred.round.phase !== 'done')) { e.preventDefault(); c.pred.side = e.key === 'ArrowUp' ? 'up' : 'down'; renderMain(); }
  }
});
const CASINO2_HANDLERS = {
  bcdeal: () => bcDeal(),
  pdstart: () => pdStart(),
  pdside: s => { const c = cs2State(); if (c.pred.round && c.pred.round.phase !== 'done') return; c.pred.side = s === 'down' ? 'down' : 'up'; renderMain(); },
  cs2betop: a => {
    const [k, op, keys] = a.split('|'), c = cs2State(), b = c.bets[c.cur];
    if (op === 'half') b[k] = Math.floor(b[k] / 2); else if (op === 'dbl') b[k] = Math.max(1, b[k]) * 2;
    else { const other = keys.split(',').filter(x => x !== k).reduce((t, x) => t + (b[x] || 0), 0); b[k] = Math.max(0, Math.floor(csBal(c.cur) - other)); }
    const el = document.getElementById('csin-' + k); if (el) el.value = b[k] || ''; const v = document.getElementById('csv-' + k); if (v) v.textContent = b[k] ? N(b[k]) : ''; c.msg = ''; cs2Refresh();
  },
  csstatgame: g => { csState().statGame = g; renderMain(); },
};
