// Beat H (12.60-13.20, 0.60 s, no caption): Projects board "Kitebase Web". The hero card #482 slides from the
// In progress column to In review, picks up its linked PR "web #483", and the column counters swap (3/2 -> 2/3).
// The slide is driven by transforming the live card from its In progress position (measured from an offscreen render)
// to its In review position. Fast beat: one decisive move.
import { dur } from './budget.js';
import { mount } from '../gh/components/index.js';
import { seg, outCubic, op } from '../lib.js';
import { FRAME } from './e.js';

const K = FRAME.width / FRAME.pageWidth;

export default {
  id: 'h',
  dur: dur('h'),
  mount(section) {
    const ghf = mount(section, 'board', { board: { heroColumn: 'in_review' } }, FRAME);
    this.ghf = ghf;
    const page = ghf.querySelector('.ghf-page');
    const card = ghf.querySelector('.gh-pcard[data-card="482"]');
    this.card = card;
    this.inProgress = ghf.querySelector('[data-count="col-in_progress"]');
    this.inReview = ghf.querySelector('[data-count="col-in_review"]');
    this.linked = card ? card.querySelector('[data-slot="linked-pr"]') : null;
    // cards that sit under the hero while it is parked in the In progress column (they shift down by the hero's height)
    this.under = [...ghf.querySelectorAll('[data-col="in_progress"] .gh-pcard')].filter((c) => c !== card);
    this.heroH = card ? card.offsetHeight : 0;

    // measure the hero card in page px relative to the page: live (in_review) and an offscreen in_progress render
    const rel = (el, pg) => { const a = el.getBoundingClientRect(), b = pg.getBoundingClientRect(); return { x: (a.left - b.left) / K, y: (a.top - b.top) / K }; };
    const reviewPos = card ? rel(card, page) : { x: 0, y: 0 };
    const temp = document.createElement('div');
    temp.style.cssText = `position:fixed;left:-99999px;top:0;width:${FRAME.width}px;height:${FRAME.height}px;overflow:hidden`;
    document.body.appendChild(temp);
    let progPos = reviewPos;
    try {
      mount(temp, 'board', { board: { heroColumn: 'in_progress' } }, FRAME);
      const tpage = temp.querySelector('.ghf-page');
      const tcard = temp.querySelector('.gh-pcard[data-card="482"]');
      if (tcard) progPos = rel(tcard, tpage);
    } finally { temp.remove(); }
    this.delta = { x: progPos.x - reviewPos.x, y: progPos.y - reviewPos.y };

    if (card) card.style.transform = `translate(${this.delta.x.toFixed(1)}px, ${this.delta.y.toFixed(1)}px)`;
    if (this.linked) op(this.linked, 0);
    if (this.inProgress) this.inProgress.textContent = '3';
    if (this.inReview) this.inReview.textContent = '2';
  },
  render(lt) {
    const p = outCubic(seg(lt, 0.05, 0.38));
    const dx = this.delta.x * (1 - p), dy = this.delta.y * (1 - p);
    if (this.card) {
      this.card.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
      const moving = p < 0.999;
      this.card.style.zIndex = moving ? '5' : '';
      this.card.style.boxShadow = moving ? '0 8px 24px rgba(31, 35, 40, .28)' : '';
    }
    if (this.linked) op(this.linked, seg(lt, 0.28, 0.46));
    // while the hero is still in the In progress column, the cards beneath it sit one hero-height lower
    const shift = this.heroH * (1 - p);
    for (const c of this.under) c.style.transform = `translateY(${shift.toFixed(1)}px)`;
    const landed = p >= 0.5;
    if (this.inProgress) this.inProgress.textContent = landed ? '2' : '3';
    if (this.inReview) this.inReview.textContent = landed ? '3' : '2';
    const s = 0.988 + 0.012 * outCubic(seg(lt, 0, 0.5));
    this.ghf.style.transform = `scale(${s.toFixed(4)})`;
  },
};