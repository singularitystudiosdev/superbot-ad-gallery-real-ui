// Ideogram 4.0 beat: the meme ask goes to the model built for caption typography. Ideogram returns four takes at
// once: they denoise in a staggered wave, the punchiest (the two-row "nah / yeah" Muse meme) takes the pick ring,
// and the caption check confirms both captions rendered exactly as typed. Pure function of t (the tabs scene's local
// time). Memes: img/ide-*.jpg, original compositions made for this spot (assets-src/memes.7de5716a.html).
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = 'Here’s your Muse meme. Ideogram made 4 takes, I picked the punchiest.';
const PROMPT = 'Muse, the white plush mascot, in a two-row reaction meme: turns away from “Letting you sleep”, points at “Sending you 40 notifications at 3 AM”';
const TAKES = [
  ['ide-hero.jpg', 'Two-row reaction'],
  ['ide-alt1.jpg', 'Lock screen POV'],
  ['ide-alt2.jpg', 'This is fine'],
  ['ide-alt3.jpg', 'Top / bottom caption'],
];
const CAPS = ['Letting you sleep', 'Sending you 40 notifications at 3 AM'];
const OKI = '<svg class="ig-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const DL = '<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.2;
    T.gen = TAKES.map((_, i) => r + 0.32 + i * 0.11); // each take denoises over GEN
    T.GEN = 0.95;
    T.genEnd = T.gen[3] + T.GEN;
    T.caps = [r + 1.32, r + 1.46];
    T.pick = T.genEnd + 0.02;
    T.acts = T.pick + 0.12;
    T.end = r + 2.35;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const take = (i, cls = '') => `<figure class="ig-take ${cls}"><img src="${x.img(TAKES[i][0])}" alt="${x.esc(TAKES[i][1])}"/><i class="ig-noise"></i><span class="ig-pct">0%</span>${i ? `<figcaption>${x.esc(TAKES[i][1])}</figcaption>` : '<span class="ig-pick">★ Pick</span>'}</figure>`;
    const card = x.el(`<div class="ig-card">
      <div class="ig-head">
        <span class="ig-mark"><img src="${x.brand('ideogram-logo.png')}" alt="Ideogram"/></span>
        <div class="ig-prompt"><small>Prompt · Magic Prompt on</small><span>${x.esc(PROMPT)}</span></div>
        <div class="ig-tags"><i>Ideogram 4.0</i><i>Style · Meme</i><i>1:1 · 2K</i></div>
        <span class="ig-stat"><i class="ig-spin"></i><span class="ig-stat-t">Generating 4 images</span></span>
      </div>
      <div class="ig-body">
        ${take(0, 'ig-hero')}
        <div class="ig-side">
          <div class="ig-alts">${take(1)}${take(2)}${take(3)}</div>
          <div class="ig-check">
            <div class="ig-check-h"><b>Caption check</b><span class="ig-acc">2 / 2 rendered exact</span></div>
            ${CAPS.map((c) => `<div class="ig-cap">${OKI}<span>“${x.esc(c)}”</span><em>exact</em></div>`).join('')}
            <div class="ig-meta"><span>2048 × 2048</span><span>Seed 48213</span><span>Warm palette</span><span>4 takes · 6.8s</span></div>
          </div>
          <div class="ig-acts"><span class="ig-btn ig-pri">${DL}Download PNG</span><span class="ig-btn">Remix</span><span class="ig-btn">Upscale 4K</span><span class="ig-btn">Post to r/memes</span></div>
        </div>
      </div>
    </div>`);
    const $$ = (s) => [...card.querySelectorAll(s)];
    const takes = $$('.ig-take').map((f) => ({ f, im: f.querySelector('img'), nz: f.querySelector('.ig-noise'), pct: f.querySelector('.ig-pct') }));
    const pick = card.querySelector('.ig-pick'), hero = takes[0].f;
    const caps = $$('.ig-cap'), acc = card.querySelector('.ig-acc'), meta = card.querySelector('.ig-meta'), chk = card.querySelector('.ig-check');
    const acts = $$('.ig-btn'), spin = card.querySelector('.ig-spin'), statT = card.querySelector('.ig-stat-t'), stat = card.querySelector('.ig-stat');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = seg(t, T.card, T.card + 0.45);
        rise(card, ci, 16);

        // four takes denoise: noise thins, blur clears, the % ticks up and fades
        takes.forEach((tk, i) => {
          const p = seg(t, T.gen[i], T.gen[i] + T.GEN), e = outCubic(p);
          tk.im.style.filter = e >= 1 ? 'none' : `blur(${((1 - e) * 16).toFixed(2)}px) saturate(${lerp(0.2, 1, e).toFixed(3)}) contrast(${lerp(0.7, 1, e).toFixed(3)})`;
          tk.im.style.transform = e >= 1 ? 'none' : `scale(${lerp(1.07, 1, e).toFixed(4)})`;
          tk.nz.style.opacity = (1 - seg(p, 0.15, 0.95)).toFixed(3);
          const pc = `${Math.round(100 * p)}%`;
          if (tk.pct.textContent !== pc) tk.pct.textContent = pc;
          tk.pct.style.opacity = (seg(t, T.card + 0.1, T.card + 0.3) * (1 - seg(p, 0.85, 1))).toFixed(3);
        });
        const done = t >= T.genEnd;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.card) * 420) % 360).toFixed(1)}deg)`;
        const st = done ? '4 images ready' : 'Generating 4 images';
        if (statT.textContent !== st) statT.textContent = st;
        stat.classList.toggle('is-done', done);

        // the caption check ticks each caption once the pick has resolved
        caps.forEach((c, i) => {
          rise(c, seg(t, T.caps[i], T.caps[i] + 0.3), 6);
          const ok = c.firstElementChild;
          ok.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.caps[i] + 0.08, T.caps[i] + 0.36))).toFixed(3)})`;
        });
        rise(chk, seg(t, T.caps[0] - 0.22, T.caps[0] + 0.1), 6);
        acc.style.opacity = seg(t, T.caps[1] + 0.2, T.caps[1] + 0.45).toFixed(3);
        rise(meta, seg(t, T.caps[0] - 0.1, T.caps[0] + 0.25), 4);

        // the pick: ring and badge land on the two-row take, the others step back a touch
        const pk = seg(t, T.pick, T.pick + 0.4);
        hero.style.setProperty('--ring', outCubic(pk).toFixed(3));
        pick.style.opacity = outCubic(pk).toFixed(3);
        pick.style.transform = `scale(${lerp(0.6, 1, outBack(pk)).toFixed(4)})`;
        takes.slice(1).forEach((tk) => { tk.f.style.opacity = lerp(1, 0.62, outCubic(pk)).toFixed(3); });
        acts.forEach((b, i) => rise(b, seg(t, T.acts + i * 0.06, T.acts + i * 0.06 + 0.3), 6));
      },
    };
  },
};
