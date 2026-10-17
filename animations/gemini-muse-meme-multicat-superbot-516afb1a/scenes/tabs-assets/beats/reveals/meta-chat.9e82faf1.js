// Meta AI's chat surface as it renders in the current web app (observed in the 2026-07-08 desktop walkthrough,
// .tmp/clone-9e82faf1/reveal-refs/meta/m2/, 30 fps window): the DARK page, the prompt as a right-aligned grey bubble, then
// the assistant turn: a small violet marker with a thought line ('Crafting the … scene' plus a chevron) over a streaming
// grey paragraph, which collapses to a 'Show thinking' row; the image then fades into the thread over about 0.2 s (a short
// ramp, not a cut), under the 'Ask Meta AI…' composer. The recording made one image; for ten, the thought streams once and
// the ten images fade in in order in the chat column, their slots empty (no placeholder drawn) until each one's turn.
// The marker is a plain violet dot of our own, the thought wording is our own, the face is the system UI stack.
import { lerp, seg, stream } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-mc';
const CHEV = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M4.5 2.5 8 6 4.5 9.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 14px 12px; border-radius: 16px; background: #131315; color: #e9e9ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-me { display: flex; justify-content: flex-end; }
.${P}-me span { display: block; padding: 7px 14px; border-radius: 18px; background: #2a2a2e; font-size: 13px; line-height: 18px; color: #e9e9ec; }
.${P}-th { margin: 14px 0 10px; }
.${P}-hd { display: flex; align-items: center; gap: 8px; height: 20px; font-size: 12.5px; line-height: 20px; color: #a1a1a8; }
.${P}-dot { flex: none; display: block; width: 10px; height: 10px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #b49bff, #6b45e6); }
.${P}-hd svg { display: block; flex: none; width: 10px; height: 10px; margin-left: -3px; color: #7c7c84; }
.${P}-bd { margin: 4px 0 0 18px; font-size: 12px; line-height: 17px; color: #7c7c84; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin-left: 18px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 10px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cv { position: absolute; inset: 0; background: #131315; }
.${P}-cp { display: flex; align-items: center; gap: 8px; height: 40px; margin-top: 12px; padding: 0 7px 0 14px; box-sizing: border-box; border-radius: 20px; background: #232327; box-shadow: 0 0 0 1px #2e2e33; font-size: 13px; color: #85858c; }
.${P}-cp b { flex: 1; font-weight: 400; }
.${P}-md { flex: none; font-size: 11.5px; color: #a1a1a8; }
.${P}-go { flex: none; display: block; width: 26px; height: 26px; border-radius: 50%; background: #3f6df2; }
`;

const HEAD = 'Crafting the images';
const BODY = 'Ten Muse memes: one subject, a fresh crop and look for each.';
const CPS = 120;     // the paragraph streams at this many characters per second
const FADE = 0.2;    // an image fades in over this long, as measured

export default {
  id: 'meta-chat',
  label: 'Meta AI (chat)',
  source: {
    platform: 'Meta AI web (meta.ai), chat prompt page, dark theme',
    feature: 'Chat image generation: a streaming thought line collapsing to "Show thinking", then the image fading in over ~0.2 s (adapted to 10)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=YrgA65OSfBo', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=ddF3XM1IbEo', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const slot = (g, i) => `<div class="${P}-t"><img src="${ownSrc(ctx.src, 'meta-chat')}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><i class="${P}-cv"></i></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-me"><span>Make ten Muse memes</span></div><div class="${P}-th"><div class="${P}-hd"><i class="${P}-dot"></i><span class="${P}-ht"></span>${CHEV}</div><div class="${P}-bd"></div></div><div class="${P}-g">${tiles.map(slot).join('')}</div><div class="${P}-cp"><b>Ask Meta AI…</b><span class="${P}-md">Instant</span><i class="${P}-go"></i></div></div>`);
    const ht = root.querySelector(`.${P}-ht`), bd = root.querySelector(`.${P}-bd`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), g: tiles[i], op: null }));
    ctx.gate(cells.map((c) => c.im));
    const text = { ht: null, bd: null, bdShown: null };

    // the thought streams in the first beat after the card enters, collapses to 'Show thinking', and the images then take
    // the remaining time up to the last landing, each fading over FADE and ordered, the last finished at lastLand
    const T0 = ctx.cardIn + 0.02;
    const streamEnd = T0 + BODY.length / CPS;
    const collapse = streamEnd + 0.06;
    const first = collapse + 0.04;
    const step = (ctx.lastLand - FADE - first) / (cells.length - 1);

    return {
      root,
      render(t) {
        const thinking = t < collapse;
        const h = thinking ? HEAD : 'Show thinking';
        if (h !== text.ht) { ht.textContent = h; text.ht = h; }
        const b = thinking ? stream(BODY, T0, CPS, t) : '';
        if (b !== text.bd) { bd.textContent = b; text.bd = b; }
        if (thinking !== text.bdShown) { bd.style.display = thinking ? '' : 'none'; text.bdShown = thinking; }
        cells.forEach((c, i) => {
          const a = first + i * step;
          // not yet: the slot is empty (the page's own colour covers it); fading: the cover's opacity ramps down over the
          // image (the image itself never carries an opacity, so its raster is the same however it was reached); landed:
          // no cover at all
          const p = seg(t, a, a + FADE);
          const op = p >= 1 ? '' : lerp(1, 0, p).toFixed(3);
          if (op !== c.op) {
            c.cv.style.opacity = op;
            c.cv.style.display = op === '' ? 'none' : '';
            c.im.style.visibility = op === '1.000' ? 'hidden' : '';   // the slot is truly empty before its turn
            c.op = op;
          }
          // the image rests in its crop's own CSS
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
