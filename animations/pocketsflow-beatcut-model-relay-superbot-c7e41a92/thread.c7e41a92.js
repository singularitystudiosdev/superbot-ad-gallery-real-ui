// Chat thread for the narrow column. Each block eases its own height open, fades and rises in;
// the column follows the newest block like the app's stick-to-bottom scroll.
// Switch pill and step rows follow superbot-desktop provider-switch.tsx as rebuilt in 2fe9583d.
import { h } from './shell.c7e41a92.js';
import { EASE, prog, lerp, spinDeg } from './ease.c7e41a92.js';

const spinSvg = () => '<svg class="ic spin" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
const checkSvg = () => '<svg class="ic ok" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>';
export const tileImg = (src, bg = '#232326') => `<span class="tile" style="background:${bg}"><img src="${src}" alt=""></span>`;

function statusMotion(t, done, spinEl, okEl) {
  spinEl.style.opacity = (1 - prog(t, done, 0.14, EASE.standard)).toFixed(3);
  spinEl.style.transform = `rotate(${spinDeg(t).toFixed(1)}deg)`;
  okEl.style.opacity = prog(t, done, 0.12, EASE.standard).toFixed(3);
  okEl.style.transform = `scale(${lerp(0.3, 1, prog(t, done, 0.3, EASE.outBack)).toFixed(4)})`;
}

export function userBubble(text) {
  return { el: h(`<div class="blk"><div class="ubub"><span>${text}</span></div></div>`) };
}

/** Assistant prose, revealed word by word from tIn (the app streams tokens). */
export function answer(html, tIn, wps = 22) {
  const el = h(`<div class="blk"><div class="ans">${html}</div></div>`);
  const words = [];
  const walk = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        for (const part of child.textContent.split(/(\s+)/)) {
          if (!part) continue;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else {
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            words.push(w);
            frag.appendChild(w);
          }
        }
        child.replaceWith(frag);
      } else walk(child);
    }
  };
  walk(el.firstElementChild);
  return {
    el,
    update(t) {
      words.forEach((w, i) => {
        w.style.opacity = prog(t, tIn + i / wps, 0.18, EASE.standard).toFixed(3);
      });
    },
  };
}

export function switchPill({ tile, a, b }, cue) {
  const el = h(`<div class="blk"><div class="pill">${tile}
<span class="lbl"><span class="a">${a}</span><span class="b" style="opacity:0">${b}</span></span>
<span class="st">${spinSvg()}${checkSvg()}</span></div></div>`);
  const tileEl = el.querySelector('.tile'), lbl = el.querySelector('.lbl');
  const la = el.querySelector('.lbl .a'), lb = el.querySelector('.lbl .b');
  const spinEl = el.querySelector('.st .spin'), okEl = el.querySelector('.st .ok');
  let wa = 0, wb = 0;
  return {
    el,
    measure() {
      wa = la.offsetWidth;
      wb = lb.offsetWidth;
    },
    update(t) {
      const pop = prog(t, cue.in + 0.05, 0.4, EASE.outBack);
      tileEl.style.transform = `scale(${lerp(0.5, 1, pop).toFixed(4)}) rotate(${lerp(-25, 0, pop).toFixed(2)}deg)`;
      const sweep = (((t - cue.in) % 1.4) + 1.4) % 1.4 / 1.4;
      la.style.webkitMaskPosition = `${(100 - sweep * 100).toFixed(2)}% 0`;
      la.style.opacity = (1 - prog(t, cue.done, 0.2, EASE.standard)).toFixed(3);
      lb.style.opacity = prog(t, cue.done + 0.08, 0.25, EASE.standard).toFixed(3);
      lbl.style.width = `${lerp(wa, wb, prog(t, cue.done, 0.35, EASE.outCubic)).toFixed(2)}px`;
      statusMotion(t, cue.done, spinEl, okEl);
    },
  };
}

export function stepRow({ run, done, detail }, cue) {
  const el = h(`<div class="blk in"><div class="step"><span class="g">${spinSvg()}${checkSvg()}</span>
<span class="sl"><span class="a">${run}</span><span class="b" style="opacity:0">${done}</span></span></div>${detail ? `<div class="det">${detail}</div>` : ''}</div>`);
  const sl = el.querySelector('.sl'), la = el.querySelector('.sl .a'), lb = el.querySelector('.sl .b');
  const spinEl = el.querySelector('.g .spin'), okEl = el.querySelector('.g .ok');
  let wa = 0, wb = 0;
  return {
    el,
    measure() {
      wa = la.offsetWidth;
      wb = lb.offsetWidth;
    },
    update(t) {
      const k = prog(t, cue.done, 0.3, EASE.standard);
      la.style.opacity = (1 - k).toFixed(3);
      lb.style.opacity = k.toFixed(3);
      sl.style.color = `rgb(${Math.round(lerp(230, 174, k))},${Math.round(lerp(232, 177, k))},${Math.round(lerp(238, 188, k))})`;
      sl.style.width = `${lerp(wa, wb, prog(t, cue.done, 0.35, EASE.outCubic)).toFixed(2)}px`;
      statusMotion(t, cue.done, spinEl, okEl);
    },
  };
}

/** A compact attachment row under a step (file, strip of thumbs, waveform...). */
export function attach(html, update) {
  const el = h(`<div class="blk in"><div class="att">${html}</div></div>`);
  return { el, update: update ? (t) => update(t, el) : undefined };
}

export function createThread(col, viewH) {
  const blocks = [];
  return {
    add(block, tIn, { gap = 12, dur = 0.42 } = {}) {
      col.appendChild(block.el);
      blocks.push({ ...block, tIn, gap, dur, hgt: 0 });
    },
    measure() {
      for (const b of blocks) {
        b.measure?.();
        b.hgt = b.el.offsetHeight;
      }
    },
    layout(t) {
      let y = 0;
      for (const b of blocks) {
        const open = prog(t, b.tIn, b.dur, EASE.outCubic);
        if (open <= 0) {
          b.el.style.visibility = 'hidden';
          continue;
        }
        y += b.gap * open;
        const a = prog(t, b.tIn + 0.04, b.dur * 0.8, EASE.standard);
        b.el.style.visibility = 'visible';
        b.el.style.opacity = a.toFixed(3);
        b.el.style.transform = `translateY(${(y + (1 - a) * 10).toFixed(2)}px)`;
        b.update?.(t);
        y += b.hgt * open;
      }
      const scroll = Math.max(0, y - viewH + 28);
      col.style.transform = `translateY(${(-scroll).toFixed(2)}px)`;
    },
  };
}
