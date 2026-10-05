// Studio beat, the finale: superbot works Sam Rivera's own YouTube Studio. The "Connecting to YouTube Studio" pill
// checks, and ONE Studio client (light theme, Roboto) opens out of the pill to the full frame: the left menu with
// Community selected, the Published tab, the filter chip "Video: Every Budget Mic I Own, Ranked", sorted Top comments,
// and the thread as Studio lists it (thread.js), each row with Reply, likes, the creator heart and More, the video on the
// right. Over the header band, top right, sits superbot's dark status bar, the connect checklist laid flat: "Connected
// as Sam Rivera", the heart counter, the spam counter and the pin, each with a spinner that resolves to a check.
// Three moves, in Studio's own controls (support.google.com/youtube/answer/9482367):
//   1. hearts: the list scrolls and every real comment's creator heart fills red (with Sam's avatar badge) while the
//      counter races 0 to 3,781; the spam rows DeepSeek flagged get a red wash and "Likely spam" instead;
//   2. hide: More on an impersonator row opens the menu, "Hide user from channel" is hit, every spam row collapses out
//      of the list and the counter climbs to 131 hidden;
//   3. pin: the list scrolls back up, More on @ruthiecasts' comment, "Pin", her row rises to the top with "Pinned by
//      Sam Rivera" and the snackbar "Comment pinned" (the deeper tick in sound.js), and the final state holds (READ).
// The client is laid out once at a design size (the frame / APP_SCALE) and scaled to the layer, so the opening and the
// full frame are the same pixels at two sizes. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, outBack, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=c4c1b10f';
import { CHANNEL, VIDEO, REAL, SPAM, ROWS, FAV, fmt } from './thread.js?v=c4c1b10f';

const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community', true], ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
// the comment's More menu, in Studio's labels; the two superbot hits are Pin and Hide user from channel
const MENU = [['keep-outline', 'Pin'], ['delete-outline', 'Remove'], ['flag-outline', 'Report'], ['block', 'Hide user from channel']];
const SNACK = 'Comment pinned';
const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';
const ME = CHANNEL[0];
const FAV_I = ROWS.findIndex((r) => r.handle === FAV);
// the impersonator row whose menu superbot opens: the last one on screen once the list has scrolled
const HIDE_I = ROWS.map((r, i) => (r.spam === 'imp' ? i : -1)).filter((i) => i >= 0).pop();

const APP_SCALE = 1.1;                  // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the step named)
const GROW = 0.3; /* deliberate */      // the window opens out of the pill to the full frame
const OPEN_W = 420;                     // the window's width (frame px) as it leaves the pill
const BAR_AT = -0.06;                   // full frame to the status bar landing
const BAR_IN = 0.18;
const OK0 = 0.08;                       // full frame to "Connected as"
const HEART_AT = 0.14;                  // full frame to the first heart
const HEART_DUR = 1.42; /* deliberate */ // the counter races 0 to 3,781 while the list scrolls the thread past
const ROW_STEP = (HEART_DUR - 0.2) / (ROWS.length - 1); // one row's heart (or spam flag) to the next
const POP = 0.16;                       // a heart filling (outBack)
const SCROLL_AT = 0.26, SCROLL_END = 0.08; // the scroll starts this far into the hearts, settles this far before they end
const MENU_IN = 0.12, MENU_HIT = 0.2, MENU_PRESS = 0.26, MENU_OUT = 0.34; // a menu opening, its item lit, pressed, closed
const HIDE_MENU = -0.14;                // the hearts ending to the hide menu opening
const COLLAPSE = 0.3, COLLAPSE_STEP = 0.035; // each spam row folding out of the list
const UP = 0.3;                         // the list scrolling back to the top for the pin
const PIN_MENU = 0.2;                   // the scroll starting to the pin menu opening
const MOVE = 0.42; /* deliberate */     // her row rising to the top, the pinned label opening
const SNACK_AT = 0.18, SNACK_IN = 0.2;  // the move starting to the snackbar
const OK_PIN = 0.3;                     // the move starting to the pin's check
const READ = 0.46; /* deliberate */     // the final state holds before the scene's fade
const RADIUS = 12;                      // the window's radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="sb-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// the racing counter: fast from the first frame, easing into the total
const race = (p) => lerp(p, outCubic(p), 0.55);

export default {
  times(r) {
    const T = { r };
    T.g0 = r - 0.02;
    T.full = T.g0 + GROW;
    T.bar = T.full + BAR_AT;
    T.h0 = T.full + HEART_AT;
    T.h1 = T.h0 + HEART_DUR;
    T.row = ROWS.map((_, i) => T.h0 + 0.06 + i * ROW_STEP);
    T.hideMenu = T.h1 + HIDE_MENU;
    T.hideHit = T.hideMenu + MENU_PRESS;
    T.fold = ROWS.map((rw, i) => (rw.spam ? T.hideHit + 0.06 + ROWS.slice(0, i).filter((x) => x.spam).length * COLLAPSE_STEP : null));
    T.foldEnd = Math.max(...T.fold.filter((v) => v != null)) + COLLAPSE;
    T.up = T.foldEnd - 0.1;
    T.pinMenu = T.up + PIN_MENU;
    T.pinHit = T.pinMenu + MENU_PRESS;
    T.move = T.pinMenu + MENU_OUT - 0.02;
    T.snack = T.move + SNACK_AT;
    T.ok = [T.full + OK0, T.h1 + 0.02, T.foldEnd + 0.02, T.move + OK_PIN];
    T.end = T.ok[3] + 0.16 + READ;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { studio: {
      g0: T.g0, full: T.full, h0: T.h0, h1: T.h1, hearts: T.row.filter((_, i) => !ROWS[i].spam).map((v) => v + POP * 0.35),
      flags: T.row.filter((_, i) => ROWS[i].spam), hideHit: T.hideHit, fold: T.hideHit + 0.06, pinHit: T.pinHit, move: T.move, snack: T.snack, ok: T.ok,
    } });
    return T;
  },
  build(k, x) {
    const T = k.T;
    // this step's pill (chat.js adds it just before the reply that carries this beat): the window opens out of it
    const pills = x.hub.querySelectorAll('.qc-sw');
    const pill = pills[pills.length - 1];
    const say = x.el(`<div class="qc-say"><span class="qc-vis">Working your comments as ${esc(CHANNEL)}.</span></div>`);

    const av = (rw) => (rw.spam === 'imp'
      ? `<span class="st-av" style="--c:var(--yt-me)">${ME}</span>`
      : `<span class="st-av" style="--c:${rw.c}">${esc(rw.handle[0].toUpperCase())}</span>`);
    const text = (rw) => esc(rw.text).replace(/(coinvault-x9\.io)/, '<span class="hs-link">$1</span>');
    const block = (rw, i) => `<div class="st-blk ${rw.spam ? 'hs-spam' : 'hs-heart'}" data-i="${i}"><i class="st-wash"></i><i class="st-wash hs-pw"></i>
        <div class="st-cm">${av(rw)}
          <div class="st-body">
            ${i === FAV_I ? `<div class="st-pslot"><div class="st-pinned">${ms('keep', 'st-pi')}<span>Pinned by ${esc(CHANNEL)}</span></div></div>` : ''}
            <div class="st-meta"><b>@${esc(rw.handle)}</b><span> • ${esc(rw.at)}</span>${rw.spam ? '<em class="hs-flag">Likely spam</em>' : ''}</div>
            <div class="st-text">${text(rw)}</div>
            <div class="st-acts"><span class="st-rb">Reply</span>
              <span class="st-ib">${ms('thumb-up-outline')}</span><span class="st-n">${rw.likes === '0' ? '' : rw.likes}</span><span class="st-ib">${ms('thumb-down-outline')}</span>
              <span class="st-ib st-hb"><i class="hs-ring"></i><span class="st-hrt">${ms('favorite-outline', 'st-hf0')}${ms('favorite', 'st-hf1')}<i class="st-hav">${ME}</i></span></span>
              <span class="st-ib hs-more">${ms('more-vert')}</span></div>
          </div>
          <div class="st-vid"><img src="${x.img(VIDEO.thumb)}" width="1280" height="720" alt=""/><span>${esc(VIDEO.title)}</span></div>
        </div></div>`;
    const menu = () => `<div class="hs-menu">${MENU.map(([ic, l]) => `<div class="hs-mi"><i class="hs-hl"></i>${ms(ic)}<span>${l}</span></div>`).join('')}</div>`;
    const step = (ic, html) => `<span class="sb-step">${ic}<span class="sb-tx">${html}</span><span class="sb-ok"><i class="sb-spin"></i>${CHECK}</span></span>`;
    const layer = x.el(`<div class="st-full hs-full" aria-hidden="true"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${x.brand('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        <span class="st-me">${ME}</span>
      </header>
      <div class="st-main">
        <nav class="st-nav">
          <div class="st-chan"><span class="st-big">${ME}</span><b>Your channel</b><small>${esc(CHANNEL)}</small></div>
          ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
          <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
        </nav>
        <section class="st-page">
          <h1 class="st-h1">Community</h1>
          <div class="st-tabs"><span class="st-tab st-tab-on">Published</span><span class="st-tab">Held</span></div>
          <div class="st-filter">${ms('filter-list')}<span class="st-chip">Video: ${esc(VIDEO.title)}</span>
            <span class="st-sort">${ms('sort')}<span>Top comments</span>${ms('arrow-drop-down')}</span></div>
          <div class="st-list"><div class="hs-track">${ROWS.map(block).join('')}</div></div>
        </section>
      </div>
      ${menu()}${menu()}
      <div class="st-snack">${esc(SNACK)}</div>
      <div class="hs-badge"><div class="hs-bl hs-bl-h"><span class="hs-bi">${ms('favorite')}</span><b class="hs-bn">0</b><span class="hs-bt">hearted</span></div>
        <div class="hs-bl hs-bl-s"><span class="hs-bi hs-bi-s">${ms('block')}</span><b class="hs-bn">0</b><span class="hs-bt">spam users hidden</span></div>
        <div class="hs-bl hs-bl-p"><span class="hs-bi hs-bi-p">${ms('keep')}</span><span class="hs-bt">Pinned</span><b class="hs-bh">@${esc(FAV)}</b></div></div>
      <div class="sb-bar">
        <span class="sb-tile">${SB_MARK}</span>
        ${step(`<span class="sb-av">${ME}</span>`, `Connected as <b>${esc(CHANNEL)}</b>`)}
        ${step(`<span class="hs-hc">${ms('favorite')}</span>`, '<b class="sb-cnt hs-hn">0</b> hearted')}
        ${step(`<span class="hs-bc">${ms('block')}</span>`, '<b class="sb-cnt hs-sn">0</b> spam users hidden')}
        ${step(`<span class="hs-pc">${ms('keep')}</span>`, `<span class="hs-dim">Pinned</span> <b>@${esc(FAV)}</b>`)}
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const list = $('.st-list'), track = $('.hs-track');
    const rows = [...layer.querySelectorAll('.st-blk')].map((n, i) => ({
      n, rw: ROWS[i], wash: n.querySelector('.st-wash'), pw: n.querySelector('.hs-pw'), flag: n.querySelector('.hs-flag'),
      h0: n.querySelector('.st-hf0'), h1: n.querySelector('.st-hf1'), hav: n.querySelector('.st-hav'), hrt: n.querySelector('.st-hrt'),
      ring: n.querySelector('.hs-ring'), more: n.querySelector('.hs-more'), h: 0,
    }));
    const fav = rows[FAV_I];
    const pslot = $('.st-pslot'), pinned = $('.st-pinned');
    const [mHide, mPin] = [...layer.querySelectorAll('.hs-menu')];
    const snack = $('.st-snack');
    // the heart counter badge: superbot's own overlay, bottom right of the list, the counter big enough to read on a phone
    const badge = $('.hs-badge'), bh = $('.hs-bl-h'), bs = $('.hs-bl-s'), bp = $('.hs-bl-p');
    const bhn = bh.querySelector('.hs-bn'), bsn = bs.querySelector('.hs-bn'), bhi = bh.querySelector('.hs-bi');
    const heartTimes = T.row.filter((_, i) => !ROWS[i].spam);
    const bar = $('.sb-bar'), hn = $('.hs-hn'), sn = $('.hs-sn');
    const oks = [...layer.querySelectorAll('.sb-ok')].map((n) => ({ spin: n.querySelector('.sb-spin'), ck: n.querySelector('.sb-ck') }));
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
    let geo = '', AW = 1745, AH = 982, hTxt = '', sTxt = '';

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      AW = Math.round(W / APP_SCALE); AH = Math.round(H / APP_SCALE);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
    };
    // a menu opens under a row's More button (app px), lights one item, presses it and closes
    const runMenu = (m, row, t0, item, t) => {
      const o = outCubic(seg(t, t0, t0 + MENU_IN)) * (1 - seg(t, t0 + MENU_OUT, t0 + MENU_OUT + 0.08));
      m.style.opacity = o.toFixed(3);
      if (o <= 0) return;
      const a = row.more.getBoundingClientRect(), b = app.getBoundingClientRect(), s = b.width / AW;
      m.style.left = `${((a.left - b.left) / s).toFixed(1)}px`;
      m.style.top = `${((a.bottom - b.top) / s + 4).toFixed(1)}px`;
      m.style.transform = `scale(${lerp(0.94, 1, outCubic(seg(t, t0, t0 + MENU_IN))).toFixed(4)})`;
      const it = m.children[item];
      const hl = it.querySelector('.hs-hl');
      hl.style.opacity = (seg(t, t0 + MENU_HIT, t0 + MENU_HIT + 0.04) * (1 + 0.6 * press(t, t0 + MENU_PRESS))).toFixed(3);
    };

    return {
      nodes: [say],
      marks: [[T.r, say]],
      render(t) {
        layout();
        // measure each row at its natural height (folds and the pinned label written below, from t)
        pslot.style.height = '0px';
        rows.forEach((r) => { r.n.style.height = ''; r.n.style.paddingTop = ''; r.n.style.paddingBottom = ''; });
        rows.forEach((r) => { r.h = r.n.offsetHeight; });
        const sa = outCubic(seg(t, T.r, T.r + 0.2));
        say.style.opacity = sa.toFixed(3);
        const bi = outCubic(seg(t, T.bar, T.bar + BAR_IN));
        bar.style.opacity = bi.toFixed(3);
        bar.style.transform = bi >= 1 ? 'none' : `translateY(${((1 - bi) * -10).toFixed(2)}px)`;
        oks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + 0.16));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.bar) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // 1. hearts: each real row's creator heart pops red with Sam's badge; each spam row is washed red and flagged
        rows.forEach((r, i) => {
          const a = T.row[i];
          if (r.rw.spam) {
            const f = outCubic(seg(t, a, a + 0.16));
            r.flag.style.opacity = f.toFixed(3);
            r.wash.style.opacity = f.toFixed(3);
            return;
          }
          const f = seg(t, a, a + POP);
          r.h0.style.opacity = (1 - seg(t, a, a + 0.05)).toFixed(3);
          r.h1.style.opacity = seg(t, a, a + 0.05).toFixed(3);
          r.hav.style.opacity = seg(t, a + 0.04, a + 0.1).toFixed(3);
          r.hrt.style.transform = f > 0 && f < 1 ? `scale(${lerp(0.5, 1, outBack(f)).toFixed(4)})` : 'none';
          const ring = seg(t, a, a + 0.3);
          r.ring.style.opacity = ring > 0 && ring < 1 ? (1 - ring).toFixed(3) : '0';
          r.ring.style.transform = `scale(${lerp(0.8, 1.6, ring).toFixed(4)})`;
        });
        const hv = fmt(Math.round(REAL * race(seg(t, T.h0, T.h1))));
        if (hv !== hTxt) { hn.textContent = hv; hTxt = hv; }

        // 2. hide: the spam rows fold out of the list, the counter climbs to 131
        rows.forEach((r, i) => {
          if (!r.rw.spam) return;
          const f = inOutCubic(seg(t, T.fold[i], T.fold[i] + COLLAPSE));
          r.n.style.opacity = (1 - seg(t, T.fold[i], T.fold[i] + COLLAPSE * 0.6)).toFixed(3);
          r.n.style.height = f > 0 ? `${(r.h * (1 - f)).toFixed(2)}px` : '';
          r.n.style.paddingTop = f > 0 ? `${(12 * (1 - f)).toFixed(2)}px` : '';
          r.n.style.paddingBottom = f > 0 ? `${(8 * (1 - f)).toFixed(2)}px` : '';
        });
        const sv = fmt(Math.round(SPAM * inOutCubic(seg(t, T.hideHit, T.foldEnd))));
        if (sv !== sTxt) { sn.textContent = sv; sTxt = sv; }

        // the list: scrolls the thread past during the hearts, clamps as the spam folds, returns to the top for the pin
        const maxS = Math.max(0, track.offsetHeight - list.clientHeight);
        const down = maxS * inOutCubic(seg(t, T.h0 + SCROLL_AT, T.h1 - SCROLL_END));
        const sc = Math.min(down, maxS) * (1 - inOutCubic(seg(t, T.up, T.up + UP)));
        track.style.transform = sc > 0 ? `translateY(${(-sc).toFixed(2)}px)` : 'none';

        // 3. pin: her row rises above the two comments that outranked her; the pinned label opens; the blue wash pulses
        const m = inOutCubic(seg(t, T.move, T.move + MOVE));
        const above = rows.slice(0, FAV_I).filter((r) => !r.rw.spam);
        const lift = above.reduce((s, r) => s + r.h, 0);
        pslot.style.height = `${(24 * m).toFixed(2)}px`;
        pinned.style.opacity = seg(t, T.move + MOVE * 0.4, T.move + MOVE).toFixed(3);
        const myH = fav.h + 24 * m;
        // she leads (arrives in 70% of the move) so the top is never empty; the rows she passes slide down under her
        const mf = inOutCubic(seg(t, T.move, T.move + MOVE * 0.7));
        fav.n.style.transform = mf > 0 ? `translateY(${(-lift * mf).toFixed(2)}px)` : 'none';
        fav.n.style.zIndex = m > 0 ? '2' : '';
        above.forEach((r) => { r.n.style.transform = m > 0 ? `translateY(${(myH * m).toFixed(2)}px)` : 'none'; });
        // her row lifts off the list while it travels: an opaque card with a shadow over the rows it passes
        const lifted = Math.sin(Math.PI * Math.min(1, (m + mf) / 2));
        fav.n.style.background = m > 0 && m < 1 ? '#fff' : '';
        fav.n.style.boxShadow = lifted > 0.001 ? `0 ${(10 * lifted).toFixed(1)}px ${(28 * lifted).toFixed(1)}px rgba(0,0,0,${(0.18 * lifted).toFixed(3)})` : '';
        fav.pw.style.opacity = t < T.move ? '0' : Math.min(1, seg(t, T.move, T.move + 0.12) * (1 - 0.6 * seg(t, T.move + MOVE, T.move + MOVE + 0.5))).toFixed(3);
        fav.pw.style.background = 'var(--yt-pin-wash)';

        runMenu(mHide, rows[HIDE_I], T.hideMenu, 3, t);
        runMenu(mPin, fav, T.pinMenu, 0, t);
        // the badge: in with the first heart, the spam line opens on the hide, the pin line as her row lands on top
        const ba = outCubic(seg(t, T.h0 - 0.06, T.h0 + 0.14));
        badge.style.opacity = ba.toFixed(3);
        badge.style.transform = `scale(${lerp(0.9, 1, outCubic(seg(t, T.h0 - 0.06, T.h0 + 0.14))).toFixed(4)})`;
        if (bhn.textContent !== hv) bhn.textContent = hv;
        if (bsn.textContent !== sv) bsn.textContent = sv;
        const bump = heartTimes.reduce((m, a) => Math.max(m, Math.sin(Math.PI * seg(t, a, a + 0.14))), 0);
        bhi.style.transform = bump > 0 ? `scale(${(1 + 0.14 * bump).toFixed(4)})` : 'none';
        const so = inOutCubic(seg(t, T.hideHit - 0.02, T.hideHit + 0.18));
        bs.style.height = `${(54 * so).toFixed(2)}px`;
        bs.style.marginTop = `${(10 * so).toFixed(2)}px`;
        bs.style.opacity = so.toFixed(3);
        const po = inOutCubic(seg(t, T.move + 0.12, T.move + 0.32));
        bp.style.height = `${(54 * po).toFixed(2)}px`;
        bp.style.marginTop = `${(10 * po).toFixed(2)}px`;
        bp.style.opacity = po.toFixed(3);
        const s = outCubic(seg(t, T.snack, T.snack + SNACK_IN));
        snack.style.opacity = s.toFixed(3);
        snack.style.transform = s >= 1 ? 'none' : `translateY(${((1 - s) * 16).toFixed(2)}px)`;
      },
      // after the camera: the window opens out of the pill to the whole frame
      after(t) {
        if (t < T.g0) { layer.style.opacity = '0'; return; }
        layout();
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const p = pill ? x.box(pill) : { x: W / 2, y: H / 2, w: 0, h: 0 };
        const w0 = OPEN_W, h0 = (OPEN_W * H) / W;
        const x0 = p.x + p.w / 2 - w0 / 2, y0 = p.y + p.h / 2 - h0 / 2;
        const g = inOutCubic(seg(t, T.g0, T.full));
        const L = lerp(x0, 0, g), Tp = lerp(y0, 0, g), Wd = lerp(w0, W, g), Ht = lerp(h0, H, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        layer.style.opacity = outCubic(seg(t, T.g0, T.g0 + GROW * 0.45)).toFixed(3);
      },
    };
  },
};
