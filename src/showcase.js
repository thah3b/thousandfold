// ============================================================
// v2.3 — Profile showcase: styled titles, backgrounds, frames.
// Title text is always an earned title. Styles are earned or bought
// with Thousandium (account-wide); backgrounds and frames are earned.
// The chosen title + style shows on the profile, in chat, on the
// leaderboards and in the sidebar.
// ============================================================
const sxAcc = () => { account.mg = account.mg || {}; return account; };
const sxPvp = () => account.pvpBest || 0; // 0 Bronze … 2 Gold … 4 Diamond … 5 Champion
const sxDg = (c, diff) => Object.values(c.dgClear || {}).filter(v => v >= diff).length;
const TITLE_STYLES = [
  { id: 'gold', name: 'Classic Gold', pal: ['#e8c15a', '#f6dc8a', '#e8c15a'], free: true },
  { id: 'silver', name: 'Moonsilver', pal: ['#f4f4f6', '#b9c0cc', '#8c95a3', '#b9c0cc'], free: true },
  { id: 'candy', name: 'Candy Floss', pal: ['#ffb3d9', '#e6b8ff', '#b3dcff', '#e6b8ff'], price: 15 },
  { id: 'melon', name: 'Watermelon Heaven', words: [['#c4f27a', '#6cc24a', '#2e8b3a', '#6cc24a'], ['#ff8796', '#ff3b55', '#d81b3c', '#ff3b55']], price: 20 },
  { id: 'heat', name: 'Heatwave', pal: ['#ff2e2e', '#ff8a1f', '#ffd42e', '#ff8a1f'], price: 25, earn: [c => c.level >= 60 || (c.ascension || 0) > 0, 'Reach level 60'] },
  { id: 'xmas', name: 'Christmas Spirit', words: [['#ff4a4a', '#d61f1f', '#ff7b7b'], ['#52dd6c', '#1fa53a', '#8be89a']], price: 25, earn: [c => (c.counters.eventsJoined || 0) >= 3, 'Take part in 3 world events'] },
  { id: 'reaper', name: 'Reaper', pal: ['#3d3d48', '#70707c', '#b8b8c4', '#70707c'], price: 30, earn: [c => (c.counters.kills || 0) >= 10000, 'Win 10,000 fights'] },
  { id: 'eighties', name: "80's Riff", pal: ['#ff4fd8', '#c04dff', '#6a5cff', '#3ec6ff', '#6a5cff', '#c04dff'], price: 30, earn: [() => ((account.mg || {}).rw || {}).best >= 7, 'Reach a 7-day Runeword streak'] },
  { id: 'artist', name: "Artist's Talent", pal: ['#ff4d4d', '#ff9f40', '#ffe14d', '#5ee65e', '#4de0ff', '#4d7bff', '#b04dff'], price: 40, earn: [c => (c.counters.fashions || 0) >= 30, 'Own 30 Wardrobe pieces'] },
  { id: 'rainbow', name: 'Rainbow God', pal: ['#3ee0ff', '#4d6bff', '#9a4dff', '#ff4dd8', '#9a4dff', '#4d6bff'], price: 80, earn: [() => sxPvp() >= 4, 'Reach Diamond in the Arena'] },
];
const STYLE_BY = Object.fromEntries(TITLE_STYLES.map(s => [s.id, s]));
const PROFILE_BGS = [
  { id: 'plain', name: 'Plain', free: true },
  { id: 'volcano', name: 'Volcano', earn: [c => (c.counters.bossKinds || 0) >= 3, 'Defeat 3 different region bosses'] },
  { id: 'stars', name: 'Constellations', earn: [() => sxPvp() >= 2, 'Reach Gold in the Arena'] },
  { id: 'ruins', name: 'Ruins', earn: [c => (c.counters.dungeons || 0) >= 1, 'Clear a dungeon'] },
  { id: 'pirate', name: 'Pirate map', earn: [c => (c.counters.digs || 0) >= 1, 'Dig up a treasure map'] },
  { id: 'frost', name: 'Frost kingdom', earn: [c => ((c.dgClear || {}).frost ?? -1) >= 0, 'Clear the Hall of the Frozen Jarl'] },
  { id: 'void', name: 'Void', earn: [c => sxDg(c, 2) >= 1, 'Clear a Mythic dungeon'] },
];
const PROFILE_FRAMES = [
  { id: 'none', name: 'No frame', free: true },
  { id: 'adventurer', name: 'Adventurer', color: '#4fc35a', earn: [c => !!(c.quest && c.quest.done), 'Finish the tutorial'] },
  { id: 'mythic', name: 'Mythic', color: '#4d9bff', earn: [c => sxDg(c, 2) >= 1, 'Clear a Mythic dungeon'] },
  { id: 'gladiator', name: 'PvP Gladiator', color: '#a65cff', earn: [() => sxPvp() >= 2, 'Reach Gold in the Arena'] },
  { id: 'founder', name: "Founder's", color: '#ff8a2a', earn: [() => !!account.founder, 'Played before Thousandfold 2.0'] },
];
const BG_BY = Object.fromEntries(PROFILE_BGS.map(b => [b.id, b])), FRAME_BY = Object.fromEntries(PROFILE_FRAMES.map(f => [f.id, f]));
const sxEarned = (o, c) => !!(o.earn && c && (() => { try { return o.earn[0](c); } catch (e) { return false; } })());
const styleOwned = (id, c) => { const s = STYLE_BY[id]; return !!s && (s.free || !!(account.styles || {})[id] || sxEarned(s, c)); };
const bgOwned = (id, c) => { const b = BG_BY[id]; return !!b && (b.free || sxEarned(b, c)); };
const frameOwned = (id, c) => { const f = FRAME_BY[id]; return !!f && (f.free || sxEarned(f, c)); };
function titleChoices(c) {
  const s = new Set(c.titlesSeen || []); if (c.displayTitle) s.add(c.displayTitle);
  try { for (const t of earnedTitleBonuses(c).list) s.add(t.name); } catch (e) { }
  return [...s];
}
function showcaseOf(c) {
  const sc = c.showcase = c.showcase || {};
  const titles = titleChoices(c);
  sc.title = c.displayTitle || null; // the Titles tab and the Profile page share one chosen title
  if (sc.sub && (!titles.includes(sc.sub) || sc.sub === sc.title)) sc.sub = null;
  if (!styleOwned(sc.style || 'gold', c)) sc.style = 'gold';
  if (!bgOwned(sc.bg || 'plain', c)) sc.bg = 'plain';
  if (!frameOwned(sc.frame || 'none', c)) sc.frame = 'none';
  return sc;
}

// ---------- rendering ----------
// One coloured pixel letter per span; colours flow along the text.
function styledTitle(text, styleId, opt) {
  if (!text) return '';
  const st = STYLE_BY[styleId] || STYLE_BY.gold, o = opt || {};
  let i = 0;
  const words = String(text).split(/(\s+)/);
  let wi = 0;
  const html = words.map(w => {
    if (/^\s+$/.test(w)) return '<i class="sp"> </i>';
    const pal = st.words ? st.words[wi % st.words.length] : st.pal, cls = st.words ? `w${wi % st.words.length}` : '';
    wi++;
    return `<span class="${cls}">${[...w].map(ch => { const k = i++; return `<i style="color:${pal[k % pal.length]};animation-delay:-${(k * 0.16).toFixed(2)}s">${esc(ch)}</i>`; }).join('')}</span>`;
  }).join('');
  return `<span class="stitle st-${st.id} ${o.size || ''}" data-noi18n title="${esc(text)}" aria-label="${esc(text)}">${html}</span>`;
}
(function sxCss() {
  if (typeof document === 'undefined') return;
  const kf = (name, pal) => `@keyframes ${name}{${pal.concat([pal[0]]).map((c, i, a) => `${(i / (a.length - 1) * 100).toFixed(1)}%{color:${c}}`).join('')}}`;
  let css = '';
  for (const s of TITLE_STYLES) {
    if (s.words) s.words.forEach((p, w) => { css += kf(`st-${s.id}-${w}`, p) + `.st-${s.id} .w${w} i{animation:st-${s.id}-${w} ${(p.length * 0.45).toFixed(2)}s linear infinite}`; });
    else css += kf(`st-${s.id}`, s.pal) + `.st-${s.id} i{animation:st-${s.id} ${(s.pal.length * 0.45).toFixed(2)}s linear infinite}`;
  }
  const el = document.createElement('style'); el.id = 'sxcss'; el.textContent = css; document.head.appendChild(el);
})();
function showcaseCharCard(c, big) {
  const sc = c.showcase || {}, fr = FRAME_BY[sc.frame] || FRAME_BY.none;
  return `<div class="profchar card pbg-${esc(sc.bg || 'plain')} ${big ? 'big' : ''}">
    <div class="row" style="gap:12px;align-items:flex-start"><div class="pframe pf-${esc(fr.id)}" ${fr.color ? `style="--fc:${fr.color}"` : ''} title="${esc(fr.id === 'none' ? '' : fr.name + ' frame')}">${heroShowcase(c, big ? 120 : 84, { cls: 'small', pet: c.pet, look: c.look && c.look.race ? c.look : { ...pxLookOf({ ...c, look: null, fashion: {} }), ...(c.look || {}) } })}${fr.id !== 'none' ? `<span class="pframe-tag">${esc(fr.name)}</span>` : ''}</div>
      <div style="flex:1;min-width:0"><h3 style="margin:0">${esc(c.name)}</h3>${c.title ? `<div class="ptitle">${styledTitle(c.title, sc.style, { size: big ? 'lg' : '' })}</div>` : ''}${sc.sub ? `<div class="psub">${esc(sc.sub)}</div>` : ''}`;
}

// ---------- the Profile page (You → Profile) ----------
let sxView = 'title';
function tabShowcase() {
  const sc = showcaseOf(ch), titles = titleChoices(ch);
  const preview = { name: ch.name, race: ch.race, cls: ch.cls, gender: ch.gender, mark: ch.mark, look: pxLookOf(ch), title: sc.title, showcase: sc,
    pet: (() => { const p = ch.petActive && (ch.pets || []).find(x => x.uid === ch.petActive); return p ? { sp: p.sp, name: p.name || '', level: p.level || 1 } : null; })() };
  const lockLine = o => o.earn ? `🔒 ${esc(o.earn[1])}` : '';
  const tabsHtml = [['title', 'Title'], ['style', 'Title style'], ['bg', 'Background'], ['frame', 'Frame']].map(([k, n]) => `<button class="chip ${sxView === k ? 'on' : ''}" data-act="sxview" data-arg="${k}">${n}</button>`).join('');
  let body = '';
  if (sxView === 'title') body = titles.length ? `<p class="mute" style="font-size:14px;margin:0 0 8px">Pick from the titles you've earned. The subtitle shows smaller, under it.</p>
      <div class="grid sxgrid">${[null, ...titles].map(t => `<button class="card sxopt ${sc.title === t ? 'on' : ''}" data-act="sxtitle" data-arg="${esc(t || '')}">${t ? styledTitle(t, sc.style) : '<span class="mute">No title</span>'}${sc.title === t ? '<span class="mute" style="font-size:12px">Title</span>' : ''}</button>`).join('')}</div>
      <h4 style="margin:14px 0 6px">Subtitle</h4><div class="row" style="gap:6px;flex-wrap:wrap">${[null, ...titles.filter(t => t !== sc.title)].map(t => `<button class="chip ${sc.sub === t || (!sc.sub && !t) ? 'on' : ''}" data-act="sxsub" data-arg="${esc(t || '')}">${t ? esc(t) : 'None'}</button>`).join('')}</div>`
    : '<p class="mute">You haven’t earned a title yet. Titles come from gathering and crafting totals (see the Titles tab), and from secrets.</p>';
  if (sxView === 'style') body = `<p class="mute" style="font-size:14px;margin:0 0 8px">Styles are yours on every character once bought. Earned ones unlock by playing.</p><div class="grid sxgrid">${TITLE_STYLES.map(s => { const own = styleOwned(s.id, ch), on = sc.style === s.id;
      return `<div class="card sxopt ${on ? 'on' : ''} ${own ? '' : 'locked'}">${styledTitle(sc.title || s.name, s.id, { size: 'lg' })}<div class="spread" style="margin-top:6px"><b style="font-size:13px">${esc(s.name)}</b>${on ? '<span class="chip on">Using</span>' : own ? `<button class="sm" data-act="sxstyle" data-arg="${s.id}">Use</button>` : ''}</div>
        ${own ? '' : `<div class="mute" style="font-size:12px;margin-top:4px">${s.earn ? lockLine(s) + (s.price ? ' · or' : '') : ''}${s.price ? ` <button class="sm" data-act="sxbuy" data-arg="${s.id}" ${account.shards >= s.price ? '' : 'disabled'}>Buy · ${s.price} Thousandium</button>` : ''}</div>`}</div>`; }).join('')}</div>`;
  if (sxView === 'bg') body = `<div class="grid sxgrid">${PROFILE_BGS.map(b => { const own = bgOwned(b.id, ch), on = sc.bg === b.id;
      return `<div class="card sxopt sxbg pbg-${b.id} ${on ? 'on' : ''} ${own ? '' : 'locked'}"><b>${esc(b.name)}</b><div style="margin-top:22px">${on ? '<span class="chip on">Using</span>' : own ? `<button class="sm" data-act="sxbg" data-arg="${b.id}">Use</button>` : `<span class="mute" style="font-size:12px">${lockLine(b)}</span>`}</div></div>`; }).join('')}</div>`;
  if (sxView === 'frame') body = `<div class="grid sxgrid">${PROFILE_FRAMES.map(f => { const own = frameOwned(f.id, ch), on = sc.frame === f.id;
      return `<div class="card sxopt ${on ? 'on' : ''} ${own ? '' : 'locked'}"><div class="pframe pf-${f.id}" ${f.color ? `style="--fc:${f.color}"` : ''}>${portrait(ch, 48)}</div><b style="font-size:14px">${esc(f.name)}</b><div style="margin-top:6px">${on ? '<span class="chip on">Using</span>' : own ? `<button class="sm" data-act="sxframe" data-arg="${f.id}">Use</button>` : `<span class="mute" style="font-size:12px">${lockLine(f)}</span>`}</div></div>`; }).join('')}</div>`;
  return `<div class="spread"><h2>Profile</h2><span class="chip">Thousandium <b class="gold">${N(account.shards)}</b></span></div>
    <p class="mute">Dress up your public profile. Your title and its style also show next to your name in chat, on the leaderboards and in your sidebar.</p>
    <div class="sxwrap"><div><div class="card sxprev"><div class="mute" style="font-size:12px;margin-bottom:6px">Preview</div>${showcaseCharCard(preview, true)}<div class="mute" style="font-size:14px">${esc(race().name)} ${esc(tierName(ch.cls, ch.adv.spec, ch.adv.tier))} · <b>${ch.ascension ? `A${ch.ascension} · ` : ''}Lv ${ch.level}</b></div></div></div></div></div></div></div>
    <div class="row" style="gap:6px;margin:12px 0">${tabsHtml}</div>${body}
    ${typeof soc !== 'undefined' && soc.me ? `<div class="row" style="margin-top:12px"><button class="sm" data-act="profview" data-arg="${esc(soc.me.code)}">View my public profile</button></div>` : '<p class="mute" style="font-size:13px;margin-top:12px">Sign in on the website to share your profile and show your title in chat and on the leaderboards.</p>'}`;
}
// Push the chosen title + style to the server (chat and leaderboards). Quietly, at most every 20 s.
let sxSyncAt = 0, sxSyncTimer = 0;
function sxSync(now) {
  if (typeof socOn !== 'function' || !socOn() || !(soc && soc.me)) return;
  clearTimeout(sxSyncTimer);
  const go = async () => {
    sxSyncAt = Date.now();
    const rows = account.slots.filter(c => c && !c.debugUsed).slice(0, 4).map(c => { const sc = showcaseOf(c); return { cid: c.id, title: sc.title || '', style: sc.style || 'gold' }; });
    const cur = ch ? showcaseOf(ch) : null;
    try { await rpc('tf_set_showcase', { p_title: cur && cur.title || '', p_style: cur && cur.style || 'gold', p_rows: rows }); } catch (e) { }
  };
  if (now || Date.now() - sxSyncAt > 20000) go(); else sxSyncTimer = setTimeout(go, 20000 - (Date.now() - sxSyncAt));
}
function sxChanged() { showcaseOf(ch); dirty = true; save(); renderMain(); if (typeof renderSide === 'function') renderSide(); sxSync(); if (typeof profilePublish === 'function') profilePublish(true); }
const SHOWCASE_HANDLERS = {
  sxview: v => { sxView = v; renderMain(); },
  sxtitle: t => { ch.displayTitle = t || null; const sc = showcaseOf(ch); if (sc.sub === sc.title) sc.sub = null; sxChanged(); },
  sxsub: t => { showcaseOf(ch).sub = t || null; sxChanged(); },
  sxstyle: id => { if (!styleOwned(id, ch)) return; showcaseOf(ch).style = id; sxChanged(); },
  sxbg: id => { if (!bgOwned(id, ch)) return; showcaseOf(ch).bg = id; sxChanged(); },
  sxframe: id => { if (!frameOwned(id, ch)) return; showcaseOf(ch).frame = id; sxChanged(); },
  sxbuy: id => {
    const s = STYLE_BY[id]; if (!s || !s.price || styleOwned(id, ch)) return;
    if (account.shards < s.price) { toast(`You need ${s.price} Thousandium.`); return; }
    modal(`<h3>Buy ${esc(s.name)}?</h3><div style="margin:10px 0">${styledTitle(showcaseOf(ch).title || s.name, s.id, { size: 'lg' })}</div><p>Costs <b>${s.price} Thousandium</b> (you have ${N(account.shards)}). It's yours on every character.</p>
      <div class="row" style="justify-content:flex-end;gap:6px"><button data-act="close">Cancel</button><button class="pri" data-act="sxbuyok" data-arg="${id}">Buy</button></div>`);
  },
  sxbuyok: id => { const s = STYLE_BY[id]; closeModal(); if (!s || account.shards < s.price || styleOwned(id, ch)) return; account.shards -= s.price; account.styles = account.styles || {}; account.styles[id] = 1; addLog('lucky', `Title style bought: ${s.name} (−${s.price} Thousandium).`); showcaseOf(ch).style = id; sxChanged(); },
};
