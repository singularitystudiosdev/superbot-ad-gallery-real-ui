// Canva Dream Lab, the standalone AI image page canva.com/dream-lab (Windows 11 Chrome screen recording, YouTube zykC--jJP5U, HowTwo,
// 2026-09-21, t=34-46 s, plus joq / lyn captures; spec .tmp/clone-9e82faf1/reveal-refs/canva-dream-lab/spec.json, confidence 0.80; frames
// w_01_joq_submit_t38.4, w_02_zyk_pending_sketching_t36.1, w_03_zyk_pending_refining_t42.0, w_04_zyk_landed_t46.0, w_09_zyk_status_strip,
// w_10_zyk_tile_crop_t37.0). NOT the editor's Magic Media side panel (the built 'canva' module): a full-bleed violet-to-teal gradient wash
// over a dark shell, a slim left icon rail, the big centred heading 'What will you design today?', a composer ('Describe the image in your
// mind, and I'll bring it to life' with a '+' and a mic) with the pills 'Style' and '16:9' under it, and under that a 'just now' card: the
// prompt text, the label 'Image' and a row of empty 16:9 tiles, each a soft steel-blue-to-violet mesh gradient that drifts, with no spinner,
// caption or percentage inside. A small blue spinner and a status line sit at the card's bottom-left, reading 'Sketching visual concepts...'
// and then 'Refining visual elements...'. The tiles swap to finished pictures one at a time, left to right, and the spinner and the line
// clear when the last one lands.
// Adapted to ten images: ten 16:9 tiles in two rows of five, landing in reading order on ctx.seq. Omitted: the 'Premium' chip, the plan
// banner at the top right, the account row and help bubble, the card's copy / more buttons, the footage's own pictures and the browser
// chrome and taskbar around the page. Every picture is our own meme; no logo, wordmark or platform font is drawn (a system face, plain line
// icons, a plain violet plus for Create).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cdl';
const ROOT_H = 404, RAIL_W = 48, COLS = 5, GAP = 5;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #13161b; color: #e6e8ee; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #232831; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 9px; width: ${RAIL_W}px; padding: 9px 0 8px; font-size: 5.5px; color: #cdd1da; }
.${P}-ri { display: flex; flex-direction: column; align-items: center; gap: 2.5px; }
.${P}-ri svg { display: block; width: 11px; height: 11px; fill: none; stroke: #cdd1da; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-plus { display: grid; place-items: center; width: 15px; height: 15px; border-radius: 50%; background: #7d2ae8; }
.${P}-plus svg { width: 8px; height: 8px; stroke: #ffffff; stroke-width: 1.8; }
.${P}-cur svg { stroke: #ffffff; }
.${P}-cur { color: #ffffff; margin-top: auto; }
.${P}-main { position: relative; flex: 1; min-width: 0; margin: 4px 4px 4px 0; border-radius: 10px; overflow: hidden; background: radial-gradient(120% 56% at 4% 0%, rgba(30, 200, 196, .34) 0%, rgba(30, 200, 196, 0) 62%), radial-gradient(110% 60% at 100% 4%, rgba(131, 54, 240, .46) 0%, rgba(131, 54, 240, 0) 64%), linear-gradient(180deg, #14232d 0%, #151a24 36%, #12151b 70%); }
.${P}-in { position: absolute; inset: 0; display: flex; flex-direction: column; padding: 16px 14px 0; }
.${P}-h1 { flex: none; text-align: center; font-size: 19px; font-weight: 600; line-height: 26px; letter-spacing: .1px; background: linear-gradient(90deg, #3ee6e0 0%, #5aa8f2 46%, #9a62f4 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }
.${P}-comp { position: relative; flex: none; box-sizing: border-box; width: 292px; height: 62px; margin: 11px auto 0; padding: 10px 12px; border-radius: 10px; background: #0d0f14; box-shadow: 0 0 0 1px #3a2f6a, 0 0 14px rgba(124, 58, 237, .38); font-size: 7.5px; line-height: 10.5px; color: #8b91a0; }
.${P}-ph { height: 22px; overflow: hidden; color: #9096a4; }
.${P}-txt { color: #e8eaf0; }
.${P}-add { position: absolute; left: 11px; bottom: 7px; width: 14px; height: 14px; }
.${P}-add svg, .${P}-mic svg { display: block; width: 100%; height: 100%; fill: none; stroke: #d6d9e2; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-mic { position: absolute; right: 11px; bottom: 8px; width: 11px; height: 11px; }
.${P}-sub { position: absolute; right: 10px; bottom: 7px; display: grid; place-items: center; width: 16px; height: 16px; border-radius: 50%; background: #8236f0; visibility: hidden; }
.${P}-sub svg { width: 8px; height: 8px; fill: none; stroke: #ffffff; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pills { flex: none; display: flex; justify-content: center; gap: 7px; margin-top: 8px; }
.${P}-pills span { display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 17px; padding: 0 8px; border-radius: 9px; background: rgba(255, 255, 255, .06); font-size: 7px; font-weight: 500; color: #e0e3ea; }
.${P}-pills svg { width: 6px; height: 6px; fill: none; stroke: #c9cdd8; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pills i { display: block; box-sizing: border-box; width: 7px; height: 5px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #c9cdd8; }
.${P}-res { flex: none; margin-top: 16px; visibility: hidden; }
.${P}-jn { height: 13px; font-size: 7px; font-weight: 500; line-height: 13px; color: #c6cad4; }
.${P}-card { box-sizing: border-box; margin-top: 6px; padding: 8px 9px 6px; border-radius: 8px; background: rgba(20, 23, 29, .72); box-shadow: 0 0 0 1px #262b35; }
.${P}-pr { display: flex; align-items: center; gap: 6px; font-size: 6.5px; line-height: 10px; color: #dfe2ea; }
.${P}-pr span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.${P}-pr svg { flex: none; width: 6px; height: 6px; fill: none; stroke: #c9cdd8; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
.${P}-kind { margin-top: 2px; font-size: 5.5px; line-height: 8px; color: #8b91a0; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; margin-top: 6px; }
.${P}-t { position: relative; aspect-ratio: 16 / 9; border-radius: 5px; overflow: hidden; background: #3e607b; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-mesh { position: absolute; inset: 0; background: #3f5f7c; }
.${P}-st { display: flex; align-items: center; gap: 6px; height: 20px; margin-top: 4px; font-size: 6.5px; color: #78a0e8; white-space: nowrap; }
.${P}-spin { flex: none; display: block; width: 11px; height: 11px; border-radius: 50%; background: conic-gradient(from 0deg, #3b82f6 0deg, #4fc3f7 120deg, #a78bfa 240deg, rgba(59, 130, 246, .08) 330deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); }
`;

const PROMPT = 'A friendly ghost holding a handwritten note in a bright lecture hall, meme style, bold colours, playful and clean, soft light, high detail and a wide cinematic frame';
const PLACE = "Describe the image in your mind, and I'll bring it to life";
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const SUBMIT_AT = 0.06;                           // the cursor presses the round submit button
const ISSUE = 0.16;                               // the composer empties and the 'just now' card appears with its ten gradient tiles
const REFINE_AT = 0.36;                           // 'Sketching visual concepts...' hands over to 'Refining visual elements...'
const FADE = 0.05;                                // a tile's gradient thins away over this long before the picture lands
const MESH_FPS = 20;                              // the gradients drift at this rate (a function of t)

// a drifting mesh gradient for tile i at time tt: three soft patches, steel blue into violet-grey, moving slowly
const mesh = (tt, i) => {
  const a = tt * 0.55 + i * 1.7;
  const px = (n, ph) => (50 + 42 * Math.sin(a * (0.7 + 0.23 * n) + ph + i)).toFixed(1);
  const py = (n, ph) => (50 + 38 * Math.cos(a * (0.6 + 0.19 * n) + ph - i)).toFixed(1);
  return `radial-gradient(circle at ${px(0, 0)}% ${py(0, 1)}%, rgba(86, 132, 168, .95) 0%, rgba(86, 132, 168, 0) 62%), radial-gradient(circle at ${px(1, 2)}% ${py(1, 3)}%, rgba(110, 96, 176, .9) 0%, rgba(110, 96, 176, 0) 60%), radial-gradient(circle at ${px(2, 4)}% ${py(2, 5)}%, rgba(62, 96, 123, .95) 0%, rgba(62, 96, 123, 0) 66%), #3e607b`;
};

export default {
  id: 'canva-dream-lab',
  label: 'Canva Dream Lab (2026)',
  source: {
    platform: "Canva Dream Lab, the standalone AI image page canva.com/dream-lab (desktop Chrome, dark theme; screen recordings on YouTube, 2026-09-21 and earlier)",
    feature: "full-bleed violet-to-teal gradient over a dark shell, a left icon rail, the heading 'What will you design today?', a composer with + and a mic and the pills Style / 16:9, then a 'just now' card whose tiles are empty drifting 16:9 gradient blocks with no spinner or caption, a small blue spinner and a status line bottom-left reading 'Sketching visual concepts...' then 'Refining visual elements...'; the tiles swap to pictures one at a time left to right and the spinner and line clear (adapted to 10: two rows of five 16:9 tiles landing in reading order; the 'Premium' chip and the plan banner are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=zykC--jJP5U', retrieved: '2026-10-14' }, { url: 'https://www.youtube.com/watch?v=JOqAVYI8whw', retrieved: '2026-10-14' }, { url: 'https://www.youtube.com/watch?v=lYnLm1xB5ME', retrieved: '2026-10-14' }],
    extrapolated: ['the ten-tile block in two rows of five (Dream Lab makes four options in one row)', 'the status-line switch time and the tile landing times, compressed from a wait of about 9.5 s in the footage', 'the prompt wording'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'canva-dream-lab');
    const K = (ctx.lastLand - ctx.cardIn) / REF;      // the beat's window against the layout above
    const LAND = tiles.map((_, i) => (ctx.seq(i)[1] - ctx.cardIn) / K);   // tile i lands at its ctx.seq end (layout seconds)
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-mesh"></div></div>`;
    const ic = (d) => `<svg viewBox="0 0 12 12" aria-hidden="true"><path d="${d}"/></svg>`;
    const rail = (name, d) => `<div class="${P}-ri">${ic(d)}${name}</div>`;
    const chev = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5l3 3 3-3"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-rail"><div class="${P}-ri"><i class="${P}-plus">${ic('M6 2.5v7M2.5 6h7')}</i>Create</div>${rail('Home', 'M2 6l4-3.6L10 6M3.4 5.4v4.1h5.2V5.4')}${rail('Projects', 'M1.8 3.4h3l1 1.2h4.4v4.6H1.8z')}${rail('Templates', 'M2 2h8v8H2zM2 5.2h8M5.2 5.2V10')}${rail('Brand', 'M2.4 4h7.2v5H2.4zM4.4 4V2.8h3.2V4')}${rail('Canva AI', 'M6 1.8l1.2 2.9 2.9 1.2-2.9 1.2L6 10 4.8 7.1 1.9 5.9l2.9-1.2z')}${rail('More', 'M2.6 6h.01M6 6h.01M9.4 6h.01')}<div class="${P}-ri ${P}-cur">${ic('M2 2.6h8v6H2zM4.2 10h3.6')}Dream Lab</div></div><div class="${P}-main"><div class="${P}-in"><div class="${P}-h1">What will you design today?</div><div class="${P}-comp"><div class="${P}-ph"><span class="${P}-txt">${x.esc(PROMPT)}</span></div><div class="${P}-add">${ic('M6 2v8M2 6h8')}</div><div class="${P}-mic">${ic('M6 1.6a1.6 1.6 0 011.6 1.6v2.2a1.6 1.6 0 01-3.2 0V3.2A1.6 1.6 0 016 1.6zM2.8 5.2a3.2 3.2 0 006.4 0M6 8.4v2')}</div><div class="${P}-sub">${ic('M2.4 6h7M6.6 3l3 3-3 3')}</div></div><div class="${P}-pills"><span>Style${chev}</span><span><i></i>16:9${chev}</span></div><div class="${P}-res"><div class="${P}-jn">just now</div><div class="${P}-card"><div class="${P}-pr"><span>${x.esc(PROMPT)}</span>${chev}</div><div class="${P}-kind">Image</div><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-st"><i class="${P}-spin"></i><span class="${P}-stx">Sketching visual concepts...</span></div></div></div></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const sub = q('sub'), mic = q('mic'), txt = q('txt'), res = q('res'), st = q('st'), stx = q('stx'), spin = q('spin');
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), mesh: n.querySelector(`.${P}-mesh`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const s = (t - ctx.cardIn) / K;                // layout seconds since the card entered

        // the prompt is submitted: the round button is pressed, then the composer empties back to its hint
        const sp = press(s, SUBMIT_AT, 0.06, 0.06, 0.14);
        const issued = s >= ISSUE;
        put('sub', sp.toFixed(3) + issued, () => { sub.style.transform = sp > 0 ? `scale(${(1 - 0.12 * sp).toFixed(4)})` : 'none'; sub.style.visibility = issued ? 'hidden' : 'visible'; });
        put('mic', issued, (v) => { mic.style.visibility = v ? '' : 'hidden'; txt.textContent = v ? PLACE : PROMPT; txt.style.color = v ? '#9096a4' : ''; });
        put('res', issued, (v) => { res.style.visibility = v ? 'visible' : 'hidden'; });

        // the status line and spinner, until the last tile has landed
        const last = LAND[tiles.length - 1];
        put('st', s >= last, (v) => { st.style.visibility = v ? 'hidden' : ''; });
        put('stx', s >= REFINE_AT, (v) => { stx.textContent = v ? 'Refining visual elements...' : 'Sketching visual concepts...'; });
        const deg = (((t * 300) % 360) + 360) % 360;
        put('spin', deg.toFixed(0), (d) => { spin.style.transform = `rotate(${d}deg)`; });

        const fr = Math.floor(t * MESH_FPS);
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, `${f.toFixed(3)}|${f >= 1 ? 0 : fr}`, () => {
            if (f >= 1) { c.mesh.style.display = 'none'; c.mesh.style.opacity = ''; } else {
              c.mesh.style.display = ''; c.mesh.style.opacity = f > 0 ? (1 - f).toFixed(3) : '';
              c.mesh.style.background = mesh(fr / MESH_FPS, i);
            }
          });
        });
      },
    };
  },
};
