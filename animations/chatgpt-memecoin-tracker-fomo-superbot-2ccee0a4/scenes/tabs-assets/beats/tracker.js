// Ask 1's answer, once fomo is connected read-only: two work cards and a summary, back to back.
//   1. Watchlist: eight trending fomo tokens land as rows of plain market data (price, 24h change, volume, holders,
//      liquidity); two prices tick once the table is live.
//   2. Alert rules: five rules land and their switches flip on (volume spike, holder surge, liquidity change,
//      trending, daily digest). Every rule and alert is neutral market information, never a claim about a project.
//   3. Summary: the setup in three lines, the tracking-only line, and the question the user answers with ask 2.
// Every row is a real Solana memecoin listed on fomo: the three from the original spot plus five from Jupiter's live
// top-trending list on 2026-09-28 (icons from their token metadata, see brand/CREDITS.txt). The last five carry their
// real 24h move that day; every other figure is mock UI. Nothing here ranks, rates or recommends a token.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { stdTimes, workBeat, grow } from './wk.js';

// tk, icon, price (USD), 24h %, volume 24h, holders, liquidity
export const WATCH = [
  { tk: '$PAID', icon: 'paid.png', px: 0.01842, ch: 12.4, vol: '$3.1M', hold: '21.4K', liq: '$612K' },
  { tk: '$STONK', icon: 'stonk.png', px: 0.00417, ch: -2.1, vol: '$1.2M', hold: '9.8K', liq: '$288K' },
  { tk: '$JEANPHIL', icon: 'jeanphil.png', px: 0.00093, ch: 8.7, vol: '$904K', hold: '6.1K', liq: '$174K' },
  { tk: '$neet', icon: 'neet.png', px: 0.0612, ch: 19.9, vol: '$5.6M', hold: '38.2K', liq: '$1.4M' },
  { tk: '$e/acc', icon: 'eacc.png', px: 0.0288, ch: 67.4, vol: '$7.9M', hold: '17.5K', liq: '$920K' },
  { tk: '$CATE', icon: 'cate.png', px: 0.000712, ch: 3.2, vol: '$410K', hold: '44.9K', liq: '$356K' },
  { tk: '$BOME', icon: 'bome.png', px: 0.00146, ch: -3.9, vol: '$18.2M', hold: '161K', liq: '$4.8M' },
  { tk: '$USELESS', icon: 'useless.png', px: 0.2214, ch: -13.2, vol: '$11.4M', hold: '52.7K', liq: '$2.3M' },
];
// significant-figure price, the way token screens print sub-cent prices
export const fmtPx = (v) => '$' + (v >= 0.1 ? v.toFixed(4) : v >= 0.01 ? v.toFixed(5) : v >= 0.001 ? v.toFixed(5) : v.toFixed(6));
export const fmtCh = (c) => `${c >= 0 ? '+' : ''}${c.toFixed(1)}%`;
// two live ticks once the table has landed: [row, at (s after body), price multiple]
const TICKS = [[0, 1.45, 1.0065], [4, 1.8, 0.9952]];

const ICON = {
  vol: '<path d="M4 20V12M9 20V8M14 20v-5M19 20V4"/>',
  users: '<path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="8" r="3.5"/><path d="M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.6a3.5 3.5 0 0 1 0 6.8"/>',
  drop: '<path d="M12 21a6.5 6.5 0 0 0 6.5-6.5c0-4-6.5-11-6.5-11S5.5 10.5 5.5 14.5A6.5 6.5 0 0 0 12 21z"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
};
const RULES = [
  { ic: 'vol', name: 'Volume spike', rule: 'Volume 3x its average in 5m' },
  { ic: 'users', name: 'Holder surge', rule: 'Holders +20% in 1h' },
  { ic: 'drop', name: 'Liquidity change', rule: 'Liquidity moves 30%+ in 10m' },
  { ic: 'trend', name: 'Trending', rule: 'Token enters top 10 trending' },
  { ic: 'sun', name: 'Daily digest', rule: 'Every morning at 9:00' },
];

const SUM = [
  'Watchlist: <b>8</b> fomo tokens with price, 24h change, volume, holders and liquidity',
  'Alerts: <b>volume spikes</b>, <b>holder surges</b>, <b>liquidity changes</b> and <b>top 10 trending</b>, plus a daily digest',
  '<span class="tk-disc">Tracking only. Not financial advice. superbot never trades.</span>',
];
const SUM_SAY = "Here's the summary.";
const SUM_ASK = 'Want me to turn on alerts?';

function times(r) {
  const A = stdTimes(r, 3, 2.1, 0.25);
  const B = stdTimes(A.end, 2, 2.5, 0.25); // five rules land, then their switches flip on
  const S = { r: B.end, card: B.end + 0.3 };
  S.lines = SUM.map((_, i) => S.card + 0.25 + i * 0.4);
  S.ask = S.lines[SUM.length - 1] + 0.5;
  S.end = S.ask + 1.1;
  return { A, B, S, end: S.end };
}

function build(k, x) {
  const { A, B, S } = k.T;

  // 1. watchlist
  const rows = WATCH.map((w) => `<div class="tk-row"><span class="tk-tk"><img class="tk-ti" src="${x.brand('tokens/' + w.icon)}" alt=""/><b>${w.tk}</b></span>
      <span class="tk-px">${fmtPx(w.px)}</span><span class="tk-ch ${w.ch < 0 ? 'dn' : 'up'}">${fmtCh(w.ch)}</span>
      <span class="tk-n">${w.vol}</span><span class="tk-n">${w.hold}</span><span class="tk-n">${w.liq}</span></div>`).join('');
  const wl = workBeat(x, { T: A }, {
    say: 'fomo is connected, read-only. Building your watchlist.',
    title: 'Building your watchlist', sub: 'Trending on fomo, live',
    steps: ['Read <b>1,284</b> trending tokens on fomo', 'Pulled price, volume, holders and liquidity', 'Added <b>8</b> tokens to your watchlist'],
    body: `<div class="tk-h"><span>Token</span><span>Price</span><span>24h</span><span>Volume</span><span>Holders</span><span>Liquidity</span></div>${rows}
      <div class="tk-foot"><i class="tk-live"></i>Live from fomo, refreshed every 30s</div>`,
    cls: 'tk-wl',
  });
  const wlRows = wl.qa('.tk-row').map((n) => ({ n, px: n.querySelector('.tk-px') }));
  const wlFoot = wl.q('.tk-foot'), wlLive = wl.q('.tk-live');

  // 2. alert rules
  const rl = workBeat(x, { T: B }, {
    say: 'Watchlist is set. Now the alert rules.',
    title: 'Setting alert rules', sub: 'Sent to your phone',
    steps: ['Watching <b>8</b> tokens, every <b>30s</b>', 'Alerts go to <b>superbot</b> on your phone'],
    body: RULES.map((r) => `<div class="tk-rule"><span class="tk-ric"><svg viewBox="0 0 24 24">${ICON[r.ic]}</svg></span>
      <span class="tk-rtx"><b>${r.name}</b><small>${r.rule}</small></span><span class="tk-scope">All 8</span><span class="al-sw"><i></i></span></div>`).join(''),
    cls: 'tk-rules',
  });
  const rlRows = rl.qa('.tk-rule').map((n) => ({ n, sw: n.querySelector('.al-sw'), knob: n.querySelector('.al-sw i') }));

  // 3. summary
  const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SUM_SAY)}</span></div>`);
  const sum = x.el(`<div class="mb-sum"><div class="mb-sum-h"><img class="mb-gh" src="${x.brand('fomo-mark.png')}" alt=""/>Tracker setup</div>
      ${SUM.map((s, i) => `<div class="mb-l"><i>${i + 1}</i><span>${s}</span></div>`).join('')}
      <div class="mb-ask">${SUM_ASK}</div></div>`);
  const lines = [...sum.querySelectorAll('.mb-l')], ask = sum.querySelector('.mb-ask');
  const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
  let shown = -1;

  const marks = [...wl.marks, [A.body + 0.4, wl.card], ...rl.marks, [B.body + 0.4, rl.card], [S.r, sayEl], [S.card, sum], ...S.lines.map((a) => [a, sum])];

  function render(t) {
    wl.render(t);
    wlRows.forEach((r, i) => {
      const a = A.body + 0.12 + i * 0.1;
      const p = outCubic(seg(t, a, a + 0.35));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -10).toFixed(2)}px)`;
      const tk = TICKS.find(([row]) => row === i);
      const on = tk && t >= A.body + tk[1];
      const txt = fmtPx(WATCH[i].px * (on ? tk[2] : 1));
      if (r.px.textContent !== txt) r.px.textContent = txt;
      const f = tk ? Math.max(0, 1 - Math.abs(t - (A.body + tk[1] + 0.2)) / 0.35) : 0;
      r.px.style.background = f > 0 ? `rgba(${tk[2] >= 1 ? '52,211,153' : '255,107,107'},${(0.22 * f).toFixed(3)})` : '';
    });
    wlFoot.style.opacity = seg(t, A.body + 1.0, A.body + 1.3).toFixed(3);
    const pulse = ((t - A.body) % 1.2) / 1.2;
    wlLive.style.boxShadow = `0 0 0 ${(2 + 4 * pulse).toFixed(2)}px rgba(52,211,153,${(0.35 * (1 - pulse)).toFixed(3)})`;

    rl.render(t);
    rlRows.forEach((r, i) => {
      const a = B.body + 0.12 + i * 0.12, v = B.body + 1.15 + i * 0.16; // row lands at a, its switch flips on at v
      const p = outCubic(seg(t, a, a + 0.35));
      r.n.style.opacity = p.toFixed(3);
      r.n.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -10).toFixed(2)}px)`;
      const s = outBack(seg(t, v, v + 0.28));
      r.knob.style.transform = `translateX(${(14 * Math.min(1, s)).toFixed(2)}px)`;
      r.sw.classList.toggle('on', t >= v + 0.08);
      r.sw.style.transform = `scale(${lerp(1, 1.08, Math.sin(Math.PI * seg(t, v, v + 0.3))).toFixed(4)})`;
    });

    const n = streamCount(SUM_SAY, S.r + 0.05, 70, t);
    if (n !== shown) { vis.textContent = SUM_SAY.slice(0, n); hid.textContent = SUM_SAY.slice(n); shown = n; }
    const ci = outCubic(seg(t, S.card, S.card + 0.45));
    sum.style.opacity = ci.toFixed(3);
    sum.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
    lines.forEach((l, i) => grow(l, seg(t, S.lines[i], S.lines[i] + 0.35)));
    grow(ask, seg(t, S.ask, S.ask + 0.35));
  }

  return { nodes: [wl.sayEl, wl.card, rl.sayEl, rl.card, sayEl, sum], marks, render };
}

export default { times, build };
