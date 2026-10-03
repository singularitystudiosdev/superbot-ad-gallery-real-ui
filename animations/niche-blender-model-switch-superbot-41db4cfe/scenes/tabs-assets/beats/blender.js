// Blender beat, the finale (the sibling's connect-and-grow finale grammar, re-themed): superbot runs
// the scene script in Blender on this Mac and shows the three renders. Its line streams, then a plain status row lands
// in the chat (the Blender mark, "Blender 5.2 · this Mac · Connected", its spinner resolving to a green check) with a
// mini window under it; the row holds (CARD_HOLD) and the window grows to full frame (GROW).
// Full frame is superbot's own result window, NOT a reproduction of Blender's interface: a slim title bar ("superbot ·
// Blender", the two marks and the words, no window buttons), then a dark neutral panel (Blender-ish greys) with a
// narrow plain-text list of the scene's objects and the three real Cycles renders, large, each captioned with its
// colorway name and hex. The renders land one after another (a soft reveal, top to bottom), then the footer line
// "3 renders saved to product_page/renders" and a small camera push on the renders; the final state holds (READ).
// X ad policy: nothing here is a control or a promise. No buttons, no window dots, no close mark, no chevrons or
// disclosure triangles, no eye/camera toggles, no render time, sample count, progress or timeline; no pointer clicks.
// 16:9: the object list on the left, the three renders in one row. 4:5: the hero (Sage) on top beside the object list,
// Coral and Midnight below it, so all three stay big.
//
// There is ONE result window, on a layer in the scene root (outside the camera). While the row sits in the chat the
// layer is pinned over the mini window's frame; GROW interpolates it from there to the whole frame. The window is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes.
// The landing (the window reaching full frame, T.full) is marked by .bl-land: opacity 0 before, 1 from T.full on, the
// element the render's chime bisect reads. Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Done. Rendered in Blender on your Mac, one shot per colorway.';
const STATUS = ['Blender 5.2', 'this Mac', 'Connected'];
// the three renders: image, colorway, hex
const RENDERS = [
  ['render-sage.jpg', 'Sage', '#8FAE8B'],
  ['render-coral.jpg', 'Coral', '#E2725B'],
  ['render-midnight.jpg', 'Midnight', '#1E2A44'],
];
// the scene's objects, as the script's scene holds them (the asset build's out/outliner.txt)
// <outliner>
const OBJECTS = [['AlarmClock', 0], ['AlarmClock_rig', 1], ['Camera_85mm', 0], ['Fill light', 0], ['Key light', 0], ['Rim light', 0], ['Sweep', 0]]; // [name, depth under the scene collection]
// </outliner>
const SAVED = '3 renders saved to product_page/renders';

const APP_SCALE = { wide: 1.3, tall: 1.3 };       // full frame: the window's px to frame px

// timing (seconds from the reply start, or from the row or the full frame where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.25;                            // the line streams, then the status row lands
const CARD_IN = 0.3;                             // the row and its mini window rising into the thread
const CHECK_AT = 0.35;                           // the row landing to its check
const POP = 0.16;                                // the check popping in
const CARD_HOLD = 0.35; /* deliberate */         // the check in, the row holds before the window opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const PAGE_HOLD = 0.3;                           // full frame: the panel reads before the first render lands
const STAGGER = 0.4;                             // one render to the next
const REVEAL = 0.5;                              // a render's reveal, top to bottom
const SAVED_AT = 0.1;                            // the third render in, then the footer line
const SAVED_IN = 0.25;                           // the footer line rising in
const PUSH_AT = 0.05;                            // the footer rising, then the camera push starts
const PUSH_DUR = 0.8;                            // the push on the renders, inOutCubic
const PUSH = { wide: 1.03, tall: 1.025 };         // the push's scale on the renders area
const READ = 1.8; /* deliberate */               // the final state holds, readable, before the scene's fade (>= 1.5)
const RADIUS = 8;                                // the mini window's radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CK = '<svg class="bl-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
// an element's position in the window's own px, transform-free (offsets up to the window)
const offIn = (el, root) => {
  let px = 0, py = 0, n = el;
  while (n && n !== root) { px += n.offsetLeft; py += n.offsetTop; n = n.offsetParent; }
  return { x: px, y: py, w: el.offsetWidth, h: el.offsetHeight };
};

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the status row lands, the mini window under it
    T.ok = T.card + CHECK_AT;                         // Connected: the check
    T.grow = T.ok + POP + CARD_HOLD;                  // the window starts opening
    T.full = T.grow + GROW;                           // full frame (the chime: .bl-land)
    T.shot = RENDERS.map((_, i) => T.full + PAGE_HOLD + i * STAGGER); // Sage, Coral, Midnight land
    T.saved = T.shot[2] + REVEAL + SAVED_AT;          // "3 renders saved to product_page/renders"
    T.push = T.saved + PUSH_AT;                       // the camera pushes in a little on the renders
    T.settle = Math.max(T.saved + SAVED_IN, T.push + PUSH_DUR);
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    const mark = x.brand('blender-logo.svg');

    // ---- the status row in the chat, the mini window under it ----
    const say = x.el(`<div class="qc-say bl-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="bl-card">
      <div class="bl-step"><img class="bl-sm" src="${mark}" alt=""/><span class="bl-tx">${STATUS.map((s, i) => (i === 2 ? `<b>${esc(s)}</b>` : esc(s))).join(' <i>&middot;</i> ')}</span><span class="bl-ok"><i class="bl-spin"></i>${CK}</span></div>
      <div class="bl-shot"></div>
    </div>`);
    const shot = card.querySelector('.bl-shot');
    const chk = { spin: card.querySelector('.bl-spin'), ck: card.querySelector('.bl-ck') };

    // ---- the full-frame result window ----
    const tiles = RENDERS.map(([f, name, hex], i) => `<figure class="bl-r bl-r${i}">
        <div class="bl-img"><img src="${x.img(f)}" alt="" decoding="sync"/></div>
        <figcaption><i style="background:${hex}"></i><b>${esc(name)}</b><span>${esc(hex)}</span></figcaption>
      </figure>`).join('');
    const layer = x.el(`<div class="bl-full" aria-hidden="true"><div class="bl-app">
      <div class="bl-bar"><img class="bl-sb" src="${x.sbSrc}" alt=""/><b>superbot</b><i class="bl-dot"></i><img class="bl-mk" src="${mark}" alt=""/><b>Blender</b></div>
      <div class="bl-body">
        <aside class="bl-list"><div class="bl-cap">Scene</div>${OBJECTS.map(([o, d]) => `<div class="bl-o"${d ? ` style="padding-left:${d * 16}px"` : ''}>${esc(o)}</div>`).join('')}</aside>
        <main class="bl-main"><div class="bl-cap">Renders</div><div class="bl-grid">${tiles}</div>
          <div class="bl-foot"><span class="bl-saved">${CK}${esc(SAVED)}</span></div></main>
      </div>
      <i class="bl-land"></i>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const q = (s) => app.querySelector(s);
    const E = {
      grid: q('.bl-grid'), saved: q('.bl-saved'), land: q('.bl-land'),
      shots: [...app.querySelectorAll('.bl-r')].map((n) => ({ n, img: n.querySelector('.bl-img img'), cap: n.querySelector('figcaption') })),
    };

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false;
    let AW = 1280, AH = 720;

    // the window's design size from the frame: W x H over APP_SCALE; a portrait frame takes the stacked layout
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
      app.classList.toggle('bl-tall', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('bl-ctall', tall);
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
        const o = outCubic(seg(t, T.ok, T.ok + POP));
        chk.spin.style.opacity = (1 - seg(t, T.ok - 0.06, T.ok + 0.04)).toFixed(3);
        chk.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        chk.ck.style.opacity = o.toFixed(3);
        chk.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        if (!ok) return;

        // the landing marker (the chime): 0 before full frame, 1 from it
        E.land.style.opacity = t >= T.full ? '1' : '0';

        // the renders: each is revealed top to bottom with a soft lift; its caption brightens as it lands
        E.shots.forEach((c, i) => {
          const a = T.shot[i];
          const p = inOutCubic(seg(t, a, a + REVEAL));
          c.img.style.clipPath = p >= 1 ? 'none' : `inset(0 0 ${(100 - p * 100).toFixed(2)}% 0)`;
          c.img.style.transform = p >= 1 ? '' : `scale(${lerp(1.03, 1, p).toFixed(4)})`;
          op(c.cap, 0.3 + 0.7 * outCubic(seg(t, a + REVEAL - 0.15, a + REVEAL + 0.1)));
        });

        // the footer line: plain text with a check, and it stays
        const so = outCubic(seg(t, T.saved, T.saved + SAVED_IN));
        op(E.saved, so);
        E.saved.style.transform = so >= 1 ? '' : `translateY(${((1 - so) * 10).toFixed(2)}px)`;

        // the push: only the renders grid scales, about its own centre, so the bar, the list and the footer stay whole
        const pu = inOutCubic(seg(t, T.push, T.push + PUSH_DUR));
        if (pu > 0) {
          const g = offIn(E.grid, E.grid.offsetParent || app);
          E.grid.style.transformOrigin = `${(g.w / 2).toFixed(1)}px ${(g.h / 2).toFixed(1)}px`;
          E.grid.style.transform = `scale(${lerp(1, tall ? PUSH.tall : PUSH.wide, pu).toFixed(4)})`;
        } else E.grid.style.transform = '';
      },
      // no pointer in the finale: nothing is clicked (X ad policy)
      pointer() { return null; },
      // after the camera: pin the layer over the mini window, then open it to the whole frame
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
        // while the row sits in the chat the layer is cut to the feed's viewport, as the row itself is (it lands
        // while the thread is still gliding up), so it never draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
