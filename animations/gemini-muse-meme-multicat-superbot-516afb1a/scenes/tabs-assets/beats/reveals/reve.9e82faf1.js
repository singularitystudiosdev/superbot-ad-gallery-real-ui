// Reve 2.0, the current light web app (observed in the first-party screen recording on x.com/reve/status/2082882336702751170,
// 2026-07-30; spec .tmp/clone-9e82faf1/reveal-refs/reve/spec.json, confidence 0.62; frames reveal-refs/reve/frames2/j30_0001..0064,
// t=32-48 s at 4 fps). A white app: on the left an album's image grid with a small icon row above it (overflow, trash, bookmark,
// download), on the right a chat panel with a 'Create | Edit' tab pair. The user's prompt is a light-grey bubble, the assistant
// answers with one short description line, and the generation is a small rounded card right under that line, with a small brand
// mark beneath it while it works. While generating, the card shows a heavily blurred, low-resolution blue and violet render of
// the target: blocky nested rectangles from its coarse upscale steps, no percentage, no countdown, no spinner, no queue text. It
// then resolves, in place and in the same footprint, into the finished image. The composer is a rounded pill: mic, @ and slash
// on the left, a sliders icon and a round up-arrow send button on the right.
// Adapted to ten images: ten cards sit in the chat panel under one assistant line, each mirrored as a tile in the album grid,
// and they resolve in order, one at a time, through stepped blur and tint levels with nested rectangles, so by lastLand all ten
// are sharp. Unconfirmed in 2.0 and so left out: the 'Stop' pill and the 'Ask another while I work...' hint. The brand mark is a
// plain stand-in shape of our own (not their butterfly or logo), the icons are drawn as plain shapes, the face is the system UI
// stack, and every tile shows only our own meme.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, hash, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-rv';
const H = 330, LEFT = 200;   // the app's height and the album pane's width, px; the chat panel takes the rest of 560
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; width: 560px; max-width: 100%; height: ${H}px; border-radius: 14px; overflow: hidden; background: #ffffff; box-shadow: 0 0 0 1px rgba(0, 0, 0, .09); color: #151517; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-lf { flex: none; box-sizing: border-box; width: ${LEFT}px; padding: 10px 10px 0; background: #f6f6f7; }
.${P}-tb { display: flex; align-items: center; gap: 9px; height: 22px; }
.${P}-crumb { flex: 1; min-width: 0; font-size: 10.5px; line-height: 14px; color: #8b8b92; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-crumb b { font-weight: 500; color: #45454b; }
.${P}-ic { flex: none; display: block; width: 11px; height: 11px; box-sizing: border-box; border: 1.4px solid #9a9aa1; border-radius: 3px; }
.${P}-ic.dots { border: 0; border-radius: 0; background: radial-gradient(circle, #9a9aa1 1.3px, transparent 1.6px) 0 50% / 4px 11px repeat-x; }
.${P}-al { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px; margin-top: 10px; }
.${P}-rt { flex: 1; min-width: 0; display: flex; flex-direction: column; box-sizing: border-box; padding: 0 14px 12px; background: #ffffff; box-shadow: -1px 0 0 rgba(0, 0, 0, .06); }
.${P}-tabs { display: flex; gap: 16px; height: 34px; align-items: center; font-size: 12.5px; line-height: 16px; color: #9a9aa1; }
.${P}-tabs span { position: relative; padding: 9px 0; }
.${P}-tabs .on { color: #151517; font-weight: 600; }
.${P}-tabs .on::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; border-radius: 1px; background: #151517; }
.${P}-me { display: flex; justify-content: flex-end; margin-top: 8px; }
.${P}-me span { display: block; padding: 6px 12px; border-radius: 14px; background: #efeff1; font-size: 12px; line-height: 17px; color: #26262a; }
.${P}-as { margin-top: 9px; font-size: 12px; line-height: 17px; color: #3b3b41; }
.${P}-cd { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 9px; }
.${P}-mk { display: block; width: 13px; height: 13px; margin-top: 8px; border-radius: 4px; background: #c9c9d0; transform: rotate(45deg) scale(.82); }
.${P}-t { position: relative; border-radius: 8px; overflow: hidden; background: #efeff2; }
.${P}-t.sq { aspect-ratio: 1; }
.${P}-t.ls { height: 52px; border-radius: 6px; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-tint, .${P}-bx { position: absolute; inset: 0; display: none; }
.${P}-bx i { position: absolute; display: block; box-sizing: border-box; border: 1px solid rgba(255, 255, 255, .42); background: rgba(255, 255, 255, .06); }
.${P}-bx i.dk { border-color: rgba(18, 26, 96, .3); background: rgba(18, 26, 96, .1); }
.${P}-cp { display: flex; align-items: center; gap: 9px; height: 38px; margin-top: auto; box-sizing: border-box; padding: 0 6px 0 12px; border-radius: 19px; background: #f4f4f6; box-shadow: 0 0 0 1px rgba(0, 0, 0, .05); font-size: 11.5px; color: #9a9aa1; }
.${P}-cp .gl { flex: none; font-size: 12px; line-height: 12px; color: #8b8b92; }
.${P}-cp .mic { flex: none; display: block; width: 5px; height: 9px; box-sizing: border-box; border: 1.3px solid #8b8b92; border-radius: 3px; }
.${P}-cp b { flex: 1; min-width: 0; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-sl { flex: none; position: relative; width: 13px; height: 9px; border-top: 1.3px solid #8b8b92; border-bottom: 1.3px solid #8b8b92; box-sizing: border-box; }
.${P}-go { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #17171a; }
.${P}-go svg { width: 13px; height: 13px; fill: none; stroke: #fff; stroke-width: 2.3; stroke-linecap: round; stroke-linejoin: round; }
`;

const ARROW = '<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>';
const STEPS = 6;                                  // stage 0 is the bare colour field; stages 1..5 step the blur down
const BLUR = [0, 9, 6.5, 4.5, 2.8, 1.4];          // px of the stepped blur, per stage (the tile is ~60-80 px wide)
const TINT = [1, 0.78, 0.64, 0.5, 0.34, 0.18];    // the blue-violet wash's opacity, per stage
const BOXES = [4, 4, 3, 3, 2, 1];                 // nested rectangles, per stage: fewer and tighter as the render sharpens
const OVER = [0, 1.3, 1.26, 1.2, 1.14, 1.08];     // extra scale that keeps the blur's soft edge outside the tile

export default {
  id: 'reve',
  label: 'Reve',
  source: {
    platform: 'Reve (app.reve.com web app, version 2.0 light UI): album image grid beside the Create | Edit chat panel',
    feature: "A heavily blurred, low-resolution blue and violet render with blocky nested rectangles, no progress text, that resolves in place into the image under the assistant's description line (adapted to 10: ten cards resolving in order, mirrored in the album grid)",
    refs: [
      { url: 'https://x.com/reve/status/2082882336702751170', retrieved: '2026-10-14' },
      { url: 'https://x.com/reve/status/2062260665121919101', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'reve');
    // each tile's wash: blue to violet at its own angle, with a small warm patch where the subject sits
    const wash = (i) => {
      const a = Math.round(110 + hash(i, 3) * 70);
      const v = Math.round(hash(i, 5) * 40);
      return `radial-gradient(circle at ${Math.round(35 + hash(i, 7) * 30)}% 42%, rgba(240, 150, 120, .34), rgba(240, 150, 120, 0) 55%), linear-gradient(${a}deg, rgb(${44 + v}, ${92 - v / 2}, 214) 0%, rgb(${96 + v}, ${66 + v / 3}, 208) 60%, rgb(${52 + v / 2}, ${130 - v}, 216) 100%)`;
    };
    const cell = (cls, i) => `<div class="${P}-t ${cls}"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${tiles[i].origin}"/><div class="${P}-tint" style="background: ${wash(i)}"></div><div class="${P}-bx">${'<i></i>'.repeat(4)}</div></div>`;
    const ids = tiles.map((_, i) => i);
    const root = x.el(`<div class="${P}"><div class="${P}-lf"><div class="${P}-tb"><span class="${P}-crumb"><b>Muse memes</b><span class="cr"></span></span><i class="${P}-ic dots"></i><i class="${P}-ic"></i><i class="${P}-ic"></i><i class="${P}-ic"></i></div><div class="${P}-al">${ids.map((i) => cell('ls', i)).join('')}</div></div><div class="${P}-rt"><div class="${P}-tabs"><span class="on">Create</span><span>Edit</span></div><div class="${P}-me"><span>Create ten Muse memes</span></div><div class="${P}-as">Making ten Muse memes for you, one after another.</div><div class="${P}-cd">${ids.map((i) => cell('sq', i)).join('')}</div><i class="${P}-mk"></i><div class="${P}-cp"><span class="mic"></span><span class="gl">@</span><span class="gl">/</span><b>Describe what to create</b><span class="${P}-sl"></span><span class="${P}-go">${ARROW}</span></div></div></div>`);
    const crumb = root.querySelector('.cr'), mark = root.querySelector(`.${P}-mk`);
    // twenty views of ten images: card i is entry i, its album tile is entry i + 10
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, k) => {
      const i = k % tiles.length;
      return { n, i, im: n.querySelector('img'), tint: n.querySelector(`.${P}-tint`), bx: n.querySelector(`.${P}-bx`), rects: [...n.querySelectorAll(`.${P}-bx i`)], g: tiles[i], state: null };
    });
    ctx.gate(cells.map((c) => c.im));

    // the stage of tile i at t: -1 waiting its turn, 0..5 the stepped render, 6 resolved (a pure function of t)
    const stage = (t, i) => {
      const [a, b] = ctx.seq(i);
      if (t >= b) return STEPS;
      if (t < a) return -1;
      return Math.min(STEPS - 1, Math.floor(seg(t, a, b) * STEPS));
    };
    // nested rectangles snapped to a coarse grid, so the steps read as blocky; each stage draws its own set
    const boxes = (c, s) => {
      const n = BOXES[s];
      c.rects.forEach((r, j) => {
        r.style.display = j < n ? 'block' : 'none';
        if (j >= n) return;
        const w = 0.46 + 0.5 * hash(c.i * 11 + j, s + 40) - j * 0.07;
        const h = 0.4 + 0.5 * hash(c.i * 11 + j, s + 60) - j * 0.06;
        const left = Math.round(((1 - w) * hash(c.i * 11 + j, s + 80) * 100) / 6) * 6;
        const top = Math.round(((1 - h) * hash(c.i * 11 + j, s + 90) * 100) / 6) * 6;
        r.style.left = `${left}%`; r.style.top = `${top}%`;
        r.style.width = `${Math.round(w * 100 / 6) * 6}%`; r.style.height = `${Math.round(h * 100 / 6) * 6}%`;
        r.className = j % 2 ? 'dk' : '';
      });
    };

    const memo = {};
    const put = (key, v, fn) => { if (memo[key] !== v) { memo[key] = v; fn(v); } };

    return {
      root,
      render(t) {
        cells.forEach((c) => {
          const s = stage(t, c.i);
          if (s === c.state) return;
          c.state = s;
          const g = c.g;
          if (s === -1) {                          // waiting: an empty light slot
            c.im.style.display = 'none'; c.tint.style.display = 'none'; c.bx.style.display = 'none';
            return;
          }
          if (s === STEPS) {                       // resolved: the image rests in its crop's own CSS
            c.im.style.display = 'block'; c.im.style.opacity = ''; c.im.style.filter = restFilter(g); c.im.style.transform = restTransform(g);
            c.tint.style.display = 'none'; c.bx.style.display = 'none';
            return;
          }
          // generating: a blurred low-res render, blocky nested rectangles on a blue-violet wash, stepped by stage
          c.tint.style.display = 'block'; c.tint.style.opacity = TINT[s].toFixed(2);
          c.bx.style.display = 'block'; boxes(c, s);
          if (s === 0) { c.im.style.display = 'none'; return; }
          c.im.style.display = 'block'; c.im.style.opacity = '';
          c.im.style.filter = `${g.grade ? `${g.grade} ` : ''}blur(${BLUR[s]}px) saturate(1.25)`;
          c.im.style.transform = `scale(${(g.zoom * OVER[s]).toFixed(4)})`;
        });
        // the stand-in mark sits under the cards while they generate; the breadcrumb says so, then settles
        const going = t < ctx.lastLand;
        put('going', going, (on) => { mark.style.visibility = on ? '' : 'hidden'; crumb.textContent = on ? ' / Creating...' : ''; });
      },
    };
  },
};
