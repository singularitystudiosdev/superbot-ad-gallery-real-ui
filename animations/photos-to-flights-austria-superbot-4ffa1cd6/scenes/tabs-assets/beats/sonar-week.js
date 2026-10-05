// Perplexity Sonar's answer: the week. The say line streams the finding, then a Sonar answer card: four numbered
// source chips pop in (Perplexity's citation dots), a November strip lights Thu 19 (markets open) and sweeps the
// Fri 20 to Fri 27 range, and the route draws node to node: Munich (MUC), 1h 46m train to Salzburg, 2h to Hallstatt.
// Nov 20 2026 and Nov 27 2026 are Fridays. Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';

const SAY = 'Nov 20 to 27. Christmas markets open Nov 19, first snow likely, smaller crowds than December.';
const SOURCES = [['salzburg.info', '#c8102e'], ['christkindlmarkt.co.at', '#2f7d32'], ['geosphere.at', '#1565c0'], ['oebb.at', '#e2001a']];
const DAYS = [['Wed', 18], ['Thu', 19], ['Fri', 20], ['Sat', 21], ['Sun', 22], ['Mon', 23], ['Tue', 24], ['Wed', 25], ['Thu', 26], ['Fri', 27], ['Sat', 28]];
const R0 = 2, R1 = 9; // index of Fri 20 and Fri 27 in DAYS
const FACTS = ['Christmas markets open Nov 19', 'First snow likely', 'Smaller crowds than December'];
const ICON = {
  plane: '<svg viewBox="0 0 16 16"><path d="M14.6 9.3 9.2 6.6V2.9c0-.7-.5-1.4-1.2-1.4s-1.2.7-1.2 1.4v3.7L1.4 9.3v1.5l5.4-1.6v3.3l-1.6 1.1V15L8 14.2l2.8.8v-1.4l-1.6-1.1V9.2l5.4 1.6z"/></svg>',
  train: '<svg viewBox="0 0 16 16"><rect x="3.5" y="1.8" width="9" height="9.6" rx="2.2"/><path d="M3.5 7h9M6 13.5l-1.5 1.7M10 13.5l1.5 1.7"/><circle cx="6" cy="9.3" r=".6"/><circle cx="10" cy="9.3" r=".6"/></svg>',
};

export default {
  times(r) {
    return { say: r + 0.02, card: r + 0.12, src: r + 0.22, days: r + 0.55, range: r + 0.95, open: r + 1.35, facts: r + 1.5, route: r + 1.8, end: r + 3.5 };
  },

  build(k, { el, esc }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const src = SOURCES.map(([d, c], i) => `<span class="sn-src"><i style="background:${c}">${i + 1}</i>${esc(d)}</span>`).join('');
    const days = DAYS.map(([w, d], i) => `<span class="sn-day${i >= R0 && i <= R1 ? ' sn-in' : ''}${d === 19 ? ' sn-open' : ''}"><small>${w}</small><b>${d}</b></span>`).join('');
    const facts = FACTS.map((f) => `<span class="sn-fact"><i></i>${esc(f)}</span>`).join('');
    const card = el(`<div class="sn-card">
  <div class="sn-srcs">${src}</div>
  <div class="sn-cal">
    <div class="sn-mo"><b>November 2026</b><small>Nov 20 to 27</small></div>
    <div class="sn-days"><i class="sn-range"></i>${days}<em class="sn-flag">Markets open</em></div>
  </div>
  <div class="sn-facts">${facts}</div>
  <div class="sn-route">
    <span class="sn-node"><span class="sn-ic">${ICON.plane}</span><b>Munich (MUC)</b><small>Fly in</small></span>
    <span class="sn-leg"><i class="sn-line"></i><em>${ICON.train}1h 46m train</em></span>
    <span class="sn-node"><span class="sn-ic sn-dot"></span><b>Salzburg</b><small>Markets, fortress</small></span>
    <span class="sn-leg"><i class="sn-line"></i><em>${ICON.train}2h</em></span>
    <span class="sn-node"><span class="sn-ic sn-dot"></span><b>Hallstatt</b><small>The lake</small></span>
  </div>
</div>`.replace(/>\s+</g, '><'));
    const qa = (s) => [...card.querySelectorAll(s)];
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'), src: qa('.sn-src'), days: qa('.sn-day'),
      range: card.querySelector('.sn-range'), open: card.querySelector('.sn-open'), flag: card.querySelector('.sn-flag'),
      facts: qa('.sn-fact'), nodes: qa('.sn-node'), lines: qa('.sn-line'), legs: qa('.sn-leg em'), mo: card.querySelector('.sn-mo small'),
    };
    let lastSay = -1;

    return {
      nodes: [say, card],
      marks: [[T.card, card]],
      render(t) {
        const c = Math.floor(clamp((t - T.say) * 110, 0, SAY.length));
        if (c !== lastSay) { n.vis.textContent = SAY.slice(0, c); n.hid.textContent = SAY.slice(c); lastSay = c; }

        const a = outCubic(seg(t, T.card, T.card + 0.32));
        card.style.opacity = a.toFixed(3);
        card.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 12).toFixed(2)}px)`;

        n.src.forEach((s, i) => {
          const p = outBack(seg(t, T.src + i * 0.09, T.src + i * 0.09 + 0.28));
          s.style.opacity = clamp(p * 1.4).toFixed(3);
          s.style.transform = `scale(${lerp(0.7, 1, p).toFixed(4)})`;
        });
        n.days.forEach((d, i) => {
          const p = outCubic(seg(t, T.days + i * 0.025, T.days + i * 0.025 + 0.25));
          d.style.opacity = p.toFixed(3);
          d.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 6).toFixed(2)}px)`;
          d.classList.toggle('sn-lit', i >= R0 && i <= R1 && t >= T.range + ((i - R0) / (R1 - R0)) * 0.36);
        });
        // the range pill sweeps from Fri 20 to Fri 27
        const rg = inOutCubic(seg(t, T.range, T.range + 0.4));
        n.range.style.opacity = clamp(rg * 4).toFixed(3);
        n.range.style.transform = `scaleX(${rg.toFixed(4)})`;
        n.mo.style.opacity = seg(t, T.range + 0.3, T.range + 0.5).toFixed(3);
        const op = outBack(seg(t, T.open, T.open + 0.3));
        n.flag.style.opacity = clamp(op * 1.4).toFixed(3);
        n.flag.style.transform = `translateX(-50%) scale(${lerp(0.6, 1, op).toFixed(4)})`;
        n.open.classList.toggle('sn-opened', t >= T.open);

        n.facts.forEach((f, i) => {
          const p = outCubic(seg(t, T.facts + i * 0.1, T.facts + i * 0.1 + 0.28));
          f.style.opacity = p.toFixed(3);
          f.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * -8).toFixed(2)}px)`;
        });

        // the route: each node pops as the line reaches it
        const legs = [[T.route + 0.22, T.route + 0.62], [T.route + 0.74, T.route + 1.1]];
        n.nodes.forEach((nd, i) => {
          const at = i === 0 ? T.route : legs[i - 1][1];
          const p = outBack(seg(t, at, at + 0.28));
          nd.style.opacity = clamp(p * 1.4).toFixed(3);
          nd.style.transform = `scale(${lerp(0.7, 1, p).toFixed(4)})`;
        });
        n.lines.forEach((l, i) => {
          const p = inOutCubic(seg(t, legs[i][0], legs[i][1]));
          l.style.transform = `scaleX(${p.toFixed(4)})`;
          n.legs[i].style.opacity = seg(t, legs[i][0] + 0.15, legs[i][1]).toFixed(3);
        });
      },
    };
  },
};
