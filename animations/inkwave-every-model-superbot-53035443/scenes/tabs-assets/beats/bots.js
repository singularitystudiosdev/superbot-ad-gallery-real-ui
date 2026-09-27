// Bots beat: DeepSeek V4 Flash trains the seven bot players and simulates Turf Wars for them. The line streams,
// the "Simulating Turf Wars" chip lands and spins, the bot card rises: one row per bot (every lobby slot except
// Clawd, who is YOU) with its own avatar crop, team pip, role line and a behaviour state that keeps cycling
// (Paint, Push, Swim, Super Jump). The footer then simulates: the match counter climbs to 1,200 and the
// Lime vs Magenta win rate converges on an even 50/50 split, so the lobby is provably balanced before the player
// ever queues. No clock: every moving value is written from t, so ?t= freezes the frame.
//
// The avatars are crops of the capture in img/ink, never drawn. Kelp, Coral and Bubbles come from the VICTORY podium
// crops (ch-kelp.jpg, ch-coral.jpg, ch-bubbles.jpg, the three Lime podium figures at 142 s) in the scoreboard order
// the catalogue records, which is an ordering convention, not a verified identity: the capture never labels the podium
// figures. Loop, Squiddo and Juno come from the round weapon badge on their own SPLATTED BY card (splatted-loop.jpg
// SPRITZER, splatted-squiddo.jpg SWELL ROLLER, splatted-juno.jpg GLINT CHARGER), which is the one close crop of each
// of them the capture holds. Suki is never shown close enough to crop anywhere, so their avatar is a magenta bot tile
// drawn in CSS instead of an invented portrait.
import { lerp, seg, outCubic, inOutCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Seven bots, so you never queue alone.';
const RUN = 'Simulating Turf Wars';
const DONE = 'Turf Wars simulated';
const MATCHES = 1200;          // matches simulated by the end of the beat
const LIME0 = 38, LIME1 = 50;  // Lime's win rate, converging on an even split
const AV = 24;                 // avatar box, css px
const STATES = ['Paint', 'Push', 'Swim', 'Super Jump'];
const SCLS = ['paint', 'push', 'swim', 'jump'];
const CYCLE = 0.42;            // a behaviour state holds this long before the next
const ROW0 = 0.6, STAGGER = 0.18, LAND = 0.3, POP = 0.22;
// intrinsic px of every avatar source, so where its focus point lands under the avatar's fill can be computed
const SRC = {
  'ink/ch-kelp.jpg': [200, 200],
  'ink/ch-coral.jpg': [200, 205],
  'ink/ch-bubbles.jpg': [200, 195],
  'ink/splatted-loop.jpg': [1280, 720],
  'ink/splatted-squiddo.jpg': [1280, 720],
  'ink/splatted-juno.jpg': [1280, 720],
};

// [name, team, role, avatar]. An avatar is [source, focus x, focus y, zoom]: the point of that source image the circle
// is centred on (0 to 1 of the image) and how much larger than a whole-image fill it is drawn, or null for the tile.
// Kelp 103,59 of the 200px podium crop, Coral 106,45 of 200x205, Bubbles 146,78 of 200x195 (the figure at the right of
// that crop, the one the catalogue measured it for); Loop 483,548, Squiddo 434,547 and Juno 489,547 in their 1280x720
// SPLATTED BY card, each the centre of the round weapon badge, zoomed so that badge fills the 24px circle.
const BOTS = [
  ['Kelp', 'lime', 'Anchors spawn', ['ink/ch-kelp.jpg', 0.515, 0.295, 2.8]],
  ['Coral', 'lime', 'Takes the flank', ['ink/ch-coral.jpg', 0.530, 0.220, 2.9]],
  ['Bubbles', 'lime', 'Paints mid', ['ink/ch-bubbles.jpg', 0.730, 0.400, 4.0]],
  ['Loop', 'magenta', 'Pushes the line', ['ink/splatted-loop.jpg', 0.3772, 0.7611, 9.0]],
  ['Squiddo', 'magenta', 'Swell Roller rush', ['ink/splatted-squiddo.jpg', 0.3392, 0.7604, 8.47]],
  ['Juno', 'magenta', 'Glint Charger backline', ['ink/splatted-juno.jpg', 0.3822, 0.7604, 8.37]],
  ['Suki', 'magenta', 'Takes the flank', null],
];
// 1,200 and not 1.2k: the counter is the proof of volume, so it is spelled out with the thousands separator
const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.chipDone = T.chip + 0.4;
    T.card = r + 0.4;
    T.row = BOTS.map((_, i) => r + ROW0 + i * STAGGER);
    T.last = T.row[BOTS.length - 1] + LAND;
    T.sim = T.last + 0.06;      // every bot is in, so the matches start simulating
    T.simEnd = T.sim + 1.05;    // 1,200 matches in, the win rate has settled at 50/50
    T.end = T.simEnd + 0.34;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Simulating Turf Wars</span></div></div>');
    // the avatar window: the source fills the 24px circle whole (object-fit: cover) and is then moved so its focus
    // point sits on the circle's centre and scaled about that centre. object-fit alone cannot frame a face here:
    // every source is square or near square, so cover fills the box exactly and object-position has nothing to shift.
    // No new image is ever produced, the source is only cropped by the rounded box in CSS.
    const avatar = ([name, team, , a]) => {
      if (!a) return `<span class="bo-av bo-av-tile ${team}">${x.esc(name[0])}</span>`;
      const [src, fx, fy, z] = a;
      const [sw, sh] = SRC[src];
      const fit = Math.max(AV / sw, AV / sh);                        // object-fit: cover into the AV box
      const ex = fx * sw * fit + (AV - sw * fit) / 2;                // where the focus point lands under that fit
      const ey = fy * sh * fit + (AV - sh * fit) / 2;
      const off = `position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;object-position:50% 50%;`
        + `transform:translate(${((AV / 2 - ex) * z).toFixed(2)}px,${((AV / 2 - ey) * z).toFixed(2)}px) scale(${z})`;
      return `<span class="bo-av ${team}"><img src="${x.img(src)}" alt="" style="${off}"/></span>`;
    };
    const card = x.el(`<div class="bo-card">
      <div class="bo-hd"><b>Bot lobby</b><small>Turf War, Tidewater Plaza</small><span class="bo-prog">0 of 7 trained</span></div>
      ${BOTS.map(([name, team, role, a]) => `<div class="bo-row ${team}">
        ${avatar([name, team, role, a])}
        <span class="bo-pip"></span>
        <span class="bo-main"><b class="bo-name">${x.esc(name)}</b><small class="bo-role">${x.esc(role)}</small></span>
        <span class="bo-st paint">Paint</span>
      </div>`).join('')}
      <div class="bo-foot">
        <div class="bo-count"><b class="bo-n">0</b><small>matches simulated</small></div>
        <div class="bo-rate">
          <div class="bo-bar"><i class="bo-fill"></i></div>
          <div class="bo-leg"><span class="bo-lp">Lime 38.0%</span><span class="bo-mp">Magenta 62.0%</span></div>
        </div>
      </div>
      <div class="bo-stamp" style="opacity:0">Balanced 50.0 / 50.0</div>
    </div>`);
    const rows = [...card.querySelectorAll('.bo-row')].map((row) => ({ row, st: row.querySelector('.bo-st') }));
    const prog = card.querySelector('.bo-prog'), num = card.querySelector('.bo-n');
    const fill = card.querySelector('.bo-fill'), lp = card.querySelector('.bo-lp'), mp = card.querySelector('.bo-mp');
    const stamp = card.querySelector('.bo-stamp'), foot = card.querySelector('.bo-foot');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, trained = -1, count = -1, lw = -1;

    return {
      nodes: [say, chip, card],
      // the last mark is the simulation footer, not the last row: the counter and the win rate bar are the payoff,
      // so the thread has to glide down far enough to keep them above the composer
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.row[BOTS.length - 1], rows[BOTS.length - 1].row], [T.sim, foot]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const chipDone = t >= T.chipDone;
        spin.classList.toggle('done', chipDone);
        spin.style.transform = chipDone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = chipDone ? DONE : RUN;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the rows land one by one, each bot starting on its own offset in the behaviour cycle so no two read alike
        let inked = 0;
        rows.forEach(({ row, st }, i) => {
          const a = T.row[i];
          rise(row, seg(t, a, a + LAND), 6);
          const pop = seg(t, a + LAND, a + LAND + POP);
          st.style.transform = pop >= 1 ? '' : `scale(${lerp(0.8, 1, outBack(pop)).toFixed(3)})`;
          if (t >= a + LAND) inked++;
          const si = (((Math.floor((t - (a + LAND)) / CYCLE) + i * 3) % 4) + 4) % 4;
          if (st.dataset.s !== String(si)) { st.dataset.s = String(si); st.textContent = STATES[si]; st.className = `bo-st ${SCLS[si]}`; }
        });
        if (inked !== trained) { trained = inked; prog.textContent = `${inked} of 7 trained`; }

        // the simulation: matches climb to 1,200 while the win rate settles on 50/50
        const cp = seg(t, T.sim, T.simEnd);
        const m = Math.round(MATCHES * cp);
        if (m !== count) { count = m; num.textContent = thousands(m); }
        const lime = lerp(LIME0, LIME1, inOutCubic(cp));
        if (lime.toFixed(1) !== lw.toFixed(1)) {
          lw = lime;
          fill.style.width = `${lime.toFixed(2)}%`;
          lp.textContent = `Lime ${lime.toFixed(1)}%`;
          mp.textContent = `Magenta ${(100 - lime).toFixed(1)}%`;
        }
        stamp.style.opacity = outCubic(seg(t, T.simEnd - 0.12, T.simEnd + 0.18)).toFixed(3);
      },
    };
  },
};