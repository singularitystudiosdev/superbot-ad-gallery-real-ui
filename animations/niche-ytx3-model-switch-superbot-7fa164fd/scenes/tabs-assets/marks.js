// marks.js: the one clock of ytx3's story scene (scenes/tabs.js), in seconds of the spot (the scene starts at t = 0,
// so scene time IS spot time). Every beat module reads its marks from here, so a retime is one edit.
//
//   B1 0.00-0.55  the superbot hub: the ask has just landed ("Make 3 thumbnails for my next video and test them in
//                 Studio", the video attached) and superbot's pill "Racing 3 image models" lands under it
//   B2 0.55-3.25  the race: three framed panes, one per model (img/models.json), chips switching in a stagger, the
//                 three resolve sequences (media/resolve-{a,b,c}) playing in parallel with per-pane progress; superbot
//                 picks slot b (ring + Winner) and the other two dim but stay
//   B3 3.25-4.80  YouTube Studio > Content in a framed window: the winner flies into the new video's row, replacing the
//                 auto frame; "A/B test running" lands on the row; the A/B Test report opens briefly
//   B4 4.80-5.55  the watch page in a framed window, the player clip (media/player) playing
//   B5 5.55-6.80  the superbot end card (timeline.js)
// The storyboard asked for 0.60 / 3.10 / 4.60 / 5.50; the cuts move by at most 0.2 s (B2 -0.05, B3 +0.15, B4 +0.2,
// B5 +0.05) so all three sequences have finished before the pick (the last one, FLUX.2 Pro, finishes at 2.75), the pick
// reads before the cut, and the A/B Test report holds after the in-window camera has settled. The cycle stays 6.80 s.
export const FPS = 30;
export const B1 = 0, B2 = 0.55, B3 = 3.25, B4 = 4.80, B5 = 5.55, END = 6.80;

// B1: the hub
export const ASK = {
  text: 'Make 3 thumbnails for my next video and test them in Studio',
  pillIn: 0.16,       // superbot's pill lands
  out: [0.36, 0.56],  // the hub pushes on and fades as the race comes up
};

// B2: the race
export const RACE = {
  in: [0.44, 0.64],                 // the header rises in (over the hub's fade: no dip to black)
  pane: [0.46, 0.54, 0.62],         // each pane rises in (0.30 s), a stagger
  chipDone: [0.76, 0.88, 1.00],     // each chip's spinner resolves to its check (the model switch)
  seq0: 0.58,                       // the three resolve sequences start together (frame 1 at seq0)
  pick: 2.82,                       // superbot picks slot b: ring, Winner, the other two dim
  line: 2.94,                       // "Testing all 3 in YouTube Studio" lands
  out: [3.10, 3.26],                // panes a/c, header and line fade; pane b's image is handed to the flyer
};

// B3: Studio
export const STUDIO = {
  in: [3.14, 3.38],     // the Studio window fades up as the panes clear
  fly: [3.22, 3.80],    // the winner flies from pane b into the row's thumbnail slot
  chip: [3.86, 4.02],   // "A/B test running" lands on the row
  zoomOut: [4.00, 4.22],// the in-window camera eases back from the row to the whole page
  dlg: [4.20, 4.40],    // the A/B Test report rises in over Studio's scrim, once the camera has settled
  out: [4.66, 4.80],    // Studio slides away just before the watch page comes up (no double exposure)
};
export const CHIME = STUDIO.fly[1]; // the base's two-tone chime (its only sound) lands with the winner

// B4: the watch page
export const WATCH = {
  in: [4.74, 4.92],
  play0: 4.52,          // the clip's frame 1 time: B4 opens on frame 7 of shot 1, the cut to shot 2 (frame 19) lands at 5.12
};

// the slot whose thumbnail superbot picks (img/models.json recommendedWinner)
export const WINNER = 'b';
