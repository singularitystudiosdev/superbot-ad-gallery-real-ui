// Opus beat, the fifth hand-off: Claude Opus 5.5 in Claude Code builds the buyer's guide the video description will
// link to, out of everything the models before it made. Left, the Claude Code session: superbot's request, Opus's
// plan, Write(headsets/index.html) with the file's real lines streaming (the <model-viewer> tag loading Blender's GLB,
// the headline from DeepSeek's hook, the rows from prices.json, the trailer voice from Eleven v4), then
// Bash(vercel deploy --prod) and the production URL. Right, the browser: the page builds section by section as the
// code lands (nav, hero with the 3D headset, the ranked table) and the address flips from localhost to the live URL
// when the deploy finishes. The page is real: guide/index.html in this folder, captured headless for the preview.
// Hand-off: samrivera.gg/headsets goes to YouTube Studio for the description.
import { seg, outCubic } from '../../../lib.js';
import { windowTimes, sayLine, rise, windowCard } from './kit.js?v=7993d5b0';

const SAY = 'Building the buyer’s guide your description will link to.';
const ASKED = 'Build the buyer’s guide: 3D model up top, the ranked table from prices.json, the trailer voice on Play.';
const PLAN = 'One static page: the GLB in <model-viewer>, the hook as the headline, ten rows from the scrape.';
// real lines of guide/index.html, abridged with … where the file runs longer
const CODE = [
  '<model-viewer src="wren-h2.glb" poster="hero.png"',
  '  auto-rotate camera-controls camera-orbit="35deg 78deg 0.62m">',
  '</model-viewer>',
  '<h1>The <em>$39</em> headset beat the $99 one.</h1>',
  '<table id="rank">…</table>',
  'const rows = [',
  "  ['Wren H2', 81, 39, 'Walmart', 'Clamps tight the first week'],",
  "  ['Tarn 7', 71, 79, 'Amazon', 'Heavy at 352 g'],",
  "  ['Halden Pro', 64, 99, 'Amazon', 'Mic hiss at max gain'],",
  '  …',
  '];',
  "const trailer = new Audio('trailer-vo.mp3');",
];
const URL_DEV = 'localhost:3000/headsets';
const URL_LIVE = 'samrivera.gg/headsets';

const HOLD = 3.4; /* deliberate */
const PLAN_AT = 0.1, WRITE_AT = 0.35, LINE_STAGGER = 0.085;
const WROTE_AT = 1.45;               // "Wrote 96 lines"
const DEPLOY_AT = 1.75, LIVE_AT = 2.3;
// the preview's sections as shares of the captured page's height, and when each lands (from the content clock)
const REVEAL = [[0.075, 0.5], [0.64, 0.8], [1, 1.25]];

// a few colours on the code, in Claude Code's dark theme
function hl(x, line) {
  // attributes first: the tag pass adds class="…" of its own
  return x.esc(line)
    .replace(/([a-z-]+)=(")/g, '<span class="op-at">$1</span>=$2')
    .replace(/(&lt;\/?)([a-z0-9-]+)/g, '$1<span class="op-tg">$2</span>')
    .replace(/('[^']*')/g, '<span class="op-st">$1</span>')
    .replace(/\b(const|new)\b/g, '<span class="op-kw">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="op-nm">$1</span>');
}

export default {
  times(r, opts) {
    const T = windowTimes(r, opts, HOLD);
    T.plan = T.c0 + PLAN_AT;
    T.lines = CODE.map((_, i) => T.c0 + WRITE_AT + 0.12 + i * LINE_STAGGER);
    T.write = T.c0 + WRITE_AT;
    T.wrote = T.c0 + WROTE_AT;
    T.deploy = T.c0 + DEPLOY_AT;
    T.live = T.c0 + LIVE_AT;
    T.reveal = REVEAL.map(([, at]) => T.c0 + at);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = sayLine(x, SAY);
    const app = `<div class="op">
      <div class="op-term">
        <div class="op-bar"><i></i><i></i><i></i><span>claude · ~/sam-site</span></div>
        <div class="op-log">
          <div class="op-u">&gt; ${x.esc(ASKED)}</div>
          <div class="op-l op-plan"><b class="op-dot">⏺</b><span>${x.esc(PLAN)}</span></div>
          <div class="op-l op-write"><b class="op-dot op-g">⏺</b><span><b>Write</b>(headsets/index.html)</span></div>
          <div class="op-code">${CODE.map((ln, i) => `<div class="op-cl"><i>${i + 1}</i><span>${hl(x, ln)}</span></div>`).join('')}</div>
          <div class="op-r op-wrote">⎿  Wrote 96 lines to headsets/index.html</div>
          <div class="op-l op-dep"><b class="op-dot op-g">⏺</b><span><b>Bash</b>(vercel deploy --prod)</span></div>
          <div class="op-r op-live">⎿  ✅ Production: https://${URL_LIVE} [3s]</div>
        </div>
        <div class="op-foot"><span>Opus 5.5</span><span>⏵⏵ auto-accept edits on</span></div>
      </div>
      <div class="op-br">
        <div class="op-chrome"><i></i><i></i><i></i><span class="op-url"><b class="op-lock">🔒</b><span class="op-addr">${URL_DEV}</span></span></div>
        <div class="op-page"><img src="${x.img('guide-shot.webp')}" alt=""/><div class="op-veil"></div></div>
      </div>
    </div>`;
    const w = windowCard(x, 'kc-op', app, {
      ins: [{ logo: x.brand('deepseek-logo.svg'), file: 'prices.json' }, { logo: x.brand('blender-logo.svg'), file: 'wren-h2.glb' },
        { logo: x.brand('gemini-logo.svg'), file: 'thumb-a.png' }, { logo: x.brand('elevenlabs-logo.svg'), file: 'trailer-vo.mp3' }],
      outs: [URL_LIVE],
      next: { logo: x.brand('youtube-icon.svg'), name: 'YouTube Studio' },
    });
    const $ = (s) => w.card.querySelector(s);
    const lines = [...w.card.querySelectorAll('.op-cl')];
    const plan = $('.op-plan'), write = $('.op-write'), wrote = $('.op-wrote'), dep = $('.op-dep'), live = $('.op-live');
    const veil = $('.op-veil'), addr = $('.op-addr'), lock = $('.op-lock'), log = $('.op-log');
    let lastAddr = '';

    return {
      nodes: [say.node, w.card],
      marks: [[T.r, say.node], [T.card, w.card]],
      focus: w.card,
      render(t) {
        say.render(t, T.r);
        rise(w.card, t, T.card);
        const show = (n, a) => { n.style.opacity = outCubic(seg(t, a, a + 0.15)).toFixed(3); };
        show(plan, T.plan); show(write, T.write); show(wrote, T.wrote); show(dep, T.deploy); show(live, T.live);
        lines.forEach((n, i) => show(n, T.lines[i]));
        // the session scrolls once the deploy lines need the room
        const sc = outCubic(seg(t, T.deploy - 0.1, T.deploy + 0.25));
        log.style.transform = sc > 0 ? `translateY(${(-28 * sc).toFixed(2)}px)` : 'none';
        // the preview builds top down: the veil's top edge sits at the last landed section
        let edge = 0;
        REVEAL.forEach(([share], i) => { edge = Math.max(edge, share * outCubic(seg(t, T.reveal[i], T.reveal[i] + 0.3))); });
        veil.style.top = `${(edge * 100).toFixed(2)}%`;
        const a = t >= T.live ? URL_LIVE : URL_DEV;
        if (a !== lastAddr) { addr.textContent = a; lastAddr = a; }
        lock.style.opacity = t >= T.live ? '1' : '0';
        w.renderIO(t, T.out);
      },
    };
  },
};
