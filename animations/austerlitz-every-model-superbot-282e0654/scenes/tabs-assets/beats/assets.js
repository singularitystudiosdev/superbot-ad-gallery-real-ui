// Assets beat (Meshy, THE SOLDIERS): a 3D asset model forms the soldiers of AUSTERLITZ. Its line streams, the
// "Generating 8 army meshes" chip spins, and the sheet rises on the film's night: eight tiles in film order, the three
// armies first (French, Austrian, Russian), then the Guard cavalry, the broken 4th Line, Rapp's Mamelukes and
// chasseurs, and the guns left on the ice. Every tile is the soldier's own frame from the film (a crop of the repo
// master, img/az/beats/assets/CREDITS.txt), named for the sprite the film draws there (web/engine/sprites.js
// @86dae32d reg() names, as .glb), with that sprite's true frame count (the third argument of its reg() call), the
// source time of the crop (m:ss) and the README scene it belongs to. A tile lands, its torch rule draws in (the
// film's lower third hairline), its frame turns on a turntable out of a cold night-ice clay tint into the film's
// own grade as the mesh resolves, its frames count up, and its stamp flips from REMESHING to READY.
// The film has no close shot of Russian or Austrian line infantry: those two tiles are the nearest the film comes
// (the Pratzen column at middle distance, the Austrian column far off in the Telnitz fog), and their alt text says so.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Forming the soldiers of three armies, their horses and guns.';
// [still, tile name, file (sprite.glb), frames (sprites.js reg), film time (s), README scene, army swatch, what it shows]
const MEN = [
  ['az/beats/assets/fr_fire.jpg', 'French line', 'fr_fire.glb', 4, 146.0, 'Fog', 'fr', 'The French line at Telnitz in the fog, blue coats, seen from behind the ranks'],
  ['az/beats/assets/au_march.jpg', 'Austrians', 'au_march.glb', 8, 151.0, 'Fog', 'au', 'An Austrian column in white coats, far off in the Telnitz fog'],
  ['az/beats/assets/ru_march.jpg', 'Russians', 'ru_march.glb', 8, 157.5, 'Fog', 'ru', 'A Russian column in green coats with its flag on the Pratzen Heights'],
  ['az/beats/assets/guardru_gallop.jpg', 'Russian Guard', 'guardru_gallop.glb', 8, 210.0, 'The centre', 'gd', 'The Russian Imperial Guard cavalry at the gallop, white coats, black crested helmets'],
  ['az/beats/assets/fr_charge.jpg', '4th Line', 'fr_charge.glb', 8, 212.0, 'The centre', 'fr', 'Men of the 4th Line broken and running, blue coats and shakos'],
  ['az/beats/assets/mameluke_gallop.jpg', 'Mamelukes', 'mameluke_gallop.glb', 8, 221.0, 'The centre', 'fr', 'Mamelukes of the Guard on grey horses in Rapp’s charge'],
  ['az/beats/assets/chasseur_gallop.jpg', 'Chasseurs', 'chasseur_gallop.glb', 8, 222.0, 'The centre', 'fr', 'Chasseurs of the Guard in green on bay horses in Rapp’s charge'],
  ['az/beats/assets/gun_ru.jpg', 'Guns', 'gun_ru.glb', 2, 252.5, 'The ponds', 'ru', 'Guns and dead horses on the broken ice of the Satschan ponds at dusk'],
];
const FRAMES = MEN.reduce((s, m) => s + m[3], 0);
const GEN = 1.1;       // seconds one mesh takes to resolve
// the tiles land across the same 0.84 s the beat has always spent on its rows, so T.done and T.end keep their cadence
const SPAN = 0.84;
const STAGGER = SPAN / (MEN.length - 1);
// film source time, m:ss, floored like a running clock (the README's own timecode form)
const tc = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = MEN.map((_, i) => r + 0.55 + i * STAGGER);
    T.done = T.row[MEN.length - 1] + GEN;
    T.end = T.done + 0.5;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Generating ${MEN.length} army meshes</span></div></div>`);
    const card = x.el(`<div class="as-card">
      <div class="as-hd"><i class="as-rule"></i><b>Austerlitz</b><small>Three armies</small><small class="as-sum">${MEN.length} meshes · 0 frames</small></div>
      <div class="as-grid">${MEN.map(([src, name, file, , at, scene, army, what]) => `<div class="as-tile">
        <span class="as-th"><img src="${x.img(src)}" alt="${x.esc(what)}"/><i class="as-clay"></i><b class="as-st">Remeshing</b></span>
        <span class="as-tx">
          <i class="as-rule"></i>
          <b class="as-nm">${x.esc(name)}</b>
          <span class="as-file"><i class="as-army as-a-${army}"></i>${x.esc(file)}</span>
          <small class="as-frm"><em>0</em> frames</small>
          <span class="as-sc"><small>${tc(at)}</small><em>${x.esc(scene)}</em></span>
        </span>
      </div>`).join('')}</div>
    </div>`);
    const hdRule = card.querySelector('.as-hd .as-rule');
    const tiles = [...card.querySelectorAll('.as-tile')].map((tile) => ({
      tile, img: tile.querySelector('.as-th img'), clay: tile.querySelector('.as-clay'), st: tile.querySelector('.as-st'),
      rule: tile.querySelector('.as-tx .as-rule'), fr: tile.querySelector('.as-frm em'),
    }));
    const sum = card.querySelector('.as-sum');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const draw = (n, p) => { const e = outCubic(p); n.style.transform = e >= 1 ? '' : `scaleX(${e.toFixed(3)})`; };
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[MEN.length - 1], tiles[MEN.length - 1].tile]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = done ? `Generated ${MEN.length} army meshes` : `Generating ${MEN.length} army meshes`;
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
          // turntable: the frame squashes on x as if the figure were spinning, slowing to rest as the mesh lands, and
          // warms out of an untextured night-ice clay pass (desaturated, soft, tinted) into the film's own frame
          const turn = Math.cos((1 - e) * Math.PI * 3);
          m.img.style.transform = p >= 1 ? 'none' : `scaleX(${lerp(0.35, 1, Math.abs(turn)).toFixed(3)})`;
          m.img.style.filter = p >= 1 ? 'none'
            : `grayscale(${(1 - e).toFixed(3)}) brightness(${lerp(0.55, 1, e).toFixed(3)}) contrast(${lerp(1.35, 1, e).toFixed(3)}) blur(${((1 - e) * 3).toFixed(2)}px)`;
          m.clay.style.opacity = (1 - seg(p, 0.45, 1)).toFixed(3);
          // the gait cycle fills frame by frame as the mesh resolves
          const c = Math.round(MEN[i][3] * e);
          total += c;
          const s = String(c);
          if (m.fr.textContent !== s) m.fr.textContent = s;
          const ready = p >= 1;
          m.tile.classList.toggle('as-ready', ready);
          const st = ready ? 'Ready' : 'Remeshing';
          if (m.st.textContent !== st) m.st.textContent = st;
          const pop = seg(t, a + GEN, a + GEN + 0.3);
          m.st.style.transform = pop > 0 && pop < 1 ? `scale(${lerp(0.8, 1, outBack(pop)).toFixed(3)})` : '';
        });
        const ss = `${MEN.length} meshes · ${done ? FRAMES : total} frames`;
        if (sum.textContent !== ss) sum.textContent = ss;
      },
    };
  },
};
