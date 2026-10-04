// ytx4 relay baton: leg 3, the Claude Opus 5.5 writing pane (a superbot screen, 1920x1080 design px, shown in the
// framed window). Four cards; each quotes its comment, and Noa's reply streams in under it.
// mountOpus(el, items) with items = [{ handle, avatar, text, reply }] (from scenes/yt/story-data.js) -> { render(t) }
import { clamp, seg, outCubic, esc, streamCount } from '../../lib.js';
import { LEG3 } from './layout.js';

const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export function mountOpus(el, items, noa) {
  el.innerHTML = `
<div class="op-root">
  <div class="op-head">
    <span class="op-logo"><img src="brand/claude-logo.svg" alt=""></span>
    <span class="op-h"><b>Claude Opus 5.5</b><span>Writing in Noa's voice</span></span>
    <span class="op-count"><i></i><span class="op-n">0 of 4 replies</span></span>
  </div>
  <div class="op-grid">${items.map((it) => `
    <div class="op-card">
      <div class="op-q"><img src="${it.avatar}" alt=""><span class="op-qb"><span class="op-qh">${esc(it.handle)}</span><span class="op-qt">${esc(it.text)}</span></span></div>
      <div class="op-r"><img src="${noa.avatar}" alt=""><span class="op-rb"><span class="op-rh">${esc(noa.handle)}<em>Reply</em></span><span class="op-rt"></span></span></div>
      <span class="op-done">${CHECK}</span>
    </div>`).join('')}
  </div>
</div>`;
  const cards = [...el.querySelectorAll('.op-card')].map((c, i) => ({
    el: c, rt: c.querySelector('.op-rt'), done: c.querySelector('.op-done'), reply: items[i].reply, last: null,
  }));
  const n = el.querySelector('.op-n');
  let lastN = null;
  return {
    render(t) {
      let finished = 0;
      cards.forEach((c, i) => {
        const t0 = LEG3.first + i * LEG3.gap;
        const k = streamCount(c.reply, t0, LEG3.cps, t);
        const end = t0 + c.reply.length / LEG3.cps;
        const writing = t >= t0 && k < c.reply.length;
        const html = esc(c.reply.slice(0, k)) + (writing || (t >= t0 - 0.2 && k === 0) ? '<i class="op-caret"></i>' : '');
        if (html !== c.last) { c.rt.innerHTML = html; c.last = html; }
        c.el.classList.toggle('on', t >= t0 - 0.05 && t < end + 0.25);
        const d = outCubic(seg(t, end + 0.02, end + 0.22));
        c.done.style.opacity = d.toFixed(3);
        c.done.style.transform = `scale(${(0.6 + 0.4 * d).toFixed(3)})`;
        if (t >= end) finished++;
      });
      const label = `${finished} of 4 replies`;
      if (label !== lastN) { n.textContent = label; lastN = label; }
    },
    // when the last reply is fully written (the stamp lands just after)
    doneAt: Math.max(...cards.map((c, i) => LEG3.first + i * LEG3.gap + c.reply.length / LEG3.cps)),
  };
}
