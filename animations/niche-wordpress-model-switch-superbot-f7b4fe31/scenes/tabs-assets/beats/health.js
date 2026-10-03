// Health beat: Gemini reads the site's Site Health report, its debug log and its 23 plugins. Its line streams and a card
// rises (the base's compact-card grammar, no tabs, no footer controls, no accordion chevrons): a flat glyph, "Site
// Health" with the muted site "kettlefernbakery.com", then the four issue rows land one after another. Each row is the
// verbatim WordPress core Site Health test label (wordpress-develop src/wp-admin/includes/class-wp-site-health.php)
// with core's own severity as a plain muted word on the right (no badge, no box), and under it Gemini's finding in the
// hub's secondary text. Under the failed scheduled event, one line of the site's debug.log in muted red mono (PHP 8's own TypeError
// message, no timestamp prefix). Under the card a status line: a spinner and "Reading 23 plugins and your child
// theme", which resolves to the green check and "2 critical issues, 2 recommended improvements, all fixable". The
// card is laid out whole from the start (rows at opacity 0), so nothing reflows while it fills. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { oi } from './hub-icons.js?v=f7b4fe31';

const SAY = 'Read your Site Health report, debug log and 23 plugins';
export const SITE = { title: 'Site Health', meta: 'kettlefernbakery.com' };
// the debug.log line under the first row (PHP 8's real message format, verbatim, timestamp prefix stripped)
export const LOG = 'PHP Fatal error: Uncaught TypeError: count(): Argument #1 ($value) must be of type Countable|array, null given in functions.php:212';
// [core label, severity word, Gemini's finding] (exact, per the spec)
// in Site Health's own order and with core's own severities (the criticals first); the debug.log line sits under the
// failed scheduled event, Gemini's root cause
export const ROWS = [
  ['You have plugins waiting to be updated', 'critical', '3 updates, all compatible with your theme'],
  ['Autoloaded options could affect performance', 'critical', '1.8 MB left behind by a plugin you deleted'],
  ['A scheduled event has failed', 'recommended', 'Your child theme\'s daily menu sync stops on a PHP 8.3 error', 'log'],
  ['You should remove inactive themes', 'recommended', '2 old themes your child theme does not use'],
];
const READING = 'Reading 23 plugins and your child theme';
const DONE = '2 critical issues, 2 recommended improvements, all fixable';
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const ROW_AT = 0.3;                    // the card landing to the first row
const ROW = 0.3; /* deliberate */      // one row to the next (each row's label and finding read as it lands)
const ROW_IN = 0.22;                   // a row landing
const LOG_AT = 0.16;                   // the scheduled event's row in, then its debug.log line
const DONE_AT = 0.34;                  // the last row in, then the status resolves
const DONE_IN = 0.24;                  // the status line's text crossfade
const HOLD = 0.55; /* deliberate */    // the four findings read before the next status line

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.rows = ROWS.map((_, i) => T.card + ROW_AT + i * ROW);
    T.log = T.rows[ROWS.findIndex((r) => r[3])] + LOG_AT;
    T.done = T.rows[ROWS.length - 1] + ROW_IN + DONE_AT;
    T.end = Math.max(T.done + DONE_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="hl-card">
      <div class="hl-hd"><span class="hl-ic">${oi('heart-pulse')}</span><b>${esc(SITE.title)}</b><span class="hl-sub">${esc(SITE.meta)}</span></div>
      ${ROWS.map(([label, sev, find, log]) => `<div class="hl-row">
        <div class="hl-top"><b>${esc(label)}</b><span class="hl-sev">${esc(sev)}</span></div>
        <div class="hl-find">${esc(find)}</div>
        ${log ? `<div class="hl-log">${esc(LOG)}</div>` : ''}
      </div>`).join('')}
    </div>`);
    const st = x.el(`<div class="hl-st"><span class="hl-si"><i class="hl-spin"></i>${x.OK}</span><span class="hl-tx"><span class="hl-a">${esc(READING)}</span><span class="hl-b">${esc(DONE)}</span></span></div>`);
    const rows = [...card.querySelectorAll('.hl-row')];
    const log = card.querySelector('.hl-log');
    const spin = st.querySelector('.hl-spin'), ok = st.querySelector('.hl-si .qc-ok'), ta = st.querySelector('.hl-a'), tb = st.querySelector('.hl-b');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1;

    return {
      nodes: [say, card, st],
      marks: [[T.r, say], [T.card, card], [T.card + 0.2, st]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the rows land one after another, then the debug.log line under the first
        rows.forEach((n, i) => {
          const p = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          n.style.opacity = p.toFixed(3);
          n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 5).toFixed(2)}px)`;
        });
        log.style.opacity = outCubic(seg(t, T.log, T.log + ROW_IN)).toFixed(3);

        // the status: spinner and "Reading 23 plugins and your child theme", then the check and the result
        const si = outCubic(seg(t, T.card + 0.1, T.card + 0.34));
        st.style.opacity = si.toFixed(3);
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const sw = seg(t, T.done, T.done + DONE_IN);
        ta.style.opacity = (1 - outCubic(seg(sw, 0, 0.5))).toFixed(3);
        tb.style.opacity = outCubic(seg(sw, 0.5, 1)).toFixed(3);
      },
    };
  },
};
