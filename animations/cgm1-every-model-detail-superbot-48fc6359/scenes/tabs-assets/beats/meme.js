// GPT Image 2 beat: the meme resolves out of a blur under a sweeping band while a generation panel fills in beside
// it: the prompt types, each layer locks (the note's caption gets a dashed text-layer box over the image), the
// quality checks land, then the export sizes. Same clock as the source spot's Gemini beat (end = r + 2.35).
// Render time, contrast ratio and sizes are illustrative. Pure function of t (the tabs scene's local time).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Here’s your Muse meme. The caption renders clean, and it’s sized for every feed.';
const PROMPT = '“The Social Network” note-pass. The Muse ghost slides a note: “You have 40 unread notifications from Muse.”';
const LAYERS = [
  ['ghost', 'Panel 1', 'Muse ghost passes the note', 'Matched'],
  ['text', 'Caption', 'YOU HAVE 40 UNREAD NOTIFICATIONS FROM MUSE', 'Lettered'],
  ['face', 'Panel 2', 'Reaction close-up, lecture hall', 'Matched'],
];
const CHECKS = ['Spelling 100%', 'Text contrast 7.1:1', 'Faces consistent'];
const SIZES = [['1:1', 'Feed'], ['4:5', 'Instagram'], ['9:16', 'Stories']];
const DL = '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.22;
    T.w0 = r + 0.3; T.w1 = T.w0 + 1.2;
    T.prompt = r + 0.32;
    T.layer = LAYERS.map((_, i) => r + 0.5 + i * 0.3);
    T.lock = T.layer.map((a) => a + 0.45);
    T.box = T.lock[1] - 0.05;
    T.check = CHECKS.map((_, i) => r + 1.55 + i * 0.1);
    T.export = r + 1.85;
    T.end = T.w1 + 0.85;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const meme = x.img('muse-meme.png');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const wrap = x.el(`<div class="md-wrap">
      <div class="qc-img md-img"><img src="${meme}" width="870" height="1024" alt="Muse meme"/>
        <i class="md-box"><em>Text layer · legible</em></i>
        <i class="qc-gen"></i><span class="qc-genl">${x.tile('gptimage')}Creating image</span>
        <span class="md-res">1024 × 1205</span>
      </div>
      <div class="md-panel">
        <div class="md-hd">${x.tile('gptimage')}<b>GPT Image 2</b><span class="md-time">Rendering 0.0s</span></div>
        <div class="md-prompt"><small>Prompt</small><p><span class="md-pv"></span><span class="md-ph">${x.esc(PROMPT)}</span></p></div>
        <div class="md-layers">${LAYERS.map(([ic, a, b, done]) => `<div class="md-layer md-l-${ic}"><span class="md-lic"></span><span class="md-lt"><small>${a}</small><b>${x.esc(b)}</b></span><span class="md-ls"><i class="md-ring"></i><span class="md-lok">${TICK}${done}</span></span></div>`).join('')}</div>
        <div class="md-checks">${CHECKS.map((c) => `<span class="md-chk">${TICK}${c}</span>`).join('')}</div>
        <div class="md-export">${SIZES.map(([ar, use]) => `<span class="md-ar md-ar-${ar.replace(':', 'x')}"><i style="background-image:url('${meme}')"></i><b>${ar}</b><small>${use}</small></span>`).join('')}<span class="md-dl">${DL}PNG · 2048 px</span></div>
      </div>
    </div>`);
    const $ = (s) => wrap.querySelector(s), $$ = (s) => [...wrap.querySelectorAll(s)];
    const im = $('.md-img img'), gen = $('.qc-gen'), genl = $('.qc-genl'), res = $('.md-res'), box = $('.md-box');
    const panel = $('.md-panel'), time = $('.md-time'), pv = $('.md-pv'), ph = $('.md-ph');
    const layers = $$('.md-layer').map((n) => ({ n, ring: n.querySelector('.md-ring'), ok: n.querySelector('.md-lok') }));
    const checks = $$('.md-chk'), exp = $$('.md-ar, .md-dl');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1, typed = -1, lastTime = '';
    return {
      nodes: [say, wrap],
      marks: [[T.r, say], [T.card, wrap]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        wrap.style.opacity = ci.toFixed(3);
        wrap.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the image: blur -> crisp under the sweep band
        const p = seg(t, T.w0, T.w1), e = outCubic(p);
        im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 18).toFixed(2)}px) saturate(${lerp(0.3, 1, e).toFixed(3)})`;
        im.style.opacity = lerp(0.3, 1, e).toFixed(3);
        im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.08, 1, e).toFixed(4)})`;
        gen.style.transform = `translateX(${lerp(-110, 110, (p * 2) % 1).toFixed(1)}%)`;
        gen.style.opacity = (p >= 1 ? 0 : 1 - seg(p, 0.8, 1)).toFixed(3);
        genl.style.opacity = (1 - seg(t, T.w1 - 0.25, T.w1)).toFixed(3);
        res.style.opacity = outCubic(seg(t, T.w1 - 0.1, T.w1 + 0.25)).toFixed(3);
        const bi = seg(t, T.box, T.box + 0.35);
        box.style.opacity = (outCubic(bi) * (1 - 0.45 * seg(t, T.export, T.export + 0.4))).toFixed(3);
        box.style.transform = `scale(${lerp(1.12, 1, outBack(bi)).toFixed(4)})`;

        // the panel: timer, prompt, layer locks, checks, export
        const secs = 4.8 * seg(t, T.w0, T.w1);
        const tl = t >= T.w1 ? 'Rendered in 4.8s' : `Rendering ${secs.toFixed(1)}s`;
        if (tl !== lastTime) { time.textContent = tl; lastTime = tl; time.classList.toggle('on', t >= T.w1); }
        const pc = streamCount(PROMPT, T.prompt, 150, t);
        if (pc !== typed) { pv.textContent = PROMPT.slice(0, pc); ph.textContent = PROMPT.slice(pc); typed = pc; }
        layers.forEach((l, i) => {
          rise(l.n, seg(t, T.layer[i], T.layer[i] + 0.3), 6);
          const done = t >= T.lock[i];
          l.n.classList.toggle('ok', done);
          l.ring.style.opacity = done ? '0' : '1';
          l.ring.style.transform = `rotate(${(((t - T.layer[i]) * 480) % 360).toFixed(1)}deg)`;
          const o = seg(t, T.lock[i], T.lock[i] + 0.25);
          l.ok.style.opacity = o.toFixed(3);
          l.ok.style.transform = `scale(${lerp(0.6, 1, outBack(o)).toFixed(4)})`;
        });
        checks.forEach((c, i) => { const o = seg(t, T.check[i], T.check[i] + 0.3); c.style.opacity = outCubic(o).toFixed(3); c.style.transform = o >= 1 ? '' : `scale(${lerp(0.8, 1, outBack(o)).toFixed(4)})`; });
        exp.forEach((c, i) => rise(c, seg(t, T.export + i * 0.07, T.export + i * 0.07 + 0.32), 6));
        panel.style.setProperty('--glow', (1 - seg(t, T.w1, T.w1 + 0.6)).toFixed(3));
      },
    };
  },
};
