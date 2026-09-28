// The source that streams past in the Opus 5.5 coding beat: plausible three.js (TypeScript) for the bike ride.
// Model files are the Meshy GLBs; audio and textures are the files DeepSeek scraped. Lines kept under ~56 columns (the card's width).
export const SCENE = `import * as THREE from 'three';
import { toonRamp } from './materials/toon';

const SKY = 'textures/sunset-sky.jpg'; // Poly Haven HDRI

export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;

  // sunset: painted sky, peach fog over the paddies
  const scene = new THREE.Scene();
  const sky = new THREE.TextureLoader().load(SKY);
  sky.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = scene.environment = sky;
  scene.fog = new THREE.Fog(0xf2b99a, 40, 220);

  const sun = new THREE.DirectionalLight(0xffd2a1, 2.4);
  sun.position.set(-60, 28, -90);
  sun.castShadow = true;
  scene.add(sun, new THREE.HemisphereLight(0xffe4c8, 0x5b6e3a));

  const camera = new THREE.PerspectiveCamera(42, 16 / 9);
  const gradientMap = toonRamp([0.35, 0.7, 1]);
  return { renderer, scene, camera, sun, gradientMap };
}`;

export const ASSETS = `import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toonify } from './materials/toon';

const MODELS = {
  rider: 'models/rider_girl.glb',
  bike: 'models/city_bike.glb',
  house: 'models/wood_house.glb',
  pole: 'models/utility_pole.glb',
  tree: 'models/round_tree.glb',
  fence: 'models/wood_fence.glb',
} as const;

export async function loadAssets(ramp: THREE.Texture) {
  const loader = new GLTFLoader();
  const loaded = await Promise.all(
    Object.entries(MODELS).map(async ([name, url]) => {
      const gltf = await loader.loadAsync(url);
      gltf.scene.traverse((o) => toonify(o, ramp));
      return [name, gltf.scene] as const;
    }),
  );
  return Object.fromEntries(loaded) as Assets;
}`;

export const RIDER = `import { solveLegIK, pedalPoint } from './ik';

const WHEEL_R = 0.33, GEAR = 2.4, CRANK = 0.17;

export class Rider {
  crank = 0;
  constructor(private bike: Object3D, private girl: Object3D) {}

  update(dt: number, speed: number) {
    const spin = (speed / WHEEL_R) * dt;
    this.part('wheel_front').rotation.x -= spin;
    this.part('wheel_back').rotation.x -= spin;
    this.crank += spin / GEAR;
    this.part('crank').rotation.x = -this.crank;
    for (const side of [0, 1]) {
      const a = this.crank + side * Math.PI;
      const foot = pedalPoint(a, CRANK);
      solveLegIK(this.girl, side, foot, 0.42, 0.44);
    }
    // a small bob with each pedal stroke
    this.girl.position.y = 0.96 + Math.sin(this.crank * 2) * 0.012;
    this.bike.rotation.z = Math.sin(this.crank) * 0.015;
  }
}`;

export const WORLD = `import { Reflector } from 'three/addons/objects/Reflector.js';

export function buildWorld(scene: THREE.Scene, a: Assets) {
  const dirt = tex('textures/dirt-road.jpg', 1, 40);
  const road = new THREE.Mesh(
    new THREE.PlaneGeometry(ROAD_W, ROAD_LEN, 1, 64),
    new THREE.MeshToonMaterial({ map: dirt }),
  );
  road.rotation.x = -Math.PI / 2;
  scene.add(road);

  // rice paddies: shallow water that mirrors the sky
  for (const side of [-1, 1]) {
    const paddy = new Reflector(new THREE.PlaneGeometry(90, ROAD_LEN), {
      color: 0x8fb0a6, textureWidth: 512, textureHeight: 512,
    });
    paddy.rotation.x = -Math.PI / 2;
    paddy.position.set(side * (ROAD_W / 2 + 46), -0.08, 0);
    scene.add(paddy);
  }

  // utility poles down the road, wires strung between them
  for (let z = 0; z < ROAD_LEN; z += POLE_GAP) {
    const pole = a.pole.clone();
    pole.position.set(ROAD_W / 2 + 2.4, 0, -z);
    scene.add(pole);
  }
  scene.add(stringWires(POLE_GAP, ROAD_LEN, 0.6));
}`;

export const AUDIO = `const MIX = [
  { src: 'audio/cicadas.mp3', gain: 0.35, loop: true },
  { src: 'audio/koto-phrase.mp3', gain: 0.4, loop: true },
  { src: 'audio/furin-chime.mp3', gain: 0.22, loop: true },
  { src: 'audio/bicycle-bell.mp3', gain: 0.5, loop: false },
];

export async function startAudio(listener: THREE.AudioListener) {
  const loader = new THREE.AudioLoader();
  return Promise.all(MIX.map(async ({ src, gain, loop }) => {
    const sound = new THREE.Audio(listener);
    sound.setBuffer(await loader.loadAsync(src));
    sound.setLoop(loop).setVolume(gain);
    if (loop) sound.play();
    return sound;
  }));
}

// ring the bell as the rider passes a house
export function ringBell(bell: THREE.Audio) {
  if (!bell.isPlaying) bell.play();
}`;

// the terminal: npm run build, ending green
export const BUILD = [
  ['$', 'npm run build'],
  ['', '> ride@0.1.0 build'],
  ['', '> tsc --noEmit && vite build'],
  ['', ''],
  ['', 'vite v6.3.5 building for production...'],
  ['ok', '14 modules transformed.'],
  ['out', 'dist/index.html', '0.52 kB'],
  ['out', 'dist/assets/index-Bq3kT9.js', '648.20 kB'],
  ['done', 'built in 1.62s'],
];
export const BUILT = 'Built in 1.6s';
