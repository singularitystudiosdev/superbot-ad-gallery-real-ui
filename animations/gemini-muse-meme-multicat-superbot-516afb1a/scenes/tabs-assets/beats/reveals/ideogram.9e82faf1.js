// A dark-theme text-to-image feed with a queue (the screen recordings under .tmp/clone-9e82faf1/reveal-refs/ideogram, spec
// confidence 0.62): a near-black page, a prompt field with option chips, a page-level chip 'Wait <N>s' (counting down; the
// 'Upgrade to skip the wait' line under it is omitted as an upsell), and the batch as landscape tiles in a grid. Every tile of a batch runs at once: it starts as a
// flat #3E3E44 grey with a small centred glyph and a slim caption strip, 'Waiting in the slow queue…'; then a heavy blur of
// the picture sharpens and gains colour while the caption counts 'NN% complete' and a thin white rule along the tile's bottom
// edge fills; then the caption reads 'Generation complete' with a small check, and clears, leaving the image. Ten images: a
// 4 x 3 grid whose tiles run on the beat's overlapping cascade (ctx.win), finishing in reading order. The glyph is our own
// picture-frame mark (the product's logo is not drawn); the video editor's overlaid captions in the source are not UI.
import { clamp, lerp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-id';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 0 0 12px; border-radius: 12px; background: #17171a; color: #e4e4e7; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #26262b; }
.${P}-top { height: 24px; padding: 0 12px; background: #0c0c0a; font-size: 10px; line-height: 24px; color: #a1a1aa; display: flex; gap: 16px; }
.${P}-top b { font-weight: 600; color: #f4f4f5; }
.${P}-pr { display: flex; align-items: center; gap: 6px; margin: 10px 12px 0; }
.${P}-in { flex: 1; min-width: 0; height: 28px; padding: 0 11px; border-radius: 8px; background: #232327; font-size: 10.5px; line-height: 28px; color: #d4d4d8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-chip { flex: none; height: 28px; padding: 0 9px; border-radius: 8px; background: #232327; font-size: 9.5px; line-height: 28px; color: #a1a1aa; }
.${P}-q { display: flex; align-items: baseline; gap: 8px; height: 26px; margin: 8px 12px 0; }
.${P}-q b { padding: 3px 9px; border-radius: 999px; background: #2a2a2f; font-size: 10px; line-height: 12px; font-weight: 600; color: #f4f4f5; font-variant-numeric: tabular-nums; }
.${P}-g { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 0 12px; }
.${P}-t { position: relative; aspect-ratio: 3 / 2; border-radius: 8px; overflow: hidden; background: #3e3e44; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 42%; }
.${P}-cv { position: absolute; inset: 0; background: #3e3e44; }
.${P}-gl { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; }
.${P}-gl svg { display: block; width: 100%; height: 100%; fill: none; stroke: #848484; stroke-width: 1.7; stroke-linejoin: round; stroke-linecap: round; }
.${P}-cap { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; gap: 4px; height: 16px; padding: 0 5px; background: rgba(12, 12, 14, .42); font-size: 7.5px; letter-spacing: -.01em; line-height: 16px; color: #ececee; white-space: nowrap; }
.${P}-cap i { display: none; flex: none; width: 9px; height: 9px; border-radius: 50%; background: #e4e4e7; position: relative; }
.${P}-cap i::after { content: ""; position: absolute; left: 3px; top: 1.6px; width: 2px; height: 4px; border: solid #17171a; border-width: 0 1.2px 1.2px 0; transform: rotate(45deg); }
.${P}-rule { position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: #fff; transform-origin: 0 50%; transform: scaleX(0); }
`;

const START = 0.08;     // the share of a tile's run spent queued before it begins to render
const GEN_END = 0.82;   // ...and the share at which rendering reaches 100%: 'Generation complete' shows to the end of the run
const WAIT_S = 27;      // the queue chip's first reading
const GLYPH = '<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4"/></svg>';

export default {
  id: 'ideogram',
  label: 'Ideogram',
  source: {
    platform: 'ideogram.ai (web app, /create feed)',
    feature: 'Text-to-image generation: grey queued tile, then a blurred desaturated render that sharpens with a percentage and a bottom progress rule, then the finished image (adapted to 10)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=NENTuJ1y-J4', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=qPBl9VTtRNo', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'ideogram');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><b>Create</b><span>Feed</span><span>Library</span></div><div class="${P}-pr"><div class="${P}-in">a cheerful ghost holding a handwritten note in a lecture hall</div><span class="${P}-chip">Model</span><span class="${P}-chip">Style</span><span class="${P}-chip">Aspect 3:2</span></div><div class="${P}-q"><b></b></div><div class="${P}-g">${tiles.map((g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-cv"><div class="${P}-gl">${GLYPH}</div></div><div class="${P}-cap"><i></i><span></span></div><div class="${P}-rule"></div></div>`).join('')}</div></div>`);
    const q = root.querySelector(`.${P}-q`), chip = q.querySelector('b');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      n, im: n.querySelector('img'), cv: n.querySelector(`.${P}-cv`), cap: n.querySelector(`.${P}-cap`), ck: n.querySelector(`.${P}-cap i`),
      lab: n.querySelector(`.${P}-cap span`), rule: n.querySelector(`.${P}-rule`), g: tiles[i], text: null, ph: null,
    }));
    ctx.gate(cells.map((c) => c.im));
    let chipText = null, chipVis = null;

    return {
      root,
      render(t) {
        cells.forEach((c, i) => {
          const [a, b] = ctx.win(i);
          const g = seg(t, a, b);
          let text = '', ph = 'rest';
          if (g >= 1) {
            // landed: the crop's own CSS, no caption, no rule, no cover
            c.im.style.filter = restFilter(c.g);
          } else if (g < START) {
            ph = 'queued'; text = 'Waiting in the slow queue…';
          } else if (g < GEN_END) {
            ph = 'gen';
            const q = seg(g, START, GEN_END);
            // a heavy blur sharpening while colour comes up (the picture is not on screen until the render has begun)
            c.im.style.filter = `blur(${lerp(16, 0, outCubic(q)).toFixed(2)}px) saturate(${(q * q).toFixed(3)}) ${c.g.grade}`.trim();
            c.cv.style.opacity = (1 - seg(q, 0, 0.22)).toFixed(3);
            c.rule.style.transform = `scaleX(${q.toFixed(4)})`;
            text = `${Math.max(1, Math.round(q * 100))}% complete`;
          } else {
            ph = 'done'; text = 'Generation complete';
            c.im.style.filter = restFilter(c.g);
          }
          c.im.style.transform = restTransform(c.g);
          if (ph !== c.ph) {
            c.cv.style.display = ph === 'queued' || ph === 'gen' ? '' : 'none';
            c.cv.firstElementChild.style.display = ph === 'queued' ? '' : 'none';
            if (ph === 'queued') c.cv.style.opacity = '1';
            c.cap.style.display = ph === 'rest' ? 'none' : '';
            c.ck.style.display = ph === 'done' ? 'block' : 'none';
            c.rule.style.display = ph === 'gen' ? '' : 'none';
            if (ph !== 'gen') c.rule.style.transform = 'scaleX(0)';
            c.ph = ph;
          }
          if (text !== c.text) { c.lab.textContent = text; c.text = text; }
        });
        // the page's queue chip counts down across the batch, then goes
        const first = ctx.win(0)[0], end = ctx.lastLand;
        const left = Math.ceil(WAIT_S * (1 - clamp((t - first) / (end - first))));
        const ct = `Wait ${Math.max(left, 1)}s`;
        if (ct !== chipText) { chip.textContent = ct; chipText = ct; }
        const gone = t >= end;
        if (gone !== chipVis) { q.style.visibility = gone ? 'hidden' : ''; chipVis = gone; }
      },
    };
  },
};
