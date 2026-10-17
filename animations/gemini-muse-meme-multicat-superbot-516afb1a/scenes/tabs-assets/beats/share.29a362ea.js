// The Share control every output card carries: in an artifact frame's header a square, glyph-only twin of the outlined
// Expand button (chat.css .bk-share), and over a generated image a twin of its download disc, sitting just left of it
// (chat.css .qc-share). The glyph is Gemini's own share stroke (reveals/gemini.9e82faf1.js ICONS.share). The markup is
// static, so a frozen frame (?t=) shows it like any other control; a card that fades its download disc in fades this
// one with it. One delegated click listener serves every card: it hands the output's file to the share sheet when the
// browser can take files (Web Share API Level 2, navigator.canShare({ files })), else shares the output's link, else
// copies the link and flags the control "Link copied" for a moment (chat.css .is-copied).
// Import it as './share.29a362ea.js' with no query string, so every beat shares one module and one listener.
import { esc } from '../../../lib.9b47fc30.js';

export const SHARE_GLYPH = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4"/><path d="M8 8l4-4 4 4"/><path d="M5 12v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>';

const COPIED_MS = 1600;

// `what` names the output, for the accessible label and the share sheet's title; `file` is its asset URL (an image, a
// video, a song) when there is a file to hand over, `url` the link to share instead of this page (variant included)
export const shareAttrs = (what, { file = '', url = '' } = {}) =>
  `aria-label="Share ${esc(what)}" title="Share" data-share="${esc(what)}"${file ? ` data-share-file="${esc(file)}"` : ''}${url ? ` data-share-url="${esc(url)}"` : ''}`;

export const shareBtn = (what, opts) => `<button type="button" class="bk-btn bk-share" ${shareAttrs(what, opts)}>${SHARE_GLYPH}</button>`;
export const shareDisc = (what, opts) => `<button type="button" class="qc-share" ${shareAttrs(what, opts)}>${SHARE_GLYPH}</button>`;

// Safari drops the click's user activation across a slow await, so the file is fetched when the pointer or focus
// reaches the control and the click finds it ready
const files = new Map();
const fileFor = (href) => {
  const abs = new URL(href, location.href).href;
  if (!files.has(abs)) {
    files.set(abs, fetch(abs).then(async (res) => {
      if (!res.ok) throw new Error(`share: ${abs} answered ${res.status}`);
      const blob = await res.blob();
      return new File([blob], new URL(abs).pathname.split('/').pop(), { type: blob.type });
    }));
  }
  return files.get(abs);
};
const warm = (e) => {
  const href = e.target.closest?.('[data-share-file]')?.dataset.shareFile;
  if (href) fileFor(href).catch((err) => console.error('share: could not prefetch', href, err));
};

async function share(btn) {
  const title = btn.dataset.share;
  const url = new URL(btn.dataset.shareUrl || location.href, location.href).href;
  try {
    if (btn.dataset.shareFile && navigator.canShare) {
      const file = await fileFor(btn.dataset.shareFile);
      if (navigator.canShare({ files: [file] })) return await navigator.share({ files: [file], title });
    }
    if (navigator.share) return await navigator.share({ title, url });
  } catch (err) {
    if (err.name === 'AbortError') return; // the share sheet was dismissed: the person chose not to share
    console.error('share: falling back to copying the link', err);
  }
  await navigator.clipboard.writeText(url);
  btn.classList.add('is-copied');
  setTimeout(() => btn.classList.remove('is-copied'), COPIED_MS);
}

addEventListener('pointerover', warm);
addEventListener('focusin', warm);
addEventListener('click', (e) => {
  const btn = e.target.closest?.('[data-share]');
  if (!btn) return;
  e.preventDefault();
  share(btn).catch((err) => console.error('share: could not share or copy the link', err));
});
