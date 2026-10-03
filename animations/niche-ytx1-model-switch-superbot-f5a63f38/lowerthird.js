// lowerthird.js: the broadcast lower-third and the superbot corner bug (styles in lowerthird.css).
// makeLowerThird(parent, name, line) builds one strap; .render(lt) draws it at lt seconds into its cut.
// The wipe-in runs over the first ~8 frames (0.27 s at 30 fps): the accent block grows up first, the name bar wipes
// out to the right behind it, the action bar follows two frames later, each line of type sliding in with its bar.
import { seg, outCubic, outQuint } from './lib.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function makeLowerThird(parent, name, line) {
  const el = document.createElement('div');
  el.className = 'lt';
  el.innerHTML = `<div class="lt-acc"></div><div class="lt-body">
    <div class="lt-name"><span>${esc(name)}</span></div>
    <div class="lt-line"><span>${esc(line)}</span></div></div>`;
  parent.appendChild(el);
  const acc = el.querySelector('.lt-acc');
  const nameBar = el.querySelector('.lt-name'), nameTx = nameBar.querySelector('span');
  const lineBar = el.querySelector('.lt-line'), lineTx = lineBar.querySelector('span');
  const wipe = (bar, tx, p) => {
    bar.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(3)}% 0 0)`;
    tx.style.transform = `translateX(${(-(1 - p) * 36).toFixed(2)}px)`;
  };
  return {
    el,
    /** lt: seconds since the cut started; visible = whether this cut is on screen */
    render(lt, visible = true) {
      el.style.display = visible ? 'flex' : 'none';
      if (!visible) return;
      const a = outCubic(seg(lt, 0, 0.1));            // frames 0-3: the accent block
      acc.style.transform = `scaleY(${Math.max(a, 0.0001).toFixed(4)})`;
      wipe(nameBar, nameTx, outQuint(seg(lt, 0.033, 0.234)));  // frames 1-7
      wipe(lineBar, lineTx, outQuint(seg(lt, 0.1, 0.3)));      // frames 3-9
    },
  };
}

/** the network bug, top right: the superbot tile and wordmark (static; a bug never moves) */
export function makeBug(parent) {
  const el = document.createElement('div');
  el.className = 'bug';
  el.innerHTML = '<img src="brand/tile.svg" alt=""><b>superbot</b>';
  parent.appendChild(el);
  return el;
}
