// refuse.js: back in ChatGPT (the thread carried from Claude still on screen), the user asks for 10 clips of The
// Social Network off YouTube and ChatGPT refuses. The "superbot can do it!" card rises with a chat button; one press
// opens a hole through ChatGPT from the button, superbot's own thread is underneath with the ask carried over, and
// it searches, downloads the 10 clips (real Movieclips stills) and hands back the folder.
import { clamp, lerp, seg, outCubic, inOutCubic, outBack, esc } from '../lib.js';
import {
  icon, own, mountHub, place, camera, centerOf, cursorAt, ringAt, pathDesign, railSel, reveal, conceal, viewPoint,
  viewHTML, thread, draft, streamWords, rise, nativeTitle, toolHTML, tool,
} from './hubkit.js';

const C = {
  cur: 0.3, toComp: [0.35, 0.95], clickComp: 1.02,
  type: [1.15, 3.05], send: 3.25, u: 3.3,
  think: 3.5, words: 4.15, camIn: [3.9, 5.0],
  pop: 6.85, toChat: [7.3, 7.95], clickChat: 8.1, popOut: [8.18, 8.45],
  hole: [8.2, 9.25], sel: [8.2, 8.7], camOut: [8.25, 9.35],
  t1: 9.4, t1done: 10.1, t2: 10.25, grid: 10.3, tile0: 10.45, tileStep: 0.17, tileDl: 0.52, t2done: 12.2,
  camIn2: [10.35, 11.5], a: 12.4, aWords: 12.5, folder: 13.0, camOut2: [14.1, 15.2],
  dur: 16,
};
const ASK = 'Download me 10 clips off youtube of the social network';
const NO = 'I can’t help download videos from YouTube. Saving copies without the creator’s permission goes against YouTube’s Terms of Service. You can still watch the official clips on the Movieclips channel.';
const DONE = 'Done. All 10 are in Movies › The Social Network.';
const CLIPS = [
  ['You’re Breaking Up With Me?', '3:16'], ['I Deserve Some Recognition', '2:15'], ['Cease and Desist', '3:26'],
  ['We Have Groupies', '3:33'], ['Right and Wrong', '3:26'], ['A Billion Dollars', '3:35'], ['I’m CEO', '3:30'],
  ['Putting Out Fires', '3:13'], ['I Was Your Only Friend', '2:57'], ['I’m Not a Bad Guy', '3:04'],
];
const OK = '<svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

const gridHTML = () => `<div class="cl-grid">${CLIPS.map(([title, d], i) => `<div class="cl-t" data-i="${i}">
  <div class="cl-th"><img src="${own(`clips/c${String(i + 1).padStart(2, '0')}.jpg`)}" alt=""/><span class="cl-d">${d}</span><i class="cl-bar"></i><span class="cl-ok">${OK}</span></div>
  <div class="cl-n">${esc(title)}</div></div>`).join('')}</div>`;
const folderHTML = () => `<div class="cl-folder"><svg class="cl-fic" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/></svg><span class="cl-fn"><b>The Social Network</b><small>10 videos · 368 MB · Movies</small></span><span class="cl-open">Open</span></div>`;

const views = () =>
  viewHTML('sb', {
    msgs: [
      { id: 'carry', who: 'raw', html: `<span class="vz-carry"><span class="vz-tile t-gpt">${icon('openai')}</span>Continued from ChatGPT</span>` },
      { id: 'u', who: 'u', text: ASK },
      { id: 't1', who: 'raw', html: toolHTML('Searching YouTube for <b>The Social Network</b> clips') },
      { id: 't2', who: 'raw', html: toolHTML('Downloading clips · <span class="n">0/10</span>') },
      { id: 'grid', who: 'raw', html: gridHTML() },
      { id: 'a', who: 'a', text: DONE },
      { id: 'folder', who: 'raw', html: folderHTML() },
    ],
  }) +
  viewHTML('gpt', {
    title: 'ChatGPT',
    chats: ['Hello', 'Wedding toast ideas', 'Fix this SQL join', 'Names for a golden retriever', 'Explain RAG like I’m five', 'Marathon training plan'],
    msgs: [
      { id: 'carry', who: 'raw', html: `<span class="vz-carry"><span class="vz-tile t-claude">${icon('claude')}</span>Continued from Claude</span>` },
      { id: 'u1', who: 'u', text: 'Hello' },
      { id: 'a1', who: 'a', text: 'Hi!', cls: 'shown' },
      { id: 'u2', who: 'u', text: 'How are you?' },
      { id: 'a2', who: 'a', text: 'Doing great, thanks for asking! What are we working on today?', cls: 'shown' },
      { id: 'u3', who: 'u', text: ASK },
      { id: 'a3', who: 'a', html: `<span class="vz-think vz-dot"></span>${NO.split(' ').map((w) => `<span class="w">${esc(w)}</span>`).join(' ')}` },
    ],
  });

export default {
  dur: C.dur,
  mount(section, ctx) {
    const R = mountHub(section, ctx, views());
    nativeTitle(R, 'social network clips');
    R.over.innerHTML = `<div class="rf-pop"><div class="rf-head"><img src="${own('mark-clean.svg')}" alt=""/><span>superbot can do it!</span></div><div class="rf-chat"><svg viewBox="0 0 24 24"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>chat</div></div>`;
    R.pop = R.over.querySelector('.rf-pop');
    R.chatBtn = R.over.querySelector('.rf-chat');
    const s = R.views.sb, g = R.views.gpt;
    R.gthink = g.el.querySelector('.vz-think');
    R.t1 = s.m.t1.querySelector('.vz-tool'); R.t2 = s.m.t2.querySelector('.vz-tool');
    R.tiles = [...s.m.grid.querySelectorAll('.cl-t')];
    return R;
  },

  render(t, ctx) {
    const R = ctx.state;
    place(R, ctx.W);
    const s = R.views.sb, g = R.views.gpt;

    // ---- camera: in on the refusal, back out through the switch, in again on the clips, out to finish
    const z1 = inOutCubic(seg(t, ...C.camIn)) * (1 - inOutCubic(seg(t, ...C.camOut)));
    const z2 = inOutCubic(seg(t, ...C.camIn2)) * (1 - inOutCubic(seg(t, ...C.camOut2)));
    const ZOOM1 = 0.16, F1 = [470, centerOf(R, g.rc).t - 85], ZOOM2 = 0.13; // just above the composer, at any ratio
    const gc = R.gridC || (s.heights ? (R.gridC = centerOf(R, s.m.grid, 0, s.heights.a + s.heights.folder)) : null);
    if (t < C.camIn2[0]) camera(R, 1 + ZOOM1 * z1, F1[0], F1[1]);
    else camera(R, 1 + ZOOM2 * z2, 520, gc ? gc.y : 460);

    // ---- rail and the two views: ChatGPT on top until the hole opens through it
    railSel(R, 'gpt', 'sb', seg(t, ...C.sel));
    reveal(R, 'sb', 1);
    // where the chat button sits in the zoomed frame, as a point in ChatGPT's view (the hole's centre)
    const bs = stageCenter(R, R.chatBtn);
    // (fixed at the fully zoomed frame the press happens in, so the hole does not drift as the camera pulls out)
    const hd = unzoom(R, bs.x, bs.y, 1 + ZOOM1, F1[0], F1[1]), hc = viewPoint(R, hd.x, hd.y);
    conceal(R, 'gpt', inOutCubic(seg(t, ...C.hole)), hc.x, hc.y);

    // ---- ChatGPT: the ask, the dot, the refusal
    const text = t >= C.type[0] && t < C.send ? ASK.slice(0, Math.round(ASK.length * seg(t, ...C.type))) : '';
    draft(R, 'gpt', text, { press: pulse(t, C.send), caretIdle: t >= C.clickComp && t < C.type[0] && Math.floor(t * 2.2) % 2 === 0 });
    thread(R, 'gpt', { u3: rise(t, C.u), a3: rise(t, C.think) });
    const dot = seg(t, C.think, C.think + 0.15) * (1 - seg(t, C.words - 0.1, C.words + 0.05));
    R.gthink.style.opacity = dot.toFixed(3);
    R.gthink.style.transform = `scale(${(0.8 + 0.2 * Math.sin((t - C.think) * 9)).toFixed(3)})`;
    R.gthink.style.width = dot > 0.01 ? '' : '0px';
    R.gthink.style.margin = dot > 0.01 ? '' : '0';
    streamWords(g.m.a3, C.words, 13, t);

    // ---- the card: rises, is pressed, drops away as the hole opens
    const pin = outBack(seg(t, C.pop, C.pop + 0.45)), pout = seg(t, ...C.popOut);
    R.pop.style.opacity = (clamp(seg(t, C.pop, C.pop + 0.25)) * (1 - pout)).toFixed(3);
    R.pop.style.transform = `translateY(${(40 * (1 - pin) + 18 * outCubic(pout)).toFixed(2)}px) scale(${(0.96 + 0.04 * pin - 0.06 * outCubic(pout)).toFixed(3)})`;
    const bh = seg(t, C.toChat[1] - 0.15, C.toChat[1]) * (1 - pout);
    R.chatBtn.style.transform = `scale(${(1 + 0.04 * bh - 0.07 * pulse(t, C.clickChat)).toFixed(3)})`;

    // ---- superbot: search, download (tiles land one by one), the folder
    thread(R, 'sb', { t1: rise(t, C.t1), t2: rise(t, C.t2), grid: rise(t, C.grid, 0.45), a: rise(t, C.a), folder: rise(t, C.folder, 0.45) });
    tool(R.t1, t, C.t1, C.t1done, 'Found 10 clips on <b>Movieclips</b>');
    tool(R.t2, t, C.t2, C.t2done, 'Downloaded <b>10 clips</b> · 368 MB');
    let got = 0;
    R.tiles.forEach((tile, i) => {
      const a = C.tile0 + i * C.tileStep, b = a + C.tileDl;
      const e = outCubic(seg(t, a - 0.12, a + 0.25));
      const dl = seg(t, a, b), ok = outBack(seg(t, b, b + 0.3));
      if (t >= b) got++;
      tile.style.opacity = (0.25 + 0.75 * e).toFixed(3);
      tile.style.transform = `translateY(${(8 * (1 - e)).toFixed(2)}px) scale(${(0.96 + 0.04 * e).toFixed(3)})`;
      tile.querySelector('img').style.filter = `saturate(${(0.35 + 0.65 * dl).toFixed(3)}) brightness(${(0.55 + 0.45 * dl).toFixed(3)})`;
      const bar = tile.querySelector('.cl-bar');
      bar.style.transform = `scaleX(${inOutCubic(dl).toFixed(3)})`;
      bar.style.opacity = (1 - seg(t, b + 0.1, b + 0.35)).toFixed(3);
      tile.querySelector('.cl-ok').style.transform = `scale(${ok.toFixed(3)})`;
    });
    const n = R.t2.querySelector('.n');
    if (n) n.textContent = `${got}/10`;
    streamWords(s.m.a, C.aWords, 12, t);

    // ---- cursor: composer, then the chat button, then it drifts off as superbot works
    const rc = centerOf(R, g.rc);
    const keys = [
      { t: C.cur, x: 820, y: 470 },
      { t: C.toComp[0], x: 820, y: 470 },
      { t: C.toComp[1], x: rc.l + 150, y: rc.t + 32 },
      { t: C.type[1], x: rc.l + 170, y: rc.t + 62 },
      { t: C.toChat[0], x: rc.l + 175, y: rc.t + 64 },
    ];
    let cp;
    if (t < C.toChat[0]) cp = pathDesign(R, t, keys);
    else {
      // the button lives on the stage, not in the window: glide in stage px
      const from = pathDesign(R, C.toChat[0], keys);
      const f = inOutCubic(seg(t, ...C.toChat));
      const away = inOutCubic(seg(t, C.popOut[1], C.popOut[1] + 0.9));
      cp = { x: lerp(from.x, bs.x + 8, f) + 90 * away, y: lerp(from.y, bs.y + 4, f) - 120 * away };
    }
    const vis = seg(t, C.cur, C.cur + 0.25) * (1 - seg(t, C.popOut[1] + 0.4, C.popOut[1] + 0.9));
    cursorAt(R, cp.x, cp.y, pulse(t, C.clickComp) + pulse(t, C.clickChat), vis);
    const lc = [C.clickComp, C.clickChat].filter((c) => c <= t).pop();
    ringAt(R, cp.x, cp.y, lc == null ? -1 : t - lc);
  },
};

/** a stage-px point -> site design px under a given camera (scale s about design point fx, fy) */
function unzoom(R, X, Y, s, fx, fy) {
  const { k, L, T } = R.g, Xf = L + k * fx, Yf = T + k * fy;
  return { x: (Xf + (X - Xf) / s - L) / k, y: (Yf + (Y - Yf) / s - T) / k };
}
/** an element's centre in stage px (it lives in .cz-over, outside the camera) */
function stageCenter(R, el) {
  let x = 0, y = 0, n = el;
  while (n && n !== R.root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}
function pulse(t, c) { const a = seg(t, c - 0.06, c + 0.04), b = seg(t, c + 0.04, c + 0.2); return a * (1 - b); }
