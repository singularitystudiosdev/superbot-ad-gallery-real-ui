// Pairs beat: Claude Opus 5.5 writes the five replies, and the viewer READS them. Its line streams and a card lands in
// the thread holding a mini window; the window grows to full frame (the studio beat's GROW grammar) and becomes the
// REPLY BOARD, superbot's own dark surface: a quiet header (Claude mark, "Replies by Claude Opus 5.5", the video title
// in grey), then the five top comments as rows, each beside superbot's full reply. Teleprompter: pair i's comment
// rises in, a thin connector draws from it to the reply card, the reply streams in behind a soft caret (CPS) and then
// HOLDS long enough to read (max(HOLD_MIN, HOLD_PER_WORD x words)); the next pair scrolls up to ~55% of the frame
// height while the earlier ones move up, dim (still readable) and leave off the top. Then the OVERVIEW: the list eases
// back until all five pairs are on screen at once, Priya's pair gains a quiet accent outline and the green-check status
// line lands under the list. The board then shrinks back into its card in the thread.
// Policy guard: nothing on the board is a control. No buttons, tabs, toggles, icons in button shapes, timers or
// relative times; the like counts are plain state text beside a grey glyph.
// The reply text is replies.js REPLY (the one source), the comments are watch.js TOP, both rendered whole: never
// truncated, never ellipsized; the stream only moves characters between a visible and a transparent span, so a row's
// height never changes while it writes. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=7bd77eac';
import { TOP, VIDEO } from './watch.js?v=7bd77eac';
import { REPLY } from './replies.js?v=7bd77eac';

const SAY = 'Wrote a reply to each of the top 5 comments, in your voice.';
const TITLE = 'Replies by Claude Opus 5.5';
const ACCOUNT = 'Sam Rivera';
const MODEL = 'Opus 5.5';
const DONE = 'Pin Priya\'s question: 214 people asked it, one reply answers them all';
export const PAIRS = TOP.map(([name, text, likes, , c]) => ({ name, text, likes, c, reply: REPLY[name.split(' ')[0]] }));

// timing (seconds from the reply start, or from the mark named)
const CPS_SAY = 100;                 // the reply line streams
const SAY_AT = 0.05;
const CARD_AT = 0.2;                 // reply start to the card landing in the thread
const CARD_IN = 0.3;                 // the card rising in
const GROW_AT = 0.2; /* deliberate */ // the card landed, then the window opens
const GROW = 0.45; /* deliberate */  // the mini window opening to full frame (and, at the end, closing back)
const FIRST_AT = 0.1;                // full frame to the first comment rising
const RISE = 0.3;                    // a comment rising in
const CONN = 0.2;                    // the connector drawing from comment to reply
const CONN_AT = 0.25;                // the comment starts rising, then the connector starts drawing (first pair)
const SCROLL_CONN = 0.4;             // the scroll starts, then the connector starts drawing (later pairs)
const STREAM_AT = 0.15;              // the connector starts, then the first character of the reply lands
const REPLY_IN = 0.2;                // the reply card fading up as the connector lands
export const CPS = 55; /* deliberate */ // the reply streaming in, characters per second
const HOLD_MIN = 1.1; /* deliberate */  // the reading hold after a reply has finished streaming...
const HOLD_PER_WORD = 0.12; /* deliberate */ // ...or this per word, whichever is longer
const SCROLL = 0.5; /* deliberate */ // the list scrolling the next pair up, outCubic
const RISE_IN_SCROLL = 0.15;         // the scroll starts, then the next comment rises (it lands with the scroll)
const OV_IN = 0.5; /* deliberate */  // the list easing back to show all five pairs
const OV_HOLD = 1.2; /* deliberate */ // the overview holds, everything readable
const STATUS_IN = 0.3;               // the status line rising in
const ACTIVE_Y = 0.55;               // the active pair's centre, as a share of the frame height
const DIM = 0.55;                    // earlier pairs, once the next one is up
// board geometry, in the board's own px (1920 x 1080 at 16:9; the board is laid out at the frame size)
const HEAD = 96;                     // the header strip
const OV_TOP = 18;                   // the overview list's top, under the header
const OV_FOOT = 84;                  // the status line's lane at the bottom of the overview
const RADIUS = 10;                   // the mini window's radius (the card's), eased to 0 at full frame

const words = (s) => s.trim().split(/\s+/).length;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OK = '<svg class="pb-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ARROW = '<svg class="pb-ah" viewBox="0 0 12 16" aria-hidden="true"><path d="M2 2l8 6-8 6"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.grow = T.card + CARD_IN + GROW_AT;
    T.full = T.grow + GROW;
    let prev = null;
    T.p = PAIRS.map((p, i) => {
      const P = { i };
      if (i === 0) { P.scroll = null; P.rise = T.full + FIRST_AT; P.conn = P.rise + CONN_AT; }
      else { P.scroll = prev.h1; P.rise = P.scroll + RISE_IN_SCROLL; P.conn = P.scroll + SCROLL_CONN; }
      P.s0 = P.conn + STREAM_AT;                  // the first character of the reply
      P.s1 = P.s0 + p.reply.length / CPS;         // the reply complete
      P.hold = Math.max(HOLD_MIN, HOLD_PER_WORD * words(p.reply));
      P.h1 = P.s1 + P.hold;                       // the reading hold ends
      prev = P;
      return P;
    });
    T.ov0 = prev.h1;                              // the list eases back to the overview
    T.ov1 = T.ov0 + OV_IN;
    T.status = T.ov0 + OV_IN * 0.5;               // the outline and the status line land as it settles
    T.ovEnd = T.ov1 + OV_HOLD;
    T.shrink = T.ovEnd;                           // the board closes back into its card
    T.small = T.shrink + GROW;
    T.end = T.small;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el('<div class="pb-card"><div class="pb-shot"></div></div>');
    const shot = card.firstElementChild;
    const row = (p, i) => `<div class="pb-row" data-i="${i}">
        <div class="pb-cm"><div class="pb-who"><span class="pb-av" style="--c: ${p.c}">${esc(p.name[0])}</span><b class="pb-nm">${esc(p.name)}</b><span class="pb-lk">${ms('thumb-up-outline')}${esc(p.likes)}</span></div>
          <div class="pb-ct">${esc(p.text)}</div></div>
        <div class="pb-cn"><i class="pb-ln"></i>${ARROW}</div>
        <div class="pb-rp"><div class="pb-rh"><span class="pb-av pb-me">S</span><b>${esc(ACCOUNT)}</b><small>${esc(MODEL)}</small></div>
          <div class="pb-rt"><span class="pb-vis"></span><i class="pb-caret"></i><span class="pb-hid"></span></div></div>
      </div>`;
    const layer = x.el(`<div class="pb-full" aria-hidden="true"><div class="pb-app">
      <header class="pb-hd"><span class="pb-mk"><img src="${x.brand('claude-logo.svg')}" alt=""/></span><b>${esc(TITLE)}</b><span class="pb-vt">${esc(VIDEO.title)}</span></header>
      <div class="pb-view"><div class="pb-list">${PAIRS.map(row).join('')}</div></div>
      <div class="pb-status">${OK}<span>${esc(DONE)}</span></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const list = layer.querySelector('.pb-list');
    const status = layer.querySelector('.pb-status');
    const rows = [...layer.querySelectorAll('.pb-row')].map((n, i) => ({
      n, cm: n.querySelector('.pb-cm'), ln: n.querySelector('.pb-ln'), ah: n.querySelector('.pb-ah'), rp: n.querySelector('.pb-rp'),
      vis: n.querySelector('.pb-vis'), hid: n.querySelector('.pb-hid'), caret: n.querySelector('.pb-caret'), shown: -1, P: T.p[i], text: PAIRS[i].reply,
    }));
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 40px "GSF"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1, geo = '', feed = null;
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
    };
    // the list's translateY (view px) that puts row i's centre at ACTIVE_Y of the frame
    const yOf = (i) => { const n = rows[i].n; return ACTIVE_Y * AH - HEAD - (n.offsetTop + n.offsetHeight / 2); };

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

        // the overview blend: 0 while the teleprompter runs, 1 once all five are on screen
        const f = inOutCubic(seg(t, T.ov0, T.ov1));
        rows.forEach((o, i) => {
          const P = o.P;
          const c = outCubic(seg(t, P.rise, P.rise + RISE));
          o.cm.style.opacity = c.toFixed(3);
          o.cm.style.transform = c >= 1 ? 'none' : `translateY(${((1 - c) * 28).toFixed(2)}px)`;
          const l = outCubic(seg(t, P.conn, P.conn + CONN));
          o.ln.style.transform = `scaleX(${l.toFixed(4)})`;
          o.ln.style.opacity = l > 0 ? '1' : '0';
          o.ah.style.opacity = seg(t, P.conn + CONN * 0.6, P.conn + CONN).toFixed(3);
          const rp = outCubic(seg(t, P.conn + CONN * 0.5, P.conn + CONN * 0.5 + REPLY_IN));
          o.rp.style.opacity = rp.toFixed(3);
          o.rp.style.transform = rp >= 1 ? 'none' : `translateX(${((1 - rp) * -16).toFixed(2)}px)`;
          const n = streamCount(o.text, P.s0, CPS, t);
          if (n !== o.shown) { o.vis.textContent = o.text.slice(0, n); o.hid.textContent = o.text.slice(n); o.shown = n; }
          o.caret.style.opacity = t >= P.s0 - 0.05 && t < P.s1 + 0.25 ? '1' : '0';
          // dimmed once the next pair starts scrolling up; full again in the overview
          const nx = rows[i + 1] ? rows[i + 1].P.scroll : null;
          const d = nx === null ? 0 : outCubic(seg(t, nx, nx + SCROLL));
          o.n.style.opacity = lerp(lerp(1, DIM, d), 1, f).toFixed(3);
        });
        rows[0].n.style.setProperty('--ol', outCubic(seg(t, T.status, T.status + STATUS_IN)).toFixed(3));

        // the teleprompter: each pair scrolls up to the reading line as it starts
        let y = yOf(0);
        for (let i = 1; i < rows.length; i++) {
          const s = rows[i].P.scroll;
          if (t <= s) break;
          y = lerp(yOf(i - 1), yOf(i), outCubic(seg(t, s, s + SCROLL)));
        }
        // the overview: the whole list scaled to fit between the header and the status lane
        const listH = list.offsetHeight;
        const avail = AH - HEAD - OV_TOP - OV_FOOT;
        const zo = Math.min(1, avail / Math.max(1, listH));
        const z = lerp(1, zo, f);
        const ty = lerp(y, OV_TOP, f);
        list.style.transform = `translateY(${ty.toFixed(2)}px) scale(${z.toFixed(5)})`;

        const st = outCubic(seg(t, T.status, T.status + STATUS_IN));
        status.style.opacity = st.toFixed(3);
        status.style.transform = `translate(-50%, ${((1 - st) * 10).toFixed(2)}px)`;
      },
      // after the camera: pin the board over the card's window, open it to full frame, close it back at the end
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full)) * (1 - inOutCubic(seg(t, T.shrink, T.small)));
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
