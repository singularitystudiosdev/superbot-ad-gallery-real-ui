// Static extension state: index.html?ar=4x5|16x9&scene=ext-state&state=<api-top|api-keys|api-usage|api-docs|spend-allai|spend-week|models-spend|ios-home|ios-sheet|ios-connect|ios-composer>
// (the kit's own `?state=` only reads stage/snap/; this scene is the equivalent for stage/snap-ext/, used by capture/ext/compare-ext.mjs).
// `ios-*` states are the real iOS app screens (snap-ext/ios/*.png); add `&mask=0` for the unrounded screenshot (pixel proof).
// engine.js calls `m.default(SB)` synchronously, so the async loading happens at module top level (await) before the export is read.
import { ensureExt } from './ext-common.js'
const q = new URLSearchParams(location.search)
const name = q.get('state') || 'api-top'
const ios = name.startsWith('ios-')
await ensureExt(window.SB, ios ? [] : [name])
if (ios) await window.SB.iosPreload([name])
export default (SB) => ({ cycle: 4, preload: [], setup() { if (ios) { SB.iosStage(); SB.iosShow(name, { mask: q.get('mask') !== '0' }) } else SB.extState(name) }, beats: [] })
