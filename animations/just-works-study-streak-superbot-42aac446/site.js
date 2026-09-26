/* site.js - the generated frontend: superbot.app/p/study-streak, "Study Overview".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the streak check bar, the streak tile's flame chip, the first
   flag's deadline ring and the morning plan bar, and .is-active on the Decks tab; all are styled in site.css.
   The tab click swaps the Today panel (Duolingo league and WaniKani forecast) for the Anki decks panel
   through a :has() + sibling rule, so no JS runs on the click; both panels share one grid cell, so the swap
   moves nothing around them. The only clock-driven output is render(root, p): the top bar clock, the sync
   card reading the four apps (SYNC_A/SYNC_B) and checking each streak into the segmented bar
   (CHECK_A/CHECK_B), the four today counters easing in (GROW_A/GROW_B), the three flags landing with their
   deadline rings (FLAG_A/FLAG_B), the league rows and the review forecast (OUT_A/OUT_B), the deck due bars
   (DECK_A/DECK_B), the morning plan bar (PLAN_A/PLAN_B) and the sync bar. Every one of them is a pure
   function of the beat's progress.
   Read-only: every word the page prints says what Superbot read or found, never that it studied, reviewed,
   booked or bought anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/** seconds since midnight -> "7:02:14 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* The beats, in p (the browser scene's progress, 1 s morph included; with dur.browser 11.2 a scroll f in
   ad.js lands at p = (1 + 10.2 f) / 11.2). Each window sits inside the scroll hold that shows it:
   - the four apps are read from SYNC_A to SYNC_B and the streaks checked from CHECK_A to CHECK_B, both
     inside the hero hold (f 0.12 to 0.28, p 0.2 to 0.34), so the finished card holds before the page moves;
   - the four today counters ease in while the strip arrives and settles (f 0.28 to 0.44);
   - the three flags land in turn while the flags block arrives (f 0.44 to 0.49) and settle early in its
     hold, which is the longest one (to f 0.66): the money beat reads with nothing moving;
   - the league bars and the forecast grow as the panels arrive (f 0.66 to 0.78);
   - the deck bars grow right after the Decks click (f 0.79, p 0.81) and the plan bar fills as the page
     settles on it (f 0.86, p 0.87). */
const SYNC_A = 0.05;
const SYNC_B = 0.2;
const CHECK_A = 0.195;
const CHECK_B = 0.3;
const GROW_A = 0.37;
const GROW_B = 0.47;
const FLAG_A = 0.5;
const FLAG_B = 0.6;
const OUT_A = 0.7;
const OUT_B = 0.8;
const DECK_A = 0.815;
const DECK_B = 0.9;
const PLAN_A = 0.86;
const PLAN_B = 0.95;

const win = (a, b) => (p) => clamp01((p - a) / (b - a));
export const syncDone = win(SYNC_A, SYNC_B);
export const checkDone = win(CHECK_A, CHECK_B);
export const growDone = win(GROW_A, GROW_B);
export const flagDone = win(FLAG_A, FLAG_B);
export const outDone = win(OUT_A, OUT_B);
export const deckDone = win(DECK_A, DECK_B);
export const planDone = win(PLAN_A, PLAN_B);

/* n items share one window: each takes LEN of it, starting evenly spaced so the last ends at 1 */
const LEN = 0.4;
export function stepDone(g, i, n, len = LEN) {
  const step = n > 1 ? (1 - len) / (n - 1) : 0;
  return ease(clamp01((g - i * step) / len));
}

/* lucide icons (ISC), inline so the page needs no font or sprite */
const ICONS = {
  check: '<path d="M20 6 9 17l-5-5"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  layers: '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  refresh: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
  sunrise: '<path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
};
const ico = (name) =>
  `<svg class="ss-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

const hour = (h) => (h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`);
const logoOf = (data, id) => data.accounts.find((a) => a.id === id);
const srcTile = (data, id, cls) => {
  const a = logoOf(data, id);
  return `<img class="${cls}" src="${esc(a.logo)}" alt="${esc(a.name)}"/>`;
};

// ---------- top bar ----------
function topBar(data) {
  const { flags, anki, meta } = data;
  return `<header class="ss-top"><div class="ss-topin">
  <span class="ss-brand"><img class="ss-brandico" src="./brand/app.svg" alt=""/><b>Study Overview</b><span class="ss-by">by Superbot</span></span>
  <nav class="ss-tabs"><span class="ss-tab ss-tab--1">Today <i>${flags.length}</i></span><span class="ss-tab ss-tab--2">Decks <i>${anki.decks.length}</i></span></nav>
  <div class="ss-status"><span class="ss-ro">${ico('lock')}Read-only</span><span class="ss-live"><span class="ss-dot"></span><span class="ss-clock">${esc(clockText(meta.syncStart))}</span></span></div>
</div><div class="ss-syncbar"><span class="ss-syncfill"></span></div></header>`;
}

// ---------- hero: the sync card and the streak card ----------
const CHECK_STATE = { red: 'At risk', amber: 'Piling up', ok: 'On track' };
function levelOf(data, id) {
  const f = data.flags.find((x) => x.src === id);
  return f ? f.level : 'ok';
}

function syncCard(data) {
  const { accounts, copy } = data;
  const ticks = accounts.map((a, i) => `<li class="ss-tick ss-tick--s${i + 1}">
      <img src="${esc(a.logo)}" alt=""/>
      <span class="ss-tickt"><b>${esc(a.name)}</b><small>${esc(a.line)}</small></span>
      <span class="ss-tickc"><b class="ss-tickn" data-n="${a.pulled}" data-i="${i}">0</b><small>${esc(a.what)}</small></span>
      <span class="ss-tickok">${ico('check')}</span>
    </li>`).join('');
  const segs = accounts.map((a, i) => {
    const lv = levelOf(data, a.id);
    return `<span class="ss-cseg ss-cseg--${lv}" data-c="${i}"><small><b>${esc(a.name)}</b> ${CHECK_STATE[lv]}</small><span class="ss-ctrack"><span class="ss-cfill"></span></span></span>`;
  }).join('');
  const nFlag = data.flags.length;
  return `<div class="ss-sync">
    <div class="ss-synchead">
      <span class="ss-syncnow">${ico('refresh')}${esc(copy.syncing)}<b class="ss-synccount">0 of ${accounts.length} apps</b></span>
      <span class="ss-stamp">${ico('check')}${esc(copy.stamp)}</span>
    </div>
    <ul class="ss-ticks">${ticks}</ul>
    <div class="ss-check">
      <div class="ss-checkh"><span>${ico('flame')}${esc(copy.checked)}</span><b class="ss-checkn">0 of ${accounts.length}</b><em class="ss-checkr">${nFlag} need you today</em></div>
      <div class="ss-cbar">${segs}</div>
    </div>
  </div>`;
}

function streakCard(data) {
  const { duolingo: d, flags } = data;
  const max = Math.max(...d.week.map((w) => w.xp), d.goal);
  const bars = d.week.map((w, i) => {
    const today = i === d.week.length - 1;
    return `<span class="ss-xpd${today ? ' ss-xpd--today' : ''}" data-x="${i}" data-h="${((w.xp / max) * 100).toFixed(2)}"><span class="ss-xpcol"><i></i></span><small>${today ? 'Today' : esc(w.d)}</small></span>`;
  }).join('');
  return `<aside class="ss-streak">
    <div class="ss-streakh"><span class="ss-flame">${ico('flame')}</span><span class="ss-streakt"><b class="ss-streakn">${d.streak}</b><small>day streak on Duolingo</small></span></div>
    <p class="ss-streaks">${d.courses.map((c) => esc(c.lang)).join(' and ')} · ${d.freezes} streak freezes equipped</p>
    <div class="ss-xpweek">${bars}</div>
    <div class="ss-streakf"><span>This league week<b>${n0(d.weekXp)} XP</b></span><span>Today<b>${d.xpToday} of ${d.goal} XP</b></span></div>
    <div class="ss-streakwarn">${ico('alert')}<span>Ends ${esc(flags[0].dueText)} without a lesson</span></div>
  </aside>`;
}

function hero(data) {
  const { copy } = data;
  return `<section class="ss-hero">
  <img class="ss-herobg" src="./img/hero.jpg" alt=""/>
  <div class="ss-heroin">
    <div class="ss-herot">
      <span class="ss-kicker">${ico('sunrise')}${esc(copy.kicker)}</span>
      <h1>${esc(copy.h1)}</h1>
      <p class="ss-dek">${esc(copy.dek)}</p>
      ${syncCard(data)}
    </div>
    ${streakCard(data)}
  </div>
</section>`;
}

// ---------- today at a glance ----------
function statTiles(data) {
  const { duolingo: d, anki, wanikani: wk, counts } = data;
  const tile = (cls, icon, label, num, ex, extra = '') => `<div class="ss-stat ss-stat--${cls}">
      <div class="ss-stath"><span class="ss-stati">${ico(icon)}</span><span>${esc(label)}</span></div>
      ${num}${extra}
      <p class="ss-statex">${ex}</p>
    </div>`;
  return `<section class="ss-stats">
  <div class="ss-sech"><h2>Today at a glance</h2><span>Read ${esc(data.meta.date)} at ${esc(fallback.hm(data.meta.syncStart))}, before any study today</span></div>
  <div class="ss-statg">
    ${tile('streak', 'flame', 'Duolingo streak', `<b class="ss-statn" data-g="${d.streak}" data-unit="days">0 days</b>`, `No streak freeze equipped, ends at midnight`)}
    ${tile('xp', 'zap', 'XP today', `<b class="ss-statn">${d.xpToday}<small> / ${d.goal} XP</small></b>`, `<b>${n0(d.weekXp)} XP</b> this league week`, `<span class="ss-xpbar"><i></i></span>`)}
    ${tile('league', 'trophy', `${d.league} League`, `<span class="ss-statrow"><b class="ss-statn" data-g="${d.rank}" data-from="${d.size}" data-pre="#">#${d.size}</b><small class="ss-statof">of ${d.size}</small></span>`, `${d.toPromote} from promotion, ${d.aboveDemotion} above the drop zone`)}
    ${tile('due', 'layers', 'Due today', `<b class="ss-statn" data-g="${counts.due}">0</b>`, `<b>${anki.due}</b> Anki cards · <b>${wk.reviewsNow}</b> WaniKani reviews`)}
  </div>
</section>`;
}

// ---------- the flags: the money beat ----------
function flagsBlock(data) {
  const { flags, ok, copy } = data;
  const rows = flags.map((f, i) => `<li class="ss-flag ss-flag--${i + 1} ss-flag--${f.level}" data-r="${i}">
      <span class="ss-fsrc">${srcTile(data, f.src, 'ss-flogo')}<small>${esc(logoOf(data, f.src).name)}</small></span>
      <div class="ss-fbody"><b class="ss-ftitle">${esc(f.title)}</b><p class="ss-fdetail">${esc(f.detail)}</p></div>
      <div class="ss-fdue">
        <span class="ss-fring"><svg class="ss-fsvg" viewBox="0 0 36 36" aria-hidden="true"><circle class="ss-ftrack" cx="18" cy="18" r="15" pathLength="100"/><circle class="ss-farc" cx="18" cy="18" r="15" pathLength="100" stroke-dasharray="0 100" data-s="${(f.share * 100).toFixed(2)}"/></svg>${ico('clock')}</span>
        <span class="ss-fwhen"><b>${esc(f.dueText)}</b><small>${esc(f.leftText)}</small></span>
      </div>
    </li>`).join('');
  const okRow = `<li class="ss-flag ss-flag--ok" data-r="${flags.length}">
      <span class="ss-fsrc">${srcTile(data, ok.src, 'ss-flogo')}<small>${esc(logoOf(data, ok.src).name)}</small></span>
      <div class="ss-fbody"><b class="ss-ftitle">${esc(ok.title)}</b><p class="ss-fdetail">${esc(ok.detail)}</p></div>
      <div class="ss-fdue"><span class="ss-fokico">${ico('shield')}</span><span class="ss-fwhen"><b>On track</b><small>No deadline today</small></span></div>
    </li>`;
  return `<section class="ss-flags">
  <div class="ss-sech"><h2>${ico('alert')}${esc(copy.flagsHead)}</h2><span>${esc(copy.flagsSub)}</span></div>
  <ol class="ss-flagl">${rows}${okRow}</ol>
</section>`;
}

// ---------- per-app panels ----------
function cardHead(data, id, title, sub) {
  return `<div class="ss-ch">${srcTile(data, id, 'ss-chlogo')}<b>${esc(title)}</b><span>${sub}</span></div>`;
}

function duoCard(data) {
  const { duolingo: d } = data;
  const top = Math.max(...d.table.map((r) => r.xp));
  const rows = d.table.map((r, i) => `<li class="ss-lrow${r.you ? ' ss-lrow--you' : ''}${r.rank <= d.promoteTop ? ' ss-lrow--up' : ''}" data-l="${i}">
      <span class="ss-lrank">${r.rank}</span><span class="ss-lname">${esc(r.name)}</span>
      <span class="ss-lbar"><i data-w="${((r.xp / top) * 100).toFixed(2)}"></i></span><b class="ss-lxp">${n0(r.xp)} XP</b>
    </li>`).join('');
  return `<div class="ss-card ss-duo">
    ${cardHead(data, 'duolingo', 'Duolingo', `${esc(d.league)} League · #${d.rank} of ${d.size}`)}
    <ol class="ss-league">${rows}</ol>
    <p class="ss-lnote"><span class="ss-lkey ss-lkey--up"></span>Top ${d.promoteTop} move up · <b>${d.gapUp} XP</b> behind #${d.promoteTop}</p>
    <ul class="ss-courses">${d.courses.map((c) => `<li><b>${esc(c.lang)}</b><span>${esc(c.at)}</span></li>`).join('')}</ul>
  </div>`;
}

function wkCard(data) {
  const { wanikani: wk } = data;
  const bars = wk.forecast.map((f, i) => `<span class="ss-fc" data-f="${i}" data-h="${((f.n / wk.maxHour) * 100).toFixed(2)}"><span class="ss-fccol"><i></i></span><small>${[0, 4, 8, 12, 15].includes(i) ? hour(f.h) : ''}</small></span>`).join('');
  const srs = wk.srs.map((s) => `<i class="ss-srs--${s.id}" style="flex-grow:${s.n}"></i>`).join('');
  const legend = wk.srs.map((s) => `<li><span class="ss-srsk ss-srs--${s.id}"></span>${esc(s.name)}<b>${n0(s.n)}</b></li>`).join('');
  return `<div class="ss-card ss-wk">
    ${cardHead(data, 'wanikani', 'WaniKani', `Level ${wk.level}`)}
    <div class="ss-wknums">
      <span class="ss-wkn ss-wkn--now"><b>${wk.reviewsNow}</b><small>reviews now</small></span>
      <span class="ss-wkn"><b>+${wk.later}</b><small>more by ${hour(wk.lastHour).replace('p', ' PM')}</small></span>
      <span class="ss-wkn"><b>${wk.lessons}</b><small>lessons open</small></span>
    </div>
    <div class="ss-fcrow">${bars}</div>
    <div class="ss-srs">${srs}</div>
    <ul class="ss-srsl">${legend}</ul>
  </div>`;
}

function ankiCard(data) {
  const { anki } = data;
  const rows = anki.decks.map((d, i) => `<li class="ss-deck" data-d="${i}">
      <span class="ss-dname"><b>${esc(d.name)}</b><small>${esc(d.lang)} · ${n0(d.cards)} cards</small></span>
      <span class="ss-dnum ss-dnum--new">${d.fresh}</span><span class="ss-dnum ss-dnum--rev">${d.review}</span>
      <span class="ss-dbar"><i class="ss-dnew" data-w="${((d.fresh / anki.maxDue) * 100).toFixed(2)}"></i><i class="ss-drev" data-w="${((d.review / anki.maxDue) * 100).toFixed(2)}"></i></span>
      <b class="ss-ddue">${d.due}</b>
    </li>`).join('');
  return `<div class="ss-card ss-anki">
    ${cardHead(data, 'anki', 'AnkiWeb', `${anki.decks.length} decks · ${anki.retention}% retention`)}
    <div class="ss-dhead"><span>Deck</span><span>New</span><span>Review</span><span class="ss-dkey"><i class="ss-dnew"></i>new <i class="ss-drev"></i>review</span><span>Due</span></div>
    <ol class="ss-decks">${rows}</ol>
    <div class="ss-dtotal"><span>${n0(anki.cards)} cards read · nothing overdue</span><b>${anki.due} due · about ${anki.min} min</b></div>
  </div>`;
}

function italkiCard(data) {
  const { italki: it, flags } = data;
  const hw = flags.find((f) => f.id === 'homework');
  const initials = it.tutor.split(/\s+/).map((w) => w[0]).join('').replace('.', '');
  const later = it.lessons.slice(1).map((l) => `<li>${ico('calendar')}<span><b>${esc(l.day)}, ${esc(fallback.hm(l.at))}</b><small>${esc(l.tutor)} · ${esc(l.what)} · ${l.mins} min</small></span></li>`).join('');
  return `<aside class="ss-card ss-ital">
    ${cardHead(data, 'italki', 'italki', `${it.lessons.length} lessons booked`)}
    <div class="ss-next">
      <span class="ss-nextk">${ico('video')}Next lesson · ${esc(it.next.day)}</span>
      <b class="ss-nextt">${esc(fallback.hm(it.next.at))}<small> · ${it.next.mins} min</small></b>
      <div class="ss-tutor"><span class="ss-av">${esc(initials)}</span><span><b>${esc(it.tutor)}</b><small>${esc(it.tutorKind)} · ${it.together} lessons together</small></span></div>
    </div>
    <div class="ss-hw">
      <div class="ss-hwh"><span>${ico('pencil')}Homework from ${esc(it.homework.from)}</span><em>${esc(it.homework.status)}</em></div>
      <p>${esc(it.homework.task)}</p>
      <small>Due ${esc(hw.dueText)} · about ${it.homework.min} min</small>
    </div>
    <ul class="ss-later">${later}</ul>
  </aside>`;
}

function planBlock(data) {
  const { plan, copy, counts } = data;
  const segs = plan.map((s, i) => `<span class="ss-pseg ss-pseg--${s.id}" data-p="${i}" style="flex-grow:${s.min}"><i></i></span>`).join('');
  const steps = plan.map((s, i) => `<li class="ss-pstep--${s.id}"><span class="ss-pn">${i + 1}</span>${srcTile(data, s.id, 'ss-plogo')}<span class="ss-pw">${esc(s.what)}</span><b>${s.min} min</b></li>`).join('');
  return `<div class="ss-plan">
    <div class="ss-planh"><span class="ss-plant">${ico('sunrise')}${esc(copy.planHead)}</span><b class="ss-planline">${esc(copy.planLine)}</b><span class="ss-plansum">${plan.length} steps, most urgent first, ${counts.planMin} min in all</span></div>
    <ol class="ss-psteps">${steps}</ol>
    <div class="ss-pbar">${segs}</div>
  </div>`;
}

function panels(data) {
  return `<section class="ss-panels">
  <div class="ss-sech"><h2>By app</h2><span>What each app holds for today, read at ${esc(fallback.hm(data.meta.syncStart))}</span></div>
  <div class="ss-pgrid">
    <div class="ss-slot">
      <div class="ss-panel ss-panel--1">${duoCard(data)}${wkCard(data)}</div>
      <div class="ss-panel ss-panel--2">${ankiCard(data)}</div>
    </div>
    ${italkiCard(data)}
  </div>
  ${planBlock(data)}
</section>`;
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/study-streak';
  return `<footer class="ss-foot"><span>${ico('lock')}${esc(data.copy.foot)}</span><span class="ss-url">${esc(url)}</span></footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(data) +
    hero(data) +
    statTiles(data) +
    flagsBlock(data) +
    panels(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const data = fallback;
  const { meta, accounts, counts } = data;
  const g = syncDone(p);
  const ck = checkDone(p);
  const gw = growDone(p);
  const fl = flagDone(p);
  const out = outDone(p);
  const dk = deckDone(p);
  const pl = planDone(p);
  const nA = accounts.length;

  // the clock runs fast while the apps are read, then at real speed
  const clock = root.querySelector('.ss-clock');
  if (clock) {
    const read = clamp01(p / CHECK_B);
    clock.textContent = clockText(meta.syncStart + meta.syncSecs * read + Math.max(0, p - CHECK_B) * 11.2);
  }
  const fill = root.querySelector('.ss-syncfill');
  if (fill) fill.style.width = pct(100 * (0.7 * g + 0.3 * ck));

  // the sync card: each app's count runs up, then its row checks
  const heroEl = root.querySelector('.ss-hero');
  let done = 0;
  for (const b of root.querySelectorAll('[data-n]')) {
    const i = Number(b.dataset.i) || 0;
    const t = stepDone(g, i, nA);
    b.textContent = n0(Math.round(Number(b.dataset.n) * t));
    if (t >= 0.999) done++;
  }
  if (heroEl) {
    for (let i = 0; i < nA; i++) heroEl.classList.toggle(`is-s${i + 1}`, stepDone(g, i, nA) >= 0.999);
    heroEl.classList.toggle('is-read', g >= 0.999);
    heroEl.classList.toggle('is-checked', ck >= 0.999);
  }
  const count = root.querySelector('.ss-synccount');
  if (count) count.textContent = `${done} of ${nA} apps`;

  // the streak check: each app's segment fills in turn, in its state colour
  let checked = 0;
  for (const s of root.querySelectorAll('.ss-cseg')) {
    const i = Number(s.dataset.c) || 0;
    const t = stepDone(ck, i, nA, 0.34);
    const f = s.querySelector('.ss-cfill');
    if (f) f.style.width = pct(100 * t);
    const lab = s.querySelector('small');
    if (lab) lab.style.opacity = (0.35 + 0.65 * t).toFixed(3);
    if (t >= 0.999) checked++;
  }
  const cn = root.querySelector('.ss-checkn');
  if (cn) cn.textContent = `${checked} of ${nA}`;
  const cr = root.querySelector('.ss-checkr');
  if (cr) cr.style.opacity = ease(clamp01((ck - 0.85) / 0.15)).toFixed(3);

  // the streak card's week: six days of XP grow with the read, today stays empty
  for (const x of root.querySelectorAll('.ss-xpd')) {
    const i = Number(x.dataset.x) || 0;
    const t = stepDone(g, i, 7, 0.5);
    const bar = x.querySelector('i');
    if (bar) bar.style.height = pct(Number(x.dataset.h) * t);
  }

  // today at a glance: the counters ease in; the rank climbs from the bottom of the table
  const e = ease(gw);
  for (const b of root.querySelectorAll('[data-g]')) {
    const target = Number(b.dataset.g);
    const from = Number(b.dataset.from || 0);
    const v = Math.round(from + (target - from) * e);
    b.textContent = `${b.dataset.pre || ''}${n0(v)}${b.dataset.unit ? ' ' + b.dataset.unit : ''}`;
  }
  for (const ex of root.querySelectorAll('.ss-statex')) ex.style.opacity = (0.2 + 0.8 * ease(clamp01((gw - 0.4) / 0.6))).toFixed(3);

  // the flags land one after another, their rings closing on the share of the day left
  for (const li of root.querySelectorAll('.ss-flag')) {
    const i = Number(li.dataset.r) || 0;
    const t = stepDone(fl, i, counts.flags + 1, 0.46);
    li.style.opacity = (0.12 + 0.88 * t).toFixed(3);
    li.style.transform = `translateY(${(10 * (1 - t)).toFixed(2)}px)`;
    const arc = li.querySelector('.ss-farc');
    if (arc) arc.setAttribute('stroke-dasharray', `${(Number(arc.dataset.s) * t).toFixed(2)} 100`);
  }

  // the panels: league bars and the review forecast grow as they arrive
  for (const r of root.querySelectorAll('.ss-lrow')) {
    const i = Number(r.dataset.l) || 0;
    const t = stepDone(out, i, 5, 0.5);
    const bar = r.querySelector('.ss-lbar i');
    if (bar) bar.style.width = pct(Number(bar.dataset.w) * t);
  }
  for (const c of root.querySelectorAll('.ss-fc')) {
    const i = Number(c.dataset.f) || 0;
    const t = stepDone(out, i, 16, 0.4);
    const bar = c.querySelector('i');
    if (bar) bar.style.height = pct(Number(c.dataset.h) * t);
  }
  const srs = root.querySelector('.ss-srs');
  if (srs) srs.style.clipPath = `inset(0 ${(100 * (1 - ease(out))).toFixed(2)}% 0 0 round 4px)`;

  // the decks: due bars grow once the Decks tab shows them
  for (const d of root.querySelectorAll('.ss-deck')) {
    const i = Number(d.dataset.d) || 0;
    const t = stepDone(dk, i, 4, 0.5);
    for (const bar of d.querySelectorAll('.ss-dbar i')) bar.style.width = pct(Number(bar.dataset.w) * t);
  }

  // the plan: each step's share of the morning fills in order
  for (const s of root.querySelectorAll('.ss-pseg')) {
    const i = Number(s.dataset.p) || 0;
    const t = stepDone(pl, i, data.plan.length, 0.4);
    const bar = s.querySelector('i');
    if (bar) bar.style.width = pct(100 * t);
  }
  for (const li of root.querySelectorAll('.ss-psteps li')) {
    const i = [...li.parentNode.children].indexOf(li);
    li.style.opacity = (0.35 + 0.65 * stepDone(pl, i, data.plan.length, 0.4)).toFixed(3);
  }
}
