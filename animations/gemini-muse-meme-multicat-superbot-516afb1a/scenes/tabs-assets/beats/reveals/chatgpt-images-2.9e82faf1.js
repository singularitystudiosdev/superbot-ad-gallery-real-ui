// ChatGPT Images 2.0's batch UI (YouTube vG3FfUlzYQY, a 2026-05-23 tutorial, t~260.5-262.75 s; spec
// .tmp/clone-9e82faf1/reveal-refs/chatgpt-images-2/spec.json, confidence 0.70; frames r_cg2_013..022.png, r_card_crop.png, r_grid_sheet.png).
// Not the consolidated 'Creating images N of M' card the 'chatgpt' module draws: a prompt asking for a series mounts a multi-column
// grid of SEPARATE rounded dark-grey cards on a black page, each independently labelled 'Creating image' (top-left, small white type)
// over a faint dot lattice that breathes (two clusters of brighter dots drifting). The cards slide in from below, staggered; there is
// no counter, no percentage, no shared bar and no timer anywhere in the grid.
// The footage cuts away before any card resolves, so how a card lands is extrapolated: here a card's placeholder thins away to the
// picture, card by card in strict order. Adapted to ten: five columns by two rows of 4:5 cards. Omitted: the creator's own
// overlays (the circled countdown and 'BATCH GENERATION'), the chat rail and composer; no OpenAI mark is drawn, the face is the system UI stack.
import { seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ci2';
const DOTS = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="1" fill="#8a8a8a"/></svg>');
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 14px 16px; border-radius: 16px; background: #000; color: #fff; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1f1f1f; }
.${P}-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 13px; overflow: hidden; background: #2a2a2a; visibility: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background: #2a2a2a; overflow: hidden; }
.${P}-dots { position: absolute; inset: 0; background-image: url("${DOTS}"); background-size: 8px 8px; opacity: .55; }
.${P}-lb { position: absolute; left: 8px; top: 7px; font-size: 8.5px; line-height: 11px; font-weight: 500; color: #fff; white-space: nowrap; }
`;

const MOUNT0 = 0.02;          // the first card starts to slide in this long after the card enters
const MOUNT_GAP = 0.022;      // each next card follows after this
const MOUNT_LEN = 0.14;       // a card's slide-in
const RISE = 22;              // px a card rises as it mounts
const FADE = 0.07;            // a placeholder thins away over this long before its picture is settled

export default {
  id: 'chatgpt-images-2',
  label: 'ChatGPT Images 2.0 (2026)',
  source: {
    platform: 'ChatGPT web (chatgpt.com), Images 2.0 multi-image batch (desktop browser, dark theme; a tutorial screen recording on YouTube, 2026-05-23)',
    feature: "a grid of separate rounded dark cards on a black page, each labelled 'Creating image' over a breathing dot lattice, sliding in staggered; no counter, percentage or shared bar (adapted to 10: a 5 x 2 grid, the placeholders thinning away to the pictures one card at a time)",
    refs: [{ url: 'https://www.youtube.com/watch?v=vG3FfUlzYQY', retrieved: '2026-10-14' }],
    // the capture never shows a card resolving, so how a finished card replaces its placeholder is extrapolated
    extrapolated: ['the landing of a card (placeholder thins away to the picture, in order)', 'ten cards in a 5 x 2 grid (the footage shows about 3 per row, 6 requested)'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'chatgpt-images-2');
    const card = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-ph"><i class="${P}-dots"></i><span class="${P}-lb">Creating image</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-grid">${tiles.map(card).join('')}</div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), dots: n.querySelector(`.${P}-dots`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        cells.forEach((c, i) => {
          const land = ctx.seq(i)[1];
          // mount: the card slides in from below, staggered
          const m = seg(t, ctx.cardIn + MOUNT0 + i * MOUNT_GAP, ctx.cardIn + MOUNT0 + i * MOUNT_GAP + MOUNT_LEN);
          const ease = outCubic(m);
          put(`m${i}`, m <= 0 ? 'h' : m >= 1 ? 'r' : ease.toFixed(3), (v) => {
            c.n.style.visibility = v === 'h' ? 'hidden' : 'visible';
            c.n.style.transform = v === 'h' || v === 'r' ? 'none' : `translateY(${(RISE * (1 - ease)).toFixed(2)}px)`;
          });
          // the picture sits under the placeholder from just before the placeholder thins away
          const f = seg(t, land - FADE, land);
          put(`i${i}`, t >= land - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.ph.style.display = 'none'; c.ph.style.opacity = ''; } else { c.ph.style.display = ''; c.ph.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the lattice breathes: two clusters of brighter dots drift across the card (a function of t, covered or not)
          const a = t * 1.3 + i * 1.7;
          const ax = 28 + 22 * Math.sin(a), ay = 66 + 18 * Math.cos(a * 0.8);
          const bx = 74 + 18 * Math.cos(a * 0.9 + 1), by = 24 + 16 * Math.sin(a * 1.1 + 2);
          put(`d${i}`, `${ax.toFixed(0)}|${ay.toFixed(0)}|${bx.toFixed(0)}|${by.toFixed(0)}`, () => {
            const mask = `radial-gradient(circle at ${ax.toFixed(1)}% ${ay.toFixed(1)}%, #000 0%, transparent 34%), radial-gradient(circle at ${bx.toFixed(1)}% ${by.toFixed(1)}%, #000 0%, transparent 30%)`;
            c.dots.style.webkitMaskImage = mask;
            c.dots.style.maskImage = mask;
          });
        });
      },
    };
  },
};
