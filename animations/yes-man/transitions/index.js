// the transitions/ directory: one file per extra effect, each default-
// exporting a TRX-shaped entry. timeline.js merges this map over its base
// transitions, so a file here wins on name collision.
import snap from './snap.js';
import blink from './blink.js';
import shutter from './shutter.js';
import typeOn from './type-on.js';
import lockupFirst from './lockup-first.js';
import aperture from './aperture.js';

export const EXTRA_TRX = {
  snap,
  blink,
  shutter,
  'type-on': typeOn,
  'lockup-first': lockupFirst,
  aperture,
};
