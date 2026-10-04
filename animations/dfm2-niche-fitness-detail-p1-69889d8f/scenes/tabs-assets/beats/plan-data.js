// The one half marathon plan every beat shows, so the four switches build on each other: Gemini's research sets the
// plan's rules (RESEARCH), Opus writes the plan itself (PLAN, PHASES, each workout's coaching text and structure),
// GPT-6 Astra checks its math (PACES from the goal time, WEEKS ramp, cutbacks, taper, EASY_SHARE) and Strava syncs
// the same 48 workouts. Pure data, computed once at import; nothing here reads t.

export const GOAL = '1:55:00';
export const RACE_MI = 13.1;
export const START = new Date(2026, 9, 5); // Monday, Oct 5, 2026: week 1

// pace per mile from the goal time, in seconds and as m:ss (race 8:46, tempo 8:40, intervals 8:05, easy 10:15)
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
const GOAL_SEC = GOAL.split(':').map(Number).reduce((a, n) => a * 60 + n, 0); // 6900
const RACE_SEC = GOAL_SEC / RACE_MI;
export const PACE_SEC = { race: RACE_SEC, tempo: RACE_SEC - 6, intervals: RACE_SEC - 41, easy: RACE_SEC + 89 };
export const PACES = Object.fromEntries(Object.entries(PACE_SEC).map(([k, s]) => [k, mmss(s)]));
// the band each zone may run in, for the pace table (target ± a few seconds, easy is wide on purpose)
export const ZONES = [
  { key: 'easy', name: 'Easy', use: 'Easy runs, long runs', lo: mmss(PACE_SEC.easy + 15), hi: mmss(PACE_SEC.easy - 15) },
  { key: 'tempo', name: 'Tempo', use: 'Tempo blocks', lo: mmss(PACE_SEC.tempo + 5), hi: mmss(PACE_SEC.tempo - 5) },
  { key: 'int', name: 'Intervals', use: '800 m repeats', lo: mmss(PACE_SEC.intervals + 5), hi: mmss(PACE_SEC.intervals - 5) },
  { key: 'race', name: 'Race', use: 'Race pace, race day', lo: PACES.race, hi: PACES.race },
];

const TUE = [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 3, 3];
const THU = [4, 4, 4, 3, 4, 4, 5, 4, 5, 5, 4, 3];
const SAT = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2];
const LONG = [6, 7, 8, 6, 9, 10, 11, 8, 12, 10, 8, 13.1];
const FAST_FINISH = { 9: 2, 10: 2 }; // weeks whose long run ends with 2 mi at race pace ("practice race pace in the last month")
const DAY = { Tue: 1, Thu: 3, Sat: 5, Sun: 6 };

export const PHASES = [
  { name: 'Base', from: 1, to: 4, note: 'Easy miles, one tempo or interval day' },
  { name: 'Build', from: 5, to: 8, note: 'Long run to 11 mi, tempo grows to 3 mi' },
  { name: 'Peak', from: 9, to: 10, note: '12 mi long run, race pace finishes' },
  { name: 'Taper', from: 11, to: 12, note: 'Less volume, same intensity, race' },
];
export const CUTBACK = [4, 8]; // 1-based weeks
export const TAPER = [11, 12];
export const phaseOf = (week) => PHASES.find((p) => week >= p.from && week <= p.to);

// a workout's structure: segments of { z, mi } where z is wu | easy | tempo | int | jog | race | cd
function structure(name, miles, week) {
  if (name === 'Tempo') return [{ z: 'wu', mi: 1 }, { z: 'tempo', mi: miles - 2 }, { z: 'cd', mi: 1 }];
  if (name === 'Intervals') {
    const reps = miles - 1; // 3 mi: 2 reps, 4 mi: 3, 5 mi: 4 (800 m each, a 400 m jog after)
    const segs = [{ z: 'wu', mi: 1 }];
    for (let i = 0; i < reps; i++) segs.push({ z: 'int', mi: 0.5 }, { z: 'jog', mi: 0.25 });
    segs.pop();
    segs.push({ z: 'cd', mi: +(miles - 1 - reps * 0.75 + 0.25).toFixed(2) });
    return segs;
  }
  if (name === 'Race Pace') return [{ z: 'wu', mi: 1 }, { z: 'race', mi: 1 }, { z: 'cd', mi: 1 }];
  if (name === 'Half Marathon') return [{ z: 'race', mi: RACE_MI }];
  if (name === 'Long Run' && FAST_FINISH[week]) return [{ z: 'easy', mi: miles - FAST_FINISH[week] }, { z: 'race', mi: FAST_FINISH[week] }];
  return [{ z: 'easy', mi: miles }];
}

// the line a coach would write for it
function describe(name, miles, week) {
  if (name === 'Tempo') return `1 mi warm-up, ${miles - 2} mi at ${PACES.tempo}/mi, 1 mi cool-down`;
  if (name === 'Intervals') return `1 mi warm-up, ${miles - 1} × 800 m at ${PACES.intervals}/mi, 400 m jogs, cool-down`;
  if (name === 'Race Pace') return `1 mi easy, 1 mi at race pace ${PACES.race}/mi, 1 mi easy`;
  if (name === 'Half Marathon') return `Race day: 13.1 mi at ${PACES.race}/mi for ${GOAL}`;
  if (name === 'Shakeout') return `${miles} mi easy, legs loose for Sunday`;
  if (name === 'Long Run' && FAST_FINISH[week]) return `${miles} mi: ${miles - FAST_FINISH[week]} easy, last ${FAST_FINISH[week]} at ${PACES.race}/mi`;
  if (name === 'Long Run') return `${miles} mi steady at ${PACES.easy}/mi`;
  return `${miles} mi at ${PACES.easy}/mi, conversational`;
}

const KIND = { 'Easy Run': 'easy', Shakeout: 'easy', Tempo: 'tempo', Intervals: 'int', 'Race Pace': 'tempo', 'Long Run': 'long', 'Half Marathon': 'race' };

function run(i, day, name, miles) {
  const week = i + 1;
  const date = new Date(START); date.setDate(START.getDate() + i * 7 + DAY[day]);
  const segs = structure(name, miles, week);
  const pace = name === 'Half Marathon' || name === 'Race Pace' ? PACES.race
    : name === 'Tempo' ? PACES.tempo : name === 'Intervals' ? PACES.intervals : PACES.easy;
  return { date, day, week, name, kind: KIND[name], miles, pace, segs, desc: describe(name, miles, week) };
}

// PLAN[week 0..11] = [Tue, Thu, Sat, Sun]; each { date, day, week, name, kind, miles, pace, segs, desc }
export const PLAN = LONG.map((long, i) => {
  const week = i + 1, race = week === 12;
  const hard = race ? 'Race Pace' : week % 2 ? 'Tempo' : 'Intervals';
  return [run(i, 'Tue', 'Easy Run', TUE[i]), run(i, 'Thu', hard, THU[i]),
    run(i, 'Sat', race ? 'Shakeout' : 'Easy Run', SAT[i]), run(i, 'Sun', race ? 'Half Marathon' : 'Long Run', long)];
});
export const ALL = PLAN.flat();                                                          // 48
export const WEEKS = PLAN.map((w) => +w.reduce((a, r) => a + r.miles, 0).toFixed(1));  // 16 17 18 15 19 20 22 18 24 22 18 21.1
export const MILES = Math.round(WEEKS.reduce((a, b) => a + b, 0));                      // 230
export const PEAK = Math.max(...WEEKS);                                                  // 24 (week 9)
export const LONG_PEAK = Math.max(...ALL.filter((r) => r.name === 'Long Run').map((r) => r.miles)); // 12
export const RACE = ALL[ALL.length - 1];                                                 // Sun Dec 27
// each week's ramp against the last full (non-cutback) week before it, in %
export const RAMP = WEEKS.map((m, i) => {
  if (i === 0 || CUTBACK.includes(i + 1) || TAPER.includes(i + 1)) return null;
  let j = i - 1; while (j > 0 && CUTBACK.includes(j + 1)) j--;
  return Math.round((m / WEEKS[j] - 1) * 1000) / 10;
});                                                                                      // max 10.0 (week 7)
export const MAX_RAMP = Math.max(...RAMP.filter((r) => r !== null));
// share of training miles (race day excluded) run easy (easy, warm-up, cool-down, jogs)
const TRAIN = ALL.slice(0, -1).flatMap((r) => r.segs);
const HARD_MI = TRAIN.filter((s) => s.z === 'tempo' || s.z === 'int' || s.z === 'race').reduce((a, s) => a + s.mi, 0);
const TRAIN_MI = TRAIN.reduce((a, s) => a + s.mi, 0);
export const EASY_SHARE = Math.round((1 - HARD_MI / TRAIN_MI) * 100);                  // ~90

// each cutback week's drop from the week before it, in % (17 and 18)
export const CUT_DROP = CUTBACK.map((w) => Math.round((1 - WEEKS[w - 1] / WEEKS[w - 2]) * 100));

// Gemini's research: 36 plans read, what the best agree on, and the plan setting each rule turns into
export const RESEARCH = {
  total: 36,
  rules: [
    { rule: 'Mostly easy, conversational miles', plans: 34, sets: `${EASY_SHARE}% of miles at ${PACES.easy}/mi` },
    { rule: 'Long run peaks near 12 mi', plans: 31, sets: `Long run 6 to ${LONG_PEAK} mi, week 9` },
    { rule: 'A cutback every 4th week', plans: 27, sets: `Weeks ${CUTBACK.join(' and ')} cut ${CUT_DROP.join(' and ')}%` },
    { rule: 'A 2 week taper', plans: 25, sets: `Weeks ${TAPER.join(' and ')}, intensity kept` },
    { rule: 'One hard workout a week', plans: 22, sets: 'Thursday: tempo or 800s' },
  ],
};

export const md = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
