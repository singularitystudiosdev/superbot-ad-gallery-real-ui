// Canva beat, the finale (the sibling model-switch ad's Studio finale, reskinned): superbot puts the three launch designs in the
// client's Canva folder. Its line streams ("Done. All three are in your Canva folder."), a connect card lands in the
// chat ("superbot connected to Canva", then three checks ticking in turn: "Created folder "Autumn Blend launch"",
// "Uploaded 3 designs", "Named and sized for the brief") with a mini window under it; the card holds (CARD_HOLD) and
// the window opens to full frame (GROW), the grammar of the template finale (and the source's play.js).
// Full frame is Canva's logged-in Projects view opened on a folder, light theme: the icon rail (Projects active), the
// Projects panel (All projects, Your projects with the folder tree Copperleaf Coffee > Autumn Blend launch selected,
// Shared with you, Available offline, Trash), and the white sheet with the search field, the breadcrumb "Projects >
// Copperleaf Coffee > Autumn Blend launch" and the folder title. The three design cards drop in one by one, each with
// a thin upload bar that fills, then its thumbnail (the finished design letterboxed in Canva's grey tile) fades up;
// under each its title and its design type with "Edited just now". After the third, the toast "3 designs added to
// Autumn Blend launch" rises and the camera pushes in a little on the three designs; the final state holds (READ)
// before the end card.
// X ad policy (the brief's amendment): nothing in the window is a call to action. No Create button, no Share, no
// upgrade promo, no play or close or download controls, no pointer clicks; the toast is plain text. The window keeps
// a slim superbot edge on top ("superbot", a dot, the Canva mark and "Canva") so the full frame always reads as
// superbot's window onto Canva, not as the viewer's own screen.
//
// There is ONE Canva window, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) Canva takes its narrow layout: the Projects panel
// folds away, the rail keeps its icons, the search field shrinks to its icon and the cards wrap two to a row.
// The landing (the window reaching full frame, T.full) is marked by .cv-land: opacity 0 before, 1 from T.full on, the
// element the render's chime bisect reads. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Done. All three are in your Canva folder.';
const CLIENT = 'Copperleaf Coffee';
const FOLDER = 'Autumn Blend launch';
const TOAST = `3 designs added to ${FOLDER}`;
// the three designs: image, title, Canva's design type (its category names on canva.com: Instagram Post, Instagram
// Story, Poster), the type's glyph
const DESIGNS = [
  ['design-a.jpg', 'Autumn Blend, Instagram post', 'Instagram Post', 'sq'],
  ['design-b.jpg', 'Autumn Blend, Instagram story', 'Instagram Story', 'story'],
  ['design-c.jpg', 'Autumn Blend, poster', 'Poster', 'poster'],
];
const RAIL = [['home', 'Home'], ['projects', 'Projects'], ['templates', 'Templates'], ['brand', 'Brand'], ['ai', 'Canva AI'], ['more', 'More']];

const APP_SCALE = { wide: 1.5, tall: 1.4 };       // full frame: the window's px to frame px

// timing (seconds from the reply start, or from the card or the full frame where noted)
const CPS = 80;                                  // the reply line streams (the source's play.js)
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const CHECK_AT = 0.3;                            // the card landing to the first check
const CHECK_STAGGER = 0.2;                       // one check to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens (play.js)
const GROW = 0.4; /* deliberate */               // the window opens to full frame (play.js)
const PAGE_HOLD = 0.4;                           // full frame: the empty folder reads before the first design lands
const DROP_STAGGER = 0.45;                       // one design card to the next
const DROP = 0.24;                               // a card dropping into the grid
const UPLOAD = 0.36;                             // its thin upload bar filling
const THUMB_IN = 0.2;                            // its thumbnail fading up once uploaded
const TOAST_AT = 0.12;                           // the third thumbnail in, then the toast
const TOAST_IN = 0.25;                           // the toast rising in
const PUSH_AT = 0.05;                            // the toast rising, then the camera push starts
const PUSH_DUR = 0.8;                            // the push on the three designs, inOutCubic
const PUSH = { wide: 1.06, tall: 1.05 };         // the push's scale on the folder page
const READ = 1.6; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const svg = (d, cls = '') => `<svg class="cv-i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const I = {
  home: svg('<path d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5.5h-5V20H5a1 1 0 0 1-1-1z"/>'),
  projects: svg('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
  templates: svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 4v16M12 12h8"/>'),
  brand: svg('<rect x="3.5" y="6.5" width="17" height="12" rx="3"/><circle cx="9.5" cy="12.5" r="2.2"/><path d="M14 11h3.5M14 14h2.5M9 6.5V5h6v1.5"/>'),
  ai: svg('<path d="M12 4.5c.6 3.6 1.9 4.9 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.6 4.9-1.9 5.5-5.5zM18 15.5c.3 1.6.9 2.2 2.5 2.5-1.6.3-2.2.9-2.5 2.5-.3-1.6-.9-2.2-2.5-2.5 1.6-.3 2.2-.9 2.5-2.5z"/>'),
  more: svg('<circle cx="6" cy="12" r="1.5" class="cv-fl"/><circle cx="12" cy="12" r="1.5" class="cv-fl"/><circle cx="18" cy="12" r="1.5" class="cv-fl"/>'),
  bell: svg('<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20h4"/>'),
  search: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 5 5"/>'),
  all: svg('<rect x="4" y="5" width="13" height="13" rx="2.5"/><path d="M8 3h9.5A2.5 2.5 0 0 1 20 5.5V15"/>'),
  folder: svg('<path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
  shared: svg('<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0M15.5 6.5a3 3 0 0 1 0 5.5M17 14.5a5.5 5.5 0 0 1 3.5 4.5"/>'),
  offline: svg('<circle cx="12" cy="12" r="8"/><path d="m8.5 12.2 2.5 2.5 4.7-4.9"/>'),
  trash: svg('<path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5h9l1-12.5"/>'),
  caret: svg('<path d="m9.5 7.5 5 4.5-5 4.5z" class="cv-fl"/>', 'cv-caret'),
  chev: svg('<path d="m9.5 6 6 6-6 6"/>', 'cv-chev'),
  sq: svg('<rect x="5" y="5" width="14" height="14" rx="2.5"/>'),
  story: svg('<rect x="7.5" y="3.5" width="9" height="17" rx="2.2"/>'),
  poster: svg('<rect x="6" y="4" width="12" height="16" rx="1.8"/><path d="M8.8 15.5h6.4"/>'),
  ok: svg('<circle cx="12" cy="12" r="9" class="cv-fl"/><path d="m7.8 12.3 2.8 2.8 5.6-5.6" class="cv-wk"/>'),
  ck: '<svg class="cv-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
};
// an element's position in the window's own px, transform-free (offsets up to the window)
const offIn = (el, root) => {
  let px = 0, py = 0, n = el;
  while (n && n !== root) { px += n.offsetLeft; py += n.offsetTop; n = n.offsetParent; }
  return { x: px, y: py, w: el.offsetWidth, h: el.offsetHeight };
};

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the connect card lands, the mini window in it
    T.ok = [0, 1, 2].map((i) => T.card + CHECK_AT + i * CHECK_STAGGER); // folder, uploaded, named: checks
    T.grow = T.ok[2] + POP + CARD_HOLD;               // the window starts opening
    T.full = T.grow + GROW;                           // full frame: the folder (the chime: .cv-land)
    T.drop = DESIGNS.map((_, i) => T.full + PAGE_HOLD + i * DROP_STAGGER); // A, B, C drop into the grid
    T.thumb = T.drop.map((a) => a + UPLOAD);          // each upload done: its thumbnail fades up
    T.toast = T.thumb[2] + THUMB_IN + TOAST_AT;       // "3 designs added to Autumn Blend launch"
    T.push = T.toast + PUSH_AT;                       // the camera pushes in on the three designs
    T.settle = Math.max(T.toast + TOAST_IN, T.push + PUSH_DUR);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const canva = x.brand('canva-logo.svg');

    // ---- the connect card in the chat ----
    const say = x.el(`<div class="qc-say cv-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const steps = [
      [`<span class="cv-ct-i cv-ct-f">${I.folder}</span>`, `Created folder <b>"${esc(FOLDER)}"</b>`],
      ['<span class="cv-ct-i cv-ct-n">3</span>', 'Uploaded <b>3</b> designs'],
      [`<span class="cv-ct-i cv-ct-f">${I.poster}</span>`, 'Named and sized for the brief'],
    ];
    const card = x.el(`<div class="cv-card">
      <div class="cv-step cv-step-h"><span class="cv-ct-i cv-ct-s"><img src="${canva}" alt=""/></span><span class="cv-tx"><b>superbot connected to Canva</b></span></div>
      ${steps.map(([icon, txt]) => `<div class="cv-step">${icon}<span class="cv-tx">${txt}</span><span class="cv-ok"><i class="cv-spin"></i>${I.ck}</span></div>`).join('')}
      <div class="cv-shot"></div>
    </div>`);
    const shot = card.querySelector('.cv-shot');
    const checks = [...card.querySelectorAll('.cv-ok')].map((n) => ({ spin: n.querySelector('.cv-spin'), ck: n.querySelector('.cv-ck') }));

    // ---- the full-frame Canva window: Projects, opened on the folder ----
    const layer = x.el(`<div class="cv-full" aria-hidden="true"><div class="cv-app">
      <div class="cv-edge"><img class="cv-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="cv-dot"></i><img class="cv-mk" src="${canva}" alt=""/><b>Canva</b></div>
      <div class="cv-stage">
        <nav class="cv-rail">
          <ul>${RAIL.map(([ic, lab]) => `<li class="${ic === 'projects' ? 'on' : ''}"><span class="cv-ri">${I[ic]}</span><span class="cv-rl">${lab}</span></li>`).join('')}</ul>
          <div class="cv-rb"><span class="cv-ri">${I.bell}</span><span class="cv-av">S</span></div>
        </nav>
        <aside class="cv-panel">
          <div class="cv-ph"><img src="${canva}" alt=""/></div>
          <ul class="cv-tree">
            <li>${I.all}<span>All projects</span></li>
            <li class="cv-tw">${I.caret}<span class="cv-av cv-av-s">S</span><span>Your projects</span></li>
            <li class="cv-t1 cv-tw">${I.caret}${I.folder}<span>${esc(CLIENT)}</span></li>
            <li class="cv-t2 on">${I.folder}<span>${esc(FOLDER)}</span></li>
            <li>${I.shared}<span>Shared with you</span></li>
            <li>${I.offline}<span>Available offline</span></li>
          </ul>
          <div class="cv-trash">${I.trash}<span>Trash</span></div>
        </aside>
        <main class="cv-sheet">
          <div class="cv-top"><div class="cv-search">${I.search}<span>Search designs, folders, and uploads</span></div><span class="cv-sic">${I.search}</span></div>
          <div class="cv-page">
            <div class="cv-crumb"><span>Projects</span>${I.chev}<span>${esc(CLIENT)}</span>${I.chev}<b>${esc(FOLDER)}</b></div>
            <h1 class="cv-h1">${I.folder}<span>${esc(FOLDER)}</span></h1>
            <div class="cv-grid">${DESIGNS.map(([f, title, type, ic]) => `<div class="cv-dc">
              <div class="cv-tile"><div class="cv-lb"><img src="${x.img(f)}" alt="" decoding="sync"/></div><i class="cv-up"><b></b></i></div>
              <div class="cv-dt">${esc(title)}</div>
              <div class="cv-dm">${I[ic]}<span>${esc(type)}</span><i>&bull;</i><span>Edited just now</span></div>
            </div>`).join('')}</div>
          </div>
        </main>
      </div>
      <div class="cv-toastw"><div class="cv-toast">${I.ok}<span>${esc(TOAST)}</span></div></div>
      <i class="cv-land"></i>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const q = (s) => app.querySelector(s), qa = (s) => [...app.querySelectorAll(s)];
    const E = {
      page: q('.cv-page'), grid: q('.cv-grid'), toast: q('.cv-toast'), land: q('.cv-land'),
      cards: qa('.cv-dc').map((n) => ({ n, img: n.querySelector('.cv-lb img'), up: n.querySelector('.cv-up'), bar: n.querySelector('.cv-up b'), meta: [n.querySelector('.cv-dt'), n.querySelector('.cv-dm')] })),
    };
    // the window's UI type is the vendored Canva Sans stand-in (canva.css): ask for every weight it uses up front
    if (document.fonts && document.fonts.load) ['400', '600'].forEach((w) => document.fonts.load(`${w} 14px "Noto Sans CV"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false;
    let AW = 1280, AH = 720;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes Canva's narrow layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return false;
      const key = `${W}x${H}`;
      if (key === geo) return true;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('cv-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('cv-tall', tall);
      return true;
    };
    const op = (n, v) => { n.style.opacity = v.toFixed(3); };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ok = layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        if (!ok) return;

        // the landing marker (the chime): 0 before full frame, 1 from it
        E.land.style.opacity = t >= T.full ? '1' : '0';

        // the design cards: each drops in, its upload bar fills, then its thumbnail fades up and the bar goes
        E.cards.forEach((c, i) => {
          const a = T.drop[i];
          const d = outCubic(seg(t, a, a + DROP));
          op(c.n, d);
          c.n.style.transform = d >= 1 ? '' : `translateY(${((1 - d) * -14).toFixed(2)}px) scale(${lerp(0.96, 1, d).toFixed(4)})`;
          c.bar.style.transform = `scaleX(${seg(t, a + 0.04, a + UPLOAD).toFixed(4)})`;
          op(c.up, t < a ? 0 : 1 - seg(t, T.thumb[i] + 0.02, T.thumb[i] + 0.16));
          const th = outCubic(seg(t, T.thumb[i], T.thumb[i] + THUMB_IN));
          op(c.img, th);
          c.img.style.transform = th >= 1 ? '' : `scale(${lerp(0.94, 1, th).toFixed(4)})`;
          c.meta.forEach((m) => op(m, 0.35 + 0.65 * th));
        });

        // the toast: rises from the foot of the window, plain text, and stays
        const to = outCubic(seg(t, T.toast, T.toast + TOAST_IN));
        op(E.toast, to);
        E.toast.style.transform = to >= 1 ? '' : `translateY(${((1 - to) * 18).toFixed(2)}px)`;

        // the push: only the folder page scales, inside the white sheet, so the superbot edge, the rail, the Projects
        // panel, the search field and the toast stay whole and nothing is half-cut at a frame edge. Landscape: about
        // the grid's centre column and its top edge (the title barely moves, the cards grow down and out; at 1.06 the
        // grid keeps ~10 px inside the sheet each side). Portrait: about the grid's centre
        const pu = inOutCubic(seg(t, T.push, T.push + PUSH_DUR));
        if (pu > 0) {
          const g = offIn(E.grid, app), pg = offIn(E.page, app);
          E.page.style.transformOrigin = `${(g.x - pg.x + g.w / 2).toFixed(1)}px ${(g.y - pg.y + (tall ? g.h / 2 : 0)).toFixed(1)}px`;
          E.page.style.transform = `scale(${lerp(1, tall ? PUSH.tall : PUSH.wide, pu).toFixed(4)})`;
        } else E.page.style.transform = '';
      },
      // no pointer in the finale: nothing in the Canva window is clicked (X ad policy amendment)
      pointer() { return null; },
      // after the camera: pin the layer over the card's window, then open it to the whole frame (play.js)
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is (it lands
        // while the thread is still gliding up), so it never draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
