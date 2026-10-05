// Watch beat (Gemini 3.1 Pro, the video specialist: the Gemini API takes a public YouTube URL as video input and
// answers with timestamps). One card. The player shows the video's thumbnail (img/thumb.jpg) while the playhead
// sweeps 0:00 -> 14:32; each moment the comments ask about drops a marker on the bar and a line beside the player as
// the playhead passes it. When the sweep ends the player settles on the 4:38 frame (img/frame-438.jpg) with Gemini's
// box around the scissor boom arm Lena asked about. Then the four comments worth answering rise, each with the
// moment it points to, and the footer lands. Every commenter is made up for the spot. Pure function of t.
import { esc } from '../../../lib.js';
import { spring, smooth, rise, lerp } from '../motion.js?v=9ef72117';
import { VIDEO } from './connect.js?v=9ef72117';
import { ms } from './yt-icons.js?v=9ef72117';

const LEN = 14 * 60 + 32;
// the moments Gemini found: [seconds, timecode, what is on screen]
const MOMENTS = [
  [278, '4:38', 'Scissor boom arm, shock mount'],
  [372, '6:12', 'Blind test: the $29 USB mic wins'],
  [425, '7:05', 'Untreated-room test'],
];
// the comments worth answering: [name, avatar colour, comment, likes, moment, tag]
export const TOP = [
  ['Priya Nair', '#00897b', 'Which one would you actually buy for a small untreated room?', '2.1K', '7:05', 'Asked 214 times'],
  ['Marco Ruiz', '#e8710a', 'The blind test at 6:12 got me. Picked the $29 one every single time.', '1.4K', '6:12', ''],
  ['Lena Fischer', '#1967d2', 'What’s that boom arm at 4:38? Looks so clean.', '986', '4:38', ''],
  ['Dee Okafor', '#9334e6', 'Headsets next please, half of us stream on them', '742', 'Request', ''],
];
const FOOT = '4 comments to answer, each tied to its moment';

// seconds from the reply line
const CARD = 0.1;
const SWEEP_A = 0.35, SWEEP_B = 1.85;   // the playhead's run over the whole video
const FRAME = 1.9;                     // the player settles on 4:38
const BOX = 2.15;                      // Gemini's box draws round the arm
const ROWS = 2.25, STAG = 0.16;        // the comment rows
const FOOT_AT = ROWS + STAG * 3 + 0.3;

// the playhead: eases in and out of the sweep, linear-ish through the middle
const sweep = (t, r) => smooth(t, r + SWEEP_A, r + SWEEP_B);
const tc = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default {
  times(sw, base) {
    return { end: base.reply + FOOT_AT + 0.6 };
  },

  build(k, ctx) {
    const r = k.reply;
    // when the playhead passes each moment (invert the sweep by bisection, once)
    const passAt = MOMENTS.map(([s]) => {
      let a = r + SWEEP_A, b = r + SWEEP_B;
      for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (sweep(m, r) * LEN < s) a = m; else b = m; }
      return b;
    });
    const card = ctx.el(`<div class="gw-card">
  <div class="gw-top">
    <span class="gw-player"><img class="gw-thumb" src="${ctx.img('thumb.jpg')}" alt=""/><img class="gw-frame" src="${ctx.img('frame-438.jpg')}" alt=""/>
      <svg class="gw-box" viewBox="0 0 160 90" preserveAspectRatio="none"><rect pathLength="1" x="114" y="17" width="44" height="71" rx="2"/></svg>
      <span class="gw-tag">scissor boom arm</span><i class="gw-tc">0:00 / ${VIDEO.len}</i></span>
    <div class="gw-side">
      <span class="gw-k">Watching</span>
      <b class="gw-title">${esc(VIDEO.title)}</b>
      <div class="gw-moments">${MOMENTS.map(([, c, what]) => `<span class="gw-m"><i>${c}</i>${esc(what)}</span>`).join('')}</div>
    </div>
  </div>
  <span class="gw-bar"><span class="gw-fill"></span>${MOMENTS.map(([s]) => `<i class="gw-dot" style="left:${((s / LEN) * 100).toFixed(2)}%"></i>`).join('')}<span class="gw-head"></span></span>
  <div class="gw-rows">${TOP.map(([n, col, txt, likes, m, tag]) => `<div class="gw-row"><span class="gw-av" style="background:${col}">${n[0]}</span><div class="gw-c"><span class="gw-n">${esc(n)}${tag ? `<em>${esc(tag)}</em>` : ''}</span><span class="gw-t">${esc(txt)}</span></div><span class="gw-l">${ms('thumb-up-outline', 'gw-li')}${likes}</span><span class="gw-at${m === 'Request' ? ' req' : ''}">${m}</span></div>`).join('')}</div>
  <div class="gw-foot">${ctx.OK}<span>${esc(FOOT)}</span></div>
</div>`);
    const q = (s) => card.querySelector(s), qa = (s) => [...card.querySelectorAll(s)];
    const N = { thumb: q('.gw-thumb'), frame: q('.gw-frame'), box: q('.gw-box rect'), boxSvg: q('.gw-box'), tag: q('.gw-tag'), tc: q('.gw-tc'), k: q('.gw-k'),
      fill: q('.gw-fill'), head: q('.gw-head'), dots: qa('.gw-dot'), ms: qa('.gw-m'), rows: qa('.gw-row'), foot: q('.gw-foot'), ok: q('.gw-foot .qc-ok') };
    let lastTc = '';
    return {
      nodes: [card],
      marks: [[r + CARD, q('.gw-bar')], [r + ROWS, N.rows[1]], [r + ROWS + STAG * 2, N.rows[3]], [r + FOOT_AT, N.foot]],
      render(t) {
        rise(card, t, r + CARD, 14, 0.65);
        const p = sweep(t, r);
        // the timecode: counts with the sweep, then rests on 4:38 with the frame
        const onFrame = smooth(t, r + FRAME, r + FRAME + 0.4);
        const s = t >= r + FRAME ? 278 : p * LEN;
        const label = `${tc(s)} / ${VIDEO.len}`;
        if (label !== lastTc) { N.tc.textContent = label; lastTc = label; }
        N.frame.style.opacity = onFrame.toFixed(3);
        N.thumb.style.transform = `scale(${lerp(1, 1.04, smooth(t, r + SWEEP_A, r + FRAME)).toFixed(4)})`;
        N.k.textContent = t >= r + SWEEP_B ? 'Watched' : 'Watching';
        // the playhead marker parks on 4:38 too
        const parked = spring(t, r + FRAME, 0.6);
        const at = lerp(p, 278 / LEN, parked);
        N.head.style.left = (at * 100).toFixed(3) + '%';
        N.fill.style.transform = `scaleX(${at.toFixed(4)})`;
        MOMENTS.forEach((m, i) => {
          const a = passAt[i];
          const d = spring(t, a, 0.5);
          N.dots[i].style.transform = `translate(-50%,-50%) scale(${d.toFixed(4)})`;
          rise(N.ms[i], t, a, 6, 0.5);
          N.ms[i].style.setProperty('--on', i === 0 ? smooth(t, r + FRAME, r + FRAME + 0.35).toFixed(3) : '0');
        });
        // Gemini's box: draws its outline, then the label
        const b = smooth(t, r + BOX, r + BOX + 0.5);
        N.boxSvg.style.opacity = b > 0 ? '1' : '0';
        N.box.style.strokeDashoffset = (1 - b).toFixed(4);
        rise(N.tag, t, r + BOX + 0.3, 4, 0.45);
        N.rows.forEach((row, i) => rise(row, t, r + ROWS + STAG * i, 12, 0.6));
        rise(N.foot, t, r + FOOT_AT, 8, 0.55);
        const f = smooth(t, r + FOOT_AT + 0.05, r + FOOT_AT + 0.4);
        N.ok.style.strokeDashoffset = (1 - f).toFixed(4);
      },
    };
  },
};
