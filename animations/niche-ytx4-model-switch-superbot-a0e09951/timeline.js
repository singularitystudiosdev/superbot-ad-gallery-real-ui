// ytx4 relay baton: one ask in superbot, carried model to model like a relay baton.
// open (the ask typed into the superbot hub becomes the task card) -> leg 1 Grok sorts the comments in YouTube Studio
// -> leg 2 Gemini reads the frame at 7:42 on the watch page -> leg 3 Claude Opus 5.5 writes the replies
// -> leg 4 superbot posts and pins in Studio -> end card (the original ad's mark + wordmark).
// The spot is a pure function of t. window.__AD = { CYCLE, segments, seek(t) } (seek awaits image decode and the
// creator video's ready) for the frame-exact renderer; a real-time rAF loop plays it live (it loops) in the gallery.
import { clamp, lerp, seg, outQuint, outCubic, inOutCubic } from './lib.js';
import { makeMark } from './shell.js';
import { mountRelay } from './scenes/baton/relay.js';
import { mountOpen } from './scenes/baton/open.js';
import { mountOpus } from './scenes/baton/opus.js';
import { rectOf, frame as frameRect, readAt, camAt, WIDE } from './scenes/baton/camera.js';
import {
  CYCLE, SEGMENTS, B, XF, END, LEG1, LEG2, LEG4, OPEN, PAGE,
} from './scenes/baton/layout.js';

const stage = document.getElementById('stage');
const dip = document.getElementById('dip');
const params = new URLSearchParams(location.search);

// ---------- fit the 1920x1080 stage into the window (16:9 only) ----------
function fit() {
  const k = Math.min(innerWidth / 1920, innerHeight / 1080);
  stage.style.transformOrigin = '0 0';
  stage.style.position = 'absolute';
  stage.style.left = ((innerWidth - 1920 * k) / 2).toFixed(2) + 'px';
  stage.style.top = ((innerHeight - 1080 * k) / 2).toFixed(2) + 'px';
  stage.style.transform = `scale(${k})`;
}
fit();
addEventListener('resize', fit);

// ---------- sibling modules (YouTube screens, creator video, choreography, story data) ----------
async function opt(path) { try { return await import(path); } catch (e) { console.warn('[ytx4] module missing', path, e && e.message); return null; } }
const [YS, YD, YW, MV, MC, MP] = await Promise.all([
  opt('./scenes/yt/studio-comments.js'), opt('./scenes/yt/story-data.js'), opt('./scenes/yt/watch-page.js'),
  opt('./scenes/motion/creator-video.js'), opt('./scenes/motion/choreo.js'), opt('./scenes/motion/preview-timeline.js'),
]);

// ---------- the scenes ----------
const relay = mountRelay(document.getElementById('s-relay'), document.getElementById('bt-layer'));
const open = mountOpen(document.getElementById('s-tabs'));

function pageBox(cls) { const el = document.createElement('div'); el.className = cls; return el; }
function fallback(el, label) { el.innerHTML = `<div class="bt-fallback">${label}</div>`; }

// legs 1 and 4: YouTube Studio, Channel comments (one instance, two legs)
const studioEl = pageBox('bt-studio');
let studio = null;
// leg 2: the watch page with the creator video in its player
const watchEl = pageBox('bt-watch');
let watch = null, vid = null;
// leg 3: the Opus 5.5 writing pane
const opusEl = pageBox('bt-opus');

const data = YD ? (YD.default || YD.STORY || YD.story || YD.DATA || YD) : null;
const studioFav = 'brand/youtube-studio-logo.svg';
const ytFav = 'brand/youtube-icon.svg';

const leg = (i) => SEGMENTS[i + 1];
const vis = (a, b) => (t) => seg(t, a - XF / 2, a + XF / 2) * (1 - seg(t, b - XF / 2, b + XF / 2));

relay.addPage({ el: studioEl, title: 'Video comments - YouTube Studio', fav: studioFav,
  vis: (t) => (t < B[2] ? seg(t, OPEN.winIn0 - 0.01, OPEN.winIn0) * (1 - seg(t, B[1] - XF / 2, B[1] + XF / 2)) : seg(t, B[3] - XF / 2, B[3] + XF / 2)),
  cam: (t) => studioCam(t) });
relay.addPage({ el: watchEl, title: 'I turned a 9 m² closet into my dream studio - YouTube', fav: ytFav,
  vis: vis(B[1], B[2]), cam: (t) => watchCam(t) });
relay.addPage({ el: opusEl, title: 'superbot', fav: 'scenes/tabs-assets/mark-clean.svg',
  vis: vis(B[2], B[3]), cam: () => ({ z: 1, fx: PAGE.w / 2, fy: PAGE.h / 2 }) });

// cameras inside the window (scenes/baton/camera.js): the frame never moves, the page pushes in on what the leg is
// about so the story text reads at ~24 px on a 1080p frame, and pans between rows
const rowCache = {};
function studioRow(id) {
  if (rowCache[id] && rowCache[id].isConnected) return rowCache[id];
  const c = data && data.commentById && data.commentById[id];
  if (!c) return null;
  const host = studioEl.querySelector('.st-rows');
  if (!host) return null;
  const hit = [...host.querySelectorAll('.ctext')].find((e) => e.textContent.trim() === c.text.trim());
  let row = hit;
  while (row && row.parentElement !== host) row = row.parentElement;
  rowCache[id] = row || null;
  return rowCache[id];
}
const sRect = (el) => rectOf(studioEl, el);
const rowR = (id) => { const r = studioRow(id); return r ? sRect(r) : null; };
// the first line of a row: avatar, handle, text, the action bar (not the reply thread under it)
const rowHead = (id) => { const r = rowR(id); return r ? { x: r.x, y: r.y, w: r.w, h: Math.min(r.h, 120) } : null; };
const panelR = () => sRect(studioEl.querySelector('.sb-panel'));
function replyIds() { return (MC && MC.REPLY_SEQUENCE) || (data && data.replyOrder) || ['c1', 'c2', 'c3', 'c4']; }
// leg 4: the camera rides down the rows as each reply is typed and posted
function followReplies(t) {
  const ids = replyIds();
  const span = LEG4.reply1 - LEG4.reply0;
  const f = clamp(((t - LEG4.reply0) / span - 0.02) / 0.21, 0, ids.length - 1);
  const i = Math.floor(f), u = inOutCubic(f - i);
  const a = rowR(ids[i]), b = rowR(ids[Math.min(ids.length - 1, i + 1)]);
  if (!a || !b) return WIDE();
  const ca = readAt(a, 1.75, { inset: 4, ay: 0.55 }), cb = readAt(b, 1.75, { inset: 4, ay: 0.55 });
  return { z: 1.75, fx: lerp(ca.fx, cb.fx, u), fy: lerp(ca.fy, cb.fy, u) };
}
const L1 = LEG1, L4 = LEG4;
const STUDIO_KEYS_1 = [
  [B[0] + 0.05, WIDE], [L1.sort0 + 0.02, WIDE],
  [L1.sort0 + 0.38, () => frameRect(panelR(), { pad: 18, zMax: 2.35 })],
  [L1.sort0 + (L1.sort1 - L1.sort0) * 0.74, () => frameRect(panelR(), { pad: 18, zMax: 2.35 })], // the counters run up
  [L1.sort0 + (L1.sort1 - L1.sort0) * 0.9, () => readAt(rowHead('c1'), 2.3, { inset: 4, ay: 0.42 })], // c1 lights up as the top Question
];
const STUDIO_KEYS_4 = [
  [B[3] - 0.2, () => readAt(rowR(replyIds()[0]), 1.75, { inset: 4, ay: 0.55 })],
  [L4.reply0, () => followReplies(L4.reply0)],
];
function studioCam(t) {
  if (t < B[2]) return camAt(t, STUDIO_KEYS_1);
  if (t < L4.reply1 - 0.08) return t < L4.reply0 ? camAt(t, STUDIO_KEYS_4.slice(0, 2)) : followReplies(t);
  // the pin: from the last reply up to c1, which rises to the top with "Pinned by @noabuilds"
  return camAt(t, [
    [L4.reply1 - 0.08, () => followReplies(L4.reply1 - 0.08)],
    [L4.pin0 + 0.3, () => readAt(rowHead('c1'), 2.0, { inset: 4, ay: 0.5 })],
    [L4.pin1 - 0.05, () => readAt(rowHead('c1'), 2.3, { inset: 4, ay: 0.45 })],
  ]);
}
// leg 2: the player fills the window
const PLAYER_R = { x: 16, y: 68, w: 1344, h: 756 };
function watchCam(t) {
  const player = () => ({ ...frameRect(PLAYER_R, { pad: 0, zMax: 2.4 }), fx: PLAYER_R.x + PLAYER_R.w / 2, fy: PLAYER_R.y + PLAYER_R.h / 2 });
  // then Gemini's box and its label, close enough to read
  const k = PLAYER_R.w / 1920;
  const read = () => {
    const bx = PLAYER_R.x + 826 * k, by = PLAYER_R.y + 60 * k;
    return frameRect({ x: bx - 40, y: by - 10, w: 760, h: 372 * k + 110 }, { pad: 20, zMax: 1.9 });
  };
  return camAt(t, [[B[1] - 0.1, () => ({ z: 1.08, fx: 900, fy: 520 })], [B[1] + 0.32, player], [LEG2.box0 - 0.1, player], [LEG2.box1 + 0.05, read]]);
}

if (YS && YS.mountStudioComments) {
  try { studio = YS.mountStudioComments(studioEl, data); } catch (e) { console.warn('[ytx4] studio mount', e); }
}
if (!studio) fallback(studioEl, 'YouTube Studio: Channel comments');
if (YW && YW.mountWatchPage) {
  try { watch = YW.mountWatchPage(watchEl, data); } catch (e) { console.warn('[ytx4] watch mount', e); }
}
if (!watch) fallback(watchEl, 'Watch page');
if (watch && MV && MV.mountCreatorVideo) {
  const slot = watch.videoSlot || watchEl.querySelector('[data-video-slot], .video-slot');
  if (slot) { try { vid = MV.mountCreatorVideo(slot, { frames: 'img/frames/' }); } catch (e) { console.warn('[ytx4] video mount', e); } }
}

// the Opus pane reads the four comments and replies from the shared story data
function opusItems() {
  const cs = (data && (data.comments || data.COMMENTS)) || [];
  const rs = (data && (data.replies || data.REPLIES)) || {};
  const ids = ['c1', 'c2', 'c3', 'c4'];
  return ids.map((id) => {
    const c = cs.find((x) => x.id === id) || {};
    const r = Array.isArray(rs) ? (rs.find((x) => x.id === id || x.to === id) || {}) : (rs[id] || {});
    return { handle: c.handle || id, avatar: c.avatar || 'img/avatars/a01.jpg', text: c.text || '', reply: (typeof r === 'string' ? r : r.text) || '' };
  });
}
const noa = { handle: (data && data.creator && data.creator.handle) || '@noabuilds', avatar: (data && data.creator && data.creator.avatar) || 'img/avatars/noa.jpg' };
const opus = mountOpus(opusEl, opusItems(), noa);

// ---------- the end card: the original ad's mark + wordmark ----------
const endSec = document.getElementById('s-end');
endSec.innerHTML = '<div class="lock ask-end"><div class="words"><div class="end-slide"><h1>superbot</h1></div></div><div class="face"></div></div>';
const end = { lock: endSec.querySelector('.lock'), face: endSec.querySelector('.face'), slide: endSec.querySelector('.end-slide'), mark: makeMark(220) };
end.face.appendChild(end.mark.el);
function renderEnd(lt) {
  const f = seg(lt, 0, 0.5);
  end.face.style.opacity = f.toFixed(3);
  end.face.style.transform = `scale(${lerp(0.5, 1, outQuint(f)).toFixed(4)})`;
  const w = seg(lt, 0.3, 1.0);
  end.slide.style.transform = `translateX(${((1 - outQuint(w)) * 110).toFixed(2)}%)`;
  end.slide.style.opacity = w.toFixed(3);
  end.mark.render(Math.max(0, lt));
}
let FACE = null;
function faceCentre() {
  if (FACE) return FACE;
  const st = stage.getBoundingClientRect(), k = st.width / 1920;
  const prev = end.face.style.transform;
  end.face.style.transform = 'none';
  const b = end.face.getBoundingClientRect();
  end.face.style.transform = prev;
  if (!b.width) return { cx: 1240, cy: 540 };
  FACE = { cx: (b.left + b.width / 2 - st.left) / k, cy: (b.top + b.height / 2 - st.top) / k };
  return FACE;
}

// ---------- leg states ----------
function studioState(t) {
  if (!MC) return {};
  if (t < B[2]) return MC.sortState(seg(t, LEG1.sort0, LEG1.sort1), studio);
  const r = MC.replyState(seg(t, LEG4.reply0, LEG4.reply1));
  return t < LEG4.pin0 ? r : { ...r, ...MC.pinState(seg(t, LEG4.pin0, LEG4.pin1)) };
}
// the video clock on leg 2 (motion's scrubThenPlay): at 3:12, dragged out past 9:50 and eased back to 7:40, released,
// then it plays 7:40 -> 7:42 and holds on 7:42 for Gemini's read
const PLAY_RATE = 2 / (LEG2.play1 - LEG2.play0);
function clip(t) {
  if (t < LEG2.scrub0) return { time: 250, scrubbing: false, hold: true };
  if (t >= LEG2.play1) return { time: 462, scrubbing: false };
  const o = { from: 250, dragOut: LEG2.dragOut, dragBack: LEG2.dragBack, rate: PLAY_RATE };
  if (MP && MP.scrubThenPlay) return MP.scrubThenPlay(t - LEG2.scrub0, o);
  return { time: 460 + (t - LEG2.play0) * PLAY_RATE, scrubbing: false };
}
function watchState(t) {
  const c = clip(t);
  const scrubbing = c.scrubbing, vt = c.time;
  const a = seg(t, LEG2.box0, LEG2.box1);
  const box = MV && MV.frameBox ? MV.frameBox(MV.LIGHT_BOX, 462) : (MV && MV.LIGHT_BOX) || [826, 60, 374, 372];
  const key = scrubbing && MV && MV.scrubKeyAt ? MV.scrubKeyAt(vt) : null;
  return {
    videoTime: vt,
    posterSrc: c.hold ? 'img/frames/s0410.jpg' : undefined,
    playing: t >= LEG2.play0 && t < LEG2.play1,
    scrub: scrubbing ? { time: vt, p: 1, previewSrc: key ? `img/frames/${key}.jpg` : undefined } : null,
    scrubbing,
    knob: t >= LEG2.scrub0 - 0.1 && t < LEG2.play1 + 0.2,
    controls: 1 - seg(t, LEG2.box0 - 0.2, LEG2.box0 + 0.1) * 0.85,
    focusCommentId: 'c1', focusP: seg(t, B[1] + 0.1, B[1] + 0.5),
    annotation: t >= LEG2.box0 ? { box, label: data.frameRead.label, p: a } : null,
  };
}

// ---------- render(t) ----------
let lastT = -1;
function render(t) {
  t = ((t % CYCLE) + CYCLE) % CYCLE;
  lastT = t;
  // open
  const openOn = t < OPEN.hubOut1 + 0.02;
  document.getElementById('s-tabs').style.display = openOn ? '' : 'none';
  if (openOn) open.render(t);
  // legs
  if (studio && studio.update && (t > OPEN.winIn0 - 0.05 && t < B[1] + XF || t > B[3] - XF)) { try { studio.update(studioState(t)); } catch (e) { console.warn(e); } }
  if (watch && t > B[1] - XF && t < B[2] + XF) {
    const st = watchState(t);
    try { watch.update && watch.update(st); } catch (e) { console.warn(e); }
    // workaround (motion module): render() far before its first still (7:38) draws a flipped, shrunken frame when not
    // scrubbing, so while the player sits paused at 4:10 before the scrub the canvas is hidden and the watch page's
    // own poster (the 4:10 still) shows instead
    if (vid) {
      const hold = clip(t).hold;
      vid.canvas.style.visibility = hold ? 'hidden' : '';
      if (!hold) vid.render(st.videoTime, { scrubbing: st.scrubbing });
    }
  }
  if (t > B[2] - XF && t < B[3] + XF) opus.render(t);
  // the end card (before the relay so the face position is known)
  const endOn = t >= END.endIn0 - 0.01;
  endSec.style.display = endOn ? '' : 'none';
  endSec.style.opacity = seg(t, END.endIn0, END.endIn1).toFixed(3);
  if (endOn) renderEnd(t - END.local0);
  relay.render(t, { origin: openOrigin(), face: faceCentre() });
  // loop dip: a short fade in at the top, a short dip to black before the loop
  dip.style.opacity = Math.max(1 - seg(t, -0.04, 0.12), seg(t, CYCLE - END.dip, CYCLE)).toFixed(3);
}
let ORIGIN = null;
function openOrigin() {
  if (ORIGIN) return ORIGIN;
  open.render(0.5);
  ORIGIN = open.origin();
  return ORIGIN;
}

// ---------- readiness: fonts, every image in the stage decoded, the creator video's stills ----------
async function settle() {
  await document.fonts.ready;
  const imgs = [...stage.querySelectorAll('img')];
  await Promise.all(imgs.map((im) => (im.complete && im.naturalWidth ? (im.decode ? im.decode().catch(() => {}) : 0) : new Promise((res) => {
    im.addEventListener('load', res, { once: true }); im.addEventListener('error', res, { once: true });
  }).then(() => im.decode && im.decode().catch(() => {})))));
  if (vid && vid.ready) await vid.ready;
  if (studio && studio.ready) await studio.ready;
  if (watch && watch.ready) await watch.ready;
  if (YS && YS.ytReady) await YS.ytReady(stage);
}
const readyP = settle();

// ---------- the clock: real-time rAF loop for live playback; seek(t) for the frame-exact renderer ----------
let playing = !params.has('t');
let t0 = performance.now();
let tNow = params.has('t') ? +params.get('t') : 0;
let seeking = false;
function frame(now) {
  if (playing && !seeking) { tNow = ((now - t0) / 1000) % CYCLE; render(tNow); }
  requestAnimationFrame(frame);
}
readyP.then(() => { ORIGIN = null; FACE = null; t0 = performance.now() - tNow * 1000; render(tNow); requestAnimationFrame(frame); });

async function seek(t) {
  seeking = true; playing = false;
  document.body.classList.add('freeze');
  await readyP;
  render(t);
  await settle();
  render(t);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  tNow = t;
  return t;
}
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { playing = !playing; seeking = false; t0 = performance.now() - tNow * 1000; }
  else if (e.code === 'ArrowRight') { playing = false; tNow = (tNow + 1 / 30) % CYCLE; render(tNow); }
  else if (e.code === 'ArrowLeft') { playing = false; tNow = (tNow - 1 / 30 + CYCLE) % CYCLE; render(tNow); }
  else if (e.code === 'KeyR') { playing = true; seeking = false; tNow = 0; t0 = performance.now(); }
});

window.__AD = {
  CYCLE,
  segments: SEGMENTS.map((s) => ({ ...s })),
  seek,
  render,
  get t() { return lastT; },
  ready: readyP,
};
window.__ytx4 = { relay, studio, watch, get vid() { return vid; } };
