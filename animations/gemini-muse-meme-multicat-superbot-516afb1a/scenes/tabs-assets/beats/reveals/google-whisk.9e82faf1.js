// Google Labs' Whisk create surface (spec .tmp/clone-9e82faf1/reveal-refs/google-whisk/spec.json, confidence 0.62; frames in that
// folder: sheet.png, pending-sheet.png; primary footage BV1tqmZBFEfv, generating t=42.5-51.5 s, finish t=52.0 s). A fixed yellow left
// rail holds the three reference wells (SUBJECT / SCENE / STYLE, dashed rounded squares with a '+'), a pale #EAEAEA canvas holds the
// result tiles, and a full-width prompt card is pinned under them: the prompt text, a yellow 'ADD IMAGES' pill, three small square
// icons and a circular submit button (grey #D0CBD1 idle, near-black #0A0A0A armed). While it works the surface says NOTHING: no
// status string, percentage, bar or spinner (the spec's statusText is empty on purpose, so none is drawn). The result tiles are flat
// #D9D9D9 and each holds one soft white blob that morphs for the whole wait (ragged starburst, rotated square, bow-tie, soft circle,
// a different shape in each sibling at the same moment); the finished image then replaces the tile in a single step (no fade, no
// blur-up, no wipe) and the tile gains its small action chrome. Once the batch is in, the pill reads 'HIDE IMAGES'.
// Adapted to ten images: ten portrait tiles in a 5 x 2 block on the canvas, each morphing while it is pending and hard-swapping to
// its image in reading order on the beat's overlapping cascade (ctx.win(i)). The marks are plain shapes of our own and the face is the
// system UI stack: no Google logo, wordmark or font is drawn or shipped, and the tiles show only our own meme.
// Everything is a pure function of t (the blob's shape, turn and size come from t and a seeded hash; no CSS animation or transition),
// and every tile <img> stays in flow with visibility toggled, never display:none, so a seek paints like a fresh load.
import { injectStyle, hash, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-wk';
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; border-radius: 14px; overflow: hidden; background: #eaeaea; color: #1c1c1c; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; box-shadow: 0 0 0 1px rgba(0, 0, 0, .08); }
.${P}-rail { box-sizing: border-box; flex: none; display: flex; flex-direction: column; width: 84px; padding: 10px 10px 10px; background: #f9d400; }
.${P}-burger { display: block; width: 14px; height: 10px; margin: 2px 0 12px 2px; border-top: 2px solid #1c1c1c; border-bottom: 2px solid #1c1c1c; position: relative; }
.${P}-burger::after { content: ""; position: absolute; left: 0; right: 0; top: 2px; height: 2px; background: #1c1c1c; }
.${P}-lab { margin: 0 0 4px 1px; font-size: 6.5px; line-height: 9px; letter-spacing: .12em; font-weight: 700; text-transform: uppercase; color: #1c1c1c; }
.${P}-well { position: relative; display: grid; place-items: center; box-sizing: border-box; width: 100%; aspect-ratio: 1; margin-bottom: 10px; border: 1px dashed rgba(28, 28, 28, .55); border-radius: 10px; }
.${P}-well svg { width: 22px; height: 22px; fill: none; stroke: #1c1c1c; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-well b { position: absolute; right: 7px; top: 3px; font-size: 11px; line-height: 14px; font-weight: 600; }
.${P}-av { flex: none; display: block; width: 22px; height: 22px; margin-top: auto; border-radius: 50%; background: #1c1c1c; box-shadow: inset 0 0 0 5px #f9d400, inset 0 0 0 11px #1c1c1c; }
.${P}-main { box-sizing: border-box; flex: 1; min-width: 0; padding: 8px 10px 10px; }
.${P}-top { display: flex; align-items: center; justify-content: flex-end; gap: 6px; height: 20px; }
.${P}-lib { padding: 0 8px; border-radius: 999px; background: #fff; font-size: 6.5px; line-height: 16px; letter-spacing: .1em; font-weight: 700; box-shadow: 0 0 0 1px rgba(0, 0, 0, .12); }
.${P}-dot { display: block; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .12); }
.${P}-dot.y { background: #f9d400; }
.${P}-cv { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 870 / 1024; border-radius: 8px; overflow: hidden; background: #d9d9d9; }
.${P}-t img { display: block; width: 100%; height: 100%; object-fit: cover; visibility: hidden; }
.${P}-bw { position: absolute; left: 22%; top: 50%; width: 56%; aspect-ratio: 1; filter: blur(2.6px); }
.${P}-bw i { display: block; width: 100%; height: 100%; background: #f2f2f2; }
.${P}-ch { position: absolute; left: 4px; top: 4px; padding: 0 4px; border-radius: 999px; background: rgba(20, 20, 20, .82); color: #fff; font-size: 5.5px; line-height: 10px; letter-spacing: .08em; font-weight: 700; visibility: hidden; }
.${P}-ch2 { position: absolute; right: 4px; bottom: 4px; width: 10px; height: 10px; border-radius: 50%; background: rgba(255, 255, 255, .9); visibility: hidden; }
.${P}-bar { box-sizing: border-box; margin-top: 10px; padding: 10px 11px 9px; border-radius: 12px; background: #fff; box-shadow: 0 1px 8px rgba(0, 0, 0, .12); }
.${P}-txt { height: 28px; font-size: 10px; line-height: 14px; color: #333; overflow: hidden; }
.${P}-row { display: flex; align-items: center; gap: 7px; }
.${P}-add { display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 10px; border-radius: 999px; background: #f9d400; font-size: 7px; letter-spacing: .12em; font-weight: 800; color: #1c1c1c; white-space: nowrap; }
.${P}-add u { display: block; width: 4px; height: 4px; border-top: 1.5px solid #1c1c1c; border-left: 1.5px solid #1c1c1c; transform: rotate(-45deg); margin-left: -2px; text-decoration: none; }
.${P}-ic { margin-left: auto; display: flex; gap: 7px; }
.${P}-ic i { display: block; width: 14px; height: 14px; box-sizing: border-box; border: 1.5px solid #7a767b; border-radius: 4px; }
.${P}-go { display: grid; place-items: center; flex: none; width: 24px; height: 24px; border-radius: 50%; background: #d0cbd1; }
.${P}-go svg { width: 12px; height: 12px; fill: none; stroke: #fff; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'Make 10 Muse memes of a cheerful ghost holding a handwritten note';
const ICONS = {
  person: '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-4.2 3.6-6 7-6s6.2 1.8 7 6"/>',
  pin: '<path d="M12 21s6.5-5.6 6.5-11A6.5 6.5 0 0 0 5.5 10C5.5 15.4 12 21 12 21z"/><circle cx="12" cy="10" r="2.2"/>',
  brush: '<path d="M4 20c3.5.4 5.5-.8 6-3.6M10 16.4 19.5 5.5 18.6 4.6 8 13.6"/>',
};
const ic = (k) => `<svg viewBox="0 0 24 24">${ICONS[k]}</svg>`;

// the blob: a closed outline of N points; each shape is one set of points and the morph blends two of them
const N = 24;
const SHAPES = 4;           // starburst, square, bow-tie, circle, then round again
const RATE = 2.1;           // shapes per second
function outline(kind, seed) {
  const out = new Array(N * 2);
  for (let k = 0; k < N; k++) {
    const a = (k / N) * 2 * Math.PI, c = Math.cos(a), s = Math.sin(a);
    let x, y;
    if (kind === 0) { const r = (k % 2 ? 0.4 : 1) * (0.78 + 0.22 * hash(seed, k)); x = c * r; y = s * r; }
    else if (kind === 1) { const m = Math.max(Math.abs(Math.cos(a - 0.35)), Math.abs(Math.sin(a - 0.35))); const r = 0.7 / m; x = c * r; y = s * r; }
    else if (kind === 2) { x = c * 0.98; y = s * 0.72 * (0.18 + 0.82 * Math.abs(c)); }
    else { x = c * 0.8; y = s * 0.8; }
    out[k * 2] = x; out[k * 2 + 1] = y;
  }
  return out;
}
const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

export default {
  id: 'google-whisk',
  label: 'Google Whisk',
  source: {
    platform: 'Whisk (Google Labs, labs.google/fx/tools/whisk), subject / scene / style create surface, 2025-12 build',
    feature: 'Wordless pending state (flat grey result tiles each holding a soft white blob that morphs starburst, square, bow-tie, circle) that hard-swaps to the finished image, with the prompt card and reference rail staying put (adapted to 10: ten tiles in a 5 x 2 block, swapping in reading order)',
    refs: [{ url: 'https://www.bilibili.com/video/BV1tqmZBFEfv', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-whisk');
    const tile = (g, i) => `<div class="${P}-t"><div class="${P}-bw"><i></i></div><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}; transform: ${restTransform(g)}; filter: ${restFilter(g)}"/><span class="${P}-ch">REFINE</span><span class="${P}-ch2"></span></div>`;
    const root = x.el(`<div class="${P}">
<div class="${P}-rail"><i class="${P}-burger"></i>
<div class="${P}-lab">Subject</div><div class="${P}-well">${ic('person')}<b>+</b></div>
<div class="${P}-lab">Scene</div><div class="${P}-well">${ic('pin')}<b>+</b></div>
<div class="${P}-lab">Style</div><div class="${P}-well">${ic('brush')}<b>+</b></div>
<i class="${P}-av"></i></div>
<div class="${P}-main"><div class="${P}-top"><span class="${P}-lib">MY LIBRARY</span><i class="${P}-dot y"></i><i class="${P}-dot"></i></div>
<div class="${P}-cv">${tiles.map(tile).join('')}</div>
<div class="${P}-bar"><div class="${P}-txt">${x.esc(PROMPT)}</div><div class="${P}-row"><span class="${P}-add"><u></u><span>ADD IMAGES</span></span><span class="${P}-ic"><i></i><i></i><i></i></span><span class="${P}-go"><svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg></span></div></div></div></div>`);
    const slots = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({
      n, im: n.querySelector('img'), bw: n.querySelector(`.${P}-bw`), shape: n.querySelector(`.${P}-bw i`), ch: n.firstElementChild.nextElementSibling.nextElementSibling, ch2: n.lastElementChild,
      ph: hash(31, i) * SHAPES, spin: hash(47, i) * 360,
    }));
    const add = root.querySelector(`.${P}-add span`), chev = root.querySelector(`.${P}-add u`), go = root.querySelector(`.${P}-go`);
    ctx.gate(slots.map((s) => s.im));

    return {
      root,
      render(t) {
        slots.forEach((s, i) => {
          const swap = ctx.win(i)[1];
          const landed = t >= swap;
          const tt = Math.min(t, swap);   // the blob freezes at the swap, so the state is a function of t alone
          const f = tt * RATE + s.ph, k = Math.floor(f), e = smooth(0.3, 1, f - k);
          const a = outline(k % SHAPES, i * 17 + k), b = outline((k + 1) % SHAPES, i * 17 + k + 1);
          let pts = '';
          for (let j = 0; j < N; j++) pts += `${(50 + 49 * (a[j * 2] + (b[j * 2] - a[j * 2]) * e)).toFixed(2)}% ${(50 + 49 * (a[j * 2 + 1] + (b[j * 2 + 1] - a[j * 2 + 1]) * e)).toFixed(2)}%${j < N - 1 ? ',' : ''}`;
          s.shape.style.clipPath = `polygon(${pts})`;
          const grow = 0.94 + 0.06 * Math.sin(tt * 3.4 + i);
          s.bw.style.transform = `translateY(-50%) rotate(${(s.spin + tt * 38).toFixed(1)}deg) scale(${grow.toFixed(4)})`;
          s.bw.style.visibility = landed ? 'hidden' : 'visible';
          s.im.style.visibility = landed ? 'visible' : 'hidden';
          s.ch.style.visibility = s.ch2.style.visibility = landed ? 'visible' : 'hidden';
        });
        // the prompt card: submit goes from idle grey to armed near-black as the batch is sent; 'ADD IMAGES' becomes 'HIDE IMAGES' once it is in
        const hide = t >= ctx.lastLand;
        go.style.background = t < ctx.cardIn + 0.12 ? '#d0cbd1' : '#0a0a0a';
        const label = hide ? 'HIDE IMAGES' : 'ADD IMAGES';
        if (add.textContent !== label) add.textContent = label;
        chev.style.display = hide ? 'block' : 'none';
      },
    };
  },
};
