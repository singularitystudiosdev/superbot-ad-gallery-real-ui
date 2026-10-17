// Multicat beat (the 'multicat' variant): four asks in one chat, each routed to a different tool. The engine types and
// routes the first ask ("Make me a realistic image of a cat", GPT Image 2) and this beat answers it; then it carries the
// chat on by itself: three more asks are typed into the composer, sent, routed (their chips land and resolve, the
// composer's platform chip follows) and answered, each in its own reply.
//   1. GPT Image 2: the photo lands as the 1-image card does (thumb-land.309eb9c5.js).
//   2. Meshy: the 3D model of that cat builds in the 3D variant's artifact frame, then walks on a turntable
//      (cat3d.516afb1a.js). Meshy made the mesh; its rigger takes humanoids only, so superbot rigged and keyed the walk
//      itself, and the chip after Meshy's says so.
//   3. DoorDash: a rebuilt Petco "Confirming your order" card for a real listing (img/multicat.516afb1a/CREDITS.txt).
//   4. ElevenLabs: the song plays: the real track (media/multicat.516afb1a/tiny-chaos.mp3) under its real waveform, the
//      sung line lighting word by word on its forced-alignment timings (multicat-data.516afb1a.js), and the audio itself
//      kept in step with the spot's clock while it runs; it plays through its second sung line, then fades out as
//   5. the house superbot.gg end card (the 16:9 cuts' ending: the wordmark, then the mascot) covers the chat.
// The follow-up messages are built here and moved in after the engine's reply on the first render (they ride in
// inst.nodes, so the engine's show() hides them under every other variant). The engine reads inst.asks (the composer's
// typing and send presses) and inst.chips (the platform chip's swaps) for them (chat.9b47fc30.js). A pure function of
// t, except the audio, which follows the clock and never drives it. Its stylesheet (../multicat.516afb1a.css) loads with
// the module.
import { clamp, lerp, seg, outCubic, outQuint, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { LAND, landing, shimmer, settle } from './thumb-land.309eb9c5.js';
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries (share.29a362ea.js)
import { shareBtn, shareDisc, SHARE_GLYPH, shareAttrs } from './share.29a362ea.js';
import { makeCatViewer } from './cat3d.516afb1a.js?v=1';
import { DUR, PEAKS, LINES, WORDS } from './multicat-data.516afb1a.js';

const CSS = new URL('../multicat.516afb1a.css?v=2', import.meta.url).href;
const asset = (p) => new URL('../../../' + p, import.meta.url).href;
const CAT = asset('img/multicat.516afb1a/cat.jpg');
const COVER = asset('img/multicat.516afb1a/cover.jpg'); // the song's cover: that same cat, cropped to its face
const ORDER = asset('img/multicat.516afb1a/order-placed.jpg');
const MODEL = asset('models/cat-walk.516afb1a.glb');
const SONG = asset('media/multicat.516afb1a/tiny-chaos.mp3');
const STORE = 'https://www.doordash.com/convenience/store/25109364/';
const ORDER_ALT = 'DoorDash order placed: Confirming your order from Petco, one Purina Fancy Feast Seafood Classic Collection Broths Variety Pack (1.4 oz x 12 ct), $16.49 subtotal, $0.00 delivery fee';
const TITLE = 'Tiny Chaos';

export const TYPE_CPS = 55; // every ask types at this rate; the first one through its route's typeCps (chat.9b47fc30.js)
const CHIP_STRIDE = 0.77;  // the engine's routing chip clock (chat.9b47fc30.js chipsAt), so every chip lands alike
const SAY1 = 'Here’s your realistic cat.';
const IMAGE_HOLD = 2.5;     // the image reply, from its header to the next ask starting to type
// how much of the song plays before the end card: through its second sung line ("...down the hall" ends at 4.92s); the
// audio then fades out under the card's cover
const SONG_FOR = 5.6;
// the house end card (superbot-muse-split.1d16d488/endcard.1d16d488.html, the 16:9 cuts' ending): the chat fades to its
// black over END_IN, the card's own 2.5s run starts END_DELAY in (mascot pops in, superbot.gg fades up beside it, hold)
const END_IN = 0.45, END_DELAY = 0.3, END_LEN = 2.5;
const END_GAP = 44;    // the house card's gap between the wordmark and the 220px face, on a 1080-high stage
const SONG_FADE = 0.9; // the audio's fade-out as the card covers the chat
// the card's pop: an outBack with the house card's softer overshoot (1.4)
const popBack = (p) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
// the mascot face, verbatim from the house end card: the superbot cat's mask over its cyan and magenta offsets
const END_FACE = '<svg class="mc-end-face" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><defs><mask id="mcEndFace" maskUnits="userSpaceOnUse" x="-30" y="-30" width="160" height="160"><g fill="#fff"><rect x="14" y="32" width="72" height="54" rx="15"/><path d="M14 46V28Q14 20 21 21Q28 24 36 32Z"/><path d="M86 46V28Q86 20 79 21Q72 24 64 32Z"/></g><g fill="#000"><ellipse cx="35" cy="58" rx="8" ry="11"/><ellipse cx="65" cy="58" rx="8" ry="11"/></g></mask></defs><rect x="-30" y="-30" width="160" height="160" fill="#00e5c3" mask="url(#mcEndFace)" transform="translate(-1.2 -1.2)"/><rect x="-30" y="-30" width="160" height="160" fill="#c026d3" mask="url(#mcEndFace)" transform="translate(1.2 1.2)"/><rect x="-30" y="-30" width="160" height="160" fill="#fff" mask="url(#mcEndFace)"/></svg>';
// the turntable's angle as the 3D card lands, and its turn in rad/s: slow, so the walk stays near side-on, where a gait reads
const SPIN0 = -0.6, SPIN = 0.22;
// `credits`: what the generation charges until the user connects their own plan, priced as the single-tool cuts are
// (chat.9b47fc30.js creditsBy: '3d' 20, song 15; the first ask's 4 is the engine's); an order charges none
const STEPS = [
  { kind: 'model', ask: 'Make me an animated 3d model of a realistic cat', app: 'meshy', say: 'Here’s your cat as an animated 3D model.', hold: 4.2, credits: 20,
    chips: [['meshy', 'Switching to Meshy'], ['superbot', 'Rigging and animating the cat', true]] },
  { kind: 'order', ask: 'Order me catfood from doordash', app: 'doordash', say: 'Your cat food has been ordered from Petco.', hold: 2.7, credits: 0,
    chips: [['doordash', 'Connecting to DoorDash']] },
  { kind: 'song', ask: 'Make me a song about cats', app: 'elevenlabs', say: 'Here’s an upbeat indie pop song about cats.', hold: 0.82 + SONG_FOR + END_DELAY + END_LEN, credits: 15,
    chips: [['elevenlabs', 'Switching to ElevenLabs']] },
];

// a chip list on the engine's clock; `tool` chips (superbot's own rigging) leave the composer's platform chip alone
const chipsAt = (sw, list) => list.map(([app, label, tool], i) => { const at = sw + i * CHIP_STRIDE; return { app, label, tool: !!tool, sw: at, swap: at + 0.22, done: at + 0.65 }; });

// every time in the chain, laid end to end from the first reply r
function plan(r) {
  const T = { r, card: r + 0.22, w1: r + 1.5, steps: [] };
  let s = r + IMAGE_HOLD;
  for (const st of STEPS) {
    const typeEnd = s + st.ask.length / TYPE_CPS, send = typeEnd + 0.15;
    const chips = chipsAt(send + 0.35, st.chips);
    const rr = chips[chips.length - 1].done + 0.08;
    T.steps.push({ ...st, s, typeEnd, send, chips, r: rr, card: rr + 0.22, w0: rr + 0.3, w1: rr + 1.6, g0: rr + 0.8, play: rr + 0.82, cut: rr + 0.82 + SONG_FOR });
    s = rr + st.hold;
  }
  T.end = s;
  return T;
}
// the chain's length from its first reply: the route's `extra` stretches the loop by what this runs past the base beat
export const LEN = plan(0).end;

const DL_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>';
const dl = (href, name) => `<a class="qc-dl" href="${href}" download="${name}" aria-label="Download image" title="Download">${DL_GLYPH}</a>`;
const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.2v13.6L19 12z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>';
const DOWNLOAD = '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 19.5h14"/></svg>';
const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// the track's measured envelope as one filled shape: the top edge left to right, then the bottom edge back
const WAVE_D = (() => {
  const n = PEAKS.top.length;
  const y = (v, dir) => (50 + dir * Math.max(1.5, v) * 0.48).toFixed(1);
  let d = 'M0 50';
  for (let i = 0; i < n; i++) d += `L${i} ${y(PEAKS.top[i], -1)}`;
  for (let i = n - 1; i >= 0; i--) d += `L${i} ${y(PEAKS.bot[i], 1)}`;
  return `${d}Z`;
})();
const wave = (cls) => `<svg class="${cls}" viewBox="0 0 ${PEAKS.top.length - 1} 100" preserveAspectRatio="none" aria-hidden="true"><path d="${WAVE_D}"/></svg>`;
// each sung line's words, and when the line takes the lyric slot (just before its first word)
const LINE_WORDS = LINES.map((_, i) => WORDS.filter((w) => w[3] === i));
const LINE_AT = LINE_WORDS.map((ws) => ws[0][1] - 0.35);

let sheet = null;
function loadSheet() {
  if (sheet) return;
  sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = CSS;
  track(new Promise((done) => {
    sheet.onload = done;
    sheet.onerror = () => { console.error(new Error(`multicat variant stylesheet failed to load: ${CSS}`)); done(); };
  }));
  document.head.appendChild(sheet);
}

// a block's entrance: it rises and settles in over 0.45s from `at` (the other beats' card entrance)
function enter(n, t, at) {
  const ci = outCubic(seg(t, at, at + 0.45));
  n.style.opacity = ci.toFixed(3);
  n.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;
  return ci;
}
const fade = (n, p) => { n.style.opacity = p.toFixed(3); n.style.visibility = p > 0 ? '' : 'hidden'; };

// the streamed line every reply opens with: the visible prefix, the rest held in place transparent
function sayEl(x, text) {
  const n = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(text)}</span></div>`);
  let shown = -1;
  return { n, render(t, at) {
    const c = streamCount(text, at + 0.06, 70, t);
    if (c !== shown) { n.firstElementChild.textContent = text.slice(0, c); n.lastElementChild.textContent = text.slice(c); shown = c; }
  } };
}

export default {
  // `end` (the base route's end plus `extra`) is LEN past r by construction, so the chain keeps its own clock
  times(r) { return plan(r); },
  build(k, x) {
    loadSheet();
    loadFrameSheet();
    const T = k.T;
    const [M, O, S] = T.steps;

    // 1. GPT Image 2, in the engine's own reply
    const say1 = sayEl(x, SAY1);
    const media1 = x.el(`<div class="qc-media"><div class="qc-img qc-skel mc-img"><img src="${CAT}" width="1536" height="1152" alt="A photorealistic brown tabby cat standing side-on, looking at the camera"/><i class="qc-sk"></i><span class="qc-genl">${x.tile('gptimage')}Creating image</span>${shareDisc('Realistic cat', { file: CAT })}${dl(CAT, 'cat.jpg')}</div></div>`);
    const card1 = media1.firstElementChild;
    const im1 = card1.querySelector('img'), sk1 = card1.querySelector('.qc-sk'), genl1 = card1.querySelector('.qc-genl');
    const dl1 = card1.querySelector('.qc-dl'), share1 = card1.querySelector('.qc-share');

    // 2-4: each ask's user bubble, its chip rows and its reply
    const follow = [];
    const steps = T.steps.map((st) => {
      const u = x.el(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${x.esc(st.ask)}</div></div></div>`);
      const rows = st.chips.map((c) => {
        const w = x.el(`<div class="msg qc-m">${x.sbAvatar}<div class="m-main"><span class="qc-sw">${x.tile(c.app)}<span class="qc-swl">${x.esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${x.OK}</span></span></div></div>`);
        return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
      });
      // the credits frame under the resolved chips, the engine's (chat.9b47fc30.js credits), tiled with the answering app
      const credits = st.credits ? x.el(`<div class="msg qc-m">${x.sbAvatar}<div class="m-main"><span class="qc-cr">${x.tile(st.app)}<span class="qc-cr-t">Credits used until you connect</span><span class="qc-cr-n">${st.credits} credits</span><button type="button" class="qc-cr-b">Connect</button></span></div></div>`) : null;
      const reply = x.el(`<div class="msg qc-m qc-r">${x.sbAvatar}<div class="m-main"><div class="qc-who">${x.who(st.app)}</div></div></div>`);
      const say = sayEl(x, st.say);
      reply.lastElementChild.append(say.n);
      follow.push(u, ...rows.map((rw) => rw.w), ...(credits ? [credits] : []), reply);
      return { st, u, rows, credits, creditsAt: st.chips[st.chips.length - 1].done + 0.1, reply, who: reply.querySelector('.qc-who'), say };
    });
    const [mStep, oStep, sStep] = steps;

    // 2. Meshy's model in the 3D variant's artifact frame
    const model = x.el(`<div class="bk mc-3d"><div class="bk-head"><b class="bk-title">Cat 3D model<small>Animated · GLB</small></b>${shareBtn('Cat 3D model', { file: MODEL })}${EXPAND}<a class="bk-btn bk-publish" href="${MODEL}" download="cat.glb">${DL_GLYPH}Download</a></div><div class="bk-view qc-3d qc-skel"><canvas width="1400" height="875" role="img" aria-label="Animated 3D cat model walking on a turntable"></canvas><i class="qc-sk"></i><span class="qc-genl">${x.tile('meshy')}Creating 3D model<b class="qc-genn"></b></span></div></div>`);
    mStep.reply.lastElementChild.append(model);
    const canvas = model.querySelector('canvas'), skM = model.querySelector('.qc-sk'), genlM = model.querySelector('.qc-genl'), pct = model.querySelector('.qc-genn');

    // 3. the DoorDash order, framed as the doordash variant's is
    const order = x.el(`<div class="bk mc-dd"><div class="bk-head"><b class="bk-title">Petco order<small>1 item · $16.49 subtotal</small></b>${shareBtn('Petco order')}<a class="bk-btn bk-publish mc-dd-open" href="${STORE}" target="_blank" rel="noopener noreferrer"><img src="${x.brand('doordash-logo.svg')}" alt="">View in DoorDash</a></div><div class="bk-view"><div class="mc-dd-cam"><div class="mc-dd-zoom"><img class="mc-dd-shot" src="${ORDER}" width="896" height="560" alt="${x.esc(ORDER_ALT)}"></div></div><i class="bk-sh"></i></div></div>`);
    oStep.reply.lastElementChild.append(order);
    const zoom = order.querySelector('.mc-dd-zoom'), shO = order.querySelector('.bk-sh');

    // 4. the ElevenLabs track
    const song = x.el(`<div class="mc-sg"><div class="mc-sg-card">
      <div class="mc-sg-art"><img src="${COVER}" width="256" height="256" alt="Cover art: the cat from the first answer"/></div>
      <div class="mc-sg-side">
        <div class="mc-sg-t"><b>${TITLE}</b><small>Indie pop · ElevenLabs Music</small></div>
        <div class="mc-sg-row"><span class="mc-sg-btn">${PLAY}${PAUSE}</span><div class="mc-sg-wave">${wave('mc-w0')}${wave('mc-w1')}</div><span class="mc-sg-time">${clock(0)} / ${clock(DUR)}</span></div>
      </div>
      <button type="button" class="mc-sg-share" ${shareAttrs(`${TITLE}, a song about cats`, { file: SONG })}>${SHARE_GLYPH}</button>
      <a class="mc-sg-dl" href="${SONG}" download="tiny-chaos.mp3" aria-label="Download" title="Download">${DOWNLOAD}</a>
    </div><div class="mc-ly" aria-live="off"></div></div>`);
    sStep.reply.lastElementChild.append(song);
    const $ = (s) => song.querySelector(s);
    const btn = $('.mc-sg-btn'), time = $('.mc-sg-time'), played = $('.mc-w1'), lyric = $('.mc-ly');
    const [playIcon, pauseIcon] = btn.querySelectorAll('svg');
    // Space and Enter press the cards' controls, not the spot's clock (timeline.9b47fc30.js), as on the other beats
    for (const n of [media1, model, order, song]) n.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('a, button')) e.stopPropagation(); });

    // the end card: the house superbot.gg lockup, the wordmark left and the mascot face right, over the spot's black. It
    // rides in nodes (so other variants hide it) and moves to the scene section on the first render, above the hub
    const endCard = x.el(`<div class="mc-end" role="img" aria-label="superbot.gg"><div class="mc-end-word"><b>superbot.gg</b></div><div class="mc-end-bot">${END_FACE}</div></div>`);
    const endWord = endCard.querySelector('.mc-end-word'), endBot = endCard.querySelector('.mc-end-bot');
    let endK = 1; // the lockup's scale now applied (--k)

    // the song's audio follows the clock: it plays while the clock runs through the play window, at the clock's speed
    const audio = new Audio();
    audio.preload = 'auto';
    let blocked = false, lastT = null, movedAt = -1, lastStep = 0;
    const unblock = () => { blocked = false; };
    addEventListener('variantchange', () => audio.pause());
    function syncAudio(t) {
      const now = performance.now();
      if (lastT !== null && t !== lastT) { lastStep = t - lastT; movedAt = now; }
      lastT = t;
      // running: the timeline says so (__AD.playing); failing that, the clock moved lately by about a frame's step
      const ad = window.__AD;
      const moving = now - movedAt < 400 && lastStep > 0 && lastStep < 0.2;
      const running = !document.body.classList.contains('freeze') && (ad && typeof ad.playing === 'boolean' ? ad.playing : moving);
      const at = t - S.play;
      if (!running || at < 0 || at >= Math.min(DUR, SONG_FOR + SONG_FADE)) { if (!audio.paused) audio.pause(); return; }
      if (!audio.src) audio.src = SONG;
      // it fades out as the end card covers the chat, so the cut never lands mid-note
      audio.volume = Math.max(0, 1 - seg(at, SONG_FOR, SONG_FOR + SONG_FADE));
      const rate = (window.__AD && window.__AD.speed) || 1;
      if (audio.playbackRate !== rate) audio.playbackRate = rate;
      if (Math.abs(audio.currentTime - at) > 0.3) audio.currentTime = at;
      if (audio.paused && !blocked) {
        audio.play().catch((e) => {
          // autoplay with sound waits for a gesture: the next click or key lets it start
          blocked = true;
          console.warn('multicat: the song waits for a click or key to play (autoplay policy)', e);
          addEventListener('pointerdown', unblock, { once: true });
          addEventListener('keydown', unblock, { once: true });
        });
      }
    }

    let placed = false, viewer = null, decoding = false, built = -1, sec = -1, cut = -1, playing = null, line = -1, lit = -1;
    return {
      nodes: [say1.n, media1, ...follow, endCard],
      // the feed's fold glides to each element's bottom as it lands (chat.9b47fc30.js scrollOf)
      marks: [[T.r, say1.n], [T.card, media1], ...steps.flatMap((p) => [[p.st.send, p.u], ...p.rows.map((rw) => [rw.c.sw, rw.w]), ...(p.credits ? [[p.creditsAt, p.credits]] : []), [p.st.r, p.who], [p.st.r, p.say.n], [p.st.card, p.reply.lastElementChild.lastElementChild]])],
      // the follow-up asks, typed into the composer and sent by the engine (renderComposer), and their chips, which move
      // the composer's platform chip (renderRouting)
      asks: T.steps.map((st) => ({ text: st.ask, s: st.s, typeEnd: st.typeEnd, send: st.send })),
      chips: T.steps.flatMap((st) => st.chips),
      render(t) {
        if (!placed) {
          // the follow-ups leave the engine's reply for the feed, in order right after it
          let at = say1.n.closest('.msg');
          for (const m of follow) { at.after(m); at = m; }
          // the end card leaves the hub for the scene section: stage px, unscaled by the hub's camera
          x.hub.closest('.scene').appendChild(endCard);
          placed = true;
        }
        if (!decoding) {
          decoding = true;
          for (const pic of [im1, order.querySelector('img'), song.querySelector('img')]) {
            track(pic.decode().catch((e) => console.error(new Error(`multicat image failed to decode: ${pic.src}`, { cause: e }))));
          }
        }
        if (!viewer) { viewer = makeCatViewer(canvas, MODEL); track(viewer.ready); }

        // 1. the photo: a skeleton while GPT Image 2 works, then it lands as the 1-image card does
        say1.render(t, T.r);
        enter(media1, t, T.card);
        const lp1 = landing(t, T.w1 - LAND);
        shimmer(sk1, t, T.card, 0, lp1);
        settle(im1, lp1);
        fade(dl1, lp1); fade(share1, lp1);
        genl1.style.opacity = (1 - seg(t, T.w1 - 0.25, T.w1)).toFixed(3);

        // 2-4: bubble, chips, reply header and line, as the engine draws its own
        for (const p of steps) {
          x.appear(p.u, t, p.st.send);
          p.rows.forEach((rw) => { x.appear(rw.w, t, rw.c.sw); x.renderSwitch(rw, t); });
          if (p.credits) x.appear(p.credits, t, p.creditsAt);
          x.appear(p.reply, t, p.st.r);
          p.say.render(t, p.st.r);
        }

        // 2. the model: builds behind the skeleton, lands like the 3D variant's, walking as the turntable turns
        const cm = enter(model, t, M.card);
        if (cm > 0) viewer.draw({ spin: SPIN0 + SPIN * (t - M.card), time: t - M.card });
        const lpm = landing(t, M.w1 - LAND);
        shimmer(skM, t, M.card, 0, lpm);
        settle(canvas, lpm);
        const pc = Math.round(seg(t, M.w0, M.w1) * 100);
        if (pc !== built) { pct.textContent = `${pc}%`; built = pc; }
        genlM.style.opacity = (1 - seg(t, M.w1 - 0.25, M.w1)).toFixed(3);

        // 3. the order: a skeleton until O.g0, then the card fades in and settles (doordash.d9bc17e9.js)
        enter(order, t, O.card);
        const lpo = landing(t, O.g0);
        shimmer(shO, t, O.card, 0, lpo);
        settle(zoom, lpo);

        // 4. the song: the button presses into pause, the white waveform uncovers to the playhead, the sung line lights
        enter(song, t, S.card);
        const el = Math.min(DUR, Math.max(0, t - S.play));
        const s = Math.floor(el);
        if (s !== sec) { time.textContent = `${clock(s)} / ${clock(DUR)}`; sec = s; }
        const c = +((1 - el / DUR) * 100).toFixed(3);
        if (c !== cut) { played.style.clipPath = `inset(0 ${c}% 0 0)`; cut = c; }
        const press = seg(t, S.play - 0.12, S.play) * (1 - seg(t, S.play, S.play + 0.1));
        btn.style.transform = press > 0 ? `scale(${(1 - 0.12 * press).toFixed(4)})` : 'none';
        const on = t >= S.play;
        if (on !== playing) { playIcon.style.display = on ? 'none' : ''; pauseIcon.style.display = on ? '' : 'none'; playing = on; }
        let li = 0;
        while (li + 1 < LINES.length && el >= LINE_AT[li + 1]) li++;
        if (li !== line) { lyric.innerHTML = LINE_WORDS[li].map((w) => `<span>${x.esc(w[0])}</span>`).join(' '); line = li; lit = -1; }
        const n = on ? LINE_WORDS[li].filter((w) => el >= w[1]).length : 0;
        if (n !== lit) { [...lyric.children].forEach((w, i) => w.classList.toggle('on', i < n)); lit = n; }
        lyric.style.opacity = seg(t, S.play - 0.2, S.play + 0.2).toFixed(3);
        syncAudio(t);

        // the end card: the chat fades to black, then the house card's own run (endcard.1d16d488.html render(t))
        const cover = seg(t, S.cut, S.cut + END_IN);
        endCard.style.opacity = cover.toFixed(3);
        endCard.style.visibility = cover > 0 ? '' : 'hidden';
        if (cover > 0) {
          const tc = t - (S.cut + END_DELAY);
          const W = endCard.clientWidth, H = endCard.clientHeight;
          // the house sizes on a 1080-high stage, scaled down (--k) only when a narrow ratio would crop the lockup
          const natW = endWord.offsetWidth / endK;
          const k = Math.min(1, (W * 0.86) / (natW + END_GAP + 220));
          if (k !== endK) { endCard.style.setProperty('--k', k.toFixed(4)); endK = k; }
          const w = 220 * k, wordW = natW * k, gap = END_GAP * k;
          const left = (W - (wordW + gap + w)) / 2, midY = H / 2;
          const pop = clamp(tc / 0.55), shift = outQuint(clamp((tc - 0.3) / 1.0));
          endBot.style.opacity = outQuint(clamp(tc / 0.3)).toFixed(3);
          endBot.style.transform = `translate(${(left + wordW + gap).toFixed(2)}px, ${(midY - w / 2).toFixed(2)}px) scale(${(0.72 + 0.28 * popBack(pop)).toFixed(4)})`;
          endWord.style.opacity = shift.toFixed(3);
          endWord.style.filter = shift < 1 ? `blur(${(6 * k * (1 - shift)).toFixed(2)}px)` : 'none';
          endWord.style.transform = `translate(${(left - 20 * k * (1 - shift)).toFixed(2)}px, -50%)`;
        }
      },
    };
  },
};
