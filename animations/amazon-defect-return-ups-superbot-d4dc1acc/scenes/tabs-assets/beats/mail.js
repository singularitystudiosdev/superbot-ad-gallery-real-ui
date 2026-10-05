// DeepSeek V4 Flash finds the order: it types a search into Gmail, the counter runs through all 3,412 emails, the
// Amazon results drop in and it lands on "Your Amazon.com order has shipped". The order card it pulls out of that email
// follows (the Vortexa blender, $109.99, order #, delivered Sat, Sep 12) with the red return-window chip.
import { lerp, seg, outCubic, outQuint, outBack, streamCount } from '../../../lib.js';
import { MAIL, ITEM, WINDOW } from './returns.js';

const SAY = `Searched ${MAIL.total.toLocaleString('en-US')} emails in Gmail and found the order.`;
const SEARCH = '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';
const STAR = '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8Z"/></svg>';
const CLOCK = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.3;
    T.q0 = T.card + 0.3;
    T.q1 = T.q0 + MAIL.query.length / 38;
    T.c0 = T.q1 + 0.12;
    T.c1 = T.c0 + 1.7;
    T.rows = MAIL.rows.map((_, i) => T.c0 + 0.55 + i * 0.28);
    T.hit = T.c1 + 0.1;
    T.ord = T.hit + 0.45;
    T.warn = T.ord + 0.6;
    T.end = T.warn + 1.6;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="gx-card">
      <div class="gx-top"><img src="${x.brand('gmail-logo.svg')}" alt=""/><span class="gx-wm">Gmail</span>
        <div class="gx-search">${SEARCH}<span class="gx-q"></span><i class="gx-caret"></i></div></div>
      <div class="gx-prog"><span class="gx-cnt"></span><i class="gx-bar"><i></i></i></div>
      <div class="gx-list">${MAIL.rows.map((m) => `<div class="gx-row${m.hit ? ' gx-hit' : ''}"><i class="gx-cb"></i><i class="gx-star">${STAR}</i><b class="gx-from">${x.esc(m.from)}</b><span class="gx-sub"><b>${x.esc(m.subj)}</b><span> - ${x.esc(m.snip)}</span></span><span class="gx-date">${m.date}</span></div>`).join('')}</div>
    </div>`);
    const order = x.el(`<div class="dk-order">
      <img class="dk-img" src="${x.img('product.jpg')}" alt=""/>
      <div class="dk-mid"><b>${x.esc(ITEM.name)}</b><span class="dk-meta"><b>${ITEM.price}</b><span>Order #${ITEM.order}</span></span><span class="dk-del">Delivered ${ITEM.delivered}</span></div>
      <span class="dk-warn">${CLOCK}${x.esc(WINDOW)}</span>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const q = $('.gx-q'), caret = $('.gx-caret'), cnt = $('.gx-cnt'), bar = $('.gx-bar i'), prog = $('.gx-prog'), rows = $$('.gx-row');
    const hit = $('.gx-hit'), warn = order.querySelector('.dk-warn');
    let shown = -1, qn = -1, cn = '';
    return {
      nodes: [say, card, order],
      marks: [[T.r, say], [T.card, card], [T.ord, order]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + 0.42));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 16).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;
        const qN = Math.round(MAIL.query.length * seg(t, T.q0, T.q1));
        if (qN !== qn) { q.textContent = MAIL.query.slice(0, qN); qn = qN; }
        caret.style.opacity = t >= T.q0 - 0.1 && t < T.c0 + 0.1 && Math.floor(t * 4) % 2 === 0 ? '1' : '0';
        // the count runs up through the inbox and lands on the total
        const cp = outQuint(seg(t, T.c0, T.c1));
        const all = MAIL.total.toLocaleString('en-US');
        const cN = t >= T.c1 ? `Searched <b>${all}</b> emails · ${MAIL.rows.length} matches` : `Searching <b>${Math.round(MAIL.total * cp).toLocaleString('en-US')}</b> of ${all} emails`;
        if (cN !== cn) { cnt.innerHTML = cN; cn = cN; prog.classList.toggle('done', t >= T.c1); }
        bar.style.transform = `scaleX(${cp.toFixed(4)})`;
        rows.forEach((rw, i) => {
          const p = outCubic(seg(t, T.rows[i], T.rows[i] + 0.3));
          rw.style.opacity = p.toFixed(3);
          rw.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
        });
        const h = seg(t, T.hit, T.hit + 0.25);
        hit.style.setProperty('--hit', outCubic(h).toFixed(3));
        rows.forEach((rw) => { if (rw !== hit) rw.style.opacity = (+rw.style.opacity * (1 - 0.45 * h)).toFixed(3); });
        const o = outCubic(seg(t, T.ord, T.ord + 0.42));
        order.style.opacity = o.toFixed(3);
        order.style.transform = o >= 1 ? '' : `translateY(${((1 - o) * 14).toFixed(2)}px)`;
        const w = seg(t, T.warn, T.warn + 0.4);
        warn.style.opacity = outCubic(w).toFixed(3);
        warn.style.transform = `scale(${lerp(0.7, 1, outBack(w)).toFixed(4)})`;
        warn.style.setProperty('--pulse', (Math.sin(Math.PI * seg(t, T.warn + 0.3, T.warn + 1.1))).toFixed(3));
      },
    };
  },
};
