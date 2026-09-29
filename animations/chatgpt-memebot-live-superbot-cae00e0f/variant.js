// Hand built for chatgpt-memebot-live-superbot-cae00e0f: animations/chatgpt-memebot-superbot-cae00e0d with its
// finished-site reveal taken out and the four-phase trading lifecycle put in its place (beats/lifecycle.js).
// Every word and figure this spot puts on screen lives here. The engine around it is identical to the twin
// folder animations/claude-polybot-live-superbot-cae00e10; only this file and img/CREDITS.txt differ.
export default {
  id: 'chatgpt-memebot-live-superbot-cae00e0f',
  voice: 'ChatGPT',
  introLine: "ChatGPT says you shouldn't gamble",
  redWord: 'gamble',
  slamLine: 'WE DONT CARE!',
  ask: 'make me a memecoin trading bot',
  say: 'On it. Screening the setups on history first, then small and live.',
  workTitle: 'Memecoin trading bot',
  workSub: 'paper first, live after',
  steps: [
    'Read 412 Solana pairs over 90 days of candles',
    'Scored 4 strategies on return, win rate and drawdown',
    'Ran the winner on a paper account for 14 days',
    'Connected to Axiom and took the same rules live',
  ],
  bot: {
    universe: '412 pairs, 90 days of candles',
    paper: {
      label: 'Paper account, $5,000 play money',
      days: 14,
      start: 5000,
      // one point per day; the last point is start + results.pnl exactly (see lifecycle.js)
      increments: [124, 186, 96, -142, 208, 268, 156, -186, -238, 264, 182, 126, -96, 336],
      ticket: { side: 'BUY', units: '3.20 SOL', px: '$148.20', total: '$474.24' },
    },
    strategies: [
      { name: 'Volume breakout', ret: -4.2, win: 48, dd: -14.8 },
      { name: 'Fresh pair sniper', ret: 2.6, win: 51, dd: -16.2 },
      { name: 'Dev wallet follow', ret: -1.8, win: 47, dd: -12.9 },
      { name: 'Momentum + trailing stop', ret: 25.7, win: 60, dd: -7.4 },
    ],
    venue: { key: 'axiom', name: 'Axiom', tile: 'A' },
    live: { ticket: { side: 'BUY', units: '3.20 SOL', px: '$148.20', total: '$474.24' } },
    results: {
      winner: 'Momentum + trailing stop',
      pnl: 1284,
      winRate: 58,
      wins: 29,
      losses: 21,
      trades: 50,
      open: { name: 'SOL long', sub: 'entry $146.02 · now $149.09' },
    },
  },
};