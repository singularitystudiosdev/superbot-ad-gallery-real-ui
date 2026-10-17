// Copilot inside Microsoft PowerPoint (Windows desktop), image generation in the docked task pane (a 1280x720 uncut screen recording on
// YouTube, 'Create AI Images in PowerPoint', published 2026-03-10, t~64-126 s; spec .tmp/clone-9e82faf1/reveal-refs/powerpoint-copilot/spec.json,
// confidence 0.74; frames x_ppt_t88.jpg, x_ppt_t104.jpg, x_ppt_t122.jpg). The whole PowerPoint window: a title bar, the ribbon with
// 'Insert' open, a slide-thumbnail rail, the open slide, and on the right edge a white Copilot task pane (header with menu, a small
// shield, 'new chat', '...' and a close cross; a 'Today' divider; the user's prompt as plain text; an author label 'Copilot'; one status
// line; the image tile; at the foot a rounded 'Message Copilot' composer and the note 'AI-generated content may be incorrect'). Pressing
// send makes the status line cycle 'Reviewing the data...' -> 'Creating image...' -> 'Working on it...' -> 'This might take a
// moment...' -> 'Adding final touches...', while a rounded placeholder tile (a soft blue-grey gradient, no spinner, no percentage, no
// bar) turns into a heavily blurred preview of the picture and the preview sharpens into the finished image; the status line then clears.
// Not the copilot.microsoft.com web chat (the 'copilot' module): that is a dark chat page with an ellipsis status; this one is the light
// Office window with the pane docked.
// Adapted to ten images: the pane holds ten rounded tiles in a 4 + 4 + 2 block, each one a gradient that gives way to its blurred
// preview and then sharpens, one after another in strict reading order (the status line's four phrases step through from render(t)); the
// slide beside the pane is a neutral wireframe. Omitted: the ribbon's real commands (plain labelled boxes stand in), the Copilot and
// Microsoft marks (a plain outlined square is the author glyph), the follow-up chips and the agent suggestion above the composer, and the
// footage's own deck and picture; every tile is our own meme, and no logo, wordmark or platform font is drawn.
import { seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ppc';
const ROOT_H = 480, PANE_W = 252, COLS = 4, GAP = 4;
const ACC = '#c43e1c';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #f3f3f3; color: #242424; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #cfcfcf; }
.${P}-ttl { flex: none; position: relative; display: flex; align-items: center; height: 22px; padding: 0 8px; font-size: 8px; color: #444; }
.${P}-ttl b { position: absolute; left: 0; right: 0; text-align: center; font-weight: 400; white-space: nowrap; }
.${P}-qa { display: flex; gap: 5px; }
.${P}-qa i { display: block; width: 8px; height: 8px; border-radius: 2px; box-shadow: inset 0 0 0 1.2px #7a7a7a; }
.${P}-wc { position: relative; margin-left: auto; display: flex; gap: 14px; }
.${P}-wc i { display: block; width: 8px; height: 8px; box-shadow: inset 0 -1.2px 0 #555; }
.${P}-wc i:nth-child(2) { box-shadow: inset 0 0 0 1.2px #555; }
.${P}-wc i:nth-child(3) { background: linear-gradient(45deg, transparent 45%, #555 45%, #555 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, #555 45%, #555 55%, transparent 55%); box-shadow: none; }
.${P}-tabs { flex: none; display: flex; align-items: flex-end; gap: 12px; height: 20px; padding: 0 12px; font-size: 8px; color: #444; white-space: nowrap; }
.${P}-tabs span { box-sizing: border-box; height: 18px; line-height: 16px; }
.${P}-tabs .on { color: ${ACC}; box-shadow: inset 0 -2px 0 ${ACC}; font-weight: 600; }
.${P}-rib { flex: none; display: flex; align-items: center; gap: 10px; height: 44px; padding: 0 12px; background: #fbfbfb; box-shadow: 0 1px 0 #dcdcdc, 0 -1px 0 #e4e4e4; }
.${P}-rg { display: flex; flex-direction: column; align-items: center; gap: 3px; font-size: 6.5px; line-height: 8px; color: #555; white-space: nowrap; }
.${P}-rg i { display: block; width: 18px; height: 16px; border-radius: 3px; background: #d6dbe0; }
.${P}-rg.hot { padding: 3px 5px 2px; margin: -3px 0; border-radius: 4px; background: #e8ecf1; box-shadow: inset 0 0 0 1px #b9c3cf; }
.${P}-rg.hot i { background: #a9b9ca; }
.${P}-rs { align-self: stretch; width: 1px; margin: 6px 0; background: #e0e0e0; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; display: flex; flex-direction: column; gap: 7px; width: 48px; padding: 9px 7px; background: #efefef; }
.${P}-th { position: relative; box-sizing: border-box; flex: none; height: 28px; border-radius: 2px; background: #fff; box-shadow: 0 0 0 1px #d2d2d2; }
.${P}-th::after { content: ""; position: absolute; left: 4px; right: 12px; top: 6px; height: 3px; border-radius: 1px; background: #bfc7d1; box-shadow: 0 6px 0 #dde1e6, 0 11px 0 #dde1e6; }
.${P}-th.on { box-shadow: 0 0 0 2px ${ACC}; }
.${P}-cv { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; padding: 0 10px; background: #e6e6e6; }
.${P}-sl { position: relative; box-sizing: border-box; width: 100%; aspect-ratio: 16 / 9; border-radius: 2px; background: #fff; box-shadow: 0 1px 4px rgba(0, 0, 0, .18); }
.${P}-sl b { position: absolute; left: 10%; top: 12%; font-size: 9px; line-height: 12px; font-weight: 600; color: #2a5db0; white-space: nowrap; }
.${P}-sl i { position: absolute; left: 10%; right: 10%; top: 38%; bottom: 12%; border-radius: 3px; box-shadow: inset 0 0 0 1px #c9ced6; background: linear-gradient(160deg, #f4f6f9, #e9edf2); }
.${P}-pane { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANE_W}px; padding: 6px 10px 8px; background: #fff; box-shadow: -1px 0 0 #d9d9d9; }
.${P}-ph { flex: none; display: flex; align-items: center; gap: 7px; height: 24px; }
.${P}-mn { display: flex; flex-direction: column; gap: 2.5px; width: 10px; }
.${P}-mn i { display: block; height: 1.2px; border-radius: 1px; background: #555; }
.${P}-sh { display: block; width: 8px; height: 9px; border-radius: 2px 2px 5px 5px; box-shadow: inset 0 0 0 1.3px #3a9a4c; }
.${P}-nw { margin-left: auto; display: grid; place-items: center; width: 19px; height: 19px; border-radius: 5px; background: #d13a1c; }
.${P}-nw i { display: block; width: 7px; height: 7px; border-radius: 1.5px; box-shadow: inset 0 0 0 1.3px #fff; }
.${P}-dt { font-size: 10px; letter-spacing: 1px; color: #666; line-height: 10px; }
.${P}-x { position: relative; width: 9px; height: 9px; margin-left: 4px; }
.${P}-x::before, .${P}-x::after { content: ""; position: absolute; left: 4px; top: -1px; width: 1.2px; height: 11px; background: #444; transform: rotate(45deg); }
.${P}-x::after { transform: rotate(-45deg); }
.${P}-day { flex: none; display: flex; align-items: center; gap: 6px; margin-top: 4px; height: 12px; font-size: 7.5px; color: #777; }
.${P}-day::after { content: ""; flex: 1; height: 1px; background: #ececec; }
.${P}-usr { flex: none; margin: 8px 0 0 6px; height: 28px; font-size: 8.5px; line-height: 13px; color: #3a3f44; overflow: hidden; }
.${P}-au { flex: none; display: flex; align-items: center; gap: 5px; margin-top: 8px; height: 14px; font-size: 9px; font-weight: 600; color: #242424; }
.${P}-au i { display: block; width: 10px; height: 10px; border-radius: 3px; box-shadow: inset 0 0 0 1.3px #555; }
.${P}-st { flex: none; height: 18px; margin-top: 3px; font-size: 10px; line-height: 18px; color: #424242; white-space: nowrap; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 5px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 6px; overflow: hidden; background: #b4c4d2; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cov { position: absolute; inset: 0; }
.${P}-cmp { flex: none; display: flex; align-items: center; gap: 6px; box-sizing: border-box; height: 32px; margin-top: auto; padding: 0 5px 0 10px; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px #d4d4d4, 0 1px 3px rgba(0, 0, 0, .08); }
.${P}-cmp span { flex: 1; min-width: 0; font-size: 9px; color: #7a7a7a; white-space: nowrap; }
.${P}-cmp em { font-style: normal; font-size: 7px; color: #777; white-space: nowrap; }
.${P}-cmp b { flex: none; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; background: #d13a1c; }
.${P}-cmp b i { display: block; width: 7px; height: 7px; border-radius: 1.5px; background: #fff; }
.${P}-cmp b.idle { background: #e4e4e4; }
.${P}-cmp b.idle i { width: 6px; height: 6px; border-radius: 0; background: none; border-top: 1.6px solid #8a8a8a; border-right: 1.6px solid #8a8a8a; transform: rotate(45deg) translate(-1px, 1px); }
.${P}-ft { flex: none; margin-top: 5px; height: 9px; font-size: 6.5px; line-height: 9px; text-align: center; color: #7a7a7a; }
`;

const PROMPT = 'Generate 10 images of a muse holding a handwritten note, meme style, bright colours';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.12;                               // the placeholder tiles drop in ('Creating image...')
const LAND = Array.from({ length: 10 }, (_, i) => 0.5 + i * 0.1489);   // tile i is sharp (reading order, strictly one after another), the last at 1.84
const WIN = 0.14;                                 // one tile's gradient -> blurred preview -> sharp, ending at its landing (shorter than the step, so windows never overlap)
const BLUR = 15;                                  // a preview's blur at its heaviest, px
const STATUS = [[-Infinity, 'Reviewing the data...'], [ISSUE, 'Creating image...'], [0.58, 'Working on it...'], [1.0, 'This might take a moment...'], [1.42, 'Adding final touches...'], [LAND[9], '']];

// each placeholder's soft blue-grey field (deterministic: seeded hash, no Math.random)
const field = (i) => {
  const h = (n) => hash(11, i * 4 + n);
  return `radial-gradient(90% 70% at ${(25 + h(0) * 50).toFixed(0)}% ${(15 + h(1) * 25).toFixed(0)}%, #e1e9ef, transparent 75%), linear-gradient(180deg, hsl(${(207 + h(2) * 8).toFixed(0)} 24% ${(66 + h(3) * 6).toFixed(0)}%), hsl(208 22% 58%))`;
};

export default {
  id: 'powerpoint-copilot',
  label: 'PowerPoint Copilot (2025)',
  source: {
    platform: "Microsoft PowerPoint for desktop (Windows) with the Copilot task pane docked on the right (a 1280x720 uncut screen recording on YouTube, published 2026-03-10; light theme)",
    feature: "the pane's one status line cycling 'Reviewing the data...' -> 'Creating image...' -> 'Working on it...' -> 'This might take a moment...' -> 'Adding final touches...' over a rounded soft blue-grey placeholder that becomes a blurred preview and sharpens into the picture, then the line clears (adapted to 10: ten tiles in the pane in a 4 + 4 + 2 block, each going gradient -> blurred preview -> sharp in strict reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=OvjdOLAMfo0', retrieved: '2026-10-14' }],
    extrapolated: "The footage shows ONE image per request, a pane-wide tile that sharpens over about 40 s: the 4 + 4 + 2 block of ten, each tile's short gradient -> preview -> sharp window, the strict one-after-another order, the pane's tile size and every timing (status phrases at 0.58, 1.0 and 1.42 layout seconds) are extrapolated. The slide and the ribbon are neutral stand-ins; the footage's deck, its blue title and the ribbon's real commands are not reproduced.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'powerpoint-copilot');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-cov" style="background: ${field(i)}"></div></div>`;
    const grp = (name, hot) => `<div class="${P}-rg${hot ? ' hot' : ''}"><i></i>${name}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-ttl"><div class="${P}-qa"><i></i><i></i><i></i></div><b>Muse memes deck - Saved to this PC</b><div class="${P}-wc"><i></i><i></i><i></i></div></div><div class="${P}-tabs"><span>File</span><span>Home</span><span class="on">Insert</span><span>Draw</span><span>Design</span><span>Transitions</span><span>Animations</span><span>Slide Show</span><span>Review</span><span>View</span></div><div class="${P}-rib">${grp('New Slide')}${grp('Table')}<div class="${P}-rs"></div>${grp('Pictures', true)}${grp('Shapes')}${grp('Icons')}${grp('3D Models')}<div class="${P}-rs"></div>${grp('Text Box')}${grp('Header')}${grp('Symbols')}</div><div class="${P}-body"><div class="${P}-rail"><div class="${P}-th on"></div><div class="${P}-th"></div><div class="${P}-th"></div></div><div class="${P}-cv"><div class="${P}-sl"><b>Muse memes</b><i></i></div></div><div class="${P}-pane"><div class="${P}-ph"><div class="${P}-mn"><i></i><i></i><i></i></div><span class="${P}-sh"></span><div class="${P}-nw"><i></i></div><span class="${P}-dt">...</span><span class="${P}-x"></span></div><div class="${P}-day">Today</div><div class="${P}-usr">${x.esc(PROMPT)}</div><div class="${P}-au"><i></i>Copilot</div><div class="${P}-st"></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div><div class="${P}-cmp"><span>Message Copilot</span><em>Start dictation</em><b class="${P}-snd"><i></i></b></div><div class="${P}-ft">AI-generated content may be incorrect</div></div></div></div>`);
    const snd = root.querySelector(`.${P}-snd`);
    const st = root.querySelector(`.${P}-st`), grid = root.querySelector(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cov: n.querySelector(`.${P}-cov`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the status line: one fixed phrase per phase, cleared once the last tile is sharp
        let msg = '';
        for (const [from, txt] of STATUS) if (s >= from) msg = txt;
        put('st', msg, (v) => { st.textContent = v; });
        // the composer's round button is the red stop square while Copilot works and the idle grey send arrow once the last tile has landed
        put('snd', s >= LAND[9], (idle) => { snd.classList.toggle('idle', idle); });
        put('iss', s >= ISSUE, (v) => { grid.style.visibility = v ? 'visible' : 'hidden'; });

        cells.forEach((c, i) => {
          // p: 0 = still the gradient, then the blurred preview forms under it, then the blur eases away, 1 = sharp and landed
          const p = seg(s, LAND[i] - WIN, LAND[i]);
          put(`c${i}`, p.toFixed(3), () => {
            c.im.style.transform = restTransform(c.g);
            if (p >= 1) {
              c.im.style.visibility = 'visible';
              c.im.style.filter = restFilter(c.g);
              c.cov.style.display = 'none';
              c.cov.style.opacity = '';
              return;
            }
            const form = seg(p, 0, 0.35), sharp = outCubic(seg(p, 0.35, 1));
            c.im.style.visibility = p > 0 ? 'visible' : 'hidden';
            c.im.style.filter = `blur(${(BLUR * (1 - sharp)).toFixed(2)}px) ${c.g.grade || ''}`.trim();
            c.cov.style.display = '';
            c.cov.style.opacity = (p < 0.35 ? 1 - 0.55 * form : 0.45 * (1 - sharp)).toFixed(3);
          });
        });
      },
    };
  },
};
