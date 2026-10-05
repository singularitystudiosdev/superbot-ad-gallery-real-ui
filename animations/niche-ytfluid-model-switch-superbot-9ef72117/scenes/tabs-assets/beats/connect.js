// Connect beat: superbot asks for the channel before it touches anything. Under "Connecting to YouTube Studio" the
// spinner keeps turning while Google's OAuth popup (a Chrome popup window on accounts.google.com) rises over the hub:
// "Sign in with Google", superbot wants access to your Google Account, the account chip, the ONE scope it asks for
// (youtube.force-ssl: "See, edit, and permanently delete your YouTube videos, ratings, comments and captions"; one
// non-Sign-In scope gets no checkbox, Google's granular-permissions guide), Cancel / Continue. Sam's pointer clicks
// Continue, the popup falls away, the pill's check lands, and the thread shows what the connection reached: the
// channel (img/avatar-sam.jpg) and its latest video (img/thumb.jpg, 14:32, 1,284 comments).
// Pure function of t.
import { esc } from '../../../lib.js';
import { spring, smooth, rise, glide, click, lerp } from '../motion.js?v=9ef72117';
import { ms } from './yt-icons.js?v=9ef72117';

export const CHANNEL = { name: 'Sam Rivera', handle: '@samrivera', subs: '214K subscribers', email: 'sam.rivera@gmail.com' };
export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32', comments: '1,284', ago: '2 hours ago' };
const SCOPE = 'See, edit, and permanently delete your YouTube videos, ratings, comments and captions';

// seconds from the pill landing
const POP_IN = 0.25;       // the popup rises
const PTR_IN = 0.7;        // Sam's pointer enters
const PRESS = 1.75;        // ...and clicks Continue
const POP_OUT = 1.86;      // the popup falls away
const DONE = 2.0;          // connected: the pill's check
// seconds from the reply line
const CARD = 0.1, VROW = 0.28;

const G_LOGO = '<svg class="cn-g" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';

export default {
  times(sw) {
    const done = sw + DONE;
    const reply = done + 0.16;
    return { done, reply, press: sw + PRESS, end: reply + VROW + 0.62 };
  },

  build(k, ctx) {
    const T = { ...k.T, sw: k.sw };
    const card = ctx.el(`<div class="cn-card">
  <div class="cn-ch"><img class="cn-av" src="${ctx.img('avatar-sam.jpg')}" alt=""/><div><b>${esc(CHANNEL.name)}</b><small>${esc(CHANNEL.handle)} · ${esc(CHANNEL.subs)}</small></div></div>
  <div class="cn-vid"><span class="cn-th"><img src="${ctx.img('thumb.jpg')}" alt=""/><i>${VIDEO.len}</i></span><div><span class="cn-k">Latest video</span><b>${esc(VIDEO.title)}</b><small>${VIDEO.ago} · ${VIDEO.comments} comments</small></div></div>
</div>`);
    const ch = card.querySelector('.cn-ch'), vid = card.querySelector('.cn-vid');

    // the popup layer lives in the scene root (section px), over the hub
    const layer = ctx.el(`<div class="cn-layer" aria-hidden="true"><div class="cn-scrim"></div>
<div class="cn-pop">
  <div class="cn-bar"><span class="cn-lights"><i></i><i></i><i></i></span><span class="cn-title">Sign in - Google Accounts</span></div>
  <div class="cn-url">${ms('lock-outline', 'cn-lock')}<span><b>accounts.google.com</b>/o/oauth2/v2/auth?client_id=superbot&amp;scope=youtube.force-ssl</span></div>
  <div class="cn-page">
    <div class="cn-siw">${G_LOGO}<span>Sign in with Google</span></div>
    <div class="cn-body">
      <span class="cn-app"><img src="${ctx.sbSrc}" alt=""/></span>
      <h2>superbot wants access to your Google Account</h2>
      <span class="cn-acct"><img src="${ctx.img('avatar-sam.jpg')}" alt=""/>${esc(CHANNEL.email)}${ms('expand-more', 'cn-chev')}</span>
      <p class="cn-will">This will allow superbot to:</p>
      <div class="cn-scope"><img class="cn-yt" src="${ctx.brand('youtube-icon.svg')}" alt=""/><span>${esc(SCOPE)}</span>${ms('info-outline', 'cn-info')}</div>
      <h3>Make sure you trust superbot</h3>
      <p class="cn-fine">You may be sharing sensitive info with this site or app. You can always see or remove access in your <a>Google Account</a>.</p>
      <p class="cn-fine">Learn how Google helps you <a>share data safely</a>.</p>
      <p class="cn-fine">See superbot's <a>Privacy Policy</a> and <a>Terms of Service</a>.</p>
    </div>
    <div class="cn-btns"><span class="cn-cancel">Cancel</span><span class="cn-go">Continue</span></div>
  </div>
</div></div>`);
    ctx.root.appendChild(layer);
    const pop = layer.querySelector('.cn-pop'), scrim = layer.querySelector('.cn-scrim'), go = layer.querySelector('.cn-go');
    let geom = null;

    // the popup's resting scale and the Continue button's resting centre, in section px (from layout, not from the
    // animated box, so the pointer's target never moves under it)
    const measure = () => {
      const W = ctx.root.offsetWidth || 1920, H = ctx.root.offsetHeight || 1080;
      const pw = pop.offsetWidth, ph = pop.offsetHeight;
      const S = Math.min(1.5, (H * 0.86) / ph, (W * 0.9) / pw);
      let ox = 0, oy = 0, e = go;
      while (e && e !== pop) { ox += e.offsetLeft; oy += e.offsetTop; e = e.offsetParent; }
      const bx = W / 2 + (ox + go.offsetWidth / 2 - pw / 2) * S, by = H / 2 + (oy + go.offsetHeight / 2 - ph / 2) * S;
      return { W, H, S, bx, by, ok: !document.fonts || document.fonts.status === 'loaded' };
    };

    return {
      nodes: [card],
      marks: [[T.reply + CARD, card]],
      render(t) {
        rise(ch, t, T.reply + CARD, 12, 0.6);
        rise(vid, t, T.reply + VROW, 12, 0.6);
      },
      after(t) {
        if (!geom || !geom.ok || geom.W !== ctx.root.offsetWidth) geom = measure();
        const a = T.sw + POP_IN, b = T.sw + POP_OUT;
        const vin = spring(t, a, 0.6), vout = smooth(t, b, b + 0.34);
        const v = smooth(t, a, a + 0.32) * (1 - vout);
        layer.style.visibility = v > 0 ? 'visible' : 'hidden';
        scrim.style.opacity = (0.5 * smooth(t, a, a + 0.4) * (1 - smooth(t, b, b + 0.4))).toFixed(3);
        pop.style.opacity = v.toFixed(3);
        const s = geom.S * lerp(0.965, 1, vin) * lerp(1, 0.975, vout);
        const dy = (1 - vin) * 26 + vout * 14;
        pop.style.transform = `translate(-50%,-50%) translate3d(0,${dy.toFixed(2)}px,0) scale(${s.toFixed(4)})`;
        // Continue: the press darkens it
        go.classList.toggle('on', t >= T.sw + PRESS - 0.06 && t < b + 0.1);
      },
      pointer(t) {
        const a = T.sw + PTR_IN, end = T.sw + POP_OUT + 0.35;
        if (!geom || t < a - 0.05 || t > end) return null;
        const { W, H, bx, by } = geom;
        const p = glide(t, [[a - 1, W * 0.8, H * 0.98], [a, bx + 6, by + 4]], 0.95);
        return { x: p.x, y: p.y, p: click(t, T.sw + PRESS), v: smooth(t, a - 0.05, a + 0.25) * (1 - smooth(t, end - 0.3, end)) };
      },
    };
  },
};
