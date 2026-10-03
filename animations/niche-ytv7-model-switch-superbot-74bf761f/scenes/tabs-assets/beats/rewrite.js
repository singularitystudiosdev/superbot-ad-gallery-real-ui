// Rewrite beat, the finale: Claude Opus 5.5 rewrites the first 30 seconds of the next video, and the viewer READS it.
// Its line streams and a card lands in the thread holding a mini window; the window grows to full frame (ytv3's pairs.js
// GROW grammar) and becomes the REWRITE BOARD, superbot's own dark surface: a quiet header (Claude mark, "Rewrite by
// Claude Opus 5.5", the next video's title in grey), a slim RETENTION STRIP (the last video's curve zoomed to 0:00 to
// 0:30, the dip flooded red, the "Drop-off 0:21" tag: the cause and the fix share the frame), then two columns. LEFT, the
// last video's intro, dimmed, the 0:04 and 0:21 lines carrying a red bar and "Viewers left here". RIGHT, superbot's new
// intro on a softly raised card: each line's timecode lands, then the line streams behind a soft caret (CPS), a short
// gap, the next. Then the two moves land under the card and the green-check status line under the board (the CHIME is
// its check, window.__AD_MARKS.chime). The OVERVIEW holds with everything on screen (the thumbnail frame).
// ENDING: the camera pushes in on the new intro card (its label and its five lines) until the lines fill most of the
// frame, the board's header still showing as its edge; it holds; then the card eases aside and shrinks a little (still
// readable) while superbot's lock-up (the mascot, the wordmark and the plain-text line "Try it at superbot.gg") lands
// beside it. The scene's fade and the loop's dip to black follow.
// Policy guard: nothing on the board is a control. No buttons, tabs, toggles, no "Apply" / "Use script" / "Edit" /
// "Export", no play triangles, no timers, no relative times, no projected retention; the moves are plain text with a
// tick glyph, the status line is text with a check. Every string comes from data.js (the one source) and is rendered
// whole: never truncated, never ellipsized; the stream only moves characters between a visible and a transparent span,
// so a line's height never changes while it writes. Pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount } from '../../../lib.js';
import { makeMark } from '../../../shell.js';
import {
  NEXT, DROP, OLD, OLD_LABEL, NEW, NEW_LABEL, MOVES, LEFT_HERE, RETENTION_TITLE,
  retention, linePath, areaPath, clock,
} from './data.js?v=74bf761f';

const SAY = 'Rewrote the first 30 seconds of your next video.';
const TITLE = 'Rewrite by Claude Opus 5.5';
const NEXT_LINE = `Next: ${NEXT}`;
const STRIP_LABEL = `${RETENTION_TITLE}, last video`;
const DONE = 'Saved as the opening of your next video\'s script';
const CTA = 'Try it at superbot.gg';
// the strip: 0:00 to 0:30 of the last video, 40% to 100%
const STRIP = { s0: 0, s1: 30, yMin: 40, yMax: 100, ticks: [0, 10, 20, 30] };

// timing (seconds from the reply start, or from the mark named)
const CPS_SAY = 100;                 // the reply line streams
const SAY_AT = 0.05;
const CARD_AT = 0.2;                 // reply start to the card landing in the thread
const CARD_IN = 0.3;
const GROW_AT = 0.2; /* deliberate */ // the card landed, then the window opens
const GROW = 0.45; /* deliberate */  // the mini window opening to full frame
const STRIP_AT = 0.1, STRIP_IN = 0.35, STRIP_DRAW = 0.6; // full frame to the strip (its curve draws, then the dip floods)
const OLD_AT = 0.2, OLD_IN = 0.35;   // full frame to the old intro fading in, dimmed
const WHY_AT = 0.6, WHY_IN = 0.3;    // full frame to the red bars and "Viewers left here"
const NEW_AT = 0.8, NEW_IN = 0.3;    // full frame to the new intro's label and card
const LINE_AT = 1.05;                // full frame to the first timecode
const TC_IN = 0.2;                   // a timecode landing
const STREAM_AT = 0.15;              // the timecode starts landing, then the line's first character
export const CPS = 55; /* deliberate */ // the new lines streaming in, characters per second
const LINE_GAP = 0.35; /* deliberate */ // a line complete to the next timecode
const MOVES_AT = 0.3, MOVES_STAGGER = 0.15, MOVES_IN = 0.3; // the last line complete to the moves
const STATUS_AT = 0.25, STATUS_IN = 0.3; // the last move landed to the status line rising
const CHECK_AT = 0.1;                // the status line starts rising, then its check pops (the chime)
const OV_HOLD = 1.6; /* deliberate */ // the overview, everything on screen (the brief: >= 1.5 s)
const PUSH = 0.75; /* deliberate */  // the push in on the new intro card
const CLOSE_HOLD = 2.4; /* deliberate */ // the close-up holds, the five lines readable (the brief: >= 2.2 s)
const BRAND = 0.7; /* deliberate */  // the card eases aside, the lock-up lands beside it
const BRAND_HOLD = 1.6; /* deliberate */ // the last frame: the new intro and superbot, before the fade
// geometry (board px; the board is laid out at the frame size, 1920 x 1080 at 16:9)
const HEAD = 96;                     // the header strip
const RADIUS = 10;                   // the mini window's radius (the card's), eased to 0 at full frame
const CU_MAX = 1.6;                  // the close-up's scale, at most (it is also fitted to the frame)
const CU_PAD = { x: 70, y: 46 };     // the close-up's margin inside the area under the header
const BESIDE = 1.12;                 // the card's scale beside the lock-up
const BESIDE_X = 70;                 // ...and its left edge
const MARK = 168;                    // the lock-up's mascot
const LOCK_GAP = 32;                 // the clear space the card's right edge must leave before the lock-up starts landing

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OK = '<svg class="rw-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const TICK = '<svg class="rw-tk" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.grow = T.card + CARD_IN + GROW_AT;
    T.full = T.grow + GROW;
    T.strip = T.full + STRIP_AT;
    T.old = T.full + OLD_AT;
    T.why = T.full + WHY_AT;
    T.newCol = T.full + NEW_AT;
    let tc = T.full + LINE_AT;
    T.lines = NEW.map(([, text]) => {
      const L = { tc, s0: tc + STREAM_AT };
      L.s1 = L.s0 + text.length / CPS;
      tc = L.s1 + LINE_GAP;
      return L;
    });
    const last = T.lines[T.lines.length - 1].s1;
    T.moves = MOVES.map((_, i) => last + MOVES_AT + i * MOVES_STAGGER);
    T.status = T.moves[MOVES.length - 1] + MOVES_IN + STATUS_AT;
    T.check = T.status + CHECK_AT;                 // the chime
    T.ov = T.status + STATUS_IN;                   // everything on screen: the overview
    T.push = T.ov + OV_HOLD;                       // the push in on the new intro
    T.close = T.push + PUSH;
    T.brand = T.close + CLOSE_HOLD;                // the card eases aside, the lock-up lands
    T.branded = T.brand + BRAND;
    T.end = T.branded + BRAND_HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.check, overview: T.ov, closeUp: T.close, brand: T.branded });

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el('<div class="rw-cardt"><div class="rw-shot"></div></div>');
    const shot = card.firstElementChild;
    const layer = x.el(`<div class="rw-full" aria-hidden="true"><div class="rw-app">
      <header class="rw-hd"><span class="rw-mk"><img src="${x.brand('claude-logo.svg')}" alt=""/></span><b>${esc(TITLE)}</b><span class="rw-nx">${esc(NEXT_LINE)}</span></header>
      <div class="rw-body">
        <div class="rw-strip"><div class="rw-sl">${esc(STRIP_LABEL)}</div><div class="rw-splot"></div></div>
        <div class="rw-old"><div class="rw-lab">${esc(OLD_LABEL)}</div>
          ${OLD.map(([tc, line, left]) => `<div class="rw-orow${left ? ' rw-left' : ''}"><span class="rw-otc">${esc(tc)}</span><div class="rw-om"><div class="rw-ot">${esc(line)}</div>${left ? `<div class="rw-why">${esc(LEFT_HERE)}</div>` : ''}</div></div>`).join('')}
        </div>
        <div class="rw-new"><div class="rw-lab rw-nlab">${esc(NEW_LABEL)}</div>
          <div class="rw-card">${NEW.map(([tc]) => `<div class="rw-nrow"><span class="rw-ntc">${esc(tc)}</span><div class="rw-nt"><span class="rw-vis"></span><i class="rw-caret"></i><span class="rw-hid"></span></div></div>`).join('')}</div>
          <div class="rw-moves">${MOVES.map((m) => `<div class="rw-mv">${TICK}<span>${esc(m)}</span></div>`).join('')}</div>
        </div>
      </div>
      <div class="rw-status">${OK}<span>${esc(DONE)}</span></div>
    </div></div>`);
    const brand = x.el(`<div class="rw-brand" aria-hidden="true"><div class="rw-bface"></div><div class="rw-bwords"><h1>superbot</h1><p>${esc(CTA)}</p></div></div>`);
    x.root.appendChild(layer);
    x.root.appendChild(brand);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const body = $('.rw-body'), strip = $('.rw-strip'), splot = $('.rw-splot'), oldCol = $('.rw-old'), newCol = $('.rw-new');
    const newLab = $('.rw-nlab'), ncard = $('.rw-card'), status = $('.rw-status');
    const whys = [...layer.querySelectorAll('.rw-orow.rw-left')];
    const moves = [...layer.querySelectorAll('.rw-mv')];
    const movesBox = $('.rw-moves');
    const rows = [...layer.querySelectorAll('.rw-nrow')].map((n, i) => ({
      tc: n.querySelector('.rw-ntc'), vis: n.querySelector('.rw-vis'), hid: n.querySelector('.rw-hid'), caret: n.querySelector('.rw-caret'),
      text: NEW[i][1], L: T.lines[i], shown: -1,
    }));
    const face = brand.querySelector('.rw-bface'), words = brand.querySelector('.rw-bwords');
    const mark = makeMark(MARK);
    face.appendChild(mark.el);

    // the strip's plot, laid out once per frame size
    let SP = null;
    const drawStrip = () => {
      const w = splot.clientWidth, h = splot.clientHeight - 34;
      const { s0, s1, yMin, yMax } = STRIP;
      const X = (s) => (w * (s - s0)) / (s1 - s0);
      const xd0 = X(DROP.from), xd1 = X(DROP.to);
      splot.innerHTML = `
        <svg class="rw-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
          <defs><clipPath id="rw-clip-74bf761f"><rect class="rw-cr" x="-4" y="-8" width="0" height="${h + 16}"/></clipPath></defs>
          <line class="rw-base" x1="0" x2="${w}" y1="${h}" y2="${h}"/>
          <rect class="rw-flood" x="${xd0.toFixed(2)}" y="0" width="${(xd1 - xd0).toFixed(2)}" height="${h}"/>
          <g clip-path="url(#rw-clip-74bf761f)">
            <path class="rw-area" d="${areaPath(retention, s0, s1, s0, s1, w, h, yMin, yMax, 240)}"/>
            <path class="rw-line" d="${linePath(retention, s0, s1, w, h, yMin, yMax, 480)}"/>
            <path class="rw-dip" d="${linePath(retention, DROP.from, DROP.to, xd1 - xd0, h, yMin, yMax, 120)}" transform="translate(${xd0.toFixed(2)} 0)"/>
          </g>
          <line class="rw-rule" x1="${xd1.toFixed(2)}" x2="${xd1.toFixed(2)}" y1="-44" y2="${h}"/>
        </svg>
        <div class="rw-tag" style="left:${(xd1 + 12).toFixed(2)}px"><i></i>${esc(DROP.tag)}</div>
        ${STRIP.ticks.map((s, i) => `<div class="rw-xl${i === 0 ? ' rw-x0' : i === STRIP.ticks.length - 1 ? ' rw-xn' : ''}" style="left:${X(s).toFixed(2)}px;top:${h + 8}px">${clock(s)}</div>`).join('')}`;
      SP = { w, cr: splot.querySelector('.rw-cr'), flood: splot.querySelector('.rw-flood'), dip: splot.querySelector('.rw-dip'),
        rule: splot.querySelector('.rw-rule'), tag: splot.querySelector('.rw-tag') };
    };

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1, geo = '', feed = null, clearKey = '', clearT = T.branded;
    let AW = 1920, AH = 1080;
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      AW = W; AH = H;
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      shot.style.aspectRatio = `${W} / ${H}`;
      drawStrip();
    };
    // the push: the new intro (its label and its card) in body px, and the body transform that puts its centre at (X, Y)
    // of the board at scale z
    const target = () => ({ x: newCol.offsetLeft, y: newCol.offsetTop, w: newCol.offsetWidth, h: ncard.offsetTop + ncard.offsetHeight });
    const cam = (r, z, X, Y) => ({ z, tx: X - z * (r.x + r.w / 2), ty: Y - HEAD - z * (r.y + r.h / 2) });

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the strip: it fades in, its curve draws, the dip floods and the tag lands
        strip.style.opacity = outCubic(seg(t, T.strip, T.strip + STRIP_IN)).toFixed(3);
        if (SP) {
          const d = outCubic(seg(t, T.strip, T.strip + STRIP_DRAW));
          SP.cr.setAttribute('width', (d * (SP.w + 8)).toFixed(2));
          const fl = outCubic(seg(t, T.strip + STRIP_DRAW, T.strip + STRIP_DRAW + 0.3));
          SP.flood.style.opacity = fl.toFixed(3);
          SP.dip.style.opacity = fl.toFixed(3);
          SP.rule.style.opacity = fl.toFixed(3);
          SP.tag.style.opacity = fl.toFixed(3);
          SP.tag.style.transform = fl >= 1 ? 'none' : `translateY(${(-(1 - fl) * 12).toFixed(2)}px)`;
        }
        // the old intro, dimmed, then its two red bars and tags
        const o = outCubic(seg(t, T.old, T.old + OLD_IN));
        oldCol.style.opacity = o.toFixed(3);
        const w = outCubic(seg(t, T.why, T.why + WHY_IN));
        whys.forEach((n) => n.style.setProperty('--why', w.toFixed(3)));
        // the new intro: label and card surface, then each timecode lands and its line streams
        const nc = outCubic(seg(t, T.newCol, T.newCol + NEW_IN));
        newLab.style.opacity = nc.toFixed(3);
        ncard.style.opacity = nc.toFixed(3);
        ncard.style.transform = nc >= 1 ? 'none' : `translateY(${((1 - nc) * 16).toFixed(2)}px)`;
        rows.forEach((row) => {
          const L = row.L;
          const c = outCubic(seg(t, L.tc, L.tc + TC_IN));
          row.tc.style.opacity = c.toFixed(3);
          row.tc.style.transform = c >= 1 ? 'none' : `translateY(${((1 - c) * 10).toFixed(2)}px)`;
          const n = streamCount(row.text, L.s0, CPS, t);
          if (n !== row.shown) { row.vis.textContent = row.text.slice(0, n); row.hid.textContent = row.text.slice(n); row.shown = n; }
          row.caret.style.opacity = t >= L.s0 - 0.05 && t < L.s1 + 0.25 ? '1' : '0';
        });
        moves.forEach((m, i) => {
          const v = outCubic(seg(t, T.moves[i], T.moves[i] + MOVES_IN));
          m.style.opacity = v.toFixed(3);
          m.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 10).toFixed(2)}px)`;
        });
        const st = outCubic(seg(t, T.status, T.status + STATUS_IN));
        status.style.setProperty('--ck', outQuint(seg(t, T.check, T.check + 0.2)).toFixed(3));

        // the ending: p = the push in on the new intro, e = the card easing aside for the lock-up
        const p = inOutCubic(seg(t, T.push, T.close));
        const e = inOutCubic(seg(t, T.brand, T.branded));
        const rest = 1 - outCubic(seg(p, 0, 0.55));   // everything but the new intro and the header leaves during the push
        strip.style.opacity = (+strip.style.opacity * rest).toFixed(3);
        oldCol.style.opacity = (o * rest).toFixed(3);
        movesBox.style.opacity = rest.toFixed(3);
        status.style.opacity = (st * rest).toFixed(3);
        status.style.transform = `translate(-50%, ${((1 - st) * 10).toFixed(2)}px)`;
        let enter = Infinity;                          // the instant the lock-up starts landing (after the card clears it)
        if (p > 0) {
          const r = target();
          const areaH = AH - HEAD;
          const zc = Math.min(CU_MAX, (AW - 2 * CU_PAD.x) / r.w, (areaH - 2 * CU_PAD.y) / r.h);
          const C = cam(r, zc, AW / 2, HEAD + areaH / 2);
          const B = cam(r, BESIDE, BESIDE_X + (BESIDE * r.w) / 2, HEAD + areaH / 2);
          // the body transform at any (push, aside) mix, and the card's right edge in frame px under it
          const at = (pp, ee) => ({ z: lerp(lerp(1, zc, pp), BESIDE, ee), tx: lerp(lerp(0, C.tx, pp), B.tx, ee), ty: lerp(lerp(0, C.ty, pp), B.ty, ee) });
          const { z, tx, ty } = at(p, e);
          body.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${z.toFixed(5)})`;
          // the lock-up sits centred in the space to the right of the card
          const right = BESIDE_X + BESIDE * r.w;
          const bx = (right + AW) / 2;
          brand.style.left = `${bx.toFixed(2)}px`;
          brand.style.top = `${(AH / 2 + HEAD / 2).toFixed(2)}px`;
          // it never overlaps the card: its entrance waits until the card's right edge (easing aside) has cleared the
          // lock-up's box by LOCK_GAP; found once per layout by sampling the aside move
          const key = `${geo}|${r.x}|${r.w}|${brand.offsetWidth}`;
          if (key !== clearKey) {
            clearKey = key;
            const left = bx - brand.offsetWidth / 2 - LOCK_GAP;
            clearT = T.branded;
            for (let s = T.brand; s <= T.branded; s += 1 / 240) {
              const c = at(1, inOutCubic(seg(s, T.brand, T.branded)));
              if (c.tx + c.z * (r.x + r.w) <= left) { clearT = s; break; }
            }
            window.__AD_MARKS.lockup = clearT;
          }
          enter = clearT;
        } else body.style.transform = 'none';
        const lt = t - enter;
        const fi = seg(lt, 0, 0.5);
        brand.style.opacity = t >= enter ? '1' : '0';
        face.style.opacity = fi.toFixed(3);
        face.style.transform = `scale(${lerp(0.5, 1, outQuint(fi)).toFixed(4)})`;
        const wi = outCubic(seg(lt, 0.25, 0.75));
        words.style.opacity = wi.toFixed(3);
        words.style.transform = `translateY(${((1 - wi) * 18).toFixed(2)}px)`;
        mark.render(Math.max(0, lt));
      },
      // after the camera: pin the board over the card's window and open it to full frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = RADIUS * s * (1 - g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while it sits in the thread it is clipped to the feed, like the card around it
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
