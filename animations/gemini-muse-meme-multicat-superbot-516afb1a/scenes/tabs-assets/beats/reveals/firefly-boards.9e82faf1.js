// Adobe Firefly Boards (2026): the moodboard canvas at firefly.adobe.com/boards with its docked 'Generate image' composer. Measured at 20 fps
// from the Adobe Live screen recording HokbpdkVO90 (2026-06-27, t=205.0-207.2 s; spec .tmp/clone-9e82faf1/reveal-refs/firefly-boards/spec.json,
// confidence 0.5; frames al2_hok_t20555_grey_tile.png .. al2_hok_t20715_after.png). A near-black dotted board holds a few neutral reference
// cards and the generated cards under the label 'GENERATED IMAGES'; the composer panel carries the prompt, the chips 'Gemini 3.1 (w/ Nano
// Banana 2)', 'Vertical' and '1K', the 'Use Google Search' toggle and a blue 'Generate' button. While a card is pending it is a FLAT neutral
// grey rounded tile (#1F2120) with a lighter grey disc at its centre: it does not shimmer. The in-flight indicator is a multi-colour
// conic-gradient ring: a small orange-red disc seeds at the card's corner, grows into a ring that sweeps clockwise around the card, retracts and
// fades as the picture lands. There is no status text, no percentage and the Generate button never changes label.
// Adapted to ten images: ten cards (5 x 2) landing in strict reading order, each with its own ring; the order and spacing are extrapolated from
// the one card the footage shows. The ring's angle is set from t (no CSS animation) and every ring is finished before the last card lands, so
// the landed state is static. Omitted: the credit cost beside the button, the Adobe logo, the Google mark on the model chip, the presenter's
// webcam and the creator's own pictures (every card is our own meme).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ffb';
const ROOT_H = 408, COLS = 5, GAP = 6, RING = 112, THICK = 6;
const GX = 82, GY = 40, GW = 452, CW = (GW - GAP * (COLS - 1)) / COLS, CH = CW * 1024 / 870;   // the card grid and one card's size
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background-color: #121212; background-image: radial-gradient(circle, #2a2a2a 0.9px, transparent 1.2px); background-size: 14px 14px; color: #e8e8e8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #262626; }
.${P}-lbl { position: absolute; left: 14px; top: 12px; box-sizing: border-box; height: 18px; padding: 0 6px; border: 1px solid #4b6bf5; line-height: 16px; font-size: 9.5px; font-weight: 800; letter-spacing: 0.2px; color: #f5f5f5; white-space: nowrap; }
.${P}-lbl i { position: absolute; width: 4px; height: 4px; box-sizing: border-box; border-radius: 50%; background: #fff; border: 1px solid #4b6bf5; }
.${P}-lbl i:nth-child(1) { left: -3px; top: -3px; }
.${P}-lbl i:nth-child(2) { right: -3px; top: -3px; }
.${P}-lbl i:nth-child(3) { left: -3px; bottom: -3px; }
.${P}-lbl i:nth-child(4) { right: -3px; bottom: -3px; }
.${P}-refs { position: absolute; left: 14px; top: 40px; display: flex; flex-direction: column; gap: 8px; }
.${P}-ref { width: 56px; height: 64px; border-radius: 6px; }
.${P}-g { position: absolute; left: ${GX}px; top: ${GY}px; width: ${GW}px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 6px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; border-radius: 6px; }
.${P}-pend { position: absolute; inset: 0; border-radius: 6px; background: #1f2120; }
.${P}-pend i { position: absolute; left: 50%; top: 50%; width: 11px; height: 11px; margin: -5.5px 0 0 -5.5px; border-radius: 50%; background: #4a4d4c; }
.${P}-rw { position: absolute; width: ${RING}px; height: ${RING}px; pointer-events: none; }
.${P}-rg { position: absolute; inset: 0; border-radius: 50%; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - ${THICK}px), #000 calc(100% - ${THICK - 0.5}px)); mask: radial-gradient(farthest-side, transparent calc(100% - ${THICK}px), #000 calc(100% - ${THICK - 0.5}px)); }
.${P}-sd { position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #ff4b2b; }
.${P}-cmp { position: absolute; left: 10px; right: 10px; bottom: 10px; box-sizing: border-box; height: 120px; padding: 8px 12px 0; border-radius: 10px; background: #1e1e1e; box-shadow: 0 0 0 1px #2c2c2c, 0 6px 18px rgba(0, 0, 0, .45); }
.${P}-hd { display: flex; align-items: center; gap: 9px; height: 18px; font-size: 9px; font-weight: 700; color: #f2f2f2; white-space: nowrap; }
.${P}-hd svg { flex: none; width: 10px; height: 10px; fill: none; stroke: #bdbdbd; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
.${P}-hd .${P}-sp { flex: 1; }
.${P}-th { display: flex; gap: 6px; margin-top: 5px; height: 26px; }
.${P}-th i { flex: none; width: 66px; border-radius: 4px; }
.${P}-th span { flex: none; display: grid; place-items: center; box-sizing: border-box; width: 56px; border-radius: 4px; border: 1px dashed #5a5a5a; font-size: 7.5px; color: #cfcfcf; }
.${P}-pt { margin-top: 7px; height: 12px; font-size: 7.5px; line-height: 12px; color: #e4e4e4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-ct { position: absolute; left: 12px; right: 12px; bottom: 9px; display: flex; align-items: center; gap: 8px; height: 22px; font-size: 7.5px; color: #d6d6d6; white-space: nowrap; }
.${P}-ct b { font-weight: 400; display: flex; align-items: center; gap: 4px; }
.${P}-ct b svg { width: 7px; height: 7px; fill: none; stroke: #bdbdbd; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ct u { text-decoration: none; display: block; position: relative; width: 16px; height: 9px; border-radius: 5px; background: #3a3a3a; }
.${P}-ct u::after { content: ""; position: absolute; left: 1.5px; top: 1.5px; width: 6px; height: 6px; border-radius: 50%; background: #fff; }
.${P}-ct .${P}-sp { flex: 1; }
.${P}-go { flex: none; display: grid; place-items: center; height: 20px; padding: 0 11px; border-radius: 10px; background: #3b63fb; font-size: 8.5px; font-weight: 700; color: #fff; }
`;

const PROMPT = 'create a muse holding a handwritten note in a lecture hall, meme style';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the board's generated column fills with the ten pending cards
const LAND = Array.from({ length: 10 }, (_, i) => 0.56 + i * 0.1244);   // card i hands over to its picture (reading order), the last at 1.68
const RD = 0.36;                                  // one card's ring: seed, sweep, retract and fade, ending as its picture lands
const MAXSWEEP = 350;                             // the ring never closes (the footage leaves a small gap at the top)
// the ring's hues by angle clockwise from the card's top-left: red, magenta, purple, blue, teal, yellow, orange (measured hue span 7/12 bins)
const PAL = [[0, [255, 75, 43]], [28, [241, 63, 180]], [75, [154, 92, 245]], [135, [61, 123, 255]], [190, [54, 201, 192]], [250, [255, 194, 31]], [315, [255, 122, 31]], [350, [255, 75, 43]]];
const rgb = (c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const colourAt = (a) => {
  for (let k = 1; k < PAL.length; k++) {
    if (a <= PAL[k][0]) { const [a0, c0] = PAL[k - 1], [a1, c1] = PAL[k], f = (a - a0) / (a1 - a0); return c0.map((v, j) => Math.round(v + (c1[j] - v) * f)); }
  }
  return PAL[PAL.length - 1][1];
};
// a conic-gradient lit only between angles a0 and a1 (hard edges), hues pinned to their angle
const arc = (a0, a1) => {
  const mid = PAL.filter(([a]) => a > a0 && a < a1).map(([a, c]) => `${rgb(c)} ${a}deg`);
  return `conic-gradient(from -45deg, rgba(0, 0, 0, 0) 0deg ${a0}deg, ${rgb(colourAt(a0))} ${a0}deg, ${mid.length ? mid.join(', ') + ', ' : ''}${rgb(colourAt(a1))} ${a1}deg, rgba(0, 0, 0, 0) ${a1}deg 360deg)`;
};
const easeOut = (x) => 1 - (1 - x) * (1 - x);
const ico = (d) => `<svg viewBox="0 0 12 12">${d}</svg>`;
const REFCARD = ['linear-gradient(170deg, #3b3835, #25211e)', 'linear-gradient(170deg, #2c3338, #1b2024)', 'linear-gradient(170deg, #b9b6b2, #8f8c88)'];

export default {
  id: 'firefly-boards',
  label: 'Adobe Firefly Boards (2026)',
  source: {
    platform: 'Adobe Firefly Boards (firefly.adobe.com/boards), desktop web, dark theme; an Adobe Live screen recording, 2026',
    feature: "dark dotted board with neutral reference cards, the 'GENERATED IMAGES' label and a docked 'Generate image' composer (prompt, 'Gemini 3.1 (w/ Nano Banana 2)', 'Vertical', '1K', 'Use Google Search', 'Generate'); each pending card is a flat neutral-grey rounded tile (#1F2120) with a lighter grey centre disc and no shimmer, and a multi-colour conic-gradient ring seeds at its corner, sweeps clockwise round it and fades as the picture lands (no status text, percentage or button-label change); adapted to 10 cards landing in reading order; the credit cost, the Adobe logo, the presenter and the webcam are omitted",
    refs: [
      { url: 'https://www.youtube.com/watch?v=HokbpdkVO90', id: 'HokbpdkVO90', title: 'How to Bring Your Ideas to Life with Firefly Boards', published: '2026-06-27', retrieved: '2026-10-14', measured: 't=205.95-207.05 s at 20 fps, the one captured wait' },
      { url: 'https://www.youtube.com/watch?v=R3t_ygHGecY', id: 'R3t_ygHGecY', title: 'Build a Mood Board with Adobe Firefly Boards & Adobe Stock', published: '2026-10-05', retrieved: '2026-10-14', measured: 'closed negative: the video ends before its first generation' },
    ],
    extrapolated: [
      'ten cards in a 5 x 2 block landing in strict reading order (the footage generates one card)',
      'the spacing of the landings (the beat is stretched to the real window)',
      "the ring running on every pending card and ending as its picture lands (the footage shows one ring, after a click on a board card rather than on 'Generate', starting 0.2 s after the slot already held content)",
      "the composer's prompt (our own) and the reference thumbnails (neutral tints, not the creator's pictures)",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'firefly-boards');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i></i></div></div>`;
    const ring = (i) => `<div class="${P}-rw" style="display: none; left: ${GX + (i % COLS) * (CW + GAP) + CW / 2 - RING / 2}px; top: ${GY + Math.floor(i / COLS) * (CH + GAP) + CH / 2 - RING / 2}px"><div class="${P}-rg"></div><div class="${P}-sd" style="left: ${RING / 2 - (RING / 2 - THICK / 2) * Math.SQRT1_2 - 7}px; top: ${RING / 2 - (RING / 2 - THICK / 2) * Math.SQRT1_2 - 7}px"></div></div>`;
    const wand = ico('<path d="M2 10l5.5-5.5M6.5 3.5l2 2M9 1.5v2M8 2.5h2"/>');
    const frame = ico('<path d="M1.5 4V1.5H4M8 1.5h2.5V4M10.5 8v2.5H8M4 10.5H1.5V8"/>');
    const grid = ico('<path d="M1.5 1.5h3v3h-3zM7.5 1.5h3v3h-3zM1.5 7.5h3v3h-3zM8 8h2M9 7v2"/>');
    const chev = ico('<path d="M3 4.5l3 3 3-3"/>');
    const phone = ico('<rect x="3" y="1" width="6" height="10" rx="1.2"/>');
    const layers = ico('<rect x="1.5" y="2.5" width="9" height="7" rx="1"/><path d="M1.5 6h9"/>');
    const gear = ico('<circle cx="6" cy="6" r="1.6"/><path d="M6 1.2v1.5M6 9.3v1.5M1.2 6h1.5M9.3 6h1.5M2.6 2.6l1 1M8.4 8.4l1 1M2.6 9.4l1-1M8.4 3.6l1-1"/>');
    const close = ico('<path d="M3 3l6 6M9 3l-6 6"/>');
    const root = x.el(`<div class="${P}"><b class="${P}-lbl"><i></i><i></i><i></i><i></i><span>GENERATED IMAGES</span></b><div class="${P}-refs">${REFCARD.map((b) => `<div class="${P}-ref" style="background: ${b}"></div>`).join('')}</div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div>${tiles.map((g, i) => ring(i)).join('')}<div class="${P}-cmp"><div class="${P}-hd">Generate image${wand}${frame}${grid}<span class="${P}-sp"></span>${close}</div><div class="${P}-th">${REFCARD.map((b) => `<i style="background: ${b}"></i>`).join('')}<span>Image</span></div><div class="${P}-pt">${x.esc(PROMPT)}</div><div class="${P}-ct"><b>Gemini 3.1 (w/ Nano Banana 2)${chev}</b><b>${phone}Vertical${chev}</b><b>${layers}1K${chev}</b><b><u></u>Use Google Search</b><b>${gear}</b><span class="${P}-sp"></span><div class="${P}-go">Generate</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), grid2 = root.querySelector(`.${P}-g`);
    const rws = [...root.querySelectorAll(`.${P}-rw`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), rw: rws[i], rg: rws[i].querySelector(`.${P}-rg`), sd: rws[i].querySelector(`.${P}-sd`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the generated column fills with the pending cards
        put('iss', s >= ISSUE, (v) => { grid2.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const landed = s >= a;
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);

          // the ring: seed (0..0.2), clockwise sweep (0.2..0.7), then the tail catches up and it fades out as the picture lands (0.6..1); a function of t alone, and over before the card lands
          const p = (s - (a - RD)) / RD;
          if (p <= 0 || p >= 1) { put(`g${i}`, 'off', () => { c.rw.style.display = 'none'; }); return; }
          const a1 = MAXSWEEP * easeOut(seg(p, 0.2, 0.7)), a0 = MAXSWEEP * seg(p, 0.62, 1), op = 1 - seg(p, 0.7, 1);
          const sc = seg(p, 0, 0.2), sdo = 1 - seg(p, 0.22, 0.42);
          const key = `${Math.round(a0)}|${Math.round(a1)}|${op.toFixed(2)}|${sc.toFixed(2)}|${sdo.toFixed(2)}`;
          put(`g${i}`, key, () => {
            c.rw.style.display = '';
            c.rw.style.opacity = op.toFixed(2);
            const lo = Math.round(a0), hi = Math.round(a1);
            c.rg.style.backgroundImage = hi > lo ? arc(lo, hi) : 'none';
            c.sd.style.transform = `scale(${sc.toFixed(3)})`;
            c.sd.style.opacity = sdo.toFixed(2);
          });
        });
      },
    };
  },
};
