// Dreamina, CapCut's international image and video generator, the web app dreamina.capcut.com (a 1280x720 desktop-browser screen recording on
// YouTube, 'CANCEL Midjourney! Dreamina AI Does It ALL for FREE', published 2025-11-05, t~90-97 s; spec
// .tmp/clone-9e82faf1/reveal-refs/dreamina-intl/spec.json, confidence 0.68; frames x_dreamina_intl_composer_t90.png,
// x_dreamina_intl_queueing_t94.png, x_dreamina_intl_landing_t96.png, x_dreamina_intl_landed_t97.png). English UI. Not the built 'dreamina'
// module (the 2024 Chinese dreamina.jianying.com page: flat dark tiles with a turning mark) and not 'jimeng-web' (the Chinese Jimeng web
// app: shimmering 2:3 tiles, a '<N>%造梦中…' label and a floating counter pill): a near-black workspace (#0d0d0d) with a slim tab strip
// ('AI Image' selected, 'AI Video', 'AI Avatar'), a 'Today' feed header with three drop-downs ('By date', 'By content type', 'By category'),
// and a generation card: the prompt, the meta 'Image 3.0 | 3:4 | 2K', then FOUR square-cornered 3:4 tiles in a row on hairline dark gaps.
// Every pending tile is a soft, heavily blurred colour gradient (the dominant hues of the picture to come; no shimmer, no ring, no
// percentage, no bar); the FIRST carries a small rounded translucent chip, 'Queueing...'. The pictures then swap in one at a time, a plain
// hard swap, and the card gains the action row 'Edit prompt | Regenerate | ...'. At the foot a centred composer pill holds the prompt, a
// '+' reference tile, the chips 'AI Image', 'Image 3.0', '3:4', 'High (2K)' and a round white submit arrow.
// Adapted to ten images: one card holds ten tiles in a 5 x 2 block, all pending at once (each a blurred, over-saturated copy of its own
// picture, which is what the footage's gradients are the average of), the chip riding the first tile that has not landed, the pictures
// swapping in one after another in strict reading order, the action row appearing after the tenth. Omitted: the pale marketing banner,
// the right-hand detail panel (Generate video, Edit on canvas, Upscale, Inpaint, Remove) that opens afterwards, the credits counter ('+ 0') beside the submit arrow, the
// help bubble and the recorder's webcam. The footage's pictures and the product's logo are never reproduced: every tile is our own
// meme, and no logo, wordmark or platform font is drawn (plain text in the system stack).
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-dmi';
const ROOT_H = 494, COLS = 5, GAP = 2;
const TEAL = '#3cc9b8';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #0d0d0d; color: #e9e9ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #232326; }
.${P}-tabs { flex: none; display: flex; align-items: center; gap: 16px; height: 28px; padding: 0 16px; font-size: 8.5px; font-weight: 500; color: #8d8d95; white-space: nowrap; }
.${P}-tabs .${P}-on { color: #fff; display: flex; align-items: center; gap: 4px; }
.${P}-tabs .${P}-on::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: ${TEAL}; }
.${P}-day { flex: none; display: flex; align-items: center; justify-content: space-between; height: 32px; padding: 0 14px 0 16px; }
.${P}-day b { font-size: 13px; font-weight: 600; color: #fff; }
.${P}-flt { display: flex; gap: 12px; height: 20px; padding: 0 10px; border-radius: 7px; background: #1b1b1f; font-size: 7.5px; line-height: 20px; color: #cfcfd5; white-space: nowrap; }
.${P}-card { flex: none; padding: 4px 16px 0; }
.${P}-pr { height: 26px; font-size: 8.5px; line-height: 13px; color: #ececef; overflow: hidden; }
.${P}-pr em { font-style: normal; margin-left: 6px; color: #8d8d95; white-space: nowrap; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 4px; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; overflow: hidden; background: #1b1b1f; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cov { position: absolute; inset: 0; }
.${P}-chip { position: absolute; left: 4px; top: 4px; display: none; height: 13px; padding: 0 6px; border-radius: 7px; background: rgba(0, 0, 0, .4); font-size: 6.5px; line-height: 13px; color: #fff; white-space: nowrap; }
.${P}-act { display: flex; align-items: center; gap: 6px; height: 24px; margin-top: 6px; visibility: hidden; }
.${P}-act span { display: flex; align-items: center; gap: 4px; height: 17px; padding: 0 8px; border-radius: 6px; background: #1b1b1f; font-size: 7.5px; color: #d3d3d9; white-space: nowrap; }
.${P}-act s { text-decoration: none; display: grid; place-items: center; width: 17px; height: 17px; border-radius: 6px; background: #1b1b1f; font-size: 8px; line-height: 1; color: #d3d3d9; }
.${P}-cmp { flex: none; box-sizing: border-box; display: flex; flex-direction: column; margin: auto 40px 14px; height: 74px; padding: 8px 10px 7px 10px; border-radius: 14px; background: #1b1b1f; }
.${P}-ct { flex: 1; min-height: 0; display: flex; gap: 9px; font-size: 7.5px; line-height: 11px; color: #dcdce0; overflow: hidden; }
.${P}-ref { flex: none; display: grid; place-items: center; width: 24px; height: 30px; border-radius: 4px; background: #2a2a2f; font-size: 11px; color: #8d8d95; transform: rotate(-5deg); margin: 2px -2px 0 2px; }
.${P}-row { flex: none; display: flex; align-items: center; gap: 5px; height: 20px; }
.${P}-row span { display: flex; align-items: center; gap: 3px; box-sizing: border-box; height: 17px; padding: 0 6px; border-radius: 6px; background: #2a2a2f; font-size: 7px; color: #d3d3d9; white-space: nowrap; }
.${P}-row .${P}-ai { color: ${TEAL}; background: #17302f; }
.${P}-row .${P}-sp { flex: 1; background: none; padding: 0; }
.${P}-go { flex: none; display: grid; place-items: center; width: 19px; height: 19px; border-radius: 50%; background: #fff; }
.${P}-go i { display: block; position: relative; width: 1.5px; height: 8px; background: #111; }
.${P}-go i::before { content: ""; position: absolute; left: -2.5px; top: -0.5px; width: 5px; height: 5px; border-top: 1.5px solid #111; border-left: 1.5px solid #111; transform: rotate(45deg) translate(1px, 1px); }
`;

const PROMPT = 'A muse in a lecture hall holding a handwritten note, meme style, bright colours, playful composition';
const META = 'Image 3.0 | 3:4 | 2K';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.1;                                // the card drops into the feed with ten pending tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1489);   // tile i's picture swaps in (reading order, strictly one after another), the last at 1.84
const BLUR = 26;                                  // a pending tile's blur, px (the spec reads about 28)

export default {
  id: 'dreamina-intl',
  label: 'Dreamina (CapCut, 2025)',
  source: {
    platform: "Dreamina web (dreamina.capcut.com), CapCut's international image generator, English UI (a desktop-browser screen recording on YouTube, published 2025-11-05; dark theme, model 'Image 3.0')",
    feature: "the 'Today' feed card with the prompt and the meta 'Image 3.0 | 3:4 | 2K', square-cornered 3:4 tiles each a soft blurred colour gradient, the first carrying a translucent 'Queueing...' chip, the pictures swapping in one at a time (adapted to 10: one card of ten tiles in a 5 x 2 block, the chip riding the first tile that has not landed, the pictures landing in strict reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=TByFwqroY50', retrieved: '2026-10-14' }],
    extrapolated: "The footage shows ONE card of four tiles, two of them landing within a second of each other: the 5 x 2 block of ten, the chip hopping to the next tile as each lands, the strict one-by-one order and every timing (the card at 0.1 s, the first landing at 0.5 s, the last at 1.84 s) are extrapolated. A pending tile is drawn as a blurred, over-saturated copy of its own picture (the footage's gradients are its average colours). The detail panel that opens after landing is omitted.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'dreamina-intl');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-cov"><span class="${P}-chip">Queueing...</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-tabs"><span class="${P}-on">AI Image</span><span>AI Video</span><span>AI Avatar</span></div><div class="${P}-day"><b>Today</b><div class="${P}-flt"><span>By date</span><span>By content type</span><span>By category</span></div></div><div class="${P}-card" style="visibility: hidden"><div class="${P}-pr">${x.esc(PROMPT)}<em>${x.esc(META)}</em></div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-act"><span>Edit prompt</span><span>Regenerate</span><s>...</s></div></div><div class="${P}-cmp"><div class="${P}-ct"><div class="${P}-ref">+</div><div>${x.esc(PROMPT)}</div></div><div class="${P}-row"><span class="${P}-ai">AI Image</span><span>Image 3.0</span><span>3:4</span><span>High (2K)</span><span class="${P}-sp"></span><div class="${P}-go"><i></i></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const card = q(`.${P}-card`), act = q(`.${P}-act`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-cov`), chip: n.querySelector(`.${P}-chip`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        put('card', s >= ISSUE, (on) => { card.style.visibility = on ? 'visible' : 'hidden'; });
        put('act', s >= LAND[9], (on) => { act.style.visibility = on ? 'visible' : 'hidden'; });

        // the first tile that has not landed carries the 'Queueing...' chip
        let first = LAND.length;
        for (let i = 0; i < LAND.length; i++) if (s < LAND[i]) { first = i; break; }

        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`c${i}`, `${done ? 1 : 0}|${i === first ? 1 : 0}`, () => {
            c.chip.style.display = !done && i === first ? 'block' : 'none';
            c.cov.style.display = done ? 'none' : '';
            if (done) {
              c.im.style.filter = restFilter(c.g);
              c.im.style.transform = restTransform(c.g);
            } else {
              c.im.style.filter = `blur(${BLUR}px) saturate(1.7) brightness(1.3) ${c.g.grade || ''}`.trim();
              c.im.style.transform = `scale(${(c.g.zoom * 1.25).toFixed(4)})`;
            }
          });
        });
      },
    };
  },
};
