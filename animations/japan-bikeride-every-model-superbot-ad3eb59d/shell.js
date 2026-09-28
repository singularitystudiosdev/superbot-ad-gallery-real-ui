// shell.js: the superbot mark for the end card. makeMark wraps assets/sb-mark-live (loaded by index.html) so the
// mascot's CSS idle loops (bob, breath, ears, the cyan/magenta RGB fringe) and its blinks are seeked from t instead
// of running on the wall clock: every frame is reproducible for the frame-exact render.

// ---------- the live mark, made deterministic ----------
/** makeMark(size) -> { el, render(t) }. The assets/sb-mark-live mascot, but frozen off the wall clock:
    its CSS loops are paused and seeked to t, and it blinks on a fixed schedule. Call render(t) per frame. */
export function makeMark(size = 16) {
  const host = document.createElement('span');
  host.className = 'sbx-markhost';
  host.style.cssText = `display:grid;place-items:center;width:${size}px;height:${size}px`;
  if (typeof window.sbMarkLive !== 'function') return { el: host, render() {} };
  const tmp = document.createElement('div');
  tmp.style.cssText = 'position:absolute;left:-9999px;top:0';
  document.body.appendChild(tmp);
  const live = window.sbMarkLive(tmp, { size, interactive: false });
  const wrap = live.wrap.cloneNode(true);
  live.destroy(); tmp.remove();
  host.appendChild(wrap);
  const eyes = [...wrap.querySelectorAll('.mark-eye')];
  const baseRy = eyes.map((e) => e.getAttribute('ry'));
  let anims = null, lastT = NaN;
  return {
    el: host,
    render(t) {
      if (t === lastT) return; lastT = t;
      if (!anims || !anims.length) anims = host.isConnected ? wrap.getAnimations({ subtree: true }) : null;
      if (anims) for (const a of anims) { try { a.pause(); a.currentTime = Math.max(0, t) * 1000; } catch (e) { /* ignore */ } }
      // blinks: a 0.12s shut every 3.6s (every third one a one-eye wink)
      const k = Math.floor(t / 3.6), ph = t - k * 3.6;
      const shut = ph > 2.2 && ph < 2.32;
      eyes.forEach((e, i) => e.setAttribute('ry', shut && !(k % 3 === 2 && i === 0) ? '1' : baseRy[i]));
    },
  };
}
