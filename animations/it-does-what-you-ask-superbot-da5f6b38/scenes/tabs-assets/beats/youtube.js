// YouTube beat: superbot opens The Social Network's official trailer and pulls five clips. The playhead scrubs along
// the bar; at each clip the player cuts to that frame, a clip marker drops on the bar and the frame lands in the
// strip below with its timestamp. Frames: img/tsn-*.jpg, stills of the official trailer (see img/CREDITS.txt).
import { lerp, seg, outCubic, outBack, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Pulling clips from The Social Network.';
const DUR = 151; // the trailer's length in seconds
// in scrub order (`at` = seconds into the trailer the still was taken at)
const CLIPS = [
  { at: 56, img: 'tsn-1.jpg' },
  { at: 81, img: 'tsn-5.jpg' },
  { at: 94, img: 'tsn-4.jpg' },
  { at: 106, img: 'tsn-2.jpg' },
  { at: 131, img: 'tsn-3.jpg' },
];
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7Z"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.card = r + 0.45;
    T.hit = CLIPS.map((_, i) => T.card + 0.6 + i * 0.42);
    T.chipDone = T.hit[CLIPS.length - 1] + 0.35;
    T.end = T.chipDone + 0.8;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Clipping scenes</span><span class="yt-count">0/5</span></div></div>');
    const card = x.el(`<div class="yt-card">
      <div class="yt-player">${CLIPS.map((c) => `<img src="${x.img(c.img)}" alt=""/>`).join('')}
        <span class="yt-play">${PLAY}</span>
        <div class="yt-bar"><i class="yt-prog"></i>${CLIPS.map((c) => `<i class="yt-mark" style="left:${((c.at / DUR) * 100).toFixed(2)}%"></i>`).join('')}<i class="yt-dot"></i></div>
        <span class="yt-time">0:00</span>
      </div>
      <div class="yt-meta"><img src="${x.brand('youtube-icon.svg')}" alt=""/><span><b>THE SOCIAL NETWORK - Official Trailer [2010] (HD)</b><small>Sony Pictures Entertainment</small></span></div>
      <div class="yt-clips">${CLIPS.map((c) => `<span class="yt-clip"><img src="${x.img(c.img)}" alt=""/><em>${mmss(c.at)}</em></span>`).join('')}</div>
    </div>`);
    const $$ = (s) => [...card.querySelectorAll(s)];
    const frames = $$('.yt-player > img'), marksEl = $$('.yt-mark'), clips = $$('.yt-clip');
    const prog = card.querySelector('.yt-prog'), dot = card.querySelector('.yt-dot'), time = card.querySelector('.yt-time'), play = card.querySelector('.yt-play');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chip = row.firstElementChild, sp = chip.querySelector('.spin'), lab = chip.querySelector('.ch-tool-t'), cnt = chip.querySelector('.yt-count');
    let shown = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // playhead (seconds into the trailer): eases from 0 to each clip in turn, holding a beat on each
    const head = (t) => {
      let s = 0;
      CLIPS.forEach((c, i) => { s = lerp(s, c.at, inOutCubic(seg(t, T.hit[i] - 0.34, T.hit[i] - 0.04))); });
      return s;
    };
    return {
      nodes: [say, row, card],
      marks: [[T.r, say], [T.chip, row], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        rise(row, seg(t, T.chip, T.chip + 0.35), 8);
        const done = t >= T.chipDone;
        sp.classList.toggle('done', done);
        sp.style.transform = done ? '' : `rotate(${(((t - T.chip) * 450) % 360).toFixed(1)}deg)`;
        const l = done ? 'Clipped 5 scenes' : 'Clipping scenes';
        if (lab.textContent !== l) lab.textContent = l;
        const got = T.hit.filter((h) => t >= h).length;
        if (cnt.textContent !== `${got}/5`) cnt.textContent = `${got}/5`;
        rise(card, seg(t, T.card, T.card + 0.5), 16);

        const s = head(t), pct = ((s / DUR) * 100).toFixed(2) + '%';
        prog.style.width = pct;
        dot.style.left = pct;
        const ts = mmss(s);
        if (time.textContent !== ts) time.textContent = ts;
        play.style.opacity = (1 - seg(t, T.card + 0.3, T.card + 0.55)).toFixed(3);
        // the player shows the last clip reached (the first frame until then)
        const cur = Math.max(0, got - 1);
        frames.forEach((f, i) => { f.style.opacity = i === cur ? '1' : '0'; });
        CLIPS.forEach((_, i) => {
          const h = T.hit[i];
          const m = outBack(seg(t, h, h + 0.3));
          marksEl[i].style.opacity = seg(t, h, h + 0.1).toFixed(3);
          marksEl[i].style.transform = `translateX(-50%) scaleY(${lerp(0.2, 1, m).toFixed(3)})`;
          const c = seg(t, h + 0.02, h + 0.4), e = outBack(c);
          clips[i].style.opacity = outCubic(c).toFixed(3);
          clips[i].style.transform = c >= 1 ? '' : `translateY(${((1 - e) * -26).toFixed(2)}px) scale(${lerp(0.7, 1, e).toFixed(4)})`;
        });
        const flash = seg(t, T.hit[cur], T.hit[cur] + 0.25);
        frames[cur].style.filter = got && flash < 1 ? `brightness(${lerp(1.8, 1, outCubic(flash)).toFixed(3)})` : '';
      },
    };
  },
};
