// The one source of truth every beat reads: Sam's Strava baseline (what Gemini finds in the runs), the numbers GPT-6
// Astra derives from it, and the 12-week plan Claude Opus 5.5 writes and superbot puts on Google Calendar.
// Today is Monday, Oct 5 2026. Runs fall Tue/Thu/Sat/Sun from Tue Oct 6; race day is Sunday, Dec 27 2026 (week 12).
// Miles, US pacing. The ramp keeps a cutback every 4th week and a 2-week taper; weekly totals are summed, never typed.

// ---- Strava: the last 12 weeks (Jul 13 to Oct 4), as Gemini reads them ----
export const STRAVA = {
  runs: 41, miles: 268, from: 'Jul 13', to: 'Oct 4',
  avgWeek: 22, peakWeek: 27, longest: 9.3, longestOn: 'Sep 27',
  easyPace: '10:05', easyHr: 142, best10k: '52:40', best10kOn: 'Sep 19', driftMile: 7,
};

// a few of the 41 activities, newest first, as Strava names them (its default titles, plus the ones Sam renamed)
export const ACTIVITIES = [
  ['Morning Run', 'Sun, Oct 4', 8.1, '10:11', 144],
  ['Evening Run', 'Thu, Oct 1', 5.2, '9:58', 147],
  ['Lunch Run', 'Tue, Sep 29', 4.0, '10:04', 141],
  ['Long one by the river', 'Sun, Sep 27', 9.3, '10:16', 149],
  ['Morning Run', 'Sat, Sep 26', 3.1, '10:02', 139],
  ['Evening Run', 'Thu, Sep 24', 5.0, '9:49', 150],
  ['10K time trial', 'Sat, Sep 19', 6.2, '8:29', 171],
  ['Morning Run', 'Thu, Sep 17', 4.6, '10:07', 142],
  ['Afternoon Run', 'Tue, Sep 15', 4.1, '10:09', 140],
  ['Morning Run', 'Sun, Sep 13', 8.4, '10:18', 146],
  ['Evening Run', 'Thu, Sep 10', 5.0, '9:55', 145],
  ['Lunch Run', 'Tue, Sep 8', 3.6, '10:03', 140],
];

// ---- GPT-6 Astra: the math ----
export const GOAL = '1:52:00';
// Riegel (1981): T2 = T1 x (D2/D1)^1.06. 52:40 for 10 km -> 21.0975 km: 3160 s x 2.1098^1.06 = 6973 s = 1:56:13
export const TODAY = '1:56:13';
export const PACES = [
  ['Easy', '10:05'],
  ['Long run', '10:15'],
  ['Race pace', '8:33'],   // 1:52:00 over 13.1 mi
  ['Tempo', '8:18'],
  ['Intervals', '7:52'],
];

// ---- Claude Opus 5.5: the plan ----
// one week: [Tue, Thu, Sat, Sun], each [kind, miles]
const K = { E: 'Easy run', T: 'Tempo', I: 'Intervals', R: 'Race pace', L: 'Long run', H: 'Half Marathon' };
const RAW = [
  [['E', 4], ['T', 5], ['E', 4], ['L', 9]],
  [['E', 4], ['I', 6], ['E', 4], ['L', 10]],
  [['E', 5], ['T', 6], ['E', 4], ['L', 11]],
  [['E', 4], ['T', 5], ['E', 3], ['L', 8]],     // cutback
  [['E', 5], ['I', 7], ['E', 5], ['L', 11]],
  [['E', 5], ['T', 7], ['E', 5], ['L', 12]],
  [['E', 6], ['R', 7], ['E', 5], ['L', 12]],
  [['E', 4], ['T', 6], ['E', 4], ['L', 9]],     // cutback
  [['E', 6], ['I', 8], ['E', 6], ['L', 12]],    // peak
  [['E', 6], ['R', 8], ['E', 5], ['L', 12]],
  [['E', 5], ['T', 6], ['E', 4], ['L', 9]],     // taper
  [['E', 4], ['R', 4], ['E', 3], ['H', 13.1]],  // race week
];
// how to run each session, scaled to its distance (Opus writes one per run): the paces are GPT-6 Astra's
export const note = ({ kind, miles: n }) => ({
  'Easy run': 'conversational, 10:05/mi',
  Tempo: `2 easy, ${n - 3} at 8:18/mi, 1 easy`,
  Intervals: `${n} x 800 m at 7:52/mi`,
  'Race pace': `middle ${n - 2} mi at 8:33/mi`,
  'Long run': n >= 10 ? 'easy, 10:15/mi, fuel at mile 6' : 'easy, 10:15/mi',
  'Half Marathon': 'go out at 8:40, settle to 8:33',
})[kind];
export const TAG = { 3: 'cutback', 7: 'cutback', 8: 'peak', 10: 'taper', 11: 'race week' };
const DAY_OFF = [0, 2, 4, 5]; // Tue, Thu, Sat, Sun from each week's Tuesday
const FIRST = new Date(2026, 9, 6); // Tue Oct 6 2026
export const PLAN = RAW.map((week, w) => week.map(([k, miles], j) => {
  const date = new Date(FIRST); date.setDate(FIRST.getDate() + w * 7 + DAY_OFF[j]);
  return { week: w + 1, kind: K[k], miles, date, title: k === 'H' ? 'Half Marathon' : `${K[k]} · ${miles} mi` };
}));
export const SESSIONS = PLAN.flat();                                                   // 48
export const WEEK_MI = PLAN.map((w) => +w.reduce((a, s) => a + s.miles, 0).toFixed(1)); // 22 ... 24.1
export const PEAK = Math.max(...WEEK_MI);                                               // 32
export const RACE = SESSIONS[SESSIONS.length - 1];                                      // Sun Dec 27
export const md = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
