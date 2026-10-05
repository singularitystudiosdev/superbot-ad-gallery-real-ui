// 3D beat: Blender models the microphone and renders the hero shot, ON THIS MAC. A card rises with Blender's own viewport
// chrome (the .blend name, Cycles, 1920x1080, 128 samples) and a 3D viewport: a wireframe microphone the model turns
// through two views (a front and a 3/4, cross-faded, which is what an orbit looks like), a perspective floor grid and
// the X/Y/Z axis gizmo. When the turntable settles superbot renders it: the wireframe cross-fades to the shaded
// Cycles render (the same geometry with a body gradient and a grille), the badge flips Modelling -> Rendered and the
// footer names the saved file. The geometry is vector line work (a technical diagram: the point is the geometry, not
// a photograph), drawn here in code. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Modelled the mic in Blender and rendered the hero shot.';
const BADGE = ['Modelling', 'Rendered'];
const FOOT = 'Render saved: mic_hero_3q.png · 1920 × 1080';
const PROPS = ['Cycles', '1920 × 1080', '128 samples', 'GPU'];

const CPS = 95;
const SAY_AT = 0.05;
const CARD = 0.1;
const CARD_IN = 0.26;
const TURN0 = 0.34;                 // the turntable starts
const TURN = 0.7;                   // ...and runs (two view swaps inside it)
const RENDER_AT = TURN0 + TURN + 0.06;
const RENDER = 0.34;                // the wireframe -> shaded cross-fade
const FOOT_AT = RENDER_AT + 0.28;
const FOOT_IN = 0.2;

// the mic geometry, as SVG, in a 0..320 x 0..200 viewport. mode 'w' = wireframe, 's' = shaded (the Cycles render).
const body = (cls) => `<rect class="${cls}" x="122" y="46" width="52" height="96" rx="20"/>`;
const grille = (cls) => `<path class="${cls}" d="M124 62h48M124 72h48M124 82h48M124 92h48"/>`;
const yoke = (cls) => `<path class="${cls}" d="M112 58c-13 2-19 12-19 26v34c0 14 6 24 19 26M184 58c13 2 19 12 19 26v34c0 14-6 24-19 26"/>`;
const cap = (cls) => `<ellipse class="${cls}" cx="148" cy="48" rx="26" ry="8"/>`;
const stem = (cls) => `<path class="${cls}" d="M148 142v14M126 160h44l-8-12h-28z"/>`;
const grillDots = () => `<g class="m3-dots">${[0, 1, 2, 3, 4, 5].map((r) => [0, 1, 2, 3, 4, 5].map((c) => `<circle cx="${132 + c * 6.4}" cy="${52 + r * 8}" r="1.1"/>`).join('')).join('')}</g>`;
// view A: front (straight on). view B: 3/4 (yoke wider, body narrowed, stand swung) — the model turned.
const viewA = () => `${cap('w')}${body('w')}${grille('w')}${yoke('w')}${stem('w')}`;
const viewB = () => `<g transform="translate(14 0)"><ellipse class="w" cx="148" cy="48" rx="21" ry="8"/><rect class="w" x="128" y="46" width="40" height="96" rx="17"/><path class="w" d="M130 62h36M130 72h36M130 82h36M130 92h36"/><path class="w" d="M116 58c-16 3-24 13-24 27v33c0 14 8 24 24 27M180 58c16 3 24 13 24 27v33c0 14-8 24-24 27"/><path class="w" d="M148 142v14M128 160h40l-8-12h-24z"/></g>`;
const shaded = () => `<g class="m3-sh"><defs><linearGradient id="m3g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b5b62"/><stop offset=".45" stop-color="#2b2b30"/><stop offset="1" stop-color="#0d0d10"/></linearGradient><pattern id="m3d" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r="1" fill="#0b0b0d"/></pattern></defs>
  <ellipse cx="148" cy="48" rx="26" ry="8" fill="#3a3a41"/><rect x="122" y="46" width="52" height="96" rx="20" fill="url(#m3g)"/><rect x="122" y="46" width="52" height="60" rx="20" fill="url(#m3d)" opacity=".85"/>
  <rect x="136" y="100" width="24" height="3" rx="1.5" fill="#141418"/><path class="m3-yk" d="M112 58c-13 2-19 12-19 26v34c0 14 6 24 19 26M184 58c13 2 19 12 19 26v34c0 14-6 24-19 26"/><path class="m3-yk" d="M148 142v14M126 160h44l-8-12h-28z"/></g>`;
const grid = () => `<g class="m3-grid">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${-40 + i * 70} 176 L${110 + i * 30} 120"/>`).join('')}${[0, 1, 2, 3, 4].map((i) => `<path d="M0 ${126 + i * 12} H320"/>`).join('')}</g>`;
const gizmo = () => `<g class="m3-gz"><path class="m3-x" d="M28 176l22-8"/><path class="m3-y" d="M28 176l-14-10"/><path class="m3-z" d="M28 176v-16"/><circle cx="28" cy="176" r="2.4" class="m3-o"/></g>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.turn0 = r + TURN0;
    T.turn1 = r + TURN0 + TURN;
    T.render = r + RENDER_AT;
    T.foot = r + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="m3-card">
      <div class="m3-hd"><img src="${x.brand('blender-logo.svg')}" alt=""/><b>mic-hero.blend</b><span class="m3-tag">Viewport 3D</span></div>
      <div class="m3-vp"><svg class="m3-scene" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">${grid()}
        <g class="m3-model">${viewA()}</g><g class="m3-model m3-b">${viewB()}</g>${shaded()}${gizmo()}</svg>
        <span class="m3-badge"><img src="${x.brand('blender-logo.svg')}" alt=""/><span>${BADGE[0]}</span></span></div>
      <div class="m3-props">${PROPS.map((p, i) => `<span${i ? ' class="m3-d"' : ''}>${x.esc(p)}</span>`).join('')}</div>
      <div class="m3-ft">${x.OK}<span>${x.esc(FOOT)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const va = $('.m3-model'), vb = $('.m3-b'), sh = $('.m3-sh'), bp = $('.m3-badge span'), ft = $('.m3-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.render, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        // the turntable: front and 3/4 views cross-fade twice, so the model reads as turning
        const p = seg(t, T.turn0, T.turn1);
        const swap = t < T.render ? (Math.sin(p * Math.PI * 2) * 0.5 + 0.5) : 0; // A..B..A
        va.style.opacity = (1 - swap).toFixed(3);
        vb.style.opacity = swap.toFixed(3);
        // the render: the wireframe cross-fades to the shaded Cycles result; the badge flips
        const r = outCubic(seg(t, T.render, T.render + RENDER));
        const wk = (1 - r).toFixed(3);
        va.style.opacity = (Number(va.style.opacity) * (1 - r)).toFixed(3);
        vb.style.opacity = (Number(vb.style.opacity) * wk).toFixed(3);
        sh.style.opacity = r.toFixed(3);
        bp.textContent = t >= T.render ? BADGE[1] : BADGE[0];
        card.classList.toggle('m3-done', t >= T.render);
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};