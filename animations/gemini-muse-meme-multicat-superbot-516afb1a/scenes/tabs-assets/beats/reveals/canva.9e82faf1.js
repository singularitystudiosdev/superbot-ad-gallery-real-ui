// Canva's editor, the classic left-rail Magic Media panel (observed in the 'How to Generate AI Images & Videos in Canva | Magic
// Media Tutorial' screen recording, youtube 17phfrdETHA t=53.5-56.0 s; spec .tmp/clone-9e82faf1/reveal-refs/canva/spec.json,
// confidence 0.72; frames reveal-refs/canva/frames/cv2_* plus the probes d3/cvP/c_53.6.png and montage d3/cvZ/w_01.png). A light
// editor: a slim top bar, an icon rail with the Magic Media entry lit, a near-white panel with a header, an Images | Graphics |
// Videos | 3D tab row and a grid of thumbnails, and a pale canvas holding a page. On Generate the panel's prompt form is REPLACED
// by a pending card under the thumbnails: the centred caption 'Wait with us while we generate "<prompt>"', a determinate
// progress bar (fill #00ABC7 to #3F97B8 on a #E0E2E4 track, no percentage number) and a white 'Cancel' button. The in-flight
// thumbnails are empty near-white tiles carrying a small pastel image glyph; each is replaced in place by its finished image,
// one at a time, and when the set is done the pending card gives way to the form again.
// Adapted to ten images: the thumbnail grid grows to ten slots (four to begin with, one more as each image lands) and the
// ten fill in order while the bar tracks the count; then the pending card gives way to the finished thumbnails and the first
// image is placed on the page. Plain shapes only: no Canva logo, wordmark or glyph, the face is the system UI stack, and every
// tile shows only our own meme.
import { clamp, seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cv';
const H = 376, BAR = 26, RAIL = 50, PANEL = 262;   // the editor's height, its top bar's, the icon rail's and the panel's widths, px
const COLS = 4, GAP = 6, SLOTS0 = 4;               // the thumbnail grid's columns and gap; the slots there before any image lands
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${H}px; border-radius: 12px; overflow: hidden; background: #f3f5f5; box-shadow: 0 0 0 1px rgba(14, 19, 24, .1); color: #0e1318; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 14px; height: ${BAR}px; padding: 0 10px; background: linear-gradient(90deg, #1eb2c8 0%, #4b8fd0 52%, #7b3fe3 100%); font-size: 10.5px; line-height: 14px; font-weight: 600; color: #fff; white-space: nowrap; }
.${P}-top .${P}-sp { flex: 1; }
.${P}-top .${P}-sh { padding: 3px 11px; border-radius: 6px; background: #fff; color: #1b1340; font-weight: 600; }
.${P}-bd { flex: 1; min-height: 0; display: flex; }
.${P}-rl { flex: none; box-sizing: border-box; width: ${RAIL}px; padding: 8px 0; display: flex; flex-direction: column; align-items: center; gap: 9px; background: #fcfcfc; box-shadow: 1px 0 0 rgba(14, 19, 24, .08); }
.${P}-ri { display: flex; flex-direction: column; align-items: center; gap: 3px; width: 44px; padding: 3px 0; border-radius: 6px; font-size: 7.5px; line-height: 9px; color: #3b4148; }
.${P}-ri i { display: block; width: 14px; height: 14px; box-sizing: border-box; border: 1.4px solid #4a5058; border-radius: 4px; }
.${P}-ri.${P}-on { color: #8b3dff; font-weight: 600; }
.${P}-ri.${P}-on i { border-color: #8b3dff; background: rgba(139, 61, 255, .14); }
.${P}-pn { flex: none; box-sizing: border-box; width: ${PANEL}px; padding: 10px 12px 10px; display: flex; flex-direction: column; background: #fcfcfc; box-shadow: 1px 0 0 rgba(14, 19, 24, .08); }
.${P}-hd { display: flex; align-items: center; justify-content: space-between; height: 20px; font-size: 12px; line-height: 16px; font-weight: 600; }
.${P}-hd i { display: block; width: 12px; height: 12px; box-sizing: border-box; border: 1.4px solid #3b4148; border-radius: 50%; }
.${P}-tabs { display: flex; gap: 14px; height: 26px; margin-top: 4px; font-size: 10.5px; line-height: 14px; color: #4a5058; }
.${P}-tabs span { position: relative; padding: 5px 0; }
.${P}-tabs .${P}-on { color: #0e1318; font-weight: 600; }
.${P}-tabs .${P}-on::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; border-radius: 1px; background: #7d2ae8; }
.${P}-gr { flex: none; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; align-content: start; height: 178px; margin-top: 8px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #ffffff; box-shadow: 0 0 0 1px rgba(14, 19, 24, .06); }
.${P}-t b { position: absolute; left: 50%; top: 50%; width: 17px; height: 17px; margin: -8.5px 0 0 -8.5px; border-radius: 5px; background: #cde9cc; }
.${P}-t b::after { content: ""; position: absolute; left: 4px; bottom: 3.5px; width: 0; height: 0; border-left: 4.5px solid transparent; border-right: 4.5px solid transparent; border-bottom: 6px solid rgba(255, 255, 255, .92); }
.${P}-t b::before { content: ""; position: absolute; left: 10px; top: 3px; width: 3.5px; height: 3.5px; border-radius: 50%; background: rgba(255, 255, 255, .92); }
.${P}-t.${P}-k1 b { background: #e3d7f6; }
.${P}-t.${P}-k2 b { background: #cfe3f7; }
.${P}-t img { position: absolute; inset: 0; display: none; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend, .${P}-form { flex: 1; min-height: 0; margin-top: 8px; }
.${P}-pend { display: flex; flex-direction: column; align-items: stretch; }
.${P}-cap { text-align: center; font-size: 11px; line-height: 15px; color: #0e1318; padding: 0 4px; }
.${P}-trk { height: 8px; margin-top: 10px; border-radius: 4px; background: #e0e2e4; overflow: hidden; }
.${P}-fill { height: 100%; width: 0; border-radius: 4px; background: linear-gradient(90deg, #00abc7, #3f97b8); }
.${P}-cx { margin-top: 10px; height: 26px; line-height: 24px; box-sizing: border-box; border-radius: 6px; border: 1px solid #c8cdd1; background: #fff; text-align: center; font-size: 11px; font-weight: 500; color: #0e1318; }
.${P}-form { display: none; flex-direction: column; }
.${P}-box { position: relative; box-sizing: border-box; height: 44px; padding: 7px 9px; border-radius: 7px; border: 1px solid #d5d9dc; background: #fff; font-size: 10.5px; line-height: 14px; color: #0e1318; }
.${P}-box u { position: absolute; right: 9px; bottom: 5px; text-decoration: none; font-size: 9.5px; color: #4a5058; }
.${P}-opt { display: flex; gap: 6px; margin-top: 6px; }
.${P}-opt span { height: 22px; line-height: 20px; box-sizing: border-box; padding: 0 9px; border-radius: 6px; border: 1px solid #d5d9dc; background: #fff; font-size: 10px; color: #0e1318; }
.${P}-gen { margin-top: 7px; height: 26px; line-height: 26px; border-radius: 6px; background: #7d2ae8; text-align: center; font-size: 11px; font-weight: 600; color: #fff; }
.${P}-cv { flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; background: #f3f5f5; }
.${P}-pg { position: relative; width: 168px; height: 126px; background: #fff; box-shadow: 0 0 0 1px rgba(14, 19, 24, .08), 0 6px 16px rgba(14, 19, 24, .08); overflow: hidden; }
.${P}-pg img { position: absolute; left: 50%; top: 50%; display: none; width: 94px; height: 110px; margin: -55px 0 0 -47px; object-fit: cover; }
`;

const PROMPT = 'make me 10 muse memes';
const TABS = ['Images', 'Graphics', 'Videos', '3D'];
const RAIL_ITEMS = ['Templates', 'Elements', 'Text', 'Uploads', 'Tools'];
const BAR0 = 0.05;   // the bar's first sliver, before any image has landed

export default {
  id: 'canva',
  label: 'Canva Magic Media',
  source: {
    platform: "Canva editor, the classic left-rail Magic Media panel (light UI): prompt form swapped for a pending card while the 'Created by Magic Media' thumbnails fill",
    feature: "Pending card ('Wait with us while we generate \"<prompt>\"', determinate progress bar without a number, white Cancel button) in the Magic Media panel while empty near-white thumbnails are replaced one at a time by their images (adapted to 10: the grid grows to ten slots filling in order while the bar tracks the count, then the card gives way to the finished thumbnails)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=17phfrdETHA', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=QPymS7G21wo', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'canva');
    const slot = (g, i) => `<div class="${P}-t ${P}-k${i % 3}"><b></b><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="transform-origin: ${g.origin}"/></div>`;
    const railItem = (name, on) => `<div class="${P}-ri${on ? ` ${P}-on` : ''}"><i></i>${name}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><span>File</span><span>Resize</span><span>Editing</span><span class="${P}-sp"></span><span class="${P}-sh">Share</span></div><div class="${P}-bd"><div class="${P}-rl">${RAIL_ITEMS.map((n) => railItem(n, false)).join('')}${railItem('Magic Media', true)}</div><div class="${P}-pn"><div class="${P}-hd">Magic Media<i></i></div><div class="${P}-tabs">${TABS.map((n, i) => `<span${i === 0 ? ` class="${P}-on"` : ''}>${n}</span>`).join('')}</div><div class="${P}-gr">${tiles.map(slot).join('')}</div><div class="${P}-pend"><div class="${P}-cap">Wait with us while we generate “${x.esc(PROMPT)}”</div><div class="${P}-trk"><div class="${P}-fill"></div></div><div class="${P}-cx">Cancel</div></div><div class="${P}-form"><div class="${P}-box">${x.esc(PROMPT)}<u>Clear</u></div><div class="${P}-opt"><span>Styles</span><span>Square</span></div><div class="${P}-gen">Generate again</div></div></div><div class="${P}-cv"><div class="${P}-pg"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme 1" style="transform-origin: ${tiles[0].origin}"/></div></div></div></div>`);
    const fill = root.querySelector(`.${P}-fill`), pend = root.querySelector(`.${P}-pend`), form = root.querySelector(`.${P}-form`);
    const pageIm = root.querySelector(`.${P}-pg img`);
    const cells = [...root.querySelectorAll(`.${P}-gr .${P}-t`)].map((n, i) => ({ n, im: n.querySelector('img'), g: tiles[i], state: null }));
    ctx.gate([...cells.map((c) => c.im), pageIm]);
    const S = tiles.map((_, i) => ctx.seq(i));   // [start, end] of tile i: it lands (replaces its placeholder) at its end

    const memo = {};
    const put = (key, v, fn) => { if (memo[key] !== v) { memo[key] = v; fn(v); } };

    return {
      root,
      render(t) {
        const done = t >= ctx.lastLand;
        const landed = S.reduce((n, [, b]) => n + (t >= b ? 1 : 0), 0);
        const slots = done ? cells.length : Math.min(cells.length, SLOTS0 + landed);   // the grid grows as images land

        // each slot: absent, an empty near-white placeholder, or its finished image (a hard swap, in place)
        cells.forEach((c, i) => {
          const s = i >= slots ? 0 : t >= S[i][1] ? 2 : 1;
          if (s === c.state) return;
          c.state = s;
          c.n.style.display = s === 0 ? 'none' : '';
          c.im.style.display = s === 2 ? 'block' : 'none';
          c.n.firstElementChild.style.display = s === 2 ? 'none' : '';
          if (s === 2) { c.im.style.filter = restFilter(c.g); c.im.style.transform = restTransform(c.g); }
        });

        // the determinate bar tracks the count: a first sliver, then a straight run to full as the tenth image lands
        const f = BAR0 + (1 - BAR0) * seg(t, S[0][0], ctx.lastLand);
        fill.style.width = `${(clamp(f) * 100).toFixed(2)}%`;

        // the pending card gives way to the prompt form when the set is done, and the first image goes on the page
        put('done', done, (on) => {
          pend.style.display = on ? 'none' : '';
          form.style.display = on ? 'flex' : 'none';
          pageIm.style.display = on ? 'block' : 'none';
          if (on) { pageIm.style.filter = restFilter(tiles[0]); pageIm.style.transform = restTransform(tiles[0]); }
        });
      },
    };
  },
};
