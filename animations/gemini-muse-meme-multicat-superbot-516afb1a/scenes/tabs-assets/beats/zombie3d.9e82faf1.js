// The 3D variant's model viewer: one WebGL canvas drawing the finished zombie (a Meshy 7.1 generation, models/zombie-meshy.4490ac01.glb) on a
// turntable. draw({ spin }) is a pure function of its argument: `spin` turns the turntable (radians). The model is
// always whole and solid; how it arrives is the beat's job (gemini.9b47fc30.js resolves the canvas the way the
// 1-image card resolves its image). three.js loads on first use, so the image variants never pay for it; `ready`
// settles once the first frame is drawn.
const CSS_W = 560, CSS_H = 350; // the artifact frame's view (bakery.005f5570.css .bk-view), so the camera push frames it the same
const PIXEL_RATIO = 2.5;  // stays crisp under the stage scale and the camera push
const FOV = 28;
const VIEW_H = 1.34;      // world units visible top to bottom at least; the model is normalised to 1 unit tall
const EXPOSURE = 1.0, ENV = 0.9;
const RIM = 0xa8c7fa;

export function makeZombieViewer(canvas, url) {
  let paint = null, want = null, lastKey = '';
  const draw = (s) => {
    want = s;
    if (!paint) return;
    const key = s.spin.toFixed(4);
    if (key === lastKey) return;
    lastKey = key;
    paint(s);
  };
  const ready = setup(canvas, url).then((fn) => { paint = fn; if (want) draw(want); });
  ready.catch((e) => console.error('3D zombie viewer failed to load', e));
  return { ready, draw };
}

async function setup(canvas, url) {
  const THREE = await import('three');
  const { GLTFLoader } = await import('../../../vendor/three/examples/jsm/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(url);

  // the drawing buffer is sized before the context exists: setPixelRatio() and setSize() after it would reallocate the
  // multisampled, preserved buffer twice (once at 2.5x the canvas), a 35-120 ms main-thread stall on load
  canvas.width = Math.floor(CSS_W * PIXEL_RATIO);
  canvas.height = Math.floor(CSS_H * PIXEL_RATIO);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = EXPOSURE;
  renderer.setClearColor(0x000000, 0);

  // image-based light for the PBR maps (metalness, roughness, normals): a small studio baked once through PMREM
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = studio(THREE);
  await linkPmrem(THREE, renderer, pmrem, room);
  const scene = new THREE.Scene();
  scene.environment = pmrem.fromScene(room, 0.03).texture;
  scene.environmentIntensity = ENV;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
  key.position.set(1.5, 2.5, 2.5);
  const rim = new THREE.DirectionalLight(RIM, 2.4);
  rim.position.set(-2, 1.5, -2.5);
  scene.add(key, rim);

  // the model, 1 unit tall, feet on y = 0, centred on the turntable's axis
  const model = gltf.scene;
  model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; if (o.material.map) o.material.map.anisotropy = 8; } });
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3()), centre = box.getCenter(new THREE.Vector3());
  const k = 1 / size.y;
  model.scale.setScalar(k);
  model.position.set(-centre.x * k, -box.min.y * k, -centre.z * k);

  // the turntable's reach: the widest the model swings from its axis (arms out), so the framing holds at every angle
  const reach = Math.hypot(Math.max(size.x, size.z) / 2, Math.min(size.x, size.z) / 2) * k;
  const turntable = new THREE.Group();
  turntable.add(model);
  scene.add(turntable, contactShadow(THREE, reach));

  // fit: the model's own height, widened if its reach would crowd the card's sides
  const aspect = CSS_W / CSS_H;
  const viewH = Math.max(VIEW_H, (2 * reach * 1.12) / aspect);
  const camera = new THREE.PerspectiveCamera(FOV, aspect, 0.01, 50);
  camera.position.set(0, viewH * 0.45, viewH / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2))));
  camera.lookAt(0, viewH * 0.35, 0);

  // link the scene's programs in parallel and upload its maps one per frame now, while the card is still hidden: left
  // to the first draw, the link wait and the 2048px uploads land as one stall the moment the card does
  await renderer.compileAsync(scene, camera);
  const maps = new Set();
  scene.traverse((o) => { if (o.isMesh) for (const v of Object.values(o.material)) if (v?.isTexture) maps.add(v); });
  for (const map of maps) {
    renderer.initTexture(map);
    await new Promise(requestAnimationFrame);
  }

  return ({ spin }) => {
    turntable.rotation.y = spin;
    renderer.render(scene, camera);
  };
}

// fromScene() links each of its programs (the studio's front- and back-sided basic materials, the blur and the GGX
// filter) on first use, synchronously: the main thread and the GPU process, which also composites the page, wait out
// every link. Link them in parallel first (KHR_parallel_shader_compile through compileAsync) under the state fromScene
// renders with: its half-float target, meshes with a position attribute. _setSize and _allocateTargets are
// PMREMGenerator internals of the vendored three r186; they build the blur and GGX materials fromScene then reuses.
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

// a small studio for PMREM: a big warm softbox up front-right, a cool strip behind-left, a bright ceiling, a dim green fill
function studio(THREE) {
  const s = new THREE.Scene();
  const panel = (w, h, d, col, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: new THREE.Color(col) }));
    m.position.set(x, y, z);
    s.add(m);
    return m;
  };
  const room = new THREE.Mesh(new THREE.BoxGeometry(14, 10, 14), new THREE.MeshBasicMaterial({ color: 0x2a2c33, side: THREE.BackSide }));
  room.position.y = 4;
  s.add(room);
  const lamp = (col, power, w, h, x, y, z) => {
    const m = panel(w, h, 0.1, col, x, y, z);
    m.material.color.multiplyScalar(power);
    m.lookAt(0, 1.5, 0);
  };
  lamp(0xfff0dd, 14, 4, 3, 4, 5, 5);      // key softbox
  lamp(0xa8c7fa, 10, 1.2, 6, -6, 3, -3);   // cool rim strip
  lamp(0xffffff, 3, 6, 6, 0, 8.8, 0);      // ceiling bounce
  lamp(0x8a9a78, 1.6, 8, 3, 0, 1, 6.6);    // dim sickly fill from the front
  return s;
}

function contactShadow(THREE, reach) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(0,0,0,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2.2, reach * 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  return shadow;
}
