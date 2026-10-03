// The one source for every on-screen string and number of the ytv7 spot that more than one beat shows: the creator, the
// last video and its audience retention (illustrative creator data, made up for the spot), the drop-off and the spike,
// the key moments, the old intro, superbot's rewritten intro and the two moves. retention.js (the Studio Analytics
// page), frame.js (the 4:38 frame) and rewrite.js (the board, its retention strip and the close-up) all read from here,
// so a string is never typed twice. No em or en dashes anywhere: commas, periods and parentheses only.

export const ACCOUNT = 'Sam Rivera';
// the last video (the base's video, thumbnail img/mic-frame.jpg) and the next one
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32', secs: 14 * 60 + 32 };
export const NEXT = 'I tested 10 budget headsets under $100';

// ---------- audience retention of the last video ----------
// [seconds, % of viewers still watching]: 100% at 0:00, a steep fall from 0:04 to 0:21 (~58%), 54% at 0:30, then a
// slow decline to ~31% at 14:32, with a spike at 4:38 (the boom arm shot) and a smaller one at 6:12. Interpolated by a
// monotone cubic (Fritsch-Carlson), so the path is smooth and never overshoots between the points.
const CURVE_PTS = [
  [0, 100], [2, 99.3], [4, 97.6], [8, 88.5], [12, 77.5], [16, 67.5], [21, 58.4], [25, 55.6], [30, 54], [45, 52.9], [60, 52.1],
  [120, 48.8], [180, 46.2], [240, 44.2], [262, 43.5], [278, 50.5], [294, 43], [330, 42.1], [358, 41.3], [372, 44.6], [386, 40.8],
  [480, 38.7], [600, 36.1], [720, 33.7], [810, 32.2], [872, 31],
];
// YouTube Studio's "Typical retention" band behind the curve: its upper and lower edge
const TYPICAL_HI = [[0, 100], [15, 90], [30, 82], [120, 68], [300, 58], [600, 50], [872, 45]];
const TYPICAL_LO = [[0, 100], [15, 82], [30, 72], [120, 57], [300, 47], [600, 40], [872, 35]];

export const DROP = { from: 4, to: 21, tag: 'Drop-off 0:21' };
export const SPIKE = { at: 278, tag: 'Most re-watched 4:38', time: '4:38' };
export const TYPICAL = 'Typical retention';
export const RETENTION_TITLE = 'Audience retention';
// the key moments, Studio's grammar, plain text: [label, detail]
export const KEY_MOMENTS = [
  ['Intro', '54% still watching at 0:30'],
  ['Dip', '0:04 to 0:21, sponsor read'],
  ['Spike', '4:38, the boom arm shot'],
];

// ---------- the intro, before and after ----------
export const OLD_LABEL = 'Last video, 0:00 to 0:30';
export const NEW_LABEL = 'Next video, 0:00 to 0:30';
// [timecode, line, viewers left here]
export const OLD = [
  ['0:00', 'Hey everyone, welcome back to the channel.', false],
  ['0:04', 'Quick word from today\'s sponsor first.', true],
  ['0:21', 'Before we start, hit subscribe if you\'re new.', true],
  ['0:27', 'Okay, twelve mics. Let\'s get into it.', false],
];
export const LEFT_HERE = 'Viewers left here';
export const NEW = [
  ['0:00', 'Cold open: two headsets, one at $24, one at $89. Listen to both.'],
  ['0:06', 'Most people pick the $24 one. I did too.'],
  ['0:12', 'I tested 10 headsets under $100 on a real stream.'],
  ['0:19', 'Every clip is raw, so you can judge for yourself.'],
  ['0:25', 'Here\'s the one I\'d buy, and the one to skip.'],
];
export const MOVES = ['Sponsor read moved to 4:30', 'Subscribe ask moved to the end'];

// m:ss for a time in seconds
export const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;

// monotone cubic interpolation through pts (Fritsch-Carlson): returns f(x)
function monotone(pts) {
  const n = pts.length, xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const s = 3 / Math.sqrt(h); m[i] = s * a * d[i]; m[i + 1] = s * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
export const retention = monotone(CURVE_PTS);
export const typicalHi = monotone(TYPICAL_HI);
export const typicalLo = monotone(TYPICAL_LO);

// an SVG path through f over [s0, s1], in a w x h box whose y runs from yMax (top) to yMin (bottom); n samples make it
// smooth at any size (no visible facets)
export function linePath(f, s0, s1, w, h, yMin, yMax, n = 480) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const s = s0 + ((s1 - s0) * i) / n;
    const x = (w * (s - s0)) / (s1 - s0), y = (h * (yMax - f(s))) / (yMax - yMin);
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}
// the closed area between f and the box's bottom, over [a, b] (a sub-range of [s0, s1])
export function areaPath(f, s0, s1, a, b, w, h, yMin, yMax, n = 120) {
  const X = (s) => (w * (s - s0)) / (s1 - s0), Y = (v) => (h * (yMax - v)) / (yMax - yMin);
  let d = `M${X(a).toFixed(2)} ${h}`;
  for (let i = 0; i <= n; i++) { const s = a + ((b - a) * i) / n; d += `L${X(s).toFixed(2)} ${Y(f(s)).toFixed(2)}`; }
  return `${d}L${X(b).toFixed(2)} ${h}Z`;
}
// the band between hi and lo over [s0, s1]
export function bandPath(hi, lo, s0, s1, w, h, yMin, yMax, n = 240) {
  const X = (s) => (w * (s - s0)) / (s1 - s0), Y = (v) => (h * (yMax - v)) / (yMax - yMin);
  let d = '';
  for (let i = 0; i <= n; i++) { const s = s0 + ((s1 - s0) * i) / n; d += `${i ? 'L' : 'M'}${X(s).toFixed(2)} ${Y(hi(s)).toFixed(2)}`; }
  for (let i = n; i >= 0; i--) { const s = s0 + ((s1 - s0) * i) / n; d += `L${X(s).toFixed(2)} ${Y(lo(s)).toFixed(2)}`; }
  return `${d}Z`;
}
