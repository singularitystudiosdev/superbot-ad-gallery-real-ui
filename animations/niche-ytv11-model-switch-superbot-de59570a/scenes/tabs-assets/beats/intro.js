// Intro beat, the finale: Claude Opus 5.5 codes the trailer and the finished 30-second cut plays. This is the code half
// of the pipeline (Cursor's agent-panel grammar, as the sibling youtube ad used for its replies): a header with the
// project and an honest clock ("Working 1s", then a check and "Worked for 2s"), file tabs (timeline.ts active, intro.json),
// and an editor body where the timeline code streams in behind a caret, placing the four assets the earlier beats made
// (the Gemini thumbnail, the Blender render, the ElevenLabs take) at their beats in the cut. Then superbot previews the
// render: a 16:9 trailer frame plays (the mic shot slow-pushed, the title landing, the waveform, the burned-in
// timecode) while the camera pushes in on it (chat.js FOCUS). Footer: "trailer.mp4 · 0:30 · 1920 × 1080".
// Pure function of t: every value on screen is written from t; line heights are constants, so the stream never measures
// layout.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Coded the intro and placed every asset in the timeline.';
const PROJECT = 'mic-trailer';
const CODE = `import { cut, title, model, voice, thumb } from "@superbot/video";

export const trailer = cut({ fps: 30, ms: 30_000 });

trailer.at(0.0).add(thumb("mb_thumb_3"),  { hold: 0.6 });
trailer.at(0.4).add(title("12 MICS UNDER $100"));
trailer.at(0.9).add(model("mic_hero_3q"), { spin: 2.4 });
trailer.at(0.4).add(voice("vo_take_1"),   { gain: -3 });

export default trailer.render({ size: "1920x1080" });`;
const TABS = ['timeline.ts', 'intro.json'];
const TITLE_WORDS = '12 MICS UNDER $100';
const FT = 'trailer.mp4 · 0:30 · 1920 × 1080';

const LINES = CODE.split('\n');
const STARTS = LINES.reduce((a, l, i) => (a.push(i ? a[i - 1] + LINES[i - 1].length + 1 : 0), a), []);
const TOTAL = CODE.length;

const CPS = 95;
const SAY_AT = 0.05;
const CARD = 0.08;
const CARD_IN = 0.18;
const W0 = 0.26, WRITE = 0.86;       // the code streams
const PREV0 = 0.46;                  // the preview rises while the code is still writing
const PLAY0 = 0.86, PLAY = 1.0;      // the trailer plays
const DONE = 1.06;                   // the header check
const FOOT_AT = 1.5;
const FOOT_IN = 0.18;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// a light highlighter: the keywords and the asset calls
const hl = (line) => esc(line)
  .replace(/\b(import|from|export|default|const)\b/g, '<i class="k">$1</i>')
  .replace(/\b(trailer|cut|title|model|voice|thumb|render)\b/g, '<i class="f">$1</i>');
const TICK = '<svg class="op-tk" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ENV = '<svg class="op-env" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18"/></svg>';

export default {
  times(r, opts = {}) {
    const T = { r };
    T.card = r + CARD;
    T.w0 = r + W0; T.w1 = r + W0 + WRITE;
    T.prev = r + PREV0;
    T.p0 = r + PLAY0; T.p1 = r + PLAY0 + PLAY;
    T.done = r + DONE;
    T.foot = r + FOOT_AT;
    if (opts.zoom !== false) {
      const sw = r + 0.4;
      T.focus = { sw, landed: sw + 0.4, pull: r + 1.85, back: r + 2.15 };
    }
    T.end = Math.max(T.focus ? T.focus.back : 0, T.done + 0.2, T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="op-panel">
      <div class="op-hd"><span class="op-proj">${ENV}<b>${PROJECT}</b></span><span class="op-br">3 files</span>
        <em class="op-state"><i class="op-spin"></i>${TICK}<span class="op-sl">Working</span><span class="op-clk">0s</span></em></div>
      <div class="op-tabs">${TABS.map((f, i) => `<span class="op-tab${i === 0 ? ' on' : ''}">${f}</span>`).join('')}</div>
      <div class="op-bd">${LINES.map((l, i) => `<div class="op-l"><u>${i + 1}</u><code><span class="op-v"></span><i class="op-caret"></i></code></div>`).join('')}</div>
      <div class="op-ft">${TICK.replace('op-tk', 'op-tk op-dn')}<span class="op-nf">Writing</span><span class="op-cnt">0 of ${TABS.length}</span></div>
    </div>`);
    const prev = x.el(`<div class="op-prev">
      <div class="op-frame">
        <img src="${x.img('mic-frame.jpg')}" width="1280" height="720" alt=""/>
        <span class="op-title">${TITLE_WORDS.split(' ').map((w) => `<b>${esc(w)}</b>`).join(' ')}</span>
        <span class="op-wave">${Array.from({ length: 34 }, (_, i) => `<i style="height: ${(16 + 84 * Math.abs(Math.sin(i * 1.6))).toFixed(0)}%"></i>`).join('')}</span>
        <span class="op-tc">0:00</span><span class="op-res">1920×1080</span>
      </div>
      <div class="op-bar"><i class="op-prog"></i></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.op-l')].map((n, i) => ({ n, v: n.querySelector('.op-v'), c: n.querySelector('.op-caret'), shown: -1, caret: null }));
    const stateL = $('.op-sl'), clk = $('.op-clk'), spin = $('.op-hd .op-spin'), st = $('.op-state .op-tk');
    const nf = $('.op-nf'), cnt = $('.op-cnt'), ft = $('.op-ft');
    const prog = prev.querySelector('.op-prog'), tc = prev.querySelector('.op-tc'), img = prev.querySelector('img');
    const title = prev.querySelector('.op-title'), tw = [...prev.querySelectorAll('.op-title b')], wave = [...prev.querySelectorAll('.op-wave i')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let said = -1, clock = '';
    return {
      nodes: [say, card, prev],
      focus: T.focus ? prev : null,
      marks: [[T.r, say], [T.card, card], [T.prev, prev], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== said) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); said = ns; }
        const e = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = e.toFixed(3);
        card.style.transform = e >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${(0.97 + 0.03 * e).toFixed(4)})`;
        const d = t >= T.done;
        // the code stream, a steady typewriter with the caret riding the last character
        const c = Math.round(TOTAL * seg(t, T.w0, T.w1));
        const writing = t >= T.w0 && t < T.w1 + 0.3;
        rows.forEach((o, i) => {
          const k2 = Math.max(0, Math.min(LINES[i].length, c - STARTS[i]));
          const visible = c > STARTS[i] || (i === 0 && t >= T.w0);
          if (k2 !== o.shown) { o.v.innerHTML = hl(LINES[i].slice(0, k2)); o.shown = k2; }
          o.n.style.visibility = visible || c >= TOTAL ? '' : 'hidden';
          const on = writing && c >= STARTS[i] && (i === LINES.length - 1 || c < STARTS[i + 1]);
          if (on !== o.caret) { o.c.style.display = on ? '' : 'none'; o.caret = on; }
        });
        stateL.textContent = d ? 'Worked for' : 'Working';
        const cs = `${Math.floor(Math.max(0, Math.min(t, T.done) - T.r))}s`;
        if (cs !== clock) { clk.textContent = cs; clock = cs; }
        card.classList.toggle('op-done', d);
        spin.style.opacity = (1 - seg(t, T.done - 0.06, T.done + 0.04)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 720).toFixed(1)}deg)`;
        const pop = seg(t, T.done, T.done + 0.18);
        st.style.transform = d && pop < 1 ? `scale(${(0.6 + 0.4 * outCubic(pop)).toFixed(3)})` : '';
        nf.textContent = d ? 'Rendered' : 'Writing';
        cnt.textContent = d ? '0 errors' : `${Math.min(TABS.length, Math.ceil(seg(t, T.w0, T.w1) * TABS.length))} of ${TABS.length}`;
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 5).toFixed(2)}px)`;

        // the trailer preview: rises while the code still writes, then plays
        const pe = outCubic(seg(t, T.prev, T.prev + 0.3));
        prev.style.opacity = pe.toFixed(3);
        prev.style.transform = pe >= 1 ? 'none' : `translateY(${((1 - pe) * 14).toFixed(2)}px) scale(${lerp(0.96, 1, pe).toFixed(4)})`;
        const pl = seg(t, T.p0, T.p1);
        prog.style.transform = `scaleX(${pl.toFixed(4)})`;
        const sec = Math.round(pl * 30);
        const tcs = `0:${String(sec).padStart(2, '0')}`;
        if (tcs !== tc.textContent) tc.textContent = tcs;
        img.style.transform = `scale(${(1.06 - 0.06 * pl).toFixed(4)})`;
        // the title lands word by word at the top of the cut; the waveform breathes as the read plays
        tw.forEach((w, i) => { const a = seg(t, T.p0 + i * 0.06, T.p0 + i * 0.06 + 0.24); w.style.opacity = outCubic(a).toFixed(3); w.style.transform = a >= 1 ? 'none' : `translateY(${((1 - outCubic(a)) * 8).toFixed(2)}px)`; });
        title.classList.toggle('op-title-on', t >= T.p0);
        wave.forEach((b, i) => { b.classList.toggle('on', Math.floor(pl * 34) > i); });
      },
    };
  },
};