// Instagram Stories 'Backdrop' (Create with AI, 2024), the story editor's AI background maker (third-party screen recordings on
// YouTube: o83taCuqWyk 2024-01-16, 1b2GaQoOiwg 2024-01-01, fyGPnXis33E 2023-12-27; spec
// .tmp/clone-9e82faf1/reveal-refs/instagram-ai-backdrop/spec.json, confidence 0.70; frames aj_ig_pending_100.0s.png,
// aj_ig_wait_sheet_98.5_104.5s.png, aj_ig_landed_104.0s.png). The prompt is submitted from a 'Create with AI' / 'Backdrop' sheet and
// the whole story frame goes near-black (sampled #3E2623-tinted, read as #1B1210 here): the person is a dim, blurred cut-out, a white
// four-point sparkle with a small triangle, a small four-point star and a dot twinkling around it sits centre-screen, and the submitted
// prompt ('Disco room' in the footage) is echoed in white directly under it. 'Cancel' is top-left. There is no bar, percentage or
// status sentence. After about three seconds the backdrop fills the frame behind the sharp cut-out and a dark rounded toast at the top
// centre reads 'Rate the results to help improve this tool.'
// Adapted to ten images: the story's single full-frame backdrop becomes a 5 x 2 block of ten portrait backdrops (our meme), landing
// one at a time in reading order once the sparkle has gone; the toast arrives with the first. Omitted: the Meta and Instagram marks,
// the story editor's tool rail and the strip of alternative thumbnails. Distinct from instagram-imagine (the DM thread's square
// media bubbles): this is the story editor's dim cut-out canvas with a sparkle, and no bubbles, ring or action icons.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-iab';
const ROOT_H = 440, COLS = 5, GAP = 8;
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #1b1210; color: #fff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2b2220; }
.${P}-cancel { position: absolute; left: 16px; top: 16px; font-size: 12px; line-height: 16px; font-weight: 600; }
.${P}-toast { position: absolute; left: 50%; top: 10px; transform: translateX(-50%); box-sizing: border-box; padding: 0 14px; height: 28px; border-radius: 9px; background: rgba(22, 22, 24, .94); font-size: 11px; line-height: 28px; font-weight: 600; white-space: nowrap; }
.${P}-subj { position: absolute; left: 50%; top: 100px; width: 210px; height: 247px; margin-left: -105px; overflow: hidden; -webkit-mask-image: radial-gradient(ellipse at center, #000 52%, transparent 86%); mask-image: radial-gradient(ellipse at center, #000 52%, transparent 86%); }
.${P}-subj img { display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-spk { position: absolute; left: 50%; top: 188px; width: 120px; height: 90px; margin-left: -60px; }
.${P}-spk svg { position: absolute; display: block; fill: #fff; }
.${P}-lab { position: absolute; left: 50%; top: 288px; width: 300px; margin-left: -150px; text-align: center; font-size: 12px; line-height: 16px; font-weight: 600; }
.${P}-g { position: absolute; left: 14px; right: 14px; top: 56px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 2 / 3; border-radius: 9px; overflow: hidden; background: #130e0d; }
.${P}-t img { position: absolute; inset: 0; z-index: 1; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #130e0d; }
.${P}-sheet { position: absolute; left: 0; right: 0; bottom: 18px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.${P}-sheet small { font-size: 10px; line-height: 13px; font-weight: 600; color: #cfc8c6; }
.${P}-sheet b { display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 30px; padding: 0 16px; border-radius: 15px; background: #fff; color: #111; font-size: 12px; font-weight: 700; }
.${P}-sheet svg { width: 12px; height: 12px; fill: #111; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const TAP_AT = 0.08;                              // the finger taps the 'Backdrop' button
const PEND = 0.16;                                // the canvas goes near-black, the cut-out dims and the sparkle starts
const LAND = Array.from({ length: 10 }, (_, i) => 0.52 + i * 0.128);   // backdrop i lands (reading order), the last at 1.67; the sparkle clears and the toast appears with the first
const STAR = 'M20 1.5C21.6 12 28 18.4 38.5 20 28 21.6 21.6 28 20 38.5 18.4 28 12 21.6 1.5 20 12 18.4 18.4 12 20 1.5Z';
// the twinkles around the sparkle: [css left, top, size, phase (turns), rate (turns per second), kind]
const TWINKLES = [[70, 8, 10, 0.1, 0.9, 'tri'], [20, 24, 9, 0.5, 1.1, 'star'], [10, 52, 5, 0.3, 0.7, 'dot'], [96, 58, 6, 0.8, 1.3, 'dot']];
const TW = {
  tri: '<path d="M20 6L34 32H6Z" stroke="#fff" stroke-width="6" stroke-linejoin="round"/>',
  star: `<path d="${STAR}"/>`,
  dot: '<circle cx="20" cy="20" r="14"/>',
};

export default {
  id: 'instagram-ai-backdrop',
  label: 'Instagram Stories AI backdrop (2024)',
  source: {
    platform: "Instagram phone app (iOS), the Stories editor's 'Backdrop' / 'Create with AI' background maker (third-party tutorial screen recordings on YouTube, 2023-12-27, 2024-01-01 and 2024-01-16)",
    feature: "near-black story canvas (read as #1B1210 from the sampled #3E2623 tint): the subject is a dim blurred cut-out, a white four-point sparkle with small triangle, star and dot twinkles animates centre-screen with the submitted prompt echoed in white under it, 'Cancel' top-left, no bar, percentage or status sentence; the backdrops then land behind the subject with the toast 'Rate the results to help improve this tool.' at the top centre (adapted to 10: a 5 x 2 block of ten portrait backdrops landing one at a time in reading order; the Meta and Instagram marks and the editor's tool rail are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=o83taCuqWyk', published: '2024-01-16', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=1b2GaQoOiwg', published: '2024-01-01', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=fyGPnXis33E', published: '2023-12-27', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      'ten backdrops: the editor shows one full-frame backdrop per generation (regenerate makes a new one), so ten portrait backdrops sit in a 5 x 2 block and land one at a time in reading order',
      "the sparkle's twinkles (a triangle, a four-point star and two dots) are redrawn as simple shapes turning with t; the footage shows them popping in and out around the sparkle without a readable period",
      'the echoed label is our own prompt (the footage shows the creator\'s typed prompt, \'Disco room\'); it is shown at full length, wrapped to two lines',
      "the toast arrives with the first backdrop and stays to the end of the beat (the footage shows it for a beat after the image lands); 'Cancel' shows from the submit on",
      "the 'Create with AI' / 'Backdrop' entry sheet before the submit is reduced to a caption and a white pill (the entry copy is from fyGPnXis33E and 1b2GaQoOiwg, not the pending clip); the ~3.1 s pending window is scaled to the beat",
      'the canvas is #1B1210, not the sampled #3E2623 (that probe sits in the warm cut-out; the surrounding frame reads near-black)',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'instagram-ai-backdrop');
    const ssrc = ownSrc(ctx.src, 'instagram-ai-backdrop-subject');   // the cut-out is a larger raster of the same picture: a URL of its own keeps their decode apart
    const g0 = tiles[0];
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; filter: ${restFilter(g)}; transform: ${restTransform(g)}; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const tw = TWINKLES.map(([l, tp, sz, , , kind]) => `<svg viewBox="0 0 40 40" style="left: ${l}px; top: ${tp}px; width: ${sz}px; height: ${sz}px">${TW[kind]}</svg>`).join('');
    const spk = `<div class="${P}-spk" style="visibility: hidden"><svg viewBox="0 0 40 40" style="left: 40px; top: 30px; width: 40px; height: 40px"><path d="${STAR}" stroke="#fff" stroke-width="2.6" stroke-linejoin="round"/></svg>${tw}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-subj"><img src="${ssrc}" width="870" height="1024" decoding="sync" alt="Muse cut-out" style="filter: ${restFilter(g0)}; transform: ${restTransform(g0)}; transform-origin: ${g0.origin}"/></div>${spk}<div class="${P}-lab" style="visibility: hidden">${x.esc(PROMPT)}</div><div class="${P}-cancel" style="visibility: hidden">Cancel</div><div class="${P}-toast" style="visibility: hidden">Rate the results to help improve this tool.</div><div class="${P}-sheet"><small>Create with AI</small><b><svg viewBox="0 0 40 40"><path d="${STAR}"/></svg>Backdrop</b></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const grid = q('g'), subj = q('subj'), subjImg = subj.querySelector('img'), spark = q('spk'), lab = q('lab'), cancel = q('cancel'), toast = q('toast'), sheet = q('sheet'), btn = sheet.querySelector('b');
    const stars = [...spark.querySelectorAll('svg')];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`) }));
    ctx.gate([subjImg, ...cells.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const grade0 = restFilter(g0) === 'none' ? '' : `${restFilter(g0)} `;

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // before: the sheet and the sharp subject; pending: dim cut-out, sparkle and echoed prompt, 'Cancel'; landed: the backdrops, the toast, 'Cancel'
        const mode = s < PEND ? 0 : s < LAND[0] ? 1 : 2;
        put('mode', mode, (m) => {
          sheet.style.visibility = m === 0 ? '' : 'hidden';
          subj.style.visibility = m === 2 ? 'hidden' : '';
          subjImg.style.filter = m === 1 ? `${grade0}blur(4px) brightness(0.5)` : restFilter(g0);
          spark.style.visibility = m === 1 ? '' : 'hidden';
          lab.style.visibility = m === 1 ? '' : 'hidden';
          cancel.style.visibility = m === 0 ? 'hidden' : '';
          toast.style.visibility = m === 2 ? '' : 'hidden';
          grid.style.visibility = m === 2 ? '' : 'hidden';
        });
        const gp = press(s, TAP_AT, 0.05, 0.04, 0.06);
        put('press', gp.toFixed(3), () => { btn.style.transform = gp > 0 ? `scale(${(1 - 0.07 * gp).toFixed(4)})` : 'none'; });

        // the sparkle breathes and its twinkles pulse in and out: functions of t alone, shown or not
        const pulse = (0.94 + 0.1 * Math.sin(t * 7.2)).toFixed(3);
        put('spk0', pulse, (v) => { stars[0].style.transform = `scale(${v})`; });
        TWINKLES.forEach(([, , , ph, rate], i) => {
          const a = Math.max(0, Math.sin(Math.PI * (((t * rate + ph) % 1 + 1) % 1))) ** 2;
          const o = a.toFixed(2);
          put(`tw${i}`, o, () => { stars[i + 1].style.opacity = o; stars[i + 1].style.transform = `scale(${(0.5 + 0.5 * a).toFixed(2)}) rotate(${Math.round(a * 40)}deg)`; });
        });

        // the backdrops land one at a time in reading order, each a plain swap over the empty dark tile
        cells.forEach((c, i) => put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; }));
      },
    };
  },
};
