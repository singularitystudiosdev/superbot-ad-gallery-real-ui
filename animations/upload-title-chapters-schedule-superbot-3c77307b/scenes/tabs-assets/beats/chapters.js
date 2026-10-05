// Chapters beat: Gemini watches the raw 16:08 file and writes its 7 chapters. Its line streams and a card rises in the
// base's research grammar: the file row (the frame under the playhead, img/frames/, swapping as the playhead crosses
// each chapter; the 16:08 chip; the name and size; "Watching the file" with the spinner resolving to the check and a
// running timecode), then YouTube's own segmented chapter bar (one segment per chapter, sized to its length) that the
// playhead fills, a marker dropping onto each chapter start as it is passed and the chapter joining the list under it
// (its number, blue timestamp, title), and the footer: "7 chapters, first at 0:00, shortest 1:12". The playhead is linear in time
// so each marker lands the moment the playhead reaches it. Pure function of t.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';
import { FILE, CHAPTERS, CHAPTER_FRAME, SHORTEST, clock } from './story.js?v=3c77307b';

const SAY = `Watched all ${FILE.len} of ${FILE.name} and marked ${CHAPTERS.length} chapters.`;
const DONE = `${CHAPTERS.length} chapters, first at 0:00, shortest ${clock(SHORTEST)}`;
const FRAMES = [...new Set(CHAPTER_FRAME)];
// timing (seconds from the reply start, or from the card where noted)
const CPS = 100;                       // the reply line streams
const SAY_AT = 0.05;                   // reply start to the line's first character
const CARD = 0.14;                     // reply start to the card rising in
const RISE = 0.3;                      // the card rising in
const PLAY_AT = 0.12;                  // the card landing to the playhead starting
const PLAY = 1.05; /* deliberate */    // the playhead running the whole file (7 chapters land in it, ~0.15 s apart)
const MARK_IN = 0.18;                  // a marker and its list row popping in
const FOOT_AT = 0.1;                   // the playhead at the end to the footer
const FOOT_IN = 0.24;
const READ = 0.3; /* deliberate */     // the finished card holds before the next pill lands

const frac = (s) => s / FILE.secs;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + RISE * 0.6 + PLAY_AT;
    T.p1 = T.p0 + PLAY;
    T.mark = CHAPTERS.map(([s]) => T.p0 + PLAY * frac(s));
    T.foot = T.p1 + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN + READ, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const segs = CHAPTERS.map(([s], i) => {
      const e = CHAPTERS[i + 1] ? CHAPTERS[i + 1][0] : FILE.secs;
      return `<i class="cp-seg" style="flex: ${e - s} 1 0"><i class="cp-sf"></i></i>`;
    }).join('');
    const marks = CHAPTERS.map(([s], i) => `<i class="cp-mk" style="left: ${(frac(s) * 100).toFixed(3)}%"><b>${i + 1}</b></i>`).join('');
    const card = x.el(`<div class="cp-card">
      <div class="cp-vid">
        <span class="cp-th">${FRAMES.map((f) => `<img data-f="${f}" src="${x.img(`frames/${f}.jpg`)}" width="1280" height="720" alt=""/>`).join('')}<i class="cp-len">${FILE.len}</i></span>
        <div class="cp-meta">
          <b class="cp-title">${x.esc(FILE.name)}</b>
          <span class="cp-sub">${x.esc(FILE.size)} &middot; 1080p &middot; ${FILE.len}</span>
          <span class="cp-hd"><span class="cp-st"><i class="cp-spin"></i>${x.OK}</span><span>Watching the file</span><span class="cp-tc">0:00 / ${FILE.len}</span></span>
        </div>
      </div>
      <div class="cp-tl"><div class="cp-mks">${marks}</div><div class="cp-bar">${segs}<i class="cp-head"></i></div></div>
      <div class="cp-list">${CHAPTERS.map(([s, l], i) => `<span class="cp-row"><i class="cp-n">${i + 1}</i><u>${clock(s)}</u><span>${x.esc(l)}</span></span>`).join('')}</div>
      <div class="cp-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const imgs = [...card.querySelectorAll('.cp-th img')];
    const fills = [...card.querySelectorAll('.cp-sf')], mks = [...card.querySelectorAll('.cp-mk')], rows = [...card.querySelectorAll('.cp-row')];
    const head = $('.cp-head'), tc = $('.cp-tc'), spin = $('.cp-spin'), ok = $('.cp-st .qc-ok'), ft = $('.cp-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, clk = '', shownF = '';

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.mark[4], rows[4]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the playhead: linear through the file, each segment filling as it is crossed
        const p = seg(t, T.p0, T.p1);
        const at = p * FILE.secs;
        head.style.left = `${(p * 100).toFixed(3)}%`;
        CHAPTERS.forEach(([s], i) => {
          const e = CHAPTERS[i + 1] ? CHAPTERS[i + 1][0] : FILE.secs;
          fills[i].style.transform = `scaleX(${Math.max(0, Math.min(1, (at - s) / (e - s))).toFixed(4)})`;
          const m = outCubic(seg(t, T.mark[i], T.mark[i] + MARK_IN));
          mks[i].style.opacity = m.toFixed(3);
          mks[i].style.transform = `translate(-50%, ${((1 - m) * -8).toFixed(2)}px)`;
          rows[i].style.opacity = m.toFixed(3);
          rows[i].style.transform = m >= 1 ? 'none' : `translateY(${((1 - m) * 6).toFixed(2)}px)`;
        });
        const c = `${clock(Math.min(FILE.secs, Math.floor(at)))} / ${FILE.len}`;
        if (c !== clk) { tc.textContent = c; clk = c; }
        // the frame under the playhead
        let ch = 0;
        CHAPTERS.forEach(([s], i) => { if (at >= s) ch = i; });
        const f = CHAPTER_FRAME[ch];
        if (f !== shownF) { imgs.forEach((im) => { im.style.opacity = im.dataset.f === f ? '1' : '0'; }); shownF = f; }

        const d = outCubic(seg(t, T.p1, T.p1 + 0.2));
        spin.style.opacity = (1 - seg(t, T.p1 - 0.08, T.p1 + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const fo = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = fo.toFixed(3);
        ft.style.transform = fo >= 1 ? 'none' : `translateY(${((1 - fo) * 6).toFixed(2)}px)`;
      },
    };
  },
};
