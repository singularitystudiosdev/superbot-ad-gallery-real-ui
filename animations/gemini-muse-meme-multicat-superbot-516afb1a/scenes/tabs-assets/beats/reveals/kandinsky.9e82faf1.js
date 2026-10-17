// Kandinsky in Fusion Brain's web workspace (spec .tmp/clone-9e82faf1/reveal-refs/kandinsky/spec.json, confidence 0.8; frames
// in reveal-refs/kandinsky/frames/g2v4_* (VK video-219823705_456239265 at 7.75-9.35 s, the cleanest pending -> result run, 60 fps)
// and g2v1_* (Rutube 2026-09-28, the current dark chrome)). A dark workspace (#242424 dotted-grid canvas, a near-black left rail
// of plain shapes, a #292929 prompt bar at the bottom with the lime sparkle Generate button at its right). On generate the whole
// prompt bar is covered by a black #000000 rounded toast: a small spinner at the left, the one sentence 'Подготавливаем
// изображение, это не займет много времени', a lime '✕ Отменить' at the right. There is no percentage and no bar. The canvas
// first shows only the empty dotted grid, then a dark, speckled, low-resolution render (near-black #1f1f1f with sparse white
// specks) that resolves into the finished image while the toast stays up; the toast clears the instant the images are in.
// Adapted to ten images: ten tiles on the canvas, all showing that speckled render once the toast is up, then resolving into
// the images one after another in reading order, the toast clearing when the last one is in. The rail is plain shapes with no
// wordmark and the face is the system UI stack: none of the platform's logo, wordmark or fonts is drawn or shipped.
import { clamp, seg, outCubic } from '../../../../lib.9b47fc30.js';
import { hash, injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-kd';
const H = 300, RAIL = 44, BAR_H = 62, TOAST_H = 44;   // px
const CELL = 48;                                       // the speck pattern's repeat, px
// sparse bright specks on a near-black field, the same fixed pattern every time (deterministic hash, never Math.random)
const SPECKS = Array.from({ length: 16 }, (_, j) => {
  const px = Math.round(hash(3, j * 2) * (CELL - 4)) + 2, py = Math.round(hash(3, j * 2 + 1) * (CELL - 4)) + 2;
  const a = (0.22 + hash(5, j) * 0.5).toFixed(2);
  return `radial-gradient(circle at ${px}px ${py}px, rgba(255, 255, 255, ${a}) 0, rgba(255, 255, 255, ${a}) 0.8px, rgba(255, 255, 255, 0) 1.3px)`;
}).join(', ');
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${H}px; border-radius: 12px; background-color: #242424; background-image: radial-gradient(circle, #3b3b3b 0, #3b3b3b 1px, rgba(59, 59, 59, 0) 1.4px); background-size: 16px 16px; color: #e8e8e8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; }
.${P}-rail { position: absolute; left: 0; top: 0; bottom: 0; width: ${RAIL}px; display: flex; flex-direction: column; align-items: center; gap: 12px; padding-top: 14px; background: #090909; }
.${P}-rail i { display: block; width: 18px; height: 18px; border-radius: 5px; background: #2e2e2e; }
.${P}-rail i:first-child { background: #d6f376; }
.${P}-rail b { display: block; width: 18px; height: 3px; margin-top: auto; border-radius: 2px; background: #2e2e2e; }
.${P}-rail b + b { margin-top: 6px; }
.${P}-rail b:last-child { margin-bottom: 16px; }
.${P}-cv { position: absolute; left: ${RAIL}px; right: 0; top: 0; padding: 12px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #1f1f1f; visibility: hidden; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-nz { position: absolute; inset: 0; background-image: ${SPECKS}, radial-gradient(circle at 50% 50%, #272727 0, #1c1c1c 100%); background-size: ${CELL}px ${CELL}px, 100% 100%; }
.${P}-bar { position: absolute; left: ${RAIL + 12}px; right: 12px; bottom: 12px; height: ${BAR_H}px; border-radius: 12px; background: #292929; }
.${P}-tabs { position: absolute; left: 12px; right: 58px; top: 8px; display: flex; gap: 12px; font-size: 10px; line-height: 14px; color: #8a8a8a; white-space: nowrap; }
.${P}-tabs span:first-child { color: #d6f376; }
.${P}-tabs span:last-child { margin-left: auto; }
.${P}-fd { position: absolute; left: 10px; right: 58px; top: 27px; height: 26px; box-sizing: border-box; padding: 0 10px; border-radius: 8px; background: #1e1e1e; font-size: 11px; line-height: 26px; color: #ececec; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-go { position: absolute; right: 10px; top: 14px; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 10px; background: #d6f376; }
.${P}-go svg { width: 18px; height: 18px; fill: #101010; }
.${P}-toast { position: absolute; left: ${RAIL + 12}px; right: 12px; bottom: 12px; height: ${TOAST_H}px; box-sizing: border-box; display: none; align-items: center; gap: 10px; padding: 0 14px; border-radius: 12px; background: #000; font-size: 11px; font-weight: 500; white-space: nowrap; }
.${P}-spin { flex: none; width: 15px; height: 15px; box-sizing: border-box; border-radius: 50%; border: 2px solid rgba(232, 232, 232, .22); border-top-color: #e8e8e8; }
.${P}-msg { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; color: #f4f4f4; }
.${P}-cx { flex: none; display: flex; align-items: center; gap: 6px; color: #d6f376; }
.${P}-cx svg { width: 10px; height: 10px; stroke: #d6f376; stroke-width: 2; stroke-linecap: round; fill: none; }
`;

const PROMPT = 'смешной мем, студийный свет';
const MSG = 'Подготавливаем изображение, это не займет много времени';
const CANCEL = 'Отменить';
// the beat in layout seconds from the card's entrance, stretched to the real cardIn .. lastLand window
const REF = 1.84;
const PRESS = [0.06, 0.2];     // the Generate button is pressed
const TOAST_AT = 0.2;          // the black toast covers the prompt bar and the speckled render fills the canvas
const RES0 = 0.5, RES_LEN = 0.5;   // tile i starts resolving at RES0 + i * step and takes RES_LEN; the last one ends at REF
const SPARKLE = '<svg viewBox="0 0 24 24"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>';

export default {
  id: 'kandinsky',
  label: 'Kandinsky (Fusion Brain)',
  source: {
    platform: "Kandinsky in Fusion Brain's web workspace (Images, dark theme)",
    feature: "Generate pressed: a black toast 'Подготавливаем изображение, это не займет много времени' with a spinner and a lime '✕ Отменить' covers the prompt bar while the canvas fills with a dark speckled low-res render that resolves into the image as the toast clears (adapted to 10 tiles resolving in order, the toast up until the last one)",
    refs: [
      { url: 'https://vkvideo.ru/video-219823705_456239265', retrieved: '2026-10-14' },
      { url: 'https://rutube.ru/video/de57538596145914596153ac9bf57a3e/', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'kandinsky');
    const root = x.el(`<div class="${P}"><div class="${P}-rail"><i></i><i></i><i></i><i></i><b></b><b></b><b></b></div><div class="${P}-cv">${tiles.map((g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/><div class="${P}-nz"></div></div>`).join('')}</div><div class="${P}-bar"><div class="${P}-tabs"><span>Промпт</span><span>Негативный промпт</span><span>Стиль</span><span>Сбросить</span></div><div class="${P}-fd">${x.esc(PROMPT)}</div><div class="${P}-go">${SPARKLE}</div></div><div class="${P}-toast"><i class="${P}-spin"></i><span class="${P}-msg">${x.esc(MSG)}</span><span class="${P}-cx"><svg viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9"/></svg>${x.esc(CANCEL)}</span></div></div>`);
    const bar = root.querySelector(`.${P}-bar`), go = root.querySelector(`.${P}-go`), toast = root.querySelector(`.${P}-toast`), spin = root.querySelector(`.${P}-spin`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ el: n, im: n.querySelector('img'), nz: n.querySelector(`.${P}-nz`), g: tiles[i], vis: null, key: '', pos: '' }));
    ctx.gate(cells.map((c) => c.im));
    const memo = {};
    const put = (key, v, fn) => { if (memo[key] !== v) { memo[key] = v; fn(v); } };

    return {
      root,
      render(t) {
        const L = ctx.lastLand - ctx.cardIn, k = L / REF;
        const s = (t - ctx.cardIn) / k;
        const live = t < ctx.lastLand;            // the toast is up until the last image is in

        // press: the lime button dips as the cursor lands on it
        const pp = seg(s, ...PRESS);
        go.style.transform = pp > 0 && pp < 1 ? `scale(${(1 - 0.1 * Math.sin(Math.PI * pp)).toFixed(4)})` : 'none';

        // the black toast replaces the prompt bar for the whole wait; it clears when the images are in
        const toastOn = s >= TOAST_AT && live;
        put('bar', toastOn, (on) => { bar.style.visibility = on ? 'hidden' : ''; });
        put('toast', toastOn, (on) => {
          toast.style.display = on ? 'flex' : 'none';
          if (!on) { toast.style.opacity = ''; toast.style.transform = ''; spin.style.transform = ''; }
        });
        if (toastOn) {
          const ti = outCubic(seg(s, TOAST_AT, TOAST_AT + 0.07));
          toast.style.opacity = ti >= 1 ? '1' : ti.toFixed(3);
          toast.style.transform = ti >= 1 ? 'none' : `translateY(${(8 * (1 - ti)).toFixed(2)}px)`;
          spin.style.transform = `rotate(${(((t / 0.7) % 1) * 360).toFixed(1)}deg)`;
        }

        // the canvas: empty dotted grid, then a speckled render in every tile, then each resolves into its image in order
        const step = (REF - RES0 - RES_LEN) / (cells.length - 1);
        cells.forEach((c, i) => {
          const showNoise = s >= TOAST_AT;
          if (c.vis !== showNoise) { c.el.style.visibility = showNoise ? 'visible' : 'hidden'; c.vis = showNoise; }
          const a = RES0 + i * step;
          const p = seg(s, a, a + RES_LEN);
          const done = p >= 1;
          const key = done ? 'done' : p > 0 ? `r${p.toFixed(3)}` : 'noise';
          if (c.key !== key) {
            c.key = key;
            if (done) {
              c.im.style.display = 'block'; c.im.style.opacity = ''; c.im.style.filter = restFilter(c.g); c.nz.style.display = 'none';
              c.nz.style.opacity = ''; c.nz.style.backgroundPosition = ''; c.pos = '';
            } else if (p > 0) {
              // resolving: the image comes up out of the render, blurred and grey at first, sharpening to full colour
              const e = outCubic(p);
              c.im.style.display = 'block';
              c.im.style.opacity = clamp(p * 1.6).toFixed(3);
              c.im.style.filter = `${c.g.grade ? `${c.g.grade} ` : ''}blur(${((1 - e) * 7).toFixed(2)}px) saturate(${e.toFixed(3)})`;
              c.nz.style.display = '';
              c.nz.style.opacity = (1 - clamp((p - 0.35) / 0.65)).toFixed(3);
            } else {
              c.im.style.display = 'none'; c.nz.style.display = ''; c.nz.style.opacity = '';
            }
            c.im.style.transform = restTransform(c.g);
          }
          // the render crawls: the speck pattern jumps a few times a second, from the hash of (tile, step)
          if (!done) {
            const st = Math.floor(t * 12), pos = `${Math.floor(hash(i + 7, st) * CELL)}px ${Math.floor(hash(i + 13, st) * CELL)}px, 0 0`;
            if (c.pos !== pos) { c.nz.style.backgroundPosition = pos; c.pos = pos; }
          }
        });
      },
    };
  },
};
