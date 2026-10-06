// Phone beat, the payoff: Friday at 12:00 PM the first Short is live in the YouTube app. A full-frame layer (in the
// scene root, above the Studio layer) darkens to YouTube's black and a phone rises into the middle of the frame. On it,
// the Shorts player: Short 1 playing full-bleed (img/short-flat.jpg, the same 9:16 window GPT-6 Astra cut) with its
// burned-in captions (two words a line, the spoken word yellow), the right rail (like, dislike, comments, share,
// remix, the sound), and bottom left the channel row (@theooutside, Subscribe), the title, and under them the related
// video link (YouTube Help 14075157: "a clickable link below your channel handle"), "I Biked the Whole Carretera
// Austral in 21 Days". A finger taps the link and the watch page slides in: the full video starts from 0:00 (31:04),
// its title, 640K views, Theo Outside with 412K subscribers. As in the chat, the camera pushes in on the moment that
// matters: in on the channel row, the title and the link for the tap, then over to the watch page's player and title
// as it opens. A label beside
// the phone names the moment. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, outQuint, inOutCubic, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=5c75e467';
import { CHANNEL, HANDLE, SUBS, VIDEO, MOMENTS, TIME } from './story.js?v=5c75e467';

const M0 = MOMENTS[0];
// timing (seconds from the beat start)
const BG_IN = 0.3;               // the layer darkens over the Studio frame
const RISE_AT = 0.06, RISE = 0.48; // the phone rising into place
const PLAY_AT = 0.3;             // the Short is playing
const WORD = 0.2;                // one spoken caption word to the next
const LABEL_AT = 0.42, LABEL_IN = 0.3;
const PUSH_AT = 1.3, PUSH = 0.42; /* deliberate */ // the camera pushes in on the channel row, title and link
const ZOOM = 1.75, LINK_Y = 330; // ...to this scale, the link landing in the frame's lower third
const ZOOM_W = 1.4, WATCH_Y = -190; // after the tap the camera settles on the watch page's player and title
const TOUCH_AT = 1.66;           // the finger arrives on the link
const TAP = 1.92;                // the tap (the chime)
const OPEN = 0.36;               // the watch page sliding in
const OPEN_AT = 0.08;            // the tap to the slide starting
const PULL = 0.42;               // the camera from the link to the watch page while it opens
const READ = 0.6; /* deliberate */  // the full video holds, readable, before the scene's fade

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fade = (n, o) => { n.style.opacity = Math.max(0, Math.min(1, o)).toFixed(3); };
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r) {
    const T = { r };
    T.rise = r + RISE_AT;
    T.play = r + PLAY_AT;
    T.label = r + LABEL_AT;
    T.push = r + PUSH_AT;
    T.touch = r + TOUCH_AT;
    T.tap = r + TAP;
    T.open = T.tap + OPEN_AT;
    T.end = Math.max(T.open + OPEN, T.open + PULL) + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { phone: { r: T.r, rise: T.rise, tap: T.tap, open: T.open, words: M0.cap.map((_, i) => T.play + i * WORD) } });
    const layer = x.el(`<div class="ph-full" aria-hidden="true">
      <i class="ph-bg"></i>
      <div class="ph-lab">
        <div class="ph-l0"><small>${M0.day}, ${M0.date} · ${TIME}</small><b>Short 1 of 3 is live</b></div>
        <div class="ph-l1"><small>Related video</small><b>One tap to the full ${VIDEO.len} ride</b></div>
      </div>
      <div class="ph-dev"><div class="ph-scr">
        <div class="ph-short">
          <img class="ph-vid" src="${x.img(`short-${M0.img}.jpg`)}" alt=""/>
          <i class="ph-shade"></i>
          <span class="ph-cap">${[0, 2, 4].map((p) => `<span class="ph-pg">${M0.cap.slice(p, p + 2).map((w) => `<i>${esc(w)}</i>`).join(' ')}</span>`).join('')}</span>
          <div class="ph-top">${ms('search')}${ms('more-vert')}</div>
          <div class="ph-rail">
            <span class="ph-ra">${ms('thumb-up')}<b>318</b></span>
            <span class="ph-ra">${ms('thumb-down')}<b>Dislike</b></span>
            <span class="ph-ra">${ms('comment')}<b>27</b></span>
            <span class="ph-ra">${ms('share')}<b>Share</b></span>
            <span class="ph-ra">${ms('replay')}<b>Remix</b></span>
            <span class="ph-snd">T</span>
          </div>
          <div class="ph-meta">
            <div class="ph-ch"><span class="ph-av">T</span><b>${HANDLE}</b><span class="ph-sub">Subscribe</span></div>
            <div class="ph-tt">${esc(M0.title)}</div>
            <div class="ph-rel">${ms('play-arrow')}<span>${esc(VIDEO.title)}</span></div>
          </div>
          <i class="ph-prog"><i></i></i>
        </div>
        <div class="ph-watch">
          <div class="pw-player"><img src="${x.img('frame-gravel.jpg')}" alt=""/><i class="pw-bar"><i></i></i><span class="pw-tc">0:00 / ${VIDEO.len}</span></div>
          <div class="pw-body">
            <div class="pw-title">${esc(VIDEO.title)}</div>
            <div class="pw-meta">${VIDEO.views}&nbsp;&nbsp;${VIDEO.ago}&nbsp;&nbsp;<b>...more</b></div>
            <div class="pw-ch"><span class="ph-av">T</span><b>${esc(CHANNEL)}</b><small>${SUBS}</small><span class="pw-sub">Subscribe</span></div>
            <div class="pw-acts"><span class="pw-a">${ms('thumb-up-outline')}31K<i></i>${ms('thumb-down-outline')}</span><span class="pw-a">${ms('share')}Share</span><span class="pw-a">${ms('replay')}Remix</span><span class="pw-a">${ms('download')}Download</span></div>
            <div class="pw-cm"><b>Comments</b><small>2.9K</small></div>
            <div class="pw-next"><img src="${x.img('thumb-packing.jpg')}" alt=""/><i>18:47</i></div>
          </div>
        </div>
        <div class="ph-sb"><b>12:04</b><span>${ms('signal-cellular-alt')}${ms('wifi')}${ms('battery-full')}</span></div>
        <div class="ph-nav">${[['home-outline', 'Home'], ['yt-shorts', 'Shorts', true], ['add-circle-outline', ''], ['subscriptions-outline', 'Subscriptions'], ['account-circle-outline', 'You']]
          .map(([ic, l, on]) => `<span class="ph-nv${on ? ' on' : ''}${l ? '' : ' ph-add'}">${ms(ic)}${l ? `<small>${l}</small>` : ''}</span>`).join('')}</div>
        <i class="ph-touch"></i>
      </div></div>
    </div>`);
    x.root.appendChild(layer);
    const $ = (s) => layer.querySelector(s);
    const n = {
      bg: $('.ph-bg'), dev: $('.ph-dev'), vid: $('.ph-vid'), pages: [...layer.querySelectorAll('.ph-pg')], words: [...layer.querySelectorAll('.ph-pg i')],
      rel: $('.ph-rel'), prog: $('.ph-prog i'), watch: $('.ph-watch'), short: $('.ph-short'), touch: $('.ph-touch'), scr: $('.ph-scr'),
      lab: $('.ph-lab'), l0: $('.ph-l0'), l1: $('.ph-l1'), pwBar: $('.pw-bar i'), pwTc: $('.pw-tc'), nav: $('.ph-nav'),
    };
    let on = -2, pin = null;

    return {
      nodes: [],
      marks: [],
      render(t) {
        if (t < T.r - 0.01) { layer.style.display = 'none'; return; }
        layer.style.display = '';
        fade(n.bg, seg(t, T.r, T.r + BG_IN));
        const ri = outCubic(seg(t, T.rise, T.rise + RISE));
        fade(n.dev, seg(t, T.rise, T.rise + RISE * 0.5));
        // the camera: in on the link (outQuint), back out as the watch page opens (inOutCubic); the link's point in
        // the device's own px (offset from its centre) is measured unscaled, so the move never feeds back
        const f1 = outQuint(seg(t, T.push, T.push + PUSH)), f2 = inOutCubic(seg(t, T.open, T.open + PULL));
        let dx = 0, dy = 0, z = 1;
        if (f1 > 0) {
          if (!pin) {
            const d = n.dev, rl = n.rel;
            let ox = 0, oy = 0;
            for (let e = rl; e && e !== d; e = e.offsetParent) { ox += e.offsetLeft; oy += e.offsetTop; }
            pin = { x: ox + rl.offsetWidth * 0.5 - d.offsetWidth / 2, y: oy + rl.offsetHeight * 0.5 - d.offsetHeight / 2 };
          }
          // on the link: the link on the frame's centre line, LINK_Y px under the middle; on the watch page: the
          // player and the title (WATCH_Y, the device's own px from its centre) on the middle of the frame
          z = lerp(lerp(1, ZOOM, f1), ZOOM_W, f2);
          dx = lerp(f1 * -ZOOM * pin.x, 0, f2);
          dy = lerp(f1 * (LINK_Y - ZOOM * pin.y), -ZOOM_W * WATCH_Y, f2);
        }
        n.dev.style.transform = `translate(-50%, calc(-50% + ${((1 - ri) * 160).toFixed(2)}px)) translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) scale(${(lerp(0.94, 1, ri) * z).toFixed(4)})`;
        fade(n.lab, 1 - 0.85 * f1 * (1 - f2));

        // the Short plays: a slow push on the frame, the captions, the progress line (0:42 long)
        const pl = Math.max(0, t - T.play);
        n.vid.style.transform = `scale(${(1.02 + 0.03 * Math.min(1, pl / 3)).toFixed(4)})`;
        const wi = t < T.play ? -1 : Math.min(M0.cap.length - 1, Math.floor(pl / WORD));
        if (wi !== on) {
          n.words.forEach((w, j) => w.classList.toggle('on', j === wi));
          const pg = wi < 0 ? 0 : Math.floor(wi / 2);
          n.pages.forEach((p, j) => { p.style.display = j === pg ? '' : 'none'; });
          on = wi;
        }
        n.prog.style.transform = `scaleX(${Math.min(1, (pl + 0.4) / M0.d).toFixed(4)})`;

        // the labels beside the phone
        const la = outCubic(seg(t, T.label, T.label + LABEL_IN)), lb = outCubic(seg(t, T.open, T.open + LABEL_IN));
        fade(n.l0, la * (1 - lb));
        n.l0.style.transform = `translateY(${((1 - la) * 12 - lb * 12).toFixed(2)}px)`;
        fade(n.l1, lb);
        n.l1.style.transform = `translateY(${((1 - lb) * 12).toFixed(2)}px)`;

        // the finger on the related video link: arrives, taps, lifts
        const rb = x.box(n.rel), sb = x.box(n.scr);
        const s = sb.w / (n.scr.offsetWidth || sb.w);
        const tx = (rb.x - sb.x) / s + (rb.w / s) * 0.42, ty = (rb.y - sb.y) / s + (rb.h / s) * 0.5;
        const tin = outCubic(seg(t, T.touch, T.touch + 0.2)), tout = seg(t, T.tap + 0.14, T.tap + 0.34);
        const pr = press(t, T.tap);
        fade(n.touch, tin * (1 - tout));
        n.touch.style.transform = `translate(${(tx + (1 - tin) * 50).toFixed(2)}px, ${(ty + (1 - tin) * 70).toFixed(2)}px) translate(-50%, -50%) scale(${(1 - 0.22 * pr + tout * 0.5).toFixed(4)})`;
        n.rel.classList.toggle('on', t >= T.tap - 0.06 && t < T.open + OPEN);
        // the watch page slides in; the full video starts from 0:00
        const op = inOutCubic(seg(t, T.open, T.open + OPEN));
        n.watch.style.transform = `translateY(${((1 - op) * 100).toFixed(3)}%)`;
        fade(n.watch, op > 0 ? 1 : 0);
        n.short.style.filter = op > 0 ? `brightness(${(1 - 0.5 * op).toFixed(3)})` : '';
        fade(n.nav, 1 - op);
        const wp = Math.max(0, t - (T.open + OPEN));
        n.pwBar.style.transform = `scaleX(${(wp / VIDEO.lenS).toFixed(5)})`;
        setText(n.pwTc, `0:0${Math.min(9, Math.floor(wp))} / ${VIDEO.len}`);
      },
    };
  },
};
