// Strava beat, the finale: superbot connects to Strava and syncs the plan to Sam's training calendar.
// Its line streams in progress ("Connecting to your Strava account to sync 48 workouts, Oct 5 to Dec 27.", the reply
// header tagged "connecting") and Strava's OAuth authorize page lands in the chat as a sheet, in the real page's words
// (developers.strava.com "Getting Started", the authorization page screenshot: "Authorize <app> to connect to Strava",
// "<app> will be able to:", "View data about your public profile (required)", "View data about your activities", the
// orange Authorize button over Cancel; the upload line is the activity:write scope's): superbot's mark and Strava's mark
// with a link glyph between, the title, the permission rows with their checkboxes, and the pointer presses Authorize.
// At the press the header's tag flips to "connected" and the permissions give way to a checklist that ticks
// (Connected as Sam, the plan added, 48 workouts scheduled, race day). The sheet holds (CARD_HOLD) and opens to full
// frame (GROW), the grammar of the niche forks' connect beat.
// Full frame is Strava's web app, light, as Sam sees it: the logged-in header (the Strava wordmark, Dashboard,
// Training, Maps, Challenges, search, the bell, Sam's avatar), the plan's header ("Half Marathon, 12 weeks", its dates,
// the "Synced from superbot" badge, then 48 workouts, 230 mi, Goal 1:55:00 at 8:46/mi, race day Sun, Dec 27) and the
// Training Calendar: a phase column (Base, Build, Peak, Taper as quiet bands down the page), a week gutter (Week n,
// its miles, its Monday, Cutback/Taper tags) and the 7 day columns (rest days narrow). Every workout chip carries its
// name, the short form of its coach's line where it has one (3 x 800 m, the tempo block, the race pace finish), its
// miles, its target pace and its structure bar: the TrainingPeaks / Garmin structured-workout grammar, bar width =
// distance (to the column's longest run, so a column reads as the plan's ramp), bar height = intensity (from the
// segment's pace), colour = the shared zone encoding (neutral easy, tempo light orange, intervals orange, race dark).
// Then the bold moment: the weeks fill in order, every chip landing with a small synced tick and its bar drawing in,
// while "Syncing k of 48 workouts" counts up; at 48 it reads "48 of 48 workouts synced" with the green tick (the chime,
// render.mjs), and race day (week 12, Sunday) rings orange as its own chip gains the line "Goal 1:55:00, 8:46/mi".
// The page holds still, whole, through READ (no camera push, nothing laid over another chip).
// Every workout, pace, date and total comes from the plan itself (plan-data.js), never typed.
//
// There is ONE full-frame client, on a layer in the scene root (outside the camera). While the sheet sits in the chat
// the layer is pinned over the sheet's pane box (and transparent); GROW fades it up as it opens from there to the whole
// frame. The client is laid out once at a design size (the frame divided by APP_SCALE) and scaled to the layer.
// Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ico } from './ui-icons.js?v=69889d8f';
import { PLAN, ALL, WEEKS, MILES, START, RACE, GOAL, PACES, PACE_SEC, PHASES, phaseOf, CUTBACK, TAPER, md } from './plan-data.js?v=69889d8f';

const N = ALL.length;                                                          // 48
const monday = (i) => { const d = new Date(START); d.setDate(START.getDate() + i * 7); return d; };
const raceDay = RACE.date.toLocaleDateString('en-US', { weekday: 'short' }) + ', ' + md(RACE.date); // "Sun, Dec 27"

// the reply reads in progress until Authorize is pressed (the checklist after it carries the done state; the reply
// header's tag flips from "connecting" to "connected" at the press)
const SAY = `Connecting to your Strava account to sync ${N} workouts, ${md(START)} to ${md(RACE.date)}.`;
const SCOPES = [
  ['View data about your public profile (required)', true],
  ['View data about your activities', false],
  ['Upload your activities from superbot to Strava', false],
];
const CHECKS = ['Connected as Sam', `Plan added: Half Marathon, ${PLAN.length} weeks`, `${N} workouts scheduled`, `Race day: ${raceDay}`];
const NAV = ['Dashboard', 'Training', 'Maps', 'Challenges'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RUN_DAYS = ['Tue', 'Thu', 'Sat', 'Sun'];
const TAG = Object.fromEntries([...CUTBACK.map((w) => [w, 'Cutback']), ...TAPER.map((w) => [w, 'Taper'])]); // 1-based weeks
// bar width = distance: each day column's bars share one scale, its longest run
const COL_MAX = Object.fromEntries(RUN_DAYS.map((d) => [d, Math.max(...ALL.filter((w) => w.day === d).map((w) => w.miles))]));
// bar height = intensity, from the segment's target pace (easy 10:15 low, intervals 8:05 full); jogs a step lower
const Z_PACE = { wu: 'easy', cd: 'easy', easy: 'easy', jog: 'easy', tempo: 'tempo', int: 'intervals', race: 'race' };
const BAR_LO = 5, BAR_HI = 14;
const zh = (z) => {
  const s = PACE_SEC[Z_PACE[z]];
  const h = BAR_LO + (PACE_SEC.easy - s) / (PACE_SEC.easy - PACE_SEC.intervals) * (BAR_HI - BAR_LO);
  return +(z === 'jog' ? h - 1.5 : h).toFixed(1);
};
const segsHtml = (segs) => segs.map((s) => `<i class="sv-z sv-z-${s.z}" style="flex-grow:${s.mi};height:${zh(s.z)}px"></i>`).join('');
// the legend in the same grammar, from the plan's own workouts: an easy run, week 1's tempo, week 2's intervals,
// week 1's long run, race day
const find = (name) => ALL.find((w) => w.name === name);
const LEGEND = [['Easy', find('Easy Run'), 16], ['Tempo', find('Tempo'), 24], ['Intervals', find('Intervals'), 30], ['Long', find('Long Run'), 34], ['Race', RACE, 20]];
// the short form of a workout's coach line, where it has one (Thursday's structure, the long runs' race pace finish)
const sub = (w) => {
  const hard = (z) => w.segs.filter((s) => s.z === z).reduce((a, s) => a + s.mi, 0);
  if (w.name === 'Intervals') { const m = w.desc.match(/\d+ × \d+ m/); return m ? m[0] : ''; }
  if (w.name === 'Tempo') return `${hard('tempo')} mi block`;
  if (w.name === 'Race Pace') return `${hard('race')} mi at race pace`;
  if (w.name === 'Long Run') { const m = w.desc.match(/last \d+ at \d+:\d+/); return m ? m[0] : ''; }
  return '';
};

const APP_SCALE = { wide: 1.4, tall: 1.1 };    // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the sheet where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.2;                             // the line streams, then the sheet lands
const CARD_IN = 0.3;                             // the sheet rising into the thread
const CUR_AT = 0.3;                              // the sheet landing to the pointer coming in
const AUTH_AT = 0.8;                             // the sheet landing to the press on Authorize
const SWAP_AT = 0.22;                            // the press to the permissions giving way to the checklist
const SWAP = 0.22;
const CHECK_AT = 0.15;                           // the swap to the first check
const CHECK_STAGGER = 0.13;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.35; /* deliberate */         // the last check in, the sheet holds before it opens
const GROW = 0.45; /* deliberate */              // the sheet opens to full frame
const FILL_AT = 0.25;                            // full frame to the first chip syncing
const CHIP_STEP = 0.04;                          // one chip to the next (48 chips, week by week)
const CHIP_IN = 0.18;                            // a chip popping in
const BAR_IN = 0.28;                             // its structure bar drawing in
const RING_AT = 0.3;                             // 48 of 48 to the race day ring starting
const RING = 0.6; /* deliberate */               // the ring lands and the goal line fades in on the race chip
const READ = 1.25; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 12;                               // the sheet's radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const mi = (m) => `${m} mi`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.cur = T.card + CUR_AT;
    T.auth = T.card + AUTH_AT;                        // the press on Authorize
    T.swap = T.auth + SWAP_AT;
    T.ok = CHECKS.map((_, i) => T.swap + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[CHECKS.length - 1] + POP + CARD_HOLD; // the sheet starts opening
    T.full = T.grow + GROW;                           // full frame
    T.fill = T.full + FILL_AT;
    T.chips = ALL.map((_, j) => T.fill + j * CHIP_STEP);
    T.synced = T.chips[N - 1];                        // the counter reaches 48: the chime
    T.ring = T.synced + RING_AT;                      // race day rings, its goal line lands in the chip
    T.ringed = T.ring + RING;
    T.end = T.ringed + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('strava-logo.svg');
    const word = x.brand('strava-wordmark.svg');

    // ---- Strava's authorize page, as a sheet in the chat ----
    const say = x.el(`<div class="qc-say sv-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="sv-card"><div class="sv-vp">
      <div class="sv-pair">${x.tile('superbot', 'sv-pt')}<span class="sv-link">${ico('ms_link_rounded', 'ui-i')}</span><span class="sv-pt sv-pt-st"><img src="${mark}" alt=""/></span></div>
      <h3 class="sv-h">Authorize superbot to connect to Strava</h3>
      <div class="sv-perm">
        <b class="sv-will">superbot will be able to:</b>
        ${SCOPES.map(([s, req]) => `<div class="sv-sc${req ? ' sv-req' : ''}"><i class="sv-cb">${ico('f7_checkmark_alt', 'ui-i')}</i><span>${esc(s)}</span></div>`).join('')}
        <span class="sv-btn sv-auth">Authorize</span>
        <span class="sv-btn sv-cancel">Cancel</span>
      </div>
      <div class="sv-done">${CHECKS.map((c) => `<div class="sv-step"><span class="sv-ok"><i class="sv-spin"></i><i class="sv-dn">${ico('f7_checkmark_alt', 'ui-i')}</i></span><span>${esc(c)}</span></div>`).join('')}</div>
    </div></div>`);
    const vp = card.querySelector('.sv-vp');
    const perm = card.querySelector('.sv-perm'), done = card.querySelector('.sv-done'), auth = card.querySelector('.sv-auth');
    const steps = [...card.querySelectorAll('.sv-step')].map((n) => ({ n, spin: n.querySelector('.sv-spin'), ok: n.querySelector('.sv-dn') }));

    // ---- the full-frame client: Strava's training calendar ----
    // a workout chip: glyph, name, short form, miles over its structure bar and target pace; the synced tick on its corner
    const chip = (w) => {
      const race = w === RACE;
      const s = sub(w);
      const pct = (w.miles / COL_MAX[w.day] * 100).toFixed(1);
      return `<span class="sv-chip sv-k-${w.kind}${race ? ' sv-race' : ''}">
        <span class="sv-c1">${ico(race ? 'ms_flag_rounded' : 'ms_directions_run', 'ui-i sv-gl')}<b>${esc(w.name)}</b>${s ? `<small>${esc(s)}</small>` : ''}<em>${mi(w.miles)}</em></span>
        <span class="sv-c2"><span class="sv-trk"><span class="sv-bar" style="width:${pct}%">${segsHtml(w.segs)}</span></span>${race
          ? `<em class="sv-goal">Goal ${GOAL}, ${PACES.race}/mi</em>` : `<em class="sv-pace">${w.pace}/mi</em>`}</span>
        <i class="sv-tk">${ico('f7_checkmark_alt', 'ui-i')}</i></span>`;
    };
    // one CSS grid: row 1 the day heads, rows 2..13 the weeks; the phase column spans its weeks; a band behind each
    // week row (its phase's tint, lit while it syncs)
    const band = (p) => (PHASES.indexOf(p) % 2 ? ' sv-alt' : '');
    const cells = [];
    cells.push(`<div class="sv-hd sv-hd-ph" style="grid-area:1/1">Phase</div><div class="sv-hd" style="grid-area:1/2">Week</div>`);
    DAYS.forEach((d, c) => cells.push(`<div class="sv-hd${RUN_DAYS.includes(d) ? '' : ' sv-rest'}" style="grid-area:1/${c + 3}">${d}</div>`));
    PHASES.forEach((p, k) => cells.push(`<div class="sv-ph${band(p)}${k ? ' sv-pb' : ''}${k === PHASES.length - 1 ? ' sv-last' : ''}" style="grid-column:1;grid-row:${p.from + 1}/${p.to + 2}">
      <b>${esc(p.name)}</b><small>Weeks ${p.from} to ${p.to}</small><span>${esc(p.note)}</span></div>`));
    PLAN.forEach((week, i) => {
      const wk = i + 1, row = wk + 1, p = phaseOf(wk);
      cells.push(`<div class="sv-rbg${band(p)}${wk === p.from && wk > 1 ? ' sv-pb' : ''}${wk === PLAN.length ? ' sv-last' : ''}" style="grid-column:2/-1;grid-row:${row}"></div>`);
      cells.push(`<div class="sv-wk" style="grid-area:${row}/2"><b>Week ${wk}</b><em>${mi(WEEKS[i])}</em><small>${esc(md(monday(i)))}</small>${TAG[wk] ? `<i class="sv-tag">${TAG[wk]}</i>` : ''}</div>`);
      DAYS.forEach((d, c) => {
        const w = week.find((r) => r.day === d);
        if (w) cells.push(`<div class="sv-cell${w === RACE ? ' sv-raceday' : ''}" style="grid-area:${row}/${c + 3}">${chip(w)}</div>`);
        else cells.push(`<div class="sv-cell sv-rest" style="grid-area:${row}/${c + 3}"></div>`);
      });
    });
    const layer = x.el(`<div class="sv-full" aria-hidden="true"><div class="sv-client">
      <header class="sv-top"><img class="sv-word" src="${word}" alt="Strava"/>
        <nav>${NAV.map((n) => `<span${n === 'Training' ? ' class="on"' : ''}>${esc(n)}</span>`).join('')}</nav>
        <span class="sv-tr">${ico('ms_search', 'ui-i')}${ico('ms_notifications_outline', 'ui-i')}<i class="sv-av">S</i></span></header>
      <section class="sv-head">
        <div class="sv-ttl"><h1>Half Marathon, ${PLAN.length} weeks</h1>
          <p><span>${md(START)} to ${md(RACE.date)}, ${RACE.date.getFullYear()}</span><span class="sv-badge"><img src="${x.sbSrc}" alt=""/>Synced from superbot</span></p></div>
        <div class="sv-stats">
          <span><b>${N}</b><small>Workouts</small></span>
          <span><b>${MILES} mi</b><small>Total distance</small></span>
          <span><b>${GOAL}</b><small>Goal at ${PACES.race}/mi</small></span>
          <span><b>${raceDay}</b><small>Race day</small></span></div>
      </section>
      <div class="sv-calhd"><h2>Training Calendar</h2>
        <div class="sv-legend">${LEGEND.map(([l, w, px]) => `<span><i class="sv-bar sv-lb" style="width:${px}px">${segsHtml(w.segs)}</i>${l}</span>`).join('')}</div>
        <div class="sv-sync"><span class="sv-sst"><i class="sv-spin"></i><i class="sv-sok">${ico('f7_checkmark_alt', 'ui-i')}</i></span><span class="sv-stx"></span></div></div>
      <div class="sv-grid">${cells.join('')}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const $ = (s) => layer.querySelector(s);
    const client = layer.firstElementChild;
    const chips = [...layer.querySelectorAll('.sv-chip')].map((n) => ({ n, tk: n.querySelector('.sv-tk'), bar: n.querySelector('.sv-bar') }));
    const rows = [...layer.querySelectorAll('.sv-rbg')];
    const raceCell = $('.sv-raceday'), goals = [...layer.querySelectorAll('.sv-goal')];
    const sync = { el: $('.sv-sync'), spin: $('.sv-sync .sv-spin'), ok: $('.sv-sok'), tx: $('.sv-stx') };
    // chip order is the plan's order (week by week, Tue Thu Sat Sun), which is the DOM's order too
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 16px "Inter SB"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, lastTx = '';
    let AW = 1371, AH = 771, tall = false, whoTag = null;

    // the client's design size from the frame: W x H over APP_SCALE; a portrait frame takes the compact layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      client.style.width = `${AW}px`; client.style.height = `${AH}px`;
      client.classList.toggle('sv-tall', tall);
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      // the pointer: in from below right, onto Authorize, the press, and away
      pointer(t) {
        if (t < T.cur || t > T.auth + 0.4) return null;
        const b = x.box(auth);
        const m = outCubic(seg(t, T.cur, T.auth - 0.12));
        const px = b.cx + lerp(b.w * 0.55, 0, m), py = b.cy + lerp(b.h * 2.6, 0, m);
        const v = seg(t, T.cur, T.cur + 0.15) * (1 - seg(t, T.auth + 0.22, T.auth + 0.4));
        return { x: px, y: py, p: press(t, T.auth), v };
      },
      render(t) {
        layout();
        // the reply header's tag (chat.js builds it from APPS.strava.sub): connecting until the press, then connected
        whoTag = whoTag || (say.parentNode && say.parentNode.querySelector('.qc-who small'));
        if (whoTag) { const tg = t < T.auth ? 'connecting' : 'connected'; if (whoTag.textContent !== tg) whoTag.textContent = tg; }
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Authorize: pressed (a dip, the button a shade deeper), then the permissions give way to the checklist
        const pr = press(t, T.auth);
        auth.style.transform = pr ? `scale(${(1 - 0.03 * pr).toFixed(4)})` : 'none';
        auth.classList.toggle('on', t >= T.auth - 0.06 && t < T.swap + SWAP);
        const sw = inOutCubic(seg(t, T.swap, T.swap + SWAP));
        perm.style.opacity = (1 - sw).toFixed(3);
        perm.style.transform = sw ? `translateY(${(-8 * sw).toFixed(2)}px)` : 'none';
        perm.style.visibility = sw >= 1 ? 'hidden' : '';
        done.style.opacity = sw.toFixed(3);
        done.style.transform = sw >= 1 ? 'none' : `translateY(${(8 * (1 - sw)).toFixed(2)}px)`;
        steps.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.swap) * 420).toFixed(1)}deg)`;
          c.ok.style.opacity = o.toFixed(3);
          c.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (t < T.grow) return; // the client is hidden until the sheet opens

        // ---- the calendar syncs: chips land week by week, each with its tick; the counter follows ----
        let count = 0;
        chips.forEach((c, j) => {
          const a = T.chips[j];
          const p = outCubic(seg(t, a, a + CHIP_IN));
          if (t >= a) count++;
          c.n.style.opacity = p.toFixed(3);
          c.n.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.82, 1, p).toFixed(4)})`;
          const q = outCubic(seg(t, a + 0.08, a + 0.08 + 0.16));
          c.tk.style.opacity = q.toFixed(3);
          c.tk.style.transform = q >= 1 ? 'none' : `scale(${lerp(0.3, 1, q).toFixed(4)})`;
          // its structure bar draws in left to right as the chip settles (distance first, then the next segment)
          const b = outCubic(seg(t, a + 0.06, a + 0.06 + BAR_IN));
          c.bar.style.clipPath = b >= 1 ? '' : `inset(0 ${((1 - b) * 100).toFixed(2)}% 0 0)`;
        });
        // the row being synced is lit; every row synced so far keeps a faint wash
        rows.forEach((rw, i) => rw.classList.toggle('sv-live', t >= T.chips[i * 4] && t < T.chips[i * 4 + 3] + CHIP_IN));
        const fin = t >= T.synced;
        const tx = fin ? `${N} of ${N} workouts synced` : `Syncing ${count} of ${N} workouts`;
        if (tx !== lastTx) { sync.tx.textContent = tx; lastTx = tx; }
        sync.el.classList.toggle('done', fin);
        const d = outCubic(seg(t, T.synced, T.synced + 0.2));
        sync.spin.style.opacity = (1 - seg(t, T.synced - 0.06, T.synced + 0.04)).toFixed(3);
        sync.spin.style.transform = `rotate(${((t - T.full) * 420).toFixed(1)}deg)`;
        sync.ok.style.opacity = d.toFixed(3);
        sync.ok.style.transform = d >= 1 ? 'none' : `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        // race day: the orange ring, then the goal line (goal time, race pace) fades in inside the race chip (no layer over any other chip)
        const rg = outCubic(seg(t, T.ring, T.ring + 0.3));
        raceCell.style.setProperty('--ring', rg.toFixed(3));
        const cl = outCubic(seg(t, T.ring + 0.2, T.ring + 0.5)).toFixed(3);
        goals.forEach((g) => { g.style.opacity = cl; });
      },
      // after the camera: pin the layer over the sheet's pane box and open it to the whole frame
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(vp);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = vp.offsetWidth ? b.w / vp.offsetWidth : 1; // the camera's scale on the sheet
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        // the client covers the box whatever its aspect on the way (the sheet is squarer than the frame), centred; at
        // full frame it holds still (no push: the whole page, header included, stays in frame)
        const sc = Math.max(Wd / AW, Ht / AH);
        client.style.transform = `translate(${((Wd - AW * sc) / 2).toFixed(2)}px, ${((Ht - AH * sc) / 2).toFixed(2)}px) scale(${sc.toFixed(5)})`;
        // while it sits over the sheet the layer is cut to the feed's viewport, so it never draws over the composer
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        // a quick dissolve from the sheet to the client as the box starts to open (no long double exposure)
        layer.style.opacity = outCubic(seg(t, T.grow, T.grow + 0.12)).toFixed(3);
      },
    };
  },
};
