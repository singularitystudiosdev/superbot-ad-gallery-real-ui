// Cover beat (the Reddit remake's image.js, re-skinned): GPT Image 2.5 makes the TikTok cover from a frame of the clip.
// Its line streams and a card rises holding a 9:16 canvas under a "Generating cover" chip: the frame at 31:12 comes up
// soft, then resolves top to bottom (a light edge riding the reveal, the Reddit beat's extension grammar), the dark
// bottom scrim fades in, the hook pops on in TikTok Sans 800 and the "EP 42" tag lands top-left. Beside it the three
// layers tick off in turn, and the file line "cover.png  ·  1080x1920" lands last.
// Every pixel of the picture is the one real frame of the sourced footage (img/cover-frame.jpg, img/CREDITS.txt):
// nothing is drawn; the scrim, the tag and the hook are type and a gradient laid over it. coverHTML() is the same
// cover the TikTok screens show (tiktok.js: the Studio cover thumbnail), so what lands here is what gets posted.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Made the cover from the frame at 31:12.';
export const HOOK = "The scary part isn't quitting.";
const STEPS = ['Frame at 31:12', 'Hook in TikTok Sans', 'EP 42 tag'];
const META = ['cover.png', '1080x1920'];
// timing (seconds from the reply start, or from the card where noted), in the source's v3 pace
const CPS = 100;                     // the reply line streams at this many characters a second
const SAY_AT = 0.048;                // reply start to the line's first character
const CARD = 0.144;                  // reply start to the card rising in
const RISE = 0.36;                   // the card rising in
const SOFT_AT = 0.12, SOFT = 0.3;    // the card landing to the soft frame coming up
const EXT_AT = 0.3;                  // the card landing to the reveal starting
const EXT = 0.55; /* deliberate */   // the frame resolving top to bottom
const LABEL_OUT = 0.2;               // the "Generating cover" chip fading as the reveal reaches the bottom
const SCRIM = 0.2;                   // the bottom scrim fading in
const HOOK_AT = 0.08, HOOK_IN = 0.26; // the reveal done to the hook popping on
const TAG_AT = 0.24, TAG_IN = 0.2;   // the reveal done to the EP 42 tag landing
const POP = 0.16;                    // a step's check popping in
const META_AT = 0.5, META_IN = 0.28; // the reveal done to the file line landing

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const OKI = '<svg class="im-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// the cover itself: the frame, the scrim, the tag and the hook (sized in container units, so it reads the same at
// every size it is shown)
export const coverHTML = (src, cls = '') => `<span class="tk-cover ${cls}">
  <img class="tk-cv-ph" src="${src}" width="540" height="960" alt=""/>
  <i class="tk-cv-scrim"></i><b class="tk-cv-tag">EP 42</b><b class="tk-cv-hook">${esc(HOOK)}</b>
</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.soft = T.card + SOFT_AT;                       // the soft frame comes up
    T.x0 = T.card + EXT_AT;                          // the reveal starts
    T.x1 = T.x0 + EXT;                               // ...and reaches the bottom
    T.hook = T.x1 + HOOK_AT;
    T.tag = T.x1 + TAG_AT;
    T.ok = [T.x1, T.hook + HOOK_IN * 0.6, T.tag + TAG_IN * 0.6]; // the three layers tick
    T.meta = T.x1 + META_AT;
    // the beat's last visible change: the file line settled, or the line's last character
    T.end = Math.max(T.meta + META_IN, T.ok[2] + POP, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const src = x.img('cover-frame.jpg');
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="im-card">
      <div class="im-stage">
        <img class="im-soft" src="${src}" width="540" height="960" alt=""/>
        ${coverHTML(src, 'im-cv')}
        <i class="im-edge"></i>
        <span class="im-genl">${x.tile('gptimage')}Generating cover</span>
      </div>
      <div class="im-side">
        <div class="im-steps">${STEPS.map((s) => `<div class="im-step"><span class="im-ok"><i class="im-spin"></i>${OKI}</span><span>${esc(s)}</span></div>`).join('')}</div>
        <div class="im-meta"><b>${META[0]}</b><i>&middot;</i><span>${META[1]}</span></div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const soft = $('.im-soft'), cv = $('.im-cv'), edge = $('.im-edge'), genl = $('.im-genl');
    const scrim = $('.tk-cv-scrim'), hook = $('.tk-cv-hook'), tag = $('.tk-cv-tag'), meta = $('.im-meta');
    const checks = [...card.querySelectorAll('.im-ok')].map((n) => ({ spin: n.querySelector('.im-spin'), ck: n.querySelector('.im-ck') }));
    const steps = [...card.querySelectorAll('.im-step')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the frame: comes up soft, then the sharp cover resolves top to bottom with a light edge riding the line
        soft.style.opacity = (0.75 * outCubic(seg(t, T.soft, T.soft + SOFT))).toFixed(3);
        const p = seg(t, T.x0, T.x1), e = inOutCubic(p);
        cv.style.clipPath = e >= 1 ? 'none' : `inset(0 0 ${((1 - e) * 100).toFixed(3)}% 0)`;
        edge.style.top = `${(e * 100).toFixed(3)}%`;
        edge.style.opacity = (p > 0 && p < 1 ? 0.9 * Math.sin(Math.PI * p) : 0).toFixed(3);
        genl.style.opacity = (seg(t, T.card + 0.1, T.card + 0.3) * (1 - seg(t, T.x1 - LABEL_OUT, T.x1))).toFixed(3);

        // the layers over the frame: the scrim, the hook popping on, the tag
        scrim.style.opacity = outCubic(seg(t, T.x1, T.x1 + SCRIM)).toFixed(3);
        const hk = outCubic(seg(t, T.hook, T.hook + HOOK_IN));
        hook.style.opacity = hk.toFixed(3);
        hook.style.transform = hk >= 1 ? 'none' : `translateY(${((1 - hk) * 12).toFixed(2)}%) scale(${lerp(0.86, 1, hk).toFixed(4)})`;
        const tg = outCubic(seg(t, T.tag, T.tag + TAG_IN));
        tag.style.opacity = tg.toFixed(3);
        tag.style.transform = tg >= 1 ? 'none' : `translateX(${((tg - 1) * 30).toFixed(2)}%)`;

        // the side: each layer ticks as it lands, then the file line
        checks.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
          steps[i].classList.toggle('on', t >= T.ok[i]);
        });
        const m = outCubic(seg(t, T.meta, T.meta + META_IN));
        meta.style.opacity = m.toFixed(3);
        meta.style.transform = m >= 1 ? 'none' : `translateY(${((1 - m) * 8).toFixed(2)}px)`;
      },
    };
  },
};
