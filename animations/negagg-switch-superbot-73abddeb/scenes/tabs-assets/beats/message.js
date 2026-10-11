// Claude, the payoff: a drafted message to the Eastline Lofts leasing office (the listing from the ranking, with its
// photo, rent and size), typed out in full; then Superbot's tool steps tick one by one (opened the listing, pasted
// the message, sent it) and a "Message sent" card lands. Pure function of t.
import { seg, outCubic, rise, sayLine } from './util.js';
import { WINNER as L } from './data.js';
import { streamCount, outBack } from '../../../lib.js';

const SAY = `Here is a message to the ${L.name} leasing office:`;
const BODY = `Hi, I'm interested in the 2 bed, 2 bath at ${L.name}, listed at ${L.rent}/mo. Is it available for a June 1 move in? Could you also share the lease lengths and whether I can tour this week? Thanks, Sam`;
const STEPS = [
  [`Opening the ${L.name} listing`, `Opened the ${L.name} listing`],
  ['Pasting your message', 'Pasted your message'],
  ['Sending to the leasing office', 'Sent to the leasing office'],
];
const SENT_AT = '4:12 PM';

export default {
  times(r) {
    const T = { r };
    T.draft = r + 0.4;
    T.type = T.draft + 0.25;
    T.typeEnd = T.type + BODY.length / 170;
    T.step = STEPS.map((_, i) => T.typeEnd + 0.2 + i * 0.5);
    T.stepDone = STEPS.map((_, i) => T.step[i] + 0.42);
    T.sent = T.stepDone[STEPS.length - 1] + 0.1;
    T.end = T.sent + 1.2;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const draft = x.el(`<div class="sw-msg">
      <div class="sw-msg-h"><span class="sw-th" style="background-image:url('${x.img(L.photo)}')"></span><span class="sw-msg-t"><b>${x.esc(L.name)}</b><small>Leasing office · ${L.rent}/mo · 2 bd · 2 ba</small></span><em>Draft</em></div>
      <div class="sw-msg-b"><span class="qc-vis"></span><span class="qc-hid">${x.esc(BODY)}</span></div>
    </div>`);
    const vis = draft.querySelector('.qc-vis'), hid = draft.querySelector('.qc-hid'), status = draft.querySelector('.sw-msg-h em');
    const rows = STEPS.map(([run]) => x.el(`<div class="sw-step"><span class="sw-sp"></span><span class="sw-step-t">${x.esc(run)}</span></div>`));
    const sent = x.el(`<div class="sw-sent">
      <span class="sw-sent-ic"><svg viewBox="0 0 24 24"><path class="sw-sent-p" d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>
      <span class="sw-sent-t"><b>Message sent</b><small>${x.esc(L.name)} · Leasing office · ${SENT_AT}</small></span>
      <span class="sw-th" style="background-image:url('${x.img(L.photo)}')"></span>
      <span class="sw-sent-q"><span>June 1 move in</span><span>Lease lengths</span><span>Tour this week</span></span>
    </div>`);
    const ic = sent.querySelector('.sw-sent-ic'), path = sent.querySelector('.sw-sent-p');
    let shown = -1;
    return {
      nodes: [say.node, draft, ...rows, sent],
      marks: [[T.r, say.node], [T.draft, draft], ...rows.map((r, i) => [T.step[i], r]), [T.sent, sent]],
      render(t) {
        say.update(t, T.r + 0.05, 75);
        rise(draft, seg(t, T.draft, T.draft + 0.4), 12);
        const n = streamCount(BODY, T.type, 170, t);
        if (n !== shown) { vis.textContent = BODY.slice(0, n); hid.textContent = BODY.slice(n); shown = n; }
        const gone = t >= T.sent;
        if (status.textContent !== (gone ? 'Sent' : 'Draft')) { status.textContent = gone ? 'Sent' : 'Draft'; status.classList.toggle('on', gone); }
        rows.forEach((r, i) => {
          rise(r, seg(t, T.step[i], T.step[i] + 0.3), 6);
          const done = t >= T.stepDone[i];
          const sp = r.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? STEPS[i][1] : STEPS[i][0];
          if (r.lastElementChild.textContent !== lab) r.lastElementChild.textContent = lab;
        });
        const p = seg(t, T.sent, T.sent + 0.5);
        const e = outCubic(p);
        sent.style.opacity = e.toFixed(3);
        sent.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        ic.style.transform = `scale(${(0.5 + 0.5 * outBack(seg(t, T.sent + 0.08, T.sent + 0.42))).toFixed(3)})`;
        path.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, T.sent + 0.14, T.sent + 0.46)))).toFixed(2);
      },
    };
  },
};
