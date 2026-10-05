// The one plan every beat draws from. Gemini's pace zones, Opus's written plan, GPT-6 Astra's load check and the
// Strava calendar all read these numbers, so nothing on screen is typed twice and nothing disagrees.
// Paces come from the goal, not a guess: the goal half marathon (1:55:00) gives a VDOT through the Daniels and Gilbert
// oxygen-cost and time-to-exhaustion equations, and every training pace is the speed at a fraction of that VDOT.
// Every workout carries its structure (steps of zone and length), which the plan card, the session graphs, the load
// check and the Strava chips all draw from.

const MI = 1609.344;               // metres in a mile
const HALF = 21097.5;              // metres in a half marathon
export const GOAL_MIN = 115;       // 1:55:00
export const GOAL = '1:55:00';
const RACE_MI = HALF / MI;         // 13.109

// Daniels and Gilbert: oxygen cost of running at v (m/min), and the fraction of VO2max sustainable for t minutes
const vo2 = (v) => -4.6 + 0.182258 * v + 0.000104 * v * v;
const pctMax = (t) => 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t);
const vAt = (o2) => (-0.182258 + Math.sqrt(0.182258 ** 2 + 4 * 0.000104 * (o2 + 4.6))) / (2 * 0.000104);
export const VDOT = vo2(HALF / GOAL_MIN) / pctMax(GOAL_MIN);
const paceAt = (f) => MI / vAt(VDOT * f); // minutes per mile at fraction f of VDOT

// minutes per mile -> "8:46"
export const fmt = (p) => { let m = Math.floor(p), s = Math.round((p - m) * 60); if (s === 60) { m += 1; s = 0; } return `${m}:${String(s).padStart(2, '0')}`; };

// the zones, slowest first: [slow, fast] pace range (min/mi), the % of VDOT behind it and the pace a workout runs at
export const ZONES = [
  { z: 'E', name: 'Easy', use: 'Easy and long runs', pct: [65, 74], range: [paceAt(0.65), paceAt(0.74)], at: paceAt(0.7) },
  { z: 'RP', name: 'Race pace', use: 'Long-run finishes', pct: null, range: [GOAL_MIN / RACE_MI, GOAL_MIN / RACE_MI], at: GOAL_MIN / RACE_MI },
  { z: 'T', name: 'Tempo', use: 'Threshold runs', pct: [83, 88], range: [paceAt(0.83), paceAt(0.88)], at: paceAt(0.88) },
  { z: 'I', name: 'Intervals', use: '800 m and 1 km reps', pct: [95, 100], range: [paceAt(0.95), paceAt(1.0)], at: paceAt(0.975) },
  { z: 'R', name: 'Strides', use: '20 s pickups, hills', pct: [105, 110], range: [paceAt(1.05), paceAt(1.1)], at: paceAt(1.075) },
];
const Z = Object.fromEntries(ZONES.map((o) => [o.z, o]));
Z.J = { at: paceAt(0.62) }; // recovery jog between reps
export const PACE = { E: fmt(Z.E.at), RP: fmt(Z.RP.at), T: fmt(Z.T.at), I: fmt(Z.I.at), R: fmt(Z.R.at) };
// how hard a step reads in the structure graphs (0..1 of the graph's height)
export const LIFT = { J: 0.2, E: 0.34, RP: 0.6, T: 0.74, I: 0.9, R: 1 };

// a step is [zone, miles]; time-based steps (strides, hills) are converted at that zone's pace
const mi = (z, m) => ({ z, mi: m, min: m * Z[z].at });
const sec = (z, s) => ({ z, min: s / 60, mi: s / 60 / Z[z].at });
const reps = (n, on, off) => Array.from({ length: n }, (_, i) => (i < n - 1 ? [on, off] : [on])).flat();
const fill = (total, ...core) => { // easy running before and after the core, splitting what is left of the day's miles
  const used = core.reduce((a, s) => a + s.mi, 0), rest = Math.max(0, total - used);
  return [mi('E', +(rest / 2).toFixed(2)), ...core, mi('E', +(rest / 2).toFixed(2))];
};

// the four days of a week: Tue easy, Thu quality, Sat easy, Sun long (Mon, Wed and Fri rest)
const TUE = [3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 3, 3];
const SAT = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2];
const LONG = [6, 7, 8, 6, 9, 10, 11, 8, 12, 10, 8];
const LONG_RP = { 6: 2, 8: 3, 9: 2 };  // week index -> miles at race pace to finish the long run
// easy running with 6 × 20 s strides at the end, the strides counted inside the day's miles
const strides = (total) => { const core = reps(6, sec('R', 20), sec('J', 60)); return [mi('E', +(total - core.reduce((a, s) => a + s.mi, 0)).toFixed(2)), ...core]; };
const THU = [ // [name, miles, steps, note]
  ['Strides', 4, () => strides(4), 'easy + 6 × 20 s strides'],
  ['Hills', 4, () => fill(4, ...reps(6, sec('R', 60), sec('J', 90))), '6 × 60 s uphill, jog down'],
  ['Tempo', 4, () => fill(4, mi('T', 2)), `2 mi at ${'T'}`],
  ['Strides', 3, () => strides(3), 'easy + 6 × 20 s strides'],
  ['Tempo', 4, () => fill(4, mi('T', 2.5)), `2.5 mi at ${'T'}`],
  ['Intervals', 4, () => fill(4, ...reps(4, mi('I', 0.5), sec('J', 90))), `4 × 800 m at ${'I'}`],
  ['Tempo', 5, () => fill(5, mi('T', 3)), `3 mi at ${'T'}`],
  ['Strides', 4, () => strides(4), 'easy + 6 × 20 s strides'],
  ['Tempo', 5, () => fill(5, ...reps(3, mi('T', 1), sec('J', 60))), `3 × 1 mi at ${'T'}`],
  ['Intervals', 5, () => fill(5, ...reps(4, mi('I', 0.62), sec('J', 120))), `4 × 1 km at ${'I'}`],
  ['Race Pace', 4, () => fill(4, mi('RP', 2)), `2 mi at ${'RP'}`],
  ['Race Pace', 3, () => fill(3, mi('RP', 1)), `1 mi at ${'RP'}`],
];
const note = (s) => s.replace(/\b(T|I|RP)$/, (k) => `${PACE[k]} /mi`);

export const START = new Date(2026, 9, 5); // Monday, Oct 5 2026
const day = (w, d) => { const x = new Date(START); x.setDate(START.getDate() + w * 7 + d); return x; };

export const PHASES = [
  { name: 'Base', from: 0, to: 3, aim: 'Easy miles, hills' },
  { name: 'Build', from: 4, to: 7, aim: 'Tempo, intervals' },
  { name: 'Peak', from: 8, to: 9, aim: 'Longest runs' },
  { name: 'Taper', from: 10, to: 11, aim: 'Fresh legs' },
];
export const PHASE_C = { Base: '#7aa7ff', Build: '#3ecf8e', Peak: '#fc5200', Taper: '#c49bff' };
export const phaseOf = (w) => PHASES.find((p) => w >= p.from && w <= p.to);
export const CUTBACK = [3, 7];

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const run = (w, d, name, miles, steps, extra = {}) => ({ date: day(w, d), day: DOW[d], week: w, name, miles, steps, ...extra });
export const PLAN = Array.from({ length: 12 }, (_, w) => {
  const [tn, tm, ts, tnote] = THU[w];
  const rp = LONG_RP[w];
  const long = w === 11
    ? run(w, 6, 'Half Marathon', +RACE_MI.toFixed(1), [mi('RP', RACE_MI)], { note: `13.1 mi at ${PACE.RP} /mi` })
    : run(w, 6, 'Long Run', LONG[w], rp ? [mi('E', LONG[w] - rp), mi('RP', rp)] : [mi('E', LONG[w])],
      { note: rp ? `last ${rp} mi at ${PACE.RP} /mi` : `easy, ${PACE.E} /mi` });
  return [
    run(w, 1, 'Easy Run', TUE[w], [mi('E', TUE[w])], { note: `easy, ${PACE.E} /mi` }),
    run(w, 3, tn, tm, ts(), { note: note(tnote) }),
    w === 11 ? run(w, 5, 'Shakeout', SAT[w], [mi('E', 1.6), ...reps(4, sec('R', 20), sec('J', 40))], { note: '2 mi + 4 strides' })
      : run(w, 5, 'Easy Run', SAT[w], [mi('E', SAT[w])], { note: `easy, ${PACE.E} /mi` }),
    long,
  ];
});
export const ALL = PLAN.flat();
export const RACE = ALL[ALL.length - 1];

// ---- the numbers the check and the chips read ----
const sum = (a) => a.reduce((x, y) => x + y, 0);
export const WEEKS = PLAN.map((w) => +sum(w.map((r) => r.miles)).toFixed(1));
export const TOTAL_MI = Math.round(sum(WEEKS));
export const PEAK = Math.max(...WEEKS);
export const PEAK_I = WEEKS.indexOf(PEAK);
// each week split by intensity: easy (E and jog) vs quality (RP, T, I, R), by miles run in each step
export const SPLIT = PLAN.map((w) => {
  const st = w.flatMap((r) => r.steps);
  const hard = sum(st.filter((s) => s.z !== 'E' && s.z !== 'J').map((s) => s.mi));
  const tot = sum(st.map((s) => s.mi));
  return { easy: tot - hard, hard, tot };
});
export const EASY_SHARE = Math.round((100 * sum(SPLIT.map((s) => s.easy))) / sum(SPLIT.map((s) => s.tot)));
// acute:chronic workload ratio: this week's miles over the mean of up to four weeks before it (week 1 has no history)
export const ACWR = WEEKS.map((v, i) => { const prev = WEEKS.slice(Math.max(0, i - 4), i); return prev.length ? v / (sum(prev) / prev.length) : null; });
export const ACWR_BAND = [0.8, 1.3];
const acw = ACWR.map((v, i) => [v, i]).filter(([v]) => v !== null);
export const ACWR_MAX = acw.reduce((m, x) => (x[0] > m[0] ? x : m));
export const ACWR_OK = acw.every(([v]) => v >= ACWR_BAND[0] && v <= ACWR_BAND[1]);
export const LONGS = PLAN.map((w) => w[3].miles);
// the long run never grows more than 1 mi past the longest run so far
export const LONG_STEP = Math.max(...LONGS.slice(1, 11).map((v, i) => v - Math.max(...LONGS.slice(0, i + 1))));
export const TAPER_DROP = Math.round(100 * (1 - WEEKS[10] / PEAK));
export const md = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
