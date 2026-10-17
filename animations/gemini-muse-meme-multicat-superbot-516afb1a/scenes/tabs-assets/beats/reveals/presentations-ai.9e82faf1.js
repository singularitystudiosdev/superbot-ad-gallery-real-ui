// Presentations.ai, the 2023 web editor's deck generator (a third-party tutorial screen recording on YouTube, QCC-qdVB5BU, published
// 2023-06-09, t~55-59 s; spec .tmp/clone-9e82faf1/reveal-refs/presentations-ai/spec.json, confidence 0.68; frames ap_presentations_03.png
// (the wait), ap_presentations_04.png / _05.png (slides arriving), _06.png (landed)). After the prompt is submitted the app drops
// straight into its light editor: a top bar ('Untitled' / 'Owned by ...', a 'Slide N / M' pager in the centre, a 'Present' pill), a slide
// rail pre-seeded with flat light-grey thumbnails, a soft lavender-to-mint gradient wash where the open slide will be, and a small tool rail
// on the right. A white pill toast pinned bottom-centre reads 'Generating slides...' with an indeterminate blue ring spinner. Nothing
// else announces progress: no percentage, no bar, no ETA, no shimmer. The pager ticks as slides arrive ('Slide 2 / 2' ... 'Slide 9 / 9'),
// the rail thumbnails fill from the top, and when the last one is in the toast is gone and the deck sits on 'Slide 1 / 9'.
// Adapted to ten images: the ten rail thumbnails (a two-column rail, 4:3) hand their grey fill over to the pictures one after another in
// strict reading order, the pager counting the slides in, the open slide taking the latest slide's title; the ring turns from render(t)
// and freezes when the last picture lands. Omitted: the product's own mark, the presenter's account name, the left icon rail, the wizard
// ahead of the wait and the pointer. The footage's slides are never reproduced: the thumbnails are our own memes, the slide titles are ours,
// and no logo or platform font is drawn (a plain ring, plain rectangles, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pra';
const ROOT_H = 400, TOP_H = 32, RAIL_W = 188, TOOL_W = 34;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #ffffff; color: #111111; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #dcdce0; }
.${P}-top { position: relative; flex: none; display: flex; align-items: center; gap: 8px; height: ${TOP_H}px; padding: 0 9px; box-sizing: border-box; background: #ffffff; box-shadow: 0 1px 0 #ececee; }
.${P}-menu { flex: none; display: flex; flex-direction: column; gap: 2.5px; width: 9px; }
.${P}-menu i { display: block; height: 1.2px; border-radius: 1px; background: #555a60; }
.${P}-mk { flex: none; width: 10px; height: 10px; box-sizing: border-box; border-radius: 50%; border: 1.2px dashed #6a7077; }
.${P}-doc { flex: none; display: flex; flex-direction: column; gap: 1px; white-space: nowrap; }
.${P}-doc b { font-size: 7.5px; font-weight: 600; line-height: 9px; color: #1b1b1d; }
.${P}-doc span { font-size: 5.5px; line-height: 7px; color: #7b8087; }
.${P}-pg { position: absolute; left: 50%; top: 0; height: ${TOP_H}px; display: flex; align-items: center; gap: 7px; transform: translateX(-50%); font-size: 6.5px; color: #3a3d42; white-space: nowrap; }
.${P}-pg svg { width: 6px; height: 6px; fill: none; stroke: #8a8f96; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pn { display: inline-block; min-width: 34px; text-align: center; }
.${P}-sp { flex: 1; }
.${P}-pres { flex: none; display: flex; align-items: center; gap: 4px; box-sizing: border-box; height: 18px; padding: 0 7px; border-radius: 5px; box-shadow: inset 0 0 0 1px #d9dade; font-size: 6.5px; font-weight: 500; color: #1b1b1d; white-space: nowrap; }
.${P}-pres svg { width: 6px; height: 6px; fill: none; stroke: #6a7077; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; width: ${RAIL_W}px; padding: 10px 10px 8px; background: #f6f6f7; box-shadow: 1px 0 0 #ececee; }
.${P}-g { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 4px; overflow: hidden; background: #ededed; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #ededed; }
.${P}-cv { position: relative; flex: 1; min-width: 0; overflow: hidden; background: linear-gradient(104deg, #e6e4f4 0%, #e3ecf3 38%, #e7f4f2 70%, #ece6f3 100%); }
.${P}-wash { position: absolute; left: 14%; top: 8%; width: 62%; height: 60%; border-radius: 46% 54% 52% 48% / 52% 44% 56% 48%; background: radial-gradient(closest-side, rgba(255, 255, 255, .55), rgba(255, 255, 255, 0)); }
.${P}-sl { position: absolute; left: 20px; right: 20px; top: 40px; aspect-ratio: 16 / 9; display: flex; border-radius: 5px; overflow: hidden; background: #ffffff; box-shadow: 0 6px 18px rgba(80, 86, 120, .14), 0 0 0 1px rgba(80, 86, 120, .08); }
.${P}-art { flex: none; width: 42%; background: linear-gradient(160deg, #d9d6ee, #d3e8ea); }
.${P}-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; justify-content: center; gap: 5px; padding: 0 12px 0 14px; }
.${P}-txt b { font-size: 13px; font-weight: 500; line-height: 15px; letter-spacing: -.2px; color: #1b1b1d; }
.${P}-txt i { display: block; height: 3px; border-radius: 2px; background: #d9dade; }
.${P}-txt i + i { width: 74%; }
.${P}-toast { position: absolute; left: 50%; bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 18px; box-sizing: border-box; width: 156px; height: 28px; padding: 0 9px 0 11px; border-radius: 9px; background: #ffffff; box-shadow: 0 6px 18px rgba(60, 64, 100, .16), 0 0 0 1px rgba(60, 64, 100, .05); transform: translateX(-50%); font-size: 8px; color: #111111; white-space: nowrap; }
.${P}-ring { flex: none; display: block; width: 12px; height: 12px; box-sizing: border-box; border-radius: 50%; border: 1.8px solid #d7d7db; border-top-color: #5b7cfa; border-right-color: #5b7cfa; }
.${P}-tool { flex: none; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 12px; width: ${TOOL_W}px; padding: 12px 0; background: #ffffff; box-shadow: -1px 0 0 #ececee; }
.${P}-grp { display: flex; flex-direction: column; align-items: center; gap: 7px; box-sizing: border-box; width: 22px; padding: 6px 0; border-radius: 6px; background: #ffffff; box-shadow: 0 2px 8px rgba(60, 64, 100, .1), 0 0 0 1px #eeeef1; }
.${P}-grp i { display: block; width: 8px; height: 8px; box-sizing: border-box; border-radius: 50%; border: 1.1px solid #6a7077; }
.${P}-grp i.${P}-sq { border-radius: 2px; }
.${P}-grp i.${P}-add { border: 0; border-radius: 2px; background: #111111; width: 14px; height: 14px; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.1;                                // the toast comes up over the editor
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // thumbnail i hands its grey fill over to the picture (reading order), the last at 1.68
const FADE = 0.06;                                // the grey fill thins away over this long before the picture lands
const TITLES = ['Meet the Muse', 'A Note in Hand', 'Why Memes Land', 'Pick a Punchline', 'Keep It Bright', 'Sketch the Scene', 'Add the Caption', 'Test the Joke', 'Share the Laugh', 'Make Another One'];
const SPIN = 540;                                 // degrees per layout second

export default {
  id: 'presentations-ai',
  label: 'Presentations.AI (2023)',
  source: {
    platform: "Presentations.ai web editor in a desktop browser, light editor chrome (a third-party tutorial screen recording on YouTube, published 2023-06-09)",
    feature: "after submitting a prompt the editor opens on a lavender-to-mint gradient wash with a slide rail of empty grey thumbnails, a white pill toast pinned bottom-centre reading 'Generating slides...' beside a blue ring spinner and a top-centre 'Slide N / M' pager that ticks as slides arrive; the thumbnails then fill and the toast clears (adapted to 10: a two-column rail of ten 4:3 thumbnails filling with the pictures in strict reading order, the ring turning from render(t) and freezing at the last landing)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=QCC-qdVB5BU', videoId: 'QCC-qdVB5BU', published: '2023-06-09', retrieved: '2026-10-14', note: "'Presentations.ai Tutorial and Review' (a third-party reviewer's uncut screen recording of the live product): the wizard t=27-52 s, the wait with the 'Generating slides...' toast and the gradient wash t=55.0-58.0 s, the pager reading 'Slide 2 / 2', 'Slide 6 / 6', 'Slide 9 / 9' at t=56-58 s, the landed deck on 'Slide 1 / 9' by t=67 s" },
    ],
    extrapolated: [
      "the footage's rail is a single column of 16:9 thumbnails (about 7 visible, scrolling) and the deck has 9 slides; a two-column rail of ten 4:3 thumbnails (so the portrait pictures are not cropped to a thin band) is extrapolated",
      "the footage never shows a picture inside a rail thumbnail while the toast is up (the thumbnails stay grey until the slides stream in and the finished slides carry the artwork on the canvas): the ten pictures landing as the thumbnails' fills, in strict reading order and over the compressed 1.84 s window, is extrapolated",
      "the open slide (a stand-in with a pastel art block, a title and two rules, the title following the latest slide) and its titles are ours; the footage's slides are not reproduced",
      "the pager counting the slides in ('Slide N / N') and settling on 'Slide 1 / 10' is read from the OCR samples (noisy: 'Slide 6 6', 'Slide 9 9', 'Slide 7 / 9') and is approximate; the wizard and the 'Generate' press before the wait are not drawn",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'presentations-ai');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const chev = (d) => `<svg viewBox="0 0 12 12"><path d="${d}"/></svg>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-menu"><i></i><i></i><i></i></div><i class="${P}-mk"></i><div class="${P}-doc"><b>Untitled</b><span>Owned by you</span></div><div class="${P}-pg">${chev('M7.5 2.5L4 6l3.5 3.5')}<span class="${P}-pn">Slide 1 / 1</span>${chev('M4.5 2.5L8 6 4.5 9.5')}</div><span class="${P}-sp"></span><div class="${P}-pres">Present${chev('M3 4.5l3 3 3-3')}</div></div><div class="${P}-body"><div class="${P}-rail"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-cv"><div class="${P}-wash"></div><div class="${P}-sl" style="visibility: hidden"><div class="${P}-art"></div><div class="${P}-txt"><b>${x.esc(TITLES[0])}</b><i></i><i></i></div></div><div class="${P}-toast" style="visibility: hidden"><span>Generating slides...</span><i class="${P}-ring"></i></div></div><div class="${P}-tool"><div class="${P}-grp"><i></i><i></i><i></i><i class="${P}-sq"></i></div><div class="${P}-grp"><i class="${P}-add"></i><i class="${P}-sq"></i><i class="${P}-sq"></i></div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const pn = q(`.${P}-pn`), sl = q(`.${P}-sl`), ttl = q(`.${P}-txt b`), toast = q(`.${P}-toast`), ring = q(`.${P}-ring`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const done = s >= LAND[9];

        // the toast is up from the issue until the last slide is in; its ring turns with s and holds still once the last picture has landed
        put('toast', s >= ISSUE && !done, (v) => { toast.style.visibility = v ? '' : 'hidden'; });
        const deg = Math.round(((Math.min(s, LAND[9]) * SPIN) % 360 + 360) % 360);
        put('ring', deg, (d) => { ring.style.transform = `rotate(${d}deg)`; });

        // the slides arrive: the count, the pager and the open slide's title follow the landed prefix
        const n = LAND.filter((a) => s >= a).length;
        put('pager', done ? 'Slide 1 / 10' : `Slide ${Math.max(1, n)} / ${Math.max(1, n)}`, (v) => { pn.textContent = v; });
        put('slide', n > 0, (v) => { sl.style.visibility = v ? '' : 'hidden'; });
        put('title', done ? 0 : Math.max(0, n - 1), (i) => { ttl.textContent = TITLES[i]; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.pend.style.display = 'none'; c.pend.style.opacity = ''; } else { c.pend.style.display = ''; c.pend.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
        });
      },
    };
  },
};
