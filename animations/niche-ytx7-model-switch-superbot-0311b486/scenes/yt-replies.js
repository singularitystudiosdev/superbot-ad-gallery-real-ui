// yt-replies (3.2 s): the first result landing on YouTube. Inside the superbot window (label "Posted by superbot in
// YouTube Studio"), Studio's Community > Comments page for the mic video: a gentle push-in (comment text 22.4 -> 25.5
// stage px), Sam's five replies land under the five top comments top to bottom (reply row opens, owner pill + text
// rise in, the creator heart fills, `0 replies` turns to `1 reply`; a pop each), then Priya's comment travels to the
// top of the list and gains `Pinned by Sam Rivera` (chime). Then the screen slides across to the public watch page
// (label "Posted by superbot on YouTube"): frame-438 playing with a slow Ken Burns, the progress and the 4:38 / 14:32
// time running with lt, and the page scrolls to Priya's pinned comment with the creator heart and Sam's reply.
//
// API (default export, the motion scene contract):
//   { id: 'yt-replies', dur: 3.2, marks, mount(sec, ctx), render(lt, ctx), T }
//   marks  [{ t, kind }] scene-local: 'pop' at each reply landing, 'chime' when the pin label lands
//   T      the timing table below (for reviewers and the harness)
// render is a pure function of lt: every moving pixel is written from lt (no clock, no transitions, no <video>).
import { clamp, lerp, seg, outCubic, inOutCubic } from '../lib.js';
import { buildFrame, SCREEN, ensureCss, cssUrl } from './yt/frame.js';
import { buildStudioComments, setReply, setHeart, setPin, setCount, setComposer } from './yt/studio.js';
import { buildWatchPage } from './yt/watch.js';
import { PINNED_ID } from './yt/content.js';

const DUR = 3.2;
// the visual landing order: top to bottom of Studio's "Top comments" list (the order the camera can follow)
const LAND_ORDER = ['lena', 'marco', 'priya', 'dee', 'tom'];
export const T = {
  push: [0.15, 0.55],          // push-in + scroll to the list
  land0: 0.4, gap: 0.27,       // reply i lands at land0 + i * gap
  open: 0.3,                   // a reply's opening, seconds
  pinMove: [1.72, 2.12],       // Priya's row travels to the top (the list scrolls back with it)
  pinLabel: [1.98, 2.2],       // `Pinned by Sam Rivera` opens
  slide: [2.3, 2.72],          // Studio slides out, the watch page slides in (outCubic)
  barSwap: 2.38,               // the title bar label + brand swap from Studio to YouTube (one frame)
  watchScroll: [2.74, 3.04],   // the watch page scrolls to the pinned comment
  watchTime: 278,              // the video position when the watch page arrives (4:38), running from T.slide[0]
};
const landAt = (i) => T.land0 + i * T.gap;
const marks = [
  ...LAND_ORDER.map((id, i) => ({ t: +landAt(i).toFixed(3), kind: 'pop' })),
  { t: +(T.pinLabel[0] + 0.06).toFixed(3), kind: 'chime' },
];

// camera push-in: the zoom is measured (geometry().zoom) so the left crop edge lands exactly on the nav divider: the
// nav column and the Studio logo leave the frame whole (the title bar carries the Studio mark). About 1.29, so 14 px
// native comment text renders at about 29 stage px.
const WZOOM = 1.08;           // the watch page's push-in at the end
const r2 = (v) => Math.round(v * 2) / 2;   // half-pixel snapping for transforms that are moving
const r1 = (v) => Math.round(v);           // whole pixels for transforms at rest

let S = null;

function build(sec) {
  ensureCss(cssUrl('studio.css'));
  ensureCss(cssUrl('watch.css'));
  sec.classList.add('yr');
  // frame A: the Studio window; frame B on top of it: same window, transparent body, the YouTube label in its bar
  const A = buildFrame(sec, { label: 'Posted by superbot in YouTube Studio', mark: 'studio' });
  const B = buildFrame(sec, { label: 'Posted by superbot on YouTube', mark: 'youtube' });
  A.el.classList.add('yr-a');
  B.el.classList.add('yr-b');
  const camS = document.createElement('div');
  camS.className = 'yr-cam yr-cam-s';
  A.screen.appendChild(camS);
  const studio = buildStudioComments(camS, {});
  const camW = document.createElement('div');
  camW.className = 'yr-cam yr-cam-w';
  B.screen.appendChild(camW);
  const watch = buildWatchPage(camW, { state: 'final', scale: 1.6, time: T.watchTime });
  for (const r of studio.rows) r.el.classList.add('yr-row');
  return { sec, A, B, camS, camW, studio, watch, geo: null };
}

// layout facts, read once the stylesheets and fonts are in (native px of each page)
function geometry(s) {
  const st = s.studio;
  const css = [...document.styleSheets].some((x) => (x.href || '').includes('studio.css'))
    && getComputedStyle(st.scroller).position === 'absolute'
    && getComputedStyle(s.watch.scroller).position === 'absolute';   // watch.css is in too (anchors depend on it)
  if (!css || (document.fonts && document.fonts.status !== 'loaded')) return null;
  st.measure();
  const rows = Object.fromEntries(st.rows.map((r) => [r.id, r]));
  const listTop = st.list.offsetTop;
  const closed = Object.fromEntries(st.rows.map((r) => [r.id, r.el.offsetHeight]));
  const reply = Object.fromEntries(st.rows.map((r) => [r.id, r.h.reply]));
  const pin = rows[PINNED_ID].h.pin;
  // the visible height of the main column at full push-in (top of the camera stays put, origin top-right)
  const topbarH = st.topbar.offsetHeight;
  const navW = st.nav.offsetWidth;   // native px, its right border (the divider) included
  const zoom = SCREEN.w / (SCREEN.w - navW * st.scale);
  const viewH = SCREEN.h / zoom / st.scale - topbarH;
  const s0 = Math.max(0, listTop - 10);
  // scroll target after each reply lands: keep that reply's bottom on screen with a margin
  const targets = [];
  let y = listTop, prev = s0;
  const order = st.rows.map((r) => r.id);
  const bottoms = {};
  for (const id of order) { y += closed[id] + (LAND_ORDER.includes(id) ? reply[id] : 0); bottoms[id] = y; }
  for (const id of LAND_ORDER) {
    const tgt = Math.max(prev, bottoms[id] - viewH + 18);
    targets.push(tgt);
    prev = tgt;
  }
  // the watch page: where the pinned comment sits, so the end frame shows the comments header + Priya + Sam's reply
  const a = s.watch.anchors();
  const wTarget = Math.max(0, Math.round(a.comments - 8));
  return { zoom, rows, listTop, closed, reply, pin, viewH, s0, targets, wTarget, order };
}

function drawStudio(s, lt) {
  const g = s.geo, st = s.studio;
  // camera: push-in from 1 to g.zoom about the top-right corner (crops the nav, keeps the video column)
  const p = outCubic(seg(lt, T.push[0], T.push[1]));
  const k = lerp(1, g.zoom, p);
  s.camS.style.transform = `scale(${(p >= 1 ? g.zoom : k).toFixed(5)})`;

  // replies, hearts, counts
  LAND_ORDER.forEach((id, i) => {
    const r = g.rows[id];
    const t0 = landAt(i) - 0.04;
    const f = inOutCubic(seg(lt, t0, t0 + T.open));
    setComposer(r, 0);
    setReply(r, f);
    setHeart(r, outCubic(seg(lt, t0 + 0.12, t0 + 0.3)));
    setCount(r, lt >= t0 + 0.14 ? 1 : 0);   // `0 replies` -> `1 reply` on one frame: never two strings overlapping
  });
  // the pin label (Priya's row grows by g.pin as it opens)
  const pr = g.rows[PINNED_ID];
  const pl = inOutCubic(seg(lt, T.pinLabel[0], T.pinLabel[1]));
  setPin(pr, pl);

  // scroll: down to the list during the push-in, then follow each landing, then back to the top with Priya
  const pm = inOutCubic(seg(lt, T.pinMove[0], T.pinMove[1]));
  let sc = lerp(0, g.s0, p);
  g.targets.forEach((tgt, i) => {
    const before = i ? g.targets[i - 1] : g.s0;
    const t0 = landAt(i) - 0.04;
    sc += (tgt - before) * inOutCubic(seg(lt, t0, t0 + T.open + 0.05));
  });
  sc = lerp(sc, g.s0, pm);
  st.setScroll(pm >= 1 || lt < T.push[0] ? r1(sc) : r2(sc));

  // Priya's block travels from its slot (3rd) to the top; the blocks above it move down by her height
  const iP = g.order.indexOf(PINNED_ID);
  const above = g.order.slice(0, iP);
  const hAbove = above.reduce((a, id) => a + g.closed[id] + g.reply[id], 0);
  const hP = g.closed[PINNED_ID] + g.reply[PINNED_ID] + g.pin * pl;
  const lift = pm > 0 && pm < 1 ? 1 : 0;
  pr.el.style.transform = pm > 0 ? `translateY(${(pm >= 1 ? -r1(hAbove) : -r2(hAbove * pm))}px)` : '';
  pr.el.style.zIndex = pm > 0 ? '3' : '';
  pr.el.style.boxShadow = lift ? `0 ${(6 * Math.sin(Math.PI * pm)).toFixed(2)}px ${(18 * Math.sin(Math.PI * pm)).toFixed(2)}px rgb(0 0 0 / ${(0.16 * Math.sin(Math.PI * pm)).toFixed(3)})` : '';
  for (const id of above) {
    g.rows[id].el.style.transform = pm > 0 ? `translateY(${pm >= 1 ? r1(hP) : r2(hP * pm)}px)` : '';
  }
}

function drawWatch(s, lt) {
  const g = s.geo, w = s.watch;
  // the video plays: time and progress run with lt, slow Ken Burns on the frame
  w.setTime(T.watchTime + Math.max(0, lt - T.slide[0]));
  const kb = lt / DUR;
  w.playerImg.style.transform = `scale(${(1.02 + 0.05 * kb).toFixed(4)}) translate(${(-0.8 * kb).toFixed(3)}%, ${(-0.5 * kb).toFixed(3)}%)`;
  // scroll to the comments (Priya pinned + Sam's reply), then hold
  const ws = inOutCubic(seg(lt, T.watchScroll[0], T.watchScroll[1]));
  w.scrollTo(ws >= 1 ? g.wTarget : r2(g.wTarget * ws));
  // a small push-in with the scroll so the comment text settles at 24 px (14 * 1.6 * 1.08)
  s.camW.style.transform = ws >= 1 ? `scale(${WZOOM})` : `scale(${lerp(1, WZOOM, ws).toFixed(4)})`;
}

function draw(s, lt, t) {
  s.A.render(t);
  s.B.render(t);
  if (!s.geo) s.geo = geometry(s);
  if (!s.geo) return;
  drawStudio(s, lt);
  drawWatch(s, lt);
  // the slide: Studio out to the left, the watch page in from the right, the bar label crossfades
  const sl = outCubic(seg(lt, T.slide[0], T.slide[1]));
  const W = SCREEN.w;
  s.A.screen.firstElementChild.style.translate = sl > 0 ? `${sl >= 1 ? -W : r2(-W * sl)}px 0` : '';
  s.camW.style.translate = sl >= 1 ? '0px 0' : `${r2(W * (1 - sl))}px 0`;
  s.B.screen.style.visibility = sl > 0 ? 'visible' : 'hidden';
  // the bar: Studio's label and brand fade out, then window B's bar (the YouTube label) fades in over it
  // the bar label and brand swap on one frame (never empty, never two labels overlapping)
  const swapped = lt >= T.barSwap;
  s.A.label.style.opacity = swapped ? '0' : '1';
  s.A.brand.style.opacity = swapped ? '0' : '1';
  s.B.bar.style.opacity = swapped ? '1' : '0';
}

export default {
  id: 'yt-replies',
  dur: DUR,
  marks,
  T,
  mount(sec) { S = build(sec); },
  render(lt, ctx) { if (S) draw(S, clamp(lt, 0, DUR), (ctx && ctx.t) || lt); },
};
