// Blender beat: Blender 5.2 builds the course from DeepSeek's course.gpx and renders the flyover. A Blender window
// (Layout workspace): the 3D viewport in Solid shading while the outliner fills with the objects the build script
// made, then Rendered shading, then the camera view playing the 96 EEVEE frames as the timeline renders them.
// Every picture is a real Blender 5.2 output (media/solid.jpg Workbench, media/hero.jpg EEVEE, media/fly/ the frames,
// rendered headless from a USGS 3DEP DEM at 6x vertical); the vertex and face counts are that mesh's.
import { seg, outCubic } from '../../../lib.js';
import { sayLine, rise, land, setText, statusRender, cardHead, media, withFocus } from './kit.9f1df009.js?v=9f1df009';

const SAY = 'Turning course.gpx into real terrain and a route, then rendering the flyover.';
const NF = 96, FPS = 60;
const frame = (i) => media(`fly/f_${String(i).padStart(3, '0')}.jpg`);
// the outliner: [icon, name, depth]; the build script's objects, in the order it creates them
const OUT = [
  ['col', 'Scene Collection', 0], ['mesh', 'Terrain_DEM', 1], ['mesh', 'Ocean', 1], ['curve', 'Course_13.1mi', 1],
  ['curve', 'Course_Trail', 1], ['mesh', 'Runner', 1], ['col', 'Mile_Posts  13', 1], ['col', 'Labels  4', 1],
  ['cam', 'Camera_Flyover', 1], ['sun', 'Sun', 1],
];
const MENUS = ['File', 'Edit', 'Render', 'Window', 'Help'];
const TABS = ['Layout', 'Modeling', 'Shading', 'Animation', 'Rendering', 'Scripting'];
const STATS = 'Terrain_DEM  |  Verts 366,261  |  Faces 365,024';
const OUTS = [['flyover', `${NF} frames · 1280×720 · EEVEE`], ['terrain', 'USGS 3DEP DEM · 6× vertical']];

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + 0.14;
    T.rows = OUT.map((_, i) => T.card + 0.3 + i * 0.07);
    T.shade = T.rows[OUT.length - 1] + 0.25;    // Solid -> Rendered
    T.cam = T.shade + 0.45;                      // into the camera view; the render starts
    T.done = T.cam + NF / FPS;                   // the last frame lands
    T.outs = OUTS.map((_, i) => T.done + 0.1 + i * 0.12);
    return withFocus(T, opts, T.card + 0.36, T.outs[OUTS.length - 1] + 0.8); // the camera pushes in on the output, then glides to the next pill
  },
  build(k, x) {
    const T = k.T;
    for (let i = 0; i < NF; i++) new Image().src = frame(i); // warm the cache so the playback never waits
    const say = sayLine(x, SAY, T.r + 0.05);
    const card = x.el(`<div class="rk-card bl-card">
      ${cardHead(x, 'blender-logo.svg', 'Building the course in 3D', 'frame <b class="rk-n">0</b> / ' + NF)}
      <div class="bl-win">
        <div class="bl-top"><img class="bl-mk" src="${x.brand('blender-logo.svg')}" alt="">${MENUS.map((m) => `<span>${m}</span>`).join('')}
          <span class="bl-tabs">${TABS.map((t, i) => `<i class="${i ? '' : 'on'}">${t}</i>`).join('')}</span></div>
        <div class="bl-main">
          <div class="bl-vp">
            <div class="bl-vh"><span class="bl-mode">Object Mode</span><span>View</span><span>Select</span><span>Add</span><span>Object</span>
              <span class="bl-shd"><i></i><i class="s"></i><i></i><i class="r"></i></span></div>
            <div class="bl-view"><img class="bl-solid" src="${media('solid.jpg')}" alt=""><img class="bl-hero" src="${media('hero.jpg')}" alt="">
              <img class="bl-fly" src="${frame(0)}" alt=""><i class="bl-pp"></i>
              <span class="bl-vt"><b class="bl-persp">User Perspective</b><br>(1) Scene Collection | Course_13.1mi</span>
              <span class="bl-giz"><i class="x">X</i><i class="y">Y</i><i class="z">Z</i></span></div>
          </div>
          <div class="bl-side"><div class="bl-ol">${OUT.map(([ic, n, d]) => `<div class="bl-row" style="--d:${d}"><i class="bl-ic ${ic}"></i>${x.esc(n)}</div>`).join('')}</div>
            <div class="bl-props"><div><s>Engine</s>EEVEE</div><div><s>Res</s>1280×720</div><div><s>Frames</s>1–${NF}</div></div></div>
        </div>
        <div class="bl-tl"><i class="bl-bar"></i><i class="bl-ph"></i><span class="bl-fr">1</span></div>
        <div class="bl-st"><span>${STATS}</span><span class="bl-info"></span></div>
      </div>
      <div class="bl-outs">${OUTS.map(([a, b]) => `<span class="ds-file"><i class="ds-fi bl-fi"></i><b>${a}</b><s>${b}</s></span>`).join('')}</div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const st = $('.rk-st'), n = $('.rk-n'), rows = $$('.bl-row'), shd = $$('.bl-shd i');
    const hero = $('.bl-hero'), fly = $('.bl-fly'), pp = $('.bl-pp'), persp = $('.bl-persp'), vt = $('.bl-vt');
    const bar = $('.bl-bar'), ph = $('.bl-ph'), fr = $('.bl-fr'), info = $('.bl-info'), outs = $$('.bl-outs .ds-file');
    let src = '';
    return {
      nodes: [say.n, card],
      focus: T.focus ? card : null, // the camera's target while T.focus runs (chat.js FOCUS; zoom cut only)
      marks: [[T.r, say.n], [T.card, card], [T.outs[0], $('.bl-outs')]],
      render(t) {
        say.render(t);
        rise(card, seg(t, T.card, T.card + 0.36));
        statusRender(st, t, T.card, T.done);
        rows.forEach((r, i) => land(r, seg(t, T.rows[i], T.rows[i] + 0.16), 3));
        const rd = t >= T.shade;
        shd[1].classList.toggle('on', !rd); shd[3].classList.toggle('on', rd);
        hero.style.opacity = outCubic(seg(t, T.shade, T.shade + 0.3)).toFixed(3);
        const cv = outCubic(seg(t, T.cam, T.cam + 0.12));
        fly.style.opacity = cv.toFixed(3); pp.style.opacity = cv.toFixed(3);
        setText(persp, t >= T.cam ? 'Camera Perspective' : 'User Perspective');
        const f = Math.max(0, Math.min(NF - 1, Math.floor((t - T.cam) * FPS)));
        const s = frame(f); if (s !== src) { fly.src = s; src = s; }
        const shown = t < T.cam ? 0 : f + 1;
        setText(n, String(shown));
        setText(fr, String(Math.max(1, shown)));
        setText(vt.lastChild, `(${Math.max(1, shown)}) Scene Collection | ${t >= T.cam ? 'Camera_Flyover' : 'Course_13.1mi'}`);
        const p = shown / NF;
        bar.style.transform = `scaleX(${p.toFixed(4)})`;
        ph.style.left = `${(p * 100).toFixed(2)}%`;
        setText(info, t >= T.done ? `Saved flyover_${String(NF).padStart(4, '0')}.jpg` : t >= T.cam ? `Rendering frame ${shown}/${NF}` : '');
        outs.forEach((o, i) => land(o, seg(t, T.outs[i], T.outs[i] + 0.22), 5));
      },
    };
  },
};
