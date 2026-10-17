// Prezi Present's 'Create an image' panel, the Prezi AI text-to-image flow (a first-party tutorial on the Prezi YouTube channel, 'How to
// Create AI-Generated Images in Prezi Present (Step-by-Step Tutorial)', video fSf2mvxo9t4, published 2025-11-25, t~22.6-25.6 s; spec
// .tmp/clone-9e82faf1/reveal-refs/prezi-ai-image/spec.json, confidence 0.74; frames am_prezi_22.8.png, am_prezi_panel_generating.png,
// am_prezi_panel_done.png). The Prezi Present editor: a dotted canvas on the left carrying the open slide (a yellow slide between a blue band
// and a red one), and the white rounded 'Create an image' card docked on the right: its title with a close cross, a grey 'Upload' segmented
// button with a caret, the five-icon tab strip (the four-point sparkle = AI prompt tab selected as a white pill), the prompt box holding the
// prompt, the 'Photo' style and 'Tall' aspect drop-downs and a full-width indigo-to-purple 'Generate' button. Pressing it relabels the button
// in place 'Generating' in a desaturated lilac, puts a grey indeterminate ring spinner under it with the line (an info-circle glyph first)
// 'Bringing your image to life! This could take up to 20 seconds.', greys the prompt box out and shows empty light-grey rounded slots at the
// bottom of the panel. There is no percentage, queue number, bar or blur, and the slide canvas does not change while it waits. The finished
// thumbnails then fill those slots, the button returns to 'Generate' and the picked picture is dropped onto the slide.
// Adapted to ten images: the footage's two slots become ten (a 5 x 2 block, so the panel needs no scroll), filled in strict reading order,
// the ring turning from render(t) and standing still once the last one has landed. Omitted: the Prezi logo, the account and plan chrome, the
// slide rail, the zoom and help controls and the cursor. The footage's pictures are never reproduced: every tile is our own meme, and no logo,
// wordmark or platform font is drawn (plain outlined glyphs, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pzi';
const ROOT_H = 440, PANEL_W = 270, COLS = 5, GAP = 4;
const INK = '#2c2e33', GREY = '#8e8e93', RING = '#e4e4e7', SLOT = '#f1f1f3';
const BTN_ON = 'linear-gradient(90deg, #3b3fc2, #7b22b8)', BTN_OFF = 'linear-gradient(90deg, #a5abe2, #d0a8e8)';
const CSS = `
.${P} { box-sizing: border-box; display: flex; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #eef0f4; color: ${INK}; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d9dce2; }
.${P}-cv { position: relative; flex: 1; min-width: 0; overflow: hidden; background: radial-gradient(circle, #d3d6dd 1px, rgba(211, 214, 221, 0) 1.3px) 0 0 / 10px 10px, #f3f4f7; }
.${P}-band { position: absolute; left: 0; right: 0; }
.${P}-b1 { top: 0; height: 66px; background: #6272e4; }
.${P}-b1 i { position: absolute; bottom: 0; display: block; border-radius: 40px 40px 0 0; background: #7280ea; }
.${P}-b3 { top: 316px; bottom: 0; background: #e8645c; }
.${P}-sl { position: absolute; left: 0; right: 0; top: 66px; height: 250px; background: #fbb003; box-shadow: inset 0 0 0 1px #3a3c44; overflow: hidden; }
.${P}-arch { position: absolute; left: 34px; top: 34px; box-sizing: border-box; width: 150px; height: 230px; border-radius: 75px 75px 0 0; border: 26px solid rgba(255, 255, 255, .22); border-bottom: 0; }
.${P}-lock { position: absolute; left: 8px; top: 20px; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; background: #fff; box-shadow: 0 1px 4px rgba(20, 22, 30, .25); }
.${P}-lock svg { width: 9px; height: 9px; fill: ${INK}; }
.${P}-pic { position: absolute; right: 24px; top: 42px; width: 112px; height: 132px; border-radius: 3px; overflow: hidden; box-shadow: 0 0 0 1.5px #6c4bf4, 0 4px 10px rgba(20, 22, 30, .3); visibility: hidden; }
.${P}-pic img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pn { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANEL_W}px; margin: 6px 6px 6px 0; border-radius: 10px; background: #fff; box-shadow: 0 0 0 1px #e5e7eb, 0 2px 10px rgba(20, 22, 30, .12); overflow: hidden; }
.${P}-hd { flex: none; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; height: 26px; padding: 0 12px; border-bottom: 1px solid #e6e7ea; font-size: 8.5px; font-weight: 700; color: ${INK}; }
.${P}-hd svg { width: 8px; height: 8px; fill: none; stroke: ${INK}; stroke-width: 1.4; stroke-linecap: round; }
.${P}-bd { flex: 1; min-height: 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 6px; padding: 8px 12px 10px; }
.${P}-up { flex: none; display: flex; height: 18px; border-radius: 4px; background: #cfd1d6; font-size: 7.5px; font-weight: 700; color: ${INK}; }
.${P}-up span { flex: 1; display: grid; place-items: center; }
.${P}-up b { flex: none; display: grid; place-items: center; width: 16px; border-left: 1px solid #e9eaed; }
.${P}-up b::after, .${P}-sel::after { content: ""; width: 0; height: 0; border-left: 2.5px solid transparent; border-right: 2.5px solid transparent; border-top: 3px solid ${INK}; }
.${P}-tabs { flex: none; box-sizing: border-box; display: flex; gap: 2px; height: 22px; padding: 2px; border-radius: 5px; background: #dcdde1; }
.${P}-tabs span { flex: 1; display: grid; place-items: center; border-radius: 4px; }
.${P}-tabs .${P}-on { background: #fff; box-shadow: 0 1px 2px rgba(20, 22, 30, .18); }
.${P}-tabs svg { width: 9px; height: 9px; fill: none; stroke: ${INK}; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-tabs svg .${P}-f { fill: ${INK}; stroke: none; }
.${P}-prompt { flex: none; box-sizing: border-box; height: 56px; padding: 5px 7px; border-radius: 3px; background: #fff; box-shadow: inset 0 0 0 1px #dedfe3; font-size: 7.5px; line-height: 11px; color: ${INK}; overflow: hidden; }
.${P}-sel { flex: none; box-sizing: border-box; display: flex; align-items: center; justify-content: space-between; gap: 7px; height: 24px; padding: 0 8px 0 5px; border-radius: 4px; background: #fff; box-shadow: inset 0 0 0 1px #e3e4e8; font-size: 7.5px; color: ${INK}; }
.${P}-sel em { flex: 1; font-style: normal; }
.${P}-sel .${P}-sw { flex: none; width: 18px; height: 14px; border-radius: 2px; background: linear-gradient(135deg, #8a7f6e, #3e3a34 60%, #b9ad98); }
.${P}-sel.${P}-tl { height: 18px; padding-left: 7px; }
.${P}-sel .${P}-rc { flex: none; box-sizing: border-box; width: 7px; height: 10px; border-radius: 1.5px; box-shadow: inset 0 0 0 1.2px ${INK}; }
.${P}-go { flex: none; display: grid; place-items: center; height: 22px; border-radius: 3px; font-size: 8px; font-weight: 700; color: #fff; }
.${P}-st { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 5px; height: 44px; visibility: hidden; }
.${P}-ring { flex: none; display: block; width: 21px; height: 21px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(142, 142, 147, 0) 0deg, ${GREY} 250deg, rgba(142, 142, 147, 0) 330deg), ${RING}; -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.2px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2.6px), #000 calc(100% - 2.2px)); }
.${P}-cap { display: flex; align-items: flex-start; gap: 4px; font-size: 6.5px; line-height: 9px; color: ${GREY}; }
.${P}-cap svg { flex: none; width: 8px; height: 8px; margin-top: .5px; }
.${P}-g { flex: none; margin-top: auto; display: grid; grid-template-columns: repeat(${COLS}, minmax(0, 1fr)); gap: ${GAP}px; visibility: hidden; }
.${P}-t { position: relative; aspect-ratio: 3 / 4; border-radius: 4px; overflow: hidden; background: ${SLOT}; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ph { position: absolute; inset: 0; background: ${SLOT}; }
.${P}-off .${P}-prompt { background: #eceef1; box-shadow: none; color: #a3a6ad; }
.${P}-off .${P}-sel { color: #9a9da4; }
.${P}-off .${P}-sel .${P}-sw { opacity: .55; }
.${P}-off .${P}-sel::after { opacity: .45; }
.${P}-off .${P}-rc { opacity: .45; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style. Bright, punchy colours and a warm classroom atmosphere.';
const CAPTION = 'Bringing your image to life! This could take up to 20 seconds.';
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const GEN_AT = 0.06;                              // the cursor presses 'Generate'
const ISSUE = 0.14;                               // the button reads 'Generating' and the spinner, caption and empty slots appear
const LAND = Array.from({ length: 10 }, (_, i) => 0.42 + i * 0.1267);   // slot i's picture lands (reading order, one after another), the last at 1.56
const FADE = 0.05;                                // the empty slot's grey thins away over this long as its picture comes in
const DONE = 1.6;                                 // the last picture is in: 'Generate' again, the spinner and caption clear, the first result drops onto the slide
const DROP = 0.14;                                // the picture settles onto the slide over this long
const SPIN = 400;                                 // ring degrees per second

const ICONS = [
  `<svg viewBox="0 0 12 12"><rect x="1.4" y="2" width="9.2" height="8" rx="1.4"/><path d="M1.8 9l2.7-2.7 2 2 1.4-1.4 2.6 2.6"/></svg>`,
  `<svg viewBox="0 0 12 12"><path class="${P}-f" d="M5 1.2l1 3.1 3.1 1-3.1 1-1 3.1-1-3.1-3.1-1 3.1-1z"/><path class="${P}-f" d="M9.6 7.2l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5z"/></svg>`,
  `<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.6"/><circle cx="6" cy="6" r="1.9"/></svg>`,
  `<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.6"/><path d="M3.4 5.2h1.2M7.4 5.2h1.2M3.8 7.6c1.4 1.3 3 1.3 4.4 0"/></svg>`,
  `<svg viewBox="0 0 12 12"><path d="M3 10.6V1.6M3 1.8h6.4l-1.4 2.3 1.4 2.3H3" class="${P}-f"/></svg>`,
];

export default {
  id: 'prezi-ai-image',
  label: 'Prezi AI image (2025)',
  source: {
    platform: "Prezi Present, the web editor's 'Create an image' side panel (a first-party tutorial screen recording on the Prezi YouTube channel, published 2025-11-25; light theme)",
    feature: "the purple 'Generate' button relabelling in place to a desaturated 'Generating', a grey ring spinner under it with the caption (an info glyph first) 'Bringing your image to life! This could take up to 20 seconds.', the prompt box greyed out and empty grey slots at the bottom of the panel, then the results filling those slots, the button back to 'Generate' and the first result dropped onto the slide (adapted to 10: a 5 x 2 block of slots filled in strict reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=fSf2mvxo9t4', retrieved: '2026-10-14' }],
    video: 'fSf2mvxo9t4',
    published: '2025-11-25',
    extrapolated: [
      'The footage lands two results at once in a 2-up grid: ten slots in a 5 x 2 block (3:4, so the panel needs no scroll, where the footage shows tall 9:16 thumbnails), each filled in strict reading order, one after another, is extrapolated from two',
      "The footage's panel scrolls down to its results: here the panel is one fixed height with the slots at its bottom and nothing scrolls",
      "Every timing (the press at 0.06 s, the first landing at 0.42 s, the last at 1.56 s, 'Generate' back and the drop onto the slide at 1.6 s) is invented; the footage's wait is about 2 s in total with both results arriving together",
      "The slot filling in is a short fade of the empty grey slot; the footage pops the finished thumbnail in with no visible transition",
      "The spinner's turning rate and the arc's length are guesses, and it stands still from the moment the last slot is filled (it is hidden by then)",
      "The footage's deck (the 'Vitality circuit' template) is replaced by a neutral yellow slide between a blue and a red band, the picked picture lands as our own meme at a second size, and the style-picker thumbnail is a plain swatch",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'prezi-ai-image');
    const slideSrc = ownSrc(ctx.src, 'prezi-ai-image-slide');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-ph"></div></div>`;
    const x2 = '<svg viewBox="0 0 10 10"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7"/></svg>';
    const lock = '<svg viewBox="0 0 12 12"><path d="M3.2 5.2V4a2.8 2.8 0 015.6 0v1.2h.4A.8.8 0 0110 6v4.2a.8.8 0 01-.8.8H2.8a.8.8 0 01-.8-.8V6a.8.8 0 01.8-.8zM4.4 5.2h3.2V4a1.6 1.6 0 00-3.2 0z" fill-rule="evenodd"/></svg>';
    const info = `<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="6" fill="${GREY}"/><circle cx="6" cy="3.3" r="1.05" fill="#fff"/><rect x="5.2" y="5" width="1.6" height="4.3" rx=".7" fill="#fff"/></svg>`;
    const root = x.el(`<div class="${P}"><div class="${P}-cv"><div class="${P}-band ${P}-b1"><i style="left: 12px; width: 52px; height: 30px"></i><i style="left: 70px; width: 60px; height: 40px"></i><i style="left: 138px; width: 50px; height: 26px"></i></div><div class="${P}-sl"><div class="${P}-arch"></div><div class="${P}-pic"><img src="${slideSrc}" width="870" height="1024" decoding="sync" alt="Picture placed on the slide" style="visibility: hidden; transform-origin: ${tiles[0].origin}"/></div></div><div class="${P}-band ${P}-b3"></div><div class="${P}-lock">${lock}</div></div><div class="${P}-pn"><div class="${P}-hd">Create an image${x2}</div><div class="${P}-bd"><div class="${P}-up"><span>Upload</span><b></b></div><div class="${P}-tabs">${ICONS.map((s, i) => `<span${i === 1 ? ` class="${P}-on"` : ''}>${s}</span>`).join('')}</div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-sel"><i class="${P}-sw"></i><em>Photo</em></div><div class="${P}-sel ${P}-tl"><i class="${P}-rc"></i><em>Tall</em></div><div class="${P}-go">Generate</div><div class="${P}-st"><i class="${P}-ring"></i><div class="${P}-cap">${info}<span>${CAPTION}</span></div></div><div class="${P}-g">${tiles.map(cell).join('')}</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const pn = q(`.${P}-pn`), go = q(`.${P}-go`), st = q(`.${P}-st`), ring = q(`.${P}-ring`), grid = q(`.${P}-g`), pic = q(`.${P}-pic`), pim = q(`.${P}-pic img`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), ph: n.querySelector(`.${P}-ph`), g: tiles[i] }));
    cells.forEach((c) => { c.im.style.transform = restTransform(c.g); c.im.style.filter = restFilter(c.g); });
    pim.style.transform = restTransform(tiles[0]); pim.style.filter = restFilter(tiles[0]);
    ctx.gate([...cells.map((c) => c.im), pim]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the button: 'Generate', pressed, then 'Generating' in lilac for the whole wait, and 'Generate' again once every picture is in
        const phase = s >= DONE ? 2 : s >= ISSUE ? 1 : 0;
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', `${phase}|${gp.toFixed(3)}`, () => {
          go.style.transform = gp > 0 ? `scale(${(1 - 0.03 * gp).toFixed(4)})` : 'none';
          go.textContent = phase === 1 ? 'Generating' : 'Generate';
          go.style.background = phase === 1 ? BTN_OFF : BTN_ON;
          go.style.cursor = phase === 1 ? 'default' : 'pointer';
        });
        // the prompt box and the pickers grey out while it works; the spinner and caption stand under the button; the empty slots wait at the bottom
        put('off', phase === 1, (v) => { pn.classList.toggle(`${P}-off`, v); st.style.visibility = v ? 'visible' : 'hidden'; });
        put('grid', s >= ISSUE, (v) => { grid.style.visibility = v ? 'visible' : 'hidden'; });

        // the ring turns with t and stands still once the last picture has landed (it is hidden then, but its angle is frozen all the same)
        const tt = Math.min(t, ctx.cardIn + DONE * k);
        put('ring', (tt * SPIN % 360).toFixed(0), (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // the slots fill in strict reading order: the empty grey thins away as the picture comes in
        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`c${i}`, f.toFixed(3), () => {
            c.im.style.visibility = f > 0 ? 'visible' : 'hidden';
            c.ph.style.display = f >= 1 ? 'none' : '';
            c.ph.style.opacity = f > 0 && f < 1 ? (1 - f).toFixed(3) : '';
          });
        });

        // the first result is dropped onto the slide (the same picture at a second size)
        const pf = seg(s, DONE, DONE + DROP);
        put('pic', `${s >= DONE ? 1 : 0}|${pf.toFixed(3)}`, () => {
          const on = s >= DONE;
          pic.style.visibility = on ? 'visible' : 'hidden';
          pim.style.visibility = on ? 'visible' : 'hidden';
          pic.style.opacity = pf < 1 ? pf.toFixed(3) : '';
          pic.style.transform = pf < 1 ? `translateY(${(-8 * (1 - pf)).toFixed(2)}px) scale(${(1 + 0.05 * (1 - pf)).toFixed(4)})` : 'none';
        });
      },
    };
  },
};
