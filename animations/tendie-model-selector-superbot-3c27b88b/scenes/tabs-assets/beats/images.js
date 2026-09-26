// Nano Banana (Gemini image), images: the logo and the 1200x630 share thumbnail resolve out of a blur one after the
// other, then both are saved into /public. Both images are real Nano Banana output (gen/).
import { seg } from '../../../lib.js';
import { sayer, rise, reveal, gen, setText } from './kit.js';

const SAY = 'Bull on a rocket, coming up. Logo and share thumbnail.';
const RUN = 'Saving to /public', DONE = 'Saved logo.png and og-image.png to /public';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.l0 = T.card + 0.25; T.l1 = T.l0 + 1.3;
    T.t0 = T.card + 0.75; T.t1 = T.t0 + 1.4;
    T.chip = T.t1 + 0.15; T.chipDone = T.chip + 0.55;
    T.end = T.chipDone + 1.0;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayer(x, SAY);
    const lab = `<span class="qc-genl">${x.tile('nano')}Creating image</span>`;
    const card = x.el(`<div class="nb">
      <figure class="nb-f nb-logo"><div class="qc-img"><img src="${gen('logo-nano-banana.png')}" alt="TendieTracker logo"/><i class="qc-gen"></i>${lab}</div><figcaption><b>logo.png</b><span>512 x 512</span></figcaption></figure>
      <figure class="nb-f nb-thumb"><div class="qc-img"><img src="${gen('share-thumb-1200x630.jpg')}" alt="TendieTracker share thumbnail"/><i class="qc-gen"></i>${lab}</div><figcaption><b>og-image.png</b><span>1200 x 630</span></figcaption></figure>
    </div>`);
    const chip = x.el(`<div class="nb-chip"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${RUN}</span></div></div>`);
    const figs = [...card.querySelectorAll('.nb-f')].map((f) => ({ f, im: f.querySelector('img'), g: f.querySelector('.qc-gen'), l: f.querySelector('.qc-genl'), c: f.querySelector('figcaption') }));
    const sp = chip.querySelector('.spin'), cl = chip.querySelector('.ch-tool-t');
    return {
      nodes: [say.node, card, chip],
      marks: [[T.r, say.node], [T.card, card], [T.chip, chip]],
      render(t) {
        say.render(t, T.r + 0.05);
        const win = [[T.l0, T.l1], [T.t0, T.t1]];
        figs.forEach((f, i) => {
          rise(f.f, seg(t, win[i][0] - 0.25, win[i][0] + 0.2), 14);
          reveal(f.im, f.g, f.l, t, win[i][0], win[i][1]);
          f.c.style.opacity = seg(t, win[i][1] - 0.1, win[i][1] + 0.25).toFixed(3);
        });
        rise(chip, seg(t, T.chip, T.chip + 0.35), 8, 1);
        const d = t >= T.chipDone;
        sp.classList.toggle('done', d);
        sp.style.transform = d ? '' : `rotate(${((t - T.chip) * 450) % 360}deg)`;
        setText(cl, d ? DONE : RUN);
      },
    };
  },
};
