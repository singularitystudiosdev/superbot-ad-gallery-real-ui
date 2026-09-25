/* site.js - the generated frontend: superbot.app/p/waiver-night, "Waiver Night".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on a claim row and .is-active on a league tab; both are styled
   in site.css. The Sleeper tab click swaps the whole league panel through a :has() + sibling rule, so no
   JS runs on the click. The only clock-driven output is render(root, p): the kickoff countdown, the lock
   bar and the top bar's sync line, all pure functions of the beat's progress. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const n1 = (n) => Number(n).toFixed(1);
const usd = (n) => '$' + n0(n);
const pad = (n) => String(n).padStart(2, '0');
/** seconds -> H:MM:SS, the countdown the hero card prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds));
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

/* ---------- inline icons: drawn glyphs, never photos ---------- */
const SVG = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  up: '<path d="M12 19V5"/><path d="m5 12 7-7 7 7"/>',
  down: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5.2l3.4 2"/>',
  bolt: '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12Z"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.5 20a1.6 1.6 0 0 0 3 0"/>',
  shield: '<path d="M12 3 5 6v6c0 4.4 3 7.7 7 9 4-1.3 7-4.6 7-9V6Z"/><path d="m9 12 2.2 2.2L15 10.5"/>',
  swap: '<path d="M7 8h11l-3-3"/><path d="M17 16H6l3 3"/>',
  ball: '<path d="M4.9 18.2a11.6 11.6 0 0 1 14-14 11.6 11.6 0 0 1-14 14Z"/><path d="m9.4 9.4 5.2 5.2"/><path d="m7.2 11.6 1.8 1.8"/><path d="m11.6 7.2 1.8 1.8"/><path d="m12.6 15.6 1.8-1.8"/><path d="m15.6 12.6 1.8-1.8"/>',
};
const ic = (name, cls) =>
  `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${SVG[name]}</svg>`;

/* ---------- shared bits ---------- */
const pos = (p) => `<span class="wn-pos wn-pos--${esc(String(p).toLowerCase())}">${esc(p)}</span>`;
const logo = (src, cls) => `<img class="wn-logo${cls ? ' ' + cls : ''}" src="${esc(src)}" alt="" width="20" height="20">`;

function tab(l) {
  return (
    `<span class="wn-tab wn-tab--${l.key}${l.key === 1 ? ' is-active' : ''}">` +
      logo(l.platform.logo) +
      `<span class="wn-tab-t"><b>${esc(l.league)}</b><small>${esc(l.platform.short)} &middot; ${esc(l.record)}</small></span>` +
    '</span>'
  );
}

function claimCard(l) {
  const c = l.claim;
  const bidPct = Math.round((c.bid / l.budgetOf) * 100);
  return (
    '<article class="wn-claimcard">' +
      '<header class="wn-claimhead">' +
        logo(l.platform.logo) +
        `<span class="wn-claimwho"><b>${esc(l.league)}</b><small>${esc(l.platform.name)} &middot; ${esc(l.club)} &middot; ${esc(l.place)}</small></span>` +
        `<span class="wn-pill">${ic('check', 'wn-ic')}Claim submitted</span>` +
      '</header>' +
      '<div class="wn-crows">' +
        '<div class="wn-crow wn-crow--add">' +
          '<span class="wn-crowk">ADD</span>' +
          pos(c.add.pos) +
          `<span class="wn-crown"><b>${esc(c.add.name)}</b><small>${esc(c.add.team)} vs ${esc(c.add.opp)} &middot; ${esc(c.pick)}</small></span>` +
          `<span class="wn-crowv"><b>${n1(c.add.proj)}</b><small>proj</small></span>` +
        '</div>' +
        '<div class="wn-crow wn-crow--drop">' +
          '<span class="wn-crowk">DROP</span>' +
          pos(c.drop.pos) +
          `<span class="wn-crown"><b>${esc(c.drop.name)}</b><small>${esc(c.drop.team)} &middot; ${esc(c.drop.note)}</small></span>` +
          `<span class="wn-crowv"><b>${n1(c.drop.proj)}</b><small>was</small></span>` +
        '</div>' +
        '<div class="wn-crow wn-crow--bid">' +
          '<span class="wn-crowk">BID</span>' +
          `<span class="wn-crown"><b>${usd(c.bid)} FAAB</b><small>${usd(l.budgetLeft)} left when the claim runs</small></span>` +
          `<span class="wn-bid" title="${bidPct} percent of the budget"><span class="wn-bidfill" style="width:${bidPct}%"></span></span>` +
          `<span class="wn-crowv"><b>${c.beat}</b><small>beats the field</small></span>` +
        '</div>' +
      '</div>' +
      `<p class="wn-claimwhy">${esc(c.why)}</p>` +
      `<footer class="wn-claimfoot"><span>Submitted ${esc(c.at)}</span><span class="wn-claimlock">${ic('clock', 'wn-ic')}Locks at 8:15 PM ET</span></footer>` +
    '</article>'
  );
}

function lineupRow(r) {
  return (
    `<div class="wn-lrow${r.moved ? ' wn-lrow--moved' : ''}">` +
      `<span class="wn-lslot">${esc(r.slot)}</span>` +
      `<span class="wn-lname">${pos(r.pos)}<b>${esc(r.name)}</b><small>${esc(r.team)}</small>` +
        (r.moved ? `<span class="wn-moved">${ic('swap', 'wn-ic')}Moved in</span>` : '') +
      '</span>' +
      `<span class="wn-lopp">${esc(r.opp)}</span>` +
      `<span class="wn-lproj">${n1(r.proj)}</span>` +
    '</div>'
  );
}

function lineupCard(l) {
  const L = l.lineup;
  return (
    '<article class="wn-lineupcard">' +
      '<header class="wn-lineuphead">' +
        logo(l.platform.logo) +
        `<span class="wn-lineupwho"><b>${esc(l.league)}</b><small>${esc(l.club)} &middot; ${esc(l.platform.short)} &middot; ${L.moved} moved in</small></span>` +
        `<span class="wn-total"><b>${n1(L.total)}</b><small>projected</small></span>` +
        `<span class="wn-del"><b>+${n1(L.delta)}</b><small>vs last week</small></span>` +
      '</header>' +
      '<div class="wn-ltable">' +
        '<div class="wn-lrow wn-lrow--head"><span class="wn-lslot">Slot</span><span class="wn-lname">Starter</span><span class="wn-lopp">Opp</span><span class="wn-lproj">Proj</span></div>' +
        L.rows.map(lineupRow).join('') +
      '</div>' +
      `<div class="wn-lsum"><span>9 of 9 slots set</span><span>${esc(L.bench)}</span><span class="wn-lsum-d">${n1(L.total)} now, ${n1(L.old)} before the claim</span></div>` +
      '<footer class="wn-linefoot">' + ic('shield', 'wn-ic') + 'Lineup locked in before kickoff</footer>' +
    '</article>'
  );
}

function boardRow(w) {
  const up = w.trend >= 0;
  return (
    `<div class="wn-brow wn-brow--${w.rank}">` +
      `<span class="wn-brank">${w.rank}</span>` +
      pos(w.pos) +
      `<span class="wn-bname"><b>${esc(w.name)}</b><small>${esc(w.team)} vs ${esc(w.opp)} &middot; ${w.rostered} percent rostered</small></span>` +
      `<span class="wn-bros"><b>${w.ros}</b><small>ROS</small></span>` +
      `<span class="wn-btrend${up ? ' wn-btrend--up' : ' wn-btrend--down'}">${ic(up ? 'up' : 'down', 'wn-ic')}${up ? '+' : ''}${w.trend}</span>` +
    '</div>'
  );
}

function board(data) {
  return (
    '<aside class="wn-board">' +
      '<header class="wn-boardhead">' +
        `<span class="wn-boardt"><b>${esc(data.copy.boardHead)}</b><small>${esc(data.copy.boardDek)}</small></span>` +
        `<span class="wn-boardn">${n0(data.meta.scanned)} scanned</span>` +
      '</header>' +
      '<div class="wn-brows">' + data.wire.map(boardRow).join('') + '</div>' +
      '<footer class="wn-boardfoot">' +
        '<span>Ranked by rest of season value</span>' +
        `<span>${data.counts.rostered} percent of the board is rostered in under a fifth of leagues</span>` +
      '</footer>' +
    '</aside>'
  );
}

function newsItem(a) {
  return (
    '<li class="wn-news">' +
      `<img class="wn-newsimg" src="${esc(a.img)}" alt="${esc(a.head)}" width="640" height="400">` +
      '<div class="wn-newsb">' +
        `<span class="wn-newsm"><span class="wn-newstag">${esc(a.tag)}</span><b>${esc(a.team)}</b><i>${esc(a.when)}</i></span>` +
        `<h3 class="wn-newshead">${esc(a.head)}</h3>` +
        `<p class="wn-newsbody">${esc(a.body)}</p>` +
      '</div>' +
    '</li>'
  );
}

function matchup(l) {
  const win = 52 + l.key * 5;
  return (
    '<aside class="wn-match">' +
      '<img class="wn-matchimg" src="./img/field.jpg" alt="" width="960" height="540">' +
      '<div class="wn-matchb">' +
        '<span class="wn-matchk">Week 4 matchup</span>' +
        '<div class="wn-matchrow">' +
          `<span class="wn-club"><b>${esc(l.club)}</b><i>${n1(l.lineup.total)}</i></span>` +
          '<span class="wn-vsword">vs</span>' +
          `<span class="wn-club wn-club--r"><b>${esc(l.opponent)}</b><i>${n1(l.oppProj)}</i></span>` +
        '</div>' +
        `<span class="wn-prob"><i style="width:${win}%"></i></span>` +
        `<small class="wn-matchnote">${win} percent win probability, up from ${win - 14} percent before the claim was filed.</small>` +
      '</div>' +
    '</aside>'
  );
}

/* ---------- page sections ---------- */
function topBar(cfg, data) {
  return (
    '<header class="wn-top">' +
      '<div class="wn-toprow">' +
        '<span class="wn-brand">' +
          `<span class="wn-mark">${ic('ball')}</span>` +
          '<span class="wn-wordmark">Waiver <em>Night</em></span>' +
          `<span class="wn-week">Week ${data.meta.week}</span>` +
        '</span>' +
        '<span class="wn-status">' +
          '<span class="wn-dot"></span>' +
          '<b>3 leagues connected</b>' +
          `<small class="wn-sync">${esc(data.meta.synced)}</small>` +
        '</span>' +
        '<span class="wn-clockbox">' +
          `<span class="wn-clockk">${esc(data.meta.kickoffLabel)}</span>` +
          '<span class="wn-clock">04:12:38</span>' +
        '</span>' +
      '</div>' +
      '<nav class="wn-tabbar">' +
        data.leagues.map(tab).join('') +
        '<span class="wn-tabmeta">3 claims &middot; 3 lineups</span>' +
      '</nav>' +
      '<span class="wn-scanline"></span>' +
    '</header>'
  );
}

function hero(data) {
  return (
    '<section class="wn-hero">' +
      '<img class="wn-heroimg" src="./img/hero.jpg" alt="" width="1600" height="760">' +
      '<span class="wn-heroshade"></span>' +
      '<div class="wn-heroin">' +
        '<span class="wn-herotag">Waiver wire, Week 4</span>' +
        `<h1 class="wn-h1">${esc(data.copy.heroH1)}</h1>` +
        `<p class="wn-lede">${esc(data.copy.heroDek)}</p>` +
        '<div class="wn-herostats">' +
          `<span class="wn-hstat"><b>${n0(data.meta.scanned)}</b><small>free agents scanned</small></span>` +
          `<span class="wn-hstat"><b>${data.meta.claimsPlaced}</b><small>claims placed</small></span>` +
          `<span class="wn-hstat"><b>${data.meta.lineupsSet}</b><small>lineups set</small></span>` +
          `<span class="wn-hstat"><b>${usd(data.meta.faabLeft)}</b><small>FAAB left</small></span>` +
        '</div>' +
      '</div>' +
      '<div class="wn-clockcard">' +
        '<span class="wn-clockcard-k">Time to kickoff</span>' +
        '<span class="wn-clock wn-clock--big">04:12:38</span>' +
        `<span class="wn-clockcard-s">${esc(data.meta.kickoffLabel)}</span>` +
        '<span class="wn-lockbar"><span class="wn-clockfill"></span></span>' +
        `<span class="wn-clockcard-f">${esc(data.meta.lockLabel)}</span>` +
      '</div>' +
    '</section>'
  );
}

function sectionHead(title, dek, meta) {
  return (
    '<div class="wn-secthead">' +
      `<h2 class="wn-h2">${esc(title)}</h2>` +
      `<p class="wn-dek">${esc(dek)}</p>` +
      `<span class="wn-sectmeta">${esc(meta)}</span>` +
    '</div>'
  );
}

function claimsSection(data) {
  return (
    '<div class="wn-claims">' +
      sectionHead(data.copy.claimsHead, data.copy.claimsDek, '3 of 3 filed') +
      '<div class="wn-claimgrid">' +
        data.leagues.map((l) => `<div class="wn-panel wn-panel--${l.key}">${claimCard(l)}</div>`).join('') +
        board(data) +
      '</div>' +
    '</div>'
  );
}

function lineupSection(data) {
  return (
    '<div class="wn-lineup">' +
      sectionHead(data.copy.lineupHead, data.copy.lineupDek, '3 leagues') +
      '<div class="wn-lineupgrid">' +
        data.leagues
          .map(
            (l) =>
              `<div class="wn-panel wn-panel--${l.key}"><div class="wn-lpair">${lineupCard(l)}${matchup(l)}</div></div>`
          )
          .join('') +
      '</div>' +
    '</div>'
  );
}

function kickoffSection(data) {
  return (
    '<div class="wn-kickoff">' +
      sectionHead(data.copy.kickoffHead, data.copy.kickoffDek, 'Kickoff Thu 8:15 PM ET') +
      '<div class="wn-kickgrid">' +
        '<div class="wn-kickcard">' +
          `<span class="wn-kickk">${esc(data.meta.kickoffLabel)}</span>` +
          '<span class="wn-clock wn-clock--kick">04:12:38</span>' +
          `<span class="wn-kickrow">${ic('bell', 'wn-ic')}Waivers run at 3:00 AM ET, superbot checks again at 7:00 PM ET</span>` +
          `<span class="wn-kickrow">${ic('bolt', 'wn-ic')}A starter only moves if the injury report changes</span>` +
          '<span class="wn-kickfoot">Lineup locked in before kickoff</span>' +
        '</div>' +
        '<ul class="wn-newsl">' + data.news.map(newsItem).join('') + '</ul>' +
      '</div>' +
      '<div class="wn-strip">' +
        '<img class="wn-stripimg" src="./img/strip.jpg" alt="" width="1280" height="320">' +
        '<div class="wn-stripin">' +
          '<span class="wn-striptag">Week 4</span>' +
          '<span class="wn-stript">Three claims filed, three lineups set, nothing left open before kickoff.</span>' +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function footer(cfg, data) {
  const rows = cfg.sources
    .map(
      (s) =>
        '<li class="wn-srcrow">' +
          logo(s.logo, 'wn-logo--sm') +
          `<span class="wn-srcrow-n">${esc(s.name)}</span>` +
          `<span class="wn-srcrow-c">${n0(s.count)}</span>` +
          `<span class="wn-srcrow-k">${esc(s.what)}</span>` +
        '</li>'
    )
    .join('');
  return (
    '<footer class="wn-foot">' +
      '<div class="wn-footcol">' +
        '<h3 class="wn-h3">What was read</h3>' +
        '<ul class="wn-srclist">' + rows + '</ul>' +
      '</div>' +
      '<div class="wn-footcol">' +
        '<h3 class="wn-h3">How the board was built</h3>' +
        '<p class="wn-footp">One list of available players per league, then the same score for each of them: rest of season projection, weekly usage, and what the injury desk said that day. The names at the top of that list are the three claims on this page.</p>' +
        `<p class="wn-footp">${esc(data.copy.footNote)}</p>` +
      '</div>' +
      '<div class="wn-footcol">' +
        '<h3 class="wn-h3">Before kickoff</h3>' +
        '<p class="wn-footp">Waivers run at 3:00 AM ET. If a claim is beaten, the next name on the board is filed instead, and the lineup check runs again at 7:00 PM ET.</p>' +
        '<p class="wn-footp">Nothing on this page is a live feed. It is the state of the three leagues when superbot finished.</p>' +
        '<p class="wn-footmark">Made by <span class="wn-sb">superbot</span></p>' +
      '</div>' +
    '</footer>'
  );
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(cfg, data) +
    hero(data) +
    '<section class="wn-live">' +
      claimsSection(data) +
      lineupSection(data) +
      kickoffSection(data) +
    '</section>' +
    footer(cfg, data);
}

/* clock hook: the kickoff countdown, the lock bar and the sync line, all functions of the beat's progress */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const t = Math.max(0, Math.min(1, Number(p) || 0));
  const txt = clockText(fallback.meta.countdown - t * 12);
  const clocks = root.querySelectorAll('.wn-clock');
  for (const n of clocks) n.textContent = txt;
  const fill = root.querySelector('.wn-clockfill');
  if (fill) fill.style.width = (t * 100).toFixed(2) + '%';
  const sync = root.querySelector('.wn-sync');
  if (sync) sync.textContent = t < 0.5 ? fallback.meta.synced : '3 claims filed, lineups set';
  const scan = root.querySelector('.wn-scanline');
  if (scan) scan.style.width = (t * 100).toFixed(2) + '%';
}

export { build };