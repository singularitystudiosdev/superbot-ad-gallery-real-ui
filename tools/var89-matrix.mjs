// var89-matrix.mjs: the 12-cell matrix the we-dont-care spot is generated from — 4 AI voices x 3 provider
// content packs. This is DATA only; tools/var89-generate.mjs turns each cell into an animation folder
// (animations/<id>/) that is a byte copy of the base spot plus its own variant.js and img/CREDITS.txt.
//
// The base spot stays the first cell's source of truth: every field not named here keeps the base value
// (see animations/we-dont-care-gamble-superbot-89be2ca4/variant.js).
export const BASE_ID = 'we-dont-care-gamble-superbot-89be2ca4';

// (a) the AI voice that objects on card 1. Card 1 always reads "<voice> says you shouldn't gamble" with
// "gamble" the red word; the voice name is the only thing that changes there.
export const VOICES = [
  { key: 'chatgpt', voice: 'ChatGPT' },
  { key: 'claude', voice: 'Claude' },
  { key: 'gemini', voice: 'Gemini' },
  { key: 'grok', voice: 'Grok' },
];

// (b) the provider account the chat then reads and builds a site from. Provider names appear as plain text
// only (no logo art); every figure below is mock UI data, stated as such in each folder's img/CREDITS.txt.
export const PACKS = {
  memecoins: {
    ask: 'Make a website of all my memecoin wins',
    say: 'On it. Pulling every memecoin you ever exited green.',
    workTitle: 'Memecoin wins site',
    site: {
      slug: 'sams-memecoins.site',
      hero: 'All my memecoin wins',
      sub: '1,940 trades · three wallets · every memecoin you held',
      totalDisplay: '$186,400',
      chartLabel: 'REALIZED P&L',
      hitsLabel: 'TOP TRADES',
      hitsTitle: 'Best exits',
      rows: [
        ['DOGE - 2021 run', 61200],
        ['WIF - month one', 34800],
        ['PEPE - the bag you forgot', 28900],
        ['BONK - round trip', 17400],
        ['POPCAT - wave three', 9300],
      ],
      night: { label: 'The PEPE week', amount: 19800, sub: 'Four days, one green candle after another' },
    },
    steps: [
      'Pulled 1,940 trades from your three wallets',
      'Priced every exit against live quotes',
      'Ranked the wins above the paper hands',
      'Built and deployed sams-memecoins.site',
    ],
    credits: 'memecoin lots (the $186,400 total, the five exits, the biggest week) are fictional mock UI data.',
  },
  polywins: {
    ask: 'Make a website of all my Polymarket wins',
    say: 'On it. Every market you called, priced at settlement.',
    workTitle: 'Polymarket wins site',
    site: {
      slug: 'sams-polywins.site',
      hero: 'All my Polymarket wins',
      sub: '318 positions · every resolved market · settlement priced',
      totalDisplay: '$21,340',
      chartLabel: 'CUMULATIVE WINS',
      hitsLabel: 'TOP MARKETS',
      hitsTitle: 'Calls that landed',
      rows: [
        ['Fed cuts in September', 8200],
        ['Chiefs win the Super Bowl', 5600],
        ['BTC above $150k by December', 3150],
        ['Best picture, Oppenheimer', 2400],
        ['Election night sweep', 1990],
      ],
      night: { label: 'Election night', amount: 6400, sub: 'Three markets, all called before midnight' },
    },
    steps: [
      'Read 318 positions from your Polymarket history',
      'Settled every resolved market at final payout',
      'Kept the calls you got right',
      'Built and deployed sams-polywins.site',
    ],
    credits: 'Polymarket positions (the $21,340 total, the five markets, election night) are fictional mock UI data. Polymarket is named in plain text only; no Polymarket logo or brand artwork appears.',
  },
  sportsbook: {
    ask: 'Make a website of all my DraftKings wins',
    say: 'On it. Pulling every settled bet that paid.',
    workTitle: 'DraftKings wins site',
    site: {
      slug: 'sams-sportsbook.site',
      hero: 'All my DraftKings wins',
      sub: '1,046 bets · every graded leg · paid at the closing line',
      totalDisplay: '$12,780',
      chartLabel: 'CUMULATIVE PROFIT',
      hitsLabel: 'TOP PAYOUTS',
      hitsTitle: 'Biggest hits',
      rows: [
        ['4-leg NFL parlay', 4900],
        ['Chiefs, Sunday night', 2830],
        ['Celtics moneyline', 2150],
        ['Yankees, over 8.5', 1600],
        ['PGA outright, 40/1', 1300],
      ],
      night: { label: 'Wild card weekend', amount: 3900, sub: 'Three tickets, three sweat-free endings' },
    },
    steps: [
      'Synced 1,046 settled bets from your sportsbook',
      'Graded every parlay leg at the closing line',
      'Totaled the wins, biggest hits first',
      'Built and deployed sams-sportsbook.site',
    ],
    credits: 'DraftKings settled tickets (the $12,780 total, the five winners, wild card weekend) are fictional mock UI data. DraftKings is named in plain text only; no DraftKings logo or brand artwork appears.',
  },
};

// the 12 cells, in the order the folders were specified: voice x pack -> folder id
export const MATRIX = [
  ['chatgpt', 'memecoins', 'cae00e01'],
  ['chatgpt', 'polywins', 'cae00e02'],
  ['chatgpt', 'sportsbook', 'cae00e03'],
  ['claude', 'memecoins', 'cae00e04'],
  ['claude', 'polywins', 'cae00e05'],
  ['claude', 'sportsbook', 'cae00e06'],
  ['gemini', 'memecoins', 'cae00e07'],
  ['gemini', 'polywins', 'cae00e08'],
  ['gemini', 'sportsbook', 'cae00e09'],
  ['grok', 'memecoins', 'cae00e0a'],
  ['grok', 'polywins', 'cae00e0b'],
  ['grok', 'sportsbook', 'cae00e0c'],
];

// card 2 and the red word are identical in every variant, as is the second card's line
export const SLAM_LINE = 'WE DONT CARE!';
export const RED_WORD = 'gamble';

export const VARIANTS = MATRIX.map(([voiceKey, packKey, hex]) => {
  const v = VOICES.find((x) => x.key === voiceKey);
  const p = PACKS[packKey];
  return {
    id: `${voiceKey}-${packKey}-superbot-${hex}`,
    voice: v.voice,
    introLine: `${v.voice} says you shouldn't gamble`,
    redWord: RED_WORD,
    slamLine: SLAM_LINE,
    ask: p.ask,
    say: p.say,
    workTitle: p.workTitle,
    site: p.site,
    steps: p.steps,
    credits: p.credits,
    packKey,
    voiceKey,
  };
});