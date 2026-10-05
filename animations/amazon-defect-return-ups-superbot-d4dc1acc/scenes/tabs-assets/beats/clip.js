// The attached 0:08 clip as a thumbnail: its first frame, a play glyph and the length badge. The composer attachment
// and the sent message both use this one markup, sized by their holder (.vc-t / .vc-u).
import { CLIP } from './returns.js';

export const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5Z"/></svg>';

export function clipThumbHTML(img, cls = '') {
  return `<span class="vc-th ${cls}"><img src="${img('clip1.jpg')}" alt=""/><i class="vc-play">${PLAY}</i><em class="vc-len">${CLIP.len}</em></span>`;
}
