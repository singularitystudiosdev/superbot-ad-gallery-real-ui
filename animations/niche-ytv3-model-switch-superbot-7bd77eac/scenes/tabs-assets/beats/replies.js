// The replies superbot writes as the creator (Claude Opus 5.5), the ONE source of their text: the reply board
// (beats/pairs.js) streams them beside the comments they answer, and YouTube Studio (beats/studio.js) shows them nested
// under each comment and in the pinned close-up. Exact, unchanged from the base ad's replies.md (Lena's line is the
// frame GPT-6 Astra read, frame.js VERDICT). Never retype a reply anywhere else: import REPLY from here.
export const REPLIES = `Priya: The $49 dynamic. It ignores most of the room
echo, you can hear it side by side at 7:05.

Marco: My editor fell for the $29 one too. It's the
sleeper of the whole video.

Lena: Low-profile boom arm, mic mounted underneath.
Linked it in the description.

Dee: Headsets are already on the list. They're next.

Tom: Same here, the USB one surprised me most.`;

// each reply as one line of prose, by the commenter's first name
export const REPLY = Object.fromEntries(REPLIES.split('\n\n').map((b) => {
  const s = b.replace(/\n/g, ' ');
  const i = s.indexOf(': ');
  return [s.slice(0, i), s.slice(i + 2)];
}));
