// Runway (Frames), the Image mode of Runway's web app (official Runway Academy tutorial 'Generating with Frames', YouTube
// HjZZtWlvR2M, pub. 2025-03-06, t~60.3-60.5 and ~70.1-70.5 s for the Generate pill, t~112.0-112.5 s for the queue; spec
// .tmp/clone-9e82faf1/reveal-refs/runway/spec.json, confidence 0.82; frames q_rw_queue_t112.0.png, q_rw_grid_t112.4.png,
// q_rw_btn_t60.5.png). A fixed near-black app shell: a slim top bar with the project title, a narrow left composer (an Image | Video
// switch, the prompt, an aspect chip, the 'Frames' model selector and a blue Generate pill), a wide centre canvas and a far-right rail
// of numbered session thumbnails. Pressing Generate turns the pill into a pill of three pulsing white dots and opens a new batch at
// the bottom of the canvas, under the earlier results: a 'Frames' tag, the line 'Your images are in queue and will start generating
// in a few minutes' and a 2x2 grid of dark tiles, each a thin light-grey ring spinner over the caption 'In queue' (no percentage, no
// bar, no preview). The footage cuts straight from the queue to the finished grid, so a tile simply hands its spinner over to the
// picture, and the finished batch's status line becomes the prompt.
// Adapted to ten images: the Generate pill is pressed three times and the canvas takes three batches in turn (4 + 4 + 2, each stacked
// under the last and the canvas following the newest), tiles landing strictly one after the other across the batches; the rail files
// a numbered thumbnail per batch. The aspect chip reads 4:3 (the footage used 16:9) so the portrait meme keeps its subject. Omitted:
// the credits counter, the Runway wordmark and the real peacock pictures: every tile is our own meme, and no logo or platform font is
// drawn (plain squares, a plain ring, system type).
import { seg, press, outCubic } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-rw';
const ROOT_W = 560, ROOT_H = 460, TOP_H = 24, LEFT_W = 140, RAIL_W = 28, PAD = 12, GAP = 4;
const TW = 183, TH = 137, HDR = 22, BGAP = 14;                      // a tile, a batch's status row, the space between batches
const VIEW = ROOT_H - TOP_H - 12;                                   // the canvas window
const COUNTS = [4, 4, 2];                                           // the three batches, 4 + 4 + 2
const TOPS = [0, HDR + 2 * TH + GAP + BGAP, 2 * (HDR + 2 * TH + GAP + BGAP)];
const BOTTOMS = [HDR + 2 * TH + GAP, TOPS[1] + HDR + 2 * TH + GAP, TOPS[2] + HDR + TH];
const OFFS = [0, Math.max(0, BOTTOMS[1] - VIEW), Math.max(0, BOTTOMS[2] - VIEW)];   // the canvas follows the newest batch
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: ${ROOT_W}px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #141416; color: #d8d8da; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #232326; }
.${P}-top { flex: none; display: flex; align-items: center; justify-content: center; position: relative; height: ${TOP_H}px; background: #0c0c0d; font-size: 7.5px; font-weight: 500; color: #cfcfd2; white-space: nowrap; }
.${P}-menu { position: absolute; left: 9px; top: 9px; display: flex; flex-direction: column; gap: 2px; width: 8px; }
.${P}-menu i { display: block; height: 1.2px; border-radius: 1px; background: #b4b4b8; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-left { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${LEFT_W}px; padding: 8px 8px 8px 8px; background: #101012; box-shadow: 1px 0 0 #1f1f22; }
.${P}-mode { flex: none; display: flex; gap: 3px; height: 16px; font-size: 7px; font-weight: 500; color: #8e8e93; }
.${P}-mode span { display: flex; align-items: center; gap: 3px; box-sizing: border-box; padding: 0 6px; border-radius: 4px; white-space: nowrap; }
.${P}-mode .on { background: #2a2a2c; color: #ececee; }
.${P}-mode svg { width: 7px; height: 7px; fill: none; stroke: currentColor; stroke-width: 1.3; stroke-linecap: round; stroke-linejoin: round; }
.${P}-prompt { flex: 1; min-height: 0; margin-top: 8px; font-size: 7.5px; line-height: 11px; color: #e4e4e6; overflow: hidden; }
.${P}-opts { flex: none; display: flex; align-items: center; justify-content: space-between; height: 18px; font-size: 6.5px; color: #a4a4a9; }
.${P}-opts span { display: flex; align-items: center; gap: 3px; }
.${P}-opts i { display: block; box-sizing: border-box; width: 8px; height: 6px; border-radius: 1.5px; box-shadow: inset 0 0 0 1px #a4a4a9; }
.${P}-opts em { display: block; width: 5px; height: 5px; border-radius: 1px; box-shadow: inset 0 0 0 1px #a4a4a9; }
.${P}-opts div { display: flex; gap: 6px; }
.${P}-foot { flex: none; display: flex; align-items: center; justify-content: space-between; height: 24px; margin-top: 6px; border-top: 1px solid #1f1f22; padding-top: 6px; }
.${P}-model { display: flex; align-items: center; gap: 3px; font-size: 7.5px; font-weight: 600; color: #f0f0f2; }
.${P}-model svg { width: 6px; height: 6px; fill: none; stroke: #a4a4a9; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
.${P}-go { position: relative; display: grid; place-items: center; box-sizing: border-box; width: 52px; height: 18px; border-radius: 4px; background: #2b3af5; font-size: 7.5px; font-weight: 600; color: #fff; }
.${P}-dots { display: none; align-items: center; gap: 4px; }
.${P}-dots i { display: block; width: 4px; height: 4px; border-radius: 50%; background: rgba(255, 255, 255, .5); }
.${P}-cv { position: relative; flex: 1; min-width: 0; overflow: hidden; }
.${P}-col { position: absolute; left: ${PAD}px; top: 4px; width: ${2 * TW + GAP}px; }
.${P}-b { position: relative; box-sizing: border-box; width: ${2 * TW + GAP}px; margin-bottom: ${BGAP}px; }
.${P}-bh { display: flex; align-items: center; gap: 6px; height: ${HDR}px; padding-bottom: 6px; box-sizing: border-box; font-size: 6.5px; color: #a0a0a5; white-space: nowrap; overflow: hidden; }
.${P}-bh b { flex: none; box-sizing: border-box; height: 11px; padding: 0 4px; border-radius: 3px; background: #26262a; font-size: 6px; font-weight: 600; line-height: 11px; color: #e6e6e8; }
.${P}-bh span { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.${P}-bg { display: grid; grid-template-columns: repeat(2, ${TW}px); gap: ${GAP}px; }
.${P}-t { position: relative; width: ${TW}px; height: ${TH}px; border-radius: 4px; overflow: hidden; background: #1b1b1e; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-ov { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; background: #1b1b1e; }
.${P}-ring { display: block; width: 16px; height: 16px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(185, 185, 188, 0) 0deg, #b9b9bc 40deg, #b9b9bc 270deg, rgba(185, 185, 188, 0) 300deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1.5px)); }
.${P}-ov span { font-size: 6.5px; color: #b9b9bc; white-space: nowrap; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 4px; width: ${RAIL_W}px; padding: 6px 4px; overflow: hidden; }
.${P}-th { flex: none; display: flex; align-items: center; gap: 2px; height: 18px; font-size: 5px; color: #77777c; }
.${P}-th s { text-decoration: none; display: block; width: 7px; text-align: right; }
.${P}-th div { position: relative; flex: 1; height: 16px; border-radius: 2px; background: #1b1b1e; box-shadow: inset 0 0 0 1px #2a2a2c; }
.${P}-th div i { position: absolute; left: 2px; top: 2px; right: 2px; bottom: 2px; border-radius: 1px; background: linear-gradient(135deg, #3b3b40, #26262a); }
.${P}-th div u { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px 0 0 -3px; box-sizing: border-box; border-radius: 50%; box-shadow: inset 0 0 0 1px #b9b9bc; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bold colours, high detail';
const GEN = [0.06, 0.5, 0.98];                     // the three presses of Generate (layout seconds from the card's entrance)
const ISSUE = [0.14, 0.58, 1.06];                  // a batch's queue grid opens under the earlier results
const LAND = Array.from({ length: 10 }, (_, i) => 0.4 + i * 0.1425);   // tile i hands its spinner over to the picture, strictly in order, the last at 1.68
const FADE = 0.06;                                 // the queue cover thins away over this long before the picture lands
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand
const BATCH_OF = [0, 0, 0, 0, 1, 1, 1, 1, 2, 2];
const FIRST = [0, 4, 8];
const QUEUE = 'Your images are in queue and will start generating in a few minutes';

export default {
  id: 'runway',
  label: 'Runway (Frames)',
  source: {
    platform: "Runway web app, Image mode with the 'Frames' model (desktop browser, dark theme; the official Runway Academy tutorial 'Generating with Frames', YouTube, 2025-03-06)",
    feature: "fixed dark shell: a narrow left composer (prompt, aspect chip, 'Frames' selector, blue Generate pill that becomes a pill of three pulsing dots), a centre canvas where each batch opens as a 'Frames' tag, the line 'Your images are in queue and will start generating in a few minutes' and a 2x2 grid of dark tiles with a thin ring spinner over 'In queue' (no percentage, bar or preview), a far-right numbered thumbnail rail (adapted to 10: three batches 4 + 4 + 2 stacked under each other with the canvas following the newest, tiles landing strictly in order, a thumbnail filed per batch; aspect 4:3 instead of the footage's 16:9, the credits counter omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=HjZZtWlvR2M', retrieved: '2026-10-14' }],
    extrapolated: 'the footage cuts between the queue and the finished grid and shows one 4-image batch, so the 4 + 4 + 2 stacking, the timings of the three presses and the thumbnail filing are adapted, not observed',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'runway');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-ov"><i class="${P}-ring"></i><span>In queue</span></div></div>`;
    let at = 0;
    const batch = (n, k) => { const html = `<div class="${P}-b" style="visibility: hidden"><div class="${P}-bh"><b>Frames</b><span class="q">${QUEUE}</span><span class="d" style="display: none">${x.esc(PROMPT)}</span></div><div class="${P}-bg">${tiles.slice(at, at + n).map((g, j) => cell(g, at + j)).join('')}</div></div>`; at += n; return html; };
    const chev = '<svg viewBox="0 0 12 12"><path d="M3 4.5l3 3 3-3"/></svg>';
    const imgIc = '<svg viewBox="0 0 12 12"><rect x="1.5" y="2" width="9" height="8" rx="1.5"/><circle cx="4.3" cy="4.7" r="0.9"/><path d="M2 9l2.7-2.4 2 1.8 1.5-1.2 2 1.8"/></svg>';
    const vidIc = '<svg viewBox="0 0 12 12"><rect x="1.5" y="3" width="6.5" height="6" rx="1.3"/><path d="M8 5.2l2.6-1.3v4.2L8 6.8"/></svg>';
    const th = (n, kind) => `<div class="${P}-th"><s>${n}</s><div>${kind === 'new' ? `<i style="display: none"></i><u></u>` : '<i></i>'}</div></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-menu"><i></i><i></i><i></i></div>Untitled session</div><div class="${P}-body"><div class="${P}-left"><div class="${P}-mode"><span class="on">${imgIc}Image</span><span>${vidIc}Video</span></div><div class="${P}-prompt">${x.esc(PROMPT)}</div><div class="${P}-opts"><span><i></i>4:3</span><div><em></em><em></em></div></div><div class="${P}-foot"><div class="${P}-model">Frames${chev}</div><div class="${P}-go"><span class="lbl">Generate</span><span class="${P}-dots"><i></i><i></i><i></i></span></div></div></div><div class="${P}-cv"><div class="${P}-col">${COUNTS.map(batch).join('')}</div></div><div class="${P}-rail">${th(1, '')}${th(2, '')}${th(3, '')}${th(4, '')}${th(5, 'new')}${th(6, 'new')}${th(7, 'new')}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), lbl = go.querySelector('.lbl'), dots = go.querySelector(`.${P}-dots`), dotEls = [...dots.querySelectorAll('i')];
    const col = root.querySelector(`.${P}-col`);
    const batches = [...root.querySelectorAll(`.${P}-b`)].map((n) => ({ n, q: n.querySelector('.q'), d: n.querySelector('.d') }));
    const thumbs = [...root.querySelectorAll(`.${P}-th`)].slice(4).map((n) => ({ n, grid: n.querySelector('i'), ring: n.querySelector('u') }));
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), ov: n.querySelector(`.${P}-ov`), ring: n.querySelector(`.${P}-ring`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the Generate pill: pressed three times, then three pulsing dots until the last picture has landed
        const gp = Math.max(...GEN.map((a) => press(s, a, 0.05, 0.05, 0.12)));
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.06 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= GEN[0] + 0.05 && s < LAND[9];
        put('busy', busy, (v) => { lbl.style.display = v ? 'none' : ''; dots.style.display = v ? 'flex' : 'none'; });
        dotEls.forEach((d, j) => {
          const a = busy ? 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(Math.PI * 2 * (t * 1.7 - j * 0.2))) : 0;
          put(`dot${j}`, a.toFixed(2), () => { d.style.background = `rgba(255, 255, 255, ${a.toFixed(2)})`; });
        });

        // the canvas follows the newest batch
        const off = OFFS[1] * outCubic(seg(s, ISSUE[1], ISSUE[1] + 0.22)) + (OFFS[2] - OFFS[1]) * outCubic(seg(s, ISSUE[2], ISSUE[2] + 0.22));
        put('off', off.toFixed(1), () => { col.style.transform = off > 0 ? `translateY(${-off.toFixed(1)}px)` : 'none'; });

        batches.forEach((b, j) => {
          put(`b${j}`, s >= ISSUE[j], (v) => { b.n.style.visibility = v ? '' : 'hidden'; });
          const done = s >= LAND[FIRST[j] + COUNTS[j] - 1];
          put(`bd${j}`, done, (v) => { b.q.style.display = v ? 'none' : ''; b.d.style.display = v ? '' : 'none'; });
        });
        thumbs.forEach((h, j) => {
          const shown = s >= ISSUE[j], done = s >= LAND[FIRST[j] + COUNTS[j] - 1];
          put(`th${j}`, `${shown}${done}`, () => { h.n.style.visibility = shown ? '' : 'hidden'; h.grid.style.display = done ? '' : 'none'; h.ring.style.display = done ? 'none' : ''; });
        });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.ov.style.display = 'none'; c.ov.style.opacity = ''; } else { c.ov.style.display = ''; c.ov.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          // the ring turns with t (its phase differs per tile); a function of t alone, covered or not
          const deg = (((t * 300 + i * 53) % 360) + 360) % 360;
          put(`r${i}`, deg.toFixed(0), (d) => { c.ring.style.transform = `rotate(${d}deg)`; });
        });
      },
    };
  },
};
