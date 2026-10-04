// Beat G (11.30-12.60, 1.30 s): PR #483 Conversation. Opens on the header (Open badge, "wants to merge 1 commit into
// main from fix/482-session-refresh"), pans down to the superbot-gg[bot] comment and the merge box, which turns from
// "some checks haven't completed" to "All checks have passed". Timeline items reveal in order. Caption "PR opened.".
import { dur, byId } from './budget.js';
import { mount } from '../gh/components/index.js';
import { mountCaption } from './caption.js';
import { lerp, seg, outCubic } from '../lib.js';
import { FRAME, setScroll, revealY } from './e.js';

const REVEAL = { body: [0.02, 0.22], commit: [0.08, 0.26], linked: [0.13, 0.30], 'linked-issue': [0.17, 0.34], 'review-req': [0.21, 0.38], bot: [0.56, 0.80] };

export default {
  id: 'g',
  dur: dur('g'),
  mount(section) {
    const ghf = mount(section, 'conversation', {}, FRAME);
    this.ghf = ghf;
    this.page = ghf.querySelector('.ghf-page');
    this.tl = [...ghf.querySelectorAll('[data-tl]')];
    this.mergebox = ghf.querySelector('[data-slot="mergebox"]');
    this.mchecks = ghf.querySelectorAll('.gh-mcheck');
    this.cap = mountCaption(section, { text: byId('g').caption, at: 0.16, dur: dur('g') - 0.14 });
    // seed: timeline items hidden, merge box mid-run
    this.tl.forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(12px)'; });
    if (this.mergebox) this.mergebox.dataset.checksState = 'in_progress';
    this.mchecks.forEach((r) => { r.dataset.state = 'in_progress'; });
  },
  render(lt) {
    // camera settle, then pan from the header down to the bot comment + merge box
    const s = 0.984 + 0.016 * outCubic(seg(lt, 0, 0.85));
    this.ghf.style.transform = `scale(${s.toFixed(4)})`;
    setScroll(this.page, lerp(0, 560, outCubic(seg(lt, 0.34, 0.72))));

    for (const el of this.tl) {
      const w = REVEAL[el.dataset.tl];
      if (!w) continue;
      revealY(el, seg(lt, w[0], w[1]), 12);
    }

    const checksDone = lt >= 0.92;
    if (this.mergebox) this.mergebox.dataset.checksState = checksDone ? 'success' : 'in_progress';
    this.mchecks.forEach((r) => { r.dataset.state = checksDone ? 'success' : 'in_progress'; });

    if (this.cap) this.cap(lt);
  },
};