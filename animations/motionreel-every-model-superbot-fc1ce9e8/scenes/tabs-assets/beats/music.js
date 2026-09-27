// Music beat: Lyria 2 scores the reel before anything is drawn. Its line streams, the "Composing 8 bars" chip lands
// and spins, and the score card rises in the reel's own chrome (ink ground, corner brackets, mono micro labels): the
// 128 BPM · 4/4 · 8 bars grid of the post's clip, four stems, the seven chapter cues on their bar lines. Then one
// playhead writes the score left to right, 15 seconds of music in 1.5 seconds, at a constant rate: Lyria's switch is
// the reel's "01 linear", the one honest linear thing in a motion reel is a tempo clock. Every cut it crosses fires a
// red transient on its bar line, every cue it reaches drops its flag, and the chrome follows the head exactly like the
// clip's own: timecode at 60 FPS, the chapter label decoding through scrambled glyphs, four beat squares and BAR n/8.
// The chip resolves to "Composed 8 bars" and the length stamps 0:15.00.
// The grid is the clip's (CREDITS.txt BAR GRID / CHAPTER MAP). The waveforms are Lyria's track, synthesized here from
// a fixed arrangement so every frame draws the same score; they are not the clip's audio.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Scoring the reel first at 128 BPM, so every chapter lands on a bar line.';
const BPM = 128;
const BEAT = 60 / BPM;          // 0.46875 s
const BAR = BEAT * 4;           // 1.875 s
const BARS = 8;
const LEN = BAR * BARS;         // 15.000 s, the clip's length
const FPS = 60;
const SWEEP = 1.5;              // seconds the playhead takes to write all 8 bars (linear)
const DECODE = 0.1;             // seconds a chapter label scrambles before it reads
const N = 480;                  // waveform columns per stem (60 per bar, 15 per beat)

// the seven cues, on the bar each chapter opens (bar index from 0): 01 spans bars 1-2, the rest one bar each
const CUES = [['01', 'IDENTITY', 0], ['02', 'EASING', 2], ['03', 'MORPHING', 3], ['04', 'SYSTEMS', 4],
  ['05', 'DEPTH', 5], ['06', 'KINETIC TYPE', 6], ['07', 'FIN', 7]];
// the reel's top right label, on the frame it starts decoding (CREDITS.txt CHAPTER MAP): 02 · EASING comes in one beat
// early, a pickup on beat 4 of bar 2 (frame 197)
const LABELS = [[0, '01 · IDENTITY'], [197, '02 · EASING'], [338, '03 · MORPHING'], [450, '04 · SYSTEMS'],
  [563, '05 · DEPTH'], [675, '06 · KINETIC TYPE'], [788, '07 · FIN']].map(([f, s]) => [f / FPS, s]);
const PICKUP = BAR + 3 * BEAT;  // beat 4 of bar 2, 3.28125 s

// ---------- the arrangement (fixed, so the synthesized waveform is the same on every frame) ----------
const hash = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
const decay = (s, s0, d) => (s < s0 ? 0 : Math.exp(-(s - s0) / d));
const beats = Array.from({ length: BARS * 4 }, (_, b) => b * BEAT);
// kick: soft half time under the intro, four on the floor from the bar 2 flood, eighth notes under bar 7 (one kinetic
// word per eighth note), one ringing hit on the FIN downbeat. Hits on bar lines 2..8 are the cuts, drawn red.
const KICKS = [];
beats.forEach((s0, b) => {
  const bar = Math.floor(b / 4), beat = b % 4;
  if (bar === 0) { if (beat % 2 === 0) KICKS.push([s0, 0.42, 0.08, false]); return; }
  if (bar === 7) { if (beat === 0) KICKS.push([s0, 1, 0.5, true]); return; }
  KICKS.push([s0, beat === 0 ? 1 : 0.78, 0.07, beat === 0]);
  if (bar === 6) KICKS.push([s0 + BEAT / 2, 0.66, 0.06, false]);
});
// hats: offbeat eighths in bar 2, sixteenths through the middle chapters, driving sixteenths under the kinetic type
const HATS = [];
for (let bar = 1; bar < 7; bar++) {
  for (let x = 0; x < 16; x++) {
    const s0 = bar * BAR + x * (BEAT / 4);
    if (bar === 1) { if (x % 4 === 2) HATS.push([s0, 0.34]); continue; }
    if (bar === 6) { HATS.push([s0, x % 2 ? 0.3 : 0.4]); continue; }
    HATS.push([s0, x % 4 === 2 ? 0.44 : 0.22]);
  }
}
// risers: a swell into the bar 2 flood, one into the 02 pickup, a beat of air before each hard cut, the long build
// across the kinetic type into FIN, and a noise tail off the FIN hit
const RISERS = [[BAR * 0.5, BAR, 0.5], [BAR * 1.5, 2 * BAR, 0.72], [3 * BAR - BEAT, 3 * BAR, 0.42],
  [4 * BAR - BEAT, 4 * BAR, 0.46], [5 * BAR - BEAT, 5 * BAR, 0.46], [6 * BAR - BEAT, 6 * BAR, 0.5], [6 * BAR, 7 * BAR, 1]];

const kickAt = (s) => {
  let k = 0, x = 0;
  KICKS.forEach(([s0, a, d, cut]) => { const v = a * decay(s, s0, d); if (cut) x = Math.max(x, v); else k = Math.max(k, v); });
  return [k, x];
};
const lastKick = (s) => KICKS.reduce((m, [s0]) => (s0 <= s ? s0 : m), -1);
const subAt = (s) => {
  if (s < BAR) return 0;
  if (s >= 7 * BAR) return 0.66 * decay(s, 7 * BAR, 0.9);
  const lk = lastKick(s);
  const pump = 1 - 0.72 * decay(s, lk, 0.12);
  return 0.62 * pump * (0.9 + 0.1 * Math.sin(2 * Math.PI * s * 1.5)) * Math.min(1, (s - BAR) / 0.05);
};
const hatAt = (s) => HATS.reduce((m, [s0, a]) => Math.max(m, a * decay(s, s0, 0.028)), 0);
const riserAt = (s) => {
  let v = 0;
  RISERS.forEach(([a, b, amp]) => { if (s >= a && s < b) v = Math.max(v, amp * Math.pow((s - a) / (b - a), 2.2)); });
  return Math.max(v, 0.5 * decay(s, 7 * BAR, 0.3));
};
// peak of each column over 4 sub-samples, so a transient between samples still draws
const DS = LEN / N;
const peak = (fn, i) => { let m = 0; for (let j = 0; j < 4; j++) m = Math.max(m, fn(i * DS + (j * DS) / 4)); return m; };
// mirrored columns as one filled path in a 480 x 20 box (drawn with preserveAspectRatio none)
const col = (i, a) => { const h = Math.min(9.4, a * 9.4); return `M${i + 0.14} ${(10 - h).toFixed(2)}h0.72v${(2 * h).toFixed(2)}h-0.72z`; };
function wave(stem) {
  const out = { a: '', b: '' };
  for (let i = 0; i < N; i++) {
    const tex = 0.72 + 0.28 * hash(i + 1, stem.seed);
    if (stem.id === 'kick') {
      const [k, x] = [peak((s) => kickAt(s)[0], i), peak((s) => kickAt(s)[1], i)];
      if (x >= k && x > 0.03) out.b += col(i, x * (0.9 + 0.1 * tex));
      else if (k > 0.03) out.a += col(i, k * (0.9 + 0.1 * tex));
    } else {
      const v = peak(stem.fn, i) * tex;
      if (v > 0.03) out.a += col(i, v);
    }
  }
  return out;
}
const STEMS = [
  { id: 'kick', name: 'KICK', seed: 1 },
  { id: 'sub', name: 'SUB', seed: 2, fn: subAt },
  { id: 'hats', name: 'HATS', seed: 3, fn: hatAt },
  { id: 'riser', name: 'RISER', seed: 4, fn: riserAt },
].map((st) => ({ ...st, d: wave(st) }));

// ---------- chrome readouts, all from the score position s (seconds into the 15 s score) ----------
const pad = (n, w = 2) => String(n).padStart(w, '0');
const timecode = (s) => { const f = Math.floor(s * FPS + 1e-6); return `00:00:${pad(Math.floor(f / FPS))}:${pad(f % FPS)}`; };
const length = (s) => { const c = Math.floor(s * 100 + 1e-6); return `${Math.floor(c / 6000)}:${pad(Math.floor(c / 100) % 60)}.${pad(c % 100)}`; };
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#*+/';
const scramble = (text, p, t) => [...text].map((ch, i) => {
  if (ch === ' ' || ch === '·' || i < Math.floor(p * text.length)) return ch;
  return GLYPHS[Math.floor(hash(i + 7, Math.floor(t * FPS)) * GLYPHS.length)];
}).join('');
const pct = (s) => `${((s / LEN) * 100).toFixed(4)}%`;

const NOTE = '<svg class="mus-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.grid = r + 0.5;            // the bar lines drop in, left to right
    T.play = r + 0.72;           // the playhead starts writing bar 1
    T.done = T.play + SWEEP;     // it reaches 15.000: the chip resolves, the length stamps
    T.end = T.done + 0.56;       // the stamp settles at T.done + 0.25: 0.31 s of dwell, then the next switch
    T.bar = (i) => T.play + (i / BARS) * SWEEP;   // when the head crosses bar line i (0..8)
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Composing 8 bars</span></div></div>');
    const bl = (i) => `left:${pct(i * BAR)}`;
    const card = x.el(`<div class="mus-card">
      <i class="mus-cb mus-tl"></i><i class="mus-cb mus-tr"></i><i class="mus-cb mus-bl"></i><i class="mus-cb mus-br"></i>
      <div class="mus-hd"><i class="mus-ic">${NOTE}</i><b>SCORE</b><span>MOTION REEL · 2026</span><em class="mus-ch">01 · IDENTITY</em></div>
      <div class="mus-meta">128 BPM · 4/4 · 8 bars · <b class="mus-len">0:00.00</b></div>
      <div class="mus-grid">
        <span class="mus-lab">BAR</span>
        <span class="mus-lane mus-ruler">${Array.from({ length: BARS }, (_, i) => `<b class="mus-n" style="${bl(i)}">${i + 1}</b>`).join('')}${
          Array.from({ length: BARS * 4 }, (_, b) => (b % 4 ? `<i class="mus-tick" style="left:${pct(b * BEAT)}"></i>` : '')).join('')}</span>
        <span class="mus-lab">CUE</span>
        <span class="mus-lane mus-cues"><i class="mus-pick" style="left:${pct(PICKUP)};width:${pct(2 * BAR - PICKUP)}"></i>${
          CUES.map(([n, name, bar]) => `<span class="mus-cue" style="${bl(bar)}"><b>${n}</b><span>${x.esc(name)}</span></span>`).join('')}</span>
        ${STEMS.map((st) => `<span class="mus-lab">${st.name}</span>
        <span class="mus-lane mus-stem mus-${st.id}"><i class="mus-base"></i><svg class="mus-wv" viewBox="0 0 ${N} 20" preserveAspectRatio="none"><path class="mus-a" d="${st.d.a}"/>${st.d.b ? `<path class="mus-b" d="${st.d.b}"/>` : ''}</svg></span>`).join('')}
        <span class="mus-ov">${Array.from({ length: BARS + 1 }, (_, i) => `<i class="mus-bar" style="${bl(i)}"></i>`).join('')}${
          Array.from({ length: BARS - 1 }, (_, i) => `<i class="mus-hit" style="${bl(i + 1)}"></i>`).join('')}<i class="mus-head"><i></i></i></span>
      </div>
      <div class="mus-ft"><b class="mus-tc">00:00:00:00</b><span>60 FPS</span><span class="mus-bpm">128 BPM</span><span class="mus-sq"><i></i><i></i><i></i><i></i></span><b class="mus-bn">BAR 1/8</b></div>
      <i class="mus-prog"></i>
    </div>`);
    const q = (s) => card.querySelector(s), qa = (s) => [...card.querySelectorAll(s)];
    const el = {
      ch: q('.mus-ch'), len: q('.mus-len'), tc: q('.mus-tc'), bn: q('.mus-bn'), sq: qa('.mus-sq i'),
      nums: qa('.mus-n'), ticks: qa('.mus-tick'), bars: qa('.mus-bar'), hits: qa('.mus-hit'), cues: qa('.mus-cue'),
      pick: q('.mus-pick'), wv: qa('.mus-wv'), head: q('.mus-head'), prog: q('.mus-prog'),
    };
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const put = (n, v) => { if (n.textContent !== v) n.textContent = v; };
    let shown = -1;
    // The score is 600px wide where the message row has the room (16x9) and exactly the row's width where it does
    // not (9x16, 4x5 and 1x1: 512). The reply's .m-main is capped at --hub-reply (471) and CSS inside it cannot see
    // the row, so measure the row from the card's host, as code.js does: the width depends on the page's layout (its
    // aspect ratio), never on t, and is written only when it changes. music.css's width 100% capped at 600px is the
    // fallback until the card is mounted. Below 600 the bars are too narrow for the cue flags at full size (06 KINETIC
    // TYPE would run past the 07 bar line), so a fitted card also takes .mus-tight, which sets the cue type smaller.
    let fitW = -1;
    const fit = () => {
      const host = card.parentElement, row = host && host.parentElement;
      if (!row || !row.offsetWidth) return;
      const rr = row.getBoundingClientRect(), hr = host.getBoundingClientRect();
      const w = Math.floor(Math.min(600, (rr.right - hr.left) / (rr.width / row.offsetWidth)));
      if (w > 0 && w !== fitW) { fitW = w; card.style.width = `${w}px`; card.classList.toggle('mus-tight', w < 600); }
    };

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        fit();
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the composing chip: lands, spins, then resolves once the head has written bar 8
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        put(lab, done ? 'Composed 8 bars' : 'Composing 8 bars');

        // the card rises as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the grid drops in bar by bar: bar lines grow down, the numbers and beat ticks follow
        el.bars.forEach((b, i) => {
          const p = outCubic(seg(t, T.grid + i * 0.022, T.grid + i * 0.022 + 0.2));
          b.style.transform = `scaleY(${p.toFixed(3)})`;
          b.style.opacity = p.toFixed(3);
        });
        el.nums.forEach((b, i) => { b.style.opacity = seg(t, T.grid + i * 0.022 + 0.05, T.grid + i * 0.022 + 0.2).toFixed(3); });
        const tk = seg(t, T.grid + 0.1, T.grid + 0.3);
        el.ticks.forEach((b) => { b.style.opacity = tk.toFixed(3); });

        // the playhead: LINEAR through the score, 15 s in SWEEP s. s is the score position everything reads from.
        const s = LEN * seg(t, T.play, T.done);
        const clip = `inset(0 ${(100 - (s / LEN) * 100).toFixed(3)}% 0 0)`;
        el.wv.forEach((w) => { w.style.clipPath = clip; });
        el.head.style.left = pct(s);
        el.head.style.opacity = seg(t, T.play - 0.14, T.play).toFixed(3);
        el.prog.style.transform = `scaleX(${(s / LEN).toFixed(4)})`;

        // a red transient on every cut the head crosses (bar lines 2..8), flaring then settling to a red rule
        el.hits.forEach((h, i) => {
          const tc = T.bar(i + 1);
          if (t < tc) { h.style.opacity = '0'; h.style.transform = 'scaleX(1)'; return; }
          const f = Math.exp(-(t - tc) / 0.11);
          h.style.opacity = (0.42 + 0.58 * f).toFixed(3);
          h.style.transform = `scaleX(${(1 + 2.4 * f).toFixed(3)})`;
        });
        el.nums.forEach((b, i) => b.classList.toggle('mus-lit', i > 0 && t >= T.bar(i)));

        // each cue flag drops as the head reaches its bar; the 02 pickup rule draws in from beat 4 of bar 2
        el.cues.forEach((c, j) => {
          const tc = T.bar(CUES[j][2]);
          const p = seg(t, tc - 0.02, tc + 0.2);
          c.style.opacity = outCubic(p).toFixed(3);
          c.style.transform = p >= 1 ? 'none' : `translateY(${((1 - outBack(p)) * -6).toFixed(2)}px)`;
        });
        const pk = seg(s, PICKUP, 2 * BAR);
        el.pick.style.transform = `scaleX(${pk.toFixed(3)})`;
        el.pick.style.opacity = pk > 0 ? '1' : '0';

        // chrome, read off the head: timecode, the chapter label decoding in, four beat squares, BAR n/8
        put(el.tc, timecode(s));
        const sb = Math.min(s, LEN - 1e-4);
        const bar = Math.floor(sb / BAR), beat = Math.floor((sb - bar * BAR) / BEAT);
        put(el.bn, `BAR ${bar + 1}/${BARS}`);
        el.sq.forEach((b, i) => b.classList.toggle('on', i === beat));
        let c = 0;
        LABELS.forEach(([ls], i) => { if (i > 0 && s >= ls) c = i; });
        const lt = c === 0 ? T.card + 0.12 : T.play + (LABELS[c][0] / LEN) * SWEEP;
        put(el.ch, scramble(LABELS[c][1], seg(t, lt, lt + DECODE), t));

        // the length counts up with the head and stamps once the score is whole
        put(el.len, length(s));
        el.len.classList.toggle('mus-stamp', done);
        const st = seg(t, T.done, T.done + 0.25);
        el.len.style.transform = st > 0 && st < 1 ? `scale(${(1 + 0.16 * Math.sin(Math.PI * st)).toFixed(4)})` : 'none';
      },
    };
  },
};
