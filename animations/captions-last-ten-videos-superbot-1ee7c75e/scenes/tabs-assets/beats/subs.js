// Subtitles beat, the finale: superbot uploads the ten .srt files from Jonah's own YouTube Studio. The "Connecting to
// YouTube Studio" pill checks, and ONE Studio client (light theme, Roboto) opens out of the pill to the full frame:
// the left menu with Subtitles selected, the Channel subtitles page (All / Drafts / Published), and the ten latest
// uploads as rows (thumbnail with its length, title, description line, Language, Modified on, Subtitles). Every row's
// Subtitles cell starts as Studio's blue "Add". Over the page's header band, top right, sits superbot's dark status
// bar, the connect checklist laid flat: "Connected as Jonah Plays", the per-video route Studio's help page names
// (English > Add > Upload file > With timing), and the counter "N videos captioned", each with a spinner that resolves
// to a check. Then the ONE bold moment: the rows flip from "Add" to "Published" top to bottom in a fast cascade (each
// row's Modified on turns to today, a blue wash pulses), the counter climbs to "10 videos captioned", its check lands,
// and the final state holds (READ). The client is laid out once at a design size (the frame / APP_SCALE) and scaled to
// the layer, so the opening and the full frame are the same pixels at two sizes. Pure function of t.
import { lerp, seg, outCubic, inOutCubic } from '../../../lib.js';
import { ms } from './yt-icons.js?v=1ee7c75e';
import { VIDEOS, CHANNEL, TODAY } from './videos.js?v=1ee7c75e';

const NAV = [
  ['dashboard-outline', 'Dashboard'], ['video-library-outline', 'Content'], ['analytics-outline', 'Analytics'],
  ['comment-outline', 'Community'], ['subtitles-outline', 'Subtitles', true], ['copyright-outline', 'Copyright'],
  ['attach-money', 'Earn'], ['auto-fix', 'Customization'], ['library-music-outline', 'Audio library'],
];
// the route superbot runs on every video, in Studio's own labels (support.google.com/youtube/answer/2734796)
const ROUTE = ['English', 'Add', 'Upload file', '<b>With timing</b>'];
const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';

const APP_SCALE = 1.1;                  // full frame: the client's px to frame px
// timing (seconds from the reply start)
const GROW = 0.3; /* deliberate */      // the window opens out of the pill to the full frame
const OPEN_W = 420;                     // the window's width (frame px) as it leaves the pill
const BAR_AT = -0.06;                   // full frame to the status bar landing (it lands as the grow settles)
const BAR_IN = 0.18;
const OK0 = 0.08, OK1 = 0.2;            // full frame to "Connected as" and the route checking
const FLIP_AT = 0.16;                   // full frame to the first row flipping
const FLIP_STEP = 0.058; /* deliberate */ // one row to the next: the cascade
const FLIP = 0.12;                      // a cell's Add leaving and Published arriving
const WASH = 0.5;                       // a flipped row's blue wash fading back to white
const OK2 = 0.04;                       // the last flip to the counter's check
const READ = 0.36; /* deliberate */     // the final state holds before the scene's fade
const RADIUS = 12;                      // the window's radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="sb-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.g0 = r - 0.02;
    T.full = T.g0 + GROW;
    T.bar = T.full + BAR_AT;
    T.ok = [T.full + OK0, T.full + OK1];
    T.flip = VIDEOS.map((_, i) => T.full + FLIP_AT + i * FLIP_STEP);
    T.ok.push(T.flip[VIDEOS.length - 1] + FLIP * 0.5 + OK2);
    T.end = T.ok[2] + 0.16 + READ;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { subs: { g0: T.g0, full: T.full, bar: T.bar, ok: T.ok, flip: T.flip } });
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    // this step's pill (chat.js adds it just before the reply that carries this beat): the window opens out of it
    const pills = x.hub.querySelectorAll('.qc-sw');
    const pill = pills[pills.length - 1];
    const say = x.el(`<div class="qc-say"><span class="qc-vis">Uploading the 10 .srt files as ${esc(CHANNEL)}.</span></div>`);

    const row = (v) => `<div class="sb-row"><i class="sb-wash"></i>
      <span class="sb-th"><img src="${x.img(v.thumb)}" width="640" height="360" alt=""/><i class="sb-len">${v.len}</i></span>
      <div class="sb-vt"><b>${esc(v.title)}</b><small>${esc(v.desc)}</small></div>
      <span class="sb-lang">English</span>
      <span class="sb-mod"><span class="sb-m0">${v.up}</span><span class="sb-m1">${TODAY}</span></span>
      <span class="sb-sub"><span class="sb-add">Add</span><span class="sb-pub">Published</span></span>
    </div>`;
    const step = (ic, html) => `<span class="sb-step">${ic}<span class="sb-tx">${html}</span><span class="sb-ok"><i class="sb-spin"></i>${CHECK}</span></span>`;
    const layer = x.el(`<div class="st-full sb-full" aria-hidden="true"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        <span class="st-me">J</span>
      </header>
      <div class="st-main">
        <nav class="st-nav">
          <div class="st-chan"><span class="st-big">J</span><b>Your channel</b><small>${esc(CHANNEL)}</small></div>
          ${NAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
          <div class="st-nfoot"><div class="st-nv">${ms('settings-outline')}<span>Settings</span></div><div class="st-nv">${ms('feedback-outline')}<span>Send feedback</span></div></div>
        </nav>
        <section class="st-page">
          <h1 class="st-h1">Channel subtitles</h1>
          <div class="st-tabs"><span class="st-tab st-tab-on">All</span><span class="st-tab">Drafts</span><span class="st-tab">Published</span></div>
          <div class="sb-thead"><span class="sb-vt">Video</span><span class="sb-lang">Language</span><span class="sb-mod">Modified on</span><span class="sb-sub">Subtitles</span></div>
          <div class="sb-rows">${VIDEOS.map(row).join('')}</div>
        </section>
      </div>
      <div class="sb-bar">
        <span class="sb-tile">${SB_MARK}</span>
        ${step('<span class="sb-av">J</span>', `Connected as <b>${esc(CHANNEL)}</b>`)}
        ${step(`<span class="sb-ms">${ms('subtitles-outline')}</span>`, ROUTE.join('<i class="sb-sep">›</i>'))}
        ${step('', '<b class="sb-cnt"><span class="sb-cn">0</span> videos captioned</b>')}
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const rows = [...layer.querySelectorAll('.sb-row')].map((n) => ({
      wash: n.querySelector('.sb-wash'), add: n.querySelector('.sb-add'), pub: n.querySelector('.sb-pub'),
      m0: n.querySelector('.sb-m0'), m1: n.querySelector('.sb-m1'),
    }));
    const bar = $('.sb-bar'), cn = $('.sb-cn'), cnt = $('.sb-cnt');
    const oks = [...layer.querySelectorAll('.sb-ok')].map((n) => ({ spin: n.querySelector('.sb-spin'), ck: n.querySelector('.sb-ck') }));
    if (document.fonts && document.fonts.load) ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
    let geo = '', AW = 1745, AH = 982, shown = '';

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      AW = Math.round(W / APP_SCALE); AH = Math.round(H / APP_SCALE);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
    };

    return {
      nodes: [say],
      marks: [[T.r, say]],
      render(t) {
        layout();
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
        // the cascade: Add slides up and out, Published rises in, the date turns to today, the row's wash pulses
        let done = 0;
        rows.forEach((rw, i) => {
          const a = T.flip[i];
          const f = inOutCubic(seg(t, a, a + FLIP));
          if (t >= a + FLIP * 0.5) done++;
          rw.add.style.opacity = (1 - f).toFixed(3);
          rw.add.style.transform = f > 0 ? `translateY(${(-f * 10).toFixed(2)}px)` : 'none';
          rw.pub.style.opacity = f.toFixed(3);
          rw.pub.style.transform = f < 1 ? `translateY(${((1 - f) * 10).toFixed(2)}px)` : 'none';
          rw.m0.style.opacity = (1 - f).toFixed(3);
          rw.m0.style.transform = rw.add.style.transform;
          rw.m1.style.opacity = f.toFixed(3);
          rw.m1.style.transform = rw.pub.style.transform;
          rw.wash.style.opacity = t < a ? '0' : (1 - inOutCubic(seg(t, a + FLIP, a + FLIP + WASH))).toFixed(3);
        });
        const s = String(done);
        if (s !== shown) { cn.textContent = s; shown = s; }
        // the counter ticks with each row; a small pop on the last
        const pop = Math.sin(Math.PI * seg(t, T.flip[VIDEOS.length - 1], T.flip[VIDEOS.length - 1] + 0.24));
        cnt.style.transform = pop > 0 ? `scale(${(1 + 0.08 * pop).toFixed(4)})` : 'none';
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
