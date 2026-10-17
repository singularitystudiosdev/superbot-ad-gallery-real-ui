// ChatGPT's image-generation card for a batch of ten (observed in the user's own capture,
// .tmp/clone-9e82faf1/reveal-refs/chatgpt/user-example-batch10.png): one dark rounded card; a header row with a round
// mark, 'Creating images', a muted 'n of 10' and a mono 'm:ss' timer; a thin white progress bar on a grey track that
// fills as images land; a single row of ten rounded squares. A pending square is near-black with a fine film grain and a
// soft diagonal highlight sweeping across it; a finished square swaps in its image, left to right, one at a time.
// The mark is a plain stand-in disc, the face is the system UI stack: nothing of OpenAI's is drawn or shipped.
import { clamp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { hash, injectStyle, restTransform, restFilter, clock, ownSrc, UI_FONT, MONO_FONT } from './util.9e82faf1.js';

const P = 'rv-cg';
// fine film grain: white speckle of varying alpha from a seeded turbulence, a static tile (nothing is drawn per frame)
const GRAIN = 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".95" numOctaves="2" seed="7" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.6 -.72"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>');
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 14px 14px 15px; border-radius: 18px; background: #131313; color: #f3f3f3; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-hd { display: flex; align-items: center; gap: 8px; height: 22px; white-space: nowrap; }
.${P}-mark { flex: none; width: 20px; height: 20px; border-radius: 50%; background: #f3f3f3; }
.${P}-st { font-size: 13px; line-height: 20px; font-weight: 500; color: #f3f3f3; }
.${P}-n { font-size: 13px; line-height: 20px; color: #b8b8ba; font-variant-numeric: tabular-nums; }
.${P}-tm { font: 12px/20px ${MONO_FONT}; color: #b8b8ba; font-variant-numeric: tabular-nums; }
.${P}-bar { height: ${5}px; margin: 12px 0 13px; border-radius: 3px; background: #252425; overflow: hidden; }
.${P}-fill { height: 100%; width: 100%; border-radius: 3px; background: #f3f3f3; transform-origin: 0 50%; transform: scaleX(0); }
.${P}-row { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 4px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 7px; overflow: hidden; background: #151515; }
.${P}-ph { position: absolute; inset: 0; background-color: #151515; background-image: linear-gradient(135deg, rgba(33, 33, 34, 0) 0%, rgba(33, 33, 34, 0) 22%, rgba(33, 33, 34, .9) 36%, #464649 50%, rgba(33, 33, 34, .9) 64%, rgba(33, 33, 34, 0) 78%, rgba(33, 33, 34, 0) 100%); background-size: 300% 300%; }
.${P}-gr { position: absolute; inset: -16px; background-image: url("${GRAIN}"); background-size: 64px 64px; opacity: .22; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-t::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .09); pointer-events: none; }
`;

const BAR_H = 5;              // the progress bar's height, which it gives up when the batch is done
const TOTAL_S = 47;           // the real batch took ~19 s for 4 of 10 (the reference): the timer runs that clock across the landing

export default {
  id: 'chatgpt',
  label: 'ChatGPT',
  source: {
    platform: 'ChatGPT web (chatgpt.com), gpt-image batch',
    feature: 'Image generation card while a batch of images renders: status, n of N, timer, progress bar, shimmering placeholders (adapted to 10)',
    refs: [
      { url: 'https://openai.com/index/introducing-4o-image-generation/', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=9GtUVfj97OU', retrieved: '2026-10-14' },
    ],
    // no real footage of the batch card completing exists (spec.json batchComplete.found = false): only the user's mid-batch screenshot grounds the card
    extrapolated: ['end state "Images created 10 of 10"', 'timer pace 0:00 to 0:47'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { count, tiles } = ctx;
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><i class="${P}-mark"></i><span class="${P}-st"></span><span class="${P}-n"></span><span class="${P}-tm"></span></div><div class="${P}-bar"><div class="${P}-fill"></div></div><div class="${P}-row">${tiles.map((g, i) => `<div class="${P}-t"><img src="${ownSrc(ctx.src, 'chatgpt')}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-ph"><i class="${P}-gr"></i></div></div>`).join('')}</div></div>`);
    const st = root.querySelector(`.${P}-st`), nEl = root.querySelector(`.${P}-n`), tmEl = root.querySelector(`.${P}-tm`);
    const bar = root.querySelector(`.${P}-bar`), fill = root.querySelector(`.${P}-fill`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => {
      const ph = n.querySelector(`.${P}-ph`);
      return { ph, gr: ph.firstElementChild, im: n.querySelector('img'), g: tiles[i], shown: true };
    });
    ctx.gate(cells.map((c) => c.im));

    const text = { st: null, n: null, tm: null };
    const put = (el, key, v) => { if (text[key] !== v) { el.textContent = v; text[key] = v; } };

    // a pending square at time t: near-black, a diagonal highlight (a band running bottom-left to top-right) sweeping
    // across it, the grain crawling in steps over all of it
    function shimmer(c, i, t) {
      // all ten sweep nearly together (a slight lag tile to tile), the band always somewhere in view
      const f = (((t * 0.7 - i * 0.035) % 1) + 1) % 1;
      const pos = (80 - 60 * f).toFixed(2);
      c.ph.style.backgroundPosition = `${pos}% ${pos}%`;
      const step = Math.floor(t * 14);
      c.gr.style.transform = `translate(${-Math.floor(hash(i + 3, step) * 16)}px, ${-Math.floor(hash(i + 5, step) * 16)}px)`;
    }

    return {
      root,
      render(t) {
        const w0 = ctx.seq(0)[0], end = ctx.lastLand;
        let done = 0;
        cells.forEach((c, i) => {
          const [a, b] = ctx.seq(i);
          const p = seg(t, a, b);
          if (p >= 1) done++;
          if (p >= 1) {
            // landed: the crop's resting CSS exactly
            c.im.style.filter = restFilter(c.g);
            c.im.style.transform = restTransform(c.g);
            if (c.shown) { c.ph.style.display = 'none'; c.shown = false; }
            return;
          }
          // the swap from placeholder to image is a hard swap at the landing, as in the capture (no cross-fade seen): a tile
          // is a shimmering placeholder right up to p = 1, so 'n of 10' always agrees with the images showing
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          if (!c.shown) { c.ph.style.display = ''; c.shown = true; }
          shimmer(c, i, t);
        });
        const finished = t >= end;
        put(st, 'st', finished ? 'Images created' : 'Creating images');
        put(nEl, 'n', `${done} of ${count}`);
        put(tmEl, 'tm', clock(Math.round(clamp((t - w0) / (end - w0)) * TOTAL_S)));
        // the bar steps with the count: when image j lands it eases from j/10 to (j+1)/10 over 0.15 s
        const since = done > 0 ? seg(t, ctx.seq(done - 1)[1], ctx.seq(done - 1)[1] + 0.15) : 1;
        fill.style.transform = `scaleX(${(clamp((done - 1 + outCubic(since)) / count)).toFixed(4)})`;
        // once every image is in the bar fills and goes (the finished card is the row of images alone)
        const gone = outCubic(seg(t, end, end + 0.25));
        bar.style.opacity = (1 - gone).toFixed(3);
        bar.style.height = gone >= 1 ? '0px' : `${(BAR_H * (1 - gone)).toFixed(2)}px`;
        bar.style.marginTop = gone >= 1 ? '9px' : `${(12 - 3 * gone).toFixed(2)}px`;
        bar.style.marginBottom = gone >= 1 ? '0px' : `${(13 * (1 - gone)).toFixed(2)}px`;
      },
    };
  },
};
