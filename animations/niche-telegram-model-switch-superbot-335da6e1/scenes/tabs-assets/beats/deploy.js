// Deploy beat: Cloudflare Workers, a tool (routed the way the data fork routes its DuckDB step), deploys the bot. Its
// line streams and a deploy card styled on the Workers dashboard rises: the Workers mark and "Workers & Pages /
// harbor-faq-bot" on top, an upload bar that runs to the end and resolves to "Deployed", then three rows land in
// turn: the route harbor-faq-bot.workers.dev, "Webhook set for Telegram" and "Online 24/7". Cloudflare's orange is
// the card's one accent (the bar, the checks, the live dot). Not a second code panel.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Deployed it to Cloudflare Workers, so it answers day and night.';
const WORKER = 'harbor-faq-bot';
const ROUTE = 'harbor-faq-bot.workers.dev';
// the rows that land once it is deployed: [label, value, kind]
const ROWS = [
  ['Route', ROUTE, 'url'],
  ['Webhook', 'Webhook set for Telegram', 'ok'],
  ['Status', 'Online 24/7', 'live'],
];
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams
const SAY_AT = 0.048;
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.32;                     // the card rising in
const BAR_AT = 0.12;                   // the card landing to the upload starting
const BAR = 0.6; /* deliberate */      // the upload bar running to the end
const POP = 0.2;                       // "Deployed" and its check popping in
const ROWS_AT = 0.1;                   // deployed to the first row
const STAGGER = 0.14;                  // one row to the next
const ROW_IN = 0.24;                   // a row rising in

const svg = (d, cls) => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const CHECK = svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>', 'cf-ck');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.b0 = T.card + BAR_AT;
    T.b1 = T.b0 + BAR;                 // deployed
    T.rows = ROWS.map((_, i) => T.b1 + POP + ROWS_AT + i * STAGGER);
    T.end = Math.max(T.rows[ROWS.length - 1] + ROW_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const logo = x.brand('cloudflare-workers-logo.svg');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cf-card">
      <div class="cf-hd"><span class="cf-logo"><img src="${logo}" alt=""/></span><span class="cf-crumb">Workers &amp; Pages<i>/</i><b>${x.esc(WORKER)}</b></span></div>
      <div class="cf-dep">
        <div class="cf-dl"><span class="cf-st"><i class="cf-spin"></i>${CHECK}</span><b class="cf-sl">Uploading ${x.esc(WORKER)}</b><span class="cf-pc">0%</span></div>
        <div class="cf-bar"><i></i></div>
      </div>
      ${ROWS.map(([l, v, kind]) => `<div class="cf-row cf-${kind}"><span class="cf-k">${x.esc(l)}</span><span class="cf-v">${kind === 'live' ? '<i class="cf-dot"></i>' : ''}${x.esc(v)}</span>${kind === 'ok' ? CHECK : ''}</div>`).join('')}
    </div>`);
    const $ = (s) => card.querySelector(s);
    const bar = $('.cf-bar i'), pc = $('.cf-pc'), sl = $('.cf-sl'), spin = $('.cf-spin'), ck = $('.cf-st .cf-ck'), dep = $('.cf-dep');
    const rows = [...card.querySelectorAll('.cf-row')];
    const dot = $('.cf-dot');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, lastPc = '', lastSl = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.rows[ROWS.length - 1], card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the upload: the bar runs, the percentage with it, then "Deployed" with the orange check
        const p = inOutCubic(seg(t, T.b0, T.b1));
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        const done = t >= T.b1;
        const v = done ? '' : `${Math.round(p * 100)}%`;
        if (v !== lastPc) { pc.textContent = v; lastPc = v; }
        const s = done ? 'Deployed' : `Uploading ${WORKER}`;
        if (s !== lastSl) { sl.textContent = s; lastSl = s; }
        dep.classList.toggle('cf-done', done);
        spin.style.opacity = (1 - seg(t, T.b1 - 0.08, T.b1 + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const o = outCubic(seg(t, T.b1, T.b1 + POP));
        ck.style.opacity = o.toFixed(3);
        ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;

        rows.forEach((n, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          n.style.opacity = q.toFixed(3);
          n.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px)`;
        });
        // the live dot breathes once as Online lands (a ring that opens and fades)
        const g = seg(t, T.rows[2], T.rows[2] + 0.6);
        dot.style.boxShadow = g > 0 && g < 1 ? `0 0 0 ${(6 * outCubic(g)).toFixed(2)}px rgba(243, 128, 32, ${(0.35 * (1 - g)).toFixed(3)})` : 'none';
      },
    };
  },
};
