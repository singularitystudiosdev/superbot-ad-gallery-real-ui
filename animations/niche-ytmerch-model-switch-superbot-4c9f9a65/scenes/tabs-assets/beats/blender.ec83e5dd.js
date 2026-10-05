// Link 2, Blender 5.2 (connected app): models the mug. The window is Blender's own Modeling workspace in the default
// dark theme. The viewport plays the three shading modes a modeler steps through, each one a REAL Blender 5.2.2 render
// of the same scene from the same camera (tools/mug.ec83e5dd.py in the work folder): Wireframe (the lathe cage, the
// selected object's orange wire), Solid (Workbench studio light) and Rendered (Cycles, 160 samples, the sample count
// climbing while the noise clears). The floor grid is projected through that render camera (85 mm at 0,-0.5,0.175
// aimed at 0.011,0,0.047), so it sits under the mug exactly. The outliner, the modifier stack (Lathe = Screw 72 steps,
// Subdivision 2) and the status-bar counts (24,018 verts, 48,000 tris, 9 objects) are the real scene's.
// It ends exporting mug.glb (glTF 2.0), the file the store's 3D viewer loads two links later.
import { seg, outCubic, lerp } from '../../../lib.js';
import { ic } from '../icons.ec83e5dd.js?v=4c9f9a65';

const VW = 812, VH = 726;          // viewport px (below its header)
const IMG = 700;                   // the render's box, centred in the viewport
const SAMPLES = 160;

// the render camera, for the floor grid (Blender: sensor 36 mm fit to width on a square render)
function projector() {
  const C = [0, -0.5, 0.175], T = [0.011, 0, 0.047];
  const sub = (a, b) => a.map((v, i) => v - b[i]);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = norm(sub(T, C)), r = norm(cross(f, [0, 0, 1])), u = cross(r, f);
  const s = 85 / 36;
  const ox = (VW - IMG) / 2, oy = (VH - IMG) / 2;
  return (P) => {
    const d = sub(P, C), z = dot(d, f);
    return [ox + IMG / 2 + (dot(d, r) / z) * s * IMG, oy + IMG / 2 - (dot(d, u) / z) * s * IMG];
  };
}

function gridSvg() {
  const pj = projector();
  const line = (a, b, cls) => { const p = pj(a), q = pj(b); return `<line class="${cls}" x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}"/>`; };
  let out = '';
  for (let i = -40; i <= 40; i++) {
    const v = i * 0.01;
    if (i === 0) continue;
    const cls = i % 10 === 0 ? 'bl-g10' : 'bl-g1';
    out += line([v, -0.36, 0], [v, 0.9, 0], cls) + line([-0.4, v + 0.25, 0], [0.4, v + 0.25, 0], cls);
  }
  out += line([-0.6, 0, 0], [0.6, 0, 0], 'bl-gx') + line([0, -0.36, 0], [0, 0.9, 0], 'bl-gy');
  return `<svg class="bl-grid" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}">${out}</svg>`;
}

// a fixed grain for the Cycles noise (seeded, so every frame and every render is identical)
function noiseUrl() {
  const c = document.createElement('canvas');
  c.width = c.height = 240;
  const g = c.getContext('2d');
  const im = g.createImageData(240, 240);
  let s = 7;
  for (let i = 0; i < im.data.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const v = s % 255, w = ((s >> 8) % 3);
    im.data[i] = w === 0 ? v : v * 0.6; im.data[i + 1] = w === 1 ? v : v * 0.7; im.data[i + 2] = w === 2 ? v : v * 0.8; im.data[i + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return c.toDataURL();
}

const TABS = ['Layout', 'Modeling', 'Sculpting', 'UV Editing', 'Texture Paint', 'Shading', 'Animation', 'Rendering'];
const TOOLS = ['arrow-selector-tool', 'my-location', 'open-with', 'rotate-right', 'open-in-full', 'edit-outline', 'straighten'];
const OUTLINER = [
  [0, 'Scene Collection', 'inventory-2-outline'], [1, 'Collection', 'inventory-2-outline'], [2, 'Camera', 'videocam-outline'],
  [2, 'Key', 'lightbulb-outline'], [2, 'Rim', 'lightbulb-outline'], [2, 'Fill', 'lightbulb-outline'], [2, 'Plane', 'change-history-outline'],
  [2, 'Turntable', 'my-location'], [3, 'Mug', 'change-history-outline', 'bl-act'], [3, 'Handle', 'change-history-outline'],
];

export default {
  times(done) {
    return { end: done + 2.2 };
  },
  build(k, ctx) {
    const im = (f) => ctx.img(f);
    const ws = ctx.el(`
<div class="bl">
  <div class="bl-top"><img class="bl-logo" src="${ctx.brand('blender-logo.svg')}" alt=""/><span class="bl-menu">File</span><span class="bl-menu">Edit</span><span class="bl-menu">Render</span><span class="bl-menu">Window</span><span class="bl-menu">Help</span>
    <span class="bl-tabs">${TABS.map((n) => `<span class="${n === 'Modeling' ? 'bl-tab-on' : ''}">${n}</span>`).join('')}</span><span class="bl-file">mug.blend</span></div>
  <div class="bl-main">
    <div class="bl-tools">${TOOLS.map((n, i) => `<span class="${i ? '' : 'bl-tool-on'}">${ic(n)}</span>`).join('')}</div>
    <div class="bl-vp">
      <div class="bl-vh"><span class="bl-dd">Object Mode ${ic('keyboard-arrow-down')}</span><span class="bl-vm">View</span><span class="bl-vm">Select</span><span class="bl-vm">Add</span><span class="bl-vm">Object</span>
        <span class="bl-shade"><i data-m="0">${ic('language')}</i><i data-m="1">${ic('circle')}</i><i data-m="2">${ic('contrast')}</i><i data-m="3">${ic('light-mode-outline')}</i></span></div>
      <div class="bl-view">
        ${gridSvg()}
        <img class="bl-im bl-wire" src="${im('mug-wire.webp')}" alt=""/>
        <img class="bl-im bl-solid" src="${im('mug-solid.webp')}" alt=""/>
        <img class="bl-im bl-cyc" src="${im('mug-blank.webp')}" alt=""/>
        <div class="bl-im bl-noise"></div>
        <div class="bl-info"><b>User Perspective</b><span>(1) Collection | Mug</span><span class="bl-samp"></span></div>
        <div class="bl-giz"><i class="gz-z">Z</i><i class="gz-y">Y</i><i class="gz-x">X</i></div>
      </div>
    </div>
    <div class="bl-side">
      <div class="bl-ol">${OUTLINER.map(([d, n, icon, cls]) => `<div class="bl-row ${cls || ''}" style="--d:${d}">${ic(icon)}<span>${n}</span>${n === 'Mug' ? `<em>${ic('build-outline')}</em>` : ''}${d >= 2 ? `<s>${ic('visibility-outline')}</s>` : ''}</div>`).join('')}</div>
      <div class="bl-props">
        <div class="bl-ph">${ic('build-outline')} Mug <small>Modifiers</small></div>
        <div class="bl-mod"><div class="bl-mh">${ic('refresh')} Lathe <small>Screw</small></div><div class="bl-kv"><span>Axis</span><b>Z</b></div><div class="bl-kv"><span>Steps Viewport</span><b>72</b></div><div class="bl-kv"><span>Merge</span><b class="bl-chk">${ic('check')}</b></div></div>
        <div class="bl-mod"><div class="bl-mh">${ic('change-history-outline')} Subdivision</div><div class="bl-kv"><span>Levels Viewport</span><b>2</b></div><div class="bl-kv"><span>Render</span><b>2</b></div></div>
        <div class="bl-mod bl-rend"><div class="bl-mh">${ic('photo-camera-outline')} Render</div><div class="bl-kv"><span>Engine</span><b>Cycles</b></div><div class="bl-kv"><span>Device</span><b>GPU Compute</b></div><div class="bl-kv"><span>Samples</span><b>${SAMPLES}</b></div></div>
      </div>
    </div>
  </div>
  <div class="bl-status"><span class="bl-msg"></span><span class="bl-stats">Mug  |  Verts 24,018  |  Faces 24,000  |  Tris 48,000  |  Objects 1/9  |  5.2.2 LTS</span></div>
</div>`);
    const q = (s) => ws.querySelector(s);
    const wire = q('.bl-wire'), solid = q('.bl-solid'), cyc = q('.bl-cyc'), noise = q('.bl-noise'), samp = q('.bl-samp'), msg = q('.bl-msg');
    const modes = [...ws.querySelectorAll('.bl-shade i')];
    noise.style.backgroundImage = `url(${noiseUrl()})`;
    noise.style.webkitMaskImage = noise.style.maskImage = `url(${im('mug-blank.webp')})`;
    const d = k.done;
    let lastS = -1, lastMsg = null, lastMode = -1;
    return {
      ws,
      head: 'connected · modeling mug.blend',
      say: 'Modeled an 11 oz mug: 48,000 tris, lit and rendered in Cycles.',
      chips: ['mug.glb', 'mug.blend'],
      out: 'mug.glb',
      render(t) {
        // wireframe: the cage rises from the floor
        const wv = seg(t, d, d + 0.55);
        wire.style.clipPath = `inset(${((1 - outCubic(wv)) * 100).toFixed(2)}% 0 0 0)`;
        const sIn = outCubic(seg(t, d + 0.62, d + 0.82));
        const cIn = outCubic(seg(t, d + 1.0, d + 1.12));
        wire.style.opacity = (1 - sIn).toFixed(3);
        solid.style.opacity = (sIn * (1 - cIn)).toFixed(3);
        cyc.style.opacity = cIn.toFixed(3);
        // Cycles: samples climb and the grain clears
        const sp = seg(t, d + 1.0, d + 1.85);
        const n = t < d + 1.0 ? 0 : Math.max(1, Math.round(SAMPLES * sp * sp));
        noise.style.opacity = (cIn * (1 - Math.pow(sp, 0.55)) * 0.85).toFixed(3);
        if (n !== lastS) { samp.textContent = n ? (n < SAMPLES ? `Sample ${n}/${SAMPLES}` : 'Denoised · 160 samples') : ''; lastS = n; }
        const mode = t < d + 0.62 ? 0 : t < d + 1.0 ? 1 : 3;
        if (mode !== lastMode) { modes.forEach((m, i) => m.classList.toggle('bl-on', i === mode)); lastMode = mode; }
        const m = t >= d + 1.95 ? 'Finished glTF 2.0 export in 0.38 s · mug.glb' : t >= d ? 'Lathe (Screw) · Subdivision applied on export' : '';
        if (m !== lastMsg) { msg.innerHTML = m ? `${ic(t >= d + 1.95 ? 'check-circle' : 'description-outline')}${m}` : ''; msg.classList.toggle('bl-msg-ok', t >= d + 1.95); lastMsg = m; }
        msg.style.opacity = (t >= d + 1.95 ? outCubic(seg(t, d + 1.95, d + 2.1)) : seg(t, d, d + 0.2)).toFixed(3);
      },
    };
  },
};
