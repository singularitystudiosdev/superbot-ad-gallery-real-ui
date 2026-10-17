// Road-trip beat (the 'roadtrip' variant) in the pitch deck's frame (pitchdeck.fad54971.js), with Google Maps where the
// deck has slides: asked "Plan a road trip from LA to SF on a map", Gemini answers in one line, then the card generates
// exactly as the deck does: six view thumbs shimmer as skeletons and land in order while "Planning route N/6" counts
// them, and the stage lands the route overview from a slight zoom while the blue route draws LA to SF and each stop
// pops as the head passes it. Then, where the deck turns slides, the map's camera flies stop to stop (Santa Barbara,
// San Luis Obispo, Big Sur): the next chevron presses, the stop becomes the selected red pin, its place card rises and
// the blue thumb ring steps to its thumb. The card markup, clock and render are the deck's own (build() mirrors
// pitchdeck.fad54971.js line for line); only the slide walls are swapped for one live map. The frame is the deck's
// stylesheet (../pitchdeck.fad54971.css), the map's own rules ../roadmaps.40d88617.css; both load with the module.
// Geography is roadtrip.9bc0f433.js's public-domain data (Natural Earth land, TIGER/Line CA-1 / US-101); every view is
// one map drawn at its own camera, the filmstrip the same markup scaled down.
import { lerp, seg, outCubic, streamCount, pressScale } from '../../../lib.9b47fc30.js';
import { track } from '../../../loads.9e82faf1.js';
import { LAND, ROUTE, STOPS, DAYS } from './roadtrip.9bc0f433.js';
// the bakery frame's sheet styles the deck head's Share button (chat.css .bk-share) like its Expand
import { loadSheet as loadFrameSheet } from './bakery.005f5570.js?v=3';
import { shareBtn } from './share.29a362ea.js';

const SAY = 'Here’s a 3-day coastal drive from LA to SF.';
const SHEETS = ['../pitchdeck.fad54971.css?v=5', '../roadmaps.40d88617.css?v=1'].map((f) => new URL(f, import.meta.url).href);
const LANDS = [0.4, 0.52, 0.64, 0.76, 0.88, 1]; // when each thumb lands, as a share of the generation window (the deck's)
const N = LANDS.length;
const STEP = 84; // filmstrip pitch: a 76px thumb plus the 8px gap
const W = 496, H = 279; // the stage, in card px
const DRAW = 0.55; // seconds the route takes to draw, LA to SF
const POP = 0.18, FADE = 0.24; // a stop pops, then its name fades in

// lucide icons (api.iconify.design/lucide/{chevron-left,chevron-right}.svg), the deck's own
const ICON = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
const PREV = ICON('m15 18l-6-6l6-6');
const NEXT = ICON('m9 18l6-6l-6-6');
// Google Maps' selected-place pin (tip at the stop) and the Material directions_car icon (Google Maps' own icon set,
// api.iconify.design/material-symbols/directions-car-rounded.svg)
const PIN = 'M0 0L-6.43 -12.75A7.2 7.2 0 1 1 6.43 -12.75Z';
const CAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 19v.5q0 .625-.437 1.063T4.5 21t-1.062-.437T3 19.5v-7.15q0-.175.025-.35t.075-.325L4.975 6.35q.2-.6.725-.975T6.875 5h10.25q.65 0 1.175.375t.725.975l1.875 5.325q.05.15.075.325t.025.35v7.15q0 .625-.437 1.063T19.5 21t-1.062-.437T18 19.5V19zm-.2-9h12.4l-1.05-3H6.85zm1.7 6q.625 0 1.063-.437T9 14.5t-.437-1.062T7.5 13t-1.062.438T6 14.5t.438 1.063T7.5 16m9 0q.625 0 1.063-.437T18 14.5t-.437-1.062T16.5 13t-1.062.438T15 14.5t.438 1.063T16.5 16"/></svg>';

const TOTAL_MI = DAYS.reduce((s, d) => s + d.mi, 0);
const TOTAL_MIN = DAYS.reduce((s, d) => s + d.mins, 0);
const dur = (m) => `${Math.floor(m / 60)} hr ${m % 60} min`;
// the six views: the whole route, then five stops (index into STOPS) with their place cards
const VIEWS = [
  { name: 'Route' },
  { name: 'Santa Barbara', stop: 1, sub: `Night 1, ${DAYS[0].mi} mi from LA` },
  { name: 'San Luis Obispo', stop: 2, sub: 'Day 2, lunch stop' },
  { name: 'Big Sur', stop: 3, sub: `Night 2, ${DAYS[1].mi} mi from Santa Barbara` },
  { name: 'Monterey', stop: 4, sub: 'Day 3, 17-Mile Drive' },
  { name: 'San Francisco', stop: 5, sub: `End of the drive, ${TOTAL_MI} mi` },
];

// equirectangular at lat 36, 100 world px per degree of latitude
const KX = Math.cos((36 * Math.PI) / 180);
const pt = ([lon, lat]) => [(lon + 120) * KX * 100, (36 - lat) * 100];
const d2 = (p) => p.map((v) => v.toFixed(1)).join(' ');
// Natural Earth's mainland is clipped at lat 33.5 and 38.3 and closed along lon -117.6; zoomed views see past all three,
// so the ring runs on south to the border and north to Shelter Cove along town coordinates (approximate) and closes inland
const SOUTH = [[-117.12, 32.53], [-117.28, 32.85], [-117.38, 33.19], [-117.61, 33.42], [-117.7, 33.46]];
const NORTH = [[-123.12, 38.45], [-123.25, 38.51], [-123.53, 38.77], [-123.74, 38.95], [-123.8, 39.45], [-124.07, 40.03], [-110, 40.03], [-110, 32.53]];
const RINGS = [[...SOUTH, ...LAND[0].slice(0, -3), ...NORTH], ...LAND.slice(1)];
const LAND_D = RINGS.map((r) => `M${r.map((p) => d2(pt(p))).join('L')}Z`).join('');
const RW = ROUTE.map(pt);
const ROUTE_D = `M${RW.map(d2).join('L')}`;

// stops snap to their nearest route vertex, so each marker sits on the line and pops as the drawing head reaches it
const cum = RW.reduce((a, p, i) => { a.push(i ? a[i - 1] + Math.hypot(p[0] - RW[i - 1][0], p[1] - RW[i - 1][1]) : 0); return a; }, []);
const PLACE = STOPS.map(([name, lat, lon]) => {
  const [x, y] = pt([lon, lat]);
  let bi = 0, bd = Infinity;
  RW.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; bi = i; } });
  return { name, x: RW[bi][0], y: RW[bi][1], f: cum[bi] / cum[cum.length - 1] };
});
const LAST = PLACE.length - 1;
const POPAT = PLACE.map((s) => 1 - Math.cbrt(1 - s.f)); // share of DRAW at which the outCubic-eased head reaches each stop
// names sit right of their stop, inland; Los Angeles goes above (the nav is below it) and Monterey / Big Sur nudge apart
const NAME_AT = [[0, -10, 'middle'], [10, 4, 'start'], [10, 4, 'start'], [10, 9, 'start'], [10, -1, 'start'], [10, 4, 'start']];
const SEA = pt([-123.0, 34.7]);

// a camera is the world point at the stage's centre and its zoom; the overview fits the route right of the directions
// card and above the nav, and each stop view zooms in 3x with its stop just right of centre
const xs = RW.map((p) => p[0]), ys = RW.map((p) => p[1]);
function fit(b, [x0, y0, x1, y1]) {
  const s = Math.min((x1 - x0) / (b[2] - b[0]), (y1 - y0) / (b[3] - b[1]));
  return { s, x: (b[0] + b[2]) / 2 - ((x0 + x1) / 2 - W / 2) / s, y: (b[1] + b[3]) / 2 - ((y0 + y1) / 2 - H / 2) / s };
}
const OVER = fit([Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], [196, 28, 400, 226]);
const ZOOM = OVER.s * 3;
const CAMS = VIEWS.map((v) => (v.stop === undefined ? OVER : { s: ZOOM, x: PLACE[v.stop].x - 40 / ZOOM, y: PLACE[v.stop].y + 6 / ZOOM }));
const mix = (a, b, f) => (f <= 0 ? a : { s: Math.exp(lerp(Math.log(a.s), Math.log(b.s), f)), x: lerp(a.x, b.x, f), y: lerp(a.y, b.y, f) });

// one map view: the land, the route, the stops and names in screen space, and the Maps UI (directions card, place cards)
const viewHtml = (cards) => `<div class="rm-v">
<svg class="rm-map" viewBox="0 0 ${W} ${H}" aria-hidden="true">
<g class="rm-w"><path d="${LAND_D}" fill="#f1efe8" fill-rule="evenodd"/>
<path class="rm-case" d="${ROUTE_D}" pathLength="1" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"/>
<path class="rm-line" d="${ROUTE_D}" pathLength="1" fill="none" stroke="#1a73e8" stroke-linecap="round" stroke-linejoin="round"/></g>
<text class="rm-sea" text-anchor="middle">Pacific Ocean</text>
${PLACE.map(() => `<g class="rm-dot"><circle r="4.5" fill="#fff" stroke="#3c4043" stroke-width="2.2"/></g><g class="rm-pin"><path d="${PIN}" fill="#ea4335"/><circle cy="-16" r="2.6" fill="#b31412"/></g>`).join('')}
${PLACE.map((p, i) => `<text class="rm-name" text-anchor="${NAME_AT[i][2]}">${p.name}</text>`).join('')}
</svg>
<div class="rm-dir">${CAR}<div><b>LA to San Francisco</b><span><em>${dur(TOTAL_MIN)}</em> (${TOTAL_MI} mi)</span></div></div>
${cards}</div>`;
const card = (v) => `<div class="rm-pc"><b>${v.name}</b><span>${v.sub}</span></div>`;

function makeMap(host) {
  const all = (s) => [...host.querySelectorAll(s)];
  return { w: host.querySelector('.rm-w'), cas: host.querySelector('.rm-case'), line: host.querySelector('.rm-line'), sea: host.querySelector('.rm-sea'), dots: all('.rm-dot'), pins: all('.rm-pin'), names: all('.rm-name') };
}
// draw one map at camera cam; st: draw (route share drawn), sea, and per stop pop, name (opacity) and pin (dot -> red pin)
function paint(m, cam, st) {
  const tx = W / 2 - cam.x * cam.s, ty = H / 2 - cam.y * cam.s;
  m.w.setAttribute('transform', `matrix(${cam.s.toFixed(5)} 0 0 ${cam.s.toFixed(5)} ${tx.toFixed(2)} ${ty.toFixed(2)})`);
  for (const [el, px] of [[m.cas, 7.5], [m.line, 4.5]]) {
    el.setAttribute('stroke-width', (px / cam.s).toFixed(3));
    el.setAttribute('stroke-dasharray', st.draw >= 1 ? 'none' : '1 1');
    el.setAttribute('stroke-dashoffset', (1 - st.draw).toFixed(4));
    el.setAttribute('opacity', st.draw > 0 ? '1' : '0');
  }
  m.sea.setAttribute('x', (SEA[0] * cam.s + tx).toFixed(1));
  m.sea.setAttribute('y', (SEA[1] * cam.s + ty).toFixed(1));
  m.sea.setAttribute('opacity', st.sea.toFixed(3));
  PLACE.forEach((p, i) => {
    const x = p.x * cam.s + tx, y = p.y * cam.s + ty;
    const at = `translate(${x.toFixed(2)} ${y.toFixed(2)})`;
    m.dots[i].setAttribute('transform', `${at} scale(${(st.pop[i] * (1 - st.pin[i])).toFixed(4)})`);
    m.pins[i].setAttribute('transform', `${at} scale(${(st.pop[i] * st.pin[i]).toFixed(4)})`);
    m.names[i].setAttribute('x', (x + NAME_AT[i][0]).toFixed(1));
    m.names[i].setAttribute('y', (y + NAME_AT[i][1]).toFixed(1));
    m.names[i].setAttribute('opacity', st.name[i].toFixed(3));
  });
}

let loaded = false;
function loadSheets() {
  if (loaded) return;
  loaded = true;
  for (const href of SHEETS) {
    if (document.querySelector(`link[href="${href}"]`)) continue;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    track(new Promise((done) => {
      l.onload = done;
      l.onerror = () => { console.error(new Error(`roadtrip variant stylesheet failed to load: ${href}`)); done(); };
    }));
    document.head.appendChild(l);
  }
}

export default {
  // the deck's clock: the card enters, the views generate over [w0, w1], then the camera moves at adv[]
  times(r, end = r + 2.35) {
    const w0 = r + 0.3, w1 = w0 + 1.0;
    return { r, card: r + 0.22, w0, w1, adv: [w1 + 0.2, w1 + 0.6, w1 + 1.0], end };
  },
  build(k, x) {
    loadSheets();
    loadFrameSheet();
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const block = x.el(`<div class="pd rm">
      <div class="pd-head"><b>LA to SF road trip</b><span>3 days, ${TOTAL_MI} mi</span>${shareBtn('LA to SF road trip')}<span class="pd-exp"><img src="${x.brand('maps-logo.svg')}" alt=""/>Open in Maps</span></div>
      <div class="pd-stage"><div class="pd-shm"><i></i></div>${viewHtml(VIEWS.slice(1).map(card).join(''))}
        <div class="pd-nav"><span class="pd-nb pd-prev">${PREV}</span><em></em><span class="pd-nb pd-next">${NEXT}</span></div>
        <span class="qc-genl">${x.tile('gemini')}Planning route<b class="qc-genn"></b></span>
      </div>
      <div class="pd-strip">${VIEWS.map((v) => `<div><div class="pd-th"><div class="pd-shm"><i></i></div><div class="pd-tin">${viewHtml(v.stop === undefined ? '' : card(v))}</div></div><div class="pd-n">${x.esc(v.name)}</div></div>`).join('')}<i class="pd-ring"></i></div>
    </div>`);
    const $ = (s) => block.querySelector(s);
    const stage = $('.pd-stage');
    const live = stage.querySelector(':scope > .rm-v');
    const liveMap = makeMap(live);
    const cards = [...live.querySelectorAll('.rm-pc')];
    const DONE = { draw: 1, sea: 1, pop: PLACE.map(() => 1), name: PLACE.map(() => 1) };
    const thumbs = [...block.querySelectorAll('.pd-th')].map((n, j) => {
      const v = n.querySelector('.rm-v');
      paint(makeMap(v), CAMS[j], { ...DONE, sea: j === 0 ? 1 : 0, pin: PLACE.map((_, i) => (i === LAST || i === VIEWS[j].stop ? 1 : 0)) });
      v.querySelector('.rm-pc')?.style.setProperty('opacity', '1');
      return { tin: n.querySelector('.pd-tin'), shm: n.querySelector('.pd-shm'), sh: n.querySelector('.pd-shm i') };
    });
    const labels = [...block.querySelectorAll('.pd-n')];
    const ring = $('.pd-ring'), counter = $('.pd-nav em'), prev = $('.pd-prev'), next = $('.pd-next');
    const stageSh = stage.querySelector(':scope > .pd-shm');
    const genl = $('.qc-genl'), count = $('.qc-genn');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, landed = -1, cur = -1;

    return {
      nodes: [say, block],
      marks: [[T.r, say], [T.card, block]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 70, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        block.style.opacity = ci.toFixed(3);
        block.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, ci).toFixed(4)})`;

        // generation: each thumb shimmers as a skeleton until its own landing time, then fades in and settles from a slight zoom
        const span = T.w1 - T.w0;
        const at = LANDS.map((s) => T.w0 + span * s);
        let done = 0;
        thumbs.forEach((th, i) => {
          const p = outCubic(seg(t, at[i], at[i] + 0.3));
          if (t >= at[i]) done++;
          th.shm.style.opacity = (1 - p).toFixed(3);
          th.sh.style.transform = `translateX(${lerp(-100, 100, ((t - T.card) * 1.4 + i * 0.17) % 1).toFixed(1)}%)`;
          th.tin.style.opacity = p.toFixed(3);
          th.tin.style.transform = p >= 1 ? 'none' : `scale(${lerp(1.08, 1, p).toFixed(4)})`;
        });
        if (done !== landed) { count.textContent = `${done}/${N}`; landed = done; }
        genl.style.opacity = (1 - seg(t, T.w1, T.w1 + 0.2)).toFixed(3);

        // the stage: its skeleton gives way to the route overview settling in from a slight zoom as that view lands
        const land = outCubic(seg(t, at[0], at[0] + 0.3));
        stageSh.style.opacity = (1 - land).toFixed(3);
        stageSh.firstElementChild.style.transform = thumbs[0].sh.style.transform;
        live.style.visibility = land > 0 ? '' : 'hidden';
        live.style.opacity = land.toFixed(3);
        live.style.transform = land < 1 ? `scale(${lerp(1.08, 1, land).toFixed(4)})` : 'none';

        // where the deck turns a slide the camera flies to the next stop: view j shows while arrived (p) and not left (q)
        const arrive = T.adv.map((a) => outCubic(seg(t, a, a + 0.32)));
        const idx = arrive[0] + arrive[1] + arrive[2];
        const ki = Math.min(Math.floor(idx), N - 2);
        const wv = VIEWS.map((_, j) => (j === 0 ? 1 : arrive[j - 1] || 0) * (1 - (arrive[j] || 0)));
        // the route draws once the map has landed, each stop popping as the head passes it
        const t0 = at[0] + 0.05;
        paint(liveMap, mix(CAMS[ki], CAMS[ki + 1], idx - ki), {
          draw: outCubic(seg(t, t0, t0 + DRAW)),
          sea: outCubic(seg(t, t0, t0 + 0.3)) * (1 - arrive[0]), // the ocean label is the overview's; zoomed views clip it
          pop: POPAT.map((u) => outCubic(seg(t, t0 + u * DRAW, t0 + u * DRAW + POP))),
          name: POPAT.map((u) => outCubic(seg(t, t0 + u * DRAW + 0.04, t0 + u * DRAW + 0.04 + FADE))),
          pin: PLACE.map((_, i) => (i === LAST ? 1 : VIEWS.reduce((s, v, j) => s + (v.stop === i ? wv[j] : 0), 0))),
        });
        cards.forEach((c, i) => {
          const p = arrive[i] || 0;
          c.style.opacity = wv[i + 1].toFixed(3);
          c.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
        });

        // the nav and the filmstrip follow: the counter, the label and the ring all swap halfway through a move
        const now = Math.round(idx);
        if (now !== cur) {
          counter.textContent = `${now + 1} / ${N}`;
          labels.forEach((l, i) => l.classList.toggle('on', i === now));
          cur = now;
        }
        prev.style.opacity = lerp(0.4, 1, Math.min(1, idx)).toFixed(3);
        next.style.transform = `scale(${T.adv.reduce((s, a) => s * pressScale(t, a, 0.18), 1).toFixed(4)})`;
        ring.style.opacity = outCubic(seg(t, at[0], at[0] + 0.3)).toFixed(3);
        ring.style.transform = now ? `translateX(${now * STEP}px)` : 'none';
      },
    };
  },
};
