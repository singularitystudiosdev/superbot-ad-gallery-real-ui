// scenes/thread.js: one continuous take of the superbot thread for "Reply to the top comments on my latest video".
// Each step goes to the thing built for it: YouTube is connected first (nothing can be read without it), DeepSeek V4
// sorts the 1,284 comments (bulk short text: a small, fast model), Gemini 3.1 Pro watches the video for the moments
// viewers asked about (native video input), Claude Opus 5.5 writes the replies in the creator's voice, YouTube posts
// them (comments.insert), and the replies land on the video's YouTube Studio comments page.
// Motion: rows enter with superbot's own switch motion and push the thread up through eased heights (transform
// only); the thread, the cursor and Studio's list follow their targets on critically damped closed-form springs,
// so any t renders on its own and every retarget keeps its velocity. One focal move per beat; no camera pushes.
import { seg, lerp, clamp, press, blink, streamCount } from '../lib.js';
import { makeMark } from '../shell.js';
import { ASK, VIDEO, CREATOR, TOP, REPEATS, MOMENTS, REPLIES, MODELS } from './thread-parts/data.js';
import { outCubic, outBack, standard, enter, exit, follow, leg, sine, smoother } from './thread-parts/ease.js';
import {
  h, buildApp, userRow, pillRow, whoRow, stepRow, connectRow, listRow, videoRow,
  paintPill, paintStep, paintConnect, paintTyping, chipMarkHTML,
} from './thread-parts/feed.js';
import { buildPopup } from './thread-parts/google.js';
import { buildStudio } from './thread-parts/studio.js';

// ---------- the schedule (scene-local seconds) ----------
const S = {
  type: 0.55, cps: 30, send: 2.12, greetOut: [2.1, 2.38], dock: [2.16, 2.76], user: 2.3,
  yt1: 2.75, card: 3.0, btnClick: 3.62, wait: 3.68, popIn: [3.75, 4.25], cbClick: 4.62, contClick: 5.08,
  popOut: [5.2, 5.42], conn: 5.5, yt1Done: 5.6, yt1Step: [5.75, 6.25],
  ds: 6.5, dsDone: 7.15, dsWho: 7.22, ds1: [7.42, 8.25], ds2: [8.3, 8.7], dsList: 8.55, dsGap: 0.13,
  gm: 9.5, gmDone: 10.15, gmWho: 10.22, gm1: [10.42, 13.1], gmCard: 10.62, play: [10.85, 11.55, 12.25, 12.9],
  cl: 13.35, clDone: 14.0, clWho: 14.07, cl1: [14.27, 14.62], cl2: [14.5, 16.55], clRep: 14.75, clGap: 0.28, clCps: 120,
  yt2: 16.75, yt2Done: 17.4, yt2Step: 17.48, stIn: [17.55, 18.25], land: 18.4, landGap: 0.38, stOut: [21.05, 21.6],
  dur: 21.85,
};
const LANDS = TOP.map((_, i) => S.land + i * S.landGap);
const SWAPS = [[S.ds + 0.2, 'deepseek'], [S.gm + 0.2, 'gemini'], [S.cl + 0.2, 'claude']];
const GROUP_AT = [0, S.yt1, S.ds, S.gm, S.cl, S.yt2];
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
  // g1: YouTube, connected through Google before anything is read
  const yt1 = pillRow(MODELS.youtube);
  addRow(rows, yt1.el, 1, S.yt1, 18);
  const card = connectRow(MODELS.youtube, CREATOR.name);
  const cardIdx = rows.length;
  addRow(rows, card.el, 1, S.card, 8, { grow: 0.5 });
  const yt1s = stepRow();
  addRow(rows, yt1s.el, 1, S.yt1Step[0], 8);
  // g2: DeepSeek V4 sorts the comments
  const ds = pillRow(MODELS.deepseek);
  addRow(rows, ds.el, 2, S.ds, 20);
  addRow(rows, whoRow(MODELS.deepseek), 2, S.dsWho, 8);
  const ds1 = stepRow(), ds2 = stepRow();
  addRow(rows, ds1.el, 2, S.ds1[0], 6);
  addRow(rows, ds2.el, 2, S.ds2[0], 4);
  TOP.forEach((p, i) => addRow(rows, listRow(p, i, TOP.length, 'rank').el, 2, S.dsList + i * S.dsGap, i ? 0 : 10));
  // g3: Gemini 3.1 Pro watches the video
  const gm = pillRow(MODELS.gemini);
  addRow(rows, gm.el, 3, S.gm, 20);
  addRow(rows, whoRow(MODELS.gemini), 3, S.gmWho, 8);
  const gm1 = stepRow();
  addRow(rows, gm1.el, 3, S.gm1[0], 6);
  const vid = videoRow(VIDEO, MOMENTS);
  addRow(rows, vid.el, 3, S.gmCard, 10, { grow: 0.55 });
  // g4: Claude Opus 5.5 writes the replies
  const cl = pillRow(MODELS.claude);
  addRow(rows, cl.el, 4, S.cl, 20);
  addRow(rows, whoRow(MODELS.claude), 4, S.clWho, 8);
  const cl1 = stepRow(), cl2 = stepRow();
  addRow(rows, cl1.el, 4, S.cl1[0], 6);
  addRow(rows, cl2.el, 4, S.cl2[0], 4);
  const reps = TOP.map((p, i) => {
    const r = listRow(p, i, TOP.length, 'reply');
    r.rest.textContent = REPLIES[i];
    addRow(rows, r.el, 4, S.clRep + i * S.clGap, i ? 0 : 10);
    return r;
  });
  // g5: YouTube posts them
  const yt2 = pillRow(MODELS.youtube);
  addRow(rows, yt2.el, 5, S.yt2, 20);
  const yt2s = stepRow();
  addRow(rows, yt2s.el, 5, S.yt2Step, 8);
  rows.forEach((r) => app.feedIn.appendChild(r.el));

  const dim = h('<div class="ys-dim"></div>');
  const pop = buildPopup(CREATOR);
  const studio = buildStudio(VIDEO, CREATOR, TOP, REPLIES);
  const cursor = h('<svg class="ys-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5 4 19.5 8.6 15.3 11.5 21.8 14.4 20.5 11.6 14.2 17.8 14.2Z"/></svg>');
  root.append(dim, pop.el, studio.el, cursor);
  R = { root, app, rows, cardIdx, yt1, card, yt1s, ds, ds1, ds2, gm, gm1, vid, cl, cl1, cl2, reps, yt2, yt2s, dim, pop, studio, cursor };
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
  const { app, rows, studio, pop } = R;
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
  for (const k of ['superbot', 'deepseek', 'gemini', 'claude']) {
    app.chipMark.innerHTML = chipMarkHTML(MODELS[k]); app.chipLbl.textContent = MODELS[k].label;
    chipW[k] = app.chipIn.offsetWidth;
  }
  app.chip._k = null;
  // popup and Studio: their own scales, sized to the frame
  const popS = Math.min(1.45, (W - 80) / 452, 1000 / (pop.el.offsetHeight || 600));
  const popW = pop.el.offsetWidth, popH = pop.el.offsetHeight;
  const popX = Math.min(W - popW * popS - 40, W * 0.5 - 30 - (popW * popS) / 2), popY = (1080 - popH * popS) / 2;
  const stS = Math.min(1.3, (W - 80) / 1400);
  const stX = (W - 1400 * stS) / 2, stY = (1080 - 780 * stS) / 2;
  const st = studio.rows.map((r) => ({ hc: r.reply.offsetTop - 4, hr: r.el.offsetHeight - (r.reply.offsetTop - 4) }));
  const listH = studio.list.offsetHeight;
  let sacc = 0;
  const stKeys = [[0, 0]];
  st.forEach((r, i) => { sacc += r.hc + r.hr; stKeys.push([LANDS[i], Math.max(0, sacc + 20 - listH)]); });
  // cursor targets: the connect button (in the thread, moves with it) and the popup's checkbox and Continue
  const btnOff = offIn(R.card.btn, R.card.el);
  const cbOff = offIn(pop.cb, pop.el), contOff = offIn(pop.cont, pop.el);
  return {
    W, s, appW, appH, col, colX: (appW - col) / 2, homeTop, dockTop, feedH, keys, chipW,
    popS, popX, popY, stS, stX, stY, st, stKeys, btnOff,
    cb: { x: popX + cbOff.x * popS, y: popY + cbOff.y * popS },
    cont: { x: popX + contOff.x * popS, y: popY + contOff.y * popS },
  };
}

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

const fmt = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

function paintSwitches(t) {
  const { yt1, card, yt1s, ds, ds1, ds2, gm, gm1, vid, cl, cl1, cl2, reps, yt2, yt2s } = R;
  paintPill(yt1, t, S.yt1, S.yt1Done, ['Connecting to YouTube', 'Connected to YouTube']);
  paintConnect(card, t, S.wait, S.conn, press(t, S.btnClick));
  paintStep(yt1s, t, S.yt1Step[0], S.yt1Step[1], ['Finding your latest upload', 'Found your latest upload'], ['', `${VIDEO.title} · ${VIDEO.comments} comments`]);

  paintPill(ds, t, S.ds, S.dsDone, ['Switching to DeepSeek V4', 'Switched to DeepSeek V4']);
  const read = Math.round(VIDEO.commentCount * standard(seg(t, S.ds1[0] + 0.05, S.ds1[1] - 0.05)));
  paintStep(ds1, t, S.ds1[0], S.ds1[1], ['Reading comments', `Read ${VIDEO.comments} comments`], [`${read.toLocaleString('en-US')} of ${VIDEO.comments}`, '']);
  paintStep(ds2, t, S.ds2[0], S.ds2[1], ['Grouping repeat questions', `Grouped ${REPEATS} repeat questions`], ['', 'top 5 below']);

  paintPill(gm, t, S.gm, S.gmDone, ['Switching to Gemini 3.1 Pro', 'Switched to Gemini 3.1 Pro']);
  paintStep(gm1, t, S.gm1[0], S.gm1[1], ['Watching your latest video', `Watched all ${VIDEO.length}`], ['', `${MOMENTS.length} moments viewers asked about`]);
  paintVideo(vid, t);

  paintPill(cl, t, S.cl, S.clDone, ['Switching to Claude Opus 5.5', 'Switched to Claude Opus 5.5']);
  paintStep(cl1, t, S.cl1[0], S.cl1[1], ['Reading your past replies', 'Matched your voice'], ['', 'from 200 past replies']);
  paintStep(cl2, t, S.cl2[0], S.cl2[1], ['Writing 5 replies', 'Wrote 5 replies']);
  reps.forEach((r, i) => paintTyping(r, REPLIES[i], S.clRep + i * S.clGap + 0.1, S.clCps, t));

  paintPill(yt2, t, S.yt2, S.yt2Done, ['Connecting to YouTube', 'Connected to YouTube']);
  const posted = LANDS.filter((at) => t >= at).length;
  paintStep(yt2s, t, S.yt2Step, LANDS[LANDS.length - 1], ['Posting replies', 'Posted 5 replies'], [`${posted} of 5`, 'on your latest video']);
}

// Gemini's player: the playhead springs from moment to moment, each frame crossfades in as it lands, and the
// moment it found appears beside the player
function paintVideo(v, t) {
  const keys = [[S.gmCard, 0], ...S.play.map((at, i) => [at, i < MOMENTS.length ? MOMENTS[i].at / VIDEO.seconds : 1])];
  const p = clamp(follow(t, keys, 120, 22), 0, 1);
  v.fill.style.transform = `scaleX(${p.toFixed(4)})`;
  v.dot.style.left = `${(p * 100).toFixed(3)}%`;
  v.time.textContent = `${fmt(p * VIDEO.seconds)} / ${VIDEO.length}`;
  MOMENTS.forEach((m, i) => {
    const land = S.play[i] + 0.38;
    const f = sine(seg(t, land - 0.08, land + 0.26));
    v.frames[i + 1].style.opacity = f.toFixed(3);
    v.mk[i].classList.toggle('hit', t >= land);
    const a = outCubic(seg(t, land, land + ROW_IN));
    v.mo[i].style.opacity = a.toFixed(3);
    v.mo[i].style.transform = `translateY(${((1 - a) * 8).toFixed(2)}px)`;
  });
  v.frames[0].style.opacity = '1';
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
  pop.el.style.opacity = (sine(seg(t, S.popIn[0], S.popIn[0] + 0.24)) * (1 - sine(seg(t, S.popOut[0], S.popOut[1])))).toFixed(3);
  const ticked = t >= S.cbClick + 0.04;
  pop.cbOff.style.opacity = ticked ? '0' : '1';
  pop.cbOn.style.opacity = ticked ? '1' : '0';
  pop.cbOn.style.transform = `scale(${lerp(0.6, 1, outBack(seg(t, S.cbClick + 0.04, S.cbClick + 0.26))).toFixed(3)})`;
  pop.cb.style.setProperty('--ripple', (Math.sin(Math.PI * seg(t, S.cbClick, S.cbClick + 0.45)) * 0.16).toFixed(3));
  pop.cont.style.transform = `scale(${(1 - 0.04 * press(t, S.contClick)).toFixed(3)})`;
}

function paintCursor(t) {
  const c = R.cursor;
  const v = seg(t, S.card, S.card + 0.15) * (1 - seg(t, S.popOut[0] + 0.15, S.popOut[1] + 0.3));
  c.style.visibility = v > 0 ? 'visible' : 'hidden';
  if (v <= 0) return;
  const start = { x: lay.W * 0.8, y: 1000 };
  const btn = rowPt(R.cardIdx, lay.btnOff, t);
  const away = { x: lay.cont.x + 240, y: lay.cont.y - 40 };
  let p;
  if (t < S.btnClick + 0.23) p = leg(t, S.card + 0.05, S.btnClick - 0.07, start, btn, 50);
  else if (t < S.cbClick + 0.1) p = leg(t, S.btnClick + 0.23, S.cbClick - 0.12, btn, lay.cb, -40);
  else if (t < S.contClick + 0.12) p = leg(t, S.cbClick + 0.1, S.contClick - 0.08, lay.cb, lay.cont, 30);
  else p = leg(t, S.contClick + 0.12, S.popOut[1] + 0.3, lay.cont, away, 20);
  const pr = Math.max(press(t, S.btnClick), press(t, S.cbClick), press(t, S.contClick));
  c.style.opacity = v.toFixed(3);
  c.style.transform = `translate(${(p.x - 6).toFixed(1)}px, ${(p.y - 3.75).toFixed(1)}px) scale(${(1 - 0.12 * pr).toFixed(3)})`;
}

function paintStudio(t) {
  const { studio, dim, app } = R;
  const on = t >= S.stIn[0];
  studio.el.style.visibility = on ? 'visible' : 'hidden';
  const a = smoother(seg(t, S.stIn[0], S.stIn[1]));
  const out = sine(seg(t, S.stOut[0], S.stOut[1]));
  dim.style.opacity = (0.6 * a * (1 - 0.4 * out)).toFixed(3);
  // the thread steps back a little as Studio comes forward (scaled about the frame's centre)
  app.el.style.transform = `translate(${(lay.W * 0.01 * a).toFixed(2)}px, ${(10.8 * a).toFixed(2)}px) scale(${(lay.s * (1 - 0.02 * a)).toFixed(4)})`;
  if (!on) return;
  // one slow push toward the list while the replies land (the only camera move, deliberate and small)
  const push = 1 + 0.025 * standard(seg(t, S.stIn[1], S.dur));
  const sc = lay.stS * lerp(0.965, 1, a) * push;
  const ox = lay.stX + 1400 * lay.stS * 0.56, oy = lay.stY + 780 * lay.stS * 0.6;
  studio.el.style.transform = `translate(${(ox - 1400 * 0.56 * sc).toFixed(1)}px, ${(oy - 780 * 0.6 * sc + lerp(90, 0, a) + 40 * out).toFixed(1)}px) scale(${sc.toFixed(4)})`;
  // a big white window over a dark thread: a 0.4s fade in, a quicker accelerating one out before the end card
  studio.el.style.opacity = (sine(seg(t, S.stIn[0], S.stIn[0] + 0.55)) * (1 - out)).toFixed(3);
  // replies land: each comment row makes room (eased height), the "1 reply" toggle and the reply fade up into it
  let y = 0;
  studio.rows.forEach((r, i) => {
    const L = LANDS[i], m = lay.st[i];
    r.el.style.transform = `translateY(${y.toFixed(2)}px)`;
    const e = smoother(seg(t, L, L + 0.55));
    y += m.hc + m.hr * e;
    const f = outCubic(seg(t, L + 0.12, L + 0.5));
    r.reply.style.opacity = f.toFixed(3);
    r.reply.style.transform = `translateY(${((1 - f) * 8).toFixed(2)}px)`;
    r.reply.style.setProperty('--hl', (0.7 * seg(t, L + 0.12, L + 0.4) * (1 - seg(t, L + 0.5, L + 1.4))).toFixed(3));
    r.tog.style.opacity = outCubic(seg(t, L, L + 0.25)).toFixed(3);
  });
  studio.listIn.style.transform = `translateY(${(-follow(t, lay.stKeys)).toFixed(2)}px)`;
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
  paintStudio(lt);
}

export default { id: 'thread', dur: S.dur, mount, render };
