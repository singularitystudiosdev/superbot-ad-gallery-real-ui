/* lifehub-rollover: three day columns (Mon Oct 5, Tue Oct 6, Wed Oct 7). Monday ticks off but two rows stay
   open at 11:59 PM -> at midnight they fly into Tuesday ("from Mon") while the recurring rows are already
   there -> the thank-you note still slips -> it rolls again into Wednesday ("rolled ×2") and finally gets done
   -> pull back from the Daily panel to the full 7-area command center: "nothing falls through." */
import { ease, ep, prog, win, h, $, setStyle, setText, toggle, camera, camAt, boxIn, lerp } from '../../assets/lifehub-209a81f4/lib.js';
import { makeDashboard, makeHeadline, makeBands, revealDashboard, setRowDone, ICONS, logo } from '../../assets/lifehub-209a81f4/ui.js';

const DUR = 15.6;

// board geometry (layer px)
const COL_W = 580, COL_TOP = 220, ROW0 = 104, PITCH = 72;
const COL_X = [60, 670, 1280];
const slot = (c, i) => ({ x: COL_X[c] + 20, y: COL_TOP + ROW0 + i * PITCH });

// rows that live in a column: [text, meta, recurring, tick time | null]
const DAYS = [
  { dow: 'MON', date: 'Oct 5', rows: [
    ['Read 20 pages', 'every day', true, 0.95],
    ['LeetCode · 1 problem', 'every day', true, 1.4],
    ['Gym · push day', '4 days a week', true, 1.85],
    ['Reply to Marcus · coffee chat', 'waiting 2 days', false, 2.3],
    ['CS 161 · PSET 4 (part 1)', 'due Thu 11:59 PM', false, 2.75],
  ] },
  { dow: 'TUE', date: 'Oct 6', rows: [
    ['Read 20 pages', 'every day', true, 6.85],
    ['LeetCode · 1 problem', 'every day', true, 7.1],
    ['Follow up with Priya · career fair', 'met Thu', false, 7.35],
    ['Research fellowship · apply', 'opens 9 AM', false, 7.6],
  ] },
  { dow: 'WED', date: 'Oct 7', rows: [
    ['Read 20 pages', 'every day', true, 9.85],
    ['LeetCode · 1 problem', 'every day', true, 10.1],
    ['Gym · push day', '4 days a week', true, 10.35],
    ['Reply to Lena · Halcyon Labs', 'interview times, by Wed', false, 10.6],
    ['CS 161 · PSET 4 (part 2)', 'due Thu 11:59 PM', false, null],
  ] },
];

// the two rows that roll over (they live on the layer so they can fly between columns)
const LAUNDRY = { text: 'Laundry', meta: '30 min' };
const NOTE = { text: 'Thank-you note to Prof. Alvarez', meta: '5 min' };
const T_LAUNDRY = { lift: 5.25, land: 6.35, done: 7.95 };
const T_NOTE = { lift: 5.45, land: 6.55, lift2: 9.15, land2: 10.3, done: 11.15 };

const FULL = { cx: 960, cy: 506, z: 0.86 };

function rowEl({ text, meta, rep }) {
  return h(`<div class="rv-row"><span class="rv-box">${ICONS.check}</span><div class="rv-main">
    <div class="rv-t"><span class="rv-tt">${text}<i class="rv-strike"></i></span></div>
    <div class="rv-m">${rep ? `<span class="rv-rep">${ICONS.repeat}</span>` : ''}<span class="rv-badge"></span><span class="rv-mt">${meta}</span></div>
  </div><i class="rv-warn"></i><i class="rv-flash"></i><i class="rv-sh"></i><i class="rv-dimr"></i></div>`);
}

function rowRefs(el) {
  return { el, box: $(el, '.rv-box'), strike: $(el, '.rv-strike'), rep: $(el, '.rv-rep'), badge: $(el, '.rv-badge'), warn: $(el, '.rv-warn'), flash: $(el, '.rv-flash'), sh: $(el, '.rv-sh'), dimr: $(el, '.rv-dimr') };
}

/** tick a row: box fills + bumps, strike draws, row flashes green for `big` */
function tick(r, t, t0, big = false) {
  if (t0 == null) { toggle(r.el, 'done', false); setStyle(r.strike, { sx: 0, sy: 1 }); return; }
  const k = prog(t, t0, t0 + 0.32);
  toggle(r.el, 'done', k >= 0.45);
  setStyle(r.box, { s: k > 0 && k < 1 ? 1 + 0.32 * Math.sin(Math.PI * k) : 1 });
  setStyle(r.strike, { sx: ease.outCubic(prog(t, t0 + 0.12, t0 + 0.45)), sy: 1 });
  if (big) setStyle(r.flash, { o: win(t, t0 + 0.05, t0 + 1.3, 0.15, 0.6) });
}

/** spin + swell the repeat icon (a recurring row coming back on its own) */
function pulse(r, t, t0) {
  if (!r.rep) return;
  const k = prog(t, t0, t0 + 0.7);
  setStyle(r.rep, { r: ease.inOutCubic(k) * 360, s: 1 + 0.55 * Math.sin(Math.PI * k) });
}

const fmt = (mins) => {
  const hh = Math.floor(mins / 60), mm = Math.floor(mins % 60);
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${String(mm).padStart(2, '0')} ${hh >= 12 && hh < 24 ? 'PM' : 'AM'}`;
};
// clock that runs from a to b minutes over [t0, t1], then holds
const clock = (t, t0, t1, a, b) => fmt(lerp(a, b, ease.linear(prog(t, t0, t1))));

export default {
  id: 'rollover',
  dur: DUR,
  mount(sec) {
    const bands = makeBands(['unfinished rolls over', 'every day every day', 'still on the list', 'tomorrow tomorrow'], { size: 210, top: 120 });
    sec.appendChild(bands.el);

    // ---- the board ----
    const board = h('<div class="lh-layer" style="z-index:3"></div>');
    const cols = DAYS.map((d, ci) => {
      const el = h(`<div class="rv-col" style="left:${COL_X[ci]}px"><i class="rv-ring"></i><i class="rv-dim"></i>
        <div class="rv-hd"><span class="rv-dow">${d.dow}</span><span class="rv-date">${d.date}</span>
        <span class="rv-pill">${logo('clock', 24)}<span class="rv-pt"></span></span></div></div>`);
      const rows = d.rows.map(([text, meta, rep, at], i) => {
        const r = rowRefs(rowEl({ text, meta, rep }));
        r.el.style.top = `${ROW0 + i * PITCH}px`;
        r.at = at;
        el.appendChild(r.el);
        return r;
      });
      board.appendChild(el);
      return { el, rows, ring: $(el, '.rv-ring'), dim: $(el, '.rv-dim'), pill: $(el, '.rv-pill'), pt: $(el, '.rv-pt') };
    });
    // ghosts left behind in Monday / Tuesday when a row rolls on
    const ghost = (ci, i, text) => {
      const g = h(`<div class="rv-ghost" style="top:${ROW0 + i * PITCH}px">${text}</div>`);
      cols[ci].el.appendChild(g);
      return g;
    };
    const ghosts = { lMon: ghost(0, 5, 'moved to Tue'), nMon: ghost(0, 6, 'moved to Tue'), nTue: ghost(1, 5, 'moved to Wed') };
    const laundry = rowRefs(rowEl(LAUNDRY));
    const note = rowRefs(rowEl(NOTE));
    for (const r of [laundry, note]) { r.el.classList.add('rv-fly'); board.appendChild(r.el); }
    sec.appendChild(board);

    // ---- the command center (end pull back) ----
    const layer = h('<div class="lh-layer" style="z-index:2"></div>');
    const dash = makeDashboard();
    layer.appendChild(dash.el);
    sec.appendChild(layer);
    const daily = boxIn(dash.panels.daily, layer);

    // ---- caption: the note finally done ----
    const scrim = h('<div class="lh-scrim"></div>');
    sec.appendChild(scrim);
    const done = h(`<div class="rv-done lh-abs"><span class="rv-ok">${ICONS.check}</span><span>Done. 2 days late, not forgotten.</span></div>`);
    sec.appendChild(done);
    const doneW = done.offsetWidth;

    const head = makeHeadline([
      { a: 0.25, b: 4.85, text: "didn't finish it?" },
      { a: 5.0, b: 8.85, text: "it's on tomorrow." },
      { a: 9.0, b: 12.35, text: 'and the next day.' },
      { a: 13.05, b: DUR, text: 'nothing falls through.' },
    ]);
    sec.appendChild(head.el);

    const zc = 1.3, cyc = 497; // column push-in: header just under the headline, rows >= 30 px on screen
    const keys = [
      { t: 0, cx: 520, cy: 512, z: 1.18 },
      { t: 4.7, cx: 560, cy: cyc, z: zc },
      { t: 6.7, cx: 900, cy: cyc, z: zc },
      { t: 8.95, cx: 960, cy: cyc, z: zc },
      { t: 10.4, cx: 1400, cy: cyc, z: zc },
      { t: 12.3, cx: 1440, cy: cyc, z: 1.32 },
    ];
    // pull back: the dashboard camera starts where its Daily panel sits exactly under the Wednesday column,
    // and from 12.3 the board camera is slaved to it, so Wednesday shrinks straight into the Daily panel
    const B = keys[keys.length - 1];
    const wed = { cx: COL_X[2] + COL_W / 2, cy: COL_TOP + 320 };
    const sc = daily.w / COL_W;
    const P = { x: 960 + (wed.cx - B.cx) * B.z, y: 540 + (wed.cy - B.cy) * B.z };
    const z0 = B.z / sc;
    const D0 = { cx: daily.cx - (P.x - 960) / z0, cy: daily.cy - (P.y - 540) / z0, z: z0 };
    const match = (d) => {
      const bz = d.z * sc, px = 960 + (daily.cx - d.cx) * d.z, py = 540 + (daily.cy - d.cy) * d.z;
      return { cx: wed.cx - (px - 960) / bz, cy: wed.cy - (py - 540) / bz, z: bz };
    };
    const dkeys = [
      { t: 12.3, ...D0 },
      { t: 13.6, ...FULL },
      { t: DUR, ...FULL, z: 0.81 },
    ];
    return { bands, board, cols, ghosts, laundry, note, layer, dash, scrim, done, doneW, head, keys, dkeys, match };
  },

  render(t, c) {
    c.bands.render(t);
    setStyle(c.bands.el, { o: ep(t, 0, 0.5) * 0.6 * (1 - 0.4 * ep(t, 12.6, 13.6)) });

    // ---- board camera + fade ----
    const dc = camAt(c.dkeys, t);
    const cam = t > 12.3 ? c.match(dc) : camAt(c.keys, t);
    camera(c.board, cam.cx, cam.cy, cam.z);
    const kb = (0.35 + 0.65 * ep(t, 0, 0.3)) * (1 - ep(t, 12.8, 13.3, ease.inOutCubic));
    c.board.style.opacity = kb.toFixed(3);
    c.board.style.visibility = kb > 0.001 ? 'visible' : 'hidden';

    // which day is "today"
    const aMon = 1 - ep(t, 4.3, 5.1);
    const aWed = ep(t, 8.65, 9.45);
    const aTue = (1 - aMon) * (1 - aWed);
    const kside = 1 - ep(t, 12.3, 12.75, ease.inOutCubic);
    const dimOf = [aMon, aTue, aWed].map((a) => 0.62 * (1 - a));
    [aMon, aTue, aWed].forEach((a, ci) => {
      const col = c.cols[ci];
      setStyle(col.dim, { o: 0.62 * (1 - a) });
      if (ci < 2) setStyle(col.el, { o: kside });
      setStyle(col.ring, { o: a });
    });

    // header pills: clocks run toward midnight, flip, then show the tally
    const pill = (ci, text, mode, pop) => {
      const col = c.cols[ci];
      setText(col.pt, text);
      toggle(col.pill, 'night', mode === 'night');
      toggle(col.pill, 'okp', mode === 'ok');
      setStyle(col.pill, { s: 1 + 0.12 * Math.sin(Math.PI * prog(t, pop, pop + 0.35)) });
    };
    if (t < 3.9) pill(0, clock(t, 0.5, 3.6, 21 * 60 + 38, 23 * 60 + 59), t > 3.3 ? 'night' : '', 3.6);
    else if (t < 4.75) pill(0, t < 4.3 ? '11:59 PM' : '12:00 AM', 'night', t < 4.3 ? 3.6 : 4.3);
    else pill(0, '5 of 7 done', 'ok', 4.75);
    if (t < 4.3) pill(1, 'tomorrow', '', -9);
    else if (t < 7.0) pill(1, 'today', '', 4.3);
    else if (t < 8.6) pill(1, clock(t, 7.0, 8.2, 20 * 60 + 52, 23 * 60 + 59), t > 7.9 ? 'night' : '', 8.2);
    else if (t < 9.1) pill(1, '12:00 AM', 'night', 8.6);
    else pill(1, '5 of 6 done', 'ok', 9.1);
    if (t < 4.3) pill(2, 'in 2 days', '', -9);
    else if (t < 8.6) pill(2, 'tomorrow', '', 4.3);
    else if (t < 11.5) pill(2, 'today', '', 8.6);
    else pill(2, '5 of 6 done', 'ok', 11.5);

    // fixed rows: ticks + recurring pulses
    c.cols.forEach((col) => col.rows.forEach((r) => tick(r, t, r.at)));
    [0, 1].forEach((i) => pulse(c.cols[1].rows[i], t, 4.55 + i * 0.15));
    [0, 1, 2].forEach((i) => pulse(c.cols[2].rows[i], t, 8.85 + i * 0.15));

    // ---- the rolling rows ----
    const fly = (r, from, to, a, b, lift) => {
      // returns {x,y,s} at time t for a hop from slot `from` to slot `to` over [a, b]
      const k = ease.inOutCubic(prog(t, a, b));
      const kl = Math.sin(Math.PI * prog(t, lift, b + 0.15));
      return { x: lerp(from.x, to.x, k), y: lerp(from.y, to.y, k) - 70 * Math.sin(Math.PI * k), s: 1 + 0.06 * kl };
    };
    // laundry: Mon slot 5 -> Tue slot 4
    {
      const L = T_LAUNDRY;
      const p = fly(c.laundry, slot(0, 5), slot(1, 4), L.lift + 0.1, L.land, L.lift);
      setStyle(c.laundry.el, { ...p, o: kside });
      setStyle(c.laundry.sh, { o: Math.sin(Math.PI * prog(t, L.lift, L.land + 0.15)) });
      setStyle(c.laundry.dimr, { o: t < L.land ? dimOf[0] * (1 - ep(t, L.lift, L.lift + 0.35)) : dimOf[1] });
      c.laundry.el.style.zIndex = t > L.lift && t < L.land + 0.2 ? 8 : 6;
      toggle(c.laundry.el, 'badged', t >= L.land - 0.05);
      setText(c.laundry.badge, 'from Mon');
      setStyle(c.laundry.badge, { s: ease.outBack(prog(t, L.land - 0.05, L.land + 0.3)) });
      tick(c.laundry, t, L.done);
      setStyle(c.laundry.warn, { o: win(t, 3.55, L.lift + 0.4, 0.25, 0.35) });
      setStyle(c.ghosts.lMon, { o: 0.9 * ep(t, L.lift + 0.15, L.lift + 0.6) });
    }
    // note: Mon slot 6 -> Tue slot 5 -> Wed slot 5
    {
      const N = T_NOTE;
      const p = t < N.lift2
        ? fly(c.note, slot(0, 6), slot(1, 5), N.lift + 0.1, N.land, N.lift)
        : fly(c.note, slot(1, 5), slot(2, 5), N.lift2 + 0.1, N.land2, N.lift2);
      setStyle(c.note.el, p);
      setStyle(c.note.sh, { o: Math.max(Math.sin(Math.PI * prog(t, N.lift, N.land + 0.15)), Math.sin(Math.PI * prog(t, N.lift2, N.land2 + 0.15))) });
      setStyle(c.note.dimr, { o: t < N.land ? dimOf[0] * (1 - ep(t, N.lift, N.lift + 0.35)) : t < N.land2 ? dimOf[1] * (1 - ep(t, N.lift2, N.lift2 + 0.35)) : dimOf[2] });
      c.note.el.style.zIndex = (t > N.lift && t < N.land + 0.2) || (t > N.lift2 && t < N.land2 + 0.2) ? 9 : 6;
      toggle(c.note.el, 'badged', t >= N.land - 0.05);
      setText(c.note.badge, t < N.land2 - 0.05 ? 'from Mon' : 'rolled ×2');
      const bp = t < N.land2 - 0.05 ? prog(t, N.land - 0.05, N.land + 0.3) : prog(t, N.land2 - 0.05, N.land2 + 0.3);
      setStyle(c.note.badge, { s: ease.outBack(bp) * (t >= N.land2 - 0.05 ? 1 + 0.15 * Math.sin(Math.PI * prog(t, N.land2 + 0.25, N.land2 + 0.6)) : 1) });
      tick(c.note, t, N.done, true);
      setStyle(c.note.warn, { o: Math.max(win(t, 3.55, N.lift + 0.4, 0.25, 0.35), win(t, 8.25, N.lift2 + 0.4, 0.25, 0.35)) });
      setStyle(c.ghosts.nMon, { o: 0.9 * ep(t, N.lift + 0.15, N.lift + 0.6) });
      setStyle(c.ghosts.nTue, { o: 0.9 * ep(t, N.lift2 + 0.15, N.lift2 + 0.6) });
    }

    // ---- caption: done, over the scrim, centred under Wednesday ----
    const kd = win(t, 11.35, 12.45, 0.3, 0.3);
    setStyle(c.scrim, { o: win(t, 11.2, 12.55, 0.3, 0.35) });
    const wedCx = 960 + (COL_X[2] + COL_W / 2 - cam.cx) * cam.z;
    const ks = ease.outBack(prog(t, 11.35, 11.8));
    setStyle(c.done, { x: wedCx - c.doneW / 2, y: 935 + (1 - ks) * 40, o: kd });

    // ---- pull back to the command center ----
    camera(c.layer, dc.cx, dc.cy, dc.z);
    const kw = ep(t, 12.3, 12.85, ease.inOutCubic);
    setStyle(c.dash.el, { o: kw });
    c.layer.style.visibility = kw > 0.001 ? 'visible' : 'hidden';
    revealDashboard(c.dash, t, 12.3, { step: 0.07, order: ['daily', 'email', 'cal', 'apps', 'projects', 'network', 'school'] });
    c.dash.mark.render(t);
    setRowDone(c.dash.rows.daily[0], ep(t, 14.0, 14.3));
    setRowDone(c.dash.rows.network[2], ep(t, 14.5, 14.8));

    c.head.render(t);
  },
};
