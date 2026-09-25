/* data.js - the Amazon review corpus behind the report page.
   One object per machine: its list price, its rating, how many reviews were read, the share that mention
   sending it back, what the return reasons are, how it scores inside each complaint topic, and the two
   quote snippets the page prints. Everything the page and the hub aggregation card print comes from here,
   so the numbers cannot drift apart. Brands, models, prices and reviewers are invented. Photos are
   sourced (see CREDITS.txt). */

/* The corpus. reviews is the sum of every machine's review count, exactly 38,412. */
export const report = {
  ask: 'Which espresso machine under $300 on Amazon has the best reviews? Read all of them.',
  source: 'Amazon',
  readOn: 'Sep 25, 2026',
  window: 'Feb 2023 to Aug 2026',
  reviews: 38412,
  pages: 118,
  machines: 6,
  under300: 6,
  returnMentions: 3496,
  returnRate: '9.1%',
  topicMentions: 19834,
  firstFault: '41 days',
};

/* Four complaint topics. mentions = how many reviews in the corpus talk about it. positive / negative /
   neutral are the shares of those mentions, and they add to 100. */
export const topics = [
  {
    id: 'heat',
    name: 'Heat-up time',
    mentions: 6842,
    positive: 68,
    negative: 19,
    neutral: 13,
    quote: 'The light settles in 38 seconds on the counter, and the group is hot by then. I timed it for a week.',
    by: 'k. hollis, verified purchase',
    worst: 'Barova Uno averages 64 seconds, the slowest of the six',
    best: 'Nimbra Studio S2 averages 22 seconds',
  },
  {
    id: 'frother',
    name: 'Milk frother',
    mentions: 5113,
    positive: 54,
    negative: 31,
    neutral: 15,
    quote: 'The steam wand looks like a real one but it just blows bubbles. The milk is warm, never silky, and the foam dies in a minute.',
    by: 'd. marchetti, verified purchase',
    worst: 'Four of the six ship a panarello sleeve instead of a plain steam tip',
    best: 'Nimbra Studio S2 and Torva Duo 15 ship a two hole tip, and both hold microfoam',
  },
  {
    id: 'build',
    name: 'Durability',
    mentions: 4208,
    positive: 79,
    negative: 12,
    neutral: 9,
    quote: 'Two years and about 1,400 shots, still on the same pump. The group gasket went at eleven months, a $4 part.',
    by: 't. vanterpool, verified purchase',
    worst: 'Barova Uno and Cormant Brief E1 are the two with pump failures inside 6 months',
    best: 'Halden C3 has the fewest failure posts per 1,000 reviews',
  },
  {
    id: 'clean',
    name: 'Cleaning',
    mentions: 3671,
    positive: 47,
    negative: 38,
    neutral: 15,
    quote: 'The drip tray is a thimble. Two doubles and it is full, and the grate comes off in one piece with the grounds in it. I pull the whole tray out twice a day.',
    by: 'nadia_p, verified purchase',
    worst: 'Pico Vetro Mini: 380 ml tray and no backflush programme',
    best: 'Torva Duo 15 tray holds 1.1 litres and the backflush cycle is on the dial',
  },
];

/* The machines, already in rank order. rank 0 means it was read but did not make the five. */
export const machines = [
  {
    id: 'nimbra',
    rank: 1,
    brand: 'Nimbra',
    model: 'Studio S2',
    title: 'Nimbra Studio S2 espresso machine, stainless',
    price: 269,
    rating: 4.7,
    reviews: 11204,
    score: 87,
    returnRate: 6.2,
    returnMentions: 695,
    img: './img/m1.jpg',
    tagline: 'Fastest to temperature and the only one under $300 with a real steam tip out of the box.',
    verdict: 'Buy this one if you drink milk drinks and want the machine hot before you finish grinding.',
    note: 'Held the top spot in every month of the window except June 2025.',
    scores: { heat: 88, frother: 84, build: 86, clean: 62 },
    faults: [
      ['Gasket seep at the group, replaced by most owners under warranty', 34],
      ['Tray sensor light comes on early', 21],
      ['Loud pump compared with the group it sells against', 17],
    ],
    quotes: [
      {
        text: 'Twenty two seconds to the light, and the first shot is already at temperature. Coming from a machine that took a minute, this is the whole difference.',
        by: 'm. odell, verified purchase',
      },
      {
        text: 'The steam tip is the reason I kept it. Real microfoam in about 25 seconds for a 6 oz pitcher, and the wand stays clean.',
        by: 's. riordan, verified purchase',
      },
    ],
  },
  {
    id: 'torva',
    rank: 2,
    brand: 'Torva',
    model: 'Duo 15',
    title: 'Torva Duo 15 espresso machine with PID',
    price: 239,
    rating: 4.5,
    reviews: 8930,
    score: 81,
    returnRate: 7.8,
    returnMentions: 697,
    img: './img/m2.jpg',
    tagline: 'PID, a 1.1 litre tray and a backflush programme, in the plainest housing of the six.',
    verdict: 'Buy this one if you want temperature control and a machine you can clean without tools.',
    note: 'Most recommended by owners to other owners in the comments of the corpus.',
    scores: { heat: 74, frother: 76, build: 82, clean: 88 },
    faults: [
      ['PID drifts a few degrees after six months, factory reset usually holds', 29],
      ['Steam knob loosens and needs a screw turn', 24],
      ['Portafilter that ships in the box is the pressurised one', 19],
    ],
    quotes: [
      {
        text: 'Setting 93 on the PID and it stays there. I pulled shots back to back for a dinner and the third was the same as the first.',
        by: 'a. tolouei, verified purchase',
      },
      {
        text: 'The backflush programme is two presses. That alone is why this stayed and the cheaper one went back.',
        by: 'j. whitlock, verified purchase',
      },
    ],
  },
  {
    id: 'halden',
    rank: 3,
    brand: 'Halden',
    model: 'C3',
    title: 'Halden C3 espresso machine, 15 bar',
    price: 189,
    rating: 4.4,
    reviews: 6118,
    score: 76,
    returnRate: 8.1,
    returnMentions: 496,
    img: './img/m3.jpg',
    tagline: 'The quiet one. Fewest failure posts per 1,000 reviews of the six, and the weakest frother.',
    verdict: 'Buy this one if you drink espresso straight and want the machine least likely to need a repair.',
    note: 'Only model where the phrase still working after two years shows up more than 100 times.',
    scores: { heat: 70, frother: 48, build: 92, clean: 66 },
    faults: [
      ['Panarello sleeve cannot be removed, so the foam stays bubbly', 41],
      ['Boiler refill is slow after three shots', 26],
      ['Stock tamper is plastic and undersized', 14],
    ],
    quotes: [
      {
        text: 'Bought it in 2024, about 1,400 shots since, and the pump has never skipped. The gasket was eleven months and cost me four dollars.',
        by: 't. vanterpool, verified purchase',
      },
      {
        text: 'Straight espresso is good and consistent. Lattes are where it stops, the wand froths but it will not make microfoam.',
        by: 'h. bergstrom, verified purchase',
      },
    ],
  },
  {
    id: 'pico',
    rank: 4,
    brand: 'Pico',
    model: 'Vetro Mini',
    title: 'Pico Vetro Mini espresso machine, glass top',
    price: 149,
    rating: 4.2,
    reviews: 7442,
    score: 69,
    returnRate: 11.3,
    returnMentions: 841,
    img: './img/m4.jpg',
    tagline: 'The one that looks best on a shelf and asks the most of you before the first shot.',
    verdict: 'Buy this one if the counter is short on space and you single dose and weigh every shot anyway.',
    note: 'Most common first line in a negative review: I wanted to like it.',
    scores: { heat: 64, frother: 56, build: 68, clean: 44 },
    faults: [
      ['380 ml tray overflows through a long session, which drives most returns', 46],
      ['No backflush programme, so the group needs a weekly by hand clean', 28],
      ['Glass top is only rated for cups up to 3 inches', 13],
    ],
    quotes: [
      {
        text: 'The tray is genuinely tiny. Two doubles and it is full, and the grate comes off holding the grounds. I empty it twice a day and I still like the coffee.',
        by: 'nadia_p, verified purchase',
      },
      {
        text: 'Takes up less than a hand span of counter and heats water in 40 seconds. The trade is that you clean it more than you use it.',
        by: 'g. fennesz, verified purchase',
      },
    ],
  },
  {
    id: 'barova',
    rank: 5,
    brand: 'Barova',
    model: 'Uno',
    title: 'Barova Uno espresso machine, 20 bar',
    price: 99,
    rating: 4.0,
    reviews: 2905,
    score: 58,
    returnRate: 14.6,
    returnMentions: 424,
    img: './img/m5.jpg',
    tagline: 'Twenty bar on the box, 64 seconds to temperature, and the shortest warranty of the six.',
    verdict: 'Buy this one only if a hot drink in the morning is the whole job and the price is the whole budget.',
    note: 'Half of its five star reviews do not mention the espresso, they mention the price.',
    scores: { heat: 42, frother: 51, build: 54, clean: 58 },
    faults: [
      ['Pump failure inside six months, the single biggest reason it goes back', 52],
      ['Pressure gauge reads about 3 bar above what the portafilter gets', 27],
      ['One year warranty, against two years on the rest of the six', 11],
    ],
    quotes: [
      {
        text: 'It makes a drinkable cup and it cost $99. It also takes 64 seconds to get there and the gauge is decorative. For the money that is the trade.',
        by: 'r. fasbender, verified purchase',
      },
      {
        text: 'Mine stopped pumping at four months. The replacement is on its way, so the warranty did work, but I have bought a different machine since.',
        by: 'c. mpofu, verified purchase',
      },
    ],
  },
  {
    id: 'cormant',
    rank: 0,
    brand: 'Cormant',
    model: 'Brief E1',
    title: 'Cormant Brief E1 espresso machine, compact',
    price: 79,
    rating: 3.8,
    reviews: 1813,
    score: 41,
    returnRate: 18.9,
    returnMentions: 343,
    img: './img/m6.jpg',
    tagline: 'Read, counted, and left off the shortlist: the highest return rate of the six.',
    verdict: 'Not recommended. It was the cheapest of the six and the only one whose returns outnumber its repeat buyers.',
    note: 'Nearly one in five reviews of this model is about sending it back.',
    scores: { heat: 38, frother: 36, build: 40, clean: 46 },
    faults: [
      ['Leaks at the portafilter from the first week, the largest reason for returns', 48],
      ['Two cup capacity and a 250 ml tray', 29],
      ['Instructions only cover capsules, not ground coffee', 15],
    ],
    quotes: [
      {
        text: 'Water runs down the side of the portafilter and into the tray from the first week. I tightened everything that tightens and it still does it.',
        by: 'w. kalinowski, verified purchase',
      },
      {
        text: 'Fine for what I paid, but I would not buy it twice. The manual is written for the pod version.',
        by: 'b. arellano, verified purchase',
      },
    ],
  },
];

/* The ranked five, in order, and the one that was read but not shortlisted. */
export const ranked = machines.filter((m) => m.rank > 0);
export const belowCut = machines.filter((m) => m.rank === 0);

/** Return mentions per machine, the widest bar in the returns chart. */
export const maxReturn = Math.max.apply(null, machines.map((m) => m.returnMentions));

export const money = (n) => '$' + Number(n).toLocaleString('en-US');
export const thousands = (n) => Number(n).toLocaleString('en-US');

/** The verdict box: the top ranked machine and the sentence the page leads with. */
export const verdict = {
  machine: machines[0],
  headline: 'The Nimbra Studio S2 takes the top spot on 11,204 reviews',
  body: 'It is the only machine in the corpus that is fast to temperature, ships a real steam tip and still returns fewer than one unit in sixteen. Its two gaps are the small drip tray and a pump you can hear from the next room.',
  runnerUp: machines[1],
  sayNo: machines[5],
};

/** The three return reasons that repeat across the whole corpus, not just one model. */
export const repeatReasons = [
  { label: 'Leaking at the group or the portafilter in the first month', share: 38, models: 'five of six models' },
  { label: 'Pump failure inside six months', share: 27, models: 'three of six models' },
  { label: 'Drip tray too small for two people', share: 22, models: 'four of six models' },
  { label: 'Wrong portafilter in the box, pressurised instead of plain', share: 13, models: 'two of six models' },
];

/** items[] is what the kit's hub aggregation card shows in the chat: the six machines read. */
export const items = machines.map((m) => ({
  img: m.img,
  title: m.brand + ' ' + m.model + ', ' + money(m.price),
  price: money(m.price),
  meta: m.rating.toFixed(1) + ' out of 5, ' + thousands(m.reviews) + ' reviews',
  source: 'amazon',
}));