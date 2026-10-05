// The one video and the two Test & compare rounds every beat reads, so a number on one screen is the same number on
// every other (Gemini's card, both thumbnail cards, Opus's read, both Studio rounds and Analytics > Reach).
// Everything here is made up for the spot: Sam Rivera, the channel, the video and its numbers.
export const ACCOUNT = 'Sam Rivera';
export const VIDEO = {
  title: 'The $40 Webcam That Beat My $400 One',
  len: '9:47',
  views: '48,210',
  views1: '91,530',
  ctr0: '3.9%',
  ctr1: '5.2%',   // after round 1 (B is the thumbnail for round 2's six days)
  ctr2: '6.4%',   // after round 2 (B2)
  link: 'youtu.be/w40v400cam',
  file: 'webcam-40-vs-400-final.mp4',
};
// [letter, what it is, image]
export const THUMBS = {
  A: ['A', 'Split screen, “$40 vs $400”', 'thumbs/A.jpg'],
  B: ['B', 'Sam with both webcams, “$40 WINS?”', 'thumbs/B.jpg'],
  C: ['C', 'Close-up of the two price tags', 'thumbs/C.jpg'],
  B2: ['B2', '“$40” in yellow, tighter face crop', 'thumbs/B2.jpg'],
  B3: ['B3', 'Webcam held closer to the lens', 'thumbs/B3.jpg'],
};
// the two rounds: thumbnails in slot order, watch time share (%) and the winner's slot
export const ROUNDS = {
  1: { ids: ['A', 'B', 'C'], share: [31.2, 47.3, 21.5], win: 1 },
  2: { ids: ['B', 'B2', 'B3'], share: [33.0, 44.8, 22.2], win: 1 },
};
export const DAYS = 6;
