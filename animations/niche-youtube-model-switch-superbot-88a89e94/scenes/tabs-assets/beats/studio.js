// Studio beat: where the job lands. The replies post through the YouTube Data API (comments.insert, the one scope the
// connect beat asked for). Hearts and pins have no Data API method, so superbot does those by hand in YouTube Studio,
// on the video's OWN Comments page: YouTube Help (support.google.com/youtube/answer/9482367, fetched 2026-10-06) says
// Pin "only appears when viewing comments for an individual video", under More, then Pin again to confirm.
//
// The chat streams one line saying exactly that, a window card opens, and the ONE Studio client (a layer outside the
// hub, laid out at a laptop's 1280 px) rides pinned to that card, then eases out to fill the frame. On the page:
//   1. the four replies arrive under their comments while the list glides down to the last one
//   2. the pointer hearts them bottom to top as the list glides back up
//   3. More on Priya's comment > Pin > "Pin this comment?" > Pin, and the "Pinned by" line opens on her comment
// Pure function of t. The layer measures the chat card, so it is placed in after(t), once the camera is set.
import { lerp, seg, clamp, outQuart, inOutQuart, inOutSine, press, arcPath, rise, streamCount, esc } from '../../../lib.js';
import { ms } from './yt-icons.js?v=88a89e94';
import { ACCOUNT, VIDEO, COMMENTS, REPLY, PINNED } from './data.js?v=88a89e94';

const LINE = "Replies post through the YouTube API. Hearts and pins have no API, so I'll do those in Studio.";
const LINE_CPS = 110;
const WIN_AT = 0.1, WIN_IN = 0.45;
const MINI = 0.55;        // the window card read at chat size before it grows
const GROW = 0.85;        // card to full frame (inOutQuart)
const REP_AT = 0.15, REP_STEP = 0.32, REP_OPEN = 0.5;
const PTR_AT = 0.45;      // last reply landed to the pointer entering
const HEART_AT = 0.5, HEART_STEP = 0.42;
const MORE_AT = 0.45;     // the last heart to the click on More
const ITEM_AT = 0.5;      // More clicked to Pin clicked in the menu
const DLG_AT = 0.16, DLG_IN = 0.36; // the menu is gone before the dialog starts: one surface at a time
const OK_AT = 0.72;       // the dialog in to the click on its Pin
const PINNED_AT = 0.2, PIN_OPEN = 0.5;
const HOLD = 1.2;         // the pinned comment read to the beat's end

export default {
  times(r) {
    const T = { r };
    T.line = r + 0.05;
    T.lineEnd = T.line + LINE.length / LINE_CPS;
    T.win = T.lineEnd + WIN_AT;
    T.grow = T.win + WIN_IN + MINI;
    T.full = T.grow + GROW;
    T.rep = COMMENTS.map((_, i) => T.full + REP_AT + i * REP_STEP);
    T.down = [T.full + 0.4, T.rep[3] + REP_OPEN];
    T.ptr = T.rep[3] + REP_OPEN + PTR_AT - 0.35;
    T.heart = [];
    for (let j = 0; j < COMMENTS.length; j++) T.heart[COMMENTS.length - 1 - j] = T.ptr + HEART_AT + j * HEART_STEP;
    T.up = [T.heart[3] + 0.08, T.heart[1] + 0.1];
    T.more = T.heart[0] + MORE_AT;
    T.item = T.more + ITEM_AT;
    T.dlg = T.item + DLG_AT;
    T.ok = T.dlg + OK_AT;
    T.pinned = T.ok + PINNED_AT;
    T.end = T.pinned + PIN_OPEN + HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the full line sits invisible under the stream, so its wrap never jumps the thread
    const line = x.el(`<p class="st-line"><span class="st-ghost">${esc(LINE)}</span><span class="st-live"></span></p>`);
    const live = line.lastElementChild;
    const win = x.el(`<div class="st-win"><span class="st-url">studio.youtube.com</span><span class="st-hole"></span></div>`);
    const hole = win.querySelector('.st-hole');

    const nav = [['edit-outline', 'Details'], ['analytics-outline', 'Analytics'], ['movie-outline', 'Editor'], ['comment', 'Comments', 1],
      ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'], ['attach-money', 'Earn'], ['content-cut', 'Clips']];
    const row = (c, i) => `<div class="st-c${i === PINNED ? ' st-pick' : ''}">
      <img class="st-av" src="${x.img(c.av)}" alt=""/>
      <div class="st-cm">
        ${i === PINNED ? `<div class="st-pinwrap"><div class="st-clip"><div class="st-pinned">${ms('keep-outline')}Pinned by ${esc(ACCOUNT.handle)}</div></div></div>` : ''}
        <div class="st-h"><b>${esc(c.handle)}</b><span>• ${esc(c.ago)}</span></div>
        <div class="st-t">${esc(c.text)}</div>
        <div class="st-a"><span class="st-reply">Reply</span><span class="st-ib">${ms('thumb-up-outline')}</span><em>${c.likes}</em><span class="st-ib">${ms('thumb-down-outline')}</span>
          <span class="st-ib st-heart">${ms('favorite-outline', 'st-h0')}${ms('favorite', 'st-h1')}<img class="st-hav" src="${x.img(ACCOUNT.avatar)}" alt=""/></span></div>
        <div class="st-rs"><div class="st-clip"><div class="st-rin">
          <div class="st-tog">${ms('arrow-drop-down')}1 reply</div>
          <div class="st-r"><img class="st-rav" src="${x.img(ACCOUNT.avatar)}" alt=""/><div><div class="st-h"><b class="st-own">${esc(ACCOUNT.handle)}</b><span>• Just now</span></div><div class="st-t">${esc(REPLY[c.first])}</div></div></div>
        </div></div></div>
      </div>
      <span class="st-ib st-more">${ms('more-vert')}</span>
    </div>`;
    const layer = x.el(`<div class="st-full"><div class="st-app">
      <header class="st-top">
        <span class="st-ib">${ms('menu')}</span><span class="st-logo"><img src="${x.brand('youtube-studio-logo.svg')}" alt=""/></span>
        <span class="st-search">${ms('search')}<span>Search across your channel</span></span>
        <span class="st-tr"><span class="st-ib">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}Create</span><img class="st-me" src="${x.img(ACCOUNT.avatar)}" alt=""/></span>
      </header>
      <div class="st-body">
        <nav class="st-side">
          <div class="st-back">${ms('arrow-back')}Channel content</div>
          <span class="st-vthumb"><img src="${x.img(VIDEO.thumb)}" alt=""/><i>${VIDEO.len}</i></span>
          <div class="st-yv">Your video</div><div class="st-vt">${esc(VIDEO.title)}</div>
          ${nav.map(([ic, l, on]) => `<div class="st-ni${on ? ' st-on' : ''}">${ms(ic)}<span>${l}</span></div>`).join('')}
        </nav>
        <main class="st-main">
          <div class="st-title">Video comments</div>
          <div class="st-tabs"><span class="st-on">Published</span><span>Held</span></div>
          <div class="st-filter">${ms('filter-list')}<span>Filter</span></div>
          <div class="st-list"><div class="st-scroll">${COMMENTS.map(row).join('')}</div></div>
        </main>
      </div>
      <div class="st-menu"><div class="st-mi st-mpin">${ms('keep-outline')}Pin</div><div class="st-mi">${ms('person-off-outline')}Hide user from channel</div><div class="st-mi">${ms('delete-outline')}Remove</div><div class="st-mi">${ms('flag-outline')}Report</div></div>
      <div class="st-scrim"></div>
      <div class="st-dlg"><div class="st-dt">Pin this comment?</div><div class="st-db">If you already pinned a comment, this will replace it.</div>
        <div class="st-dbtn"><span>Cancel</span><span class="st-dpin">Pin</span></div></div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const q = (s) => layer.querySelector(s);
    const qa = (s) => [...layer.querySelectorAll(s)];
    const rows = qa('.st-c');
    const slots = rows.map((r) => r.querySelector('.st-rs'));
    const ins = rows.map((r) => r.querySelector('.st-rin'));
    const hearts = rows.map((r) => r.querySelector('.st-heart'));
    const more = rows[PINNED].querySelector('.st-more');
    const list = q('.st-list'), scroll = q('.st-scroll');
    const menu = q('.st-menu'), mpin = q('.st-mpin');
    const scrim = q('.st-scrim'), dlg = q('.st-dlg'), dpin = q('.st-dpin');
    const pinWrap = rows[PINNED].querySelector('.st-pinwrap'), pinIn = pinWrap.querySelector('.st-pinned');
    const pick = rows[PINNED];
    let lastLine = '', heights = slots.map(() => ''), pinH = '';

    // the layer's own design size: a laptop's Studio (1280 wide) on a landscape frame, narrower on tall frames
    const size = () => {
      const W = x.root.clientWidth, H = x.root.clientHeight;
      const dw = clamp(W / 1.5, 760, 1280);
      return { W, H, dw, dh: (H * dw) / W, s: W / dw };
    };
    let laid = '';
    const layout = () => {
      const z = size();
      const key = `${z.dw}x${z.dh}`;
      if (key !== laid) {
        app.style.width = `${z.dw}px`; app.style.height = `${z.dh}px`;
        hole.style.aspectRatio = `${z.W} / ${z.H}`; // the card's window has the frame's shape, so the grow is a pure scale
        layer.classList.toggle('st-narrow', z.dw < 1000); laid = key;
      }
      return z;
    };

    // live centre of a node in scene px
    const at = (n, fx = 0.5, fy = 0.5) => { const b = x.box(n); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
    const pointer = (t) => {
      if (t < T.ptr || t > T.pinned + 0.6) return null;
      const z = size();
      const keys = [{ t: T.ptr, x: z.W * 0.94, y: z.H * 0.98 }];
      const hit = (tt, n, fx, fy, arc) => { const p = at(n, fx, fy); keys.push({ t: tt - 0.06, x: p.x, y: p.y, arc }, { t: tt + 0.1, x: p.x, y: p.y }); };
      [3, 2, 1, 0].forEach((i) => hit(T.heart[i], hearts[i], 0.5, 0.5, i === 3 ? -60 : 18));
      hit(T.more, more, 0.5, 0.5, -20);
      hit(T.item, mpin, 0.22, 0.55, 14);
      hit(T.ok, dpin, 0.78, 0.8, -30); // low and right of the label, so the pointer never covers "Pin"
      const end = keys[keys.length - 1];
      keys.push({ t: T.pinned + 0.6, x: end.x + 110, y: end.y + 140, arc: 0 });
      const p = arcPath(t, keys);
      const clicks = [...T.heart, T.more, T.item, T.ok];
      const pr = Math.max(...clicks.map((c) => press(t, c)));
      const v = outQuart(seg(t, T.ptr, T.ptr + 0.3)) * (1 - seg(t, T.pinned + 0.15, T.pinned + 0.6));
      return { x: p.x, y: p.y, p: pr, v };
    };

    return {
      nodes: [line, win],
      marks: [[T.line, line], [T.win, win]],
      pointer,
      render(t) {
        layout();
        const n = t < T.line ? 0 : streamCount(LINE, T.line, LINE_CPS, t);
        const html = esc(LINE.slice(0, n));
        if (html !== lastLine) { live.innerHTML = html; lastLine = html; }
        line.style.opacity = t >= T.line ? '1' : '0';
        rise(win, outQuart(seg(t, T.win, T.win + WIN_IN)), 14, 0.98);
        // 1. replies arrive, the list glides down to the last one
        T.rep.forEach((a, i) => {
          const f = inOutQuart(seg(t, a, a + REP_OPEN));
          // one-row grids opened from 0fr to 1fr: exact heights all the way, no snap to auto at the end
          const want = `${f.toFixed(4)}fr`;
          if (want !== heights[i]) { slots[i].style.gridTemplateRows = want; heights[i] = want; }
          ins[i].style.opacity = clamp(f * 1.5).toFixed(3);
        });
        const room = Math.max(0, scroll.offsetHeight - list.clientHeight + 16);
        const y = room * (inOutSine(seg(t, T.down[0], T.down[1])) - inOutSine(seg(t, T.up[0], T.up[1])));
        scroll.style.transform = `translateY(${(-y).toFixed(2)}px)`;
        // 2. hearts: the outline gives way to the filled red heart with Sam's photo, one soft pop each
        hearts.forEach((h, i) => {
          const on = t >= T.heart[i];
          h.classList.toggle('st-hearted', on);
          const pop = Math.sin(Math.PI * seg(t, T.heart[i], T.heart[i] + 0.3));
          h.style.transform = pop > 0 ? `scale(${(1 + 0.22 * pop).toFixed(4)})` : 'none';
        });
        // 3. More > Pin > confirm
        more.classList.toggle('st-hov', t >= T.more - 0.15 && t < T.item);
        const m = outQuart(seg(t, T.more + 0.04, T.more + 0.26)) * (1 - inOutSine(seg(t, T.item + 0.02, T.item + 0.15)));
        const mb = x.box(more), lb = x.box(app), s = lb.w / app.offsetWidth || 1;
        menu.style.left = `${((mb.x - lb.x) / s + mb.w / s - menu.offsetWidth).toFixed(2)}px`;
        menu.style.top = `${((mb.y - lb.y) / s + mb.h / s + 2).toFixed(2)}px`;
        menu.style.opacity = m.toFixed(3);
        menu.style.transform = m >= 1 ? 'none' : `scale(${lerp(0.94, 1, m).toFixed(4)})`;
        mpin.classList.toggle('st-hov', t >= T.item - 0.22);
        const d = outQuart(seg(t, T.dlg, T.dlg + DLG_IN)) * (1 - inOutSine(seg(t, T.ok + 0.05, T.ok + 0.3)));
        // the scrim eases both ends (a full-frame dim that front-loads reads as a flash)
        scrim.style.opacity = (0.4 * inOutSine(seg(t, T.dlg - 0.04, T.dlg + DLG_IN)) * (1 - inOutSine(seg(t, T.ok + 0.05, T.ok + 0.4)))).toFixed(3);
        dlg.style.opacity = d.toFixed(3);
        dlg.style.transform = `translate(-50%, -50%) scale(${lerp(0.96, 1, d).toFixed(4)})`;
        dpin.classList.toggle('st-hov', t >= T.ok - 0.2);
        // the pinned line opens above the handle; the comment washes blue and fades back
        const pf = inOutQuart(seg(t, T.pinned, T.pinned + PIN_OPEN));
        const want = `${pf.toFixed(4)}fr`;
        if (want !== pinH) { pinWrap.style.gridTemplateRows = want; pinH = want; }
        pinIn.style.opacity = clamp(pf * 1.4).toFixed(3);
        const wash = Math.sin(Math.PI * seg(t, T.pinned, T.pinned + 1.4));
        pick.style.background = wash > 0 ? `rgba(6,95,212,${(0.07 * wash).toFixed(4)})` : '';
      },
      after(t) {
        const z = layout();
        if (t < T.win) { layer.style.opacity = '0'; return; }
        const h = x.box(hole);
        const g = inOutQuart(seg(t, T.grow, T.full));
        const s0 = h.w / z.dw;
        const sx = lerp(s0, z.s, g);
        const tx = lerp(h.x, 0, g), ty = lerp(h.y, 0, g);
        layer.style.opacity = win.style.opacity;
        layer.style.width = `${z.dw}px`;
        layer.style.height = `${z.dh}px`;
        layer.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${sx.toFixed(5)})`;
        layer.style.borderRadius = `${(lerp(10, 0, g) / sx).toFixed(2)}px`;
        win.style.visibility = g > 0.02 ? 'hidden' : '';
      },
    };
  },
};
