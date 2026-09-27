// Assets beat (Meshy): a 3D asset model (Meshy) forms the props of THE LAST INVENTION. Its line streams, the
// "Generating 6 prop meshes" chip spins, and the prop sheet rises on the film's true black: six tiles in film order,
// each one the prop's own frame from the documentary. A tile lands, its brass rule draws in (the film's lower third
// rule), its frame turns on a turntable out of a cold teal clay tint into the film's tungsten grade as the mesh
// resolves, its triangle count climbs, and its stamp flips from REMESHING to READY in the film's letterspaced caps.
// Every tile carries the .glb it became, its triangle count, and the scene it serves with the film timecode (mm:ss).
// The six props are the crops in img/li/ (assets.json props[], see img/CREDITS.txt), each checked against its frame:
// chess set 66.0 s (narrow AI), rotor drum 134.958 s (so it builds a slightly better one), domino row 136.5 s
// (intelligence explosion), typewriter 144.5 s (the last invention quote card), reel-to-reel 165.0 s (a thought
// experiment) and the paperclip machine 228.833 s (make paperclips); scene names are the narration's own words.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Forming the props, from the chess set to the paperclip machine.';
// [frame crop, prop name, file, triangles, film time (s), the scene it serves, what the frame shows]
const PROPS = [
  ['li/prop-chess.png', 'Chess set', 'chess-set.glb', 23808, 66.0, 'Narrow AI', 'A hand hovering over the chess king'],
  ['li/prop-rotors.png', 'Rotor drum', 'rotor-drum.glb', 18432, 134.958, 'A slightly better one', 'Codebreaking rotor drum machine, close up'],
  ['li/prop-domino.png', 'Domino row', 'domino-row.glb', 3584, 136.5, 'Intelligence explosion', 'A standing domino row before the topple'],
  ['li/prop-typewriter.png', 'Typewriter', 'typewriter.glb', 36224, 144.5, 'The last invention', 'Typewriter with a blank sheet'],
  ['li/prop-reel.png', 'Reel-to-reel', 'reel-to-reel.glb', 27904, 165.0, 'A thought experiment', 'Reel-to-reel computer tape banks'],
  ['li/prop-paperclip.png', 'Paperclip machine', 'paperclip-machine.glb', 41760, 228.833, 'Make paperclips', 'Paperclip machine over its pile of clips'],
];
const TOTAL = PROPS.reduce((s, m) => s + m[3], 0);
const GEN = 1.1;       // seconds one mesh takes to resolve
// the tiles land across the same 0.84 s the beat has always spent on its rows, so T.done and T.end keep their cadence
const SPAN = 0.84;
const STAGGER = SPAN / (PROPS.length - 1);
const num = (n) => Math.round(n).toLocaleString('en-US');
// film timecode, mm:ss, floored like a running clock
const tc = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = PROPS.map((_, i) => r + 0.55 + i * STAGGER);
    T.done = T.row[PROPS.length - 1] + GEN;
    T.end = T.done + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating ${PROPS.length} prop meshes</span></div></div>`);
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><i class="as-rule"></i><b>The Last Invention</b><small>Props</small><small class="as-sum">${PROPS.length} props · 0 tris</small></div>
      <div class="as-grid">${PROPS.map(([src, name, file, , at, scene, what]) => `<div class="as-tile">
        <span class="as-th"><img src="${x.img(src)}" alt="${x.esc(what)}"/><i class="as-clay"></i><b class="as-st">Remeshing</b></span>
        <span class="as-tx">
          <i class="as-rule"></i>
          <b class="as-nm">${x.esc(name)}</b>
          <span class="as-file">${x.esc(file)}</span>
          <small class="as-tris"><em>0</em> tris</small>
          <span class="as-sc"><small>${tc(at)}</small><em>${x.esc(scene)}</em></span>
        </span>
      </div>`).join('')}</div>
    </div>`);
    const hdRule = card.querySelector('.as-hd .as-rule');
    const tiles = [...card.querySelectorAll('.as-tile')].map((tile) => ({
      tile, img: tile.querySelector('.as-th img'), clay: tile.querySelector('.as-clay'), st: tile.querySelector('.as-st'),
      rule: tile.querySelector('.as-tx .as-rule'), tris: tile.querySelector('.as-tris em'),
    }));
    const sum = card.querySelector('.as-sum');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const draw = (n, p) => { const e = outCubic(p); n.style.transform = e >= 1 ? '' : `scaleX(${e.toFixed(3)})`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[PROPS.length - 1], tiles[PROPS.length - 1].tile]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? `Generated ${PROPS.length} prop meshes` : `Generating ${PROPS.length} prop meshes`;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        draw(hdRule, seg(t, T.card + 0.1, T.card + 0.5));

        let total = 0;
        tiles.forEach((m, i) => {
          const a = T.row[i];
          rise(m.tile, seg(t, a, a + 0.3), 6);
          draw(m.rule, seg(t, a + 0.08, a + 0.4));
          const p = seg(t, a + 0.1, a + GEN), e = outCubic(p);
          // turntable: the frame squashes on x as if the prop were spinning, slowing to rest as the mesh lands, and
          // warms out of an untextured teal clay pass (desaturated, soft, tinted) into the film's own graded frame
          const turn = Math.cos((1 - e) * Math.PI * 3);
          m.img.style.transform = p >= 1 ? 'none' : `scaleX(${lerp(0.35, 1, Math.abs(turn)).toFixed(3)})`;
          m.img.style.filter = p >= 1 ? 'none'
            : `grayscale(${(1 - e).toFixed(3)}) brightness(${lerp(0.55, 1, e).toFixed(3)}) contrast(${lerp(1.35, 1, e).toFixed(3)}) blur(${((1 - e) * 3).toFixed(2)}px)`;
          m.clay.style.opacity = (1 - seg(p, 0.45, 1)).toFixed(3);
          const c = PROPS[i][3] * e;
          total += c;
          const s = num(c);
          if (m.tris.textContent !== s) m.tris.textContent = s;
          const ready = p >= 1;
          m.tile.classList.toggle('as-ready', ready);
          const st = ready ? 'Ready' : 'Remeshing';
          if (m.st.textContent !== st) m.st.textContent = st;
          const pop = seg(t, a + GEN, a + GEN + 0.3);
          m.st.style.transform = pop > 0 && pop < 1 ? `scale(${lerp(0.8, 1, outBack(pop)).toFixed(3)})` : '';
        });
        const ss = `${PROPS.length} props · ${num(done ? TOTAL : total)} tris`;
        if (sum.textContent !== ss) sum.textContent = ss;
      },
    };
  },
};
