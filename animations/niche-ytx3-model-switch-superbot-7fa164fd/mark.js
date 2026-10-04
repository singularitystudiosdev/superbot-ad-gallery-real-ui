// mark.js: superbot's live mark (assets/sb-mark-live.js), made deterministic for a film. Lifted unchanged from the
// original ad's shell.js makeMark (the rest of that file, the desktop app window, is not used by this cut).

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
