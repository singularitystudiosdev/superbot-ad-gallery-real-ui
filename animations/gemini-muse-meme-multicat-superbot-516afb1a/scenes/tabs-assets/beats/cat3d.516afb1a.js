// The multicat variant's 3D viewer (beats/multicat.516afb1a.js): one WebGL canvas drawing the Meshy cat on a turntable,
// playing the model's own animation clip when it carries one (the walk the rig was keyed with). draw({ spin, time }) is a
// pure function of its argument: `spin` turns the turntable (radians), `time` is the clip time in seconds (the mixer is
// set to it, never advanced by a clock), so a frozen ?t= frame always shows the same pose. Built on the 3D variant's
// zombie viewer (zombie3d.9e82faf1.js): same framing, tone mapping and parallel shader linking, with a neutral studio fill
// in place of the zombie's green one. three.js loads on first use; `ready` settles once the first frame is drawn.
const CSS_W = 560, CSS_H = 350; // the artifact frame's view (bakery.005f5570.css .bk-view)
const PIXEL_RATIO = 2.5;  // stays crisp under the stage scale and the camera push
const FOV = 28;
const VIEW_H = 1.2;       // world units visible top to bottom at least; the model is normalised to 1 unit tall
const EXPOSURE = 1.05, ENV = 1.0;

export function makeCatViewer(canvas, url) {
  let paint = null, want = null, lastKey = '';
  const draw = (s) => {
    want = s;
    if (!paint) return;
    const key = `${s.spin.toFixed(4)}|${s.time.toFixed(4)}`;
    if (key === lastKey) return;
    lastKey = key;
    paint(s);
  };
  const ready = setup(canvas, url).then((fn) => { paint = fn; if (want) draw(want); });
  ready.catch((e) => console.error('3D cat viewer failed to load', e));
  return { ready, draw };
}

async function setup(canvas, url) {
  const THREE = await import('three');
  const { GLTFLoader } = await import('../../../vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);

  // sized before the context exists, as the zombie viewer does (a resize after it reallocates the preserved buffer)
  canvas.width = Math.floor(CSS_W * PIXEL_RATIO);
  canvas.height = Math.floor(CSS_H * PIXEL_RATIO);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.setClearColor(0x000000, 0);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = studio(THREE);
  await linkPmrem(THREE, renderer, pmrem, room);
  const scene = new THREE.Scene();
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  scene.environmentIntensity = ENV;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xfff1e0, 2.0);
  key.position.set(1.5, 2.5, 2.5);
  const rim = new THREE.DirectionalLight(0xc9dcff, 1.8);
  rim.position.set(-2, 1.5, -2.5);
  scene.add(key, rim);

  // the model, 1 unit tall, feet on y = 0, centred on the turntable's axis (measured in its bind pose)
  const model = gltf.scene;
  model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material.map) o.material.map.anisotropy = 8; } });
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const k = 1 / size.y;
  const holder = new THREE.Group();
  holder.add(model);
  holder.scale.setScalar(k);
  holder.position.set(-centre.x * k, -box.min.y * k, -centre.z * k);

  // the clip, set to an absolute time per frame (mixer.setTime), so a pose is a function of `time` alone
  const clip = gltf.animations[0] || null;
  const mixer = clip ? new THREE.AnimationMixer(model) : null;
  if (mixer) mixer.clipAction(clip).play();

  const reach = Math.hypot(Math.max(size.x, size.z) / 2, Math.min(size.x, size.z) / 2) * k;
  // a long body casts a long shadow: it sits under the body's footprint and turns with it
  const turntable = new THREE.Group();
  turntable.add(holder, contactShadow(THREE, size.x * k * 1.1, size.z * k * 1.7));
  scene.add(turntable);

  const aspect = CSS_W / CSS_H;
  const viewH = Math.max(VIEW_H, (2 * reach * 1.1) / aspect);
  const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.01, 50);
  camera.position.set(0, viewH * 0.42, viewH / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2))));
  camera.lookAt(0, viewH * 0.36, 0);

  // link the programs in parallel and upload the maps one per frame while the card is still hidden (zombie3d.9e82faf1.js)
  if (mixer) mixer.setTime(0);
  await renderer.compileAsync(scene, camera);
  const maps = new Set();
  scene.traverse((o) => { if (o.isMesh) for (const v of Object.values(o.material)) if (v?.isTexture) maps.add(v); });
  for (const map of maps) {
    renderer.initTexture(map);
    await new Promise(requestAnimationFrame);
  }

  return ({ spin, time }) => {
    if (mixer) mixer.setTime(Math.max(0, time));
    turntable.rotation.y = spin;
    renderer.render(scene, camera);
  };
}

// PMREM's programs linked in parallel first, under the state fromScene renders with (zombie3d.9e82faf1.js linkPmrem; the
// _setSize / _allocateTargets internals are the vendored three r186's)
async function linkPmrem(THREE, renderer, pmrem, room) {
  pmrem._setSize(256);
  const target = pmrem._allocateTargets();
  const quad = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3));
  const filters = new THREE.Scene();
  filters.add(new THREE.Mesh(quad, pmrem._blurMaterial), new THREE.Mesh(quad, pmrem._ggxMaterial));
  renderer.setRenderTarget(target);
  const linked = Promise.all([renderer.compileAsync(room, new THREE.PerspectiveCamera()), renderer.compileAsync(filters, new THREE.OrthographicCamera())]);
  renderer.setRenderTarget(null);
  await linked;
  target.dispose();
  quad.dispose();
}

// a small neutral studio for PMREM: a warm softbox front-right, a cool strip behind-left, a bright ceiling, a soft white fill
function studio(THREE) {
  const s = new THREE.Scene();
  const room = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 14), new THREE.MeshBasicMaterial({ color: 0x2c2c30, side: THREE.BackSide }));
  room.position.y = 4;
  s.add(room);
  const lamp = (col, power, w, h, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(power) }));
    m.position.set(x, y, z);
    m.lookAt(0, 1.5, 0);
    s.add(m);
  };
  lamp(0xfff0dd, 14, 4, 3, 4, 5, 5);      // key softbox
  lamp(0xc9dcff, 9, 1.2, 6, -6, 3, -3);    // cool rim strip
  lamp(0xffffff, 3, 6, 6, 0, 8.8, 0);      // ceiling bounce
  lamp(0xf2efe8, 2.2, 8, 3, 0, 1, 6.6);    // soft fill from the front
  return s;
}

function contactShadow(THREE, w, d) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  return shadow;
}
