// Parallel beat: superbot scores Turbo Kart Rally with two models at once. The line streams, then two lanes rise side
// by side, each signed with its model: Lyria 2 composes the music (the Palm Cove Circuit main loop, 148 BPM in D major,
// a 1:12 loop, its waveform drawing in left to right, then the final-lap stinger 8 BPM faster) while ElevenLabs makes
// the eight sound effects the game plays (engine idle, engine rev, drift sparks, mini-turbo boost, item box roll, red
// shell whoosh, lightning zap, countdown beeps), each row landing and drawing its own short waveform, shaped like the
// sound it is. Each lane has its own progress bar and spinner and finishes on its own clock; a chip lands once both
// are done. The cue art is img/tkr-beats/music/cover.jpg, a square crop of the game's own title screen (real clip
// pixels, see img/tkr-beats/music/CREDITS.txt).
// The lanes are signed with the models chat.js routed (k.who, from together([...], parallel)): the first is the music
// lane, the second the SFX lane. Without k.who the lanes fall back to the Gemini and ElevenLabs marks from brand/.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Scoring it in parallel: Lyria 2 writes the music, ElevenLabs makes the SFX.';
// [title, meta, length, bpm]: the main loop, then the final-lap stinger at +8 BPM
const CUES = [
  ['Palm Cove Circuit', 'main loop · 148 BPM · D major', '1:12'],
  ['Final lap', 'stinger · 156 BPM · +8', '0:06'],
];
// [name, length, envelope]: every sound the race plays, in the order ElevenLabs renders them
const SFX = [
  ['engine idle', '2.0s', 'idle'],
  ['engine rev', '1.4s', 'rev'],
  ['drift sparks', '0.9s', 'sparks'],
  ['mini-turbo boost', '1.1s', 'boost'],
  ['item box roll', '1.6s', 'roll'],
  ['red shell whoosh', '0.8s', 'whoosh'],
  ['lightning zap', '1.2s', 'zap'],
  ['countdown beeps', '3.2s', 'beeps'],
];
const LANES = [
  { name: 'Lyria 2', logo: 'gemini-logo.svg', task: 'Music · 2 cues', a: 0.55, b: 3.0 },
  { name: 'ElevenLabs', logo: 'elevenlabs-logo.svg', task: 'SFX · 8 sounds', a: 0.7, b: 3.35 },
];
const MERGED = 'Score + SFX ready: 2 cues, 8 sounds';
const CUE_BARS = 34;
const SFX_BARS = 12;

// a cheap deterministic hash in 0..1 so every frame draws the same waveform
const hash = (i, seed) => { const v = Math.sin((i + 1) * 12.9898 + seed * 78.233) * 43758.5453; return v - Math.floor(v); };
// a music waveform: busy, with a loop-shaped swell
const cueBars = (seed) => Array.from({ length: CUE_BARS }, (_, i) => (0.25 + 0.75 * hash(i, seed)) * (0.6 + 0.4 * Math.sin((i / CUE_BARS) * Math.PI)));
// each sound's waveform follows what it is: a steady idle, a rising rev, a spike of a zap, four countdown pulses
const ENV = {
  idle: (x) => 0.45 + 0.1 * Math.sin(x * 25),
  rev: (x) => 0.2 + 0.8 * x,
  sparks: (x, h) => 0.25 + 0.75 * h,
  boost: (x) => (x < 0.15 ? x / 0.15 : 1 - 0.7 * (x - 0.15)),
  roll: (x) => (Math.floor(x * 12) % 2 ? 0.35 : 0.8),
  whoosh: (x) => Math.sin(x * Math.PI),
  zap: (x) => (x < 0.12 ? 1 : 0.9 * Math.exp(-(x - 0.12) * 5)),
  beeps: (x) => (x < 0.12 || (x > 0.25 && x < 0.37) || (x > 0.5 && x < 0.62) ? 0.6 : x > 0.75 ? 1 : 0.08),
};
const sfxBars = (env, seed) => Array.from({ length: SFX_BARS }, (_, i) => {
  const x = i / (SFX_BARS - 1), h = hash(i, seed);
  return Math.max(0.08, Math.min(1, ENV[env](x, h) * (0.85 + 0.15 * h)));
});
const bars = (hs) => hs.map((h) => `<i style="height:${(h * 100).toFixed(1)}%"></i>`).join('');

export default {
  times(r) {
    const T = { r };
    T.lanes = r + 0.35;
    T.run = LANES.map((l) => [r + l.a, r + l.b]);
    T.merge = Math.max(...T.run.map((x) => x[1])) + 0.2;
    T.end = T.merge + 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const who = k.who && k.who.length >= 2 ? k.who : null;
    const sign = (li) => (who ? x.tile(who[li]) : `<span class="qc-tile"><img src="${x.brand(LANES[li].logo)}" alt=""/></span>`);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const lanes = x.el(`<div class="pl-lanes">${LANES.map((l, li) => `<div class="pl-lane">
      <div class="pl-hd">${sign(li)}<b>${x.esc(l.name)}</b><span class="pl-st"><span class="spin"></span></span></div>
      <small class="pl-task">${x.esc(l.task)}</small>
      <div class="pl-bar"><i></i></div>
      ${li === 0
    ? `<div class="pl-cues">${CUES.map(([title, meta, len], ci) => `<div class="pl-cue${ci ? ' pl-stinger' : ''}">
        <div class="pl-cue-hd">${ci ? '<span class="pl-flag"></span>' : `<img class="pl-art" src="${x.img('tkr-beats/music/cover.jpg')}" alt=""/>`}
          <span class="pl-cue-t"><b>${x.esc(title)}</b><small>${x.esc(meta)}</small></span></div>
        <div class="pl-wrow"><div class="pl-wave">${bars(cueBars(ci + 3))}</div><span class="pl-len">${x.esc(len)}</span></div>
      </div>`).join('')}</div>`
    : `<div class="pl-sfx">${SFX.map(([name, len, env], si) => `<div class="pl-sx"><span class="pl-sx-n">${x.esc(name)}</span><span class="pl-sx-w">${bars(sfxBars(env, si + 1))}</span><span class="pl-sx-l">${x.esc(len)}</span></div>`).join('')}</div>`}
    </div>`).join('')}</div>`);
    const merged = x.el(`<div class="dd-chiprow pl-mergerow"><div class="ch-tool"><span class="spin done"></span><span class="ch-tool-t">${x.esc(MERGED)}</span></div></div>`);
    const laneEls = [...lanes.children].map((n) => ({ n, bar: n.querySelector('.pl-bar i'), spin: n.querySelector('.pl-st .spin') }));
    const cues = [...lanes.querySelectorAll('.pl-cue')].map((n) => ({ n, bars: [...n.querySelectorAll('.pl-wave i')], len: n.querySelector('.pl-len') }));
    const sfx = [...lanes.querySelectorAll('.pl-sx')].map((n) => ({ n, bars: [...n.querySelectorAll('.pl-sx-w i')], len: n.querySelector('.pl-sx-l') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // a waveform draws in left to right as p runs 0..1
    const draw = (bs, p) => bs.forEach((b, j) => {
      const on = seg(p * bs.length, j, j + 1.5);
      b.style.opacity = lerp(0.16, 1, on).toFixed(3);
      b.style.transform = `scaleY(${lerp(0.2, 1, outCubic(on)).toFixed(3)})`;
    });
    let shown = -1;

    return {
      nodes: [say, lanes, merged],
      marks: [[T.r, say], [T.lanes, lanes], [T.merge, merged]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(lanes, seg(t, T.lanes, T.lanes + 0.45), 14);

        // each lane runs on its own clock: bar fills, spinner turns, then resolves to a check
        laneEls.forEach((L, i) => {
          const [a, b] = T.run[i];
          L.bar.style.transform = `scaleX(${seg(t, a, b).toFixed(4)})`;
          const done = t >= b;
          L.spin.classList.toggle('done', done);
          L.spin.style.transform = done ? '' : `rotate(${(((t - a) * 430) % 360).toFixed(1)}deg)`;
          L.n.classList.toggle('pl-done', done);
        });

        // Lyria 2's lane: the main loop lands and draws its waveform across 60% of the run, then the stinger
        const [la, lb] = T.run[0];
        const cw = [[la, lerp(la, lb, 0.6)], [lerp(la, lb, 0.56), lb]];
        cues.forEach((C, i) => {
          const [a, b] = cw[i];
          rise(C.n, seg(t, a, a + 0.3), 6);
          const p = seg(t, a + 0.15, b);
          draw(C.bars, p);
          C.n.classList.toggle('pl-live', p > 0 && p < 1);
          C.len.style.opacity = outCubic(seg(t, b - 0.1, b + 0.2)).toFixed(3);
        });

        // ElevenLabs' lane: the eight sounds land one after another, each drawing its short waveform
        const [ea, eb] = T.run[1];
        sfx.forEach((S, i) => {
          const a = lerp(ea, eb - 0.35, i / (SFX.length - 1));
          rise(S.n, seg(t, a, a + 0.22), 4);
          const p = seg(t, a + 0.05, a + 0.35);
          draw(S.bars, p);
          S.n.classList.toggle('on', p >= 1);
          S.len.style.opacity = outCubic(seg(t, a + 0.25, a + 0.45)).toFixed(3);
        });

        rise(merged, seg(t, T.merge, T.merge + 0.3), 6);
      },
    };
  },
};
