// scenes/ask.js, beat A (0.00-0.75 s): the hook. The superbot chat window (the dark hub look of the original ad's
// opening, ../niche-github-model-switch-superbot-0cb69286: #0d0d0d window, #181818 raised surfaces, the composer
// with SUPER as an off switch) holding the one ask as a sent user bubble, sized to read on a phone, and superbot
// answering under it with the live mark. From 0.55 s the camera pushes through the window (scale up + fade) and the
// framed browser of beat B comes up behind it (scenes/gh.js).
import { seg, outCubic, inOutCubic, op } from '../lib.js';
import { makeMark, poseMark } from '../mark.js';

export const ASK = 'Fix the random logouts in issue #482 and ship it';
const DUR = 0.75;
const OUT0 = 0.56, OUT1 = 0.70, FADE0 = 0.63; // push 0.56-0.70, opacity 1 -> 0 over its last 2 frames // the push-through into beat B (overlaps the gh scene's entrance)

let el = null;

export default {
  id: 'ask',
  dur: DUR,

  mount(section) {
    section.innerHTML = `
<div class="ask-cam">
  <div class="sb-app">
    <div class="sb-bar"><span class="sb-lights"><i></i><i></i><i></i></span><span class="sb-title">superbot</span></div>
    <div class="sb-thread">
      <div class="sb-user"><p>${ASK}</p></div>
      <div class="sb-bot">
        <span class="sb-bot-mark"></span>
        <div class="sb-bot-tx"><b>superbot</b><span>On it: opening <code>kitebase/web</code> on GitHub</span></div>
      </div>
    </div>
    <div class="sb-composer">
      <span class="sb-plus">+</span>
      <span class="sb-ph">How can superbot help you today?</span>
      <span class="sb-super">SUPER<i class="sb-tg"><b></b>OFF</i></span>
      <span class="sb-send"><svg viewBox="0 0 16 16" width="22" height="22" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5"/></svg></span>
    </div>
  </div>
</div>`;
    const q = (s) => section.querySelector(s);
    el = { cam: q('.ask-cam'), user: q('.sb-user'), bot: q('.sb-bot') };
    el.mark = makeMark(q('.sb-bot-mark'), 92);
  },

  render(lt, ctx, section) {
    if (!el) return;
    const on = lt > -0.001 && lt < OUT1;
    section.classList.toggle('on', on);
    section.style.opacity = on ? '1' : '0';
    if (!on) return;
    const t = Math.max(0, lt);

    // the sent bubble settles (it is legible from frame 0: the hook must read at once)
    const b = outCubic(seg(t, 0, 0.2));
    el.user.style.transform = `translateY(${((1 - b) * 18).toFixed(2)}px) scale(${(0.97 + 0.03 * b).toFixed(4)})`;
    op(el.user, 0.8 + 0.2 * b);

    // superbot answers under it (8 frames, ease-out)
    const r = outCubic(seg(t, 0.16, 0.16 + 8 / 30));
    el.bot.style.transform = `translateY(${((1 - r) * 22).toFixed(2)}px)`;
    op(el.bot, r);
    poseMark(el.mark, ctx.t);

    // the push-through: the camera flies into the window while it fades out over the browser coming up
    const p = inOutCubic(seg(t, OUT0, OUT1));
    el.cam.style.transform = `scale(${(1 + 0.16 * p).toFixed(4)})`;
    op(el.cam, 1 - seg(t, FADE0, OUT1));
  },
};
