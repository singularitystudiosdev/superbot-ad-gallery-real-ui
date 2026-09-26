/* data.js - the numbers behind superbot.app/p/wantlist-watch, "Wantlist Watch".
   One overnight run over a Discogs wantlist: 42 records watched, 1,284 new listings checked against three
   rules (grade, price, seller), one copy bought and filed. Artists, titles, sellers and order numbers are
   invented for the spot; the photos are sourced in CREDITS.txt. Every count the page prints comes from
   here, so the hub, the page and the steps never disagree. */

export const meta = {
  user: 'crate_dan',
  started: '11:40 PM',
  bought: '3:12 AM',
  // render(p) walks this clock across the Chrome beat: 3:12:04 AM -> 3:13:10 AM
  clockStart: 3 * 3600 + 12 * 60 + 4,
  synced: 'Checking Discogs every 5 min',
  done: 'Bought and filed, still watching 41',
};

export const counts = {
  watched: 42,
  listings: 1284,
  sellers: 212,
  bought: 1,
  underMax: 7,
  collectionBefore: 318,
};

export const rules = [
  { key: 'grade', label: 'Condition', value: 'VG+ or better', note: 'media and sleeve' },
  { key: 'price', label: 'Price', value: 'Under your max', note: 'set per record' },
  { key: 'seller', label: 'Seller', value: '99% or higher', note: '200+ ratings' },
];

/* the order the hero card and the checkout panel print */
export const order = {
  img: './img/deck.jpg',
  artist: 'Hollis Crane Trio',
  title: 'Night Ferry',
  press: '1961 US first press',
  cat: 'Marlowe MLP 1042',
  media: 'VG+',
  sleeve: 'VG+',
  price: 38,
  ship: 6,
  max: 45,
  seller: 'vinyl_vault_pdx',
  rating: 99.8,
  ratings: 2431,
  number: '18823-417',
  folder: 'Jazz',
};

/* the overnight log: every listing of Night Ferry that appeared, and the rule it failed.
   ok = [grade, price, seller]; the last row clears all three and is the one bought. */
export const log = [
  { time: '12:26 AM', media: 'VG', sleeve: 'VG+', price: 29, seller: 'spin_cycle_records', rating: 99.9, ok: [false, true, true], result: 'Skipped, grade under VG+' },
  { time: '1:05 AM', media: 'NM', sleeve: 'NM', price: 64, seller: 'deepgroove_ltd', rating: 100, ok: [true, false, true], result: 'Skipped, $19 over your max' },
  { time: '2:19 AM', media: 'VG+', sleeve: 'VG', price: 36, seller: 'attic_finds_22', rating: 93.1, ok: [true, true, false], result: 'Skipped, seller at 93.1%' },
  { time: '3:12 AM', media: 'VG+', sleeve: 'VG+', price: 38, seller: 'vinyl_vault_pdx', rating: 99.8, ok: [true, true, true], result: 'Bought', buy: true },
];

/* checkout, second by second */
export const checkout = [
  { time: '3:12:04', title: 'Listing cleared all three rules', sub: 'VG+ / VG+, $38, seller 99.8% from 2,431 ratings' },
  { time: '3:12:06', title: 'Signed into Discogs as @crate_dan', sub: 'Saved login, same device as always' },
  { time: '3:12:11', title: 'Added to cart, checked out', sub: '$38.00 + $6.00 shipping to your saved address' },
  { time: '3:12:19', title: 'Paid $44.00 with PayPal on file', sub: 'Order 18823-417, seller notified' },
  { time: '3:12:24', title: 'Filed to Collection, folder Jazz', sub: 'Removed from wantlist, note added: bought overnight' },
];

/* the collection panel the Collection tab swaps in */
export const folders = [
  { name: 'All', n: 319 },
  { name: 'Jazz', n: 88, hot: true },
  { name: 'Soul', n: 64 },
  { name: 'Rock', n: 112 },
  { name: 'Unsorted', n: 55 },
];

export const shelf = [
  { img: './img/deck.jpg', artist: 'Hollis Crane Trio', title: 'Night Ferry', grade: 'VG+', added: 'Added 3:12 AM', fresh: true },
  { img: './img/spines.jpg', artist: 'Mae Holloway Sextet', title: 'Blue Lanterns', grade: 'VG+', added: 'Aug 30' },
  { img: './img/stack.jpg', artist: 'The Delano Four', title: 'Late Set', grade: 'NM', added: 'Aug 12' },
  { img: './img/shop.jpg', artist: 'Ruth Ambrose', title: 'Quiet Rooms', grade: 'VG+', added: 'Jul 27' },
  { img: './img/bins.jpg', artist: 'Otis Rennard', title: 'Night Market', grade: 'VG', added: 'Jul 9' },
  { img: './img/shelf.jpg', artist: 'Lena Barrow Quintet', title: 'Harbor Suite', grade: 'VG+', added: 'Jun 21' },
];

/* the rest of the wantlist, still watched */
export const watching = [
  { img: './img/stack.jpg', artist: 'Ada Lorne', title: 'Paper Moons', max: 60, low: 74, grade: 'VG+' },
  { img: './img/spines.jpg', artist: 'Oren Vale', title: 'Low Tide Suite', max: 50, low: 41, grade: 'VG', why: 'grade' },
  { img: './img/bins.jpg', artist: 'June Castell', title: 'Harbor Lights', max: 50, low: 55, grade: 'NM' },
  { img: './img/shop.jpg', artist: 'The Merriwells', title: 'Glasshouse', max: 30, low: 22, grade: 'VG+', why: 'seller' },
];

/* the five rows the hub's result card previews */
export const items = [
  { img: './img/deck.jpg', title: 'Night Ferry, Hollis Crane Trio', price: '$38', meta: 'VG+ / VG+, seller 99.8%', source: 'market' },
  { img: './img/stack.jpg', title: 'Paper Moons, Ada Lorne', price: '$74', meta: 'VG+, over your $60 max', source: 'market' },
  { img: './img/spines.jpg', title: 'Low Tide Suite, Oren Vale', price: '$41', meta: 'VG, grade under VG+', source: 'market' },
  { img: './img/shop.jpg', title: 'Glasshouse, The Merriwells', price: '$22', meta: 'VG+, seller at 94.2%', source: 'sellers' },
  { img: './img/bins.jpg', title: 'Harbor Lights, June Castell', price: '$55', meta: 'NM, over your $50 max', source: 'market' },
];

/* prose the page prints about its own numbers */
export const copy = {
  kicker: 'Overnight run, Sep 24 to 25',
  heroH1: 'Bought at 3:12 AM, while you slept.',
  heroDek:
    'Superbot watched 42 records on your Discogs wantlist, checked 1,284 new listings, and bought the one copy that cleared every rule you set.',
  rulesH: 'Three rules, checked on every listing',
  logH: 'Every copy of Night Ferry that listed overnight',
  checkoutH: 'Checkout, 3:12 AM',
  collectionH: 'Your collection',
  watchH: 'Still watching 41 records',
  watchDek: 'Nothing else cleared all three rules yet. Next check in 5 minutes.',
};
