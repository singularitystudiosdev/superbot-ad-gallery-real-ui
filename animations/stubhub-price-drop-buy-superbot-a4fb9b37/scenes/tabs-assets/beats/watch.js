// ChatGPT agent's answer: the price watch. The say line streams, then the watch card draws the cheapest 200-level
// pair's price since 10:00 AM: it drifts down from $171 for six hours, then drops through the red dashed $150 limit
// to $138 at 4:12 PM. The readout and the clock follow the line's head; the sound bed's tick lands on T.drop.
// The chart is SVG drawn from PRICES; every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'Pair in Section 224 just dropped to $138 each.';
// [minutes after 10:00 AM, $ per ticket]: the cheapest pair in the 200 level, Wed, Oct 21 game, watched on Oct 5
const PRICES = [[0, 171], [15, 172], [30, 170], [45, 173], [60, 169], [75, 171], [90, 168], [105, 170], [120, 166],
  [135, 167], [150, 164], [165, 166], [180, 163], [195, 165], [210, 161], [225, 163], [240, 160], [255, 162], [270, 158],
  [285, 160], [300, 157], [315, 159], [330, 156], [345, 158], [360, 155], [369, 155], [372, 138]];
const LIMIT = 150, HI = 180, LO = 130, DRIFT_MIN = 369, END_MIN = 372;
// plot box in the SVG's viewBox (0 0 600 150)
const X0 = 38, X1 = 584, Y0 = 8, Y1 = 124;
// the head crosses $150 at this fraction of the drop's clock (the drop is linear $155 -> $138 over 4:09 to 4:12,
// eased by headMin's ^1.6)
const CROSS_S = Math.pow((155 - LIMIT) / (155 - 138), 1 / 1.6);
const xOf = (m) => X0 + (m / END_MIN) * (X1 - X0);
const yOf = (p) => Y0 + ((HI - p) / (HI - LO)) * (Y1 - Y0);

function priceAt(m) {
  for (let i = 1; i < PRICES.length; i++) {
    const [ma, pa] = PRICES[i - 1], [mb, pb] = PRICES[i];
    if (m <= mb) return lerp(pa, pb, seg(m, ma, mb));
  }
  return PRICES[PRICES.length - 1][1];
}
const clock = (m) => {
  const h24 = 10 + Math.floor(m / 60), mm = Math.floor(m % 60);
  return `${((h24 + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
};

export default {
  times(r) {
    return {
      say: r + 0.02, card: r + 0.14, draw: r + 0.3, drift: r + 1.2, drop: r + 1.44, end: r + 1.76,
    };
  },

  build(k, { el, esc }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const grid = [140, 150, 160, 170].map((p) => p === LIMIT ? '' :
      `<line class="pw-grid" x1="${X0}" x2="${X1}" y1="${yOf(p).toFixed(1)}" y2="${yOf(p).toFixed(1)}"/><text class="pw-yl" x="${X0 - 7}" y="${(yOf(p) + 3.5).toFixed(1)}">$${p}</text>`).join('');
    const xl = [[0, '10 AM'], [120, '12 PM'], [240, '2 PM']].map(([m, s]) => `<text class="pw-xl" x="${xOf(m).toFixed(1)}" y="143">${s}</text>`).join('');
    const yl = yOf(LIMIT).toFixed(1);
    const card = el(`<div class="pw-card">
  <div class="pw-head"><b>Knicks vs Celtics</b><span>Wed, Oct 21, 7:30 PM · Madison Square Garden</span>
    <em class="pw-live"><i class="pw-dot"></i><span class="pw-l1">Watching 1,936 listings</span><span class="pw-l2">Under your limit</span></em></div>
  <div class="pw-sub"><div class="pw-what"><b>Cheapest pair, 200 level</b><small>per ticket, incl. fees</small></div>
    <div class="pw-read"><b class="pw-price">$171</b><small class="pw-at">10:00 AM</small><i class="pw-delta">▼ $33</i></div></div>
  <svg class="pw-chart" viewBox="0 0 600 150" aria-hidden="true">
    <defs><linearGradient id="pw-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8ab4ff" stop-opacity=".28"/><stop offset="1" stop-color="#8ab4ff" stop-opacity="0"/></linearGradient></defs>
    ${grid}
    <text class="pw-yl pw-yl-lim" x="${X0 - 7}" y="${(+yl + 3.5).toFixed(1)}">$150</text>
    <line class="pw-base" x1="${X0}" x2="${X1}" y1="${Y1}" y2="${Y1}"/>
    ${xl}<text class="pw-xl pw-xl-end" x="${xOf(END_MIN).toFixed(1)}" y="143">4:12 PM</text>
    <path class="pw-area" d=""/>
    <line class="pw-limit" x1="${X0}" x2="${X1}" y1="${yl}" y2="${yl}"/>
    <text class="pw-limt" x="${X0 + 8}" y="${(+yl - 5).toFixed(1)}">Your limit $150</text>
    <path class="pw-line" d=""/>
    <circle class="pw-ring" r="5"/><circle class="pw-head-dot" r="4"/>
    <g class="pw-tag"><rect x="-98" y="-33" width="88" height="21" rx="6"/><text x="-54" y="-19">$138 · 4:12 PM</text></g>
  </svg>
</div>`);
    const q = (s) => card.querySelector(s);
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'), line: q('.pw-line'), area: q('.pw-area'),
      dot: q('.pw-head-dot'), ring: q('.pw-ring'), tag: q('.pw-tag'), price: q('.pw-price'), at: q('.pw-at'),
      delta: q('.pw-delta'), live: q('.pw-live'), l1: q('.pw-l1'), l2: q('.pw-l2'), pdot: q('.pw-dot'),
      limit: q('.pw-limit'), limt: q('.pw-limt'), xend: q('.pw-xl-end'),
    };
    let lastSay = -1, lastD = '';

    // minutes after 10:00 AM the line's head has reached at t: a six-hour drift, then the three-minute drop
    const headMin = (t) => t < T.drift
      ? DRIFT_MIN * inOutCubic(seg(t, T.draw, T.drift))
      : lerp(DRIFT_MIN, END_MIN, Math.pow(seg(t, T.drift, T.drop), 1.6));

    return {
      nodes: [say, card],
      marks: [[T.card, card]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, SAY.length));
        if (c !== lastSay) { n.vis.textContent = SAY.slice(0, c); n.hid.textContent = SAY.slice(c); lastSay = c; }

        const a = outCubic(seg(t, T.card, T.card + 0.32));
        card.style.opacity = a.toFixed(3);
        card.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 12).toFixed(2)}px)`;

        const m = headMin(t), p = priceAt(m);
        // the drawn line: every keyframe up to the head, then the head itself
        const pts = PRICES.filter(([pm]) => pm < m).map(([pm, pp]) => [xOf(pm), yOf(pp)]);
        pts.push([xOf(m), yOf(p)]);
        const d = 'M' + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L');
        if (d !== lastD) {
          n.line.setAttribute('d', d);
          n.area.setAttribute('d', `${d} L${pts[pts.length - 1][0].toFixed(1)} ${Y1} L${X0} ${Y1} Z`);
          lastD = d;
        }
        const [hx, hy] = pts[pts.length - 1];
        n.dot.setAttribute('cx', hx.toFixed(1)); n.dot.setAttribute('cy', hy.toFixed(1));
        n.ring.setAttribute('cx', hx.toFixed(1)); n.ring.setAttribute('cy', hy.toFixed(1));
        const under = p < LIMIT, hit = t >= T.drop;
        card.classList.toggle('pw-under', under);
        card.classList.toggle('pw-hit', hit);
        n.dot.setAttribute('r', (4 + 2.2 * outBack(seg(t, T.drop, T.drop + 0.3))).toFixed(2));
        const rp = seg(t, T.drop, T.drop + 0.6);
        n.ring.setAttribute('r', (5 + 16 * outCubic(rp)).toFixed(2));
        n.ring.style.opacity = (rp > 0 ? 0.9 * (1 - rp) : 0).toFixed(3);
        // the limit line flashes as the price crosses it
        const cross = T.drift + (T.drop - T.drift) * CROSS_S;
        const fl = Math.sin(Math.PI * seg(t, cross, cross + 0.5));
        n.limit.style.strokeWidth = (1.6 + 1.6 * fl).toFixed(2);
        n.limt.style.opacity = (0.85 + 0.15 * fl).toFixed(3);

        const tg = outBack(seg(t, T.drop + 0.04, T.drop + 0.3));
        n.tag.style.opacity = clamp(tg * 1.4).toFixed(3);
        n.tag.setAttribute('transform', `translate(${hx.toFixed(1)} ${hy.toFixed(1)}) scale(${lerp(0.6, 1, tg).toFixed(3)})`);
        n.xend.style.opacity = seg(t, T.drop - 0.05, T.drop + 0.2).toFixed(3);

        n.price.textContent = '$' + Math.round(p);
        n.at.textContent = clock(Math.min(m, END_MIN));
        const dl = outBack(seg(t, T.drop, T.drop + 0.3));
        n.delta.style.opacity = clamp(dl * 1.4).toFixed(3);
        n.delta.style.transform = `scale(${lerp(0.6, 1, dl).toFixed(3)})`;
        const sw = seg(t, T.drop, T.drop + 0.2);
        n.l1.style.opacity = (1 - sw).toFixed(3);
        n.l2.style.opacity = sw.toFixed(3);
        n.pdot.style.opacity = hit ? '1' : (0.45 + 0.55 * Math.abs(Math.sin(t * 5))).toFixed(3);
      },
    };
  },
};
