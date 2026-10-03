// Theme fix beat: Claude Opus 5.5 fixes the menu sync in the child theme. Its line streams and a card rises: a header
// with a flat glyph, "functions.php" and the muted theme folder "kettlefern-child" as plain text (no tab strip, no Run,
// no copy icon, no clock), then a unified diff in the github sibling's diff look (a line-number gutter, the +/- sign,
// the removed line tinted red, the added lines tinted green, context neutral; GitHub's own diff and syntax colours,
// chat.css --gh-*). The context and the removed line are there when the card lands; the four added lines stream in
// behind a caret. Line numbers start at 210 so the removed count() call sits on line 212, the line the debug.log in
// the Gemini beat names. Then the green check line: "Menu sync fixed, safe on PHP 8.3". In the zoom cut the camera
// pushes in on the card while it writes (chat.js FOCUS). Pure function of t: line heights are constants, so the
// stream never measures layout.
import { lerp, seg, outCubic } from '../../../lib.js';
import { oi } from './hub-icons.js?v=f7b4fe31';

const SAY = 'Fixed the menu sync in your child theme';
const FILE = 'functions.php', THEME = 'kettlefern-child';
// [kind, line number, code]: ' ' context, '-' removed, '+' added (exact, per the spec; valid PHP and WordPress API)
export const DIFF = [
  [' ', 210, 'function kf_sync_daily_menu() {'],
  [' ', 211, '    $items = get_option( \'kf_menu_items\' );'],
  ['-', 212, '    $count = count( $items );'],
  ['+', 212, '    if ( ! is_array( $items ) ) {'],
  ['+', 213, '        $items = array();'],
  ['+', 214, '    }'],
  ['+', 215, '    $count = count( $items );'],
  [' ', 216, '    if ( 0 === $count ) {'],
  [' ', 217, '        return;'],
  [' ', 218, '    }'],
];
const DONE = 'Menu sync fixed, safe on PHP 8.3';
// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 106.25;  // the reply line streams (the base's Opus beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.2;     // the card rising in
const WRITE_AT = 0.4;    // the card is up (and the camera on its way in), then the first added character lands
const CPS_W = 95; /* deliberate */ // the added lines type at this many characters a second (a line break counts one)
const DONE_AT = 0.2;     // the fix written, then the check line
const DONE_IN = 0.22;    // the check line rising in
const HOLD_DONE = 0.5; /* deliberate */ // done: the fix reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light PHP highlighter in GitHub's dark syntax colours (chat.css --gh-syn-*): one span per character, so a partly
// streamed line keeps each character's final colour. Keywords, strings, numbers and called functions.
const KW = new Set(['function', 'if', 'return', 'array']);
function charsOf(code) {
  const toks = code.match(/'[^']*'|\$\w+|\d+|[A-Za-z_]\w*|\s+|===|./g) || [];
  return toks.flatMap((tk, j) => {
    let c = '';
    if (tk[0] === "'") c = 'st';
    else if (/^\d/.test(tk)) c = 'cn';
    else if (tk[0] === '$') c = 'vr';
    else if (KW.has(tk)) c = 'kw';
    else if (/^[A-Za-z_]/.test(tk) && toks[j + 1] === '(') c = 'fn';
    return [...tk].map((ch) => (c ? `<i class="${c}">${esc(ch)}</i>` : esc(ch)));
  });
}
// the added lines' start offsets in the stream, and its length
const STREAM = (() => {
  let acc = 0;
  const starts = DIFF.map(([kind, , code]) => { if (kind !== '+') return -1; const s = acc; acc += code.length + 1; return s; });
  return { starts, total: acc - 1 };
})();

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + STREAM.total / CPS_W;
    T.done = T.w1 + DONE_AT;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + DONE_IN + HOLD_DONE, back: T.done + DONE_IN + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + DONE_IN + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="tf-card">
      <div class="tf-hd"><span class="tf-ic">${oi('file-code')}</span><b>${esc(FILE)}</b><span class="tf-sub">${esc(THEME)}</span></div>
      <div class="tf-bd">${DIFF.map(([kind, no]) => `<div class="tf-l${kind === '+' ? ' tf-add' : kind === '-' ? ' tf-del' : ''}"><u>${no}</u><s>${kind === ' ' ? '' : kind}</s><code><span class="tf-v"></span><i class="tf-caret"></i></code></div>`).join('')}</div>
      <div class="tf-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.tf-l')].map((n, i) => ({
      n, v: n.querySelector('.tf-v'), c: n.querySelector('.tf-caret'), chars: charsOf(DIFF[i][2]), kind: DIFF[i][0], shown: -1, caret: null, vis: null,
    }));
    const ft = card.querySelector('.tf-ft');
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS_SAY + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, e).toFixed(4)})`;

        // the stream: added lines fill in order, the caret riding the last character; an added line shows its gutter
        // (and its tint) once its first character is due
        const c = Math.round(STREAM.total * seg(t, T.w0, T.w1));
        const writing = t >= T.w0 && t < T.w1 + 0.15;
        rows.forEach((o, i) => {
          let k2 = o.chars.length, on = false, visible = true;
          if (o.kind === '+') {
            const st = STREAM.starts[i];
            k2 = Math.max(0, Math.min(o.chars.length, c - st));
            const next = STREAM.starts.slice(i + 1).find((v) => v >= 0);
            on = writing && c >= st && (next === undefined || c < next);
            visible = t >= T.w0 && (c > st || st === 0 || c >= STREAM.total);
          }
          if (k2 !== o.shown) { o.v.innerHTML = o.chars.slice(0, k2).join(''); o.shown = k2; }
          if (visible !== o.vis) { o.n.style.visibility = visible ? '' : 'hidden'; o.vis = visible; }
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });

        const f = outCubic(seg(t, T.done, T.done + DONE_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
