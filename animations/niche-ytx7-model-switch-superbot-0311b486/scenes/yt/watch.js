// scenes/yt/watch.js: the public YouTube desktop watch page (light theme, signed-out viewer) for Sam's mic video,
// rebuilt as layered DOM after the 2026-10-03 youtube.com captures (UX-B). Pure DOM builder: no timers, no
// transitions; the motion unit drives every moving pixel through the returned refs or the helpers below.
//
// The page is laid out at YouTube's own CSS px in a 1130 x 572.5 viewport (.ytw-page) and scaled by `scale`
// (default 1.6) to fill buildFrame's 1808 x 916 screen, so 14 px body text renders at 22.4 px.
//
// API
//   buildWatchPage(root, { state = 'initial', scale = 1.6, time = 278 }) -> refs   (pass state: 'final' for the end state)
//   applyFinal(refs)   = refs.setState('final') (the dev/ux/preview.html convention: build initial, then reveal)
//     root   the box to fill (buildFrame(...).screen); the page is appended to it
//     state  'final': Priya pinned on top ("Pinned by Sam Rivera"), creator hearts on the 5 top comments, Sam's replies
//            expanded under Priya and Lena, "1 reply" toggles under Marco, Dee and Tom
//            'initial': before superbot acts: Studio order (Priya third), no pin label, no hearts, no replies or toggles
//     time   playback position in seconds (default 4:38); the duration is 14:32
//   refs = { el, page, scroller, playerImg, progressFill, progressDot, timeCur, timeDur, title, channelRow, comments,
//            pinnedComment, pinLabel, heart, replyEl, replyText,
//            lenaThread, lenaHeart, lenaReplyEl, lenaReplyText, bufferFill, chapterTitle, scale, viewH,
//            setTime(sec), scrollTo(y), setScroll(nativePx), anchors(), setState(state), ready }
//     scroller        the vertical layer under the masthead; translate it (design px) or call scrollTo(y)
//     progressFill    the played (red) clip: width in px of the bar (setTime does it); progressDot: left in px
//     timeCur/timeDur the "4:38" and "14:32" spans of the time pill
//     pinnedComment   Priya's thread (first, pinned); pinLabel the "Pinned by Sam Rivera" row; heart her creator heart
//     replyEl/replyText  Sam's reply under Priya (owner pill, no timestamp) and its text node
//     anchors()       { player, playerBottom, title, comments, pinned, reply, lena } y offsets inside the scroller
//     viewH           the visible scroller height in design px (572.5 - 56 masthead)
//     ready           promise: stylesheet + fonts + every image decoded
import { esc } from '../../lib.js';
import { CREATOR, VIDEO, COMMENT_BY_ID, REPLIES, PINNED_ID, PIN_LABEL, PINNED_ORDER, ALL_COMMENTS } from './content.js';
import { ensureCss, cssUrl } from './frame.js';
import { I, mastheadHtml, GUEST_AVATAR } from './watch-icons.js';
import { DURATION, CHAPTERS, CHIPS, DESC, RAIL, fmt, chapterAt, playerHtml, threadHtml, railItemHtml } from './watch-parts.js';

export const DESIGN = { w: 1808, h: 916 }; // buildFrame's screen
const MAST = 56;

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

export function buildWatchPage(root, { state = 'initial', scale = 1.6, time = 278 } = {}) {
  const cssP = ensureCss(cssUrl('watch.css'));
  const W = DESIGN.w / scale, H = DESIGN.h / scale;
  const primaryW = W - 16 * 3 - 402;          // page padding 16, column gap 16, rail 402
  const barW = primaryW - 24;                  // the progress bar spans the player minus 12 px each side

  // DOM order is the final (pinned) order; setState('initial') moves Priya back to her Studio slot (after Marco)
  const TOP = new Set(PINNED_ORDER);
  const threads = [...PINNED_ORDER, ...ALL_COMMENTS.map((c) => c.id).filter((id) => !TOP.has(id))].map((id) =>
    threadHtml(COMMENT_BY_ID[id], {
      pinned: id === PINNED_ID, heart: TOP.has(id), replies: REPLIES[id] ? 1 : 0,
      replyText: id === PINNED_ID || id === 'lena' ? REPLIES[id] : '',
    })).join('');

  const el = h(`<div class="ytw-root"><div class="ytw-page" style="width:${W}px;height:${H}px;transform:scale(${scale})">
    ${mastheadHtml(null)}
    <div class="ytw-view"><div class="ytw-scroller"><div class="ytw-cols">
      <div class="ytw-primary">
        <div class="ytw-player">${playerHtml(barW)}</div>
        <h1 class="ytw-title">${esc(VIDEO.title)}</h1>
        <div class="ytw-toprow">
          <div class="ytw-owner"><img src="${esc(CREATOR.avatar)}" alt=""><div><div class="ytw-oname">${esc(CREATOR.name)}</div><div class="ytw-osubs">${esc(CREATOR.subscribers)}</div></div>
            <span class="ytw-sub">Subscribe</span></div>
          <div class="ytw-actions">
            <span class="ytw-seg"><span>${I.like}4.2K</span><span class="ytw-vr"></span><span>${I.dislike}</span></span>
            <span class="ytw-seg"><span>${I.share}Share</span></span>
            <span class="ytw-seg"><span>${I.save}Save</span></span>
            <span class="ytw-icbtn">${I.more}</span>
          </div>
        </div>
        <div class="ytw-desc"><b>${esc(VIDEO.views)}&nbsp;&nbsp;${esc(VIDEO.published)}</b><span class="ytw-tags">${esc(DESC.tags)}</span><br>
          ${DESC.lines.map(esc).join('<br>')} <span class="ytw-more">...more</span></div>
        <div class="ytw-cmts">
          <div class="ytw-chead"><span class="ytw-count">${esc(VIDEO.commentCount)} Comments</span><span class="ytw-sortby">${I.sort}Sort by</span></div>
          <div class="ytw-addc"><span class="ytw-gav" style="width:40px;height:40px;flex:none">${GUEST_AVATAR}</span><span>Add a comment...</span></div>
          <div class="ytw-list">${threads}</div>
        </div>
      </div>
      <div class="ytw-secondary">
        <div class="ytw-chips">${CHIPS.map((c, i) => `<span class="ytw-chip${i ? '' : ' ytw-on'}">${esc(c)}</span>`).join('')}</div>
        ${RAIL.map(railItemHtml).join('')}
      </div>
    </div></div></div>
  </div></div>`);
  root.appendChild(el);

  const q = (s, from = el) => from.querySelector(s);
  const page = q('.ytw-page');
  const scroller = q('.ytw-scroller');
  const pinnedComment = q(`.ytw-thread[data-id="${PINNED_ID}"]`);
  const lenaThread = q('.ytw-thread[data-id="lena"]');
  const pinLabel = q('.ytw-pin', pinnedComment);
  q('.ytw-pinlabel', pinnedComment).textContent = PIN_LABEL;
  const fill = q('.ytw-fill'), buf = q('.ytw-buf'), dot = q('.ytw-dot');
  const timeCur = q('.ytw-cur'), timeDur = q('.ytw-tdur'), chapterTitle = q('.ytw-chapt');

  const refs = {
    el, page, scroller,
    playerImg: q('.ytw-frame'),
    progressFill: fill, bufferFill: buf, progressDot: dot, timeCur, timeDur, chapterTitle,
    title: q('.ytw-title'),
    channelRow: q('.ytw-toprow'),
    comments: q('.ytw-cmts'),
    pinnedComment, pinLabel,
    heart: q('.ytw-heart', pinnedComment),
    replyEl: q('.ytw-r', pinnedComment),
    replyText: q('.ytw-rtext', pinnedComment),
    lenaThread,
    lenaHeart: q('.ytw-heart', lenaThread),
    lenaReplyEl: q('.ytw-r', lenaThread),
    lenaReplyText: q('.ytw-rtext', lenaThread),
    scale, barW, duration: DURATION, chapters: CHAPTERS,
    viewH: H - MAST,
    /** setTime(sec): played clip, buffered clip (+38 s ahead), scrubber, time text and chapter name */
    setTime(sec) {
      const s = Math.max(0, Math.min(DURATION, sec));
      const px = (barW * s) / DURATION;
      fill.style.width = `${px.toFixed(2)}px`;
      buf.style.width = `${((barW * Math.min(DURATION, s + 38)) / DURATION).toFixed(2)}px`;
      dot.style.left = `${px.toFixed(2)}px`;
      timeCur.textContent = fmt(s);
      chapterTitle.textContent = chapterAt(s);
    },
    /** scrollTo(y): translate the scroller up by y design px (the masthead stays) */
    scrollTo(y) { scroller.style.transform = `translate3d(0, ${(-y).toFixed(2)}px, 0)`; },
    /** setScroll(px): the harness's scroll, in screen (native) px */
    setScroll(px) { this.scrollTo(px / scale); },
    /** anchors(): y offsets (design px) inside the scroller, read from layout at call time */
    anchors() {
      const top = (n) => { let y = 0; for (let e = n; e && e !== scroller; e = e.offsetParent) y += e.offsetTop; return y; };
      const player = q('.ytw-player');
      return {
        player: top(player), playerBottom: top(player) + player.offsetHeight,
        title: top(refs.title), comments: top(refs.comments), pinned: top(pinnedComment),
        reply: top(refs.replyEl), lena: top(lenaThread), viewH: refs.viewH,
      };
    },
    /** setState('initial' | 'final') */
    setState(s) {
      const d = s === 'initial' ? 'none' : '';
      pinLabel.style.display = d;
      for (const n of el.querySelectorAll('.ytw-heart, .ytw-toggle, .ytw-replies, .ytw-line')) n.style.display = d;
      // initial: the Studio "Top comments" order (lena marco priya dee tom ...); final: Priya pinned on top
      const list = q('.ytw-list'), marco = q('.ytw-thread[data-id="marco"]');
      if (s === 'initial') list.insertBefore(pinnedComment, marco ? marco.nextSibling : null);
      else list.insertBefore(pinnedComment, list.firstChild);
    },
  };
  refs.setTime(time);
  refs.setState(state);
  const imgs = [...el.querySelectorAll('img')];
  refs.ready = Promise.all([
    cssP,
    document.fonts ? document.fonts.ready : Promise.resolve(),
    ...imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : Promise.resolve())),
  ]).then(() => refs);
  return refs;
}

/** reveal the end state on a page built with the default (initial) state */
export function applyFinal(refs) { refs.setState('final'); }

export default buildWatchPage;
