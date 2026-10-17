// Photoshop's 'Generate Image' (the feature's own dialog, not Generative Fill), in the desktop app (YouTube irtayp8pjtk 2026-05-26
// t~102-118.7 s, and PFM2TdK_1Zg 2024-10-10 for the dialog's layout; spec .tmp/clone-9e82faf1/reveal-refs/photoshop-generate-image/spec.json,
// confidence 0.72; frames al_t2_generate_image_dialog.png, al_t3_generating_firefly_image3.png, al_t4_variation_1of3_landed.png). Near-black
// desktop chrome around a white document: a menu bar, an options bar, a tool strip, a document tab, a status line, and on the right a
// Color panel above Properties and Layers. The idle state is the 'Generate Image' dialog: a prompt box ('Describe the image you want to
// generate'), Content type (Art | Photo), Style, Mode, a Reference image block, Effects, Cancel and Generate on the left; 'Prompt
// inspiration / Discover prompts to remix and make your own' with a grid of example pictures on the right. Generate closes the dialog and
// a small dark rounded modal 'Generating with Firefly Image 3' appears centred over the document: a GREEN determinate bar on a pale trough
// (no percentage), an italic 'Tip:' with the verbatim tip, and a rounded Cancel pill. The modal clears the moment the image lands: the
// document shows it, its tab gains '(<prompt>, RGB/8)', and the Properties panel gains the '< n/N >' variation pager with Generate and the
// variation strip, the selected one outlined in blue.
// Adapted to ten: a 5 x 2 variation strip landing in strict reading order after the modal clears, the pager counting n/10, the document
// showing the latest landed variation as the selected one, the bar filling over the modal's life. Omitted: the footage's own pictures (the
// inspiration cards are plain colour fields, every variation is our meme), the Ps badge and every Adobe mark, the Color panel's real
// spectrum and the app's icon font; the tools are plain outlined shapes. Nothing here is the Generative Fill flow (no bare 'Generating').
import { press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-psg';
const ROOT_H = 440, TOOLS_W = 20, DOCK_W = 150, COLS = 5;
const CSS = `
.${P} { box-sizing: border-box; position: relative; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 6px; background: #1e1e1e; color: #d0d0d0; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #0c0c0c; }
.${P}-mb { flex: none; display: flex; align-items: center; gap: 9px; height: 15px; padding: 0 8px; background: #1e1e1e; font-size: 6.6px; color: #d9d9d9; white-space: nowrap; }
.${P}-ob { flex: none; display: flex; align-items: center; gap: 7px; height: 18px; padding: 0 8px; background: #2b2b2b; box-shadow: 0 1px 0 #121212; font-size: 6.2px; color: #c9c9c9; white-space: nowrap; }
.${P}-ob i { flex: none; display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #bdbdbd; border-radius: 2px; }
.${P}-ob u { text-decoration: none; box-sizing: border-box; height: 11px; padding: 0 12px 0 5px; border-radius: 2px; background: #1f1f1f; line-height: 11px; color: #a6a6a6; }
.${P}-bd { flex: 1; min-height: 0; display: flex; overflow: hidden; }
.${P}-tools { flex: none; display: flex; flex-direction: column; align-items: center; gap: 7px; width: ${TOOLS_W}px; padding-top: 8px; background: #2b2b2b; box-shadow: 1px 0 0 #121212; }
.${P}-tools i { display: block; width: 8px; height: 8px; box-sizing: border-box; border: 1.2px solid #b0b0b0; border-radius: 2px; }
.${P}-tools i.${P}-rd { border-radius: 50%; }
.${P}-tools i.${P}-ln { height: 1.3px; border: 0; background: #b0b0b0; transform: rotate(-35deg); }
.${P}-cv { flex: 1; min-width: 0; display: flex; flex-direction: column; background: #121212; overflow: hidden; }
.${P}-tab { flex: none; display: flex; align-items: flex-end; height: 12px; padding-left: 5px; background: #1e1e1e; }
.${P}-tab span { box-sizing: border-box; height: 11px; padding: 0 8px; border-radius: 3px 3px 0 0; background: #2b2b2b; font-size: 6.2px; line-height: 11px; color: #e4e4e4; white-space: nowrap; }
.${P}-doc { position: relative; flex: 1; min-height: 0; overflow: hidden; }
.${P}-page { position: absolute; left: 50%; top: 50%; width: 300px; height: 225px; margin: -112px 0 0 -150px; background: #ffffff; overflow: hidden; }
.${P}-page img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; object-position: 50% 30%; }
.${P}-st { flex: none; display: flex; align-items: center; height: 11px; padding: 0 6px; background: #1e1e1e; font-size: 6px; color: #a9a9a9; white-space: nowrap; }
.${P}-dlg { position: absolute; left: 50%; top: 50%; width: 340px; height: 262px; margin: -131px 0 0 -170px; display: flex; flex-direction: column; border-radius: 3px; overflow: hidden; background: #2b2b2b; box-shadow: 0 0 0 1px #0e0e0e, 0 5px 18px rgba(0, 0, 0, .55); }
.${P}-dh { flex: none; display: flex; align-items: center; justify-content: flex-end; height: 12px; padding: 0 6px; background: #3a3a3a; font-size: 8px; line-height: 12px; color: #cfcfcf; }
.${P}-dc { flex: 1; min-height: 0; display: flex; }
.${P}-l { flex: none; display: flex; flex-direction: column; width: 152px; padding: 8px 9px 7px; box-sizing: border-box; }
.${P}-l h5 { margin: 0 0 5px; font: 700 7.6px/9px ${UI_FONT}; color: #f2f2f2; }
.${P}-ta { position: relative; box-sizing: border-box; height: 42px; padding: 4px 5px; background: #232323; box-shadow: inset 0 0 0 1px #3b78d8; font-size: 6.2px; line-height: 8px; color: #e8e8e8; overflow: hidden; }
.${P}-ph { color: #8a8a8a; }
.${P}-lb { margin: 6px 0 3px; font-size: 6.1px; color: #c4c4c4; }
.${P}-row { display: flex; align-items: center; box-sizing: border-box; height: 15px; padding: 0 6px; margin-bottom: 3px; background: #333; box-shadow: inset 0 0 0 1px #474747; font-size: 6.3px; color: #e4e4e4; }
.${P}-row b { margin-left: auto; width: 3px; height: 3px; box-sizing: border-box; border: solid #bdbdbd; border-width: 1.2px 1.2px 0 0; transform: rotate(45deg); }
.${P}-pair { display: flex; gap: 3px; margin-bottom: 3px; }
.${P}-pair div { flex: 1; display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 15px; padding: 0 6px; background: #333; box-shadow: inset 0 0 0 1px #474747; font-size: 6.3px; color: #e4e4e4; }
.${P}-pair div.${P}-on { box-shadow: inset 0 0 0 1px #8d8d8d; }
.${P}-pair div.${P}-on::after { content: ''; width: 3px; height: 5px; box-sizing: border-box; border: solid #fff; border-width: 0 1.2px 1.2px 0; transform: rotate(40deg); }
.${P}-ref { margin-bottom: 3px; font-size: 5.8px; line-height: 7px; color: #a8a8a8; }
.${P}-up { display: grid; place-items: center; width: 40px; height: 13px; margin-bottom: 3px; box-sizing: border-box; border-radius: 7px; box-shadow: inset 0 0 0 1px #9a9a9a; font-size: 6.2px; color: #e8e8e8; }
.${P}-ft { margin-top: auto; display: flex; align-items: center; justify-content: flex-end; gap: 5px; }
.${P}-cb { display: grid; place-items: center; width: 34px; height: 14px; box-sizing: border-box; border-radius: 7px; box-shadow: inset 0 0 0 1px #d6d6d6; font-size: 6.4px; color: #f0f0f0; }
.${P}-go { display: grid; place-items: center; width: 44px; height: 14px; box-sizing: border-box; border-radius: 7px; background: #2d7ff9; font-size: 6.4px; font-weight: 600; color: #fff; }
.${P}-r { flex: 1; min-width: 0; padding: 8px 9px 0 4px; background: #232323; }
.${P}-r h5 { margin: 0; font: 700 7px/9px ${UI_FONT}; color: #f2f2f2; }
.${P}-r p { margin: 1px 0 6px; font-size: 6px; color: #c4c4c4; }
.${P}-ins { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 4px; }
.${P}-ins i { display: block; aspect-ratio: 1; border-radius: 2px; }
.${P}-modal { position: absolute; left: 50%; top: 50%; width: 196px; margin: -45px 0 0 -98px; box-sizing: border-box; padding: 8px 9px 8px; border-radius: 7px; background: #333333; box-shadow: 0 0 0 1px #1b1b1b, 0 4px 14px rgba(0, 0, 0, .5); color: #f4f4f4; }
.${P}-modal h6 { margin: 0 0 5px; font: 600 7.4px/9px ${UI_FONT}; color: #fff; }
.${P}-bar { box-sizing: border-box; height: 8px; border-radius: 1px; background: #e6e6e6; box-shadow: 0 0 0 1px #fafafa; overflow: hidden; }
.${P}-bar i { display: block; height: 100%; width: 0; background: #2b8a2e; }
.${P}-tp { margin-top: 6px; font-size: 6.1px; line-height: 8px; color: #9a9a9a; }
.${P}-tp em { font-style: italic; color: #9a9a9a; margin-right: 2px; }
.${P}-cn { display: grid; place-items: center; width: 36px; height: 13px; margin: 5px 0 0 auto; box-sizing: border-box; border-radius: 7px; box-shadow: inset 0 0 0 1px #9a9a9a; font-size: 6.3px; color: #d8d8d8; }
.${P}-dock { flex: none; display: flex; flex-direction: column; width: ${DOCK_W}px; overflow: hidden; background: #2b2b2b; box-shadow: -1px 0 0 #121212; }
.${P}-tabs { flex: none; display: flex; gap: 8px; height: 13px; padding: 0 6px; font-size: 6.4px; line-height: 13px; color: #a2a2a2; white-space: nowrap; box-shadow: 0 1px 0 #1c1c1c; }
.${P}-tabs .${P}-on { color: #f1f1f1; box-shadow: 0 1.2px 0 #f1f1f1; }
.${P}-color { flex: none; height: 92px; box-shadow: 0 1px 0 #121212; }
.${P}-spec { display: flex; gap: 5px; padding: 7px 8px 0 18px; }
.${P}-spec i { display: block; height: 58px; }
.${P}-spec i:first-child { flex: 1; background: linear-gradient(to bottom, rgba(0, 0, 0, 0), #000), linear-gradient(to right, #fff, #ec2b2b); }
.${P}-spec i:last-child { flex: none; width: 7px; background: linear-gradient(to bottom, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000); }
.${P}-props { flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 1px 0 #121212; }
.${P}-gl { flex: none; display: flex; align-items: center; height: 14px; padding: 0 7px; font-size: 6.4px; color: #d2d2d2; white-space: nowrap; }
.${P}-lab { padding: 2px 7px; font-size: 6px; color: #a9a9a9; }
.${P}-prm { box-sizing: border-box; height: 26px; margin: 0 7px; padding: 3px 5px; background: #232323; box-shadow: inset 0 0 0 1px #3c3c3c; font-size: 6.2px; line-height: 8px; color: #e0e0e0; overflow: hidden; }
.${P}-wh { display: flex; gap: 4px; padding: 3px 7px; font-size: 6.2px; color: #c6c6c6; }
.${P}-wh span { flex: 1; box-sizing: border-box; height: 12px; padding: 0 5px; background: #232323; box-shadow: inset 0 0 0 1px #3c3c3c; line-height: 12px; }
.${P}-pgr { flex: none; display: flex; align-items: center; gap: 5px; height: 18px; padding: 0 7px; font-size: 6.4px; color: #e0e0e0; white-space: nowrap; }
.${P}-pgr b { font-weight: 500; }
.${P}-pgr u { margin-left: auto; text-decoration: none; display: grid; place-items: center; box-sizing: border-box; width: 40px; height: 12px; border-radius: 2px; box-shadow: inset 0 0 0 1px #8d8d8d; font-size: 6.4px; }
.${P}-g { display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 3px; padding: 2px 7px 0; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 1px; overflow: hidden; background: #333; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #333; }
.${P}-lyr { flex: none; height: 78px; box-sizing: border-box; }
.${P}-lrow { display: flex; align-items: center; gap: 5px; height: 17px; padding: 0 7px; font-size: 6.2px; color: #dcdcdc; white-space: nowrap; overflow: hidden; }
.${P}-lrow.${P}-on { background: #444; }
.${P}-lrow s { flex: none; display: block; width: 13px; height: 13px; background: #fff; box-shadow: 0 0 0 1px #151515; }
.${P}-lrow s.${P}-ck { background: repeating-conic-gradient(#cfcfcf 0% 25%, #fff 0% 50%) 0 0 / 5px 5px; }
`;

const PROMPT = 'a muse holding a handwritten note';
const PLACEHOLDER = 'Describe the image you want to generate';
const TIP = 'Make it uniquely yours. Use your own artwork as a reference image to generate content that reflects your personal style.';
const REF = 1.84;                                   // the beat's window (ctx.lastLand - ctx.cardIn) the layout below is drawn against
const TYPE0 = 0.02, TYPE1 = 0.08;                   // the prompt is typed over the placeholder
const GEN_AT = 0.1;                                 // Generate is pressed
const ISSUE = 0.2;                                  // the dialog closes and the modal appears
const MODAL_END = 0.8;                              // the modal clears, the first variation lands in the document, the strip starts to land
const FILL = (n) => `${n}/10`;
const TOOLS = ['', 'rd', '', 'ln', '', 'rd', '', '', 'rd', '', 'ln', '', 'rd'];
const INSPIRE = [
  'linear-gradient(135deg, #5e5a52, #b9b2a4)', 'linear-gradient(135deg, #f7c52b, #1f64b8)', 'linear-gradient(135deg, #7a4a2b, #e7d3b5)',
  'linear-gradient(135deg, #2a9d6a, #a84ae0)', 'linear-gradient(135deg, #d97aa3, #2f4f7a)', 'linear-gradient(135deg, #e9a05b, #6b8fb5)',
  'linear-gradient(135deg, #2d6f9e, #5ec0b1)', 'linear-gradient(135deg, #3ab0e8, #f2d49b)', 'linear-gradient(135deg, #1d5f86, #d4b46a)',
];

export default {
  id: 'photoshop-generate-image',
  label: 'Photoshop Generate Image (2024)',
  source: {
    platform: "Adobe Photoshop desktop app (Windows capture), the 'Generate Image' dialog and its 'Generating with Firefly Image 3' modal (screen recordings, 2026-05-26 and 2024-10-10)",
    feature: "near-black desktop chrome around a white document; the 'Generate Image' dialog (placeholder prompt, Prompt inspiration, Content type / Style / Mode / Reference image / Effects) closes on Generate and a centred dark modal 'Generating with Firefly Image 3' fills a GREEN determinate bar on a pale trough with an italic Tip and a rounded Cancel; the image then lands in the document and the Properties panel gains the '< n/N >' pager, Generate and the variation strip (adapted to 10: strict reading order, n/10)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=irtayp8pjtk', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=PFM2TdK_1Zg', retrieved: '2026-10-14' },
    ],
    extrapolated: "the ten-variation strip and the '< n/10 >' pager (the footage shows 1/3 to 3/3), the strict one-after-another landing in reading order after the modal clears (the footage lands the first variation at once), the document showing the latest landed variation as the selected one, the modal's timing (about 0.6 s here, 3.5 s in the footage) and its bar filling over exactly that life, the typed prompt (our own, in place of 'Rubber duck in a bubble bath'), the colour-field inspiration cards, and the dialog rows Style / Mode (the 2024 build's labels; the 2026 build shows Style / Composition under Reference image)",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'photoshop-generate-image');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const menus = ['File', 'Edit', 'Image', 'Layer', 'Type', 'Select', 'Filter', 'View', 'Plugins', 'Window', 'Help'];
    const dialog = `<div class="${P}-dlg"><div class="${P}-dh">×</div><div class="${P}-dc"><div class="${P}-l"><h5>Generate Image</h5><div class="${P}-ta"><span class="${P}-ph">${x.esc(PLACEHOLDER)}</span><span class="${P}-tx" style="display: none"></span></div><div class="${P}-lb">Content type</div><div class="${P}-pair"><div>Art</div><div class="${P}-on">Photo</div></div><div class="${P}-row">Style<b></b></div><div class="${P}-row">Mode<b></b></div><div class="${P}-lb">Reference image</div><div class="${P}-up">Upload</div><div class="${P}-ref">Match the content from your own reference image.</div><div class="${P}-row">Effects<b></b></div><div class="${P}-ft"><div class="${P}-cb">Cancel</div><div class="${P}-go">Generate</div></div></div><div class="${P}-r"><h5>Prompt inspiration</h5><p>Discover prompts to remix and make your own</p><div class="${P}-ins">${INSPIRE.map((b) => `<i style="background: ${b}"></i>`).join('')}</div></div></div></div>`;
    const modal = `<div class="${P}-modal" style="display: none"><h6>Generating with Firefly Image 3</h6><div class="${P}-bar"><i></i></div><div class="${P}-tp"><em>Tip:</em>${x.esc(TIP)}</div><div class="${P}-cn">Cancel</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-mb">${menus.map((m) => `<span>${m}</span>`).join('')}</div><div class="${P}-ob"><i></i><span>Auto-Select:</span><u>Layer</u><span>Show Transform Controls</span></div><div class="${P}-bd"><div class="${P}-tools">${TOOLS.map((k) => `<i${k ? ` class="${P}-${k}"` : ''}></i>`).join('')}</div><div class="${P}-cv"><div class="${P}-tab"><span class="${P}-tn">Untitled-1 (RGB/8)</span></div><div class="${P}-doc"><div class="${P}-page"><img src="${src}" width="870" height="1024" decoding="sync" alt="Generated image" style="visibility: hidden"/></div>${dialog}${modal}</div><div class="${P}-st">1600 px x 1200 px (72 ppi)</div></div><div class="${P}-dock"><div class="${P}-color"><div class="${P}-tabs"><span class="${P}-on">Color</span><span>Swatches</span><span>Gradients</span><span>Patterns</span></div><div class="${P}-spec"><i></i><i></i></div></div><div class="${P}-props"><div class="${P}-tabs"><span class="${P}-on">Properties</span><span>Adjustments</span><span>Libraries</span></div><div class="${P}-pd"><div class="${P}-gl">Document</div><div class="${P}-lab">Canvas</div><div class="${P}-wh"><span>W 1600 px</span><span>H 1200 px</span></div></div><div class="${P}-pg" style="display: none"><div class="${P}-gl">Generative Layer</div><div class="${P}-lab">Prompt:</div><div class="${P}-prm">${x.esc(PROMPT)}</div><div class="${P}-pgr" style="visibility: hidden"><b>‹</b><span class="${P}-k">1/10</span><b>›</b><u>Generate</u></div><div class="${P}-g" style="visibility: hidden">${tiles.map(cell).join('')}</div></div></div><div class="${P}-lyr"><div class="${P}-tabs"><span class="${P}-on">Layers</span><span>Channels</span><span>Paths</span></div><div class="${P}-lrow ${P}-on ${P}-ly" style="display: none"><s class="${P}-ck"></s>${x.esc(PROMPT)}</div><div class="${P}-lrow"><s></s><i style="font-style: italic">Background</i></div></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const dlgEl = q(`.${P}-dlg`), go = q(`.${P}-go`), ph = q(`.${P}-ph`), tx = q(`.${P}-tx`), modalEl = q(`.${P}-modal`), barFill = q(`.${P}-bar i`);
    const tab = q(`.${P}-tn`), pd = q(`.${P}-pd`), pg = q(`.${P}-pg`), pgr = q(`.${P}-pgr`), kEl = q(`.${P}-k`), grid = q(`.${P}-g`), ly = q(`.${P}-ly`), page = q(`.${P}-page img`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ el: n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate([...cells.map((c) => c.im), page]);

    // the beat's window against the layout above; every moment below is in t, the last variation landing exactly on ctx.lastLand
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
        const issued = t >= issueAt;
        const modalOn = issued && t < clearAt;
        const cleared = t >= clearAt;
        const c = ends.filter((e) => t >= e).length;    // variations landed: a growing prefix

        // the prompt is typed over the placeholder, then Generate is pressed and the dialog closes
        const n = Math.max(0, Math.min(PROMPT.length, Math.ceil(((s - TYPE0) / (TYPE1 - TYPE0)) * PROMPT.length)));
        put('typed', n, (v) => { ph.style.display = v > 0 ? 'none' : ''; tx.style.display = v > 0 ? '' : 'none'; tx.textContent = PROMPT.slice(0, v); });
        const gp = press(s, GEN_AT, 0.04, 0.04, 0.08);
        put('gp', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        put('dlg', !issued, (v) => { dlgEl.style.display = v ? '' : 'none'; });

        // the modal: a determinate green bar over its own life (full as it clears)
        put('modal', modalOn, (v) => { modalEl.style.display = v ? '' : 'none'; });
        const f = Math.min(1, Math.max(0, (t - issueAt) / (clearAt - issueAt)));
        put('bar', f.toFixed(3), () => { barFill.style.width = `${(f * 100).toFixed(1)}%`; });

        // Properties: Document until Generate, then the Generative Layer; the pager and the strip arrive with the image
        put('pd', issued, (v) => { pd.style.display = v ? 'none' : ''; pg.style.display = v ? '' : 'none'; });
        put('pgr', cleared, (v) => { pgr.style.visibility = v ? '' : 'hidden'; grid.style.visibility = v ? '' : 'hidden'; });
        put('k', c, (v) => { kEl.textContent = FILL(Math.max(1, v)); });
        put('ly', c > 0, (v) => { ly.style.display = v ? '' : 'none'; });
        put('tab', c > 0, (v) => { tab.textContent = v ? `Untitled-1 (${PROMPT}, RGB/8)` : 'Untitled-1 (RGB/8)'; });

        // the document: blank white until a variation lands, then the latest one (the selected variation)
        put('page', c, (v) => {
          if (v === 0) { page.style.visibility = 'hidden'; return; }
          const g = tiles[v - 1];
          page.style.visibility = '';
          page.style.transformOrigin = g.origin;
          page.style.transform = restTransform(g);
          page.style.filter = restFilter(g);
        });

        cells.forEach((cl, i) => {
          const landed = t >= ends[i];
          put(`i${i}`, landed, (v) => { cl.im.style.visibility = v ? '' : 'hidden'; cl.pend.style.display = v ? 'none' : ''; });
          cl.im.style.filter = restFilter(cl.g);
          cl.im.style.transform = restTransform(cl.g);
          put(`s${i}`, landed && i === c - 1, (v) => { cl.el.style.boxShadow = v ? '0 0 0 1.5px #2d7ff9' : ''; });
        });
      },
    };
  },
};
