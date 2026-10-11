// Claude, the third ask: "write the Instagram caption and schedule it for Saturday 9am". The caption streams into a
// card (the bakery's handle, the same poster as a thumbnail, the caption and three hashtags), then superbot's tool
// steps tick (Opened Instagram, Scheduled Sat 9:00 AM) and a scheduled-post card lands showing the poster thumbnail,
// the caption's first lines, the slot and a "Scheduled" pill. Pure function of t. Content: ./data.js (invented).
import { seg, outCubic, rise, sayLine, ICONS } from './util.js';
import { CAPTION, TAGS, BAKERY, POST } from './data.js';
import { streamCount, outBack } from '../../../lib.js';

const SAY = 'Here is the caption for the poster, and I will schedule it:';
const STEPS = [
  ['Opening Instagram', 'Opened Instagram'],
  [`Scheduling for ${POST.day} ${POST.time}`, `Scheduled ${POST.day} ${POST.time}`],
];

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.05;
    T.card = r + 0.4;
    T.type = T.card + 0.3;
    T.typeEnd = T.type + CAPTION.length / 210;
    T.tag = TAGS.map((_, i) => T.typeEnd + 0.08 + i * 0.1);
    T.step = STEPS.map((_, i) => T.tag[2] + 0.3 + i * 0.4);
    T.stepDone = STEPS.map((_, i) => T.step[i] + 0.34);
    T.sched = T.stepDone[STEPS.length - 1] + 0.1;
    T.end = T.sched + 0.95;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const card = x.el(`<div class="sc-card">
      <div class="sc-h"><span class="sc-av" style="background-image:url('${x.img('counter.jpg')}')"></span><span class="sc-hn"><b>${x.esc(BAKERY.handle)}</b><small>Instagram caption</small></span><em>Draft</em></div>
      <div class="sc-b"><span class="qc-vis"></span><span class="qc-hid">${x.esc(CAPTION)}</span></div>
      <div class="sc-tags">${TAGS.map((tg) => `<span class="ca-tag">${x.esc(tg)}</span>`).join('')}</div>
    </div>`);
    const vis = card.querySelector('.qc-vis'), hid = card.querySelector('.qc-hid');
    const tags = [...card.querySelectorAll('.ca-tag')];
    const rows = STEPS.map(([run], i) => x.el(`<div class="sw-step"><span class="sw-sp"></span>${i === 0 ? `<span class="sc-ig">${ICONS.insta}</span>` : `<span class="sc-ig">${ICONS.cal}</span>`}<span class="sw-step-t">${x.esc(run)}</span></div>`));
    const sched = x.el(`<div class="sc-post">
      <span class="sc-th"><img src="${x.img('t-loaves.jpg')}" alt=""/><i>Saturday<br/>Sale</i></span>
      <span class="sc-pm">
        <span class="sc-pt"><span class="sc-pi">${ICONS.insta}</span><b>Scheduled post</b><span class="sc-pill"><i></i>Scheduled</span></span>
        <span class="sc-pc">${x.esc(CAPTION)}</span>
        <span class="sc-pw"><span class="sc-wi">${ICONS.cal}</span><b>${x.esc(POST.day)} ${x.esc(POST.time)}</b><small>Feed post · 1 image</small></span>
      </span>
    </div>`);
    const pill = sched.querySelector('.sc-pill');
    const status = card.querySelector('.sc-h em');
    let shown = -1;
    return {
      nodes: [say.node, card, ...rows, sched],
      marks: [[T.r, say.node], [T.card, card], [T.tag[2], card], ...rows.map((r, i) => [T.step[i], r]), [T.sched, sched]],
      render(t) {
        say.update(t, T.say, 75);
        const p = seg(t, T.card, T.card + 0.45);
        const e = outCubic(p);
        card.style.opacity = e.toFixed(3);
        card.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 14).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const n = streamCount(CAPTION, T.type, 210, t);
        if (n !== shown) { vis.textContent = CAPTION.slice(0, n); hid.textContent = CAPTION.slice(n); shown = n; }
        tags.forEach((g, i) => { const f = seg(t, T.tag[i], T.tag[i] + 0.35); g.style.opacity = outCubic(Math.min(1, f * 1.6)).toFixed(3); g.style.transform = `scale(${(0.6 + 0.4 * outBack(f)).toFixed(3)})`; });
        const sd = t >= T.sched;
        const lab = sd ? 'Scheduled' : 'Draft';
        if (status.textContent !== lab) { status.textContent = lab; status.classList.toggle('on', sd); }
        rows.forEach((r, i) => {
          rise(r, seg(t, T.step[i], T.step[i] + 0.3), 6);
          const done = t >= T.stepDone[i];
          const sp = r.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const l = done ? STEPS[i][1] : STEPS[i][0];
          if (r.lastElementChild.textContent !== l) r.lastElementChild.textContent = l;
        });
        const sp2 = seg(t, T.sched, T.sched + 0.5);
        const se = outCubic(sp2);
        sched.style.opacity = se.toFixed(3);
        sched.style.transform = sp2 >= 1 ? '' : `translateY(${((1 - se) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * se).toFixed(4)})`;
        pill.style.transform = `scale(${(0.6 + 0.4 * outBack(seg(t, T.sched + 0.15, T.sched + 0.5))).toFixed(3)})`;
      },
    };
  },
};
