// Hand built for claude-polybot-live-superbot-cae00e10: animations/claude-polybot-superbot-cae00e0e with its
// finished-site reveal taken out and the four-phase trading lifecycle put in its place (beats/lifecycle.js).
// Every word and figure this spot puts on screen lives here. The engine around it is identical to the twin
// folder animations/chatgpt-memebot-live-superbot-cae00e0f; only this file and img/CREDITS.txt differ.
export default {
  id: 'claude-polybot-live-superbot-cae00e10',
  voice: 'Claude',
  introLine: "Claude says you shouldn't gamble",
  redWord: 'gamble',
  slamLine: 'WE DONT CARE!',
  ask: 'make me a prediction market trading bot',
  say: 'On it. Grading every market against the book, then small and live.',
  workTitle: 'Prediction market bot',
  workSub: 'paper first, live after',
  steps: [
    'Indexed 1,912 markets and their order books',
    'Scored 4 edges on return, win rate and drawdown',
    'Ran the winner on a paper account for 14 days',
    'Connected to Polymarket and took the same rules live',
  ],
  bot: {
    universe: '1,912 markets, 90 days of books',
    paper: {
      label: 'Paper account, $5,000 play money',
      days: 14,
      start: 5000,
      // one point per day; the last point is start + results.pnl exactly (see lifecycle.js)
      increments: [96, 148, -64, 152, 204, 118, -108, -172, 196, 148, 92, -74, -140, 450],
      ticket: { side: 'BUY', units: '320 YES', px: '62c', total: '$198.40' },
    },
    strategies: [
      { name: 'Fade the crowd', ret: 3.4, win: 52, dd: -11.6 },
      { name: 'News spike chase', ret: -5.1, win: 46, dd: -15.4 },
      { name: 'Late favourite', ret: 1.2, win: 50, dd: -9.8 },
      { name: 'Edge over 4% vs fair price', ret: 20.9, win: 60, dd: -6.9 },
    ],
    venue: { key: 'polymarket', name: 'Polymarket', tile: 'P' },
    live: { ticket: { side: 'BUY', units: '320 YES', px: '62c', total: '$198.40' } },
    results: {
      winner: 'Edge over 4% vs fair price',
      pnl: 1046,
      winRate: 57,
      wins: 28,
      losses: 21,
      trades: 49,
      open: { name: 'Fed cut, yes', sub: 'September · entry 62c · now 66c' },
    },
  },
};