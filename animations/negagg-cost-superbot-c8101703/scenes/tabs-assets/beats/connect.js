// superbot, the first ask: "connect my AI accounts". Superbot's own tool steps tick one by one (Signed in to ChatGPT,
// Signed in to Claude, Signed in to Gemini, each with the app's real mark), then a "Your plans" card lands: three rows
// (mark, app, the plan the user already pays for, a green "connected" pill) and a footer with superbot's own plan,
// "superbot · Free plan · $0" (superbot.gg/api.md: Superbot Free, $0 a month). Pure function of t. Data: ./data.js.
import { seg, outCubic, rise, sayLine, ICONS } from './util.js';
import { PLANS, SB_PLAN } from './data.js';
import { outBack } from '../../../lib.js';

const SAY = 'Connecting your AI accounts. Opening each sign-in:';

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.05;
    T.step = PLANS.map((_, i) => r + 0.4 + i * 0.4);
    T.stepDone = PLANS.map((_, i) => T.step[i] + 0.34);
    T.card = T.stepDone[PLANS.length - 1] + 0.12;
    T.row = PLANS.map((_, i) => T.card + 0.25 + i * 0.18);
    T.foot = T.row[PLANS.length - 1] + 0.3;
    T.end = T.foot + 0.75;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const steps = PLANS.map((p) => x.el(`<div class="sw-step cn-step"><span class="sw-sp"></span>${x.tile(p.app)}<span class="sw-step-t">Signing in to ${x.esc(p.name)}</span></div>`));
    const rows = PLANS.map((p) => x.el(`<div class="cn-row">${x.tile(p.app, 'cn-tile')}<span class="cn-m"><b>${x.esc(p.name)}</b><small>${x.esc(p.plan)}</small></span><span class="cn-pill"><i></i>connected</span></div>`));
    const card = x.el(`<div class="cn-card">
      <div class="cn-h"><span class="cn-ht">${ICONS.key}Your plans</span><b>${PLANS.length} connected</b></div>
      <div class="cn-list"></div>
      <div class="cn-f">${x.tile('sb', 'cn-ftile')}<span>superbot</span><i>·</i><span>${x.esc(SB_PLAN.name)}</span><i>·</i><b>${x.esc(SB_PLAN.price)}</b></div>
    </div>`);
    const list = card.querySelector('.cn-list');
    rows.forEach((r) => list.appendChild(r));
    const foot = card.querySelector('.cn-f');
    const count = card.querySelector('.cn-h b');
    return {
      nodes: [say.node, ...steps, card],
      marks: [[T.r, say.node], ...steps.map((s, i) => [T.step[i], s]), [T.card, card], [T.foot, foot]],
      render(t) {
        say.update(t, T.say, 75);
        steps.forEach((s, i) => {
          rise(s, seg(t, T.step[i], T.step[i] + 0.3), 6);
          const done = t >= T.stepDone[i];
          const sp = s.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = `${done ? 'Signed in to' : 'Signing in to'} ${PLANS[i].name}`;
          if (s.lastElementChild.textContent !== lab) s.lastElementChild.textContent = lab;
        });
        const p = seg(t, T.card, T.card + 0.45);
        const e = outCubic(p);
        card.style.opacity = e.toFixed(3);
        card.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 14).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        let shown = 0;
        rows.forEach((r, i) => {
          const f = seg(t, T.row[i], T.row[i] + 0.34);
          rise(r, f, 8);
          const pill = r.lastElementChild;
          const o = seg(t, T.row[i] + 0.14, T.row[i] + 0.42);
          pill.style.opacity = o.toFixed(3);
          pill.style.transform = `scale(${(0.7 + 0.3 * outBack(o)).toFixed(3)})`;
          if (f >= 1) shown++;
        });
        const cs = `${shown} connected`;
        if (count.textContent !== cs) count.textContent = cs;
        rise(foot, seg(t, T.foot, T.foot + 0.4), 6);
      },
    };
  },
};
