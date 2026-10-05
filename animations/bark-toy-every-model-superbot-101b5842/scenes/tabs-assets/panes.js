// The right-hand output pane: one window per routed model, showing the thing that model actually made.
// Mission-shaped: the pane is a frame; beats own the pixels inside their own view (beats/*.js call x.pane.el(id)).
// Only the swap between views is driven here (mountPane().show). Waveforms are drawn from measured peaks
// (assets/waveform.js), so the two ElevenLabs waveforms differ by the real loudness of the room noise.
import { WAVE } from '../../assets/waveform.js';

const img = (f) => new URL('../../assets/img/' + f, import.meta.url).href;
const brand = (f) => new URL('../../assets/brand/' + f, import.meta.url).href;

// a symmetric bar waveform: peaks 0..1 across n columns, drawn into a viewBox of w x h centred on h/2
export function waveBars(peaks, w = 400, h = 96, minH = 3) {
  const n = peaks.length, bw = w / n;
  return peaks.map((p, i) => {
    const bh = Math.max(minH, p * h * 0.92);
    return `<rect x="${(i * bw).toFixed(2)}" y="${((h - bh) / 2).toFixed(2)}" width="${(bw * 0.62).toFixed(2)}" height="${bh.toFixed(2)}" rx="1.4"/>`;
  }).join('');
}
export const waveSvg = (peaks, cls = 'wline', w = 400, h = 96) => `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" class="${cls}">${waveBars(peaks, w, h)}</svg>`;

const STARP = '<svg viewBox="0 0 24 24"><path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1.1 5.9L12 16.6l-5.3 2.8 1.1-5.9L3.5 9.4l5.9-.8Z"/></svg>';
const DOTS = '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>';
const BELL = '<svg viewBox="0 0 24 24"><path d="M6 10a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2.5 2.5 0 0 0 4 0"/></svg>';
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export function mountPane(root) {
  const host = document.createElement('div');
  host.id = 'outpane';
  const posts = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  host.innerHTML = `
  <div class="phead">
    <span class="ptile" id="ptile"></span>
    <b id="pname">DeepSeek V4 Flash</b><small id="psub">in superbot</small>
    <span class="pstat" id="pstat"><span class="pdot"></span><span id="pstatT">running</span></span>
  </div>
  <div class="pbody">
    <div class="view" id="v-ig">
      <div class="ig-top"><span class="ig-user">biscuit.loaf</span><span class="ig-ico">${BELL}${DOTS}</span></div>
      <div class="ig-head">
        <span class="ig-ava"><img src="${img('post-3.jpg')}" alt=""/></span>
        <div class="ig-stats">
          <div><b>312</b><span>posts</span></div>
          <div><b>18.4k</b><span>followers</span></div>
          <div><b>211</b><span>following</span></div>
        </div>
      </div>
      <div class="ig-bio"><b>biscuit · loaf mode</b> 🐾<br/><em>@biscuit.loaf</em> · corgi, 3y, professional splooter</div>
      <div class="ig-tabs"><span class="on">POSTS</span><span>REELS</span><span>TAGGED</span></div>
      <div class="ig-grid">
        ${posts.map((n, i) => `
        <div class="ig-cell" data-i="${i}"><img src="${img('post-' + n + '.jpg')}" alt=""/>
          <span class="ig-scan"></span><span class="ig-tag" hidden>${STARP}<span class="ig-tag-t">bark</span></span></div>`).join('')}
        <div class="ig-wall"><span class="pg"></span>logged out <s>· 41 reels behind the wall</s></div>
      </div>
      <div class="ig-count">
        <span class="ig-k"><b id="ig-c1">0</b><span>posts read</span></span>
        <span class="ig-k"><b id="ig-c2">0</b><span>reels opened</span></span>
        <span class="ig-k"><b id="ig-c3">0s</b><span>barking kept</span></span>
      </div>
    </div>

    <div class="view" id="v-el">
      <div class="el-wrap">
        <div class="el-card">
          <div class="el-lab"><b>Source</b> <span>reel_07.mp4 · 0:24</span><span class="tan">room noise</span></div>
          <div class="el-wave" id="el-in">${waveSvg(WAVE.noisy)}</div>
        </div>
        <div class="el-btn" id="el-go">Isolate voice</div>
        <div class="el-card">
          <div class="el-lab"><b id="el-out-lab">bark.wav</b> <span id="el-out-sub">8.2s · 44.1 kHz · mono</span><span class="tan" id="el-out-tan">clean</span></div>
          <div class="el-wave clean" id="el-out">${waveSvg(WAVE.clean, 'wline clean')}</div>
          <div class="el-spec" id="el-spec">
            <span class="el-spec-l">voice <b>184 Hz – 1.5 kHz</b></span>
            <span class="el-spec-b" id="el-spec-bars"></span>
            <span class="el-spec-l">noise floor <b>−38 dB</b></span>
          </div>
        </div>
        <div class="el-outs" id="el-clips">
          ${['one for the chip', 'excited', 'sleepy'].map((n, i) => `
          <div class="el-clip"><div class="el-top"><span class="el-play"><i></i></span>${n}</div>
            <div class="el-mini">${waveSvg(WAVE.clean.slice(i * 20, i * 20 + 60), 'wline', 120, 40)}</div></div>`).join('')}
        </div>
        <div class="el-steps" id="el-steps">
          ${[['Separating voice from the reel', 'Separated voice from the reel'],
             ['Stripping TV, traffic and the fridge', 'Stripped the room noise'],
             ['Trimming 12 barks', 'Trimmed 12 barks · 0.9s avg']].map(([a]) => `
          <div class="el-step"><span class="st"><i></i>${CHECK}</span><span class="el-t">${a}</span></div>`).join('')}
        </div>
        <div class="el-note" id="el-note"><span class="pchip green" style="display:none" id="el-ready">ready for the chip</span></div>
      </div>
    </div>

    <div class="view" id="v-gem">
      <div class="gem-wrap">
        <div class="gem-prompt" id="gem-prompt"><b>Nano Banana Pro</b> · image <span id="gem-ar">16:9</span> · <span id="gem-res">2K</span></div>
        <div class="gem-shot" id="gem-shot">
          <img src="${img('turnaround.jpg')}" alt="toy turnaround"/>
          <span class="gem-sweep" id="gem-sweep"></span>
          <span class="gem-gen" id="gem-gen"><i></i>Creating image</span>
        </div>
        <div class="gem-meta">
          <span class="pchip" id="gem-size">2752 × 1536 · 2K</span>
          <span class="pchip" id="gem-text">4 angles · same markings ✓</span>
          <span class="gem-sw" style="background:#E09A5E"></span><span class="gem-sw" style="background:#F6EFE3"></span><span class="gem-sw" style="background:#1B1B1B"></span>
        </div>
        <div class="gem-crops" id="gem-crops">
          ${['FRONT', '3/4', 'SIDE', 'BACK'].map((n) => `<div class="c"><span>${n}</span></div>`).join('')}
        </div>
      </div>
    </div>

    <div class="view" id="v-bl">
      <div class="bl-top"><b>Blender</b><span>File</span><span>Edit</span><span>Add</span><span>Object</span>
        <span class="bl-mode"><span class="bl-pill">Object Mode</span><span class="bl-pill">Cycles · GPU</span><b id="bl-frame">001</b></span></div>
      <div class="bl-side">
        <span class="bl-tool on"><svg viewBox="0 0 24 24"><path d="M6 3.5v19.2l4.9-4.6 3.1 7.1 3.4-1.5-3.1-7h6.8z"/></svg></span>
        <span class="bl-tool"><svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/></svg></span>
        <span class="bl-tool"><svg viewBox="0 0 24 24"><path d="M5 5h14v14H5z"/></svg></span>
        <span class="bl-tool"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg></span>
      </div>
      <div class="bl-view">
        <span class="bl-sheet" id="bl-img"></span>
        <span class="bl-sheet bl-wire" id="bl-wire"></span>
      </div>
      <div class="bl-n">
        <h4>Scene</h4>
        <div class="bl-r"><span>Verts</span><b id="bl-verts"></b></div>
        <div class="bl-r"><span>Triangles</span><b id="bl-tris"></b></div>
        <div class="bl-r"><span>Non-manifold</span><b class="bl-ok" id="bl-nm">0</b></div>
        <div class="bl-r"><span>Watertight</span><b class="bl-ok" id="bl-water">✓</b></div>
        <div class="bl-r"><span>Size, mm</span><b id="bl-size"></b></div>
        <div class="bl-r"><span>Speaker cavity</span><b id="bl-cav"></b></div>
        <div class="bl-r"><span>File</span><b id="bl-file"></b></div>
      </div>
      <div class="bl-bot"><span id="bl-mode">Rotate 0.0°</span>
        <span class="bl-frames" id="bl-frames">${Array.from({ length: 16 }, (_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</span>
        <span class="bl-print" id="bl-print"><span>3D-Print Toolbox · all checks passed</span></span>
      </div>
    </div>

    <div class="view" id="v-code">
      <div class="cd-tabs"><span class="on">bark.ino</span><span>pins.h</span><span>platformio.ini</span></div>
      <span class="cd-badge" id="cd-badge" style="opacity:0">${CHECK}compiled · 342 kB flash</span>
      <div class="cd-code" id="cd-code"></div>
      <div class="cd-term" id="cd-term"></div>
    </div>

    <div class="view" id="v-order">
      <div class="or-wrap" id="or-wrap">
        <div class="or-card">
          <div class="or-head">3D print · full colour <span class="or-tag">2 pieces</span></div>
          <div class="or-hero">
            <span class="or-shot"><img src="${img('hero.jpg')}" alt=""/></span>
            <div>
              <div class="or-what"><b>Biscuit the corgi</b><br/>full-colour print, 88 mm, colours from the turnaround</div>
              <div class="or-spec">
                <span class="pchip">watertight STL</span><span class="pchip" id="or-cavchip">cavity for the speaker</span><span class="pchip">paw button</span>
              </div>
            </div>
          </div>
        </div>
        <div class="or-card" style="padding-bottom:8px">
          <div class="or-lines">
            <div class="or-line"><span>Biscuit the corgi · 88 mm</span><span>2 × $29.00</span></div>
            <div class="or-line"><span>Bark chip · bark.wav preloaded</span><span>2 × $6.50</span></div>
            <div class="or-line"><span>Shipping</span><span>$4.20</span></div>
            <div class="or-line tot"><span>Total</span><span>$75.20</span></div>
          </div>
          <div class="or-btn"><span class="or-b" id="or-a">Place order</span><span class="or-b" id="or-b" style="opacity:0">${CHECK}Ordered!</span><span class="or-shine" id="or-shine"></span></div>
        </div>
        <div class="or-steps" id="or-steps">
          ${['printed', 'chip flashed', 'shipped'].map((n, i) => `${i ? '<span class="or-arrow"></span>' : ''}<span class="or-step" data-i="${i}"><span class="d"></span>${n}</span>`).join('')}
        </div>
      </div>
      <div class="fina" id="or-fina" style="opacity:0"><div class="or-fina">
        <div class="or-big"><img src="${img('hero.jpg')}" alt=""/><span class="or-rings" id="or-rings"><i></i><i></i><i></i></span>
          <div class="or-cap"><b>Biscuit, 88 mm.</b><small>press the paw, he barks</small></div></div>
      </div></div>
    </div>
  </div>`;
  root.appendChild(host);

  const views = {};
  host.querySelectorAll('.view').forEach((v) => { views[v.id.slice(2)] = v; });
  const el = (sel) => host.querySelector(sel);
  const pane = {
    host, views,
    el: (id) => views[id],
    q: (id, sel) => views[id].querySelector(sel),
    // the routed model owns the header; chat.js keeps it in step with the routing pill
    head(name, sub, tile, done) {
      el('#ptile').innerHTML = tile;
      el('#pname').textContent = name;
      el('#psub').textContent = sub || '';
      el('#pstat').classList.toggle('ready', !!done);
      el('#pstatT').textContent = done ? 'done' : 'running';
    },
    // pure swap: a tool switch is a hard cut. No CSS transition, so seek(t) can never land mid-fade.
    show(id) { pane.current = id; for (const k in views) { views[k].style.opacity = k === id ? '1' : '0'; views[k].style.zIndex = k === id ? 3 : 1; } },
    current: null,
    icons: { CHECK, STARP },
  };
  pane.show('ig');
  return pane;
}