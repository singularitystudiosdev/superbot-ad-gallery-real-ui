// Meshy 5 beat (step 3 of the Inkwave routing): superbot routes the "model the squid kid and the Splattershot"
// request to Meshy, which generates four 3D previews, opens the picked mesh in its viewport as grey clay, switches the
// viewport to Wireframe, sweeps in the Textured pass, and ends on the batch of finished GLBs with their real triangle
// counts. The line Meshy streams quotes the script beat: the cast and the pier the Opus beat wrote.
//
// IMAGERY / SOURCING. Not one pixel here is a screenshot or a hand-drawn illustration: every frame is a real 3D mesh
// render, produced offline with headless three.js (three.js 0.180 through Playwright + Chrome, harness in .tmp/msy/:
// render.html + shoot.mjs, clay / wireframe / textured passes, 36 frames per revolution, 896x558 in, 448x279 webp
// out) and played back here as a pure function of t. The models are free downloads from Poly Pizza, whose model pages
// carry each licence and author; the full list is in img/ink/meshy/CREDITS.txt:
//   squid_kid.glb (cand-1, the mesh the viewport opens, strip-squid_kid): "Stylized Character" by Zsky, CC-BY 3.0
//     (39,508 tris) with "Backpack" by Quaternius, CC0 (3,960 tris) worn on the back as the lime ink tank; the
//     character's own hair materials are recoloured lime ink and the shirt magenta ink in the textured pass.
//   squid_form.glb (cand-2): "Squid" by Poly by Google, CC-BY 3.0 (1,278 tris), the inkling's squid form: mantle,
//     fins and trailing tentacles recoloured lime ink, eye left magenta.
//   splattershot.glb (cand-3, strip-splattershot): "Water gun" by Fukuoka no Daichi, CC-BY 3.0 (2,018 tris),
//     recoloured as the ink shooter: lime body, magenta muzzle, ink navy tank.
//   pier_props.glb (cand-4, strip-pier_props): Crate (Quaternius, CC0, 784 tris), Traffic Cone (Adam Marc Williams,
//     CC-BY 3.0, 148 tris), Wooden Sign (iPoly3D, CC0, 298 tris) and Palm Tree (Quaternius, CC0, 3,134 tris) as the
//     pier stall corner; props keep their authors' materials, only the cast is recoloured to ink.
// The triangle counts on the badges are those assets' real counts, read from their own GLB index buffers. The textured
// pass is the models' own materials under Meshy's viewport recipe (one soft key from the upper front right, a cool rim
// behind, a low fill, a neutral dark studio floor that fog fades into the background); no texture atlas is projected
// anywhere. The Meshy
// mark in brand/meshy-logo.svg is the official Meshy logo mark, used nominatively to name the app superbot routed the
// request to; Meshy is a trademark of Meshy. No Meshy API key was used: no account and no credits were spent.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame. Every moving value below is written from t in render.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press, pressScale } from '../../../lib.js';

const SAY = 'Built the squid kid, the Splattershot and the pier props from the script.';
// the four previews superbot generated, in the order their renders are shown (cand-1..4), each labelled with what it
// actually shows and its real triangle count
const SUBJECTS = [
  { name: 'squid_kid', file: 'squid_kid.glb', tris: '43,468' },
  { name: 'squid_form', file: 'squid_form.glb', tris: '1,278' },
  { name: 'splattershot', file: 'splattershot.glb', tris: '2,018' },
  { name: 'pier_props', file: 'pier_props.glb', tris: '4,364' },
];
// the strip at the end: the three finished GLBs the build ships, in strip-image order
const SHIPPED = [SUBJECTS[0], SUBJECTS[2], SUBJECTS[3]];
const SHOT = ['strip-squid_kid', 'strip-splattershot', 'strip-pier_props'];
const CAND = ['cand-1', 'cand-2', 'cand-3', 'cand-4'];
// the baked turntable passes: one folder, one frame per pass per angle (img/ink/meshy/<subject>-<pass>-NN.webp)
const MESHY = 'ink/meshy/';
const PICKED = SUBJECTS[0].name;         // the mesh the viewport opens
const N = 36;             // turntable frames baked per revolution (see the header comment)
const TURN = 1.7;         // seconds per revolution
const TEX_SWEEP = 0.78;   // how long the texturing band takes to cross the viewport

// The turntable: the mesh turns while it is clay and while the wireframe shell is on, then the spin lets go and eases
// into a three-quarter front angle (32 degrees) which it holds through the texturing sweep and the GLB strip, so the
// frames the spot lingers on are the ones that describe the model rather than a side profile. Pure function of t, so
// ?t= freezes an exact angle, and the baked frame index is the same angle in all three passes.
const SPIN = 360 / TURN;    // degrees per second while it turns
const HOLD = 32;            // the held three-quarter front angle
const SETTLE = 0.42;        // how long the spin takes to ease onto HOLD
function yawAt(t, vp, tex) {
  if (t < vp) return 0;
  const stop = tex - SETTLE;
  const from = (Math.min(t, stop) - vp) * SPIN % 360;
  if (t <= stop) return from;
  const need = (((HOLD - from) % 360) + 360) % 360;   // the rest of the turn needed to land exactly on the held angle
  return (from + need * outCubic(seg(t, stop, stop + SETTLE))) % 360;
}
const frameIdx = (yaw) => String(Math.round(yaw / (360 / N)) % N).padStart(2, '0');
const passPath = (pass, idx) => MESHY + PICKED + '-' + pass + '-' + idx + '.webp';

export default {
  times(r) {
    const T = { r };
    T.say = r;                                            // Meshy's line streams
    T.grid = r + 0.26;                                    // the four previews land
    T.candAt = [r + 0.30, r + 0.42, r + 0.54, r + 0.66];  // each preview starts rendering
    T.candDone = [r + 0.82, r + 0.96, r + 1.10, r + 1.24];// ...and is done here
    T.pick = r + 1.30;                                    // the cursor clicks the squid kid preview
    T.vp = r + 1.42;                                      // the picked mesh opens in the viewport, grey clay
    T.wire = r + 1.98;                                    // the cursor switches the viewport to Wireframe
    T.tex = r + 2.46;                                     // Texturing: the textured pass sweeps in
    T.texEnd = T.tex + TEX_SWEEP;
    T.strip = r + 3.34;                                   // the finished GLBs land
    T.end = r + 4.2;                                      // a ~4.2s beat, the shortest of the seven
    return T;
  },
  build(k, x) {
    const T = k.T;
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow msy-genrow"><span class="ch-tool msy-gen">${x.tile('meshy')}<span class="ch-tool-t">Generating 4 previews</span></span></div>`);
    const gridEl = x.el(`<div class="msy-grid">${SUBJECTS.map((s, i) => `<div class="msy-cand" data-i="${i}">
      <img class="msy-cimg" src="${x.img(MESHY + CAND[i] + '.webp')}" alt="${x.esc(s.name)} preview render" draggable="false"/>
      <i class="msy-cbar"><i></i></i>
      <span class="msy-cpct">0%</span>
      <span class="msy-cname">${x.esc(s.name)}</span>
      <span class="msy-ctick">${x.OK}</span>
    </div>`).join('')}</div>`);
    const cands = [...gridEl.children].map((node) => ({
      node, img: node.querySelector('.msy-cimg'), bar: node.querySelector('.msy-cbar > i'),
      pct: node.querySelector('.msy-cpct'), tick: node.querySelector('.msy-ctick'),
    }));

    // the viewport: the picked mesh on Meshy's dark studio floor, the three baked passes stacked, plus Meshy's chrome
    const vp = x.el(`<div class="msy-vp">
      <div class="msy-hd">
        <span class="msy-mk"><img src="${x.brand('meshy-logo.svg')}" alt=""/></span>
        <span class="msy-file">${x.esc(SUBJECTS[0].file)}</span>
        <span class="msy-htri">${SUBJECTS[0].tris} tris</span>
        <span class="msy-state">Untextured</span>
      </div>
      <div class="msy-frame">
        <img class="msy-ly msy-lclay" src="${x.img(passPath('clay', '00'))}" alt="" draggable="false"/>
        <img class="msy-ly msy-lwire" src="${x.img(passPath('wire', '00'))}" alt="" draggable="false"/>
        <img class="msy-ly msy-ltex" src="${x.img(passPath('tex', '00'))}" alt="" draggable="false"/>
        <i class="msy-sweep"></i>
      </div>
      <div class="msy-tools">
        <span class="msy-pill" data-m="clay">Clay</span>
        <span class="msy-pill" data-m="wire">Wireframe</span>
        <span class="msy-pill" data-m="tex">Textured</span>
        <span class="msy-spin"></span>
      </div>
    </div>`);
    const clay = vp.querySelector('.msy-lclay'), wire = vp.querySelector('.msy-lwire'), tex = vp.querySelector('.msy-ltex');
    const sweep = vp.querySelector('.msy-sweep'), state = vp.querySelector('.msy-state');
    const pills = { clay: vp.querySelector('[data-m="clay"]'), wire: vp.querySelector('[data-m="wire"]'), tex: vp.querySelector('[data-m="tex"]') };
    const spin = vp.querySelector('.msy-spin');

    const strip = x.el(`<div class="msy-strip">${SHIPPED.map((s, i) => `<div class="msy-tile">
      <div class="msy-thumb"><img src="${x.img(MESHY + SHOT[i] + '.webp')}" alt="${x.esc(s.name)} model render" draggable="false"/>
        <span class="msy-glb">GLB</span></div>
      <span class="msy-tname">${x.esc(s.file)}</span>
      <span class="msy-tris">${x.esc(s.tris)} tris</span>
    </div>`).join('')}</div>`);
    const tiles = [...strip.children];

    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    let shown = -1, lastState = '', lastIdx = '', gridH = 0;

    // warm every turntable frame the beat can ask for, so the first take never shows a half-loaded mesh (this is a
    // prefetch, not an animation: nothing here advances on its own, it just fills the image cache)
    const warm = [];
    for (const pass of ['clay', 'wire', 'tex']) {
      for (let i = 0; i < N; i++) {
        const im = new Image();
        im.src = x.img(passPath(pass, String(i).padStart(2, '0')));
        warm.push(im);
      }
    }

    return {
      nodes: [sayEl, chip, gridEl, vp, strip],
      // the strip's own bottom is the anchor: the card (viewport header row through the strip's tris line) is trimmed
      // to fit the tight v4 frame (tabs.js geo, DW = W/2) with margin, so gliding to the strip's bottom keeps the
      // viewport's header row inside the frame and still leaves the file names and tri counts above the composer.
      marks: [[T.r, sayEl], [T.grid, gridEl], [T.vp, vp], [T.strip, strip]],
      preload: warm,
      render(t) {
        // the line streams like every other beat's
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the "Generating 4 previews" chip: lands with the ask, gone the moment the mesh is picked
        const ci = outCubic(seg(t, T.r + 0.05, T.r + 0.3));
        chip.style.opacity = (ci * (1 - seg(t, T.pick - 0.08, T.pick + 0.2))).toFixed(3);
        chip.style.transform = `translateY(${((1 - ci) * 6).toFixed(2)}px)`;

        // the four previews: each resolves out of a blur into its clay render while its own percent climbs
        const gi = outCubic(seg(t, T.grid, T.grid + 0.36));
        const gone = seg(t, T.pick + 0.03, T.vp + 0.3);
        // the grid fades AND collapses: its height goes with the fade, so the viewport card rises to sit right under
        // the reply header and the stream line instead of leaving the top half of the frame black
        if (!gridH && t >= T.r) gridH = gridEl.offsetHeight;
        if (gridH) {
          gridEl.style.height = `${Math.max(0, gridH * (1 - gone)).toFixed(1)}px`;
          gridEl.style.overflow = 'hidden';
          gridEl.style.marginTop = gone > 0.995 ? '0px' : '2px';
        }
        gridEl.style.opacity = (gi * (1 - gone)).toFixed(3);
        gridEl.style.transform = gi >= 1 ? 'none' : `translateY(${((1 - gi) * 12).toFixed(2)}px) scale(${lerp(0.975, 1, gi).toFixed(4)})`;
        cands.forEach((c, i) => {
          const e = outCubic(seg(t, T.candAt[i], T.candDone[i]));
          c.img.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 9).toFixed(2)}px)`;
          c.img.style.opacity = lerp(0.18, 1, e).toFixed(3);
          c.img.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.04, 1, e).toFixed(4)})`;
          c.pct.textContent = `${Math.round(e * 100)}%`;
          c.bar.style.transform = `scaleX(${e.toFixed(3)})`;
          const picked = i === 0 && t >= T.pick;
          c.node.classList.toggle('is-pick', picked);
          c.tick.style.opacity = (i === 0 ? outCubic(seg(t, T.pick, T.pick + 0.24)) : 0).toFixed(3);
        });

        // the viewport opens on the picked mesh
        const vi = outCubic(seg(t, T.vp, T.vp + 0.4));
        vp.style.opacity = vi.toFixed(3);
        vp.style.transform = vi >= 1 ? 'none' : `translateY(${((1 - vi) * 14).toFixed(2)}px) scale(${lerp(0.972, 1, vi).toFixed(4)})`;

        // the turntable: the baked frame is chosen from t, so all three passes turn at the same angle
        const open = t >= T.vp;
        const idx = open ? frameIdx(yawAt(t, T.vp, T.tex)) : '00';
        if (idx !== lastIdx) {
          clay.src = x.img(passPath('clay', idx));
          wire.src = x.img(passPath('wire', idx));
          tex.src = x.img(passPath('tex', idx));
          lastIdx = idx;
        }
        clay.style.opacity = open ? '1' : '0';
        // wireframe: the shell lands the moment the pill is pressed, and fades as texturing takes over
        const wi = outCubic(seg(t, T.wire, T.wire + 0.26)) * (1 - seg(t, T.tex + 0.05, T.tex + 0.5));
        wire.style.opacity = wi.toFixed(3);
        // texturing: the textured PBR pass sweeps in left to right behind the band
        const tx = seg(t, T.tex + 0.1, T.tex + TEX_SWEEP);
        tex.style.opacity = outQuint(tx).toFixed(3);
        // a feathered wipe rides the band: the textured pass is revealed left to right under it
        const edge = outQuint(tx) * 100;
        const mask = tx >= 1 ? 'none' : `linear-gradient(90deg, #000 ${(edge - 7).toFixed(1)}%, rgba(0, 0, 0, 0) ${(edge + 5).toFixed(1)}%)`;
        tex.style.maskImage = mask; tex.style.webkitMaskImage = mask;
        const sw = seg(t, T.tex, T.tex + TEX_SWEEP + 0.13);
        sweep.style.opacity = (sw > 0 && sw < 1 ? 1 : 0).toFixed(3);
        // the band is .msy-sweep's 18% width in meshy.css, so -110%..460% of its own width walks it right off the frame
        sweep.style.transform = `translateX(${lerp(-110, 460, sw).toFixed(1)}%)`;

        // the state pill and the three mode pills follow the same clock
        const label = t < T.tex ? 'Untextured' : t < T.texEnd ? `Texturing ${Math.round(tx * 100)}%` : 'Textured';
        if (label !== lastState) { state.textContent = label; lastState = label; }
        state.classList.toggle('is-tex', t >= T.texEnd);
        // the pill only lights once its pass has actually been applied: pressing Textured spins, then Textured comes on
        const hot = t >= T.texEnd ? 'tex' : t >= T.wire ? 'wire' : 'clay';
        for (const m of ['clay', 'wire', 'tex']) pills[m].classList.toggle('is-on', hot === m);
        // a real press: the clicked pill dips under the cursor
        pills.wire.style.transform = `scale(${pressScale(t, T.wire, 0.08).toFixed(4)})`;
        pills.tex.style.transform = `scale(${pressScale(t, T.tex - 0.1, 0.08).toFixed(4)})`;
        spin.style.opacity = (t < T.texEnd ? 1 : 0).toFixed(3);
        spin.style.transform = `rotate(${((t - T.vp) * 420).toFixed(0)}deg)`;

        // the finished GLBs
        const si = outCubic(seg(t, T.strip, T.strip + 0.36));
        strip.style.opacity = si.toFixed(3);
        strip.style.transform = si >= 1 ? 'none' : `translateY(${((1 - si) * 14).toFixed(2)}px)`;
        tiles.forEach((node, i) => {
          const a = T.strip + i * 0.1;
          const p = outCubic(seg(t, a, a + 0.38));
          node.style.opacity = p.toFixed(3);
          node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 12).toFixed(2)}px)`;
          node.querySelector('.msy-glb').style.transform = `scale(${pressScale(t, T.strip + 0.44, 0.12).toFixed(4)})`;
        });
      },
      // the pointer: pick the squid kid preview, switch the viewport to Wireframe, then take the first GLB
      pointer(t) {
        const moves = [
          [T.pick - 0.54, T.pick + 0.18, () => x.box(cands[0].node), T.pick],
          [T.wire - 0.5, T.wire + 0.2, () => x.box(pills.wire), T.wire],
          [T.strip + 0.16, T.strip + 0.72, () => x.box(tiles[0].querySelector('.msy-glb')), T.strip + 0.44],
        ];
        for (const [a, b, at, click] of moves) {
          if (t < a || t > b) continue;
          const p = at();
          return { x: p.cx, y: p.cy, p: press(t, click), v: inOutCubic(seg(t, a, a + 0.22)) * (1 - seg(t, b - 0.2, b)) };
        }
        return null;
      },
    };
  },
};