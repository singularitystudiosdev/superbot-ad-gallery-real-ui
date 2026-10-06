// Nano Banana Pro beat, the fourth hand-off: Gemini's image model makes the thumbnails from Blender's renders. The
// window is Gemini's own dark chat: the model picker set to Nano Banana Pro with the Create images tool on, superbot's
// prompt in the user bubble with the two Blender renders attached as reference images, then Gemini's answer: three
// 16:9 images generating in place (the shimmer, then the picture sharpening up), lettered A, B and C for YouTube's
// Test & compare, with the 1280 x 720 size and the SynthID note under them. Text inside an image is what Nano Banana
// Pro is known for, so every option leans on big readable type.
// Hand-off: thumb-a.png, thumb-b.png and thumb-c.png go to Claude Opus 5.5 (thumb-a becomes the page's share image)
// and on to YouTube Studio.
import { seg, outCubic, lerp } from '../../../lib.js';
import { windowTimes, sayLine, rise, windowCard } from './kit.js?v=7993d5b0';

const SAY = 'Making three thumbnails from the render, for a Test & compare.';
const PROMPT = 'Three YouTube thumbnails, 16:9, for “I tested 10 gaming headsets under $100”. Use these renders of the winner and the $99 rival. Huge readable text: the $39 one won.';
const THUMBS = [['thumb-a.jpg', 'A'], ['thumb-b.jpg', 'B'], ['thumb-c.jpg', 'C']];

const HOLD = 3.3; /* deliberate */
const MAKING_AT = 0.3;               // "Creating your images", the placeholders shimmer
const IMG_AT = 1.0, IMG_STAGGER = 0.32, IMG_IN = 0.5;
const NOTE_AT = 2.25;                // the size / SynthID line and the A B C labels settle

export default {
  times(r, opts) {
    const T = windowTimes(r, opts, HOLD);
    T.making = T.c0 + MAKING_AT;
    T.img = THUMBS.map((_, i) => T.c0 + IMG_AT + i * IMG_STAGGER);
    T.note = T.c0 + NOTE_AT;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const app = `<div class="nb">
      <div class="nb-top"><b class="nb-word">Gemini</b><span class="nb-pick">Nano Banana Pro ▾</span><span class="nb-sp"></span><span class="nb-tool">🍌 Create images</span></div>
      <div class="nb-body">
        <div class="nb-user">
          <div class="nb-refs"><img src="${x.img('wren-hero.webp')}" alt=""/><img src="${x.img('wren-rival.webp')}" alt=""/></div>
          <div class="nb-ptext">${x.esc(PROMPT)}</div>
        </div>
        <div class="nb-ans"><img class="nb-spark" src="${x.brand('gemini-logo.svg')}" alt=""/>
          <div class="nb-out"><div class="nb-making">Creating your images…</div>
            <div class="nb-grid">${THUMBS.map(([f, l]) => `<figure class="nb-fig"><span class="nb-ph"></span><img src="${x.img(f)}" alt=""/><figcaption><b>${l}</b><span>1280 × 720</span></figcaption></figure>`).join('')}</div>
            <div class="nb-note">3 images · 16:9 · each carries an invisible SynthID watermark</div>
          </div>
        </div>
      </div>
    </div>`;
    const w = windowCard(x, 'kc-nb', app, {
      ins: [{ logo: x.brand('blender-logo.svg'), file: 'hero.png' }, { logo: x.brand('blender-logo.svg'), file: 'rival.png' }],
      outs: ['thumb-a.png', 'thumb-b.png', 'thumb-c.png'],
      next: { logo: x.brand('claude-logo.svg'), name: 'Claude Opus 5.5', cls: 'kc-n-opus' },
    });
    const $ = (s) => w.card.querySelector(s);
    const figs = [...w.card.querySelectorAll('.nb-fig')].map((f) => ({ f, ph: f.querySelector('.nb-ph'), im: f.querySelector('img'), cap: f.querySelector('figcaption') }));
    const making = $('.nb-making'), note = $('.nb-note'), grid = $('.nb-grid');

    return {
      nodes: [say.node, w.card],
      marks: [[T.r, say.node], [T.card, w.card]],
      focus: w.card,
      render(t) {
        say.render(t, T.r);
        rise(w.card, t, T.card);
        const mk = seg(t, T.making, T.making + 0.2);
        making.style.opacity = (mk * (1 - seg(t, T.img[2] + IMG_IN, T.img[2] + IMG_IN + 0.2))).toFixed(3);
        grid.style.opacity = mk.toFixed(3);
        figs.forEach(({ ph, im, cap }, i) => {
          // the placeholder's light sweep loops until the image arrives, then the image sharpens up through it
          const sweep = ((t - T.making) * 0.9 + i * 0.27) % 1;
          ph.style.backgroundPosition = `${lerp(160, -60, sweep).toFixed(1)}% 0`;
          const p = outCubic(seg(t, T.img[i], T.img[i] + IMG_IN));
          im.style.opacity = p.toFixed(3);
          im.style.filter = p < 1 ? `blur(${((1 - p) * 6).toFixed(2)}px) saturate(${lerp(0.6, 1, p).toFixed(3)})` : 'none';
          im.style.transform = p < 1 ? `scale(${lerp(1.04, 1, p).toFixed(4)})` : 'none';
          cap.style.opacity = seg(t, T.img[i] + IMG_IN * 0.6, T.img[i] + IMG_IN).toFixed(3);
        });
        note.style.opacity = seg(t, T.note, T.note + 0.25).toFixed(3);
        w.renderIO(t, T.out);
      },
    };
  },
};
