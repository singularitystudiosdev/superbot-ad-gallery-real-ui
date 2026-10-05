/* lifehub-day: "it plans your day." the task list flies into free slots on Mon, Oct 5 around the fixed class,
   call and club -> "and checks you did it." a now-line sweeps the day, blocks tick done, the capstone block is cut
   short and the rest moves to Tue 9 AM -> the week, said vs did -> pull back to the full command center. */
import { ease, ep, prog, spring, win, h, setStyle, setText, toggle, camera, camAt, boxIn, lerp, clamp } from '../../assets/lifehub-209a81f4/lib.js';
import { makeDashboard, makeHeadline, makeBands, makeMark, makeChip, revealDashboard, setRowDone, logo, ICONS } from '../../assets/lifehub-209a81f4/ui.js';
import { TODAY } from '../../assets/lifehub-209a81f4/data.js';

const DUR = 16.0;
const FULL = { cx: 960, cy: 506, z: 0.86 };

// layout (calendar layer coords, identical to stage coords at camera z = 1)
const TC = { x: 120, y: 196, w: 640, h: 840 };
const CAL = { x: 820, y: 196, w: 980, h: 840 };
const HDR = 90, HOUR = 52, GUT = 110;
const GTOP = CAL.y + HDR;
const BX = CAL.x + GUT, BW = CAL.w - GUT - 24;
const yOf = (hr) => GTOP + (hr - 8) * HOUR;
const CUT = 15 + 10 / 60; // capstone stops at 3:10 PM: 1h 10m of 2h

// camera for the day push-in
const Z2 = 1.55, CX2 = CAL.x + CAL.w / 2, CY0 = 409, CY1 = 800;

const COL = { work: '#5b8dff', call: '#22d3ee', cls: '#a78bfa', gym: '#34d399', cap: '#f472b6', fel: '#fbbf24', read: '#7aa2ff', club: '#9aa0ac' };

const TASKS = [
  { t: 'CS 161 · PSET 4', m: 'due Thu 11:59 PM', d: '2h', when: '9 AM', b: 'Deep work · PSET 4', bm: '9:00 · 2h', s: 9, e: 11, c: COL.work },
  { t: 'Reply to Marcus', m: 'coffee chat · waiting 2 days', d: '10m', when: '12 PM', b: 'Reply to Marcus', bm: '12:00 · 10m', s: 12, e: 12 + 10 / 60, c: COL.call },
  { t: 'Capstone proposal', m: 'due Oct 30 · start early', d: '2h', when: '2 PM', b: 'Capstone proposal', bm: '2:00 · 2h', s: 14, e: 16, c: COL.cap, cap: true },
  { t: 'Gym · push day', m: 'goal 4 a week', d: '1h', when: '5:30 PM', b: 'Gym · push day', bm: '5:30 · 1h', s: 17.5, e: 18.5, c: COL.gym },
  { t: 'Fellowship essay outline', m: 'opens tomorrow 9 AM', d: '1h', when: '8 PM', b: 'Fellowship essay outline', bm: '8:00 · 1h', s: 20, e: 21, c: COL.fel },
  { t: 'Read 20 pages', m: 'every day', d: '30m', when: '9:30 PM', b: 'Read 20 pages', bm: '9:30 · 30m', s: 21.5, e: 22, c: COL.read },
];
const FIXED = [
  { b: 'ECON 102 lecture', bm: '11:00 · class', s: 11, e: 12, c: COL.cls },
  { b: 'Coffee chat · Marcus', bm: '1:00 · call', s: 13, e: 14, c: COL.call },
  { b: 'Club meeting', bm: '7:00 · event', s: 19, e: 20, c: COL.club },
];

// this week, said vs did
const WEEK = [
  { l: 'Deep work', said: 'said 12h · did ', frac: 580 / 720, fill: 'var(--grad)', val: (k) => fmtMin(Math.round((580 * k) / 10) * 10), full: false },
  { l: 'Gym', said: '', frac: 3 / 4, fill: '#34d399', val: (k) => `${Math.round(3 * k)} of 4`, full: false },
  { l: 'Replies', said: '', frac: 1, fill: '#34d399', val: (k) => `${Math.round(5 * k)} of 5`, full: true },
  { l: 'Classes', said: '', frac: 1, fill: '#34d399', val: (k) => `${Math.round(9 * k)} of 9`, full: true },
];

function fmtMin(m) {
  const H = Math.floor(m / 60), M = m % 60;
  return M ? `${H}h ${M}m` : `${H}h`;
}
function fmtHr(hr) {
  const m = Math.round(hr * 12) * 5;
  const H = Math.floor(m / 60), M = m % 60;
  return `${H % 12 || 12}:${String(M).padStart(2, '0')} ${H >= 12 ? 'PM' : 'AM'}`;
}
function hrLabel(hr) { return `${hr % 12 || 12} ${hr >= 12 ? 'PM' : 'AM'}`; }
function mix(hex, a, base = [15, 15, 18]) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `rgb(${c.map((v, i) => Math.round(base[i] + (v - base[i]) * a)).join(',')})`;
}
function slot(s, e) {
  return { x: BX, y: yOf(s) + 2, w: BW, h: Math.max(34, (e - s) * HOUR - 4) };
}
function setBox(el, x, y, w, hh) {
  const k = `${x.toFixed(1)},${y.toFixed(1)},${w.toFixed(1)},${hh.toFixed(1)}`;
  if (el.__bx === k) return;
  el.__bx = k;
  el.style.left = `${x.toFixed(1)}px`; el.style.top = `${y.toFixed(1)}px`;
  el.style.width = `${w.toFixed(1)}px`; el.style.height = `${hh.toFixed(1)}px`;
}

// the now-line clock: 8 AM -> 3:10 PM, hold on the capstone, then on to 10 PM
const S1 = [6.05, 7.75], S2 = [9.05, 10.15];
function hourAt(t) {
  if (t < S1[1]) return lerp(8, CUT, ease.inOutCubic(prog(t, S1[0], S1[1])));
  if (t < S2[0]) return CUT;
  return lerp(CUT, 22, ease.inOutCubic(prog(t, S2[0], S2[1])));
}
function crossAt(hr) {
  let a = S1[0], b = S2[1];
  for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (hourAt(m) >= hr) b = m; else a = m; }
  return b;
}
const smooth = (k) => { const x = clamp(k); return x * x * (3 - 2 * x); };

function blockEl(title, meta, color, sm, cap) {
  return h(`<div class="dy-blk${sm ? ' sm' : ''}" style="background:${mix(color, 0.24)};border-left:6px solid ${color}">
    <div class="dy-br"><span class="dy-blk-t">${title}</span><span class="dy-blk-m">${meta}</span>${cap ? '<span class="dy-part">did 1h 10m of 2h</span>' : ''}<span class="dy-ok">${ICONS.check}</span></div></div>`);
}

export default {
  id: 'day',
  dur: DUR,
  mount(sec) {
    const bands = makeBands(['plan the day check it off', 'deep work gym coffee chat', 'said vs did said vs did', 'read 20 pages reply to marcus'], { size: 210, top: 120 });
    sec.appendChild(bands.el);

    // ---- calendar layer: task list card + day column ----
    const layer = h('<div class="lh-layer" style="z-index:5"></div>');
    sec.appendChild(layer);

    const taskCard = h(`<div class="dy-card" style="left:${TC.x}px;top:${TC.y}px;width:${TC.w}px;height:${TC.h}px">
      <div class="dy-card-h"><b>Tasks</b>${logo('canvas', 30)}${logo('linkedin', 30)}${logo('notion', 30)}<span class="dy-pill">6 to plan</span></div>
      <div class="dy-tasks">${TASKS.map((k) => `<div class="dy-task"><span class="dy-tbox" style="border-color:${k.c}"></span><div class="dy-tmain"><div class="dy-tt">${k.t}</div><div class="dy-tm">${k.m}</div></div><span class="dy-ttag">${k.d}</span></div>`).join('')}</div>
    </div>`);
    layer.appendChild(taskCard);
    const pill = taskCard.querySelector('.dy-pill');
    const rows = [...taskCard.querySelectorAll('.dy-task')];

    let grid = '';
    for (let hr = 8; hr <= 22; hr++) {
      grid += `<div class="dy-hr" style="top:${HDR + (hr - 8) * HOUR}px;left:${GUT - 8}px;right:16px"><span style="left:${-(GUT - 8) + 20}px">${hrLabel(hr)}</span></div>`;
    }
    const calCard = h(`<div class="dy-card" style="left:${CAL.x}px;top:${CAL.y}px;width:${CAL.w}px;height:${CAL.h}px">
      <div class="dy-card-h"><b>${TODAY}</b><span class="dy-sub">Today</span></div>${grid}</div>`);
    layer.appendChild(calCard);

    const sync = makeChip('gcal', 'Connecting to Google Calendar', 'Synced with Google Calendar', { size: 30 });
    sync.el.classList.add('lh-abs');
    sync.el.style.cssText += `;left:auto;right:${1920 - (CAL.x + CAL.w - 20)}px;top:${CAL.y + 12}px;z-index:4;transform-origin:100% 50%;box-shadow:none`;
    layer.appendChild(sync.el);

    const blocks = [];
    for (const f of FIXED) {
      const sl = slot(f.s, f.e);
      const el = blockEl(f.b, f.bm, f.c, sl.h < 48, false);
      layer.appendChild(el);
      setBox(el, sl.x, sl.y, sl.w, sl.h);
      blocks.push({ el, sl, fixed: true, e: f.e, ok: el.querySelector('.dy-ok') });
    }
    TASKS.forEach((k, i) => {
      const sl = slot(k.s, k.e);
      const el = blockEl(k.b, k.bm, k.c, sl.h < 48, k.cap);
      layer.appendChild(el);
      blocks.push({ el, sl, i, e: k.e, cap: !!k.cap, row: rows[i], tag: rows[i].querySelector('.dy-ttag'), when: k.when, ok: el.querySelector('.dy-ok'), part: el.querySelector('.dy-part') });
    });
    const rest = h(`<div class="dy-rest"><span>50m left</span><span class="dy-rest-to" style="margin-left:auto;display:flex;align-items:center;gap:10px">${logo('clock', 22)}Tue 9 AM</span></div>`);
    layer.appendChild(rest);
    const restSl = slot(CUT, 16);
    setBox(rest, restSl.x, restSl.y, restSl.w, restSl.h);
    const restTo = rest.querySelector('.dy-rest-to');

    const now = h('<div class="dy-now"><span class="dy-now-l"></span></div>');
    now.style.width = `${BW + 12}px`;
    layer.appendChild(now);
    const nowL = now.querySelector('.dy-now-l');
    const hrLabels = [...calCard.querySelectorAll('.dy-hr span')].map((el, i) => ({ el, y: yOf(8 + i) }));

    // ---- dashboard layer: the full command center for the pull back ----
    const dlayer = h('<div class="lh-layer" style="z-index:6"></div>');
    const dash = makeDashboard();
    dlayer.appendChild(dash.el);
    sec.appendChild(dlayer);

    // ---- week card (stage coords) ----
    const week = h(`<div class="dy-week lh-abs">
      <div class="dy-week-h"><span class="dy-wmark"></span><b>This week</b><span class="r">said vs did</span></div>
      ${WEEK.map((w) => `<div class="dy-wrow"><div class="dy-wtop"><span class="dy-wl">${w.l}</span><span class="dy-wv">${w.said ? `<i>${w.said}</i>` : ''}<span class="v"></span></span><span class="dy-wok${w.full ? '' : ' off'}">${ICONS.check}</span></div><div class="dy-bar"><div class="dy-fill" style="background:${w.fill}"></div></div></div>`).join('')}
    </div>`);
    const wmark = makeMark(54);
    week.querySelector('.dy-wmark').appendChild(wmark.el);
    sec.appendChild(week);
    const wrows = [...week.querySelectorAll('.dy-wrow')].map((r, j) => ({ ...WEEK[j], v: r.querySelector('.v'), ok: r.querySelector('.dy-wok'), fill: r.querySelector('.dy-fill') }));

    // ---- chips, scrims, headline ----
    const topScrim = h('<div class="dy-topscrim"></div>');
    sec.appendChild(topScrim);
    const scrim = h('<div class="lh-scrim"></div>');
    sec.appendChild(scrim);
    const move = makeChip('gcal', 'Capstone: 50m left. Finding a slot', 'Capstone: 50m left. Moved to Tue 9 AM', { size: 40 });
    move.el.classList.add('lh-abs'); move.el.style.zIndex = 28;
    sec.appendChild(move.el);

    const head = makeHeadline([
      { a: 0.25, b: 5.45, text: 'it plans your day.' },
      { a: 5.6, b: 13.15, text: 'and checks you did it.' },
      { a: 13.35, b: DUR, text: 'plans made. plans kept.' },
    ]);
    sec.appendChild(head.el);

    // measure while layers are untransformed
    for (const b of blocks) if (!b.fixed) b.from = boxIn(b.row, layer);
    for (const b of blocks) b.tc = b.cap ? Infinity : crossAt(b.e);
    const calPanel = boxIn(dash.panels.cal, dlayer);
    const WW = week.offsetWidth, WH = week.offsetHeight;
    const WX = 960 - WW / 2, WY = Math.max(220, 200 + (1080 - 200 - WH) / 2);
    move.w = move.el.offsetWidth;

    const keys = [
      { t: 0, cx: 960, cy: 540, z: 1 }, { t: 5.0, cx: 960, cy: 540, z: 1 },
      { t: 6.1, cx: CX2, cy: CY0, z: Z2 },
    ];
    const dkeys = [{ t: 13.1, ...FULL, z: 0.875 }, { t: DUR, ...FULL, z: 0.81, ease: ease.outCubic }];
    return { hrLabels, bands, layer, taskCard, calCard, pill, rows, sync, blocks, rest, restTo, now, nowL, dlayer, dash, week, wmark, wrows,
      topScrim, scrim, move, head, calPanel, WW, WH, WX, WY, keys, dkeys };
  },

  render(t, c) {
    c.bands.render(t);
    setStyle(c.bands.el, { o: (0.4 + 0.6 * ep(t, 0, 0.5)) * (1 - 0.5 * ep(t, 4.8, 5.8)) });

    // ---------- calendar layer camera: still, push into the day, then ride the now-line ----------
    const hr = hourAt(t);
    const nowY = yOf(hr);
    let cam;
    if (t < 6.1) cam = camAt(c.keys, t);
    else {
      const k = smooth((nowY - 39 - CY0) / (CY1 - CY0));
      cam = { cx: CX2, cy: lerp(CY0, CY1, k), z: Z2 * (1 - 0.1 * ep(t, 10.5, 11.0, ease.inCubic)) };
    }
    camera(c.layer, cam.cx, cam.cy, cam.z);
    const lo = (1 - ep(t, 10.5, 10.95)).toFixed(3); // camera owns the transform, so opacity is written directly
    if (c.layer.__o !== lo) { c.layer.style.opacity = lo; c.layer.__o = lo; }

    // cards rise in
    const kt = ease.outQuint(prog(t, 0.1, 0.75));
    setStyle(c.taskCard, { o: kt * (1 - ep(t, 5.0, 5.8)), y: (1 - kt) * 40 });
    const kc = ease.outQuint(prog(t, 0.25, 0.9));
    setStyle(c.calCard, { o: kc, y: (1 - kc) * 40 });

    // Google Calendar sync chip in the calendar header
    const ks = ease.outBack(prog(t, 0.55, 0.95));
    setStyle(c.sync.el, { o: ep(t, 0.55, 0.8), s: 0.85 + 0.15 * ks });
    c.sync.set(t > 1.35, t);

    // blocks: fixed events pop in on sync, tasks lift off the list and fly to their slots
    for (const b of c.blocks) {
      if (b.fixed) {
        const j = c.blocks.indexOf(b);
        const pop = spring(t, 1.45 + j * 0.12, { freq: 2.2, damp: 0.6 });
        setStyle(b.el, { o: clamp(pop * 2), s: 0.92 + 0.08 * pop });
      } else {
        const fa = 2.0 + b.i * 0.42, fb = fa + 0.8;
        const k = ease.inOutCubic(prog(t, fa, fb));
        const f = b.from, s = b.sl;
        let hh = lerp(f.h, s.h, k);
        if (b.cap) hh = lerp(hh, (CUT - 14) * HOUR - 4, ease.inOutCubic(prog(t, 7.8, 8.15)));
        setBox(b.el, lerp(f.x, s.x, k), lerp(f.y, s.y, k) - 70 * Math.sin(Math.PI * k), lerp(f.w, s.w, k), hh);
        setStyle(b.el, { o: ep(t, fa, fa + 0.12), s: 1 + 0.04 * Math.sin(Math.PI * k) });
        toggle(b.el, 'fly', k > 0 && k < 1);
        const lift = t > fa - 0.3 && t < fa + 0.35;
        toggle(b.row, 'lift', lift);
        toggle(b.row, 'sched', t >= fa + 0.35);
        setText(b.tag, t >= fa + 0.35 ? b.when : TASKS[b.i].d);
        setStyle(b.row, { s: 1 + 0.025 * win(t, fa - 0.3, fa + 0.35, 0.15, 0.15) });
        if (b.cap) {
          const kp = ease.outBack(prog(t, 7.8, 8.15));
          setStyle(b.part, { o: ep(t, 7.8, 7.95), s: 0.6 + 0.4 * kp });
        }
      }
      // tick done as the now-line passes the block's end
      const kk = ease.outBack(prog(t, b.tc, b.tc + 0.3));
      setStyle(b.ok, { o: ep(t, b.tc, b.tc + 0.1), s: 0.3 + 0.7 * kk });
    }
    setText(c.pill, t >= 2.0 + 5 * 0.42 + 0.35 ? 'all 6 planned' : '6 to plan');

    // the unfinished 50m: dashed, then moved to Tue
    const kr = ep(t, 7.85, 8.15);
    const kgo = ease.inCubic(prog(t, 8.8, 9.25));
    setStyle(c.rest, { o: kr * (1 - kgo), x: kgo * 140, y: (1 - kr) * 10 });
    setStyle(c.restTo, { o: ep(t, 8.6, 8.8) });

    // now-line
    setStyle(c.now, { x: BX - 6, y: nowY, o: ep(t, 5.8, 6.1) });
    setText(c.nowL, fmtHr(hr));
    const nv = ep(t, 5.8, 6.1);
    for (const l of c.hrLabels) setStyle(l.el, { o: 1 - nv * (1 - clamp((Math.abs(nowY - l.y) - 10) / 14)) });

    setStyle(c.topScrim, { o: ep(t, 5.1, 5.9) * (1 - ep(t, 10.5, 10.9)) });
    setStyle(c.scrim, { o: win(t, 7.8, 9.95, 0.4, 0.4) });
    const km = ease.outBack(prog(t, 7.95, 8.4));
    c.move.set(t > 8.6, t);
    setStyle(c.move.el, { x: 960 - c.move.w / 2, y: 950 + (1 - km) * 40, o: win(t, 7.95, 9.75, 0.35, 0.3) });

    // ---------- dashboard ----------
    const dc = camAt(c.dkeys, t);
    camera(c.dlayer, dc.cx, dc.cy, dc.z);
    const kw = ep(t, 13.15, 13.7);
    setStyle(c.dash.el, { o: kw, y: (1 - kw) * 30 });
    revealDashboard(c.dash, t, 13.3, { step: 0.08, order: ['school', 'network', 'projects', 'apps', 'email', 'daily', 'cal'] });
    c.dash.mark.render(t);
    setRowDone(c.dash.rows.network[0], ep(t, 14.6, 14.9));
    setRowDone(c.dash.rows.daily[0], ep(t, 15.0, 15.3));

    // ---------- week card: rises, bars fill, then folds into the Calendar panel ----------
    const kin = ease.outQuint(prog(t, 10.7, 11.35));
    const kf = ease.inOutCubic(prog(t, 13.25, 14.0));
    const pb = c.calPanel;
    const tw = pb.w * dc.z, th = pb.h * dc.z;
    const s1 = tw / c.WW;
    const s0 = 0.96 + 0.04 * kin;
    const sc = lerp(s0, s1, kf);
    const x0 = 960 - (c.WW * s0) / 2, y0 = c.WY + (1 - kin) * 70 + (c.WH * (1 - s0)) / 2;
    const x1 = 960 + (pb.x - dc.cx) * dc.z, y1 = 540 + (pb.y - dc.cy) * dc.z + th / 2 - (c.WH * s1) / 2;
    setStyle(c.week, { x: lerp(x0, x1, kf), y: lerp(y0, y1, kf), s: sc, o: kin * (1 - ep(t, 13.75, 14.05)) });
    c.week.style.visibility = t < 10.65 || t > 14.1 ? 'hidden' : 'visible';
    c.wmark.render(t);
    c.wrows.forEach((r, j) => {
      const a = 11.05 + j * 0.22;
      const kb = ease.inOutCubic(prog(t, a, a + 0.95));
      const wd = `${(r.frac * kb * 100).toFixed(2)}%`;
      if (r.fill.__w !== wd) { r.fill.style.width = wd; r.fill.__w = wd; }
      setText(r.v, r.val(kb));
      if (r.full) setStyle(r.ok, { o: ep(t, a + 0.85, a + 0.95), s: 0.4 + 0.6 * ease.outBack(prog(t, a + 0.85, a + 1.15)) });
    });

    c.head.render(t);
  },
};
