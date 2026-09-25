/* data.js - the drop board: six pairs of running shoes, size 10 in stock, under $120.
   Every number here is read by the page, the size runs, the shortlist sheet and the hub card.
   Brands and models are fictional. Photos are sourced (see CREDITS.txt). */

export const query = {
  ask: 'Find me running shoes under $120 in size 10 on Amazon',
  read: 264,
  size: '10',
  cap: 120,
  floor: 4.0,
  reviewsRead: 9800,
  readAt: '11:06 today',
  source: 'amazon.com',
};

/* 6 of 264 listings pass. reasons the other 258 did not */
export const rejects = [
  { why: 'Over $120', n: 96 },
  { why: 'No size 10 on the shelf', n: 71 },
  { why: 'Under 4.0 stars', n: 58 },
  { why: 'Only wide or narrow fits left', n: 33 },
];

export const criteria = [
  { label: 'Price', value: 'under $120' },
  { label: 'Size', value: 'US 10, in stock' },
  { label: 'Rating', value: '4.0 stars and up' },
  { label: 'Type', value: 'road and tempo running' },
  { label: 'Ships', value: 'Prime, 2 day' },
];

/* cushion meter, 1 to 5. the page draws the score, the label spells out the ride */
export const cushionScale = {
  head: 'Cushion level',
  levels: [
    { score: 1, name: 'firm', note: 'Ground feel, no give' },
    { score: 2, name: 'low', note: 'Thin, fast turnover' },
    { score: 3, name: 'balanced', note: 'Everyday mileage' },
    { score: 4, name: 'soft', note: 'Long slow runs' },
    { score: 5, name: 'max', note: 'Recovery and easy days' },
  ],
};

export const shoes = [
  {
    id: 'tempo',
    rank: 1,
    brand: 'Ballara',
    model: 'Tempo 4',
    colorway: 'Solar Flare',
    name: 'Ballara Tempo 4',
    sub: 'Knitted upper, 8 mm drop, tempo trainer',
    price: 119,
    was: 150,
    weight: 268,
    drop: 8,
    stack: 38,
    cushion: 5,
    rating: 4.6,
    reviews: 2140,
    stock: { 7: 0, 8: 0, 9: 6, 10: 14, 11: 9, 12: 3, 13: 0 },
    hero: './img/tempo-hero.jpg',
    thumb: './img/tempo.jpg',
    panel: '#CBFF3D',
    ink: '#101208',
    accent: '#FF4A1F',
    badge: 'Roomiest size 10 stock',
    verdict:
      'The softest pair that still holds 4.6 stars over 2,140 ratings. 14 pairs left in a size 10, more than any other drop here.',
    notes: [
      'Reviews that name the wide toe box: 486',
      'Reviews that name heel slip on hills: 61',
      'Reviews that say the laces run short: 24',
    ],
  },
  {
    id: 'mile',
    rank: 2,
    brand: 'Kester',
    model: 'Mile 12',
    colorway: 'Night Volt',
    name: 'Kester Mile 12',
    sub: 'Low stack, 6 mm drop, road racer',
    price: 108,
    was: 130,
    weight: 244,
    drop: 6,
    stack: 32,
    cushion: 3,
    rating: 4.5,
    reviews: 1884,
    stock: { 7: 2, 8: 5, 9: 11, 10: 9, 11: 7, 12: 2, 13: 0 },
    hero: './img/mile-hero.jpg',
    thumb: './img/mile.jpg',
    panel: '#2A3CF0',
    ink: '#F4F6FF',
    accent: '#CBFF3D',
    badge: 'Lightest here',
    verdict:
      '244 g and a 6 mm drop, the lightest pair in the pass list by 24 g. It gives up stack height for that, so keep it for tempo days.',
    notes: [
      'Reviews that run 5 km to 10 km in them: 402',
      'Reviews that call the ride firm: 188',
      'Reviews that name sole wear past 400 km: 74',
    ],
  },
  {
    id: 'cadence',
    rank: 3,
    brand: 'Ostroy',
    model: 'Cadence SL',
    colorway: 'Fog Lime',
    name: 'Ostroy Cadence SL',
    sub: 'Mesh upper, 10 mm drop, daily mileage',
    price: 92,
    was: 120,
    weight: 256,
    drop: 10,
    stack: 34,
    cushion: 4,
    rating: 4.4,
    reviews: 1610,
    stock: { 7: 3, 8: 8, 9: 14, 10: 22, 11: 12, 12: 5, 13: 1 },
    hero: './img/cadence-hero.jpg',
    thumb: './img/cadence.jpg',
    panel: '#FF4B22',
    ink: '#160D08',
    accent: '#101208',
    badge: 'Most size 10 pairs left',
    verdict:
      '22 pairs in a size 10 at $92, the cheapest soft-ish ride on the board. 4.4 stars is the lowest rating that still made the cut.',
    notes: [
      'Reviews that wear them for work shifts: 372',
      'Reviews that say the mesh tears at the toe: 88',
      'Reviews that replace them under 500 km: 51',
    ],
  },
  {
    id: 'drift',
    rank: 4,
    brand: 'Wellow',
    model: 'Drift E1',
    colorway: 'Paper Red',
    name: 'Wellow Drift E1',
    sub: 'Canvas upper, 12 mm drop, easy days',
    price: 76,
    was: 95,
    weight: 232,
    drop: 12,
    stack: 30,
    cushion: 4,
    rating: 4.7,
    reviews: 1522,
    stock: { 7: 1, 8: 3, 9: 6, 10: 5, 11: 4, 12: 1, 13: 0 },
    hero: './img/drift-hero.jpg',
    thumb: './img/drift.jpg',
    panel: '#FF3FA4',
    ink: '#20060F',
    accent: '#101208',
    badge: 'Highest rating',
    verdict:
      '4.7 stars over 1,522 ratings, the best rated pair here, at $76. Only 5 size 10 pairs left, so this is the one that moves first.',
    notes: [
      'Reviews that walk more than run in them: 611',
      'Reviews that name the canvas staining: 143',
      'Reviews that call the toe box narrow: 96',
    ],
  },
  {
    id: 'interval',
    rank: 5,
    brand: 'Saltway',
    model: 'Interval 2',
    colorway: 'Chalk',
    name: 'Saltway Interval 2',
    sub: 'Woven upper, 4 mm drop, gym and track',
    price: 64,
    was: 88,
    weight: 218,
    drop: 4,
    stack: 24,
    cushion: 2,
    rating: 4.3,
    reviews: 1396,
    stock: { 7: 6, 8: 9, 9: 18, 10: 31, 11: 14, 12: 6, 13: 2 },
    hero: './img/interval-hero.jpg',
    thumb: './img/interval.jpg',
    panel: '#EFE7D6',
    ink: '#14130F',
    accent: '#FF4B22',
    badge: 'Cheapest pass',
    verdict:
      'The cheapest pair on the board at $64 and the lightest at 218 g, with 31 size 10 pairs on the shelf. 24 mm of stack is all you get.',
    notes: [
      'Reviews that lift in them: 244',
      'Reviews that say the sole packs down: 121',
      'Reviews that size up half a size: 77',
    ],
  },
  {
    id: 'loop',
    rank: 6,
    brand: 'Fairmont',
    model: 'Loop 7',
    colorway: 'Silver Ash',
    name: 'Fairmont Loop 7',
    sub: 'Engineered mesh, 8 mm drop, all day',
    price: 84,
    was: 110,
    weight: 236,
    drop: 8,
    stack: 36,
    cushion: 3,
    rating: 4.5,
    reviews: 1248,
    stock: { 7: 4, 8: 7, 9: 15, 10: 12, 11: 10, 12: 4, 13: 1 },
    hero: './img/loop-hero.jpg',
    thumb: './img/loop.jpg',
    panel: '#16E1C4',
    ink: '#04211D',
    accent: '#101208',
    badge: 'Widest size run',
    verdict:
      'The only pair with a size 13 still in stock. $84, 36 mm stack and 4.5 stars, the closest thing to a single pair that covers every run.',
    notes: [
      'Reviews that wear the shoe 8 hours a day: 508',
      'Reviews that name the mesh pilling: 132',
      'Reviews that call it true to size: 214',
    ],
  },
];

/** the hub aggregation card reads these: first four to six items with a source id */
export const items = shoes.map((s) => ({
  img: s.thumb,
  title: s.brand + ' ' + s.model + ', ' + s.colorway,
  price: '$' + s.price,
  meta: s.weight + ' g · ' + s.drop + ' mm drop · ' + s.rating.toFixed(1) + ' stars · size 10 in stock',
  source: 'amazon',
}));

/** the shortlist sheet: every pair, same columns, so the six can be read side by side */
export const shortlist = {
  head: 'The size 10 shortlist',
  dek: 'Six pairs under $120 with a size 10 on the shelf today. Sorted by the rank the ask produced. Low stock is called out in the last column.',
  cols: [
    { k: 'rank', label: '#' },
    { k: 'shoe', label: 'Pair' },
    { k: 'price', label: 'Price' },
    { k: 'was', label: 'Was' },
    { k: 'weight', label: 'Weight' },
    { k: 'drop', label: 'Drop' },
    { k: 'stack', label: 'Stack' },
    { k: 'cushion', label: 'Cushion' },
    { k: 'rating', label: 'Rating' },
    { k: 'stock', label: 'Size 10' },
  ],
  footnote: 'Weight in grams, drop and stack in millimetres, all as listed on amazon.com at 11:06 today.',
};

/** stack and drop, drawn as two bars per pair: the ride shape the numbers describe */
export const ladder = {
  head: 'Stack and drop',
  dek: 'Stack is how much foam sits under the foot. Drop is the difference between the heel and the toe. Both in millimetres, in the same rank order as the board.',
  stackMax: 40,
  dropMax: 14,
};

export const verdict = {
  head: 'Size 10, in stock',
  dek:
    '264 listings on amazon.com, filtered to under $120 with a US 10 in stock, then 9,800 reviews read across them. Six pairs clear the filter. One board.',
  footnote:
    'Prices, ratings and stock counts copied from amazon.com listings today at 11:06. Stock moves, so check the listing before you buy.',
};

/** sell through, stated as numbers rather than a mood */
export const stockRead = {
  head: 'What is left in a size 10',
  note: 'Counts are pairs the listing said were left in a US 10 at 11:06 today.',
  rows: shoes.map((s) => ({ id: s.id, label: s.brand + ' ' + s.model, n: s.stock[10], low: s.stock[10] <= 9 })),
};

export const stats = [
  { k: 'Pairs in the pass list', v: '6' },
  { k: 'Cheapest', v: '$64' },
  { k: 'Lightest', v: '218 g' },
  { k: 'Median rating', v: '4.5' },
];