/* data.js - the numbers behind superbot.app/p/marathon-build, "Training log".
   One read-only sync of three run logs (Strava, Garmin Connect, Nike Run Club) on Sat Oct 10 at 7:12 AM,
   the day before the Chicago Marathon: 591 runs pulled from the last 12 months, 203 of them the same run
   logged twice (Garmin Connect syncs itself into Strava, Nike Run Club keeps the phone-only runs), leaving
   388 unique runs and 1,642 mi; plus the miles on every pair of shoes and the 8 week marathon block that
   runs Sun Aug 16 to Sat Oct 10. Nothing is edited or deleted in any of the three accounts.
   The user, the run log, the shoe mileages and the training block are invented for the spot. The marathon
   is a real race on a real date (Chicago Marathon, Sun Oct 11 2026) and the race start time is the
   published one; the goal time is the runner's own. Every figure the page, the hub and the steps print is
   derived here, so they never disagree. Two things the page says out loud rather than hiding: 31 of the
   388 runs carry no shoe tag, so 297 mi of the 1,642 mi is not on any of the 5 pairs (that is the gap
   between the shoe totals and the year total), and the year average of 4.2 mi per run is low because the
   year is mostly short shakeouts and 5 km loops until this block, which averages 7.1 mi per run. */

const n0 = (n) => Number(n).toLocaleString('en-US');
export { n0 };

export const meta = {
  user: 'rmcallister',
  day: 'Sat, Oct 10',
  synced: '7:12 AM',
  // the clock the top bar prints: the sync starts at 7:11:34 AM and lands at 7:12:02 AM, 28 s in
  syncStart: 7 * 3600 + 11 * 60 + 34,
  syncSecs: 28,
  window: 'Oct 10, 2025 to Oct 9, 2026',
  resync: 'Every morning, 6:30 AM',
};

/* the three logs the runs came out of: what each one held, and what survived the merge */
export const accounts = [
  { id: 'strava', name: 'Strava', handle: 'rmcallister', logo: './brand/strava.svg', pulled: 286, kept: 286, mi: 1182, since: '2019' },
  { id: 'garmin', name: 'Garmin Connect', handle: 'rmcallister', logo: './brand/garmin.svg', pulled: 241, kept: 53, mi: 296, since: '2021' },
  { id: 'nrc', name: 'Nike Run Club', handle: 'rmcallister', logo: './brand/nike.svg', pulled: 64, kept: 49, mi: 164, since: '2023' },
];

const PULLED = accounts.reduce((a, s) => a + s.pulled, 0);      // 591
const DUPES = 203;                                             // 188 Garmin runs already in Strava, 15 NRC ones too
const RUNS = PULLED - DUPES;                                   // 388
const MILES = 1642;                                            // 12 months of unique runs
const GEARLESS_RUNS = 31;                                      // runs with no shoe tag, from any of the three logs
const GEARLESS_MI = 297;

/* the runs the page lists: [date, title, mi, seconds per mile, tags, shoe] - the 10 most recent unique runs */
const RUNS_TABLE = [
  ['Thu, Oct 8', 'Lakefront tempo 4 x 1 mi', 6.0, 461, ['strava', 'garmin'], 'pegasus'],
  ['Wed, Oct 7', 'Recovery jog', 4.0, 588, ['strava'], 'ghost'],
  ['Tue, Oct 6', 'Easy + 6 x 20 s strides', 6.0, 522, ['strava', 'garmin'], 'clifton'],
  ['Sun, Oct 4', 'Taper long run', 8.0, 532, ['strava', 'garmin'], 'clifton'],
  ['Sat, Oct 3', 'Parkrun, Jackson Park', 3.1, 425, ['strava', 'nrc'], 'endorphin'],
  ['Wed, Sep 30', 'Easy 7 along the river', 7.0, 519, ['strava'], 'pegasus'],
  ['Sun, Sep 27', 'Long run 16', 16.0, 527, ['strava', 'garmin'], 'clifton'],
  ['Thu, Sep 24', 'Lincoln Park tempo 8', 8.0, 459, ['strava', 'garmin'], 'pegasus'],
  ['Tue, Sep 22', 'Easy 6', 6.0, 524, ['strava'], 'ghost'],
  ['Sun, Sep 20', 'Long run 20', 20.0, 521, ['strava', 'garmin'], 'endorphin'],
];

/** miles a run covers, one decimal: 6 -> "6.0 mi", 3.1 -> "3.1 mi" */
export const mi1 = (n) => n.toFixed(1) + ' mi';

/** seconds per mile -> "8:41 /mi" */
export function pace(secPerMi) {
  const s = Math.round(secPerMi);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} /mi`;
}

/** seconds -> "1:10:56" (or "46:06" under an hour) */
export function hms(secs) {
  const s = Math.round(secs);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + ':' + String(sec).padStart(2, '0');
}

export const runs = RUNS_TABLE.map(([date, title, mi, spm, tags, shoe], i) => ({
  rank: i + 1, date, title, mi, spm, tags, shoe: shoe || null,
  pace: pace(spm), time: hms(mi * spm), miText: mi1(mi),
}));

/* runs that arrived twice under different logs: [date, title, mi, tags] - the merge keeps one row each */
const MERGED = [
  ['Sun, Sep 20', 'Long run 20', 20.0, ['garmin', 'strava']],
  ['Thu, Sep 24', 'Lincoln Park tempo 8', 8.0, ['garmin', 'strava']],
  ['Tue, Sep 22', 'Easy 6', 6.0, ['garmin', 'strava']],
  ['Sun, Sep 27', 'Long run 16', 16.0, ['garmin', 'strava']],
  ['Sat, Oct 3', 'Parkrun, Jackson Park', 3.1, ['nrc', 'strava']],
  ['Sun, Oct 4', 'Taper long run', 8.0, ['garmin', 'strava']],
];

export const merged = MERGED.map(([date, title, mi, tags]) => ({ date, title, mi, miText: mi1(mi), tags }));

/* the 5 pairs the three logs have gear tags for: [key, name, since, mi, last run, role] */
const SHOES = [
  ['pegasus', 'Nike Pegasus 41', 'Feb 2026', 468, 'Thu, Oct 8', 'Daily trainers'],
  ['clifton', 'Hoka Clifton 9', 'Jan 2026', 412, 'Sun, Oct 4', 'Easy and long runs'],
  ['endorphin', 'Saucony Endorphin Speed 4', 'May 2026', 236, 'Sun, Sep 20', 'Long run workouts'],
  ['ghost', 'Brooks Ghost 16', 'Jul 2026', 171, 'Wed, Oct 7', 'Recovery days'],
  ['vaporfly', 'Nike Vaporfly 3', 'Mar 2026', 58, 'Sun, Sep 19', 'Race shoe, tuned up twice'],
];
const SHOE_LIMIT = 400;

export const shoes = SHOES.map(([key, name, since, mi, last, role]) => ({
  key, name, since, mi, last, role, limit: SHOE_LIMIT, past: mi > SHOE_LIMIT,
  pct: Math.min(100, (mi / 500) * 100), limitPct: (SHOE_LIMIT / 500) * 100,
}));

export const shoeGap = { runs: GEARLESS_RUNS, mi: GEARLESS_MI, miText: n0(GEARLESS_MI) + ' mi' };

/* the 8 week block: [week label, dates, mi, long run mi, runs, note] */
const BLOCK = [
  ['Week 1', 'Sun, Aug 16 to Sat, Aug 22', 38, 14, 5, 'Block starts'],
  ['Week 2', 'Sun, Aug 23 to Sat, Aug 29', 44, 16, 6, 'Building'],
  ['Week 3', 'Sun, Aug 30 to Sat, Sep 5', 50, 18, 7, 'Building'],
  ['Week 4', 'Sun, Sep 6 to Sat, Sep 12', 34, 12, 5, 'Cutback'],
  ['Week 5', 'Sun, Sep 13 to Sat, Sep 19', 52, 18, 7, 'Building'],
  ['Week 6', 'Sun, Sep 20 to Sat, Sep 26', 55, 20, 7, 'Peak week'],
  ['Week 7', 'Sun, Sep 27 to Sat, Oct 3', 46, 16, 7, 'Sharpen'],
  ['Week 8', 'Sun, Oct 4 to Sat, Oct 10', 22, 8, 4, 'Taper and race week'],
];

export const weeks = BLOCK.map(([week, dates, mi, long, runsN, note]) => ({ week, dates, mi, long, runs: runsN, note }));

export const block = {
  weeks,
  mi: weeks.reduce((a, w) => a + w.mi, 0),          // 341
  runs: weeks.reduce((a, w) => a + w.runs, 0),      // 48
  longMi: Math.max(...weeks.map((w) => w.long)),    // 20
  longTotal: weeks.reduce((a, w) => a + w.long, 0), // 122
  peakMi: Math.max(...weeks.map((w) => w.mi)),      // 55
  easyPace: 521,                                    // 8:41 /mi, the block's average easy pace
  avgPace: 531,                                     // 8:51 /mi across every block mile
  start: 'Sun, Aug 16',
  end: 'Sat, Oct 10',
};

/* the race the block was built for. Date and start time are the published ones; the goal is the runner's */
export const race = {
  name: 'Chicago Marathon',
  city: 'Chicago, Illinois',
  day: 'Sun, Oct 11',
  start: '7:30 AM',
  goal: '3:30',
  goalPace: '8:01 /mi',   // 3:30:00 over 26.2188 mi
  daysTo: 1,
  countdown: 'Tomorrow',
  corral: 'Corral D',
  bib: '12841',
};

export const counts = {
  accounts: accounts.length,
  pulled: PULLED,
  dupes: DUPES,
  runs: RUNS,
  miles: MILES,
  shoes: shoes.length,
  flagged: shoes.filter((s) => s.past).length,
  shoeMi: shoes.reduce((a, s) => a + s.mi, 0),      // 1345
  gearlessRuns: GEARLESS_RUNS,
  gearlessMi: GEARLESS_MI,
  blockMi: block.mi,
  blockRuns: block.runs,
  raceDays: race.daysTo,
};

/* the rows the hub's live card previews: the newest runs, plus the pair that needs replacing */
export const items = [
  { img: './brand/run.svg', title: 'Lakefront tempo 4 x 1 mi', price: '6.0 mi', meta: '7:41 /mi · Nike Pegasus 41', source: 'strava' },
  { img: './brand/run.svg', title: 'Long run 20', price: '20.0 mi', meta: '8:41 /mi · Endorphin Speed 4', source: 'garmin' },
  { img: './brand/run.svg', title: 'Midday 5 km', price: '3.1 mi', meta: '9:12 /mi · no gear set', source: 'nrc' },
  { img: './brand/run.svg', title: 'Parkrun, Jackson Park', price: '3.1 mi', meta: '7:05 /mi · Endorphin Speed 4', source: 'strava' },
  { img: './brand/shoe.svg', title: 'Nike Pegasus 41', price: '468 mi', meta: 'Past 400 mi, flagged Replace', source: 'gear' },
];

/* prose the page prints about its own numbers */
export const copy = {
  blockPace: pace(block.easyPace).replace(' /mi', ''),   // "8:41": the block's average easy pace, printed whole
  kicker: `Strava + Garmin Connect + Nike Run Club, synced ${meta.synced}`,
  heroH1: `591 runs pulled. ${counts.dupes} of them were the same run twice.`,
  heroDek: `Superbot signed in to all three logs, pulled every run since ${meta.window.split(' to ')[0]}, merged the overlapping copies into ${counts.runs} unique runs and totaled the miles on every pair of shoes. Read-only, nothing was changed in any account.`,
  dupesH: `${counts.dupes} runs were logged twice, now one row each`,
  dupesDek: 'Garmin Connect syncs itself into Strava, and Nike Run Club holds the phone-only runs, so most long runs arrived twice. Same start time, same distance, merged.',
  runsH: 'Every run, one row each',
  runsDek: `${counts.runs} unique runs and ${n0(counts.miles)} mi since Oct 2025. The 10 newest are below; the duplicate copies are already gone.`,
  shoesH: 'Shoes, miles to date',
  shoesDek: `Miles totaled from all three logs. Anything past ${SHOE_LIMIT} mi is flagged Replace.`,
  blockH: `The 8 weeks before ${race.name}`,
  blockDek: `${block.start} to ${block.end}: ${block.mi} mi in ${block.runs} runs, peak ${block.peakMi} mi, longest ${block.longMi.toFixed(1)} mi, ${pace(block.easyPace).replace(' /mi', '')} average easy pace.`,
  watchH: 'Keeps watching',
  watchDek: 'The next sync runs on its own. You hear about it only when something changes.',
};

/* what Superbot keeps an eye on after the sync */
export const watch = [
  { icon: 'clock', k: 'Next sync', v: 'Sun, Oct 11, 5:00 AM', note: `All three logs, read-only` },
  { icon: 'trophy', k: 'Race day', v: `${race.name}, ${race.start}`, note: `${race.countdown}. The taper is on plan` },
  { icon: 'footprints', k: 'Shoe wear', v: 'Pegasus 41 and Clifton 9 past 400 mi', note: 'Both flagged to replace before the next training block' },
  { icon: 'flame', k: 'Block watch', v: 'Weekly miles, long runs, easy pace', note: `Peak ${block.peakMi} mi in week 6, nothing since below plan` },
];