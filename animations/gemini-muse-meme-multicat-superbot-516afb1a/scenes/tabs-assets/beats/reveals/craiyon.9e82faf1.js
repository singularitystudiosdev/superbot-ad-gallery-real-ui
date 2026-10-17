// Craiyon (V3), craiyon.com's own home-page generator (a screen recording on YouTube, LJUv80O-BBw, pub. 2024-04-22, t~92.5-97.5 s;
// spec .tmp/clone-9e82faf1/reveal-refs/craiyon/spec.json, confidence 0.70; frames q_cra_t93.0.png, q_cra_t93.5.png, q_cra_t97.5.png).
// A near-black page with a centred composer: a prompt field, the Style chips (Art / Photo / Drawing / None) and the orange button. On
// submit the button's label goes from 'Draw' to 'Drawing...' (the pencil glyph stays), a small ring spinner replaces the field's clear
// mark, and a large dark rounded panel opens below with the fixed line 'Estimated time: 60s' over a thin full-width track whose orange
// fill grows from the left (no percentage is ever drawn). When the wait is over the panel is replaced by a 3-wide grid of finished
// square pictures, each carrying a small orange pencil (edit) mark at its lower right.
// Adapted to ten images: the panel's bar runs to the end first, then the grid of ten (3 + 3 + 3 + 1) replaces it and the tiles land one
// after another in reading order, each from a plain dark square. The footage cuts between the wait and the result, so the bar's pace and
// the tile timings are adapted. Omitted: the 'Craiyon V3' wordmark, the 'Generate images faster' upsell under the bar and the browser
// chrome of the recording. Every tile is our own meme; no logo or platform font is drawn (a plain pencil outline, system type).
import { seg, press } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-cr';
const ROOT_W = 560, ROOT_H = 504, COL_W = 300, TILE = 92, TGAP = 6, PAN_PAD = 6;
const PAN_H = 2 * PAN_PAD + 4 * TILE + 3 * TGAP;
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; align-items: center; width: ${ROOT_W}px; max-width: 100%; height: ${ROOT_H}px; padding: 12px 0; border-radius: 12px; background: #12151a; color: #e6e8ec; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1d2128; }
.${P}-col { flex: none; width: ${COL_W}px; }
.${P}-in { position: relative; box-sizing: border-box; height: 34px; padding: 0 28px 0 10px; border-radius: 8px; background: #1b1f27; box-shadow: inset 0 0 0 1px #2b303a; font-size: 7.5px; line-height: 34px; color: #e3e6ea; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-sp { position: absolute; right: 10px; top: 11px; width: 12px; height: 12px; border-radius: 50%; background: conic-gradient(from 0deg, rgba(185, 189, 197, 0) 0deg, #b9bdc5 300deg, rgba(185, 189, 197, 0) 340deg); -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); mask: radial-gradient(farthest-side, transparent calc(100% - 1.8px), #000 calc(100% - 1.3px)); }
.${P}-row { display: flex; align-items: center; justify-content: space-between; height: 28px; margin-top: 8px; }
.${P}-chips { display: flex; align-items: center; gap: 4px; }
.${P}-chips span { display: grid; place-items: center; box-sizing: border-box; height: 20px; padding: 0 8px; border-radius: 10px; background: #1b1f27; box-shadow: inset 0 0 0 1px #2b303a; font-size: 7px; color: #aab0ba; }
.${P}-chips .on { background: #2a2420; box-shadow: inset 0 0 0 1px #e8552a; color: #fbe9e2; }
.${P}-go { display: flex; align-items: center; justify-content: center; gap: 4px; box-sizing: border-box; width: 92px; height: 28px; border-radius: 8px; background: #e8552a; font-size: 8px; font-weight: 700; color: #fff; white-space: nowrap; }
.${P}-go svg { flex: none; width: 9px; height: 9px; fill: none; stroke: #fff; stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.${P}-pan { position: relative; margin-top: 10px; width: ${COL_W}px; height: ${PAN_H}px; }
.${P}-ov { position: absolute; inset: 0; border-radius: 12px; background: #1a1e27; box-shadow: inset 0 0 0 1px #232834; }
.${P}-cap { position: absolute; left: 0; right: 0; top: 36px; text-align: center; font-size: 7.5px; color: #b9bcc4; }
.${P}-trk { position: absolute; left: 75px; right: 75px; top: 52px; height: 3px; border-radius: 2px; background: #2a2e36; overflow: hidden; }
.${P}-trk i { display: block; height: 100%; border-radius: 2px; background: #e8552a; }
.${P}-g { position: absolute; left: ${PAN_PAD}px; top: ${PAN_PAD}px; display: grid; grid-template-columns: repeat(3, ${TILE}px); gap: ${TGAP}px; }
.${P}-t { position: relative; width: ${TILE}px; height: ${TILE}px; border-radius: 4px; overflow: hidden; background: #222731; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-c { position: absolute; inset: 0; background: #222731; }
.${P}-pen { position: absolute; right: 4px; bottom: 4px; width: 9px; height: 9px; fill: none; stroke: #e8552a; stroke-width: 1.6; stroke-linecap: round; stroke-linejoin: round; }
`;

const PROMPT = 'A muse in a lecture hall holding up a handwritten note, meme style, bold colours';
const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand
const GEN_AT = 0.06;                               // the cursor presses Draw
const PANEL = 0.16;                                // the generation panel opens
const BAR_END = 0.68;                              // the bar reaches the far end
const SWAP = 0.72;                                 // the panel gives way to the grid of ten empty squares
const LAND = Array.from({ length: 10 }, (_, i) => 0.78 + i * 0.1);     // tile i lands in reading order, the last at 1.68
const FADE = 0.06;                                 // the square's cover thins away over this long before the picture lands
const PEN = '<svg class="' + P + '-pen" viewBox="0 0 12 12"><path d="M2 10l.6-2.6L8.4 1.6a1.2 1.2 0 011.7 0l.3.3a1.2 1.2 0 010 1.7L4.6 9.4z"/></svg>';

export default {
  id: 'craiyon',
  label: 'Craiyon (V3)',
  source: {
    platform: "craiyon.com, the Draw generator on the site's home page (desktop browser, dark theme; a screen recording on YouTube, 2024-04-22)",
    feature: "dark home page with a centred composer (prompt field, Style chips Art / Photo / Drawing / None, orange button 'Draw' becoming 'Drawing...' with a small spinner in the field), a large dark rounded panel with the fixed line 'Estimated time: 60s' over a thin full-width bar with an orange fill, replaced on completion by a 3-wide grid of finished square pictures with an orange pencil mark (adapted to 10: the grid holds 3 + 3 + 3 + 1, its tiles landing in reading order after the bar completes; the wordmark and the 'Generate images faster' upsell are omitted)",
    refs: [{ url: 'https://www.youtube.com/watch?v=LJUv80O-BBw', retrieved: '2026-10-14' }],
    extrapolated: 'the recording cuts between the wait (a sliver of bar) and the finished nine-picture grid, so the bar pace, the empty squares between panel and pictures and the one-by-one landing are adapted, not observed',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'craiyon');
    const cell = (g, i) => `<div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/><div class="${P}-c"></div>${PEN}</div>`;
    const pencil = '<svg viewBox="0 0 12 12"><path d="M2 10l.6-2.6L8.4 1.6a1.2 1.2 0 011.7 0l.3.3a1.2 1.2 0 010 1.7L4.6 9.4z"/></svg>';
    const root = x.el(`<div class="${P}"><div class="${P}-col"><div class="${P}-in">${x.esc(PROMPT)}<i class="${P}-sp" style="display: none"></i></div><div class="${P}-row"><div class="${P}-chips"><span>Art</span><span>Photo</span><span>Drawing</span><span class="on">None</span></div><div class="${P}-go">${pencil}<b class="lbl">Draw</b></div></div><div class="${P}-pan" style="visibility: hidden"><div class="${P}-g">${tiles.map(cell).join('')}</div><div class="${P}-ov"><div class="${P}-cap">Estimated time: 60s</div><div class="${P}-trk"><i style="width: 0%"></i></div></div></div></div></div>`);
    const go = root.querySelector(`.${P}-go`), lbl = go.querySelector('.lbl'), sp = root.querySelector(`.${P}-sp`);
    const pan = root.querySelector(`.${P}-pan`), ov = root.querySelector(`.${P}-ov`), fill = root.querySelector(`.${P}-trk i`);
    const cells = [...root.querySelectorAll(`.${P}-t`)].map((n, i) => ({ im: n.querySelector('img'), cv: n.querySelector(`.${P}-c`), pen: n.querySelector(`.${P}-pen`), g: tiles[i] }));
    ctx.gate(cells.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // Draw is pressed and relabels to 'Drawing...'; the ring turns in the field until the last picture has landed
        const gp = press(s, GEN_AT, 0.06, 0.06, 0.14);
        put('go', gp.toFixed(3), () => { go.style.transform = gp > 0 ? `scale(${(1 - 0.05 * gp).toFixed(4)})` : 'none'; });
        const busy = s >= GEN_AT + 0.05 && s < LAND[9];
        put('busy', busy, (v) => { lbl.textContent = v ? 'Drawing...' : 'Draw'; sp.style.display = v ? '' : 'none'; });
        const deg = (((t * 420) % 360) + 360) % 360;
        put('deg', deg.toFixed(0), (d) => { sp.style.transform = `rotate(${d}deg)`; });

        // the panel opens, its bar fills, then it gives way to the grid
        put('pan', s >= PANEL, (v) => { pan.style.visibility = v ? '' : 'hidden'; });
        const b = seg(s, PANEL, BAR_END);
        const w = 100 * (0.5 - 0.5 * Math.cos(Math.PI * b));
        put('bar', w.toFixed(1), () => { fill.style.width = `${w.toFixed(1)}%`; });
        put('swap', s >= SWAP, (v) => { ov.style.display = v ? 'none' : ''; });

        cells.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(c.g);
          c.im.style.transform = restTransform(c.g);
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cv.style.display = 'none'; c.cv.style.opacity = ''; } else { c.cv.style.display = ''; c.cv.style.opacity = f > 0 ? (1 - f).toFixed(3) : ''; }
          });
          put(`p${i}`, f >= 1, (v) => { c.pen.style.visibility = v ? '' : 'hidden'; });
        });
      },
    };
  },
};
