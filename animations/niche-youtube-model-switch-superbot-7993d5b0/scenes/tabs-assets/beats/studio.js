// Studio beat, the finale: every model's output lands in one place, the premiere in the creator's YouTube Studio.
// The checklist card names each hand-off with the logo of the model that made it (title and chapters from DeepSeek,
// the trailer from Blender with Eleven v4's voice, three thumbnails from Nano Banana Pro, the guide link from Claude
// Opus 5.5) and ticks them in turn, with a mini window under it; the window opens to full frame (GROW).
// Full frame is YouTube Studio, light theme, on the video's Details page: the left menu is the video's own (its
// thumbnail, Details on), the Title field types DeepSeek's hook, the Description fills with the guide link and the
// chapters, the Thumbnail section runs Test & compare with Nano Banana Pro's A, B and C dropping in, and the video
// card on the right plays the premiere trailer (Blender's turntable render) above the visibility box: Premiere,
// Fri, Oct 9, 6:00 PM. The pointer clicks Save (the chime) and the snackbar confirms the premiere is scheduled.
//
// There is ONE Studio client, on a layer in the scene root (outside the camera). While the checklist card sits in the
// chat the layer is pinned over the card's window frame; GROW interpolates it to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, press } from '../../../lib.js';
import { ms } from './yt-icons.js?v=7993d5b0';

const SAY = 'Setting up the premiere in your YouTube Studio.';
const ACCOUNT = 'Sam Rivera';
const TITLE = 'I tested 10 gaming headsets under $100 (the $39 one won)';
const DESC = [
  'Every price, checked today: samrivera.gg/headsets',
  '',
  '0:00 The mic test',
  '1:24 Brisk 200 ($25)',
  '3:02 Halden Pro ($99)',
  '8:47 Wren H2 ($39), the winner',
];
const WHEN = 'Fri, Oct 9, 2026, 6:00 PM';
const SNACK = 'Premiere scheduled for Oct 9, 6:00 PM';
const TURN = 24;
const VNAV = [
  ['video-library-outline', 'Details', true], ['analytics-outline', 'Analytics'], ['auto-fix', 'Editor'], ['comment-outline', 'Comments'],
  ['subtitles-outline', 'Subtitles'], ['copyright-outline', 'Copyright'], ['attach-money', 'Earn'],
];

const APP_SCALE = { wide: 1.2, tall: 1.2 };
const CPS = 80;
const CARD_AT = 0.25, CARD_IN = 0.3;
const CHECK_AT = 0.3, CHECK_STAGGER = 0.17, POP = 0.16;
const CARD_HOLD = 0.35; /* deliberate */
const GROW = 0.45; /* deliberate */
const TITLE_AT = 0.15, TITLE_CPS = 120;      // full frame to the title typing
const DESC_AT = 0.55, DESC_STAGGER = 0.07;   // the description lines
const TH_AT = 0.85, TH_STAGGER = 0.14;       // the thumbnails dropping into Test & compare
const VIS_AT = 1.1;                          // the visibility box flips to Premiere
const PTR_AT = 1.35, PTR_MOVE = 0.4;         // the pointer travels to Save
const SAVE_AT = 1.85;                        // Save is clicked (the chime)
const SNACK_AT = 0.15, SNACK_IN = 0.3;
const READ = 1.9; /* deliberate */           // the final state holds, readable, before the scene's fade
const RADIUS = 8;
const SPIN = 8;                              // trailer frames per second in the video card

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="gk-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.ok = Array.from({ length: 5 }, (_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[4] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.title = T.full + TITLE_AT;
    T.desc = DESC.map((_, i) => T.full + DESC_AT + i * DESC_STAGGER);
    T.th = [0, 1, 2].map((i) => T.full + TH_AT + i * TH_STAGGER);
    T.vis = T.full + VIS_AT;
    T.ptr = T.full + PTR_AT;
    T.save = T.full + SAVE_AT;
    T.snack = T.save + SNACK_AT;
    T.end = T.snack + SNACK_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const icon = (f) => x.brand(f);
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.save });

    const say = x.el(`<div class="qc-say gm-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const STEPS = [
      ['<span class="gk-ic gk-av">S</span>', `Connected as <b>${ACCOUNT}</b>`],
      [`<span class="gk-ic gk-lg"><img src="${icon('deepseek-logo.svg')}" alt=""/></span>`, 'Title and chapters from DeepSeek'],
      [`<span class="gk-ic gk-lg"><img src="${icon('blender-logo.svg')}" alt=""/></span>`, 'Premiere trailer: Blender + Eleven v4'],
      [`<span class="gk-ic gk-lg gk-dk"><img src="${icon('gemini-logo.svg')}" alt=""/></span>`, '3 thumbnails in Test &amp; compare'],
      [`<span class="gk-ic gk-lg gk-op"><img src="${icon('claude-logo.svg')}" alt=""/></span>`, 'Guide link from Claude Opus 5.5'],
    ];
    const card = x.el(`<div class="gk-card">
      ${STEPS.map(([ic, txt]) => `<div class="gk-step">${ic}<span class="gk-tx">${txt}</span><span class="gk-ok"><i class="gk-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="gk-shot"></div>
    </div>`);
    const shot = card.querySelector('.gk-shot');
    const checks = [...card.querySelectorAll('.gk-ok')].map((n) => ({ spin: n.querySelector('.gk-spin'), ck: n.querySelector('.gk-ck') }));

    const thumbs = ['thumb-a.jpg', 'thumb-b.jpg', 'thumb-c.jpg'];
    const layer = x.el(`<div class="st-full" aria-hidden="true"><div class="st-app">
      <header class="st-top">
        <span class="st-btn">${ms('menu')}</span>
        <span class="st-logo"><img src="${icon('youtube-studio-logo.svg')}" alt=""/></span>
        <div class="st-search">${ms('search')}<span>Search across your channel</span></div>
        <span class="st-tools"><span class="st-btn">${ms('help-outline')}</span><span class="st-create">${ms('video-call-outline')}<span>Create</span></span></span>
        <span class="st-me">S</span>
      </header>
      <div class="st-main">
        <nav class="st-nav sd-nav">
          <div class="sd-back">${ms('keyboard-arrow-down', 'sd-bk')}<span>Channel content</span></div>
          <div class="sd-vthumb"><img src="${x.img('thumb-a.jpg')}" alt=""/></div>
          <div class="sd-vlab"><small>Your video</small><b>${esc(TITLE)}</b></div>
          ${VNAV.map(([ic, label, on]) => `<div class="st-nv${on ? ' st-on' : ''}">${ms(ic)}<span>${esc(label)}</span></div>`).join('')}
        </nav>
        <section class="st-page sd-page">
          <div class="sd-head"><h1 class="st-h1">Video details</h1><span class="sd-sp"></span><span class="sd-undo">Undo changes</span><span class="sd-save">Save</span><span class="st-btn">${ms('more-vert')}</span></div>
          <div class="sd-cols">
            <div class="sd-form">
              <div class="sd-field"><label>Title (required)</label><div class="sd-val sd-title"><span class="sd-tv"></span><i class="sd-caret"></i></div><small class="sd-count">0/100</small></div>
              <div class="sd-field sd-desc"><label>Description</label>${DESC.map((l) => `<div class="sd-dl">${l ? esc(l).replace('samrivera.gg/headsets', '<a>samrivera.gg/headsets</a>') : '&nbsp;'}</div>`).join('')}</div>
              <div class="sd-thumbs"><div class="sd-tt">Thumbnail</div><div class="sd-ts">Test up to three thumbnails. YouTube shows each one to viewers and picks the winner by watch time.</div>
                <div class="sd-row"><span class="sd-tc">Test &amp; compare</span>${thumbs.map((f, i) => `<figure class="sd-th"><img src="${x.img(f)}" alt=""/><b>${'ABC'[i]}</b></figure>`).join('')}</div></div>
              <div class="sd-two">
                <div><div class="sd-tt">Playlists</div><div class="sd-sel"><span>Headsets &amp; mics</span>${ms('arrow-drop-down')}</div></div>
                <div><div class="sd-tt">Audience</div><div class="sd-radio"><i></i><span>Yes, it's made for kids</span></div><div class="sd-radio sd-r-on"><i></i><span>No, it's not made for kids</span></div></div>
              </div>
            </div>
            <aside class="sd-side">
              <div class="sd-player">${Array.from({ length: TURN }, (_, i) => `<img src="${x.img(`turn/t${String(i).padStart(2, '0')}.jpg`)}" alt=""/>`).join('')}<span class="sd-ptag">Premiere trailer · 0:15</span></div>
              <div class="sd-meta"><small>Video link</small><a>https://youtu.be/w9Hx2qLmR4c</a><small>Filename</small><span>headsets-final-v3.mp4</span></div>
              <div class="sd-vis"><small>Visibility</small><div class="sd-vv"><span class="sd-draft">Private</span><span class="sd-prem"><b>Premiere</b><span>${esc(WHEN)}</span></span></div></div>
            </aside>
          </div>
        </section>
      </div>
      <div class="st-snack">${esc(SNACK)}</div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const tv = $('.sd-tv'), caret = $('.sd-caret'), count = $('.sd-count');
    const dls = [...layer.querySelectorAll('.sd-dl')];
    const ths = [...layer.querySelectorAll('.sd-th')];
    const frames = [...layer.querySelectorAll('.sd-player img')];
    const draft = $('.sd-draft'), prem = $('.sd-prem'), save = $('.sd-save'), snack = $('.st-snack');
    if (document.fonts && document.fonts.load) {
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 14px "Roboto GM"`));
      ['400', '500', '700'].forEach((w) => document.fonts.load(`${w} 16px "GSF"`));
    }

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, lastT = -1, lastF = -1;
    let AW = 1600, AH = 900;
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      const tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('st-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('gk-tall', tall);
    };

    // the pointer: in from the lower right onto Save, a press, then away
    const ptr = (t) => {
      const a = T.ptr, b = T.save - 0.08;
      if (t < a || t > T.save + 0.5) return null;
      const g = x.box(save);
      if (!g.w) return null;
      const ex = g.x + g.w * 0.5, ey = g.y + g.h * 0.6;
      const m = inOutCubic(seg(t, a, Math.min(b, a + PTR_MOVE)));
      const leave = outCubic(seg(t, T.save + 0.22, T.save + 0.5));
      return { x: lerp(ex + 220, ex, m) + leave * 60, y: lerp(ey + 260, ey, m) + leave * 40, p: press(t, T.save), v: seg(t, a, a + 0.12) * (1 - leave) };
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      pointer: ptr,
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

        // the Details page fills: the title types, the description lines land, the thumbnails drop into the test
        const tn = streamCount(TITLE, t < T.title ? Infinity : T.title, TITLE_CPS, t);
        if (tn !== lastT) { tv.textContent = TITLE.slice(0, tn); count.textContent = `${tn}/100`; lastT = tn; }
        caret.style.opacity = t >= T.title && t < T.desc[0] ? '1' : '0';
        dls.forEach((d, i) => { const p = outCubic(seg(t, T.desc[i], T.desc[i] + 0.2)); d.style.opacity = p.toFixed(3); });
        ths.forEach((th, i) => {
          const p = outCubic(seg(t, T.th[i], T.th[i] + 0.3));
          th.style.opacity = p.toFixed(3);
          th.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * -14).toFixed(2)}px) scale(${lerp(1.08, 1, p).toFixed(4)})`;
        });
        // the trailer plays in the video card; the visibility box flips from Private to the scheduled Premiere
        const f = Math.floor(Math.max(0, t - T.full) * SPIN) % TURN;
        if (f !== lastF) { frames.forEach((im, i) => { im.style.opacity = i === f ? '1' : '0'; }); lastF = f; }
        const v = outCubic(seg(t, T.vis, T.vis + 0.3));
        draft.style.opacity = (1 - v).toFixed(3);
        prem.style.opacity = v.toFixed(3);
        const pr = press(t, T.save);
        save.style.transform = pr ? `scale(${(1 - 0.06 * pr).toFixed(4)})` : 'none';
        save.classList.toggle('sd-dirty', t >= T.desc[0] && t < T.save + 0.1);
        const sn = outCubic(seg(t, T.snack, T.snack + SNACK_IN));
        snack.style.opacity = sn.toFixed(3);
        snack.style.transform = sn >= 1 ? 'none' : `translateY(${((1 - sn) * 24).toFixed(2)}px)`;
      },
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
