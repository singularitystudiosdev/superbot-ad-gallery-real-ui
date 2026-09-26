/* site.js - the generated frontend: superbot.app/p/marathon-build, "Training log".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the Nike Pegasus 41 row (the pair already past 400 mi) and
   .is-active on the Shoes tab; both are styled in site.css. The tab click swaps the runs panel for the
   shoes panel through a :has() + sibling rule, so no JS runs on the click. The only clock-driven output is
   render(root, p): the top bar clock, the sync card ticking through the three logs, the merge beat
   (591 pulled collapsing to 388 unique, see SYNC_A/SYNC_B/MERGE_A/MERGE_B), the 8 week block bars growing
   (see GROW_A/GROW_B) and the sync bar, all pure functions of the beat's progress. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/** seconds since midnight -> "7:11:34 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the sync beat inside the browser scene: the three logs are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the duplicate copies collapse from MERGE_A to MERGE_B, both inside
   the first scroll hold in ad.js, so the finished 591 / 203 / 388 card holds on screen before the page
   moves on and stays final for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.14;
const MERGE_A = 0.155;
const MERGE_B = 0.275;
/* the 8 week block belongs to the second hold (ad.js f 0.39 to 0.55, p 0.45 to 0.59): its bars start
   growing the moment it begins to scroll in (f 0.31, p 0.376), finish just after it lands, then hold */
const GROW_A = 0.37;
const GROW_B = 0.47;

/** p -> 0..1 of the sync done */
export function syncDone(p) {
  return ease(clamp01((p - SYNC_A) / (SYNC_B - SYNC_A)));
}
/** p -> 0..1 of the duplicate merge (591 collapsing to 388) */
export function mergeDone(p) {
  return ease(clamp01((p - MERGE_A) / (MERGE_B - MERGE_A)));
}
/** p -> 0..1 of the 8 week block revealed */
export function growDone(p) {
  return ease(clamp01((p - GROW_A) / (GROW_B - GROW_A)));
}

/* ---------- inline icons: paths from the Iconify lucide set, never photos ---------- */
const SVG = {
  'list': '<path d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>',
  'footprints': '<path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0m16 4v-2.38c0-2.12 1.03-3.12 1-5.62c-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0m-4-3h4M4 13h4"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'check': '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  'calendar-days': '<path d="M8 2v3m8-3v3"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/>',
  'trending-up': '<path d="M16 7h6v6"/><path d="m22 7l-8.5 8.5l-5-5L2 17"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'activity': '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
  'triangle-alert': '<path d="m21.73 18l-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3M12 9v4m0 4h.01"/>',
  'merge': '<path d="m8 6l4-4l4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22m16 0l-5-5"/>',
  'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/>',
  'trophy': '<path d="M10 14.66V17a1 1 0 0 1-1 1a2 2 0 0 0-2 2v2m7-7.34V17a1 1 0 0 0 1 1a2 2 0 0 1 2 2v2m.916-12H19.5A2.5 2.5 0 0 0 22 7.5V5a1 1 0 0 0-1-1h-3M4 22h16"/><path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z"/><path d="M6.084 10H4.5A2.5 2.5 0 0 1 2 7.5V5a1 1 0 0 1 1-1h3"/>',
  'flame': '<path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0a5 5 0 0 1 1-3a1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4"/>',
};
const ico = (name, cls = '') =>
  `<svg class="mb-ico ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SVG[name] || ''}</svg>`;

const SHORT = { strava: 'Strava', garmin: 'Garmin', nrc: 'Nike' };
const accOf = (id) => fallback.accounts.find((s) => s.id === id);
const logTag = (id, merged) => {
  const s = accOf(id);
  if (!s) return '';
  return `<span class="mb-ltag mb-ltag--${esc(id)}${merged ? ' mb-ltag--merged' : ''}"><img src="${esc(s.logo)}" alt=""/>${esc(SHORT[id])}</span>`;
};
const shoeOf = (key) => fallback.shoes.find((s) => s.key === key);

/* ---------- top bar (sticky, carries the tab the kit clicks) ---------- */
function topBar(data) {
  return `<header class="mb-top">
  <div class="mb-topin">
    <div class="mb-brand"><img class="mb-brandico" src="./brand/app.svg" alt=""/><b>Training log</b><span class="mb-by">by Superbot</span></div>
    <nav class="mb-tabs">
      <span class="mb-tab mb-tab--1">${ico('list')}Runs<i>${data.counts.runs}</i></span>
      <span class="mb-tab mb-tab--2">${ico('footprints')}Shoes<i>${data.counts.shoes}</i></span>
    </nav>
    <div class="mb-status">
      <span class="mb-logs">${data.accounts.map((s) => `<img src="${esc(s.logo)}" alt=""/>`).join('')}${ico('lock')}Read-only</span>
      <span class="mb-live"><i class="mb-dot"></i><span class="mb-clock">${clockText(data.meta.syncStart)}</span></span>
    </div>
  </div>
  <div class="mb-syncbar"><i class="mb-syncfill"></i></div>
</header>`;
}

/* ---------- hero: the running photo, the headline, the sync card, the race card ---------- */
function syncCard(data) {
  const ticks = [
    { k: 's1', id: 'strava', label: 'Strava signed in', count: data.accounts[0].pulled },
    { k: 's2', id: 'garmin', label: 'Garmin Connect signed in', count: data.accounts[1].pulled },
    { k: 's3', id: 'nrc', label: 'Nike Run Club signed in', count: data.accounts[2].pulled },
    { k: 's4', id: 'gear', label: 'Shoe gear and duplicates', count: data.counts.shoes },
  ]
    .map(
      (x) => `<li class="mb-tick mb-tick--${x.k}"><img src="${esc(x.id === 'gear' ? './brand/shoe.svg' : accOf(x.id).logo)}" alt=""/><span>${esc(x.label)}</span><b data-n="${x.count}">0</b><i class="mb-tickok">${ico('check')}</i></li>`,
    )
    .join('');
  const dupPct = (data.counts.dupes / data.counts.pulled) * 100;
  return `<article class="mb-sync">
  <div class="mb-synchead">
    <p class="mb-syncnow">${ico('refresh-cw')}<span>Reading your runs</span><b class="mb-synccount">0 of ${n0(data.counts.pulled)} runs</b></p>
    <p class="mb-stamp">${ico('check')}Synced ${n0(data.counts.pulled)} runs from 3 logs in ${data.meta.syncSecs} s · ${esc(data.meta.synced)}</p>
  </div>
  <ul class="mb-ticks">${ticks}</ul>
  <div class="mb-merge">
    <div class="mb-mbar" data-dup="${dupPct.toFixed(2)}">
      <i class="mb-mun"></i><i class="mb-mdup"></i>
    </div>
    <div class="mb-mrow">
      <span class="mb-mk"><b class="mb-pulled">0</b><span>runs pulled</span></span>
      <span class="mb-mk mb-mk--dup"><b class="mb-dupnow">0</b><span>the same run twice</span></span>
      <span class="mb-mk mb-mk--uniq"><b class="mb-uniqnow">0</b><span>unique runs</span></span>
    </div>
  </div>
</article>`;
}

function raceCard(data) {
  const r = data.race;
  const taper = data.weeks[data.weeks.length - 1];
  const share = Math.round((taper.mi / data.block.peakMi) * 100);
  return `<aside class="mb-race">
  <p class="mb-racek">${ico('map-pin')}${esc(r.city)}</p>
  <h2>${esc(r.name)}</h2>
  <p class="mb-raceday">${ico('calendar-days')}${esc(r.day)} · ${esc(r.start)} start</p>
  <ul class="mb-racefacts">
    <li><small>Bib</small><b>${esc(r.bib)}</b></li>
    <li><small>Corral</small><b>${esc(r.corral)}</b></li>
    <li><small>Goal</small><b>${esc(r.goal)}</b></li>
    <li><small>Goal pace</small><b>${esc(r.goalPace.replace(' /mi', ''))}</b></li>
  </ul>
  <div class="mb-taper">
    <p class="mb-taperh">${ico('trending-up')}Taper, week 8</p>
    <div class="mb-taperrow"><span><b>${taper.mi} mi</b>this week</span><span><b>${taper.runs} runs</b>left</span><span><b>${taper.long} mi</b>longest</span></div>
    <div class="mb-taperbar"><i style="width:${pct(share)}"></i></div>
    <p class="mb-tapern">${share}% of peak week ${data.block.peakMi} mi. ${ico('clock')}Race ${esc(r.countdown.toLowerCase())}.</p>
  </div>
</aside>`;
}

function hero(data) {
  return `<section class="mb-hero">
  <img class="mb-herobg" src="./img/hero.jpg" alt=""/>
  <div class="mb-heroin">
    <div class="mb-herotext">
      <p class="mb-kicker">${ico('activity')}${esc(data.copy.kicker)}</p>
      <h1>${esc(data.copy.heroH1)}</h1>
      <p class="mb-dek">${esc(data.copy.heroDek)}</p>
      ${syncCard(data)}
      <ul class="mb-stats">
        <li><b>${n0(data.counts.runs)}</b><span>unique runs, merged</span></li>
        <li><b>${n0(data.counts.miles)}</b><span>mi in 12 months</span></li>
        <li class="mb-stat--flag"><b>${data.counts.flagged}</b><span>pairs past 400 mi</span></li>
        <li class="mb-stat--race"><b>${data.race.daysTo} day</b><span>to ${esc(data.race.name)}</span></li>
      </ul>
    </div>
    ${raceCard(data)}
  </div>
</section>`;
}

/* ---------- the three logs, side by side, with what each one contributed after the merge ---------- */
function accStrip(data) {
  const cards = data.accounts
    .map((s) => {
      const dupes = s.pulled - s.kept;
      const note = dupes > 0 ? `${n0(dupes)} already logged elsewhere · ${s.kept} new` : `the log the other two sync into · ${s.kept} runs kept`;
      return `<li class="mb-acc mb-acc--${esc(s.id)}">
      <img src="${esc(s.logo)}" alt=""/>
      <span class="mb-acc-t"><small>${esc(s.name)}</small><b>${esc(s.handle)}</b></span>
      <span class="mb-acc-v"><b>${s.pulled} runs pulled</b><small>${esc(note)} · ${n0(s.mi)} mi</small></span>
      <span class="mb-acc-ok">${ico('check')}Synced</span>
    </li>`;
    })
    .join('');
  return `<section class="mb-accs"><ul class="mb-acclist">${cards}</ul></section>`;
}

/* ---------- the 8 week block: weekly mileage bars, the long run on the same scale, the taper ---------- */
const CHART_H = 160; // css px the tallest bar fills
function blockSection(data) {
  const peak = data.block.peakMi;
  const cols = data.weeks
    .map((w, i) => `<li class="mb-wcol mb-wcol--${i + 1}">
      <b class="mb-wmi" data-w="${w.mi}">0</b>
      <i class="mb-wbar" data-h="${((w.mi / peak) * 100).toFixed(1)}"></i>
      <i class="mb-wdot" style="left:50%;top:${(100 - (w.long / peak) * 100).toFixed(1)}%"></i>
    </li>`,
    )
    .join('');
  // the long-run line on the bar scale, one point per column centre
  const pts = data.weeks
    .map((w, i) => `${(((i + 0.5) / data.weeks.length) * 100).toFixed(1)},${(100 - (w.long / peak) * 100).toFixed(1)}`)
    .join(' ');
  const labels = data.weeks
    .map((w, i) => `<li class="mb-wlab"><b>W${i + 1}</b><small>${esc(w.dates.split(' to ')[0].replace(/^[A-Za-z]{3}, /, ''))}</small><em>${w.runs} runs</em></li>`)
    .join('');
  return `<section class="mb-block">
  <div class="mb-sech"><h2>${esc(data.copy.blockH)}</h2><span>${esc(data.copy.blockDek)}</span></div>
  <div class="mb-chart">
    <div class="mb-chartin" style="height:${CHART_H}px">
      <ul class="mb-wcols">${cols}</ul>
      <svg class="mb-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline class="mb-longline" points="${pts}"/>
      </svg>
    </div>
    <ul class="mb-wlabs">${labels}</ul>
    <p class="mb-legend"><span><i class="mb-k-wk"></i>Week total</span><span><i class="mb-k-long"></i>Long run, same scale</span><span><i class="mb-k-taper"></i>Race week</span></p>
  </div>
  <ul class="mb-bstats">
    <li><b data-w="${data.block.mi}">0</b><span>mi in the block</span></li>
    <li><b data-w="${data.block.runs}">0</b><span>runs in 8 weeks</span></li>
    <li><b data-w="${peak}">0</b><span>peak week, week 6</span></li>
    <li><b>${data.block.longMi.toFixed(1)}</b><span>longest run, mi</span></li>
    <li><b>${esc(data.copy.blockPace)}</b><span>average easy pace</span></li>
    <li><b>50 h 18 m</b><span>time on feet</span></li>
  </ul>
  <p class="mb-note">${ico('info')}<span>${esc(data.race.name)}, ${esc(data.race.day)}. Week 4 was the cutback at ${data.weeks[3].mi} mi and week 6 the peak at ${peak} mi; week 8 is race week, cut to ${data.weeks[7].mi} mi with the long run down to ${data.weeks[7].long} mi.</span></p>
</section>`;
}

/* ---------- runs that arrived twice under two logs, merged into one row each ---------- */
function dupesSection(data) {
  const rows = data.merged
    .map(
      (r) => `<li class="mb-m">
      <span class="mb-mname"><b>${esc(r.title)}</b><small>${esc(r.date)} · ${esc(r.miText)}</small></span>
      <span class="mb-mtags">${r.tags.map((t) => logTag(t, true)).join('')}</span>
      <span class="mb-mok">${ico('merge')}</span>
    </li>`,
    )
    .join('');
  const rest = data.counts.dupes - data.merged.length;
  const dupesOf = (id) => { const a = accOf(id); return a ? a.pulled - a.kept : 0; };
  const g = accOf('garmin');
  const n = accOf('nrc');
  return `<section class="mb-drift">
  <div class="mb-sech"><h2>${esc(data.copy.dupesH)}</h2><span>${esc(data.copy.dupesDek)}</span></div>
  <ul class="mb-mlist">${rows}</ul>
  <p class="mb-note">${ico('info')}<span>${dupesOf('garmin')} of ${g ? g.name : 'Garmin Connect'}'s ${g ? g.pulled : 241} runs were already in Strava and ${dupesOf('nrc')} ${n ? n.name : 'Nike Run Club'} runs were logged twice as well: ${rest} more merged the same way, ${n0(data.counts.pulled)} entries in, ${n0(data.counts.runs)} runs out.</span></p>
</section>`;
}

/* ---------- panel 1: the run log, 10 newest unique runs (the merged copies are gone) ---------- */
const SHOWN = 10;
function runsPanel(data) {
  const rows = data.runs
    .slice(0, SHOWN)
    .map((r) => {
      const shoe = r.shoe ? shoeOf(r.shoe) : null;
      return `<div class="mb-rrow mb-rrow--${r.rank}">
      <span class="mb-rdate">${esc(r.date)}</span>
      <span class="mb-rname"><b>${esc(r.title)}</b><small>${r.tags.length > 1 ? `logged in ${r.tags.length} apps, merged` : 'logged in one app'}</small></span>
      <span class="mb-rnum">${esc(r.miText)}</span>
      <span class="mb-rnum">${esc(r.pace)}</span>
      <span class="mb-rnum">${esc(r.time)}</span>
      <span class="mb-rtags">${r.tags.map((t) => logTag(t, r.tags.length > 1)).join('')}</span>
      <span class="mb-rshoe">${shoe ? `<img src="./brand/shoe.svg" alt=""/>${esc(shoe.name.replace(/^(Nike|Hoka|Saucony|Brooks) /, ''))}` : '<em>No gear set</em>'}</span>
    </div>`;
    })
    .join('');
  const rest = data.counts.runs - SHOWN;
  return `<div class="mb-panel mb-panel--1">
  <div class="mb-sech"><h2>${esc(data.copy.runsH)}</h2><span>${esc(data.copy.runsDek)}</span></div>
  <div class="mb-table">
    <div class="mb-rrow mb-rrow--h"><span>Date</span><span>Run</span><span>Distance</span><span>Pace</span><span>Time</span><span>Logged in</span><span>Shoe</span></div>
    ${rows}
    <div class="mb-more">${ico('list')}${n0(rest)} more runs in the log, ${data.meta.window} · ${data.counts.gearlessRuns} of the ${n0(data.counts.runs)} have no gear tag</div>
  </div>
</div>`;
}

/* ---------- panel 2: the shoes, miles to date, the 400 mi line and the Replace flag ---------- */
function shoesPanel(data) {
  const rows = data.shoes
    .map(
      (s) => `<div class="mb-erow mb-erow--${esc(s.key)}${s.past ? ' mb-erow--past' : ''}">
      <span class="mb-ename"><img src="./brand/shoe.svg" alt=""/><span><b>${esc(s.name)}</b><small>${esc(s.role)}</small></span></span>
      <span class="mb-esince">${esc(s.since)}</span>
      <span class="mb-emi">${s.mi} mi</span>
      <span class="mb-etrack">
        <i class="mb-efill" style="width:${pct(s.pct)}"></i>
        <i class="mb-elim" style="left:${pct(s.limitPct)}"></i>
        <em class="mb-elabel" style="left:${pct(s.limitPct)}">400</em>
      </span>
      <span class="mb-elast">${esc(s.last)}</span>
      <span class="mb-echip ${s.past ? 'mb-echip--bad' : 'mb-echip--ok'}">${s.past ? ico('triangle-alert') + 'Replace' : ico('check') + 'OK'}</span>
      ${s.past ? `<em class="mb-erow-note">${ico('triangle-alert')}Past ${s.limit} mi. Flagged in Superbot's view only, nothing in your gear list was changed.</em>` : ''}
    </div>`,
    )
    .join('');
  return `<div class="mb-panel mb-panel--2">
  <div class="mb-sech"><h2>${esc(data.copy.shoesH)}</h2><span>${esc(data.copy.shoesDek)}</span></div>
  <div class="mb-table">
    <div class="mb-erow mb-erow--h"><span>Shoe</span><span>Since</span><span>Miles</span><span>Mileage against 400 mi</span><span>Last run</span><span>Status</span></div>
    ${rows}
    <div class="mb-more">${ico('info')}${data.shoeGap.runs} runs (${esc(data.shoeGap.miText)}) came in with no gear tag, so those miles are on no pair above</div>
  </div>
  <p class="mb-shoesum">${ico('triangle-alert')}<span>${data.counts.flagged} pairs past ${data.shoes[0].limit} mi, flagged to replace before the next block. The Vaporfly 3 is the race shoe, saved for ${esc(data.race.day)}.</span></p>
</div>`;
}

/* ---------- what keeps running after the sync ---------- */
function watchSection(data) {
  const cards = data.watch
    .map(
      (w) => `<li class="mb-w">
      <span class="mb-wi">${ico(w.icon)}</span>
      <span class="mb-wt"><small>${esc(w.k)}</small><b>${esc(w.v)}</b><em>${esc(w.note)}</em></span>
    </li>`,
    )
    .join('');
  return `<section class="mb-watch">
  <div class="mb-sech"><h2>${esc(data.copy.watchH)}</h2><span>${esc(data.copy.watchDek)}</span></div>
  <ul class="mb-wlist">${cards}</ul>
</section>`;
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/marathon-build';
  return `<footer class="mb-foot"><span>${ico('lock')}Read-only access. Nothing changed in Strava, Garmin Connect or Nike Run Club. Made by Superbot for ${esc(data.meta.user)}</span><span>${esc(url)}</span></footer>`;
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(data) +
    hero(data) +
    accStrip(data) +
    blockSection(data) +
    dupesSection(data) +
    '<section class="mb-panels">' +
      runsPanel(data) +
      shoesPanel(data) +
    '</section>' +
    watchSection(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

/* clock hook: the top bar clock, the sync card, the merge beat, the block bars and the counts, all p */
export function render(root, p) {
  if (!root || !root.querySelector) return;
  const t = clamp01(Number(p) || 0);
  const m = fallback.meta;
  const g = syncDone(t);
  const mg = mergeDone(t);
  const gw = growDone(t);
  const clock = root.querySelector('.mb-clock');
  if (clock) clock.textContent = clockText(m.syncStart + g * m.syncSecs + Math.max(0, t - SYNC_B) * 30);
  const count = root.querySelector('.mb-synccount');
  if (count) count.textContent = `${n0(Math.round(fallback.counts.pulled * g))} of ${n0(fallback.counts.pulled)} runs`;
  const heroEl = root.querySelector('.mb-hero');
  if (heroEl) {
    heroEl.classList.toggle('is-s1', g > 0.08);
    heroEl.classList.toggle('is-s2', g > 0.3);
    heroEl.classList.toggle('is-s3', g > 0.52);
    heroEl.classList.toggle('is-s4', g >= 0.999);
    heroEl.classList.toggle('is-m1', mg > 0.06);
    heroEl.classList.toggle('is-m2', mg >= 0.999);
  }
  for (const b of root.querySelectorAll('[data-n]')) b.textContent = n0(Math.round(Number(b.dataset.n) * g));
  for (const b of root.querySelectorAll('[data-w]')) b.textContent = n0(Math.round(Number(b.dataset.w) * gw));
  // the merge beat: 591 pulled, 203 of them the same run twice, 388 left. The bar loses the amber band as
  // the duplicates go and the mint run of unique runs takes the whole width.
  const bar = root.querySelector('.mb-mbar');
  if (bar) {
    const dup = Number(bar.dataset.dup) || 0;
    const mun = bar.querySelector('.mb-mun');
    const mdup = bar.querySelector('.mb-mdup');
    if (mun) mun.style.width = pct(g * (100 - dup + dup * mg));
    if (mdup) mdup.style.width = pct(g * dup * (1 - mg));
    bar.classList.toggle('is-merged', mg >= 0.999);
  }
  const pulled = root.querySelector('.mb-pulled');
  if (pulled) pulled.textContent = n0(Math.round(fallback.counts.pulled * g));
  const dupnow = root.querySelector('.mb-dupnow');
  if (dupnow) dupnow.textContent = n0(Math.round(fallback.counts.dupes * mg));
  const uniqnow = root.querySelector('.mb-uniqnow');
  if (uniqnow) uniqnow.textContent = n0(Math.round(fallback.counts.pulled * g - fallback.counts.dupes * mg));
  // the 8 week block: bars grow to their week's share of the peak week, and the long-run line fades in with
  // its dots (a pathLength dash reveal does not survive vector-effect: non-scaling-stroke in Chrome)
  const line = root.querySelector('.mb-longline');
  if (line) line.style.opacity = gw.toFixed(3);
  for (const d of root.querySelectorAll('.mb-wdot')) d.style.opacity = gw.toFixed(3);
  for (const b of root.querySelectorAll('.mb-wbar')) b.style.height = pct(Number(b.dataset.h) * gw);
  const fill = root.querySelector('.mb-syncfill');
  if (fill) fill.style.width = pct((0.55 * g + 0.45 * mg) * 100);
}

export { build };