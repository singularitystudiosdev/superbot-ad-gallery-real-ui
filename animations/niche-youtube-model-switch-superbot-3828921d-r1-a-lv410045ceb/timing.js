// Every beat time in the spot, in seconds. Frame 0 is the still: the ask and the Gemini switch spinning, centred.
// focus pushes are [in-start, in-end, out-start, out-end]: the camera eases in on a card so it reads on a phone.
export const CYCLE = 9.95;
export const T = {
  // Gemini 3.1 Pro: the switch lands first, then its line and card; it watches the video (the playhead ticks the
  // moments viewers ask about and where the video answers Priya), counts through the comments and ranks the top 5
  sw1ok: 0.28, who1: 0.34, card1: 0.42, watch: [0.5, 1.05], read: [0.66, 1.6],
  gemRows: [1.25, 1.33, 1.41, 1.49, 1.57], gemPush: [1.62, 1.9, 2.1, 2.3],
  // Claude Opus 5.5: the switch, the replies written in the code panel, the pin decision, superbot presses Post all
  sw2: 2.3, sw2ok: 2.62, who2: 2.68, card2: 2.76, write: [2.92, 4.02], done: 4.15, post: 4.5, cxPush: [3.0, 3.3, 4.36, 4.62],
  // YouTube Studio: connected, the 5 replies posted, Priya's comment pinned, held
  sw3: 4.68, sw3ok: 4.98, who3: 5.04, posted: [5.12, 5.26, 5.4], tick: 0.1, postPush: [5.06, 5.4, 99, 99],
  // container transform: the checklist card grows into the full-frame watch page (its text fades out first, the
  // page's fades in after), opened on the pinned thread
  // Material fade-through to the watch page: the chat fades out fast, the whole page fades in settling from 0.96x
  chatOut: [6.2, 6.33], pageIn: [6.3, 6.6], ytPush: [6.6, 7.9],
  endIn: 8.8,
};
// the thread's scroll, [time, stop]: held between equal stops, eased between different ones
export const SCROLL = [[0, 's0'], [0.3, 's0'], [0.8, 'sA'], [1.25, 'sA'], [1.7, 's1'], [2.2, 's1'], [2.62, 's2'], [2.76, 's2'], [3.3, 's3'], [4.62, 's3'], [5.0, 's4']];
