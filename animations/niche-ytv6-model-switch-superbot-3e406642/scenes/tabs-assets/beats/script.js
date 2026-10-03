// The script for Sam's next Short, written by Claude Opus 5.5 from this week's top five comments: the ONE source of
// its text. The script board (beats/script-board.js) streams each line beside the comment it comes from, YouTube
// Studio (beats/studio.js) shows the new Short's title and description and burns the lines in as the posted Short's
// captions. Never retype a line anywhere else: import SCRIPT / SHORT from here.
// `from` is the commenter's full name, exactly as watch.js TOP has it (the board reads the comment itself from TOP).
// Line 3 is the frame GPT-6 Astra read at 4:38 (frame.js VERDICT: a low-profile boom arm, the mic mounted underneath).
export const SCRIPT = [
  { label: 'Hook', from: 'Priya Nair', text: 'Small room, no foam on the walls? Buy the $49 dynamic. It ignores most of the room echo.' },
  { label: 'Line 2', from: 'Marco Ruiz', text: 'Blind test: so many of you picked the $29 mic. My editor did too.' },
  { label: 'Line 3', from: 'Lena Fischer', text: 'That boom arm is low-profile, with the mic mounted underneath. Link in the description.' },
  { label: 'Line 4', from: 'Tom Hale', text: 'And yes, the USB mic beat the XLR ones. It surprised me too.' },
  { label: 'Outro', from: 'Dee Okafor', text: 'Headsets are next, since half of you stream on them.' },
];

// the posted Short
export const SHORT = {
  title: 'Your top mic questions this week, answered',
  desc: 'Every line comes from your comments.',
};
