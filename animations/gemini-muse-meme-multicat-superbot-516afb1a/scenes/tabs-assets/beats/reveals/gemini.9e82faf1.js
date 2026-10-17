// Gemini's image-generation surface, as recorded on Google AI Studio's dark UI (the frames in
// .tmp/clone-9e82faf1/reveal-refs/gemini/frames): a small dotted spinner and 'Creating your image' above one big dark
// rounded card whose placeholder is a flat grey with only a faint moving sheen; no bar, no count, no timer. The finished
// image replaces the placeholder almost at once (a frame or two), the caption goes, three round buttons sit over the
// image's top right (in this ten-image card: at the right of the header line, clear of the slots) and a row of small
// icons under the card. For ten images the one card holds ten slots that fill one at a time in reading order.
// Spec confidence is 0.40 (AI Studio, not the app; plural caption, slot grid and button glyphs are not in the frames).
// The spinner is drawn from dots, the buttons from plain strokes, the face is the system UI stack.
import { lerp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gm';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; font-family: ${UI_FONT}; color: #e3e3e3; -webkit-font-smoothing: antialiased; }
.${P}-hd { display: flex; align-items: center; justify-content: space-between; height: 26px; margin: 0 2px 6px; }
.${P}-cap { display: flex; align-items: center; gap: 9px; height: 22px; margin: 0; font-size: 12.5px; line-height: 18px; color: rgba(227, 227, 227, var(--c, 1)); white-space: nowrap; }
.${P}-spin { position: relative; flex: none; width: 14px; height: 14px; }
.${P}-spin i { position: absolute; left: 50%; top: 50%; width: 3px; height: 3px; margin: -1.5px 0 0 -1.5px; border-radius: 50%; background: rgba(227, 227, 227, calc(var(--c, 1) * var(--o, 1))); }
.${P}-card { position: relative; box-sizing: border-box; padding: 10px; border-radius: 16px; background: #1b1b1b; overflow: hidden; }
.${P}-sheen { position: absolute; inset: 0; }
.${P}-grid { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.${P}-s { position: relative; aspect-ratio: 870 / 1024; border-radius: 9px; overflow: hidden; background: #212121; }
.${P}-s img { display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-s i { position: absolute; inset: 0; background: rgba(33, 33, 33, var(--a, 1)); }
.${P}-acts { display: flex; gap: 4px; height: 30px; margin: 6px 0 0 2px; }
.${P}-acts span { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 50%; }
.${P}-acts svg, .${P}-top svg { width: 15px; height: 15px; fill: none; stroke: #c4c7c5; stroke-opacity: var(--f, 0); stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-top { display: flex; gap: 6px; }
.${P}-top span { display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: rgba(32, 32, 32, calc(.82 * var(--f, 0))); }
.${P}-top svg { width: 13px; height: 13px; stroke: #e3e3e3; }
`;

// the glyphs are plain strokes of our own: under the image a row of five (like, dislike, redo, share, more), over its
// top right three round buttons (share, copy, download), as in the landed frame of the recording
const GLYPH = {
  up: '<path d="M8 11v8H5v-8z"/><path d="M8 11l3-6c1.5 0 2.2 1 2 2.4L12.6 10H18a1.8 1.8 0 0 1 1.8 2.1l-1 5.4A2 2 0 0 1 16.8 19H8"/>',
  down: '<path d="M8 13V5H5v8z"/><path d="M8 13l3 6c1.5 0 2.2-1 2-2.4L12.6 14H18a1.8 1.8 0 0 0 1.8-2.1l-1-5.4A2 2 0 0 0 16.8 5H8"/>',
  redo: '<path d="M19 6v5h-5"/><path d="M18.5 11A7 7 0 1 0 17 16"/>',
  share: '<path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
  more: '<circle cx="5.5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="18.5" cy="12" r="1"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  down2: '<path d="M12 4v11"/><path d="M7.5 10.5 12 15l4.5-4.5"/><path d="M5 19h14"/>',
};
const ACTS = ['up', 'down', 'redo', 'share', 'more'], TOP = ['share', 'copy', 'down2'];
const svg = (k) => `<span><svg viewBox="0 0 24 24">${GLYPH[k]}</svg></span>`;
const FADE = 0.09;  // the placeholder-to-image swap: at most a frame or two at the recording's 10 fps

export default {
  id: 'gemini',
  label: 'Gemini (AI Studio)',
  source: {
    platform: 'Google AI Studio (aistudio.google.com), dark UI',
    feature: 'Image generation: dark placeholder card with a faint sheen, then the finished image with round action buttons (adapted to 10)',
    refs: [{ url: 'https://www.youtube.com/watch?v=kdsvw_dHNMk', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const dots = [0, 1, 2, 3].map((k) => `<i data-k="${k}"></i>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-hd"><div class="${P}-cap"><span class="${P}-spin">${dots}</span><span>Creating your images</span></div><div class="${P}-top">${TOP.map(svg).join('')}</div></div><div class="${P}-card"><div class="${P}-sheen"></div><div class="${P}-grid">${tiles.map((g, i) => `<div class="${P}-s"><img src="${ownSrc(ctx.src, 'gemini')}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><i></i></div>`).join('')}</div></div><div class="${P}-acts">${ACTS.map(svg).join('')}</div></div>`);
    const cap = root.querySelector(`.${P}-cap`), spin = [...root.querySelectorAll(`.${P}-spin i`)], sheen = root.querySelector(`.${P}-sheen`);
    const acts = root.querySelector(`.${P}-acts`), top = root.querySelector(`.${P}-top`);
    const ims = [...root.querySelectorAll(`.${P}-s img`)], covers = [...root.querySelectorAll(`.${P}-s i`)];
    ctx.gate(ims);

    let fade = null;
    return {
      root,
      render(t) {
        const end = ctx.lastLand;
        ims.forEach((im, i) => {
          const g = tiles[i], [a] = ctx.seq(i);
          const p = seg(t, a, a + FADE);
          // the image never fades itself (an <img> that has run through fractional opacity rasterises differently after);
          // the placeholder over it fades out instead
          covers[i].style.display = p >= 1 ? 'none' : '';
          if (p < 1) covers[i].style.setProperty('--a', (1 - outCubic(p)).toFixed(3));
          // an image still wholly under its opaque placeholder is not painted at all (Default's tile is opacity 0 there): a
          // page seeked through the camera push would otherwise leave this image drawn at every intermediate scale
          im.style.visibility = p > 0 ? '' : 'hidden';
          im.style.filter = restFilter(g);
          im.style.transform = restTransform(g);
        });
        // the four spinner dots circle a diamond, each trailing the last
        const ang = t * 5.2;
        spin.forEach((d, k) => {
          const a = ang - k * 0.55, r = k === 0 ? 5 : 4.2;
          d.style.transform = `translate(${(Math.cos(a) * r).toFixed(2)}px, ${(Math.sin(a) * r).toFixed(2)}px)`;
          d.style.setProperty('--o', (1 - k * 0.22).toFixed(2));
        });
        // a faint soft sheen drifting across the whole placeholder card until the last image is in
        const live = 1 - seg(t, end - 0.1, end);
        const cx = lerp(-10, 110, (t * 0.5) % 1);
        if (live > 0) {
          sheen.style.display = '';
          sheen.style.background = `radial-gradient(ellipse 45% 90% at ${cx.toFixed(1)}% 50%, rgba(255,255,255,${(.075 * live).toFixed(4)}), rgba(255,255,255,0))`;
        } else sheen.style.display = 'none'; // gone once the last image is in: nothing invisible is left painted over the card
        // finished: the caption goes and the action buttons come in under the card
        const fin = outCubic(seg(t, end, end + 0.2));
        cap.style.setProperty('--c', (1 - fin).toFixed(3));
        // the icons fade in as colour alpha (--f), never as `opacity`: an element that has run through fractional opacity
        // leaves the images beside it rasterised a hair differently once it is back at rest
        const f = fin.toFixed(3);
        if (f !== fade) { acts.style.setProperty('--f', f); top.style.setProperty('--f', f); fade = f; }
      },
    };
  },
};
