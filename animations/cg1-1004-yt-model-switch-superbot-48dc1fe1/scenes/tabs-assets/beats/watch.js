// Gemini 3.1 Pro's beat: the video specialist. Gemini takes the YouTube video itself as input (no transcript in
// between) and holds all 1,284 comments in one window, so it is the one model in superbot's picker that can rank
// comments against what the video actually shows. The nest reads, top to bottom:
//   steps   "Watching the video" (the playhead crosses 14:32) -> "Watched all 14:32 of the video"
//           "Reading 0 comments" (counts up) -> "Read all 1,284 comments, ranked by likes and repeats"
//   details the video row (its real thumbnail, title, playhead); once watched it folds away as the top five rows rise
//           one by one, so the card holds one thing at a time; two rows carry the reason they matter to the next
//           hand-offs ("Asked 214 times", "Needs the 4:38 frame").
// The clock fills exactly the original beat (reply + 1.984 s), so the pacing of the spot is unchanged.
import { seg, outCubic, inOutCubic, esc } from '../../../lib.js';
import { stepHtml, mountStep, renderStep, rise } from '../thread-ui.js?v=48dc1fe1';

export const VIDEO = { title: 'I tested 12 budget mics under $100', len: '14:32', secs: 872 };
export const TOTAL = 1284;
// the top five, in Gemini's rank order; av: a photo avatar in img/, else YouTube's letter avatar in that colour
export const TOP = [
  { name: 'Priya Nair', handle: '@priyanair', av: 'av-priya.jpg', likes: '2.1K', text: 'Which one would you actually buy for a small untreated room?', tag: 'Asked 214 times' },
  { name: 'Marco Ruiz', handle: '@marcoruiz', color: '#5e35b1', likes: '1.4K', text: 'The blind test at 6:12 got me. Picked the $29 one every single time.' },
  { name: 'Lena Fischer', handle: '@lenafischer', av: 'av-lena.jpg', likes: '986', text: "What's that boom arm at 4:38? Looks so clean on the desk.", tag: 'Needs the 4:38 frame' },
  { name: 'Dee Okafor', handle: '@deeokafor', color: '#00897b', likes: '742', text: 'Headsets next please, half of us stream on them' },
  { name: 'Tom Hale', handle: '@tomhale', av: 'av-tom.jpg', likes: '515', text: "Didn't expect the USB one to beat the XLR ones. Great video." },
];

export function times(r) {
  const T = {};
  T.s1 = r + 0.14;            // "Watching the video" and the card rise with it
  T.play = r + 0.264;         // the playhead starts
  T.played = r + 0.864;       // ...and reaches 14:32: step one checks
  T.s2 = r + 0.904;           // "Reading comments"
  T.count = r + 0.944;        // the counter runs
  T.counted = r + 1.544;      // ...to 1,284: step two checks
  T.fold = r + 0.92;          // the watched video row folds away...
  T.row = (i) => r + 1.0 + i * 0.1; // ...as the ranked rows rise, one every 0.1 s
  T.end = r + 1.984;          // the last row has settled
  return T;
}

const LIKE = '<svg viewBox="0 0 24 24"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/></svg>';
export const avatar = (c, img, cls = 'wv-av') => (c.av ? `<span class="${cls}"><img src="${img(c.av)}" alt=""/></span>` : `<span class="${cls}" style="background:${c.color}">${c.name[0]}</span>`);

export function build(k, x) {
  const { T } = k;
  const steps = x.el(`<ol class="sb-steps">${stepHtml('Watching the video')}${stepHtml('Reading 0 comments')}</ol>`);
  const [li1, li2] = steps.children;
  const s1 = mountStep(li1, ['Watching the video', `Watched all ${VIDEO.len} of the video`]);
  const s2 = mountStep(li2, ['Reading 0 comments', `Read all ${TOTAL.toLocaleString('en-US')} comments, ranked by likes and repeats`]);
  const card = x.el(`<div class="sb-det wv-card">
    <div class="wv-vid"><span class="wv-th"><img src="${x.img('thumb.jpg')}" alt=""/><i class="wv-len">${VIDEO.len}</i></span>
      <span class="wv-meta"><b class="wv-title">${esc(VIDEO.title)}</b><span class="wv-chan">Sam Rivera · 48K views · 2 days ago</span>
      <span class="wv-bar"><i class="wv-fill"></i><i class="wv-head"></i></span><span class="wv-tc">0:00 / ${VIDEO.len}</span></span></div>
    <ol class="wv-rows">${TOP.map((c, i) => `<li class="wv-row"><i class="wv-rk">${i + 1}</i>${avatar(c, x.img)}<span class="wv-tx"><b>${esc(c.name)}</b><span>${esc(c.text)}</span></span>${c.tag ? `<em class="wv-tag">${esc(c.tag)}</em>` : ''}<span class="wv-lk">${LIKE}${c.likes}</span></li>`).join('')}</ol>
  </div>`);
  const vid = card.querySelector('.wv-vid'), list = card.querySelector('.wv-rows');
  const fill = card.querySelector('.wv-fill'), headDot = card.querySelector('.wv-head'), tc = card.querySelector('.wv-tc');
  let vidH = 0;
  const rows = [...card.querySelectorAll('.wv-row')];
  let lastTc = null;
  const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  return {
    nodes: [steps, card],
    marks: [[T.s1, card.querySelector('.wv-vid')], ...rows.map((row, i) => [T.row(i), row])],
    render(t) {
      renderStep(s1, t, T.s1, T.played);
      renderStep(s2, t, T.s2, T.counted);
      // the running label counts while Gemini reads
      if (t >= T.s2 && t < T.counted) {
        const n = Math.round(TOTAL * inOutCubic(seg(t, T.count, T.counted)));
        s2.label.textContent = `Reading ${n.toLocaleString('en-US')} comments`;
        s2.shown = null;
      }
      rise(card, t, T.s1, 8);
      const p = inOutCubic(seg(t, T.play, T.played));
      fill.style.transform = `scaleX(${p.toFixed(4)})`;
      headDot.style.left = `${(p * 100).toFixed(2)}%`;
      const s = `${clock(p * VIDEO.secs)} / ${VIDEO.len}`;
      if (s !== lastTc) { tc.textContent = s; lastTc = s; }
      // the fold: the video row's height and the rule under it ease out together
      if (!vidH) vidH = vid.offsetHeight;
      const f = inOutCubic(seg(t, T.fold, T.fold + 0.4));
      vid.style.height = f > 0 ? `${(vidH * (1 - f)).toFixed(2)}px` : '';
      vid.style.opacity = (1 - outCubic(seg(t, T.fold, T.fold + 0.25))).toFixed(3);
      list.style.setProperty('--fold', f.toFixed(3));
      rows.forEach((row, i) => rise(row, t, T.row(i), 8));
    },
  };
}

export default { times, build };
