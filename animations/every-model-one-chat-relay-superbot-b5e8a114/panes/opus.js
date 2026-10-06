// Pane 2: Claude Opus 5.5 in Claude Code. It reads DeepSeek's data, starts the dev server, writes the page
// with a slot for every asset the next models will make, and hands assets.json on. The preview hot-reloads.
import { html, $, $$, enter, show, seg } from '../engine.js';
import { buildSite, renderSite } from './site.js';

const CODE = [
  ['kw', 'import', ' spots ', 'kw', 'from', ' ', 'str', '"@/data/competitors.json"'],
  ['kw', 'import', ' { Slot } ', 'kw', 'from', ' ', 'str', '"@/components/slot"'],
  [],
  ['kw', 'export default function', ' Home() {'],
  ['  ', 'kw', 'return', ' ('],
  ['    ', 'tag', '<main>'],
  ['      ', 'tag', '<Hero', ' title=', 'str', '"No soggy buns. Ever."', ' ours={9} median={spots.median} ', 'tag', '/>'],
  ['      ', 'tag', '<RadioSpot', ' src={Slot(', 'str', '"spot.mp3"', ')} ', 'tag', '/>'],
  ['      ', 'tag', '<BurgerSpin', ' src={Slot(', 'str', '"burger.glb"', ')} ', 'tag', '/>'],
  ['      ', 'tag', '<Photos', ' src={Slot([', 'str', '"hero.jpg"', ', ', 'str', '"menu.jpg"', ', ', 'str', '"truck.jpg"', '])} ', 'tag', '/>'],
  ['      ', 'tag', '<PriceCheck', ' ours={9} theirs={spots.rows} ', 'tag', '/>'],
  ['    ', 'tag', '</main>'],
];
const CLS = new Set(['kw', 'str', 'tag']);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function codeLine(parts) {
  let out = '';
  for (let i = 0; i < parts.length; i++) {
    if (CLS.has(parts[i])) { out += `<span class="${parts[i]}">${esc(parts[i + 1])}</span>`; i++; } else out += esc(parts[i]);
  }
  return out;
}

// [time, kind, html]
const TERM = [
  [0.35, 'tool', '<b>Read</b>(data/competitors.json)'],
  [0.55, 'res', 'Read <b>47</b> rows'],
  [0.8, 'tool', '<b>Bash</b>(npm run dev)'],
  [1.0, 'res', 'ready on <u>localhost:3000</u>'],
  [1.2, 'tool', '<b>Write</b>(app/page.tsx)'],
  [1.3, 'res', 'Wrote <b>186</b> lines to app/page.tsx'],
  ...CODE.map((p, i) => [1.38 + i * 0.13, 'code', `<span class="ln">${i + 1}</span><span class="cd">${codeLine(p)}</span>`]),
  [3.05, 'tool', '<b>Write</b>(assets.json)'],
  [3.25, 'res out', '<b>5</b> slots for Nano Banana Pro, Blender, ElevenLabs'],
  [3.6, 'say', 'Site is up with real prices and 5 empty slots. Passing assets.json on.'],
];
// preview sections appear as the lines that write them land
const REVEAL = [['.s-nav', 1.05], ['.s-copy', 1.38 + 6 * 0.13], ['.s-radio', 1.38 + 7 * 0.13], ['.s-3d', 1.38 + 8 * 0.13], ['.s-photos', 1.38 + 9 * 0.13], ['.s-price', 1.38 + 10 * 0.13]];
const GLYPHS = ['·', '✢', '✳', '✶', '✻', '✽', '✻', '✶', '✳', '✢'];

export function build() {
  const lines = TERM.map(([, k, h]) => `<div class="tl ${k}">${k === 'tool' || k === 'say' ? '<i class="dot">⏺</i>' : k.startsWith('res') ? '<i class="elb">⎿</i>' : ''}<span>${h}</span></div>`).join('');
  const el = html(`
  <div class="pane p-op">
    <div class="op-term">
      <div class="op-bar"><i></i><i></i><i></i><span>claude  ~/mainstreetburger</span></div>
      <div class="op-screen">
        <div class="op-welcome"><b><i>✻</i> Welcome to Claude Code</b><span>Opus 5.5</span><span>cwd: ~/mainstreetburger</span></div>
        <div class="tl prompt"><i class="gt">&gt;</i><span>Build mainstreetburger.co around this data. Leave slots for the photos, a 3D burger and a radio spot.</span></div>
        <div class="tl res att"><i class="elb">⎿</i><span class="file"><svg viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13"/></svg><b>competitors.json</b><i>47 rows</i></span></div>
        ${lines}
        <div class="op-status"><i class="g">✻</i><span>Simmering… </span><em>(<span class="sec">0</span>s  ↑ <span class="tok">0.0</span>k tokens  esc to interrupt)</em></div>
        <div class="op-box"><i class="gt">&gt;</i></div>
        <div class="op-foot">⏵⏵ accept edits on <em>(shift+tab to cycle)</em></div>
      </div>
    </div>
    <div class="op-web">
      <div class="br-bar"><span class="br-tab">Main Street Burger Co.</span><span class="br-url"><span class="u">localhost:3000</span></span></div>
      <div class="op-view"><div class="op-scale"></div><div class="op-loading">localhost:3000</div></div>
    </div>
  </div>`);
  const site = buildSite();
  $(el, '.op-scale').append(site.el);
  return {
    el,
    site,
    prompt: $(el, '.tl.prompt'),
    att: $(el, '.tl.att'),
    lines: $$(el, '.op-screen > .tl:not(.prompt):not(.att)'),
    status: $(el, '.op-status'),
    glyph: $(el, '.op-status .g'),
    sec: $(el, '.op-status .sec'),
    tok: $(el, '.op-status .tok'),
    out: $(el, '.tl.out'),
    reveal: REVEAL.map(([sel, at]) => [$(site.el, sel), at]),
    loading: $(el, '.op-loading'),
  };
}

export function render(c, t) {
  show(c.prompt, t >= 0);
  enter(c.att, t, 0.05, 0.3, 6);
  c.lines.forEach((li, i) => { const at = TERM[i][0]; show(li, t >= at); enter(li, t, at, 0.18, 4); });
  const busy = t >= 0.2 && t < 3.6;
  show(c.status, busy);
  c.glyph.textContent = GLYPHS[Math.floor(Math.max(0, t) * 10) % GLYPHS.length];
  c.sec.textContent = Math.floor(seg(t, 0.2, 3.6) * 24);
  c.tok.textContent = (seg(t, 0.2, 3.6) * 3.9).toFixed(1);
  c.out.classList.toggle('lit', t >= 3.9);
  c.loading.style.opacity = t < 1.05 ? 1 : 0;
  for (const [node, at] of c.reveal) node.style.opacity = seg(t, at, at + 0.25);
  renderSite(c.site, { fill: {}, spin: 0, vo: -1 });
}

export const anchors = (c) => ({ in: c.att, out: c.out });
