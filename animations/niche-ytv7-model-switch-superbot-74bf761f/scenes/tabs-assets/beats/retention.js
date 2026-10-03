// Retention beat: Gemini reads the last video's audience retention. Its line streams and a card lands in the thread: the
// video (thumbnail img/mic-frame.jpg with the 14:32 chip, the title, "Audience retention" in grey) over a mini window.
// The window GROWS (ytv3's GROW grammar) into a FRAMED window, never full bleed: superbot's dark backdrop shows as a
// margin on every side and superbot's title bar (the superbot mark and name, the YouTube mark, "Read from your YouTube
// Studio") sits on the frame edge. Inside it is YouTube Studio's Analytics page, light theme: a top bar (menu glyph,
// the YouTube Studio logo, the "S" avatar; no Create, no search, no help), the video, the heading "Audience retention",
// the chart filling most of the page and the key moments beside it. Choreography: the chart frame appears, the curve
// DRAWS left to right (outCubic), the "Typical retention" band fades in behind it, then the bold moment: the dip region
// floods red and the "Drop-off 0:21" tag drops in on its rule; the "Most re-watched 4:38" tag lands on the spike and the
// key-moment rows stagger in. The full chart HOLDS, readable, then the window shrinks back into its card and Gemini's
// result line lands under it with the green check.
// Policy guard (X Ads deceptive content): nothing on the page is a control. No tabs, no date drop-down, no "See more",
// no "Advanced mode", no Create, no search; the key moments are plain text; the tags are chart annotations (text and a
// rule), not pills. The retention numbers are the creator's own data (content), no projection anywhere.
// The chart is a data plot drawn as SVG (the brief's allowed exception); the curve and the band come from data.js.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=74bf761f';
import {
  VIDEO, DROP, SPIKE, TYPICAL, RETENTION_TITLE, KEY_MOMENTS, clock,
  retention, typicalHi, typicalLo, linePath, areaPath, bandPath,
} from './data.js?v=74bf761f';

const SAY = 'Read the retention of your last video and watched its first 30 seconds.';
const FRAME_LABEL = 'Read from your YouTube Studio';
const RESULT = 'Most viewers left 0:04 to 0:21, during the sponsor read.';
const KEY_HEAD = 'Key moments';
const X_TICKS = [0, 180, 360, 540, 720, VIDEO.secs];   // 0:00, 3:00, 6:00, 9:00, 12:00, 14:32
const Y_TICKS = [0, 25, 50, 75, 100];

const APP_SCALE = 1.2;                           // the framed window: its design px to frame px
const MARGIN = { x: 64, y: 40 };                 // the superbot frame: the dark backdrop's margin, frame px
// the chart's gutters inside its box (design px): the y labels at the left, the tags above, the x labels below
const GUT = { l: 74, r: 14, t: 58, b: 42 };
// timing (seconds from the reply start, or from the mark named)
const CPS = 100;                                 // the reply line streams
const SAY_AT = 0.05;
const CARD_AT = 0.2;                             // reply start to the card landing in the thread
const CARD_IN = 0.3;
const GROW_AT = 0.2; /* deliberate */            // the card landed, then the window opens
const GROW = 0.45; /* deliberate */              // the window opening to the framed rect (and closing back)
const FRAME_AT = 0.05;                           // full to the chart frame (axes, labels) appearing
const FRAME_IN = 0.3;
const DRAW_AT = 0.25;                            // full to the curve starting to draw
const DRAW = 1.6; /* deliberate */               // the curve drawing left to right, outCubic
const BAND_AT = 0.5, BAND_IN = 0.6;              // the draw start to the typical band fading in
const FLOOD_AT = 0.05, FLOOD_IN = 0.3;           // the draw done to the dip region flooding red
const TAG_AT = 0.15, TAG_IN = 0.4;               // the draw done to the drop-off tag dropping in (the bold moment)
const SPIKE_AT = 0.55, SPIKE_IN = 0.3;           // the draw done to the spike tag landing
const KM_AT = 0.7, KM_STAGGER = 0.15, KM_IN = 0.3; // the draw done to the key-moment rows
const HOLD = 1.9; /* deliberate */               // everything on the page, readable (the brief: >= 1.8 s)
const FOOT_AT = 0.1, FOOT_IN = 0.24;             // the window back in its card to the result line
const RADIUS = 8;                                // the card's window radius
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.grow = T.card + CARD_IN + GROW_AT;
    T.full = T.grow + GROW;
    T.frame = T.full + FRAME_AT;
    T.d0 = T.full + DRAW_AT;                       // the curve starts drawing
    T.d1 = T.d0 + DRAW;                            // ...and is drawn
    T.band = T.d0 + BAND_AT;
    T.flood = T.d1 + FLOOD_AT;
    T.tag = T.d1 + TAG_AT;                         // "Drop-off 0:21" drops in
    T.spike = T.d1 + SPIKE_AT;
    T.km = KEY_MOMENTS.map((_, i) => T.d1 + KM_AT + i * KM_STAGGER);
    T.hold = T.km[KEY_MOMENTS.length - 1] + KM_IN; // everything is on the page
    T.shrink = T.hold + HOLD;                      // the window closes back into its card
    T.small = T.shrink + GROW;
    T.foot = T.small + FOOT_AT;                    // Gemini's result line
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ra-card">
      <div class="ra-cvid"><span class="ra-th"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><i class="ra-len">${esc(VIDEO.len)}</i></span>
        <div class="ra-cmeta"><b>${esc(VIDEO.title)}</b><span>${esc(RETENTION_TITLE)}</span></div></div>
      <div class="ra-shot"></div>
      <div class="ra-ft">${x.OK}<span>${esc(RESULT)}</span></div>
    </div>`);
    const shot = card.querySelector('.ra-shot');
    const foot = card.querySelector('.ra-ft');

    const dim = x.el('<div class="ra-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="ra-full" aria-hidden="true"><div class="ra-win">
      <div class="ra-sb"><img class="ra-sbt" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="ra-sbv"></i><img class="ra-sby" src="${x.brand('youtube-icon.svg')}" alt=""/><span>${esc(FRAME_LABEL)}</span></div>
      <div class="ra-port"><div class="ra-app">
        <header class="ra-top"><span class="ra-mn">${ms('menu')}</span><span class="ra-logo"><img src="${x.brand('youtube-studio-logo.svg')}" alt=""/></span><span class="ra-me">S</span></header>
        <section class="ra-page">
          <div class="ra-vid"><img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/><b class="ra-vt">${esc(VIDEO.title)}</b><span class="ra-vl">${esc(VIDEO.len)}</span></div>
          <h1 class="ra-h1">${esc(RETENTION_TITLE)}</h1>
          <div class="ra-grid">
            <div class="ra-chart"></div>
            <div class="ra-km"><div class="ra-kh">${esc(KEY_HEAD)}</div>
              ${KEY_MOMENTS.map(([label, text], i) => `<div class="ra-kr ra-k${i}"><b class="ra-kl">${esc(label)}</b><span class="ra-kt">${esc(text)}</span></div>`).join('')}
            </div>
          </div>
        </section>
      </div></div>
    </div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    const win = layer.firstElementChild;
    const sb = win.querySelector('.ra-sb');
    const app = win.querySelector('.ra-app');
    const chart = win.querySelector('.ra-chart');
    const kh = win.querySelector('.ra-kh');
    const kms = [...win.querySelectorAll('.ra-kr')];
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 20px "Roboto GM"`));

    // the chart is laid out once per frame size (its paths depend on the plot's px)
    let C = null;
    const drawChart = () => {
      const cw = chart.clientWidth, ch = chart.clientHeight;
      const w = cw - GUT.l - GUT.r, h = ch - GUT.t - GUT.b;
      const S = VIDEO.secs, X = (s) => (w * s) / S, Y = (v) => (h * (100 - v)) / 100;
      const xd0 = X(DROP.from), xd1 = X(DROP.to), xs = X(SPIKE.at), ys = Y(retention(SPIKE.at));
      const ty = Y(typicalHi(560)) - 48;
      chart.innerHTML = `
        <div class="ra-plot" style="left:${GUT.l}px;top:${GUT.t}px;width:${w}px;height:${h}px">
          <svg class="ra-svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true">
            <defs><clipPath id="ra-clip-74bf761f"><rect class="ra-cr" x="-4" y="-8" width="0" height="${h + 16}"/></clipPath></defs>
            ${Y_TICKS.map((v) => `<line class="ra-gl" x1="0" x2="${w}" y1="${Y(v).toFixed(2)}" y2="${Y(v).toFixed(2)}"/>`).join('')}
            <path class="ra-band" d="${bandPath(typicalHi, typicalLo, 0, S, w, h, 0, 100)}"/>
            <rect class="ra-flood" x="${xd0.toFixed(2)}" y="0" width="${(xd1 - xd0).toFixed(2)}" height="${h}"/>
            <g clip-path="url(#ra-clip-74bf761f)">
              <path class="ra-area" d="${areaPath(retention, 0, S, 0, S, w, h, 0, 100, 480)}"/>
              <path class="ra-line" d="${linePath(retention, 0, S, w, h, 0, 100, 900)}"/>
            </g>
            <path class="ra-dipline" d="${linePath(retention, DROP.from, DROP.to, xd1 - xd0, h, 0, 100, 60)}" transform="translate(${xd0.toFixed(2)} 0)"/>
            <line class="ra-rule" x1="${xd1.toFixed(2)}" x2="${xd1.toFixed(2)}" y1="${-GUT.t + 46}" y2="${h}"/>
            <circle class="ra-dot" cx="${xs.toFixed(2)}" cy="${ys.toFixed(2)}" r="7"/>
          </svg>
          <div class="ra-tag ra-drop" style="left:${(xd1 + 12).toFixed(2)}px;top:${-GUT.t + 6}px"><i></i>${esc(DROP.tag)}</div>
          <div class="ra-tag ra-spk" style="left:${xs.toFixed(2)}px;top:${(ys - 52).toFixed(2)}px">${esc(SPIKE.tag)}</div>
          <div class="ra-typ" style="left:${X(560).toFixed(2)}px;top:${ty.toFixed(2)}px">${esc(TYPICAL)}</div>
        </div>
        ${Y_TICKS.map((v) => `<div class="ra-yl" style="top:${(GUT.t + Y(v)).toFixed(2)}px;width:${GUT.l - 14}px">${v}%</div>`).join('')}
        ${X_TICKS.map((s, i) => `<div class="ra-xl${i === 0 ? ' ra-x0' : i === X_TICKS.length - 1 ? ' ra-xn' : ''}" style="left:${(GUT.l + X(s)).toFixed(2)}px;top:${(GUT.t + h + 10).toFixed(2)}px">${clock(s)}</div>`).join('')}`;
      const q = (s) => chart.querySelector(s);
      C = { w, h, plot: q('.ra-plot'), cr: q('.ra-cr'), band: q('.ra-band'), flood: q('.ra-flood'), dipline: q('.ra-dipline'), rule: q('.ra-rule'),
        dot: q('.ra-dot'), drop: q('.ra-drop'), spk: q('.ra-spk'), typ: q('.ra-typ'), labels: [...chart.querySelectorAll('.ra-yl, .ra-xl')] };
    };

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null;
    let DW = 1493, DH = 833, R = { x: 64, y: 40, w: 1792, h: 1000 };
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      R = { x: MARGIN.x, y: MARGIN.y, w: W - 2 * MARGIN.x, h: H - 2 * MARGIN.y };
      DW = Math.round(R.w / APP_SCALE); DH = Math.round(R.h / APP_SCALE);
      app.style.width = `${DW}px`; app.style.height = `${DH - sb.offsetHeight}px`;
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
      drawChart();
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.foot, foot]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        foot.style.opacity = f.toFixed(3);
        foot.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
        if (!C) return;

        // the chart frame: gridlines, axis labels, the plot box
        const fr = outCubic(seg(t, T.frame, T.frame + FRAME_IN));
        chart.style.opacity = fr.toFixed(3);
        kh.style.opacity = fr.toFixed(3);
        // the curve draws left to right (the clip widens), outCubic
        const d = outCubic(seg(t, T.d0, T.d1));
        C.cr.setAttribute('width', (d * (C.w + 8)).toFixed(2));
        C.band.style.opacity = outCubic(seg(t, T.band, T.band + BAND_IN)).toFixed(3);
        C.typ.style.opacity = outCubic(seg(t, T.band + 0.2, T.band + 0.2 + BAND_IN)).toFixed(3);
        // the bold moment: the dip floods red, the rule draws down, the tag drops in on it
        const fl = outCubic(seg(t, T.flood, T.flood + FLOOD_IN));
        C.flood.style.opacity = fl.toFixed(3);
        C.dipline.style.opacity = fl.toFixed(3);
        const tg = seg(t, T.tag, T.tag + TAG_IN);
        C.rule.style.opacity = outCubic(seg(tg, 0, 0.5)).toFixed(3);
        C.drop.style.opacity = outCubic(seg(tg, 0, 0.6)).toFixed(3);
        C.drop.style.transform = tg >= 1 ? 'none' : `translateY(${(-(1 - outBack(tg)) * 26).toFixed(2)}px)`;
        // the spike: its dot pops and its tag lands
        const sp = outCubic(seg(t, T.spike, T.spike + SPIKE_IN));
        C.dot.style.opacity = sp.toFixed(3);
        C.spk.style.opacity = sp.toFixed(3);
        C.spk.style.transform = `translate(-50%, ${((1 - sp) * 10).toFixed(2)}px)`;
        kms.forEach((row, i) => {
          const o = outCubic(seg(t, T.km[i], T.km[i] + KM_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 12).toFixed(2)}px)`;
        });
      },
      // after the camera: lay the window over the card's mini window, open it to the framed rect, close it back
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; dim.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full)) * (1 - inOutCubic(seg(t, T.shrink, T.small)));
        const L = lerp(b.x, R.x, g), Tp = lerp(b.y, R.y, g), Wd = lerp(b.w, R.w, g), Ht = lerp(b.h, R.h, g);
        const s0 = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s0, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        // the mini window and the framed one are the same design px at two sizes
        const kk = Wd / DW;
        win.style.width = `${DW}px`;
        win.style.height = `${(Ht / kk).toFixed(2)}px`;
        win.style.transform = `scale(${kk.toFixed(5)})`;
        // while it sits in the thread it is clipped to the feed, like the card around it
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        // the hub behind gives way to superbot's dark backdrop while the window is open
        dim.style.opacity = g.toFixed(3);
      },
    };
  },
};
