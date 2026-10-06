// Pane 5: ElevenLabs Text to Speech on Eleven v3, voice "Mark". The script carries v3 audio tags; the
// waveform is the real take's RMS envelope (data.js PEAKS) and the playhead runs at real speed.
import { VO_SCRIPT, VO_DUR, PEAKS } from '../data.js';
import { html, $, $$, enter, show, seg, easeOut } from '../engine.js';

export const PLAY_AT = 2.25;
const NAV = ['Home', 'Voices', 'Text to Speech', 'Voice Changer', 'Sound Effects', 'Studio', 'Music'];
const SCRIPT_LEN = VO_SCRIPT.reduce((n, [tag, txt]) => n + tag.length + txt.length + 2, 0);
const mmss = (s) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export function build() {
  const nav = NAV.map((n) => `<a class="${n === 'Text to Speech' ? 'on' : ''}">${n}</a>`).join('');
  const script = VO_SCRIPT.map(([tag, txt]) => `<span class="el-s"><em>${tag}</em> <span class="w">${txt}</span></span>`).join(' ');
  const bars = PEAKS.map((p) => `<i style="height:${Math.max(6, p)}%"></i>`).join('');
  const el = html(`
  <div class="pane p-el">
    <aside class="el-side">
      <div class="el-brand"><span class="el-mark"></span><b>ElevenLabs</b></div>
      <div class="el-ws"><span class="on">Creative</span><span>Agents</span></div>
      <nav>${nav}</nav>
    </aside>
    <div class="el-main">
      <header class="el-top">Text to Speech</header>
      <div class="el-body">
        <div class="el-edit">
          <div class="el-ctx"><span class="file el-att"><svg viewBox="0 0 16 16"><path d="M4 1.5h5.5L13 5v9.5H4z M9.5 1.5V5H13"/></svg><b>assets.json</b><i>spot.mp3 slot</i></span><span>Script written from the site's headline and prices</span></div>
          <div class="el-text">${script}<i class="caret"></i></div>
          <div class="el-foot"><span class="el-count"><span class="n">0</span> / 5,000</span><span class="el-gen"><i class="spin"></i><span class="lbl">Generate speech</span></span></div>
        </div>
        <aside class="el-set">
          <div class="el-tabs"><b>Settings</b><span>History</span></div>
          <label>Voice</label>
          <div class="el-voice"><span class="orb"></span><span><b>Mark</b><em>Natural, conversational</em></span></div>
          <label>Model</label>
          <div class="el-sel">Eleven v3</div>
          <label>Stability</label>
          <div class="el-seg"><span>Creative</span><span class="on">Natural</span><span>Robust</span></div>
          <label>Speed</label>
          <div class="el-slider"><i style="width:55%"></i><b style="left:55%"></b></div>
        </aside>
      </div>
      <div class="el-player">
        <span class="el-play"><svg class="pl" viewBox="0 0 16 16"><path d="M5 3.5v9l7.5-4.5z"/></svg><svg class="pa" viewBox="0 0 16 16"><path d="M5 3.5v9M11 3.5v9"/></svg></span>
        <span class="el-who"><span class="orb sm"></span><span><b>Mark</b><em>Eleven v3</em></span></span>
        <span class="el-wave">${bars}<i class="head"></i></span>
        <span class="el-time"><span class="cur">0:00</span> / ${mmss(VO_DUR)}</span>
        <span class="file el-out"><svg viewBox="0 0 16 16"><path d="M8 2.5v8M4.5 7L8 10.5 11.5 7M3 13.5h10"/></svg><b>spot.mp3</b><i>0:10</i></span>
      </div>
    </div>
  </div>`);
  return {
    el,
    att: $(el, '.el-att'),
    ctx: $(el, '.el-ctx'),
    text: $(el, '.el-text'),
    sents: $$(el, '.el-s'),
    caret: $(el, '.el-text .caret'),
    count: $(el, '.el-count .n'),
    gen: $(el, '.el-gen'),
    player: $(el, '.el-player'),
    bars: $$(el, '.el-wave > i:not(.head)'),
    head: $(el, '.el-wave .head'),
    cur: $(el, '.el-time .cur'),
    out: $(el, '.el-out'),
  };
}

export function render(c, t) {
  show(c.ctx, t >= 0);
  enter(c.ctx, t, 0, 0.3, 6);
  // the script appears sentence by sentence as the agent writes it
  const k = seg(t, 0.15, 1.15);
  c.sents.forEach((s, i) => { s.style.opacity = easeOut(seg(k, i / c.sents.length, (i + 0.6) / c.sents.length)); });
  c.count.textContent = Math.round(SCRIPT_LEN * k);
  c.caret.style.opacity = k < 1 && Math.floor(t * 2.4) % 2 === 0 ? 1 : 0;
  const busy = t >= 1.25 && t < 1.95;
  c.gen.classList.toggle('busy', busy);
  c.gen.classList.toggle('press', t >= 1.2 && t < 1.32);
  $(c.gen, '.lbl').textContent = busy ? 'Generating' : 'Generate speech';
  $(c.gen, '.spin').style.transform = `rotate(${t * 600}deg)`;
  show(c.player, t >= 1.95);
  enter(c.player, t, 1.95, 0.3, 12);
  const grow = easeOut(seg(t, 1.95, 2.3));
  const vo = t - PLAY_AT;
  const played = vo > 0 ? Math.min(1, vo / VO_DUR) : 0;
  c.bars.forEach((b, i) => {
    b.style.transform = `scaleY(${grow})`;
    b.classList.toggle('on', i / c.bars.length < played);
  });
  c.head.style.left = `${played * 100}%`;
  c.head.style.opacity = vo >= 0 ? 1 : 0;
  c.player.classList.toggle('playing', vo >= 0 && vo < VO_DUR);
  c.cur.textContent = mmss(Math.max(0, Math.min(VO_DUR, vo)));
  c.sents.forEach((s, i) => s.classList.toggle('now', vo >= VO_SCRIPT[i][2] && vo < VO_SCRIPT[i][3]));
  c.out.classList.toggle('lit', t >= 3.4);
  enter(c.out, t, 3.3, 0.3, 6);
}

export const anchors = (c) => ({ in: c.att, out: c.out });
