// Scribe beat: ElevenLabs Scribe transcribes Jonah's last ten uploads into timed .srt files. Its line streams and a
// card rises in the base's research grammar: the header ("Transcribing 10 videos", 2h 41m, the scribe_v2 model id,
// spinner resolving to the check), the counter ("N of 10, W words", counting with the files), a strip of the ten
// thumbnails that resolve one by one (a progress bar on the one in flight, a check once its .srt is written), a
// scrolling SRT snippet (cue time + caption) where the boss names land spelled the way Jonah spells them, the
// Keyterms row (Scribe v2's keyterm prompting) and the footer "10 timed .srt files, English". The camera pushes in on
// the card while it plays (T.focus, scenes/tabs.js). Every number comes from videos.js. Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { VIDEOS, TOTAL_LEN, TOTAL_WORDS, KEYTERMS, fmt } from './videos.js?v=1ee7c75e';

const SAY = 'Transcribing your last 10 uploads.';
const DONE = '10 timed .srt files, English';
// SRT cues from the first two files: [cue start, caption]. Every cue sits inside its video's length (videos.js).
const LINES = [
  ['00:03:11,420', 'Varrak the Hollow opens with the double sweep.'],
  ['00:14:02,180', 'Phase two. Still no hits. Do not get greedy.'],
  ['00:21:20,050', 'Varrak the Hollow is down. No hits!'],
  ['00:02:47,610', 'Ser Odile parries everything. Everything.'],
  ['00:16:09,300', 'Attempt 41. Okay, Ser Odile, one more.'],
  ['00:00:12,900', 'Day 100 on the raft. Two cups of water left.'],
];
const SCROLL = 2;                       // lines the snippet scrolls by while the files run
// timing (seconds from the reply start, or from the card where noted)
const CPS = 150;                        // the reply line streams
const SAY_AT = 0.03;
const CARD = 0.06;                      // reply start to the card rising in
const RISE = 0.22;
const F0 = 0.07;                        // the card landing to the first file starting
const STEP = 0.06; /* deliberate */     // one file finishing to the next (ten in 0.6 s)
const FOOT_AT = 0.04;                   // the last file to the footer
const FOOT_IN = 0.14;
const POP = 0.14;                       // a thumbnail's check popping in

const kt = (s) => KEYTERMS.reduce((h, k) => h.split(k).join(`<mark>${k}</mark>`), s);

export default {
  times(r, opts) {
    const T = { r };
    T.card = r + CARD;
    T.f0 = T.card + F0;
    T.done = VIDEOS.map((_, i) => T.f0 + (i + 1) * STEP); // file i's .srt is written
    T.last = T.done[VIDEOS.length - 1];
    T.foot = T.last + FOOT_AT;
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    // the camera pushes in on the card while the files run and pulls back as the next pill lands
    if (opts && opts.zoom) T.focus = { sw: T.card, landed: T.card + 0.3, pull: T.end + 0.02, back: T.end + 0.3 };
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { scribe: { card: T.card, done: T.done, foot: T.foot } });
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="sc-card">
      <div class="sc-hd"><span class="sc-st"><i class="sc-spin"></i>${x.OK}</span><b>Transcribing 10 videos</b><span class="sc-dur">${TOTAL_LEN}</span><span class="sc-model">scribe_v2</span></div>
      <div class="sc-count"><b class="sc-n">0</b> of 10, <b class="sc-w">0</b> words</div>
      <div class="sc-strip">${VIDEOS.map((v) => `<span class="sc-th"><img src="${x.img(v.thumb)}" width="640" height="360" alt=""/><i class="sc-len">${v.len}</i><i class="sc-pr"><i></i></i><i class="sc-ck">${x.OK}</i></span>`).join('')}</div>
      <div class="sc-tx"><div class="sc-tx-in">${LINES.map(([tc, s]) => `<div class="sc-ln"><i class="sc-tc">${tc}</i><span>${kt(x.esc(s))}</span></div>`).join('')}</div></div>
      <div class="sc-kt"><span class="sc-ktl">Keyterms</span>${KEYTERMS.map((s) => `<span class="sc-chip">${x.esc(s)}</span>`).join('')}</div>
      <div class="sc-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.sc-spin'), ok: $('.sc-st .qc-ok') };
    const n = $('.sc-n'), w = $('.sc-w'), txIn = $('.sc-tx-in'), ft = $('.sc-ft');
    const ths = [...card.querySelectorAll('.sc-th')].map((th) => ({ th, pr: th.querySelector('.sc-pr'), bar: th.querySelector('.sc-pr i'), ck: th.querySelector('.sc-ck') }));
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, nTxt = '', wTxt = '', lh = 0;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      focus: card,
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the files: one in flight at a time, its bar filling; the counter adds its words as they are written
        let words = 0, count = 0;
        ths.forEach((h, i) => {
          const a = i === 0 ? T.f0 : T.done[i - 1], b = T.done[i];
          const p = seg(t, a, b);
          if (t >= b) { count++; words += VIDEOS[i].words; } else if (t > a) words += VIDEOS[i].words * p;
          h.th.classList.toggle('on', t >= a);
          h.pr.style.opacity = t > a && t < b + 0.06 ? '1' : '0';
          h.bar.style.transform = `scaleX(${p.toFixed(4)})`;
          const c = outCubic(seg(t, b, b + POP));
          h.ck.style.opacity = c.toFixed(3);
          h.ck.style.transform = `scale(${lerp(0.4, 1, c).toFixed(4)})`;
        });
        if (t >= T.last) words = TOTAL_WORDS;
        const nt = String(count), wt = fmt(Math.round(words));
        if (nt !== nTxt) { n.textContent = nt; nTxt = nt; }
        if (wt !== wTxt) { w.textContent = wt; wTxt = wt; }

        const d = outCubic(seg(t, T.last, T.last + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.last - 0.08, T.last + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        // the snippet scrolls through the first two files' cues
        lh = lh || (txIn.firstElementChild ? txIn.firstElementChild.offsetHeight : 0);
        const sc = inOutCubic(seg(t, T.f0 + 0.1, T.last));
        txIn.style.transform = `translateY(${(-sc * SCROLL * lh).toFixed(2)}px)`;

        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
