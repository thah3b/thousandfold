// ============================================================
// AUCTION HOUSE (Phase 11): listings, buy orders, price history.
// Every trade settles on the server; goods and gold arrive by Mailbox.
// ============================================================
let ah = { browse: null, loading: false, sel: null, item: null, itemFor: null, mine: null, q: '', err: '', at: 0, busy: false };
const AH_TAX = 0.05;
const ahName = k => { try { return ITEM(k).name; } catch (e) { return k; } };
const ahKnown = k => { try { return acceptItem(k); } catch (e) { return false; } };

async function ahLoad(force) {
  if (ah.loading || (!force && ah.browse && Date.now() - ah.at < 30000)) return;
  ah.loading = true; ah.err = '';
  try {
    const [b, m] = await Promise.all([rpc('tf_ah_browse'), rpc('tf_ah_mine')]);
    ah.browse = (b || []).filter(r => ahKnown(r.item)); ah.mine = m || { listings: [], orders: [] }; ah.at = Date.now();
    if (ah.sel) await ahLoadItem(ah.sel);
  } catch (e) { ah.err = e.message || String(e); ah.browse = ah.browse || []; }
  ah.loading = false; if (screen === 'game' && tab === 'auction') renderMain();
}
async function ahLoadItem(k) {
  try { ah.item = await rpc('tf_ah_item', { p_item: k }); ah.itemFor = k; } catch (e) { ah.err = e.message || String(e); }
}

// A small price chart: daily average with the day's low–high range, and volume bars.
function ahChart(hist) {
  if (!hist || !hist.length) return '<p class="mute" style="font-size:14px;margin:6px 0">No sales in the last 14 days yet.</p>';
  const W = 520, H = 150, P = 30, n = hist.length, hi = Math.max(...hist.map(h => +h.high)), lo = Math.min(...hist.map(h => +h.low)), vmax = Math.max(...hist.map(h => +h.vol));
  const x = i => P + (n === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (n - 1)), y = v => hi === lo ? H / 2 : 12 + (H - 44) * (1 - (v - lo) / (hi - lo));
  const band = hist.map((h, i) => `${x(i)},${y(+h.high)}`).join(' ') + ' ' + hist.map((h, i) => `${x(i)},${y(+h.low)}`).reverse().join(' ');
  const line = hist.map((h, i) => `${x(i)},${y(+h.avg)}`).join(' ');
  const bars = hist.map((h, i) => `<rect x="${x(i) - 5}" y="${H - 22 - 18 * (+h.vol / vmax)}" width="10" height="${18 * (+h.vol / vmax)}" fill="var(--line)"><title>${N(+h.vol)} sold</title></rect>`).join('');
  const pts = hist.map((h, i) => `<circle cx="${x(i)}" cy="${y(+h.avg)}" r="3" fill="var(--gold)"><title>${new Date(h.day).toLocaleDateString()}: avg ${N(+h.avg)}g (${N(+h.low)}–${N(+h.high)}), ${N(+h.vol)} sold</title></circle>`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;max-width:${W}px;height:auto" role="img" aria-label="Price history">
    <polygon points="${band}" fill="var(--gold)" opacity=".14"/>${bars}<polyline points="${line}" fill="none" stroke="var(--gold)" stroke-width="2"/>${pts}
    <text x="4" y="${y(hi) + 4}" font-size="11" fill="var(--mute)">${N(hi)}</text><text x="4" y="${y(lo) + 4}" font-size="11" fill="var(--mute)">${N(lo)}</text>
    <text x="${P}" y="${H - 4}" font-size="11" fill="var(--mute)">${new Date(hist[0].day).toLocaleDateString([], { month: 'short', day: 'numeric' })}</text>
    <text x="${W - P}" y="${H - 4}" font-size="11" fill="var(--mute)" text-anchor="end">${new Date(hist[n - 1].day).toLocaleDateString([], { month: 'short', day: 'numeric' })}</text></svg>`;
}

function tabAuction() {
  const g = socGate(); if (g) return `<h2>Auction House</h2>${g}`;
  if (!ah.browse && !ah.loading) ahLoad(true);
  const q = ah.q.trim().toLowerCase();
  let rows = (ah.browse || []).slice();
  if (q) {
    rows = rows.filter(r => ahName(r.item).toLowerCase().includes(q));
    const listed = new Set(rows.map(r => r.item));
    const extra = [...new Set([...Object.keys(ch.inv), ...RES.map(r => r.id), ...Object.keys(ITEMS)])].filter(k => !listed.has(k) && ahKnown(k) && ahName(k).toLowerCase().includes(q)).slice(0, 12);
    rows = rows.concat(extra.map(k => ({ item: k, empty: true })));
  }
  rows.sort((a, b) => (a.empty - b.empty) || ahName(a.item).localeCompare(ahName(b.item)));
  const bag = Object.keys(ch.inv).filter(k => ch.inv[k] > 0 && giftable(k)).sort((a, b) => ahName(a).localeCompare(ahName(b)));
  const list = !ah.browse ? '<p class="mute">Loading the market…</p>' : !rows.length ? `<p class="mute">${q ? 'Nothing matches.' : 'The market is empty. Be the first to list something!'}</p>`
    : `<div class="ahgrid"><div class="ahhead"><span>Item</span><span class="num">Lowest</span><span class="num hide-s">For sale</span><span class="num">Best bid</span><span class="num hide-s">Last sale</span></div>${rows.slice(0, 120).map(r => `<button class="ahrow ${ah.sel === r.item ? 'on' : ''}" data-act="ahsel" data-arg="${esc(r.item)}"><span class="ahname">${itemIcon(r.item, 20)} ${rname(r.item)}${ch.inv[r.item] ? ` <span class="mute" style="font-size:12px">(you have ${N(ch.inv[r.item])})</span>` : ''}</span><span class="num gold">${r.low ? N(+r.low) + 'g' : '–'}</span><span class="num hide-s">${+r.avail ? N(+r.avail) : '–'}</span><span class="num">${r.bid ? N(+r.bid) + 'g' : '–'}</span><span class="num hide-s mute">${r.last ? N(+r.last) + 'g' : '–'}</span></button>`).join('')}</div>`;
  const mine = ah.mine && (ah.mine.listings.length || ah.mine.orders.length) ? `<div class="card" style="margin-top:12px"><h3>Your listings and orders</h3><div class="grid" style="gap:6px;margin-top:8px">
      ${ah.mine.listings.map(l => `<div class="prow"><span>Selling ${N(+l.qty)} ${rname(l.item)} at <b class="gold">${N(+l.price)}g</b> <span class="mute" style="font-size:12px">ends ${ahEnds(l.ends)}</span></span><button class="sm ghost" data-act="ahcancell" data-arg="${l.id}">Cancel</button></div>`).join('')}
      ${ah.mine.orders.map(o => `<div class="prow"><span>Buying ${N(+o.qty)} ${rname(o.item)} at <b class="gold">${N(+o.price)}g</b> <span class="mute" style="font-size:12px">ends ${ahEnds(o.ends)}</span></span><button class="sm ghost" data-act="ahcancelo" data-arg="${o.id}">Cancel</button></div>`).join('')}</div>
      <p class="mute" style="font-size:12px;margin:8px 0 0">Cancelled or expired listings and orders return what's left through your Mailbox.</p></div>` : '';
  return `<div class="spread"><h2>Auction House</h2><span class="row" style="gap:6px"><span class="mute num" style="font-size:14px">Gold <b class="gold" data-live="gold"></b></span><button class="sm" data-act="ahrefresh" ${ah.loading ? 'disabled' : ''}>${ah.loading ? 'Loading…' : 'Refresh'}</button></span></div>
    <p class="mute" style="margin:4px 0 10px">Buy from other players, list your own items, or post a buy order. Purchases and sale proceeds arrive in your <button class="linkbtn" data-act="tab" data-arg="mail">Mailbox</button>. The Auction House keeps ${AH_TAX * 100}% of each sale. Listings and orders last 2 days.</p>
    ${ah.err ? `<p class="bad" style="font-size:14px">${esc(ah.err)}</p>` : ''}
    <div class="row" style="gap:6px;margin-bottom:10px"><input id="ahq" value="${esc(ah.q)}" placeholder="Search any item…" autocomplete="off" aria-label="Search items" style="flex:1;min-width:160px">
      <select id="ahbag" aria-label="Sell from your bag" style="max-width:260px"><option value="">Sell from your bag…</option>${bag.map(k => `<option value="${esc(k)}">${esc(ahName(k))} (${N(ch.inv[k])})</option>`).join('')}</select></div>
    ${ah.sel ? ahItemPanel(ah.sel) : ''}
    ${list}${mine}`;
}
const ahEnds = t => { const s = (Date.parse(t) - Date.now()) / 1000; return s <= 0 ? 'soon' : 'in ' + fmtTime(s); };

function ahItemPanel(k) {
  const it = ITEM(k), d = ah.itemFor === k ? ah.item : null, have = ch.inv[k] || 0;
  if (!d) { if (ah.itemFor !== k) ahLoadItem(k).then(() => tab === 'auction' && renderMain()); return `<div class="card ahpanel"><h3>${rname(k)}</h3><p class="mute">Loading…</p></div>`; }
  const ls = d.listings, os = d.orders, low = ls.filter(l => !l.mine)[0], bid = os.filter(o => !o.mine)[0], last = d.recent[0];
  const suggest = low ? Math.max(1, +low.price - 1) : ls.length ? +ls[0].price : last ? +last.price : Math.max(1, Math.ceil((it.value || 1) * 1.2));
  const shop = it.value ? Math.floor(sellPrice(k)) : 0;
  return `<div class="card ahpanel"><div class="spread"><h3>${itemIcon(k, 24)} ${rname(k)}</h3><span class="row" style="gap:6px"><span class="mute" style="font-size:13px">You have ${N(have)}${shop ? ` · shop pays about ${N(shop)}g each` : ''}</span><button class="sm ghost" data-act="ahclose">Close</button></span></div>
    ${it.desc ? `<p class="mute" style="font-size:13px;margin:2px 0 8px">${esc(it.desc)}</p>` : ''}
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));align-items:start;gap:14px">
      <div><h4 class="shopgrp">Price history (14 days)</h4>${ahChart(d.history)}
        ${d.recent.length ? `<div class="mute" style="font-size:12px;margin-top:6px">Recent: ${d.recent.slice(0, 6).map(r => `${N(+r.qty)} @ ${N(+r.price)}g`).join(' · ')}</div>` : ''}</div>
      <div><h4 class="shopgrp">For sale</h4>${ls.length ? `<div class="grid" style="gap:3px">${ls.slice(0, 8).map(l => `<div class="prow" style="padding:4px 8px"><span>${N(+l.qty)} × <b class="gold">${N(+l.price)}g</b>${l.mine ? ' <span class="chip" style="font-size:11px">yours</span>' : ''}</span>${l.mine ? `<button class="sm ghost" data-act="ahcancell" data-arg="${l.id}">Cancel</button>` : ''}</div>`).join('')}</div>` : '<p class="mute" style="font-size:14px;margin:4px 0">No one is selling this right now.</p>'}
        ${low ? `<div class="row" style="gap:6px;margin-top:8px;align-items:center"><label class="mute" style="font-size:13px" for="ahbq">Buy</label><input id="ahbq" type="number" min="1" step="1" value="1" style="width:6em"><label class="mute" style="font-size:13px" for="ahbm">up to</label><input id="ahbm" type="number" min="1" step="1" value="${+low.price}" style="width:7em"><span class="mute" style="font-size:13px">g each</span><button class="sm pri" data-act="ahbuy">Buy</button></div><div class="mute" id="ahbuycost" style="font-size:12px;margin-top:4px">${ahCostText(ls, 1, +low.price)}</div>` : ''}
        <h4 class="shopgrp" style="margin-top:12px">Wanted (buy orders)</h4>${os.length ? `<div class="grid" style="gap:3px">${os.slice(0, 8).map(o => `<div class="prow" style="padding:4px 8px"><span>${N(+o.qty)} × <b class="gold">${N(+o.price)}g</b>${o.mine ? ' <span class="chip" style="font-size:11px">yours</span>' : ''}</span>${o.mine ? `<button class="sm ghost" data-act="ahcancelo" data-arg="${o.id}">Cancel</button>` : have ? `<button class="sm" data-act="ahfill" data-arg="${o.id}|${Math.min(have, +o.qty)}">Sell ${N(Math.min(have, +o.qty))} for ${N(Math.floor(Math.min(have, +o.qty) * +o.price * (1 - AH_TAX)))}g</button>` : ''}</div>`).join('')}</div>` : '<p class="mute" style="font-size:14px;margin:4px 0">No buy orders yet.</p>'}</div>
    </div>
    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:14px;margin-top:12px">
      <div class="ahbox"><b>Sell</b>${have ? `<div class="row" style="gap:6px;margin-top:6px;align-items:center"><input id="ahsq" type="number" min="1" max="${have}" step="1" value="${have}" style="width:7em" aria-label="Quantity"><span class="mute" style="font-size:13px">at</span><input id="ahsp" type="number" min="1" step="1" value="${suggest}" style="width:8em" aria-label="Price each"><span class="mute" style="font-size:13px">g each</span><button class="sm pri" data-act="ahlist">List</button></div><div class="mute" id="ahsellnet" style="font-size:12px;margin-top:4px">${ahNetText(have, suggest)}</div>${bid && +bid.price >= suggest ? `<p class="verd" style="font-size:12px;margin:4px 0 0">Someone is already buying at ${N(+bid.price)}g: use Sell on their order above for an instant sale.</p>` : ''}` : '<p class="mute" style="font-size:13px;margin:4px 0 0">You don’t have any to sell.</p>'}</div>
      <div class="ahbox"><b>Post a buy order</b><div class="row" style="gap:6px;margin-top:6px;align-items:center"><input id="ahoq" type="number" min="1" step="1" value="10" style="width:7em" aria-label="Quantity"><span class="mute" style="font-size:13px">at</span><input id="ahop" type="number" min="1" step="1" value="${ahBidDefault(os, bid, suggest)}" style="width:8em" aria-label="Price each"><span class="mute" style="font-size:13px">g each</span><button class="sm" data-act="ahorder">Post</button></div><div class="mute" id="ahordertot" style="font-size:12px;margin-top:4px">${ahOrderText(10, ahBidDefault(os, bid, suggest))}</div></div>
    </div><div class="err" id="aherr"></div></div>`;
}
const ahBidDefault = (os, bid, suggest) => bid ? +bid.price + 1 : os.length ? +os[0].price : Math.max(1, Math.floor(suggest * 0.9));
function ahCostText(ls, qty, max) {
  let want = qty, cost = 0, got = 0;
  for (const l of ls) { if (l.mine || +l.price > max || want <= 0) continue; const q = Math.min(want, +l.qty); cost += q * +l.price; got += q; want -= q; }
  return got ? `${N(got)} available at that price for ${N(cost)}g total${got < qty ? ` (only ${N(got)} of ${N(qty)})` : ''}.` : 'Nothing for sale at that price.';
}
const ahNetText = (q, p) => `Total ${N(q * p)}g. After the ${AH_TAX * 100}% fee you get ${N(Math.floor(q * p * (1 - AH_TAX)))}g when it sells. The items leave your bag now.`;
const ahOrderText = (q, p) => `Sets aside ${N(q * p)}g now (you have ${N(ch.gold)}g). Unused gold comes back if you cancel or it expires.`;
const ahNum = id => Math.floor(+((document.getElementById(id) || {}).value) || 0);

const AUCTION_HANDLERS = {
  ahrefresh: () => { ah.at = 0; ahLoad(true); },
  ahsel: k => { ah.sel = k; ah.itemFor = null; renderMain(); const p = document.querySelector('.ahpanel'); if (p) p.scrollIntoView({ block: 'nearest' }); },
  ahclose: () => { ah.sel = null; renderMain(); },
  ahbuy: async () => {
    const k = ah.sel, qty = ahNum('ahbq'), max = ahNum('ahbm'); if (qty < 1 || max < 1) return;
    const est = ah.item.listings.filter(l => !l.mine && +l.price <= max).reduce((a, l) => { const q = Math.min(qty - a.q, +l.qty); return q > 0 ? { q: a.q + q, c: a.c + q * +l.price } : a; }, { q: 0, c: 0 });
    if (est.c > ch.gold) { socErr('aherr', `That costs up to ${N(est.c)}g and you have ${N(ch.gold)}g.`); return; }
    try { const r = await rpc('tf_ah_buy', { p_item: k, p_qty: qty, p_max: max }); ch.gold -= +r.spent; save(); addLog('sys', `Bought ${N(+r.bought)} ${ahName(k)} for ${N(+r.spent)}g at the Auction House.`); toast(`Bought ${N(+r.bought)} ${esc(ahName(k))}. Collect them in your Mailbox.`, 'verd'); soc.mailList = null; await ahLoad(true); socRefresh(); }
    catch (e) { socErr('aherr', e); }
  },
  ahlist: async () => {
    const k = ah.sel, qty = ahNum('ahsq'), price = ahNum('ahsp');
    if (qty < 1 || price < 1) { socErr('aherr', 'Enter a quantity and a price.'); return; }
    if ((ch.inv[k] || 0) < qty) { socErr('aherr', `You only have ${N(ch.inv[k] || 0)}.`); return; }
    try { await rpc('tf_ah_list', { p_item: k, p_qty: qty, p_price: price }); takeItem(k, qty); save(); addLog('sys', `Listed ${N(qty)} ${ahName(k)} at ${N(price)}g each.`); toast('Listed on the Auction House.', 'verd'); await ahLoad(true); }
    catch (e) { socErr('aherr', e); }
  },
  ahorder: async () => {
    const k = ah.sel, qty = ahNum('ahoq'), price = ahNum('ahop');
    if (qty < 1 || price < 1) { socErr('aherr', 'Enter a quantity and a price.'); return; }
    if (qty * price > ch.gold) { socErr('aherr', `That needs ${N(qty * price)}g set aside and you have ${N(ch.gold)}g.`); return; }
    try { await rpc('tf_ah_order', { p_item: k, p_qty: qty, p_price: price }); ch.gold -= qty * price; save(); addLog('sys', `Posted a buy order for ${N(qty)} ${ahName(k)} at ${N(price)}g each.`); toast('Buy order posted.', 'verd'); await ahLoad(true); }
    catch (e) { socErr('aherr', e); }
  },
  ahfill: async a => {
    const [id, q] = a.split('|'), qty = +q, k = ah.sel;
    if ((ch.inv[k] || 0) < qty) { socErr('aherr', `You only have ${N(ch.inv[k] || 0)}.`); return; }
    try { const r = await rpc('tf_ah_fill', { p_order: +id, p_qty: qty }); takeItem(k, +r.sold); save(); addLog('sys', `Sold ${N(+r.sold)} ${ahName(k)} to a buy order for ${N(+r.net)}g.`); toast(`Sold! ${N(+r.net)}g is waiting in your Mailbox.`, 'verd'); soc.mailList = null; await ahLoad(true); socRefresh(); }
    catch (e) { socErr('aherr', e); }
  },
  ahcancell: async id => { try { await rpc('tf_ah_cancel_listing', { p_id: +id }); toast('Listing cancelled. Your items are in your Mailbox.'); soc.mailList = null; await ahLoad(true); socRefresh(); } catch (e) { toast(esc(e.message)); } },
  ahcancelo: async id => { try { await rpc('tf_ah_cancel_order', { p_id: +id }); toast('Buy order cancelled. Your gold is in your Mailbox.'); soc.mailList = null; await ahLoad(true); socRefresh(); } catch (e) { toast(esc(e.message)); } },
  ahopen: k => { ah.sel = k; ah.itemFor = null; ah.q = ''; HANDLERS.tab('auction'); },
  mailall: async () => {
    const list = (soc.mailList || []).filter(m => !m.claimed && (+m.gold > 0 || Object.keys(m.items || {}).length));
    let gold = 0, n = 0;
    for (const m of list) { try { const r = await rpc('tf_mail_claim', { p_id: m.id }); gold += +r.gold || 0; giveOffer(r, 'the mailbox'); n++; } catch (e) { } }
    toast(n ? `Collected ${n} letter${n > 1 ? 's' : ''}${gold ? `, including ${N(gold)}g` : ''}.` : 'Nothing to collect.', 'verd');
    soc.mailList = null; await socRefresh(); renderMain();
  },
};
document.addEventListener('input', e => {
  const t = e.target; if (!t || tab !== 'auction') return;
  if (t.id === 'ahq') { ah.q = t.value; clearTimeout(ah.qt); ah.qt = setTimeout(() => { const pos = t.selectionStart; renderMain(); const n = $('#ahq'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }, 250); }
  if ((t.id === 'ahbq' || t.id === 'ahbm') && ah.item) { const el = $('#ahbuycost'); if (el) el.textContent = ahCostText(ah.item.listings, ahNum('ahbq'), ahNum('ahbm')); }
  if (t.id === 'ahsq' || t.id === 'ahsp') { const el = $('#ahsellnet'); if (el) el.textContent = ahNetText(ahNum('ahsq'), ahNum('ahsp')); }
  if (t.id === 'ahoq' || t.id === 'ahop') { const el = $('#ahordertot'); if (el) el.textContent = ahOrderText(ahNum('ahoq'), ahNum('ahop')); }
});
document.addEventListener('change', e => { const t = e.target; if (t && t.id === 'ahbag' && t.value) AUCTION_HANDLERS.ahsel(t.value); });
