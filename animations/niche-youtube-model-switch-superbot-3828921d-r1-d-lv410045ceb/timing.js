// Every beat, in seconds. 32.0 s at 60 fps. Frame 0 is the still: superbot's home screen with the video attached and
// the ask typed. It sends at 0.5 s; the composer folds down to its dock while the ask rises into the thread. The chat
// never zooms and stays bottom-anchored like a real chat; each hand-off scrolls first, then the next switch pill lands
// above the composer, its check, the model's header and its card. YouTube connects the way the source spot shows it:
// Google's consent card in the thread, the pointer taps Continue, then a checklist card with a live Studio view, which
// grows to the full Studio page; superbot's pointer drives the upload dialog; the payoff is the new row, scheduled.
export const T = {
  // the home screen
  send: 0.5, hubOut: [0.55, 0.9], msgIn: 0.72,

  // Gemini 3.1 Pro
  sw1: 0.95, sw1ok: 1.25, who1: 1.3, card1: 1.85, watch: [2.1, 5.3],

  // Claude Opus 5.5: details.md grows line by line
  sw2: 5.65, sw2ok: 5.95, who2: 6.0, card2: 6.3, write: [6.45, 9.0], done2: 9.1, add: 9.5,

  // Nano Banana Pro: the 14:31 frame becomes the thumbnail; the status flips on the frame the image resolves
  sw3: 9.95, sw3ok: 10.25, who3: 10.3, card3: 10.6, gen: [10.85, 12.2],

  // YouTube Studio: the consent card under the spinning pill, held; Continue; then "connected" and the checklist
  sw4: 12.6, consent: 12.9, ptr: [13.65, 14.15], cont: 14.45, gcFade: [99, 99], sw4ok: 14.6, who4: 14.65,
  posted: 15.0, shotIn: 15.05, ticks: [15.25, 15.5, 15.8], grow: [16.05, 16.65],

  // YouTube Studio (studio.js), superbot's pointer doing each step; the title and description are pasted whole
  ptrIn: 17.25, title: [17.5, 17.51], desc: [17.95, 17.96],
  upDone: 18.0, processed: 18.3,
  tilesScroll: [18.35, 18.9], chipIn: 18.9, thumbIn: 19.1, thumbSel: 19.3, checksDone: 22.05,
  aud: [19.85, 20.25], audNo: 20.5, camMid: 20.6,
  nexts: [21.2, 21.95, 22.4], panes: [21.3, 22.05, 22.5],
  datePop: [22.9, 23.2, 23.35], timePop: [23.55, 23.9, 24.1],
  schedule: 24.45, close: 24.45, doneIn: [24.45, 24.57],
  doneClose: 25.65, doneOut: [25.7, 25.85], pull: [25.9, 26.7], push: [27.1, 27.8], rowHi: [27.6, 28.0],
  endIn: 29.4,
};

// the Studio camera, frame px: [t, focus x, focus y, scale]. Eased moves only: the whole Studio page as the view lands;
// in on the top of the dialog (title, description); down its lower half to the page's bottom edge (tiles, audience;
// superbot's chip sits in the page band under it); out to the whole dialog with its stepper for Next and Visibility;
// then (studio.js camKey) out to the whole Channel content page and in on the new row.
const FULL = [960, 540, 1];
const TOP = [966, 444, 1.4];
const BOTTOM = [966, 665, 1.3];
const MID = [966, 586.5, 1.22];
export const END = FULL;
export const ROW = [937, 344, 1.75];
export const CAM = [
  [16.05, ...FULL],
  [16.75, ...FULL],
  [17.35, ...TOP],
  [18.35, ...TOP],
  [18.9, ...BOTTOM],
  [20.6, ...BOTTOM],
  [21.1, ...MID],
];

export const CYCLE = 32.0;
