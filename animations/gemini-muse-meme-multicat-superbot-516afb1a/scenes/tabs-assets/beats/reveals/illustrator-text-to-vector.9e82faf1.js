// Adobe Illustrator's 'Text to Vector Graphic (Beta)', in the desktop app's Properties panel (YouTube hwfGtS3fjm8 2023-10-10 t~28-34.6 s, and
// whqdC1kDdbk 2023-10-12 as a 1 fps cross-check; spec .tmp/clone-9e82faf1/reveal-refs/illustrator-text-to-vector/spec.json, confidence 0.72;
// frames al_t2_idle_panel.png, al_t3_generating_modal.png, al_t3_generating_modal2.png, al_t4_artwork_on_artboard.png). Dark Illustrator
// chrome over a teal pasteboard: a menu bar, a control bar, a document-tab strip, a slim tool rail, the artboard, and on the right the
// Properties panel with its 'Text to Vector Graphic (Beta)' section (Type, 'Match active artboard style', Prompt, a Generate (Beta)
// button, Variations). Pressing Generate (Beta) dims the document and drops a centred 'Generating' modal: a pale warm-grey title bar over
// a near-black body holding a blue #4B7BF5 INDETERMINATE bar (a segment sliding along a dark trough, no percentage), a grey 'Tip:' line
// that rotates between the two tips the footage shows, and a faint Cancel. While it runs the panel's button reads Cancel and the
// Variations cells hold a small blue ring. The modal clears and the finished vector artwork appears whole on the artboard inside its
// selection box (the Properties header turns from 'No Selection' to 'Group'), and the Variations thumbnails fill.
// Adapted to ten images: a 3-column Variations grid of ten cells (3 + 3 + 3 + 1) that, once the modal has cleared, land in strict
// reading order; the first variation also sits on the artboard. The ring and the bar turn and slide from render(t) and are frozen
// once the last cell has landed. Omitted: every Adobe mark and the app's own icon font (the tools are plain outlined shapes), the
// Type menu's Scene / Icon / Pattern entries (only the closed 'Subject' dropdown is drawn), the zoom read-out, the footage's own pictures
// (every cell is our meme).
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-itv';
const ROOT_H = 470, TOOLS_W = 20, PANEL_W = 172, COLS = 3;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 6px; background: #323232; color: #d2d2d2; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1a1a1a; }
.${P}-mb { flex: none; display: flex; align-items: center; gap: 9px; height: 15px; padding: 0 8px; background: #262626; font-size: 6.6px; color: #dcdcdc; white-space: nowrap; }
.${P}-mb b { font-weight: 700; margin-right: 4px; }
.${P}-cb { flex: none; display: flex; align-items: center; gap: 7px; height: 17px; padding: 0 8px; background: #3b3b3b; box-shadow: 0 1px 0 #262626; font-size: 6.3px; color: #c8c8c8; white-space: nowrap; }
.${P}-cb i { flex: none; display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #c0c0c0; border-radius: 2px; }
.${P}-cb u { text-decoration: none; box-sizing: border-box; height: 11px; padding: 0 6px; border-radius: 2px; background: #4a4a4a; line-height: 11px; color: #e0e0e0; }
.${P}-cb u:first-of-type { margin-left: auto; }
.${P}-tabs { flex: none; display: flex; align-items: flex-end; gap: 1px; height: 14px; padding-left: 20px; background: #2b2b2b; }
.${P}-tabs span { box-sizing: border-box; height: 12px; padding: 0 8px; border-radius: 2px 2px 0 0; background: #3b3b3b; font-size: 6px; line-height: 12px; color: #a8a8a8; white-space: nowrap; }
.${P}-tabs span.${P}-on { background: #535353; color: #ececec; }
.${P}-bd { flex: 1; min-height: 0; display: flex; position: relative; overflow: hidden; }
.${P}-tools { flex: none; display: flex; flex-direction: column; align-items: center; gap: 7px; width: ${TOOLS_W}px; padding-top: 7px; background: #323232; box-shadow: 1px 0 0 #262626; }
.${P}-tools i { display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #b7b7b7; border-radius: 2px; }
.${P}-tools i.${P}-rd { border-radius: 50%; }
.${P}-tools i.${P}-ln { height: 1.3px; border: 0; background: #b7b7b7; transform: rotate(-35deg); }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #0e8a83; overflow: hidden; }
.${P}-ab { position: absolute; left: 12px; top: 28px; right: 12px; bottom: 26px; box-shadow: 0 0 0 1px #000; background: #0e8a83; }
.${P}-art { position: absolute; left: 50%; top: 50%; width: 118px; height: 139px; margin: -69px 0 0 -59px; box-shadow: 0 0 0 1px #4f86ff; }
.${P}-art img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-art s { position: absolute; width: 4px; height: 4px; box-sizing: border-box; background: #fff; box-shadow: 0 0 0 1px #4f86ff; margin: -2px 0 0 -2px; }
.${P}-scrim { position: absolute; inset: 0; background: rgba(0, 0, 0, .42); }
.${P}-side { flex: none; display: flex; flex-direction: column; width: ${PANEL_W}px; overflow: hidden; background: #3c3c3c; box-shadow: -1px 0 0 #262626; }
.${P}-ptabs { flex: none; display: flex; gap: 9px; height: 15px; padding: 0 8px; font-size: 6.8px; line-height: 15px; color: #a8a8a8; white-space: nowrap; box-shadow: 0 1px 0 #2d2d2d; }
.${P}-ptabs .${P}-on { color: #f1f1f1; box-shadow: 0 1.2px 0 #f1f1f1; }
.${P}-sel { flex: none; padding: 5px 8px 3px; font-size: 6.6px; color: #d8d8d8; }
.${P}-sec { flex: none; display: flex; align-items: center; gap: 4px; padding: 3px 8px 3px; font-size: 6.6px; color: #e2e2e2; white-space: nowrap; }
.${P}-sec i { display: block; width: 3px; height: 3px; box-sizing: border-box; border: solid #bdbdbd; border-width: 0 1.2px 1.2px 0; transform: rotate(45deg) translateY(-1px); }
.${P}-lab { flex: none; padding: 4px 8px 2px; font-size: 6.2px; color: #b9b9b9; }
.${P}-dd { flex: none; display: flex; align-items: center; gap: 5px; box-sizing: border-box; height: 15px; margin: 0 8px; padding: 0 6px; background: #333; box-shadow: inset 0 0 0 1px #494949; border-radius: 2px; font-size: 6.6px; color: #ececec; }
.${P}-dd i { display: block; width: 6px; height: 6px; box-sizing: border-box; border: 1.2px solid #bdbdbd; border-radius: 50%; }
.${P}-dd b { margin-left: auto; width: 3px; height: 3px; box-sizing: border-box; border: solid #bdbdbd; border-width: 0 1.2px 1.2px 0; transform: rotate(45deg) translateY(-1px); }
.${P}-tg { flex: none; display: flex; align-items: center; gap: 5px; padding: 6px 8px 0; font-size: 6.4px; color: #d2d2d2; white-space: nowrap; }
.${P}-tg i { display: block; width: 13px; height: 7px; box-sizing: border-box; border-radius: 4px; background: #e2e2e2; position: relative; }
.${P}-tg i::after { content: ''; position: absolute; right: 1px; top: 1px; width: 5px; height: 5px; border-radius: 50%; background: #5a5a5a; }
.${P}-prm { flex: none; box-sizing: border-box; height: 31px; margin: 0 8px; padding: 4px 14px 4px 5px; position: relative; background: #333; box-shadow: inset 0 0 0 1px #494949; border-radius: 2px; font-size: 6.5px; line-height: 8.4px; color: #e8e8e8; overflow: hidden; }
.${P}-prm b { position: absolute; right: 4px; top: 3px; font-weight: 400; font-size: 7px; color: #bdbdbd; }
.${P}-br { flex: none; display: flex; align-items: center; gap: 5px; height: 21px; padding: 0 8px; }
.${P}-br i { display: block; width: 7px; height: 7px; box-sizing: border-box; border: 1.2px solid #8f8f8f; border-radius: 50%; }
.${P}-br i.${P}-sq { border-radius: 2px; }
.${P}-gen { margin-left: auto; display: flex; align-items: center; justify-content: center; gap: 3px; width: 78px; height: 14px; box-sizing: border-box; border-radius: 2px; box-shadow: inset 0 0 0 1px #8b8b8b; font-size: 6.6px; color: #f0f0f0; white-space: nowrap; }
.${P}-gen svg { display: block; width: 6px; height: 8px; }
.${P}-vh { flex: none; padding: 3px 8px 3px; font-size: 6.2px; color: #b9b9b9; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 4px; padding: 0 8px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 2px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px #2c2c2c; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; display: grid; place-items: center; background: #323232; }
.${P}-ring { display: block; box-sizing: border-box; width: 13px; height: 13px; border-radius: 50%; border: 1.7px solid #3a86e8; border-right-color: transparent; visibility: hidden; }
.${P}-st { position: absolute; left: 0; right: 0; bottom: 0; display: flex; align-items: center; height: 11px; padding: 0 8px; background: #323232; font-size: 6px; color: #a8a8a8; white-space: nowrap; }
.${P}-dlg { position: absolute; left: 50%; top: 48%; width: 190px; margin: -50px 0 0 -95px; border-radius: 5px; overflow: hidden; background: #2b2b2b; box-shadow: 0 0 0 1px #151515, 0 4px 14px rgba(0, 0, 0, .5); }
.${P}-dh { display: grid; place-items: center; height: 14px; background: #d9d7d4; font: 700 6.8px/14px ${UI_FONT}; color: #242424; }
.${P}-db { padding: 10px 10px 8px; }
.${P}-trk { position: relative; height: 6px; border-radius: 3px; background: #3a3a3a; overflow: hidden; }
.${P}-seg { position: absolute; top: 0; bottom: 0; left: -42%; width: 42%; border-radius: 3px; background: #4b7bf5; }
.${P}-tip { height: 18px; margin-top: 9px; font-size: 6.4px; line-height: 8.6px; color: #b9b9b9; overflow: hidden; }
.${P}-cn { display: grid; place-items: center; width: 40px; height: 12px; margin: 5px 0 0 auto; box-sizing: border-box; border-radius: 2px; background: #363636; font-size: 6.4px; color: #6f6f6f; }
`;

const PROMPT = 'a muse holding a handwritten note, retro, flat graphic style';
const TIPS = [
  'Tip: You can write a prompt in more than 100 different languages.',
  'Tip: Try out different graphic styles by generating subjects or scenes on a blank artboard.',
];
const REF = 1.84;                                   // the beat's window (ctx.lastLand - ctx.cardIn) the layout below is drawn against
const GEN_AT = 0.06;                                // Generate (Beta) is pressed
const ISSUE = 0.14;                                 // the document dims and the modal appears
const TIP_AT = 0.48;                                // the tip line rotates to the second tip
const MODAL_END = 0.84;                             // the modal clears, the artwork lands on the artboard and the cells start to land
const BAR_RATE = 1.35;                              // marquee laps per second
const TOOLS = ['', 'rd', '', 'ln', '', 'rd', '', '', 'rd', '', 'ln', ''];
const HANDLES = [[0, 0], [50, 0], [100, 0], [0, 50], [100, 50], [0, 100], [50, 100], [100, 100]];
const BOLT = '<svg viewBox="0 0 6 8" xmlns="http://www.w3.org/2000/svg"><path d="M3.6 0 0.4 4.6H2.8L2.2 8 5.6 3.2H3.2Z" fill="#f0f0f0"/></svg>';

export default {
  id: 'illustrator-text-to-vector',
  label: 'Illustrator Text to Vector (2023)',
  source: {
    platform: "Adobe Illustrator (Beta) desktop app, the 'Text to Vector Graphic (Beta)' section of the Properties panel (third-party screen recordings, 2023-10-10 and 2023-10-12)",
    feature: "dark desktop chrome over a teal artboard; a centred 'Generating' modal (pale grey title bar, near-black body, a blue #4B7BF5 indeterminate bar sliding along a dark trough, a rotating grey Tip, a faint Cancel, no percentage); the Variations grid cells carry a blue ring while pending and swap to thumbnails as they land; the first variation lands on the artboard inside its selection box (adapted to 10: a 3-column grid of ten cells, strict reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=hwfGtS3fjm8', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=whqdC1kDdbk', retrieved: '2026-10-14' },
    ],
    extrapolated: "the ten-cell Variations grid (the footage shows a 3 x 3 set of six visible thumbnails), the strict one-after-another landing in reading order after the modal clears (the footage swaps the whole set), the panel button reading Cancel and the cells carrying a ring during the run (seen in the 28 s frame only), the modal's timing (about 0.7 s here, 1.2 s in the footage), the second tip's switch point and the marquee's speed and direction (the bar was only seen as stills, filled to two-thirds)",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'illustrator-text-to-vector');
    const artSrc = ownSrc(ctx.src, 'illustrator-text-to-vector-artboard');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"><i class="${P}-ring"></i></div></div>`;
    const menus = ['File', 'Edit', 'Object', 'Type', 'Select', 'Effect', 'View', 'Window', 'Help'];
    const handles = HANDLES.map(([l, t]) => `<s style="left: ${l}%; top: ${t}%"></s>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-mb"><b>Illustrator</b>${menus.map((m) => `<span>${m}</span>`).join('')}</div><div class="${P}-cb"><i></i><span class="${P}-cs">No Selection</span><u>Document Setup</u><u>Preferences</u></div><div class="${P}-tabs"><span>Vector1_TextToVector.ai</span><span class="${P}-on">VectorAssets.ai</span><span>Vector.ai</span></div><div class="${P}-bd"><div class="${P}-tools">${TOOLS.map((k) => `<i${k ? ` class="${P}-${k}"` : ''}></i>`).join('')}</div><div class="${P}-cv"><div class="${P}-ab"><div class="${P}-art" style="visibility: hidden"><img src="${artSrc}" width="870" height="1024" decoding="sync" alt="Vector artwork" style="visibility: hidden; transform-origin: ${tiles[0].origin}"/>${handles}</div></div><div class="${P}-scrim" style="display: none"></div><div class="${P}-st">Selection</div></div><div class="${P}-side"><div class="${P}-ptabs"><span class="${P}-on">Properties</span><span>Layers</span><span>Libraries</span></div><div class="${P}-sel">No Selection</div><div class="${P}-sec"><i></i>Text to Vector Graphic (Beta)</div><div class="${P}-lab">Type</div><div class="${P}-dd"><i></i>Subject<b></b></div><div class="${P}-tg"><i></i>Match active artboard style</div><div class="${P}-lab">Prompt</div><div class="${P}-prm">${x.esc(PROMPT)}<b>×</b></div><div class="${P}-br"><i></i><i class="${P}-sq"></i><i></i><div class="${P}-gen"><span class="${P}-g1" style="display: flex; align-items: center; gap: 3px">${BOLT}Generate (Beta)</span><span class="${P}-g2" style="display: none">Cancel</span></div></div><div class="${P}-vh">Variations</div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div><div class="${P}-dlg" style="display: none"><div class="${P}-dh">Generating</div><div class="${P}-db"><div class="${P}-trk"><i class="${P}-seg"></i></div><div class="${P}-tip">${x.esc(TIPS[0])}</div><div class="${P}-cn">Cancel</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const gen = q(`.${P}-gen`), g1 = q(`.${P}-g1`), g2 = q(`.${P}-g2`), dlg = q(`.${P}-dlg`), seg = q(`.${P}-seg`), tip = q(`.${P}-tip`), scrim = q(`.${P}-scrim`);
    const art = q(`.${P}-art`), artImg = q(`.${P}-art img`), sel = q(`.${P}-sel`), cs = q(`.${P}-cs`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ el: n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), artImg]);

    // the beat's window against the layout above; every moment below is in t, the last cell landing exactly on ctx.lastLand
    const k = (ctx.lastLand - ctx.cardIn) / REF;
    const issueAt = ctx.cardIn + k * ISSUE, clearAt = ctx.cardIn + k * MODAL_END;
    const step = (ctx.lastLand - clearAt) / cells.length;
    const ends = cells.map((_, i) => ctx.lastLand - (cells.length - 1 - i) * step);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const s = (t - ctx.cardIn) / k;                 // layout seconds since the card entered
        const tt = Math.min(t, ctx.lastLand);           // everything that turns or slides is frozen once the last cell has landed
        const issued = t >= issueAt;
        const modal = issued && t < clearAt;
        const cleared = t >= clearAt;
        const done = t >= ctx.lastLand;

        // Generate (Beta) is pressed, then reads Cancel while the job runs
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('gp', gp.toFixed(3), () => { gen.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        put('run', issued && !done, (v) => { g1.style.display = v ? 'none' : 'flex'; g2.style.display = v ? '' : 'none'; });

        // the document dims under the centred modal: its indeterminate bar slides with t, the tip line rotates
        put('modal', modal, (v) => { dlg.style.display = v ? '' : 'none'; scrim.style.display = v ? '' : 'none'; });
        const ph = (((tt - issueAt) * BAR_RATE / k) % 1 + 1) % 1;
        const e = ph < 0.5 ? 2 * ph * ph : 1 - 2 * (1 - ph) * (1 - ph);
        const left = (-42 + 142 * e).toFixed(1);
        put('bar', left, (v) => { seg.style.left = `${v}%`; });
        put('tip', s >= TIP_AT, (v) => { tip.textContent = TIPS[v ? 1 : 0]; });

        // the artwork appears whole on the artboard, selected, the moment the modal clears
        put('art', cleared, (v) => {
          art.style.visibility = v ? '' : 'hidden';
          artImg.style.visibility = v ? '' : 'hidden';
          artImg.style.transform = restTransform(tiles[0]);
          artImg.style.filter = restFilter(tiles[0]);
        });
        put('sel', cleared, (v) => { sel.textContent = v ? 'Group' : 'No Selection'; cs.textContent = v ? 'Group' : 'No Selection'; });

        cells.forEach((cl, i) => {
          const landed = t >= ends[i];
          put(`i${i}`, landed, (v) => { cl.im.style.visibility = v ? '' : 'hidden'; cl.pend.style.display = v ? 'none' : ''; });
          cl.im.style.filter = restFilter(cl.g);
          cl.im.style.transform = restTransform(cl.g);
          // the blue ring appears with the run and turns with t (its phase differs per cell); a function of t alone, covered or not
          put(`v${i}`, issued, (v) => { cl.ring.style.visibility = v ? 'visible' : 'hidden'; });
          const deg = (((tt * 520 + i * 47) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { cl.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
