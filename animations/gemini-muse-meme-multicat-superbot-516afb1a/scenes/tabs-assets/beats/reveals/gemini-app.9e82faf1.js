// The Gemini app's image generation (gemini.google.com/app, LIGHT theme; observed in the 2026-10-14 recording,
// .tmp/clone-9e82faf1/reveal-refs/gemini-app/, and distinct from the dark AI Studio 'gemini' module): the prompt as a grey
// right-aligned bubble, a small sparkle spinner and 'Creating your image' in grey over one large very light grey rounded
// card (#f7f6f7) carrying only a faint white diagonal sheen, then the finished image in the card's own footprint (a swap
// faster than the recording's 10 fps), the 'Describe your image' composer below. The recording made one ~2:1 image; for
// ten, the one card holds ten slots that swap to their images one at a time in reading order while the sheen keeps
// sweeping the rest. The sparkle is a plain four-point star of our own, the face is the system UI stack.
import { seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-ga';
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5C12.9 8 16 11.1 22.5 12 16 12.9 12.9 16 12 22.5 11.1 16 8 12.9 1.5 12 8 11.1 11.1 8 12 1.5Z"/></svg>';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 16px 12px; border-radius: 20px; background: #fff; color: #1f1f1f; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-me { display: flex; justify-content: flex-end; }
.${P}-me span { display: block; padding: 8px 16px; border-radius: 20px; background: #efeff1; font-size: 13px; line-height: 18px; color: #1f1f1f; }
.${P}-st { display: flex; align-items: center; gap: 9px; height: 22px; margin: 14px 0 9px 4px; font-size: 13px; line-height: 18px; color: rgba(68, 71, 70, var(--c, 1)); white-space: nowrap; }
.${P}-sp { flex: none; display: block; width: 14px; height: 14px; }
.${P}-sp svg { display: block; width: 100%; height: 100%; fill: rgba(68, 71, 70, var(--c, 1)); }
.${P}-card { position: relative; box-sizing: border-box; padding: 8px; border-radius: 22px; background: #f7f6f7; overflow: hidden; }
.${P}-sheen { position: absolute; inset: 0; background-image: linear-gradient(115deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0) 32%, rgba(255, 255, 255, .8) 50%, rgba(255, 255, 255, 0) 68%, rgba(255, 255, 255, 0) 100%); background-size: 300% 100%; background-repeat: no-repeat; }
.${P}-g { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.${P}-s { position: relative; aspect-ratio: 870 / 1024; border-radius: 14px; overflow: hidden; }
.${P}-s img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cp { display: flex; align-items: center; gap: 8px; height: 44px; margin-top: 12px; padding: 0 8px 0 12px; box-sizing: border-box; border-radius: 22px; background: #fff; box-shadow: 0 1px 6px rgba(60, 64, 67, .18), 0 0 0 1px #ececee; font-size: 13px; color: #8a8d91; }
.${P}-chip { flex: none; display: inline-flex; align-items: center; height: 26px; padding: 0 12px; border-radius: 13px; background: #ececef; font-size: 12px; color: #1f1f1f; }
.${P}-cp b { flex: 1; font-weight: 400; }
.${P}-go { flex: none; display: block; width: 28px; height: 28px; border-radius: 50%; background: #1f1f1f; }
`;

export default {
  id: 'gemini-app',
  label: 'Gemini',
  source: {
    platform: 'Gemini app (gemini.google.com/app), light theme, Create image tool',
    feature: 'Image generation: sparkle and "Creating your image" over a light grey card with a faint white sheen, then the finished image (adapted to 10)',
    refs: [
      { url: 'https://gemini.google.com/app', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=kdsvw_dHNMk', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const root = x.el(`<div class="${P}"><div class="${P}-me"><span>Create ten Muse memes</span></div><div class="${P}-st"><i class="${P}-sp">${STAR}</i><span>Creating your image</span></div><div class="${P}-card"><div class="${P}-sheen"></div><div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-s"><img src="${ownSrc(ctx.src, 'gemini-app')}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`).join('')}</div></div><div class="${P}-cp"><span class="${P}-chip">Images</span><b>Describe your image</b><i class="${P}-go"></i></div></div>`);
    const st = root.querySelector(`.${P}-st`), sp = root.querySelector(`.${P}-sp`), sheen = root.querySelector(`.${P}-sheen`);
    const ims = [...root.querySelectorAll(`.${P}-s img`)];
    ctx.gate(ims);
    const shown = [];
    let cvar = null;

    return {
      root,
      render(t) {
        const end = ctx.lastLand;
        ims.forEach((im, i) => {
          const g = tiles[i], on = t >= ctx.seq(i)[1];
          // a slot is the card itself until its image swaps in whole (no fade: the swap is under a frame at 10 fps); an
          // image not yet in is not painted at all
          if (on !== shown[i]) { shown[i] = on; im.style.visibility = on ? '' : 'hidden'; }
          im.style.filter = restFilter(g);
          im.style.transform = restTransform(g);
        });
        // the sheen: a soft white band drifting across the card until the last image is in, then gone
        const live = t < end;
        if (live) {
          sheen.style.display = '';
          sheen.style.backgroundPosition = `${(100 - ((t * 0.55) % 1) * 100).toFixed(2)}% 0`;
        } else sheen.style.display = 'none';
        // the sparkle turns and breathes beside the status
        const ts = Math.min(t, end), s = 0.84 + 0.16 * Math.sin(ts * 6);
        sp.style.transform = `rotate(${(ts * 150).toFixed(1)}deg) scale(${s.toFixed(3)})`;
        // finished: the status goes (as colour alpha, never `opacity`, so the images beside it never rasterise differently)
        const c = (1 - outCubic(seg(t, end, end + 0.2))).toFixed(3);
        if (c !== cvar) { st.style.setProperty('--c', c); cvar = c; }
      },
    };
  },
};
