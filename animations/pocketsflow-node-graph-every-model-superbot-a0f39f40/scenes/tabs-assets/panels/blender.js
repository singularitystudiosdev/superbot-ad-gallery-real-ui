// Node 3, Blender 5.2 (driven over its Python API): the PF tile modelled from Pocketsflow's own mark, shown the way
// Blender shows it. Edit Mode is Blender's Workbench solid render with the wireframe pass over it; Rendered is the
// Cycles turntable (64 samples, AgX). The outliner, modifier stack and the status-bar counts are the scene's real ones
// (gen/pf_tile.a0f39f40.py, BLENDER = its evaluated mesh stats).
import { BLENDER } from '../gen-data.js';
import { el, gen, brand } from './kit.js';
import { clamp, seg, outCubic } from '../../../lib.js';

const N = 36;
const fmt = (n) => n.toLocaleString('en-US');
const SPACES = ['Layout', 'Modeling', 'Sculpting', 'UV Editing', 'Texture Paint', 'Shading', 'Animation', 'Rendering'];
const TO_RENDER = 1.0; // the viewport switches from Edit Mode to Rendered

export const blender = {
  key: 'blender',
  head: 'pocketsflow-tile.blend',
  meta: `Blender ${BLENDER.version} · Cycles · ${fmt(BLENDER.tris)} tris`,
  done: `${fmt(BLENDER.verts)} verts`,
  thumb: () => `<div class="fg-thumb bl-th"><img src="${gen('blender/cycles-hero.webp')}" alt=""/></div>`,
  mount(body) {
    body.classList.add('bl');
    const turn = Array.from({ length: N }, (_, i) => `<img src="${gen(`blender/turn/turn-${String(i).padStart(2, '0')}.webp`)}" alt=""/>`).join('');
    body.append(
      el(`<div class="bl-top"><img src="${brand('blender-logo.svg')}" alt=""/><span class="bl-menu">File</span><span class="bl-menu">Edit</span><span class="bl-menu">Render</span><span class="bl-menu">Window</span><span class="bl-menu">Help</span><span class="bl-ws">${SPACES.map((s) => `<i data-s="${s}">${s}</i>`).join('')}</span><span class="bl-scene">Scene</span></div>`),
      el(`<div class="bl-vp">
        <div class="bl-floor"></div>
        <div class="bl-hd"><span class="bl-mode">Edit Mode</span><span>View</span><span>Select</span><span>Add</span><span>Mesh</span><span class="bl-shade"><i></i><i></i><i></i><i></i></span></div>
        <div class="bl-info"><b>User Perspective</b><small>(1) Collection | PF_Tile</small></div>
        <div class="bl-giz"><i class="x">X</i><i class="y">Y</i><i class="z">Z</i></div>
        <div class="bl-obj bl-edit"><img src="${gen('blender/wb-solid.webp')}" alt=""/><img class="bl-wire" src="${gen('blender/wb-wire.webp')}" alt=""/></div>
        <div class="bl-obj bl-rend">${turn}</div>
        <div class="bl-cy">Sample 64/64 · Cycles · Metal</div>
      </div>`),
      el(`<div class="bl-side">
        <div class="bl-out"><div class="bl-cap">Scene Collection</div>
          <div class="bl-row d1"><i class="o-cam"></i>Camera</div>
          <div class="bl-row d1"><i class="o-lt"></i>Key · Rim · Fill · Top</div>
          <div class="bl-row d1"><i class="o-emp"></i>Turntable</div>
          <div class="bl-row d2 sel"><i class="o-mesh"></i>PF_Tile</div>
          <div class="bl-row d2"><i class="o-mesh"></i>PF_Letters</div>
        </div>
        <div class="bl-props"><div class="bl-cap">Modifiers · PF_Tile</div>
          <div class="bl-mod"><b>Bevel</b><span>Amount<em>0.16 m</em></span><span>Segments<em>10</em></span></div>
          <div class="bl-mod"><b>Subdivision Surface</b><span>Levels Viewport<em>1</em></span><span>Render<em>1</em></span></div>
          <div class="bl-cap">Materials</div>
          <div class="bl-mat"><i style="background:#0b0b0c"></i>Ceramic Black<small>Coat 1.0</small></div>
          <div class="bl-mat"><i style="background:linear-gradient(135deg,#f2f2ef,#9a9a97)"></i>Satin Silver<small>Metallic 1.0</small></div>
        </div>
      </div>`),
      el(`<div class="bl-status"><span>Font: Averia Serif Libre Bold</span><span class="bl-stats">PF_Tile | Verts ${fmt(BLENDER.verts)} | Faces ${fmt(BLENDER.faces)} | Tris ${fmt(BLENDER.tris)} | Objects 1/2</span><span>${BLENDER.version}</span></div>`),
    );
    const q = (sel) => body.querySelector(sel);
    return {
      mode: q('.bl-mode'), shade: [...body.querySelectorAll('.bl-shade i')], ws: [...body.querySelectorAll('.bl-ws i')],
      edit: q('.bl-edit'), wire: q('.bl-wire'), rend: q('.bl-rend'), frames: [...body.querySelectorAll('.bl-rend img')],
      vp: q('.bl-vp'), cy: q('.bl-cy'), last: -1, lastMode: null,
    };
  },
  render(s, p) {
    const rendered = p >= TO_RENDER;
    if (rendered !== s.lastMode) {
      s.mode.textContent = rendered ? 'Object Mode' : 'Edit Mode';
      s.shade.forEach((n, i) => n.classList.toggle('on', i === (rendered ? 3 : 1)));
      s.ws.forEach((n) => n.classList.toggle('on', n.dataset.s === (rendered ? 'Rendering' : 'Modeling')));
      s.vp.classList.toggle('bl-is-r', rendered);
      s.lastMode = rendered;
    }
    // modelling: the wire pass sweeps across the solid one
    const w = outCubic(seg(p, 0.05, 0.85));
    s.wire.style.clipPath = `inset(0 ${((1 - w) * 100).toFixed(2)}% 0 0)`;
    const x = seg(p, TO_RENDER - 0.12, TO_RENDER + 0.18);
    s.edit.style.opacity = (1 - x).toFixed(3);
    s.rend.style.opacity = x.toFixed(3);
    s.cy.style.opacity = seg(p, TO_RENDER + 0.1, TO_RENDER + 0.35).toFixed(3);
    // the Cycles turntable, swinging once across its 36 frames
    const sw = clamp((p - TO_RENDER) / 1.6);
    const i = Math.round((0.5 - 0.5 * Math.cos(Math.PI * 2 * sw)) * (N - 1));
    if (i !== s.last) { s.frames.forEach((f, j) => { f.style.display = j === i ? 'block' : 'none'; }); s.last = i; }
  },
};
