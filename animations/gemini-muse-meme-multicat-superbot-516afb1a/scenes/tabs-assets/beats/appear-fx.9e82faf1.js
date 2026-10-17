// What the 10-image variant's beat (gemini.9b47fc30.js) needs from the appear machinery besides the reveal modules
// (reveals/index.9e82faf1.js, one per platform, each drawing its own whole UI; the Default grid lands through
// thumb-land.309eb9c5.js):
//  - gateImages: a frozen ?t= capture waits on __AD.ready (loads.9e82faf1.js), so a reveal module's tile images are tracked
//    until they have loaded and (in a frozen capture) settled; a failed load settles too and is logged. loads.9e82faf1.js
//    gateTiles does the work, and says why it never calls img.decode().
import { gateTiles } from '../../../loads.9e82faf1.js';

export function gateImages(imgs) {
  // decode-free, and in a frozen ?t= capture the tiles are held out of the first paint until they have settled: see gateTiles in loads.9e82faf1.js
  gateTiles(imgs);
}
