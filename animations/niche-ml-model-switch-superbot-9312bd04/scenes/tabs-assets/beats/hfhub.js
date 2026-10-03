// Hugging Face beat, the finale: superbot connects to the user's Hugging Face account, trains there and publishes the
// model. Hugging Face authenticates the Hub and Jobs with a user access token, and Jobs runs training on Hugging Face
// GPUs, so there is no consent screen or login here: a connect card lands in the chat (the superbot mark and the
// official Hugging Face mark side by side, a thin line drawing between them, the account "wrenfield" and its page
// "huggingface.co/wrenfield"), then four rows tick green ("Connected with your Hugging Face access token", "Trained on a
// Hugging Face GPU, 8 epochs", "Tested on 230 held-out photos: 94.3% accuracy", "Published
// wrenfield/backyard-birds-vit with a model card"). A mini window under the rows holds the model page; the card holds
// and the window opens to the full frame (the base's grow machinery). Full frame is the stripped Hugging Face model page
// (beats/hfpage.js, light theme, measured; no controls at all). The ONE bold moment: the 24 diagonal cells of the
// confusion matrix fill in one by one on a single-hue ramp from the page background to Hugging Face's orange, the
// off-diagonal finch cells light last with their annotation, the accuracy lands on "94.3%", the chime fires on that
// landing (window.__AD_MARKS.chime) and the camera pushes into the matrix. The final state holds (READ).
//
// There is ONE page, on a layer in the scene root (outside the camera). While the connect card sits in the chat the
// layer is pinned over the card's window; GROW interpolates it to the whole frame. The page is laid out once per frame
// size at a design size (the frame divided by APP_SCALE) and scaled to the layer. On a portrait frame (4:5) it drops
// the model card's heading, paragraph and Training chart: the title row, the tag line, the results as one row of three
// stats, the matrix large, and the four sample predictions in one row. Every cell, line and opacity is a pure function
// of t.
import { lerp, seg, outCubic, outQuint, inOutCubic } from '../../../lib.js';
import { mi } from './ml-icons.js?v=9312bd04';
import { pageHtml, MATRIX, N, HF, PF, ACC, LOSS, VACC } from './hfpage.js?v=9312bd04';

const ACCOUNT = 'wrenfield';
const PAGE = 'huggingface.co/wrenfield';
const STEPS = [
  ['key-round', 'Connected with your Hugging Face access token'],
  ['cpu', 'Trained on a Hugging Face GPU, 8 epochs'],
  ['target', 'Tested on 230 held-out photos: <b>94.3% accuracy</b>'],
  ['upload', 'Published <b>wrenfield/backyard-birds-vit</b> with a model card'],
];
// the ramp: page background (#ffffff) to Hugging Face's orange (#ff9d00, huggingface.co/brand), linear in sRGB
const RAMP = (v) => `rgb(255,${Math.round(255 - 98 * v)},${Math.round(255 - 255 * v)})`;

const APP_SCALE = { wide: 1.3, tall: 1.0 };      // full frame: the page's px to frame px
// timing (seconds from the reply start, or from the card where noted)
const CARD_AT = 0.12;                           // reply start to the connect card rising
const CARD_IN = 0.3;                            // a card rising into the thread
const LINE_AT = 0.18;                           // the card landing to the line drawing between the two marks
const LINE = 0.35;                              // the line drawing
const CHECK_AT = 0.55;                          // the card landing to the first row's check
const CHECK_STAGGER = 0.2;                      // one row to the next
const POP = 0.16;                               // a check popping in
const CARD_HOLD = 0.35; /* deliberate */        // the last check in, the card holds before it opens
const GROW = 0.45; /* deliberate */             // the window opens to full frame
const CHART_AT = 0.2, CHART = 0.8;              // full frame to the Training chart drawing, and its draw
const FILL_AT = 0.5; /* deliberate */           // full frame to the first diagonal cell (the page reads first)
const STEP = 0.05; /* deliberate */             // one diagonal cell to the next
const CELL_IN = 0.2;                            // a cell filling up the ramp
const FINCH_AT = 0.22;                          // the last diagonal cell in, then the two finch cells and the note
const FINCH_IN = 0.3;
const PUSH_AT = 0.12; /* deliberate */          // the landing (the chime), then the push into the matrix
const PUSH_IN = 0.55; /* deliberate */          // the push, outQuint
const PUSH = { wide: 1.55, tall: 1.18 };        // the push's scale, about the matrix's centre
const SHIFT = { wide: 1.0, tall: 1.0 };         // ...and the matrix travels all the way to the frame's centre
const READ = 1.25; /* deliberate */              // the final state holds, readable, before the scene's fade
const RADIUS = 8;                               // the window's radius in the card, eased to 0

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const CHECK = '<svg class="vc-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.line = T.card + LINE_AT;
    T.ok = STEPS.map((_, i) => T.card + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD;
    T.full = T.grow + GROW;
    T.chart = T.full + CHART_AT;
    T.m0 = T.full + FILL_AT;
    T.diag = [...Array(N)].map((_, i) => T.m0 + i * STEP);
    T.finch = T.diag[N - 1] + CELL_IN + FINCH_AT;
    T.zero = T.finch + FINCH_IN;                       // the finch cells are in, the accuracy lands: the chime
    T.push = T.zero + PUSH_AT;
    T.settle = T.push + PUSH_IN;
    T.end = T.settle + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.zero });

    // ---- the connect card (superbot's own, the hub's greys and green check), the mini window under the rows ----
    const card = x.el(`<div class="vc-card">
      <div class="vc-top">
        <div class="vc-marks">${x.tile('superbot', 'vc-sb')}<i class="vc-line"><i></i></i><img class="vc-hf" src="${x.brand('hf-logo.svg')}" alt=""/></div>
        <div class="vc-acct"><b>${esc(ACCOUNT)}</b><span>${esc(PAGE)}</span></div>
      </div>
      ${STEPS.map(([ic, txt]) => `<div class="vc-step"><span class="vc-ic">${mi(ic)}</span><span class="vc-tx">${txt}</span><span class="vc-ok"><i class="vc-spin"></i>${CHECK}</span></div>`).join('')}
      <div class="vc-shot"></div>
    </div>`);
    const shot = card.querySelector('.vc-shot');
    const lineFill = card.querySelector('.vc-line i');
    const checks = [...card.querySelectorAll('.vc-ok')].map((n) => ({ spin: n.querySelector('.vc-spin'), ck: n.querySelector('.vc-ck') }));

    // ---- the full-frame Hugging Face page ----
    const layer = x.el(pageHtml(x.brand('hf-logo.svg')));
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const $ = (s) => layer.querySelector(s);
    const body = $('.hf-body');
    const blk = { intro: $('.hf-intro'), res: $('.hf-res'), stats: $('.hf-stats'), smp: $('.hf-smp'), mxw: $('.hf-mxw'), trw: $('.hf-trw') };
    const colL = document.createElement('div'); colL.className = 'hf-colL';
    const colR = document.createElement('div'); colR.className = 'hf-colR';
    const mx = $('.hf-mx'), frame = $('.hf-frame');
    const rects = [...layer.querySelectorAll('.hf-cells rect')].map((n) => ({ n, i: +n.dataset.i, j: +n.dataset.j, fill: '' }));
    const lead = $('.hf-lead'), noteT = $('.hf-nt'), note = $('.hf-note');
    const accEls = [...layer.querySelectorAll('.hf-acc')], mac = $('.hf-mac');
    const ch = $('.hf-ch'), ax = $('.hf-ax'), loss = $('.hf-loss'), vacc = $('.hf-vacc'), ltl = $('.hf-lt-l'), lta = $('.hf-lt-a');
    const fades = [...layer.querySelectorAll('.hf-e'), $('.hf-head'), $('.hf-bar')];
    const { M, V } = MATRIX;
    // the moment each cell lights: the diagonal one by one, a stray mix-up with its row's diagonal, the finch pair last
    const lightAt = (i, j) => (i === j ? T.diag[i] : (i === HF && j === PF) || (i === PF && j === HF) ? T.finch : T.diag[i] + 0.04);

    let geo = '', AW = 1477, AH = 831, pushS = PUSH.wide, shiftK = SHIFT.wide;
    let L = null, edgeOut = null, lastAcc = '';
    let lossLen = 0, accLen = 0;

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
      app.classList.toggle('hf-narrow', tall);
      card.classList.toggle('vc-tall', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      pushS = tall ? PUSH.tall : PUSH.wide; shiftK = tall ? SHIFT.tall : SHIFT.wide;
      edgeOut = null;
      // 16:9: the model card left, the matrix and the Training chart right. 4:5: one column, no chart
      if (tall) body.replaceChildren(blk.stats, blk.mxw, blk.smp);
      else { colL.replaceChildren(blk.intro, blk.res, blk.smp); colR.replaceChildren(blk.mxw, blk.trw); body.replaceChildren(colL, colR); }

      // the matrix: a square of N x N cells in the svg's box, the note's band under it
      const sw = mx.clientWidth, sh = mx.clientHeight;
      const NOTE_H = tall ? 34 : 32;
      const side = Math.min(sw, sh - NOTE_H);
      const ox = tall ? (sw - side) / 2 : 0, oy = 0, c = side / N, gap = Math.max(0.6, c * 0.07);
      mx.setAttribute('viewBox', `0 0 ${sw} ${sh}`);
      frame.setAttribute('x', ox.toFixed(1)); frame.setAttribute('y', oy.toFixed(1));
      frame.setAttribute('width', side.toFixed(1)); frame.setAttribute('height', side.toFixed(1));
      rects.forEach((r) => {
        r.n.setAttribute('x', (ox + r.j * c + gap / 2).toFixed(2)); r.n.setAttribute('y', (oy + r.i * c + gap / 2).toFixed(2));
        r.n.setAttribute('width', (c - gap).toFixed(2)); r.n.setAttribute('height', (c - gap).toFixed(2));
      });
      // the note: right-aligned under the matrix, its leader up to the two finch cells (they sit either side of the
      // diagonal at rows/columns 20 and 21)
      const ax1 = ox + (PF + 1) * c;                                 // the right edge of cell (HF, PF)
      const nx = ox + side, ny = oy + side + NOTE_H - 9;
      noteT.setAttribute('x', nx.toFixed(1)); noteT.setAttribute('y', ny.toFixed(1));
      const lx = ox + (PF + 1.6) * c;
      lead.setAttribute('d', `M${lx.toFixed(1)} ${(ny - 16).toFixed(1)} V${(oy + (HF + 0.5) * c).toFixed(1)} H${ax1.toFixed(1)}`);

      // the Training chart (16:9 only): 8 epochs on x; loss on its own scale (top = 2.0), accuracy 60..100
      if (!tall) {
        const cw = ch.clientWidth, chh = ch.clientHeight;
        ch.setAttribute('viewBox', `0 0 ${cw} ${chh}`);
        const PL = 4, PR = 150, PT = 10, PB = 22;
        const X = (e) => PL + (e / 7) * (cw - PL - PR);
        const YL = (v) => PT + (1 - v / 2) * (chh - PT - PB);
        const YA = (v) => PT + (1 - (v - 60) / 40) * (chh - PT - PB);
        loss.setAttribute('points', LOSS.map((v, e) => `${X(e).toFixed(1)},${YL(v).toFixed(1)}`).join(' '));
        vacc.setAttribute('points', VACC.map((v, e) => `${X(e).toFixed(1)},${YA(v).toFixed(1)}`).join(' '));
        ax.innerHTML = `<line x1="${PL}" y1="${chh - PB}" x2="${(cw - PR).toFixed(1)}" y2="${chh - PB}"/>`
          + LOSS.map((_, e) => `<text x="${X(e).toFixed(1)}" y="${chh - 5}">${e + 1}</text>`).join('')
          + `<text class="hf-ep" x="${(cw - PR + 10).toFixed(1)}" y="${chh - 5}">epochs</text>`;
        ltl.setAttribute('x', (X(7) + 10).toFixed(1)); ltl.setAttribute('y', (YL(LOSS[7]) + 4).toFixed(1));
        lta.setAttribute('x', (X(7) + 10).toFixed(1)); lta.setAttribute('y', (YA(VACC[7]) + 4).toFixed(1));
        lossLen = loss.getTotalLength(); accLen = vacc.getTotalLength();
        loss.style.strokeDasharray = `${lossLen.toFixed(1)}`; vacc.style.strokeDasharray = `${accLen.toFixed(1)}`;
      }
      // the push's focus: the matrix square's centre, in the page's design px
      const mr = mx.getBoundingClientRect(), ar = app.getBoundingClientRect(), kk = ar.width / AW || 1;
      const mfx = (mr.left - ar.left) / kk + ox + side / 2, mfy = (mr.top - ar.top) / kk + oy + side / 2;
      L = { fx: mfx, fy: mfy, tall };
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

        // the Training chart draws once the page is up
        const cp = inOutCubic(seg(t, T.chart, T.chart + CHART));
        if (lossLen) { loss.style.strokeDashoffset = (lossLen * (1 - cp)).toFixed(1); vacc.style.strokeDashoffset = (accLen * (1 - cp)).toFixed(1); }
        const lg = outCubic(seg(t, T.chart + CHART - 0.15, T.chart + CHART + 0.15)).toFixed(3);
        ltl.style.opacity = lg; lta.style.opacity = lg;

        // the matrix: every cell climbs the ramp from the page background to its value when it lights
        rects.forEach((r) => {
          const v = V[r.i][r.j];
          let f = '';
          if (v > 0) {
            const a = lightAt(r.i, r.j);
            const p = outCubic(seg(t, a, a + (r.i === r.j ? CELL_IN : FINCH_IN)));
            f = p > 0 ? RAMP(v * p) : '';
          }
          if (f !== r.fill) { r.n.style.fill = f; r.fill = f; }
        });
        const np = outCubic(seg(t, T.finch, T.finch + FINCH_IN));
        note.style.opacity = np.toFixed(3);
        // the accuracy climbs with the fill and lands on 94.3% with the finch cells (the chime)
        const av = t < T.m0 ? 0 : ACC * outCubic(seg(t, T.m0, T.zero));
        const at = (t >= T.zero ? ACC : Math.min(av, ACC - 0.1)).toFixed(1) + '%';
        if (at !== lastAcc) { accEls.forEach((n) => { n.textContent = at; }); lastAcc = at; }
        mac.style.opacity = outCubic(seg(t, T.m0 - 0.15, T.m0 + 0.1)).toFixed(3);
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
        // the push into the matrix: scaled about its centre, which also travels part of the way to the frame's centre;
        // anything the pushed frame would only half show fades out with it
        const pz = g >= 1 ? outQuint(seg(t, T.push, T.push + PUSH_IN)) : 0;
        const ps = lerp(1, pushS, pz);
        const fx = L ? L.fx : 0, fy = L ? L.fy : 0;
        const dx = (AW / 2 - fx) * shiftK * pz, dy = (AH / 2 - fy) * shiftK * pz;
        app.style.transform = pz > 0
          ? `translate(${(k0 * (fx * (1 - ps) + dx)).toFixed(2)}px, ${(k0 * (fy * (1 - ps) + dy)).toFixed(2)}px) scale(${(k0 * ps).toFixed(5)})`
          : `scale(${k0.toFixed(5)})`;
        // (the layer only ever translates and scales uniformly, so positions relative to the page divided by its scale
        // are design px whatever the frame: this holds when a frame is drawn cold by __AD.seek mid-push too)
        if (!edgeOut && L && g >= 1) {
          const ar = app.getBoundingClientRect(), kk = ar.width / AW;
          const map = (v, f, d) => f + (v - f) * pushS + d;
          const DX = (AW / 2 - fx) * shiftK, DY = (AH / 2 - fy) * shiftK;
          edgeOut = fades.filter((n) => {
            const r = n.getBoundingClientRect();
            if (!r.width || !r.height) return false;
            const l = map((r.left - ar.left) / kk, fx, DX), rr = map((r.right - ar.left) / kk, fx, DX);
            const tt = map((r.top - ar.top) / kk, fy, DY), bb = map((r.bottom - ar.top) / kk, fy, DY);
            return l < -1 || rr > AW + 1 || tt < -1 || bb > AH + 1;
          });
        }
        // they are gone in the first third of the push, before the frame's edge reaches them
        // (never exactly 0: Chromium can drop an SVG's text from paint once an ancestor has sat at opacity 0, and not bring
        // it back when the opacity returns, e.g. on the next loop of the spot or a seek backwards)
        const fo = Math.max(0.002, 1 - Math.min(1, pz / 0.3));
        fades.forEach((n) => { n.style.opacity = edgeOut && edgeOut.includes(n) ? fo.toFixed(3) : ''; });
        colR.style.setProperty('--rule', fo.toFixed(3));
        const feed = card.closest('.feed');
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        layer.style.opacity = card.style.opacity;
      },
    };
  },
};
