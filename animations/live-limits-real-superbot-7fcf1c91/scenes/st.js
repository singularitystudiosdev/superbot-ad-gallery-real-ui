// st: static inspection scene. ?scene=st&state=<name>[&overlay=<name>]
import { ensureExt } from './ext-common.js'
await ensureExt(window.SB, [])
const q = new URLSearchParams(parent.location.search)
export default (SB) => ({ cycle: 4, preload: [q.get('state') || 'hero', 'usage', 'accounts'], setup() { SB.state(q.get('state') || 'hero') }, beats: q.get('overlay') ? [{ at: 0, run() { SB.overlayOpen(q.get('overlay')) } }] : [] })
