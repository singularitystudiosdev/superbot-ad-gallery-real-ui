/* data.js - the numbers behind superbot.app/p/trip-wallet, "Trips".
   One read-only sync of five accounts (Gmail, United MileagePlus, Delta SkyMiles, Marriott Bonvoy, Airbnb)
   on Fri Oct 9 2026 at 1:40 PM ET: 25 records pulled, 14 of them a duplicate of a record another account
   already had (11 account records matched to their Gmail confirmation, plus 3 update emails: a seat change,
   a gate change and check-in instructions), leaving 11 bookings across 3 trips. Then the 7 loyalty
   balances, 2 of them expiring within 60 days (Fri Nov 30 and Tue Dec 8, 2026).
   Every figure the page, the hub and the steps print is derived here, so they never disagree: the pulled
   total is the sum of the five accounts, the duplicate count is pulled minus bookings, the trip, flight and
   stay counts are counted off the booking list, and each wallet row's days-left is computed from 'now'.
   Read-only: Superbot signed in and read. It never books, changes, cancels or redeems anything. */

const n0 = (n) => Number(n).toLocaleString('en-US');
export { n0 };

const pad = (n) => String(n).padStart(2, '0');
const SEC_DAY = 86400;
const MS_DAY = 86400000;

/* the clock the whole spot is measured from: Fri, Oct 9 2026, 1:40 PM ET */
const NOW_SECS = 13 * 3600 + 40 * 60;
const NOW_UTC = Date.UTC(2026, 9, 9);
/** whole days from 'now' (Fri, Oct 9 2026) to a calendar date; both sides are UTC so the gap is exact */
const daysTo = (y, m, d) => Math.round((Date.UTC(y, m, d) - NOW_UTC) / MS_DAY);
/** seconds -> "4 h 05 m" */
const hhmm = (secs) => {
  const s = Math.max(0, Math.round(secs)) % SEC_DAY;
  return `${Math.floor(s / 3600)} h ${pad(Math.floor((s % 3600) / 60))} m`;
};

export const meta = {
  user: 'sam.rivera',
  day: 'Fri, Oct 9',
  dayLong: 'Friday, October 9, 2026',
  now: NOW_SECS,
  nowText: 'Fri, Oct 9 2026, 1:40 PM ET',
  synced: '1:40 PM',
  windowStart: 'Fri, Oct 9, 2026',
  windowEnd: 'Tue, Dec 29, 2026',
  expiryWindow: 60,
  expiryMonths: 24,
  readOnly: 'Read-only. Nothing was booked, changed or cancelled.',
};

/* the five accounts the records came out of: what each one listed, and what survived the merge.
   Gmail holds the confirmation for every account record below, so nothing it listed is left after the
   merge; each other account keeps the bookings that only it knows about (3 + 3 + 3 + 2 = 11 bookings). */
export const accounts = [
  { id: 'gmail', name: 'Gmail', short: 'Gmail', what: 'confirmations', handle: 'sam.rivera@gmail.com', logo: './brand/gmail.svg', pulled: 14, kept: 0 },
  { id: 'united', name: 'United MileagePlus', short: 'United', what: 'flights', handle: 'MileagePlus, Premier Silver', logo: './brand/united.svg', pulled: 3, kept: 3 },
  { id: 'delta', name: 'Delta SkyMiles', short: 'Delta', what: 'flights', handle: 'SkyMiles, Silver Medallion', logo: './brand/delta.svg', pulled: 3, kept: 3 },
  { id: 'marriott', name: 'Marriott Bonvoy', short: 'Marriott', what: 'stays', handle: 'Bonvoy, Gold Elite', logo: './brand/marriott.svg', pulled: 3, kept: 3 },
  { id: 'airbnb', name: 'Airbnb', short: 'Airbnb', what: 'stays', handle: 'Trips and credits', logo: './brand/airbnb.svg', pulled: 2, kept: 2 },
];

const PULLED = accounts.reduce((a, s) => a + s.pulled, 0);      // 25
const BOOKINGS = accounts.reduce((a, s) => a + s.kept, 0);      // 11
const DUPES = PULLED - BOOKINGS;                                 // 14

/* the live flight the next-up card is built from: UA 64, Newark to Lisbon, Fri Oct 9 */
export const live = {
  key: 'ua64',
  week: 'Today, Fri, Oct 9',
  carrier: 'united',
  flight: 'UA 64',
  from: { code: 'EWR', city: 'Newark' },
  to: { code: 'LIS', city: 'Lisbon' },
  outTime: '5:45 PM',
  inTime: '5:25 AM',
  inDay: 'Sat, Oct 10',
  status: 'On time',
  terminal: 'C',
  gate: 'C71',
  boarding: '4:55 PM',
  seat: '24C',
  seatClass: 'Economy Plus',
  conf: 'K7Q2MX',
  departAt: 17 * 3600 + 45 * 60,     // Fri, Oct 9, 5:45 PM ET
};
export const departsIn = live.departAt - meta.now;   // 14,700 s = 4 h 05 m
export const countdown = hhmm(departsIn);

/* the seat map printed beside the boarding pass: UA 64's Economy Plus cabin around the booked seat */
export const seatmap = {
  title: 'Seat map',
  sub: `Rows 23 to 25, ${live.seatClass}`,
  band: live.seatClass,
  rows: [23, 24, 25],
  letters: ['A', 'B', 'C', 'D', 'E', 'F'],
  aisleAfter: 'C',
  picked: live.seat,                                   // 24C
  note: `Seat ${live.seat}, aisle, ${live.seatClass}`,
};

/* the three things that happen in the 72 hours after the live flight lands */
export const next72 = [
  { day: 'Sat, Oct 10', time: '5:25 AM', what: 'Land in Lisbon' },
  { day: 'Sat, Oct 10', time: '3:00 PM', what: 'Airbnb check-in, Alfama' },
  { day: 'Tue, Oct 13', time: '', what: 'Lisbon Marriott Hotel' },
];

/* the trips, one booking list each: [key, type, carrier, title, when, conf, seat or room, status, live] */
const TRIPS = [
  {
    key: 'lisbon', city: 'Lisbon', country: 'Portugal',
    dates: 'Fri, Oct 9 to Fri, Oct 16, 2026', nights: 7,
    note: 'UA 64 out, a week in Alfama and at the Marriott, DL 257 back',
    bookings: [
      ['ua64', 'flight', 'united', 'UA 64 · EWR to LIS', 'Fri, Oct 9, 5:45 PM to Sat, Oct 10, 5:25 AM', 'K7Q2MX', 'Seat 24C', live.status, true],
      ['alfama', 'stay', 'airbnb', 'River-view loft in Alfama', 'Sat, Oct 10, 3:00 PM to Tue, Oct 13, 11:00 AM', 'HMQ4D8ZKXT', '3 nights', 'Confirmed', false],
      ['lisbon-marriott', 'stay', 'marriott', 'Lisbon Marriott Hotel', 'Tue, Oct 13 to Fri, Oct 16, 2026', '84629173', 'Deluxe King', 'Confirmed', false],
      ['dl257', 'flight', 'delta', 'DL 257 · LIS to JFK', 'Fri, Oct 16, 11:35 AM to 2:40 PM', 'GHT4WQ', 'Seat 32A', 'Scheduled', false],
    ],
  },
  {
    key: 'chicago', city: 'Chicago', country: 'Illinois',
    dates: 'Thu, Nov 12 to Sat, Nov 14, 2026', nights: 2,
    note: 'Two United legs and the Mag Mile, a two night work trip',
    bookings: [
      ['ua1411', 'flight', 'united', 'UA 1411 · EWR to ORD', 'Thu, Nov 12, 7:00 AM to 8:35 AM', 'M2R8VT', 'Seat 9F', 'Scheduled', false],
      ['chicago-marriott', 'stay', 'marriott', 'Chicago Marriott Downtown Magnificent Mile', 'Thu, Nov 12 to Sat, Nov 14, 2026', '71935528', '2 nights', 'Confirmed', false],
      ['ua2280', 'flight', 'united', 'UA 2280 · ORD to EWR', 'Sat, Nov 14, 6:15 PM to 9:32 PM', 'M2R8VT', 'Seat 12A', 'Scheduled', false],
    ],
  },
  {
    key: 'maui', city: 'Maui', country: 'Hawaii',
    dates: 'Sat, Dec 19 to Tue, Dec 29, 2026', nights: 10,
    note: 'Both Delta legs run via a connection, the condo is in Kihei, the resort closes the trip',
    bookings: [
      ['dl405', 'flight', 'delta', 'DL 405 / DL 1832 · JFK to OGG', 'Sat, Dec 19, 7:05 AM to 4:10 PM, via LAX', 'H9ZL4P', 'Seats 27A, 31A', 'Scheduled', false],
      ['kihei', 'stay', 'airbnb', 'Ocean-view condo in Kihei', 'Sat, Dec 19 to Wed, Dec 23, 2026', 'HMX8C2RW4N', '4 nights', 'Confirmed', false],
      ['wailea', 'stay', 'marriott', 'Wailea Beach Resort, Maui', 'Wed, Dec 23 to Mon, Dec 28, 2026', '90417256', 'Ocean View King', 'Booked on points', false],
      ['dl1760', 'flight', 'delta', 'DL 1760 / DL 424 · OGG to JFK', 'Mon, Dec 28, 9:40 PM to Tue, Dec 29, 2:15 PM, via SEA', 'H9ZL4P', 'Seats 22C, 18D', 'Scheduled', false],
    ],
  },
];

export const accOf = (id) => accounts.find((a) => a.id === id) || accounts[0];

/* each booking, flat: the sources it was merged from are its own account plus the Gmail confirmation */
export const bookings = TRIPS.flatMap((t, ti) =>
  t.bookings.map(([key, type, carrier, title, when, conf, seat, status, isLive]) => ({
    key, type, carrier, title, when, conf, seat, status, live: !!isLive,
    trip: t.key, tripName: t.city, tripIndex: ti,
    glyph: type === 'flight' ? './brand/plane.svg' : './brand/hotel.svg',
    typeText: type === 'flight' ? 'Flight' : 'Stay',
    sources: ['gmail', carrier],
  })),
);

export const trips = TRIPS.map((t, i) => ({
  key: t.key, index: i, city: t.city, country: t.country, dates: t.dates, nights: t.nights, note: t.note,
  bookings: bookings.filter((b) => b.trip === t.key),
  flights: bookings.filter((b) => b.trip === t.key && b.type === 'flight').length,
  stays: bookings.filter((b) => b.trip === t.key && b.type === 'stay').length,
  sources: [...new Set(bookings.filter((b) => b.trip === t.key).flatMap((b) => b.sources))],
}));

/* the wallet: 7 balances, days-left computed from 'now'. flag = expires within the 60 day window.
   one row each: [key, account it was read from, program logo override, program, unit, what the thing is,
   value, the number as printed, status, the expiry sentence, days left, the expiry date, flagged].
   AAdvantage is read out of Gmail statements, but the balance is American's, so it carries its own mark. */
const WALLET = [
  ['united-miles', 'united', null, 'United MileagePlus', 'miles', 'miles', '84210', '84,210', 'Premier Silver', 'Miles don’t expire', null, 'No expiry', false],
  ['delta-miles', 'delta', null, 'Delta SkyMiles', 'miles', 'miles', '52780', '52,780', 'Silver Medallion', 'Miles don’t expire', null, 'No expiry', false],
  ['bonvoy', 'marriott', null, 'Marriott Bonvoy', 'points', 'points', '118400', '118,400', 'Gold Elite', 'Active through Oct 16, 2028', null, 'Oct 16, 2028', false],
  ['freenight', 'marriott', null, 'Marriott Free Night Award', 'certificate', 'certificate', 1, '1', 'Up to 35,000 pts', 'Expires Fri, Nov 30, 2026', daysTo(2026, 10, 30), 'Nov 30, 2026', true],
  ['aadvantage', 'gmail', './brand/american.svg', 'American AAdvantage', 'miles', 'miles', '12960', '12,960', 'Found in Gmail statements', 'Expires Tue, Dec 8, 2026', daysTo(2026, 11, 8), 'Dec 8, 2026', true],
  ['delta-ecredit', 'delta', null, 'Delta eCredit', 'usd', 'flight credit', '212.40', '$212.40', 'Flight credit', 'Expires Wed, Feb 3, 2027', daysTo(2027, 1, 3), 'Feb 3, 2027', false],
  ['airbnb-credit', 'airbnb', null, 'Airbnb travel credit', 'usd', 'travel credit', '75.00', '$75.00', 'Booking credit', 'Expires Fri, Jan 15, 2027', daysTo(2027, 0, 15), 'Jan 15, 2027', false],
];

/* what each balance is, what it is worth, and how it ends */
export const wallet = WALLET.map(([key, acct, ownLogo, program, unit, kind, value, balanceText, status, expires, days, dateText, flag]) => ({
  key, acct, program, unit, kind, value, balanceText, status, expires, days, dateText, flag,
  logo: ownLogo || accOf(acct).logo,
  soon: days != null ? `Expires in ${n0(days)} days` : 'No expiry date',
  bar: days != null ? Math.max(0, Math.min(100, (1 - days / 365) * 100)) : 100,
}));

const expiring = wallet.filter((w) => w.flag);
const soonest = expiring.slice().sort((a, b) => a.days - b.days)[0];

export const counts = {
  accounts: accounts.length,                                   // 5
  pulled: PULLED,                                              // 25
  dupes: DUPES,                                                // 14
  bookings: BOOKINGS,                                          // 11
  trips: trips.length,                                         // 3
  flights: bookings.filter((b) => b.type === 'flight').length,  // 6
  stays: bookings.filter((b) => b.type === 'stay').length,      // 5
  wallets: wallet.length,                                      // 7
  expiring: expiring.length,                                   // 2
  noExpiry: wallet.filter((w) => w.days == null).length,       // 3
  pointsStay: 85000,                                           // the 85,000 point Marriott stay on Maui
  gmailUpdates: 3,                                             // seat change, gate change, check-in instructions
};

/* prose about the page itself, printed in the sections above */
export const copy = {
  kicker: `Gmail + United + Delta + Marriott + Airbnb, synced ${meta.synced}`,
  heroH1: `Your next ${counts.trips} trips, in one place`,
  heroDek: `Superbot signed in to all ${counts.accounts} accounts, pulled ${counts.pulled} records, merged ${counts.dupes} duplicate confirmations into ${counts.bookings} bookings, and read ${counts.wallets} loyalty balances. Read-only, nothing was booked, changed or cancelled.`,
  syncNow: `Reading ${counts.accounts} accounts, read-only`,
  syncStamp: `Synced ${meta.day}, ${meta.synced}. ${meta.readOnly}`,
  liveTitle: 'Next up',
  liveDek: `The one booking with live status right now, read ${meta.day} at ${meta.synced}.`,
  timelineH: 'Trip timeline',
  timelineDek: `${counts.trips} trips, ${counts.bookings} bookings, ${counts.flights} flights and ${counts.stays} stays, Oct 9 to Dec 29.`,
  bookingsH: 'All bookings, one row each',
  bookingsDek: `The ${counts.bookings} bookings behind the timeline above. ${counts.dupes} duplicate confirmations collapsed into them.`,
  walletH: 'Miles and points',
  walletDek: `${counts.wallets} balances across ${counts.accounts} accounts, ${counts.expiring} expiring within ${meta.expiryWindow} days. Listed, never redeemed or transferred.`,
  walletNote: `${soonest.program} expires first, ${soonest.dateText}, ${soonest.days} days out. Superbot lists it, it does not move a single point.`,
  liveNote: `Flight status, gate and seat are shown as United reads them at ${meta.synced}. Nothing here checks in, rebooks or picks a seat.`,
  credit: 'Photo: Mike McBey, CC BY 2.0',
};

/* the hub's live card previews while the sync runs */
export const items = [
  { img: './brand/plane.svg', title: `${live.flight} · ${live.from.code} to ${live.to.code}`, price: `Seat ${live.seat}`, meta: `Fri, Oct 9, gate ${live.gate}, departs in ${countdown}`, source: live.carrier },
  { img: './brand/hotel.svg', title: 'River-view loft in Alfama', price: '3 nights', meta: 'Oct 10 to Oct 13, conf HMQ4D8ZKXT', source: 'airbnb' },
  { img: './brand/plane.svg', title: 'DL 257 · LIS to JFK', price: 'Seat 32A', meta: 'Fri, Oct 16, 11:35 AM, scheduled', source: 'delta' },
  { img: './brand/hotel.svg', title: 'Wailea Beach Resort, Maui', price: `${n0(counts.pointsStay)} pts`, meta: 'Dec 23 to Dec 28, booked on points', source: 'marriott' },
  { img: './brand/ticket.svg', title: 'Marriott Free Night Award', price: `${soonest.days} d`, meta: `Expires ${soonest.dateText}, flagged in the wallet`, source: 'marriott' },
];

/* the four tiles the page prints about the trip set: [kind, label, value, note] */
export const stats = [
  { key: 'bookings', label: 'Bookings', value: n0(counts.bookings), note: `${counts.trips} trips` },
  { key: 'balances', label: 'Balances', value: n0(counts.wallets), note: 'miles, points, credits' },
  { key: 'expiring', label: 'Expiring soon', value: n0(counts.expiring), note: `within ${meta.expiryWindow} days` },
  { key: 'clean', label: 'Duplicates merged', value: n0(counts.dupes), note: 'nothing left doubled' },
];