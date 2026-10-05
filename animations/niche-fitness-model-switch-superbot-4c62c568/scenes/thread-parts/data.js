// The story's copy, in one place so every surface agrees: the superbot thread, Garmin's consent popup and the
// Garmin Connect calendar all read the same runner, numbers and workouts. The runner is fictional.
// Dates are real 2026 calendar dates: Mon Oct 5 is today, the plan starts Tue Oct 6 and the race is Sun Dec 27,
// twelve weeks later (Oct 1 2026 is a Thursday, so October's grid opens on Mon Sep 28).

export const ASK = 'Build a 12-week half marathon plan and put it on my Garmin';

export const RUNNER = { name: 'Jordan Lee' };

// what Garmin hands over: the last 12 weeks of runs (Jul 13 to Oct 4)
export const HISTORY = { runs: 41, from: 'Jul 13', to: 'Oct 4' };

// Gemini 3.8 Flash's read of those 41 runs
export const BASELINE = [
  { v: '18', u: 'mi', k: 'a week' },
  { v: '8', u: 'mi', k: 'longest run' },
  { v: '10:05', u: '/mi', k: 'easy pace' },
  { v: '52:30', u: '', k: '10K, Sep 20' },
];

// GPT-6 Astra's plan: the goal from the 10K (Riegel: 52:30 x (21.0975/10)^1.06 = 1:55:50, rounded to 1:55:00),
// a 12-week ramp with cutback weeks 4 and 8 and a two-week taper (sums to 270 mi), and the paces it trains at
export const GOAL = { time: '1:55:00', pace: '8:46', race: 'Sun, Dec 27' };
export const WEEKS = [19, 20, 22, 18, 22, 24, 26, 21, 27, 28, 22, 21];
export const EASY_WEEKS = [3, 7, 10, 11]; // cutbacks and taper (0-based), drawn lighter
export const PACES = [['Easy', '10:05'], ['Long', '10:15'], ['Tempo', '8:35'], ['Race', '8:46']];

// Claude Opus 5.5's first week (19 mi): the four workouts it writes as Garmin structured workouts
export const WEEK1 = [
  { day: 'Tue, Oct 6', name: 'Easy Run', steps: '4 mi at 10:05/mi' },
  { day: 'Thu, Oct 8', name: 'Tempo Run', steps: '1 mi warm up, 2 mi at 8:35/mi, 1 mi cool down' },
  { day: 'Sat, Oct 10', name: 'Easy Run', steps: '5 mi at 10:05/mi' },
  { day: 'Sun, Oct 11', name: 'Long Run', steps: '6 mi at 10:15/mi' },
];
export const WORKOUTS = 48; // 4 a week x 12 weeks

// October 2026 in Garmin Connect's Monday-first month grid: 5 weeks, Sep 28 to Nov 1. Runs on Tue/Thu/Sat/Sun
// from Tue Oct 6 (cells 8, 10, 12, 13 ...), the last one Sun Nov 1 (the grid's final cell, next month).
export const MONTH = { title: 'October 2026', first: 28, lead: 3, days: 31, today: 5, select: 6 };
export const RUN_DAYS = [2, 4, 6, 0]; // Tue, Thu, Sat, Sun (Date.getDay)
export const DAY_CARD = { head: 'Tuesday, October 6', name: 'Easy Run', meta: '4.00 mi', time: '40:20' };

// the composer chip and the switch pills: superbot's own tiles (superbot-desktop packages/ui/src/marks/tiles, the
// Gemini models alias google.png, GPT models openai.webp) and Garmin's own site icon for the service
export const MODELS = {
  superbot: { label: 'superbot', tile: null },
  garmin: { label: 'Garmin', tile: 'brand/tile-garmin.png' },
  gemini: { label: 'Gemini 3.8 Flash', tile: 'brand/tile-gemini.png' },
  openai: { label: 'GPT-6 Astra', tile: 'brand/tile-openai.webp' },
  claude: { label: 'Claude Opus 5.5', tile: 'brand/tile-claude.png' },
};
