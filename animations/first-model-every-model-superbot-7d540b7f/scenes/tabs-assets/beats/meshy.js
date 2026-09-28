// Meshy beat: "Modeling the 3D assets." over a Meshy-style result grid: six real three.js models (the rider girl,
// her red city bike, a wooden house, a utility pole, a round tree, a fence) generate in a 3x2 grid of dark tiles.
// Each tile pops in as grey clay with a lime wireframe, a scan plane sweeps up and leaves the painted toon model
// behind while a % counter climbs, then it lands on a check and its real triangle count. Every model turntables at
// a constant angular speed from its appearance on, so the grid keeps turning while later beats land.
// One WebGL canvas overlays the grid and draws each tile through a scissor/viewport (tile rects come from the CSS
// constants below, never from layout reads). Pure function of t (scene-local time): the GL frame is redrawn only
// when t or the drawing-buffer size changes.
import { seg, clamp, lerp, outBack } from '../../../lib.js';
import { THREE, MODELS, C, canvasTex, toon, gradMap } from '../meshy/models.js';

const SAY = 'Modeling the 3D assets.';
// layout (design px) - keep in sync with meshy.css
const GW = 420, GAP = 6, COLS = 3, ROWS = 2, TW = (GW - GAP * (COLS - 1)) / COLS, VH = 108, LH = 22, TH = VH + LH;
const GH = ROWS * TH + GAP * (ROWS - 1);
// timing
const TILE0 = 0.12, STAG = 0.05, GEN0 = 0.03, GEN = 0.35, SPIN = 0.72; // rad/s
const ACCENT = '#c5f955';

const fmtTris = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));

export default {
  times(r) {
    const T = { r, say: r + 0.04, card: r + 0.08 };
    T.tile = MODELS.map((_, i) => r + TILE0 + i * STAG);
    T.gen = T.tile.map((a) => a + GEN0);
    T.done = T.gen.map((a) => a + GEN);
    T.allDone = T.done[T.done.length - 1];
    T.end = r + 1.1; // the beat window (chat.js chains the next chip from T.end)
    return T;
  },

  build(k, x) {
    const T = k.T;
    const say = x.sayEl(SAY);
    const card = x.el(`<div class="ms3-card">
      <div class="ms3-hd"><img class="ms3-logo" src="${x.brand('meshy-logo.svg')}" alt=""/><b>Meshy 6</b><span class="ms3-mode">Text to 3D</span><span class="ms3-cnt"><b class="ms3-n">0/6</b>${x.OK}</span></div>
      <div class="ms3-grid">
        ${MODELS.map((m) => `<div class="ms3-tile"><div class="ms3-view"></div><div class="ms3-lb"><span class="ms3-nm">${x.esc(m.name)}</span></div></div>`).join('')}
        <canvas class="ms3-gl"></canvas>
        <div class="ms3-ov">${MODELS.map((_, i) => {
          const c = i % COLS, rw = Math.floor(i / COLS);
          return `<div class="ms3-fx" style="left:${(c * (TW + GAP)).toFixed(2)}px;top:${rw * (TH + GAP)}px;width:${TW.toFixed(2)}px;height:${VH}px"><span class="ms3-st"><b class="ms3-pc">0%</b><b class="ms3-tr"></b>${x.OK}</span><i class="ms3-bar"><i></i></i></div>`;
        }).join('')}</div>
      </div>
    </div>`);
    const tiles = [...card.querySelectorAll('.ms3-tile')];
    const fxs = [...card.querySelectorAll('.ms3-fx')];
    const cnt = card.querySelector('.ms3-cnt'), cntN = card.querySelector('.ms3-n');
    const canvas = card.querySelector('.ms3-gl');
    const ui = tiles.map((tl, i) => {
      const f = fxs[i];
      return { tl, f, pc: f.querySelector('.ms3-pc'), tr: f.querySelector('.ms3-tr'), ok: f.querySelector('.qc-ok'), st: f.querySelector('.ms3-st'), bar: f.querySelector('.ms3-bar'), fill: f.querySelector('.ms3-bar i'), lastPc: -1, lastOn: null, lastOk: '', lastBar: '', lastFx: '' };
    });
    let lastCnt = '';

    // ---------- GL ----------
    let gl = null; // { renderer, camera, tiles: [{ scene, root, pivot, low, high, h, R, cy, tris, grid, shadow, scan, wireMat }] }
    let lastT = NaN, drawn = false, dirty = true, pr = 0, lastSite = null;
    const site = x.hub && (x.hub.closest('.sbsite') || x.hub);
    const siteW = () => (site ? site.style.width : '');
    const markDirty = () => { dirty = true; lastT = NaN; };
    addEventListener('resize', markDirty);
    addEventListener('archange', markDirty);

    function makeGL() {
      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setClearColor(0x000000, 0);
      renderer.autoClear = false;
      renderer.localClippingEnabled = true;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NoToneMapping;
      const camera = new THREE.PerspectiveCamera(26, TW / VH, 0.05, 60);

      const shadowTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(0,0,0,0.62)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const scanTex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, 'rgba(197,249,85,0.05)'); gr.addColorStop(0.72, 'rgba(197,249,85,0.22)'); gr.addColorStop(0.9, 'rgba(230,255,170,0.95)'); gr.addColorStop(1, 'rgba(197,249,85,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
      const gridVS = 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
      const gridFS = `uniform float uOp; uniform float uR; uniform float uCell; varying vec3 vP;
        void main(){ vec2 p = vP.xy / uCell; vec2 g = abs(fract(p - 0.5) - 0.5) / fwidth(p); float line = 1.0 - min(min(g.x, g.y), 1.0);
          float d = length(vP.xy) / uR; float fade = 1.0 - smoothstep(0.35, 1.0, d);
          gl_FragColor = vec4(vec3(0.62, 0.62, 0.68), line * fade * uOp * 0.34 + (1.0 - smoothstep(0.0, 1.0, d)) * uOp * 0.07); }`;

      const tl = MODELS.map((m, i) => {
        const scene = new THREE.Scene();
        scene.add(new THREE.HemisphereLight(C('#fff1e4'), C('#8a7c98'), 1.55));
        const sun = new THREE.DirectionalLight(C('#ffd2a4'), 2.0); sun.position.set(-2.2, 3.2, 2.6); scene.add(sun);
        const fill = new THREE.DirectionalLight(C('#b9c4ff'), 0.45); fill.position.set(2.5, 1.2, -1.5); scene.add(fill);
        const low = new THREE.Plane(new THREE.Vector3(0, -1, 0), 100);  // keeps y <= h: the finished model
        const high = new THREE.Plane(new THREE.Vector3(0, 1, 0), -100); // keeps y >= h: the clay pass
        const mats = [];
        const M = (color, opts = {}) => { const mt = toon(color, { ...opts, clippingPlanes: [low] }); mats.push(mt); return mt; };
        const model = m.build(M);
        // normalise: bottom on the floor, footprint centred, bounding sphere fitted
        const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
        const s = m.fit * Math.min(1.4 / size.y, 2.05 / Math.hypot(size.x, size.z));
        const norm = new THREE.Group(); norm.scale.setScalar(s); model.position.set(-ctr.x, -box.min.y, -ctr.z); norm.add(model);
        const pivot = new THREE.Group(); pivot.add(norm);
        const root = new THREE.Group(); root.add(pivot); scene.add(root);
        // the clay + wireframe pass: a clone of every mesh, clipped to the part the scan has not reached yet
        const clay = new THREE.MeshToonMaterial({ color: C('#aeb2ba'), gradientMap: gradMap(), clippingPlanes: [high], polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
        const wireMat = new THREE.MeshBasicMaterial({ color: C(ACCENT), wireframe: true, transparent: true, opacity: 0.2, depthWrite: false, clippingPlanes: [high] });
        let tris = 0;
        const meshes = []; model.traverse((o) => { if (o.isMesh) meshes.push(o); });
        for (const o of meshes) {
          const gm = o.geometry; tris += (gm.index ? gm.index.count : gm.attributes.position.count) / 3;
          o.add(new THREE.Mesh(gm, clay));
          const w = new THREE.Mesh(gm, wireMat); w.renderOrder = 2; o.add(w);
        }
        const H = size.y * s, Rf = Math.max(size.x, size.z) * s * 0.5;
        // floor: a fading grid disc and a soft contact shadow
        const grid = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uOp: { value: 1 }, uR: { value: 2.2 }, uCell: { value: 0.28 } }, vertexShader: gridVS, fragmentShader: gridFS }));
        grid.rotation.x = -Math.PI / 2; grid.renderOrder = -2; root.add(grid);
        const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
        shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.004; shadow.scale.set(Rf * 2.3 + 0.3, Rf * 2.3 + 0.3, 1); shadow.renderOrder = -1; root.add(shadow);
        // the scan plane: a glowing lime disc riding the clip height
        const scan = new THREE.Mesh(new THREE.CircleGeometry(1, 48), new THREE.MeshBasicMaterial({ map: scanTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
        scan.rotation.x = -Math.PI / 2; scan.scale.setScalar(Rf * 1.1 + 0.1); scan.renderOrder = 3; root.add(scan);
        return { scene, root, pivot, low, high, H, cy: H * 0.5, tris: Math.round(tris), grid, shadow, scan, wireMat, clay, mats };
      });
      tl.forEach((o, i) => { ui[i].tr.textContent = fmtTris(o.tris); });
      return { renderer, camera, tiles: tl };
    }

    function size() {
      const W = (window.AR && window.AR.w) || 1920;
      const stageScale = Math.min(innerWidth / W, innerHeight / 1080);
      // the chat is laid out at DW design px on .sbsite (tabs.js geo() writes its inline width on the scene's first
      // render and on every AR change) and scaled by W / DW inside the stage
      const hw = parseFloat(siteW()) || 0;
      const hubScale = hw ? W / hw : 1;
      const p = Math.min(Math.max((window.devicePixelRatio || 1) * stageScale * hubScale, 1), 2);
      if (p !== pr) {
        pr = p;
        gl.renderer.setPixelRatio(pr);
        gl.renderer.setSize(GW, GH, false);
        lastT = NaN; // the buffer was reallocated: redraw on the next render(t)
      }
      lastSite = siteW();
      dirty = false;
    }

    function draw(t) {
      const { renderer, camera } = gl;
      renderer.setScissorTest(false);
      renderer.clear(true, true, true);
      renderer.setScissorTest(true);
      gl.tiles.forEach((o, i) => {
        const a = T.tile[i];
        if (t < a) return;
        const c = i % COLS, rw = Math.floor(i / COLS);
        const vx = c * (TW + GAP), vy = GH - (rw * (TH + GAP) + VH);
        renderer.setViewport(vx, vy, TW, VH);
        renderer.setScissor(vx, vy, TW, VH);
        // appear: pop in; generate: the scan height climbs from the floor to the top
        const pop = outBack(seg(t, a, a + 0.24));
        const app = seg(t, a, a + 0.16);
        const p = seg(t, T.gen[i], T.done[i]);
        const e = 1 - (1 - p) * (1 - p);
        const sc = lerp(0.8, 1, pop);
        const h = p >= 1 ? 100 : lerp(-0.02, o.H * sc + 0.02, e);
        o.low.constant = h; o.high.constant = -h;
        o.pivot.scale.setScalar(sc);
        o.root.rotation.y = MODELS[i].a0 + SPIN * (t - a);
        o.wireMat.opacity = 0.2 * app * (1 - seg(t, T.done[i] - 0.1, T.done[i]));
        o.grid.material.uniforms.uOp.value = app;
        o.shadow.material.opacity = app;
        const scanOn = p > 0 && p < 1;
        o.scan.visible = scanOn;
        if (scanOn) { o.scan.position.y = h; o.scan.material.opacity = 0.8 * Math.min(1, 6 * p, 6 * (1 - p)); }
        // camera: slightly above, framing the fitted sphere around the model's middle
        const el = 0.3, d = 4.35;
        camera.position.set(0, o.cy + Math.sin(el) * d, Math.cos(el) * d);
        camera.lookAt(0, o.cy + 0.15, 0); // aimed a touch high: the model sits low, clear of the status pill
        renderer.render(o.scene, camera);
      });
      renderer.setScissorTest(false);
    }

    function renderGL(t) {
      if (!gl) return;
      // an inline-style read (no layout flush): tabs.js sizes .sbsite lazily, so follow its width when it lands
      if (dirty || siteW() !== lastSite) size();
      if (t === lastT) return;
      lastT = t;
      if (t < T.tile[0]) { if (drawn) { gl.renderer.clear(true, true, true); drawn = false; } return; }
      draw(t);
      drawn = true;
    }

    let ready = null;
    try {
      gl = makeGL();
      // compile every program once and draw a first frame after the nodes are in the DOM (layout for the hub read)
      ready = Promise.resolve().then(() => {
        try {
          dirty = true; size();
          draw(T.end);
          gl.renderer.clear(true, true, true); drawn = false; lastT = NaN;
        } catch (err) { console.warn('meshy beat: first frame failed', err); }
      }).catch(() => {});
    } catch (err) {
      console.warn('meshy beat: WebGL unavailable', err);
      gl = null;
      ready = Promise.resolve();
    }

    return {
      nodes: [say.n, card],
      marks: [[T.card, card]],
      ready,
      render(t) {
        say.render(t, T.say, 110);
        x.rise(card, t, T.card, 0.24, 8);
        let done = 0;
        ui.forEach((u, i) => {
          x.rise(u.tl, t, T.tile[i], 0.18, 0);
          const fx = t >= T.tile[i] ? clamp(seg(t, T.tile[i], T.tile[i] + 0.16)).toFixed(3) : '0';
          if (fx !== u.lastFx) { u.f.style.opacity = fx; u.lastFx = fx; }
          const p = seg(t, T.gen[i], T.done[i]);
          const on = t >= T.done[i];
          if (on) done++;
          if (on !== u.lastOn) { u.tl.classList.toggle('on', on); u.f.classList.toggle('on', on); u.lastOn = on; }
          const e = 1 - (1 - p) * (1 - p); // the scan's easing (draw() uses the same curve)
          const pc = on ? 100 : Math.min(99, Math.floor(e * 100));
          if (pc !== u.lastPc) { u.pc.textContent = `${pc}%`; u.lastPc = pc; }
          const bar = `scaleX(${e.toFixed(4)})`;
          if (bar !== u.lastBar) { u.fill.style.transform = bar; u.lastBar = bar; }
          const d = seg(t, T.done[i], T.done[i] + 0.2);
          const okT = on ? `scale(${(0.5 + 0.5 * Math.min(1.08, outBack(d))).toFixed(4)})` : 'scale(0.5)';
          if (okT !== u.lastOk) { u.ok.style.transform = okT; u.lastOk = okT; }
        });
        const c = done >= MODELS.length ? 'all' : `${done}/6`;
        if (c !== lastCnt) { cntN.textContent = c === 'all' ? '6 models' : c; cnt.classList.toggle('on', c === 'all'); lastCnt = c; }
        renderGL(t);
      },
    };
  },
};
