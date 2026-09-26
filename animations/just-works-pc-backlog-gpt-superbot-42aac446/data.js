/* data.js - the numbers behind superbot.app/p/pc-backlog, "Backlog".
   One read-only sync of three PC game libraries (Steam, Epic Games, GOG) on Fri Sep 25 at 8:42 PM:
   318 library entries pulled, the games owned on two stores merged into one row each, every unplayed
   game (under an hour played) matched to its HowLongToBeat main-story length and its Steam user-review
   score, then sorted shortest-and-best first; plus which Steam wishlist games are discounted today.
   Nothing is bought or installed. The user, the library sizes, the playtimes and today's prices are
   invented for the spot; the HowLongToBeat hours and review percentages are rounded approximations of
   the public figures. Every figure the page, the hub and the steps print is derived here, so they
   never disagree. */

export const meta = {
  user: 'dkessler',
  day: 'Fri, Sep 25',
  synced: '8:42 PM',
  // the clock the top bar prints: the sync starts at 8:41:37 PM and lands at 8:42:11 PM, 34 s in
  syncStart: 20 * 3600 + 41 * 60 + 37,
  syncSecs: 34,
  unplayedUnder: 60, // minutes: anything played for less counts as unplayed
  minReview: 85, // % positive: the "best" half of shortest-and-best
  resync: 'Every night, 3:00 AM',
};

export const stores = [
  { id: 'steam', name: 'Steam', handle: 'dkessler', logo: './brand/steam.svg', games: 214, hours: 2316, unplayed: 71 },
  { id: 'epic', name: 'Epic Games', handle: 'dkess', logo: './brand/epic.svg', games: 63, hours: 57, unplayed: 38 },
  { id: 'gog', name: 'GOG', handle: 'dkessler', logo: './brand/gog.svg', games: 41, hours: 188, unplayed: 23 },
];

/* the library, after the merge: raw entries minus the extra copy of every game owned twice */
const RAW_ENTRIES = stores.reduce((a, s) => a + s.games, 0);
const DUPES = 14;
const UNPLAYED = 118; // unique unplayed games, after the merge
const MATCHED = 112; // unplayed games HowLongToBeat has a main-story time for
const WISHLIST = 34;

/* games: [key, title, genre, stores, played minutes, HLTB main story h, Steam % positive] */
const GAMES = [
  ['short-hike', 'A Short Hike', 'Exploration', ['epic'], 0, 1.5, 98],
  ['edith-finch', 'What Remains of Edith Finch', 'Narrative', ['steam', 'epic'], 0, 2, 94],
  ['gris', 'Gris', 'Platformer', ['steam'], 0, 3.5, 96],
  ['inside', 'Inside', 'Puzzle platformer', ['epic', 'gog'], 0, 3.5, 94],
  ['firewatch', 'Firewatch', 'Narrative', ['steam', 'gog'], 12, 4, 89],
  ['celeste', 'Celeste', 'Platformer', ['epic'], 0, 8, 97],
  ['portal-2', 'Portal 2', 'Puzzle', ['steam'], 0, 8.5, 98],
  ['obra-dinn', 'Return of the Obra Dinn', 'Mystery', ['steam'], 25, 9, 96],
  ['control', 'Control', 'Action', ['epic', 'gog'], 0, 11.5, 88],
  ['outer-wilds', 'Outer Wilds', 'Exploration', ['steam'], 40, 17, 95],
  ['hades', 'Hades', 'Roguelike', ['steam'], 0, 22, 98],
  ['disco-elysium', 'Disco Elysium', 'RPG', ['steam', 'gog'], 0, 22, 91],
  ['hollow-knight', 'Hollow Knight', 'Metroidvania', ['steam', 'gog'], 0, 27, 97],
  ['subnautica', 'Subnautica', 'Survival', ['steam', 'epic'], 0, 30, 96],
  ['witcher-3', 'The Witcher 3: Wild Hunt', 'RPG', ['steam', 'gog'], 64 * 60 + 20, 51.5, 96],
];

const img = (key) => `./img/${key}.jpg`;

/** Steam's own label bands for a % positive score */
export function reviewLabel(pct) {
  if (pct >= 95) return 'Overwhelmingly Positive';
  if (pct >= 80) return 'Very Positive';
  if (pct >= 70) return 'Mostly Positive';
  return 'Mixed';
}

export const games = GAMES.map(([key, title, genre, owned, played, hours, review]) => ({
  key, title, genre, owned, played, hours, review, img: img(key), label: reviewLabel(review),
}));

/* the backlog: unplayed, well reviewed, shortest first (ties go to the better-reviewed game) */
export const backlog = games
  .filter((g) => g.played < meta.unplayedUnder && g.review >= meta.minReview)
  .sort((a, b) => a.hours - b.hours || b.review - a.review)
  .map((g, i) => ({ ...g, rank: i + 1 }));

/* games owned on two stores: one row each, playtime added up, home = the store it was played on
   (else the first store it was bought on) */
const PLAYED_ON = { 'witcher-3': 'gog', firewatch: 'steam' };
export const dupes = games
  .filter((g) => g.owned.length > 1)
  .map((g) => ({ ...g, home: PLAYED_ON[g.key] || g.owned[0] }));

/* the wishlist, discounted today: [key, title, was, now, HLTB main h, Steam %, all-time low?, ends] */
const SALE = [
  ['pentiment', 'Pentiment', 19.99, 9.99, 15, 91, true, 'Oct 1'],
  ['dave-the-diver', 'Dave the Diver', 19.99, 11.99, 29, 97, false, 'Sep 29'],
  ['balatro', 'Balatro', 14.99, 10.49, 12, 97, true, 'Oct 1'],
  ['clair-obscur', 'Clair Obscur: Expedition 33', 49.99, 37.49, 30, 96, true, 'Oct 6'],
  ['hades-2', 'Hades II', 29.99, 23.99, 28, 95, false, 'Sep 29'],
  ['silksong', 'Hollow Knight: Silksong', 19.99, 15.99, 40, 90, false, 'Oct 6'],
];

export const sales = SALE.map(([key, title, was, now, hours, review, low, ends]) => ({
  key, title, was, now, hours, review, low, ends, img: img(key), label: reviewLabel(review),
  off: Math.round((1 - now / was) * 100),
}));

const round2 = (n) => Math.round(n * 100) / 100;

export const counts = {
  stores: stores.length,
  entries: RAW_ENTRIES,
  dupes: DUPES,
  games: RAW_ENTRIES - DUPES,
  unplayed: UNPLAYED,
  matched: MATCHED,
  wishlist: WISHLIST,
  onSale: sales.length,
  saved: round2(sales.reduce((a, s) => a + s.was - s.now, 0)),
  hoursPlayed: stores.reduce((a, s) => a + s.hours, 0),
};

const hrs = (h) => (h % 1 ? h.toFixed(1) : String(h)) + ' h';
const top = backlog[0];
const SHORT = { steam: 'Steam', epic: 'Epic', gog: 'GOG' };
const best = sales[0];

/* the rows the hub's live card previews */
export const items = [
  ...backlog.slice(0, 4).map((g) => ({
    img: g.img,
    title: g.title,
    price: hrs(g.hours),
    meta: `${g.review}% positive, on ${g.owned.map((id) => SHORT[id]).join(' + ')}`,
    source: g.owned[0],
  })),
  { img: best.img, title: `${best.title}, -${best.off}%`, price: '$' + best.now.toFixed(2), meta: `On your wishlist, ${best.low ? 'lowest price ever' : 'ends ' + best.ends}`, source: 'steam' },
];

/* prose the page prints about its own numbers */
export const copy = {
  kicker: `Steam + Epic + GOG, synced ${meta.synced}`,
  heroH1: `You own ${counts.games} games. ${counts.unplayed} are unplayed. Start with ${top.title}.`,
  heroDek: `Superbot signed in to all three stores, pulled every game with its playtime, merged the ${counts.dupes} you own twice and matched each unplayed game to HowLongToBeat and its Steam reviews. Read-only, nothing was bought.`,
  dupesH: `${counts.dupes} games you own twice, now one row each`,
  dupesDek: 'Playtime from both copies is added up. The store you played on stays home.',
  backlogH: 'Your backlog, shortest and best first',
  backlogDek: `Never played (under 1 h), ${meta.minReview}%+ positive on Steam, sorted by HowLongToBeat main story.`,
  salesH: `On sale today, from your wishlist`,
  salesDek: `${counts.onSale} of ${counts.wishlist} wishlist games are discounted. Together you'd save $${counts.saved.toFixed(2)}.`,
  watchH: 'Keeps watching',
  watchDek: 'The next sync runs on its own. You hear about it only when something changes.',
};

/* what Superbot keeps an eye on after the sync */
export const watch = [
  { icon: 'clock', k: 'Re-sync', v: meta.resync, note: 'All three stores, read-only' },
  { icon: 'gift', k: 'Epic free game', v: 'Thursdays, 11:00 AM ET', note: 'Claimed, then slotted into the backlog' },
  { icon: 'tag', k: 'Wishlist drop', v: 'Any new sale or low', note: `${sales.filter((s) => s.low).length} at their lowest ever today` },
  { icon: 'list', k: 'Finished one?', v: 'Backlog re-sorts', note: `Up next after ${top.title}: ${backlog[1].title}` },
];
