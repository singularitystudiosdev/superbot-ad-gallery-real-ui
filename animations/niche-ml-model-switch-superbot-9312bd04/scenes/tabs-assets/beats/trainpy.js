// train.py beat: Claude Opus 5.5 writes the fine-tuning script. Its line streams and a card rises: "train.py" with the
// muted "Python" (plain text: no tab strip, no Run, no copy icon), then a mono well with line numbers where the script
// types out in the github sibling's code look (its mono and GitHub's dark syntax colours, chat.css --gh-syn-*). The
// script is exact and uses the current transformers API (AutoModelForImageClassification, Trainer, TrainingArguments
// with eval_strategy). Then the green check line lands: "train.py written: 8 epochs, keeps the best one". In the zoom
// cut the camera pushes in on the card while it writes (chat.js FOCUS). Pure function of t: the typed prefix and every
// opacity are written from t; line heights are constants, so nothing reflows.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { mi } from './ml-icons.js?v=9312bd04';

const SAY = 'Wrote train.py to fine-tune ViT on your 24 species';
const TITLE = 'train.py', LANG = 'Python';
// the script, line by line (exact, per the spec)
export const CODE = [
  'from transformers import AutoModelForImageClassification',
  'from transformers import Trainer, TrainingArguments',
  '',
  'model = AutoModelForImageClassification.from_pretrained(',
  '    "google/vit-base-patch16-224", num_labels=24,',
  '    ignore_mismatched_sizes=True)',
  '',
  'args = TrainingArguments("backyard-birds-vit",',
  '    num_train_epochs=8, learning_rate=5e-5,',
  '    eval_strategy="epoch", save_strategy="epoch",',
  '    load_best_model_at_end=True, push_to_hub=True)',
  '',
  '# train and val: 1,842 and 230 of your photos, flips and crops',
  'trainer = Trainer(model=model, args=args,',
  '    train_dataset=train, eval_dataset=val)',
  'trainer.train()',
];
const DONE = 'train.py written: 8 epochs, keeps the best one';
// timing (seconds from the reply start, or from the card where noted)
const CPS_SAY = 106.25;  // the reply line streams (the base's Opus beat)
const SAY_AT = 0.04;     // reply start to the line's first character
const CARD_AT = 0.08;    // the reply line starts, then the card rises
const CARD_IN = 0.2;     // the card rising in
const WRITE_AT = 0.3;    // the card is up, then the first character lands
const CPS_W = 330; /* deliberate */ // the script types at this many characters a second (a line break counts one)
const DONE_AT = 0.14;    // the script written, then the check line
const DONE_IN = 0.22;    // the check line rising in
const HOLD_DONE = 0.45; /* deliberate */  // done: the result reads, pushed in, before the pull-back
const FOCUS_AT = 0.36; /* deliberate */  // the card has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */ // push-in, outQuint
const FOCUS_PULL = 0.4; /* deliberate */ // pull-back, inOutCubic

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light Python highlighter: one class per character, so a partly typed line keeps each character's final colour
const KW = new Set(['from', 'import']);
function classesOf(code) {
  const toks = code.match(/#.*$|"[^"]*"|\d[\d.e-]*|[A-Za-z_][\w]*|\s+|./g) || [];
  return toks.flatMap((tk, j) => {
    let c = '';
    if (tk[0] === '#') c = 'cm';
    else if (tk[0] === '"') c = 'st';
    else if (/^\d/.test(tk) || tk === 'True') c = 'cn';
    else if (KW.has(tk)) c = 'kw';
    else if (/^[A-Za-z_]/.test(tk) && toks[j + 1] === '(') c = 'fn';
    return [...tk].map((ch) => [ch, c]);
  });
}
const LINES = (() => {
  let acc = 0;
  return CODE.map((ln) => { const o = { start: acc, len: ln.length, chars: classesOf(ln) }; acc += ln.length + 1; return o; });
})();
const STREAM = LINES[LINES.length - 1].start + LINES[LINES.length - 1].len;
function lineHtml(L, n) {
  let out = '', run = '', cls = null;
  const flush = () => { if (run) out += cls ? `<i class="${cls}">${esc(run)}</i>` : esc(run); run = ''; };
  for (let i = 0; i < Math.min(n, L.len); i++) {
    const [ch, c] = L.chars[i];
    if (c !== cls) { flush(); cls = c; }
    run += ch;
  }
  flush();
  return out;
}

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.w0 = T.card + WRITE_AT;
    T.w1 = T.w0 + STREAM / CPS_W;
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
    const card = x.el(`<div class="tp-card">
      <div class="tp-hd"><span class="tp-ic">${mi('file-code')}</span><b>${esc(TITLE)}</b><span class="tp-lang">${esc(LANG)}</span></div>
      <div class="tp-well">${LINES.map((L, i) => `<div class="tp-l"><u>${i + 1}</u><code><span class="tp-v"></span><i class="tp-caret"></i></code></div>`).join('')}</div>
      <div class="tp-ft">${x.OK}<span>${esc(DONE)}</span></div>
    </div>`);
    const rows = [...card.querySelectorAll('.tp-l')].map((n) => ({ v: n.querySelector('.tp-v'), c: n.querySelector('.tp-caret'), html: null }));
    const ft = card.querySelector('.tp-ft');
    let shown = -1;

    return {
      nodes: [say, card],
      focus: card,
      marks: [[T.r, say], [T.card, card], [T.done, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the script types; the caret sits on the line being written and goes when the script is done
        const n = streamCount('x'.repeat(STREAM), T.w0, CPS_W, t);
        LINES.forEach((L, i) => {
          const m = Math.max(0, Math.min(L.len, n - L.start));
          const html = lineHtml(L, m);
          if (html !== rows[i].html) { rows[i].v.innerHTML = html; rows[i].html = html; }
          const on = t >= T.w0 && n < STREAM && n >= L.start && n <= L.start + L.len;
          rows[i].c.style.opacity = on ? '1' : '0';
        });

        const f = outCubic(seg(t, T.done, T.done + DONE_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
