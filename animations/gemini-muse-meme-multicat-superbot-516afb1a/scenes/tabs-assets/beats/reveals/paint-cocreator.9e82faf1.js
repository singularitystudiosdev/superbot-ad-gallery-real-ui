// Windows Paint, the 'Cocreator' side pane (the Copilot+ PC sketch-and-prompt pane, Windows 11 light theme). Primary footage:
// Microsoft's own Copilot+ Paint demo (an Azure-hosted 1920x1080 screen recording, published 2024-11-01, Paint with the Cocreator
// pane open: the title 'Cocreator', a dotted preview box with the helper line 'Enter a text description and draw on the canvas
// to start creating your artwork', the field 'Describe what you'd like to create', 'Style' (No Selection) and a 'Creativity'
// slider) and, for the working affordance, Microsoft ExpertZone on YouTube VBRYaeK_cT0 (2024-07-05, the dark May-2024 build of
// the same pane). Spec .tmp/clone-9e82faf1/reveal-refs/paint-cocreator/spec.json (confidence 0.56), frames ar_cc_19..70,
// ar_cc_arc_01..05, pane1..5.png.
// This is the SKETCH pane, the counterpart of the text pane 'Image Creator': a light near-white pane whose top is one rounded
// preview box on a pale dot grid, a prompt field, a Style dropdown and a Creativity slider, beside a canvas that holds a simple
// hand sketch. While a generation runs the box echoes the sketch as a thin blue line over the dots and a small pale-blue arc
// (#8FD8F0) cycles on the newest stroke (small arc, crescent, dot, displaced); there is no verb, percentage or timer. The
// interpretation then hard-swaps in. Adapted to ten: the box becomes a 5 x 2 grid of interpretations that land in strict
// reading order. Omitted: the Windows and Microsoft logos, the account avatar, the taskbar and the producer captions of the demo.
// The footage's pictures are never reproduced: every interpretation is our own meme and the sketch is our own plain strokes.
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pcc';
const ROOT_H = 388, PANE_W = 256, COLS = 5;
const ARC = '#8FD8F0';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #f3f6fa; color: #1b1b1b; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d6dce3; }
.${P}-tb { flex: none; display: flex; align-items: center; height: 18px; padding: 0 0 0 8px; font-size: 7px; color: #222; background: #eef2f7; }
.${P}-tb b { flex: 1; font-weight: 400; }
.${P}-tb i { display: block; width: 20px; height: 18px; position: relative; }
.${P}-tb i::before { content: ""; position: absolute; left: 7px; top: 8px; width: 6px; height: 1px; background: #333; }
.${P}-tb i.${P}-sq::before { top: 6px; height: 5px; width: 5px; background: none; box-shadow: inset 0 0 0 1px #333; }
.${P}-tb i.${P}-x::before { left: 6px; top: 5px; width: 8px; height: 8px; background: linear-gradient(45deg, transparent 45%, #333 45%, #333 55%, transparent 55%), linear-gradient(-45deg, transparent 45%, #333 45%, #333 55%, transparent 55%); }
.${P}-menu { flex: none; display: flex; gap: 14px; align-items: center; height: 18px; padding: 0 10px; font-size: 7.5px; color: #222; background: #eef2f7; }
.${P}-rib { flex: none; display: flex; align-items: stretch; height: 44px; padding: 3px 6px 0; background: #f8fafc; box-shadow: 0 1px 0 #dbe1e8; }
.${P}-grp { position: relative; flex: none; box-sizing: border-box; display: flex; align-items: center; gap: 4px; height: 100%; padding: 0 7px 9px; }
.${P}-grp + .${P}-grp { box-shadow: -1px 0 0 #e1e6ec; }
.${P}-grp u, .${P}-btn u { position: absolute; left: 0; right: 0; bottom: 0; text-align: center; text-decoration: none; font-size: 5.5px; line-height: 9px; color: #4a4f55; white-space: nowrap; }
.${P}-ic { flex: none; display: block; width: 11px; height: 11px; border-radius: 2px; background: #7b8189; }
.${P}-ic.${P}-ic2 { background: none; box-shadow: inset 0 0 0 1.3px #7b8189; }
.${P}-ic.${P}-ic3 { background: #4f94c4; border-radius: 50%; }
.${P}-ic.${P}-ic4 { background: #9aa0a7; width: 8px; }
.${P}-big { width: 15px; height: 15px; border-radius: 3px; background: none; box-shadow: inset 0 0 0 1.3px #7b8189; }
.${P}-dots { display: grid; grid-template-columns: repeat(10, 6px); gap: 2px 2.5px; }
.${P}-dots i { display: block; width: 6px; height: 6px; border-radius: 50%; }
.${P}-btn { position: relative; flex: none; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; width: 44px; height: 100%; padding-top: 5px; border-radius: 4px; }
.${P}-btn.${P}-sel { background: #e4f0fb; box-shadow: inset 0 0 0 1px #8dbbe6; }
.${P}-body { flex: 1; min-height: 0; display: flex; background: #e9eff6; }
.${P}-area { position: relative; flex: 1; min-width: 0; }
.${P}-cv { position: absolute; left: 12px; right: 12px; top: 50%; aspect-ratio: 300 / 200; transform: translateY(-56%); background: #ffffff; box-shadow: 0 0 0 1px #cfd6de; }
.${P}-cv svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${P}-pane { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANE_W}px; padding: 8px 10px 0; background: #f6fafd; box-shadow: -1px 0 0 #dde3ea; }
.${P}-ttl { flex: none; height: 14px; font-size: 10px; font-weight: 600; color: #1b1b1b; }
.${P}-box { position: relative; flex: none; box-sizing: border-box; height: 104px; margin-top: 4px; padding: 6px; border-radius: 6px; background-color: #f6fafd; background-image: radial-gradient(circle, #aaaeb1 0.6px, transparent 0.9px); background-size: 6px 6px; box-shadow: inset 0 0 0 1px #dfe4ea; overflow: hidden; }
.${P}-hp { position: absolute; left: 0; right: 0; top: 0; bottom: 0; display: grid; place-items: center; padding: 0 22px; text-align: center; font-size: 7.5px; line-height: 10.5px; color: #7a7e81; }
.${P}-echo { position: absolute; inset: 0; }
.${P}-echo svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${P}-g { position: relative; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: 4px; }
.${P}-t { position: relative; aspect-ratio: 1; border-radius: 3px; overflow: hidden; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-lb { flex: none; display: flex; align-items: center; justify-content: space-between; margin-top: 8px; height: 11px; font-size: 7.5px; font-weight: 600; color: #1b1b1b; }
.${P}-lb s { text-decoration: none; display: block; width: 7px; height: 7px; border-radius: 50%; box-shadow: inset 0 0 0 1px #6b7077; }
.${P}-in { flex: none; box-sizing: border-box; margin-top: 3px; height: 32px; padding: 5px 7px; border-radius: 4px; background: #ffffff; box-shadow: inset 0 0 0 1px #dadfe5, inset 0 -1px 0 #7b8189; font-size: 7.5px; line-height: 10px; color: #1f1f1f; overflow: hidden; }
.${P}-row2 { flex: none; display: flex; gap: 10px; }
.${P}-row2 > div { flex: 1; min-width: 0; }
.${P}-dd { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 20px; margin-top: 3px; padding: 0 6px 0 4px; border-radius: 4px; background: #ffffff; box-shadow: inset 0 0 0 1px #dadfe5; font-size: 7.5px; color: #1f1f1f; }
.${P}-dd span { display: flex; align-items: center; gap: 4px; }
.${P}-dd i { display: block; width: 12px; height: 12px; border-radius: 2px; background: linear-gradient(135deg, #c9d3de, #aeb9c6); }
.${P}-dd b { display: block; width: 4px; height: 4px; margin-top: -2px; border: solid #5a5f66; border-width: 0 1px 1px 0; transform: rotate(45deg); }
.${P}-sd { position: relative; height: 3px; margin-top: 11px; border-radius: 2px; background: #c7ccd2; }
.${P}-sd i { position: absolute; left: 0; top: 0; bottom: 0; width: 58%; border-radius: 2px; background: #0f6cbd; }
.${P}-sd b { position: absolute; left: 58%; top: -3px; width: 9px; height: 9px; margin-left: -4.5px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 0 1px #8c929a, 0 1px 2px rgba(0, 0, 0, .25); }
.${P}-sbar { flex: none; display: flex; align-items: center; gap: 16px; height: 16px; padding: 0 10px; background: #eef2f7; font-size: 6.5px; color: #3a3f45; }
.${P}-sbar span:last-child { margin-left: auto; }
.${P}-zm { display: block; width: 46px; height: 2px; border-radius: 1px; background: #a3a9b0; position: relative; }
.${P}-zm::after { content: ""; position: absolute; left: 0; top: -2.5px; width: 7px; height: 7px; border-radius: 50%; background: #0f6cbd; }
`;

const PROMPT = 'A muse at a lectern holding a handwritten note, meme style, bright colours';
const HELPER = 'Enter a text description and draw on the canvas to start creating your artwork';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.16;                               // the last stroke is drawn: the helper line gives way to the sketch echo and the arc
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // interpretation i hard-swaps into the box (reading order), the last at 1.68
const CYCLE = 0.9;                                // one small-arc -> crescent -> dot -> displaced pass of the arc, real seconds
// the newest stroke's end, where the arc works: four displaced stations (box-local viewBox 0..236 x 0..104)
const STATIONS = [[113, 39], [93, 58], [158, 76], [141, 52]];
const SWATCH = ['#000', '#7f7f7f', '#c42b1c', '#e5322d', '#f7630c', '#fce100', '#13a10e', '#0f9fe0', '#2d62d4', '#a455c7', '#fff', '#bdbdbd', '#a97753', '#f4a7c0', '#f9b200', '#e2d898', '#8ed03a', '#8bd7f2', '#7a9bc9', '#b7a9ea'];

// the sketch as plain strokes in a 300 x 200 box: a horizon with two hills, a sun, a lectern figure with a raised hand and a note
const SKETCH = 'M6 138 C46 110 78 108 118 128 C150 144 176 108 216 100 C246 94 272 108 294 122 M60 164 L118 164 M190 168 L286 168 M96 122 L96 66 M96 66 C96 54 112 54 112 66 C112 78 96 78 96 66 M96 80 L96 112 M96 86 L78 70 M96 86 L120 96 M96 112 L84 140 M96 112 L110 140 M236 84 L236 150 M236 84 C214 82 216 56 236 60 C256 56 258 82 236 84 M126 62 L152 62 L152 78 L126 78 Z M40 34 C40 24 52 24 52 34 C52 44 40 44 40 34 M46 18 L46 14 M46 50 L46 54 M30 34 L26 34 M62 34 L66 34';

export default {
  id: 'paint-cocreator',
  label: 'Paint Cocreator (2024)',
  source: {
    platform: "Windows 11 Paint on a Copilot+ PC, the 'Cocreator' side pane (Microsoft's own Copilot+ Paint demo recording, published 2024-11-01, light theme; the working affordance from Microsoft ExpertZone's YouTube clip, 2024-07-05, the dark May-2024 build of the same pane)",
    feature: "near-white pane with the title 'Cocreator', one rounded preview box on a pale dot grid carrying the helper line 'Enter a text description and draw on the canvas to start creating your artwork', the field 'Describe what you'd like to create', a 'Style' dropdown (No Selection) and a 'Creativity' slider, beside a canvas holding a simple sketch; while a generation runs the box echoes the sketch as a thin blue line and a small pale-blue arc (#8FD8F0) cycles on the newest stroke (small arc, crescent, dot, displaced), with no verb, percentage or timer, then the interpretation hard-swaps in (adapted to 10: the box becomes a 5 x 2 grid of interpretations landing in strict reading order; the Windows and Microsoft logos are omitted)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=VBRYaeK_cT0', video: 'VBRYaeK_cT0', published: '2024-07-05', retrieved: '2026-10-14' },
      { url: 'https://videoencodingpublic-hgeaeyeba8gycee3.b01.azurefd.net/public-b5a61598-c600-40cb-9d3b-606472daefb7/video_1001_1730178282363_1920x1080.mp4', published: '2024-11-01', retrieved: '2026-10-14' },
      { url: 'https://support.microsoft.com/en-us/windows/ai/ai-apps/use-copilot-pc-features-in-paint', retrieved: '2026-10-14' },
    ],
    extrapolated: [
      "two builds of the same pane are combined on purpose: the static surface (title 'Cocreator', the helper string, 'Describe what you'd like to create', 'Style' / 'No Selection', 'Creativity', the 2024 LIGHT theme) follows the Nov-2024 Copilot+ support video; the pale-blue animated arc follows the dark May-2024 build (the light build shows no spinner), so the arc is drawn in #8FD8F0 on the light pane, where it reads fainter than it does on the dark pane; confidence 0.56",
      "ten interpretations in strict reading order (10, extrapolated): the footage's box hard-swaps to ONE interpretation (~0.3 s after the stroke in the demo, which is edited) and the dark build shows it arriving progressively; here ten land one at a time at an even step across the beat's window, the box becoming a 5 x 2 grid",
      "the arc's cycle (a 0.9 s period of sweep growing then shrinking, rotating, displaced to a new station each pass) is derived from the five frames at 10 fps; its stations are an approximation of 'on/near the newest stroke'",
      "the canvas sketch, the sketch echo and the prompt are our own plain strokes and wording (neutral grey strokes on the canvas, a thin blue line in the echo); the footage's own sketch and pictures are not reproduced",
      "the Creativity slider rests at 58 and the Style reads No Selection, as no state change is visible in the footage's pending window; the window chrome (title bar, ribbon, status bar) is drawn plainly without the account avatar, the taskbar or logos",
      "the status bar keeps the canvas size and a zoom slider but drops the footage's '100%' zoom readout, so no percentage sign appears anywhere in the block",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'paint-cocreator');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`;
    const grp = (inner, name, w) => `<div class="${P}-grp" style="width: ${w}px">${inner}<u>${name}</u></div>`;
    const stroke = (c, w) => `<path d="${SKETCH}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    const root = x.el(`<div class="${P}"><div class="${P}-tb"><b>Untitled - Paint</b><i></i><i class="${P}-sq"></i><i class="${P}-x"></i></div><div class="${P}-menu"><span>File</span><span>Edit</span><span>View</span></div><div class="${P}-rib">${grp(`<i class="${P}-ic ${P}-big"></i>`, 'Selection', 40)}${grp(`<i class="${P}-ic"></i><i class="${P}-ic ${P}-ic2"></i>`, 'Image', 48)}${grp(`<i class="${P}-ic ${P}-ic4"></i><i class="${P}-ic ${P}-ic3"></i>`, 'Tools', 46)}${grp(`<i class="${P}-ic ${P}-ic2"></i>`, 'Brushes', 38)}${grp(`<i class="${P}-ic ${P}-ic2"></i><i class="${P}-ic ${P}-ic2"></i><i class="${P}-ic ${P}-ic2"></i>`, 'Shapes', 56)}${grp(`<div class="${P}-dots">${SWATCH.map((c) => `<i style="background: ${c}"></i>`).join('')}</div>`, 'Colours', 90)}<div style="flex: 1"></div><div class="${P}-btn"><i class="${P}-ic ${P}-ic2"></i><u>Image Creator</u></div><div class="${P}-btn ${P}-sel"><i class="${P}-ic ${P}-ic2"></i><u>Cocreator</u></div><div class="${P}-btn"><i class="${P}-ic ${P}-ic2"></i><u>Layers</u></div></div><div class="${P}-body"><div class="${P}-area"><div class="${P}-cv"><svg viewBox="0 0 300 200" preserveAspectRatio="none">${stroke('#5b5f66', 2.4)}</svg></div></div><div class="${P}-pane"><div class="${P}-ttl">Cocreator</div><div class="${P}-box"><div class="${P}-hp">${HELPER}</div><div class="${P}-echo" style="visibility: hidden"><svg viewBox="0 0 300 200" preserveAspectRatio="none" style="left: 48px; top: 6px; width: 140px; height: 93px">${stroke('#3b8fd9', 1.3)}</svg><svg viewBox="0 0 236 104" preserveAspectRatio="none"><path class="${P}-arc" d="" fill="none" stroke="${ARC}" stroke-width="3" stroke-linecap="round"/></svg></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-lb">Describe what you'd like to create<s></s></div><div class="${P}-in">${x.esc(PROMPT)}</div><div class="${P}-row2"><div><div class="${P}-lb">Style</div><div class="${P}-dd"><span><i></i>No Selection</span><b></b></div></div><div><div class="${P}-lb">Creativity<s></s></div><div class="${P}-sd"><i></i><b></b></div></div></div></div></div><div class="${P}-sbar"><span>1993 × 1039px</span><span><i class="${P}-zm"></i></span></div></div>`);
    const q = (s) => root.querySelector(s);
    const hp = q(`.${P}-hp`), echo = q(`.${P}-echo`), arc = q(`.${P}-arc`), g = q(`.${P}-g`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), g: tiles[i] }));
    // the tiles sit in the box's padding, so the grid is one block over the dot grid
    g.style.cssText = 'position: relative;';
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the helper line holds until the stroke is made; the sketch echo and the arc work until the last interpretation lands
        const pending = s >= ISSUE && s < LAND[9];
        put('hp', s >= ISSUE, (v) => { hp.style.visibility = v ? 'hidden' : ''; });
        put('echo', pending, (v) => { echo.style.visibility = v ? '' : 'hidden'; });

        // the pale-blue arc: the sweep grows from a small arc to a crescent and shrinks to a dot while it turns, then the next
        // pass starts at another station; all a function of t alone, quantised to whole degrees and 0.1 px
        {
          const n = Math.floor(t / CYCLE), u = t / CYCLE - n;
          const sweep = Math.round(10 + 250 * Math.pow(Math.sin(Math.PI * u), 1.5));
          const rot = Math.round(((u * 540 + n * 97) % 360 + 360) % 360);
          const st = STATIONS[((n % STATIONS.length) + STATIONS.length) % STATIONS.length];
          put('arc', pending ? `${sweep}/${rot}/${st[0]}` : 'off', (key) => {
            if (key === 'off') { arc.setAttribute('d', ''); return; }
            const r = 8, a0 = (rot * Math.PI) / 180, a1 = ((rot + sweep) * Math.PI) / 180;
            const p = (a) => `${(st[0] + r * Math.cos(a)).toFixed(1)} ${(st[1] + r * Math.sin(a)).toFixed(1)}`;
            arc.setAttribute('d', `M${p(a0)} A${r} ${r} 0 ${sweep > 180 ? 1 : 0} 1 ${p(a1)}`);
          });
        }

        // each interpretation hard-swaps into its cell in reading order
        cells.forEach((c, i) => {
          put(`i${i}`, s >= LAND[i], (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
        });
      },
    };
  },
};
