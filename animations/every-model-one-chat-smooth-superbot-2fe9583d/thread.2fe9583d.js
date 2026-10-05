// Thread blocks and their layout. Each block eases its own height open (so the column never jumps),
// then fades and rises in; the column follows the newest block like the app's stick-to-bottom scroll.
// Switch pill, nest rail, steps, media, live and gallery embeds follow superbot-desktop's
// provider-switch.tsx / live-embed.tsx / gallery-embed.tsx and the switch motion tokens.
import { icon } from './icons.2fe9583d.js';
import { h } from './shell.2fe9583d.js';
import { EASE, prog, lerp, spinDeg } from './ease.2fe9583d.js';

const VIEW_H = 639;
const PAD = 28;

const spinSvg = (cls = 'spin') => `<svg class="ic ${cls}" viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;
const checkSvg = () => `<svg class="ic ok" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>`;

/** Spinner fades (140 ms) as the check pops from 0.3 on out-back (300 ms): switch-spin-fade / switch-check. */
function statusMotion(t, done, spinEl, okEl) {
  spinEl.style.opacity = (1 - prog(t, done, 0.14, EASE.standard)).toFixed(3);
  spinEl.style.transform = `rotate(${spinDeg(t).toFixed(1)}deg)`;
  okEl.style.opacity = prog(t, done, 0.12, EASE.standard).toFixed(3);
  okEl.style.transform = `scale(${lerp(0.3, 1, prog(t, done, 0.3, EASE.outBack)).toFixed(4)})`;
}

export function userBubble(text) {
  return { el: h(`<div class="blk ubub"><span>${text}</span></div>`), rise: 14 };
}

export function switchPill({ tile, a, b }, cue) {
  const el = h(`<div class="blk"><div class="pill"><span class="tile">${tile}</span>
<span class="lbl"><span class="a">${a}</span><span class="b" style="opacity:0">${b}</span></span>
<span class="st">${spinSvg()}${checkSvg()}</span></div></div>`);
  const tileEl = el.querySelector('.tile'), lbl = el.querySelector('.lbl');
  const la = el.querySelector('.lbl .a'), lb = el.querySelector('.lbl .b');
  const spinEl = el.querySelector('.st .spin'), okEl = el.querySelector('.st .ok');
  let wa = 0, wb = 0;
  return {
    el,
    head: true,
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

export function whoRow({ tile, name }) {
  return { el: h(`<div class="blk in"><div class="who"><span class="tile">${tile}</span><b>${name}</b><em>in superbot</em></div></div>`), indent: true };
}

export function stepRow({ run, done, detail }, cue) {
  const el = h(`<div class="blk in"><div class="step"><span class="g">${spinSvg()}${checkSvg()}</span>
<span class="sl"><span class="a">${run}</span><span class="b" style="opacity:0">${done}</span></span><span class="det">${detail ?? ''}</span></div></div>`);
  const sl = el.querySelector('.sl'), la = el.querySelector('.sl .a'), lb = el.querySelector('.sl .b');
  const spinEl = el.querySelector('.g .spin'), okEl = el.querySelector('.g .ok');
  let wa = 0, wb = 0;
  return {
    el,
    indent: true,
    measure() {
      wa = la.offsetWidth;
      wb = lb.offsetWidth;
    },
    update(t) {
      const k = prog(t, cue.done, 0.3, EASE.standard);
      la.style.opacity = (1 - k).toFixed(3);
      lb.style.opacity = k.toFixed(3);
      // Running rows read in fg; finished rows settle to muted.
      const c = Math.round(lerp(230, 174, k));
      sl.style.color = `rgb(${c},${Math.round(lerp(232, 177, k))},${Math.round(lerp(238, 188, k))})`;
      sl.style.width = `${lerp(wa, wb, prog(t, cue.done, 0.35, EASE.outCubic)).toFixed(2)}px`;
      statusMotion(t, cue.done, spinEl, okEl);
    },
  };
}

export function mediaCard({ src, w, hgt, tile }, cue) {
  const el = h(`<div class="blk in"><div class="media" style="width:${w}px;height:${hgt}px"><span class="band"></span>
<img src="${src}" alt="" style="opacity:0"><span class="chip"><span class="tile">${tile}</span>Creating image</span></div></div>`);
  const band = el.querySelector('.band'), img = el.querySelector('img'), chip = el.querySelector('.chip');
  return {
    el,
    indent: true,
    update(t) {
      const sweep = (((t - cue.in) % 1.4) + 1.4) % 1.4 / 1.4;
      band.style.backgroundPosition = `${(100 - sweep * 100).toFixed(2)}% 0`;
      const r = prog(t, cue.resolve, 0.9, EASE.outCubic);
      band.style.opacity = (1 - prog(t, cue.resolve, 0.4, EASE.standard)).toFixed(3);
      img.style.opacity = prog(t, cue.resolve, 0.55, EASE.standard).toFixed(3);
      img.style.filter = `blur(${lerp(14, 0, r).toFixed(2)}px)`;
      img.style.transform = `scale(${lerp(1.06, 1, r).toFixed(4)})`;
      chip.style.opacity = (1 - prog(t, cue.resolve + 0.1, 0.3, EASE.standard)).toFixed(3);
    },
  };
}

/** Answer text that streams in word by word; a word wrapped in *stars* renders bold. */
export function answer(text, tIn) {
  const words = text
    .split(' ')
    .map((w) => (/^\*.+\*[.,:]?$/.test(w) ? w.replace(/^\*(.+)\*([.,:]?)$/, '<b>$1</b>$2') : w))
    .map((w) => `<span class="w">${w}</span>`)
    .join(' ');
  const el = h(`<div class="blk in"><div class="ans">${words}</div></div>`);
  const spans = [...el.querySelectorAll('.w')];
  spans.forEach((s) => (s.style.display = 'inline-block'));
  return {
    el,
    indent: true,
    update(t) {
      spans.forEach((s, i) => {
        const k = prog(t, tIn + i * 0.045, 0.3, EASE.standard);
        s.style.opacity = k.toFixed(3);
        s.style.transform = `translateY(${lerp(5, 0, k).toFixed(2)}px)`;
      });
    },
  };
}

export function liveEmbed({ page, lead, device, urls }, cue) {
  const el = h(`<div class="blk in"><div class="live"><div class="frame"><div class="page"><div class="bbar"><i></i><i></i><i></i><span class="addr"></span></div><div class="site"></div></div><span class="tag">LIVE</span></div>
<div class="cap"><span class="lead">${lead}<em> on ${device}</em></span><span class="tm">0:00</span><span class="watch">Watch live</span></div></div></div>`);
  el.querySelector('.site').appendChild(page.el);
  const tm = el.querySelector('.tm');
  const addr = el.querySelector('.addr');
  return {
    el,
    indent: true,
    update(t) {
      const s = Math.max(0, Math.floor(t - cue.in));
      tm.textContent = `0:${String(s).padStart(2, '0')}`;
      const [host, ...rest] = urls.filter(([at]) => t >= at).at(-1)[1].split('/');
      addr.innerHTML = `${host}<em>/${rest.join('/')}</em>`;
      page.update(t, cue);
    },
  };
}

export function galleryEmbed({ title, note, items }, tIn) {
  const cells = items.map((it) => `<div class="cell"><img src="${it.src}" alt=""><p><b>${it.sub}</b><br>${it.stat}</p></div>`).join('');
  const el = h(`<div class="blk in"><div class="gal"><div class="gt">${title}<em>${note}</em></div><div class="grid">${cells}</div></div></div>`);
  const cellEls = [...el.querySelectorAll('.cell')];
  return {
    el,
    indent: true,
    update(t) {
      cellEls.forEach((c, i) => {
        const k = prog(t, tIn + 0.12 + i * 0.09, 0.5, EASE.outCubic);
        c.style.opacity = prog(t, tIn + 0.12 + i * 0.09, 0.35, EASE.standard).toFixed(3);
        c.style.transform = `translateY(${lerp(10, 0, k).toFixed(2)}px) scale(${lerp(0.97, 1, k).toFixed(4)})`;
      });
    },
  };
}

/**
 * The column. `add(block, tIn, { gap, dur })` registers a block that opens at tIn.
 * A block flagged `head` (a switch pill) starts a nest; following `indent` blocks hang off its rail.
 */
export function createThread(col) {
  const blocks = [];
  const rails = [];

  function add(block, tIn, { gap = 14, dur = 0.45 } = {}) {
    Object.assign(block, { tIn, gap, dur });
    col.appendChild(block.el);
    if (block.head) {
      const rail = h('<div class="rail-line"></div>');
      col.insertBefore(rail, col.firstChild);
      rails.push({ rail, head: block, rows: [] });
    } else if (block.indent && rails.length) {
      rails[rails.length - 1].rows.push(block);
    }
    blocks.push(block);
    return block;
  }

  function measure() {
    for (const b of blocks) {
      b.h = b.el.offsetHeight;
      b.measure?.();
    }
  }

  /** Lays the column out for time t and returns the scroll offset applied. */
  function layout(t) {
    let acc = PAD;
    for (const b of blocks) {
      const open = prog(t, b.tIn, b.dur, EASE.outCubic);
      const seen = prog(t, b.tIn + 0.04, b.dur * 0.9, EASE.standard);
      if (open > 0) acc += b.gap * open;
      b.y = acc;
      b.open = open;
      acc += b.h * open;
      const rise = (b.rise ?? 8) * (1 - seen);
      b.el.style.transform = `translateY(${(b.y + rise).toFixed(2)}px)`;
      b.el.style.opacity = seen.toFixed(3);
      b.el.style.visibility = seen < 0.002 ? 'hidden' : 'visible';
      if (seen > 0) b.update?.(t);
    }
    for (const r of rails) {
      const last = r.rows.filter((b) => b.open > 0).at(-1);
      if (!last) {
        r.rail.style.opacity = '0';
        continue;
      }
      const top = r.head.y + 24;
      const bottom = last.y + last.h * last.open;
      r.rail.style.opacity = (0.6 * r.rows[0].open).toFixed(3);
      r.rail.style.transform = `translateY(${top.toFixed(2)}px)`;
      r.rail.style.height = `${Math.max(0, bottom - top).toFixed(2)}px`;
    }
    const scroll = Math.max(0, acc + PAD - VIEW_H);
    col.style.transform = `translateY(${(-scroll).toFixed(2)}px)`;
    return scroll;
  }

  return { add, measure, layout };
}

export { icon };
