// Inklanes beat: one ask, two models writing at once. The line streams, the "Splitting the build" chip lands and
// spins, the lane card rises with Claude Opus 5.5 writing the ink and turf system in the left lane and GPT-5 Codex
// writing the weapons in the right one, each typing on its own rhythm with syntax colour and its own caret. Under
// both lanes a wide turf mask paints itself in as the lanes type: lime ink laid from the left while the Opus lane
// writes, magenta from the right while the Codex lane writes, circles with drips and an impact ring, and the LIME and
// MAGENTA coverage counters climbing to the round's 61.4% / 38.6%. No bitmap is fetched and no clock is read: the
// characters, the splats, the drip runs and the counters are all written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, streamCount, blink, rand } from '../../../lib.js';

const SAY = 'Ink first, then the things that shoot it.';
const RUN = 'Splitting the build';
const DONE = 'Both lanes merged';
const PCT = [61.4, 38.6];        // the settled split, Lime over Magenta: the share the results beat counts up to
const MASK_W = 520, MASK_H = 78; // the turf mask's px, the width the svg is authored at

// the two lanes: who writes it, the file it lands, how it types (cps per line, pause before each line, when it
// starts) and the ink it lays on the mask. Opus types steadily, Codex in bursts.
const LANES = [
  {
    app: 'opus', name: 'Claude Opus 5.5', file: 'ink.ts / turf.glsl', team: 'lime', t0: 0.8, after: 0.16,
    cps: [80, 95, 105, 80, 90, 90], gap: [0.05, 0.06, 0.06, 0.04, 0.05], test: 'ink.spec.ts 9 passed',
    lines: [
      [['// ink/turf.ts', 'c']],
      [['const ', 'k'], ['rt', 'v'], [' = ', 'p'], ['turf.target', 'f'], ['(', 'p'], ['1024', 'n'], [')', 'p']],
      [['rt', 'v'], ['.project', 'f'], ['(', 'p'], ['splat.decal', 'v'], [')', 'p']],
      [['if (', 'k'], ['turf.ownInk', 'f'], ['(', 'p'], ['p', 'v'], [')', 'p']],
      [['  ', 'p'], ['squid.swim', 'f'], ['(', 'p'], ['dt', 'v'], [')', 'p']],
      [['turf', 'v'], ['.coverage', 'f'], ['(', 'p'], ["'lime'", 's'], [')', 'p']],
    ],
  },
  {
    app: 'codex', name: 'GPT-5 Codex', file: 'weapons.ts', team: 'magenta', t0: 0.72, after: 0.16,
    cps: [200, 190, 180, 190, 190, 220], gap: [0.26, 0.26, 0.3, 0.26, 0.24], test: 'weapons.spec.ts 12 passed',
    lines: [
      [['// weapons.ts', 'c']],
      [['GlintCharger', 't'], [' {', 'p']],
      [['  charge: ', 'p'], ['1.1s', 'n'], [', range: ', 'p'], ['26', 'n'], [' }', 'p']],
      [['SwellRoller', 't'], [' { ', 'p'], ['flick', 'v'], [', ', 'p'], ['rollInk', 'v'], [' }', 'p']],
      [['Splattershot', 't'], [' { ', 'p'], ['rate', 'v'], [', ', 'p'], ['spread', 'v'], [' }', 'p']],
      [],                                            // the lane's blank last line: the caret waits there while the tests land
    ],
  },
];

// the turf mask's splats, in mask px: [x, y, r]. Lime lands left to right, magenta right to left, and they overlap in
// the middle. The lime radii are scaled so the settled areas give exactly PCT, the split the round ends on.
const RAW = {
  lime: [[58, 34, 24], [140, 48, 18], [214, 32, 26], [286, 50, 20], [330, 36, 16]],
  magenta: [[486, 36, 22], [402, 50, 17], [344, 30, 25], [268, 48, 19]],
};
// each splat lands once its own lane has typed this share of its file: the ink is keyed to the characters landing
const TH = { lime: [0.16, 0.34, 0.52, 0.7, 0.88], magenta: [0.18, 0.4, 0.62, 0.84] };
const area = (list) => list.reduce((s, p) => s + (p[2] * p[2]), 0);
const KL = Math.sqrt((PCT[0] / PCT[1]) * (area(RAW.magenta) / area(RAW.lime)));
const SPLATS = {
  lime: RAW.lime.map(([x, y, r], i) => ({ x, y, r: r * KL, th: TH.lime[i], sd: 17 + i * 23 })),
  magenta: RAW.magenta.map(([x, y, r], i) => ({ x, y, r, th: TH.magenta[i], sd: 61 + i * 19 })),
};
const FULL = { lime: area(SPLATS.lime.map((s) => [0, 0, s.r])), magenta: area(SPLATS.magenta.map((s) => [0, 0, s.r])) };
// two drips under each splat, deterministic from the splat's seed: they run after the body of the splat lands, and
// they are kept inside the strip (a drip clipped by the svg edge reads as a cut, not as ink)
const drips = (p) => [0, 1].map((j) => {
  const a = rand(p.sd + j * 13), b = rand(p.sd + j * 13 + 5);
  const r = p.r * (0.17 + 0.13 * b);
  const dy = Math.min(p.r * (0.72 + 0.5 * b), MASK_H - 3 - p.y - r);
  return { dx: (a - 0.5) * p.r * 1.1, dy, r };
});
const TEAM = ['lime', 'magenta'];

// where each line of a lane lands: line i types from a to b at cps[i], after a pause of gap[i - 1]
function schedule(L, t0) {
  let t = t0, total = 0;
  const lines = L.lines.map((ln, i) => {
    if (i) t += L.gap[i - 1];
    const len = ln.reduce((s, [txt]) => s + txt.length, 0);
    const S = { a: t, b: t + len / L.cps[i], len };
    total += len;
    t = S.b;
    return S;
  });
  const last = lines[lines.length - 1];
  return { lines, total, end: last.b, test: last.b + L.after };
}

const token = (txt, cls) => `<span class="ik-${cls}"></span>`;
const splat = (p, team, i) => {
  const [d0, d1] = drips(p);
  return `<g class="ik-spl ${team}" data-i="${i}" transform="translate(${p.x} ${p.y}) scale(0)" opacity="0">
    <circle class="ik-ink" r="${p.r.toFixed(1)}"/>
    <circle class="ik-ring" r="${p.r.toFixed(1)}"/>
    <circle class="ik-drip" cx="${d0.dx.toFixed(1)}" cy="${d0.dy.toFixed(1)}" r="${d0.r.toFixed(1)}" opacity="0"/>
    <circle class="ik-drip" cx="${d1.dx.toFixed(1)}" cy="${d1.dy.toFixed(1)}" r="${d1.r.toFixed(1)}" opacity="0"/>
  </g>`;
};

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.22;
    T.card = r + 0.4;
    T.mask = r + 0.62;
    T.lane = LANES.map((L) => schedule(L, r + L.t0));
    T.done = Math.max(...T.lane.map((S) => S.end));
    T.chipDone = T.done + 0.05;   // the chip resolves only once both lanes have landed
    T.end = T.done + 0.55;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow" style="opacity:0"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(RUN)}</span></div></div>`);
    const card = x.el(`<div class="ik-card">
      <div class="ik-lanes">${LANES.map((L) => `<div class="ik-lane ${L.team}">
        <div class="ik-hd">${x.tile(L.app)}<b>${x.esc(L.name)}</b><span class="ik-st"><span class="spin"></span></span></div>
        <div class="ik-file">${x.esc(L.file)}</div>
        <div class="ik-code">${L.lines.map((ln) => `<div class="ik-ln">${ln.map(([txt, cls]) => token(txt, cls)).join('')}<i class="ik-car"></i></div>`).join('')}</div>
        <div class="ik-tst">${x.OK}<span>${x.esc(L.test)}</span></div>
      </div>`).join('')}</div>
      <div class="ik-mask">
        <div class="ik-mhd"><i class="ik-live"></i><span class="ik-mtag">turf mask</span>
          ${TEAM.map((tm) => `<span class="ik-mc ${tm}"><i>${tm === 'lime' ? 'LIME' : 'MAGENTA'}</i><b class="ik-pct">0.0%</b></span>`).join('')}
        </div>
        <svg class="ik-svg" viewBox="0 0 ${MASK_W} ${MASK_H}" role="img" aria-label="turf coverage mask">
          <defs><pattern id="ik-turf-grid" width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0v26" fill="none" stroke="#1b1b20" stroke-width="1"/>
          </pattern></defs>
          <rect width="${MASK_W}" height="${MASK_H}" fill="#0a0a0d"/>
          <rect width="${MASK_W}" height="${MASK_H}" fill="url(#ik-turf-grid)"/>
          ${TEAM.map((tm) => `<g class="ik-gl">${SPLATS[tm].map((p, i) => splat(p, tm, i)).join('')}</g>`).join('')}
          <rect x="0.5" y="0.5" width="${MASK_W - 1}" height="${MASK_H - 1}" fill="none" stroke="#24242a"/>
        </svg>
        <div class="ik-cov"><i class="ik-cov-f"></i></div>
      </div>
    </div>`);
    const laneEls = [...card.querySelectorAll('.ik-lane')].map((el, li) => {
      const L = LANES[li];
      const lines = [...el.querySelectorAll('.ik-ln')].map((ln, i) => ({
        car: ln.querySelector('.ik-car'),
        toks: L.lines[i].map(([txt], j) => ({ txt, el: ln.children[j], n: -1 })),
      }));
      return { el, L, lines, spin: el.querySelector('.ik-st .spin'), tst: el.querySelector('.ik-tst') };
    });
    const groups = TEAM.map((tm) => SPLATS[tm].map((p, i) => ({
      p, sd: card.querySelector(`.ik-spl.${tm}[data-i="${i}"]`), e: -1,
      drips: [...card.querySelectorAll(`.ik-spl.${tm}[data-i="${i}"] .ik-drip`)].map((n) => ({ n, o: -1 })),
      ring: card.querySelector(`.ik-spl.${tm}[data-i="${i}"] .ik-ring`),
      ringO: -1,
    })));
    const pcts = TEAM.map((tm) => card.querySelector(`.ik-mc.${tm} .ik-pct`));
    const mask = card.querySelector('.ik-mask'), live = card.querySelector('.ik-live');
    const covf = card.querySelector('.ik-cov-f');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin'), lab = chipEl.querySelector('.ch-tool-t');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // one line's characters land: every token shows its revealed prefix, the rest of the line stays empty
    const paint = (LN, n) => {
      let off = 0;
      LN.toks.forEach((tk) => {
        const len = tk.txt.length;
        const r = n <= off ? 0 : Math.min(len, n - off);
        off += len;
        if (r !== tk.n) { tk.n = r; tk.el.textContent = r > 0 ? tk.txt.slice(0, r) : ''; }
      });
    };
    let shown = -1, lastCov = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card], [T.mask, mask]],
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
        rise(mask, seg(t, T.mask, T.mask + 0.4), 8);

        // each lane types its own file on its own rhythm: characters land line by line, the caret rides the last
        // line that has started, and the lane checks off on its own clock. Its typing drives its ink on the mask.
        const prog = [0, 0];
        laneEls.forEach((LN, li) => {
          const S = T.lane[li];
          let chars = 0, started = -1;
          S.lines.forEach((LS, i) => {
            if (t >= LS.a) started = i;
            const c = t < LS.a ? 0 : Math.min(LS.len, (t - LS.a) * LN.L.cps[i]);
            chars += c;
            paint(LN.lines[i], t < LS.a ? 0 : Math.min(LS.len, Math.floor((t - LS.a) * LN.L.cps[i])));
          });
          prog[li] = S.total ? chars / S.total : 0;
          const landed = t >= S.end;
          LN.lines.forEach((L2, i) => { L2.car.style.opacity = !landed && i === started ? (blink(t) ? '1' : '0.2') : '0'; });
          LN.spin.classList.toggle('done', landed);
          LN.spin.style.transform = landed ? '' : `rotate(${(((t - (T.r + LN.L.t0)) * 380) % 360).toFixed(1)}deg)`;
          LN.el.classList.toggle('ik-landed', landed);
          rise(LN.tst, seg(t, S.test, S.test + 0.28), 5);
        });

        // the mask: a splat paints as its lane types past its threshold, its drips run after it, the ring of the
        // impact fades as the ink spreads, and the counters climb toward the split the round settles on
        let painted = 0;
        TEAM.forEach((tm, ti) => {
          const p = prog[ti];
          let a = 0;
          groups[ti].forEach((G) => {
            const e = outCubic(seg(p, G.p.th, G.p.th + 0.12));
            if (Math.abs(e - G.e) > 0.003) {
              G.e = e;
              G.sd.setAttribute('transform', `translate(${G.p.x} ${G.p.y}) scale(${e.toFixed(4)})`);
              G.sd.setAttribute('opacity', e.toFixed(3));
            }
            const d = seg(e, 0.4, 1);
            G.drips.forEach((D) => {
              if (Math.abs(d - D.o) > 0.003) { D.o = d; D.n.setAttribute('opacity', d.toFixed(3)); }
            });
            const r = 1 - seg(e, 0.02, 0.55);
            if (Math.abs(r - G.ringO) > 0.004) { G.ringO = r; G.ring.setAttribute('opacity', (0.5 * r).toFixed(3)); }
            a += G.p.r * G.p.r * e;
          });
          painted += a / FULL[tm];
          const s = `${(PCT[ti] * (a / FULL[tm])).toFixed(1)}%`;
          if (pcts[ti].textContent !== s) pcts[ti].textContent = s;
        });
        // how much of the mask is inked at all, both lanes together: the coverage rail under the strip
        const cov = Math.round((painted / 2) * 100);
        if (cov !== lastCov) { lastCov = cov; covf.style.width = `${cov}%`; }
        const done = t >= T.done;
        live.style.opacity = done ? '0.9' : (0.45 + 0.55 * Math.abs(Math.sin(t * 4.2))).toFixed(3);
      },
    };
  },
};