// Grok Imagine's image generation as it renders in grok.com's chat surface (observed in the 2026-10-14 recording,
// .tmp/clone-9e82faf1/reveal-refs/grok/reveal/): the LIGHT page (#f7f7f8), the prompt as a right-aligned near-black
// bubble, a light grey capsule 'Making that image now.' with a tiny sparkle spinner over a blank result area, then a plain
// light grey rounded placeholder (no shimmer, no badge) for a beat, then the finished image in the same card in one hard
// swap (no fade resolved at 8 fps). The capsule stays above the image after it lands. The recording made one ~5:3 card;
// for ten images the capsule stays while ten placeholders appear in order and each swaps to its image, one at a time.
// The spinner is a plain four-point star of our own, the face is the system UI stack: nothing of xAI's is drawn or shipped.
import { clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gk';
const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5C12.9 8 16 11.1 22.5 12 16 12.9 12.9 16 12 22.5 11.1 16 8 12.9 1.5 12 8 11.1 11.1 8 12 1.5Z"/></svg>';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 14px 12px; border-radius: 16px; background: #f7f7f8; color: #0d0d0d; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-me { display: flex; justify-content: flex-end; }
.${P}-me span { display: block; padding: 7px 14px; border-radius: 18px; background: #0d0d0d; color: #fff; font-size: 13px; line-height: 18px; }
.${P}-st { display: inline-flex; align-items: center; gap: 7px; height: 26px; margin: 12px 0 8px; padding: 0 12px 0 8px; box-sizing: border-box; border-radius: 13px; background: #ececee; font-size: 12.5px; line-height: 18px; color: #3d3d42; white-space: nowrap; }
.${P}-sp { flex: none; display: block; width: 13px; height: 13px; }
.${P}-sp svg { display: block; width: 100%; height: 100%; fill: #55555b; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 12px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; border-radius: 12px; background: #e8eaec; }
.${P}-cp { display: flex; align-items: center; gap: 8px; height: 38px; margin-top: 12px; padding: 0 6px 0 14px; box-sizing: border-box; border-radius: 19px; background: #fff; box-shadow: 0 0 0 1px #e6e7ea; font-size: 13px; color: #8a8b91; }
.${P}-cp b { flex: 1; font-weight: 400; }
.${P}-go { flex: none; display: block; width: 26px; height: 26px; border-radius: 50%; background: #0d0d0d; }
`;

const LEAD = 0.4;  // a placeholder snaps in this long before its image lands

export default {
  id: 'grok',
  label: 'Grok',
  source: {
    platform: 'Grok Imagine (grok.com), light theme',
    feature: 'Image generation in the chat surface: status capsule with a sparkle spinner, a plain grey placeholder, then the finished image card (adapted to 10)',
    refs: [
      { url: 'https://grok.com/imagine', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=o6hLqr14wg4', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const root = x.el(`<div class="${P}"><div class="${P}-me"><span>Make ten Muse memes</span></div><div class="${P}-st"><i class="${P}-sp">${STAR}</i><span>Making that image now.</span></div><div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-t"><img src="${ownSrc(ctx.src, 'grok')}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><i class="${P}-ph"></i></div>`).join('')}</div><div class="${P}-cp"><b>Message Grok Bot</b><i class="${P}-go"></i></div></div>`);
    const sp = root.querySelector(`.${P}-sp`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), g: tiles[i], state: '' }));
    ctx.gate(cells.map((c) => c.im));
    const a0 = ctx.seq(0)[0];

    return {
      root,
      render(t) {
        cells.forEach((c, i) => {
          const b = ctx.seq(i)[1];
          const at = Math.max(ctx.seq(i)[0] - LEAD, a0);   // the blank area first, then the placeholders arrive in order
          const st = t >= b ? 'img' : t >= at ? 'ph' : 'blank';
          // the swap is hard at the landing (no cross-fade resolved in the recording)
          if (st !== c.state) {
            c.im.style.visibility = st === 'img' ? '' : 'hidden';
            c.ph.style.display = st === 'ph' ? '' : 'none';
            c.state = st;
          }
          // the image rests in its crop's own CSS
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
        // the tiny sparkle beside the status: it turns a quarter every 0.6 s and breathes
        // (it rests once the last image is in, so the finished card is the same pixels whatever came before)
        const ts = Math.min(t, ctx.lastLand);
        const k = ts / 0.6;
        const turn = (Math.floor(k) + Math.pow(clamp(k - Math.floor(k) - 0.35) / 0.65, 2) * 1) * 90;
        const s = 0.82 + 0.18 * Math.abs(Math.sin(ts * 5));
        sp.style.transform = `rotate(${turn.toFixed(1)}deg) scale(${s.toFixed(3)})`;
      },
    };
  },
};
