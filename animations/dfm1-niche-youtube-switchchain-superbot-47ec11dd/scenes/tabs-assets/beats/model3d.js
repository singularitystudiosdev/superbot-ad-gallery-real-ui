// Model3d beat: Blender 5.2 on this Mac models the $29 mic and renders it. Its line streams and a card rises in
// Blender's own UI language (dark greys #1d1d1d / #303030 / #3d3d3d, the outliner's orange active-object text on the
// blue active highlight): the 3D viewport header ("Object Mode" and the three viewport shading states as plain labels,
// the current one highlighted), the viewport itself beside the outliner, the scene statistics in Blender's words, and
// a render footer. The viewport steps through the real renders in img/blender/ (rendered headless in Blender 5.2.2 by
// a procedural bpy script, see img/blender/CREDITS.txt): wire.jpg (Wireframe), clay.jpg (Solid), then the 24-frame
// turntable (Rendered), the frame picked from t so the mic turns a full 360 degrees and settles on frame 00.
// The outliner and the statistics are the real scene: its object hierarchy and the depsgraph counts after modifiers.
// X ad policy: nothing here is a control. No menus, dropdown arrows, disclosure triangles, eye or camera toggles,
// window dots or close marks; the shading names are state labels. Pure function of t: every moving value is written
// from t (the turntable frame is floor of t), no timers, no CSS transitions.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Modeled the $29 mic in Blender and rendered a 360° turntable.';
// the scene's outliner: [name, depth, icon] in Blender's order (alphabetical under each parent)
const OUTLINER = [
  ['Collection', 0, 'col'],
  ['Mic_Body', 1, 'mesh'],
  ['Accent_Ring', 2, 'mesh'],
  ['Capsule_Core', 2, 'mesh'],
  ['Gain_Knob', 2, 'mesh'],
  ['Grille', 2, 'mesh'],
  ['Grille_Band', 2, 'mesh'],
  ['USB_C_Port', 2, 'mesh'],
  ['Orbit_Rig', 1, 'empty'],
  ['Camera', 2, 'cam'],
  ['Fill_Light', 2, 'light'],
  ['Key_Light', 2, 'light'],
  ['Rim_Light', 2, 'light'],
  ['Rim_Light_L', 2, 'light'],
  ['Studio_Floor', 1, 'mesh'],
  ['Tripod', 1, 'mesh'],
];
const ACTIVE = 'Mic_Body';
// the depsgraph statistics after modifiers (blender.ae6ce2ad/stats.json), in the viewport Statistics overlay's words
const STATS = [['Objects', '1/15'], ['Vertices', '10,349'], ['Faces', '12,428'], ['Triangles', '25,488']];
const SHADING = ['Wireframe', 'Solid', 'Rendered'];
const FRAMES = 24;
const RENDER = 'EEVEE, 960x540';
const DONE = '27 renders saved to img/blender';

// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                      // the reply line streams
const SAY_AT = 0.05;                  // reply start to the line's first character
const CARD = 0.14;                    // reply start to the card rising in
const RISE = 0.34;                    // the card rising in
const SOLID_AT = 0.5;                 // card start to the Solid (clay) view
const REND_AT = 0.9;                  // card start to the Rendered turntable
const XF = 0.12;                      // the cross-fade between shading states
const TURN = 1.2;                     // one full turn: 24 frames at 20 frames a second
const FOOT_IN = 0.2;                  // the footer resolving to its check

// the mesh object icon: an outlined triangle with its three vertices (Blender's mesh data glyph), not an arrow
const MESH = '<svg class="m3-ic m3-mesh" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.6L8.6 8.2H1.4z"/><circle cx="5" cy="1.6" r="1.2"/><circle cx="8.6" cy="8.2" r="1.2"/><circle cx="1.4" cy="8.2" r="1.2"/></svg>';
const pad = (n) => String(n).padStart(2, '0');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.solid = T.card + SOLID_AT;
    T.rend = T.card + REND_AT;
    T.turnEnd = T.rend + TURN;        // frame 00 again: the turn is complete
    T.done = T.turnEnd;               // "27 renders saved"
    T.end = Math.max(T.done + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const shots = ['blender/wire.jpg', 'blender/clay.jpg', ...Array.from({ length: FRAMES }, (_, i) => `blender/turn/${pad(i)}.jpg`)];
    const rows = OUTLINER.map(([n, d, ic]) => `<div class="m3-row${n === ACTIVE ? ' m3-act' : ''}" style="padding-left:${4 + d * 9}px">${ic === 'mesh' ? MESH : `<i class="m3-ic m3-${ic}"></i>`}<span>${x.esc(n)}</span></div>`).join('');
    const card = x.el(`<div class="m3-card">
      <div class="m3-hd"><span class="m3-mode"><i class="m3-cube"></i>Object Mode</span><span class="m3-rl">Render: <b>${x.esc(RENDER)}</b></span>
        <span class="m3-shade">${SHADING.map((s) => `<span class="m3-sh">${s}</span>`).join('')}</span></div>
      <div class="m3-body">
        <div class="m3-vp">${shots.map((s) => `<img src="${x.img(s)}" width="960" height="540" alt="" decoding="sync"/>`).join('')}
          <span class="m3-ov"><span class="m3-ovt">User Perspective</span><span>(<b class="m3-fr">1</b>) Collection | Mic_Body</span></span></div>
        <div class="m3-ol">${rows}</div>
      </div>
      <div class="m3-stats">${STATS.map(([a, b]) => `<span><i>${a}</i>${b}</span>`).join('')}</div>
      <div class="m3-ft"><span class="m3-st"><i class="m3-spin"></i>${x.OK}</span><span class="m3-msg">Rendering wire.jpg</span><small>${FRAMES} frames, 15° apart</small></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const imgs = [...card.querySelectorAll('.m3-vp img')];
    const shades = [...card.querySelectorAll('.m3-sh')];
    const fr = $('.m3-fr'), msg = $('.m3-msg'), spin = $('.m3-spin'), ok = $('.m3-st .qc-ok'), ft = $('.m3-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, label = '', frameShown = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // shading state: Wireframe, then Solid, then Rendered (each cross-fades over the one before)
        const ws = seg(t, T.solid, T.solid + XF), wr = seg(t, T.rend, T.rend + XF);
        const st = t < T.solid + XF / 2 ? 0 : t < T.rend + XF / 2 ? 1 : 2;
        shades.forEach((n, i) => n.classList.toggle('m3-on', i === st));
        // the turntable frame: 24 frames over TURN, then frame 00 holds (a full 360)
        const f = t < T.rend ? 0 : Math.min(FRAMES, Math.floor(seg(t, T.rend, T.turnEnd) * FRAMES)) % FRAMES;
        imgs.forEach((im, i) => {
          let o = 0;
          if (i === 0) o = 1;                         // the wireframe sits underneath
          else if (i === 1) o = ws;                   // the clay fades in over it
          else o = i - 2 === f ? wr : 0;              // the current turntable frame fades in over the clay
          im.style.opacity = o > 0 ? o.toFixed(3) : '0';
        });
        const fl = String(t < T.rend ? 1 : f + 1);
        if (fl !== frameShown) { fr.textContent = fl; frameShown = fl; }

        // the footer: the render count while the turntable plays, then the save line with its check
        const n = t < T.rend ? 1 : Math.min(FRAMES, Math.floor(seg(t, T.rend, T.turnEnd) * FRAMES) + 1);
        const lb = t >= T.done ? DONE : t < T.solid ? 'Rendering wire.jpg' : t < T.rend ? 'Rendering clay.jpg' : `Rendering turntable ${n} of ${FRAMES}`;
        if (lb !== label) { msg.textContent = lb; label = lb; }
        const d = outCubic(seg(t, T.done, T.done + FOOT_IN));
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        ft.classList.toggle('m3-done', t >= T.done);
      },
    };
  },
};
