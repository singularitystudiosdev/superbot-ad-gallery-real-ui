// Lalaland.ai's render panel, as it appeared inside a desktop 3D garment-design tool (YouTube a9aCev3pThU, Browzwear Solutions 'Meet the
// Lalaland AI & VStitcher Integration', published 2023-07-27, 1920x1080 screen recording, t~28-35 s; spec
// .tmp/clone-9e82faf1/reveal-refs/lalaland-ai/spec.json, confidence 0.62; frames as_lala_steps_t28, as_lala_prepare_t31,
// as_lala_upload23_t33, as_lala_upload66_t34, as_lala_upload100_t34, as_lala_renders_t35). The wait is a light #F5F5F5 plugin panel under a
// thin dark title bar ('Export Configuration'): a horizontal three-dot stepper across the middle ('Model configuration' / 'Preparing
// render' / 'Uploading render assets', the active dot purple and the rest grey), two centred lines of grey caption and a DETERMINATE bar
// (#6C7BE0 on a #D8D6F2 track) with its percentage printed to the right (23% -> ~61% -> 100% in the footage). Nothing spins. When the bar
// reaches 100% the panel is replaced by the renders dashboard: a segmented 'All renders | Initiated | Completed' control, a 'Find renders'
// field and one row per render, each starting as 'Initiated' and ending 'Completed'.
// Adapted to ten images: the stepper advances from t and the bar and its percentage count up from 0 to 100 while the third step is
// active, then the dashboard swaps in showing ten slots (five by two, 'Initiated') that take their renders in strict reading order and turn
// 'Completed'. EXTRAPOLATED, not footage: the footage's results are a plain text list of renders (no thumbnails, and it does not show them
// arriving one at a time), so the ten thumbnail slots, their landing order (0.0911 s apart in layout time, the last at 1.68) and the swap
// time are ours; the footage counts 23 -> 61 -> 100 over ~1.2 s and the linear 0 -> 100 count here is ours too. The fraction is rounded to a
// whole percent and everything stops at 100 / at the last landing, so the block is frozen once all ten are in. The note is the footage's own
// sentence, with its file-type word filled in as the spec records it. Omitted: the wordmark and every logo, the 'View on Lalaland' pill (a
// link into the vendor's account), the trial-renders counter and the account chrome, the host tool's icon and window controls, and the
// model and shoe pickers of the earlier step (the host tool stays neutral and unbranded: system type, plain shapes).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-lll';
const ROOT_H = 336, COLS = 5, GAP = 8;
const VIO = '#7c6fd6', BAR = '#6c7be0', TRACK = '#d8d6f2', GREY = '#b9b9bd';
const CSS = `
.${P} { position: relative; box-sizing: border-box; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #f5f5f5; color: #3d3d42; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdce0; }
.${P}-bar0 { position: absolute; left: 0; right: 0; top: 0; height: 18px; background: #2d2d30; font-size: 7px; line-height: 18px; padding-left: 10px; color: #a9a9ae; }
.${P}-wait, .${P}-list { position: absolute; left: 0; right: 0; top: 18px; bottom: 0; background: #f5f5f5; }
.${P}-steps { position: absolute; left: 62px; right: 62px; top: 74px; height: 12px; }
.${P}-steps:before { content: ""; position: absolute; left: 6px; right: 6px; top: 5.25px; height: 1.5px; background: #c4c4c8; }
.${P}-dot { position: absolute; top: 0; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: ${GREY}; }
.${P}-dot.${P}-on { background: ${VIO}; }
.${P}-lab { position: absolute; top: 17px; width: 110px; margin-left: -55px; text-align: center; font-size: 7.2px; color: #a9a9ae; white-space: nowrap; }
.${P}-lab.${P}-on { color: ${VIO}; }
.${P}-note { position: absolute; left: 50px; right: 50px; top: 132px; text-align: center; font-size: 8.4px; line-height: 12.5px; color: #3d3d42; }
.${P}-prog { position: absolute; left: 80px; right: 80px; top: 176px; display: flex; align-items: center; gap: 8px; height: 12px; }
.${P}-trk { flex: 1; height: 3px; border-radius: 2px; background: ${TRACK}; overflow: hidden; }
.${P}-trk i { display: block; height: 100%; width: 0; background: ${BAR}; }
.${P}-pct { flex: none; width: 24px; font-size: 8px; color: #4a4a4a; }
.${P}-top { position: absolute; left: 20px; right: 20px; top: 14px; height: 26px; display: flex; align-items: center; gap: 12px; }
.${P}-seg { display: flex; box-sizing: border-box; height: 20px; border-radius: 5px; box-shadow: inset 0 0 0 1px #bdb8ea; overflow: hidden; }
.${P}-seg span { display: grid; place-items: center; padding: 0 11px; font-size: 7.6px; color: ${VIO}; white-space: nowrap; }
.${P}-seg span + span { box-shadow: inset 1px 0 0 #bdb8ea; }
.${P}-seg .${P}-on { background: #8481ee; color: #fff; }
.${P}-find { margin-left: auto; display: flex; align-items: center; box-sizing: border-box; width: 118px; height: 20px; padding: 0 8px; border-radius: 5px; background: #fff; box-shadow: inset 0 0 0 1px #dcdce2; font-size: 7.4px; color: #9a9aa2; }
.${P}-g { position: absolute; left: 20px; right: 20px; top: 56px; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; background: #ecebf8; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #ecebf8; }
.${P}-chip { position: absolute; left: 5px; bottom: 5px; box-sizing: border-box; height: 12px; padding: 0 5px; border-radius: 3px; font-size: 6.4px; line-height: 12px; font-style: normal; white-space: nowrap; }
.${P}-chip.${P}-ci { background: #dcd9f6; color: #5e55c4; }
.${P}-chip.${P}-cc { background: #e3f4ea; color: #2c8a55; visibility: hidden; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const STEP2 = 0.14, STEP3 = 0.30;                  // the stepper moves to 'Preparing render', then 'Uploading render assets'
const BAR_A = 0.30, BAR_B = 0.70;                  // the bar counts 0 -> 100 while the third step is active
const SWAP = 0.78;                                 // the panel gives way to the renders dashboard
const LAND = Array.from({ length: 10 }, (_, i) => 0.86 + i * 0.0911);   // render i lands (strict reading order), the last at 1.68
const STEPS = ['Model configuration', 'Preparing render', 'Uploading render assets'];
const NOTE = 'We are uploading VRSCENE to the cloud. Upload speeds depend on your internet connection. Final renders will appear in your Lalaland account when they get completed.';

export default {
  id: 'lalaland-ai',
  label: 'Lalaland.ai render (2023)',
  source: {
    platform: "Lalaland.ai AI-model render panel inside a desktop 3D garment-design tool (light plugin panel under a dark title bar; a product-integration screen recording on YouTube, published 2023-07-27)",
    feature: "light #F5F5F5 panel: a three-dot stepper 'Model configuration / Preparing render / Uploading render assets' (active dot purple), the note 'We are uploading ... to the cloud ...' and a determinate bar (#6C7BE0 on #D8D6F2) with a rising percentage, then the renders dashboard whose renders land (adapted to 10: the stepper advances from t, the bar counts 0 to 100, then ten 'Initiated' slots take their renders in strict reading order and turn 'Completed'; logos, the vendor-account pill and the trial counter are omitted, the host tool is unbranded)",
    refs: [{ url: 'https://www.youtube.com/watch?v=a9aCev3pThU', retrieved: '2026-10-14' }],
    dates: { published: '2023-07-27', retrieved: '2026-10-14', clip: 't~28-35 s' },
    extrapolated: [
      'ten thumbnail slots in two rows of five on the renders dashboard (the footage lists renders as text rows without thumbnails)',
      'strict reading-order landing of ten renders, 0.0911 s apart, each turning Initiated -> Completed',
      'the linear 0 -> 100 count of the bar (the footage samples 23 -> 61 -> 100 only) and the stepper step times',
      'the panel-to-dashboard swap time within the beat',
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'lalaland-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div><s class="${P}-chip ${P}-ci" style="text-decoration: none">Initiated</s><s class="${P}-chip ${P}-cc" style="text-decoration: none">Completed</s></div>`;
    const pos = ['6px', '50%', 'calc(100% - 6px)'];
    const dots = STEPS.map((_, i) => `<i class="${P}-dot" style="left: ${pos[i]}"></i>`).join('');
    const labs = STEPS.map((n, i) => `<span class="${P}-lab" style="left: ${pos[i]}">${n}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-bar0">Export Configuration</div><div class="${P}-list"><div class="${P}-top"><div class="${P}-seg"><span class="${P}-on">All renders</span><span>Initiated</span><span>Completed</span></div><div class="${P}-find">Find renders</div></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-wait"><div class="${P}-steps">${dots}${labs}</div><div class="${P}-note" style="visibility: hidden">${NOTE}</div><div class="${P}-prog" style="visibility: hidden"><div class="${P}-trk"><i></i></div><span class="${P}-pct">0%</span></div></div></div>`);
    const wait = root.querySelector(`.${P}-wait`), note = root.querySelector(`.${P}-note`), prog = root.querySelector(`.${P}-prog`), fill = root.querySelector(`.${P}-trk i`), pctEl = root.querySelector(`.${P}-pct`);
    const dotEls = [...root.querySelectorAll(`.${P}-dot`)], labEls = [...root.querySelectorAll(`.${P}-lab`)];
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), ini: n.querySelector(`.${P}-chip.${P}-ci`), done: n.querySelector(`.${P}-chip.${P}-cc`) }));
    ctx.gate(cells.map((c) => c.im));
    tiles.forEach((g, i) => { cells[i].im.style.filter = restFilter(g); cells[i].im.style.transform = restTransform(g); });

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the stepper advances: the active dot and its label are purple, the others grey
        const step = s >= STEP3 ? 2 : s >= STEP2 ? 1 : 0;
        put('step', step, (v) => dotEls.forEach((d, i) => { d.classList.toggle(`${P}-on`, i === v); labEls[i].classList.toggle(`${P}-on`, i === v); }));

        // the note and the determinate bar belong to the third step; the percentage counts up and holds at 100
        put('up', step === 2, (v) => { note.style.visibility = v ? '' : 'hidden'; prog.style.visibility = v ? '' : 'hidden'; });
        const pct = Math.round(seg(s, BAR_A, BAR_B) * 100);
        put('pct', pct, (v) => { fill.style.width = `${v}%`; pctEl.textContent = `${v}%`; });

        // the panel is replaced by the renders dashboard at the swap
        put('swap', s >= SWAP, (v) => { wait.style.display = v ? 'none' : ''; });

        // the renders land in strict reading order, each slot turning Initiated -> Completed
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => {
            c.im.style.visibility = v ? 'visible' : 'hidden';
            c.pend.style.display = v ? 'none' : '';
            c.ini.style.display = v ? 'none' : '';
            c.done.style.visibility = v ? 'visible' : 'hidden';
          });
        });
      },
    };
  },
};
