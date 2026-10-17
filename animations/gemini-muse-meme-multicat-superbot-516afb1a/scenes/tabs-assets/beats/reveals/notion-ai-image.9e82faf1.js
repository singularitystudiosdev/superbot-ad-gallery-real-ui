// Notion, the 'Add an image' block's AI image generation, as screen-recorded in 'Notion AI Just Got a POWERFUL New Upgrade for Images' (YouTube
// MA_eZEp18nw, published 2026-02-02, 1080p, t~12.5-24 s; spec .tmp/clone-9e82faf1/reveal-refs/notion-ai-image/spec.json, confidence 0.62; frames
// ae_prompt_form, ae_pending_teaching, ae_pending_dimensions, ae_pending_noise, ae_land_editai). Pressing the prompt field's send button collapses
// the image block into a pale (#f1f1ef) full-width rounded status bar, ~40 px tall, holding a small hand-drawn doodle glyph that redraws itself
// in a loop and a grey (#9b9a97) italic phrase that rotates every few seconds ('Teaching colors to behave...', 'Spinning up extra dimensions...',
// 'Massaging the noise into art...', 'Tuning the aesthetic vibes...', 'Calibrating quantum pixels...'). There is no progress bar, percentage,
// spinner ring or queue label (the presenter remarks on it); the bar sits where the block was, so the page does not shift. The finished picture
// then hard-swaps into the block at the page's content width, and hovering it brings an 'Edit with AI' pill (the doodle glyph and the words).
// Adapted to ten images: the page's single image block becomes a 5 x 2 block of ten pictures dropping in strictly one after another in reading
// order, no fade; the status bar keeps its place above them, its glyph redrawing and its phrase rotating from render(t) until the last picture has
// landed, when the 'Edit with AI' pill takes the bar's row. Omitted: the prompt field with its style menu and send button, the 'Beta' chip, the
// '6%' ring badge, the feedback popover, the presenter's face-cam and the footage's own picture. The page is a bare heading in the system type;
// no Notion logo or wordmark is drawn, and the glyph is a plain line doodle of our own.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-nai';
const ROOT_H = 372, COLS = 5, GAP = 6;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; padding: 26px 28px 0; border-radius: 10px; background: #fffffe; color: #37352f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #ebebe9; }
.${P}-h { flex: none; height: 36px; font-size: 21px; line-height: 36px; font-weight: 700; letter-spacing: -.2px; color: #37352f; white-space: nowrap; }
.${P}-row { position: relative; flex: none; height: 40px; margin-top: 10px; }
.${P}-bar { position: absolute; inset: 0; display: flex; align-items: center; gap: 12px; padding: 0 14px; border-radius: 6px; background: #f1f1ef; }
.${P}-bar svg, .${P}-edit svg { display: block; flex: none; width: 18px; height: 18px; fill: none; stroke: #7d7c78; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-bar em { font-size: 11px; font-style: italic; color: #9b9a97; white-space: nowrap; }
.${P}-edit { position: absolute; right: 0; top: 6px; display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px 0 8px; border-radius: 6px; background: #fff; box-shadow: 0 0 0 1px #e3e2e0, 0 1px 3px rgba(15, 15, 15, .08); font-size: 9px; font-weight: 500; color: #787774; white-space: nowrap; }
.${P}-edit svg { width: 14px; height: 14px; }
.${P}-g { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 0.85; border-radius: 3px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
`;

// the doodle: one small sketch redrawn in four strokes-in-progress states, looped (a wavy hand-drawn stroke and a dot, as in the footage's glyph)
const DOODLE = [
  '<path d="M4 6.5c2.4-3.4 6.8-3.2 6.4.3-.4 3.2-4.6 4.4-5.4 8.4 2.6-.6 6.6-1.2 9-1.4"/>',
  '<path d="M4 6.5c2.4-3.4 6.8-3.2 6.4.3-.4 3.2-4.6 4.4-5.4 8.4 2.6-.6 6.6-1.2 9-1.4"/><circle cx="13.6" cy="5.4" r=".9"/>',
  '<path d="M4 6.5c2.4-3.4 6.8-3.2 6.4.3-.4 3.2-4.6 4.4-5.4 8.4 2.6-.6 6.6-1.2 9-1.4"/><circle cx="13.6" cy="5.4" r=".9"/><path d="M14.4 8.6l1.4-.5"/>',
  '<path d="M4 6.5c2.4-3.4 6.8-3.2 6.4.3-.4 3.2-4.6 4.4-5.4 8.4 2.6-.6 6.6-1.2 9-1.4"/><path d="M12.6 4.4l2 1.8M13.8 3.4l.5 3"/>',
];
const GLYPH = (n) => `<svg viewBox="0 0 20 20">${DOODLE[n]}</svg>`;
const PHRASES = ['Teaching colors to behave…', 'Spinning up extra dimensions…', 'Massaging the noise into art…', 'Tuning the aesthetic vibes…', 'Calibrating quantum pixels…'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.12);   // picture i drops in (reading order), the last at 1.70
const PHRASE_FOR = 0.34;                          // layout seconds a phrase stays up
const DOODLE_FOR = 0.12;                          // layout seconds a doodle state stays up

export default {
  id: 'notion-ai-image',
  label: 'Notion AI image (2026)',
  source: {
    platform: "Notion (desktop web app, light theme), an image block's 'Notion AI Image Generation' prompt field (a 1080p macOS Chrome screen recording on YouTube, 2026-02-02)",
    feature: "the image block collapses to a pale full-width status bar holding a small redrawing doodle glyph and an italic grey phrase that rotates ('Teaching colors to behave…', 'Spinning up extra dimensions…', 'Massaging the noise into art…', 'Tuning the aesthetic vibes…', 'Calibrating quantum pixels…') with no progress bar, percentage or spinner; the finished picture then hard-swaps into the block and an 'Edit with AI' pill appears (adapted to 10: a 5 x 2 block of pictures dropping in one at a time in reading order; the prompt field, the Beta chip, the '6%' badge and the feedback popover are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=MA_eZEp18nw', retrieved: '2026-10-14' }],
    extrapolated: "the footage's wait is ~11 s (t~12.5-23.5) for ONE 16:9 image, each phrase up for 2-3 s; here the wait is compressed into the beat's window, ten portrait-ish pictures land at an even step in a 5 x 2 block under the bar, the phrases rotate every ~0.34 layout seconds, the doodle's four redraw states are our own sketch, and the 'Edit with AI' pill (a hover state in the footage) takes the bar's row once the last picture has landed",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'notion-ai-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-h">Image creation</div><div class="${P}-row"><div class="${P}-bar"><span>${GLYPH(0)}</span><em>${x.esc(PHRASES[0])}</em></div><div class="${P}-edit" style="display: none">${GLYPH(1)}<span>Edit with AI</span></div></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div>`);
    const q = (s) => root.querySelector(s);
    const bar = q(`.${P}-bar`), glyph = q(`.${P}-bar span`), phrase = q(`.${P}-bar em`), edit = q(`.${P}-edit`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the bar stays, with no bar-of-progress in it, until the last picture is in; then the 'Edit with AI' pill takes its row
        const over = s >= LAND[9];
        put('mode', over, (v) => { bar.style.display = v ? 'none' : ''; edit.style.display = v ? '' : 'none'; });
        if (!over) {
          const n = Math.max(0, Math.floor(s / DOODLE_FOR)) % DOODLE.length;
          put('doodle', n, (v) => { glyph.innerHTML = GLYPH(v); });
          const ph = Math.max(0, Math.floor(s / PHRASE_FOR)) % PHRASES.length;
          put('phrase', ph, (v) => { phrase.textContent = PHRASES[v]; });
        }

        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
