// Gemini's answer: it places the three saved shots. The say line streams, then one card: the three photos (numbered)
// get a read sweep and their captions land one by one, while a small map of Austria and southern Bavaria (real
// borders, ../map-data.js) fills in; pins 1-3 drop onto Hallstatt and Salzburg (the market and the fortress fan out
// around the Salzburg dot), then a route line draws from Munich (MUC) through Salzburg to Hallstatt. The sound bed
// drops a pin hit on each landing (cues read T.pins). Every value is written from t.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic } from '../../../lib.js';
import { MAP_W, MAP_H, NEIGH, BAVARIA, AUSTRIA, LAKES, PTS } from '../map-data.js?v=1';

const SAY = 'All three are in Austria: Hallstatt and Salzburg.';
const SHOTS = [
  { img: 'hallstatt.jpg', cap: 'Hallstatt, Austria', pos: '50% 40%' },
  { img: 'market.jpg', cap: 'Salzburg Christmas market', pos: '50% 50%' },
  { img: 'fortress.jpg', cap: 'Hohensalzburg Fortress, Salzburg', pos: '72% 40%' },
];
// pins in map units plus a px fan-out: the market (2) and the fortress (3) are 400 m apart, so they spread either
// side of the Salzburg dot to read at this scale
const PINS = [
  { n: 1, x: PTS.hallstatt[0], y: PTS.hallstatt[1], dx: 3, dy: 0 },
  { n: 2, x: PTS.salzburg[0], y: PTS.salzburg[1], dx: -9, dy: -1 },
  { n: 3, x: PTS.salzburg[0], y: PTS.salzburg[1], dx: 8, dy: 1 },
];
const pct = (x, y) => `left:${((x / MAP_W) * 100).toFixed(2)}%;top:${((y / MAP_H) * 100).toFixed(2)}%`;
// Munich -> Salzburg -> Hallstatt, a gentle arc on each leg
const [mx, my] = PTS.munich, [sx, sy] = PTS.salzburg, [hx, hy] = PTS.hallstatt;
const ROUTE = `M${mx} ${my}Q${((mx + sx) / 2).toFixed(1)} ${(Math.min(my, sy) - 22).toFixed(1)} ${sx} ${sy}Q${((sx + hx) / 2 + 4).toFixed(1)} ${((sy + hy) / 2 - 16).toFixed(1)} ${hx} ${hy}`;

export default {
  times(r) {
    return { say: r + 0.02, card: r + 0.12, scan: r + 0.28, cap: r + 0.62, map: r + 0.3, pins: r + 1.45, route: r + 2.25, end: r + 3.8 };
  },

  build(k, { el, esc, img }) {
    const T = k.T;
    const say = el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const shots = SHOTS.map((s, i) => `<figure class="gm-shot"><span class="gm-ph"><img src="${img(s.img)}" alt="" style="object-position:${s.pos}"/><i class="gm-sweep"></i><b class="gm-n">${i + 1}</b></span><figcaption>${esc(s.cap)}</figcaption></figure>`).join('');
    const pins = PINS.map((p) => `<span class="gm-pin" style="${pct(p.x, p.y)};margin:${p.dy}px 0 0 ${p.dx}px"><i class="gm-shadow"></i><span class="gm-head"><b>${p.n}</b></span></span>`).join('');
    const card = el(`<div class="gm-card">
  <div class="gm-shots">${shots}</div>
  <div class="gm-map">
    <svg viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="xMidYMid slice">
      <path class="gm-neigh" d="${NEIGH}"/><path class="gm-bav" d="${BAVARIA}"/><path class="gm-at" d="${AUSTRIA}"/><path class="gm-lake" d="${LAKES}"/>
      <path class="gm-route" d="${ROUTE}" pathLength="100"/>
    </svg>
    <span class="gm-cc" style="${pct(345, 196)}">AUSTRIA</span><span class="gm-cc gm-cc-de" style="${pct(70, 34)}">BAVARIA</span>
    <span class="gm-city gm-muc" style="${pct(mx, my)}"><i></i><em>Munich</em><small>MUC</small></span>
    <span class="gm-city gm-sz" style="${pct(sx, sy)}"><i></i><em>Salzburg</em></span>
    <span class="gm-city gm-hs" style="${pct(hx, hy)}"><i></i><em>Hallstatt</em></span>
    <span class="gm-city gm-vie" style="${pct(PTS.vienna[0], PTS.vienna[1])}"><i></i><em>Vienna</em></span>
    ${pins}
  </div>
</div>`.replace(/>\s+</g, '><'));
    const qa = (s) => [...card.querySelectorAll(s)];
    const n = {
      vis: say.querySelector('.qc-vis'), hid: say.querySelector('.qc-hid'), shots: qa('.gm-shot'), sweeps: qa('.gm-sweep'),
      caps: qa('.gm-shot figcaption'), nums: qa('.gm-n'), map: card.querySelector('.gm-map'), pins: qa('.gm-pin'),
      heads: qa('.gm-head'), shadows: qa('.gm-shadow'), route: card.querySelector('.gm-route'), muc: card.querySelector('.gm-muc'),
      cities: qa('.gm-city:not(.gm-muc)'),
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

        // each shot is read in turn (a bright band crosses it), then its caption and number land
        n.shots.forEach((s, i) => {
          const sw = seg(t, T.scan + i * 0.22, T.scan + i * 0.22 + 0.42);
          n.sweeps[i].style.transform = `translateX(${lerp(-110, 110, inOutCubic(sw)).toFixed(1)}%)`;
          n.sweeps[i].style.opacity = (sw > 0 && sw < 1 ? 1 : 0).toString();
          const cp = outCubic(seg(t, T.cap + i * 0.25, T.cap + i * 0.25 + 0.3));
          n.caps[i].style.opacity = cp.toFixed(3);
          n.caps[i].style.transform = cp >= 1 ? 'none' : `translateY(${((1 - cp) * 6).toFixed(2)}px)`;
          const nb = outBack(seg(t, T.cap + i * 0.25, T.cap + i * 0.25 + 0.3));
          n.nums[i].style.opacity = clamp(nb * 1.4).toFixed(3);
          n.nums[i].style.transform = `scale(${lerp(0.4, 1, nb).toFixed(4)})`;
        });

        const m = outCubic(seg(t, T.map, T.map + 0.4));
        n.map.style.opacity = m.toFixed(3);
        n.cities.forEach((ci, i) => { ci.style.opacity = seg(t, T.map + 0.2 + i * 0.08, T.map + 0.45 + i * 0.08).toFixed(3); });

        // pins drop from above and bounce in, their shadows tighten as they land
        n.pins.forEach((p, i) => {
          const a0 = T.pins + i * 0.24;
          const d = seg(t, a0 - 0.18, a0);
          const land = outBack(seg(t, a0, a0 + 0.24));
          p.style.opacity = clamp(d * 3).toFixed(3);
          const y = d < 1 ? lerp(-34, 0, d * d) : 0;
          const sq = d >= 1 ? lerp(0.82, 1, land) : 1;
          n.heads[i].style.transform = `translate(-50%, calc(-100% + ${y.toFixed(2)}px)) scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})`;
          n.shadows[i].style.opacity = (0.55 * d).toFixed(3);
          n.shadows[i].style.transform = `translate(-50%, -50%) scale(${lerp(0.3, 1, d).toFixed(3)})`;
        });

        // the route from Munich draws on, the airport marker lights first
        n.muc.style.opacity = seg(t, T.route - 0.2, T.route).toFixed(3);
        const rt = inOutCubic(seg(t, T.route, T.route + 0.7));
        n.route.style.strokeDashoffset = (100 - rt * 100).toFixed(2);
        n.route.style.opacity = rt > 0 ? '1' : '0';
      },
    };
  },
};
