// The lawn variant's art: Maps (in superbot) answers 'Add a garden in my front lawn visually, address is Raleigh,
// North Carolina, USA' with a Google-Maps-style card. The card is the ask's three beats: Maps opens on the address
// (a stylised Streets view of Raleigh, drawn here as SVG, no API key and no embed), the camera flies from the whole
// metro down to a residential block along the van Wijk and Nuij zoom-and-pan path, a red pin drops on one house and a
// small place card names the city, then the view zooms through into the photograph of that house's front lawn the way
// tapping a pin opens its photo, and a before/after wipe sweeps across it so the plain lawn turns into the planted
// garden. Every value is a pure function of t in the beat's window, so a frozen frame (?t=) renders identically to a
// live one.
//
// The card runs on its own clock, c = t - T.w0 in seconds, 5.481 s long (the route stretches the loop to fit it, chat
// .9b47fc30.js routeBy.lawn.extra). The Google Maps phase (the first 3.55 s of the original timing) plays at 1.3x, so
// its beats are the original times divided by 1.3 and every beat after it moves earlier by SHIFT = 3.55 - 3.55 / 1.3
// (0.819 s) and keeps its own duration (see MAPS_SPEED, MAPS_END and K below):
//   0.00 - 0.30  the card lands (thumb-land's landing, settle and shimmer)
//   0.115 - 0.808  the address types into the search pill
//   0.731 - 2.038  the camera flies from the metro to the street, one path under one ease
//   1.923 - 2.385  the pin drops on a spring (the original spring, time-scaled); its shadow is derived from its height
//   2.192 - 2.500  the place card rises and the chips fade in (2.269 - 2.500)
//   2.731 - 2.931  the pin, the place card and the chips leave
//   2.781 - 3.481  the map keeps zooming at the pin while the photograph fades in from 1.06x
//   3.431 - 3.631  the Before and After tags, the divider and the handle fade in (parked at 6%)
//   3.631 - 4.881  the wipe sweeps (a compositor wipe: no clip-path)
//   4.881 - 5.131  the tags, divider and handle leave
//   4.731 - 5.481  a warm sun wash crosses the beds
// The map's world is an HTML layer moved by a CSS transform (the compositor moves a rastered layer), the label tiers
// cross-fade on their own wrapper divs, and the pin and its shadow share one anchor.
//
// The two photographs are img/lawn.f5e1d276/{before,after}.jpg: a sourced CC0 house photo, and a model edit of that
// same photograph by which the garden is planted, so the wipe reads as one lawn changing. The edit is a full
// regeneration of the frame, not a garden drawn or composited onto the photo's own pixels (see
// img/lawn.f5e1d276/CREDITS.txt for the model, prompt and the framing measurements that hold the two together). The
// card is the inner 400x250 panel that goes inside the reply's artifact frame (gemini.9b47fc30.js .bk-fit); the frame,
// its title and its Open in Maps pill belong to the wiring, not here.
import { seg, lerp, outCubic, inOutCubic, clamp } from '../../../lib.9b47fc30.js';
import { landing, shimmer, settle } from './thumb-land.309eb9c5.js';

// Where the card's Open in Maps pill and the reply link point: the address the ask names, as a Maps search URL
// (developers.google.com/maps/documentation/urls/get-started), never a keyed Embed API call.
export const MAPS_QUERY = 'https://www.google.com/maps/search/?api=1&query=Raleigh%2C+North+Carolina';
export const LM_OPEN_IN_MAPS = MAPS_QUERY;

const CW = 400, CH = 250;    // the card's natural size, which is exactly the artifact frame's .bk-fit
const WW = 1200, WH = 750;   // the map's own drawing space, 1 unit = 1 card px at street zoom
const ADDRESS = 'Raleigh, North Carolina, USA';
const CHIPS = ['Directions', 'Save', 'Nearby', 'Send to phone'];

// the street grid of the residential quarter: 64 x 52 blocks between public streets, a row of houses along each side
// of every block. The house the pin lands on is the middle house of the south row of block (3, 3): a generic footprint.
const LAT = { x0: 488, x1: 936, y0: 244, y1: 556, dx: 64, dy: 52 };
const FAYETTEVILLE_X = 616, GLENWOOD_Y = 400, SECOND_X = 808;
const PARK = { x0: 808, x1: 936, y0: 452, y1: 556 };
const HOME = { x: 712, y: 440 };                 // the pin's house, the world point the camera flies to
const ANCHOR = { x: 200, y: 142 };               // where HOME sits in the card at street zoom: a little below centre, clear of the pill and the place card
// the fly-to's two ends as van Wijk and Nuij's (centre x, centre y, visible width w)
const FROM = { x: 604, y: 372, w: CW / 0.335 };  // the whole metro: both beltways, the lake and the river in frame
const TO = { x: HOME.x + (CW / 2 - ANCHOR.x), y: HOME.y + (CH / 2 - ANCHOR.y), w: CW }; // street level, 1 world unit per card px

// the card's clock, in seconds from T.w0
// The Google Maps phase is the card's first MAPS_END seconds at the original timing (the address typing, the fly-to, the
// pin drop, the place card and the chips, up to where the chrome starts to leave). It plays MAPS_SPEED times faster: a
// Maps beat at original time v sits at v / MAPS_SPEED. Everything after it keeps its own duration and starts SHIFT
// earlier, which is exactly the time the faster phase gives back. The beats below are written at their original times.
const MAPS_END = 3.55, MAPS_SPEED = 1.3;
const SHIFT = MAPS_END - MAPS_END / MAPS_SPEED;   // 0.8192 s
const inMaps = (v) => v / MAPS_SPEED;             // a Maps-phase beat, sped up
const after = (v) => v - SHIFT;                   // a beat after the Maps phase, moved earlier
const K = {
  type0: inMaps(0.15), type1: inMaps(1.05),
  fly0: inMaps(0.95), fly1: inMaps(2.65),
  pin0: inMaps(2.50),
  place0: inMaps(2.85), place1: inMaps(3.25), chips0: inMaps(2.95), chips1: inMaps(3.25),
  out0: inMaps(MAPS_END), out1: after(3.75),
  hand0: after(3.60), hand1: after(4.30), handZoom: 1.35, photoFrom: 1.06,
  tags0: after(4.25), tags1: after(4.45), park0: after(4.25), park1: after(4.45), parked: 0.06,
  wipe0: after(4.45), wipe1: after(5.70),
  tagsOut0: after(5.70), tagsOut1: after(5.95),
  sun0: after(5.55), sun1: after(6.30),
  end: after(6.30),
};
const DROP = 56;                       // the pin falls from this far above its house
const SPRING = { k: 320, d: 30 };      // motion-reel's 'snappy' preset, z about 0.84: a small settle

const CSS = `
#s-tabs .sbsite .hub .qc-lm { width: ${CW}px; aspect-ratio: ${CW} / ${CH}; background: #f1efe8; }
#s-tabs .sbsite .hub .qc-lm .lm-stage { position: absolute; inset: 0; overflow: hidden; }
#s-tabs .sbsite .hub .qc-lm .lm-body { position: absolute; inset: 0; }
/* the map: a clip box, and inside it the world, an HTML layer the camera moves with a CSS transform. Its tiers are
   plain divs, so a label tier cross-fades by its wrapper's opacity (a compositor effect), never by an SVG attribute */
#s-tabs .sbsite .hub .qc-lm .lm-map { position: absolute; inset: 0; overflow: hidden; background: #f1efe8; will-change: opacity; }
#s-tabs .sbsite .hub .qc-lm .lm-world { position: absolute; left: 0; top: 0; width: ${WW}px; height: ${WH}px; transform-origin: 0 0; background: #f1efe8; will-change: transform; }
#s-tabs .sbsite .hub .qc-lm .lm-tier { position: absolute; left: 0; top: 0; width: ${WW}px; height: ${WH}px; }
#s-tabs .sbsite .hub .qc-lm .lm-tier svg { display: block; width: ${WW}px; height: ${WH}px; }
#s-tabs .sbsite .hub .qc-lm .lm-tier text { font-family: var(--ui); font-weight: 500; fill: #5f6368; paint-order: stroke; stroke: #ffffff; stroke-width: 2.4px; stroke-linejoin: round; }
#s-tabs .sbsite .hub .qc-lm .lm-tier .lm-city { font-weight: 600; fill: #3c4043; }
#s-tabs .sbsite .hub .qc-lm .lm-tier .lm-hw { font-weight: 600; fill: #8a6a12; }
#s-tabs .sbsite .hub .qc-lm .lm-tier .lm-water { font-weight: 500; fill: #3f6f9c; stroke: none; }
/* the search pill: white, rounded, with Maps' magnifier, typing the address as a Maps search does. It stays on
   top of the photograph once the pin opens, exactly as Maps' search bar does */
#s-tabs .sbsite .hub .qc-lm .lm-search { position: absolute; left: 10px; top: 10px; right: 10px; z-index: 3; display: flex; align-items: center; gap: 7px; height: 34px; padding: 0 10px; border-radius: 17px; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.04); overflow: hidden; }
#s-tabs .sbsite .hub .qc-lm .lm-glyph { flex: none; width: 15px; height: 15px; fill: none; stroke: #5f6368; stroke-width: 2; stroke-linecap: round; }
#s-tabs .sbsite .hub .qc-lm .lm-q { font: 500 12px/1 var(--ui); color: #3c4043; white-space: nowrap; }
#s-tabs .sbsite .hub .qc-lm .lm-caret { flex: none; width: 1.5px; height: 13px; background: #3c4043; }
#s-tabs .sbsite .hub .qc-lm .lm-chips { position: absolute; left: 10px; top: 52px; z-index: 2; display: flex; gap: 5px; }
#s-tabs .sbsite .hub .qc-lm .lm-chip { height: 22px; padding: 0 9px; border-radius: 11px; background: #ffffff; box-shadow: 0 1px 2px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.05); font: 500 9.5px/22px var(--ui); color: #3c4043; white-space: nowrap; }
/* the pin: ONE anchor, .lm-pin, whose origin is the house on the map. The pin's tip (the svg's bottom centre) and the
   ground shadow's centre are both that origin; the group is moved to the house's projection every frame, so it rides
   the map */
#s-tabs .sbsite .hub .qc-lm .lm-pin { position: absolute; left: 0; top: 0; z-index: 2; width: 0; height: 0; will-change: transform, opacity; }
#s-tabs .sbsite .hub .qc-lm .lm-pin svg { position: absolute; left: -15px; top: -40px; width: 30px; height: 40px; display: block; overflow: visible; transform-origin: 15px 40px; will-change: transform; }
#s-tabs .sbsite .hub .qc-lm .lm-pshade { position: absolute; left: -23px; top: -7px; width: 46px; height: 14px; border-radius: 50%; background: radial-gradient(closest-side, rgba(24,20,16,.5), rgba(24,20,16,0)); will-change: transform, opacity; }
/* the place card Maps shows for a dropped pin */
#s-tabs .sbsite .hub .qc-lm .lm-place { position: absolute; left: 10px; bottom: 10px; z-index: 2; width: 152px; padding: 8px 10px 9px; border-radius: 10px; background: #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,.24), 0 0 0 1px rgba(0,0,0,.05); will-change: transform, opacity; }
#s-tabs .sbsite .hub .qc-lm .lm-pt { font: 600 11.5px/14px var(--ui); color: #202124; }
#s-tabs .sbsite .hub .qc-lm .lm-ps { margin-top: 2px; font: 500 10px/13px var(--ui); color: #5f6368; }
#s-tabs .sbsite .hub .qc-lm .lm-pr { display: flex; gap: 4px; margin-top: 7px; }
#s-tabs .sbsite .hub .qc-lm .lm-pr i { width: 24px; height: 20px; border-radius: 6px; background: #f1f3f4; box-shadow: inset 0 0 0 1px #e8eaed; }
/* the photograph the pin opens onto: the lawn, and the garden wipe over it. .lm-ph carries the zoom-through scale and
   the two photographs; the divider, the handle and the tags sit outside it, so they never scale */
#s-tabs .sbsite .hub .qc-lm .lm-photo { position: absolute; inset: 0; z-index: 1; background: #101010; overflow: hidden; will-change: opacity; }
#s-tabs .sbsite .hub .qc-lm .lm-ph { position: absolute; inset: 0; transform-origin: 52% 48%; will-change: transform; }
#s-tabs .sbsite .hub .qc-lm .lm-ph img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
/* the compositor wipe: .lm-reveal is an overflow:hidden box slid across the card by translateX, and the garden inside
   it (.lm-reveal-in) is slid the opposite way by the same amount, so the garden holds still while the box's edge
   moves; the divider and the handle ride the same edge value */
#s-tabs .sbsite .hub .qc-lm .lm-reveal { position: absolute; inset: 0; overflow: hidden; will-change: transform; transform: translate3d(-${CW}px, 0, 0); }
#s-tabs .sbsite .hub .qc-lm .lm-reveal-in { position: absolute; inset: 0; will-change: transform; transform: translate3d(${CW}px, 0, 0); }
#s-tabs .sbsite .hub .qc-lm .lm-div { position: absolute; left: 0; top: 0; bottom: 0; width: 2px; margin-left: -1px; background: #ffffff; box-shadow: 0 0 3px rgba(0,0,0,.45); will-change: transform, opacity; }
#s-tabs .sbsite .hub .qc-lm .lm-knob { position: absolute; left: 0; top: 50%; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: #ffffff; box-shadow: 0 1px 4px rgba(0,0,0,.4); display: grid; place-items: center; will-change: transform, opacity; }
#s-tabs .sbsite .hub .qc-lm .lm-knob svg { width: 17px; height: 17px; fill: none; stroke: #3c4043; stroke-width: 2.1; stroke-linecap: round; stroke-linejoin: round; }
/* the tag rides the address chips row (top 52, 22px tall, as .lm-chip) and not the pill's band: .lm-search is 34px tall
   from top 10 at z-index 3 over .lm-photo, so a tag inside the pill's rows would be painted over and its word never read.
   The row's chips are gone at c 2.931 and the tags arrive at c 3.431, so the two never share the row */
#s-tabs .sbsite .hub .qc-lm .lm-tag { position: absolute; top: 52px; height: 22px; padding: 0 8px; border-radius: 11px; background: rgba(12,12,14,.62); font: 600 9.5px/22px var(--ui); color: #ffffff; letter-spacing: .02em; }
#s-tabs .sbsite .hub .qc-lm .lm-t-after { left: 10px; }
#s-tabs .sbsite .hub .qc-lm .lm-t-before { right: 10px; }
/* the warm sun wash: it rides inside .lm-photo, after the two photographs and before the divider, the handle and the
   tags, so it washes the ground the ask planted rather than the pin, the place card, the chips or the before/after
   divider. It is opaque-only through mix-blend-mode, so it must not be above chrome whose text it would tint */
#s-tabs .sbsite .hub .qc-lm .lm-wash { position: absolute; inset: 0; background: linear-gradient(100deg, rgba(255,214,140,0) 30%, rgba(255,222,158,.34) 50%, rgba(255,214,140,0) 70%); mix-blend-mode: soft-light; opacity: 0; }
/* in the reply's artifact frame the card fills its 400x250 .bk-fit, so the map's own tile is the frame's tile */
#s-tabs .sbsite .hub .bk-fit > .qc-lm { width: 100%; height: 100%; aspect-ratio: auto; border-radius: 0; box-shadow: none; }
`;

function injectCss() {
  if (document.getElementById('qc-lm-css')) return;
  const s = document.createElement('style');
  s.id = 'qc-lm-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

// --- motion ---------------------------------------------------------------------------------------
const sine = (x) => 0.5 - 0.5 * Math.cos(Math.PI * x);

// The unit-mass spring's step response 0 -> 1 from rest, x'' = k(1 - x) - d x', in closed form at time t (the
// motion-reel skill's spring(t, k, d), all three damping regimes), so a seek to any t needs no integration.
function spring(t, k = SPRING.k, d = SPRING.d) {
  if (t <= 0) return 0;
  const a = d / 2, q = a * a - k, e = Math.exp(-a * t);
  if (q < 0) { const w = Math.sqrt(-q); return 1 - e * (Math.cos(w * t) + (a / w) * Math.sin(w * t)); }
  if (q === 0) return 1 - e * (1 + a * t);
  const h = Math.sqrt(q);
  return 1 - e * (Math.cosh(h * t) + (a / h) * Math.sinh(h * t));
}

// CSS's cubic-bezier(x1, y1, x2, y2) timing function, solved by bisection on x (pure, no state)
function bezier(x1, y1, x2, y2) {
  const ax = (u) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  const ay = (u) => 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0, hi = 1;
    for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (ax(mid) < x) lo = mid; else hi = mid; }
    return ay((lo + hi) / 2);
  };
}
const standard = bezier(0.2, 0, 0, 1);   // Material's emphasised decelerate: the photograph's arrival

// van Wijk and Nuij, 'Smooth and efficient zooming and panning', IEEE InfoVis 2003 (DOI 10.1109/INFVIS.2003.1249004),
// the path d3-interpolate's interpolateZoom (src/zoom.js) walks, rho = sqrt(2). A view is (centre x, centre y, visible
// width w); u in [0, 1] runs the whole flight at the optimal perceived speed, so ONE ease on u is the whole camera.
function zoomPath(a, b) {
  const rho = Math.SQRT2, rho2 = 2, rho4 = 4;
  const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, d1 = Math.sqrt(d2);
  if (d2 < 1e-12) {
    const S = Math.log(b.w / a.w) / rho;
    return (u) => ({ x: a.x, y: a.y, w: a.w * Math.exp(rho * u * S) });
  }
  const b0 = (b.w * b.w - a.w * a.w + rho4 * d2) / (2 * a.w * rho2 * d1);
  const b1 = (b.w * b.w - a.w * a.w - rho4 * d2) / (2 * b.w * rho2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (r1 - r0) / rho, coshr0 = Math.cosh(r0), sinhr0 = Math.sinh(r0);
  return (u) => {
    if (u >= 1) return { x: b.x, y: b.y, w: b.w };
    const s = u * S;
    const m = (a.w / (rho2 * d1)) * (coshr0 * Math.tanh(rho * s + r0) - sinhr0);
    return { x: a.x + m * dx, y: a.y + m * dy, w: (a.w * coshr0) / Math.cosh(rho * s + r0) };
  };
}
const fly = zoomPath(FROM, TO);

// --- the map -------------------------------------------------------------------------------------
// Public street and place names only (Fayetteville St, Hillsborough St, Glenwood Ave, Capital Blvd, Western Blvd,
// I-40, I-440, Pullen Park, the Neuse River, Falls Lake): street names are facts, and no business is invented. The
// house's own street is one of the unlabeled small streets, as Maps leaves them at this zoom.
// Land, water, park, houses and the two beltways are stylised to Google's own Streets palette.
const PAL = { land: '#f1efe8', water: '#aad3f2', park: '#c6e8bf', block: '#e8eaed', house: '#e3e5e9', houseEdge: '#d6d9de', minor: '#ffffff', minorCase: '#e0e2e5', arterialCase: '#dfe1e5', hw: '#fbbc04', hwCase: '#f6dd93',
  // the metro tier's own tones (wideFabric): the street grid above is a sub pixel shimmer at the far stop, so the far
  // stop needs streets that survive the downscale
  wideRoad: '#d7dae0', wideRoad2: '#c8ccd5', fabric: '#e1e4e9', fabric2: '#e9ebef' };

const way = (pts) => `M${pts.map((p) => `${p[0]} ${p[1]}`).join('L')}`;
// a set of roads as two paths, every casing under every core, so crossings are clean and no hard black outline exists
function roads(lines, w, caseColor = PAL.minorCase) {
  const d = lines.map(way).join('');
  return `<path d="${d}" fill="none" stroke="${caseColor}" stroke-width="${(w + 1.4).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="${PAL.minor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const hh = (a, b, c) => { const v = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return v - Math.floor(v); };

// the residential quarter: each block holds a north row and a south row of up to three house footprints
function houses() {
  let d = '';
  const cols = (LAT.x1 - LAT.x0) / LAT.dx, rows = (LAT.y1 - LAT.y0) / LAT.dy;
  for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
    const x0 = LAT.x0 + i * LAT.dx, yn = LAT.y0 + j * LAT.dy, ys = yn + LAT.dy;
    if (x0 >= PARK.x0 && yn >= PARK.y0) continue;
    for (let row = 0; row < 2; row++) for (let slot = 0; slot < 3; slot++) {
      const home = x0 + 4 + slot * 20 + 8 === HOME.x && ys - 5 - 7 === HOME.y && row === 1;
      if (!home && hh(i * 3 + slot, j * 2 + row, 1) < 0.1) continue;
      const w = home ? 16 : 14 + Math.round(hh(i * 3 + slot, j * 2 + row, 2) * 4);
      const dep = home ? 14 : 12 + Math.round(hh(i * 3 + slot, j * 2 + row, 3) * 3);
      const x = x0 + 4 + slot * 20 + (16 - w) / 2, y = row === 0 ? yn + 5 : ys - 5 - dep;
      d += `M${x} ${y}h${w}v${dep}h${-w}z`;
    }
  }
  return `<path d="${d}" fill="${PAL.house}" stroke="${PAL.houseEdge}" stroke-width=".5" stroke-linejoin="round"/>`;
}

// --- the metro tier ----------------------------------------------------------------------------------------------
// At the far stop the camera scale is 0.335, so the whole 1200x750 world sits inside the 400x250 card: a 2.6 world px
// arterial is 0.87 card px and the grid above dissolves into a shimmer, which left the metro reading as pale land
// under the beltways. This is the density a map has at that zoom: town blocks parted by white streets, laid over the
// whole metro, plus the arterials that carry across it. Both halves ride their own tiers that paint() takes to zero
// before the camera reaches the districts, so the mid tier and the street tier are exactly the map they were.
let wideSeq = 0;
function wideFabric() {
  const id = `qc-lm-w${++wideSeq}`;
  const patch = (x, y, w, h, layer) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}${layer})"/>`;
  const blocks = patch(0, 0, WW, WH, 'b') +
    patch(372, 246, 330, 340, 'a') + patch(700, 186, 320, 300, 'a') + patch(520, 540, 360, 180, 'a');
  const routes = [
    [[-30, 168], [220, 208], [440, 200], [650, 236], [860, 216], [1040, 236]],
    [[-30, 292], [230, 322], [470, 306], [700, 352], [950, 330], [1070, 344]],
    [[-30, 466], [200, 496], [430, 476], [650, 520], [880, 560], [1040, 604]],
    [[-30, 616], [240, 640], [490, 606], [760, 648], [1010, 630], [1140, 648]],
    [[148, -30], [204, 176], [188, 392], [232, 560], [208, 782]],
    [[388, -30], [424, 158], [406, 330], [452, 520], [430, 782]],
    [[636, -30], [664, 150], [700, 356], [676, 560], [702, 782]],
    [[876, -30], [860, 168], [902, 340], [884, 520], [922, 700]],
    [[-30, 58], [300, 28], [700, 58], [1010, 30], [1050, 44]],
    [[330, 246], [520, 330], [700, 402], [880, 470], [1046, 556]],
    [[-30, 700], [300, 688], [640, 720], [900, 698], [1120, 716]],
    [[516, 128], [700, 200], [860, 298], [986, 428]],
    [[236, 616], [420, 542], [620, 470], [806, 418]],
  ].map((pts) => `<path d="${way(pts)}" fill="none" stroke="${PAL.wideRoad}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const majors = [
    [[-30, 344], [300, 302], [664, 252], [1000, 182], [1058, 162]],
    [[200, -30], [300, 300], [360, 620], [344, 782]],
    [[-30, 560], [300, 600], [660, 662], [980, 700], [1080, 716]],
  ].map((pts) => `<path d="${way(pts)}" fill="none" stroke="${PAL.wideRoad2}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
  const defs = `<defs>
    <pattern id="${id}a" width="30" height="26" patternUnits="userSpaceOnUse"><rect width="30" height="26" fill="#ffffff"/><rect x="3" y="3" width="24" height="20" fill="${PAL.fabric}"/></pattern>
    <pattern id="${id}b" width="54" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(-11)"><rect width="54" height="44" fill="#ffffff"/><rect x="4" y="4" width="46" height="36" fill="${PAL.fabric2}"/></pattern>
  </defs>`;
  return { blocks: `${defs}${blocks}`, roads: `${routes}${majors}` };
}

const svgOf = (inner, label = '') => `<svg viewBox="0 0 ${WW} ${WH}" width="${WW}" height="${WH}"${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true"'}>${inner}</svg>`;

// the six tiers of the world, bottom to top: the metro's block fabric, the base map, the metro's arterials, then the
// far, mid and street label tiers. Each is a wrapper div that paint() cross-fades by opacity
function mapTiers() {
  const wide = wideFabric();
  const inLat = (x, y, w, h) => x + w > LAT.x0 - 14 && x < LAT.x1 + 14 && y + h > LAT.y0 - 14 && y < LAT.y1 + 14;
  // the metro's arterials: a few streets that cross the whole world. The residential quarter's own two (Fayetteville St
  // and a second north-south street) and Glenwood Ave belong to the grid below
  const arterialV = [300, 1060].map((x) => [[x, 0], [x + 14, WH]]);
  const arterialH = [180, 610, 720].map((y) => [[0, y], [WW, y - 8]]);
  // the street grid: every lattice line is a local street, and three of them are arterials with real names
  const vs = [], hs = [];
  for (let x = LAT.x0; x <= LAT.x1; x += LAT.dx) vs.push(x);
  for (let y = LAT.y0; y <= LAT.y1; y += LAT.dy) hs.push(y);
  const localV = vs.filter((x) => x !== FAYETTEVILLE_X && x !== SECOND_X).map((x) => [[x, LAT.y0 - 16], [x, LAT.y1 + 16]]);
  const localH = hs.filter((y) => y !== GLENWOOD_Y).map((y) => [[LAT.x0 - 16, y], [LAT.x1 + 16, y]]);
  const parkEdge = [[[PARK.x1, LAT.y0 - 16], [PARK.x1, LAT.y1 + 16]], [[LAT.x0 - 16, PARK.y0], [LAT.x1 + 16, PARK.y0]], [[LAT.x0 - 16, PARK.y1], [LAT.x1 + 16, PARK.y1]]];
  const gridArterials = [[[FAYETTEVILLE_X, -20], [FAYETTEVILLE_X, WH + 20]], [[SECOND_X, -20], [SECOND_X, WH + 20]], [[-20, GLENWOOD_Y], [WW + 20, GLENWOOD_Y]]];
  // the built up area seen from away, as scattered blocks and six developed patches (each a small grid of blocks between
  // thin white streets). Nothing is drawn where the residential quarter's own houses are
  let sprawl = '';
  for (let i = 0; i < 190; i++) {
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 43758.5453;
    const px = 250 + (a - Math.floor(a)) * 850;
    const py = 120 + (b - Math.floor(b)) * 560;
    const w = 9 + ((a * 7) % 1) * 22, h = 7 + ((b * 11) % 1) * 15;
    // the noise lands negative a little over half the time: an invalid side is not rendered, so the rect was never on
    // the map either way - dropping it draws the same map and keeps the console clean (a live parse reports each one)
    if (w <= 0 || h <= 0 || inLat(px, py, w, h)) continue;
    sprawl += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${PAL.block}" opacity=".9"/>`;
  }
  let patches = '';
  const PATCH = [[330, 250, 190, 130], [900, 160, 210, 150], [1020, 380, 170, 190], [300, 520, 210, 150], [640, 150, 170, 120], [980, 600, 200, 130]];
  PATCH.forEach(([px, py, pw, ph], n) => {
    const cols = 6, rows = 4;
    for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
      const x = px + c * (pw / cols) + 2 + ((Math.sin((n * 31 + c * 7 + r * 3) * 12.9) + 1) / 2) * 2.2, y = py + r * (ph / rows) + 2;
      if (inLat(x, y, pw / cols - 5, ph / rows - 5)) continue;
      patches += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(pw / cols - 5).toFixed(1)}" height="${(ph / rows - 5).toFixed(1)}" rx="1.2" fill="${PAL.block}"/>`;
    }
  });
  // diagonal avenues cross the metro; inside the residential quarter the grid is the streets, so they stop at its edge
  const clip = `qc-lm-c${wideSeq}`;
  const radials = `<clipPath id="${clip}"><path clip-rule="evenodd" d="M-100 -100H${WW + 100}V${WH + 100}H-100ZM${LAT.x0 - 10} ${LAT.y0 - 10}H${LAT.x1 + 10}V${LAT.y1 + 10}H${LAT.x0 - 10}Z"/></clipPath><g clip-path="url(#${clip})">` +
    roads([[[-40, 250], [WW + 40, 190]], [[-40, 430], [WW + 40, 350]], [[180, -30], [260, WH + 30]],
      [[520, -30], [560, WH + 30]], [[900, -30], [860, WH + 30]], [[-40, 660], [WW + 40, 700]],
      [[-40, 100], [WW + 40, 60]], [[-40, 540], [WW + 40, 620]], [[80, -30], [30, WH + 30]],
      [[380, -30], [430, WH + 30]], [[700, -30], [660, WH + 30]], [[1080, -30], [1130, WH + 30]],
      [[-40, 340], [WW + 40, 520]], [[-40, 720], [WW + 40, 160]]], 1.9) + '</g>';
  // I-440, the inner beltline, loops around the quarter; I-540, the outer arc to the north east; I-40 along the south
  const belt = way([[700, 60], [880, 96], [1000, 210], [1016, 380], [980, 560], [820, 640], [620, 620], [470, 520], [440, 380], [470, 225], [580, 110], [700, 60]]);
  const outer = way([[-40, 300], [200, 120], [520, 30], [860, 20], [1060, 150], [1140, 330], [1120, 540], [1020, 700], [900, WH + 20]]);
  const i40 = way([[-20, 660], [180, 680], [360, 700], [560, 724], [780, 736], [1020, 748], [WW + 20, 742]]);
  const hw = (d) => `<path d="${d}" fill="none" stroke="${PAL.hwCase}" stroke-width="7.4" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${PAL.hw}" stroke-width="4.6" stroke-linejoin="round"/>`;
  const highways = hw(outer) + hw(belt) + hw(i40);
  const water =
    `<path d="${way([[1060, -20], [1120, 120], [1080, 300], [1150, 470], [1110, 640], [1170, 780], [1260, 780], [1180, 560], [1230, 380], [1170, 190], [1210, -20]])}Z" fill="${PAL.water}"/>` +
    `<ellipse cx="140" cy="70" rx="190" ry="70" fill="${PAL.water}"/>` +
    `<path d="${way([[1030, 462], [1070, 506], [1096, 560], [1130, 590], [1146, 566], [1108, 524], [1070, 470], [1040, 444]])}Z" fill="${PAL.water}"/>`;
  // Pullen Park: the two south east blocks of the quarter, its streets under it and its edge streets over it
  const park = `<ellipse cx="330" cy="640" rx="96" ry="58" fill="${PAL.park}"/>`;
  const parkRect = `<rect x="${PARK.x0}" y="${PARK.y0}" width="${PARK.x1 - PARK.x0}" height="${PARK.y1 - PARK.y0}" fill="${PAL.park}"/>`;
  const base = `${water}${park}${sprawl}${patches}${radials}${houses()}` +
    roads(localV.concat(localH), 1.7) + parkRect + roads(parkEdge, 1.7) +
    roads(arterialV.concat(arterialH), 2.6) + roads(gridArterials, 3.0, PAL.arterialCase) + highways;
  // the town centres the sprawl hangs off, so the metro stop carries its outlying names: they live in the far tier,
  // so no marker survives into street level
  const towns =
    `<circle cx="742" cy="470" r="3.4" fill="#3c4043" stroke="#ffffff" stroke-width="1.4"/>` +
    [[430, 700], [866, 92], [1012, 430], [352, 262], [1090, 640]].map(([tx, ty]) =>
      `<circle cx="${tx}" cy="${ty}" r="2.2" fill="#5f6368" stroke="#ffffff" stroke-width="1.1"/>`).join('');
  const far = `${towns}
  <text class="lm-city" x="626" y="286" font-size="34" text-anchor="middle">Raleigh</text>
  <text x="646" y="316" font-size="19" text-anchor="middle">North Carolina</text>
  <text x="430" y="736" font-size="24" text-anchor="middle">Cary</text>
  <text x="900" y="74" font-size="24" text-anchor="middle">Wake Forest</text>
  <text x="1060" y="470" font-size="24" text-anchor="middle">Knightdale</text>
  <text class="lm-hw" x="1000" y="80" font-size="17">I-540</text>`;
  const mid = `
  <text x="760" y="404" font-size="22" text-anchor="middle">Five Points</text>
  <text x="596" y="470" font-size="20" text-anchor="middle">Boylan Heights</text>
  <text x="812" y="284" font-size="22" text-anchor="middle">Mordecai</text>
  <text x="742" y="560" font-size="22" text-anchor="middle">Downtown</text>`;
  const near = `
  <text x="852" y="${GLENWOOD_Y}" dy="3" font-size="8.4" text-anchor="middle">Glenwood Ave</text>
  <text x="${FAYETTEVILLE_X}" y="426" dy="3" font-size="8.4" text-anchor="middle" transform="rotate(90 ${FAYETTEVILLE_X} 426)">Fayetteville St</text>
  <text x="744" y="504" dy="3" font-size="8.4" text-anchor="middle">Hillsborough St</text>
  <text x="700" y="96" font-size="8.4">Capital Blvd</text>
  <text x="474" y="700" font-size="8.4">Western Blvd</text>
  <text class="lm-hw" x="700" y="44" font-size="9" text-anchor="middle">I-440</text>
  <text class="lm-hw" x="960" y="754" font-size="9" text-anchor="middle">I-40</text>
  <text x="872" y="506" dy="3" font-size="8" text-anchor="middle">Pullen Park</text>
  <text class="lm-water" x="1128" y="300" font-size="9.5" transform="rotate(72 1128 300)">Neuse River</text>
  <text class="lm-water" x="120" y="58" font-size="9.5">Falls Lake</text>`;
  return `<div class="lm-tier lm-wb">${svgOf(wide.blocks)}</div>` +
    `<div class="lm-tier lm-base">${svgOf(base, 'Google Maps open on Raleigh, North Carolina')}</div>` +
    `<div class="lm-tier lm-wr">${svgOf(wide.roads)}</div>` +
    `<div class="lm-tier lm-far">${svgOf(far)}</div>` +
    `<div class="lm-tier lm-mid">${svgOf(mid)}</div>` +
    `<div class="lm-tier lm-near">${svgOf(near)}</div>`;
}

// the pin, drawn once (Google's teardrop; its tip is the svg's bottom centre), and the arrow glyph on the wipe's handle
const PIN = '<svg viewBox="-15 -40 30 40" aria-hidden="true"><path d="M0 0c-1.2-1.4-9.6-11-9.6-18.4A9.6 9.6 0 0 1 9.6-18.4C9.6-11 1.2-1.4 0 0Z" fill="#ea4335"/><circle cx="0" cy="-18.4" r="3.6" fill="#7a2018"/></svg>';
const KNOB = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 7 4.5 12l5 5M14.5 7l5 5-5 5"/></svg>';

export function makeLawn(x) {
  injectCss();
  // The card's shell: the build pill, which the artifact frame takes out of it at build time (gemini.9b47fc30.js), and
  // nothing else. mountChat calls this builder once per route the beat carries and appends every route's nodes, so a map
  // built here would be built on each of those routes whether or not the lawn variant ever shows. The art waits for
  // mountCard() below, which runs the first time this variant shows, as the 3D viewer is built on its variant's first
  // show and the 10-image reveals build on theirs.
  const node = x.el(`<div class="qc-img qc-lm">
<span class="qc-genl">${x.tile('superbot')}Planting the beds<b class="qc-genn">0%</b></span>
</div>`);
  const pill = node.querySelector('.qc-genl'), pct = node.querySelector('.qc-genn');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let body, sk, map, world, tiers, search, q, caret, chips, pin, psvg, pshade, place, photo, ph, reveal, revealIn, div, knob, tAfter, tBefore, wash;
  let mounted = false, lastKey = '', lastPc = -1, typed = -1;

  // The whole card, behind a null guard: the map's tiers (block fabric, streets, houses, water, parks, beltways, labels
  // and street names), the pin with its ground shadow, the search pill, the photographs and the wipe. It is
  // synchronous, and render() mounts it before painting anything, so the first frame the lawn variant draws is the frame
  // it drew when the card was built eagerly: no blank frame and no flash.
  function mountCard() {
    if (mounted) return;
    node.prepend(x.el(`<div class="lm-stage qc-skel">
  <div class="lm-body" style="opacity:0">
    <div class="lm-map" style="opacity:0"><div class="lm-world">${mapTiers()}</div></div>
    <div class="lm-photo" style="opacity:0">
      <div class="lm-ph">
        <img class="lm-before" src="${x.img('lawn.f5e1d276/before.jpg')}" width="1200" height="900" alt="This house and its plain front lawn"/>
        <div class="lm-reveal"><div class="lm-reveal-in"><img class="lm-after" src="${x.img('lawn.f5e1d276/after.jpg')}" width="1200" height="900" alt="The same front lawn planted with garden beds"/></div></div>
      </div>
      <i class="lm-wash"></i><i class="lm-div" style="opacity:0"></i><span class="lm-knob" style="opacity:0">${KNOB}</span>
      <span class="lm-tag lm-t-after" style="opacity:0">After</span><span class="lm-tag lm-t-before" style="opacity:0">Before</span>
    </div>
    <div class="lm-search" style="opacity:0"><svg class="lm-glyph" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><span class="lm-q"></span><i class="lm-caret"></i></div>
    <div class="lm-chips" style="opacity:0">${CHIPS.map((c) => `<span class="lm-chip">${x.esc(c)}</span>`).join('')}</div>
    <div class="lm-pin" style="opacity:0"><div class="lm-pshade" style="opacity:0"></div>${PIN}</div>
    <div class="lm-place" style="opacity:0"><div class="lm-pt">Your address</div><div class="lm-ps">Raleigh, North Carolina</div><div class="lm-pr"><i></i><i></i><i></i></div></div>
  </div>
  <i class="qc-sk"></i>
</div>`));
    body = node.querySelector('.lm-body'); sk = node.querySelector('.qc-sk');
    map = node.querySelector('.lm-map'); world = node.querySelector('.lm-world');
    tiers = {
      wb: node.querySelector('.lm-wb'), wr: node.querySelector('.lm-wr'),
      far: node.querySelector('.lm-far'), mid: node.querySelector('.lm-mid'), near: node.querySelector('.lm-near'),
    };
    search = node.querySelector('.lm-search'); q = node.querySelector('.lm-q'); caret = node.querySelector('.lm-caret');
    chips = node.querySelector('.lm-chips');
    pin = node.querySelector('.lm-pin'); psvg = pin.querySelector('svg');
    pshade = node.querySelector('.lm-pshade');
    place = node.querySelector('.lm-place');
    photo = node.querySelector('.lm-photo'); ph = node.querySelector('.lm-ph');
    reveal = node.querySelector('.lm-reveal'); revealIn = node.querySelector('.lm-reveal-in');
    div = node.querySelector('.lm-div'); knob = node.querySelector('.lm-knob');
    tAfter = node.querySelector('.lm-t-after'); tBefore = node.querySelector('.lm-t-before');
    wash = node.querySelector('.lm-wash');
    mounted = true;
  }

  // The Before tag's own box, in the card's px, read once from its computed style: its width and its 10px inset from the
  // card's right edge (.lm-t-before, and .lm-tag's font: the box is 8px padding either side of the word). It cannot be
  // read with offsetLeft on the frame the card mounts: that resolves against a layout which has not settled there (341
  // reads as 107) while the computed width and right are already correct, and a frozen ?t= frame never repaints, so the
  // bad value would stick. Cached, because the card is a fixed 400x250 and the word never changes.
  let tagSpan = 0, tagLeft = 0;
  function measureBeforeTag() {
    const cs = getComputedStyle(tBefore);
    const tw = parseFloat(cs.width), right = parseFloat(cs.right);
    if (tw > 0 && isFinite(right)) { tagSpan = tw; tagLeft = CW - right - tw; }
  }
  // how much of the tag the wipe's edge (e, in the card's px) has covered: 0 while the edge is still left of the tag, 1
  // once it has passed the tag's right edge. While the box is unknown the tag keeps its legible state.
  function tagCover(e) {
    if (!tagSpan) measureBeforeTag();
    return tagSpan > 0 ? clamp((e - tagLeft) / tagSpan) : 0;
  }

  // the camera at card time c: the fly-to's view, then the handover's zoom toward the pin about the anchor. Returns the
  // scale s and translate (tx, ty) that put world (wx, wy) at card (tx + wx s, ty + wy s), and sFly, the fly's own scale
  // (which the label tiers follow). The pin is projected through this same transform.
  function camAt(c) {
    const v = fly(sine(seg(c, K.fly0, K.fly1)));
    const sFly = CW / v.w;
    const tx0 = CW / 2 - v.x * sFly, ty0 = CH / 2 - v.y * sFly;
    const g = 1 + (K.handZoom - 1) * sine(seg(c, K.hand0, K.hand1));
    return { sFly, s: sFly * g, tx: ANCHOR.x + g * (tx0 - ANCHOR.x), ty: ANCHOR.y + g * (ty0 - ANCHOR.y) };
  }

  // the wipe's edge, in card px: 0 until the handle appears, a short slide to its parked 6%, then the sweep to the far side
  function edgeAt(c) {
    const park = K.parked * sine(seg(c, K.park0, K.park1));
    return CW * (park + (1 - K.parked) * inOutCubic(seg(c, K.wipe0, K.wipe1)));
  }

  const tier = (el, o) => { el.style.opacity = o.toFixed(3); el.style.visibility = o <= 0 ? 'hidden' : ''; };

  function paint(c) {
    // 1. the map: the fly-to, with its label tiers cross-faded by the scale they sit at
    const cam = camAt(c);
    world.style.transform = `translate3d(${cam.tx.toFixed(3)}px, ${cam.ty.toFixed(3)}px, 0) scale(${cam.s.toFixed(6)})`;
    const s = cam.sFly;
    // the metro fabric is gone before the camera reaches the districts, so the mid and street tiers keep exactly the map
    // they had; the far tier (names, the Raleigh marker and the town dots) is clear by the time the mid tier is in
    const wv = 1 - seg(s, 0.40, 0.56);
    tier(tiers.wb, wv); tier(tiers.wr, wv);
    tier(tiers.far, 1 - seg(s, 0.45, 0.62));
    tier(tiers.mid, seg(s, 0.56, 0.69) * (1 - seg(s, 0.87, 0.98)));
    tier(tiers.near, seg(s, 0.81, 0.98));
    // 2. the search pill typing the address
    const n = Math.round(ADDRESS.length * seg(c, K.type0, K.type1));
    if (n !== typed) { q.textContent = ADDRESS.slice(0, n); typed = n; }
    caret.style.display = c < K.type1 ? '' : 'none';
    search.style.opacity = outCubic(seg(c, 0, 0.3)).toFixed(3);
    // 3. the pin: one anchor at the house's projection through the camera above. The drop is a spring on the pin's
    //    height above the house, and the shadow is derived from that height, so the two are one motion
    const px = cam.tx + HOME.x * cam.s, py = cam.ty + HOME.y * cam.s;
    pin.style.transform = `translate3d(${px.toFixed(3)}px, ${py.toFixed(3)}px, 0)`;
    const x01 = spring((c - K.pin0) * MAPS_SPEED);   // the original spring on Maps-phase time: as springy as before, just faster
    const height = c <= K.pin0 ? DROP : Math.max(0, DROP * (1 - x01));   // above the house, in card px
    const near01 = 1 - height / DROP;                                      // 0 in the air, 1 on the house
    const pinOut = seg(c, K.out0, K.out1);
    pin.style.opacity = (c <= K.pin0 ? 0 : seg(c, K.pin0, K.pin0 + 0.08 / MAPS_SPEED) * (1 - pinOut)).toFixed(3);
    psvg.style.transform = `translate3d(0, ${(-height).toFixed(3)}px, 0) scale(${lerp(0.8, 1, Math.min(1, x01)).toFixed(4)})`;
    pshade.style.opacity = (0.9 * near01 * near01).toFixed(3);
    pshade.style.transform = `scale(${lerp(0.45, 1, near01).toFixed(4)})`;
    // 4. the place card and the chips come in, then leave faster than they came
    const out = outCubic(seg(c, K.out0, K.out1));
    const cr = outCubic(seg(c, K.place0, K.place1));
    place.style.opacity = (cr * (1 - out)).toFixed(3);
    place.style.transform = cr >= 1 ? 'none' : `translate3d(0, ${((1 - cr) * 12).toFixed(2)}px, 0)`;
    place.style.visibility = c >= K.out1 ? 'hidden' : '';
    chips.style.opacity = (outCubic(seg(c, K.chips0, K.chips1)) * (1 - out)).toFixed(3);
    chips.style.visibility = c >= K.out1 ? 'hidden' : '';
    // 5. the handover: the map keeps zooming toward the pin (camAt) while it fades, and the photograph arrives from 1.06x
    //    about the house. Only once the map is fully clear is it hidden
    const h = standard(seg(c, K.hand0, K.hand1));
    map.style.opacity = (1 - h).toFixed(3);
    map.style.visibility = c >= K.hand1 ? 'hidden' : '';
    photo.style.opacity = h.toFixed(3);
    ph.style.transform = h >= 1 ? 'none' : `scale(${lerp(K.photoFrom, 1, h).toFixed(5)})`;
    // 6. the before/after wipe, a compositor wipe: the reveal box and the garden inside it slide opposite ways by the
    //    same edge value, so the garden holds still and its left strip is uncovered as the edge crosses; the divider and the
    //    handle take the very same value
    const e = edgeAt(c);
    reveal.style.transform = `translate3d(${(e - CW).toFixed(3)}px, 0, 0)`;
    revealIn.style.transform = `translate3d(${(CW - e).toFixed(3)}px, 0, 0)`;
    div.style.transform = `translate3d(${e.toFixed(3)}px, 0, 0)`;
    knob.style.transform = `translate3d(${e.toFixed(3)}px, 0, 0)`;
    const chrome = outCubic(seg(c, K.tags0, K.tags1)) * (1 - outCubic(seg(c, K.tagsOut0, K.tagsOut1)));
    div.style.opacity = knob.style.opacity = chrome.toFixed(3);
    tAfter.style.opacity = chrome.toFixed(3);
    // the Before tag names the plain lawn, so it is opaque until the wipe's edge reaches its left edge and clear by the
    // time the edge passes its right edge: the fade is the edge crossing the tag's own box, measured in the 400x250
    // card's px, whatever the artifact frame scales the card to
    tBefore.style.opacity = (chrome * (1 - tagCover(e))).toFixed(3);
    // 7. a warm sun wash crossing the beds as the garden settles
    const sun = seg(c, K.sun0, K.sun1);
    wash.style.opacity = (sun <= 0 || sun >= 1 ? 0 : Math.sin(Math.PI * sun) * 0.9).toFixed(3);
    wash.style.transform = `translate3d(${lerp(-26, 26, sun).toFixed(2)}%, 0, 0)`;
    // 8. the build pill: its percent runs with the card until the garden is fully revealed, and the pill is gone 0.25 s
    //    after. This card does not use the gemini label argument (gemini.9b47fc30.js fades every pill at T.w1, which is
    //    wrong for a 5.5 s card)
    const pc = Math.round(100 * seg(c, 0, K.wipe1));
    if (pc !== lastPc) { pct.textContent = `${pc}%`; lastPc = pc; }
    pill.style.opacity = (1 - seg(c, K.wipe1, K.wipe1 + 0.25)).toFixed(3);
  }

  return {
    node,
    render(t, T) {
      // the first time this variant shows: build the card before it is drawn (no-op after that)
      mountCard();
      // the card shimmers as a skeleton until it lands, then runs on its own clock from T.w0; reduced motion goes straight
      // to the finished garden (the card's last frame) and holds it
      const lp = still.matches ? (t >= T.w0 ? 1 : 0) : landing(t, T.w0);
      const c = still.matches ? (t >= T.w0 ? K.end : -1) : t - T.w0;
      const key = `${t.toFixed(3)}|${lp.toFixed(4)}`;
      if (key !== lastKey) {
        shimmer(sk, t, T.card, 0, lp);
        settle(body, lp);
        paint(c);
        lastKey = key;
      }
    },
  };
}
