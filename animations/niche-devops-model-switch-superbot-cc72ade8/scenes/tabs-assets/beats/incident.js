// Incident beat: Gemini reads the incident on checkout-api in prod. Its line streams and a card rises (the sibling's
// repo.js grammar, as the roblox fork hardened it: a compact neutral superbot card, a counter, rows that resolve). The
// counter "Reading pod logs and events from N failed deploys" runs 0 to 3 with its thin bar while the evidence lands
// line by line in a mono well: `kubectl get pods -n prod` (the NAME / READY / STATUS / RESTARTS columns; the AGE column
// and the restart ages are left out so no time value is on screen), two checkout-api pods 0/1 CrashLoopBackOff with 14
// and 11 restarts, then a `kubectl describe pod` excerpt in kubectl's own wording and indentation (Last State:
// Terminated / Reason: OOMKilled / Exit Code: 137). The OOMKilled line is the scene's bold element: it lands with the
// danger tint. Then three findings resolve as rows (file glyph, mono path:line, one tag, the finding); the first, the
// root cause at charts/checkout-api/values.yaml:42, carries the highlight. The footer lands: "Root cause found:
// OOMKilled on startup, exit code 137". Pod names follow Kubernetes' <deployment>-<pod-template-hash>-<suffix> shape
// (hash alphabet bcdfghjklmnpqrstvwxz2456789). Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=cc72ade8';

const SAY = 'Read the pods, events and logs of checkout-api in prod.';
const DEPLOYS = 3;
const POD = 'checkout-api-6f8d9c7b5-x2kqp';
// the evidence well, top to bottom: [kind, text]; '$' a command, 'h' kubectl's header row, ' ' an output line, '!' the
// bold line. kubectl pads its columns to the widest cell plus three spaces.
const EVIDENCE = [
  ['$', 'kubectl get pods -n prod'],
  ['h', 'NAME                           READY   STATUS             RESTARTS'],
  [' ', `${POD}   0/1     CrashLoopBackOff   14`],
  [' ', 'checkout-api-6f8d9c7b5-w7tzh   0/1     CrashLoopBackOff   11'],
  ['$', `kubectl describe pod ${POD} -n prod`],
  [' ', '    Last State:     Terminated'],
  ['!', '      Reason:       OOMKilled'],
  [' ', '      Exit Code:    137'],
];
// the findings: [path, finding, tag, highlighted]
const FINDINGS = [
  ['charts/checkout-api/values.yaml:42', 'Memory limit is 256Mi, the new build needs about 400Mi to start', 'Root cause', true],
  ['charts/checkout-api/templates/deployment.yaml:58', 'Liveness probe restarts pods before they finish booting', 'Probe', false],
  ['.gitlab-ci.yml:74', 'Canary job never waits for the rollout, so failures reach prod', 'Gap', false],
];
const DONE = 'Root cause found: OOMKilled on startup, exit code 137';
// timing (seconds from the reply start, or from the card where noted): the sibling's repo beat pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const COUNT_AT = 0.12;                 // the card landing to the counter starting
const COUNT = 0.9; /* deliberate */    // the counter running up to 3 failed deploys (its bar fills with it)
const EV_AT = 0.06;                    // the counter starting to the first evidence line
const EV_STAGGER = 0.085;              // one evidence line to the next
const EV_IN = 0.16;                    // an evidence line landing
const HOLD_EV = 0.25; /* deliberate */ // the OOMKilled line in, it reads before the findings
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.c0 = T.card + RISE * 0.5 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.ev = EVIDENCE.map((_, i) => T.c0 + EV_AT + i * EV_STAGGER);
    T.oom = T.ev[EVIDENCE.findIndex(([k]) => k === '!')];
    const evEnd = T.ev[EVIDENCE.length - 1] + EV_IN;
    T.row = FINDINGS.map((_, i) => Math.max(T.c1, T.oom + HOLD_EV) + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, evEnd);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const line = ([kind, text]) => {
      if (kind === '$') return `<div class="ir-ln ir-cmd"><b>$</b>${esc(text)}</div>`;
      if (kind === 'h') return `<div class="ir-ln ir-th">${esc(text)}</div>`;
      if (kind === '!') {
        const [lab, val] = text.split(/(?<=:)\s+/);
        return `<div class="ir-ln ir-hot"><span>${esc(lab)}${' '.repeat(text.length - lab.length - val.length)}</span><mark>${esc(val)}</mark></div>`;
      }
      return `<div class="ir-ln">${esc(text)}</div>`;
    };
    const card = x.el(`<div class="rr-card">
      <div class="rr-ch"><span class="rr-st"><i class="rr-spin"></i>${x.OK}</span><b>Reading pod logs and events from <span class="rr-n">0</span> failed deploys</b></div>
      <i class="rr-cbar"><i></i></i>
      <div class="ir-well">${EVIDENCE.map(line).join('')}</div>
      <div class="rr-list">${FINDINGS.map(([path, text, tag, hi]) => `<div class="rr-row${hi ? ' rr-hi' : ''}">${lc('file-code', 'rr-fi')}
        <div class="rr-main"><span class="rr-r1"><code>${x.esc(path)}</code><span class="rr-tag">${x.esc(tag)}</span></span><span class="rr-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="rr-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const cSt = { spin: $('.rr-st .rr-spin'), ok: $('.rr-st .qc-ok') };
    const ch = $('.rr-ch'), cbarW = $('.rr-cbar'), cbar = $('.rr-cbar i'), n = $('.rr-n'), ft = $('.rr-ft');
    const evs = [...card.querySelectorAll('.ir-ln')];
    const hot = $('.ir-hot');
    const rows = [...card.querySelectorAll('.rr-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.ev[3], evs[3]], [T.oom, evs[EVIDENCE.length - 1]], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the counter and its bar: 0 to 3 failed deploys
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = String(Math.round(DEPLOYS * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        const d = outCubic(seg(t, T.c1, T.c1 + 0.2));
        cSt.spin.style.opacity = (1 - seg(t, T.c1 - 0.08, T.c1 + 0.06)).toFixed(3);
        cSt.spin.style.transform = `rotate(${((t - T.c0) * 420).toFixed(1)}deg)`;
        cSt.ok.style.opacity = d.toFixed(3);
        cSt.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the evidence lands line by line; OOMKilled takes the danger tint as it lands
        evs.forEach((e, i) => {
          const o = outCubic(seg(t, T.ev[i], T.ev[i] + EV_IN));
          e.style.opacity = o.toFixed(3);
          e.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 4).toFixed(2)}px)`;
        });
        hot.classList.toggle('on', t >= T.oom + EV_IN * 0.5);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
