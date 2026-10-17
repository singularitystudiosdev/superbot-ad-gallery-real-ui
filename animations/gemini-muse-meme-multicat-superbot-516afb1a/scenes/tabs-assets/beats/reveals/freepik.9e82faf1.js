// Freepik's AI image generator page (observed in the screen recording youtube jy11xi0mKcQ, t=236-248 s; spec
// .tmp/clone-9e82faf1/reveal-refs/freepik/spec.json, confidence 0.62; frames reveal-refs/freepik/frames/fr2_*, probes
// d3/fpZ/z_14.png and z_16.png). A near-black page: a centred nav pill (Explore | Create | Edit | My creations), a thin icon rail
// on the left, a centre result canvas (History and Inspiration buttons, the batch's prompt line, then the batch) and a right
// 'Prompt' panel with the prompt box, a few setting rows and a purple Generate button. A new batch appears as flat mid-dark-grey
// rounded tiles (#343434 to #373737) with a faint ring spinner at the centre and no text at all: no percentage, no
// 'Generating', no shimmer. Each tile is then replaced in place by its finished image, one after another.
// Adapted to ten images: the batch is two rows of five tiles in the canvas, every one spinning at once, resolving in order
// until the batch is full. The ring spinner is drawn by render(t), not by CSS. No Freepik logo or wordmark: the nav is plain
// text, the icons are plain shapes, the face is the system UI stack, and every tile shows only our own meme.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-fp';
const H = 318, NAV = 34, RAIL = 40, PANEL = 156;   // the page's height, the nav's, the icon rail's and the Prompt panel's widths, px
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${H}px; border-radius: 12px; overflow: hidden; background: #0e0e0f; box-shadow: 0 0 0 1px rgba(255, 255, 255, .06); color: #e5e5e5; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-nav { flex: none; display: flex; align-items: center; justify-content: center; height: ${NAV}px; }
.${P}-pill { display: flex; align-items: center; gap: 2px; height: 24px; padding: 0 3px; border-radius: 12px; background: #1c1c1e; font-size: 10.5px; line-height: 14px; color: #b8b8b8; }
.${P}-pill span { padding: 4px 11px; border-radius: 10px; }
.${P}-pill .on { background: #3a3a3b; color: #f2f2f2; }
.${P}-bd { flex: 1; min-height: 0; display: flex; gap: 8px; padding: 0 8px 8px 0; }
.${P}-rl { flex: none; width: ${RAIL}px; display: flex; flex-direction: column; align-items: center; gap: 10px; padding-top: 8px; }
.${P}-rl i { display: block; width: 14px; height: 14px; box-sizing: border-box; border: 1.4px solid #6d6d70; border-radius: 4px; }
.${P}-rl i.on { border-color: #e5e5e5; }
.${P}-ct { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 8px 8px 0; border-radius: 10px; background: #161617; }
.${P}-btns { display: flex; gap: 6px; }
.${P}-btns span { height: 22px; line-height: 22px; box-sizing: border-box; padding: 0 10px; border-radius: 6px; background: #2b2b2d; font-size: 10px; color: #dedede; }
.${P}-cap { margin: 10px 0 5px 2px; font-size: 9.5px; line-height: 13px; color: #a9a9ab; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-grp { padding: 5px; border-radius: 7px; background: #1e1e1f; }
.${P}-gr { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 5px; }
.${P}-t { position: relative; aspect-ratio: 4 / 5; border-radius: 6px; overflow: hidden; background: #343434; }
.${P}-t.b { background: #373737; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-sp { position: absolute; left: 50%; top: 50%; width: 15px; height: 15px; margin: -7.5px 0 0 -7.5px; box-sizing: border-box; border-radius: 50%; border: 1.4px solid rgba(255, 255, 255, .1); }
.${P}-sp::after { content: ""; position: absolute; left: 50%; top: -1.9px; width: 2.4px; height: 2.4px; margin-left: -1.2px; border-radius: 50%; background: rgba(255, 255, 255, .5); }
.${P}-pn { flex: none; box-sizing: border-box; width: ${PANEL}px; display: flex; flex-direction: column; gap: 6px; padding: 9px; border-radius: 10px; background: #1c1c1e; }
.${P}-pn h6 { margin: 0; font-size: 10.5px; line-height: 14px; font-weight: 600; color: #f0f0f0; }
.${P}-box { box-sizing: border-box; height: 52px; padding: 6px 8px; border-radius: 7px; background: #2b2b2d; font-size: 10px; line-height: 13px; color: #dcdcdc; }
.${P}-row { display: flex; align-items: center; justify-content: space-between; height: 24px; box-sizing: border-box; padding: 0 8px; border-radius: 6px; background: #262628; font-size: 9.5px; color: #c4c4c6; }
.${P}-row i { display: block; width: 5px; height: 5px; border-top: 1.4px solid #7d7d80; border-right: 1.4px solid #7d7d80; transform: rotate(45deg); }
.${P}-go { margin-top: auto; height: 28px; line-height: 28px; border-radius: 7px; background: #7a5cd8; text-align: center; font-size: 10.5px; font-weight: 600; color: #fff; }
`;

const PROMPT = 'make me 10 muse memes';
const NAV_ITEMS = ['Explore', 'Create', 'Edit', 'My creations'];
const ROWS = ['Model', 'Style', 'Aspect ratio'];
const TURN = 1.15;   // one turn of the ring spinner, s

export default {
  id: 'freepik',
  label: 'Freepik',
  source: {
    platform: 'Freepik AI image generator page (dark UI): left rail, centre result canvas, right Prompt panel',
    feature: 'A batch of flat dark-grey rounded tiles, each with a faint centred ring spinner and no text, percentage or shimmer, replaced in place by the finished images one at a time (adapted to 10: two rows of five tiles, all spinning, resolving in order)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=jy11xi0mKcQ', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=ppmZ5esdgP8', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'freepik');
    const tile = (g, i) => `<div class="${P}-t${(i + Math.floor(i / 5)) % 2 ? ' b' : ''}"><span class="${P}-sp"></span><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-nav"><div class="${P}-pill">${NAV_ITEMS.map((n) => `<span${n === 'Create' ? ' class="on"' : ''}>${n}</span>`).join('')}</div></div><div class="${P}-bd"><div class="${P}-rl"><i class="on"></i><i></i><i></i><i></i></div><div class="${P}-ct"><div class="${P}-btns"><span>History</span><span>Inspiration</span></div><div class="${P}-cap">@muse ${x.esc(PROMPT)}</div><div class="${P}-grp"><div class="${P}-gr">${tiles.map(tile).join('')}</div></div></div><div class="${P}-pn"><h6>Prompt</h6><div class="${P}-box">${x.esc(PROMPT)}</div>${ROWS.map((n) => `<div class="${P}-row">${n}<i></i></div>`).join('')}<div class="${P}-go">Generate</div></div></div></div>`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), sp: n.querySelector(`.${P}-sp`), g: tiles[i], state: null }));
    ctx.gate(cells.map((c) => c.im));
    const ends = tiles.map((_, i) => ctx.seq(i)[1]);   // tile i is replaced by its image at its window's end

    return {
      root,
      render(t) {
        // every pending tile carries the ring, its dot turning with t; a landed tile shows its image at its crop's own CSS
        const turn = ((t / TURN) % 1 + 1) % 1;
        const rot = `rotate(${(turn * 360).toFixed(1)}deg)`;
        cells.forEach((c, i) => {
          const landed = t >= ends[i];
          if (landed !== c.state) {
            c.state = landed;
            c.im.style.display = landed ? 'block' : 'none';
            c.sp.style.display = landed ? 'none' : '';
            if (landed) { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); }
          }
          if (!landed) c.sp.style.transform = rot;
        });
      },
    };
  },
};
