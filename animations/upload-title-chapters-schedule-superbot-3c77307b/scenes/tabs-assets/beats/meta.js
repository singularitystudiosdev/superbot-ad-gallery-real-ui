// Metadata beat: Claude Opus 5.5 writes the title, the description and the tags in Sam's voice, in the base's code-panel
// grammar (the source's replies panel: header with the project and an honest clock, "Working 1s" then a check and
// "Worked for 2s"; the review bar that names what is being written and lands on the green check with Review / Use all).
// The body is three fields, each with Studio's own counter: the title typed behind a caret (0/100 climbing to 49/100),
// the description (Sam's opening line, the 7 chapters with blue timestamps, "Everything I bought (9 links, $89 total)"
// and the nine gear links, the sign-off; its counter climbing to the full description's length) and the 15 tag chips
// (counter to 224/500, Studio's comma-joined count). In the zoom cut the camera pushes in on the panel while it writes
// (chat.js FOCUS). Pure function of t.
import { seg, outCubic, streamCount } from '../../../lib.js';
import { ms } from './yt-icons.js?v=3c77307b';
import { FILE, CHAPTERS, TITLE, GEAR, DESC, DESC_P1, DESC_GEAR, DESC_P3, TAGS, TAG_CHARS, CHANNEL, clock, fmt } from './story.js?v=3c77307b';

const FIRST = CHANNEL.split(' ')[0];
const SAY = `Wrote the title, description and ${TAGS.length} tags in your voice.`;
const DONE = `Title, description and ${TAGS.length} tags, in ${FIRST}'s voice`;
// timing (seconds from the reply start, or from the panel where noted)
const CPS_SAY = 106.25;  // the reply line streams (the source's code beat)
const SAY_AT = 0.04;
const CARD_AT = 0.08;    // the reply line starts, then the panel rises
const CARD_IN = 0.16;
const WRITE_AT = 0.3;    // the panel is up, then the first title character lands
const TITLE_W = 0.42; /* deliberate */  // the title typed (49 characters)
const P1_W = 0.36;       // Sam's opening line streaming
const CH_STAGGER = 0.04; // one chapter line to the next
const GEAR_STAGGER = 0.032;
const P3_W = 0.16;
const TAG_STAGGER = 0.028;
const STEP = 0.05;       // one field (or block) finished to the next starting
const POP = 0.16;        // a chip or line popping in
const DONE_AT = 0.16;    // the last tag in, then the status lands
const PULSE = 0.24;
const HOLD_DONE = 0.42; /* deliberate */ // done: the status reads, pushed in, before the pull-back
const FOCUS_AT = 0.3; /* deliberate */   // the panel has appeared, then the camera starts in on it
const FOCUS_PUSH = 0.4; /* deliberate */
const FOCUS_PULL = 0.4; /* deliberate */

const TICK = '<svg class="em-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const CHEV = '<svg class="em-chev" viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg>';
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD_AT;
    T.t0 = T.card + WRITE_AT;                     // title
    T.t1 = T.t0 + TITLE_W;
    T.p0 = T.t1 + STEP;                           // description: the opening line
    T.p1 = T.p0 + P1_W;
    T.ch = CHAPTERS.map((_, i) => T.p1 + STEP + i * CH_STAGGER);
    T.gh = T.ch[CHAPTERS.length - 1] + STEP;      // the gear heading, then the nine links
    T.gear = GEAR.map((_, i) => T.gh + 0.06 + i * GEAR_STAGGER);
    T.q0 = T.gear[GEAR.length - 1] + STEP;        // the sign-off
    T.q1 = T.q0 + P3_W;
    T.tag = TAGS.map((_, i) => T.q1 + STEP + i * TAG_STAGGER);
    T.w1 = T.tag[TAGS.length - 1] + POP;
    T.done = T.w1 + DONE_AT;
    if (opts.zoom !== false) {
      const sw = T.card + FOCUS_AT;
      T.focus = { sw, landed: sw + FOCUS_PUSH, pull: T.done + HOLD_DONE, back: T.done + HOLD_DONE + FOCUS_PULL };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + PULSE + HOLD_DONE, r + SAY_AT + SAY.length / CPS_SAY);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const card = x.el(`<div class="em-x md-x">
      <div class="em-hd">
        <span class="em-proj">${ms('video-file-outline', 'em-ico')}<b>video-details</b></span><span class="em-br">${x.esc(FILE.name)}</span>
        <em class="em-state"><i class="em-spin"></i>${TICK}<span class="em-sl">Working</span><span class="em-clk">0s</span></em>
      </div>
      <div class="md-sec">
        <div class="md-lab"><span>Title</span><span class="md-cnt md-c-title">0/100</span></div>
        <div class="md-title"><span class="md-v"></span><i class="em-caret"></i></div>
      </div>
      <div class="md-sec">
        <div class="md-lab"><span>Description</span><span class="md-cnt md-c-desc">0/5,000</span></div>
        <p class="md-p md-p1"><span class="md-v"></span><i class="em-caret"></i></p>
        <div class="md-chs">${CHAPTERS.map(([s, l]) => `<span class="md-ch"><u>${clock(s)}</u>${x.esc(l)}</span>`).join('')}</div>
        <div class="md-gh">${x.esc(DESC_GEAR)}</div>
        <div class="md-gear">${GEAR.map(([n, p]) => `<span class="md-g">${ms('link')}<span>${x.esc(n)}</span><b>$${p}</b></span>`).join('')}</div>
        <p class="md-p md-p3"><span class="md-v"></span><i class="em-caret"></i></p>
      </div>
      <div class="md-sec md-sec-tags">
        <div class="md-lab"><span>Tags</span><span class="md-cnt md-c-tags">0/500</span></div>
        <div class="md-tags">${TAGS.map((g) => `<span class="md-tag">${x.esc(g)}</span>`).join('')}</div>
      </div>
      <div class="em-ft">
        <span class="em-sum">${CHEV}${TICK.replace('em-tk', 'em-tk em-dn')}<b class="em-nf">Writing</b><span class="em-cnt">title</span></span>
        <span class="em-btns"><i class="em-b">Review</i><i class="em-b em-pri">Use all</i></span>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const title = $('.md-title .md-v'), tCaret = $('.md-title .em-caret');
    const p1 = $('.md-p1 .md-v'), p1c = $('.md-p1 .em-caret'), p3 = $('.md-p3 .md-v'), p3c = $('.md-p3 .em-caret');
    const chs = [...card.querySelectorAll('.md-ch')], gh = $('.md-gh'), gear = [...card.querySelectorAll('.md-g')], tags = [...card.querySelectorAll('.md-tag')];
    const cT = $('.md-c-title'), cD = $('.md-c-desc'), cG = $('.md-c-tags');
    const state = $('.em-state'), stateL = $('.em-sl'), clk = $('.em-clk'), spin = $('.em-hd .em-spin'), stTk = state.querySelector('.em-tk');
    const nf = $('.em-nf'), cnt = $('.em-cnt'), ft = $('.em-ft'), pri = $('.em-pri');
    const pop = (n, t, a) => {
      const o = outCubic(seg(t, a, a + POP));
      n.style.opacity = o.toFixed(3);
      n.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 5).toFixed(2)}px) scale(${(0.92 + 0.08 * o).toFixed(4)})`;
    };
    // the description counter climbs through the opening line, the chapters, the links and the sign-off to DESC.length
    const descAt = (t) => {
      if (t < T.p0) return 0;
      const f = seg(t, T.p0, T.q1);
      return Math.round(DESC.length * f);
    };
    let said = -1;

    return {
      nodes: [say, card],
      focus: T.focus ? card : null,
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS_SAY, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;

        // the title, typed; its counter is the characters on screen
        const nt = Math.round(TITLE.length * seg(t, T.t0, T.t1));
        setText(title, TITLE.slice(0, nt));
        tCaret.style.display = t >= T.t0 - 0.1 && t < T.t1 + 0.1 ? '' : 'none';
        setText(cT, `${nt}/100`);
        // the description
        const n1 = Math.round(DESC_P1.length * seg(t, T.p0, T.p1));
        setText(p1, DESC_P1.slice(0, n1));
        p1c.style.display = t >= T.p0 && t < T.p1 + 0.05 ? '' : 'none';
        chs.forEach((n, i) => pop(n, t, T.ch[i]));
        pop(gh, t, T.gh);
        gear.forEach((n, i) => pop(n, t, T.gear[i]));
        const n3 = Math.round(DESC_P3.length * seg(t, T.q0, T.q1));
        setText(p3, DESC_P3.slice(0, n3));
        p3c.style.display = t >= T.q0 && t < T.q1 + 0.05 ? '' : 'none';
        setText(cD, `${fmt(descAt(t))}/5,000`);
        // the tags, chip by chip; Studio counts them comma-joined
        let tc = 0;
        tags.forEach((n, i) => { pop(n, t, T.tag[i]); if (t >= T.tag[i]) tc += TAGS[i].length + (i ? 1 : 0); });
        setText(cG, `${d ? TAG_CHARS : tc}/500`);

        // header: the beat's own elapsed whole seconds from r
        setText(stateL, d ? 'Worked for' : 'Working');
        setText(clk, `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`);
        state.classList.toggle('ok', d);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pp = seg(t, T.done, T.done + 0.176);
        stTk.style.transform = d && pp < 1 ? `scale(${(0.6 + 0.4 * outCubic(pp)).toFixed(3)})` : '';
        // the review bar names the field being written, then lands on the done line
        const field = t < T.p0 ? 'title' : t < T.tag[0] - STEP ? 'description' : 'tags';
        setText(nf, d ? DONE : 'Writing');
        setText(cnt, d ? '' : field);
        ft.classList.toggle('on', d);
        card.classList.toggle('em-done', d);
        const pb = Math.sin(Math.PI * seg(t, T.done, T.done + PULSE));
        pri.style.transform = d ? `scale(${(1 + 0.06 * pb).toFixed(4)})` : '';
        pri.style.boxShadow = d ? `0 0 0 ${(4 * pb).toFixed(2)}px rgba(236,236,236,${(0.22 * pb).toFixed(3)})` : '';
      },
    };
  },
};
