// Connect beat: superbot answers first, as itself (no pill), and gets the runs. Its line streams ("Connecting to
// Strava to read your last 12 weeks of runs.") and Strava's OAuth authorize page opens in superbot's sign-in sheet (a
// small browser frame: lock, www.strava.com/oauth/authorize; Strava's white header with its orange wordmark over the
// grey page), the card laid out like the real page (developers.strava.com "Getting Started", the authorization page example): the app's own
// icon alone on top, "Authorize superbot to connect to Strava", the app's website under it, a rule, "superbot will be
// able to:", the scope rows with native checkboxes (public profile, required and greyed; activities; private
// activities = activity:read_all), the full-width orange Authorize over a white Cancel, and the two footer lines.
// The pointer presses Authorize; a two-line checklist ticks under the sheet (connected, 41 runs pulled).
// Pure function of t.
import { lerp, seg, outCubic, streamCount, press } from '../../../lib.js?v=bd0d0cf9';
import { STRAVA } from './plan-data.js?v=bd0d0cf9';
import { ico } from './ui-icons.js?v=bd0d0cf9';

const SAY = 'Connecting to Strava to read your last 12 weeks of runs.';
const SCOPES = [
  ['View data about your public profile (required)', true],
  ['View data about your activities', false],
  ['View data about your private activities', false],
];
const CHECKS = ['Connected to Strava as Sam', `Pulled ${STRAVA.runs} runs, ${STRAVA.from} to ${STRAVA.to}`];

const CPS = 100;                 // the reply line streams
const CARD_AT = 0.16;            // reply start to the sheet rising in
const CARD_IN = 0.3;
const CUR_AT = 0.28;             // the sheet landing to the pointer coming in
const AUTH_AT = 0.9; /* deliberate */ // the sheet landing to the press on Authorize (time to read it)
const CHECK_AT = 0.18;           // the press to the first check
const CHECK_STAGGER = 0.13;
const POP = 0.16;
const HOLD = 0.3;                // the last check settles, readable

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.cur = T.card + CUR_AT;
    T.auth = T.card + AUTH_AT;
    T.ok = CHECKS.map((_, i) => T.auth + CHECK_AT + i * CHECK_STAGGER);
    T.end = Math.max(T.ok[CHECKS.length - 1] + POP + HOLD, r + 0.05 + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="cn-web">
      <div class="cn-bar">${ico('ms_lock', 'cn-lock')}<span>www.strava.com/oauth/authorize</span></div>
      <div class="cn-site"><img class="cn-mark" src="${x.brand('strava-wordmark.svg')}" alt="Strava"/></div>
      <div class="cn-page"><div class="cn-card">
      <img class="cn-app" src="${x.sbSrc}" alt=""/>
      <h3 class="cn-h">Authorize superbot to connect to Strava</h3>
      <a class="cn-url">https://superbot.gg</a>
      <hr class="cn-hr"/>
      <b class="cn-will">superbot will be able to:</b>
      ${SCOPES.map(([s, req]) => `<label class="cn-sc${req ? ' cn-req' : ''}"><i class="cn-cb"><svg viewBox="0 0 12 12"><path d="M2.6 6.3l2.3 2.3 4.6-5"/></svg></i>${x.esc(s)}</label>`).join('')}
      <span class="cn-btn cn-auth">Authorize</span>
      <span class="cn-btn cn-cancel">Cancel</span>
      <p class="cn-ft">To revoke access to an application, please visit your <a>settings</a> at any time.</p>
      <p class="cn-ft">By authorizing an application you continue to operate under our <a>Terms of Service</a>.</p>
    </div></div></div>`);
    const list = x.el(`<div class="cn-done">${CHECKS.map((c) => `<div class="cn-step"><span class="cn-ok"><i class="cn-spin"></i>${x.OK}</span><span>${x.esc(c)}</span></div>`).join('')}</div>`);
    const auth = card.querySelector('.cn-auth');
    const steps = [...list.querySelectorAll('.cn-step')].map((n) => ({ n, spin: n.querySelector('.cn-spin'), ok: n.querySelector('.qc-ok') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card, list],
      marks: [[T.r, say], [T.card, card], [T.ok[0], list]],
      // the pointer: in from below right, onto the lower left of Authorize (the label stays clear), the press, and away
      pointer(t) {
        if (t < T.cur || t > T.auth + 0.4) return null;
        const b = x.box(auth);
        const m = outCubic(seg(t, T.cur, T.auth - 0.12));
        const v = seg(t, T.cur, T.cur + 0.15) * (1 - seg(t, T.auth + 0.22, T.auth + 0.4));
        const tx = b.x + b.w * 0.3, ty = b.cy + b.h * 0.24;
        return { x: tx + lerp(b.w * 0.6, 0, m), y: ty + lerp(b.h * 2.4, 0, m), p: press(t, T.auth), v };
      },
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        const pr = press(t, T.auth);
        auth.style.transform = pr ? `scale(${(1 - 0.03 * pr).toFixed(4)})` : 'none';
        auth.classList.toggle('on', t >= T.auth - 0.06 && t < T.auth + 0.25);
        const li = outCubic(seg(t, T.ok[0] - 0.1, T.ok[0] + 0.12));
        list.style.opacity = li.toFixed(3);
        list.style.transform = li >= 1 ? 'none' : `translateY(${((1 - li) * 8).toFixed(2)}px)`;
        steps.forEach((c, i) => {
          const o = outCubic(seg(t, T.ok[i], T.ok[i] + POP));
          c.n.style.opacity = outCubic(seg(t, T.ok[i] - 0.1, T.ok[i] + 0.06)).toFixed(3);
          c.spin.style.opacity = (1 - seg(t, T.ok[i] - 0.06, T.ok[i] + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.auth) * 420).toFixed(1)}deg)`;
          c.ok.style.opacity = o.toFixed(3);
          c.ok.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });
      },
    };
  },
};
