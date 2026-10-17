// Multidog beat (the 'multidog' variant): four asks in one chat, each routed to a different tool, the dog sibling of the
// multicat beat (multicat.516afb1a.js) on the same engine contract. The engine types and routes the first ask ("Make me a
// realistic image of a dog", GPT Image 2) and this beat answers it; then it carries the chat on by itself: three more
// asks are typed into the composer, sent, routed (their chips land and resolve, the composer's platform chip follows)
// and answered, each in its own reply.
//   1. GPT Image 2: the beagle photo lands as the 1-image card does (thumb-land.309eb9c5.js).
//   2. Meshy: the Meshy 7.1 model made from that same photo builds in the 3D variant's artifact frame, then walks on a
//      turntable (the cat sibling's viewer, cat3d.516afb1a.js, plays the GLB's own clip). Meshy made the mesh; its
//      rigger takes humanoids only, so superbot rigged and keyed the walk itself, and the chip after Meshy's says so.
//   3. DoorDash: a rebuilt PetSmart "Confirming your order" card for a real listing (img/dogs.7b007b09/CREDITS.txt).
//   4. ElevenLabs: the song plays: the real track (media/dogs.7b007b09/tails-up.mp3) under its real waveform, the sung
//      line lighting word by word on its forced-alignment timings (multidog-data.7b007b09.js), and the audio itself
//      kept in step with the spot's clock while it runs.
// The follow-up messages are built here and moved in after the engine's reply on the first render (they ride in
// inst.nodes, so the engine's show() hides them under every other variant). The engine reads inst.asks (the composer's
// typing and send presses) and inst.chips (the platform chip's swaps) for them (chat.9b47fc30.js). A pure function of
// t, except the audio, which follows the clock and never drives it. Its stylesheet (../multidog.7b007b09.css) loads with
// the module.
import { lerp, seg, outCubic, streamCount } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { LAND, landing, shimmer, settle } from './thumb-land.309eb9c5.js';
import { EXPAND, loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
// the Share control every output card carries (share.29a362ea.js)
import { shareBtn, shareDisc, SHARE_GLYPH, shareAttrs } from './share.29a362ea.js';
// the walking-model viewer is generic: any GLB, normalised, its first clip set to an absolute time
import { makeCatViewer as makeModelViewer } from './cat3d.516afb1a.js?v=1';
import { DUR, PEAKS, LINES, WORDS } from './multidog-data.7b007b09.js';

const CSS = new URL('../multidog.7b007b09.css?v=1', import.meta.url).href;
const asset = (p) => new URL('../../../' + p, import.meta.url).href;
const DOG = asset('img/dogs.7b007b09/beagle.jpg');
const COVER = asset('img/dogs.7b007b09/cover.jpg'); // the song's cover: that same beagle, cropped to its face
const ORDER = asset('img/dogs.7b007b09/order-placed.jpg');
const MODEL = asset('models/dog-meshy.7b007b09.glb');
const SONG = asset('media/dogs.7b007b09/tails-up.mp3');
const STORE = 'https://www.doordash.com/convenience/store/1440871/';
const ORDER_ALT = 'DoorDash order placed: Confirming your order from PetSmart, one Purina Pro Plan Chicken & Rice Formula Complete Essentials Adult Dry Dog Food Bag (35 lb), $74.99 subtotal';
const TITLE = 'Tails Up';

export const TYPE_CPS = 55; // every ask types at this rate; the first one through its route's typeCps (chat.9b47fc30.js)
const CHIP_STRIDE = 0.77;  // the engine's routing chip clock (chat.9b47fc30.js chipsAt), so every chip lands alike
const SAY1 = 'Here’s a realistic photo of a dog.';
const IMAGE_HOLD = 2.6;     // the image reply, from its header to the next ask starting to type
// how much of the song plays before the chain ends: the step holds 0.4s past it and the spot's last frame lands 0.7s after
// that (chat.9b47fc30.js chatEnd and the tabs scene's tail), 8.2s into the track: just after "Tails up, running in the
// morning sun", the second sung line (its last word ends at 7.64s), before the lyric slot turns to "Muddy paws" (8.31s)
const PLAY_FOR = 7.1;
const SPIN0 = -0.75, SPIN = 0.3; // the turntable's angle as the 3D card lands (a three-quarter view), and its turn in rad/s
// `credits`: what the generation charges until the user connects their own plan, priced as the single-tool cuts are
// (chat.9b47fc30.js creditsBy: '3d' 20, song 15; the first ask's 4 is the engine's); an order charges none
const STEPS = [
  { ask: 'Make me an animated 3d model of a realistic dog', app: 'meshy', say: 'Here’s that beagle as an animated 3D model.', hold: 4.4, credits: 20,
    chips: [['meshy', 'Switching to Meshy'], ['superbot', 'Rigging and animating the dog', true]] },
  { ask: 'Order me dogfood from doordash', app: 'doordash', say: 'Your dog food has been ordered from PetSmart.', hold: 2.8, credits: 0,
    chips: [['doordash', 'Connecting to DoorDash']] },
  { ask: 'Make me a song about dogs', app: 'elevenlabs', say: 'Here’s an upbeat indie pop song about dogs.', hold: 0.82 + PLAY_FOR + 0.4, credits: 15,
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
    T.steps.push({ ...st, s, typeEnd, send, chips, r: rr, card: rr + 0.22, w0: rr + 0.3, w1: rr + 1.6, g0: rr + 0.8, play: rr + 0.82 });
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
    sheet.onerror = () => { console.error(new Error(`multidog variant stylesheet failed to load: ${CSS}`)); done(); };
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

// 1. GPT Image 2's photo, in the engine's own reply: a skeleton while it works, then it lands as the 1-image card does
function buildPhoto(x, T) {
  const say = sayEl(x, SAY1);
  const media = x.el(`<div class="qc-media"><div class="qc-img qc-skel md-img"><img src="${DOG}" width="1536" height="1152" alt="A photorealistic tricolor beagle standing on a sunny lawn, three-quarter view"/><i class="qc-sk"></i><span class="qc-genl">${x.tile('gptimage')}Creating image</span>${shareDisc('Realistic dog', { file: DOG })}${dl(DOG, 'beagle.jpg')}</div></div>`);
  const card = media.firstElementChild;
  const q = (s) => card.querySelector(s);
  const im = q('img'), sk = q('.qc-sk'), genl = q('.qc-genl'), dlA = q('.qc-dl'), share = q('.qc-share');
  return { say, media, im, render(t) {
    say.render(t, T.r);
    enter(media, t, T.card);
    const lp = landing(t, T.w1 - LAND);
    shimmer(sk, t, T.card, 0, lp);
    settle(im, lp);
    fade(dlA, lp); fade(share, lp);
    genl.style.opacity = (1 - seg(t, T.w1 - 0.25, T.w1)).toFixed(3);
  } };
}

// 2-4: each follow-up ask's user bubble, its chip rows, the credits frame a generation charges and its reply (header and
// streamed line), in the engine's markup
function buildSteps(x, T) {
  return T.steps.map((st) => {
    const u = x.el(`<div class="msg qc-u"><span class="avatar">S</span><div class="m-main"><div class="m-head"><span class="m-name">sam</span></div><div class="m-text">${x.esc(st.ask)}</div></div></div>`);
    const rows = st.chips.map((c) => {
      const w = x.el(`<div class="msg qc-m">${x.sbAvatar}<div class="m-main"><span class="qc-sw">${x.tile(c.app)}<span class="qc-swl">${x.esc(c.label)}</span><span class="qc-st"><i class="qc-spin"></i>${x.OK}</span></span></div></div>`);
      return { c, w, sw: w.querySelector('.qc-sw'), spin: w.querySelector('.qc-spin'), ok: w.querySelector('.qc-st .qc-ok') };
    });
    // the credits frame lands under the resolved chips, as the engine's does (chat.9b47fc30.js credits), tiled with the answering app
    const credits = st.credits ? x.el(`<div class="msg qc-m">${x.sbAvatar}<div class="m-main"><span class="qc-cr">${x.tile(st.app)}<span class="qc-cr-t">Credits used until you connect</span><span class="qc-cr-n">${st.credits} credits</span><button type="button" class="qc-cr-b">Connect</button></span></div></div>`) : null;
    const creditsAt = st.chips[st.chips.length - 1].done + 0.1;
    const reply = x.el(`<div class="msg qc-m qc-r">${x.sbAvatar}<div class="m-main"><div class="qc-who">${x.who(st.app)}</div></div></div>`);
    const say = sayEl(x, st.say);
    reply.lastElementChild.append(say.n);
    const render = (t) => {
      x.appear(u, t, st.send);
      rows.forEach((rw) => { x.appear(rw.w, t, rw.c.sw); x.renderSwitch(rw, t); });
      if (credits) x.appear(credits, t, creditsAt);
      x.appear(reply, t, st.r);
      say.render(t, st.r);
    };
    return { st, u, rows, credits, creditsAt, reply, who: reply.querySelector('.qc-who'), say, nodes: [u, ...rows.map((rw) => rw.w), ...(credits ? [credits] : []), reply], render };
  });
}

// 2. Meshy's model in the 3D variant's artifact frame: builds behind the skeleton, lands like the 3D variant's, then
// walks as the turntable turns (the clip's time runs from the card's entrance, so it is mid-stride when it lands)
function buildModel(x, M) {
  const node = x.el(`<div class="bk md-3d"><div class="bk-head"><b class="bk-title">Beagle 3D model<small>Animated · GLB</small></b>${shareBtn('Beagle 3D model', { file: MODEL })}${EXPAND}<a class="bk-btn bk-publish" href="${MODEL}" download="beagle.glb">${DL_GLYPH}Download</a></div><div class="bk-view qc-3d qc-skel"><canvas width="1400" height="875" role="img" aria-label="Animated 3D beagle model walking on a turntable"></canvas><i class="qc-sk"></i><span class="qc-genl">${x.tile('meshy')}Creating 3D model<b class="qc-genn"></b></span></div></div>`);
  const q = (s) => node.querySelector(s);
  const canvas = q('canvas'), sk = q('.qc-sk'), genl = q('.qc-genl'), pct = q('.qc-genn');
  let viewer = null, built = -1;
  return { node, render(t) {
    if (!viewer) { viewer = makeModelViewer(canvas, MODEL); track(viewer.ready); }
    if (enter(node, t, M.card) > 0) viewer.draw({ spin: SPIN0 + SPIN * (t - M.card), time: t - M.card });
    const lp = landing(t, M.w1 - LAND);
    shimmer(sk, t, M.card, 0, lp);
    settle(canvas, lp);
    const pc = Math.round(seg(t, M.w0, M.w1) * 100);
    if (pc !== built) { pct.textContent = `${pc}%`; built = pc; }
    genl.style.opacity = (1 - seg(t, M.w1 - 0.25, M.w1)).toFixed(3);
  } };
}

// 3. the DoorDash order, framed as the doordash variant's is: a skeleton until O.g0, then the card fades in and settles
function buildOrder(x, O) {
  const node = x.el(`<div class="bk md-dd"><div class="bk-head"><b class="bk-title">PetSmart order<small>1 item · $74.99 subtotal</small></b>${shareBtn('PetSmart order')}<a class="bk-btn bk-publish md-dd-open" href="${STORE}" target="_blank" rel="noopener noreferrer"><img src="${x.brand('doordash-logo.svg')}" alt="">View in DoorDash</a></div><div class="bk-view"><div class="md-dd-cam"><div class="md-dd-zoom"><img class="md-dd-shot" src="${ORDER}" width="896" height="560" alt="${x.esc(ORDER_ALT)}"></div></div><i class="bk-sh"></i></div></div>`);
  const zoom = node.querySelector('.md-dd-zoom'), sh = node.querySelector('.bk-sh');
  return { node, render(t) {
    enter(node, t, O.card);
    const lp = landing(t, O.g0);
    shimmer(sh, t, O.card, 0, lp);
    settle(zoom, lp);
  } };
}

// the song's audio follows the clock: it plays while the clock runs through the play window, at the clock's speed, and
// waits for a click or key when the browser holds sound back until a gesture
function audioFollower(S) {
  const audio = new Audio();
  audio.preload = 'auto';
  let blocked = false, lastT = null, movedAt = -1, lastStep = 0;
  const unblock = () => { blocked = false; };
  addEventListener('variantchange', () => audio.pause());
  return (t) => {
    const now = performance.now();
    if (lastT !== null && t !== lastT) { lastStep = t - lastT; movedAt = now; }
    lastT = t;
    // running: the clock moved in the last few frames by a frame's step (not a seek or an arrow-key step)
    const running = !document.body.classList.contains('freeze') && now - movedAt < 120 && lastStep > 0 && lastStep < 0.1;
    const at = t - S.play;
    if (!running || at < 0 || at >= DUR) { if (!audio.paused) audio.pause(); return; }
    if (!audio.src) audio.src = SONG;
    // it fades out over the run's last 0.8s, so the held last frame does not cut the song off mid-note
    const endAt = ((window.__AD && window.__AD.CYCLE) || Infinity) - S.play;
    audio.volume = Math.max(0, 1 - seg(at, endAt - 0.8, endAt));
    const rate = (window.__AD && window.__AD.speed) || 1;
    if (audio.playbackRate !== rate) audio.playbackRate = rate;
    if (Math.abs(audio.currentTime - at) > 0.3) audio.currentTime = at;
    if (audio.paused && !blocked) {
      audio.play().catch((e) => {
        blocked = true;
        console.warn('multidog: the song waits for a click or key to play (autoplay policy)', e);
        addEventListener('pointerdown', unblock, { once: true });
        addEventListener('keydown', unblock, { once: true });
      });
    }
  };
}

// 4. the ElevenLabs track: the button presses into pause, the white waveform uncovers to the playhead, the sung line
// lights word by word on its aligned timings
function buildSong(x, S) {
  const node = x.el(`<div class="md-sg"><div class="md-sg-card">
      <div class="md-sg-art"><img src="${COVER}" width="320" height="320" alt="Cover art: the beagle from the first answer"/></div>
      <div class="md-sg-side">
        <div class="md-sg-t"><b>${TITLE}</b><small>Indie pop · ElevenLabs Music</small></div>
        <div class="md-sg-row"><span class="md-sg-btn">${PLAY}${PAUSE}</span><div class="md-sg-wave">${wave('md-w0')}${wave('md-w1')}</div><span class="md-sg-time">${clock(0)} / ${clock(DUR)}</span></div>
      </div>
      <button type="button" class="md-sg-share" ${shareAttrs(`${TITLE}, a song about dogs`, { file: SONG })}>${SHARE_GLYPH}</button>
      <a class="md-sg-dl" href="${SONG}" download="tails-up.mp3" aria-label="Download" title="Download">${DOWNLOAD}</a>
    </div><div class="md-ly" aria-live="off"></div></div>`);
  const q = (s) => node.querySelector(s);
  const btn = q('.md-sg-btn'), time = q('.md-sg-time'), played = q('.md-w1'), lyric = q('.md-ly');
  const [playIcon, pauseIcon] = btn.querySelectorAll('svg');
  const syncAudio = audioFollower(S);
  let sec = -1, cut = -1, playing = null, line = -1, lit = -1;
  return { node, render(t) {
    enter(node, t, S.card);
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
    const photo = buildPhoto(x, T);
    const steps = buildSteps(x, T);
    const model = buildModel(x, M), order = buildOrder(x, O), song = buildSong(x, S);
    [model, order, song].forEach((b, i) => steps[i].reply.lastElementChild.append(b.node));
    const follow = steps.flatMap((p) => p.nodes);
    // Space and Enter press the cards' controls, not the spot's clock (timeline.9b47fc30.js), as on the other beats
    for (const n of [photo.media, model.node, order.node, song.node]) n.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && e.target.closest('a, button')) e.stopPropagation(); });
    let placed = false, decoding = false;
    return {
      nodes: [photo.say.n, photo.media, ...follow],
      // the feed's fold glides to each element's bottom as it lands (chat.9b47fc30.js scrollOf)
      marks: [[T.r, photo.say.n], [T.card, photo.media], ...steps.flatMap((p) => [[p.st.send, p.u], ...p.rows.map((rw) => [rw.c.sw, rw.w]), ...(p.credits ? [[p.creditsAt, p.credits]] : []), [p.st.r, p.who], [p.st.r, p.say.n], [p.st.card, p.reply.lastElementChild.lastElementChild]])],
      // the follow-up asks, typed into the composer and sent by the engine (renderComposer), and their chips, which move
      // the composer's platform chip (renderRouting)
      asks: T.steps.map((st) => ({ text: st.ask, s: st.s, typeEnd: st.typeEnd, send: st.send })),
      chips: T.steps.flatMap((st) => st.chips),
      render(t) {
        if (!placed) {
          // the follow-ups leave the engine's reply for the feed, in order right after it
          let at = photo.say.n.closest('.msg');
          for (const m of follow) { at.after(m); at = m; }
          placed = true;
        }
        if (!decoding) {
          decoding = true;
          for (const pic of [photo.im, order.node.querySelector('img.md-dd-shot'), song.node.querySelector('img')]) {
            track(pic.decode().catch((e) => console.error(new Error(`multidog image failed to decode: ${pic.src}`, { cause: e }))));
          }
        }
        photo.render(t);
        steps.forEach((p) => p.render(t));
        model.render(t);
        order.render(t);
        song.render(t);
      },
    };
  },
};
