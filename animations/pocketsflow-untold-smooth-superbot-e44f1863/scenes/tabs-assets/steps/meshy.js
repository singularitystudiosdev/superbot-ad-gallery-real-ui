// Step 2, Meshy 7.1: image to 3D. Meshy's own workspace (dark, lime, Barlow): the attached mascot as the input, and a
// live three.js viewport on the REAL generated model (img/gen/mascot.glb, 50,000 triangles, PBR textures). The mesh
// builds top-down under a sweeping clip plane with its wireframe (img/gen/mascot-wire.glb) lit, the texture then blends in
// over the clay, and the view switch slides Wireframe -> Clay -> Textured in step. The turntable angle, the clip
// height, the blend and the overlay are all functions of lt, so any frozen frame is exact.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { seg, lerp, clamp, inOutSine, inOutCubic, outExpo } from '../../../lib.js';

const VW = 445, VH = 236, RES = 2.6;         // viewport in design px, and its backing-store scale
const GEN = [0.35, 2.15], TEX = [2.25, 3.35]; // mesh build, then texture blend
const FACES = '50,000';

export default {
  id: 'meshy', app: 'meshy', model: 'Meshy 7.1', logo: 'meshy-icon.svg', dur: 4.6,
  summary: `mascot.glb, ${FACES} triangles, PBR textures`,

  build({ img, brand, el }) {
    const n = el(`<div class="me">
  <div class="me-hd"><img src="${brand('meshy-icon.svg')}" alt=""/><b>Meshy</b><span class="me-crumb">Image to 3D</span><span class="me-badge">Meshy 7.1</span></div>
  <div class="me-bar"><i></i></div>
  <div class="me-bd">
    <div class="me-vp"><canvas></canvas>
      <div class="me-st"><i class="me-spin"></i><svg class="me-ok" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span class="me-stl">Generating mesh</span><em>0%</em></div>
      <figure class="me-inp"><img src="${img('gen/mascot-attach.jpg')}" alt=""/><figcaption>Input</figcaption></figure>
      <div class="me-seg"><i class="me-hl"></i><span>Wireframe</span><span>Clay</span><span>Textured</span></div>
    </div>
    <div class="me-opts"><span><i>Topology</i>Triangle</span><span><i>Polycount</i>${FACES}</span><span><i>Texture</i>PBR</span><span><i>Symmetry</i>Auto</span></div>
  </div>
</div>`);
    const canvas = n.querySelector('canvas');
    const ui = { bar: n.querySelector('.me-bar i'), stl: n.querySelector('.me-stl'), pct: n.querySelector('.me-st em'), spin: n.querySelector('.me-spin'), ok: n.querySelector('.me-ok'), hl: n.querySelector('.me-hl'), segs: [...n.querySelectorAll('.me-seg span')], last: '' };

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1);
    renderer.setSize(VW * RES, VH * RES, false);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.localClippingEnabled = true;
    const scene = new THREE.Scene();
    scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
    const camera = new THREE.PerspectiveCamera(26, VW / VH, 0.01, 50);
    const key = new THREE.DirectionalLight(0xffffff, 2.1); key.position.set(2, 3, 4); scene.add(key);
    const rim = new THREE.DirectionalLight(0xdfffb0, 1.2); rim.position.set(-3, 2, -3); scene.add(rim);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x202020, 0.55));
    const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);  // keeps y > -constant: the head builds first
    const pivot = new THREE.Group(); scene.add(pivot);
    const blend = { value: 0 }, clay = { value: 0.1 };
    let mesh = null, wire = null, H = 1, lastKey = '';

    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const ready = Promise.all([loader.loadAsync(img('gen/mascot.glb')), loader.loadAsync(img('gen/mascot-wire.glb'))]).then(([g, w]) => {
      const root = g.scene;
      const box = new THREE.Box3().setFromObject(root), size = box.getSize(new THREE.Vector3()), ctr = box.getCenter(new THREE.Vector3());
      root.position.sub(ctr); pivot.add(root); H = size.y;
      root.traverse((o) => { if (o.isMesh) mesh = o; });
      const mat = mesh.material;
      mat.clippingPlanes = [clip];
      // clay -> texture: one uniform mixes Meshy's grey clay into the real base colour
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uTex = blend; sh.uniforms.uClay = clay;
        sh.fragmentShader = 'uniform float uTex;\nuniform float uClay;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n diffuseColor.rgb = mix(vec3(uClay), diffuseColor.rgb, uTex);');
      };
      let wg = null; w.scene.traverse((o) => { if (o.isMesh) wg = o.geometry; });
      wire = new THREE.Mesh(wg, new THREE.MeshBasicMaterial({ color: 0xc9ff6c, wireframe: true, transparent: true, opacity: 0, clippingPlanes: [clip], depthWrite: false }));
      wire.scale.setScalar(1.004);
      mesh.add(wire);
      const fit = size.y / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.set(0, size.y * 0.06, fit * 1.12);
      camera.lookAt(0, size.y * 0.03, 0);
    }).catch((e) => { console.error('meshy.js: model load failed', e); });

    return {
      el: n, ready,
      render(lt) {
        if (!mesh || lt < -0.3 || lt > 6) return;
        const g = inOutSine(seg(lt, GEN[0], GEN[1])), tx = inOutSine(seg(lt, TEX[0], TEX[1]));
        // turntable: one steady drift (no stops), a hair of tilt
        pivot.rotation.y = -0.75 + 0.42 * lt;
        pivot.rotation.x = 0.04;
        clip.constant = lerp(-H * 0.56, H * 0.52, g);
        // dark while the wireframe builds, matte grey clay once it drops, then the real texture blends in
        clay.value = lerp(0.07, 0.42, inOutSine(seg(lt, GEN[1] - 0.15, GEN[1] + 0.3)));
        wire.material.opacity = 0.8 * seg(lt, GEN[0], GEN[0] + 0.3) * (1 - inOutSine(seg(lt, GEN[1] - 0.15, GEN[1] + 0.3)));
        blend.value = tx;
        const k = `${lt.toFixed(4)}`;
        if (k !== lastKey) { renderer.render(scene, camera); lastKey = k; }

        const done = lt >= TEX[1];
        const label = lt < TEX[0] ? 'Generating mesh' : done ? 'Ready' : 'Texturing';
        const pct = lt < TEX[0] ? Math.round(100 * seg(lt, GEN[0], GEN[1])) : Math.round(100 * seg(lt, TEX[0], TEX[1]));
        const txt = `${label}|${done ? '' : pct + '%'}`;
        if (txt !== ui.last) { ui.stl.textContent = label; ui.pct.textContent = done ? '' : `${pct}%`; ui.last = txt; }
        const okp = outExpo(seg(lt, TEX[1], TEX[1] + 0.4));
        ui.spin.style.opacity = (1 - okp).toFixed(3);
        ui.spin.style.transform = `rotate(${(lt * 400).toFixed(1)}deg)`;
        ui.ok.style.opacity = okp.toFixed(3);
        ui.bar.style.transform = `scaleX(${clamp(0.62 * seg(lt, GEN[0], GEN[1]) + 0.38 * seg(lt, TEX[0], TEX[1])).toFixed(4)})`;
        // the view switch: Wireframe while building, Clay as the wires drop, Textured as the colour lands
        const pos = inOutCubic(seg(lt, GEN[1] - 0.1, GEN[1] + 0.25)) + inOutCubic(seg(lt, TEX[0] + 0.45, TEX[0] + 0.8));
        ui.hl.style.transform = `translate3d(${(pos * 100).toFixed(2)}%,0,0)`;
        ui.segs.forEach((s, i) => { s.style.color = Math.abs(pos - i) < 0.5 ? '#0e0e0e' : '#9a9a9a'; });
      },
    };
  },
};
