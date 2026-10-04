// Beat C (1.90-2.90 s): issue #482 page as a framed browser window. The page already carries the title + Open badge,
// labels, the reporter avatar, the comment boxes and the metadata sidebar; this scene forces the Development slot
// linked (PR #483), then runs a quick push-in while the page pans down so the reporter's attachment screenshot
// ([data-slot=attachment], the default issue-attachment-session-expired.png) reveals. Pure function of lt.
import { dur } from './budget.js';
import { lerp, seg, outCubic, boxIn } from '../lib.js';
import { mount } from '../gh/components/index.js';

const FRAME = { width: 1760, height: 840, pageWidth: 1440 };

export default {
  id: 'c',
  dur: dur('c'),
  mount(section) {
    const ghf = mount(section, 'issue', { issue: { development: 'linked' } }, FRAME);
    this.ghf = ghf;
    this.page = ghf.querySelector('.ghf-page');
    this.attach = ghf.querySelector('[data-slot="attachment"]');
    if (this.attach) this.attach.style.opacity = '0';
    // push-in anchored just under the title so the header lines push toward the viewer
    const head = ghf.querySelector('.gh-ihead') || ghf.querySelector('.gh-ititle');
    const b = head ? boxIn(head, ghf) : { cx: 880, cy: 200 };
    this.org = `${b.cx.toFixed(1)}px ${b.cy.toFixed(1)}px`;
  },
  render(lt) {
    const d = dur('c');
    // pan the page down (page px) to bring the attachment and the Development row into view
    const scroll = lerp(0, 545, outCubic(seg(lt, 0.06, d - 0.04)));
    this.page.style.setProperty('--scroll', scroll.toFixed(1));
    // quick push-in
    const s = lerp(1, 1.06, outCubic(seg(lt, 0, d - 0.05)));
    this.ghf.style.transformOrigin = this.org;
    this.ghf.style.transform = `scale(${s.toFixed(4)})`;
    // the attachment reveals into view
    if (this.attach) this.attach.style.opacity = seg(lt, 0.20, 0.50).toFixed(3);
  },
};