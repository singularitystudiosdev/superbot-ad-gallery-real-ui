// After Effects beat, the finale: superbot connects to the designer's own After Effects and runs reformat.jsx in the
// open project. After Effects is a desktop app automated through its documented scripting (ExtendScript), so there is
// no login, account, consent screen or cloud API here: a connect card lands in the chat (the superbot mark and the
// official After Effects app icon side by side, a thin line drawing between them, the project name
// "fernway_launch_v12.aep"), then four rows tick green ("Opened fernway_launch_v12.aep", "Ran reformat.jsx", "Built
// Launch Promo 9x16, 1x1 and 4x5", "Added 3 comps to the Render Queue"). A mini window under the rows holds the
// workspace; the card holds and the window opens to the full frame (the base's grow machinery).
// Full frame is After Effects' dark workspace in its measured colours (beats/aftereffects.css, research/ae-colours.txt)
// with none of its controls: no traffic lights, menu bar, tool bar, panel tabs, panel menus, viewer footers, transport,
// timeline switches, render buttons or checkboxes. Panels carry plain text titles: Project (16:9 only: the source comp,
// the three new comps landing in turn, the bottle photo, Solids), three Composition viewers (Launch Promo 9x16, 1x1 and
// 4x5, each its frame at the true aspect on the pasteboard, playing the promo in that size's layout, in sync) and the
// Render Queue (three rows: comp, output file, a status word in After Effects' wording: Queued, then Rendering with a
// thin progress bar and no time text, then Done with a green check, one after another). The ONE bold moment: the
// third row turns Done, the chime fires (window.__AD_MARKS.chime), all three viewers land the Fernway lockup together,
// and the camera pushes in to frame the three viewers. The final state holds (READ).
//
// There is ONE After Effects window, on a layer in the scene root (outside the camera). While the connect card sits in
// the chat the layer is pinned over the card's window; GROW interpolates it to the whole frame. The window is laid out
// once per frame size at a design size (the frame divided by APP_SCALE) and scaled to the layer. On a portrait frame
// (4:5) it drops the Project panel: the 9x16 viewer on the left at full height, 1x1 and 4x5 stacked on the right, the
// Render Queue below. Every value is a pure function of t.
import { lerp, seg, outCubic, outQuint, inOutCubic } from '../../../lib.js';
import { oi } from './ae-icons.js?v=74195fef';
import { makePromo, LOCK_AT, P } from './promo.js?v=74195fef';

const PROJECT = 'fernway_launch_v12.aep';
const STEPS = [
  ['folder-open', `Opened <b>${PROJECT}</b>`],
  ['file-code', 'Ran <b>reformat.jsx</b>'],
  ['layers', 'Built Launch Promo 9x16, 1x1 and 4x5'],
  ['list', 'Added 3 comps to the Render Queue'],
];
// the three new comps, in render order: [size key, comp name, output file, comp px]
const COMPS = [
  ['9x16', 'Launch Promo 9x16', 'Fernway_9x16.mp4', '1080 x 1920'],
  ['1x1', 'Launch Promo 1x1', 'Fernway_1x1.mp4', '1080 x 1080'],
  ['4x5', 'Launch Promo 4x5', 'Fernway_4x5.mp4', '1080 x 1350'],
];

const APP_SCALE = { wide: 1.3, tall: 1.0 };      // full frame: the window's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CARD_AT = 0.12;                           // reply start to the connect card rising
const CARD_IN = 0.3;                            // a card rising into the thread
const LINE_AT = 0.18;                           // the card landing to the line drawing between the two marks
const LINE = 0.35;                              // the line drawing
const CHECK_AT = 0.55;                          // the card landing to the first row's check
const CHECK_STAGGER = 0.16;                     // one row to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.3; /* deliberate */         // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens to full frame
const NEW_AT = 0.15;                            // full frame to the first new comp landing in the Project panel
const NEW_STAGGER = 0.12;                       // one new comp to the next
const ROW_IN = 0.2;                             // a Project row fading up
const RQ_AT = 0.4; /* deliberate */             // full frame to the first comp starting to render (the panels read first)
const RENDER = 0.6; /* deliberate */           // one comp rendering
const RQ_GAP = 0.06;                            // one comp done to the next starting
const PUSH_AT = 0.15; /* deliberate */          // the third comp done (the chime), then the push onto the viewers
const PUSH_IN = 0.6; /* deliberate */           // the push, outQuint
const READ = 1.15; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 8;                               // the window's radius in the card, eased to 0
const PUSH_M = { wide: 24, tall: 10 };          // the push leaves this margin (design px) around the three viewers
const PUSH_MAX = { wide: 1.3, tall: 1.06 };     // ...and never pushes further than this

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="ac-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.line = T.card + LINE_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.newRow = COMPS.map((_, i) => T.full + NEW_AT + i * NEW_STAGGER);
    T.rs = COMPS.map((_, i) => T.full + RQ_AT + i * (RENDER + RQ_GAP));   // comp i starts rendering
    T.rd = T.rs.map((s) => s + RENDER);                                    // ...and is done
    T.zero = T.rd[COMPS.length - 1];                                       // the third Done: the chime
    T.push = T.zero + PUSH_AT;
    T.settle = T.push + PUSH_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    // the renderer reads the chime mark from here (scene-local time; the tabs scene starts the spot at 0)
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });
    const AE = x.brand('aftereffects.svg');

    // ---- the connect card (superbot's own, the hub's greys and green check), the mini window under the rows ----
    const card = x.el(`<div class="ac-card">
      <div class="ac-top">
        <div class="ac-marks">${x.tile('superbot', 'ac-sb')}<i class="ac-line"><i></i></i><img class="ac-ae" src="${AE}" alt=""/></div>
        <div class="ac-proj"><b>${esc(PROJECT)}</b></div>
      </div>
      ${STEPS.map(([ic, txt]) => `<div class="ac-step"><span class="ac-ic">${oi(ic)}</span><span class="ac-tx">${txt}</span><span class="ac-ok"><i class="ac-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="ac-shot"></div>
    </div>`);
    const shot = card.querySelector('.ac-shot');
    const lineFill = card.querySelector('.ac-line i');
    const checks = [...card.querySelectorAll('.ac-ok')].map((n) => ({ spin: n.querySelector('.ac-spin'), ck: n.querySelector('.ac-ck') }));

    // ---- the full-frame After Effects window ----
    const prow = (ic, name, size, cls = '') => `<div class="ae-row ${cls}">${oi(ic, 'ae-gl')}<span class="ae-nm">${esc(name)}</span><span class="ae-sz">${esc(size)}</span></div>`;
    const layer = x.el(`<div class="ae-full" aria-hidden="true"><div class="ae-app">
      <div class="ae-title"><img class="ae-mk" src="${AE}" alt=""/><span>${esc(PROJECT)}</span></div>
      <div class="ae-body">
        <section class="ae-pn ae-proj"><div class="ae-pt">Project</div>
          ${prow('film', 'Launch Promo 16x9', '1920 x 1080')}
          ${COMPS.map(([, name, , px]) => prow('film', name, px, 'ae-new')).join('')}
          ${prow('image', 'fernway_bottle.jpg', '1400 x 933')}
          <div class="ae-row">${oi('folder', 'ae-gl')}<span class="ae-nm">Solids</span><span class="ae-sz"></span></div>
        </section>
        ${COMPS.map(([key, name], i) => `<section class="ae-pn ae-vw ae-v${i + 1}"><div class="ae-pt">${esc(name)}</div><div class="ae-pb"><div class="ae-fr" data-k="${key}"></div></div></section>`).join('')}
        <section class="ae-pn ae-rq"><div class="ae-pt">Render Queue</div>
          <div class="ae-rh"><span class="ae-c1">Comp Name</span><span class="ae-c2">Output To</span><span class="ae-c3">Status</span></div>
          ${COMPS.map(([, name, file]) => `<div class="ae-rr"><span class="ae-c1">${esc(name)}</span><span class="ae-c2">${esc(file)}</span><span class="ae-c3"><span class="ae-sw"><span class="ae-w ae-wq">Queued</span><span class="ae-w ae-wr">Rendering</span><span class="ae-w ae-wd">Done</span></span><i class="ae-bar"><i></i></i>${CHECK}</span></div>`).join('')}
        </section>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const views = [...layer.querySelectorAll('.ae-vw')];
    const frames = [...layer.querySelectorAll('.ae-fr')];
    const promos = frames.map((f) => { const p = makePromo(f.dataset.k); f.appendChild(p.el); return p; });
    const newRows = [...layer.querySelectorAll('.ae-row.ae-new')];
    const rq = $('.ae-rq');
    const rqRows = [...layer.querySelectorAll('.ae-rr')].map((n) => ({
      n, q: n.querySelector('.ae-wq'), r: n.querySelector('.ae-wr'), d: n.querySelector('.ae-wd'),
      bar: n.querySelector('.ae-bar'), fill: n.querySelector('.ae-bar i'), ck: n.querySelector('.ac-ck'),
    }));
    const fades = [$('.ae-proj'), rq, $('.ae-title')];

    let geo = '', AW = 1477, AH = 831, tall = false;
    let L = null; // per frame size: the viewers' block (design px) for the push
    let edgeOut = null;

    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('ae-narrow', tall);
      card.classList.toggle('ac-tall', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      edgeOut = null;
      // each comp's frame at its true aspect, centred on its pasteboard; the promo scaled into it
      frames.forEach((f, i) => {
        const pb = f.parentNode, p = promos[i];
        const m = tall ? 12 : 16, a = p.W / p.H;
        const fw = Math.min(pb.clientWidth - 2 * m, (pb.clientHeight - 2 * m) * a), fh = fw / a;
        f.style.width = `${fw.toFixed(2)}px`; f.style.height = `${fh.toFixed(2)}px`;
        f.style.left = `${((pb.clientWidth - fw) / 2).toFixed(2)}px`; f.style.top = `${((pb.clientHeight - fh) / 2).toFixed(2)}px`;
        p.el.style.transform = `scale(${(fw / p.W).toFixed(5)})`;
      });
      // the push: the block the three viewers make, in the window's design px
      const ar = app.getBoundingClientRect(), kk = ar.width / AW || 1;
      const bs = views.map((v) => v.getBoundingClientRect());
      const l = Math.min(...bs.map((b) => b.left)), r = Math.max(...bs.map((b) => b.right));
      const t0 = Math.min(...bs.map((b) => b.top)), b0 = Math.max(...bs.map((b) => b.bottom));
      const bx = (l - ar.left) / kk, by = (t0 - ar.top) / kk, bw = (r - l) / kk, bh = (b0 - t0) / kk;
      const M = tall ? PUSH_M.tall : PUSH_M.wide;
      const sc = Math.max(1, Math.min(tall ? PUSH_MAX.tall : PUSH_MAX.wide, AW / (bw + 2 * M), AH / (bh + 2 * M)));
      L = { cx: bx + bw / 2, cy: by + bh / 2, sc };
    };

    const ok = (t, a) => outCubic(seg(t, a, a + POP));

    return {
      nodes: [card],
      marks: [[T.card, card]],
      render(t) {
        layout();
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        lineFill.style.transform = `scaleX(${inOutCubic(seg(t, T.line, T.line + LINE)).toFixed(4)})`;
        checks.forEach((c, i) => {
          const o = ok(t, T.ok[i]);
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // the Project panel: the three new comps land in turn
        newRows.forEach((n, i) => {
          const o = outCubic(seg(t, T.newRow[i], T.newRow[i] + ROW_IN));
          n.style.opacity = o.toFixed(3);
          n.style.transform = o >= 1 ? 'none' : `translateX(${((1 - o) * -8).toFixed(2)}px)`;
        });
        // the viewers play the promo in sync; every lockup lands at the chime and then holds
        const pt = Math.min(t - T.zero + LOCK_AT, P - 0.02);
        promos.forEach((p) => p.render(pt));
        // the Render Queue: Queued, then Rendering with its bar, then Done with the check, one comp after another
        let done = 0;
        rqRows.forEach((r, i) => {
          const st = t < T.rs[i] ? 'q' : t < T.rd[i] ? 'r' : 'd';
          if (st === 'd') done++;
          r.q.style.opacity = st === 'q' ? '1' : '0';
          r.r.style.opacity = st === 'r' ? '1' : '0';
          r.d.style.opacity = st === 'd' ? '1' : '0';
          r.n.classList.toggle('ae-on', st === 'r');
          r.n.classList.toggle('ae-done', st === 'd');
          r.bar.style.opacity = st === 'r' ? '1' : '0';
          r.fill.style.transform = `scaleX(${inOutCubic(seg(t, T.rs[i], T.rd[i])).toFixed(4)})`;
          const o = outCubic(seg(t, T.rd[i], T.rd[i] + POP));
          r.ck.style.opacity = o.toFixed(3);
          r.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
        rq.dataset.done = String(done);
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame
      after(t) {
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const Lx = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1;
        layer.style.left = `${Lx.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        const k0 = Wd / AW;
        // the push onto the three viewers: their block's centre travels to the frame's centre while it scales up;
        // a panel the pushed frame would only half show fades out with it
        const pz = g >= 1 && L ? outQuint(seg(t, T.push, T.push + PUSH_IN)) : 0;
        if (pz > 0) {
          const ps = lerp(1, L.sc, pz);
          // scale about the block centre while that centre travels to the frame's centre: identity at pz=0, the
          // block centred and scaled by L.sc at pz=1 (transform-origin 0 0: v' = o + ps * v)
          const ox = L.cx * (1 - ps) + (AW / 2 - L.cx) * pz, oy = L.cy * (1 - ps) + (AH / 2 - L.cy) * pz;
          app.style.transform = `translate(${(k0 * ox).toFixed(2)}px, ${(k0 * oy).toFixed(2)}px) scale(${(k0 * ps).toFixed(5)})`;
        } else app.style.transform = `scale(${k0.toFixed(5)})`;
        if (g >= 1 && !edgeOut && L && pz === 0) {
          // in design px, at the push's end: which panels would sit partly outside the frame
          const ar = app.getBoundingClientRect(), kk = ar.width / AW;
          const mapX = (v) => L.cx + (v - L.cx) * L.sc + (AW / 2 - L.cx), mapY = (v) => L.cy + (v - L.cy) * L.sc + (AH / 2 - L.cy);
          edgeOut = fades.filter((n) => {
            const r = n.getBoundingClientRect();
            if (!r.width || !r.height) return false;
            const l = mapX((r.left - ar.left) / kk), rr = mapX((r.right - ar.left) / kk);
            const tt = mapY((r.top - ar.top) / kk), bb = mapY((r.bottom - ar.top) / kk);
            return l < -1 || rr > AW + 1 || tt < -1 || bb > AH + 1;
          });
        }
        fades.forEach((n) => { n.style.opacity = edgeOut && edgeOut.includes(n) ? (1 - pz).toFixed(3) : ''; });
        // while in the card, clip the window to the thread's visible band
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
