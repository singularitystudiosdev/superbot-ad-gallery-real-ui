/* site.js - the generated frontend: superbot.app/p/job-pipeline, "Job pipeline".
   Pure and idempotent: no timers, no rAF, no network, no element ids, no document listeners, no CSS
   animations. The kit toggles .is-hover on the merge counters, the Interview invites tile, the Lumen Pay
   card and the "Senior Backend Engineer, Ledger" new-role row, and .is-active on the New roles tab; all are
   styled in site.css. The tab click swaps the pipeline for the new roles panel through a :has() + sibling
   rule, so no JS runs on the click. The only clock-driven output is render(root, p): the top bar clock, the
   sync card ticking through the six sources, the merge beat (682 pulled collapsing to 66 pipeline rows, see
   SYNC_A/SYNC_B/MERGE_A/MERGE_B), the four status counters easing in (GROW_A/GROW_B), the nine company cards
   settling (ROOM_A/ROOM_B) and the sync bar, all pure functions of the beat's progress.
   Read-only: every word the page prints says what Superbot found, never that it sent or changed anything. */

import * as fallback from './data.js';

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const n0 = (n) => Number(n).toLocaleString('en-US');
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => x * x * (3 - 2 * x);
const pct = (x) => x.toFixed(2) + '%';

/** seconds since midnight -> "9:11:38 AM", the clock the top bar prints */
export function clockText(seconds) {
  const s = Math.max(0, Math.round(seconds)) % 86400;
  const h = Math.floor(s / 3600);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)} ${h < 12 ? 'AM' : 'PM'}`;
}

/* the sync beat inside the browser scene: the six sources are read from SYNC_A to SYNC_B of p (while the
   page grows out of the hub card) and the emails thread onto their applications and the old or off-target
   roles drop out from MERGE_A to MERGE_B, both inside the first scroll hold in ad.js (f 0.13 to 0.3, p 0.213
   to 0.367), so the finished 682 / 616 / 66 card holds on screen before the page moves on and stays final
   for the rest of the spot */
const SYNC_A = 0;
const SYNC_B = 0.15;
const MERGE_A = 0.165;
const MERGE_B = 0.285;
/* the status strip is the second hold (ad.js f 0.355 to 0.52, p 0.416 to 0.566): its counters start easing in
   as it scrolls up (from f 0.3, p 0.367), finish at 6 / 9 / 17 / 20 just after it lands (f 0.38) and then
   hold settled about 1.3 s before the scroll leaves */
const GROW_A = 0.36;
const GROW_B = 0.44;
/* the company grid is the third hold (f 0.575 to 0.66, p 0.615 to 0.692): the nine cards settle in turn while
   it scrolls in (from f 0.52, p 0.566) and are all still by the time it lands (f 0.575, p 0.615) */
const ROOM_A = 0.535;
const ROOM_B = 0.61;

export function syncDone(p) {
  return clamp01((p - SYNC_A) / (SYNC_B - SYNC_A));
}

export function mergeDone(p) {
  return clamp01((p - MERGE_A) / (MERGE_B - MERGE_A));
}

export function growDone(p) {
  return clamp01((p - GROW_A) / (GROW_B - GROW_A));
}

export function roomDone(p) {
  return clamp01((p - ROOM_A) / (ROOM_B - ROOM_A));
}

/* the sync card: tick i counts from 0 to its number over its own window, so the six sources land one after
   another and the seventh tick (the pipeline) closes the card at g = 1 */
const TICK_STEP = 0.7 / 6;
const TICK_LEN = 0.3;
const tickDone = (g, i) => ease(clamp01((g - i * TICK_STEP) / TICK_LEN));

/* lucide icons (ISC), inlined as path data */
const ICONS = {
  list: '<path d="M3 5h.01M3 12h.01M3 19h.01M8 5h13M8 12h13M8 19h13"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  check: '<path d="M20 6L9 17l-5-5"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9a9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5m5 4a9 9 0 0 1-9 9a9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'map-pin': '<path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
  building: '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18zm0-10H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m12-13h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4m-4 4h4m-4 4h4m-4 4h4"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  sparkles: '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4m2-2h-4"/>',
  'calendar-check': '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M9 16l2 2l4-4"/>',
  'calendar-days': '<path d="M8 2v4m8-4v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
  'message-square-text': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7m10 4H7"/>',
  'circle-x': '<circle cx="12" cy="12" r="10"/><path d="m15 9l-6 6m0-6l6 6"/>',
  hourglass: '<path d="M5 22h14M5 2h14m-2 20v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11zm7.318-19.539l-10.94 10.939"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  'external-link': '<path d="M15 3h6v6m-11 5L21 3m-3 10v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  merge: '<path d="m8 6l4-4l4 4"/><path d="M12 2v10.3a4 4 0 0 1-1.172 2.872L4 22m16 0l-5-5"/>',
  'shield-check': '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12l2 2l4-4"/>',
  'circle-check': '<circle cx="12" cy="12" r="10"/><path d="m16 9l-5.5 5.5L8 12"/>',
};

const ico = (name) =>
  `<svg class="jh-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;

const accOf = (data, id) => data.accounts.find((a) => a.id === id) || data.accounts[0];

/* an app tag: the app's mark plus its short name */
const appTag = (data, id) => {
  const a = accOf(data, id);
  return `<span class="jh-ltag"><img src="${esc(a.logo)}" alt="">${esc(a.short)}</span>`;
};

/* the four application statuses and the words and icons they print with */
const KIND = {
  interview: { icon: 'calendar-check', word: 'Interviewing' },
  replied: { icon: 'message-square-text', word: 'Recruiter replied' },
  rejected: { icon: 'circle-x', word: 'Rejected' },
  waiting: { icon: 'hourglass', word: 'No reply yet' },
};

function topBar(data) {
  const { counts, meta, accounts } = data;
  // Lever and Ashby share the neutral board mark, so it is printed once
  const logos = accounts.filter((a, i) => accounts.findIndex((b) => b.logo === a.logo) === i);
  return (
    '<header class="jh-top">' +
      '<div class="jh-topin">' +
        '<span class="jh-brand"><img class="jh-brandico" src="./brand/app.svg" alt=""><b>Job pipeline</b><span class="jh-by">by Superbot</span></span>' +
        '<nav class="jh-tabs">' +
          `<span class="jh-tab jh-tab--1">${ico('list')}Pipeline <i>${n0(counts.applications)}</i></span>` +
          `<span class="jh-tab jh-tab--2">${ico('sparkles')}New roles <i>${n0(counts.newRoles)}</i></span>` +
        '</nav>' +
        '<div class="jh-status">' +
          '<span class="jh-logs">' +
            logos.map((a) => `<img src="${esc(a.logo)}" alt="">`).join('') +
            `${ico('lock')}Read-only` +
          '</span>' +
          `<span class="jh-live"><span class="jh-dot"></span><span class="jh-clock">${esc(clockText(meta.syncStart))}</span></span>` +
        '</div>' +
      '</div>' +
      '<div class="jh-syncbar"><span class="jh-syncfill"></span></div>' +
    '</header>'
  );
}

function syncCard(data) {
  const { accounts, counts, meta } = data;
  const ticks = accounts.map((a, i) =>
    `<li class="jh-tick jh-tick--s${i + 1}"><img src="${esc(a.logo)}" alt=""><span>${esc(a.short)}</span>` +
      `<b data-n="${a.pulled}" data-i="${i}">0</b><span class="jh-tickok">${ico('check')}</span></li>`,
  );
  const last = accounts.length;
  ticks.push(
    `<li class="jh-tick jh-tick--s${last + 1} jh-tick--rooms"><span class="jh-tickico">${ico('briefcase')}</span><span>Built one pipeline: applications, replies, new roles</span>` +
      `<b data-n="${counts.rows}" data-i="${last}">0</b><span class="jh-tickok">${ico('check')}</span></li>`,
  );
  return (
    '<div class="jh-sync">' +
      '<div class="jh-synchead">' +
        `<span class="jh-syncnow">${ico('refresh-cw')}Reading ${counts.accounts} sources, read-only<span class="jh-synccount">0 of ${n0(counts.pulled)} entries</span></span>` +
        `<span class="jh-stamp">${ico('circle-check')}Synced ${esc(meta.day)}, ${esc(meta.synced)}. Nothing sent or changed.</span>` +
      '</div>' +
      `<ul class="jh-ticks">${ticks.join('')}</ul>` +
      '<div class="jh-merge">' +
        '<div class="jh-mbar"><span class="jh-mun"></span><span class="jh-mdup"></span></div>' +
        '<div class="jh-mrow">' +
          `<span class="jh-mk"><b class="jh-pulled">${n0(counts.pulled)}</b>entries pulled</span>` +
          `<span class="jh-mk jh-mk--dup"><b class="jh-dupnow">0</b>threaded or filtered out</span>` +
          `<span class="jh-mk jh-mk--uniq"><b class="jh-uniqnow">${n0(counts.pulled)}</b>pipeline rows</span>` +
        '</div>' +
      '</div>' +
    '</div>'
  );
}

function homeCard(data) {
  const { meta, counts } = data;
  const heardPct = (counts.heard / counts.applications) * 100;
  return (
    '<aside class="jh-home">' +
      `<span class="jh-homek">${ico('map-pin')}${esc(meta.city)}</span>` +
      `<h2>${esc(meta.person)}</h2>` +
      `<p class="jh-homeday">${ico('briefcase')}${esc(meta.target)} search</p>` +
      '<ul class="jh-homefacts">' +
        `<li><small>Applications</small><b>${n0(counts.applications)}</b></li>` +
        `<li><small>Target companies</small><b>${n0(counts.boards)}</b></li>` +
        `<li><small>Interviews</small><b>${n0(counts.interview)}</b></li>` +
        `<li><small>Window</small><b>${n0(meta.windowDays)} days</b></li>` +
      '</ul>' +
      '<div class="jh-health">' +
        `<div class="jh-healthh">${ico('shield-check')}Response check</div>` +
        '<div class="jh-healthrow">' +
          `<span><b>${n0(counts.heard)}</b>heard back</span>` +
          `<span class="jh-hr--bad"><b>${n0(counts.waiting)}</b>no reply yet</span>` +
          `<span class="jh-hr--interview"><b>${n0(counts.interview)}</b>interviews</span>` +
        '</div>' +
        `<div class="jh-healthbar"><i style="width:${pct(heardPct)}"></i></div>` +
        `<p class="jh-healthn">${ico('lock')}Read-only. No application, message or profile was changed.</p>` +
      '</div>' +
    '</aside>'
  );
}

function hero(data) {
  const { copy, counts } = data;
  return (
    '<section class="jh-hero">' +
      '<img class="jh-herobg" src="./img/hero.jpg" alt="">' +
      '<div class="jh-heroin">' +
        '<div class="jh-herot">' +
          `<span class="jh-kicker">${ico('briefcase')}${esc(copy.kicker)}</span>` +
          `<h1>${esc(copy.heroH1)}</h1>` +
          `<p class="jh-dek">${esc(copy.heroDek)}</p>` +
          syncCard(data) +
          '<ul class="jh-stats">' +
            `<li><b>${n0(counts.applications)}</b><span>applications</span></li>` +
            `<li><b>${n0(counts.heard)}</b><span>heard back</span></li>` +
            `<li class="jh-stat--iv"><b>${n0(counts.interview)}</b><span>interviews booked</span></li>` +
            `<li class="jh-stat--ok"><b>${n0(counts.newRoles)}</b><span>new senior roles</span></li>` +
          '</ul>' +
        '</div>' +
        homeCard(data) +
      '</div>' +
    '</section>'
  );
}

/* the six sources: what each listed, and what survived as a pipeline row */
function accStrip(data) {
  const { accounts } = data;
  return (
    '<section class="jh-accs"><ul class="jh-acclist">' +
      accounts.map((a) => {
        const note = a.note;
        return (
          `<li class="jh-acc jh-acc--${esc(a.id)}">` +
            `<img src="${esc(a.logo)}" alt="">` +
            `<span class="jh-acc-t"><b>${esc(a.name)}</b><small>${esc(a.handle)}</small></span>` +
            `<span class="jh-acc-v"><b>${n0(a.pulled)}</b><small>${esc(a.what)} read, <em>${n0(a.kept)} kept</em></small></span>` +
            `<span class="jh-acc-n">${esc(note)}</span>` +
            `<span class="jh-acc-ok">${ico('check')}</span>` +
          '</li>'
        );
      }).join('') +
    '</ul></section>'
  );
}

function flagsSection(data) {
  const { flags, copy } = data;
  return (
    '<section class="jh-flags">' +
      `<div class="jh-sech"><h2>${esc(copy.flagsH)}</h2><span>${esc(copy.flagsDek)}</span></div>` +
      '<ul class="jh-flaglist">' +
        flags.map((f) =>
          `<li class="jh-flag jh-flag--${esc(f.kind)}">` +
            '<div class="jh-flagh">' +
              `<span class="jh-flagi">${ico(f.icon)}</span>` +
              `<span class="jh-flagt"><b>${esc(f.label)}</b><small>${esc(f.rule)}</small></span>` +
              `<b class="jh-flagn" data-g="${f.n}">${n0(f.n)}</b>` +
            '</div>' +
            '<ul class="jh-flagex">' +
              f.examples.map((e, j) => `<li data-j="${j}"><span>${esc(e.name)}</span><b>${esc(e.v)}</b></li>`).join('') +
            '</ul>' +
            `<span class="jh-flagmore">${f.n > f.examples.length ? `and ${n0(f.n - f.examples.length)} more` : 'That is all of them'}</span>` +
          '</li>',
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

/* the target companies whose boards posted a new senior backend role, with where your application there stands */
function roomsSection(data) {
  const { companies, copy } = data;
  const chip = (kind) =>
    kind
      ? `<span class="jh-chip jh-chip--${kind}"><i></i><em>${KIND[kind].word}</em></span>`
      : `<span class="jh-chip jh-chip--ok">${ico('sparkles')}<em>Not applied yet</em></span>`;
  return (
    '<section class="jh-rooms">' +
      `<div class="jh-sech"><h2>${esc(copy.roomsH)}</h2><span>${esc(copy.roomsDek)}</span></div>` +
      '<ul class="jh-roomlist">' +
        companies.map((c, i) => {
          return (
            `<li class="jh-room jh-room--${esc(c.key)}" data-r="${i}">` +
              '<div class="jh-roomh">' +
                `<span class="jh-roomi">${ico('building')}</span>` +
                `<span class="jh-roomt"><b>${esc(c.name)}</b><small>${esc(c.what)}</small></span>` +
                `<span class="jh-roomn"><b>${n0(c.newRoles)}</b><small>new ${c.newRoles === 1 ? 'role' : 'roles'}</small></span>` +
              '</div>' +
              '<div class="jh-roomf">' +
                `<span class="jh-roomapps"><img src="${esc(accOf(data, c.ats).logo)}" alt=""></span>` +
                `<span class="jh-chips">${chip(c.you)}<span class="jh-chip jh-chip--open"><b>${n0(c.openRoles)}</b><em>open</em></span></span>` +
              '</div>' +
            '</li>'
          );
        }).join('') +
      '</ul>' +
    '</section>'
  );
}

/* the pipeline: one row per application, every place it was found, its latest status and the next step */
function pipelinePanel(data) {
  const { pipeline, counts, copy } = data;
  return (
    '<div class="jh-panel jh-panel--1">' +
      `<div class="jh-sech"><h2>${esc(copy.devicesH)}</h2><span>${esc(copy.devicesDek)}</span></div>` +
      '<div class="jh-table">' +
        '<div class="jh-drow jh-drow--h"><span>Company and role</span><span>Applied</span><span>Found in</span><span>Status</span><span>Next step</span></div>' +
        pipeline.map((d) =>
          `<div class="jh-drow jh-drow--${esc(d.key)}${d.apps.length > 1 ? ' jh-drow--merged' : ''}">` +
            `<span class="jh-dname"><img src="./brand/role.svg" alt=""><span><b>${esc(d.company)}</b><small>${esc(d.role)} · ${esc(d.where)}</small></span></span>` +
            `<span class="jh-dbat">${esc(d.applied)}</span>` +
            `<span class="jh-rtags">${d.apps.map((id) => appTag(data, id)).join('')}</span>` +
            `<span class="jh-dstat"><span class="jh-echip jh-echip--${esc(d.status)}">${ico(KIND[d.status].icon)}${esc(d.statusText)}</span></span>` +
            `<span class="jh-droom">${esc(d.next)}</span>` +
          '</div>',
        ).join('') +
        `<div class="jh-more">${ico('merge')}${n0(counts.applications - pipeline.length)} more applications in the pipeline. ${n0(counts.threaded)} recruiter emails threaded onto the application they answer.</div>` +
      '</div>' +
    '</div>'
  );
}

/* the new roles: posted on a target board since the last check, newest first, with the link and a next step */
function rolesPanel(data) {
  const { newRoles, counts, copy } = data;
  return (
    '<div class="jh-panel jh-panel--2">' +
      `<div class="jh-sech"><h2>${esc(copy.autosH)}</h2><span>${esc(copy.autosDek)}</span></div>` +
      '<div class="jh-table">' +
        '<div class="jh-arow jh-arow--h"><span>Role</span><span>Board</span><span>Posted</span><span>Link</span><span>Next step</span></div>' +
        newRoles.map((r) =>
          `<div class="jh-arow jh-arow--${esc(r.key)}${r.note ? ' jh-arow--hot' : ''}">` +
            `<span class="jh-aname"><b>${esc(r.role)}</b><small>${esc(r.company)}</small></span>` +
            `<span class="jh-aapp">${appTag(data, r.ats)}</span>` +
            `<span class="jh-alast">${esc(r.posted)} <em>${esc(r.ago)}</em></span>` +
            `<span class="jh-alink">${ico('external-link')}<span>${esc(r.link)}</span></span>` +
            `<span class="jh-anext">${esc(r.next)}</span>` +
            (r.note ? `<span class="jh-arow-note">${ico('calendar-check')}${esc(r.note)}</span>` : '') +
          '</div>',
        ).join('') +
        `<div class="jh-more">${ico('sparkles')}${n0(counts.newRoles - newRoles.length)} more new roles. ${n0(counts.openRoles - counts.newRoles)} open roles on your boards were already listed or are not senior backend.</div>` +
      '</div>' +
      `<p class="jh-autosum">${ico('calendar-check')}<span>${esc(copy.worstNote)}</span></p>` +
    '</div>'
  );
}

function watchSection(data) {
  const { watch, copy } = data;
  return (
    '<section class="jh-watch">' +
      `<div class="jh-sech"><h2>${esc(copy.watchH)}</h2><span>${esc(copy.watchDek)}</span></div>` +
      '<ul class="jh-wlist">' +
        watch.map((w) =>
          `<li class="jh-w"><span class="jh-wi">${ico(w.icon)}</span><span class="jh-wt"><small>${esc(w.k)}</small><b>${esc(w.v)}</b><em>${esc(w.note)}</em></span></li>`,
        ).join('') +
      '</ul>' +
    '</section>'
  );
}

function footer(cfg, data) {
  const url = (cfg.build && cfg.build.url) || 'superbot.app/p/job-pipeline';
  return (
    '<footer class="jh-foot">' +
      `<span>${ico('lock')}Made by Superbot for ${esc(data.meta.user)}. Read-only access to LinkedIn, Indeed, Gmail and ${n0(data.counts.boards)} job boards.</span>` +
      `<span>${esc(url)}</span>` +
    '</footer>'
  );
}

export default function build(root, ctx) {
  const cfg = (ctx && ctx.cfg) || {};
  const data = (ctx && ctx.data) || fallback;
  root.innerHTML =
    topBar(data) +
    hero(data) +
    accStrip(data) +
    flagsSection(data) +
    roomsSection(data) +
    '<section class="jh-panels">' +
      pipelinePanel(data) +
      rolesPanel(data) +
    '</section>' +
    watchSection(data) +
    footer(cfg, data);
  // a static build (the hub thumbnail) shows the finished page
  render(root, 1);
}

export function render(root, p) {
  if (!root || !root.querySelector) return;
  const g = syncDone(p);
  const mg = mergeDone(p);
  const gw = growDone(p);
  const rw = roomDone(p);
  const data = fallback;
  const { counts, meta } = data;

  const clock = root.querySelector('.jh-clock');
  if (clock) clock.textContent = clockText(meta.syncStart + meta.syncSecs * (0.6 * g + 0.4 * mg));

  const heroEl = root.querySelector('.jh-hero');
  let read = 0;
  for (const b of root.querySelectorAll('[data-n]')) {
    const i = Number(b.dataset.i) || 0;
    const v = Math.round(Number(b.dataset.n) * tickDone(g, i));
    b.textContent = n0(v);
    if (i < counts.accounts) read += v;
  }
  if (heroEl) {
    const ticks = counts.accounts + 1;
    for (let i = 0; i < ticks; i++) heroEl.classList.toggle(`is-s${i + 1}`, tickDone(g, i) >= 0.999);
    heroEl.classList.toggle('is-m1', mg > 0.06);
    heroEl.classList.toggle('is-m2', mg >= 0.999);
  }
  const count = root.querySelector('.jh-synccount');
  if (count) count.textContent = `${n0(read)} of ${n0(counts.pulled)} entries`;

  // the merge: the bar starts all amber-and-mint as pulled, the duplicate band shrinks to its share
  const bar = root.querySelector('.jh-mbar');
  if (bar) {
    const k = ease(mg);
    const uniq = counts.pulled - counts.dupes * k;
    const mun = bar.querySelector('.jh-mun');
    const mdup = bar.querySelector('.jh-mdup');
    if (mun) mun.style.width = pct((counts.rows / counts.pulled) * 100);
    if (mdup) mdup.style.width = pct(((uniq - counts.rows) / counts.pulled) * 100);
    bar.classList.toggle('is-merged', mg >= 0.999);
  }
  const dupnow = root.querySelector('.jh-dupnow');
  if (dupnow) dupnow.textContent = n0(Math.round(counts.dupes * ease(mg)));
  const uniqnow = root.querySelector('.jh-uniqnow');
  if (uniqnow) uniqnow.textContent = n0(Math.round(counts.pulled - counts.dupes * ease(mg)));

  // the flags strip: the four counters ease in, then the example rows land one after another
  for (const b of root.querySelectorAll('[data-g]')) b.textContent = n0(Math.round(Number(b.dataset.g) * ease(gw)));
  for (const li of root.querySelectorAll('.jh-flagex li')) {
    const j = Number(li.dataset.j) || 0;
    li.style.opacity = (0.15 + 0.85 * ease(clamp01((gw - j * 0.2) / 0.6))).toFixed(3);
  }

  // the company grid: nine cards settle in turn
  for (const card of root.querySelectorAll('.jh-room')) {
    const i = Number(card.dataset.r) || 0;
    const k = ease(clamp01((rw - i * 0.06) / 0.52));
    card.style.opacity = (0.2 + 0.8 * k).toFixed(3);
    card.style.transform = `translateY(${((1 - k) * 12).toFixed(2)}px)`;
  }

  const fill = root.querySelector('.jh-syncfill');
  if (fill) fill.style.width = pct(100 * (0.6 * g + 0.4 * mg));
}

export { build };
