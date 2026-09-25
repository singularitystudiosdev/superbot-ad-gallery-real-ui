export default {
  id: 'just-works-dresses-superbot-42aac446',
  title: '10 Dresses on Amazon',
  slug: 'dresses',
  ask: 'Find me 10 dresses on amazon to pick from',
  gpt: null,
  card: null,
  sources: [{ id: 'amazon', name: 'Amazon', logo: './brand/amazon.svg', count: 2140 }],
  steps: [
    'Opening amazon.com',
    'Searching 2,140 dresses',
    'Keeping 4.3 stars and up with Prime',
    'Picking 10 across styles',
  ],
  found: { n: 10, label: 'dresses picked for you' },
  build: {
    file: '10-dresses',
    url: 'superbot.app/p/10-dresses',
    tabTitle: 'Your 10 dresses',
    favicon: './brand/amazon.svg',
  },
  // The page is read top down, then dwells on dress 4 while the fit/delivery/returns strip is on
  // screen and the heart is shortlisted. Hover and click stop on the same heart, and .look-quick
  // reserves its own box in CSS, so the target rect does not move between the press and the click.
  scroll: [
    [0, 0],
    [0.15, '.lb-head'],
    [0.3, '.look:nth-child(2)'],
    [0.44, '.look:nth-child(4) .look-quick'],
    [0.76, '.look:nth-child(4) .look-quick'],
    [0.9, '.look:nth-child(9)'],
    [1, 1],
  ],
  hover: [[0.5, 0.72, '.look:nth-child(4) .heart']],
  click: [[0.68, '.look:nth-child(4) .heart']],
  end: { text: 'Superbot just works' },
  // 25.2s loop, inside the series band
  dur: { hub: 10.8, browser: 11.0, end: 3.4 },
};