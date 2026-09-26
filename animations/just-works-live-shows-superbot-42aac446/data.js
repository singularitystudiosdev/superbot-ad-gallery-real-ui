/* data.js - the numbers behind the "Spotify + Ticketmaster + AXS + Dice, one concert overview" spot.
   Invented but plausible: one listener (Jordan, Denver CO) on Saturday Sep 26 2026. Superbot reads the
   artists Jordan follows and plays most on Spotify, checks each of them against Ticketmaster, AXS, Dice,
   Bandsintown, Songkick and eleven local venue sites for shows within 50 miles through Mar 26 2027, merges
   the same show listed on several sites into one row, and cross-checks the Ticketmaster account for tickets
   already held. Read-only: nothing is bought, no presale is joined, no ticket is transferred.
   Every figure the hub, the steps and the page print is derived here, so the three always agree. */

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** [y, m, d] -> day number since 1970 (UTC), so weekdays and gaps are computed, never typed */
const dayNo = ([y, m, d]) => Math.round(Date.UTC(y, m - 1, d) / 86400000);
const dowOf = (ymd) => DOW[new Date(Date.UTC(ymd[0], ymd[1] - 1, ymd[2])).getUTCDay()];

/** seconds since midnight -> "9:14 AM" */
export function hm(sec) {
  const s = Math.max(0, Math.round(sec)) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}
/** "10 AM" for an on-the-hour time, "7:30 PM" otherwise */
export function hShort(sec) {
  const t = hm(sec);
  return t.replace(':00 ', ' ');
}
/** [y, m, d] -> "Sat Oct 17" */
export const dayText = (ymd) => `${dowOf(ymd)} ${MON[ymd[1] - 1]} ${ymd[2]}`;
/** [y, m, d] -> { dow: 'SAT', mon: 'OCT', d: 17 } for the date blocks */
export const dayParts = (ymd) => ({ dow: dowOf(ymd).toUpperCase(), mon: MON[ymd[1] - 1].toUpperCase(), d: ymd[2] });
export const dowText = dowOf;
/** "$49 to $72" */
export const priceText = (p) => (p[0] === p[1] ? `$${p[0]}` : `$${p[0]} to $${p[1]}`);

export const meta = {
  user: 'Jordan',
  city: 'Denver, CO',
  zip: '80205',
  today: [2026, 9, 26],
  until: [2027, 3, 26],
  radius: 50,
  syncStart: 9 * 3600 + 14 * 60 + 8, // 9:14:08 AM MT, Saturday
  syncSecs: 52,
};
meta.date = dayText(meta.today);
meta.untilText = `${MON[meta.until[1] - 1]} ${meta.until[2]}`;
meta.fromText = `${MON[meta.today[1] - 1]} ${meta.today[2]}`;
meta.window = `${meta.fromText} to ${meta.untilText}`;

// ---------- Spotify: the artists to check ----------
export const spotify = {
  followed: 64,
  top: 50, // top artists, short and medium term, merged
  overlap: 26, // in both lists
};
spotify.artists = spotify.followed + spotify.top - spotify.overlap; // 88 distinct

// ---------- the eleven venue sites read directly ----------
export const venues = [
  { id: 'redrocks', name: 'Red Rocks Amphitheatre', city: 'Morrison', mi: 15 },
  { id: 'mission', name: 'Mission Ballroom', city: 'Denver', mi: 3 },
  { id: 'fillmore', name: 'Fillmore Auditorium', city: 'Denver', mi: 2 },
  { id: 'ogden', name: 'Ogden Theatre', city: 'Denver', mi: 2 },
  { id: 'bluebird', name: 'Bluebird Theater', city: 'Denver', mi: 3 },
  { id: 'gothic', name: 'Gothic Theatre', city: 'Englewood', mi: 7 },
  { id: 'summit', name: 'Summit', city: 'Denver', mi: 1 },
  { id: 'bouldertheater', name: 'Boulder Theater', city: 'Boulder', mi: 27 },
  { id: 'fox', name: 'Fox Theatre', city: 'Boulder', mi: 28 },
  { id: 'ball', name: 'Ball Arena', city: 'Denver', mi: 2 },
  { id: 'levitt', name: 'Levitt Pavilion', city: 'Denver', mi: 5 },
];
export const venueOf = (id) => venues.find((v) => v.id === id);

// ---------- the ticket sellers and listing sites (logos under ./brand, fixed names) ----------
export const sellers = {
  ticketmaster: { name: 'Ticketmaster', logo: './brand/ticketmaster.svg' },
  axs: { name: 'AXS', logo: './brand/axs.svg' },
  dice: { name: 'Dice', logo: './brand/dice.svg' },
  bandsintown: { name: 'Bandsintown', logo: './brand/bandsintown.svg' },
  songkick: { name: 'Songkick', logo: './brand/songkick.svg' },
  venue: { name: 'Venue site', logo: './brand/venues.svg' },
};

/* The shows, one row each after the merge. `on` is every site the same show was listed on (the seller is
   always one of them). Status:
   have     tickets already in the Ticketmaster account (section, row, qty), cross-checked by order
   presale  a presale opens this week: when, which kind, where the code comes from
   announced  announced, public on-sale this week, no presale
   onsale   on sale now
   soldout  sold out at face value, cheapest resale listing read off the seller's own resale page
   `price` is the current range per ticket incl. fees; `at` the show's door-to-stage start time. */
const RAW = [
  { artist: 'Khruangbin', date: [2026, 9, 30], at: 19 * 3600, venue: 'redrocks', seller: 'axs', on: ['axs', 'bandsintown', 'songkick', 'venue'], price: [69, 129], status: 'soldout', resale: 118, why: 'followed' },
  { artist: 'Fontaines D.C.', date: [2026, 10, 3], at: 20 * 3600, venue: 'ogden', seller: 'axs', on: ['axs', 'bandsintown', 'songkick', 'venue'], price: [49, 72], status: 'onsale', why: 'top' },
  { artist: 'MJ Lenderman', date: [2026, 10, 8], at: 20 * 3600, venue: 'gothic', seller: 'axs', on: ['axs', 'dice', 'bandsintown', 'songkick'], price: [38, 52], status: 'onsale', why: 'top' },
  { artist: 'Japanese Breakfast', date: [2026, 10, 17], at: 20 * 3600, venue: 'fillmore', seller: 'ticketmaster', on: ['ticketmaster', 'bandsintown', 'songkick', 'venue'], price: [55, 84], status: 'have', seat: 'GA Floor', qty: 2, order: '4821', why: 'followed' },
  { artist: 'Turnstile', date: [2026, 10, 23], at: 19 * 3600 + 30 * 60, venue: 'mission', seller: 'axs', on: ['axs', 'bandsintown', 'songkick', 'venue'], price: [54, 78], status: 'soldout', resale: 96, why: 'followed' },
  { artist: 'Wet Leg', date: [2026, 11, 7], at: 20 * 3600, venue: 'bouldertheater', seller: 'venue', on: ['venue', 'bandsintown', 'songkick'], price: [45, 65], status: 'onsale', why: 'top' },
  { artist: 'Mk.gee', date: [2026, 11, 13], at: 20 * 3600, venue: 'fox', seller: 'dice', on: ['dice', 'bandsintown', 'songkick'], price: [35, 48], status: 'presale', pre: { date: [2026, 9, 29], at: 10 * 3600, kind: 'Artist presale', code: 'Code from the Mk.gee mailing list' }, sale: { date: [2026, 10, 2], at: 10 * 3600 }, why: 'top' },
  { artist: 'Big Thief', date: [2026, 11, 19], at: 20 * 3600, venue: 'mission', seller: 'axs', on: ['axs', 'bandsintown', 'songkick', 'venue'], price: [52, 79], status: 'presale', pre: { date: [2026, 9, 30], at: 10 * 3600, kind: 'Spotify fan presale', code: 'Code by Spotify email, Tue night' }, sale: { date: [2026, 10, 2], at: 10 * 3600 }, why: 'followed' },
  { artist: 'Fred again..', date: [2026, 12, 5], at: 19 * 3600 + 30 * 60, venue: 'ball', seller: 'ticketmaster', on: ['ticketmaster', 'bandsintown', 'songkick', 'venue'], price: [89, 245], status: 'have', seat: 'Sec 118 · Row 9', qty: 2, order: '7730', why: 'top' },
  { artist: 'Jamie xx', date: [2026, 12, 11], at: 21 * 3600, venue: 'fillmore', seller: 'ticketmaster', on: ['ticketmaster', 'bandsintown', 'venue'], price: [62, 95], status: 'presale', pre: { date: [2026, 10, 1], at: 10 * 3600, kind: 'Venue presale', code: 'Code in the Fillmore newsletter' }, sale: { date: [2026, 10, 2], at: 10 * 3600 }, why: 'followed' },
  { artist: 'Clairo', date: [2027, 1, 16], at: 20 * 3600, venue: 'mission', seller: 'axs', on: ['axs', 'bandsintown', 'songkick', 'venue'], price: [59, 95], status: 'onsale', why: 'top' },
  { artist: 'Hozier', date: [2027, 1, 29], at: 19 * 3600 + 30 * 60, venue: 'ball', seller: 'ticketmaster', on: ['ticketmaster', 'bandsintown', 'songkick', 'venue'], price: [65, 189], status: 'announced', sale: { date: [2026, 10, 2], at: 10 * 3600 }, why: 'followed' },
  { artist: 'Tyler Childers', date: [2027, 2, 20], at: 19 * 3600 + 30 * 60, venue: 'ball', seller: 'ticketmaster', on: ['ticketmaster', 'bandsintown', 'songkick', 'venue'], price: [79, 199], status: 'have', seat: 'Sec 226 · Row 3', qty: 2, order: '1094', why: 'top' },
  { artist: 'Mitski', date: [2027, 3, 12], at: 20 * 3600, venue: 'fillmore', seller: 'ticketmaster', on: ['ticketmaster', 'bandsintown', 'songkick', 'venue'], price: [68, 110], status: 'onsale', why: 'followed' },
];

const today = dayNo(meta.today);
const nowSec = meta.syncStart;
/** seconds from the read (Sat 9:14 AM) to [date, at] */
const secsUntil = (ymd, at) => (dayNo(ymd) - today) * 86400 + at - nowSec;

export const shows = RAW
  .slice()
  .sort((a, b) => dayNo(a.date) - dayNo(b.date))
  .map((s, i) => {
    const v = venueOf(s.venue);
    const out = { ...s, n: i + 1, v, day: dayText(s.date), parts: dayParts(s.date), inDays: dayNo(s.date) - today, sellerName: sellers[s.seller].name };
    if (s.pre) {
      out.pre = { ...s.pre, day: dayText(s.pre.date), dow: dowOf(s.pre.date), secs: secsUntil(s.pre.date, s.pre.at) };
    }
    if (s.sale) out.sale = { ...s.sale, day: dayText(s.sale.date), dow: dowOf(s.sale.date), secs: secsUntil(s.sale.date, s.sale.at) };
    return out;
  });

/* the status chip each row prints, derived from the row */
export function chipOf(s) {
  if (s.status === 'have') return { k: 'have', text: `You have tickets · ${s.qty}` };
  if (s.status === 'presale') return { k: 'presale', text: `Presale ${s.pre.dow} ${hShort(s.pre.at)}` };
  if (s.status === 'announced') return { k: 'announced', text: `Announced, on sale ${s.sale.dow}` };
  if (s.status === 'soldout') return { k: 'soldout', text: `Sold out · resale from $${s.resale}` };
  return { k: 'onsale', text: 'On sale' };
}
for (const s of shows) s.chip = chipOf(s);

export const held = shows.filter((s) => s.status === 'have');
export const presales = shows.filter((s) => s.status === 'presale').sort((a, b) => a.pre.secs - b.pre.secs);
export const nextShow = held[0];

// ---------- listings per source, before and after the merge ----------
const listed = (id) => shows.filter((s) => s.on.includes(id)).length;
export const listings = {
  ticketmaster: listed('ticketmaster'),
  axs: listed('axs'),
  dice: listed('dice'),
  bandsintown: listed('bandsintown'),
  songkick: listed('songkick'),
  venue: listed('venue'),
};
const nListings = Object.values(listings).reduce((a, b) => a + b, 0);

// shows the sites listed that were left out, so the list is exactly the ask
export const skipped = {
  farther: [
    { artist: 'Big Thief', where: 'Aggie Theatre, Fort Collins', mi: 58 },
    { artist: 'Wet Leg', where: 'Washington\'s, Fort Collins', mi: 59 },
    { artist: 'Turnstile', where: 'Ford Amphitheater, Colorado Springs', mi: 67 },
  ],
  later: [
    { artist: 'Khruangbin', when: 'Jun 2027, Red Rocks' },
    { artist: 'Japanese Breakfast', when: 'May 2027, Red Rocks' },
  ],
};

// ---------- the months (the "By month" panel) ----------
export const months = [];
{
  let [y, m] = meta.today;
  for (;;) {
    const list = shows.filter((s) => s.date[0] === y && s.date[1] === m);
    months.push({ key: `${y}-${m}`, mon: MON[m - 1], y, shows: list });
    if (y === meta.until[0] && m === meta.until[1]) break;
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
}

export const counts = {
  artists: spotify.artists,
  sources: 6, // Ticketmaster, AXS, Dice, Bandsintown, Songkick, venue sites
  venueSites: venues.length,
  listings: nListings,
  shows: shows.length,
  merged: nListings - shows.length,
  held: held.length,
  tickets: held.reduce((a, s) => a + s.qty, 0),
  presales: presales.length,
  soldout: shows.filter((s) => s.status === 'soldout').length,
  onsale: shows.filter((s) => s.status === 'onsale').length,
  announced: shows.filter((s) => s.status === 'announced').length,
  farther: skipped.farther.length,
  later: skipped.later.length,
  cities: [...new Set(shows.map((s) => s.v.city))].length,
  bought: 0,
  joined: 0,
};

// Where Superbot reads from, each read-only. `pulled` is what the hub's chat counts up beside each source.
export const accounts = [
  { id: 'spotify', name: 'Spotify', logo: './brand/spotify.svg', pulled: spotify.artists, what: 'artists', line: `${spotify.followed} followed · top ${spotify.top} played` },
  { id: 'ticketmaster', name: 'Ticketmaster', logo: './brand/ticketmaster.svg', pulled: listings.ticketmaster, what: 'shows', line: `plus your ${held.length} orders` },
  { id: 'axs', name: 'AXS', logo: './brand/axs.svg', pulled: listings.axs, what: 'shows', line: 'Mission, Ogden, Gothic' },
  { id: 'dice', name: 'Dice', logo: './brand/dice.svg', pulled: listings.dice, what: 'shows', line: 'Fox, Gothic' },
  { id: 'bandsintown', name: 'Bandsintown', logo: './brand/bandsintown.svg', pulled: listings.bandsintown, what: 'shows', line: `${meta.radius} mi of ${meta.zip}` },
  { id: 'songkick', name: 'Songkick', logo: './brand/songkick.svg', pulled: listings.songkick, what: 'shows', line: `through ${meta.untilText}` },
  { id: 'venues', name: 'Local venue sites', logo: './brand/venues.svg', pulled: venues.length, what: 'sites', line: 'Red Rocks to Fox Theatre' },
];
export const accOf = (id) => accounts.find((a) => a.id === id);

// the hub's preview rows: the three presales this week, then the next two shows you hold tickets for
export const items = [
  ...presales.map((s) => ({ img: sellers[s.seller].logo, title: s.artist, meta: `${s.day} · ${s.v.name}`, price: `${s.pre.dow} ${hShort(s.pre.at)}`, source: s.seller })),
  ...held.slice(0, 2).map((s) => ({ img: sellers[s.seller].logo, title: s.artist, meta: `${s.day} · ${s.v.name}`, price: `You have ${s.qty}`, source: s.seller })),
];

const list = (xs) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

export const copy = {
  kicker: `Concert overview · ${meta.city} · ${meta.radius} mi · ${meta.window}`,
  h1: `${counts.shows} shows by artists you play, ${counts.presales} presales open this week.`,
  dek: `${counts.artists} Spotify artists checked against Ticketmaster, AXS, Dice, Bandsintown, Songkick and ${counts.venueSites} venue sites. ${counts.listings} listings merged into ${counts.shows} shows, and your tickets for ${counts.held} of them found in Ticketmaster. Read-only: nothing bought, no presale joined.`,
  syncing: 'Checking your artists',
  stamp: `Checked ${hm(meta.syncStart)} · ${accounts.length} sources, read-only`,
  matched: 'Shows matched',
  preHead: `Next up: ${counts.presales} presales this week`,
  preSub: `Countdowns from now, ${meta.date}, ${hm(meta.syncStart)}. Times are Mountain. Superbot joins no queue.`,
  listHead: `All ${counts.shows} shows, by date`,
  listSub: `Within ${meta.radius} mi of Denver, ${meta.window}. The same show on several sites is one row.`,
  sumHead: 'How the list was checked',
  sumLine: `${counts.listings} listings · ${counts.merged} duplicates merged · ${counts.shows} shows`,
  foot: `Nothing bought. ${counts.bought} tickets purchased, ${counts.joined} presales joined.`,
  footNote: `Read-only: ${list(accounts.map((a) => (a.id === 'venues' ? `${venues.length} local venue sites` : a.name)))}.`,
};

export default { meta, spotify, venues, sellers, shows, held, presales, nextShow, listings, skipped, months, counts, accounts, items, copy };
