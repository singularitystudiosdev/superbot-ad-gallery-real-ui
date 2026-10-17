// Hotpot.ai (2023), the AI Art Generator page, hotpot.ai/art-generator (user screen recordings: YouTube oqbDEAzjU-Q 2023-05-27,
// t~163.4-165.6 s, corroborated by 2yQKNlil-C4 2024-02-05 and bAAyUQXAPTw 2023-08-09; spec .tmp/clone-9e82faf1/reveal-refs/hotpot/spec.json,
// confidence 0.55; frames s_hotpot_oqb_prompt_create_t163.4.png, s_hotpot_oqb_pending_blank_t165.0.png, s_hotpot_twq_setup_t91.0.png).
// A light two-column page under a dark-brown header: a left control column (a prompt box, a 'Do Not Draw' toggle, 'Style' over a grid
// of preset squares with a 'See more' search row, then Seed Image, Images To Make and Aspect Ratio rows and the blue Generate button
// with 'Results in 2-5 seconds*') and, to its right, the result panel: an EMPTY WHITE box with a hairline #E5E7EB border, the same
// before and while it renders (no spinner, ring, percentage, bar, shimmer or status text), a three-icon toolbar under it, and the
// finished image placed into the very box in a single hard swap.
// Adapted to ten images: 'Images To Make' reads 10, and the panel holds ten square slots in a 4 + 4 + 2 block, each an empty white
// hairline box (the footage's one box, repeated) that is swapped for its picture in strict order. Omitted: the 'Buy credits ...' and
// 'Free daily limit ...' upsell lines, the Premium toggle and the credit rows, the site wordmark, and the thumbnail pictures of the
// style grid (plain labelled squares instead). The footage's pictures are never reproduced: every tile is our own meme, and no logo
// or platform font is drawn (plain squares, system type).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-hp';
const ROOT_H = 430, LEFT_W = 196, COLS = 4, GAP = 6;   // px
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #fff; color: #374151; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d6d9de; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 14px; height: 28px; padding: 0 14px; background: #3d2c27; font-size: 8.5px; font-weight: 600; color: #e9dcd6; white-space: nowrap; }
.${P}-top span:first-child { color: #fff; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 8px; width: ${LEFT_W}px; padding: 12px 14px 12px 14px; }
.${P}-lab { display: flex; align-items: center; justify-content: space-between; height: 13px; font-size: 8px; font-weight: 600; color: #374151; white-space: nowrap; }
.${P}-lab small { font-size: 7.5px; font-weight: 400; color: #6b7280; }
.${P}-lab u { text-decoration: none; font-size: 7.5px; font-weight: 400; color: #2563eb; }
.${P}-prompt { box-sizing: border-box; height: 40px; padding: 5px 7px; border-radius: 4px; box-shadow: inset 0 0 0 1px #d1d5db; font-size: 8px; line-height: 11px; color: #4b5563; overflow: hidden; }
.${P}-tog { position: relative; flex: none; width: 24px; height: 12px; border-radius: 6px; background: #e5e7eb; }
.${P}-tog::after { content: ""; position: absolute; left: 1px; top: 1px; width: 10px; height: 10px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 .5px #c8ccd2; }
.${P}-sty { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
.${P}-sty i { display: grid; place-items: end center; box-sizing: border-box; aspect-ratio: 1; padding-bottom: 3px; border-radius: 3px; background: #eceef2; box-shadow: inset 0 0 0 1px #e1e4e9; font-style: normal; font-size: 5.5px; line-height: 7px; color: #6b7280; text-align: center; }
.${P}-sty i.on { box-shadow: inset 0 0 0 1.5px #2563eb; }
.${P}-more { box-sizing: border-box; height: 18px; padding: 0 8px; border-radius: 4px; box-shadow: inset 0 0 0 1px #e5e7eb; font-size: 7.5px; line-height: 18px; color: #2563eb; }
.${P}-sel { box-sizing: border-box; height: 15px; padding: 0 6px; border-radius: 3px; box-shadow: inset 0 0 0 1px #d1d5db; font-size: 7.5px; line-height: 15px; color: #4b5563; white-space: nowrap; }
.${P}-go { margin-top: auto; flex: none; display: grid; place-items: center; height: 26px; border-radius: 4px; background: #2563eb; font-size: 9.5px; font-weight: 700; color: #fff; }
.${P}-note { flex: none; margin-top: -2px; font-size: 7px; text-align: center; color: #6b7280; }
.${P}-right { flex: 1; min-width: 0; box-sizing: border-box; padding: 12px 14px 12px 0; display: flex; flex-direction: column; gap: 8px; }
.${P}-panel { flex: 1; min-height: 0; box-sizing: border-box; padding: 8px; border-radius: 4px; background: #fff; box-shadow: inset 0 0 0 1px #e5e7eb; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; background: #fff; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; box-sizing: border-box; border-radius: 3px; background: #fff; box-shadow: inset 0 0 0 1px #e5e7eb; }
.${P}-tools { flex: none; display: flex; gap: 12px; height: 14px; }
.${P}-tools svg { width: 13px; height: 13px; fill: none; stroke: #9ca3af; stroke-width: 1.2; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'a legendary meme, studio lighting, high detail';
const GEN_AT = 0.04;     // the cursor presses Generate (it never changes label)
const ISSUE = 0.14;      // the result panel's ten empty slots take their hairline outlines
const STYLES = ['Photo 1', 'Art 10', '3D 1', 'Anime', 'Sketch', 'Pixel', 'Comic', 'Neon'];
const ICON = {
  down: '<svg viewBox="0 0 14 14"><path d="M7 2v7M4 6.5 7 9.5l3-3M2.5 12h9"/></svg>',
  edit: '<svg viewBox="0 0 14 14"><path d="M9.5 2.2 11.8 4.5 5 11.3 2.2 11.8l.5-2.8z"/></svg>',
  redo: '<svg viewBox="0 0 14 14"><path d="M11.5 7a4.5 4.5 0 1 1-1.4-3.2M11.5 2v2.8H8.7"/></svg>',
};

export default {
  id: 'hotpot',
  label: 'Hotpot.ai (2023)',
  source: {
    platform: 'Hotpot.ai AI Art Generator, hotpot.ai/art-generator (desktop browser, light theme; user screen recordings on YouTube, 2023-2024)',
    feature: "light two-column page: a left control column (prompt box, a Style preset grid, Seed Image / Images To Make / Aspect Ratio rows, a blue Generate button with 'Results in 2-5 seconds*') and a result panel that is an empty white hairline-bordered box before and while it renders (no spinner, percentage or status text) and then holds the finished image by a single hard swap (adapted to 10: ten empty hairline slots in a 4 + 4 + 2 block, each swapped for its picture in strict order; the credits and daily-limit upsells and the Premium toggle are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=oqbDEAzjU-Q', retrieved: '2026-10-14' }],
    extrapolated: "the ten-slot panel and its one-at-a-time landing (the footage shows a single box swapped once), the hairline outline drawn on each pending slot (the footage's idle and pending panels are indistinguishable, a bare hairline box), the labels on the style squares (the footage shows thumbnail pictures) and the prompt wording",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'hotpot');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend" style="visibility: hidden"></div></div>`;
    const styles = STYLES.map((n, i) => `<i${i === 0 ? ' class="on"' : ''}>${n}</i>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span>AI Image</span><span>AI Videos</span><span>AI Headshot</span><span>AI Editing</span></div><div class="${P}-body"><div class="${P}-left"><div class="${P}-lab">What To Draw?<u>AI Assist</u></div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-lab">Do Not Draw<i class="${P}-tog"></i></div><div class="${P}-lab">Style<small>Photo 1</small></div><div class="${P}-sty">${styles}</div><div class="${P}-more">See more</div><div class="${P}-lab">Seed Image<i class="${P}-tog"></i></div><div class="${P}-lab">Images To Make<span class="${P}-sel">10 &#9662;</span></div><div class="${P}-lab">Aspect Ratio<span class="${P}-sel">1:1 &#9662;</span></div><div class="${P}-go">Generate</div><div class="${P}-note">Results in 2-5 seconds*</div></div><div class="${P}-right"><div class="${P}-panel"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-tools">${ICON.down}${ICON.edit}${ICON.redo}</div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));
    const ends = tiles.map((_, i) => ctx.seq(i)[1]);   // slot i is swapped for its picture here: ten non-overlapping windows

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const s = t - ctx.cardIn;

        // Generate is pressed (the button stays a solid blue enabled button with its label unchanged)
        const gp = press(s, GEN_AT, 0.05, 0.04, 0.12);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        cells.forEach((c, i) => {
          const landed = t >= ends[i];
          put(`i${i}`, landed, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          put(`p${i}`, s >= ISSUE, (v) => { c.pend.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
