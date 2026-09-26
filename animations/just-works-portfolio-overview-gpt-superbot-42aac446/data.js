/* data.js - the numbers behind superbot.app/p/portfolio-overview, "Portfolio Overview".
   One read-only sync of three brokerage accounts (Schwab Individual, Schwab Roth IRA, Robinhood
   Individual) on Thu Sep 24 at 3:58 PM ET: 12 positions pulled, merged into 11 holdings, measured
   against a 60 / 30 / 10 stocks / bonds / cash target, with the level a 7% trailing stop would sit at
   under every stock. Nothing is traded: the page is an overview, and says so. The user, the accounts,
   the share counts, the prices and the highs are invented for the spot. Every figure the page, the hub
   and the steps print is derived here, so they never disagree. */

export const meta = {
  user: 'dana.k',
  day: 'Thu, Sep 24',
  synced: '3:58 PM ET',
  // the clock the top bar prints: the sync starts at 3:57:41 PM and lands at 3:58:09 PM, 28 s in
  syncStart: 15 * 3600 + 57 * 60 + 41,
  syncSecs: 28,
  target: { stocks: 60, bonds: 30, cash: 10 },
  trail: 7,
  resync: 'Weekdays, 4:05 PM ET',
};

export const accounts = [
  { id: 'schwab', broker: 'Charles Schwab', name: 'Individual', no: '4417', logo: './brand/schwab.svg' },
  { id: 'roth', broker: 'Charles Schwab', name: 'Roth IRA', no: '9082', logo: './brand/schwab.svg' },
  { id: 'rh', broker: 'Robinhood', name: 'Individual', no: '2231', logo: './brand/robinhood.svg' },
];

/* raw positions, one row per account line: [ticker, name, account, shares, last, highSinceBuy, class, logo] */
const RAW = [
  ['VTI', 'Vanguard Total Stock Market ETF', 'schwab', 210, 318.4, 324.1, 'stocks', null],
  ['AAPL', 'Apple', 'schwab', 120, 241.1, 252.6, 'stocks', './img/aapl.svg'],
  ['MSFT', 'Microsoft', 'schwab', 60, 512.3, 531.8, 'stocks', './img/msft.svg'],
  ['BND', 'Vanguard Total Bond Market ETF', 'schwab', 520, 73.9, null, 'bonds', null],
  ['SGOV', 'iShares 0-3 Month Treasury ETF', 'schwab', 150, 100.52, null, 'cash', null],
  ['VXUS', 'Vanguard Total Intl Stock ETF', 'roth', 300, 71.2, 72.85, 'stocks', null],
  ['SCHD', 'Schwab US Dividend Equity ETF', 'roth', 200, 28.4, 29.1, 'stocks', null],
  ['BND', 'Vanguard Total Bond Market ETF', 'roth', 320, 73.9, null, 'bonds', null],
  ['NVDA', 'NVIDIA', 'rh', 160, 181.6, 193.8, 'stocks', './img/nvda.svg'],
  ['TSLA', 'Tesla', 'rh', 40, 342.8, 351.2, 'stocks', './img/tsla.svg'],
  ['AMZN', 'Amazon', 'rh', 55, 228.3, 236.4, 'stocks', './img/amzn.svg'],
  ['CASH', 'Robinhood cash', 'rh', 1, 6210, null, 'cash', null],
];

const round2 = (n) => Math.round(n * 100) / 100;

export const total = round2(RAW.reduce((a, r) => a + r[3] * r[4], 0));

/* merged holdings, biggest first: a ticker held in two accounts is one row with both account tags */
export const holdings = (() => {
  const by = new Map();
  for (const [t, name, acct, sh, last, high, cls, logo] of RAW) {
    const h = by.get(t) || { t, name, accts: [], shares: 0, last, high, cls, logo, value: 0 };
    h.accts.push(acct);
    h.shares += sh;
    h.value = round2(h.value + sh * last);
    by.set(t, h);
  }
  return [...by.values()]
    .map((h) => ({ ...h, weight: round2((h.value / total) * 100) }))
    .sort((a, b) => b.value - a.value);
})();

export const byAccount = accounts.map((a) => {
  const rows = RAW.filter((r) => r[2] === a.id);
  return { ...a, positions: rows.length, value: round2(rows.reduce((s, r) => s + r[3] * r[4], 0)) };
});

/* the three sleeves against the target: now %, target %, drift in points, dollars over or under */
export const sleeves = ['stocks', 'bonds', 'cash'].map((k) => {
  const value = round2(RAW.filter((r) => r[6] === k).reduce((s, r) => s + r[3] * r[4], 0));
  const now = Math.round((value / total) * 1000) / 10;
  const target = meta.target[k];
  const gap = round2((target / 100) * total - value);
  return { k, label: k[0].toUpperCase() + k.slice(1), value, now, target, drift: Math.round((now - target) * 10) / 10, gap };
});

/* the 7% trailing-stop line under every stock: high since buy x 0.93, and how far the last price sits above it */
export const stops = holdings
  .filter((h) => h.high)
  .map((h) => {
    const line = round2(h.high * (1 - meta.trail / 100));
    const cushion = Math.round((h.last / line - 1) * 1000) / 10;
    return { t: h.t, name: h.name, logo: h.logo, accts: h.accts, high: h.high, line, last: h.last, cushion, hot: cushion < 2 };
  })
  .sort((a, b) => a.cushion - b.cushion);

export const counts = {
  accounts: accounts.length,
  positions: RAW.length,
  holdings: holdings.length,
  stocks: stops.length,
  hot: stops.filter((s) => s.hot).length,
};

const usd0 = (n) => '$' + Math.round(n).toLocaleString('en-US');
const pos = (t) => holdings.find((h) => h.t === t);
const stopOf = (t) => stops.find((s) => s.t === t);
const acctName = (id) => (id === 'rh' ? 'Robinhood' : id === 'roth' ? 'Schwab Roth' : 'Schwab');

/* the rows the hub's live card previews */
export const items = [
  { img: './img/nvda.svg', title: `NVDA, ${pos('NVDA').shares} sh`, price: usd0(pos('NVDA').value), meta: `${acctName('rh')}, ${stopOf('NVDA').cushion}% above its 7% stop`, source: 'rh' },
  { img: './img/aapl.svg', title: `AAPL, ${pos('AAPL').shares} sh`, price: usd0(pos('AAPL').value), meta: `${acctName('schwab')}, ${stopOf('AAPL').cushion}% above its stop`, source: 'schwab' },
  { img: './img/msft.svg', title: `MSFT, ${pos('MSFT').shares} sh`, price: usd0(pos('MSFT').value), meta: `${acctName('schwab')}, ${stopOf('MSFT').cushion}% above its stop`, source: 'schwab' },
  { img: './img/tsla.svg', title: `TSLA, ${pos('TSLA').shares} sh`, price: usd0(pos('TSLA').value), meta: `${acctName('rh')}, ${stopOf('TSLA').cushion}% above its stop`, source: 'rh' },
  { img: './img/amzn.svg', title: `AMZN, ${pos('AMZN').shares} sh`, price: usd0(pos('AMZN').value), meta: `${acctName('rh')}, ${stopOf('AMZN').cushion}% above its stop`, source: 'rh' },
];

const S = Object.fromEntries(sleeves.map((s) => [s.k, s]));

/* prose the page prints about its own numbers */
export const copy = {
  kicker: `Schwab + Robinhood, synced ${meta.synced}`,
  heroH1: `${usd0(total)} across 3 accounts. Stocks sit at ${S.stocks.now}%, your target is 60.`,
  heroDek: `Superbot signed in to both brokers, pulled all ${RAW.length} positions and put them on one page: where you stand against 60 / 30 / 10, and where a 7% trailing stop sits under every stock. Read-only, nothing was traded.`,
  driftH: 'Where you stand against 60 / 30 / 10',
  driftNote: `To get back to target, about ${usd0(S.stocks.gap * -1)} would move out of stocks: ${usd0(S.bonds.gap)} to bonds and ${usd0(S.cash.gap)} to cash. Superbot only shows the math. You decide.`,
  positionsH: `Every holding, both brokers`,
  stopsH: '7% trailing stop, every stock',
  stopsDek: 'Stop line = highest close since you bought, less 7%. Levels only, no orders placed.',
  watchH: 'Keeps watching',
  watchDek: 'The next sync runs on its own. You hear about it only when something moves.',
};

/* what Superbot keeps an eye on after the sync */
export const watch = [
  { icon: 'clock', k: 'Re-sync', v: meta.resync, note: 'Both brokers, read-only' },
  { icon: 'scale', k: 'Drift alert', v: 'Any sleeve 5 pts off', note: `Stocks are ${S.stocks.drift} pts over now` },
  { icon: 'shield', k: 'Stop alert', v: 'A close under its line', note: `${counts.hot} stock within 2% today` },
  { icon: 'bell', k: 'Digest', v: 'Fridays, 5:00 PM ET', note: 'One page, both accounts' },
];
