/* data.js - the eight fishing gifts that pass the filter, and every number the page is built from.
   The hub's aggregation card reads `items`; the guide reads `picks`, `funnel`, `budget` and `dropped`.
   Prices, ratings and review counts are the listing's own fields. Sellers and brands are fictional.
   Photos are sourced real photos (see CREDITS.txt). */

export const query = {
  ask: 'Find a gift for my dad on Amazon under $50, he loves fishing',
  cap: 50,
  read: 1912,
  readAt: '09:42 today',
  site: 'amazon.com',
  delivery: 'arrives Thu',
  urgency: 'order by 11:40 pm Wed',
  filter: '4.3 stars and up',
};

export const picks = [
  {
    id: 'reel',
    no: '01',
    name: 'Ryomo SR-3000 spinning reel',
    sub: '3000 size, 6.2:1 ratio, 22 lb drag, spare graphite spool',
    kind: 'reel',
    price: 34.99,
    rating: 4.6,
    reviews: 2418,
    img: './img/reel.jpg',
    note: 'The size he already fishes with. The spare spool means one reel fishes two rods, and the drag knob is wide enough to turn with cold hands.',
    detail: ['3000 size, 22 lb max drag', 'Spare graphite spool in the box', '9 bearings, 12.4 oz'],
  },
  {
    id: 'crankbaits',
    no: '02',
    name: 'Shallow crankbait set, 12 pieces',
    sub: '12 baits, 2 to 2.4 in, two trebles each, one plastic case',
    kind: 'lures',
    price: 22.5,
    rating: 4.5,
    reviews: 1932,
    img: './img/crankbaits.jpg',
    note: 'Twelve baits in one box, so losing a lure on a sunken tree costs him a knot instead of the afternoon.',
    detail: ['2 to 2.4 in bodies, 6 to 9 ft dive', 'Two trebles on every bait', 'Fits the 3000 size reel rod'],
  },
  {
    id: 'spoons',
    no: '03',
    name: 'Spoon and spinner kit, 9 pieces',
    sub: '9 spoons and in-line spinners, 1/4 to 1/2 oz, silver and gold',
    kind: 'lures',
    price: 18.75,
    rating: 4.4,
    reviews: 864,
    img: './img/spoons.jpg',
    note: 'Silver and gold blades for stained water, in the two weights that cast well on the 8 lb line he already runs.',
    detail: ['1/4 to 1/2 oz, gold and silver', 'Nine pieces in a divided tray', 'Single hooks on the spinners'],
  },
  {
    id: 'knife',
    no: '04',
    name: 'Fillet knife, 7 in flexible blade',
    sub: '7 in flexible blade, non-slip handle, leather sheath',
    kind: 'knife',
    price: 27.4,
    rating: 4.7,
    reviews: 3140,
    img: './img/knife.jpg',
    note: 'Panfish and walleye come off the bone in one pass. The sheath is why it rides in the truck without losing an edge.',
    detail: ['7 in flexible blade, full tang', 'Leather sheath, belt loop', 'Rinse and dry, no dishwasher'],
  },
  {
    id: 'net',
    no: '05',
    name: 'Folding landing net, rubber mesh',
    sub: 'Folds to 16 in, 24 in hoop, knotless rubber mesh',
    kind: 'net',
    price: 29.9,
    rating: 4.5,
    reviews: 1206,
    img: './img/net.jpg',
    note: 'Treble hooks come out of rubber mesh without a fight, and the fish he means to put back keeps its slime coat.',
    detail: ['24 in hoop, 16 in folded', 'Knotless rubber mesh', 'Weighs 1.4 lb'],
  },
  {
    id: 'hat',
    no: '06',
    name: 'Cotton bucket hat, one size',
    sub: 'Washed cotton, 2.5 in brim, chin cord, one size',
    kind: 'hat',
    price: 19.99,
    rating: 4.3,
    reviews: 5082,
    img: './img/hat.jpg',
    note: 'Sun off his neck at 2 pm, and no cap line across his forehead in the photos from the boat.',
    detail: ['2.5 in brim all round', 'Chin cord for open water', 'Machine wash cold'],
  },
  {
    id: 'multitool',
    no: '07',
    name: 'Fishing multitool with pliers',
    sub: 'Pliers, line cutters, hook file, five more tools, belt sheath',
    kind: 'tool',
    price: 24.25,
    rating: 4.4,
    reviews: 2573,
    img: './img/multitool.jpg',
    note: 'Line cutters on his belt instead of in the truck, and the file brings a hook point back after a cast into rock.',
    detail: ['Spring pliers, line cutters', 'Hook file and six more tools', 'Nylon belt sheath'],
  },
  {
    id: 'boxes',
    no: '08',
    name: 'Watertight lure case, set of 3',
    sub: '3 trays, 24 compartments, gasket lid on each',
    kind: 'box',
    price: 16.8,
    rating: 4.6,
    reviews: 918,
    img: './img/boxes.jpg',
    note: 'Rust is what kills a spoon set. The gasket keeps splash out of the tray that lives in the bottom of the boat.',
    detail: ['3 trays, 24 compartments', 'Rubber gasket under every lid', 'Fits the 3700 size bag he has'],
  },
];

/** the hub aggregation card reads these: image, title, price, meta line, source id */
export const items = picks.map((p) => ({
  img: p.img,
  title: p.name,
  price: '$' + p.price.toFixed(2),
  meta: p.rating.toFixed(1) + ' stars · ' + p.reviews.toLocaleString('en-US') + ' ratings · ' + p.kind,
  source: 'amazon',
}));

/** how 1,912 listings on amazon.com became 8 gifts */
export const funnel = [
  { k: 'Fishing gifts listed on amazon.com', n: 1912 },
  { k: 'Under $50', n: 1204 },
  { k: '4.3 stars and up', n: 318 },
  { k: 'Arriving by Thursday', n: 141 },
  { k: 'Bundles and duplicates dropped', n: 41 },
  { k: 'Kept, one per kind of gear', n: 8 },
];

export const dropped = [
  { why: 'Reviews under 4.3 stars', n: 214 },
  { why: 'Not arriving by Thursday', n: 96 },
  { why: 'No size, weight or material listed', n: 41 },
  { why: 'Bundles that repeat a pick', n: 37 },
];

export const budget = {
  cap: 50,
  wrap: 4.95,
  total: 194.58,
  cheapest: 16.8,
  dearest: 34.99,
  average: 24.32,
  median: 23.38,
  line: 'Every pick sits under the $50 cap. The whole list is $194.58, and the dearest gift is $34.99, so even the top of the list leaves room for a card.',
};

export const wrap = {
  fee: 4.95,
  head: 'Add gift wrap for $4.95',
  lines: [
    'Kraft paper, no gloss, tied with cotton twine.',
    'A card in your words, printed and slipped inside the lid.',
    'Wrapped orders are packed in a plain box, no price on the slip.',
  ],
};

export const verdict = {
  eyebrow: 'Gift guide · Dad · 8 picks',
  head: 'For Dad, who fishes.',
  dek: '1,912 fishing gifts on amazon.com under $50, read this morning at 09:42. 214 had reviews too thin to trust and 96 would not arrive by Thursday. These eight did, and every one of them is gear he will tie on, cut with or wear.',
  note: 'Prices, ratings and delivery dates copied from amazon.com listings at 09:42 today. Sellers are shown by rating, not by name.',
};

/** the sticky bar's meter, as the guide scrolls from pick 01 to 08 (p = browser scene progress) */
export const focusAt = [
  [0, 0],
  [0.16, 0],
  [0.36, 2],
  [0.6, 4],
  [0.84, 7],
  [1, 7],
];