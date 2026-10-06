// Pane 4: Blender 5.2, driven over the Blender MCP. The window is 36 real screen captures of Blender
// (assets-src capture script): empty scene, the Rodin mesh in Solid with wireframe, then Material Preview
// while the viewport orbits. The tool log names blender-mcp's real tools.
import { html, $, $$, enter, show, clamp } from '../engine.js';
import { sbTile } from './chat.js';

const N = 36;
const TOOLS = [
  [0.05, 0.5, 'generate_3d', '(image="burger.png", provider="hyper3d")', 'Rodin Gen-2, 37,085 faces'],
  [0.6, 0.78, 'import_asset', '("Burger")', 'in scene'],
  [1.0, 1.3, 'execute_blender_code', '(shade_smooth, metallic=0, 3 area lights)', 'ok'],
  [1.7, 1.9, 'viewport_capture', '(shading="MATERIAL")', 'ok'],
  [2.5, 2.85, 'look', '()', 'bun glossy, edges crisp, cheese melted'],
  [3.25, 3.55, 'execute_blender_code', '(export_scene.gltf "burger.glb")', '3.1 MB'],
];

function frameAt(t) {
  if (t <= 0) return 0;
  if (t < 0.55) return (t / 0.55) * 2;
  if (t < 1.65) return 2 + ((t - 0.55) / 1.1) * 10;
  return clamp(12 + ((t - 1.65) / 2.55) * 23, 0, N - 1);
}

export function build() {
  const frames = Array.from({ length: N }, (_, i) => `<img src="img/blender/g_${String(i).padStart(2, '0')}.webp" alt="" draggable="false">`).join('');
  const tools = TOOLS.map(([, , name, args, res]) => `<li><span class="st"><i class="spin"></i><svg class="ok" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7"/></svg></span><code><b>${name}</b>${args}</code><em>${res}</em></li>`).join('');
  const el = html(`
  <div class="pane p-bl">
    <div class="bl-frames">${frames}</div>
    <div class="bl-mcp">
      <div class="bl-mcp-h">${sbTile('xs')}<b>superbot</b><span>driving Blender over MCP</span></div>
      <ul>${tools}</ul>
    </div>
  </div>`);
  return { el, frames: $$(el, '.bl-frames img'), card: $(el, '.bl-mcp'), tools: $$(el, '.bl-mcp li') };
}

export function render(c, t) {
  const f = frameAt(t);
  const i = Math.floor(f);
  const j = Math.min(N - 1, i + 1);
  const frac = f - i;
  c.frames.forEach((img, n) => {
    img.style.opacity = n === i ? 1 : n === j ? frac : 0;
    img.style.zIndex = n === j ? 2 : 1;
  });
  show(c.card, t >= 0);
  enter(c.card, t, 0, 0.3, 10);
  c.tools.forEach((li, n) => {
    const [at, done] = TOOLS[n];
    show(li, t >= at);
    enter(li, t, at, 0.2, 4);
    li.classList.toggle('done', t >= done);
    $(li, '.spin').style.transform = `rotate(${(t - at) * 600}deg)`;
  });
  c.tools[TOOLS.length - 1].classList.toggle('lit', t >= 3.7);
}

export const anchors = (c) => ({ in: c.tools[0], out: c.tools[TOOLS.length - 1] });
