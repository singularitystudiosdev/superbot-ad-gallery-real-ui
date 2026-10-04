// Code beat: Claude Opus 5.5 writes the trailer as code and renders it. Its line streams, then one panel rises in the
// base's code-panel grammar (Cursor Dark, as the source ad's replies.js): a header with the project and an honest state ("Writing",
// "Rendering", then the green check and "Rendered"), and a split body. Left: the editor, Trailer.tsx active, where a
// compact Remotion composition streams in with Dark+ syntax colours. It uses every earlier tool's output by name: the
// DeepSeek hook as the opening Sequence (frames 0 to 60, "$29 BEAT $300" over Blender's hero.jpg), Gemini's
// title-1..3.jpg, Blender's 24-frame turntable (turn/NN.jpg), ElevenLabs' vo.mp3 and bed.mp3, and the Composition at
// 900 frames, 30 fps, 1920x1080. Right: the live preview of that composition, which hot-reloads as each Sequence is
// written (black until the hook exists, then the hook with its spring, the three title cards, the turning mic), with
// a Remotion-style frame counter (n / 900) and a fill bar; under it the terminal runs
// `npx remotion render src/index.ts Trailer out/trailer.mp4`, counts rendered frames to 900/900 and prints the file.
// In the zoom cut the camera pushes onto the whole panel while the code streams (T.focus, chat.js FOCUS) and pulls
// back before the Studio pill. Pure function of t: every value on screen is written from t, the line heights are
// constants and the preview's images are all mounted once and only shown or hidden, so a seek never waits on a load.
// Remotion API surface checked against remotion.dev docs (Composition, Sequence from/durationInFrames, AbsoluteFill,
// Img, Audio, staticFile, spring({frame, fps}), useCurrentFrame; CLI `npx remotion render <entry> <comp-id> <out>`).
import { seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wrote the trailer in Remotion and rendered it: 900 frames, 1080p.';
const PROJECT = 'sam-trailer';
const FRAMES = 900;
// the composition, exactly as it streams (every line fits the editor pane at 60 characters)
const CODE = `import {AbsoluteFill, Audio, Composition, Img, Sequence,
  spring, staticFile, useCurrentFrame} from 'remotion';
const Hook = () => { // $29 winner, price on screen
  const s = spring({frame: useCurrentFrame(), fps: 30});
  return <AbsoluteFill>
    <Img src={staticFile('hero.jpg')} />
    <h1 style={{scale: s}}>$29 BEAT $300</h1>
  </AbsoluteFill>;
};
const Turn = () => {
  const i = Math.floor(useCurrentFrame() / 4) % 24;
  const n = String(i).padStart(2, '0');
  return <Img src={staticFile(\`turn/\${n}.jpg\`)} />;
};
export const Trailer = () => <AbsoluteFill>
  <Sequence durationInFrames={60}><Hook /></Sequence>
  {[1, 2, 3].map((n) => <Sequence key={n}
    from={n * 90 - 30} durationInFrames={90}>
    <Img src={staticFile(\`title-\${n}.jpg\`)} /></Sequence>)}
  <Sequence from={330}><Turn /></Sequence>
  <Audio src={staticFile('vo.mp3')} />
  <Audio src={staticFile('bed.mp3')} volume={0.2} />
</AbsoluteFill>;
export const Root = () => <Composition id="Trailer"
  component={Trailer} durationInFrames={900} fps={30}
  width={1920} height={1080} />;`;
const LINES = CODE.split('\n');
// the lines whose completion hot-reloads a new section into the preview (0-based): the hook Sequence, the title map's
// last line, the turntable Sequence
const L_HOOK = 15, L_TITLES = 18, L_TURN = 19;
const CMD = 'npx remotion render src/index.ts Trailer out/trailer.mp4';
const RESULT = 'out/trailer.mp4, 0:30, 1920x1080';

// timing (seconds from the reply start, or from the panel where noted), in the source's v3 pace
const CPS_SAY = 106.25;  // the reply line streams at this many characters a second (the source's code beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;    // the panel rising in
const WRITE_AT = 0.26;   // the panel is up, then the first character lands
const WRITE = 1.5; /* deliberate */ // the whole composition streaming in, read while the camera is pushed in
const HOT_HOOK = 0.36; /* deliberate */   // the hook hot-reloads: the preview plays frames 0 to 59 over this long
const HOT_TITLES = 0.78; /* deliberate */ // the title cards: frames 60 to 329, each card about 0.26 s on screen
const TURN_FPS = 40;     // the turntable section scrubs at 40 frames a second, 10 turntable images a second
const CMD_AT = 0.06;     // the code is written, then the render command types
const CMD_IN = 0.14;     // ...over this long
const RENDER = 0.62; /* deliberate */ // the rendered-frames counter 0 to 900
const ENCODE = 0.12;     // the encode line, then the file
const HOLD_DONE = 0.42; /* deliberate */ // done: the result reads, pushed in, before the pull-back
const POP = 0.176;       // done: the header check pops in
const FOCUS_AT = 0.18; /* deliberate */  // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.42; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */  // pull-back, inOutCubic
const FILL = 0.97;       // the panel's share of the frame width when parked (the height cap in scenes/tabs.js wins first)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- a small TSX highlighter (VS Code Dark+ colours), run once at build ----------
const KW = new Set(['import', 'from', 'export', 'return']);
const DECL = new Set(['const']);
const GLOB = new Set(['Math', 'String']);
function tokenize(line) {
  const out = [];
  const re = /(\/\/.*$)|('[^']*'|"[^"]*"|`[^`]*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)|(=>)|(\s+)|([\s\S])/g;
  let m, prev = '';
  // JSX text: the run between a tag's > and the next </ (the hook headline)
  const jsx = />([^<>{}]+)<\//.exec(line);
  const jx = jsx ? [jsx.index + 1, jsx.index + 1 + jsx[1].length] : null;
  let i = 0;
  while (i < line.length) {
    if (jx && i === jx[0]) { out.push(['tx', line.slice(jx[0], jx[1])]); i = jx[1]; prev = 'tx'; continue; }
    re.lastIndex = i;
    m = re.exec(line);
    if (!m) break;
    let tx = m[0];
    if (jx && i < jx[0] && i + tx.length > jx[0]) tx = line.slice(i, jx[0]);
    let c = 'p';
    if (m[1]) c = 'cm';
    else if (m[2]) c = 'st';
    else if (m[3]) c = 'nu';
    else if (m[4]) {
      const after = line.slice(i + tx.length);
      const before = line.slice(0, i);
      if (KW.has(tx)) c = 'kw';
      else if (DECL.has(tx)) c = 'dc';
      else if (/<\/?$/.test(before)) c = /^[A-Z]/.test(tx) ? 'cp' : 'tg';
      else if (/^=\{|^="/.test(after)) c = 'at';
      else if (/^\s*=\s*\(/.test(after) && /const\s+$/.test(before)) c = 'fn';
      else if (/^\(/.test(after)) c = 'fn';
      else if (GLOB.has(tx)) c = 'cp';
      else c = 'vr';
    } else if (m[5]) c = 'dc';
    else if (m[7] && /[{}()[\]]/.test(tx)) c = 'br';
    out.push([c, tx]);
    prev = c;
    i += tx.length;
  }
  return out;
}
const TOKS = LINES.map(tokenize);
// the first k characters of line i, highlighted
function lineHTML(i, k) {
  let left = k, h = '';
  for (const [c, s] of TOKS[i]) {
    if (left <= 0) break;
    const part = s.slice(0, left);
    left -= part.length;
    h += c === 'p' ? esc(part) : `<i class="${c}">${esc(part)}</i>`;
  }
  return h;
}
const STARTS = LINES.reduce((a, l, i) => (a.push(i ? a[i - 1] + LINES[i - 1].length + 1 : 0), a), []);
const TOTAL = CODE.length;
const lineDone = (i) => STARTS[i] + LINES[i].length; // the stream count at which line i is complete

// Remotion's spring() with its default config (mass 1, stiffness 100, damping 10): the closed-form underdamped step
const spring = (frame, fps = 30) => {
  const t = Math.max(0, frame) / fps, w = 10, z = 0.5, wd = w * Math.sqrt(1 - z * z);
  return 1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t));
};

const TICK = '<svg class="cx-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CODEI = '<svg class="cx-ico" viewBox="0 0 24 24"><path d="M8.5 7L4 12l4.5 5M15.5 7L20 12l-4.5 5"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
const pad2 = (n) => String(n).padStart(2, '0');

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + WRITE;
    // the instants each hot-reloaded section lands in the preview (its line completes)
    const at = (i) => T.w0 + WRITE * (lineDone(i) / TOTAL);
    // the preview plays each section through before the next one starts, and never before its code exists
    T.hook = at(L_HOOK);
    T.titles = Math.max(at(L_TITLES), T.hook + HOT_HOOK);
    T.turn = Math.max(at(L_TURN), T.titles + HOT_TITLES);
    T.c0 = T.w1 + CMD_AT;
    T.rn0 = T.c0 + CMD_IN;
    T.rn1 = T.rn0 + RENDER;
    T.done = T.rn1 + ENCODE;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL, fill: FILL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const gen = (n) => x.img(`gen/title-${n}.jpg`);
    const turn = (i) => x.img(`blender/turn/${pad2(i)}.jpg`);
    const card = x.el(`<div class="cx-x">
      <div class="cx-hd">
        <span class="cx-proj">${CODEI}<b>${PROJECT}</b></span><span class="cx-br">remotion</span>
        <em class="cx-state"><i class="cx-spin"></i>${TICK}<span class="cx-sl">Writing</span></em>
      </div>
      <div class="cx-bd">
        <div class="cx-ed">
          <div class="cx-tabs"><span class="cx-tab on"><b class="cx-fi">TSX</b>Trailer.tsx</span><span class="cx-tab"><b class="cx-fi ts">TS</b>index.ts</span></div>
          <div class="cx-code">${LINES.map((l, i) => `<div class="cx-l"><u>${i + 1}</u><code><span class="cx-v"></span><i class="cx-caret"></i></code></div>`).join('')}</div>
        </div>
        <div class="cx-side">
          <div class="cx-ph"><b>Preview</b><span>Trailer</span><span class="cx-dim">1920x1080, 30 fps</span></div>
          <div class="cx-pv">
            <div class="cx-ly cx-hook"><img src="${x.img('blender/hero.jpg')}" alt=""/><b class="cx-h1">$29 BEAT $300</b></div>
            ${[1, 2, 3].map((n) => `<div class="cx-ly cx-title"><img src="${gen(n)}" alt=""/></div>`).join('')}
            ${Array.from({ length: 24 }, (_, i) => `<div class="cx-ly cx-turn"><img src="${turn(i)}" alt=""/></div>`).join('')}
          </div>
          <div class="cx-tc"><span class="cx-bar"><i></i></span><b class="cx-fr">0</b><span class="cx-of">/ ${FRAMES}</span></div>
          <div class="cx-term">
            <div class="cx-tl cx-cmd"><i class="cx-pr">$</i><span class="cx-cv"></span><i class="cx-tcaret"></i></div>
            <div class="cx-tl cx-rnd"><span class="cx-rl">Rendered</span> <b class="cx-rc">0/${FRAMES}</b><span class="cx-rbar"><i></i></span></div>
            <div class="cx-tl cx-enc"><span class="cx-rl">Encoded</span> <b>${FRAMES}/${FRAMES}</b></div>
            <div class="cx-tl cx-out">${TICK.replace('cx-tk', 'cx-tk cx-ok')}<b>${RESULT}</b></div>
          </div>
        </div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.cx-l')].map((n) => ({ n, v: n.querySelector('.cx-v'), c: n.querySelector('.cx-caret'), shown: -1, caret: null, vis: null }));
    const state = $('.cx-state'), stateL = $('.cx-sl'), spin = $('.cx-spin'), stTk = state.querySelector('.cx-tk');
    const hook = $('.cx-hook'), h1 = $('.cx-h1');
    const titles = [...card.querySelectorAll('.cx-title')];
    const turns = [...card.querySelectorAll('.cx-turn')];
    const fr = $('.cx-fr'), bar = $('.cx-bar i');
    const cmd = $('.cx-cmd'), cv = $('.cx-cv'), tcaret = $('.cx-tcaret');
    const rnd = $('.cx-rnd'), rc = $('.cx-rc'), rbar = $('.cx-rbar i'), enc = $('.cx-enc'), out = $('.cx-out');
    // the preview layers are display: none in the CSS, so showing one sets block; the terminal caret clears to its CSS
    const show = (n, on) => { const v = on ? (n.classList.contains('cx-ly') ? 'block' : '') : 'none'; if (n.style.display !== v) n.style.display = v; };
    let said = -1, lastF = -1, lastCmd = -1;

    // the preview's frame at t: black until the hook is written; each hot reload plays the new section's frames
    const frameAt = (t) => {
      if (t < T.hook) return -1;
      if (t < T.titles) return Math.min(59, Math.floor(60 * seg(t, T.hook, T.hook + HOT_HOOK)));
      if (t < T.turn) return 60 + Math.min(269, Math.floor(270 * seg(t, T.titles, T.titles + HOT_TITLES)));
      return Math.min(FRAMES - 1, 330 + Math.floor((t - T.turn) * TURN_FPS));
    };

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // the editor: a steady stream over WRITE, the caret riding the last character
        const c = Math.round(TOTAL * seg(t, T.w0, T.w1));
        const writing = t >= T.w0 && t < T.w1 + 0.1;
        rows.forEach((o, i) => {
          const k2 = Math.max(0, Math.min(LINES[i].length, c - STARTS[i]));
          if (k2 !== o.shown) { o.v.innerHTML = lineHTML(i, k2); o.shown = k2; }
          const visible = c > STARTS[i] || (i === 0 && t >= T.w0);
          if (visible !== o.vis) { o.n.style.visibility = visible ? '' : 'hidden'; o.vis = visible; }
          const on = writing && c >= STARTS[i] && (i === LINES.length - 1 || c < STARTS[i + 1]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        // the preview: the composition at frame f, exactly as the code above lays it out
        const f = frameAt(t);
        if (f !== lastF) {
          lastF = f;
          show(hook, f >= 0 && f < 60);
          if (f >= 0 && f < 60) h1.style.transform = `translate(-50%, -50%) scale(${spring(f).toFixed(4)})`;
          titles.forEach((n, i) => show(n, f >= 60 + i * 90 && f < 150 + i * 90));
          const ti = f >= 330 ? Math.floor(f / 4) % 24 : -1;
          turns.forEach((n, i) => show(n, i === ti));
          setText(fr, String(Math.max(0, f)));
          bar.style.transform = `scaleX(${(Math.max(0, f) / (FRAMES - 1)).toFixed(4)})`;
        }

        // the terminal: the command types, the frames count to 900, the encode, the file
        const nc = t < T.c0 ? -1 : Math.min(CMD.length, Math.floor(CMD.length * seg(t, T.c0, T.c0 + CMD_IN)));
        if (nc !== lastCmd) { cv.textContent = nc < 0 ? '' : CMD.slice(0, nc); lastCmd = nc; }
        cmd.style.visibility = nc < 0 ? 'hidden' : '';
        show(tcaret, nc >= 0 && t < T.rn0);
        const rp = seg(t, T.rn0, T.rn1);
        rnd.style.visibility = t >= T.rn0 ? '' : 'hidden';
        setText(rc, `${Math.round(FRAMES * rp)}/${FRAMES}`);
        rbar.style.transform = `scaleX(${rp.toFixed(4)})`;
        enc.style.visibility = t >= T.rn1 ? '' : 'hidden';
        out.style.visibility = d ? '' : 'hidden';

        // header: Writing, Rendering, then the check and Rendered
        setText(stateL, d ? 'Rendered' : t >= T.c0 ? 'Rendering' : 'Writing');
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + POP);
        stTk.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';
        card.classList.toggle('cx-done', d);
      },
    };
  },
};
