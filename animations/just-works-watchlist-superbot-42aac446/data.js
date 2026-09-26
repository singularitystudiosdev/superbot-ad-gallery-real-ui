/* data.js - the numbers behind superbot.app/p/watchlist, "Watchlist".
   One read-only sync on Sat Sep 26 at 9:12 PM for a viewer with three watchlists (Letterboxd, IMDb and Trakt)
   and five streaming subscriptions (Netflix, Max, Prime Video, Hulu and Disney+). The three lists hold 283
   entries; 63 titles sit on two of the lists and 3 on all three, so they fold into 214 distinct titles. Each
   of those was looked up on each of the five services: 1,070 checks. That leaves one watchlist overview of 214
   titles: 116 streaming now on a plan you pay for (Netflix 47, Max 38, Prime Video 31), 61 you can only rent or
   buy, and 37 not on any of your plans. 9 of the 116 leave their service by Sep 30. Two subscriptions carry
   nothing only they stream: Disney+ has none of the 214, and Hulu's 6 are all also on a plan you keep. Together
   they bill $37.98 a month.
   The person, the watchlists and the leaving dates are invented for the spot; Letterboxd, IMDb, Trakt, Netflix,
   Max, Prime Video, Hulu, Disney+ and Apple TV+ are the real services named, the titles are real films and
   series, and the plan prices are the US list prices of those plans. Every figure the page, the hub and the
   steps print is derived here, so they never disagree. Nothing here cancels, adds, rates or changes anything. */

const n0 = (n) => Number(n).toLocaleString('en-US');
const usd = (n) => '$' + n.toFixed(2);
export { n0, usd };

export const meta = {
  user: 'Jordan',
  day: 'Sat, Sep 26',
  synced: 'Sat 9:12 PM',
  syncStart: 21 * 3600 + 12 * 60 + 4, // 9:12:04 PM, seconds since midnight
  syncSecs: 43,
  region: 'US',
  cutoff: 'Sep 30',
};

/* the eight places the sync read: three watchlists (entries pulled) and five services (titles checked) */
const LISTS = [
  ['letterboxd', 'Letterboxd', 'Letterboxd', 'watchlist', '@jordanwatches', './brand/letterboxd.svg', 131],
  ['imdb', 'IMDb', 'IMDb', 'watchlist', 'Jordan R.', './brand/imdb.svg', 88],
  ['trakt', 'Trakt', 'Trakt', 'watchlist', 'jordanr', './brand/trakt.svg', 64],
];
/* [id, name, short, plan, logo, monthly price] */
const SERVICES = [
  ['netflix', 'Netflix', 'Netflix', 'Standard', './brand/netflix.svg', 17.99],
  ['max', 'Max', 'Max', 'Ad-Free', './brand/max.svg', 16.99],
  ['primevideo', 'Prime Video', 'Prime', 'with Prime', './brand/primevideo.svg', 14.99],
  ['hulu', 'Hulu', 'Hulu', 'No Ads', './brand/hulu.svg', 18.99],
  ['disneyplus', 'Disney+', 'Disney+', 'Premium', './brand/disneyplus.svg', 18.99],
];

/* how the lists overlap: titles on exactly two lists, and on all three */
export const overlap = { onTwo: 63, onThree: 3 };

const entries = LISTS.reduce((a, l) => a + l[6], 0);
const dupes = overlap.onTwo + overlap.onThree * 2;
const titles = entries - dupes;

/* where each of the distinct titles lands after the checks: the service to watch it on (a title on two plans
   counts once, on the plan it was found on first), rent or buy only, or on none of your plans */
const WHERE = { netflix: 47, max: 38, primevideo: 31, hulu: 0, disneyplus: 0 };
const RENT = 61;
const NONE = 37;
/* titles each service carries at all, including ones also on another plan */
const CARRIES = { netflix: 52, max: 44, primevideo: 36, hulu: 6, disneyplus: 0 };

export const lists = LISTS.map(([id, name, short, what, handle, logo, pulled]) => ({ id, name, short, what, handle, logo, pulled, kind: 'list' }));
export const services = SERVICES.map(([id, name, short, plan, logo, price]) => ({
  id, name, short, plan, logo, price, kind: 'service',
  what: 'titles checked',
  pulled: titles,
  only: WHERE[id],
  carries: CARRIES[id],
}));

/* every source the hub and the page's sync card list, in sync order */
export const accounts = [
  ...lists.map((l) => ({ ...l, what: `${l.what} entries`, note: `${n0(l.pulled)} entries` })),
  ...services.map((s) => ({ ...s, note: `${s.plan}, ${usd(s.price)}/mo` })),
];
export const accOf = (id) => accounts.find((a) => a.id === id);

/* the 9 titles leaving their service by the cutoff */
const LEAVING = [
  ['past-lives', 'Past Lives', 2023, 'netflix', 'Sep 30'],
  ['aftersun', 'Aftersun', 2022, 'netflix', 'Sep 30'],
  ['the-power-of-the-dog', 'The Power of the Dog', 2021, 'netflix', 'Sep 28'],
  ['roma', 'Roma', 2018, 'netflix', 'Sep 30'],
  ['dune-part-two', 'Dune: Part Two', 2024, 'max', 'Sep 30'],
  ['the-iron-claw', 'The Iron Claw', 2023, 'max', 'Sep 29'],
  ['priscilla', 'Priscilla', 2023, 'max', 'Sep 30'],
  ['the-holdovers', 'The Holdovers', 2023, 'primevideo', 'Sep 30'],
  ['saltburn', 'Saltburn', 2023, 'primevideo', 'Sep 30'],
];
export const leaving = LEAVING.map(([key, title, year, at, date]) => ({ key, title, year, at, date, service: accOf(at).name }));
export const leavingBy = (id) => leaving.filter((l) => l.at === id).length;

/* the nine posters on the page: a slice of the 214, one per kind of answer */
const SHELF = [
  ['past-lives', 'Past Lives', 2023, 'Film', 'netflix', 'leaving', 'On Netflix', 'Leaves Sep 30'],
  ['the-zone-of-interest', 'The Zone of Interest', 2023, 'Film', 'max', 'stream', 'On Max', 'Included in your plan'],
  ['anora', 'Anora', 2024, 'Film', 'max', 'stream', 'On Max', 'Included in your plan'],
  ['the-holdovers', 'The Holdovers', 2023, 'Film', 'primevideo', 'leaving', 'On Prime Video', 'Leaves Sep 30'],
  ['challengers', 'Challengers', 2024, 'Film', 'primevideo', 'stream', 'On Prime Video', 'Included in your plan'],
  ['aftersun', 'Aftersun', 2022, 'Film', 'netflix', 'leaving', 'On Netflix', 'Leaves Sep 30'],
  ['dune-part-two', 'Dune: Part Two', 2024, 'Film', 'max', 'leaving', 'On Max', 'Leaves Sep 30'],
  ['perfect-days', 'Perfect Days', 2023, 'Film', null, 'rent', 'Rent $3.99', 'Not on your plans'],
  ['severance', 'Severance', 2022, 'Series', null, 'none', 'Apple TV+', 'Not on your plans'],
];
export const shelf = SHELF.map(([key, title, year, type, at, kind, figure, note]) => ({
  key, title, year, type, at, kind, figure, note, poster: `./img/posters/${key}.jpg`,
}));

const monthlyIdle = Math.round(services.filter((s) => s.only === 0).reduce((a, s) => a + s.price, 0) * 100) / 100;
export const counts = {
  lists: lists.length,
  services: services.length,
  sources: accounts.length,
  entries,
  dupes,
  titles,
  checks: titles * services.length,
  rows: entries + titles * services.length,
  streaming: WHERE.netflix + WHERE.max + WHERE.primevideo + WHERE.hulu + WHERE.disneyplus,
  leaving: leaving.length,
  rent: RENT,
  none: NONE,
  idle: services.filter((s) => s.only === 0).length,
  idleMonthly: monthlyIdle,
  idleYearly: monthlyIdle * 12,
  monthly: Math.round(services.reduce((a, s) => a + s.price, 0) * 100) / 100,
};
if (counts.streaming + counts.rent + counts.none !== counts.titles) throw new Error('watchlist buckets do not add up');

/* the four tiles under the hero */
export const flags = [
  { kind: 'stream', icon: 'play', label: 'Streaming now', n: counts.streaming, more: `Across ${services.filter((s) => s.only > 0).length} of your ${counts.services} plans`, rule: 'On a plan you already pay for', examples: services.filter((s) => s.only > 0).map((s) => ({ name: s.name, v: n0(s.only) })) },
  { kind: 'leaving', icon: 'hourglass', label: `Leaving by ${meta.cutoff}`, n: counts.leaving, more: `${leaving.slice(0, 2).map((l) => l.title).join(', ')} and ${n0(counts.leaving - 2)} more`, rule: 'Watch these first', examples: services.filter((s) => leavingBy(s.id) > 0).map((s) => ({ name: s.name, v: n0(leavingBy(s.id)) })) },
  { kind: 'rent', icon: 'ticket', label: 'Rent or buy', n: counts.rent, more: `and ${n0(counts.rent - 2)} more`, rule: 'Not included on any plan', examples: [{ name: 'Perfect Days', v: '$3.99' }, { name: 'The Brutalist', v: '$5.99' }] },
  { kind: 'idle', icon: 'wallet', label: 'Idle subscriptions', n: counts.idle, more: `${usd(counts.idleYearly)} a year`, rule: `${usd(counts.idleMonthly)}/mo for nothing only they stream`, examples: services.filter((s) => s.only === 0).map((s) => ({ name: s.name, v: `${usd(s.price)}/mo` })) },
];

/* tab 1, "By service": each group with a few of its titles */
export const groups = [
  ...services.filter((s) => s.only > 0).map((s) => ({
    id: s.id, name: s.name, logo: s.logo, n: s.only,
    note: `${n0(leavingBy(s.id))} leaving by ${meta.cutoff}`,
    titles: {
      netflix: ['Past Lives', 'Aftersun', 'Roma', 'Society of the Snow'],
      max: ['Dune: Part Two', 'The Zone of Interest', 'Anora', 'Poor Things'],
      primevideo: ['The Holdovers', 'Challengers', 'Saltburn', 'American Fiction'],
    }[s.id],
  })),
  { id: 'rent', name: 'Rent or buy', logo: './brand/title.svg', n: counts.rent, note: 'From $3.99 to rent', titles: ['Perfect Days', 'The Brutalist', 'Conclave', 'Fallen Leaves'] },
  { id: 'none', name: 'Not on your plans', logo: './brand/title.svg', n: counts.none, note: 'Apple TV+ has 9 of them', titles: ['Severance', 'Killers of the Flower Moon', 'Slow Horses', 'Shrinking'] },
];

/* tab 2, "Subscriptions": what each plan carries from the list, and what only it carries */
export const subs = services.map((s) => ({
  id: s.id, name: s.name, logo: s.logo, plan: s.plan, price: s.price, carries: s.carries, only: s.only,
  idle: s.only === 0,
  reason: s.only > 0
    ? `${n0(s.only)} titles you can watch here${leavingBy(s.id) ? `, ${n0(leavingBy(s.id))} leaving by ${meta.cutoff}` : ''}`
    : s.carries === 0
      ? `None of your ${n0(titles)} titles are on it`
      : `All ${n0(s.carries)} of its titles are also on Netflix, Max or Prime Video`,
}));

/* the rows the hub's live card previews while the sync runs */
export const items = [
  { img: './img/posters/past-lives.jpg', title: 'Past Lives', price: 'Leaves Sep 30', meta: 'On Netflix, on 2 of your lists', source: 'netflix' },
  { img: './img/posters/dune-part-two.jpg', title: 'Dune: Part Two', price: 'Leaves Sep 30', meta: 'On Max, included in your plan', source: 'max' },
  { img: './img/posters/challengers.jpg', title: 'Challengers', price: 'On Prime', meta: 'Included with Prime Video', source: 'primevideo' },
  { img: './img/posters/perfect-days.jpg', title: 'Perfect Days', price: 'Rent $3.99', meta: 'Not on any of your plans', source: 'letterboxd' },
  { img: './img/posters/severance.jpg', title: 'Severance', price: 'Apple TV+', meta: 'Series, not on your plans', source: 'trakt' },
];

/* prose the page prints about its own numbers */
export const copy = {
  kicker: `Letterboxd + IMDb + Trakt, checked on ${counts.services} services, synced ${meta.synced}`,
  heroH1: `${n0(counts.titles)} titles to watch, ${n0(counts.checks)} checks, one watchlist.`,
  heroDek: `Superbot read your Letterboxd, IMDb and Trakt watchlists, folded the ${n0(counts.entries)} entries into ${n0(counts.titles)} titles, and looked each one up on Netflix, Max, Prime Video, Hulu and Disney+. Read-only: nothing was added, rated, removed or changed.`,
  flagsH: `Where the ${n0(counts.titles)} titles stand`,
  flagsDek: `${n0(counts.checks)} checks across ${counts.services} services, ${meta.region} catalog, ${meta.day}.`,
  shelfH: 'From your watchlist',
  shelfDek: `Nine of the ${n0(counts.titles)}: what they are on tonight, and ${n0(counts.leaving)} that leave their service by ${meta.cutoff}.`,
  tabsH: 'The whole list, two ways',
  tabsDek: `By service, or by what each subscription carries from your list. ${usd(counts.monthly)}/mo across ${counts.services} plans.`,
  leavingNote: `${n0(counts.leaving)} titles leave by ${meta.cutoff}: ${leaving.slice(0, 3).map((l) => l.title).join(', ')} and ${n0(counts.leaving - 3)} more.`,
  subsNote: `Disney+ and Hulu carry nothing only they stream: ${usd(counts.idleMonthly)} a month, ${usd(counts.idleYearly)} a year.`,
  byServiceH: `Every title, where it streams`,
  byServiceDek: `Each of the ${n0(titles)} titles counted once, on the first plan it was found on.`,
  byServiceNote: `${n0(counts.streaming)} + ${n0(counts.rent)} + ${n0(counts.none)} = ${n0(counts.titles)} titles. ${n0(dupes)} duplicate entries across the three lists were folded before the checks.`,
  subsH: `Your ${counts.services} subscriptions against the list`,
  subsDek: `${usd(counts.monthly)}/mo in total. "Only here" counts titles no other plan of yours carries.`,
  subsFoot: 'Read-only. Superbot looked at what each plan carries and changed nothing on any account.',
  leavingH: `Leaving by ${meta.cutoff}`,
  leavingDek: 'Read straight off each service. Watch these first.',
};
