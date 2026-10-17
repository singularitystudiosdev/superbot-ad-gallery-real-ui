// A dark creative-suite image feed (the screen recordings under .tmp/clone-9e82faf1/reveal-refs/leonardo, spec confidence
// 0.60): a #0F1421 page with a slim #0D1320 rail, the prompt echoed above the feed as a numbered chip with a small meta row
// and a magenta 'Generate' button with a token badge, and one SQUARE tile per requested image. All tiles appear at once as
// placeholders: flat near-black #111111, a very faint centred circular medallion (#232323; here a plain circle with a ring,
// never the product's mark) and a small light-grey spinner arc in the top-left corner. There is no status text, percentage or
// bar on a tile. Each tile swaps to its own finished image when it is ready (the frames show no blend), so the ten swap
// one at a time in reading order. The button never changes label while generating.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-lo';
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; border-radius: 12px; background: #0f1421; color: #d6dae4; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1c2335; }
.${P}-rail { flex: none; display: flex; flex-direction: column; align-items: center; gap: 9px; width: 34px; padding-top: 12px; background: #0d1320; }
.${P}-rail i { display: block; width: 14px; height: 14px; border-radius: 4px; background: #262e45; }
.${P}-rail i:first-child { border-radius: 50%; background: #3b4663; }
.${P}-main { flex: 1; min-width: 0; padding: 12px 12px 14px; }
.${P}-hd { display: flex; align-items: center; gap: 8px; height: 26px; }
.${P}-pr { flex: 1; min-width: 0; display: flex; align-items: center; gap: 7px; height: 24px; padding: 0 9px 0 4px; border-radius: 8px; background: #171d2e; font-size: 10px; color: #c3c8d6; white-space: nowrap; overflow: hidden; }
.${P}-pr b { flex: none; display: grid; place-items: center; width: 16px; height: 16px; border-radius: 5px; background: #2a3350; font-size: 9px; color: #e8ebf3; }
.${P}-pr span { overflow: hidden; text-overflow: ellipsis; }
.${P}-gen { flex: none; display: flex; align-items: center; gap: 6px; height: 24px; padding: 0 4px 0 11px; border-radius: 12px; background: #c026d3; font-size: 10px; font-weight: 600; color: #fff; }
.${P}-gen em { padding: 2px 6px; border-radius: 9px; background: rgba(0, 0, 0, .28); font-style: normal; font-size: 8.5px; }
.${P}-meta { display: flex; gap: 6px; margin: 7px 0 10px; font-size: 9px; color: #8791a8; }
.${P}-meta span { padding: 2px 7px; border-radius: 6px; background: #151b2b; }
.${P}-g { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #111; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background: #111; }
.${P}-ph::before { content: ""; position: absolute; left: 50%; top: 50%; width: 38%; aspect-ratio: 1; transform: translate(-50%, -50%); border-radius: 50%; background: #232323; box-shadow: inset 0 0 0 3px #1a1a1a; }
.${P}-sp { position: absolute; left: 7px; top: 7px; width: 11px; height: 11px; box-sizing: border-box; border-radius: 50%; border: 2px solid #747474; border-right-color: transparent; border-bottom-color: transparent; }
`;

export default {
  id: 'leonardo',
  label: 'Leonardo',
  source: {
    platform: 'Leonardo.Ai web app, image generation feed',
    feature: 'Square result tiles: a near-black placeholder with a faint medallion and a corner spinner arc, each swapping to its image when ready (adapted to 10)',
    refs: [{ url: 'https://www.youtube.com/watch?v=xbUE56kmVl0', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'leonardo');
    const root = x.el(`<div class="${P}"><div class="${P}-rail"><i></i><i></i><i></i><i></i></div><div class="${P}-main"><div class="${P}-hd"><div class="${P}-pr"><b>1</b><span>A cheerful ghost holding a handwritten note in a lecture hall</span></div><div class="${P}-gen">Generate<em>46</em></div></div><div class="${P}-meta"><span>10 images</span><span>Photo</span><span>870×1024</span></div><div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-ph"><i class="${P}-sp"></i></div></div>`).join('')}</div></div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), sp: n.querySelector(`.${P}-sp`), g: tiles[i], done: null }));
    ctx.gate(cells.map((c) => c.im));

    return {
      root,
      render(t) {
        cells.forEach((c, i) => {
          // a hard swap at the end of the tile's slot: the placeholder to the finished image, nothing between
          const done = t >= ctx.seq(i)[1];
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          if (done !== c.done) { c.im.style.display = done ? 'block' : 'none'; c.ph.style.display = done ? 'none' : ''; c.done = done; }
          // the corner arc turns while the tile waits (each a little out of step with its neighbours)
          if (!done) c.sp.style.transform = `rotate(${(((t * 420 + i * 37) % 360)).toFixed(1)}deg)`;
        });
      },
    };
  },
};
