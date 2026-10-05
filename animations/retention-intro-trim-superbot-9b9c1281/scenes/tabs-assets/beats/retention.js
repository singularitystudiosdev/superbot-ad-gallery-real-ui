// Retention beat: Gemini reads Audience retention for Maya's latest upload and finds where the intro loses people. Its
// line streams and a dark card rises (the A2 research grammar: header with the spinner resolving to the check, the video,
// its length and views). Inside it, Studio's own light "Key moments for audience retention" card (Intro tab): the curve
// draws over the first minute while the stat counts down to "58% of viewers are still watching at 0:30"; the drop
// Gemini marks (0:06 to 0:31, the recap of last week's build, -35 pts) washes red behind it, and the hook at 0:31 is
// dotted where the curve goes flat. Under the chart, three frames of the video: 0:06 (her hand on the walnut board), the
// recap (struck red) and 0:31 (the same hand, the hook line quoted), so the cut to come reads clean. The footer names the
// drop. The camera pushes in on the card while it plays (T.focus, scenes/tabs.js). Every fact comes from walnut.js.
// Pure function of t.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { VIDEO, CUT, RECAP, HOOK, RET_BEFORE, AT30, at, ts } from './walnut.js?v=9b9c1281';
import { chart } from './retchart.js?v=9b9c1281';

const SAY = 'Reading Audience retention on your latest video.';
const CW = 592, CH = 112; // the chart, design px
const DROP = Math.round(at(RET_BEFORE, CUT.a) - at(RET_BEFORE, CUT.b)); // 35 pts
// timing (seconds from the reply start, or from the card where noted)
const CPS = 150;
const SAY_AT = 0.03;
const CARD = 0.06;
const RISE = 0.22;
const DRAW0 = 0.12;                     // the card landing to the curve starting
const DRAW = 0.72; /* deliberate */     // the first minute draws
const SHADE = 0.2;                      // the drop washes in once the curve has passed 0:31
const FR_AT = 0.8, FR_STEP = 0.08, FR_IN = 0.18; // the card landing to each frame
const HOOK_AT = 1.02;                   // the card landing to the hook dot and quote
const DONE = 1.16;                      // ...to the check and the footer
const FOOT_IN = 0.16;
const HOLD = 0.68; /* deliberate */     // the finished card holds, readable, before the camera pulls back

export default {
  times(r, opts) {
    const T = { r };
    T.card = r + CARD;
    T.d0 = T.card + DRAW0;
    T.d1 = T.d0 + DRAW;
    T.shade = T.d0 + DRAW * (CUT.b / 60);
    T.fr = [0, 1, 2].map((i) => T.card + FR_AT + i * FR_STEP);
    T.hook = T.card + HOOK_AT;
    T.done = T.card + DONE;
    T.settled = Math.max(T.done + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    T.end = T.settled + HOLD;
    if (opts && opts.zoom) T.focus = { sw: T.card, landed: T.card + 0.3, pull: T.end - 0.04, back: T.end + 0.24 };
    window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { retention: { card: T.card, d0: T.d0, d1: T.d1, shade: T.shade, fr: T.fr, hook: T.hook, done: T.done } });
    return T;
  },
  build(k, x) {
    const T = k.T;
    const esc = x.esc;
    const c = chart(CW, CH);
    const xa = c.X(CUT.a), xb = c.X(CUT.b);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rt-card">
      <div class="rt-hd"><span class="rt-st"><i class="rt-spin"></i>${x.OK}</span><b>Audience retention</b><span class="rt-vid">${esc(VIDEO.title)}</span><span class="rt-meta">${ts(VIDEO.len)} · ${VIDEO.views} views</span></div>
      <div class="rt-panel">
        <div class="rt-ph"><b>Key moments for audience retention</b><span class="rt-tabs"><i class="rt-on">Intro</i><i>Top moments</i><i>Spikes</i><i>Dips</i></span></div>
        <div class="rt-stat"><b class="rt-pct">100%</b><span>of viewers are still watching at 0:30</span></div>
        <div class="rt-ch" style="width:${CW}px;height:${CH}px">
          <svg viewBox="0 0 ${CW} ${CH}" width="${CW}" height="${CH}" aria-hidden="true">
            <defs><clipPath id="rt-clip"><rect class="rt-clipr" x="0" y="0" width="0" height="${CH}"/></clipPath></defs>
            <rect class="rt-drop" x="${xa.toFixed(1)}" y="${c.pad.t}" width="${(xb - xa).toFixed(1)}" height="${c.ih.toFixed(1)}"/>
            ${c.axes}
            <line class="rt-dl" x1="${xa.toFixed(1)}" x2="${xa.toFixed(1)}" y1="${c.pad.t}" y2="${(c.pad.t + c.ih).toFixed(1)}"/>
            <line class="rt-dl" x1="${xb.toFixed(1)}" x2="${xb.toFixed(1)}" y1="${c.pad.t}" y2="${(c.pad.t + c.ih).toFixed(1)}"/>
            <path class="rt-area" d="${c.area(RET_BEFORE)}" clip-path="url(#rt-clip)"/>
            <path class="rt-line" d="${c.d(RET_BEFORE)}" pathLength="1"/>
            <circle class="rt-hook" cx="${xb.toFixed(1)}" cy="${c.Y(at(RET_BEFORE, CUT.b)).toFixed(1)}" r="5"/>
            <circle class="rt-head" r="4"/>
          </svg>
          <span class="rt-dlab" style="left:${((xa + xb) / 2).toFixed(1)}px"><b>${ts(CUT.a)} to ${ts(CUT.b)}</b> Recap <em>−${DROP} pts</em></span>
          <span class="rt-hlab" style="left:${(xb + 10).toFixed(1)}px;top:${(c.Y(AT30.before) - 26).toFixed(1)}px">Hook holds flat</span>
        </div>
      </div>
      <div class="rt-strip">
        <div class="rt-fr"><img src="${x.img('f-0006.jpg')}" alt=""/><i>${ts(CUT.a)}</i></div>
        <div class="rt-fr rt-cutfr"><img src="${x.img('f-recap1.jpg')}" alt=""/><b class="rt-x"></b><i>${ts(CUT.a)}–${ts(CUT.b)}</i></div>
        <div class="rt-fr"><img src="${x.img('f-0031.jpg')}" alt=""/><i>${ts(CUT.b)}</i></div>
        <div class="rt-q"><small>Hook · ${ts(CUT.b)}</small><span>“${esc(HOOK)}”</span></div>
      </div>
      <div class="rt-ft">${x.OK}<span>Cut ${ts(CUT.a)} to ${ts(CUT.b)}, the ${esc(RECAP.toLowerCase())}. The hook holds.</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const st = { spin: $('.rt-spin'), ok: $('.rt-st .qc-ok') };
    const pct = $('.rt-pct'), line = $('.rt-line'), clipr = $('.rt-clipr'), head = $('.rt-head'), hook = $('.rt-hook');
    const drop = $('.rt-drop'), dls = [...card.querySelectorAll('.rt-dl')], dlab = $('.rt-dlab'), hlab = $('.rt-hlab');
    const frs = [...card.querySelectorAll('.rt-fr')], q = $('.rt-q'), xmark = $('.rt-x'), ft = $('.rt-ft');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, pTxt = '';

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

        // the curve draws across the first minute; the stat follows it down to 0:30 and stops there
        const p = inOutCubic(seg(t, T.d0, T.d1));
        const s = 60 * p;
        line.style.strokeDashoffset = (1 - p).toFixed(4);
        clipr.setAttribute('width', c.X(s).toFixed(1));
        head.setAttribute('cx', c.X(s).toFixed(1));
        head.setAttribute('cy', c.Y(at(RET_BEFORE, s)).toFixed(1));
        head.style.opacity = p > 0 && p < 1 ? '1' : '0';
        const pv = `${Math.round(at(RET_BEFORE, Math.min(s, 30)))}%`;
        if (pv !== pTxt) { pct.textContent = pv; pTxt = pv; }
        pct.classList.toggle('rt-low', s >= CUT.b - 1);

        // the drop: the wash opens left to right once the curve is past 0:31, its label drops in
        const sh = outCubic(seg(t, T.shade, T.shade + SHADE));
        drop.style.opacity = sh.toFixed(3);
        drop.style.transform = `scaleX(${lerp(0.2, 1, sh).toFixed(4)})`;
        dls.forEach((n) => { n.style.opacity = sh.toFixed(3); });
        dlab.style.opacity = sh.toFixed(3);
        dlab.style.transform = `translate(-50%, ${((1 - sh) * -6).toFixed(2)}px)`;

        frs.forEach((n, i) => {
          const f = outCubic(seg(t, T.fr[i], T.fr[i] + FR_IN));
          n.style.opacity = f.toFixed(3);
          n.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 8).toFixed(2)}px)`;
        });
        const xm = seg(t, T.fr[1] + 0.12, T.fr[1] + 0.3);
        xmark.style.opacity = xm > 0 ? '1' : '0';
        xmark.style.transform = `scaleX(${outCubic(xm).toFixed(4)})`;

        const hk = outCubic(seg(t, T.hook, T.hook + 0.2));
        hook.style.opacity = hk.toFixed(3);
        hook.style.transform = `scale(${lerp(0.3, 1, hk).toFixed(4)})`;
        hlab.style.opacity = hk.toFixed(3);
        q.style.opacity = hk.toFixed(3);
        q.style.transform = hk >= 1 ? 'none' : `translateX(${((1 - hk) * -8).toFixed(2)}px)`;

        const d = outCubic(seg(t, T.done, T.done + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = d.toFixed(3);
        st.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
        const f = outCubic(seg(t, T.done, T.done + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
