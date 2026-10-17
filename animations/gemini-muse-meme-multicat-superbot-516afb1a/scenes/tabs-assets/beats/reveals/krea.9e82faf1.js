// A realtime canvas-and-output tool (the screen recordings under .tmp/clone-9e82faf1/reveal-refs/krea, spec confidence 0.75):
// a near-black page split by a 1px divider into a left input canvas (a flat #a3a3a3 with a faint square grid) and a right,
// flush live-output panel; a near-black rounded prompt box along the bottom with a blinking caret and a round submit button
// ringed in teal. There is NO progress bar, ring, tile or pending tile anywhere: the output simply holds the previous frame
// at full sharpness, then melts into a heavy blur (about 14-20 px, washed-out colour) that already carries the new picture's
// palette and firms up into it in a fraction of a second. Ten images: the output panel morphs through the ten in order and
// the landed ones collect in a filmstrip beneath it. The product's wordmark and watermark are not drawn (plain text only).
import { seg, outCubic, blink } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-kr';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; border-radius: 12px; background: #0f0f0f; color: #d4d4d8; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #26262a; }
.${P}-top { display: flex; justify-content: center; gap: 22px; height: 24px; font-size: 10px; line-height: 24px; color: #8b8b93; }
.${P}-top b { font-weight: 600; color: #f4f4f5; }
.${P}-pan { display: grid; grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr); height: 276px; }
.${P}-in { position: relative; background-color: #a3a3a3; background-image: linear-gradient(rgba(0, 0, 0, .07) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, .07) 1px, transparent 1px); background-size: 23px 23px; }
.${P}-rail { position: absolute; left: 7px; top: 14px; display: flex; flex-direction: column; gap: 5px; padding: 5px; border-radius: 8px; background: #0f0f10; }
.${P}-rail i { display: block; width: 11px; height: 11px; border-radius: 3px; background: #4a4a50; }
.${P}-rail i:nth-child(2) { border-radius: 50%; }
.${P}-rail i.r { background: #dc2626; border-radius: 50%; }
.${P}-div { background: #3e3e42; }
.${P}-out { position: relative; overflow: hidden; background: #070708; }
.${P}-out img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-act { position: absolute; right: 8px; bottom: 8px; display: flex; gap: 5px; }
.${P}-act span { height: 18px; padding: 0 8px; border-radius: 9px; background: rgba(8, 8, 9, .72); font-size: 8.5px; line-height: 18px; color: #e4e4e7; }
.${P}-film { display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 6px; padding: 8px 8px 0; }
.${P}-f { position: relative; aspect-ratio: 1; border-radius: 6px; background: #151517; box-shadow: inset 0 0 0 1px #26262a; overflow: hidden; }
.${P}-f img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-f.on::after { content: ""; position: absolute; inset: 0; border-radius: 6px; box-shadow: inset 0 0 0 2px #2dd4bf; }
.${P}-box { display: flex; align-items: center; gap: 9px; height: 38px; margin: 8px; padding: 0 6px 0 11px; border-radius: 12px; background: #040405; box-shadow: 0 0 0 1px #1c1c1f; }
.${P}-brush { flex: none; width: 13px; height: 13px; border-radius: 50% 50% 50% 0; border: 1.6px solid #71717a; box-sizing: border-box; transform: rotate(-45deg); }
.${P}-txt { flex: 1; min-width: 0; font-size: 10.5px; color: #d4d4d8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-txt i { display: inline-block; width: 1.5px; height: 12px; margin-left: 1px; vertical-align: -2px; background: #3b82f6; }
.${P}-go { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 50%; background: #0a0a0b; box-shadow: 0 0 0 2px #14b8a6; }
.${P}-go svg { width: 12px; height: 12px; fill: none; stroke: #f4f4f5; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
`;

const BLUR = 18;        // the mid-morph blur, px (the recordings read 14-20)
const SPLIT = 0.4;      // the share of each morph in which the previous picture melts away before the next firms up
const PROMPT = 'a cheerful ghost holding a handwritten note in a lecture hall, soft light';

export default {
  id: 'krea',
  label: 'Krea',
  source: {
    platform: 'krea.ai Realtime (split canvas: input left, live output right)',
    feature: 'Realtime live output panel: the right-hand output holds the last frame, then morphs through a heavy blur into the next (adapted to 10 images)',
    refs: [{ url: 'https://www.youtube.com/watch?v=NENTuJ1y-J4', retrieved: '2026-10-14' }],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles, count } = ctx;
    const src = ownSrc(ctx.src, 'krea');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span>Home</span><b>Generate</b><span>Enhance</span></div><div class="${P}-pan"><div class="${P}-in"><div class="${P}-rail"><i></i><i></i><i></i><i class="r"></i></div></div><div class="${P}-div"></div><div class="${P}-out"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme output"/><div class="${P}-act"><span>Upscale</span><span>Download</span></div></div></div><div class="${P}-film">${tiles.map((g, i) => `<div class="${P}-f"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`).join('')}</div><div class="${P}-box"><i class="${P}-brush"></i><span class="${P}-txt">${x.esc(PROMPT)}<i></i></span><span class="${P}-go"><svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg></span></div></div>`);
    const big = root.querySelector(`.${P}-out img`), caret = root.querySelector(`.${P}-txt i`);
    const fs = [...root.querySelectorAll(`.${P}-f`)].map((n) => ({ n, im: n.querySelector('img'), shown: false }));
    ctx.gate([big, ...fs.map((f) => f.im)]);

    let shownIdx = -2, vis = null, cur = null;
    return {
      root,
      render(t) {
        let landed = 0;
        while (landed < count && seg(t, ...ctx.seq(landed)) >= 1) landed++;
        fs.forEach((f, i) => {
          const on = i < landed;
          if (f.shown !== on) { f.im.style.display = on ? 'block' : 'none'; f.shown = on; }
          f.im.style.filter = restFilter(tiles[i]);
          f.im.style.transform = restTransform(tiles[i]);
        });
        // the current ring follows the newest landed frame
        fs.forEach((f, i) => f.n.classList.toggle('on', i === landed - 1));
        // the output: which picture is on the panel, and how blurred
        let idx = -1, blur = 0, sat = 1;
        if (landed === count) idx = count - 1;
        else {
          const p = seg(t, ...ctx.seq(landed));
          if (p < SPLIT) {
            idx = landed - 1;
            const m = outCubic(p / SPLIT);
            blur = BLUR * m; sat = 1 - 0.25 * m;
          } else {
            idx = landed;
            const m = 1 - outCubic((p - SPLIT) / (1 - SPLIT));
            blur = BLUR * m; sat = 1 - 0.25 * m;
          }
        }
        const on = idx >= 0;
        if (on !== vis) { big.style.display = on ? 'block' : 'none'; vis = on; }
        if (on) {
          const g = tiles[idx];
          if (idx !== shownIdx) { big.style.transformOrigin = g.origin; shownIdx = idx; }
          big.style.filter = blur < 0.05 ? restFilter(g) : `blur(${blur.toFixed(2)}px) saturate(${sat.toFixed(3)}) ${g.grade}`.trim();
          big.style.transform = restTransform(g);
        }
        const c = blink(t) ? 'visible' : 'hidden';
        if (c !== cur) { caret.style.visibility = c; cur = c; }
      },
    };
  },
};
