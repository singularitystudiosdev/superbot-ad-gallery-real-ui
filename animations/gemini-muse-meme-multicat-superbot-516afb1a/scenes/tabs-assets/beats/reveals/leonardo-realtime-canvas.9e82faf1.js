// Leonardo's Realtime Canvas, the 2023 early-access build, dark theme (official 'Realtime Canvas Tutorial', an uncut take, t~30-215 s; a
// mobile screen recording and four further tutorials; spec .tmp/clone-9e82faf1/reveal-refs/leonardo-realtime-canvas/spec.json,
// confidence 0.6; frames w_01_desktop_livecanvas_full, w_02_desktop_output_after_stroke, w_03_desktop_midstroke,
// w_09_desktop_outputpanel_10fps_morph, w_08_interactive_mode_full). A split workspace: a drawing board on the left, a live OUTPUT
// panel on the right, a prompt bar and a magenta mode pill along the bottom. Nothing here is a wait in the usual sense: when a stroke
// ends the OUTPUT panel simply re-renders IN PLACE, the previous render turning into the next (the 10 fps crop shows it morphing frame
// by frame). No spinner, no percentage, no queue chip, no 'Generating' line and no dimming appears anywhere in six captures, and the
// mode pill keeps its label throughout, so this module draws none: the absence of pending chrome is the observed behaviour. The only
// empty state is the grey caption on the OUTPUT panel before the first stroke has rendered.
// Adapted to ten images: ten successive strokes on the board (drawn from t along a brush path, with the brush cursor at its tip), each
// ending in a re-render of the OUTPUT panel; every render is also kept as a thumbnail in a row of outputs under the board, a stand-in
// for the sequence the footage can only show one frame at a time. Omitted: the workspace's account and refine controls, the token
// counter, the workspace tabs and the colour-picker popover; the product's wordmark is not drawn (the title is the feature's name only).
import { seg, lerp, clamp } from '../../../../lib.9b47fc30.js';
import { injectStyle, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-lrc';
const ROOT_H = 424, BOARD = 248;
const CSS = `
.${P} { box-sizing: border-box; position: relative; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 12px; background: #000; color: #e6e6ea; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #1c1c24; }
.${P}-top { position: absolute; left: 0; right: 0; top: 0; height: 30px; }
.${P}-ex { position: absolute; left: 10px; top: 9px; font-size: 9px; font-weight: 600; color: #f0f0f4; white-space: nowrap; }
.${P}-ttl { position: absolute; left: 0; right: 0; top: 8px; display: flex; justify-content: center; align-items: center; gap: 5px; font-size: 9.5px; font-weight: 600; color: #f4f4f7; }
.${P}-ttl em { font-style: normal; padding: 0 5px; border-radius: 7px; background: linear-gradient(90deg, #ec4899, #a855f7); font-size: 6.5px; line-height: 11px; font-weight: 700; color: #fff; }
.${P}-ttl i { font-style: normal; color: #a855f7; font-weight: 500; }
.${P}-sub { position: absolute; left: 36px; right: 8px; top: 33px; height: 20px; }
.${P}-und { position: absolute; left: 0; top: 2px; display: flex; gap: 2px; }
.${P}-und span { display: grid; place-items: center; width: 17px; height: 15px; border-radius: 4px; background: #1b1b22; font-size: 9px; color: #6a6a76; }
.${P}-o2i { position: absolute; left: ${BOARD + 8}px; top: 3px; width: ${BOARD}px; display: flex; justify-content: center; }
.${P}-o2i span { font-size: 8.5px; font-weight: 600; color: #e8e8ee; }
.${P}-rail { position: absolute; left: 6px; top: 66px; width: 22px; padding: 6px 0; border-radius: 6px; background: #121217; display: flex; flex-direction: column; align-items: center; gap: 7px; }
.${P}-rail i { display: block; width: 11px; height: 11px; border-radius: 2px; box-shadow: inset 0 0 0 1.3px #8c8c98; }
.${P}-rail i.${P}-on { width: 16px; height: 16px; border-radius: 4px; background: linear-gradient(135deg, #ec4899, #a855f7); box-shadow: none; }
.${P}-rail b { display: block; width: 11px; height: 11px; border-radius: 50%; background: #52f000; }
.${P}-rail s { display: block; width: 3px; height: 34px; border-radius: 2px; background: linear-gradient(#a855f7, #26262e); text-decoration: none; }
.${P}-rail u { text-decoration: none; font-size: 8px; font-weight: 600; color: #e0e0e6; }
.${P}-rail em { display: block; width: 9px; height: 9px; border-radius: 2px; background: #c8323c; }
.${P}-bd { position: absolute; left: 36px; top: 56px; width: ${BOARD}px; height: ${BOARD}px; border-radius: 3px; background: #000; box-shadow: 0 0 0 1px #2a2a33; overflow: hidden; }
.${P}-bd svg { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.${P}-cur { position: absolute; width: 13px; height: 13px; margin: -6.5px 0 0 -6.5px; }
.${P}-cur::before, .${P}-cur::after { content: ""; position: absolute; background: #fff; box-shadow: 0 0 0 .5px #000; }
.${P}-cur::before { left: 6px; top: 0; width: 1px; height: 13px; }
.${P}-cur::after { left: 0; top: 6px; width: 13px; height: 1px; }
.${P}-out { position: absolute; left: ${BOARD + 44}px; top: 56px; width: ${BOARD}px; height: ${BOARD}px; border-radius: 3px; background: #0b0b0f; box-shadow: 0 0 0 1px #1e1e26; overflow: hidden; }
.${P}-out img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cap { position: absolute; left: 0; right: 0; top: 50%; margin-top: -6px; text-align: center; font-size: 9.5px; line-height: 12px; color: #8a8a96; }
.${P}-hist { position: absolute; left: 36px; right: 8px; top: ${56 + BOARD + 8}px; display: grid; grid-template-columns: repeat(10, minmax(0, 1fr)); gap: 5px; }
.${P}-th { position: relative; aspect-ratio: 1; border-radius: 3px; background: #101015; box-shadow: inset 0 0 0 1px #24242c; overflow: hidden; }
.${P}-th img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-th.${P}-new { box-shadow: 0 0 0 1.5px #a855f7; }
.${P}-bar { position: absolute; left: 36px; right: 8px; top: ${ROOT_H - 38}px; height: 28px; display: flex; align-items: center; gap: 6px; }
.${P}-adj { flex: none; display: grid; place-items: center; width: 26px; height: 26px; border-radius: 6px; background: #16161c; font-size: 11px; color: #9a9aa6; }
.${P}-pr { flex: 1; min-width: 0; height: 26px; padding: 0 9px; border-radius: 6px; background: #121217; font-size: 9px; line-height: 26px; color: #8e8e9a; white-space: nowrap; overflow: hidden; }
.${P}-cs { flex: none; width: 112px; font-size: 7px; line-height: 9px; color: #e0e0e6; }
.${P}-cs div { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.${P}-cs s { position: relative; flex: 1; height: 4px; border-radius: 2px; background: linear-gradient(90deg, #ec4899, #a855f7 60%, #2a2a36 60%); text-decoration: none; }
.${P}-cs s i { position: absolute; left: 60%; top: -2px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: #fff; }
.${P}-cs b { font-size: 8.5px; font-weight: 500; }
.${P}-env { flex: none; display: flex; align-items: center; gap: 5px; height: 26px; padding: 0 7px; border-radius: 6px; background: #121217; font-size: 8.5px; color: #e0e0e6; white-space: nowrap; }
.${P}-pill { flex: none; display: flex; align-items: center; gap: 6px; height: 26px; padding: 0 9px; border-radius: 6px; background: linear-gradient(90deg, #f0527f, #7a6cf6); font-size: 9px; font-weight: 600; color: #fff; white-space: nowrap; }
`;

const REF = 1.84;                                  // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const N = 10;
const LAND = Array.from({ length: N }, (_, i) => 0.3 + i * 0.138);   // render i has taken over the OUTPUT panel, the last at 1.542 (the beat's tail is the settled workspace)
const STROKE = 0.11;                               // a stroke takes this long to draw
const LEAD = 0.27;                                 // it starts this long before its render has landed, so the render begins 0.04 after the brush lifts
const MORPH = 0.12;                                // the OUTPUT panel turns from the previous render into the new one over this long

// ten strokes on a 100 x 100 board: [colour, width, points]; each is drawn from its first point to its last along the polyline
const zig = (x0, x1, y0, y1, n) => Array.from({ length: n }, (_, i) => { const y = lerp(y0, y1, i / (n - 1)); const half = (x1 - x0) / 2 * Math.sqrt(Math.max(0, 1 - Math.pow((y - (y0 + y1) / 2) / ((y1 - y0) / 2), 2))); return i % 2 ? [50 - half, y] : [50 + half, y]; }).flat();
const arc = (cx, cy, rx, ry, a0, a1, n) => Array.from({ length: n }, (_, i) => { const a = lerp(a0, a1, i / (n - 1)) * Math.PI / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; }).flat();
const pairs = (flat) => { const o = []; for (let i = 0; i < flat.length; i += 2) o.push([flat[i], flat[i + 1]]); return o; };
const STROKES = [
  ['#52f000', 11, pairs(zig(24, 76, 19, 79, 11))],
  ['#1f7d1f', 5, pairs(arc(52, 50, 24, 29, -60, 55, 9))],
  ['#000000', 6, pairs(arc(38, 46, 4, 7, 0, 330, 12))],
  ['#000000', 5, pairs(arc(62, 40, 9, 4, 0, 340, 12))],
  ['#000000', 3, [[40, 67], [47, 70], [54, 69], [61, 64]]],
  ['#f1f1f1', 3, [[31, 34], [36, 29], [43, 27], [50, 27]]],
  ['#f1f1f1', 3, [[29, 40], [28, 50], [29, 60], [32, 68]]],
  ['#f1f1f1', 2.5, [[56, 33], [60, 31], [66, 32]]],
  ['#2fa32f', 5, pairs(arc(50, 62, 20, 15, 160, 40, 9))],
  ['#a8ff6b', 4, [[44, 56], [47, 60], [50, 56], [53, 61], [56, 57]]],
].map(([c, w, pts]) => {
  let len = 0; const cum = [0];
  for (let i = 1; i < pts.length; i++) { len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(len); }
  return { c, w, pts, len, cum };
});
// the point a fraction f of the way along a stroke
const at = (st, f) => {
  const d = f * st.len;
  let i = 1; while (i < st.cum.length - 1 && st.cum[i] < d) i++;
  const k = (d - st.cum[i - 1]) / Math.max(1e-6, st.cum[i] - st.cum[i - 1]);
  return [lerp(st.pts[i - 1][0], st.pts[i][0], clamp(k)), lerp(st.pts[i - 1][1], st.pts[i][1], clamp(k))];
};

export default {
  id: 'leonardo-realtime-canvas',
  label: 'Leonardo Realtime Canvas (2023)',
  source: {
    platform: "Leonardo.Ai Realtime Canvas web app (app.leonardo.ai/realtime-canvas, the 2023 early-access build, dark theme; the official 'Realtime Canvas Tutorial', an uncut screen recording, plus a mobile recording and four further tutorials)",
    feature: "a split workspace: a drawing board on the left and a live OUTPUT panel on the right, a prompt bar and a magenta 'Real-time' pill along the bottom; every stroke that ends re-renders the OUTPUT panel IN PLACE, the previous render morphing into the next, with no spinner, percentage, queue chip or 'Generating' text anywhere (the absence of pending chrome is the observed behaviour); adapted to 10: ten successive stroke-triggered renders, each also kept as a thumbnail in a row of outputs under the board",
    refs: [
      { url: 'https://www.youtube.com/watch?v=Ad7in0tXs9U', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=w-z6A0QEzIM', retrieved: '2026-10-14' },
    ],
    extrapolated: 'The footage shows one OUTPUT panel updating from stroke to stroke; the ten landings are ten successive stroke-triggered renders, each kept as a thumbnail in a row of outputs under the board (the footage has no such row: it stands in for the sequence a single panel can only show one frame at a time). The strokes (a green head sketched, then its features and highlights) are our own, and the OUTPUT shows our meme pictures, not renders of the sketch.',
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const srcOut = ownSrc(ctx.src, 'lrc-out');   // a render at 248 x 248
    const srcTh = ownSrc(ctx.src, 'lrc-th');     // the same picture as a ~44 px thumbnail: its own URL, its own decode
    const outImgs = tiles.map((g, i) => `<img src="${srcOut}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/>`).join('');
    const thumbs = tiles.map((g, i) => `<div class="${P}-th"><img src="${srcTh}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1} thumbnail" style="visibility: hidden; transform-origin: ${g.origin}"/></div>`).join('');
    const paths = STROKES.map((st, i) => `<polyline points="${st.pts.map((p) => p.map((v) => v.toFixed(2)).join(',')).join(' ')}" fill="none" stroke="${st.c}" stroke-width="${st.w}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="${st.len.toFixed(2)} ${(st.len + 40).toFixed(2)}" stroke-dashoffset="${st.len.toFixed(2)}" style="visibility: hidden"/>`).join('');
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-ex">← Exit the editor</div><div class="${P}-ttl"><em>Early Access</em>Realtime Canvas</div></div><div class="${P}-sub"><div class="${P}-und"><span>↶</span><span>↷</span></div><div class="${P}-o2i"><span>⇄ Output to Input</span></div></div><div class="${P}-rail"><i></i><i></i><i></i><i class="${P}-on"></i><b></b><s></s><u>16</u><em></em></div><div class="${P}-bd"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${paths}</svg><div class="${P}-cur" style="visibility: hidden"></div></div><div class="${P}-out">${outImgs}<div class="${P}-cap">Start drawing here</div></div><div class="${P}-hist">${thumbs}</div><div class="${P}-bar"><div class="${P}-adj">≡</div><div class="${P}-pr">green alien</div><div class="${P}-cs">Creativity Strength<div><s><i></i></s><b>0.68</b></div></div><div class="${P}-env">Environment <span>▾</span></div><div class="${P}-pill">Real-time <span>▴</span></div></div></div>`);
    const q = (s) => root.querySelector(`.${P}-${s}`);
    const lines = [...root.querySelectorAll('polyline')], cur = q('cur'), dot = q('rail').querySelector('b'), cap = q('cap');
    const outs = [...q('out').querySelectorAll('img')];
    const ths = [...q('hist').querySelectorAll(`.${P}-th`)].map((n) => ({ box: n, im: n.querySelector('img') }));
    ctx.gate([...outs, ...ths.map((c) => c.im)]);

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered

        // the brush: each stroke is drawn along its path over STROKE seconds, ending LEAD - STROKE before its render has landed
        let tip = null;
        STROKES.forEach((st, i) => {
          const a = LAND[i] - LEAD;
          const f = seg(s, a, a + STROKE);
          put(`s${i}`, f.toFixed(3), () => {
            lines[i].style.visibility = f > 0 ? '' : 'hidden';
            lines[i].style.strokeDashoffset = (st.len * (1 - f)).toFixed(2);
          });
          if (f > 0 && f < 1) tip = at(st, f);
        });
        put('cur', tip ? `${tip[0].toFixed(1)},${tip[1].toFixed(1)}` : '', (v) => {
          cur.style.visibility = v ? '' : 'hidden';
          cur.style.left = v ? `${tip[0]}%` : '';
          cur.style.top = v ? `${tip[1]}%` : '';
        });
        // the colour swatch on the tool rail is the brush colour of the latest stroke begun (a function of s alone)
        let begun = 0; STROKES.forEach((_, i) => { if (s >= LAND[i] - LEAD) begun = i; });
        put('dot', STROKES[begun].c, (c) => { dot.style.background = c === '#000000' ? '#26262e' : c; });

        // the OUTPUT panel re-renders in place: render i turns out of render i - 1 (a cross-dissolve with a slight settle), nothing over it
        put('cap', s < LAND[0] - MORPH, (v) => { cap.style.visibility = v ? '' : 'hidden'; });
        outs.forEach((im, i) => {
          const g = tiles[i];
          const m = seg(s, LAND[i] - MORPH, LAND[i]);
          put(`o${i}`, m.toFixed(3), () => {
            im.style.visibility = m > 0 ? '' : 'hidden';
            im.style.opacity = m > 0 && m < 1 ? m.toFixed(3) : '';
            if (m > 0 && m < 1) {
              const sc = g.zoom * (1 + 0.035 * (1 - m));
              im.style.transform = `scale(${sc.toFixed(4)})`;
              im.style.filter = `blur(${(3.2 * Math.sin(Math.PI * m)).toFixed(2)}px) ${g.grade || ''}`.trim();
            } else {
              im.style.transform = g.zoom === 1 ? 'none' : `scale(${g.zoom.toFixed(4)})`;
              im.style.filter = restFilter(g);
            }
          });
        });

        // each finished render is kept in the row of outputs; the newest wears the ring
        ths.forEach((c, i) => {
          const done = s >= LAND[i];
          put(`t${i}`, done, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          c.im.style.filter = restFilter(tiles[i]);
          c.im.style.transform = tiles[i].zoom === 1 ? 'none' : `scale(${tiles[i].zoom.toFixed(4)})`;
          const newest = done && !(i < N - 1 && s >= LAND[i + 1]);
          put(`n${i}`, newest, (v) => { c.box.classList.toggle(`${P}-new`, v); });
        });
      },
    };
  },
};
