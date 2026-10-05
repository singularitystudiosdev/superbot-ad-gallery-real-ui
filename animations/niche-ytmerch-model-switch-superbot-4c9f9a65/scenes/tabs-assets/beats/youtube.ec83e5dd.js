// Link 6, YouTube Studio (connected): posts the Short and sells the mug under it. The workspace shows Studio's upload
// dialog (dark theme) on its last step: the title, the description pointing at sam.shop, the mug tagged under
// "Products" (YouTube Shopping product tagging), the 9:16 preview (Gemini's desk shot), and Publish, clicked.
// Then the payoff opens full frame: the Short on YouTube's desktop Shorts page. The preview grows into the player (one
// match move), the ElevenLabs voice runs as burned-in captions on its real word onsets, the product sticker pops,
// the pointer taps it and the Products panel slides open beside the player: the mug, $24.00, from sam.shop.
import { seg, outCubic, outQuint, inOutCubic, lerp, esc } from '../../../lib.js';
import { ic } from '../icons.ec83e5dd.js?v=4c9f9a65';
import { WORDS } from './voice.ec83e5dd.js?v=4c9f9a65';

const PUBLISH = 0.92;      // done -> the Publish click
const FULL = 1.35;         // done -> the Shorts page opens
const EXPAND = 0.55;       // the preview grows into the player
const VOICE = 0.2;         // the page opening -> the voice starts
const STICKER = 0.9, TAP = 1.72, PANEL = 1.85, HOLD = 3.2;
// caption chunks, by word index into WORDS
const CHUNKS = [[0, 3], [3, 5], [5, 9], [9, 14], [14, 18]];
const PLAYER = { x: 690, y: 72, w: 540, h: 960 };
const SHIFT = 300;         // the player group slides left when the Products panel opens

export default {
  times(done) {
    return { end: done + FULL + HOLD };
  },
  build(k, ctx) {
    const im = ctx.img;
    const ws = ctx.el(`
<div class="ys">
  <div class="ys-dlg">
    <div class="ys-dh"><b>You asked for merch. Here it is.</b><span class="ys-saved">Saved as private</span>${ic('close')}</div>
    <div class="ys-steps"><span class="ys-st ys-ok"><i>${ic('check')}</i>Details</span><s></s><span class="ys-st ys-ok"><i>${ic('check')}</i>Video elements</span><s></s><span class="ys-st ys-ok"><i>${ic('check')}</i>Checks</span><s></s><span class="ys-st ys-cur"><i></i>Visibility</span></div>
    <div class="ys-body">
      <div class="ys-form">
        <div class="ys-f"><label>Title (required)</label><div>You asked for merch. Here it is.</div></div>
        <div class="ys-f ys-desc"><label>Description</label><div>The One More Take mug is live. Get yours at sam.shop</div></div>
        <div class="ys-sec"><b>${ic('sell-outline')}Products</b><small>Tag products from your connected store</small></div>
        <div class="ys-prod"><img src="${im('mockup.webp')}" alt=""/><span><b>One More Take Mug</b><small>$24.00 · sam.shop</small></span><em>${ic('check')}Tagged</em></div>
        <div class="ys-vis"><span class="ys-radio"><i></i></span><span><b>Public</b><small>Everyone can watch your Short</small></span></div>
      </div>
      <div class="ys-prev"><div class="ys-pv"><img src="${im('desk.webp')}" alt=""/><span class="ys-dur">0:04</span></div>
        <div class="ys-pl"><small>Video link</small><b>youtube.com/shorts/x7Kp2mQ</b><small>Filename</small><span>mug-short.mp4</span></div></div>
    </div>
    <div class="ys-foot"><span class="ys-chk">${ic('check-circle')}Checks complete. No issues found.</span><span class="ys-pub">Publish</span></div>
    <div class="ys-toast">${ic('check-circle')}Short published</div>
  </div>
</div>`);
    const full = ctx.el(`
<div class="yf">
  <div class="yf-top"><span class="yf-ham">${ic('menu')}</span><img class="yf-logo" src="${ctx.brand('yt-wordmark-dark.svg')}" alt=""/>
    <div class="yf-search"><span>Search</span><i>${ic('search')}</i></div><span class="yf-mic">${ic('mic')}</span>
    <div class="yf-tr"><span class="yf-create">${ic('add')}Create</span><span>${ic('notifications-outline')}</span><span class="yf-av">S</span></div></div>
  <div class="yf-guide"><span class="yf-g">${ic('home-outline')}<small>Home</small></span><span class="yf-g yf-g-on">${ic('smart-display-outline')}<small>Shorts</small></span><span class="yf-g">${ic('subscriptions-outline')}<small>Subscriptions</small></span><span class="yf-g">${ic('video-library-outline')}<small>You</small></span></div>
  <div class="yf-grp">
    <div class="yf-pl">
      <img class="yf-vid" src="${im('desk.webp')}" alt=""/>
      <div class="yf-ctl"><span>${ic('pause')}</span><span>${ic('volume-up')}</span><i></i><span>${ic('more-vert')}</span></div>
      <div class="yf-cap"></div>
      <div class="yf-stk"><img src="${im('mockup.webp')}" alt=""/><span><b>One More Take Mug</b><small>$24.00 · sam.shop</small></span>${ic('shopping-bag-outline')}</div>
      <div class="yf-meta"><div class="yf-ch"><span class="yf-cav">S</span><b>@samrivera</b><span class="yf-sub">Subscribe</span></div><p>You asked for merch. Here it is.</p></div>
      <div class="yf-prog"><i></i></div>
    </div>
    <div class="yf-acts"><span>${ic('thumb-up')}<small>12K</small></span><span>${ic('thumb-down-outline')}<small>Dislike</small></span><span>${ic('comment')}<small>418</small></span>
      <span class="yf-share">${ic('reply')}<small>Share</small></span><span>${ic('repeat')}<small>Remix</small></span><span class="yf-chs">S</span></div>
  </div>
  <div class="yf-panel"><div class="yf-ph"><b>Products</b>${ic('close')}</div><small class="yf-from">From Sam Rivera's store</small>
    <div class="yf-pc"><img src="${im('mockup.webp')}" alt=""/><b>One More Take Mug</b><span class="yf-price">$24.00</span><small>sam.shop · ships in 3 days</small><span class="yf-view">${ic('shopping-bag-outline')}View product</span></div>
  </div>
</div>`);
    const q = (s) => ws.querySelector(s), qf = (s) => full.querySelector(s);
    const prod = q('.ys-prod'), pub = q('.ys-pub'), toast = q('.ys-toast'), pv = q('.ys-pv');
    const pl = qf('.yf-pl'), vid = qf('.yf-vid'), cap = qf('.yf-cap'), stk = qf('.yf-stk'), panel = qf('.yf-panel'), grp = qf('.yf-grp'), prog = qf('.yf-prog i');
    const chrome = [...full.querySelectorAll('.yf-top, .yf-guide, .yf-acts, .yf-meta, .yf-ctl, .yf-prog')];
    const d = k.done, F = d + FULL;
    let lastCap = null, from = null;
    return {
      ws, full,
      head: 'connected · @samrivera · posting the Short',
      say: 'Short posted with the mug tagged. It sells from under the video.',
      chips: ['youtube.com/shorts', 'sam.shop'],
      out: 'Short',
      render(t) {
        const pp = outCubic(seg(t, d + 0.3, d + 0.6));
        prod.style.opacity = pp.toFixed(3);
        prod.style.transform = pp >= 1 ? 'none' : `scale(${lerp(0.94, 1, pp).toFixed(4)})`;
        const press = Math.sin(Math.PI * seg(t, d + PUBLISH - 0.06, d + PUBLISH + 0.14));
        pub.style.transform = press > 0 ? `scale(${(1 - 0.07 * press).toFixed(4)})` : 'none';
        pub.classList.toggle('ys-done', t >= d + PUBLISH + 0.05);
        const to = outCubic(seg(t, d + PUBLISH + 0.1, d + PUBLISH + 0.35));
        toast.style.opacity = to.toFixed(3);
        toast.style.transform = `translate(-50%, ${((1 - to) * 16).toFixed(2)}px)`;

        // the payoff: the page fades up, the preview grows into the player
        const on = t >= F - 0.02;
        full.style.visibility = on ? 'visible' : 'hidden';
        if (!on) return;
        if (!from) {
          const b = ctx.box(pv.querySelector('img'));
          from = { x: b.x, y: b.y, w: b.w, h: b.h };
        }
        pv.firstElementChild.style.visibility = 'hidden'; // the preview has become the player
        const e = outQuint(seg(t, F, F + EXPAND));
        const bg = outCubic(seg(t, F, F + 0.35));
        full.style.background = `rgba(15,15,15,${bg.toFixed(3)})`;
        chrome.forEach((c) => { c.style.opacity = outCubic(seg(t, F + 0.25, F + 0.55)).toFixed(3); });
        const shift = inOutCubic(seg(t, F + PANEL, F + PANEL + 0.45)) * SHIFT;
        const sx = from.w / PLAYER.w, sy = from.h / PLAYER.h;
        const tx = lerp(from.x - PLAYER.x, 0, e), ty = lerp(from.y - PLAYER.y, 0, e);
        pl.style.transform = e >= 1 ? 'none' : `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) scale(${lerp(sx, 1, e).toFixed(4)},${lerp(sy, 1, e).toFixed(4)})`;
        pl.style.borderRadius = `${lerp(10 / sx, 14, e).toFixed(2)}px`;
        grp.style.transform = shift ? `translateX(${(-shift).toFixed(2)}px)` : 'none';
        vid.style.transform = `scale(${(1 + 0.05 * seg(t, F, F + HOLD)).toFixed(4)})`;
        // captions on the real word onsets
        const a = t - (F + VOICE);
        let html = '';
        if (a >= WORDS[0][0]) {
          const wi = WORDS.reduce((n, w, i) => (a >= w[0] ? i : n), 0);
          const ch = CHUNKS.find(([s, e2]) => wi >= s && wi < e2);
          html = WORDS.slice(ch[0], ch[1]).map(([, w], i) => `<span class="${ch[0] + i === wi ? 'yf-w-on' : ''}">${esc(w)}</span>`).join(' ');
        }
        if (html !== lastCap) { cap.innerHTML = html; lastCap = html; }
        prog.style.transform = `scaleX(${Math.min(1, Math.max(0, a / 4.458)).toFixed(4)})`;
        const sp = outCubic(seg(t, F + STICKER, F + STICKER + 0.3));
        stk.style.opacity = sp.toFixed(3);
        stk.style.transform = `translateY(${((1 - sp) * 18).toFixed(2)}px) scale(${(1 - 0.04 * Math.sin(Math.PI * seg(t, F + TAP - 0.05, F + TAP + 0.15))).toFixed(4)})`;
        const pn = outQuint(seg(t, F + PANEL, F + PANEL + 0.5));
        panel.style.opacity = Math.min(1, pn * 1.6).toFixed(3);
        panel.style.transform = `translateX(${((1 - pn) * 120).toFixed(2)}px)`;
      },
      // the pointer: in from the right to Publish, then on the Shorts page to the product sticker
      pointer(t) {
        if (t < d + 0.35 || t > F + HOLD) return null;
        const pb = ctx.box(pub);
        const p1 = { x: pb.cx + 6, y: pb.cy + 4 };
        if (t < F + 0.6) {
          const m = inOutCubic(seg(t, d + 0.4, d + PUBLISH - 0.08));
          const x = lerp(1960, p1.x, m), y = lerp(1000, p1.y, m);
          const p = Math.sin(Math.PI * seg(t, d + PUBLISH - 0.06, d + PUBLISH + 0.14));
          return { x, y, p, v: seg(t, d + 0.35, d + 0.5) * (1 - seg(t, F - 0.05, F + 0.15)) };
        }
        const sb = ctx.box(stk);
        const m = inOutCubic(seg(t, F + 1.0, F + TAP - 0.08));
        const x = lerp(1500, sb.x + sb.w * 0.42, m), y = lerp(980, sb.cy + 4, m);
        const p = Math.sin(Math.PI * seg(t, F + TAP - 0.05, F + TAP + 0.15));
        return { x, y, p, v: seg(t, F + 0.9, F + 1.05) };
      },
    };
  },
};
