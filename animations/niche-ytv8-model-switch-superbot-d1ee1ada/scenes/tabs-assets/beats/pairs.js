// Pairs beat (the Claude Opus 5.5 step): Opus drafts the replies, and the viewer READS them. Its line streams and a
// card lands in the thread holding a mini window; the window grows to full frame (the studio beat's GROW grammar) and
// becomes the DRAFT BOARD, superbot's own dark surface: a quiet header (Claude mark, "Drafts by Claude Opus 5.5",
// "Sponsor emails" in grey), then the sponsor emails as rows, each beside superbot's full draft. Teleprompter: row i's
// email rises in (letter avatar, sender + brand, its category as a dot + text, the email line), a thin connector draws
// from it to the draft card, the draft streams in behind a soft caret (CPS) and then HOLDS long enough to read
// (max(HOLD_MIN, HOLD_PER_WORD x words)); the next row scrolls up to ~55% of the frame height while the earlier ones
// move up, dim (still readable) and leave off the top. Order: Dana, Ines, Theo, Maya, then the ViralBoost row, which
// gets no draft: its reply column fades in a red "Scam" label and the note instead, and holds. Then the OVERVIEW: the
// list eases back until all five rows are on screen at once and the green-check status line lands under the list. The
// board then shrinks back into its card in the thread.
// Policy guard: nothing on the board is a control. The draft card carries a small grey plain-text "Draft" tag: no
// Send, Edit or Approve, no buttons, tabs, toggles, timers or times.
// The texts are sponsors.js (the one source), rendered whole: never truncated, never ellipsized; the stream only moves
// characters between a visible and a transparent span, so a row's height never changes while it writes. Pure function
// of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { EMAILS, CATS, SCAM_NOTE, INBOX_TITLE, DRAFTS_DONE } from './sponsors.js?v=d1ee1ada';

const SAY = 'Drafted an answer to each sponsor email, in your voice.';
const TITLE = 'Drafts by Claude Opus 5.5';
const TAG = 'Draft';
export const PAIRS = EMAILS.map((e) => ({ ...e, reply: e.draft || SCAM_NOTE, scam: !e.draft }));

// timing (seconds from the reply start, or from the mark named)
const CPS_SAY = 100;                 // the reply line streams
const SAY_AT = 0.05;
const CARD_AT = 0.2;                 // reply start to the card landing in the thread
const CARD_IN = 0.3;                 // the card rising in
const GROW_AT = 0.2; /* deliberate */ // the card landed, then the window opens
const GROW = 0.45; /* deliberate */  // the mini window opening to full frame (and, at the end, closing back)
const FIRST_AT = 0.1;                // full frame to the first email rising
const RISE = 0.3;                    // an email rising in
const CONN = 0.2;                    // the connector drawing from email to draft
const CONN_AT = 0.25;                // the email starts rising, then the connector starts drawing (first row)
const SCROLL_CONN = 0.35;             // the scroll starts, then the connector starts drawing (later rows)
const STREAM_AT = 0.1;               // the connector starts, then the first character of the draft lands
const REPLY_IN = 0.2;                // the draft card fading up as the connector lands
export const CPS = 60; /* deliberate */ // the draft streaming in, characters per second (the brief's ~60)
const HOLD_MIN = 1.0; /* deliberate */  // the reading hold after a draft has finished streaming...
const HOLD_PER_WORD = 0.1; /* deliberate */ // ...or this per word, whichever is longer
const NOTE_IN = 0.3;                 // the scam row: its label and note fading in (no stream)
const NOTE_HOLD = 1.2; /* deliberate */ // ...and holding
const SCROLL = 0.5; /* deliberate */ // the list scrolling the next row up, outCubic
const RISE_IN_SCROLL = 0.15;         // the scroll starts, then the next email rises (it lands with the scroll)
const OV_IN = 0.5; /* deliberate */  // the list easing back to show all five rows
const OV_HOLD = 1.2; /* deliberate */ // the overview holds, everything readable
const STATUS_IN = 0.3;               // the status line rising in
const ACTIVE_Y = 0.55;               // the active row's centre, as a share of the frame height
const DIM = 0.55;                    // earlier rows, once the next one is up
// board geometry, in the board's own px (1920 x 1080 at 16:9; the board is laid out at the frame size)
const HEAD = 96;                     // the header strip
const OV_TOP = 14;                   // the overview list's top, under the header
const OV_FOOT = 86;                  // the status line's lane at the bottom of the overview
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
      // a draft streams; the scam row's note fades in whole and holds
      P.s1 = P.s0 + (p.scam ? NOTE_IN : p.reply.length / CPS); // the reply column complete
      P.hold = p.scam ? NOTE_HOLD : Math.max(HOLD_MIN, HOLD_PER_WORD * words(p.reply));
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
    const cat = (k) => `<span class="pb-cat" style="--k: ${CATS[k].c}"><i></i>${esc(CATS[k].label)}</span>`;
    const row = (p, i) => `<div class="pb-row${p.scam ? ' pb-isscam' : ''}" data-i="${i}">
        <div class="pb-cm"><div class="pb-who"><span class="pb-av" style="--c: ${p.c}">${esc(p.sender[0])}</span><b class="pb-nm">${esc(p.sender)}</b><span class="pb-br">${esc(p.brand)}</span></div>
          ${cat(p.cat)}<div class="pb-ct">${esc(p.line)}</div></div>
        <div class="pb-cn"><i class="pb-ln"></i>${ARROW}</div>
        <div class="pb-rp${p.scam ? ' pb-scam' : ''}"><div class="pb-rh">${p.scam ? cat('scam') : `<small class="pb-tag">${esc(TAG)}</small>`}</div>
          <div class="pb-rt"><span class="pb-vis"></span><i class="pb-caret"></i><span class="pb-hid"></span></div></div>
      </div>`;
    const layer = x.el(`<div class="pb-full" aria-hidden="true"><div class="pb-app">
      <header class="pb-hd"><span class="pb-mk"><img src="${x.brand('claude-logo.svg')}" alt=""/></span><b>${esc(TITLE)}</b><span class="pb-vt">${esc(INBOX_TITLE)}</span></header>
      <div class="pb-view"><div class="pb-list">${PAIRS.map(row).join('')}</div></div>
      <div class="pb-status">${OK}<span>${esc(DRAFTS_DONE)}</span></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const list = layer.querySelector('.pb-list');
    const status = layer.querySelector('.pb-status');
    const rows = [...layer.querySelectorAll('.pb-row')].map((n, i) => ({
      n, cm: n.querySelector('.pb-cm'), ln: n.querySelector('.pb-ln'), ah: n.querySelector('.pb-ah'), rp: n.querySelector('.pb-rp'),
      vis: n.querySelector('.pb-vis'), hid: n.querySelector('.pb-hid'), caret: n.querySelector('.pb-caret'), shown: -1, P: T.p[i], text: PAIRS[i].reply, scam: PAIRS[i].scam,
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
          // a draft card fades up as the connector lands; the scam row's label and note fade in whole over NOTE_IN
          const rp = o.scam ? outCubic(seg(t, P.s0 - 0.05, P.s1)) : outCubic(seg(t, P.conn + CONN * 0.5, P.conn + CONN * 0.5 + REPLY_IN));
          o.rp.style.opacity = rp.toFixed(3);
          o.rp.style.transform = rp >= 1 ? 'none' : `translateX(${((1 - rp) * -16).toFixed(2)}px)`;
          const n = o.scam ? o.text.length : streamCount(o.text, P.s0, CPS, t);
          if (n !== o.shown) { o.vis.textContent = o.text.slice(0, n); o.hid.textContent = o.text.slice(n); o.shown = n; }
          o.caret.style.opacity = !o.scam && t >= P.s0 - 0.05 && t < P.s1 + 0.25 ? '1' : '0';
          // dimmed once the next pair starts scrolling up; full again in the overview
          const nx = rows[i + 1] ? rows[i + 1].P.scroll : null;
          const d = nx === null ? 0 : outCubic(seg(t, nx, nx + SCROLL));
          o.n.style.opacity = lerp(lerp(1, DIM, d), 1, f).toFixed(3);
        });

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
