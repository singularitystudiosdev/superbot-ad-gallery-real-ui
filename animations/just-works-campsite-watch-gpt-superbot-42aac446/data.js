/* data.js - the numbers behind superbot.app/p/campsite-watch, "Site Watch".
   One watch on Recreation.gov: Upper Pines Campground, Yosemite Valley, Jul 3 to 6 (3 nights), checked
   every 60 s from Jun 14, 7:10 PM until a cancellation freed Site 042 on Jun 21 at 5:52 AM. Real facts
   (verified on recreation.gov and listed in CREDITS.txt): Upper Pines is campground 232447, $36 a night,
   an $8 online reservation fee, and a cart holds a site for 15 minutes. The user, the other openings, the
   card and the confirmation number are invented for the spot. Every count the page prints comes from
   here, so the hub, the page and the steps never disagree. */

export const meta = {
  user: 'maya.hikes',
  email: 'maya@hikesmail.com',
  since: 'Jun 14, 7:10 PM',
  bookedDay: 'Jun 21',
  booked: '5:52 AM',
  // the 15-minute cart hold: it starts at 5:52:14 AM and checkout lands at 5:52:56 AM, 42 s in
  holdSecs: 15 * 60,
  holdStart: 5 * 3600 + 52 * 60 + 14,
  holdUsed: 42,
  synced: 'Checking Recreation.gov every 60 s',
  done: 'Reserved, still watching 3 backups',
};

export const counts = {
  checks: 9282,
  openings: 6,
  skipped: 5,
  booked: 1,
  fields: 7,
  backups: 3,
  every: 60,
};

/* the stay the hero card and the Reservation panel print */
export const stay = {
  img: './img/pines.jpg',
  campground: 'Upper Pines',
  park: 'Yosemite National Park',
  area: 'Yosemite Valley, CA',
  id: '232447',
  site: '042',
  loop: 'Loop A',
  type: 'Standard nonelectric, tent',
  people: 6,
  vehicles: 1,
  arrive: 'Fri, Jul 3',
  leave: 'Mon, Jul 6',
  nights: 3,
  nightly: 36,
  fee: 8,
  total: 116,
  card: 'Visa ending 4417',
  number: '0719402861-1',
  elevation: '4,000 ft',
  amenities: ['Picnic table', 'Fire ring', 'Food storage locker', 'Flush toilets nearby'],
};

/* every Upper Pines opening that overlapped the dates, and why it was passed over.
   The last row covers all three nights and is the one booked (the hover target). */
export const log = [
  { day: 'Jun 15', time: '9:41 PM', site: '118', nights: 'Jul 4 to 5', kind: 'Tent', result: 'Skipped, 1 of 3 nights' },
  { day: 'Jun 17', time: '6:03 AM', site: '205', nights: 'Jul 3 to 6', kind: 'RV only', result: 'Skipped, RV-only site' },
  { day: 'Jun 18', time: '12:17 PM', site: '067', nights: 'Jul 3 to 5', kind: 'Tent', result: 'Skipped, 2 of 3 nights' },
  { day: 'Jun 19', time: '7:30 AM', site: '151', nights: 'Jul 3 to 6', kind: 'Tent, 2 people', result: 'Skipped, sleeps 2, you are 4' },
  { day: 'Jun 20', time: '11:58 PM', site: '009', nights: 'Jul 5 to 6', kind: 'Tent', result: 'Skipped, 1 of 3 nights' },
  { day: 'Jun 21', time: '5:52 AM', site: '042', nights: 'Jul 3 to 6', kind: 'Tent, 6 people', result: 'Booked, all 3 nights', booked: true },
];

/* checkout, second by second, against the 15:00 cart hold */
export const checkout = [
  { time: '5:52:07', left: null, title: 'Site 042 opened for Jul 3 to 6', sub: 'Caught on the 9,282nd check, 60 s after the last one' },
  { time: '5:52:10', left: null, title: 'Signed into Recreation.gov as maya.hikes', sub: 'Saved login, same device as always' },
  { time: '5:52:14', left: '15:00', title: 'Site 042 added to cart, hold started', sub: 'Recreation.gov holds a carted site for 15 minutes' },
  { time: '5:52:29', left: '14:45', title: 'Occupant and vehicle filled from your profile', sub: '4 people, 1 vehicle, plate 8KXT213' },
  { time: '5:52:56', left: '14:18', title: 'Paid $116.00 with Visa ending 4417', sub: '3 nights at $36 plus the $8 reservation fee' },
  { time: '5:52:58', left: null, title: 'Confirmation 0719402861-1 emailed', sub: 'Sent to maya@hikesmail.com, added to your calendar' },
];

/* the reservation panel's date strip, Jul 1 to 8; in = a night booked */
export const dates = [
  { d: 1, w: 'Wed' },
  { d: 2, w: 'Thu' },
  { d: 3, w: 'Fri', in: true, edge: 'Check in 12 PM' },
  { d: 4, w: 'Sat', in: true },
  { d: 5, w: 'Sun', in: true },
  { d: 6, w: 'Mon', edge: 'Check out 12 PM' },
  { d: 7, w: 'Tue' },
  { d: 8, w: 'Wed' },
];

/* the notes the reservation panel prints under the confirmation */
export const notes = [
  { k: 'Park entry', v: 'Not included. Bring your pass or pay the vehicle fee at the gate.' },
  { k: 'Food storage', v: 'All food and scented items go in the site locker, day and night.' },
  { k: 'Changes', v: 'Change or cancel on Recreation.gov. Superbot keeps the backups watched.' },
];

/* backups, still watched */
export const watching = [
  { img: './img/merced.jpg', name: 'North Pines', where: 'Yosemite Valley', nights: 'Jul 3 to 6', last: 'Checked 5:53 AM', note: 'Next to the Merced' },
  { img: './img/halfdome.jpg', name: 'Lower Pines', where: 'Yosemite Valley', nights: 'Jul 3 to 6', last: 'Checked 5:53 AM', note: 'Half Dome views' },
  { img: './img/tuolumne.jpg', name: 'Tuolumne Meadows', where: 'Tioga Road', nights: 'Jul 10 to 13', last: 'Checked 5:53 AM', note: 'Alternate dates' },
];

/* the five rows the hub's result card previews */
export const items = [
  { img: './img/pines.jpg', title: 'Upper Pines, Site 042', price: '$116', meta: 'Jul 3 to 6, all 3 nights, booked', source: 'openings' },
  { img: './img/camp.jpg', title: 'Upper Pines, Site 151', price: '$108', meta: 'Sleeps 2, you are 4, skipped', source: 'openings' },
  { img: './img/meadow.jpg', title: 'Upper Pines, Site 067', price: '$72', meta: 'Jul 3 to 5 only, skipped', source: 'openings' },
  { img: './img/merced.jpg', title: 'North Pines, Jul 3 to 6', price: '$108', meta: 'Backup, still watching', source: 'backups' },
  { img: './img/tuolumne.jpg', title: 'Tuolumne Meadows, Jul 10 to 13', price: '$108', meta: 'Alternate dates, still watching', source: 'backups' },
];

/* prose the page prints about its own numbers */
export const copy = {
  kicker: 'Cancellation watch, Jun 14 to 21',
  heroH1: 'Caught at 5:52 AM, booked in 42 seconds.',
  heroDek:
    'Superbot checked Upper Pines on Recreation.gov 9,282 times. When Site 042 opened for all three nights, it carted it and checked out long before the 15-minute hold ran out.',
  holdH: 'Cart hold',
  logH: 'Every Upper Pines opening for your dates',
  checkoutH: 'Checkout, 5:52 AM',
  reservationH: 'Your reservation',
  watchH: 'Still watching 3 backups',
  watchDek: 'In case plans change. Superbot checks each one every 60 seconds.',
};
