// Node 1, Claude Opus 5.5: the frontend. Its real BuyPage.tsx streams into the editor (gen-data OPUS.tsx, verbatim),
// then the component renders: both states, from the same static markup react-dom/server produced (BUYPAGE).
import { OPUS, BUYPAGE } from '../gen-data.js';
import { el, esc, fmtS } from './kit.js';
import { clamp, seg, outCubic } from '../../../lib.js';

const LINES = OPUS.tsx.replace(/\n+$/, '').split('\n');
const LH = 12.4, VIEW = 33; // editor line height (panel px) and how many lines the editor shows
const KW = /\b(import|from|export|default|function|const|return|type|if|else)\b/g;

// a small TSX highlighter: strings, then keywords, JSX tags and numbers in what is left
function hl(line) {
  return line.split(/(`[^`]*`?|'[^']*'|"[^"]*")/g).map((part, i) => {
    if (i % 2) return `<i class="op-s">${esc(part)}</i>`;
    return esc(part)
      .replace(/(&lt;\/?)([A-Za-z][\w.]*)/g, '$1<i class="op-tg">$2</i>')
      .replace(KW, '<i class="op-k">$1</i>')
      .replace(/\b(\d+(?:\.\d+)?)\b/g, '<i class="op-n">$1</i>');
  }).join('');
}

export const opus = {
  key: 'opus',
  head: 'BuyPage.tsx · React',
  meta: `${OPUS.model} · ${LINES.length} lines · ${fmtS(OPUS.ms)}`,
  done: fmtS(OPUS.ms),
  thumb: () => `<div class="fg-thumb op-th"><div class="op-th-in">${BUYPAGE.paid}</div></div>`,
  mount(body) {
    body.classList.add('op');
    body.append(el(`<div class="op-ed">
      <div class="op-tabs"><span class="op-tab"><b>TSX</b>BuyPage.tsx<em>+${LINES.length}</em></span><span class="op-tab op-off">index.html</span></div>
      <div class="op-code"><div class="op-scroll">${LINES.map((l, i) => `<div class="op-ln"><u>${i + 1}</u><span>${hl(l) || ' '}</span></div>`).join('')}</div></div>
    </div>`), el(`<div class="op-pv">
      <div class="op-bar"><i></i><i></i><i></i><span>localhost:5173/buy</span></div>
      <div class="op-shot" data-s="idle"><small>&lt;BuyPage state="idle" /&gt;</small><div class="op-frame"><div class="op-in">${BUYPAGE.idle}</div></div></div>
      <div class="op-shot" data-s="paid"><small>&lt;BuyPage state="paid" /&gt;</small><div class="op-frame"><div class="op-in">${BUYPAGE.paid}</div></div></div>
    </div>`));
    return { lines: [...body.querySelectorAll('.op-ln')], scroll: body.querySelector('.op-scroll'), shots: [...body.querySelectorAll('.op-shot')], shown: -1 };
  },
  // p: seconds of panel play (0..2.65)
  render(s, p) {
    const n = Math.round(clamp(p / 1.7) * LINES.length);
    if (n !== s.shown) {
      s.lines.forEach((l, i) => l.classList.toggle('op-on', i < n));
      s.lines.forEach((l, i) => l.classList.toggle('op-cur', i === n - 1 && n < LINES.length));
      s.shown = n;
    }
    // follow the newest line, then settle on the paid branch once the file is written
    const follow = Math.max(0, n - VIEW + 2);
    const settle = Math.max(0, LINES.findIndex((l) => /state === 'paid'/.test(l)) - 6);
    const top = p < 1.75 ? follow : follow + (settle - follow) * outCubic(seg(p, 1.75, 2.3));
    s.scroll.style.transform = `translateY(${(-top * LH).toFixed(2)}px)`;
    s.shots.forEach((sh, i) => {
      const a = outCubic(seg(p, 1.05 + i * 0.55, 1.45 + i * 0.55));
      sh.style.opacity = a.toFixed(3);
      sh.style.transform = `translateY(${((1 - a) * 12).toFixed(2)}px)`;
    });
  },
};
