// A community-built text-to-image generator on perchance.org, 'AI Photo Generator' (YouTube jwM0ZoOWUmE, How To Helper, 2025-07-16,
// t~16-120 s; spec .tmp/clone-9e82faf1/reveal-refs/perchance/spec.json, confidence 0.74; frames t_001_prompt.png, t_002_pending_starting.png,
// t_003_pending_proc_wait.png, t_004_partial.png, pending_sheet.png). A near-black (#1a1a1a) single centred column: a title, a prompt card
// (a 'Description' box, three small selects 'Add shot / Add color / Add effect', an 'Anti-Description (optional)' field, an 'Art Style'
// and a 'Shape' select) and a gold 'generate' button. Pressing it turns the empty-state line into a grid of flat dark-grey tiles with a
// thin lighter border, each with a small white ring spinner and ONE status word, and the words are the queue: every tile starts on
// 'Starting...', then the tiles still waiting read 'Waiting...' or 'Preparing...' beside the one 'Processing...', and each tile hard-swaps
// to its finished photo (no blur, no fade, no percentage). One tile in the footage also carried the sub-line 'Verification in progress...'.
// Adapted to ten images: the footage's batch is four tiles in two columns that scroll; here ten tiles in a 5 x 2 block that fits one
// fixed-height card, landing one by one in reading order, the queue words following the next tiles in line (Processing... for the next
// to land, Preparing... for the two behind it, Waiting... beyond). Omitted: the title's emoji, the per-tile 'persona / chat' footer
// text (kept as plain dim bars), the 'show private gallery' link and the footage's own photos: every tile is our own meme.
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pch';
const ROOT_H = 440, COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; align-items: center; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 20px; border-radius: 12px; background: #1a1a1a; color: #d0d0d0; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2c2c2c; }
.${P}-ttl { flex: none; display: flex; align-items: center; justify-content: center; width: 100%; height: 30px; font-size: 11px; font-weight: 700; color: #ececec; white-space: nowrap; }
.${P}-card { flex: none; box-sizing: border-box; width: 410px; padding: 8px 10px 9px; border-radius: 4px; background: #212121; box-shadow: inset 0 0 0 1px #333; }
.${P}-lab { height: 10px; font-size: 6.5px; line-height: 10px; color: #9aa0a6; white-space: nowrap; }
.${P}-ta { box-sizing: border-box; height: 32px; margin-top: 2px; padding: 4px 6px; border-radius: 3px; background: #2a2a2a; box-shadow: inset 0 0 0 1px #3a3a3a; font-size: 7.5px; line-height: 11px; color: #e2e2e2; overflow: hidden; }
.${P}-row { display: flex; gap: 4px; margin-top: 5px; }
.${P}-sel { flex: 1; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 15px; padding: 0 5px; border-radius: 3px; background: #2a2a2a; box-shadow: inset 0 0 0 1px #3a3a3a; font-size: 6.5px; color: #b8b8b8; white-space: nowrap; }
.${P}-sel svg { width: 6px; height: 6px; fill: none; stroke: #9aa0a6; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-fld { flex: 1.6; display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.${P}-fld i { display: block; box-sizing: border-box; height: 14px; padding: 0 5px; border-radius: 3px; background: #2a2a2a; box-shadow: inset 0 0 0 1px #3a3a3a; font-style: normal; font-size: 6px; line-height: 14px; color: #6f7378; white-space: nowrap; overflow: hidden; }
.${P}-go { flex: none; display: flex; align-items: center; justify-content: center; gap: 4px; width: 78px; height: 22px; margin: 9px 0 0; border-radius: 3px; background: linear-gradient(180deg, #e0b43a, #c79a1f); font-size: 9px; font-weight: 600; color: #231a02; align-self: center; }
.${P}-go svg { width: 8px; height: 8px; fill: #231a02; }
.${P}-body { position: relative; flex: none; width: 520px; margin-top: 12px; height: 222px; }
.${P}-es { position: absolute; left: 0; right: 0; top: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 70px; font-size: 8px; color: #8a8f94; }
.${P}-es small { font-size: 6.5px; color: #6a6f74; }
.${P}-g { position: absolute; left: 0; right: 0; top: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 8px ${GAP}px; }
.${P}-c { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.${P}-t { position: relative; aspect-ratio: 1; overflow: hidden; background: #2b2b2b; box-shadow: inset 0 0 0 1px #3a3a3a; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #2b2b2b; box-shadow: inset 0 0 0 1px #3a3a3a; }
.${P}-st { display: flex; align-items: center; justify-content: center; gap: 4px; }
.${P}-ring { flex: none; display: block; width: 11px; height: 11px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(240, 240, 240, 0) 0deg, #f0f0f0 300deg, rgba(240, 240, 240, 0) 360deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); }
.${P}-w { font-size: 8px; color: #9aa0a6; white-space: nowrap; }
.${P}-sub { font-size: 5.8px; color: #7d8288; white-space: nowrap; }
.${P}-ft { display: flex; justify-content: space-between; height: 5px; }
.${P}-ft i { display: block; height: 5px; border-radius: 1px; background: #262626; box-shadow: inset 0 0 0 1px #303030; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, big eyes, happy.';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                               // the cursor presses generate
const ISSUE = 0.16;                                // the empty-state line gives way to ten tiles, all 'Starting...'
const STARTING = 0.22;                             // how long every tile reads 'Starting...' before the queue words take over
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.13);   // tile i lands (reading order), the last at 1.79

// the queue word of a pending tile: every tile starts, then the next tile in line processes, the two behind it prepare, the rest wait
const word = (s, i) => {
  if (s < ISSUE + STARTING) return 'Starting...';
  let ahead = 0;
  for (let j = 0; j < i; j++) if (s < LAND[j]) ahead++;
  return ahead === 0 ? 'Processing...' : ahead <= 2 ? 'Preparing...' : 'Waiting...';
};

export default {
  id: 'perchance',
  label: 'Perchance AI Photo Generator (2025)',
  source: {
    platform: "a community-built generator on perchance.org, 'AI Photo Generator' (perchance.org/ai-photo-generator, desktop browser, dark theme; a third-party screen recording on YouTube, 2025-07-16)",
    feature: "near-black centred column: a prompt card and a gold 'generate' button, under it flat dark-grey tiles each with a white ring spinner and one queue word ('Starting...', then 'Waiting...' / 'Preparing...' beside 'Processing...'), each tile hard-swapping to its photo (adapted to 10: a 5 x 2 block landing in reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=jwM0ZoOWUmE', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=wvgrQnHYsr0', retrieved: '2026-10-14' },
    ],
    extrapolated: "the footage's batch is four tiles in two columns whose words were sampled in a few frames; the exact order and timing of the words, the ten-tile 5 x 2 block and the landing in reading order are inferred (the real batch landed in the order the server finished)",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'perchance');
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const cell = (g, i) => `<div class="${P}-c"><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><div class="${P}-st"><i class="${P}-ring"></i><span class="${P}-w">Starting...</span></div>${i === 9 ? `<span class="${P}-sub">Verification in progress...</span>` : ''}</div></div><div class="${P}-ft"><i style="width: 38%"></i><i style="width: 10%"></i></div></div>`;
    const star = '<svg viewBox="0 0 12 12"><path d="M6 0.5l1.4 4.1 4.1 1.4-4.1 1.4L6 11.5 4.6 7.4 0.5 6l4.1-1.4z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-ttl">AI Photo Generator</div><div class="${P}-card"><div class="${P}-lab">Description</div><div class="${P}-ta">${x.esc(PROMPT)}</div><div class="${P}-row"><div class="${P}-sel">Add shot${chev}</div><div class="${P}-sel">Add color${chev}</div><div class="${P}-sel">Add effect${chev}</div></div><div class="${P}-row"><div class="${P}-fld"><div class="${P}-lab">Anti-Description (optional)</div><i>things you don't want in the image</i></div><div class="${P}-fld"><div class="${P}-lab">Art Style</div><div class="${P}-sel">Casual Photo${chev}</div></div><div class="${P}-fld"><div class="${P}-lab">Shape</div><div class="${P}-sel">Square${chev}</div></div></div></div><div class="${P}-go">${star}generate</div><div class="${P}-body"><div class="${P}-es">Add a description, then click generate<small>This generator was made using the generator builder</small></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div>`);
    const q = (s) => root.querySelector(s);
    const go = q(`.${P}-go`), es = q(`.${P}-es`), grid = q(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), w: n.querySelector(`.${P}-w`), ring: n.querySelector(`.${P}-ring`), sub: n.querySelector(`.${P}-sub`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // generate is pressed (it never changes label)
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });

        // the empty-state line gives way to the ten tiles
        put('iss', s >= ISSUE, (v) => { es.style.display = v ? 'none' : ''; grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`i${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; c.pend.style.display = v ? 'none' : ''; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          if (!done) {
            const w = word(s, i);
            put(`w${i}`, w, (v) => { c.w.textContent = v; if (c.sub) c.sub.style.visibility = v === 'Starting...' ? '' : 'hidden'; });
            // the ring turns with t (its phase differs per tile); a function of t alone
            const deg = (((t * 480 + i * 53) % 360) + 360) % 360;
            put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
          }
        });
      },
    };
  },
};
