// Google Vids' image generation (2026 build), the 'Generate an image' panel on the editor's right rail, as shown in a real screen recording of
// Google Vids in a desktop browser (YouTube 5kE2lBhzeak, 2026-06-05, t~794-805 s; spec .tmp/clone-9e82faf1/reveal-refs/google-vids-image/spec.json,
// confidence 0.62, frames am2_vids_generating.png, am2_vids_result_actions.png). A light editor: a slim tool strip, the slide canvas and a
// timeline on the left, a white 'Generate an image' card and, at the far right, the tool rail (Veo, Avatar, Voiceover, Image, Record, Uploads,
// Stock, Captions, Text, Templates, Shapes) with 'Image' selected as a pale-blue pill. Pressing the blue arrow turns the card into a wait state: a
// small four-point sparkle and the fixed label 'Generating...' over one large pale (#EDF1F7) rounded placeholder with a soft diagonal sheen,
// the prompt staying in its box below. There is no percentage, timer or queue label. The picture then lands in that placeholder and hovering it
// shows 'Insert' and 'Convert to Video'.
// Adapted to ten images: the footage's single result becomes a 4 + 4 + 2 cell grid in the card, the large placeholder handing over to ten small
// pale cells that land in strict reading order (the sheen sweeps from render(t), frozen once the last cell has landed), the 'Insert' / 'Convert
// to Video' labels sitting on the first result. Omitted: the editor's logos, the presenter's webcam bubble and the creator's browser frame. The
// footage's pictures are never reproduced: every cell is our own meme.
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-gvd';
const FONT = `'Google Sans', Roboto, ${UI_FONT}`;
const ROOT_H = 392, PANEL_W = 268, RAIL_W = 52, COLS = 4, GAP = 4;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #f7f9fd; color: #1f1f1f; font-family: ${FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dde3ec; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 7px; height: 30px; padding: 0 10px; background: #fff; box-shadow: 0 1px 0 #e6eaf1; }
.${P}-top i { flex: none; display: block; width: 10px; height: 10px; border-radius: 3px; background: #c4cbd6; }
.${P}-top i.${P}-on { background: #1a73e8; }
.${P}-top span { margin-left: 4px; font-size: 7.5px; color: #3c4043; white-space: nowrap; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-main { flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 12px 6px 10px 10px; }
.${P}-slide { position: relative; flex: none; aspect-ratio: 16 / 9; border-radius: 4px; background: linear-gradient(160deg, #cfe0f3, #e9eef7 60%, #dfe7f2); box-shadow: 0 0 0 1px #1a73e8; }
.${P}-slide u { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 1px #1a73e8; text-decoration: none; }
.${P}-tr { flex: none; display: flex; align-items: center; gap: 8px; height: 28px; margin-top: 14px; }
.${P}-tr b { flex: none; display: block; width: 16px; height: 16px; border-radius: 50%; background: #1a5fd0; }
.${P}-tr s { flex: 1; height: 2px; border-radius: 1px; background: #c4cbd6; text-decoration: none; }
.${P}-tl { flex: none; display: flex; gap: 3px; margin-top: 6px; }
.${P}-tl i { flex: 1; display: block; height: 28px; border-radius: 3px; background: #d9dfe8; }
.${P}-tl i:last-child { flex: none; width: 24px; background: #dbe8fc; }
.${P}-pn { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; margin: 6px 0 6px; padding: 10px 10px 10px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px #e3e7ee; }
.${P}-ph { flex: none; display: flex; align-items: center; gap: 6px; height: 16px; font-size: 9.5px; font-weight: 500; color: #1f1f1f; white-space: nowrap; }
.${P}-ph em { flex: none; width: 10px; height: 10px; border-radius: 3px; background: #c4cbd6; }
.${P}-ph span { margin-left: auto; width: 8px; height: 8px; fill: none; stroke: #444746; stroke-width: 1.6; stroke-linecap: round; }
.${P}-st { flex: none; display: flex; align-items: flex-start; gap: 6px; box-sizing: border-box; height: 28px; padding-top: 7px; font-size: 7.5px; line-height: 10px; color: #444746; overflow: hidden; }
.${P}-st svg { flex: none; width: 9px; height: 9px; margin-top: 0.5px; fill: #7a8699; }
.${P}-res { position: relative; flex: none; height: 190px; margin-top: 2px; }
.${P}-insp { position: absolute; inset: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.${P}-insp i { display: block; border-radius: 8px; background: linear-gradient(150deg, #e9eef6, #f4f7fb); }
.${P}-big { position: absolute; inset: 0; overflow: hidden; border-radius: 12px; background: linear-gradient(135deg, #dce6f5 0%, #edf1f7 38%, #f1f5fb 100%); }
.${P}-big i, .${P}-pend i { position: absolute; left: 0; top: -20%; bottom: -20%; width: 55%; background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, .65), rgba(255, 255, 255, 0)); transform: translateX(-100%) skewX(-22deg); }
.${P}-g { position: absolute; left: 0; top: 0; right: 0; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: #edf1f7; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; overflow: hidden; background: linear-gradient(135deg, #dce6f5 0%, #edf1f7 40%, #f1f5fb 100%); }
.${P}-lab { position: absolute; left: 3px; right: 3px; bottom: 3px; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; }
.${P}-lab span { box-sizing: border-box; height: 10px; padding: 0 4px; border-radius: 5px; background: rgba(32, 33, 36, .86); font-size: 5.5px; line-height: 10px; color: #fff; white-space: nowrap; }
.${P}-pb { flex: none; position: relative; box-sizing: border-box; height: 82px; margin-top: auto; padding: 8px 9px; border-radius: 10px; background: #f4f6fb; box-shadow: inset 0 0 0 1px #e1e6ee; font-size: 8px; line-height: 11px; color: #1f1f1f; }
.${P}-pb.${P}-hint { color: #747775; }
.${P}-pb u { position: absolute; left: 9px; bottom: 8px; width: 14px; height: 14px; border-radius: 4px; background: #e1e5ec; text-decoration: none; }
.${P}-pb b { position: absolute; right: 8px; bottom: 8px; display: grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; background: #1a73e8; }
.${P}-pb b svg { width: 9px; height: 9px; fill: none; stroke: #fff; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; width: ${RAIL_W}px; padding: 8px 4px 8px 2px; }
.${P}-ri { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 6.5px; line-height: 8px; color: #444746; white-space: nowrap; }
.${P}-ri i { display: block; width: 12px; height: 11px; border-radius: 3px; background: #c4cbd6; }
.${P}-ri.${P}-on { color: #0b57d0; }
.${P}-ri.${P}-on i { box-sizing: border-box; width: 26px; height: 15px; border-radius: 8px; background: radial-gradient(circle at 50% 50%, #0b57d0 0, #0b57d0 4.5px, transparent 5px), #d3e3fd; }
`;

const PROMPT = 'a muse holding a handwritten note, meme style, bright colours';
const HELPER = 'Describe your idea. e.g. an object in a location in color';
const RAIL = ['Veo', 'Avatar', 'Voiceover', 'Image', 'Record', 'Uploads', 'Stock', 'Captions', 'Text', 'Templates', 'Shapes'];
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const TYPED = 0.05;                               // the helper text gives way to the typed prompt
const GEN_AT = 0.06;                              // the blue arrow is pressed
const ISSUE = 0.16;                               // the inspiration grid gives way to the large placeholder
const BIG_END = 0.5;                              // the large placeholder hands over to the ten pale cells
const LAND = Array.from({ length: 10 }, (_, i) => 0.62 + i * 0.1178);   // cell i receives its picture (reading order), the last at 1.68
const FADE = 0.05;                                // a cell's pale cover thins away over this long before the picture lands
const SPARK = '<svg viewBox="0 0 24 24"><path d="M12 1.5C12.7 8.2 15.8 11.3 22.5 12C15.8 12.7 12.7 15.8 12 22.5C11.3 15.8 8.2 12.7 1.5 12C8.2 11.3 11.3 8.2 12 1.5Z"/></svg>';

export default {
  id: 'google-vids-image',
  label: 'Google Vids image (2026)',
  source: {
    platform: 'Google Vids web editor (Google Workspace), right-hand tool rail tab Image, light theme (a real screen recording, 2026-06)',
    feature: "the 'Generate an image' panel with its prompt box (helper text 'Describe your idea. e.g. an object in a location in color') and a blue arrow; pressing it shows a neutral four-point sparkle with the fixed label 'Generating...' above one large pale #EDF1F7 placeholder with a diagonal sheen, no percentage or timer, then the picture lands with 'Insert' and 'Convert to Video' on hover (adapted to 10: the large placeholder hands over to a 4 + 4 + 2 cell grid landing in reading order, the labels on the first result; the sheen is driven from t and frozen once the last cell has landed; logos and the presenter are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=5kE2lBhzeak', retrieved: '2026-10-14', published: '2026-06-05' }],
    videoIds: ['5kE2lBhzeak'],
    dates: ['2026-06-05'],
    extrapolated: ['ten cells in a 4 + 4 + 2 block (the footage shows one result per request)', 'the large placeholder handing over to the small cells, and their landing times', 'the sheen sweep speed (the footage clip is a few frames)', 'the card is compressed to a 560 px column, so the canvas, timeline and rail are schematic'],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'google-vids-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i></i></div>${i === 0 ? `<div class="${P}-lab" style="visibility: hidden"><span>Insert</span><span>Convert to Video</span></div>` : ''}</div>`;
    const tools = `<i class="${P}-on"></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><span>Replace video</span>`;
    const arrow = '<svg viewBox="0 0 10 10"><path d="M5 8.5V1.8M2 4.6L5 1.6l3 3"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-top">${tools}</div><div class="${P}-body"><div class="${P}-main"><div class="${P}-slide"><u style="left: -3px; top: -3px"></u><u style="right: -3px; top: -3px"></u><u style="left: -3px; bottom: -3px"></u><u style="right: -3px; bottom: -3px"></u></div><div class="${P}-tr"><b></b><s></s></div><div class="${P}-tl"><i></i><i></i><i></i><i></i><i></i></div></div><div class="${P}-pn"><div class="${P}-ph"><em></em>Generate an image<svg class="${P}-xx" viewBox="0 0 10 10" style="margin-left: auto; width: 8px; height: 8px; fill: none; stroke: #444746; stroke-width: 1.6; stroke-linecap: round"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg></div><div class="${P}-st" style="visibility: hidden">${SPARK}<span></span></div><div class="${P}-res"><div class="${P}-insp"><i></i><i></i><i></i><i></i></div><div class="${P}-big" style="visibility: hidden"><i></i></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div><div class="${P}-pb ${P}-hint"><span class="${P}-pt"></span><u></u><b>${arrow}</b></div></div><div class="${P}-rail">${RAIL.map((n) => `<div class="${P}-ri${n === 'Image' ? ` ${P}-on` : ''}"><i></i>${n}</div>`).join('')}</div></div></div>`);
    const q = (s) => root.querySelector(s);
    const send = q(`.${P}-pb b`), box = q(`.${P}-pb`), boxTxt = q(`.${P}-pt`), st = q(`.${P}-st`), stTxt = q(`.${P}-st span`);
    const insp = q(`.${P}-insp`), big = q(`.${P}-big`), grid = q(`.${P}-g`), lab = q(`.${P}-lab`), first = q(`.${P}-t`);
    const bigSheen = q(`.${P}-big i`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), sheen: n.querySelector(`.${P}-pend i`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };
    const slide = (el, ph) => { el.style.transform = `translateX(${(-100 + ph * 340).toFixed(1)}%) skewX(-22deg)`; };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const sf = Math.min(s, LAND[9]);               // the sheen's clock: it stops with the last cell

        // the helper text gives way to the typed prompt; the blue arrow is pressed
        put('typ', s >= TYPED, (v) => { boxTxt.textContent = v ? PROMPT : HELPER; box.classList.toggle(`${P}-hint`, !v); });
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { send.style.transform = gp > 0 ? `scale(${(1 - 0.12 * gp).toFixed(4)})` : 'none'; });

        // inspiration grid -> large pale placeholder -> ten cells; 'Generating...' over them, the prompt once the last has landed
        const waiting = s >= ISSUE && s < BIG_END, done = s >= LAND[9];
        put('ins', s < ISSUE, (v) => { insp.style.visibility = v ? '' : 'hidden'; });
        put('big', waiting, (v) => { big.style.visibility = v ? '' : 'hidden'; });
        put('grd', s >= BIG_END, (v) => { grid.style.visibility = v ? '' : 'hidden'; });
        put('stv', s >= ISSUE, (v) => { st.style.visibility = v ? '' : 'hidden'; });
        put('stt', done, (v) => { stTxt.textContent = v ? PROMPT : 'Generating...'; });
        const bp = (((sf * 0.9) % 1) + 1) % 1;
        put('bs', bp.toFixed(3), () => slide(bigSheen, bp));

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the diagonal sheen sweeps across a pending cell; a function of the clock alone, frozen once the last cell has landed
          const ph = (((sf * 0.85 + i * 0.11) % 1) + 1) % 1;
          put(`h${i}`, ph.toFixed(3), () => slide(c.sheen, ph));
        });

        // 'Insert' / 'Convert to Video' sit on the first result, which carries the blue selection ring
        put('lab', s >= LAND[0], (v) => { lab.style.visibility = v ? '' : 'hidden'; first.style.boxShadow = v ? '0 0 0 1.5px #1a73e8' : 'none'; });
      },
    };
  },
};
