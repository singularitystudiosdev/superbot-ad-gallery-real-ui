// data.js - the overview behind superbot.app/p/study-streak, "Study Overview".
// One Saturday morning's read-only study overview for a learner on Japanese (main) and Spanish: the Duolingo
// streak, today's XP and the league table, the AnkiWeb decks and what each has due, the WaniKani reviews and
// lessons with the rest of today's review forecast, and the next italki lesson with the homework the tutor
// left. Superbot reads all four at 7:02 AM, flags what would break today and orders a morning plan. It
// completes no lesson, reviews no card, books or cancels nothing and buys no streak freeze.
// Every figure the page shows is derived here from these records: the due totals, the flags, the deadlines,
// the minutes left and the plan cannot disagree with each other.

// "7:02 AM" from seconds after midnight (wraps past midnight).
export function hm(sec) {
  const s = ((Math.round(sec) % 86400) + 86400) % 86400;
  const h24 = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

// "16 h 57 min" from a span in seconds.
export function span(sec) {
  const m = Math.max(0, Math.floor(sec / 60));
  const h = Math.floor(m / 60);
  return h ? `${h} h ${String(m % 60).padStart(2, '0')} min` : `${m % 60} min`;
}

export const meta = {
  user: 'Jordan',
  date: 'Sat, Sep 26',
  syncStart: 7 * 3600 + 2 * 60 + 14, // 7:02:14 AM
  syncSecs: 38,
  midnight: 24 * 3600 - 60, // 11:59 PM, the last minute a Duolingo lesson still counts for today
};

// Where Superbot reads from, each read-only. `pulled` is what the hub's chat counts up beside each source.
export const duolingo = {
  streak: 247,
  freezes: 0,
  xpToday: 0,
  goal: 50,
  lessonMin: 5, // one lesson extends the streak
  league: 'Sapphire',
  rank: 6,
  size: 30,
  promoteTop: 4, // ranks 1 to 4 move up at the end of the week
  demoteFrom: 9, // rank 9 and below drop down
  // the last six days of this league week, and today (Sat) still at 0
  week: [
    { d: 'Sun', xp: 180 },
    { d: 'Mon', xp: 210 },
    { d: 'Tue', xp: 165 },
    { d: 'Wed', xp: 240 },
    { d: 'Thu', xp: 195 },
    { d: 'Fri', xp: 250 },
    { d: 'Sat', xp: 0 },
  ],
  courses: [
    { lang: 'Japanese', at: 'Section 3, Unit 12', main: true },
    { lang: 'Spanish', at: 'Section 2, Unit 5', main: false },
  ],
  // the five rows of the league table around the learner, the rows the page prints
  table: [
    { rank: 4, name: 'Kenji M.', xp: 1318 },
    { rank: 5, name: 'Lea B.', xp: 1276 },
    { rank: 6, name: 'You', xp: 0, you: true }, // xp filled from the week below
    { rank: 7, name: 'Tomás R.', xp: 1205 },
    { rank: 8, name: 'Priya N.', xp: 1190 },
  ],
};
duolingo.weekXp = duolingo.week.reduce((t, d) => t + d.xp, 0);
duolingo.table.find((r) => r.you).xp = duolingo.weekXp;
duolingo.toPromote = duolingo.rank - duolingo.promoteTop;
duolingo.aboveDemotion = duolingo.demoteFrom - duolingo.rank;
duolingo.gapUp = duolingo.table.find((r) => r.rank === duolingo.promoteTop).xp - duolingo.weekXp;

export const anki = {
  retention: 91,
  secsPerCard: 7,
  decks: [
    { id: 'core', name: 'Core 2k/6k Japanese', lang: 'JA', cards: 4212, fresh: 10, review: 54 },
    { id: 'kanji', name: 'Kanji from WaniKani (mining)', lang: 'JA', cards: 1046, fresh: 5, review: 13 },
    { id: 'spanish', name: 'Spanish A2 vocab', lang: 'ES', cards: 1380, fresh: 8, review: 19 },
    { id: 'mining', name: 'Sentence mining', lang: 'JA', cards: 612, fresh: 0, review: 11 },
  ],
};
anki.decks.forEach((d) => { d.due = d.fresh + d.review; });
anki.cards = anki.decks.reduce((t, d) => t + d.cards, 0);
anki.due = anki.decks.reduce((t, d) => t + d.due, 0);
anki.fresh = anki.decks.reduce((t, d) => t + d.fresh, 0);
anki.review = anki.decks.reduce((t, d) => t + d.review, 0);
anki.maxDue = Math.max(...anki.decks.map((d) => d.due));
anki.min = Math.round((anki.due * anki.secsPerCard) / 60);

export const wanikani = {
  level: 17,
  reviewsNow: 86,
  lessons: 9,
  secsPerReview: 12.5,
  // reviews that unlock each hour for the rest of today, 8 AM to 11 PM
  forecast: [4, 0, 12, 6, 0, 3, 18, 9, 0, 22, 14, 7, 0, 26, 11, 10].map((n, i) => ({ h: 8 + i, n })),
  srs: [
    { id: 'apprentice', name: 'Apprentice', n: 112 },
    { id: 'guru', name: 'Guru', n: 264 },
    { id: 'master', name: 'Master', n: 410 },
    { id: 'enlightened', name: 'Enlightened', n: 688 },
    { id: 'burned', name: 'Burned', n: 1214 },
  ],
};
wanikani.later = wanikani.forecast.reduce((t, f) => t + f.n, 0);
wanikani.tonight = wanikani.reviewsNow + wanikani.later;
wanikani.lastHour = wanikani.forecast[wanikani.forecast.length - 1].h;
wanikani.maxHour = Math.max(...wanikani.forecast.map((f) => f.n));
wanikani.min = Math.round((wanikani.reviewsNow * wanikani.secsPerReview) / 60);
wanikani.items = wanikani.srs.reduce((t, s) => t + s.n, 0);

export const italki = {
  tutor: 'Haruka S.',
  tutorKind: 'Community tutor, Japanese',
  together: 38, // lessons already taken with her
  lessons: [
    { day: 'Today', at: 18 * 3600 + 30 * 60, mins: 45, tutor: 'Haruka S.', what: 'Japanese conversation' },
    { day: 'Tue, Sep 29', at: 19 * 3600, mins: 45, tutor: 'Haruka S.', what: 'Japanese conversation' },
    { day: 'Thu, Oct 1', at: 20 * 3600, mins: 30, tutor: 'Diego R.', what: 'Spanish speaking practice' },
  ],
  homework: {
    task: 'Write 5 sentences with ~ている about your morning routine',
    from: 'Haruka S.',
    status: 'Not started',
    min: 5,
  },
};
italki.next = italki.lessons[0];

// the four accounts in the order the sync card reads them; `pulled` is what each read returned
export const accounts = [
  { id: 'duolingo', name: 'Duolingo', logo: './brand/duolingo.svg', pulled: duolingo.size, what: 'league rows read', line: `${duolingo.streak}-day streak, ${duolingo.xpToday} XP today` },
  { id: 'anki', name: 'AnkiWeb', logo: './brand/anki.svg', pulled: anki.cards, what: 'cards read', line: `${anki.decks.length} decks, ${anki.due} cards due` },
  { id: 'wanikani', name: 'WaniKani', logo: './brand/wanikani.svg', pulled: wanikani.tonight, what: 'reviews read', line: `Level ${wanikani.level}, ${wanikani.reviewsNow} reviews due` },
  { id: 'italki', name: 'italki', logo: './brand/italki.svg', pulled: italki.lessons.length, what: 'lessons read', line: `Lesson ${hm(italki.next.at)}, homework due` },
];
export const accOf = (id) => accounts.find((a) => a.id === id);

// What would break today. Deadlines are seconds after midnight; `left` is measured from the read.
const read = meta.syncStart + meta.syncSecs;
export const flags = [
  {
    id: 'streak', src: 'duolingo', level: 'red',
    title: `Your ${duolingo.streak}-day Duolingo streak ends at midnight`,
    detail: `${duolingo.xpToday} of ${duolingo.goal} XP today and no streak freeze equipped. One ${duolingo.lessonMin} min lesson keeps it.`,
    due: meta.midnight, dueText: `by ${hm(meta.midnight)}`,
  },
  {
    id: 'homework', src: 'italki', level: 'red',
    title: `italki homework for ${italki.homework.from} is not started`,
    detail: `${italki.homework.task}. Due before your ${hm(italki.next.at)} lesson.`,
    due: italki.next.at, dueText: `before ${hm(italki.next.at)}`,
  },
  {
    id: 'reviews', src: 'wanikani', level: 'amber',
    title: `${wanikani.reviewsNow} WaniKani reviews are waiting`,
    detail: `${wanikani.later} more unlock by ${hm(wanikani.lastHour * 3600)}. Clear them this morning or ${wanikani.tonight} stack up tonight.`,
    due: wanikani.lastHour * 3600, dueText: `${wanikani.tonight} by ${hm(wanikani.lastHour * 3600)}`,
  },
];
flags.forEach((f) => {
  f.left = f.due - read;
  f.leftText = span(f.left) + ' left';
  f.share = f.left / (24 * 3600 - read); // share of the rest of the day still left before the deadline
});
export const ok = {
  src: 'anki',
  title: `Anki is on track: ${anki.due} cards due across ${anki.decks.length} decks`,
  detail: `${anki.retention}% retention this month and nothing overdue. About ${anki.min} min.`,
};

// The morning plan: the order that clears every flag, most urgent first.
export const plan = [
  { id: 'duolingo', what: `Duolingo, 1 lesson`, min: duolingo.lessonMin },
  { id: 'wanikani', what: `WaniKani, ${wanikani.reviewsNow} reviews`, min: wanikani.min },
  { id: 'anki', what: `Anki, ${anki.due} cards`, min: anki.min },
  { id: 'italki', what: `italki homework`, min: italki.homework.min },
];
const planMin = plan.reduce((t, s) => t + s.min, 0);

export const counts = {
  sources: accounts.length,
  flags: flags.length,
  due: anki.due + wanikani.reviewsNow,
  planMin,
  cardsRead: anki.cards,
  reviewsRead: wanikani.tonight,
  lessons: italki.lessons.length,
};

// The hub's preview rows: the morning plan, then the evening lesson.
export const items = [
  { img: './brand/duolingo.svg', title: 'Duolingo, 1 lesson', meta: `${duolingo.streak}-day streak, ${duolingo.xpToday} of ${duolingo.goal} XP, ends at midnight`, price: `${duolingo.lessonMin} min`, source: 'duolingo' },
  { img: './brand/wanikani.svg', title: `WaniKani, ${wanikani.reviewsNow} reviews`, meta: `Level ${wanikani.level}, ${wanikani.later} more by ${hm(wanikani.lastHour * 3600)}`, price: `${wanikani.min} min`, source: 'wanikani' },
  { img: './brand/anki.svg', title: `Anki, ${anki.due} cards`, meta: `${anki.decks.length} decks, ${anki.retention}% retention`, price: `${anki.min} min`, source: 'anki' },
  { img: './brand/italki.svg', title: 'italki homework', meta: `5 sentences with ~ている, before ${hm(italki.next.at)}`, price: `${italki.homework.min} min`, source: 'italki' },
  { img: './brand/italki.svg', title: `Lesson with ${italki.tutor}`, meta: `Today ${hm(italki.next.at)}, ${italki.next.what.toLowerCase()}`, price: `${italki.next.mins} min`, source: 'italki' },
];

// Every line of page copy that is not a record. Read-only in every word: read, checked, flagged, never done.
export const copy = {
  kicker: `Study overview · ${meta.date}`,
  h1: `${flags.length} things break today if they wait. A ${planMin} minute morning covers all of them.`,
  dek: `Read from Duolingo, AnkiWeb, WaniKani and italki at ${hm(meta.syncStart)}. Read-only: Superbot finished no lesson, reviewed no card, booked nothing and bought no streak freeze.`,
  syncing: 'Reading your study apps',
  stamp: `Read ${hm(meta.syncStart)} · ${accounts.length} apps, read-only`,
  checked: 'Streaks checked',
  flagsHead: `${flags.length} flags for today`,
  flagsSub: 'Streaks first, then what piles up. Times are today, in your time zone.',
  planHead: 'Morning plan',
  planLine: `${planMin} min · clears all ${flags.length} flags`,
  foot: `Read-only. Superbot reads ${accounts.map((a) => a.name).join(', ').replace(/, ([^,]*)$/, ' and $1')} each morning at ${hm(meta.syncStart)}. It does not study for you.`,
};

export default { meta, duolingo, anki, wanikani, italki, accounts, flags, ok, plan, counts, items, copy };
