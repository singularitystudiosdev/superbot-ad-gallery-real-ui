// Beat A (0.00-0.90 s): the notifications inbox. Mount the gh 'inbox' screen inside a framed browser window
// (never full-bleed), ring the kitebase/web #482 row (li.gh-nrow[data-row=web-482], already unread) with data-hl="1"
// and push the camera in on that exact row; the stage caption is the only other thing on screen. Pure function of lt:
// mount() measures the hero row once (layout is static), render() only writes attributes / transforms.
import { dur, byId } from './budget.js';
import { mountCaption } from './caption.js';
import { lerp, seg, outCubic, boxIn } from '../lib.js';
import { mount } from '../gh/components/index.js';

// framed window: 1760x840 at (80,40) -> bottom edge y=880 at rest; the push-in is capped at 1.08 and anchored at the
// row's height and the frame's horizontal centre, so the bottom edge stays at y<=912, clear of the 140 px caption strip.
const FRAME = { width: 1760, height: 840, pageWidth: 1440 };

export default {
  id: 'a',
  dur: dur('a'),
  mount(section) {
    const ghf = mount(section, 'inbox', {}, FRAME);
    this.ghf = ghf;
    this.row = ghf.querySelector('[data-row="web-482"]');
    if (this.row) this.row.dataset.hl = '0';
    // camera origin: horizontally centred, vertically at the hero row, so the push-in locks onto the row without
    // drifting the window off the left/right edges of the stage.
    if (this.row) {
      const b = boxIn(this.row, ghf);
      this.org = `${(ghf.offsetWidth / 2).toFixed(1)}px ${b.cy.toFixed(1)}px`;
    } else {
      this.org = '50% 40%';
    }
    const d = dur('a');
    this.cap = mountCaption(section, { text: byId('a').caption, at: 0.05, dur: d + 0.02, in: 0.15, out: 0.22 });
  },
  render(lt) {
    const d = dur('a');
    // the #482 row lights up early (data-hl paints the Primer highlight ring + action row); its unread dot is already on
    if (this.row) this.row.dataset.hl = lt >= 0.10 ? '1' : '0';
    // quick camera push-in on the highlighted row, settling by the end of the beat
    const s = lerp(1, 1.08, outCubic(seg(lt, 0.20, d - 0.02)));
    this.ghf.style.transformOrigin = this.org;
    this.ghf.style.transform = `scale(${s.toFixed(4)})`;
    this.cap(lt);
  },
};