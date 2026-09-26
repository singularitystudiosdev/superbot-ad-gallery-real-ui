// Google Sheets, the log: the "Trade Journal" spreadsheet on its YOLO LOG tab, in Sheets' own light grid (column
// letters, row numbers, formula bar, sheet tabs). The selection walks across row 5 and each cell is typed in, the
// formula bar echoing the active cell, until the Filled status chip lands. Earlier rows are made up.
import { seg, outCubic, outBack, lerp } from '../../../lib.js';
import { say, chips, cardIn } from './kit.js?v=1';

const SAY = 'Logged it in YOLO LOG, row 5.';
const HEAD = ['Date', 'Ticker', 'Shares', 'Price', 'Cost', 'Thesis', 'Status'];
const PAST = [
  ['9/08', 'NVDA', '2 sh', '$181.30', '$362.60', 'AI capex', 'Closed'],
  ['9/16', 'INTC', '12 sh', '$24.10', '$289.20', 'chip act hype', 'Closed'],
  ['9/22', 'SPY', '1 sh', '$661.05', '$661.05', 'boring money', 'Open'],
];
export const ROW = ['9/25', 'GME', '9.4 sh', '$26.60', '$250.00', 'insider buys', 'Filled'];
const COLS = 'ABCDEFG'.split('');
const W = [36, 40, 40, 48, 52, 78, 50];

export default {
  times(r) {
    const T = { r };
    T.chipIn = [r + 0.25];
    T.chipDone = [r + 0.85];
    T.card = r + 0.75;
    T.cells = ROW.map((_, i) => T.card + 0.55 + i * 0.32);
    T.done = T.cells[6] + 0.3;
    T.end = T.done + 1.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const line = say(x, SAY, T.done + 0.1, 70);
    const ch = chips(x, [['Opening your trade sheet', 'Opened Trade Journal, tab YOLO LOG']], T.chipIn, T.chipDone);
    const tpl = W.map((w) => w + 'fr').join(' ');
    const cell = (v, j, cls = '') => `<span class="gs-c ${cls}${j >= 4 ? '' : ''}${j === 6 && v ? ` gs-st gs-st-${v.toLowerCase()}` : ''}">${v ? `<i>${v}</i>` : ''}</span>`;
    const card = x.el(`<div class="gs-card">
      <div class="gs-top"><img src="${x.brand('google-sheets-logo.svg')}" alt=""/><span class="gs-doc"><b>Trade Journal</b><small>File  Edit  View  Insert  Format  Data</small></span><span class="gs-share">Share</span></div>
      <div class="gs-fx"><span class="gs-ref">A5</span><i>fx</i><span class="gs-fv"></span></div>
      <div class="gs-grid" style="--cols:${tpl}">
        <div class="gs-r gs-hd"><span class="gs-n"></span>${COLS.map((c) => `<span class="gs-c">${c}</span>`).join('')}</div>
        <div class="gs-r gs-h"><span class="gs-n">1</span>${HEAD.map((h, j) => cell(h, 99 + j)).join('')}</div>
        ${PAST.map((row, i) => `<div class="gs-r"><span class="gs-n">${i + 2}</span>${row.map((v, j) => cell(v, j)).join('')}</div>`).join('')}
        <div class="gs-r gs-new"><span class="gs-n">5</span>${ROW.map((_, j) => `<span class="gs-c${j === 6 ? ' gs-st gs-st-filled' : ''}"><i></i></span>`).join('')}<b class="gs-sel"></b></div>
        <div class="gs-r"><span class="gs-n">6</span>${COLS.map(() => '<span class="gs-c"></span>').join('')}</div>
      </div>
      <div class="gs-tabs"><span class="gs-plus">+</span><span>Watchlist</span><span class="on">YOLO LOG</span><span>Taxes lol</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const newCells = [...card.querySelectorAll('.gs-new .gs-c')];
    const vals = newCells.map((c) => c.querySelector('i'));
    const sel = $('.gs-sel'), ref = $('.gs-ref'), fv = $('.gs-fv');
    const offs = [];
    let acc = 0;
    const tot = W.reduce((a, b) => a + b, 0);
    W.forEach((w) => { offs.push(acc / tot); acc += w; });
    return {
      nodes: [...ch.rows, card, line.n],
      marks: [...ch.marks, [T.card, card], [T.done + 0.1, line.n]],
      render(t) {
        line.render(t);
        ch.render(t);
        cardIn(card, t, T.card);
        // the active cell: the last one whose typing has started
        let j = 0;
        T.cells.forEach((a, i) => { if (t >= a - 0.08) j = i; });
        const prev = Math.max(0, j - 1);
        const m = outCubic(seg(t, T.cells[j] - 0.08, T.cells[j] + 0.06));
        const left = lerp(offs[prev], offs[j], j === 0 ? 1 : m), wid = lerp(W[prev], W[j], j === 0 ? 1 : m) / tot;
        sel.style.left = `calc(var(--gs-n) + (100% - var(--gs-n)) * ${left.toFixed(4)})`;
        sel.style.width = `calc((100% - var(--gs-n)) * ${wid.toFixed(4)})`;
        sel.style.opacity = (seg(t, T.card + 0.35, T.card + 0.5) * (1 - seg(t, T.done + 0.3, T.done + 0.6))).toFixed(3);
        const r = `${COLS[j]}5`;
        if (ref.textContent !== r) ref.textContent = r;
        let cur = '';
        vals.forEach((v, i) => {
          const a = T.cells[i], txt = ROW[i];
          const n = Math.round(txt.length * seg(t, a, a + 0.2));
          const s = txt.slice(0, n);
          if (v.textContent !== s) v.textContent = s;
          if (i === j) cur = s;
        });
        if (fv.textContent !== cur) fv.textContent = cur;
        const st = seg(t, T.cells[6], T.cells[6] + 0.35);
        newCells[6].style.setProperty('--chip', outCubic(st).toFixed(3));
        newCells[6].style.transform = st > 0 && st < 1 ? `scale(${lerp(0.85, 1, outBack(st)).toFixed(4)})` : '';
        card.classList.toggle('is-logged', t >= T.done);
      },
    };
  },
};
