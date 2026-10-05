// Blender (the local 3D service): what a 3D tool does — it builds a mesh and renders it. Three build steps land,
// then the blockout (the deck's own wireframe, rendered in Blender's Workbench viewport look) is shaded by the
// Cycles turntable: the same mesh, spun about its long axis, wearing the graphic Gemini just made.
// The two sprite sheets are real Blender renders (gen/spin/*.png -> img/spin-wire.png, img/spin-render.png).
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Building it. This is the real mesh.';
const STEPS = [
  ['Building the deck body', 'Deck body · 7-ply maple · 8.25 × 32'],
  ['Mapping the graphic onto it', 'Graphic map · 2752 × 1536 · deck1.png'],
  ['Spinning the turntable', 'Turntable · 96 frames · Cycles'],
];
const COLS = 8, ROWS = 4, N = COLS * ROWS; // both sheets: 8x4 tiles, the same 32 frames of one full turn
const FPS = 7, PHASE = 15; // 17 frames after the blockout lands, the turntable settles on the graphic (frame 0)

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.step = STEPS.map((_, i) => r + 0.42 + i * 0.34);
    T.card = r + 1.5;
    T.wire = T.card + 0.1;
    T.shade = T.card + 1.0;
    T.end = T.shade + 1.55;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Talking to Blender 5.2</span><b class="yt-count">local</b></div></div>');
    const rows = STEPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="bl-card">
      <div class="bl-stage">
        <span class="bl-vp">User Perspective<br><small>(1) Collection | deck</small></span>
        <i class="bl-sheet bl-wire"></i>
        <i class="bl-sheet bl-render"></i>
      </div>
      <div class="bl-side">
        <span class="qc-genl bl-live">${x.tile('blender')}<span class="bl-lab">Rendering 3D model</span></span>
        <div class="sbx-group bl-files">
          <div class="sbx-group-h">deck_lowtide.blend</div>
          <div class="sbx-file"><span class="sbx-file-ic bl-ic-mesh"></span><span class="sbx-file-t"><b>deck.obj</b><small>41,580 verts · 8,204 tris</small></span><span class="sbx-badge">mesh</span></div>
          <div class="sbx-file"><span class="sbx-file-ic bl-ic-map"></span><span class="sbx-file-t"><b>graphic_4K.png</b><small>mapped to UV · from Gemini</small></span><span class="sbx-badge">map</span></div>
        </div>
        <div class="bl-mods"><span>Bevel · 3 segments</span><span>Concave 6 mm</span><span>Kicktails 15°</span><span>UV · graphic</span></div>
        <div class="bl-prog"><div class="bl-prog-h"><span>Cycles · 64 samples · denoised</span><small class="bl-fr">frame 0 / 96</small></div><div class="bl-bar"><i></i></div></div>
        <div class="bl-stats"><span><b>96</b> frames</span><span><b>1.3m</b> wide</span><span><b>Cycles</b> Metal</span></div>
      </div>
    </div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t');
    const beats = rows.map((r) => r.firstElementChild);
    const wire = card.querySelector('.bl-wire'), render = card.querySelector('.bl-render');
    const blLab = card.querySelector('.bl-lab'), live = card.querySelector('.bl-live');
    const fr = card.querySelector('.bl-fr'), bar = card.querySelector('.bl-bar i');
    const sheetPos = (el, i, w, h) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      el.style.backgroundSize = `${COLS * w}px ${ROWS * h}px`;
      el.style.backgroundPosition = `${-col * w}px ${-row * h}px`;
    };
    const setImg = (el, url) => { if (el.dataset.url !== url) { el.style.backgroundImage = `url("${url}")`; el.dataset.url = url; } };
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, ...rows, card],
      marks: [[T.r, say], [T.chip, chip], ...rows.map((r, i) => [T.step[i], r]), [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const cd = t >= T.step[STEPS.length - 1] + 0.4;
        spin.classList.toggle('done', cd);
        spin.style.transform = cd ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cd ? 'Blender 5.2 · ready' : 'Talking to Blender 5.2';
        if (clab.textContent !== cl) clab.textContent = cl;
        beats.forEach((c, i) => {
          rise(rows[i], seg(t, T.step[i], T.step[i] + 0.3), 8);
          const done = t >= T.step[i] + 0.34;
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? STEPS[i][1] : STEPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        // the model: blockout first, then Cycles shades the same mesh and the spin is live
        const ci = outCubic(seg(t, T.card, T.card + 0.5));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const sh = outCubic(seg(t, T.shade, T.shade + 0.7));
        setImg(wire, x.img('spin-wire.webp'));
        setImg(render, x.img('spin-render.webp'));
        // the spin: the turntable runs at 7 frames a second, both layers on the same frame, and holds on the
        // graphic once the beat is over
        const i = (Math.floor(Math.max(0, Math.min(t, T.end) - T.wire) * FPS) + PHASE) % N;
        const w = wire.clientWidth || 0, h = wire.clientHeight || 0;
        if (w) { sheetPos(wire, i, w, h); sheetPos(render, i, w, h); }
        wire.style.opacity = (1 - 0.72 * sh).toFixed(3);
        render.style.opacity = sh.toFixed(3);
        wire.classList.toggle('bl-empty', t < T.wire);
        render.classList.toggle('bl-empty', t < T.wire);
        // the render queue: Cycles works through the 96 frames while the shaded spin plays
        const q = Math.round(96 * outCubic(seg(t, T.wire + 0.2, T.shade + 0.9)));
        const ft = `frame ${q} / 96`;
        if (fr.textContent !== ft) fr.textContent = ft;
        bar.style.width = `${(q / 96 * 100).toFixed(1)}%`;
        live.style.opacity = (1 - seg(t, T.shade + 0.6, T.shade + 1.0)).toFixed(3);
        const rl = t >= T.shade + 0.4 ? 'Rendered in Blender' : 'Rendering 3D model';
        if (blLab.textContent !== rl) blLab.textContent = rl;
      },
    };
  },
};