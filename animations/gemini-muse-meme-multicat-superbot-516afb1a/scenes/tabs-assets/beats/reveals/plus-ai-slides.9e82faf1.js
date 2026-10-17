// Plus AI for Slides, the 2024 slide-deck add-in's 'We're working on your presentation.' dialog (the vendor's own screen recording on
// YouTube, AFtpj0pd8U0, published 2024-06-28, t~10.0-14.5 s; spec .tmp/clone-9e82faf1/reveal-refs/plus-ai-slides/spec.json, confidence 0.7;
// frames ap_plus_02.png / ap_plus_03.png (stage 1, 'Generating your presentation'), ap_plus_04.png (stage 2, 'Building your slides'),
// ap_plus_06.png (done)). A slides editor (a title bar, a ribbon of tabs and tool groups, the slide rail down the left, the open slide, an
// add-in task pane on the right) with the add-in's dialog open over it: a thin yellow-bordered window with a title strip and a close
// cross, a coral-to-violet panel carrying the headline 'We're working on your presentation.' and the sub-line 'It might take a minute.',
// and under it a determinate pink-to-violet progress bar on a pale track with a one-line caption that swaps once, from 'Generating your
// presentation' to 'Building your slides'. There is no spinner, no percentage and no countdown. The dialog then closes, the generated slides
// are in the deck and the pane reads 'Presentation generated' above a '+ New presentation' button.
// Adapted to ten images: the bar fills from render(t) and holds partial (it never reaches the end, as in the footage); once the dialog has
// closed the slide rail (a two-column rail, 4:3) takes its ten slides and the pictures fill the thumbnails one after another in strict
// reading order. Omitted: the product's own mark and wordmark (the footage's panel carries a pill logo and a robot emoji), the host
// application's marks, the prompt flow ahead of the wait, the pointer and the second run's result screens. The footage's slides are never
// reproduced: the thumbnails are our own memes, the slide titles are ours, and no logo or platform font is drawn (system type, plain shapes).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pls';
const ROOT_H = 380, TITLE_H = 24, TABS_H = 18, RIB_H = 34, RAIL_W = 140, PANE_W = 130;
const CSS = `
.${P} { position: relative; box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 8px; background: #f3f3f3; color: #262626; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #d4d4d8; }
.${P}-title { flex: none; position: relative; display: flex; align-items: center; gap: 8px; height: ${TITLE_H}px; padding: 0 10px; font-size: 7px; color: #444; white-space: nowrap; }
.${P}-tg { flex: none; width: 14px; height: 7px; border-radius: 4px; box-shadow: inset 0 0 0 1px #8a8a8f; }
.${P}-doc { flex: none; }
.${P}-find { position: absolute; left: 50%; top: 4px; width: 150px; height: 16px; box-sizing: border-box; padding: 0 8px; border-radius: 4px; background: #ffffff; box-shadow: inset 0 0 0 1px #d9d9dd; line-height: 16px; font-size: 6.5px; color: #8a8a90; transform: translateX(-50%); }
.${P}-sp { flex: 1; }
.${P}-shr { flex: none; height: 14px; padding: 0 7px; border-radius: 4px; background: #d6492f; line-height: 14px; font-size: 6.5px; font-weight: 600; color: #ffffff; }
.${P}-tabs { flex: none; display: flex; align-items: center; gap: 9px; height: ${TABS_H}px; padding: 0 10px; font-size: 6.5px; color: #444; white-space: nowrap; }
.${P}-tabs .${P}-on { color: #a33a26; box-shadow: 0 1.5px 0 #a33a26; padding-bottom: 1px; }
.${P}-rib { flex: none; box-sizing: border-box; display: flex; align-items: center; gap: 9px; height: ${RIB_H}px; margin: 0 6px; padding: 0 8px; border-radius: 4px; background: #fafafa; box-shadow: inset 0 0 0 1px #e4e4e7; }
.${P}-rib span { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 5.5px; color: #55555b; white-space: nowrap; }
.${P}-rib span i { display: block; width: 12px; height: 12px; box-sizing: border-box; border-radius: 3px; box-shadow: inset 0 0 0 1.2px #7a7a82; }
.${P}-rib span i.${P}-rd { box-shadow: inset 0 0 0 1.2px #c7452e; border-radius: 50%; }
.${P}-body { flex: 1; min-height: 0; display: flex; margin-top: 4px; }
.${P}-rail { flex: none; box-sizing: border-box; width: ${RAIL_W}px; padding: 8px; overflow: hidden; }
.${P}-g { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.${P}-t { position: relative; aspect-ratio: 4 / 3; border-radius: 3px; overflow: hidden; background: #ffffff; box-shadow: 0 0 0 1px #d4d4d8; }
.${P}-t.${P}-one { box-shadow: 0 0 0 1.5px #c7452e; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-pend { position: absolute; inset: 0; background: #ffffff; }
.${P}-cv { position: relative; flex: 1; min-width: 0; background: #e9e9eb; }
.${P}-sl { position: absolute; left: 18px; right: 18px; top: 28px; aspect-ratio: 16 / 9; box-sizing: border-box; border-radius: 2px; background: #ffffff; box-shadow: 0 2px 8px rgba(0, 0, 0, .12); overflow: hidden; }
.${P}-ph { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; }
.${P}-ph i { display: block; box-sizing: border-box; border-radius: 2px; border: 1px dashed #c5c5cb; }
.${P}-ph i:first-child { width: 150px; height: 26px; }
.${P}-ph i:last-child { width: 110px; height: 16px; }
.${P}-fill { position: absolute; inset: 0; display: flex; align-items: center; padding: 0 14px; gap: 12px; }
.${P}-fill b { flex: 1; font-size: 15px; font-weight: 700; line-height: 17px; letter-spacing: -.2px; color: #1f1f23; }
.${P}-blk { flex: none; width: 70px; height: 70px; border-radius: 3px; background: linear-gradient(150deg, #ff9d82, #c5a2f6); }
.${P}-notes { position: absolute; left: 18px; right: 18px; bottom: 10px; font-size: 6.5px; color: #8a8a90; }
.${P}-pane { flex: none; position: relative; box-sizing: border-box; width: ${PANE_W}px; padding: 10px 10px; background: #ffffff; box-shadow: -1px 0 0 #dcdce0; display: flex; flex-direction: column; gap: 7px; }
.${P}-pane::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 3px; background: #ffd84d; }
.${P}-row { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; height: 22px; padding: 0 8px; border-radius: 5px; background: #ffffff; box-shadow: 0 0 0 1px #e0e0e4, 0 1px 3px rgba(0, 0, 0, .06); font-size: 7px; color: #333; white-space: nowrap; }
.${P}-row svg { width: 6px; height: 6px; fill: none; stroke: #77777d; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ok { display: flex; flex-direction: column; align-items: center; gap: 7px; padding-top: 12px; font-size: 7.5px; font-weight: 600; color: #2d2d33; text-align: center; }
.${P}-ok i { display: block; width: 16px; height: 16px; box-sizing: border-box; border-radius: 50%; box-shadow: inset 0 0 0 1.5px #8b5cf6; position: relative; }
.${P}-ok i::after { content: ""; position: absolute; left: 4.5px; top: 3px; width: 3px; height: 6px; box-sizing: border-box; border: solid #8b5cf6; border-width: 0 1.5px 1.5px 0; transform: rotate(40deg); }
.${P}-new { display: flex; align-items: center; justify-content: center; box-sizing: border-box; height: 22px; border-radius: 5px; background: #ffffff; box-shadow: 0 0 0 1px #d6d6dc; font-size: 7.5px; font-weight: 500; color: #4c3bb5; white-space: nowrap; }
.${P}-dlg { position: absolute; left: ${RAIL_W + 8}px; right: 12px; top: ${TITLE_H + TABS_H + RIB_H + 8}px; bottom: 14px; box-sizing: border-box; display: flex; flex-direction: column; border-radius: 6px; background: #ffffff; border: 2px solid #ffd84d; box-shadow: 0 4px 18px rgba(0, 0, 0, .16); overflow: hidden; }
.${P}-dh { flex: none; display: flex; align-items: center; justify-content: space-between; height: 16px; padding: 0 8px; box-shadow: 0 1px 0 #ececef; font-size: 6px; color: #55555b; white-space: nowrap; }
.${P}-dh svg { width: 6px; height: 6px; fill: none; stroke: #55555b; stroke-width: 1.4; stroke-linecap: round; }
.${P}-dm { flex: 1; min-height: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; }
.${P}-pan { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; box-sizing: border-box; width: 296px; height: 156px; border-radius: 3px; background: linear-gradient(135deg, #ff9d7a 0%, #f59ab8 38%, #c79cf5 72%, #a78bfa 100%); text-align: center; font-size: 10.5px; font-weight: 700; line-height: 14px; color: #17171a; }
.${P}-bar { position: relative; width: 200px; height: 6px; border-radius: 3px; background: #e5e7eb; overflow: hidden; }
.${P}-bar i { position: absolute; left: 0; top: 0; bottom: 0; width: 100%; border-radius: 3px; background: linear-gradient(90deg, #e85d9e, #8b5cf6); transform-origin: 0 50%; }
.${P}-cap { height: 10px; font-size: 7px; line-height: 10px; color: #6b6b73; white-space: nowrap; }
`;

const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const ISSUE = 0.1;                                // the add-in dialog opens over the editor
const SWAP = 0.55;                                // the caption swaps from 'Generating your presentation' to 'Building your slides'
const CLOSE = 1.0;                                // the dialog closes, the slides are in the deck and the pane reads 'Presentation generated'
const LAND = Array.from({ length: 10 }, (_, i) => 1.04 + i * 0.0711);   // thumbnail i takes its picture (reading order), the last at 1.68
const FADE = 0.05;                                // the empty slide thins away over this long before the picture lands
const BAR_TOP = 0.92;                             // the bar never reaches the end of its track
const TABS = ['File', 'Home', 'Insert', 'Draw', 'Design', 'Transitions', 'Animations', 'Slide Show', 'Review', 'View'];
const RIB = ['New Slide', 'Table', 'Pictures', 'Shapes', 'Icons', 'Chart', 'Link', 'Text Box', 'Video', 'Add-ins'];

export default {
  id: 'plus-ai-slides',
  label: 'Plus AI for Slides (2024)',
  source: {
    platform: "Plus AI's slide-deck add-in dialog in a desktop slides editor (the vendor's own screen recording on YouTube, published 2024-06-28; light editor chrome, the add-in's yellow-bordered dialog and a task pane docked on the right)",
    feature: "the add-in dialog with the headline 'We're working on your presentation.' and the sub-line 'It might take a minute.' over a coral-to-violet panel, a determinate pink-to-violet progress bar filling from t whose caption swaps from 'Generating your presentation' to 'Building your slides' (no spinner, no percentage); then the dialog closes and the pane reads 'Presentation generated' with '+ New presentation' (adapted to 10: the slide rail's ten 4:3 thumbnails taking the pictures one after another in strict reading order)",
    refs: [
      { url: 'https://www.youtube.com/watch?v=AFtpj0pd8U0', videoId: 'AFtpj0pd8U0', published: '2024-06-28', retrieved: '2026-10-14', note: "'Plus AI PowerPoint Maker - Generate PowerPoint presentations in minutes with AI' (Plus AI, official, 1080x720): the dialog t=10.0-11.9 s ('Generating your presentation', the bar at about 20-45%), the caption swap to 'Building your slides' at about t=12.1 s, the slides in the deck and 'Presentation generated' / '+ New presentation' in the pane at t=14.2-14.5 s" },
      { url: 'https://www.youtube.com/watch?v=HPNEEJrAFFE', videoId: 'HPNEEJrAFFE', published: '2026-02-13', retrieved: '2026-10-14', note: "'The Best AI Agent for PowerPoint? See the Plus AI Presentation Agent in action' (Plus AI, official): the newer agent pane's 'Working on it ...' status with streamed tool rows; the same wait grammar a product generation later, context only and not built" },
    ],
    extrapolated: [
      "the footage shows no picture while the dialog is up and drops the finished slides into the deck all at once; the slide rail's ten thumbnails taking the ten pictures one after another in strict reading order after the dialog has closed, and the compressed 1.84 s timing, are extrapolated",
      "the footage's rail is a single column of 16:9 slides (two visible); a two-column rail of ten 4:3 thumbnails (so the portrait pictures are not cropped to a thin band) is extrapolated",
      "the dialog is scaled to a 560 px block: the footage's dialog is about 780 px wide on a 1080 px frame, its title strip carries the add-in's address (not drawn) and its panel carries a pill logo and a robot emoji (not drawn); the bar's fill rate and the caption swap at the half-way point are read from the 1.9 s + 1.9 s split",
      "the open slide (a title and a pastel block) and its titles are ours; the footage's slides are not reproduced, and the pane's own mark and the 'with AI' picker's options are not drawn",
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'plus-ai-slides');
    const cell = (g, i) => `<div class="${P}-t${i === 0 ? ` ${P}-one` : ''}"${i === 0 ? '' : ' style="visibility: hidden"'}><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-pend"></div></div>`;
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const tabs = TABS.map((m) => `<span${m === 'Insert' ? ` class="${P}-on"` : ''}>${m}</span>`).join('');
    const rib = RIB.map((m, i) => `<span><i${i === 9 ? ` class="${P}-rd"` : ''}></i>${m}</span>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-title"><i class="${P}-tg"></i><span class="${P}-doc">Presentation1</span><div class="${P}-find">Search</div><span class="${P}-sp"></span><span class="${P}-shr">Share</span></div><div class="${P}-tabs">${tabs}</div><div class="${P}-rib">${rib}</div><div class="${P}-body"><div class="${P}-rail"><div class="${P}-g">${tiles.map(cell).join('')}</div></div><div class="${P}-cv"><div class="${P}-sl"><div class="${P}-ph"><i></i><i></i></div><div class="${P}-fill" style="display: none"><b>Meet the Muse</b><i class="${P}-blk"></i></div></div><div class="${P}-notes">Click to add notes</div></div><div class="${P}-pane"><div class="${P}-pre"><div class="${P}-row">Presentation${chev}</div><div class="${P}-row" style="margin-top: 7px">with AI${chev}</div></div><div class="${P}-res" style="display: none"><div class="${P}-ok"><i></i><span>Presentation generated</span></div><div class="${P}-new" style="margin-top: 10px">+ New presentation</div></div></div></div><div class="${P}-dlg" style="display: none"><div class="${P}-dh"><span>Add-in dialog</span><svg viewBox="0 0 12 12"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7"/></svg></div><div class="${P}-dm"><div class="${P}-pan"><span>We're working on your presentation.</span><span>It might take a minute.</span></div><div class="${P}-bar"><i style="transform: scaleX(0.04)"></i></div><div class="${P}-cap">Generating your presentation</div></div></div></div>`);
    const q = (s) => root.querySelector(s);
    const dlg = q(`.${P}-dlg`), fill = q(`.${P}-bar i`), cap = q(`.${P}-cap`), ph = q(`.${P}-ph`), body = q(`.${P}-fill`), pre = q(`.${P}-pre`), res = q(`.${P}-res`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ box: n, im: n.querySelector('img'), pend: n.querySelector(`.${P}-pend`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const open = s >= ISSUE && s < CLOSE;

        // the add-in dialog: the bar fills with s (and holds partial; the clamp keeps it still once the dialog has closed), the caption swaps once
        put('dlg', open, (v) => { dlg.style.display = v ? '' : 'none'; });
        const fr = 0.04 + (BAR_TOP - 0.04) * seg(s, ISSUE, CLOSE);
        put('bar', fr.toFixed(4), (v) => { fill.style.transform = `scaleX(${v})`; });
        put('cap', s >= SWAP, (v) => { cap.textContent = v ? 'Building your slides' : 'Generating your presentation'; });

        // the dialog has closed: the slides are in the deck, the open slide is filled and the pane reports the result
        const closed = s >= CLOSE;
        put('closed', closed, (v) => {
          ph.style.display = v ? 'none' : '';
          body.style.display = v ? '' : 'none';
          pre.style.display = v ? 'none' : '';
          res.style.display = v ? '' : 'none';
        });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          if (i > 0) put(`b${i}`, closed, (v) => { c.box.style.visibility = v ? '' : 'hidden'; });
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
