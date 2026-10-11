// scenes/gw: "One key. Every model." A developer's gateway console, drawn at DW design px and scaled to the
// frame width. One caller key (Authorization: Bearer sbc_…7f2a) calls https://api.superbot.gg/v1 three times;
// the request body's model id changes each time (anthropic/claude-opus-5.5, openai/gpt-6-sol,
// google/gemini-3-pro) and the answer streams back as text/event-stream until data: [DONE]. The rail beside the
// terminal shows what is behind that one key: the key and its scope, and the three plans it already covers.
// The spot never implies failover: each call names its own model id, and each is a separate request.
// SOLUTION ONLY (user ruling): no error, no outage, no complaint, no hook card is ever on screen.
// render(lt) is a pure function of local time: no layout reads, no Math.random, no wall clock.
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic, stream, blink } from '../lib.js';

const H = 1080;
// the ask is the same every time: the same question, three different models behind one key.
const ASK = 'summarize the notes';
// one key. The key is a caller key (sbc_), scoped to gateway:invoke (api.md: "the model routes take a caller key").
const KEY = 'sbc_…7f2a';
const ENDPOINT = 'https://api.superbot.gg/v1';
const CHAT = ENDPOINT + '/chat/completions';
// The model ids use the vendor-id form docs.md prints for a gateway call ("<vendor>/<model>, or the vendor's bare
// id"), spelled with the model names superbot.gg already shows (Claude Opus 5.5, GPT-6, Gemini 3 Pro). api.md's
// own curl examples use the agent id "superbot"; these are the same call with the vendor's own id named, which is
// the whole point of the route ("Name the model id and the call goes to the provider that holds it").
const MODELS = [
  { v: 'claude', id: 'anthropic/claude-opus-5.5', who: 'Claude Pro/Max', prov: 'Anthropic',
    ans: 'Three things shipped: read receipts, calendar sync, and a faster search index.' },
  { v: 'openai', id: 'openai/gpt-6-sol', who: 'ChatGPT Plus', prov: 'OpenAI',
    ans: 'This release adds read receipts, calendar sync, and a rebuilt search index.' },
  { v: 'google', id: 'google/gemini-3-pro', who: 'Gemini Code Assist', prov: 'Google',
    ans: 'Highlights are read receipts, calendar sync, and search that indexes twice as fast.' },
];
// one exchange's schedule (seconds, local): request lands, 200 OK, the stream, then data: [DONE]
const START = [0.75, 4.25, 7.75];
const T_RES = 0.95, T_STREAM = 1.15, CPS = 44, T_DONE = 2.95;
const DUR = 13.2;                 // the scene's own length; timeline.js places the end card after it
const GAP = 8;                    // px between exchanges

const asset = (f) => new URL('../brand/' + f, import.meta.url).href;

let el = null;

// the design box: a console laid out at DW design px and enlarged to the frame with CSS `zoom`, NOT with a
// transform. A `transform: scale(k)` composites the scene at its own width (DW px, DPR 1) and then the browser
// resamples that raster up to the frame width, which softens every glyph (k=1.70 at 16:9, 1.45 at 4:5). `zoom`
// participates in layout, so text is rasterized at the delivered size: 1:1 device pixels, crisp.
function geo(W) {
  if (el.geo && el.geo.W === W) return el.geo;
  const k = W >= 1700 ? 1.70 : W >= 1400 ? 1.60 : W >= 1000 ? 1.50 : 1.45;
  const DW = W / k, DH = H / k;
  el.root.classList.toggle('tall', DW < 800);   // 1x1 and 4x5 stack the rail under the terminal
  el.geo = { W, DW, DH, k };
  return el.geo;
}

const LOGO = {
  claude: 'claude-logo.svg', openai: 'openai-logo.svg', google: 'gemini-logo.svg',
};

// one exchange: the request (method, auth, JSON body with the model id) and the streamed reply
function exchangeHTML(m) {
  return `<div class="gw-ex gw-v-${m.v}">
  <div class="gw-req">
    <div class="gw-l"><b class="gw-m">POST</b> <span class="gw-path">/v1/chat/completions</span> <span class="gw-dim">HTTP/1.1</span></div>
    <div class="gw-l"><span class="gw-k">Authorization:</span> Bearer <span class="gw-keyv">${KEY}</span></div>
    <div class="gw-l"><span class="gw-k">content-type:</span> application/json</div>
    <div class="gw-code">
      <div><span class="gw-p">{</span></div>
      <div>&nbsp;&nbsp;<span class="gw-s">"model"</span>: <span class="gw-id">"${m.id}"</span>,</div>
      <div>&nbsp;&nbsp;<span class="gw-s">"stream"</span>: <span class="gw-n">true</span>,</div>
      <div>&nbsp;&nbsp;<span class="gw-s">"messages"</span>: [{ <span class="gw-s">"role"</span>: <span class="gw-s">"user"</span>,</div>
      <div>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="gw-s">"content"</span>: <span class="gw-ask">"${ASK}"</span> }]</div>
      <div><span class="gw-p">}</span></div>
    </div>
  </div>
  <div class="gw-res">
    <div class="gw-l"><b class="gw-ok">200 OK</b> <span class="gw-dim">content-type: text/event-stream</span></div>
    <div class="gw-stream"><span class="gw-dl">data:</span> <span class="gw-txt"></span><i class="gw-caret"></i></div>
    <div class="gw-l gw-done"><span class="gw-dl">data:</span> [DONE]</div>
  </div>
</div>`;
}

export default {
  id: 'gw',
  dur: DUR,

  mount(section) {
    section.innerHTML = `
<div class="gw" id="gw">
  <div class="gw-glow"></div>
  <div class="gw-sh">
    <div class="gw-bar">
      <span class="gw-dots"><i></i><i></i><i></i></span>
      <span class="gw-name">superbot gateway</span>
      <span class="gw-url">${ENDPOINT}</span>
      <span class="gw-live" id="gw-live"><i class="gw-live-d"></i><b>connected</b></span>
    </div>
    <div class="gw-body">
      <div class="gw-term" id="gw-term"><div class="gw-exs" id="gw-exs">${MODELS.map(exchangeHTML).join('')}</div></div>
      <aside class="gw-rail" id="gw-rail">
        <div class="gw-rail-hd">Behind one key</div>
        <div class="gw-keyrow gw-keymain">
          <span class="gw-ico">${'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.5 7.5a4 4 0 1 0-3.6 3.98L7 13.4V16H4.4l-1.4 1.4V20h2.6l1.4-1.4v-2.6l1.9-1.9a4 4 0 0 0 3.6-.6"/><circle cx="15.5" cy="8.5" r="4.5"/></svg>'}</span>
          <span class="gw-ktext"><b>${KEY}</b><small>gateway:invoke</small></span>
        </div>
        <div class="gw-rail-sub">Plans on this key</div>
        ${MODELS.map((m) => `<div class="gw-prow gw-p-${m.v}">
          <span class="gw-plogo"><img src="${asset(LOGO[m.v])}" alt=""></span>
          <span class="gw-ktext"><b>${m.prov}</b><small>${m.who}</small></span>
          <i class="gw-pdot"></i>
        </div>`).join('')}
      </aside>
    </div>
    <div class="gw-foot" id="gw-foot">
      <span class="gw-fb">1 key</span><span class="gw-fsep">·</span><span class="gw-fb">3 providers</span><span class="gw-fsep">·</span><span class="gw-fb">one endpoint</span>
      <code class="gw-furl">${ENDPOINT}</code>
    </div>
  </div>
</div>`;
    const q = (s) => section.querySelector(s);
    const exs = [...section.querySelectorAll('.gw-ex')].map((node, i) => {
      const lines = [...node.querySelectorAll('.gw-req > .gw-l, .gw-req > .gw-code > div')];
      return { node, lines, res: node.querySelector('.gw-res'), txt: node.querySelector('.gw-txt'),
        caret: node.querySelector('.gw-caret'), done: node.querySelector('.gw-done'), i };
    });
    el = {
      root: q('.gw'), sh: q('.gw-sh'), live: q('#gw-live'), liveT: q('#gw-live b'), term: q('#gw-term'),
      exs: q('#gw-exs'), list: exs, rail: [...section.querySelectorAll('.gw-prow')], foot: q('#gw-foot'), geo: null,
    };
  },

  render(lt, ctx) {
    if (!el) return;
    const t = Math.max(0, lt);
    const W = (ctx && ctx.W) || 1920;
    const g = geo(W);

    // the console is laid out at DW design px and enlarged with `zoom` (crisp: no transform-scale rasterization).
    // The camera push-in IS the zoom: a smaller layout box at a bigger zoom reads as a 2% push-in while the
    // rendered box stays exactly the frame, so nothing ever leaves the frame. Values are written every frame but
    // the layout is untouched between frames except during the 3.2 s push-in, which is deliberately moving.
    const z = lerp(1.02, 1.0, inOutCubic(seg(t, 0, 3.2)));
    const kk = g.k * z;
    el.root.style.zoom = kk.toFixed(5);
    el.root.style.width = (W / kk).toFixed(3) + 'px';
    el.root.style.height = (H / kk).toFixed(3) + 'px';
    // the console eases in; the entry offset is whole pixels so text never sits on a half pixel once it lands
    const inP = outCubic(seg(t, 0.02, 0.62));
    el.sh.style.opacity = inP.toFixed(3);
    el.sh.style.transform = `translateY(${Math.round((1 - inP) * 22)}px)`;

    // which exchange is live (its model id read from the request that has landed)
    let live = -1;
    for (let i = 0; i < START.length; i++) if (t >= START[i]) live = i;
    const streaming = live >= 0 && t >= START[live] + T_STREAM && t < START[live] + T_DONE;
    el.liveT.textContent = streaming ? 'streaming' : 'connected';
    el.live.classList.toggle('on', streaming);

    // the rail lights the plan the current call is landing on (a call, not a failover: one model per call)
    el.rail.forEach((r, i) => r.classList.toggle('on', i === live));

    for (const ex of el.list) {
      const S = START[ex.i];
      // request block: the lines land one after another
      ex.lines.forEach((l, j) => {
        const p = outCubic(seg(t, S + j * 0.07, S + j * 0.07 + 0.30));
        l.style.opacity = p.toFixed(3);
        l.style.transform = p >= 1 ? 'none' : `translateX(${((1 - p) * 8).toFixed(2)}px)`;
      });
      // response: 200 OK, then the stream
      const rp = outCubic(seg(t, S + T_RES, S + T_RES + 0.22));
      ex.res.style.opacity = rp.toFixed(3);
      const ans = MODELS[ex.i].ans;
      const txt = stream(ans, S + T_STREAM, CPS, t);
      if (ex.txt.textContent !== txt) ex.txt.textContent = txt;
      const done = txt.length >= ans.length;
      const caretOn = t >= S + T_STREAM && !done ? true : (t >= S + T_STREAM ? blink(t) : false);
      ex.caret.style.opacity = (rp > 0 && caretOn ? 1 : 0).toString();
      // data: [DONE] once the last token has landed
      const dp = outCubic(seg(t, S + T_DONE, S + T_DONE + 0.22));
      ex.done.style.opacity = dp.toFixed(3);
      // an exchange that has not started is not on screen at all (its coloured rule must not sit there empty);
      // a finished one dims a little, so the live call reads first
      const fin = seg(t, S + T_DONE + 0.5, S + T_DONE + 1.0);
      ex.node.style.opacity = t < S ? '0' : lerp(1, 0.72, fin * (ex.i < live ? 1 : 0)).toFixed(3);
    }

    // auto-scroll: once the third request is over the fold, the transcript slides up to keep the newest lines in
    // view. Measured once per frame from the layout box (no transforms in between), like the hub's feed pin.
    const over = Math.max(0, el.term.scrollHeight - el.term.clientHeight);
    const sc = over * outCubic(seg(t, 3.4, 11.4));
    el.exs.style.transform = `translateY(${(-sc).toFixed(1)}px)`;

    // the closing banner: what the three calls were
    const fp = outCubic(seg(t, 11.2, 11.85));
    el.foot.style.opacity = fp.toFixed(3);
    el.foot.style.transform = `translateY(${((1 - fp) * 16).toFixed(2)}px)`;
  },
};