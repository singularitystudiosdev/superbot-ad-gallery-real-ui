// Step 1, Gemini 3.1 Pro: research. Gemini's own answer surface (dark): the sparkle and the model pill, the
// shimmering "thinking" line, the four pocketsflow.com pages it read (real 2x captures of the live site), then the
// storyboard it wrote from them, timed to the film's own cuts. Research + reading pages is what Gemini (search
// grounding, multimodal) is for; it makes nothing visual itself. render(lt) is a pure function of lt.
import { seg, outExpo, inOutSine, rise } from '../../../lib.js';
import { shimmer } from './media.js';

const PAGES = [['site-hero.jpg', 'Home'], ['site-dash.jpg', 'Dashboard'], ['site-creators.jpg', 'Creator pages'], ['site-platform.jpg', 'Platform']];
const SHOTS = [
  ['0:00', 'Hook', '“Got something to sell?”'],
  ['0:03', 'What you sell', 'courses, ebooks, apps'],
  ['0:05', 'Your store', 'Pocketsflow builds it'],
  ['0:07', 'Checkout', 'tax and payouts handled'],
  ['0:11', 'Close', '“You create. We handle the rest.”'],
];
const READ = 1.45; // the thinking line resolves (front-loaded: the card is never a tall empty box)

export default {
  id: 'gemini', app: 'gemini', model: 'Gemini 3.1 Pro', logo: 'gemini-logo.svg', dur: 4.6,
  summary: 'Read pocketsflow.com, wrote a 5-shot storyboard',

  build({ img, brand, el }) {
    const n = el(`<div class="gm">
  <div class="gm-hd"><img class="gm-spark" src="${brand('gemini-logo.svg')}" alt=""/><b>Gemini</b><span class="gm-pill">3.1 Pro</span></div>
  <div class="gm-think"><span class="gm-sh">Reading pocketsflow.com</span><span class="gm-done">Read 4 pages on pocketsflow.com</span></div>
  <div class="gm-pages">${PAGES.map(([f, cap]) => `<figure class="gm-pg"><img src="${img('gen/' + f)}" alt=""/><figcaption><img class="gm-fav" src="${brand('pocketsflow-icon.png')}" alt=""/>${cap}</figcaption></figure>`).join('')}</div>
  <div class="gm-sb"><div class="gm-sbh">Storyboard <em>0:15</em></div>${SHOTS.map(([tc, a, b]) => `<div class="gm-row"><code>${tc}</code><b>${a}</b><span>${b}</span></div>`).join('')}</div>
</div>`);
    const q = (s) => [...n.querySelectorAll(s)];
    const parts = { sh: n.querySelector('.gm-sh'), done: n.querySelector('.gm-done'), pages: q('.gm-pg'), sbh: n.querySelector('.gm-sbh'), rows: q('.gm-row') };
    return {
      el: n,
      render(lt) {
        if (lt < -0.2 || lt > 6) return;
        parts.sh.style.setProperty('--sh', shimmer(lt));
        const r = inOutSine(seg(lt, READ, READ + 0.35));
        parts.sh.style.opacity = (1 - r).toFixed(3);
        parts.done.style.opacity = r.toFixed(3);
        parts.pages.forEach((p, i) => {
          const e = outExpo(seg(lt, 0.35 + i * 0.16, 1.0 + i * 0.16));
          rise(p, e, 10);
          if (e < 1) p.style.transform += ` scale(${(0.96 + 0.04 * e).toFixed(4)})`;
        });
        rise(parts.sbh, outExpo(seg(lt, 1.45, 2.0)), 8);
        parts.rows.forEach((row, i) => rise(row, outExpo(seg(lt, 1.6 + i * 0.14, 2.2 + i * 0.14)), 8));
      },
    };
  },
};
