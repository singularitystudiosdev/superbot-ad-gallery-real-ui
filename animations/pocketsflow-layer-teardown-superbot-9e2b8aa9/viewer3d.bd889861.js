// viewer3d: the media card's 3D surface, superbot-desktop main's Model3dView (packages/ui/src/components/viewer/
// Model3dView.tsx + model3d-scene.ts) rebuilt on the same three.js calls: a 40deg camera framed by fitCamera's
// three-quarter direction (1, .65, 1.25) at radius / sin(fov/2) x 1.15, a hemisphere light (#fff over #3a3b40, 1.1)
// and a key light (1.6 at 4, 8, 6), a GridHelper (span x 2.5, #3a3b40 / #1e1e21 at .6) under the model, sRGB out,
// on the pane's --color-rail. The foot reads `N tri · W × H × D` like the viewer's stats line. The orbit is the
// viewer's autoRotate, driven by the ad's clock instead of requestAnimationFrame, so every frame is a pure
// function of t.
import * as THREE from 'three';
import { GLTFLoader } from './vendor/three/loaders/GLTFLoader.js';

const fmtCount = (n) => Math.round(n).toLocaleString('en-US');
const fmtLen = (n) => (Math.round(n * 10) / 10).toFixed(1);

export function mountViewer(host, url, fallback, opts = {}) {
  // no WebGL (a locked-down iframe, a GPU blocklist): the card keeps a still of the model, the spot keeps running
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); }
  catch (err) {
    console.error('[viewer3d] WebGL unavailable, showing the still:', err && err.stack ? err.stack : err);
    if (fallback) host.insertAdjacentHTML('beforeend', `<img src="${fallback}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain"/>`);
    return { ready: Promise.reject(err), render() {}, get stats() { return ''; } };
  }
  renderer.setPixelRatio(opts.pr || 2);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 1000);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x3a3b40, 1.1);
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(4, 8, 6);
  scene.add(hemi, key);

  const target = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const state = { ready: false, stats: '', w: 0, h: 0, last: '' };

  const ready = new GLTFLoader().loadAsync(url).then((gltf) => {
    const obj = gltf.scene;
    scene.add(obj);
    const bounds = new THREE.Box3().setFromObject(obj);
    const size = bounds.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.z, 1);
    const grid = new THREE.GridHelper(span * 2.5, Math.max(10, Math.min(60, Math.round(span * 2.5))), 0x3a3b40, 0x1e1e21);
    grid.position.set((bounds.min.x + bounds.max.x) / 2, bounds.min.y - 0.001, (bounds.min.z + bounds.max.z) / 2);
    grid.material.transparent = true;
    grid.material.opacity = 0.6;
    if (opts.grid !== false) scene.add(grid);
    // fitCamera (model3d-scene.ts): the bounds' sphere with a little air, from the three-quarter direction
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.5);
    const distance = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov) / 2)) * 1.15;
    target.copy(sphere.center);
    offset.copy((opts.dir ? new THREE.Vector3(...opts.dir) : new THREE.Vector3(1, 0.65, 1.25)).normalize()).multiplyScalar(distance * (opts.dist || 1));
    camera.near = Math.max(distance / 100, 0.01);
    camera.far = distance * 20;
    let tris = 0;
    obj.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry;
      tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    });
    state.stats = `${fmtCount(tris)} tri · ${fmtLen(size.x)} × ${fmtLen(size.y)} × ${fmtLen(size.z)}`;
    state.ready = true;
  }).catch((err) => {
    console.error('[viewer3d] the model failed to load:', err && err.stack ? err.stack : err);
    throw err;
  });

  // angle: radians the orbit has turned about the target's vertical axis
  function render(angle) {
    if (!state.ready) return;
    const w = Math.max(1, host.clientWidth), h = Math.max(1, host.clientHeight);
    if (w !== state.w || h !== state.h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      state.w = w; state.h = h; state.last = '';
    }
    const key = angle.toFixed(4);
    if (key === state.last) return;
    state.last = key;
    const p = offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
    camera.position.copy(target).add(p);
    camera.lookAt(target);
    renderer.render(scene, camera);
  }
  return { ready, render, canvas: renderer.domElement, get stats() { return state.stats; } };
}
