// Hud beat: Cursor wires Inkwave's in match HUD. The line streams, the "Editing Hud.tsx" chip lands and spins, the
// editor card rises holding the real live gameplay frame (img/ink/hud.jpg, 1280x720, see INDEX.txt), and six
// Cursor style selection boxes land one after another on the real HUD elements at the positions they actually sit
// at in that frame: the team icon row, the timer pill, the Ink Storm gauge at READY! F, the points counter, the TAB
// MAP minimap and the "Special ready! Press F" toast. The tag on each box is the component name Cursor is wiring,
// the timer and points tags carry the live value of that component, the bar counts the components wired and the diff
// gutter under the frame shows the +lines climbing. In the last stretch the picture crossfades to the real splatted
// frame (img/ink/splatted-juno.jpg) and a RespawnCard box lands on SPLATTED BY Juno / GLINT CHARGER and the respawn
// ring. No clock, no rAF state: every moving value is written from t, so ?t= freezes the frame.
import { clamp, lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Wiring the HUD.';
const RUN = 'Editing Hud.tsx';
const DONE = 'Edited Hud.tsx';
const FRAME = 'ink/hud.jpg';          // the live gameplay frame the HUD is wired on
const DEATH = 'ink/splatted-juno.jpg'; // the SPLATTED BY Juno card the wiring ends on
const FW = 1280, FH = 720;            // source pixels of both frames (1280x720 capture)

// Each entry is the rect (x, y, w, h in source px) of a real HUD element, measured on hud.jpg and checked against
// the same-named crop in img/ink/INDEX.txt. lab picks which corner the component tag hangs off. lines is how many
// lines of Hud.tsx that component is worth in the diff gutter.
const ELS = [
  { tag: 'TeamRow', rect: [348, 14, 592, 84], lab: 'left', lines: 24, val: '4 L / 4 M' },
  { tag: 'Timer', rect: [574, 16, 140, 72], lab: 'below', lines: 18, live: 'clock' },
  { tag: 'SpecialGauge', rect: [1135, 25, 135, 140], lab: 'left', lines: 46, val: 'READY! F' },
  { tag: 'Points', rect: [1170, 160, 100, 38], lab: 'left', lines: 12, live: 'points' },
  { tag: 'Minimap', rect: [22, 484, 122, 210], lab: 'in-bl', lines: 38, val: 'TAB MAP' },
  { tag: 'Toast', rect: [545, 644, 205, 56], lab: 'above', lines: 16, val: 'Special ready! Press F' },
];
// the card the wiring ends on: the whole SPLATTED BY Juno group, weapon icon to respawn ring, on splatted-juno.jpg
const RESPAWN = { tag: 'RespawnCard', rect: [440, 503, 412, 118], lab: 'above', val: 'RESPAWN' };
const LINES = ELS.reduce((a, e) => a + e.lines, 0);   // the diff total the gutter counts up to
const CELLS = 24;                                     // gutter cells, one block per few added lines
const P0 = 0.62, STAGGER = 0.19, LAND = 0.22;         // first selection after the reply, and the landing cadence
const CLOCK0 = 118;                                   // the timer in the frame reads 1:58
const POINTS0 = 476;                                  // the points counter in the frame reads 476p

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.sel = ELS.map((_, i) => r + P0 + i * STAGGER);           // each selection box lands
    T.chipDone = T.sel[T.sel.length - 1] + 0.3;                // last box landed: the chip resolves
    T.fade = r + 2.45;                                         // the last 0.9s: crossfade to the splatted frame
    T.death = T.fade + 0.34;
    T.respawn = T.fade + 0.24;
    T.end = T.fade + 0.9;                                      // beat is 3.35s long
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(RUN)}</span></div></div>`);
    const place = (r) => `left:${(r[0] / FW * 100).toFixed(4)}%;top:${(r[1] / FH * 100).toFixed(4)}%;`
      + `width:${(r[2] / FW * 100).toFixed(4)}%;height:${(r[3] / FH * 100).toFixed(4)}%`;
    const box = (e) => `<span class="hd-sel lab-${e.lab}" style="${place(e.rect)}"><span class="hd-tag">&lt;${e.tag}&gt;`
      + `${e.val ? `<span class="hd-sub">${x.esc(e.val)}</span>` : ''}${e.live ? '<em class="hd-live"></em>' : ''}</span></span>`;
    const card = x.el(`<div class="hd-card">
      <div class="hd-bar">
        <span class="hd-app"><img src="${x.brand('cursor-logo.svg')}" alt="Cursor" draggable="false"/></span>
        <b class="hd-file">Hud.tsx</b>
        <span class="hd-wire">0 / ${ELS.length} wired</span>
      </div>
      <div class="hd-frame">
        <img class="hd-plate" src="${x.img(FRAME)}" alt="Inkwave in match HUD" draggable="false"/>
        <img class="hd-plate hd-death" src="${x.img(DEATH)}" alt="SPLATTED BY Juno respawn card" draggable="false"/>
        <span class="hd-over">${ELS.map(box).join('')}${box(RESPAWN)}</span>
      </div>
      <div class="hd-gutter">
        <span class="hd-gname">Hud.tsx</span>
        <span class="hd-gcells">${'<i></i>'.repeat(CELLS)}</span>
        <span class="hd-gplus">+<b>0</b></span>
      </div>
    </div>`);
    const boxes = [...card.querySelectorAll('.hd-sel')].map((n) => ({
      n, live: n.querySelector('.hd-live'), v: '',
    }));
    const respawn = boxes[boxes.length - 1];
    const plate = card.querySelector('.hd-plate'), death = card.querySelector('.hd-death');
    const plusEl = card.querySelector('.hd-gplus b'), wireEl = card.querySelector('.hd-wire');
    const cells = [...card.querySelectorAll('.hd-gcells i')];
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, lastPlus = -1, lastWire = '';

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.fade, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the editing chip: lands, spins while the six components land, then resolves
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const chipDone = t >= T.chipDone;
        spin.classList.toggle('done', chipDone);
        spin.style.transform = chipDone ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = chipDone ? DONE : RUN;
        if (lab.textContent !== cl) lab.textContent = cl;

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the tag values: the timer ticks down and the points counter ticks up, as the components they name would
        const clock = CLOCK0 - Math.floor(clamp(t - T.sel[1], 0, 600));
        const points = POINTS0 + Math.floor(clamp(t - T.sel[3], 0, 9) * 8);
        const out = seg(t, T.fade, T.fade + 0.24);        // the HUD boxes clear as the picture changes
        let active = -1, wired = 0;
        for (let i = 0; i < ELS.length; i++) if (t >= T.sel[i]) { active = i; wired++; }
        ELS.forEach((e, i) => {
          const B = boxes[i], a = T.sel[i];
          const p = outCubic(seg(t, a, a + LAND));
          const on = i === active;
          B.n.style.opacity = (p * (on ? 1 : 0.74) * (1 - out)).toFixed(3);
          B.n.style.boxShadow = on
            ? `0 0 ${(3 + 9 * Math.abs(Math.sin(t * 4.2))).toFixed(2)}px rgba(91, 141, 255, .55)`
            : '0 0 0 rgba(0, 0, 0, 0)';
          if (B.live) {
            const v = e.live === 'clock' ? `${Math.floor(clock / 60)}:${String(clock % 60).padStart(2, '0')}` : `${points}p`;
            if (v !== B.v) { B.v = v; B.live.textContent = v; }
          }
        });

        // the diff gutter: the +lines count climbs as each component lands, and its cells light with it
        let sum = 0;
        for (let i = 0; i < ELS.length; i++) sum += ELS[i].lines * outCubic(seg(t, T.sel[i], T.sel[i] + 0.34));
        const plus = Math.round(sum);
        if (plus !== lastPlus) { lastPlus = plus; plusEl.textContent = String(plus); }
        const w = `${wired} / ${ELS.length} wired`;
        if (w !== lastWire) { lastWire = w; wireEl.textContent = w; }
        const lit = (plus / LINES) * CELLS;
        cells.forEach((c, i) => { c.style.opacity = clamp(lit - i).toFixed(3); });

        // the last stretch: the picture crossfades to the splatted frame and the RespawnCard box lands
        const d = seg(t, T.fade, T.death);
        death.style.opacity = d.toFixed(3);
        plate.style.opacity = (1 - d).toFixed(3);
        const rp = outCubic(seg(t, T.respawn, T.respawn + 0.3));
        respawn.n.style.opacity = rp.toFixed(3);
        respawn.n.style.boxShadow = `0 0 ${(4 + 10 * Math.abs(Math.sin(t * 3.4))).toFixed(2)}px rgba(91, 141, 255, .6)`;
      },
    };
  },
};