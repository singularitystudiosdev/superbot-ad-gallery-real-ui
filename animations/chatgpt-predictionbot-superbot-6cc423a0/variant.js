// Hand-authored fork of chatgpt-memecoins-superbot-cae00e01 (not a var89 cell: the generator does not own this
// folder). Same two cards, then a prediction-market bot thread: sam asks for a bot, superbot connects their
// Polymarket account, backtests strategies, scans live markets, flags buys and reports; sam says go and the
// bot trades the account up. Every market, price and dollar figure is the spot's script, made up.
export default {
  "id": "chatgpt-predictionbot-superbot-6cc423a0",
  "voice": "ChatGPT",
  "introLine": "ChatGPT says you shouldn't gamble",
  "redWord": "gamble",
  "slamLine": "WE DONT CARE!",
  "ask": "make me a prediction market trading bot",
  "reply": "Look's good, let's do it",
  "cash": 2500,
  "connect": { "app": "Polymarket", "handle": "@sam", "cash": "$2,500.00 USDC" },
  "backtest": {
    "say": "Connected your Polymarket account. Backtesting strategies before anything touches your cash.",
    "title": "Backtest",
    "sub": "18 months · 4,912 resolved markets",
    "steps": ["Pulled 4,912 resolved Polymarket markets", "Replayed 5 strategies trade by trade"],
    // [name, win rate %, return %]; the first row is the winner
    "rows": [
      ["Late momentum", 71, 64],
      ["News drift", 63, 38],
      ["Favorite bias", 58, 21],
      ["Longshot fade", 55, 12],
      ["Mean reversion", 49, -6]
    ]
  },
  "scan": {
    "say": "Late momentum wins. Scanning live markets for mispriced odds.",
    "title": "Market scan",
    "sub": "live now",
    "markets": 1412,
    // [market, tag, yes price ¢, model fair %]
    "flags": [
      ["Fed cuts rates in December?", "Economy", 34, 52],
      ["Chiefs beat the Bills on Sunday?", "NFL", 41, 58],
      ["Bitcoin above $150k by Dec 31?", "Crypto", 22, 37]
    ]
  },
  "summary": {
    "rows": [
      ["Strategy", "Late momentum · 71% win rate · +64% backtest"],
      ["Flagged", "3 buys, priced 15 to 18¢ under fair odds"],
      ["Plan", "$1,800 across all 3, max $700 per market"],
      ["Risk", "Auto-exit any position down 25%"]
    ],
    "ask": "Want me to start trading?"
  },
  "live": {
    "say": "Bot is live. Placing your 3 orders on Polymarket now.",
    "title": "Polymarket bot",
    "sub": "trading live",
    "steps": ["Armed the bot on your Polymarket account", "Opened your portfolio, 3 orders queued"],
    // [market, tag, stake $, entry ¢, final ¢, resolves Yes]
    "positions": [
      ["Fed cuts rates in December?", "Economy", 700, 34, 100, true],
      ["Chiefs beat the Bills on Sunday?", "NFL", 600, 41, 100, true],
      ["Bitcoin above $150k by Dec 31?", "Crypto", 500, 22, 63, false]
    ]
  }
};
