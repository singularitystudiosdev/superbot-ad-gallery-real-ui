// Claude Opus 5.5, hard code + architecture: the repo "tendietracker" scaffolds file by file, then the WSB scraper
// and the price API stream in, line by line, with light syntax colour.
import { seg, outCubic } from '../../../lib.js';
import { sayer, rise, setText } from './kit.js';

const SAY = 'Scaffolding tendietracker. Scraper first, then the price API.';
const FILES = [
  ['scraper/wsb.ts', '+142'], ['api/prices.ts', '+96'], ['db/schema.sql', '+38'], ['app/page.tsx', '+105'],
];
const SRC = [
  ['scraper/wsb.ts', [
    'export async function scrapeWSB(since: Date) {',
    '  const posts = await reddit.listing("r/wallstreetbets", { since });',
    '  const mentions = new Map<string, number>();',
    '  for (const p of posts) for (const t of tickers(p.body))',
    '    mentions.set(t, (mentions.get(t) ?? 0) + 1);',
    '  return mentions;',
    '}',
  ]],
  ['api/prices.ts', [
    'export async function GET(req: Request) {',
    '  const t = new URL(req.url).searchParams.get("ticker");',
    '  const [mentions, candles] = await Promise.all([',
    '    db.mentions(t, "7d"), quotes.candles(t, "1h"),',
    '  ]);',
    '  return Response.json({ t, mentions, candles });',
    '}',
  ]],
];
const RX = /(\/\/.*$)|("[^"]*")|\b(export|async|function|const|await|for|of|return|new)\b|\b(Date|Map|string|number|Request|Response|Promise|URL)\b|\b([A-Za-z_]\w*)(?=\()/g;
function hl(line, esc) {
  let out = '', i = 0;
  for (const m of line.matchAll(RX)) {
    out += esc(line.slice(i, m.index));
    const cls = m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : m[4] ? 'y' : 'f';
    out += `<i class="tx-${cls}">${esc(m[0])}</i>`;
    i = m.index + m[0].length;
  }
  return out + esc(line.slice(i));
}
const REPO = '<svg class="tt-ric" viewBox="0 0 16 16"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.35;
    T.file = FILES.map((_, i) => T.card + 0.3 + i * 0.2);
    T.a0 = T.card + 0.6; T.a1 = T.a0 + 1.7;
    T.b0 = T.a1 + 0.3; T.b1 = T.b0 + 1.7;
    T.done = T.b1 + 0.15;
    T.end = T.done + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const card = x.el(`<div class="tt-card tt-code">
      <div class="tt-hd">${REPO}<b>tendietracker</b><span class="tt-br">main</span><em class="tt-state"><i class="tt-spin"></i><span>Scaffolding</span></em></div>
      <div class="tt-bd">
        <div class="tt-tree">${FILES.map(([f, n]) => `<div class="tt-f"><span>${f}</span><em>${n}</em></div>`).join('')}</div>
        <div class="tt-src"><div class="tt-tab"></div><div class="tt-pre"></div></div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.tt-f')], tab = $('.tt-tab'), pre = $('.tt-pre');
    const state = $('.tt-state'), stateL = state.lastElementChild, spin = $('.tt-spin');
    // both files pre-built; one is shown at a time, its lines typed by a clip that runs left to right
    const panes = SRC.map(([, lines], fi) => {
      const pane = x.el(`<div class="tt-pane">${lines.map((l) => `<div class="tt-ln"><span>${hl(l, x.esc) || ' '}</span></div>`).join('')}</div>`);
      pre.appendChild(pane);
      const t0 = fi ? T.b0 : T.a0, t1 = fi ? T.b1 : T.a1;
      const tot = lines.reduce((s, l) => s + l.length + 6, 0);
      let acc = 0;
      const spans = [...pane.querySelectorAll('.tt-ln > span')].map((s, i) => {
        const a = t0 + (t1 - t0) * (acc / tot); acc += lines[i].length + 6;
        return { s, a, b: t0 + (t1 - t0) * (acc / tot) };
      });
      return { pane, spans };
    });
    return {
      nodes: [say.node, card],
      marks: [[T.r, say.node], [T.card, card]],
      render(t) {
        say.render(t, T.r + 0.05);
        rise(card, seg(t, T.card, T.card + 0.5), 18);
        const fi = t < T.b0 ? 0 : 1;
        setText(tab, SRC[fi][0]);
        panes.forEach((p, i) => { p.pane.style.display = i === fi ? '' : 'none'; });
        panes[fi].spans.forEach(({ s, a, b }) => {
          const q = seg(t, a, b);
          s.style.clipPath = q >= 1 ? 'none' : `inset(0 ${((1 - q) * 100).toFixed(1)}% 0 0)`;
        });
        rows.forEach((row, i) => {
          rise(row, seg(t, T.file[i], T.file[i] + 0.3), 6, 1);
          row.classList.toggle('on', (i === 0 && t >= T.a0 && t < T.b0) || (i === 1 && t >= T.b0 && t < T.done));
        });
        const d = t >= T.done;
        state.classList.toggle('ok', d);
        setText(stateL, d ? '4 files, +381' : 'Scaffolding');
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        state.style.transform = d ? `scale(${(1 + 0.1 * Math.sin(Math.PI * seg(t, T.done, T.done + 0.35))).toFixed(4)})` : 'none';
      },
    };
  },
};
