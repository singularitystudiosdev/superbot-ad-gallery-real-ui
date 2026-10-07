// Gemini beat: the one model here that takes a YouTube video as input (Gemini API video understanding: a YouTube URL in,
// sampled at 1 frame per second, answers with MM:SS timestamps; ai.google.dev/gemini-api/docs/video-understanding,
// fetched 2026-10-06) and holds all 1,284 comments in the same context. So ONE card, three moves, top to bottom:
//   1. watch    the playhead runs the 14:32 track; each moment Gemini notes drops its frame into the strip below
//   2. rank     the four comments that matter, each tagged with the moment it is about (or why it ranks)
//   3. find     Lena asks about the boom arm at 4:38: that frame opens under her comment and Gemini's detection box
//               (box_2d, [ymin, xmin, ymax, xmax] on 0-1000) draws around the arm
// Pure function of t.
import { lerp, seg, clamp, outQuart, inOutQuart, inOutSine, rise } from '../../../lib.js';
import { ms } from './yt-icons.js?v=88a89e94';
import { VIDEO, MOMENTS, COMMENTS, TOTAL, BOX, ts } from './data.js?v=88a89e94';

const CARD_AT = 0.05, CARD_IN = 0.5;
const PLAY_AT = 0.5;      // reply start to the playhead leaving 0:00
const PLAY = 1.6;         // the whole 14:32, eased at both ends
const FRAME_IN = 0.4;     // a noted frame rising into the strip
const RANK_AT = 0.3;      // the playhead home to the ranking's header
const COUNT = 0.8;        // 0 -> 1,284 comments read
const ROW_AT = 0.2, ROW_STEP = 0.16, ROW_IN = 0.42;
const FIND_AT = 0.3;      // the last row landed to Lena's 4:38 chip lighting up
const OPEN = 0.6;         // the frame opening under her comment (inOutQuart)
const BOX_AT = 0.1, BOX_IN = 0.5;
const READ = 0.8;         // the box drawn to the beat's end: the find reads

const LENA = COMMENTS.findIndex((c) => c.first === 'Lena');
// when the eased playhead crosses fraction f of the track (inverse of inOutSine)
const crossAt = (start, f) => start + PLAY * (Math.acos(1 - 2 * f) / Math.PI);

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.play = r + PLAY_AT;
    T.home = T.play + PLAY;
    T.frames = MOMENTS.map(([s]) => crossAt(T.play, s / VIDEO.secs));
    T.rank = T.home + RANK_AT;
    T.rows = COMMENTS.map((_, i) => T.rank + ROW_AT + i * ROW_STEP);
    T.find = T.rows[T.rows.length - 1] + ROW_IN + FIND_AT;
    T.open = T.find + 0.12;
    T.box = T.open + OPEN + BOX_AT;
    T.end = T.box + BOX_IN + READ;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const momentAt = (s) => MOMENTS.find((m) => m[0] === s);
    const chip = (c) => [
      c.tag ? `<span class="gm-tag">${x.esc(c.tag)}</span>` : '',
      c.at ? `<span class="gm-ts">${ms('play-arrow')}${ts(c.at)}</span>` : '',
    ].join('');
    const [ymin, xmin, ymax, xmax] = BOX.box;
    const card = x.el(`<div class="gm-card">
      <div class="gm-vid">
        <span class="gm-thumb"><img src="${x.img(VIDEO.thumb)}" alt=""/><i>${VIDEO.len}</i></span>
        <span class="gm-vmeta"><b>${x.esc(VIDEO.title)}</b><small>Sam Rivera · ${x.esc(VIDEO.meta)}</small>
          <span class="gm-stat"><img src="${x.brand('gemini-logo.svg')}" alt=""/><span class="gm-statl">Watching</span><span class="gm-clock">0:00 / ${VIDEO.len}</span></span></span>
      </div>
      <div class="gm-track"><i class="gm-rail"></i><i class="gm-played"></i>${MOMENTS.map(([s]) => `<i class="gm-mk" style="left:${((s / VIDEO.secs) * 100).toFixed(2)}%"></i>`).join('')}<i class="gm-head"></i></div>
      <div class="gm-strip">${MOMENTS.map(([s, label, f]) => `<span class="gm-fr"><img src="${x.img(f)}" alt=""/><small><b>${ts(s)}</b> ${x.esc(label)}</small></span>`).join('')}</div>
      <div class="gm-rank"><span>Top comments</span><small><b class="gm-n">0</b> of ${TOTAL.toLocaleString('en-US')} read</small></div>
      <div class="gm-list">${COMMENTS.map((c, i) => `<div class="gm-row${i === LENA ? ' gm-lena' : ''}">
        <img class="gm-av" src="${x.img(c.av)}" alt=""/>
        <span class="gm-ct"><b>${x.esc(c.name)}</b><span>${x.esc(c.text)}</span></span>
        <span class="gm-chips">${chip(c)}</span>
      </div>${i === LENA ? `<div class="gm-find"><div class="gm-clip"><div class="gm-findin"><span class="gm-shot"><img src="${x.img(momentAt(c.at)[2])}" alt=""/>
          <i class="gm-box" style="top:${ymin / 10}%;left:${xmin / 10}%;height:${(ymax - ymin) / 10}%;width:${(xmax - xmin) / 10}%"><em>${x.esc(BOX.label)}</em></i></span></div></div></div>` : ''}`).join('')}</div>
    </div>`);
    const q = (s) => card.querySelector(s);
    const qa = (s) => [...card.querySelectorAll(s)];
    const vid = q('.gm-vid'), track = q('.gm-track'), played = q('.gm-played'), head = q('.gm-head');
    const clock = q('.gm-clock'), statl = q('.gm-statl'), stat = q('.gm-stat');
    const mks = qa('.gm-mk'), frs = qa('.gm-fr');
    const rank = q('.gm-rank'), n = q('.gm-n');
    const rows = qa('.gm-row');
    const find = q('.gm-find'), findin = q('.gm-findin'), box = q('.gm-box'), boxLabel = box.firstElementChild;
    const lenaTs = rows[LENA].querySelector('.gm-ts');
    let lastClock = '', lastN = '', rowsW = '';

    return {
      nodes: [card],
      marks: [[T.card, vid], [T.card + 0.2, q('.gm-strip')], [T.rank, rank], ...T.rows.map((a, i) => [a, rows[i]]), [T.open, rows[rows.length - 1]]],
      render(t) {
        rise(card, outQuart(seg(t, T.card, T.card + CARD_IN)), 14);
        // 1. watch
        const p = inOutSine(seg(t, T.play, T.home));
        played.style.transform = `scaleX(${p.toFixed(4)})`;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        head.style.opacity = (1 - seg(t, T.home + 0.1, T.home + 0.4)).toFixed(3);
        const sec = Math.round(p * VIDEO.secs);
        const done = t >= T.home;
        const c = done ? `${VIDEO.len}` : `${ts(sec)} / ${VIDEO.len}`;
        if (c !== lastClock) { clock.textContent = c; statl.textContent = done ? 'Watched' : 'Watching'; lastClock = c; }
        stat.classList.toggle('gm-done', done);
        T.frames.forEach((a, i) => {
          mks[i].classList.toggle('gm-on', t >= a);
          rise(frs[i], outQuart(seg(t, a, a + FRAME_IN)), 10, 0.96);
        });
        // 2. rank
        rise(rank, outQuart(seg(t, T.rank, T.rank + 0.4)), 8);
        const nn = Math.round(TOTAL * outQuart(seg(t, T.rank, T.rank + COUNT))).toLocaleString('en-US');
        if (nn !== lastN) { n.textContent = nn; lastN = nn; }
        T.rows.forEach((a, i) => rise(rows[i], outQuart(seg(t, a, a + ROW_IN)), 10));
        // 3. find: Lena's chip lights, her frame opens beneath, the detection box draws from its centre out
        lenaTs.classList.toggle('gm-hot', t >= T.find);
        rows[LENA].classList.toggle('gm-sel', t >= T.find);
        const f = inOutQuart(seg(t, T.open, T.open + OPEN));
        // a one-row grid opened from 0fr to 1fr: exact fractional heights all the way, no snap to auto at the end
        const want = `${f.toFixed(4)}fr`;
        if (want !== rowsW) { find.style.gridTemplateRows = want; rowsW = want; }
        findin.style.opacity = clamp(f * 1.6).toFixed(3);
        findin.style.transform = f >= 1 ? 'none' : `translateY(${lerp(-8, 0, f).toFixed(2)}px)`;
        const b = outQuart(seg(t, T.box, T.box + BOX_IN));
        box.style.opacity = clamp(b * 2).toFixed(3);
        box.style.clipPath = b >= 1 ? 'none' : `inset(${(50 * (1 - b)).toFixed(2)}% ${(50 * (1 - b)).toFixed(2)}% round 6px)`;
        boxLabel.style.opacity = seg(t, T.box + 0.25, T.box + 0.5).toFixed(3);
      },
    };
  },
};
