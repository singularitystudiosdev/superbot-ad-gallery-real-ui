// Meshy 5 beat, the third request of ?v=4 (replaces v3's Gemini art beat). Superbot routes the Dark Souls build to
// Meshy, which generates four 3D previews, opens the picked mesh in a viewport as grey clay, switches to the wireframe
// shell, sweeps in the textured PBR pass, and ends on the batch of finished GLBs with their real triangle counts.
//
// IMAGERY / SOURCING. Not one pixel here is a screenshot or a hand-drawn illustration: every frame is a real 3D mesh
// render, produced offline with headless three.js (harness in .tmp/meshy-80e24d9f/render/meshy.html + shoot3.mjs:
// clay / wireframe / textured passes, 448x320 webp, 36 frames per revolution) and played back here as a pure function
// of t. The models are Meshy's own output: real community models from the public showcase feed of meshy.ai, all
// CC0 1.0, fetched through the site's own unsigned read endpoint and baked to position + quad index buffers:
//   knight.glb (cand-1, knight-clay/wire/tex-NN, strip-knight): mesh used for the viewport. meshy.ai/discover/
//     0197be3d-c90b-7376-9dbc-ca375124002b, "A stylized 3D model of an elite armored knight" by ktmarine1999,
//     CC0 1.0, 216,794 triangles.
//   asylum_knight.glb (cand-2): meshy.ai/discover/01980aa5-fa5a-7245-9e82-f5e24168d7bc, "Undead Knight" by
//     DTGillespie, CC0 1.0, 188,240 triangles.
//   gatewarden.glb (cand-3, strip-boss): meshy.ai/discover/01989c2f-647f-79bd-9d9f-d64ad089c23d, "legendary demon
//     boss, evil looking demon" by PICKTURA, CC0 1.0, 200,135 triangles.
//   bonfire_sword.glb (cand-4, strip-sword): meshy.ai/discover/0195dbf9-4533-7f08-a05b-4fe22e240bff, "A mythical
//     legendary greatsword" by Kai-i3, CC0 1.0, 211,650 triangles.
// CC0 carries no attribution duty, but the authors are named here so the source is on the record. The triangle counts
// on the badges are those assets' real published counts, not decoration. The textured pass is an authored PBR
// material per subject (knight: dark weathered steel, metalness .85 / roughness .48; demon boss: charred bronze over
// leather, .55 / .62, with the model's own normal / roughness / metallic maps box-projected as surface detail; the
// greatsword: polished blade .95 / .22 over a dark hilt and guard .15 / .72, a real two-material split by height),
// lit by meshy's own viewport recipe: one soft key from the upper front right, a cool rim behind, a low fill, neutral
// dark background and a faint grid floor. No texture atlas is projected anywhere: at this size a scrambled atlas is
// noise, and a material that answers the light is what reads as Meshy output rather than a clipped picture.
// The Meshy mark in brand/meshy-logo.svg is the official Meshy logo mark, cropped from the lockup in the header of
// meshy.ai and set on a light plate so it reads at the 22px app tile. It is used nominatively, to name the app superbot
// routed the request to; Meshy is a trademark of Meshy. No Meshy API key was used: no account and no credits were spent.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame. Every moving value below is written from t in render.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount, press, pressScale } from '../../../lib.js';

const SAY = 'Generated 4 meshes, 188k to 216k triangles each.';
// the four previews superbot generated, in the order their renders are shown (cand-1..4), each labelled with what it
// actually shows: cand-1 the plated knight, cand-2 the undead knight, cand-3 the demon boss, cand-4 the greatsword
const SUBJECTS = [
  { name: 'knight', file: 'knight.glb', tris: '216,794' },
  { name: 'asylum_knight', file: 'asylum_knight.glb', tris: '188,240' },
  { name: 'gatewarden', file: 'gatewarden.glb', tris: '200,135' },
  { name: 'bonfire_sword', file: 'bonfire_sword.glb', tris: '211,650' },
];
// the strip at the end: the three finished GLBs the build ships, in strip-image order (knight, boss, sword)
const SHIPPED = [SUBJECTS[0], SUBJECTS[2], SUBJECTS[3]];
const SHOT = ['knight', 'boss', 'sword'];
const N = 36;             // turntable frames baked per revolution (see the header comment)
const TURN = 1.9;         // seconds per revolution
const TEX_SWEEP = 0.95;   // how long the texturing band takes to cross the viewport

// The turntable: the mesh turns while it is clay and while the wireframe shell is on, then the spin lets go and eases
// into a three-quarter front angle (32 degrees) which it holds through the texturing sweep and the GLB strip, so the
// frames the spot lingers on are the ones that describe the model rather than a side profile. Pure function of t, so
// ?t= freezes an exact angle, and the baked frame index is the same angle in all three passes.
const SPIN = 360 / TURN;    // degrees per second while it turns
const HOLD = 32;            // the held three-quarter front angle
const SETTLE = 0.5;         // how long the spin takes to ease onto HOLD
function yawAt(t, vp, tex) {
  if (t < vp) return 0;
  const stop = tex - SETTLE;
  const from = (Math.min(t, stop) - vp) * SPIN % 360;
  if (t <= stop) return from;
  const need = (((HOLD - from) % 360) + 360) % 360;   // the rest of the turn needed to land exactly on the held angle
  return (from + need * outCubic(seg(t, stop, stop + SETTLE))) % 360;
}
const frameIdx = (yaw) => String(Math.round(yaw / (360 / N)) % N).padStart(2, '0');

export default {
  times(r) {
    const T = { r };
    T.say = r;                                            // Meshy's line streams
    T.grid = r + 0.3;                                     // the four previews land
    T.candAt = [r + 0.34, r + 0.52, r + 0.7, r + 0.88];   // each preview starts rendering
    T.candDone = [r + 1.3, r + 1.55, r + 1.8, r + 2.05];  // ...and is done here
    T.pick = r + 2.12;                                    // the cursor clicks the knight preview
    T.vp = r + 2.26;                                      // the picked mesh opens in the viewport, grey clay
    T.wire = r + 3.02;                                    // the cursor switches the viewport to Wireframe
    T.tex = r + 3.72;                                     // Texturing: the textured pass sweeps in
    T.texEnd = T.tex + TEX_SWEEP;
    T.strip = r + 4.86;                                   // the finished GLBs land
    T.end = r + 6.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow msy-genrow"><span class="ch-tool msy-gen">${x.tile('meshy')}<span class="ch-tool-t">Generating 4 previews</span></span></div>`);
    const gridEl = x.el(`<div class="msy-grid">${SUBJECTS.map((s, i) => `<div class="msy-cand" data-i="${i}">
      <img class="msy-cimg" src="${x.img('v4/meshy/cand-' + (i + 1) + '.webp')}" alt="${x.esc(s.name)} preview render" draggable="false"/>
      <i class="msy-cbar"><i></i></i>
      <span class="msy-cpct">0%</span>
      <span class="msy-cname">${x.esc(s.name)}</span>
      <span class="msy-ctick">${x.OK}</span>
    </div>`).join('')}</div>`);
    const cands = [...gridEl.children].map((node) => ({
      node, img: node.querySelector('.msy-cimg'), bar: node.querySelector('.msy-cbar > i'),
      pct: node.querySelector('.msy-cpct'), tick: node.querySelector('.msy-ctick'),
    }));

    // the viewport: a real mesh on a dark studio floor, the three baked passes stacked, plus Meshy's own chrome
    const vp = x.el(`<div class="msy-vp">
      <div class="msy-hd">
        <span class="msy-mk"><img src="${x.brand('meshy-logo.svg')}" alt=""/></span>
        <span class="msy-file">knight.glb</span>
        <span class="msy-htri">${SUBJECTS[0].tris} tris</span>
        <span class="msy-state">Untextured</span>
      </div>
      <div class="msy-frame">
        <img class="msy-ly msy-lclay" src="${x.img('v4/meshy/knight-clay-00.webp')}" alt="" draggable="false"/>
        <img class="msy-ly msy-lwire" src="${x.img('v4/meshy/knight-wire-00.webp')}" alt="" draggable="false"/>
        <img class="msy-ly msy-ltex" src="${x.img('v4/meshy/knight-tex-00.webp')}" alt="" draggable="false"/>
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
      <div class="msy-thumb"><img src="${x.img('v4/meshy/strip-' + SHOT[i] + '.webp')}" alt="${x.esc(s.name)} model render" draggable="false"/>
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
        im.src = x.img(`v4/meshy/knight-${pass}-${String(i).padStart(2, '0')}.webp`);
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
        const ci = outCubic(seg(t, T.r + 0.05, T.r + 0.35));
        chip.style.opacity = (ci * (1 - seg(t, T.pick - 0.1, T.pick + 0.25))).toFixed(3);
        chip.style.transform = `translateY(${((1 - ci) * 6).toFixed(2)}px)`;

        // the four previews: each resolves out of a blur into its clay render while its own percent climbs
        const gi = outCubic(seg(t, T.grid, T.grid + 0.42));
        const gone = seg(t, T.pick + 0.04, T.vp + 0.34);
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
          c.tick.style.opacity = (i === 0 ? outCubic(seg(t, T.pick, T.pick + 0.26)) : 0).toFixed(3);
        });

        // the viewport opens on the picked mesh
        const vi = outCubic(seg(t, T.vp, T.vp + 0.46));
        vp.style.opacity = vi.toFixed(3);
        vp.style.transform = vi >= 1 ? 'none' : `translateY(${((1 - vi) * 14).toFixed(2)}px) scale(${lerp(0.972, 1, vi).toFixed(4)})`;

        // the turntable: the baked frame is chosen from t, so all three passes turn at the same angle
        const open = t >= T.vp;
        const idx = open ? frameIdx(yawAt(t, T.vp, T.tex)) : '00';
        if (idx !== lastIdx) {
          clay.src = x.img(`v4/meshy/knight-clay-${idx}.webp`);
          wire.src = x.img(`v4/meshy/knight-wire-${idx}.webp`);
          tex.src = x.img(`v4/meshy/knight-tex-${idx}.webp`);
          lastIdx = idx;
        }
        clay.style.opacity = open ? '1' : '0';
        // wireframe: the shell lands the moment the pill is pressed, and fades as texturing takes over
        const wi = outCubic(seg(t, T.wire, T.wire + 0.3)) * (1 - seg(t, T.tex + 0.06, T.tex + 0.6));
        wire.style.opacity = wi.toFixed(3);
        // texturing: the textured PBR pass sweeps in left to right behind the band
        const tx = seg(t, T.tex + 0.12, T.tex + TEX_SWEEP);
        tex.style.opacity = outQuint(tx).toFixed(3);
        // a feathered wipe rides the band: the textured pass is revealed left to right under it
        const edge = outQuint(tx) * 100;
        const mask = tx >= 1 ? 'none' : `linear-gradient(90deg, #000 ${(edge - 7).toFixed(1)}%, rgba(0, 0, 0, 0) ${(edge + 5).toFixed(1)}%)`;
        tex.style.maskImage = mask; tex.style.webkitMaskImage = mask;
        const sw = seg(t, T.tex, T.tex + TEX_SWEEP + 0.15);
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
        pills.tex.style.transform = `scale(${pressScale(t, T.tex - 0.12, 0.08).toFixed(4)})`;
        spin.style.opacity = (t < T.texEnd ? 1 : 0).toFixed(3);
        spin.style.transform = `rotate(${((t - T.vp) * 420).toFixed(0)}deg)`;

        // the finished GLBs
        const si = outCubic(seg(t, T.strip, T.strip + 0.4));
        strip.style.opacity = si.toFixed(3);
        strip.style.transform = si >= 1 ? 'none' : `translateY(${((1 - si) * 14).toFixed(2)}px)`;
        tiles.forEach((node, i) => {
          const a = T.strip + i * 0.12;
          const p = outCubic(seg(t, a, a + 0.42));
          node.style.opacity = p.toFixed(3);
          node.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 12).toFixed(2)}px)`;
          node.querySelector('.msy-glb').style.transform = `scale(${pressScale(t, T.strip + 0.52, 0.12).toFixed(4)})`;
        });
      },
      // the pointer: pick the knight preview, switch the viewport to Wireframe, then take the first GLB
      pointer(t) {
        const moves = [
          [T.pick - 0.62, T.pick + 0.2, () => x.box(cands[0].node), T.pick],
          [T.wire - 0.58, T.wire + 0.22, () => x.box(pills.wire), T.wire],
          [T.strip + 0.2, T.strip + 0.82, () => x.box(tiles[0].querySelector('.msy-glb')), T.strip + 0.52],
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