// Midjourney beat, the second step of the chain (forked from the dark-souls v4 ad's beats/art.js): Midjourney v7 takes
// the moodboard DeepSeek picked and imagines the heroine. Its line streams, the job card lands, the /imagine prompt types
// itself in, then the 2x2 grid resolves out of noise the way a Midjourney job does (all four frames at once, blur and
// grain falling away while the percent counts up), the U1..U4 / V1..V4 buttons go live, U2 is pressed, and the second
// frame is upscaled: its ring lights, the other three dim, and the "Upscaled (Subtle)" line stamps its check.
//
// IMAGERY / SOURCING (nothing hand-drawn):
//   img/esc/plates/plate-1..4.jpg  1024x1280 (4:5) frames of @anabology's "18 MONTHS TO ESCAPE" film
//                                  (x.com/anabology/status/2103534482930491441), cropped; see img/esc/CREDITS.txt.
//                                  No Midjourney API key exists on this machine, so the grid shows the film's own frames.
//   brand/midjourney-logo.svg      the Midjourney emblem from Wikimedia Commons (File:Midjourney_Emblem.svg, public
//                                  domain, trademarked), recoloured white and given a viewBox; see brand/CREDITS.txt.
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { lerp, seg, outCubic, outBack, streamCount, press } from '../../../lib.js';

const SAY = 'Imagining her from the moodboard.';
const CMD = '/imagine';
const PROMPT = 'a woman with a black bob in a white puff-sleeve blouse and black pleated skirt, backlit server halls, night highways, editorial fashion film still';
const PARAMS = ['--ar 4:5', '--v 7', '--style raw'];
const PLATES = ['esc/plates/plate-1.jpg', 'esc/plates/plate-2.jpg', 'esc/plates/plate-3.jpg', 'esc/plates/plate-4.jpg'];
const PICK = 1;         // U2: the second frame is the one upscaled
const CPS = 150;        // prompt typing speed
const RENDER = 1.35;    // seconds the grid takes to resolve out of noise
const TSTAG = 0.07;     // each frame starts resolving a hair after the one before it

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.2;                                           // the job card lands
    T.type = T.card + 0.3;                                      // the prompt types in
    T.typed = T.type + PROMPT.length / CPS;
    T.gen = T.typed + 0.12;                                     // the job starts
    T.tile = PLATES.map((_, i) => T.gen + i * TSTAG);           // each frame starts resolving
    T.sharp = T.tile.map((a) => a + RENDER);                    // ...and is fully sharp here
    T.done = T.sharp[PLATES.length - 1];
    T.btn = T.done + 0.08;                                      // U/V buttons go live
    T.u2 = T.btn + 0.4;                                         // U2 is pressed
    T.up = T.u2 + 0.18;                                         // the upscale lands on frame 2
    T.end = T.up + 0.7;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const btns = (p) => [1, 2, 3, 4].map((n) => `<i class="mj-b${p === 'U' && n === PICK + 1 ? ' mj-u2' : ''}">${p}${n}</i>`).join('');
    const card = x.el(`<div class="mj">
      <div class="mj-hd"><span class="mj-mk"><img src="${x.brand('midjourney-logo.svg')}" alt=""/></span><b>Midjourney</b><span class="mj-v">v7</span>
        <span class="mj-st"><i class="mj-spin"></i><span class="mj-stl">Queued</span></span></div>
      <div class="mj-bd">
        <div class="mj-grid">${PLATES.map((src, i) => `<div class="mj-t">
          <img class="mj-im" src="${x.img(src)}" alt="" decoding="sync"/>
          <i class="mj-noise" aria-hidden="true"></i>
          <span class="mj-n">${i + 1}</span>
        </div>`).join('')}</div>
        <div class="mj-side">
          <div class="mj-pr"><b class="mj-cmd">${CMD}</b> <span class="mj-vis"></span><i class="mj-caret"></i><span class="mj-hid"></span></div>
          <div class="mj-ps">${PARAMS.map((p) => `<span class="mj-p">${x.esc(p)}</span>`).join('')}</div>
          <div class="mj-row">${btns('U')}</div>
          <div class="mj-row">${btns('V')}</div>
          <div class="mj-upl"><span class="mj-ok">${x.OK}</span>Upscaled (Subtle) <b>#2</b></div>
        </div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const tiles = [...card.querySelectorAll('.mj-t')].map((n) => ({ n, im: n.querySelector('.mj-im'), noise: n.querySelector('.mj-noise') }));
    const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
    const pv = $('.mj-vis'), ph = $('.mj-hid'), caret = $('.mj-caret');
    const stl = $('.mj-stl'), spin = $('.mj-spin'), st = $('.mj-st');
    const rows = [...card.querySelectorAll('.mj-row')];
    const u2 = $('.mj-u2');
    const upl = $('.mj-upl'), ok = upl.querySelector('.qc-ok');
    let shown = -1, pShown = -1, lastSt = '';

    return {
      nodes: [sayEl, card],
      marks: [[T.r, sayEl], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the job card rises in as one sheet
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the /imagine prompt types in, its caret blinking while it lands
        const pn = streamCount(PROMPT, T.type, CPS, t);
        if (pn !== pShown) { pv.textContent = PROMPT.slice(0, pn); ph.textContent = PROMPT.slice(pn); pShown = pn; }
        caret.style.opacity = t >= T.type - 0.2 && t < T.typed + 0.1 ? (((t % 1.06) < 0.53) ? '1' : '0') : '0';

        // the job status: Queued, then the percent while the grid resolves, then Done
        const prog = seg(t, T.gen, T.done);
        const s = t < T.gen ? 'Queued' : prog < 1 ? `Generating ${Math.round(prog * 100)}%` : 'Done';
        if (s !== lastSt) { stl.textContent = s; lastSt = s; st.classList.toggle('is-done', prog >= 1); }
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;

        // each frame resolves out of noise: blur, grain and desaturation fall away together
        tiles.forEach((tile, i) => {
          const p = seg(t, T.tile[i], T.sharp[i]), e = outCubic(p);
          tile.im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 14).toFixed(2)}px) saturate(${lerp(0.2, 1, e).toFixed(3)}) contrast(${lerp(0.7, 1, e).toFixed(3)})`;
          tile.im.style.opacity = lerp(0.35, 1, e).toFixed(3);
          tile.noise.style.opacity = (0.85 * (1 - e)).toFixed(3);
          tile.noise.style.backgroundPosition = `${Math.round((t * 97) % 64)}px ${Math.round((t * 61) % 64)}px`;
          // the upscale: frame 2 lights its ring, the other three dim back
          const up = outCubic(seg(t, T.up, T.up + 0.3));
          tile.n.classList.toggle('is-up', i === PICK && t >= T.up);
          tile.n.style.opacity = i === PICK ? '1' : lerp(1, 0.42, up).toFixed(3);
          tile.n.style.transform = i === PICK && up > 0 && up < 1 ? `scale(${(1 + 0.04 * Math.sin(Math.PI * up)).toFixed(4)})` : 'none';
        });

        // the U/V buttons go live once the grid is done; U2 goes down, then stays lit
        const live = outCubic(seg(t, T.btn, T.btn + 0.25));
        rows.forEach((r) => { r.style.opacity = lerp(0.35, 1, live).toFixed(3); });
        u2.classList.toggle('is-on', t >= T.u2);
        u2.style.transform = `scale(${(1 - 0.12 * press(t, T.u2)).toFixed(4)})`;

        // the upscale line stamps its check
        const ui = seg(t, T.up, T.up + 0.3);
        upl.style.opacity = outCubic(ui).toFixed(3);
        upl.style.transform = ui >= 1 ? 'none' : `translateY(${((1 - outCubic(ui)) * 5).toFixed(2)}px)`;
        ok.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.up + 0.08, T.up + 0.34))).toFixed(4)})`;
      },
    };
  },
};
