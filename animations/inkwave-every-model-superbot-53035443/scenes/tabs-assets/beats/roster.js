// Roster beat: Nano Banana Pro renders the Inkwave squad sheet. The line streams, the "Rendering 8 characters" chip
// lands and spins, then the sheet rises: two team columns, eight portrait cards, each one resolving out of blur and
// grain under a denoise scan line, staggered, with the two ink hexes popping in on a palette strip.
// Imagery: every portrait is a real crop of the Inkwave capture (img/ink, see INDEX.txt), never a drawing. The four
// Lime cards are the four podium players in the order the VICTORY scoreboard lists them (Kelp, Coral, Clawd, Bubbles),
// each its own full body crop of the podium at 142 s: ink/ch-kelp.jpg and its three siblings. Juno and Squiddo take
// their weapon icon circle out of their own SPLATTED BY card (img/ink/wpn-glint-charger.jpg, wpn-swell-roller.jpg).
// Loop and Suki are never close enough to the camera to crop, so those two stay a CSS window onto the results frame,
// img/ink/victory.jpg, showing that player's own scoreboard row icon: the team icon fallback rather than a drawing.
// Every animated value is written from t, so ?t= freezes the frame.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Designing the squad. Lime vs Magenta, eight inklings.';
const RUN = 'Rendering 8 characters';
const DONE = 'Rendered 8 characters';
const SHEET = 'ink/victory.jpg';   // the captured results frame at 142 s, 1280 x 720
const FW = 1280, FH = 720;
// [name, team, weapon, image, square crop in that image px (centre x, centre y, side) or null, isYou]
// the four Lime entries are the podium figure crops; Loop and Suki are that player's own scoreboard row icon in SHEET
const SQUAD = [
  ['Kelp', 'lime', 'Splattershot', 'ink/ch-kelp.jpg', null, false],
  ['Loop', 'magenta', 'Splattershot', SHEET, [684, 452, 22], false],
  ['Coral', 'lime', 'Splattershot', 'ink/ch-coral.jpg', null, false],
  ['Squiddo', 'magenta', 'Swell Roller', 'ink/wpn-swell-roller.jpg', null, false],
  ['Clawd', 'lime', 'Splattershot', 'ink/ch-clawd.jpg', null, true],
  ['Juno', 'magenta', 'Glint Charger', 'ink/wpn-glint-charger.jpg', null, false],
  ['Bubbles', 'lime', 'Splattershot', 'ink/ch-bubbles.jpg', null, false],
  ['Suki', 'magenta', 'Splattershot', SHEET, [684, 557, 22], false],
];
const ROW0 = 0.72;     // first pair of cards starts resolving
const STAGGER = 0.22;  // gap between the four card rows
const RESOLVE = 0.6;   // blur and grain to sharp
const RISE = 0.28;     // a card's own rise
const THUMB = 46;      // portrait px

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.row = [0, 1, 2, 3].map((i) => r + ROW0 + i * STAGGER);
    T.last = T.row[T.row.length - 1] + RESOLVE;
    T.chipDone = T.last;   // the chip keeps spinning until the eighth character is actually rendered
    T.pal = T.last + 0.3;
    T.hex = T.pal + 0.28;
    T.end = T.hex + 0.44;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(RUN)}</span></div></div>`);
    const card = x.el(`<div class="rs-card">
      <div class="rs-hd"><b>Inkwave squad sheet</b><small>Turf War, Tidewater Plaza</small><span class="rs-count">0 of 8 rendered</span></div>
      <div class="rs-grid">
        <div class="rs-col lime"><i class="rs-tm">LIME<i class="rs-n">0</i></i><div class="rs-list"></div></div>
        <div class="rs-col magenta"><i class="rs-tm">MAGENTA<i class="rs-n">0</i></i><div class="rs-list"></div></div>
      </div>
      <div class="rs-pal" style="opacity:0">
        <span class="rs-sw lime"><i></i><b style="opacity:0">#B6FF2E</b></span>
        <span class="rs-sw magenta"><i></i><b style="opacity:0">#FF3D9A</b></span>
        <small class="rs-pnote">ink palette, sampled from the capture</small>
      </div>
    </div>`);
    const lists = [...card.querySelectorAll('.rs-list')];
    const counts = [card.querySelector('.rs-col.lime .rs-n'), card.querySelector('.rs-col.magenta .rs-n')];
    const cards = SQUAD.map(([name, team, weapon, file, crop, you]) => {
      const node = x.el(`<div class="rs-pl ${team}" style="opacity:0">
        <span class="rs-thumb"><i class="rs-shot"></i><i class="rs-grain"></i><i class="rs-scan"></i></span>
        <span class="rs-id"><b>${x.esc(name)}</b><small>${x.esc(weapon)}</small></span>
        ${you ? '<span class="rs-tag rs-you">YOU</span>' : ''}
      </div>`);
      const shot = node.querySelector('.rs-shot');
      shot.style.backgroundImage = `url("${x.img(file)}")`;
      if (crop) {
        // the fallback pair: the whole results frame is drawn at one uniform scale and pushed left/up, so exactly this
        // square of the scoreboard shows through the thumbnail (same scale on both axes, so nothing is stretched)
        const [cx, cy, side] = crop;
        const scale = THUMB / side;                 // one px of the crop per THUMB/side of thumbnail
        shot.style.backgroundSize = `${(FW * scale).toFixed(2)}px ${(FH * scale).toFixed(2)}px`;
        shot.style.backgroundPosition = `${(-(cx - side / 2) * scale).toFixed(2)}px ${(-(cy - side / 2) * scale).toFixed(2)}px`;
      } else {
        // a portrait crop of the capture: fill the square with it, sitting on the head and torso, not the feet
        shot.style.backgroundSize = 'cover';
        shot.style.backgroundPosition = '50% 38%';
      }
      lists[team === 'lime' ? 0 : 1].appendChild(node);
      return { name, team, node, shot, grain: node.querySelector('.rs-grain'), scan: node.querySelector('.rs-scan'), row: -1 };
    });
    // the order the eight slots fill in: the two columns run down together, one card per team per stagger, so the
    // SQUAD order above already alternates lime/magenta and the two lists keep the scoreboard order the brief lists
    const rows = [];
    cards.forEach((c, i) => { c.row = i >> 1; rows[c.row] = rows[c.row] || c.node; });
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const cnt = card.querySelector('.rs-count'), pal = card.querySelector('.rs-pal');
    const hexes = [...card.querySelectorAll('.rs-sw b')];
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, lastDone = -1, lastTeam = [-1, -1];

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[3], rows[3]], [T.pal, pal]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: it lands, spins while the model works, then flips to its done form
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const chipDone = t >= T.chipDone;
        spin.classList.toggle('done', chipDone);
        spin.style.transform = chipDone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = chipDone ? DONE : RUN;
        if (lab.textContent !== cl) lab.textContent = cl;

        // the sheet rides up as one panel
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // every card resolves out of blur and grain, the scan line running down it as the denoise finishes
        let done = 0;
        const perTeam = [0, 0];
        cards.forEach((c) => {
          const a = T.row[c.row];
          rise(c.node, seg(t, a, a + RISE), 7);
          const p = seg(t, a, a + RESOLVE), e = outCubic(p);
          c.shot.style.filter = `blur(${((1 - e) * 9).toFixed(2)}px) saturate(${lerp(2.2, 1.04, e).toFixed(3)}) contrast(${lerp(1.45, 1.02, e).toFixed(3)}) brightness(${lerp(1.3, 1, e).toFixed(3)})`;
          c.grain.style.opacity = ((1 - e) * 0.8).toFixed(3);
          c.grain.style.backgroundPosition = `${((t * 137) % 7).toFixed(1)}px ${((t * 91) % 7).toFixed(1)}px`;
          const live = p > 0 && p < 1;
          c.scan.style.opacity = live ? (0.55 + 0.45 * Math.sin(Math.PI * p)).toFixed(3) : '0';
          c.scan.style.top = `${(e * 112 - 6).toFixed(2)}%`;   // the wipe enters above and leaves past the bottom
          if (p >= 1) { done++; perTeam[c.team === 'lime' ? 0 : 1]++; }
        });
        if (done !== lastDone) { lastDone = done; cnt.textContent = `${done} of 8 rendered`; }
        perTeam.forEach((v, i) => { if (v !== lastTeam[i]) { lastTeam[i] = v; counts[i].textContent = String(v); } });

        // the palette strip: the two ink hexes pop in last, with their labels
        const pi = outCubic(seg(t, T.pal, T.pal + 0.4));
        pal.style.opacity = pi.toFixed(3);
        pal.style.transform = pi >= 1 ? '' : `translateY(${((1 - pi) * 8).toFixed(2)}px) scale(${lerp(0.96, 1, pi).toFixed(4)})`;
        const hp = seg(t, T.hex, T.hex + 0.3);
        hexes.forEach((b) => {
          b.style.opacity = outCubic(hp).toFixed(3);
          b.style.transform = hp >= 1 ? '' : `scale(${lerp(0.7, 1, outBack(hp)).toFixed(3)})`;
        });
      },
    };
  },
};