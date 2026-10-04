// thread-a (4.6 s): the superbot thread opens. Sam's ask lands at 0.15, then Gemini (ranks the comments, 5 rows),
// GPT-6 Astra (reads the 4:38 frame, the boom arm boxed) and Claude Opus 5.5 (the replies, Priya's pinned) answer in
// turn, each bubble in its model's colour and mark; the thread scrolls up as they land and holds to 4.6.
// The thread itself (DOM, strings, motion) is scenes/thread/thread.js, shared with thread-b.
import { threadScene } from './thread/thread.js?v=0311b486';

export default threadScene('thread-a', 4.6, { sam: 0.15, gemini: 1.15, astra: 2.3, opus: 3.4 });
