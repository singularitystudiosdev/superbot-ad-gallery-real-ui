// Hand-authored fork of chatgpt-memecoins-superbot-cae00e01 (not a var89 cell: the generator does not own this
// folder). Same two cards, then a prediction-market TRACKER thread: sam asks for a tracker, superbot connects to
// Polymarket read-only, builds a watchlist, arms alert rules and reports; sam says go and the rebuilt Polymarket
// market page fills the frame while superbot's alerts fire over it. Nothing is ever bought, sold or held: the bot
// reads odds, volume and listings and notifies. Every market, odds figure and volume number is the spot's script,
// made up.
export default {
  "id": "chatgpt-polymarket-tracker-superbot-a0b21a33",
  "voice": "ChatGPT",
  "introLine": "ChatGPT can't watch Polymarket for you",
  "redWord": "watch",
  "slamLine": "superbot can.",
  "ask": "make me a Polymarket tracker",
  "reply": "Looks good, let's do it",
  "connect": { "app": "Polymarket", "handle": "@sam" },
  "watchlist": {
    "say": "Connected Polymarket, read-only. Here's what I would keep an eye on for you.",
    "title": "Watchlist",
    "sub": "3 markets tracked",
    "steps": ["Opened your Polymarket watchlist, read-only", "Pulled odds, 24h volume and liquidity"],
    // [market, tag, odds %, 24h volume, why it is tracked]
    "rows": [
      ["Fed cuts rates in December?", "Economy", 34, "$18.2M", "odds move"],
      ["Chiefs beat the Bills on Sunday?", "NFL", 41, "$6.4M", "volume spike"],
      ["Bitcoin above $150k by Dec 31?", "Crypto", 22, "$9.1M", "new market"]
    ]
  },
  "rules": {
    "say": "Alerts armed. I ping you when the market moves, never when you should.",
    "title": "Alert rules",
    "sub": "3 rules · on",
    "steps": ["Checking odds every minute", "Checking volume and new listings"],
    // [rule, threshold detail]
    "rows": [
      ["Odds move ≥ 10 pts within 1h", "any watched market"],
      ["Volume spike 3x in 24h", "tracked markets only"],
      ["New market listed in Economy", "Economy · Fed · macro"]
    ]
  },
  "summary": {
    "rows": [
      ["Tracking", "3 markets · Economy, NFL, Crypto"],
      ["Alerts", "odds ≥ 10 pts in 1h · volume 3x · new listings"],
      ["Digest", "one summary every morning at 9am"],
      ["Read-only", "Tracking only. Not financial advice. superbot never trades."]
    ],
    "ask": "Want me to turn on alerts?"
  },
  "live": {
    "say": "Alerts are on. Watching this market for you, read-only.",
    "title": "Polymarket",
    "sub": "tracking · read-only",
    "steps": ["Re-opened the market you were watching", "Armed 3 alert rules on this page"],
    // the page: one watched market whose odds move 34 -> 52 across the hour, with the rule list beside it
    "market": "Fed cuts rates in December?",
    "tag": "Economy",
    "from": 34,
    "to": 52,
    "volume": "$18,204,381",
    "liquidity": "$412,900",
    "holders": "9,412",
    // [notification title, notification detail]
    "notes": [
      ["Odds moved +11 pts in 1h", "Fed cuts rates in December?"],
      ["Volume spike 3x in 24h", "Fed cuts rates in December?"],
      ["Odds moved 34% → 52% in 1h", "Fed cuts rates in December?"]
    ]
  }
};