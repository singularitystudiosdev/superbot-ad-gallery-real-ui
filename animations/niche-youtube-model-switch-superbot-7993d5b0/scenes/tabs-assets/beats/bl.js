// Blender beat, the second hand-off: superbot drives Blender 5.2 LTS through its Python API to model the headset
// DeepSeek picked, then renders it. The window is Blender's own Layout workspace (top bar and workspace tabs, the 3D
// viewport with its header, nav gizmo, grid floor and statistics overlay, the Outliner and the Render properties, the
// timeline and the status bar). Every image in it is the real thing: the five clay passes are Workbench renders of
// the actual .blend as it was built (assets-src/blender/headset.7993d5b0.py), the bpy call that made each pass shows
// in the status bar, the Rendered view is the Cycles render (its sample counter climbing to 192 while the noise
// clears), and camera view plays the turntable frames rendered for the 15 s premiere trailer, the playhead running.
// The counts in the statistics overlay are the model's own (17 objects, 24,130 vertices, 47,238 triangles).
// The voiceover Eleven v4 made sits on the timeline as a sound strip, so the trailer is cut to it.
// Hand-off: hero.png and rival.png go to Nano Banana Pro; trailer.mp4 and wren-h2.glb ride along for Opus and Studio.
import { seg, outCubic, lerp } from '../../../lib.js';
import { windowTimes, sayLine, rise, windowCard } from './kit.js?v=7993d5b0';
import { VO } from './vo-peaks.js?v=7993d5b0';

const SAY = 'Modeling the Wren H2 and rendering a 15-second premiere trailer.';
const STATS = { objects: 17, verts: '24,130', tris: '47,238' };
// the five modelling passes: clay render, the bpy call behind it, the outliner rows it adds
const PASSES = [
  ['stage-0.webp', "bpy.ops.mesh.primitive_cylinder_add(radius=0.047, depth=0.034)", ['Cup.L', 'Cup.R']],
  ['stage-1.webp', "bpy.ops.mesh.primitive_torus_add(major_radius=0.036, minor_radius=0.0125)", ['Cushion.L', 'Cushion.R']],
  ['stage-2.webp', "bpy.data.curves.new('Headband', 'CURVE')", ['Headband', 'Headband.Pad', 'Slider.L', 'Slider.R']],
  ['stage-3.webp', "bpy.ops.object.text_add()  # WREN", ['Ring.L', 'Ring.R', 'Logo.Wren']],
  ['stage-4.webp', "bpy.ops.object.modifier_add(type='BEVEL')", ['Mic.Boom', 'Mic.Capsule']],
];
const TABS = ['Layout', 'Modeling', 'Sculpting', 'UV Editing', 'Texture Paint', 'Shading', 'Animation', 'Rendering', 'Compositing', 'Scripting'];
const TURN = 24;                     // turntable frames on disk (img/turn/t00..t23.jpg), every 15 degrees

const HOLD = 3.6; /* deliberate */
const PASS_AT = 0.05, PASS_STAGGER = 0.3, PASS_IN = 0.22;
const RENDER_AT = 1.65;              // the shading switch to Rendered
const SAMPLES = 0.7;                 // the sample counter's climb to 192
const CAM_AT = 2.5;                  // camera view: the trailer's turntable plays
const SPIN = 13;                     // turntable frames shown per second

export default {
  times(r, opts) {
    const T = windowTimes(r, opts, HOLD);
    T.pass = PASSES.map((_, i) => T.c0 + PASS_AT + i * PASS_STAGGER);
    T.render = T.c0 + RENDER_AT;
    T.cam = T.c0 + CAM_AT;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const ic = (kind) => `<i class="bl-ic bl-ic-${kind}"></i>`;
    const rows = [
      ['coll', 'Scene Collection', 0, true], ['coll', 'Collection', 1, true], ['cam', 'Camera', 2, true], ['light', 'Key', 2, true], ['light', 'Rim', 2, true],
      ['empty', 'WrenH2', 2, true],
      ...PASSES.flatMap(([, , names], pi) => names.map((n) => ['mesh', n, 3, false, pi])),
    ];
    const app = `<div class="bl">
      <div class="bl-top"><img class="bl-logo" src="${x.brand('blender-logo.svg')}" alt=""/>
        ${['File', 'Edit', 'Render', 'Window', 'Help'].map((m) => `<span class="bl-mn">${m}</span>`).join('')}
        <span class="bl-tabs">${TABS.map((tb, i) => `<span class="bl-tab${i === 0 ? ' bl-on' : ''}">${tb}</span>`).join('')}</span></div>
      <div class="bl-mid">
        <div class="bl-vp">
          <div class="bl-vh"><span class="bl-sel">Object Mode ▾</span><span class="bl-mn">View</span><span class="bl-mn">Select</span><span class="bl-mn">Add</span><span class="bl-mn">Object</span>
            <span class="bl-sp"></span><span class="bl-shade"><i class="bl-sh"></i><i class="bl-sh bl-sh-solid"></i><i class="bl-sh"></i><i class="bl-sh bl-sh-rend"></i></span></div>
          <div class="bl-view">
            <div class="bl-floor"><i></i></div>
            ${PASSES.map(([f]) => `<img class="bl-clay" src="${x.img(f)}" alt=""/>`).join('')}
            <img class="bl-hero" src="${x.img('wren-hero.webp')}" alt=""/>
            <div class="bl-camv"><div class="bl-camf">${Array.from({ length: TURN }, (_, i) => `<img src="${x.img(`turn/t${String(i).padStart(2, '0')}.jpg`)}" alt=""/>`).join('')}</div></div>
            <div class="bl-ov"><div class="bl-ovt">User Perspective</div><div>(1) Collection | WrenH2</div>
              <div class="bl-stat">Objects <b class="bl-on-n">0</b>/${STATS.objects}<br/>Vertices ${STATS.verts}<br/>Triangles ${STATS.tris}</div><div class="bl-samp">Sample <b>0</b>/192</div></div>
            <div class="bl-giz"><i class="bl-gz bl-gx">X</i><i class="bl-gz bl-gy">Y</i><i class="bl-gz bl-gzz">Z</i></div>
          </div>
        </div>
        <div class="bl-side">
          <div class="bl-ol"><div class="bl-ph">Outliner</div>
            ${rows.map(([kind, name, d, base, pi]) => `<div class="bl-row${base ? ' bl-base' : ''}" ${pi === undefined ? '' : `data-p="${pi}"`} style="--d:${d}">${ic(kind)}<span>${name}</span></div>`).join('')}</div>
          <div class="bl-pr"><div class="bl-ph">Properties · Render</div>
            <div class="bl-kv"><span>Render Engine</span><b class="bl-eng">Cycles</b></div>
            <div class="bl-kv"><span>Device</span><b>GPU Compute</b></div>
            <div class="bl-kv"><span>Samples</span><b>192 · Denoise</b></div>
            <div class="bl-kv"><span>Output</span><b>1920×1080 · 24 fps</b></div>
            <div class="bl-kv"><span>Frames</span><b>1 – 360</b></div></div>
        </div>
      </div>
      <div class="bl-tl"><span class="bl-play">▶</span><div class="bl-ruler">${[0, 60, 120, 180, 240, 300, 360].map((f) => `<i style="left:${(f / 360 * 100).toFixed(2)}%">${f}</i>`).join('')}
        <div class="bl-snd" style="width:${(VO.dur * 24 / 360 * 100).toFixed(2)}%"><span>trailer-vo.mp3</span>${VO.peaks.filter((_, i) => i % 2 === 0).map((v) => `<i style="height:${(12 + v * 88).toFixed(0)}%"></i>`).join('')}</div>
        <b class="bl-head"><span>1</span></b></div></div>
      <div class="bl-status"><span class="bl-op"></span><span class="bl-sp"></span><span>WrenH2 | Verts ${STATS.verts} | Tris ${STATS.tris} | 5.2.2 LTS</span></div>
    </div>`;
    const w = windowCard(x, 'kc-bl', app, {
      ins: [{ logo: x.brand('deepseek-logo.svg'), file: 'specs.json' }, { logo: x.brand('elevenlabs-logo.svg'), file: 'trailer-vo.mp3' }],
      outs: ['hero.png', 'rival.png', 'trailer.mp4', 'wren-h2.glb'],
      next: { logo: x.brand('gemini-logo.svg'), name: 'Nano Banana Pro', cls: 'kc-n-dark' },
    });
    const $ = (s) => w.card.querySelector(s);
    const clays = [...w.card.querySelectorAll('.bl-clay')];
    const passRows = [...w.card.querySelectorAll('.bl-row[data-p]')];
    const hero = $('.bl-hero'), camv = $('.bl-camv'), frames = [...w.card.querySelectorAll('.bl-camf img')];
    const op = $('.bl-op'), onN = $('.bl-on-n'), samp = $('.bl-samp'), sampN = samp.querySelector('b');
    const shades = [...w.card.querySelectorAll('.bl-sh')];
    const head = $('.bl-head'), headN = head.firstElementChild, ovt = $('.bl-ovt');
    let lastOp = '', lastN = -1, lastS = -1, lastF = -1, lastH = '';

    return {
      nodes: [say.node, w.card],
      marks: [[T.r, say.node], [T.card, w.card]],
      focus: w.card,
      render(t) {
        say.render(t, T.r);
        rise(w.card, t, T.card);
        // modelling: each pass fades up over the last; its bpy call sits in the status bar, its rows join the outliner
        let cur = -1;
        clays.forEach((c, i) => {
          const p = outCubic(seg(t, T.pass[i], T.pass[i] + PASS_IN));
          if (p > 0) cur = i;
          const next = i + 1 < clays.length ? seg(t, T.pass[i + 1], T.pass[i + 1] + PASS_IN) : 0;
          c.style.opacity = (p * (1 - next) * (1 - seg(t, T.render, T.render + 0.25))).toFixed(3);
        });
        passRows.forEach((n) => { n.style.opacity = outCubic(seg(t, T.pass[+n.dataset.p], T.pass[+n.dataset.p] + 0.2)).toFixed(3); });
        const opText = t >= T.cam ? 'Rendering animation · frame ' : (t >= T.render ? 'Viewport shading: Rendered' : (cur >= 0 ? PASSES[cur][1] : ''));
        const n = cur < 0 ? 0 : [2, 4, 8, 11, 14][cur] + 3;
        if (n !== lastN) { onN.textContent = String(Math.min(STATS.objects, n)); lastN = n; }
        // Rendered: the Cycles render resolves, sample by sample
        const rs = seg(t, T.render, T.render + SAMPLES);
        hero.style.opacity = (seg(t, T.render, T.render + 0.25) * (1 - seg(t, T.cam, T.cam + 0.25))).toFixed(3);
        hero.style.filter = rs < 1 ? `blur(${((1 - outCubic(rs)) * 3).toFixed(2)}px) contrast(${lerp(1.35, 1, rs).toFixed(3)})` : 'none';
        samp.style.opacity = (t >= T.render && t < T.cam) ? '1' : '0';
        const s = Math.max(1, Math.round(192 * outCubic(rs)));
        if (s !== lastS) { sampN.textContent = String(s); lastS = s; }
        shades.forEach((sh, i) => sh.classList.toggle('bl-act', i === (t >= T.render ? 3 : 1)));
        // camera view: the trailer's turntable plays and the playhead runs
        camv.style.opacity = seg(t, T.cam, T.cam + 0.25).toFixed(3);
        const f = t < T.cam ? 0 : Math.floor((t - T.cam) * SPIN) % TURN;
        if (f !== lastF) { frames.forEach((im, i) => { im.style.opacity = i === f ? '1' : '0'; }); lastF = f; }
        const frame = t < T.cam ? 1 : Math.min(360, 1 + Math.floor((t - T.cam) * SPIN * 15));
        head.style.left = `${((frame - 1) / 359 * 100).toFixed(2)}%`;
        const hs = String(frame);
        if (hs !== lastH) { headN.textContent = hs; lastH = hs; }
        const full = t >= T.cam ? `${opText}${frame}/360` : opText;
        if (full !== lastOp) { op.textContent = full; lastOp = full; }
        ovt.textContent = t >= T.cam ? 'Camera Perspective' : 'User Perspective';
        w.renderIO(t, T.out);
      },
    };
  },
};
