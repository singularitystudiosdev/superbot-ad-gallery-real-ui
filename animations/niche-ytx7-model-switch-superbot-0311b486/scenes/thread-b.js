// thread-b (1.1 s): back in the same thread after the replies landed on YouTube. Everything thread-a left is in
// place (scrolled up), and the Nano Banana Pro bubble lands at 0.15 with the community post image resolving from
// blur to sharp (resolved by 0.7), then holds. Shared thread code: scenes/thread/thread.js.
import { threadScene } from './thread/thread.js?v=0311b486';

export default threadScene('thread-b', 1.1, { sam: -10, gemini: -10, astra: -10, opus: -10, nbp: 0.15 });
