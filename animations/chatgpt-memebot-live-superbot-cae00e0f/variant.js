// Hand built for chatgpt-memebot-live-superbot-cae00e0f: animations/chatgpt-memebot-superbot-cae00e0d with its
// finished-site reveal taken out and the four-phase trading lifecycle put in its place (beats/lifecycle.js).
// Every word and figure this spot puts on screen lives here. The engine around it is identical to the twin
// folder animations/claude-polybot-live-superbot-cae00e10; only this file and img/CREDITS.txt differ.
//
// The paper account and the live account are two separate runs and two separate equity curves: the paper one is
// drawn on screen, the live one only has to be honest about its own drawdown. shape is 14 relative daily steps
// (one per day, negatives are the losing days); equity() in the beat scales them so the run ends exactly at
// start + pnl, so the figure on the scoreboard and the curve can never disagree.
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
      pnl: 640,
      shape: [1.1, 1.7, 0.8, -1.4, 1.9, 2.3, 1.4, -1.6, -2.1, 2.1, 1.6, 1.0, -0.7, 1.4],
      ticket: { side: 'BUY', units: '820 WIF', px: '$2.31', total: '$1,894.20' },
    },
    strategies: [
      { name: 'Volume breakout', ret: -4.2, win: 48, dd: -14.8 },
      { name: 'Fresh pair sniper', ret: 2.6, win: 51, dd: -16.2 },
      { name: 'Dev wallet follow', ret: -1.8, win: 47, dd: -12.9 },
      { name: 'Momentum + trailing stop', ret: 34.6, win: 56, dd: -7.4 },
    ],
    venue: { key: 'axiom', name: 'Axiom', tile: 'A' },
    live: {
      stake: 2000,
      days: 14,
      pnl: 186,
      shape: [1.3, 2.4, -0.9, 1.7, 2.9, 1.4, -3.2, 1.1, -2.3, 1.8, 2.1, -1.2, 0.8, 1.4],
      ticket: { side: 'BUY', units: '620 WIF', px: '$2.38', total: '$1,475.60' },
    },
    results: {
      winner: 'Momentum + trailing stop',
      winRate: 56,
      wins: 18,
      losses: 14,
      trades: 32,
      open: { name: 'WIF long', sub: 'entry $2.31 · now $2.44' },
    },
  },
};