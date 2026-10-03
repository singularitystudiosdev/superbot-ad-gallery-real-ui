// Studio beat, the finale: superbot uploads the captioned Short from the creator's own YouTube Studio, and the Short
// plays. Its line streams and the base's checklist card lands in the chat ("Connected as Sam Rivera", "5 replies posted
// in your voice", "Short uploaded with captions", "Linked to the full video"), ticking in turn, with a mini window
// under it; the card holds (CARD_HOLD) and the window opens (GROW, the base's grammar) to a FRAMED window, never full
// bleed: superbot's dark backdrop shows as a margin on every side and a superbot title bar (the superbot mark and name,
// the YouTube mark, "Cut from 6:12, the moment 312 comments point to") sits on the frame edge. Inside it is the YouTube
// Shorts page, desktop, dark theme (#0f0f0f): the masthead (guide glyph, the YouTube logo, the "S" avatar; no search,
// no Create, no notifications) and the Shorts player centred, 9:16, 12 px radius, the real Short playing (video/
// short-9x16, the Mixkit footage cut 9:16) with its bottom overlay (scrim, "S" avatar, "Sam Rivera", the title) and the
// captions burned in word by word (captions.js CHUNKS, the active word yellow). The ONE bold moment, the chime: the
// Short starts (window.__AD_MARKS.chime). The camera pushes in on the player while it plays (1 to PUSH_Z). Then the
// ENDING: the framed page eases to the left and narrows while the Short keeps playing, and superbot's lock-up (the
// mascot, the wordmark, the plain text "Try it at superbot.gg") lands beside it. The scene's fade and the loop's dip
// to black follow.
//
// Policy guard (X Ads deceptive content): nothing in the window is a control. No Subscribe, no action rail (like,
// dislike, comments, share, remix), no counts on the new Short, no play / mute / more glyphs, no progress or seek bar,
// no search, no Create, no bell, no up/down navigation; no relative times, no view counts. The title bar label and the
// CTA are plain text.
//
// There is ONE Shorts window, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the framed rect. The page is laid out
// at a design size (the framed rect divided by APP_SCALE) and scaled to the layer, so the mini window and the framed
// window are the same pixels at two sizes. Pure function of t: every moving value is written from t; the Short follows
// t through video.js.
import { lerp, seg, outCubic, outQuint, inOutCubic, streamCount } from '../../../lib.js';
import { makeMark } from '../../../shell.js';
import { ms } from './yt-icons.js?v=b0c8e364';
import { TITLE, chunkAt, chunkHTML } from './captions.js?v=b0c8e364';
import { clip, clipTime, sources } from '../../../video.js?v=b0c8e364';

const SAY = 'Posting from your own YouTube Studio, as you.';
const ACCOUNT = 'Sam Rivera';
const FRAME_LABEL = 'Cut from 6:12, the moment 312 comments point to';
const CTA = 'Try it at superbot.gg';
const STEPS = [
  ['avatar', `Connected as <b>${ACCOUNT}</b>`],
  ['youtube', '5 replies posted in your voice'],
  ['subtitles-outline', 'Short uploaded with captions'],
  ['link', 'Linked to the full video'],
];

const APP_SCALE = 1;                             // the framed window: its design px to frame px
// the superbot frame: the dark backdrop shows as this margin around the window, in frame px
const MARGIN = { x: 64, y: 40 };
// the ending: the page's design width once it sits beside the lock-up (it reflows narrower: the masthead keeps its
// logo left and its avatar right, the player stays centred), its scale then, and the lock-up's mascot size
const BESIDE_DW = 820;
const BESIDE_SCALE = 0.9;
const MARK = 168;
// the camera's push-in on the player while the Short plays (the player grows from its top edge, under the masthead)
const PUSH_Z = 1.12;
// timing (seconds from the reply start, or from the card where noted)
const CPS = 80;                                  // the reply line streams (the base's finale beat)
const LIST_AT = 0.25;                            // the line streams, then the checklist card lands
const CARD_IN = 0.3;                             // a card rising into the thread
const CHECK_AT = 0.3;                            // the checklist landing to the first check
const CHECK_STAGGER = 0.16;                      // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */              // the window opens to the framed rect
const PLAY_AT = 0.05;                            // the window open to the Short starting (the chime)
const HERO = 7.3; /* deliberate */               // the Short plays full frame: all eight chunks, the last one read
const BRAND = 0.9; /* deliberate */              // the page eases aside, the lock-up lands beside it
const BRAND_HOLD = 2.4; /* deliberate */         // the Short keeps playing beside superbot's lock-up, before the fade
const RADIUS = 8;                                // the card's window radius
const FRAME_RADIUS = 14;                         // the superbot frame's radius once open

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.list = r + LIST_AT;                              // the checklist card lands, the mini window in it
    T.ok = STEPS.map((_, i) => T.list + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                            // the framed window is in place
    T.play = T.full + PLAY_AT;                         // the Short starts playing (the chime)
    T.brand = T.play + HERO;                           // the page eases aside, the lock-up lands
    T.branded = T.brand + BRAND;
    T.end = T.branded + BRAND_HOLD;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.play, brand: T.brand, branded: T.branded, heroEnd: T.end });

    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    // ---- the checklist card ----
    const stepIcon = (kind) => (kind === 'avatar' ? '<span class="gk-ic gk-av">S</span>'
      : kind === 'youtube' ? `<span class="gk-ic gk-img"><img src="${icon('youtube-icon.svg')}" alt=""/></span>`
        : `<span class="gk-ic gk-ms">${ms(kind)}</span>`);
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([kind, txt]) => `<div class="gk-step">${stepIcon(kind)}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    // ---- the framed YouTube Shorts page ----
    const dim = x.el('<div class="st-dim" aria-hidden="true"></div>');
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-win">
      <div class="st-sb"><img class="st-sbt" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="st-sbv"></i><img class="st-sby" src="${icon('youtube-icon.svg')}" alt=""/><span>${esc(FRAME_LABEL)}</span></div>
      <div class="st-port"><div class="sh-app">
        <header class="sh-top">
          <span class="sh-guide">${ms('menu')}</span>
          <span class="sh-logo"><img src="${icon('youtube-logo-dark.svg')}" alt=""/></span>
          <span class="sh-me">S</span>
        </header>
        <div class="sh-stage">
          <div class="sh-player">
            <video class="sh-vid" muted playsinline preload="auto" width="720" height="1280">${sources(x.video('short-9x16'))}</video>
            <div class="sb-cap sh-cap"></div>
            <div class="sh-ov">
              <div class="sh-ch"><span class="sh-av">S</span><b>${esc(ACCOUNT)}</b></div>
              <div class="sh-title">${esc(TITLE)}</div>
            </div>
          </div>
        </div>
      </div></div>
    </div></div>`);
    const brand = x.el(`<div class="st-brand" aria-hidden="true"><div class="st-bface"></div><div class="st-bwords"><h1>superbot</h1><p>${esc(CTA)}</p></div></div>`);
    x.root.appendChild(dim);
    x.root.appendChild(layer);
    x.root.appendChild(brand);
    const win = layer.firstElementChild;
    const app = win.querySelector('.sh-app');
    const sb = win.querySelector('.st-sb');
    const player = win.querySelector('.sh-player');
    const cap = win.querySelector('.sh-cap');
    const short = clip(win.querySelector('.sh-vid'), T.play, T.end + 1);
    const face = brand.querySelector('.st-bface'), words = brand.querySelector('.st-bwords');
    const mark = makeMark(MARK);
    face.appendChild(mark.el);
    // YouTube's type is Roboto (vendored, studio.css), the captions Montserrat 800 (captions.css): ask for every face
    // up front so a seek never measures in the fallback face
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      document.fonts.load('800 40px "Montserrat SB"');
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, capHTML = null;
    let DW = 1792, DH = 1000, R = { x: 64, y: 40, w: 1792, h: 1000 };

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      R = { x: MARGIN.x, y: MARGIN.y, w: W - 2 * MARGIN.x, h: H - 2 * MARGIN.y };
      DW = Math.round(R.w / APP_SCALE); DH = Math.round(R.h / APP_SCALE);
      shot.style.aspectRatio = `${R.w} / ${R.h}`;
    };
    // the window's rect while the lock-up sits beside it (frame px): the narrowed page at the smaller scale, vertically
    // centred, at the frame's left margin
    const beside = () => {
      const s2 = APP_SCALE * BESIDE_SCALE;
      const H = x.root.offsetHeight;
      const h = DH * s2;
      return { x: R.x, y: (H - h) / 2, w: BESIDE_DW * s2, h, s: s2 };
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.list, card]],
      render(t) {
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const li = outCubic(seg(t, T.list, T.list + CARD_IN));
        card.style.opacity = li.toFixed(3);
        card.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.list) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the burned-in captions: the chunk under the Short's playhead, word by word (nothing before it starts)
        const ch = t >= T.play ? chunkAt(clipTime(short, t)) : null;
        const html = ch ? chunkHTML(ch) : '';
        if (html !== capHTML) { cap.innerHTML = html; capHTML = html; }
      },
      // after the camera: lay the window over the card's mini frame, open it to the framed rect, push in on the
      // player, then ease it aside for the lock-up
      after(t) {
        if (t < T.list) { layer.style.opacity = '0'; dim.style.opacity = '0'; brand.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        feed = feed || card.closest('.feed');
        const g = inOutCubic(seg(t, T.grow, T.full));
        // the ending: e = 0 framed, 1 beside the lock-up
        const e = inOutCubic(seg(t, T.brand, T.branded));
        const B = e > 0 ? beside() : null;
        const tx = B ? lerp(R.x, B.x, e) : R.x, ty = B ? lerp(R.y, B.y, e) : R.y;
        const tw = B ? lerp(R.w, B.w, e) : R.w, th = B ? lerp(R.h, B.h, e) : R.h;
        const s = B ? lerp(APP_SCALE, B.s, e) : APP_SCALE;
        const L = lerp(b.x, tx, g), Tp = lerp(b.y, ty, g), Wd = lerp(b.w, tw, g), Ht = lerp(b.h, th, g);
        const s0 = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        const rad = lerp(RADIUS * s0, FRAME_RADIUS, g);
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${rad.toFixed(2)}px`;
        // the window's scale: the mini window and the framed one are the same design px; beside the lock-up the page
        // reflows narrower at the smaller scale (the design height stays, so the player keeps its size in design px)
        const kk = g < 1 ? Wd / DW : s;
        win.style.width = `${(Wd / kk).toFixed(2)}px`;
        win.style.height = `${(Ht / kk).toFixed(2)}px`;
        win.style.transform = `scale(${kk.toFixed(5)})`;
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${rad.toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
        // the hub behind gives way to superbot's dark backdrop as the window opens
        dim.style.opacity = g.toFixed(3);

        // the push in on the player while the Short plays: slow, eased, held through the ending
        const p = inOutCubic(seg(t, T.play, T.brand + BRAND * 0.5));
        const z = lerp(1, PUSH_Z, p);
        player.style.transform = p > 0 ? `scale(${z.toFixed(5)})` : 'none';

        // the lock-up lands beside the window: the mascot scales up into place, the wordmark and the line follow
        if (B) {
          const W = x.root.offsetWidth, H = x.root.offsetHeight;
          const right = B.x + B.w;
          brand.style.left = `${((right + W) / 2).toFixed(2)}px`;
          brand.style.top = `${(H / 2).toFixed(2)}px`;
        }
        const lt = t - T.brand;
        const fi = seg(lt, 0.25, 0.75);
        brand.style.opacity = t >= T.brand ? '1' : '0';
        face.style.opacity = fi.toFixed(3);
        face.style.transform = `scale(${lerp(0.5, 1, outQuint(fi)).toFixed(4)})`;
        const wi = outCubic(seg(lt, 0.5, 1.0));
        words.style.opacity = wi.toFixed(3);
        words.style.transform = `translateY(${((1 - wi) * 18).toFixed(2)}px)`;
        mark.render(Math.max(0, lt));
      },
    };
  },
};
