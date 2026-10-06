// ElevenLabs Scribe transcribes the 0:38 voice note: its waveform plays with a playhead (the user's voice-note bubble
// plays in step, chat.js reads T.play0/T.play1), the words land one by one under it in four timestamped lines, then
// Scribe pulls the three jobs out as task chips: 'Movers, Sat Oct 10', 'Change address', 'Get $2,800 deposit back'.
import { clamp, seg } from '../../../lib.js';
import { sayLine, rise, pop, waveHTML, mmss } from './kit.js';

const SAY = 'Transcribed your 0:38 voice note. Three things to do.';
const DUR = 38; // seconds of voice
// [start second, words]: the note's phrases with the pauses between them
const LINES = [
  [2, "we're moving to the new place saturday."],
  [14, 'sort the movers,'],
  [21, 'change our address'],
  [29, 'and get the deposit back'],
];
const IC = {
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
  truck: '<svg viewBox="0 0 24 24"><path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7z"/><circle cx="6.5" cy="17" r="1.8"/><circle cx="17" cy="17" r="1.8"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
  cash: '<svg viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></svg>',
};
const TASKS = [[IC.truck, 'Movers, Sat Oct 10'], [IC.mail, 'Change address'], [IC.cash, 'Get $2,800 deposit back']];
const BARS = 72;

export default {
  times(r) {
    const T = { say: r + 0.02, card: r + 0.2, play0: r + 0.4, play1: r + 3.0, tasks: r + 3.1 };
    T.chips = [0, 1, 2].map((i) => T.tasks + 0.1 + i * 0.22);
    T.end = r + 4.6;
    return T;
  },

  cues(T) {
    return [{ t: T.play0, kind: 'blip' }, ...T.chips.map((t) => ({ t, kind: 'tag' }))];
  },

  build(k, { el, esc }) {
    const T = k.T;
    const say = sayLine(el, esc, SAY);
    // each word keeps its slot from the start (transparent until heard), so the lines never reflow
    let wi = 0;
    const words = [];
    const lines = LINES.map(([at, text], li) => {
      const ws = text.split(' ');
      const next = li + 1 < LINES.length ? LINES[li + 1][0] : DUR - 2;
      const span = Math.min(next - at - 1.5, ws.length * 0.75);
      const html = ws.map((w, j) => { words.push(at + (span * j) / ws.length); return `<span class="sc-w" data-i="${wi++}">${esc(w)}${j < ws.length - 1 ? ' ' : ''}</span>`; }).join('');
      return `<div class="sc-line"><b class="sc-ts">${mmss(at)}</b><span>${html}</span></div>`;
    }).join('');
    const card = el(`<div class="mv-card sc-card">
  <div class="sc-top"><span class="sc-file">${IC.mic}voice-note.m4a</span><span class="sc-meta">0:38 · English · 1 speaker</span></div>
  <div class="sc-wave"><span class="sc-bars">${waveHTML(BARS, 'sc-b')}</span><i class="sc-head"><b class="sc-now">0:00</b></i></div>
  <div class="sc-text">${lines}</div>
  <div class="sc-tasks"><span class="sc-lab">Tasks found</span>${TASKS.map(([ic, l]) => `<span class="sc-task">${ic}${esc(l)}</span>`).join('')}</div>
</div>`.replace(/>\s+</g, '><'));
    const n = {
      bars: [...card.querySelectorAll('.sc-b')], head: card.querySelector('.sc-head'), now: card.querySelector('.sc-now'),
      words: [...card.querySelectorAll('.sc-w')], lines: [...card.querySelectorAll('.sc-line')],
      lab: card.querySelector('.sc-lab'), tasks: [...card.querySelectorAll('.sc-task')], tasksRow: card.querySelector('.sc-tasks'),
    };
    let lastLit = -1, lastNow = '';

    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(card, t, T.card, 14);
        const p = seg(t, T.play0, T.play1);
        const sec = p * DUR;
        const lit = Math.round(p * BARS);
        if (lit !== lastLit) { n.bars.forEach((b, i) => b.classList.toggle('on', i < lit)); lastLit = lit; }
        n.head.style.left = (p * 100).toFixed(3) + '%';
        n.head.style.opacity = (t >= T.play0 - 0.1 ? 1 : 0).toString();
        const now = mmss(sec);
        if (now !== lastNow) { n.now.textContent = now; lastNow = now; }
        n.words.forEach((w, i) => {
          const a = clamp((sec - words[i]) / 0.9);
          w.style.opacity = a.toFixed(3);
          w.classList.toggle('sc-cur', a > 0 && a < 1 && t < T.play1);
        });
        n.lines.forEach((l, i) => { l.firstElementChild.style.opacity = sec >= LINES[i][0] - 0.3 ? '1' : '0'; });
        n.tasksRow.style.opacity = (t >= T.tasks ? 1 : 0).toString();
        n.lab.style.opacity = seg(t, T.tasks, T.tasks + 0.2).toFixed(3);
        n.tasks.forEach((c, i) => pop(c, t, T.chips[i]));
      },
    };
  },
};
