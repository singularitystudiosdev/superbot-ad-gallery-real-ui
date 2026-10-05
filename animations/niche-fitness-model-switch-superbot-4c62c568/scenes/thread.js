// scenes/thread.js: one continuous take of the superbot thread for "Build a 12-week half marathon plan and put it on
// my Garmin". Each step goes to the thing built for it: Garmin is connected first (its consent page grants Activities
// in and Workouts out), Gemini 3.8 Flash reads the 41 runs (bulk activity data: the fast, cheap long-context model),
// GPT-6 Astra works out the goal and the 12-week ramp (the reasoning step), Claude Opus 5.5 writes the 48 workouts
// as Garmin structured workouts (precise structured writing), Garmin puts them on the calendar (Training API), and
// they land in Garmin Connect's Calendar on the phone, beside the thread that sent them.
// Motion: rows enter with superbot's own switch motion and push the thread up through eased heights (transform
// only); the thread, the cursor and the calendar's ring follow critically damped closed-form springs, so any t
// renders on its own and every retarget keeps its velocity. One focal move per beat; no camera pushes.
import { seg, lerp, press, blink, streamCount } from '../lib.js';
import { makeMark } from '../shell.js';
import { ASK, RUNNER, HISTORY, BASELINE, GOAL, WEEKS, EASY_WEEKS, PACES, WEEK1, WORKOUTS, MONTH, RUN_DAYS, DAY_CARD, MODELS } from './thread-parts/data.js';
import { outCubic, enter, exit, follow, leg, sine, smoother } from './thread-parts/ease.js';
import { h, buildApp, userRow, pillRow, whoRow, stepRow, connectRow, paintPill, paintStep, paintConnect, chipMarkHTML } from './thread-parts/feed.js';
import { baselineRow, paintBaseline, planRow, paintPlan, weekRow, paintWeek } from './thread-parts/cards.js';
import { buildPopup, paintToggle } from './thread-parts/garmin.js';
import { buildPhone } from './thread-parts/phone.js';

// ---------- the schedule (scene-local seconds) ----------
const S = {
  type: 0.55, cps: 36, send: 2.27, greetOut: [2.25, 2.53], dock: [2.31, 2.91], user: 2.45,
  g1: 2.9, card: 3.15, btnClick: 3.77, wait: 3.83, popIn: [3.9, 4.4], togClick: 4.85, saveClick: 5.35,
  popOut: [5.43, 5.75], conn: 5.77, g1Done: 5.87, g1Step: [6.02, 6.6],
  fl: 6.85, flDone: 7.5, flWho: 7.57, fl1: [7.77, 8.6], flCard: 8.65,
  as: 9.55, asDone: 10.2, asWho: 10.27, as1: [10.47, 11.3], asCard: 11.35,
  cl: 13.6, clDone: 14.25, clWho: 14.32, cl1: [14.52, 16.7], clCard: 14.72, clGap: 0.45, clCps: 70,
  g5: 16.95, g5Done: 17.6, g5Step: [17.68, 20.05], phIn: [17.8, 18.6], bars: 18.6, barGap: 0.07, sel: 19.95, day: 20.1,
  phOut: [21.75, 22.3], dur: 22.55,
};
const SWAPS = [[S.fl + 0.2, 'gemini'], [S.as + 0.2, 'openai'], [S.cl + 0.2, 'claude']];
const GROUP_AT = [0, S.g1, S.fl, S.as, S.cl, S.g5];
const ROW_IN = 0.42; // superbot --duration-switch-row (420ms, out-cubic, 10px rise)
const LEAD = 0.12;  // a row's slot starts opening this long before its content rises into it
const PAD_TOP = 30, PAD_BOT = 22, NEST = 35;

let R = null; // everything mount() built
let lay = null; // the layout for the current frame width (re-measured when it changes or fonts arrive)

// ---------- build ----------
function addRow(list, el, g, T, gap, extra = {}) {
  const r = { el, g, T, gap, nest: el.classList.contains('nest'), h: 0, ...extra };
  list.push(r);
  return r;
}

function mount(sec) {
  const root = h('<div class="ys-root"></div>');
  sec.appendChild(root);
  const app = buildApp(makeMark);
  root.appendChild(app.el);
  const rows = [];
  addRow(rows, userRow(ASK), 0, S.user, 0);
  // g1: Garmin, connected before anything is read
  const g1 = pillRow(MODELS.garmin);
  addRow(rows, g1.el, 1, S.g1, 18);
  const card = connectRow(MODELS.garmin, RUNNER.name, 'Connect it to read your runs and add workouts.');
  const cardIdx = rows.length;
  addRow(rows, card.el, 1, S.card, 8, { grow: 0.5 });
  const g1s = stepRow();
  addRow(rows, g1s.el, 1, S.g1Step[0], 8);
  // g2: Gemini 3.8 Flash reads the runs
  const fl = pillRow(MODELS.gemini);
  addRow(rows, fl.el, 2, S.fl, 20);
  addRow(rows, whoRow(MODELS.gemini), 2, S.flWho, 8);
  const fl1 = stepRow();
  addRow(rows, fl1.el, 2, S.fl1[0], 6);
  const base = baselineRow(BASELINE);
  addRow(rows, base.el, 2, S.flCard, 10, { grow: 0.5 });
  // g3: GPT-6 Astra sets the goal and the ramp
  const as = pillRow(MODELS.openai);
  addRow(rows, as.el, 3, S.as, 20);
  addRow(rows, whoRow(MODELS.openai), 3, S.asWho, 8);
  const as1 = stepRow();
  addRow(rows, as1.el, 3, S.as1[0], 6);
  const plan = planRow(GOAL, WEEKS, EASY_WEEKS, PACES);
  addRow(rows, plan.el, 3, S.asCard, 10, { grow: 0.55 });
  // g4: Claude Opus 5.5 writes the workouts
  const cl = pillRow(MODELS.claude);
  addRow(rows, cl.el, 4, S.cl, 20);
  addRow(rows, whoRow(MODELS.claude), 4, S.clWho, 8);
  const cl1 = stepRow();
  addRow(rows, cl1.el, 4, S.cl1[0], 6);
  const week = weekRow(`Week 1 of 12 · ${WEEKS[0]} mi`, WEEK1);
  addRow(rows, week.el, 4, S.clCard, 10, { grow: 0.55 });
  // g5: Garmin puts them on the calendar
  const g5 = pillRow(MODELS.garmin);
  addRow(rows, g5.el, 5, S.g5, 20);
  const g5s = stepRow();
  addRow(rows, g5s.el, 5, S.g5Step[0], 8);
  rows.forEach((r) => app.feedIn.appendChild(r.el));

  const dim = h('<div class="ys-dim"></div>');
  const pop = buildPopup();
  const phone = buildPhone(MONTH, RUN_DAYS, DAY_CARD);
  const cursor = h('<svg class="ys-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg>');
  root.append(dim, pop.el, phone.el, cursor);
  R = { root, app, rows, cardIdx, g1, card, g1s, fl, fl1, base, as, as1, plan, cl, cl1, week, g5, g5s, dim, pop, phone, cursor };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { lay = null; });
}

// ---------- measure (layout px of the app, before its scale) ----------
const offIn = (el, root) => {
  let x = 0, y = 0;
  for (let n = el; n && n !== root; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
};

function measure(W) {
  const s = Math.min(1.6, W / 720);
  const appW = W / s, appH = 1080 / s, col = Math.min(640, appW - 40);
  const { app, rows, pop, phone } = R;
  app.el.style.width = `${appW}px`; app.el.style.height = `${appH}px`;
  app.el.style.setProperty('--col', `${col}px`);
  rows.forEach((r) => { r.h = r.el.offsetHeight; });
  const compH = app.comp.offsetHeight;
  const homeH = app.home.offsetHeight;
  const homeTop = Math.max(24, (appH - (homeH + 28 + compH)) / 2 - 8);
  const dockTop = appH - 18 - compH;
  const feedH = dockTop - 4;
  app.feed.style.height = `${feedH}px`;
  // the thread's bottom after each row has fully grown -> the scroll each row asks for
  let acc = PAD_TOP;
  const keys = [[0, 0]];
  rows.forEach((r) => { acc += r.gap + r.h; keys.push([r.T, Math.max(0, acc + PAD_BOT - feedH)]); });
  // the composer chip's width for each label it will wear
  const chipW = {};
  for (const k of ['superbot', 'gemini', 'openai', 'claude']) {
    app.chipMark.innerHTML = chipMarkHTML(MODELS[k]); app.chipLbl.textContent = MODELS[k].label;
    chipW[k] = app.chipIn.offsetWidth;
  }
  app.chip._k = null;
  // the consent popup: its own scale, a little left of centre like a Chrome popup over the app
  const popW = pop.el.offsetWidth, popH = pop.el.offsetHeight;
  const popS = Math.min(1.45, (W - 80) / popW, 1000 / (popH || 600));
  const popX = Math.min(W - popW * popS - 40, W * 0.5 - 30 - (popW * popS) / 2), popY = (1080 - popH * popS) / 2;
  const togOff = offIn(pop.tog, pop.el), saveOff = offIn(pop.save, pop.el);
  // the phone: right of the thread, which slides left to make room for it
  const phS = Math.min(1.07, 960 / 868, W / 900);
  const phW = 414 * phS;
  const phX = Math.min(W - phW - 60, W * 0.73 - phW / 2), phY = (1080 - 868 * phS) / 2;
  const colRight = (lay0colX(appW, col) + col) * s;
  const shift = Math.max(0, colRight - (phX - 40));
  const cell = (i) => ({ x: phone.cellEls[i].offsetLeft, w: phone.cellEls[i].offsetWidth, y: phone.cellEls[i].offsetTop });
  return {
    W, s, appW, appH, col, colX: lay0colX(appW, col), homeTop, dockTop, feedH, keys, chipW,
    popS, popX, popY, btnOff: offIn(R.card.btn, R.card.el),
    tog: { x: popX + togOff.x * popS, y: popY + togOff.y * popS },
    save: { x: popX + saveOff.x * popS, y: popY + saveOff.y * popS },
    phS, phX, phY, shift, ringFrom: cell(phone.todayIdx), ringTo: cell(phone.selIdx),
  };
}
const lay0colX = (appW, col) => (appW - col) / 2;

// ---------- thread geometry as a function of t ----------
// a row opens its slot on the minimum-jerk profile (no front-loaded shove of the rows around it); its content
// follows LEAD later, so rows revealed close together never sit on top of each other
const grow = (r, t) => smoother(seg(t, r.T, r.T + (r.grow || 0.4)));
function rowTop(i, t) {
  let y = PAD_TOP;
  for (let j = 0; j < i; j++) { const r = R.rows[j]; y += (r.gap + r.h) * grow(r, t); }
  return y + R.rows[i].gap * grow(R.rows[i], t);
}
const scrollAt = (t) => follow(t, lay.keys);
/** where a point inside a row sits on the stage at time t */
function rowPt(i, off, t) {
  const r = R.rows[i];
  const x = lay.colX + (r.nest ? NEST : 0) + off.x, y = rowTop(i, t) - scrollAt(t) + off.y;
  return { x: x * lay.s, y: y * lay.s };
}

// dims: the active switch reads full, the one before it .55, older .3 (overlay.switch-row-prev / -older)
function dimOf(g, t) {
  if (g === 0) return 1;
  let n = 0;
  for (let k = g + 1; k < GROUP_AT.length; k++) n += sine(seg(t, GROUP_AT[k], GROUP_AT[k] + 0.4));
  return n <= 1 ? lerp(1, 0.55, n) : lerp(0.55, 0.3, Math.min(1, n - 1));
}

// ---------- paint ----------
function paintHome(t) {
  const { app } = R;
  const out = exit(seg(t, S.greetOut[0], S.greetOut[1]));
  app.home.style.transform = `translateY(${(lay.homeTop - 14 * out).toFixed(2)}px)`;
  app.home.style.opacity = (1 - out).toFixed(3);
  app.mark.render(t);
  const homeCompTop = lay.homeTop + app.home.offsetHeight + 28;
  // the composer settles into the dock on a critically damped spring: it leaves at rest and lands at rest
  const y = follow(t, [[0, homeCompTop], [S.dock[0], lay.dockTop]], 120, 22);
  app.comp.style.transform = `translate(${lay.colX.toFixed(1)}px, ${y.toFixed(2)}px)`;
  // the draft types, the send button lights while there is one, then clears on send
  const n = t < S.send + 0.04 ? streamCount(ASK, S.type, S.cps, t) : 0;
  const text = ASK.slice(0, n);
  if (app.text.textContent !== text) app.text.textContent = text;
  app.hint.style.display = n ? 'none' : '';
  app.text.classList.toggle('caret', n > 0 && (t < S.type + ASK.length / S.cps || blink(t)));
  app.send.classList.toggle('on', n > 0);
  app.send.style.transform = `scale(${(1 - 0.12 * press(t, S.send)).toFixed(3)})`;
}

function paintChip(t) {
  const { app } = R;
  let k = 'superbot', from = 'superbot', w = lay.chipW.superbot, dip = 0, pop = 0;
  for (const [at, m] of SWAPS) {
    if (t >= at) { from = k; k = m; }
    const d = seg(t, at - 0.14, at + 0.14);
    dip = Math.max(dip, Math.sin(Math.PI * d));
    if (t >= at) pop = Math.max(pop, 1 - outCubic(seg(t, at, at + 0.4)));
    if (t >= at - 0.14 && t < at + 0.14) w = lerp(lay.chipW[t >= at ? from : k], lay.chipW[t >= at ? k : m], sine(d));
    else if (t >= at + 0.14) w = lay.chipW[m];
  }
  if (app.chip._k !== k) { app.chip._k = k; app.chipMark.innerHTML = chipMarkHTML(MODELS[k]); app.chipLbl.textContent = MODELS[k].label; }
  app.chip.style.width = `${w.toFixed(1)}px`;
  app.chipIn.style.opacity = (1 - 0.85 * dip).toFixed(3);
  app.chipIn.style.transform = `scale(${(1 + 0.08 * pop).toFixed(3)})`;
}

function paintRows(t) {
  const sc = scrollAt(t);
  R.app.feedIn.style.transform = `translate(${lay.colX.toFixed(1)}px, ${(-sc).toFixed(2)}px)`;
  let y = PAD_TOP;
  for (const r of R.rows) {
    const e = grow(r, t);
    const top = y + r.gap * e;
    y += (r.gap + r.h) * e;
    const vis = outCubic(seg(t, r.T + LEAD, r.T + LEAD + ROW_IN));
    r.el.style.visibility = t < r.T + LEAD ? 'hidden' : 'visible';
    r.el.style.opacity = (vis * dimOf(r.g, t)).toFixed(3);
    r.el.style.transform = `translateY(${(top + (1 - vis) * 10).toFixed(2)}px)`;
  }
}

const count = (n, t, a, b) => Math.round(n * sine(seg(t, a, b)));

function paintSwitches(t) {
  const { g1, card, g1s, fl, fl1, base, as, as1, plan, cl, cl1, week, g5, g5s } = R;
  paintPill(g1, t, S.g1, S.g1Done, ['Connecting to Garmin', 'Connected to Garmin']);
  paintConnect(card, t, S.wait, S.conn, press(t, S.btnClick));
  paintStep(g1s, t, S.g1Step[0], S.g1Step[1], ['Getting your runs', `Got ${HISTORY.runs} runs`], ['', `${HISTORY.from} to ${HISTORY.to}`]);

  paintPill(fl, t, S.fl, S.flDone, ['Switching to Gemini 3.8 Flash', 'Switched to Gemini 3.8 Flash']);
  const read = count(HISTORY.runs, t, S.fl1[0] + 0.05, S.fl1[1] - 0.05);
  paintStep(fl1, t, S.fl1[0], S.fl1[1], ['Reading splits and heart rate', 'Found your baseline'], [`${read} of ${HISTORY.runs} runs`, `from ${HISTORY.runs} runs`]);
  paintBaseline(base, t, S.flCard + LEAD + 0.1);

  paintPill(as, t, S.as, S.asDone, ['Switching to GPT-6 Astra', 'Switched to GPT-6 Astra']);
  paintStep(as1, t, S.as1[0], S.as1[1], ['Predicting your race time', `Goal: ${GOAL.time}`], ['', 'from your 10K, 52:30']);
  paintPlan(plan, t, S.asCard + LEAD + 0.1);

  paintPill(cl, t, S.cl, S.clDone, ['Switching to Claude Opus 5.5', 'Switched to Claude Opus 5.5']);
  const wrote = count(WORKOUTS, t, S.cl1[0] + 0.05, S.cl1[1] - 0.05);
  paintStep(cl1, t, S.cl1[0], S.cl1[1], [`Writing ${WORKOUTS} workouts`, `Wrote ${WORKOUTS} workouts`], [`${wrote} of ${WORKOUTS}`, 'as Garmin workouts']);
  paintWeek(week, t, S.clCard + LEAD + 0.1, S.clGap, S.clCps, WEEK1);

  paintPill(g5, t, S.g5, S.g5Done, ['Connecting to Garmin', 'Connected to Garmin']);
  const added = count(WORKOUTS, t, S.bars, S.bars + R.phone.bars.length * S.barGap + 0.3);
  paintStep(g5s, t, S.g5Step[0], S.g5Step[1], ['Adding workouts to your calendar', `Added ${WORKOUTS} workouts`], [`${added} of ${WORKOUTS}`, 'Syncs to your watch']);
}

function paintPopup(t) {
  const { pop } = R;
  const on = t >= S.popIn[0] && t <= S.popOut[1];
  pop.el.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  const a = enter(seg(t, S.popIn[0], S.popIn[1])), b = exit(seg(t, S.popOut[0], S.popOut[1]));
  const sc = lay.popS * lerp(0.94, 1, a) * lerp(1, 0.97, b);
  const cx = lay.popX + (pop.el.offsetWidth * lay.popS) / 2, cy = lay.popY + (pop.el.offsetHeight * lay.popS) / 2;
  pop.el.style.transform = `translate(${(cx - (pop.el.offsetWidth * sc) / 2).toFixed(1)}px, ${(cy - (pop.el.offsetHeight * sc) / 2 + lerp(18, 0, a)).toFixed(1)}px) scale(${sc.toFixed(4)})`;
  pop.el.style.opacity = (sine(seg(t, S.popIn[0], S.popIn[0] + 0.34)) * (1 - sine(seg(t, S.popOut[0], S.popOut[1])))).toFixed(3);
  paintToggle(pop, t, S.togClick + 0.04, press(t, S.togClick));
  pop.save.style.transform = `scale(${(1 - 0.04 * press(t, S.saveClick)).toFixed(3)})`;
}

function paintCursor(t) {
  const c = R.cursor;
  const v = seg(t, S.card, S.card + 0.15) * (1 - seg(t, S.popOut[0] + 0.15, S.popOut[1] + 0.3));
  c.style.visibility = v > 0 ? 'visible' : 'hidden';
  if (v <= 0) return;
  const start = { x: lay.W * 0.8, y: 1000 };
  const btn = rowPt(R.cardIdx, lay.btnOff, t);
  const away = { x: lay.save.x + 240, y: lay.save.y - 40 };
  let p;
  if (t < S.btnClick + 0.23) p = leg(t, S.card + 0.05, S.btnClick - 0.07, start, btn, 50);
  else if (t < S.togClick + 0.1) p = leg(t, S.btnClick + 0.23, S.togClick - 0.12, btn, lay.tog, -40);
  else if (t < S.saveClick + 0.12) p = leg(t, S.togClick + 0.1, S.saveClick - 0.08, lay.tog, lay.save, 30);
  else p = leg(t, S.saveClick + 0.12, S.popOut[1] + 0.3, lay.save, away, 20);
  const pr = Math.max(press(t, S.btnClick), press(t, S.togClick), press(t, S.saveClick));
  c.style.opacity = v.toFixed(3);
  c.style.transform = `translate(${(p.x - 6).toFixed(1)}px, ${(p.y - 3.75).toFixed(1)}px) scale(${(1 - 0.12 * pr).toFixed(3)})`;
}

// the finale: the thread slides left and dims a little, Garmin Connect's calendar rises beside it, and the plan's
// October workouts land on it in posting order while superbot's counter runs; the selection ring then springs
// from today to the first run and that day's workout rises in under the grid
function paintPhone(t) {
  const { phone, dim, app } = R;
  const a = enter(seg(t, S.phIn[0], S.phIn[1]));
  const out = sine(seg(t, S.phOut[0], S.phOut[1]));
  dim.style.opacity = (0.4 * a * (1 - out)).toFixed(3);
  app.el.style.transform = `translate(${(-lay.shift * a).toFixed(2)}px, 0) scale(${lay.s})`;
  const on = t >= S.phIn[0];
  phone.el.style.visibility = on ? 'visible' : 'hidden';
  if (!on) return;
  const sc = lay.phS * lerp(0.97, 1, a);
  const x = lay.phX + (414 * (lay.phS - sc)) / 2, y = lay.phY + (868 * (lay.phS - sc)) / 2 + lerp(80, 0, a) + 30 * out;
  phone.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${sc.toFixed(4)})`;
  phone.el.style.opacity = (sine(seg(t, S.phIn[0], S.phIn[0] + 0.45)) * (1 - out)).toFixed(3);
  phone.bars.forEach((b, k) => {
    const at = S.bars + k * S.barGap;
    b.bar.style.transform = `scaleX(${outCubic(seg(t, at, at + 0.4)).toFixed(4)})`;
    b.bar.style.opacity = sine(seg(t, at, at + 0.18)).toFixed(3);
  });
  const { ringFrom: f, ringTo: g } = lay;
  const rx = follow(t, [[0, f.x], [S.sel, g.x]], 170, 26), ry = follow(t, [[0, f.y], [S.sel, g.y]], 170, 26);
  phone.ring.style.width = `${f.w}px`;
  phone.ring.style.transform = `translate(${rx.toFixed(2)}px, ${ry.toFixed(2)}px)`;
  const d = outCubic(seg(t, S.day, S.day + 0.45));
  phone.day.style.opacity = d.toFixed(3);
  phone.day.style.transform = `translateY(${((1 - d) * 8).toFixed(2)}px)`;
}

function render(lt, ctx) {
  if (!R) return;
  if (!lay || lay.W !== ctx.W) lay = measure(ctx.W);
  paintHome(lt);
  paintChip(lt);
  paintRows(lt);
  paintSwitches(lt);
  paintPopup(lt);
  paintCursor(lt);
  paintPhone(lt);
}

export default { id: 'thread', dur: S.dur, mount, render };
