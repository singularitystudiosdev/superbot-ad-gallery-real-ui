// Node 2, Nano Banana Pro (Gemini 3 Pro Image): Opus's rendered page goes in as the reference image, four 16:9 2K
// photographs come out. The prompts shown are the ones sent (gen-data NBP[].prompt); the images are the outputs.
import { NBP } from '../gen-data.js';
import { el, esc, gen, brand } from './kit.js';
import { seg, outCubic, lerp } from '../../../lib.js';

const SHORT = { studio: 'Lisbon studio, MacBook showing this page', notify: 'iPhone lock screen: Payment received', street: 'Paid screen in hand, Lisbon tram', flatlay: 'Flat lay, iPad showing this page' };
const AT = [0.25, 0.7, 1.15, 1.6]; // when each image lands (panel seconds)

export const nbp = {
  key: 'nbp',
  head: 'Image generation · reference: BuyPage.png',
  meta: 'gemini-3-pro-image · 4 × 16:9 2K',
  done: '4 images',
  thumb: () => `<div class="fg-thumb nb-th">${NBP.map((n) => `<img src="${gen(n.k + '-sm.jpg')}" alt=""/>`).join('')}</div>`,
  mount(body) {
    body.classList.add('nb');
    body.append(el(`<div class="nb-side">
      <div class="nb-model"><img src="${brand('gemini-logo.svg')}" alt=""/><b>Nano Banana Pro</b><small>Gemini 3 Pro Image</small></div>
      <div class="nb-prompt">
        <div class="nb-ref"><img src="${gen('buypage-ref.jpg')}" alt=""/><span><b>BuyPage.png</b><small>from Claude Opus 5.5</small></span></div>
        ${NBP.map((n, i) => `<p class="nb-p" data-i="${i}">${esc(n.prompt.split('. ').slice(0, 2).join('. '))}.</p>`).join('')}
      </div>
      <div class="nb-cfg"><span>16:9</span><span>2K</span><span>×4</span></div>
    </div>`), el(`<div class="nb-grid">${NBP.map((n) => `<figure class="nb-cell"><div class="nb-ph"><i></i></div><img src="${gen(n.k + '.jpg')}" alt=""/><figcaption>${esc(SHORT[n.k])}</figcaption></figure>`).join('')}</div>`));
    return { cells: [...body.querySelectorAll('.nb-cell')], ps: [...body.querySelectorAll('.nb-p')] };
  },
  render(s, p) {
    s.cells.forEach((c, i) => {
      const ph = c.firstElementChild, img = c.children[1], cap = c.children[2];
      const r = outCubic(seg(p, AT[i], AT[i] + 0.5));
      img.style.opacity = r.toFixed(3);
      img.style.filter = r >= 1 ? 'none' : `blur(${lerp(22, 0, r).toFixed(2)}px) saturate(${lerp(0.4, 1, r).toFixed(3)})`;
      img.style.transform = `scale(${lerp(1.06, 1, r).toFixed(4)})`;
      ph.style.opacity = (1 - seg(p, AT[i] + 0.15, AT[i] + 0.5)).toFixed(3);
      ph.style.setProperty('--sh', `${((p * 120 + i * 30) % 220 - 60).toFixed(1)}%`);
      cap.style.opacity = seg(p, AT[i] + 0.35, AT[i] + 0.6).toFixed(3);
    });
    // the prompt being rendered is the bright one
    const cur = AT.reduce((a, at, i) => (p >= at - 0.25 ? i : a), 0);
    s.ps.forEach((n, i) => n.classList.toggle('nb-on', i === cur));
  },
};
