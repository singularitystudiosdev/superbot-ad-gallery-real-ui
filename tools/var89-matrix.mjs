// var89-matrix.mjs: the matrix the we-dont-care spot is generated from — 4 AI voices x 3 provider content
// packs (12 cells), plus two bot cells where the ask is the user's own lowercase words and superbot builds a
// live trading bot instead of a wins site (14 cells). This is DATA only; tools/var89-generate.mjs turns each cell into an animation folder
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
  // ---- the two bot cells (2026-09-28) ----
  // Same spot, same card 1 ("<voice> says you shouldn't gamble") and same "WE DONT CARE!", but the ask is the
  // user's own words typed lowercase and verbatim, and the thing superbot builds is a live trading bot
  // dashboard instead of a site of wins. Chain/venue names are plain text only and every figure below is mock
  // UI data, as each folder's img/CREDITS.txt states. The five row amounts sum to the hero total in both packs.
  // The dashboard also renames the three site labels the wins packs share: heroLabel LIVE P&L, chartLegend
  // Equity, nightLabel BEST DAY (the base defaults are LIFETIME WINS / All winnings / BIGGEST NIGHT).
  memebot: {
    ask: 'make me a memecoin trading bot',
    say: 'On it. Wiring the signal, the wallet and the sell ladder.',
    workTitle: 'Memecoin trading bot',
    site: {
      slug: 'sams-memebot.site',
      hero: 'Memecoin trading bot, live',
      sub: '412 pairs watched · one signal · sells laddered',
      totalDisplay: '$31,480',
      heroLabel: 'LIVE P&L',
      chartLabel: 'EQUITY, 30 DAYS',
      chartLegend: 'Equity',
      nightLabel: 'BEST DAY',
      hitsLabel: 'OPEN POSITIONS',
      hitsTitle: 'Open positions',
      rows: [
        ['WIF, entry 2.41', 6820],
        ['POPCAT, entry 0.79', 5140],
        ['BONK, entry 0.028', 3760],
        ['MUMU, entry 0.0031', 2140],
        ['Realized, last 30 days', 13620],
      ],
      night: { label: 'Best day', amount: 4110, sub: 'Three sells into the first green candle' },
    },
    steps: [
      'Read 412 pairs on Solana and Base',
      'Backtested the signal on 90 days of candles',
      'Wired the wallet, the take-profit ladder and the kill switch',
      'Deployed sams-memebot.site',
    ],
    credits: 'open positions and equity (the $31,480 total, the five positions and the best day) are fictional mock UI data. Solana and Base are named in plain text only; no chain or exchange logo appears.',
  },
  polybot: {
    ask: 'make me a prediction market trading bot',
    say: 'On it. Pricing every market against the book, then arming the bot.',
    workTitle: 'Prediction market bot',
    site: {
      slug: 'sams-polybot.site',
      hero: 'Prediction market bot, live',
      sub: '1,912 markets priced · only edges over 4%',
      totalDisplay: '$18,260',
      heroLabel: 'LIVE P&L',
      chartLabel: 'EQUITY, 30 DAYS',
      chartLegend: 'Equity',
      nightLabel: 'BEST DAY',
      hitsLabel: 'LIVE POSITIONS',
      hitsTitle: 'Live positions',
      rows: [
        ['Fed cut, September, yes', 5240],
        ['Supermajority, no', 3980],
        ['BTC over $150k, yes', 3110],
        ['Best picture, no', 2640],
        ['Ukraine ceasefire, yes', 3290],
      ],
      night: { label: 'Best day', amount: 2980, sub: 'Two markets moved 9 points after the debate' },
    },
    steps: [
      'Indexed 1,912 live markets',
      'Compared every book against the fair price',
      'Armed the bot on edges over 4%',
      'Deployed sams-polybot.site',
    ],
    credits: 'live positions and equity (the $18,260 total, the five markets and the best day) are fictional mock UI data. Prediction-market names are described in plain text only; no venue logo appears.',
  },
};

// the 14 cells, in the order the folders were specified: voice x pack -> folder id
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
  // the two bot cells: the ask is the user's own lowercase words, the build is a live trading bot
  ['chatgpt', 'memebot', 'cae00e0d'],
  ['claude', 'polybot', 'cae00e0e'],
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