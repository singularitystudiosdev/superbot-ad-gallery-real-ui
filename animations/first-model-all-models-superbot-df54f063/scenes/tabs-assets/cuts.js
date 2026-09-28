// first-model-all-models: the chat's copy and the hand-off contract with the clip scene. One ask, three hand-offs in a
// fixed order: Meshy models the ride, DeepSeek scrapes its textures and ambient audio, Opus 5.5 codes it, and the
// output window opens on the ride. timeline.js reads CFG.end (the end card's word).
export const CFG = {
  pace: 1,
  end: 'superbot',
  ask: 'Make a Japanese relaxing biking demo',
  say: {
    mesh: 'Modeling the ride in 3D: 4 assets.',
    scrape: 'Textures and ambient sound for the ride.',
    code: 'Coding the ride in three.js.',
  },
};

// the tabs scene is exactly this long; its last half second pushes into the output window's 16:9 screen until the
// screen's height is the frame's height times CLIP.S0, and the clip scene opens on that framing (a hard cut)
export const TABS_DUR = 7.0;

// the clip (gen/clip.mp4, 1920x1080) and its framing. The clip plays at full frame height (cover-cropped at 4:5 and
// 4:3, exact at 16:9). FOCUS_X is the fraction of the video's width held at the frame's centre (the rider), clamped
// per frame width so the video always covers the frame. S0 is the scale the hand-off lands on; the clip then settles
// on in to S0 * SETTLE over SETTLE_T seconds (outCubic), and the push lands with that settle's opening speed.
export const CLIP = {
  VW: 1920, VH: 1080,
  FOCUS_X: 0.43, // the rider rides at x 0.35 to 0.44 of the excerpt's width (sampled every second, 0 to 6.4 s)
  S0: 1.01,
  SETTLE: 1.04,
  SETTLE_T: 1.6,
};
const H = 1080;
/** the clip frame at stage width W and scale s (1 = full height): its size and the video x held at the frame centre */
export function clipFrame(W, s = CLIP.S0) {
  const fw = CLIP.VW * (H / CLIP.VH) * s, fh = H * s;
  const half = W / 2 / fw;                       // the frame's half width, as a fraction of the video's width
  const fx = Math.min(1 - half, Math.max(half, CLIP.FOCUS_X));
  return { fw, fh, fx };
}
/** log-scale speed (1/s) the clip's settle opens with; the tabs push lands with it so the cut carries the motion */
export const SETTLE_V0 = (3 * Math.log(CLIP.SETTLE)) / CLIP.SETTLE_T;
