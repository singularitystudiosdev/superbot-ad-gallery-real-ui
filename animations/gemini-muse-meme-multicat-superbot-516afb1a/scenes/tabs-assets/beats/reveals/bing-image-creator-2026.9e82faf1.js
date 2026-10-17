// Bing Image Creator as it is in 2026, www.bing.com/images/create (a 640x360 YouTube screen recording, WoC9SFWVbGI, 2026-09-23, t~95-134 s;
// spec .tmp/clone-9e82faf1/reveal-refs/microsoft-designer/spec.json, confidence 0.55: that folder is named for Microsoft Designer, but its
// footage is this page; frames r_woc_t95.png, r_woc_t122.png, r_woc_t134.png, r_woc_strip.png). A near-black page (about #0E1216): a slim
// row of section chips with 'Create' selected, an 'Image | Video' switch, the heading 'Transform Ideas into Reality with AI Creations' ('AI
// Creations' in blue italics), ONE large composer (the prompt with a clear 'x', a 'Mode: Vivid storytelling' chip, an 'Aspect ratio: 1:1'
// chip, a paperclip and the submit control). Submitting swaps the page for a result canvas where the picture slot is a dark rounded 1:1
// tile (about #232834) with a thin lavender-grey circular arc turning in its middle and, under it, the one fixed line 'We are generating
// the image for you...'; there is no percentage, no countdown, no bar, no shimmer and no blur, and the finished picture simply replaces
// the tile. Results carry 'Created by MAI-Image-2e' at the bottom right, and 'Set as wallpaper / Share / Download' light up under them.
// This is not the 2023 'bing-image-creator' module (a warm dark page with a pink 'Create' pill, a magenta bar, a Tip card and 2 x 2
// grids snapping in) nor 'copilot' (a navy chat with a status line and grey squares).
// Adapted to ten images: the canvas under the composer is a five-by-two block of ten dark 1:1 tiles, each with its arc and caption,
// resolving in strict reading order (a tile's cover thins away onto its picture), the 'Created by MAI-Image-2e' line appearing with the
// first result and the action row lighting up once the tenth has landed. Omitted: the browser chrome, the Microsoft mark, the credit badge's
// icon, the 'Get started with templates' rail, the 'Recent' strip and the 'Hide failed' toggle. The footage's pictures are never reproduced:
// every tile is our own meme, and no logo, wordmark or platform font is drawn (plain text in the system stack, a plain arc).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-b26';
const ROOT_H = 446, COLS = 5, GAP = 4;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 0 18px 10px; border-radius: 12px; background: #0e1216; color: #e8e9ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d232b; }
.${P}-nav { flex: none; display: flex; align-items: center; gap: 4px; height: 30px; font-size: 7px; font-weight: 600; letter-spacing: .03em; color: #9aa1ab; white-space: nowrap; }
.${P}-nav span { box-sizing: border-box; height: 17px; padding: 0 7px; border-radius: 9px; line-height: 17px; }
.${P}-nav .on { background: #262a31; color: #f2f3f5; }
.${P}-nav b { margin-left: auto; font-size: 8px; color: #c9ccd2; }
.${P}-sw { flex: none; display: flex; align-self: center; gap: 4px; margin-top: 4px; }
.${P}-sw span { box-sizing: border-box; height: 18px; padding: 0 11px; border-radius: 9px; font-size: 8px; line-height: 18px; color: #aab0ba; box-shadow: inset 0 0 0 1px #2b313b; }
.${P}-sw .on { background: #1d2a44; color: #e6eeff; box-shadow: inset 0 0 0 1px #3b5fa8; }
.${P}-h { flex: none; margin-top: 9px; font-size: 15px; font-weight: 700; line-height: 20px; text-align: center; color: #f5f6f8; white-space: nowrap; }
.${P}-h i { font-weight: 600; color: #5b9bff; }
.${P}-cmp { flex: none; box-sizing: border-box; height: 82px; margin-top: 10px; padding: 9px 12px 8px; border-radius: 12px; background: #171b22; box-shadow: inset 0 0 0 1px #2b313b; }
.${P}-pr { position: relative; height: 34px; padding-right: 16px; font-size: 9.5px; line-height: 14px; color: #e3e5e9; overflow: hidden; }
.${P}-clr { position: absolute; right: 0; top: 1px; display: grid; place-items: center; width: 11px; height: 11px; border-radius: 50%; background: #3a404a; font-size: 7px; line-height: 1; color: #d5d8de; }
.${P}-ctl { display: flex; align-items: center; gap: 12px; height: 24px; margin-top: 3px; font-size: 8px; color: #b7bcc5; white-space: nowrap; }
.${P}-ctl svg { flex: none; width: 7px; height: 7px; margin-left: 3px; fill: none; stroke: #9aa1ab; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ctl .clip { margin-left: auto; width: 11px; height: 11px; stroke: #8d949e; }
.${P}-go { flex: none; display: grid; place-items: center; box-sizing: border-box; height: 21px; padding: 0 13px; border-radius: 11px; background: #4f7ff0; font-size: 8.5px; font-weight: 600; color: #fff; }
.${P}-go.off { background: #3a3e48; color: #9096a1; }
.${P}-cv { flex: none; margin-top: 12px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #232834; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 0 9px; background: #232834; }
.${P}-arc { display: block; flex: none; width: 15px; height: 15px; box-sizing: border-box; border-radius: 50%; border: 1.7px solid #c9c7d6; border-left-color: transparent; }
.${P}-pend span { font-size: 6.5px; line-height: 9px; text-align: center; color: #e8e8ea; }
.${P}-ft { flex: none; display: flex; align-items: center; height: 22px; margin-top: 6px; font-size: 7.5px; color: #5d636d; white-space: nowrap; }
.${P}-ft s { text-decoration: none; margin-right: 12px; }
.${P}-ft.ready s { color: #c3c7ce; }
.${P}-ft em { margin-left: auto; font-style: normal; color: #7d8490; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bright colours, high detail.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses Generate
const ISSUE = 0.16;                               // the canvas fills with the ten dark placeholder tiles
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hands its arc over to the picture (reading order), the last at 1.68
const FADE = 0.06;                                // the cover thins away over this long before the picture lands
const CHEV = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
const CLIP = '<svg class="clip" viewBox="0 0 12 12"><path d="M9.5 5.5 5.2 9.8a2.1 2.1 0 0 1-3-3l4.6-4.6a1.4 1.4 0 0 1 2 2L4.4 8.7a.7.7 0 0 1-1-1l4-4"/></svg>';

export default {
  id: 'bing-image-creator-2026',
  label: 'Bing Image Creator (2026)',
  source: {
    platform: 'Bing Image Creator web, www.bing.com/images/create in 2026 (dark theme; a YouTube screen-recording tutorial, 2026-09-23; the page footer credits the model as MAI-Image-2e)',
    feature: "near-black page: the heading 'Transform Ideas into Reality with AI Creations', one large composer with 'Mode: Vivid storytelling' and 'Aspect ratio: 1:1' controls and a Generate button; pending = dark rounded 1:1 placeholder tiles each with a thin turning arc and the fixed line 'We are generating the image for you...' (no percentage, bar, shimmer or blur); results swap in with 'Created by MAI-Image-2e' under them (adapted to 10: a five-by-two block of ten tiles resolving in strict reading order; the browser chrome, templates rail and Recent strip are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=WoC9SFWVbGI', retrieved: '2026-10-14' }],
    extrapolated: ['the ten-tile canvas (the footage shows one placeholder and a one- or two-up result)', "the composer and the canvas sharing one screen (the footage swaps the composer for a result view with a right-hand 'Mode' / 'Aspect Ratio' panel)", "the Set as wallpaper / Share / Download row lighting up at the end (read from the footage's final frames, not from the pending state)"],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'bing-image-creator-2026');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-arc"></i><span>We are generating the image for you...</span></div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><span>ALL</span><span>SEARCH</span><span>IMAGES</span><span class="on">Create</span><span>INSPIRATION</span><span>COLLECTIONS</span><span>VIDEOS</span><b>60</b></div><div class="${P}-sw"><span class="on">Image</span><span>Video</span></div><div class="${P}-h">Transform Ideas into Reality with <i>AI Creations</i></div><div class="${P}-cmp"><div class="${P}-pr">${x.esc(PROMPT)}<i class="${P}-clr">×</i></div><div class="${P}-ctl"><span>Mode: Vivid storytelling${CHEV}</span><span>Aspect ratio: 1:1${CHEV}</span>${CLIP}<div class="${P}-go">Generate</div></div></div><div class="${P}-cv"><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-ft"><s>Set as wallpaper</s><s>Share</s><s>Download</s><em style="visibility: hidden">Created by MAI-Image-2e</em></div></div>`);
    const go = root.querySelector(`.${P}-go`), grid = root.querySelector(`.${P}-g`), ft = root.querySelector(`.${P}-ft`), by = root.querySelector(`.${P}-ft em`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), arc: n.querySelector(`.${P}-arc`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Generate is pressed and greys while the canvas works; it never changes label
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        put('busy', s >= GEN_AT + 0.04 && s < LAND[9], (v) => { go.className = `${P}-go${v ? ' off' : ''}`; });

        // the canvas fills with the ten dark tiles
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? '' : 'hidden'; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the arc turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 400 + i * 41) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.arc.style.transform = `rotate(${d}deg)`; });
        });

        // the model credit appears with the first result; the action row lights up once the tenth has landed
        put('by', s >= LAND[0], (v) => { by.style.visibility = v ? '' : 'hidden'; });
        put('rdy', s >= LAND[9], (v) => { ft.className = `${P}-ft${v ? ' ready' : ''}`; });
      },
    };
  },
};
