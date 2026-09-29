// Real Solana memecoins for the ticker scan, pulled 2026-09-29 02:54 UTC. Market cap and 24h volume from CoinGecko
// (api/v3/coins/markets, category solana-meme-coins, ordered by volume); icons are each coin's CoinGecko image,
// resized to 64 px in ../../../img/tokens/. POPCAT is the hit; its pair stats come from DexScreener (Raydium
// POPCAT/SOL, pair FRhB8L7Y9Qq41qZXYLtC2nw8An1RJfLLxRF2x9RwLLMo). Only the scan scores and the trade's 1m
// candles are the ad's own illustration.
export const TOKENS = [
  { s: "TRUMP", name: "Official Trump", icon: "trump.png", mc: "$549M", vol: "$267M" },
  { s: "PIPPIN", name: "pippin", icon: "pippin.png", mc: "$17.2M", vol: "$2.8M" },
  { s: "FWOG", name: "Fwog", icon: "fwog.png", mc: "$6.6M", vol: "$1.3M" },
  { s: "PURPE", name: "PURPLE PEPE", icon: "purpe.png", mc: "$6.6M", vol: "$228K" },
  { s: "BONK", name: "Bonk", icon: "bonk.png", mc: "$299M", vol: "$57.3M" },
  { s: "ANSEM", name: "The Black Bull", icon: "ansem.png", mc: "$60.1M", vol: "$4.9M" },
  { s: "WIF", name: "dogwifhat", icon: "wif.png", mc: "$226M", vol: "$78.1M" },
  { s: "MELANIA", name: "Melania Meme", icon: "melania.png", mc: "$99.3M", vol: "$9.1M" },
  { s: "MANIFEST", name: "Manifesting", icon: "manifest.png", mc: "$10.3M", vol: "$337K" },
  { s: "TSUKI", name: "Tsuki", icon: "tsuki.png", mc: "$4.1M", vol: "$596K" },
  { s: "BUTTCOIN", name: "Buttcoin", icon: "buttcoin.png", mc: "$11.9M", vol: "$729K" },
  { s: "VINE", name: "Vine", icon: "vine.png", mc: "$7.9M", vol: "$4.9M" },
  { s: "PONKE", name: "PONKE", icon: "ponke.png", mc: "$13.7M", vol: "$2.5M" },
  { s: "BERT", name: "Bertram The Pomeranian", icon: "bert.png", mc: "$14.3M", vol: "$1.0M" },
  { s: "USELESS", name: "Useless Coin", icon: "useless.png", mc: "$230M", vol: "$40.4M" },
  { s: "PNUT", name: "Peanut the Squirrel", icon: "pnut.png", mc: "$51.2M", vol: "$8.1M" },
  { s: "MYRO", name: "MYRO", icon: "myro.png", mc: "$2.3M", vol: "$422K" },
  { s: "MEW", name: "cat in a dogs world", icon: "mew.png", mc: "$40.9M", vol: "$6.7M" },
  { s: "BOBO", name: "Bobo", icon: "bobo.png", mc: "$5.9M", vol: "$514K" },
  { s: "TROLL", name: "TROLL", icon: "troll.png", mc: "$44.4M", vol: "$2.7M" },
  { s: "BAN", name: "Comedian", icon: "ban.png", mc: "$62.6M", vol: "$6.9M" },
  { s: "HAROLD", name: "Harold", icon: "harold.png", mc: "$15.6M", vol: "$493K" },
  { s: "NEET", name: "Not in Employment, Education, or Training", icon: "neet.png", mc: "$42.3M", vol: "$2.8M" },
  { s: "CHILLGUY", name: "Just a chill guy", icon: "chillguy.png", mc: "$12.5M", vol: "$4.3M" },
  { s: "FARTCOIN", name: "Fartcoin", icon: "fartcoin.png", mc: "$162M", vol: "$44.2M" },
  { s: "BOME", name: "BOOK OF MEME", icon: "bome.png", mc: "$65.9M", vol: "$8.7M" },
  { s: "MOODENG", name: "Moo Deng", icon: "moodeng.png", mc: "$44.5M", vol: "$8.3M" },
  { s: "GIGA", name: "Gigachad", icon: "giga.png", mc: "$20.3M", vol: "$2.0M" },
  { s: "ZEREBRO", name: "Zerebro", icon: "zerebro.png", mc: "$31.1M", vol: "$6.3M" },
  { s: "TRIPLET", name: "Tung Tung Tung Sahur", icon: "triplet.png", mc: "$10.2M", vol: "$618K" },
  { s: "GME", name: "GME", icon: "gme.png", mc: "$3.7M", vol: "$759K" },
  { s: "ACT", name: "Act I The AI Prophecy", icon: "act.png", mc: "$9.8M", vol: "$9.3M" },
  { s: "POPCAT", name: "Popcat", icon: "popcat.png", mc: "$49.8M", vol: "$11.2M" },
  { s: "PENGU", name: "Pudgy Penguins", icon: "pengu.png", mc: "$568M", vol: "$229M" },
  { s: "GOAT", name: "Goatseus Maximus", icon: "goat.png", mc: "$18.7M", vol: "$2.3M" },
  { s: "AURA", name: "aura", icon: "aura.png", mc: "$8.4M", vol: "$901K" },
];

export const HIT = {
  s: "POPCAT", name: "Popcat", icon: "popcat.png",
  mc: 49.71, // $M at entry (DexScreener marketCap 49,710,681)
  supplyM: 980.1, // circulating supply, M (marketCap / priceUsd 0.05072)
  // the Raydium pair, as Axiom's token page shows it (DexScreener): liquidity, 24h pair volume and txns, pair age
  dex: "Raydium", age: "2y", supply: "980M", // pair created 2023-12-12
  liq: "$3.97M", vol24: "$512K", buys24: 1635, sells24: 1311,
};

export const SOL_USD = 116.78; // CoinGecko simple/price, same pull
