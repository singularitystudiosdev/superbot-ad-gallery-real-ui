// Hand built for claude-polybot-live-superbot-cae00e10: animations/claude-polybot-superbot-cae00e0e with its
// finished-site reveal taken out and the four-phase trading lifecycle put in its place (beats/lifecycle.js).
// Every word and figure this spot puts on screen lives here. The engine around it is identical to the twin
// folder animations/chatgpt-memebot-live-superbot-cae00e0f; only this file and img/CREDITS.txt differ.
//
// The paper account and the live account are two separate runs and two separate equity curves: the paper one is
// drawn on screen, the live one only has to be honest about its own drawdown. shape is 14 relative daily steps
// (one per day, negatives are the losing days); equity() in the beat scales them so the run ends exactly at
// start + pnl, so the figure on the scoreboard and the curve can never disagree.
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
      pnl: 520,
      shape: [1.0, 1.6, 0.7, -1.3, 1.8, 2.2, 1.3, -1.5, -2.0, 2.0, 1.5, 0.9, -0.6, 1.3],
      ticket: { side: 'BUY', units: '320 YES', px: '62c', total: '$198.40' },
    },
    strategies: [
      { name: 'Fade the crowd', ret: 3.4, win: 52, dd: -11.6 },
      { name: 'News spike chase', ret: -5.1, win: 46, dd: -15.4 },
      { name: 'Late favourite', ret: 1.2, win: 50, dd: -9.8 },
      { name: 'Edge over 4% vs fair price', ret: 28.2, win: 55, dd: -6.9 },
    ],
    venue: { key: 'polymarket', name: 'Polymarket', tile: 'P' },
    live: {
      stake: 2000,
      days: 14,
      pnl: 142,
      shape: [1.2, 2.1, -0.8, 1.5, 2.6, 1.3, -2.8, 1.0, -2.0, 1.6, 1.9, -1.1, 0.7, 1.3],
      ticket: { side: 'BUY', units: '260 YES', px: '63c', total: '$163.80' },
    },
    results: {
      winner: 'Edge over 4% vs fair price',
      winRate: 55,
      wins: 17,
      losses: 14,
      trades: 31,
      open: { name: 'Fed cut, yes', sub: 'September · entry 62c · now 66c' },
    },
  },
};