// An answer-engine chat thread generating an image (the screen recordings under .tmp/clone-9e82faf1/reveal-refs/perplexity,
// spec confidence 0.62), dark theme: the user's prompt as a right-aligned bubble; under it one row with a small multi-hue
// 'thinking' glyph at the left and, in a column beside it, a streaming status sentence (#E8E8E8, led by a small image icon;
// no count, timer or percentage anywhere) over a large dark #191917 rounded card. The card is empty, or in one recorded run a
// static grid of small grey dots (#333331 on #1D1D1B); it has no spinner. When the image is ready the placeholder is replaced
// by it in ONE frame: no fade, wipe, blur or zoom. Ten images: the one card holds ten dotted slots that each hard-swap on
// their own slot of the sequence, in reading order; the glyph stops and goes when the last one is in.
import { stream, seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-px';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 14px 16px; border-radius: 12px; background: #141412; color: #e8e8e8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px #242422; }
.${P}-u { display: flex; justify-content: flex-end; }
.${P}-u span { padding: 7px 13px; border-radius: 14px; background: #232321; font-size: 11px; line-height: 15px; color: #e8e8e8; }
.${P}-row { display: flex; gap: 10px; margin-top: 14px; }
.${P}-gl { flex: none; width: 16px; height: 16px; margin-top: 2px; box-sizing: border-box; border-radius: 50%; border: 2.4px solid; border-color: #34d399 #60a5fa #f472b6 #fbbf24; }
.${P}-col { flex: 1; min-width: 0; }
.${P}-st { display: flex; align-items: center; gap: 7px; height: 20px; font-size: 11px; line-height: 20px; white-space: nowrap; overflow: hidden; }
.${P}-st svg { flex: none; width: 13px; height: 13px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linejoin: round; stroke-linecap: round; }
.${P}-card { margin-top: 8px; padding: 12px; border-radius: 16px; background: #191917; }
.${P}-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.${P}-s { position: relative; aspect-ratio: 870 / 1024; border-radius: 8px; overflow: hidden; background-color: #1d1d1b; background-image: radial-gradient(circle, #333331 1.1px, transparent 1.6px); background-size: 8px 8px; }
.${P}-s img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
`;

const SAY = 'Generating ten Muse meme images of a cheerful ghost holding a handwritten note';
const ICON = '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/></svg>';

export default {
  id: 'perplexity',
  label: 'Perplexity',
  source: {
    platform: 'Perplexity (www.perplexity.ai), Answer tab, image generation in a chat thread',
    feature: 'Image generation in a thread: streaming status sentence with a thinking glyph over an empty dark card that hard-swaps to the finished image (adapted to 10)',
    refs: [{ url: 'https://www.youtube.com/watch?v=bw8SRfe_-ug', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'perplexity');
    const root = x.el(`<div class="${P}"><div class="${P}-u"><span>Make 10 Muse memes</span></div><div class="${P}-row"><i class="${P}-gl"></i><div class="${P}-col"><div class="${P}-st">${ICON}<span></span></div><div class="${P}-card"><div class="${P}-grid">${tiles.map((g, i) => `<div class="${P}-s"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`).join('')}</div></div></div></div></div>`);
    const gl = root.querySelector(`.${P}-gl`), st = root.querySelector(`.${P}-st`), say = st.querySelector('span');
    const slots = [...root.querySelectorAll(`.${P}-s img`)].map((im) => ({ im, shown: false }));
    ctx.gate(slots.map((s) => s.im));
    let text = null, tone = null, glOn = null;

    return {
      root,
      render(t) {
        slots.forEach((s, i) => {
          const on = t >= ctx.seq(i)[1];  // the swap is a single frame, at the moment the image is ready
          if (on !== s.shown) { s.im.style.display = on ? 'block' : 'none'; s.shown = on; }
          s.im.style.filter = restFilter(tiles[i]);
          s.im.style.transform = restTransform(tiles[i]);
        });
        // the status sentence streams in (faint first, then brighter) as the card enters
        const t0 = ctx.cardIn + 0.1;
        const s = stream(SAY, t0, 90, t);
        if (s !== text) { say.textContent = s; text = s; }
        const a = (0.4 + 0.6 * seg(t, t0, t0 + 0.5)).toFixed(2);
        if (a !== tone) { st.style.color = `rgba(232, 232, 232, ${a})`; tone = a; }
        // the thinking glyph turns while images are being made, and goes with the last one
        const live = t < ctx.lastLand;
        if (live !== glOn) { gl.style.visibility = live ? '' : 'hidden'; glOn = live; } // the glyph's column stays, so the card never reflows
        // the turn is a pure function of t, set whether or not the glyph is showing, so a seeked page and a fresh one carry identical inline styles
        gl.style.transform = `rotate(${((t * 300) % 360).toFixed(1)}deg)`;
      },
    };
  },
};
