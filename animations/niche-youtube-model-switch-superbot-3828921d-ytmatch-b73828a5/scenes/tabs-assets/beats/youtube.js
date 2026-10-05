// YouTube beat, the finale: superbot does the posting on youtube.com itself, as Sam. Its line streams and a checklist
// card lands in the chat ("Signed in as Sam Rivera", "Opened <the video>") with a mini window under it; the card holds
// and the window opens to full frame (GROW). Full frame is the youtube.com watch page, dark theme, signed in as the
// channel owner, redrawn from the live page (youtube.css carries every measured value; yt-real-icons.js every glyph):
// the masthead with Create, the bell and Sam's avatar; the player, the title, the owner row with Analytics and Edit
// video (what YouTube shows the owner instead of Subscribe), the actions and the description card; the sidebar of
// related videos. The page holds on the top (TOP_HOLD), then scrolls to the comments the way the page does (SCROLL).
// There, superbot works down the list in YouTube's own order: each comment gets Sam's reply (the creator-avatar
// "· 1 reply" row opens under it on its threadline, the header count ticks from 1,284 to 1,289 as YouTube counts
// replies) and Sam's creator heart. Then the ONE bold moment: Priya's question travels to the top and gains "Pinned by
// @samrivera"; once it has settled her thread opens on Sam's reply (creator pill, the 7:05 timestamp as a link), then
// Lena's opens on the arm Gemini heard named at 4:38, so both video answers read on the page. No highlight wash: the
// real page draws none. The final state holds (READ).
//
// There is ONE page, on a layer in the scene root (outside the camera). While the checklist card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The page is laid out once at
// the real page's viewport (the frame divided by the frame's scale: 1536x864 at 1920x1080) and scaled to the layer,
// so the mini window and the full frame are the same pixels at two sizes. On a portrait frame it drops to one column.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { yt } from './yt-real-icons.js?v=b73828a5';
import { VIDEO, SAM, TOTAL, byKey, REPLIES, PIN, OPEN as OPENED, YT_ORDER, SIDEBAR, avatar, linkTimes } from './data.js?v=b73828a5';

const SAY = 'Posting 5 replies, hearting each comment and pinning Priya\'s.';
const STEPS = [
  ['sam', `Signed in as <b>${SAM.name}</b>`],
  ['yt', `Opened <b>${VIDEO.title}</b>`],
];
const SCALE = { wide: 1.25, tall: 1.25 };         // full frame: page px to frame px (1920 / 1536)
const COMMENTS_AT = 80;                           // where the comments header settles in the viewport, as on the real page
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;
const CARD_AT = 0.25;                             // the line streams, then the checklist card lands
const CARD_IN = 0.3;
const CHECK_AT = 0.3;                             // the card landed to the first check
const CHECK_STAGGER = 0.14;
const POP = 0.16;
const CARD_HOLD = 0.2; /* deliberate */           // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */               // the window opens to full frame
const TOP_HOLD = 0.3; /* deliberate */           // full frame on the top of the page (the player and the title) first
const SCROLL = 0.65; /* deliberate */             // the page scrolls down to the comments
const REP_AT = 0.1;                               // scrolled to the first reply landing
const REP_STAGGER = 0.14;                         // one comment to the next, in YouTube's order
const REP_IN = 0.3;                               // the "· 1 reply" row opening on its threadline
const HEART_AT = 0.08;                            // a reply landing to its comment's creator heart
const HEART_IN = 0.22;
const PIN_AT = 0.25; /* deliberate */             // the last heart settled to the pin (the chime)
const MOVE = 0.5;                                 // Priya's thread travelling to the top, its pinned label opening
const OPEN_STAGGER = 0.1;                         // the move settled, then each opened thread in turn (Priya, Lena)
const OPEN = 0.35;                                // a thread opening on Sam's reply
const READ = 2.1; /* deliberate */                // the final state holds, readable, before the scene's fade (+0.3 fade)
const RADIUS = 8;                                 // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// one comment thread. Sam's collapsed reply row and (for the pin) the opened thread with his reply in it
function thread(c, ctx) {
  const pinned = c.key === PIN;
  const opens = OPENED.includes(c.key);
  const toolbar = (likes, heart) => `<div class="yw-tb"><span class="yw-tbtn">${yt('commentLike')}</span>${likes ? `<span class="yw-n">${likes}</span>` : ''}
    <span class="yw-tbtn">${yt('commentDislike')}</span>${heart ? `<span class="yw-hrt"><span class="yw-h0">${yt('heartBorder')}</span>
    <span class="yw-h1"><img src="${SAM.avatar}" alt=""/>${yt('heartBorder', 'yw-hb')}${yt('heartFill', 'yw-hf')}</span></span>` : ''}<span class="yw-reply">Reply</span></div>`;
  const more = `<div class="yw-s0"><i class="yw-con"></i><span class="yw-more"><img src="${SAM.avatar}" alt=""/><i>·</i><span>1 reply</span>${yt('chevronDown')}</span></div>`;
  const open = opens ? `<div class="yw-s1"><i class="yw-cont" style="height: 90px"></i><i class="yw-con" style="height: 24px"></i>
      <div class="yw-ri"><img src="${SAM.avatar}" alt=""/><div class="yw-main">
        <div class="yw-hd"><span class="yw-own-pill">${esc(SAM.handle)}${yt('verified')}</span><span>1 minute ago</span></div>
        <div class="yw-tx">${linkTimes(REPLIES[c.key], esc)}</div>${toolbar('', false)}</div></div>
      <i class="yw-con" style="top: 90px"></i><span class="yw-more yw-hide" style="top: 102px"><span>Hide replies</span>${yt('chevronDown')}</span></div>` : '';
  return `<div class="yw-th" data-k="${c.key}">${avatar(c, 'yw-av')}<i class="yw-line"></i>
    <div class="yw-main">${pinned ? `<div class="yw-pslot"><div class="yw-pinned">${yt('pin')}<span>Pinned by ${esc(SAM.handle)}</span></div></div>` : ''}
      <div class="yw-hd"><b>${esc(c.handle)}</b><span>${esc(c.age)}</span></div>
      <div class="yw-tx">${linkTimes(c.text, esc)}</div>${toolbar(c.likes, true)}</div>
    <div class="yw-sub">${more}${open}</div></div>`;
}

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.s0 = T.full + TOP_HOLD;
    T.s1 = T.s0 + SCROLL;
    T.rep = YT_ORDER.map((_, i) => T.s1 + REP_AT + i * REP_STAGGER);
    T.pin = T.rep[YT_ORDER.length - 1] + HEART_AT + HEART_IN + PIN_AT;
    T.open = OPENED.map((_, i) => T.pin + MOVE + i * OPEN_STAGGER);
    T.settle = T.open[OPENED.length - 1] + OPEN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.pin });

    // ---- the checklist card in the chat ----
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const icon = (kind) => (kind === 'sam' ? `<span class="gk-ic"><img src="${SAM.avatar}" alt=""/></span>`
      : `<span class="gk-ic gk-yt"><img src="${x.brand('youtube-icon.svg')}" alt=""/></span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${icon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${x.OK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.qc-ok') }));

    // ---- the full-frame watch page ----
    const side = SIDEBAR.map((v) => `<div class="yw-it"><span class="yw-tn"><img src="${v.thumb}" alt=""/><i>${v.len}</i></span>
      <div class="yw-im"><b>${esc(v.title)}</b><span>${esc(v.ch)}${v.ver ? yt('channelVerified') : ''}</span><span>${yt('viewsPlay', 'yw-play')}${v.views}<em>${v.age}</em></span></div></div>`).join('');
    const layer = x.el(`<div class="yw-full" aria-hidden="true"><div class="yw-app">
      <header class="yw-mh">
        <span class="yw-ib">${yt('guide')}</span><span class="yw-logo">${yt('logo')}</span>
        <div class="yw-search"><div class="yw-sbox"><span class="yw-sin">Search</span><span class="yw-sbtn">${yt('search')}</span></div><span class="yw-ib yw-mic">${yt('mic')}</span></div>
        <div class="yw-end"><span class="yw-create">${yt('add')}<span>Create</span></span><span class="yw-ib yw-bell">${yt('bell')}<i class="yw-badge">9+</i></span>
          <img class="yw-me" src="${SAM.avatar}" alt=""/></div>
      </header>
      <div class="yw-page"><div class="yw-cols">
        <div class="yw-pri">
          <div class="yw-player"><img src="${VIDEO.frame}" alt=""/></div>
          <h1 class="yw-title">${esc(VIDEO.title)}</h1>
          <div class="yw-own"><img class="yw-oav" src="${SAM.avatar}" alt=""/><div class="yw-oname"><b>${esc(SAM.name)}${yt('channelVerified')}</b><small>${esc(SAM.subs)}</small></div>
            <div class="yw-owb"><span class="yw-pill">Analytics</span><span class="yw-pill">Edit video</span></div>
            <div class="yw-acts"><span class="yw-seg"><span class="yw-pill">${yt('like')}${VIDEO.likes}</span><span class="yw-pill">${yt('dislike')}</span></span>
              <span class="yw-pill">${yt('share')}Share</span><span class="yw-pill">${yt('save')}Save</span><span class="yw-pill yw-round">${yt('more')}</span></div></div>
          <div class="yw-desc"><div><b>${VIDEO.views}</b><b>${VIDEO.age}</b></div><p>${linkTimes(VIDEO.desc, esc)}<br/>Gear list and timestamps below. <u>...more</u></p></div>
          <div class="yw-cm">
            <div class="yw-ch"><h2>${TOTAL.toLocaleString('en-US')} Comments</h2><span class="yw-sort">${yt('sort')}Sort by</span></div>
            <div class="yw-add"><img src="${SAM.avatar}" alt=""/><span>Add a comment...</span></div>
            <div class="yw-list">${YT_ORDER.map((key) => thread(byKey[key], x)).join('')}</div>
          </div>
        </div>
        <div class="yw-sec">${side}</div>
      </div></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const page = $('.yw-page'), head = $('.yw-ch'), count = head.querySelector('h2');
    const ths = [...layer.querySelectorAll('.yw-th')].map((n) => ({
      n, k: n.dataset.k, line: n.querySelector('.yw-line'), sub: n.querySelector('.yw-sub'), s0: n.querySelector('.yw-s0'), s1: n.querySelector('.yw-s1'),
      main: n.querySelector(':scope > .yw-main'), h0: n.querySelector('.yw-h0'), h1: n.querySelector('.yw-h1'), hrt: n.querySelector('.yw-hrt'),
      o: OPENED.indexOf(n.dataset.k),
    }));
    const pinIdx = ths.findIndex((h) => h.k === PIN);
    const pinT = ths[pinIdx];
    const pslot = $('.yw-pslot'), pinned = $('.yw-pinned');
    // Roboto is vendored (youtube.css): ask for every weight up front so a seek never measures in the fallback face
    if (document.fonts && document.fonts.load) ['400', '500', '700', '900'].forEach((w) => document.fonts.load(`${w} 14px "Roboto YT"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, counted = '';
    let AW = 1536, AH = 864;
    const OPEN_H = 142, MORE_H = 52;                // the sub-thread: "· 1 reply" (52), opened on Sam's reply + Hide (142)

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? SCALE.tall : SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('yw-narrow', AW < 1000);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const li = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // each comment, in YouTube's order: Sam's reply row opens on its threadline, then his heart lands
        ths.forEach((h, i) => {
          const g = outCubic(seg(t, T.rep[i], T.rep[i] + REP_IN));
          // an opened thread: the "· 1 reply" row is gone in the first 30% of the open (no ghost under the reply),
          // Sam's reply and Hide replies fade up over the rest while the slot grows
          const a = h.o < 0 ? 1e9 : T.open[h.o];       // a thread that never opens (finite: seg() of Infinity is NaN)
          const op = inOutCubic(seg(t, a, a + OPEN));
          h.sub.style.height = `${(MORE_H * g + (OPEN_H - MORE_H) * op).toFixed(2)}px`;
          h.s0.style.opacity = ((1 - seg(t, a, a + OPEN * 0.3)) * outCubic(seg(t, T.rep[i] + REP_IN * 0.3, T.rep[i] + REP_IN))).toFixed(3);
          if (h.s1) h.s1.style.opacity = outCubic(seg(t, a + OPEN * 0.3, a + OPEN)).toFixed(3);
          h.line.style.opacity = g.toFixed(3);
          h.line.style.height = `${Math.max(0, h.main.offsetHeight - 40).toFixed(2)}px`;
          const hp = outCubic(seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          h.h1.style.opacity = hp.toFixed(3);
          h.h0.style.opacity = (1 - hp).toFixed(3);
          const pop = Math.sin(Math.PI * seg(t, T.rep[i] + HEART_AT, T.rep[i] + HEART_AT + HEART_IN));
          h.hrt.style.transform = pop > 0 ? `scale(${(1 + 0.2 * pop).toFixed(4)})` : 'none';
        });

        // the pin: Priya's label slot opens and her thread travels to the top while the ones above it step down
        const m = inOutCubic(seg(t, T.pin, T.pin + MOVE));
        pslot.style.height = `${(pinned.offsetHeight + 8) * m}px`;
        pinned.style.opacity = outCubic(seg(t, T.pin + MOVE * 0.4, T.pin + MOVE)).toFixed(3);
        const above = ths.slice(0, pinIdx);
        const gap = 16;
        const upBy = above.reduce((s, h) => s + h.n.offsetHeight + gap, 0);
        const downBy = pinT.n.offsetHeight + gap;
        pinT.n.style.transform = m > 0 ? `translateY(${(-upBy * m).toFixed(2)}px)` : 'none';
        pinT.n.style.zIndex = m > 0 && m < 1 ? '2' : '';
        above.forEach((h) => { h.n.style.transform = m > 0 ? `translateY(${(downBy * m).toFixed(2)}px)` : 'none'; });
        // YouTube counts replies in the header: each of Sam's five lands as +1
        const c = `${(TOTAL + T.rep.filter((r) => t >= r + REP_IN * 0.5).length).toLocaleString('en-US')} Comments`;
        if (c !== counted) { count.textContent = c; counted = c; }

        // the scroll: from the top of the page to the comments header resting where the real page puts it
        const target = Math.max(0, head.offsetTop + head.offsetParent.offsetTop - (COMMENTS_AT - 56));
        const sp = inOutCubic(seg(t, T.s0, T.s1));
        page.style.transform = `translateY(${(-target * sp).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
