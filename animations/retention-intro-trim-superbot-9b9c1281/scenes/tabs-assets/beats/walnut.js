// Every fact of the spot, in one place, so the three beats can never disagree: Maya Makes' upload "I Built a Walnut Desk
// With Only Hand Tools" (22:18, 186K views), the drop Gemini finds in its intro (0:06 to 0:31, the recap of last week's
// build), the hook that holds after it, the nine chapters Opus moves back 25 s, and the two retention curves (before the
// trim, and 48 hours after it). Times are in seconds.
export const CHANNEL = 'Maya Makes';
export const ME = 'M';
export const VIDEO = { title: 'I Built a Walnut Desk With Only Hand Tools', len: 22 * 60 + 18, views: '186K', thumb: 'walnut-thumb.jpg' };
export const CUT = { a: 6, b: 31 };
export const SHIFT = CUT.b - CUT.a; // 25 s
export const AFTER_LEN = VIDEO.len - SHIFT; // 21:53
export const RECAP = "Recap of last week's build";
export const HOOK = 'This board cost me $212 and I almost split it';

// m:ss
export const ts = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const sec = (m) => { const [a, b] = m.split(':').map(Number); return a * 60 + b; };

// the description's chapters: 0:00 Intro stays, the nine after it move back by the cut
export const INTRO = 'Intro';
export const CHAPTERS = [
  ['1:24', 'Reading the grain'], ['2:10', 'Flattening'], ['4:05', 'Jointing the edges'], ['6:42', 'Dovetails'],
  ['9:18', 'Glue-up'], ['11:36', 'Legs and stretchers'], ['14:20', 'Drawboring the joints'], ['17:02', 'Oil finish'],
  ['20:48', 'The finished desk'],
].map(([old, name]) => ({ old, now: ts(sec(old) - SHIFT), name }));

// audience retention, % of viewers still watching, over the first minute. Before: 100% to 58% by 0:30 through the
// recap, then the hook holds flat (58% at 0:41). After the trim, 48 hours later: 77% still watching at 0:30.
export const RET_BEFORE = [[0, 100], [3, 97], [6, 93], [9, 87.5], [12, 81.5], [15, 75.5], [18, 70.5], [21, 66.2], [24, 62.6],
  [27, 59.8], [30, 58], [33, 58.3], [36, 58.1], [41, 58], [45, 57.6], [50, 57.2], [55, 56.9], [60, 56.6]];
export const RET_AFTER = [[0, 100], [3, 97.2], [6, 94], [9, 90], [12, 86.6], [15, 83.8], [18, 81.6], [21, 79.8], [24, 78.6],
  [27, 77.7], [30, 77], [33, 76.6], [36, 76.3], [41, 75.9], [45, 75.6], [50, 75.3], [55, 75], [60, 74.7]];
export const AT30 = { before: 58, after: 77 };
// the value of a curve at second s (linear between its points)
export const at = (curve, s) => {
  for (let i = 1; i < curve.length; i++) {
    const [x0, y0] = curve[i - 1], [x1, y1] = curve[i];
    if (s <= x1) return y0 + ((y1 - y0) * (s - x0)) / (x1 - x0);
  }
  return curve[curve.length - 1][1];
};
