// Blender 5.2.2 LTS driven over Python: the viewport shows the real renders of tools/pf_icon.c7e41a92.py
// (Workbench solid stages, Cycles at 2 / 12 / 128 samples, then the 60-frame turntable, 9.0 s per frame
// on an M5 Pro GPU through Metal). Console lines are the script's own calls; outliner names are its objects.
import { h } from './shell.c7e41a92.js';
import { EASE, prog, lerp, clamp01 } from './ease.c7e41a92.js';
import { B, PANEL, CLIPS } from './plan.c7e41a92.js';
import { NFR, drawFrame } from './frames.c7e41a92.js';

const FRAME = { x: 130, y: 64, w: 640, h: 360 }; // camera frame inside the viewport, tool coords
const CONSOLE = [
  [0.4, 'tile, depth = rounded_tile(size=2.0, radius=0.46, depth=0.26)'],
  [1.1, 'letters = pf_letters(depth)  # "PF", Averia Serif Libre Bold, extrude 0.07'],
  [1.8, 'tile.data.materials.append(principled("Tile_Black_Gloss", (0.006,)*3, 0.16, coat=1.0))'],
  [2.4, 'scene.render.engine = "CYCLES"; scene.cycles.samples = 128'],
  [3.7, 'scene.cycles.samples = 96; bpy.ops.render.render(animation=True)'],
];
const STAGES = [ // [t, image, shading mode index, label]
  [0.8, 'blender/s1.png', 1, 'Solid'], [1.5, 'blender/s2.png', 1, 'Solid'], [2.1, 'blender/s3.png', 1, 'Solid · material color'],
  [2.6, 'blender/s4.jpg', 3, 'Rendered'], [2.9, 'blender/s5.jpg', 3, 'Rendered'], [3.3, 'blender/s6v.jpg', 3, 'Rendered'],
];
const SAMPLES = [[2.6, 2], [2.9, 12], [3.3, 128]];
const TT0 = 3.9, TT1 = 5.4;
const OUTLINER = [
  [0, 'Camera', 'cam'], [0, 'Key_Light', 'light'], [0, 'Rim_Left', 'light'], [0, 'Rim_Right', 'light'], [0, 'Top_Strip', 'light'],
  [0, 'PF_Pivot', 'empty'], [0.8, 'PF_Tile', 'mesh', 1], [1.5, 'PF_Letters', 'font', 1], [0, 'Studio_Floor', 'mesh'], [0, 'Studio_Wall', 'mesh'],
];

export function buildBlender() {
  const el = h(`<div class="tool t-bl">
<header class="btop"><img src="brand/blender-logo.svg" alt=""><span class="menus">File Edit Render Window Help</span>
  <span class="ws">${['Layout', 'Modeling', 'Sculpting', 'UV Editing', 'Texture Paint', 'Shading', 'Animation', 'Rendering', 'Compositing', 'Scripting'].map((w, i) => `<i${i ? '' : ' class="on"'}>${w}</i>`).join('')}</span><span class="scn">Scene · ViewLayer</span></header>
<section class="bvp"><div class="bvh"><span class="mode">Object Mode ▾</span><span class="vm">View Select Add Object</span>
  <span class="shade">${[0, 1, 2, 3].map((i) => `<i data-sh="${i}"></i>`).join('')}</span></div>
  <div class="bview"><div class="bgrid" data-grid></div><i class="ax x" data-grid></i><i class="ax y" data-grid></i>
    <div class="bframe" style="left:${FRAME.x}px;top:${FRAME.y - 52}px;width:${FRAME.w}px;height:${FRAME.h}px">
      ${STAGES.map((s) => `<img src="${s[1]}" alt="" data-stage>`).join('')}<canvas width="1280" height="720" data-tt></canvas></div>
    <div class="bpass" style="--fx:${FRAME.x}px;--fy:${FRAME.y - 52}px;--fw:${FRAME.w}px;--fh:${FRAME.h}px"></div>
    <div class="bov"><b>Camera Perspective</b><span data-ovl>(1) Collection | PF_Tile</span><span class="smp" data-smp></span></div>
    <div class="gizmo"><i class="gx">X</i><i class="gy">Y</i><i class="gz">Z</i></div></div></section>
<section class="bcon"><div class="bch">Python Console</div><div class="bcl" data-con>
  <div class="cl dim">PYTHON INTERACTIVE CONSOLE 3.13 · Builtin Modules: bpy, bpy.data, bpy.ops, bpy.props, bpy.types</div>
  ${CONSOLE.map((c) => `<div class="cl" data-cl><b>&gt;&gt;&gt; </b><span data-ct>${c[1]}</span></div>`).join('')}
  <div class="cl out" data-out>Rendered 60/60 frames · 1920×1080 · 9.0 s/frame on Metal</div></div></section>
<section class="bout"><div class="bch">Outliner</div><div class="orow">▾ Scene Collection</div><div class="orow in">▾ Collection</div>
  ${OUTLINER.map((o) => `<div class="orow in2${o[3] ? ' kid' : ''}" data-or><i class="oi ${o[2]}"></i>${o[1]}</div>`).join('')}</section>
<section class="bprop"><div class="bch">Properties · Render</div>
  <div class="pr"><span>Render Engine</span><b data-eng>Workbench</b></div><div class="pr"><span>Device</span><b>GPU Compute</b></div>
  <div class="pr"><span>Render Samples</span><b data-spp>128</b></div><div class="pr"><span>Denoise</span><b>✓ OpenImageDenoise</b></div>
  <div class="pr"><span>Resolution</span><b>1920 × 1080 px</b></div><div class="pr"><span>Frame Range</span><b>1 - 60 · 30 fps</b></div>
  <div class="pr"><span>Output</span><b>//tt_####.jpg</b></div></section>
<footer class="bstat"><span>Blender 5.2.2 LTS</span><span class="mid" data-st></span><span>Apple M5 Pro (GPU) · Metal</span></footer>
</div>`);
  const q = (s) => el.querySelector(s), qa = (s) => [...el.querySelectorAll(s)];
  const stages = qa('[data-stage]'), tt = q('[data-tt]'), grid = qa('[data-grid]'), shades = qa('[data-sh]');
  const lines = qa('[data-cl]'), texts = qa('[data-ct]'), out = q('[data-out]'), rows = qa('[data-or]');
  const ovl = q('[data-ovl]'), smp = q('[data-smp]'), eng = q('[data-eng]'), spp = q('[data-spp]'), st = q('[data-st]');
  const full = CONSOLE.map((c) => c[1]);
  let lastTT = -1;

  const clip = CLIPS.find((c) => c.id === 'icon3d');
  clip.src = [FRAME.x, PANEL.tabsH + FRAME.y, FRAME.w, FRAME.h];

  return {
    id: 'blender', label: 'Blender', logo: 'brand/blender-logo.svg', tileBg: '#1d1d1f', el,
    update(t) {
      const r = t - B;
      CONSOLE.forEach(([at], i) => {
        lines[i].style.opacity = prog(r, at, 0.12, EASE.standard).toFixed(3);
        texts[i].textContent = full[i].slice(0, Math.round(full[i].length * clamp01((r - at) / 0.32)));
      });
      out.style.opacity = prog(r, TT1, 0.2, EASE.standard).toFixed(3);
      let cur = -1;
      STAGES.forEach((s, i) => { if (r >= s[0]) cur = i; });
      stages.forEach((img, i) => (img.style.opacity = i === cur ? prog(r, STAGES[i][0], 0.18, EASE.standard).toFixed(3) : i < cur ? '1' : '0'));
      const mode = cur < 0 ? 1 : STAGES[cur][2];
      shades.forEach((s, i) => s.classList.toggle('on', i === mode));
      const rendered = mode === 3;
      grid.forEach((g) => (g.style.opacity = rendered ? '0' : '1'));
      rows.forEach((row, i) => {
        const a = prog(r, OUTLINER[i][0], 0.2, EASE.standard);
        row.style.opacity = OUTLINER[i][0] ? a.toFixed(3) : '1';
        row.classList.toggle('sel', OUTLINER[i][1] === (r >= 1.5 ? 'PF_Letters' : 'PF_Tile'));
      });
      eng.textContent = r >= 2.4 ? 'Cycles' : 'Workbench';
      spp.textContent = r >= 3.7 ? '96' : '128';
      let samples = 0;
      SAMPLES.forEach(([at, n]) => { if (r >= at) samples = n; });
      const frame = r < TT0 ? 1 : Math.min(NFR, 1 + Math.floor(((r - TT0) / (TT1 - TT0)) * NFR));
      ovl.textContent = `(${frame}) Collection | ${r >= 1.5 ? 'PF_Letters' : 'PF_Tile'}`;
      smp.textContent = rendered && r < TT0 ? `Sample ${samples}/128` : '';
      if (r >= TT0) {
        tt.style.opacity = '1';
        if (frame !== lastTT) {
          drawFrame(tt, frame);
          lastTT = frame;
        }
        st.textContent = r < TT1 ? `Rendering frame ${frame}/60 · Sample 96/96` : 'Rendered 60/60 · //tt_####.jpg';
      } else {
        tt.style.opacity = '0';
        st.textContent = rendered ? `Path tracing sample ${samples}/128` : r >= 0.4 ? 'Python: running pf_icon.c7e41a92.py' : '';
      }
    },
  };
}
