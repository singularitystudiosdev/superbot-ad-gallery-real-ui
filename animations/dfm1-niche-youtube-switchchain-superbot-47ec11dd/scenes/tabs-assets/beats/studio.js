// Studio beat, the finale: YouTube Studio (the creator's connected account) uploads trailer.mp4, sets it as the channel
// trailer and publishes. Its line streams, then one upload card in Studio's own vocabulary lands in the chat: the header
// ("YouTube Studio", "Upload videos") whose state reads "Uploading 0%" to 100%, then "Upload complete", then "Video
// published"; the Gemini thumbnail (img/gen/thumb.jpg) with its 0:30 length chip beside the Details fields Studio shows
// ("Title (required)", "Filename" with the file's 1920x1080, 0:30, 30 fps) and the upload fill bar; and a checklist that
// ticks in turn with Studio's own status strings ("Upload complete", "Checks complete. No issues found.", "Visibility:
// Public", and the Customization, Home tab, Layout setting "Channel trailer for people who haven't subscribed", from
// https://support.google.com/youtube/answer/3219384, read 2026-10-04).
//
// Then the card's thumbnail opens to the whole frame: the channel page, YouTube desktop, dark theme (masthead, mini
// guide, banner, avatar, "Sam Rivera", "@samtestsmics", "48.2K subscribers", the Home / Videos / Shorts / Playlists /
// Posts tabs and, at the top of Home, the channel trailer: the player with the title, views, age and the description
// beside it, then the Videos shelf). The match cut: the layer starts pinned so the page's player sits exactly on the
// card's thumbnail (the same image), and GROW interpolates the whole page out to the frame. Once full frame the player
// cross-fades from the thumbnail to a real trailer frame with a thin red progress line at its first second (no play
// glyph, no transport controls), and the page holds (READ): the spot's last story frame before the end card.
//
// The page lives on ONE layer in the scene root (outside the camera), laid out once at a design size (the frame
// divided by APP_SCALE) and scaled, so the small and full sizes are the same pixels. Pure function of t: every moving
// value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=47ec11dd';

const SAY = 'Uploaded it and set it as your channel trailer.';
const CH = { name: 'Sam Rivera', handle: '@samtestsmics', subs: '48.2K subscribers', videos: '87 videos',
  about: 'Blind tests of budget mics, with real prices.' };
const VID = {
  title: 'Watch this first: 12 mics, one $29 winner', file: 'trailer.mp4', spec: '1920x1080, 0:30, 30 fps', len: '0:30',
  meta: 'No views • 1 minute ago',
  desc: 'Twelve mics. One blind test. And the winner costs twenty-nine dollars. I\'m Sam. I test the gear so you don\'t overpay.',
};
const LAST = { title: 'I tested 12 budget mics under $100', len: '14:32', meta: '41K views • 9 days ago' };
// asset paths (relative to img/): the Gemini thumbnail, and the trailer frame the player shows once it starts
const THUMB = 'gen/thumb.jpg';
const FRAME = 'gen/title-3.jpg';
const STEPS = [
  ['upload', 'Upload complete'],
  ['task-alt', 'Checks complete. No issues found.'],
  ['public', 'Visibility: <b>Public</b>'],
  ['auto-fix', 'Channel trailer for people who haven\'t subscribed: <b>set</b>'],
];

// timing (seconds from the reply start, or from the mark named)
const CPS = 110;          // the line streams at this many characters a second
const SAY_AT = 0.04;      // reply start to the first character
const CARD_AT = 0.1;      // reply start to the card rising
const RISE = 0.24;        // the card rising in
const UP_AT = 0.15;       // the card rising to the upload bar starting
const UP = 0.5;           // the upload bar filling, 0% to 100%
const ROW_AT = 0.04;      // the bar full to the first checklist row
const STEP = 0.15;        // one row to the next
const ROW_IN = 0.16;      // a row fading up, its check popping
const CARD_HOLD = 0.3;    // the finished card reads before it opens
const GROW = 0.5; /* deliberate */ // the thumbnail opens to the full-frame channel page
const PLAY_AT = 0.05;     // full frame to the player's cross-fade to the trailer frame
const PLAY_IN = 0.3;      // that cross-fade
const READ = 1.6; /* deliberate */ // the finished channel page holds (the finale)
const APP_SCALE = 1.2;    // full frame: the page's px to frame px
const RADIUS = 8;         // the card thumbnail's corner (CSS px, matches .ys-th)

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.up = [T.card + UP_AT, T.card + UP_AT + UP];
    T.row = STEPS.map((_, i) => T.up[1] + ROW_AT + i * STEP);
    T.done = T.row[STEPS.length - 1] + ROW_IN;
    T.grow = T.done + CARD_HOLD;
    T.full = T.grow + GROW;
    T.play = T.full + PLAY_AT;
    T.end = Math.max(T.full + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const { esc } = x;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const card = x.el(`<div class="ys-card">
      <div class="ys-hd"><img class="ys-logo" src="${x.brand('youtube-icon.svg')}" alt=""/><b>YouTube Studio</b><span class="ys-sub">Upload videos</span>
        <em class="ys-state"><span class="ys-st">${x.OK}</span><span class="ys-sl">Uploading 0%</span></em></div>
      <div class="ys-bd">
        <div class="ys-th"><img src="${x.img(THUMB)}" width="1280" height="720" alt=""/><i class="ys-len">${VID.len}</i></div>
        <div class="ys-meta">
          <span class="ys-lb">Title (required)</span>
          <b class="ys-ti">${esc(VID.title)}</b>
          <span class="ys-lb">Filename</span>
          <span class="ys-fn"><b>${esc(VID.file)}</b><i>${esc(VID.spec)}</i></span>
          <span class="ys-bar"><i></i></span>
        </div>
      </div>
      <div class="ys-list">${STEPS.map(([ic, s]) => `<div class="ys-row">${ms(ic, 'ys-ic')}<span>${s}</span>${x.OK}</div>`).join('')}</div>
    </div>`);
    const $c = (s) => card.querySelector(s);
    const state = $c('.ys-state'), sl = $c('.ys-sl'), bar = $c('.ys-bar i'), len = $c('.ys-len'), thumb = $c('.ys-th');
    const rows = [...card.querySelectorAll('.ys-row')].map((n) => ({ n, ck: n.querySelector('.qc-ok') }));

    // the full-frame layer: the channel page
    const tabs = ['Home', 'Videos', 'Shorts', 'Playlists', 'Posts'];
    const nav = [['home-outline', 'Home'], ['subscriptions-outline', 'Subscriptions'], ['video-library-outline', 'You'], ['history', 'History']];
    const layer = x.el(`<div class="st-full yc-full" aria-hidden="true"><div class="st-app yc">
      <div class="yc-top">
        <span class="yc-b">${ms('menu')}</span><img class="yc-logo" src="${x.brand('youtube-icon.svg')}" alt=""/>
        <span class="yc-search"><span class="yc-q">Search</span><span class="yc-sb">${ms('search')}</span></span><span class="yc-b yc-mic">${ms('mic')}</span>
        <span class="yc-r"><span class="yc-b">${ms('video-call-outline')}</span><span class="yc-b">${ms('notifications-outline')}</span><span class="yc-me">S</span></span>
      </div>
      <div class="yc-body">
        <nav class="yc-mini">${nav.map(([ic, s]) => `<span>${ms(ic)}<i>${s}</i></span>`).join('')}</nav>
        <main class="yc-main"><div class="yc-col">
          <div class="yc-banner"><img src="${x.img('blender/hero.jpg')}" width="1920" height="1080" alt=""/><span class="yc-bt"><b>Blind mic tests.</b><i>Real prices.</i></span></div>
          <div class="yc-head"><span class="yc-ava">S</span><div class="yc-hi">
            <h1>${esc(CH.name)}</h1>
            <p><b>${esc(CH.handle)}</b> • ${esc(CH.subs)} • ${esc(CH.videos)}</p>
            <p class="yc-ab">${esc(CH.about)} <span>...more</span></p>
          </div></div>
          <div class="yc-tabs">${tabs.map((s, i) => `<span${i === 0 ? ' class="on"' : ''}>${s}</span>`).join('')}<span class="yc-ts">${ms('search')}</span></div>
          <div class="yc-feat">
            <div class="yc-player"><img class="yc-f0" src="${x.img(THUMB)}" width="1280" height="720" alt=""/><img class="yc-f1" src="${x.img(FRAME)}" width="1280" height="720" alt=""/><i class="yc-prog"><i></i></i></div>
            <div class="yc-fi">
              <span class="yc-ctx">Channel trailer</span>
              <h2>${esc(VID.title)}</h2>
              <p class="yc-vm">${esc(VID.meta)}</p>
              <p class="yc-fd">${esc(VID.desc)}</p>
              <p class="yc-rm">Read more</p>
            </div>
          </div>
          <div class="yc-shelf"><h3>Videos</h3><div class="yc-grid">
            <div class="yc-v"><span class="yc-vt"><img src="${x.img(THUMB)}" width="1280" height="720" alt=""/><i>${VID.len}</i></span><b>${esc(VID.title)}</b><p>${esc(VID.meta)}</p></div>
            <div class="yc-v"><span class="yc-vt"><img src="${x.img('gen/title-1.jpg')}" width="1280" height="720" alt=""/><i>${LAST.len}</i></span><b>${esc(LAST.title)}</b><p>${esc(LAST.meta)}</p></div>
          </div></div>
        </div></main>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const player = layer.querySelector('.yc-player'), f1 = layer.querySelector('.yc-f1'), prog = layer.querySelector('.yc-prog i');

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, curState = '';
    let AW = 1600, AH = 900, P = { x: 0, y: 0, w: 1, h: 1 };
    const setState = (s, ok) => {
      if (s !== curState) { sl.textContent = s; curState = s; }
      state.classList.toggle('ok', ok);
    };
    // the player's box in the page's own (unscaled) px: offsets up to the app, which is the positioned root
    const offIn = (n) => { let px = 0, py = 0; for (let e = n; e && e !== app; e = e.offsetParent) { px += e.offsetLeft; py += e.offsetTop; } return { x: px, y: py, w: n.offsetWidth, h: n.offsetHeight }; };
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      AW = Math.round(W / APP_SCALE); AH = Math.round(H / APP_SCALE);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('yc-narrow', W < H * 1.2);
      app.classList.toggle('yc-tall', W < H);
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        const o = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = o.toFixed(3);
        card.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 10).toFixed(2)}px)`;

        const p = seg(t, T.up[0], T.up[1]);
        bar.style.width = `${(p * 100).toFixed(2)}%`;
        if (t >= T.row[2] + ROW_IN * 0.5) setState('Video published', true);
        else if (p >= 1) setState('Upload complete', true);
        else setState(`Uploading ${Math.floor(p * 100)}%`, false);
        bar.parentNode.classList.toggle('ok', p >= 1);

        rows.forEach((r, i) => {
          const a = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          r.n.style.opacity = a.toFixed(3);
          r.n.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 6).toFixed(2)}px)`;
          const c = seg(t, T.row[i] + 0.04, T.row[i] + ROW_IN);
          r.ck.style.opacity = c.toFixed(3);
          r.ck.style.transform = c >= 1 ? 'none' : `scale(${lerp(0.4, 1, outCubic(c)).toFixed(4)})`;
        });
        card.classList.toggle('ys-fin', t >= T.done);
        // the length chip leaves just before the thumbnail opens (the page's player has none)
        len.style.opacity = (1 - seg(t, T.grow - 0.12, T.grow)).toFixed(3);

        // the player: the thumbnail, then the trailer's first second
        const f = outCubic(seg(t, T.play, T.play + PLAY_IN));
        f1.style.opacity = f.toFixed(3);
        prog.style.width = `${lerp(0, 3.4, seg(t, T.play, T.end)).toFixed(3)}%`;
      },
      // after the camera: pin the page so its player sits on the card's thumbnail, then open it to the whole frame
      after(t) {
        if (t < T.grow) { layer.style.opacity = '0'; return; }
        layout();
        P = offIn(player);
        const W = x.root.offsetWidth, H = x.root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const b = x.box(thumb);
        const s0 = b.w / P.w, s1 = W / AW;
        const s = lerp(s0, s1, g);
        const tx = lerp(b.x - P.x * s0, 0, g), ty = lerp(b.y - P.y * s0, 0, g);
        app.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(5)})`;
        layer.style.width = `${W}px`; layer.style.height = `${H}px`;
        // the visible window: the thumbnail's box growing to the frame, kept inside the chat's feed while small
        feed = feed || card.closest('.feed');
        const fb = feed ? x.box(feed) : { x: 0, y: 0, w: W, h: H };
        const cl = lerp(b.x, 0, g), cr = lerp(b.x + b.w, W, g);
        const ct = Math.max(lerp(b.y, 0, g), lerp(fb.y, 0, g)), cb = Math.min(lerp(b.y + b.h, H, g), lerp(fb.y + fb.h, H, g));
        const rad = (RADIUS * (thumb.offsetWidth ? b.w / thumb.offsetWidth : 1) * (1 - g));
        if (g >= 1) layer.style.clipPath = '';
        else layer.style.clipPath = `inset(${ct.toFixed(2)}px ${(W - cr).toFixed(2)}px ${(H - cb).toFixed(2)}px ${cl.toFixed(2)}px round ${rad.toFixed(2)}px)`;
        layer.style.opacity = '1';
      },
    };
  },
};
