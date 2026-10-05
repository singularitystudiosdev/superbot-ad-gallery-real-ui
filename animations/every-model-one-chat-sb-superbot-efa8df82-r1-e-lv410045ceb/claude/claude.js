// The cold open: Claude (claude.ai web, light) mid-task, stopped by its usage-limit notice. Built by hand in
// claude.css at real CSS px; the copy is the live app's own (the composer notice reads "You’ve reached your usage
// limit. It resets at {time}." in claude.ai's shipped bundle, 2026-10-04). Frame 0 is the hook as a still, framed
// tight enough to read on a phone: the notice over the blocked next ask, the end of Claude's answer above it.
// The camera then opens to the whole composer (Upgrade and the disabled send in frame), the pointer tries to send
// and nothing happens, the camera opens to the whole window (header, thread, composer, chin) and the scene fades fully
// to black. render(lt) is a pure function of local time.
import { clamp, lerp, seg, outCubic, inOutCubic, blink, press } from '../lib.js';

const G = { Copy: 57430, ThumbsUp: 57595, ThumbsDown: 57593, ArrowClockwise: 57629, ArrowUp: 57363, Add: 57345, CaretDown: 57383, Microphone: 57515, Sidebar: 57565 };
const ic = (name, big = false) => `<i class="ic${big ? ' i20' : ''}">${String.fromCodePoint(G[name])}</i>`;
const SPARK = 'm19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z';

const DUR = 2.85;
const TIME = '7:40 PM';
// the camera: tight on the notice, then the whole composer by ROW1, then the whole window by OPEN1
const ROW0 = 0.45, ROW1 = 1.05, OPEN0 = 1.5, OPEN1 = 2.3;
// pointer: in from the lower right onto the (disabled) send, a click that does nothing, then the fade (it starts
// as the camera settles wide: the wide shot only establishes the window, so it does not hold)
const PTR0 = 0.5, PTR1 = 1.0, CLICK = 1.12, FADE0 = 2.5;

let el = null;

export default {
  id: 'claude',
  dur: DUR,

  mount(section) {
    section.innerHTML = `
<div class="cl-page">
  <header class="cl-head">
    <span class="cl-ghost sq">${ic('Sidebar', true)}</span>
    <span class="cl-ghost cl-title">Muse meme ${ic('CaretDown')}</span>
    <span class="cl-sec">Share</span>
  </header>
  <div class="cl-col" id="cl-thread">
    <div class="cl-user"><div class="cl-bubble">make me a muse meme</div></div>
    <div class="cl-bot">
      <p>Here’s a Muse meme concept:</p>
      <p><strong>Format:</strong> Muse passing you a note in class.</p>
      <p><strong>Caption:</strong> “You have 40 unread notifications from Muse.”</p>
      <div class="cl-meta">
        <span class="cl-btn">${ic('Copy')}</span><span class="cl-btn">${ic('ThumbsUp')}</span><span class="cl-btn">${ic('ThumbsDown')}</span><span class="cl-btn">${ic('ArrowClockwise')}</span>
      </div>
      <svg class="cl-spark" viewBox="0 0 100 100" aria-hidden="true"><path fill="#d97757" d="${SPARK}"/></svg>
    </div>
  </div>
  <div class="cl-dock">
    <div class="cl-card">
      <div class="cl-notice">
        <div class="cl-msg">You’ve reached your usage limit. It resets at ${TIME}.</div>
        <span class="cl-sec sm cl-up"><i class="wash"></i>Upgrade</span>
      </div>
      <div class="cl-editor"><span class="cl-draft">Scrape reddit for the top Muse memes</span><i class="cl-caret"></i></div>
      <div class="cl-acts">
        <span class="cl-ghost sq">${ic('Add', true)}</span>
        <span class="cl-grow"></span>
        <span class="cl-ghost sq">${ic('Microphone', true)}</span>
        <span class="cl-send">${ic('ArrowUp', true)}</span>
      </div>
    </div>
    <div class="cl-chin">
      <span class="cl-cg">Project or folder</span><span class="cl-cg">Output</span>
      <span class="cl-grow"></span>
      <span class="cl-cg cl-model"><b>Opus 5.5</b><span>Medium</span><span>Auto</span></span>
    </div>
  </div>
  <svg class="cl-cursor" viewBox="0 0 22 32" aria-hidden="true"><path d="M2 2v23.5l5.6-5.4 3.9 9.1 4.2-1.8-3.9-8.9H19.7Z" fill="#000" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>
</div>`;
    const q = (s) => section.querySelector(s);
    el = {
      sec: section, page: q('.cl-page'), thread: q('#cl-thread'), dock: q('.cl-dock'), card: q('.cl-card'),
      up: q('.cl-up'), send: q('.cl-send'), caret: q('.cl-caret'), cursor: q('.cl-cursor'), geo: null,
    };
  },

  render(lt, ctx) {
    if (!el) return;
    const t = clamp(lt, 0, DUR);
    const W = (ctx && ctx.W) || 1920, H = 1080;
    const g = geo(W, H);

    // camera as a frame rectangle in page px, eased tight -> wide; width interpolates in log space so the zoom
    // reads at an even rate
    const r = inOutCubic(seg(t, ROW0, ROW1)), e = inOutCubic(seg(t, OPEN0, OPEN1));
    const drift = 1 + 0.11 * Math.min(t, ROW1); // a slow push while the hook is read, running on into the pull-back so the move never stalls
    const lw = (a, b, f) => Math.exp(lerp(Math.log(a), Math.log(b), f));
    const w = lw(lw(g.tight.w / drift, g.row.w, r), g.wide.w, e);
    const cx = lerp(lerp(g.tight.cx, g.row.cx, r), g.wide.cx, e), cy = lerp(lerp(g.tight.cy, g.row.cy, r), g.wide.cy, e);
    const S = W / w;
    el.page.style.transform = `translate(${(W / 2 - cx * S).toFixed(2)}px,${(H / 2 - cy * S).toFixed(2)}px) scale(${S.toFixed(5)})`;

    // the blocked draft keeps its caret
    el.caret.style.opacity = blink(t + 0.2) ? '1' : '0';

    // pointer: from below the composer onto the disabled send; the click does nothing (the send stays dimmed)
    const f = inOutCubic(seg(t, PTR0, PTR1));
    const a = { x: g.sendC.x + 90, y: g.sendC.y + 120 }, b = g.sendC;
    const x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f) + Math.sin(Math.PI * f) * 10;
    const pr = press(t, CLICK);
    el.cursor.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${((1.1 / Math.max(1, S / 1.6)) * (1 - 0.12 * pr)).toFixed(4)})`;
    el.cursor.style.opacity = outCubic(seg(t, PTR0, PTR0 + 0.2)).toFixed(3);
    // the disabled send takes the press and stays disabled
    el.send.style.transform = `scale(${(1 - 0.1 * pr).toFixed(4)})`;
    el.send.style.opacity = (0.45 + 0.12 * pr).toFixed(3);

    // the whole scene goes fully to black (the card that follows is black), so the cut never jumps
    const fade = (x => x * x)(seg(t, FADE0, DUR - 1 / 60)); // ease-in over ~22 frames
    el.sec.style.filter = fade > 0 ? `brightness(${(1 - fade).toFixed(3)})` : 'none';
  },
};

// layout probe (page px), measured once after fonts settle
function geo(W, H) {
  if (el.geo) return el.geo;
  const pr = el.page.getBoundingClientRect();
  const k = pr.width / 1280 || 1;
  const box = (n) => { const r = n.getBoundingClientRect(); return { x: (r.left - pr.left) / k, y: (r.top - pr.top) / k, w: r.width / k, h: r.height / k }; };
  // the thread sits 24px above the composer card, bottom-anchored like the live app
  const dock = box(el.dock), th = box(el.thread);
  el.thread.style.top = (dock.y - 24 - th.h).toFixed(1) + 'px';
  const card = box(el.card), send = box(el.send), dk = box(el.dock);
  const rg = document.createRange(); rg.selectNodeContents(el.sec.querySelector('.cl-msg'));
  const mr = rg.getBoundingClientRect();
  const msg = { x: (mr.left - pr.left) / k, y: (mr.top - pr.top) / k, w: mr.width / k, h: mr.height / k };
  // tight: the notice line at about 50 px on a 1920 frame (legible at phone width), the card's left edge in frame,
  // the draft and the chin's first items below it and the end of the answer above it
  const tw = Math.max(msg.w + 44, 520);
  const tight = { w: tw, cx: card.x - 10 + tw / 2, cy: dk.y + dk.h + 8 - (tw * H / W) / 2 };
  // row: the whole composer (notice with Upgrade, draft, the disabled send) and the chin under it. If the frame's top
  // edge would cut the user's bubble, it opens just enough to take the bubble whole.
  const bub = box(el.sec.querySelector('.cl-user .cl-bubble'));
  const rowBot = dk.y + dk.h + 10;
  let rw = card.w + 70;
  const rowTop = rowBot - rw * H / W;
  if (rowTop > bub.y - 16 && rowTop < bub.y + bub.h + 8) rw = (rowBot - (bub.y - 16)) * W / H;
  const row = { w: rw, cx: card.x + card.w / 2, cy: rowBot - (rw * H / W) / 2, cut: rowTop, bub };
  // wide: the full window, letterboxed by the page tone
  const wide = { w: 1280 * 1.06, cx: 640, cy: 310 };
  el.geo = { tight, row, wide, sendC: { x: send.x + send.w * 0.55, y: send.y + send.h * 0.55 }, msg };
  return el.geo;
}
