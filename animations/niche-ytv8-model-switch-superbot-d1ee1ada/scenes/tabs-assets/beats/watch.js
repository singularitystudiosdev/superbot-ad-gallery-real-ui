// Inbox beat (the Gemini step; the file keeps the base's watch.js name): Gemini sorts the sponsor emails. Its line
// streams and a card lands in the thread holding a mini window; the window grows to full frame (the studio beat's GROW
// grammar, as the draft board does) and becomes superbot's own "Sponsor emails" card: a quiet header (Gemini mark,
// the title, the creator in grey), the five sponsor emails as rows (letter avatar, sender + brand on line 1, the email
// line on line 2) and a status lane ("Sorting 23 sponsor emails" under a spinner). Gemini tags the rows top to bottom
// (a coloured dot + a text label at the row's end, never a pill or a chip), then the rows regroup (FLIP, outCubic)
// under four plain group headers with their counts (Good fit, Needs details, Not a fit, Scam) and the status resolves
// to the check: "Sorted 23 sponsor emails into 4 groups". The window then closes back into its card.
// Policy guard: nothing here is a control: no buttons, checkboxes, stars, archive or reply affordances, no times or
// dates; the inbox is superbot's own card, not a mail client's interface.
// The texts are sponsors.js (the one source). Rows are laid out at fixed heights, so both layouts (inbox order and
// sorted) are known without measuring and every frame is a pure function of t: ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { EMAILS, INBOX_ORDER, CATS, CAT_ORDER, CREATOR, INBOX_TITLE, SORTING, SORTED } from './sponsors.js?v=d1ee1ada';

const SAY = 'Reading your sponsor emails and sorting them by fit.';
// timing (seconds from the reply start, or from the mark named)
const CPS_SAY = 100;                 // the reply line streams
const SAY_AT = 0.05;
const CARD_AT = 0.2;                 // reply start to the card landing in the thread
const CARD_IN = 0.3;                 // the card rising in (the rows are already in its window)
const GROW_AT = 0.2; /* deliberate */ // the card landed, then the window opens
const GROW = 0.45; /* deliberate */  // the mini window opening to full frame (and, at the end, closing back)
const TAG_AT = 0.15;                 // full frame to the first tag
const TAG_STAGGER = 0.18;            // one row's tag to the next (top to bottom)
const TAG_IN = 0.2;                  // a tag landing
const SORT_AT = 0.25; /* deliberate */ // the last tag landed, a beat to see all five tagged, then the regroup
const SORT = 0.5; /* deliberate */   // the FLIP regroup, outCubic (the brief's ~0.5 s)
const HEAD_IN = 0.3;                 // the group headers fading in over the regroup's second half
const STATUS_IN = 0.3;               // the status lane resolving to the check
const HOLD = 0.95; /* deliberate */  // the sorted inbox holds, every row readable
// board geometry, in the board's own px (the frame size, 1920 x 1080 at 16:9)
const HEAD = 96;                     // the header strip
const LANE = 100;                    // the status lane at the bottom
const ROW_H = 100, ROW_GAP = 10;     // an email row and the gap between rows in a group
const GH_H = 52, GROUP_GAP = 20;     // a group header and the gap above each group after the first
const RADIUS = 10;                   // the mini window's radius (the card's), eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OK = '<svg class="ib-ok" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// the two layouts: y (in the view's px) of every row in inbox order and once sorted, and of every group header
function layouts(viewH) {
  const unsorted = new Array(EMAILS.length);
  const uH = EMAILS.length * ROW_H + (EMAILS.length - 1) * ROW_GAP;
  const u0 = (viewH - uH) / 2;
  INBOX_ORDER.forEach((ei, j) => { unsorted[ei] = u0 + j * (ROW_H + ROW_GAP); });
  const sorted = new Array(EMAILS.length), heads = {};
  let y = 0;
  CAT_ORDER.forEach((cat, g) => {
    if (g) y += GROUP_GAP;
    heads[cat] = y; y += GH_H;
    EMAILS.forEach((e, i) => { if (e.cat === cat) { if (y > heads[cat] + GH_H) y += ROW_GAP; sorted[i] = y; y += ROW_H; } });
  });
  const s0 = (viewH - y) / 2;
  EMAILS.forEach((_, i) => { sorted[i] += s0; });
  Object.keys(heads).forEach((k) => { heads[k] += s0; });
  return { unsorted, sorted, heads };
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.grow = T.card + CARD_IN + GROW_AT;
    T.full = T.grow + GROW;
    // the tags land top to bottom in the inbox's own order
    T.tag = new Array(EMAILS.length);
    INBOX_ORDER.forEach((ei, j) => { T.tag[ei] = T.full + TAG_AT + j * TAG_STAGGER; });
    T.sort0 = T.full + TAG_AT + (EMAILS.length - 1) * TAG_STAGGER + TAG_IN + SORT_AT;
    T.sort1 = T.sort0 + SORT;
    T.status = T.sort1 - 0.1;
    T.shrink = T.sort1 + HOLD;
    T.small = T.shrink + GROW;
    T.end = Math.max(T.small, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el('<div class="ib-card"><div class="ib-shot"></div></div>');
    const shot = card.firstElementChild;
    const tag = (cat) => `<span class="ib-tag" style="--k: ${CATS[cat].c}"><i></i>${esc(CATS[cat].label)}</span>`;
    const row = (e, i) => `<div class="ib-row" data-i="${i}"><span class="ib-av" style="--c: ${e.c}">${esc(e.sender[0])}</span>
        <div class="ib-main"><div class="ib-l1"><b class="ib-snd">${esc(e.sender)}</b><span class="ib-br">${esc(e.brand)}</span></div>
          <div class="ib-ln">${esc(e.line)}</div></div>${tag(e.cat)}</div>`;
    const head = (cat) => `<div class="ib-gh" data-cat="${cat}" style="--k: ${CATS[cat].c}"><i></i><b>${esc(CATS[cat].label)}</b><span>${CATS[cat].count}</span></div>`;
    const layer = x.el(`<div class="ib-full" aria-hidden="true"><div class="ib-app">
      <header class="ib-hd"><span class="ib-mk"><img src="${x.brand('gemini-logo.svg')}" alt=""/></span><b>${esc(INBOX_TITLE)}</b><span class="ib-who">${esc(CREATOR)}</span></header>
      <div class="ib-view">${CAT_ORDER.map(head).join('')}${EMAILS.map(row).join('')}</div>
      <div class="ib-status"><span class="ib-s0"><i class="ib-spin"></i><span>${esc(SORTING)}</span></span><span class="ib-s1">${OK}<span>${esc(SORTED)}</span></span></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const rows = [...layer.querySelectorAll('.ib-row')].map((n) => ({ n, tag: n.querySelector('.ib-tag') }));
    const heads = Object.fromEntries([...layer.querySelectorAll('.ib-gh')].map((n) => [n.dataset.cat, n]));
    const s0 = layer.querySelector('.ib-s0'), s1 = layer.querySelector('.ib-s1'), spin = layer.querySelector('.ib-spin');
    if (document.fonts && document.fonts.load) ['400', '500', '600', '700'].forEach((w) => document.fonts.load(`${w} 40px "GSF"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1, geo = '', feed = null, L = null;
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
      L = layouts(AH - HEAD - LANE);
    };

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
        if (!L) return;

        // the regroup: every row travels from its inbox slot to its slot under its group (FLIP, outCubic)
        const f = outCubic(seg(t, T.sort0, T.sort1));
        rows.forEach((o, i) => {
          o.n.style.transform = `translateY(${lerp(L.unsorted[i], L.sorted[i], f).toFixed(2)}px)`;
          const q = outCubic(seg(t, T.tag[i], T.tag[i] + TAG_IN));
          o.tag.style.opacity = q.toFixed(3);
          o.tag.style.transform = q >= 1 ? 'none' : `translateX(${((1 - q) * 14).toFixed(2)}px)`;
        });
        const h = outCubic(seg(t, T.sort0 + SORT * 0.4, T.sort0 + SORT * 0.4 + HEAD_IN));
        Object.entries(heads).forEach(([cat, n]) => {
          n.style.opacity = h.toFixed(3);
          n.style.transform = `translateY(${(L.heads[cat] + (1 - h) * 10).toFixed(2)}px)`;
        });
        // the status lane: the spinner while Gemini sorts, the check once the groups are in
        const st = outCubic(seg(t, T.status, T.status + STATUS_IN));
        s0.style.opacity = (1 - st).toFixed(3);
        s1.style.opacity = st.toFixed(3);
        s1.style.transform = st >= 1 ? 'translate(-50%, 0)' : `translate(-50%, ${((1 - st) * 10).toFixed(2)}px)`;
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
      },
      // after the camera: pin the inbox over the card's window, open it to full frame, close it back at the end
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full)) * (1 - inOutCubic(seg(t, T.shrink, T.small)));
        const Lf = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = RADIUS * s * (1 - g);
        layer.style.left = `${Lf.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
