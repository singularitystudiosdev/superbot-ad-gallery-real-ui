// Beat c: ANALYZING YOUR PREVIOUS CALLS.
// The chip's counter climbs to 1,284, the history card lists four past calls (caller, topic, duration, outcome),
// then the playbook it extracted lands: "Your greeting", "Refunds up to $50" and the reasons breakdown with its
// small bar. Every caller, topic, duration and figure is fictional. Pure function of t.
import { seg, outCubic, lerp } from '../../../lib.js';
import { ICO, fmt, chipRow, tickChip, pillHTML, pillParts, renderPill, rise, riseCard, counter } from './cc.js';

const CHIPS = [
  ['Reading your last 1,284 calls', 'Analyzed 1,284 past calls'],
  ['Sorting what worked', 'Sorted what worked'],
];
const ROWS = [
  ['Dana Whitfield', 'Billing', '4:12', 'Resolved', 'ok'],
  ['Owen Pike', 'Order 47110', '2:47', 'Resolved', 'ok'],
  ['Priya Raman', 'Return', '6:03', 'Refunded', 'rf'],
  ['Marcus Boyd', 'Delivery', '1:58', 'Resolved', 'ok'],
];
const REASONS = [['Billing', 41], ['Orders', 27], ['Returns', 18]];

export function times(r) {
  const T = { r };
  T.chipIn = [r + 0.10, r + 0.35];
  T.chipDone = [r + 0.85, r + 1.05];
  T.card = r + 0.80;
  T.build = r + 1.05;
  T.buildEnd = r + 2.25;
  T.pill = r + 2.35;
  T.done = r + 2.85;
  T.end = r + 4.20;
  return T;
}

export function build(x, T) {
  const chips = CHIPS.map(([run, done]) => chipRow(x, run, done));
  const card = x.el(`<div class="cc-card cc-calls">
    <div class="cc-head">
      <span class="cc-badge">${ICO.history}</span>
      <span class="cc-ht"><b>Call history</b><small>Last 90 days</small></span>
      <span class="cc-count"><b class="cc-cn">0</b><small>analyzed</small></span>
    </div>
    <ul class="cc-crows">
      ${ROWS.map(([who, topic, dur, out, cls]) => `<li class="cc-crow">
        <span class="cc-who">${who}</span><span class="cc-topic">${topic}</span><span class="cc-dur">${dur}</span>
        <em class="cc-out ${cls}">${out}</em></li>`).join('')}
    </ul>
    <div class="cc-play">
      <div class="cc-play-h">Your playbook</div>
      <div class="cc-pchips">
        <span class="cc-pchip">${ICO.check}Your greeting</span>
        <span class="cc-pchip">${ICO.check}Refunds up to $50</span>
        <span class="cc-pchip cc-pchip-b">
          <span class="cc-mini">${REASONS.map(([, v]) => `<i data-w="${v}"></i>`).join('')}</span>
          <span class="cc-mini-l"><b>Top reasons</b><small>${REASONS.map(([k, v]) => `${k} ${v}%`).join(' · ')}</small></span>
        </span>
      </div>
    </div>
    ${pillHTML(ICO.history, 'Compiling your playbook', 'Playbook ready')}
  </div>`);
  const p = pillParts(card);
  const rows = [...card.querySelectorAll('.cc-crow')];
  const play = card.querySelector('.cc-play');
  const pchips = [...card.querySelectorAll('.cc-pchip')];
  const mini = [...card.querySelectorAll('.cc-mini i')];
  const num = card.querySelector('.cc-cn');
  const c0 = chips[0];

  return {
    nodes: [...chips.map((c) => c.el), card],
    marks: [[T.chipIn[0], chips[0].el], [T.card, card], [T.buildEnd, card]],
    render(t) {
      // the first chip's own label is the running counter: "Analyzed 3 past calls" ... "Analyzed 1,284 past calls"
      const cn = Math.round(1284 * outCubic(seg(t, T.chipIn[0] + 0.08, T.chipDone[0])));
      c0.run = `Analyzed ${fmt(cn)} past calls`;
      chips.forEach((c, i) => tickChip(c, t, T.chipIn[i], T.chipDone[i], T.chipIn[i]));
      riseCard(card, t, T.card);
      counter(num, 0, 1284, T.build + 0.1, T.build + 1.1, t);
      rows.forEach((n, i) => rise(n, t, T.build + 0.22 + i * 0.12, 8));
      rise(play, t, T.build + 0.72);
      pchips.forEach((n, i) => rise(n, t, T.build + 0.82 + i * 0.1, 8));
      const bw = outCubic(seg(t, T.build + 1.0, T.build + 1.66));
      mini.forEach((n) => { n.style.width = (Number(n.dataset.w) * bw).toFixed(1) + '%'; });
      card.querySelector('.cc-mini').style.opacity = outCubic(seg(t, T.build + 0.95, T.build + 1.2)).toFixed(3);
      // the count in the header rides the same climb as the chip's label
      renderPill(p, t, T.pill, true);
      card.querySelector('.cc-cn').style.color = `rgba(236,236,236,${lerp(0.75, 1, outCubic(seg(t, T.build, T.build + 1.1))).toFixed(2)})`;
    },
  };
}

export default { id: 'calls', times, build };