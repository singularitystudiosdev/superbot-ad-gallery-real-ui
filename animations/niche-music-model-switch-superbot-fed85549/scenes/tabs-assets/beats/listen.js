// Listen beat (the watch beat's card grammar, re-skinned): Gemini listens to the whole session. Its line streams, a card
// rises ("Listening to after hours v7", a running song position), and inside it the session's 24 tracks and the
// producer's reference (one row each: track number, name, a mini waveform) scroll fast from the top to the end while the
// position runs 0:00 to 3:12. Then the scroll glides back to the top, the tracks with a problem light red (Kick and 808
// at 50 Hz, Hats at 7 kHz), and the 4 problems land under the window one by one, the way Gemini reports them.
// The mini waveforms are UI (bars from a fixed seed per track type), not audio. Made up for the spot (brand/CREDITS.txt).
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. Row heights are
// constants (ROW), so the scroll is exact at every column width.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Listened to all 24 tracks and your reference: 3:12, 92 BPM, F minor. Found 4 problems.';
const LABEL = 'Listening to after hours v7';
const TOTAL = 3 * 60 + 12;  // the song, in seconds (3:12)
// the session's tracks as Gemini reads them: [number, name, waveform kind, problem tag or '']
const ROWS = [
  ['01', 'Kick', 'kick', '50 Hz'], ['02', '808', 'bass', '50 Hz'], ['03', 'Snare', 'snare', ''], ['04', 'Hats', 'hat', '7 kHz'],
  ['05', 'Clap', 'snare', ''], ['06', 'Open Hat', 'hat', ''], ['07', 'Perc', 'perc', ''], ['08', 'Rim', 'perc', ''],
  ['09', 'Shaker', 'hat', ''], ['10', 'Keys', 'pad', ''], ['11', 'Keys Layer', 'pad', ''], ['12', 'Pad', 'pad', ''],
  ['13', 'Bell', 'perc', ''], ['14', 'Pluck', 'perc', ''], ['15', 'Lead', 'vox', ''], ['16', 'Vox Chop', 'vox', '-4 dB'],
  ['17', 'Vox Chop Dbl', 'vox', ''], ['18', 'Vox FX', 'fx', ''], ['19', 'Riser', 'fx', ''], ['20', 'Impact', 'fx', ''],
  ['21', 'Reverse Cym', 'fx', ''], ['22', 'Texture', 'pad', ''], ['23', 'Vinyl', 'fx', ''], ['24', 'FX Bus', 'fx', ''],
  ['REF', 'reference.wav', 'mix', ''],
];
// what Gemini found: [value, problem]
const PROBLEMS = [
  ['50 Hz', 'Kick and 808 fight'],
  ['-4 dB', 'Vocal chop under the beat'],
  ['7 kHz', 'Hi-hats harsh'],
  ['+1.8 dB', 'Master clips'],
];
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const SCROLL_AT = 0.08;                // the card landing to the scroll starting
const SCROLL = 0.72; /* deliberate */  // the tracks scrolling past, start to end (the position runs with it)
const BACK = 0.34;                     // the scroll gliding back to the top
const LIGHT = 0.2;                     // the problem rows lighting up
const LINES_AT = 0.06;                 // the rows lit, then the first problem line
const STAGGER = 0.08;                  // one problem line to the next
const LINE_IN = 0.24;                  // a problem line rising in
const SHOWN = 4;                       // rows visible in the window
const ROW = 28;                        // one row's height, px

const tc = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// a mini waveform per track kind: bars from a fixed seed (UI)
function wave(kind, seed0) {
  let seed = seed0 * 7919 + 13;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const N = 64;
  let d = '';
  for (let i = 0; i < N; i++) {
    let h;
    const b = i % 8; // one beat = 8 bars of the meter
    if (kind === 'kick') h = b === 0 ? 0.95 : b === 1 ? 0.6 : b === 2 ? 0.3 : 0.06;
    else if (kind === 'bass') h = 0.55 + 0.35 * Math.max(0, Math.cos((i % 16) / 16 * Math.PI)) + 0.05 * rnd();
    else if (kind === 'snare') h = (i % 16) === 8 ? 0.85 : (i % 16) === 9 ? 0.45 : 0.05;
    else if (kind === 'hat') h = (i % 2 ? 0.15 : 0.4) + 0.15 * rnd();
    else if (kind === 'pad') h = 0.35 + 0.2 * Math.sin(i / 9 + seed0) + 0.08 * rnd();
    else if (kind === 'vox') h = ((i >> 3) % 2 ? 0.08 : 0.4 + 0.45 * rnd());
    else if (kind === 'perc') h = rnd() > 0.72 ? 0.35 + 0.4 * rnd() : 0.05;
    else if (kind === 'mix') h = 0.5 + 0.35 * rnd();
    else h = 0.08 + 0.5 * Math.max(0, Math.sin(i / 20 + seed0)) * rnd();
    h = Math.max(0.05, Math.min(1, h)) * 7;
    d += `M${i * 2 + 1} ${(8 - h).toFixed(2)}V${(8 + h).toFixed(2)}`;
  }
  return `<svg class="ls-wv" viewBox="0 0 ${N * 2} 16" preserveAspectRatio="none" aria-hidden="true"><path d="${d}"/></svg>`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.s0 = T.card + SCROLL_AT;
    T.s1 = T.s0 + SCROLL;
    T.b1 = T.s1 + BACK;                                  // back at the top
    T.line = PROBLEMS.map((_, i) => T.b1 + LINES_AT + i * STAGGER);
    // the beat's last visible change: the last problem line settled, or the line's last character
    T.end = Math.max(T.line[T.line.length - 1] + LINE_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ls-card">
      <div class="ls-hd"><span class="ls-st"><i class="ls-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b>
        <span class="ls-cnt"><b class="ls-n">0:00</b><i>/</i>3:12</span></div>
      <div class="ls-bar"><i class="ls-fill"></i></div>
      <div class="ls-vp">
        <div class="ls-list">${ROWS.map(([n, name, kind, tag], i) => `<div class="ls-row${tag ? ' ls-bad' : ''}${n === 'REF' ? ' ls-ref' : ''}"><span class="ls-no">${n}</span><span class="ls-nm">${x.esc(name)}</span>${wave(kind, i + 1)}<span class="ls-tag">${x.esc(tag)}</span></div>`).join('')}</div>
      </div>
      <div class="ls-probs">${PROBLEMS.map(([v, p]) => `<div class="ls-pr"><i></i><b>${x.esc(v)}</b><span>${x.esc(p)}</span></div>`).join('')}</div>
    </div>`);
    const list = card.querySelector('.ls-list'), n = card.querySelector('.ls-n'), fill = card.querySelector('.ls-fill');
    const rows = [...card.querySelectorAll('.ls-row')];
    const lines = [...card.querySelectorAll('.ls-pr')];
    const spin = card.querySelector('.ls-spin'), ok = card.querySelector('.ls-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const span = (ROWS.length - SHOWN) * ROW;            // the scroll to the end of the session
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the scroll: start to end, fast through the middle (a touch of blur at speed), the position running with it;
        // then it glides back up to the top
        const p = seg(t, T.s0, T.s1), e = inOutCubic(p);
        const back = inOutCubic(seg(t, T.s1, T.b1));
        list.style.transform = `translateY(${(-lerp(span * e, 0, back)).toFixed(2)}px)`;
        const speed = p > 0 && p < 1 ? (p < 0.5 ? 12 * p * p : 12 * (1 - p) * (1 - p)) : 0; // d(inOutCubic)/dp
        list.style.filter = speed > 0.4 ? `blur(${Math.min(1.4, speed * 0.45).toFixed(2)}px)` : 'none';
        const c = tc(Math.round(TOTAL * outCubic(p)));
        if (c !== count) { n.textContent = c; count = c; }
        fill.style.transform = `scaleX(${outCubic(p).toFixed(4)})`;

        // done listening: the spinner resolves to the check as the position lands
        const d = outCubic(seg(t, T.s1, T.s1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.s1 - 0.08, T.s1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the problem rows light red as the scroll settles; the others dim
        const l = outCubic(seg(t, T.b1 - LIGHT * 0.5, T.b1 + LIGHT * 0.5));
        rows.forEach((row) => {
          if (row.classList.contains('ls-bad')) row.style.setProperty('--lit', l.toFixed(3));
          else row.style.opacity = (1 - 0.4 * l).toFixed(3);
        });

        lines.forEach((ln, i) => {
          const q = outCubic(seg(t, T.line[i], T.line[i] + LINE_IN));
          ln.style.opacity = q.toFixed(3);
          ln.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
        });
      },
    };
  },
};
