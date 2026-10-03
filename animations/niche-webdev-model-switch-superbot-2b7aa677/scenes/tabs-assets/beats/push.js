// Push beat: superbot commits the site and pushes it to the user's GitHub. Its line streams, a card rises (the plan
// card's frame: a status spinner, a label, the repo), the git command types itself into a mono terminal and git's
// push output lands under it line by line; beside it (under it on a narrow column, 4:5) the repo card fills in:
// "maple-street-bakery" (Private), the last commit ("Bakery landing page", a1c9f2e, main, just now), then the
// files row by row (app/page.tsx, app/layout.tsx, app/globals.css, public/bakes/ with its 5 photos, package.json).
// Then the run's chip lands: "Pushed 1 commit to main". The data remake's query.js grammar.
// Pure function of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame. The command is laid
// out whole from the start (each character a span, revealed in order), so nothing reflows while it types.
import { lerp, seg, outCubic } from '../../../lib.js';

const SAY = 'Committed it and pushed it to a new private repo on your GitHub.';
const LABEL = 'Pushing to GitHub';
const REPO = 'maple-street-bakery';
// the command, as typed (one chained command, broken with the shell's line continuations)
const CMD = [
  '$ git add . && \\',
  '  git commit -m "Bakery landing page" && \\',
  '  git push -u origin main',
];
// what git printed
const OUT = [
  '[main a1c9f2e] Bakery landing page',
  ' 14 files changed, 412 insertions(+)',
  'To github.com:sam/maple-street-bakery.git',
  ' * [new branch]      main -> main',
];
// the repo's root after the push: icon (dir/file), path, what is in it
const FILES = [
  ['file', 'app/page.tsx', 'Bakery landing page'],
  ['file', 'app/layout.tsx', 'Bakery landing page'],
  ['file', 'app/globals.css', 'Bakery landing page'],
  ['dir', 'public/bakes/', '5 photos'],
  ['file', 'package.json', 'Bakery landing page'],
];
// the last commit, as GitHub's commit bar shows it: the message, then hash, branch and age under it
const COMMIT = ['Bakery landing page', 'a1c9f2e  ·  main  ·  just now'];
const CHIP = 'Pushed 1 commit to main';
// timing (seconds from the reply start, or from the card where noted), in the plan beat's pace
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const TYPE_AT = 0.2;                   // the card landing to the command's first character
const TYPE_CPS = 200;                  // the command types this fast (a sped-up replay)
const RUN = 0.1;                       // the last character to git's first line
const OUT_STAGGER = 0.07;              // one output line to the next
const OUT_IN = 0.14;                   // an output line landing
const REPO_AT = 0.05;                  // the push lands (git's last line), then the repo card's commit row
const ROW_STAGGER = 0.06;              // one repo row to the next
const ROW_IN = 0.18;                   // a repo row landing
const CHIP_AT = 0.1;                   // the last row in, then the chip
const CHIP_IN = 0.24;                  // the chip rising in

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ico = (d) => `<svg class="gp-ico" viewBox="0 0 16 16" aria-hidden="true">${d}</svg>`;
// GitHub's octicons, file-directory-fill and file (MIT), the two glyphs of a repo listing
const DIR = ico('<path class="gp-fill" d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/>');
const FILE = ico('<path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25V6h-2.75A1.75 1.75 0 0 1 9 4.25V1.5Zm6.75.062V4.25c0 .138.112.25.25.25h2.688l-.011-.013-2.914-2.914-.013-.011Z" class="gp-fill"/>');
const LOCK = ico('<path class="gp-fill" d="M4 4a4 4 0 0 1 8 0v2h.25c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 12.25 15h-8.5A1.75 1.75 0 0 1 2 13.25v-5.5C2 6.784 2.784 6 3.75 6H4Zm8.25 3.5h-8.5a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25ZM10.5 6V4a2.5 2.5 0 1 0-5 0v2Z"/>');
const COMMIT_I = ico('<path class="gp-fill" d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"/>');

// the command as one span per character, the string in its colour
function cmdHTML() {
  return CMD.map((ln) => {
    const toks = ln.match(/"[^"]*"|\$|&&|\\|[^\s"]+|\s+/g) || [];
    return `<div class="gp-ln">${toks.map((tk) => {
      const cls = tk[0] === '"' ? 'gp-str' : tk === '$' ? 'gp-ps' : tk === '&&' || tk === '\\' ? 'gp-op' : /^(git)$/.test(tk) ? 'gp-git' : '';
      return [...tk].map((ch) => `<span class="gp-c ${cls}">${esc(ch)}</span>`).join('');
    }).join('')}</div>`;
  }).join('');
}
const NCH = CMD.reduce((a, l) => a + l.length, 0);

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.type = T.card + TYPE_AT;
    T.typed = T.type + NCH / TYPE_CPS;
    T.out = OUT.map((_, i) => T.typed + RUN + i * OUT_STAGGER);
    T.pushed = T.out[T.out.length - 1] + OUT_IN;        // git's last line is in: the push has landed
    T.rows = [COMMIT, ...FILES].map((_, i) => T.pushed + REPO_AT + i * ROW_STAGGER);
    T.done = T.rows[T.rows.length - 1] + ROW_IN;        // the repo is filled in: the spinner resolves to the check
    T.chip = T.done + CHIP_AT;
    T.end = Math.max(T.chip + CHIP_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="gp-card">
      <div class="gp-hd"><span class="gp-st"><i class="gp-spin"></i>${x.OK}</span><b>${x.esc(LABEL)}</b><span class="gp-meta">${x.esc(REPO)}</span></div>
      <div class="gp-bd">
        <div class="gp-l">
          <div class="gp-term">${cmdHTML()}<i class="gp-caret"></i><div class="gp-out">${OUT.map((l) => `<div class="gp-ol">${esc(l)}</div>`).join('')}</div></div>
          <div class="gp-chips"><span class="gp-chip">${x.esc(CHIP)}</span></div>
        </div>
        <div class="gp-repo">
          <div class="gp-rh">${LOCK}<b>${esc(REPO)}</b><span class="gp-priv">Private</span></div>
          <div class="gp-row gp-cm">${COMMIT_I}<span><b>${esc(COMMIT[0])}</b><small>${esc(COMMIT[1])}</small></span></div>
          ${FILES.map(([kind, path, note]) => `<div class="gp-row${kind === 'dir' ? ' gp-dir' : ''}">${kind === 'dir' ? DIR : FILE}<b>${esc(path)}</b><span>${esc(note)}</span></div>`).join('')}
        </div>
      </div>
    </div>`);
    const chars = [...card.querySelectorAll('.gp-c')];
    const caret = card.querySelector('.gp-caret');
    const outs = [...card.querySelectorAll('.gp-ol')];
    const rows = [...card.querySelectorAll('.gp-row')];
    const chip = card.querySelector('.gp-chip');
    const spin = card.querySelector('.gp-spin'), ok = card.querySelector('.gp-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1, typed = 0;
    // narrow column (4:5): the repo stacks under the terminal (a width class, as write.js does, in place of a container)
    const sizeCls = (w) => { if (w > 0) card.classList.toggle('gp-narrow', w < 560); };
    if (typeof ResizeObserver === 'function') new ResizeObserver((es) => sizeCls(es[es.length - 1].contentRect.width)).observe(card);

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = Math.max(0, Math.min(SAY.length, Math.floor((t - T.r - SAY_AT) * CPS + 1e-6)));
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the command types in: characters [0, n) shown, the caret after the last one until git answers
        const n = Math.max(0, Math.min(NCH, Math.floor((t - T.type) * TYPE_CPS + 1e-6)));
        if (n !== typed) {
          for (let i = Math.min(n, typed); i < Math.max(n, typed); i++) chars[i].classList.toggle('on', i < n);
          typed = n;
        }
        const at = n > 0 ? chars[n - 1] : null;
        const live = t >= T.type - 0.1 && t < T.out[0];
        caret.style.opacity = live ? '1' : '0';
        if (live) {
          // in the terminal's own px (the terminal is the characters' offsetParent)
          const x0 = at ? at.offsetLeft + at.offsetWidth : chars[0].offsetLeft, y0 = at ? at.offsetTop : chars[0].offsetTop;
          caret.style.transform = `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`;
        }

        // git's output, line by line
        outs.forEach((o, i) => {
          const q = outCubic(seg(t, T.out[i], T.out[i] + OUT_IN));
          o.style.opacity = q.toFixed(3);
          o.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 4).toFixed(2)}px)`;
        });

        // the repo fills in: the commit row, then the files
        rows.forEach((o, i) => {
          const q = outCubic(seg(t, T.rows[i], T.rows[i] + ROW_IN));
          o.style.opacity = q.toFixed(3);
          o.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 6).toFixed(2)}px)`;
        });

        // done: the spinner resolves to the check as the last file lands
        const d = outCubic(seg(t, T.done, T.done + 0.2));
        spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const q = outCubic(seg(t, T.chip, T.chip + CHIP_IN));
        chip.style.opacity = q.toFixed(3);
        chip.style.transform = q >= 1 ? 'none' : `translateY(${((1 - q) * 8).toFixed(2)}px) scale(${lerp(0.9, 1, q).toFixed(4)})`;
      },
    };
  },
};
