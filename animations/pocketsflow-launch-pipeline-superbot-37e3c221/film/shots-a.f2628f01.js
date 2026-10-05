// Shots 1-3 of the Pocketsflow launch film: the hook, the product page building itself, the Apple Pay checkout.
// build(sec, id) writes the shot's DOM once; render(u) is a pure function of the shot's local time u in seconds.
import { clamp, lerp, seg, outCubic, outQuint, outBack, inOutCubic } from '../lib.js';
import { el, words, lines, rise, land, push, setText } from './kit.f2628f01.js';
import { tile, landscape } from './art.f2628f01.js';
import { MARKS } from './marks.f2628f01.js';

const mark = (k, cls = 'pff-mk-ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${MARKS[k]}"/></svg>`;
const CHECK = '<svg class="pff-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

// ---------- 1. hook: "You made the thing. Now sell it." ----------
const TILES = [
  { k: 'presets', x: 770, y: 96, r: -7 },
  { k: 'icons', x: 1000, y: 140, r: 5 },
  { k: 'zine', x: 790, y: 372, r: 4 },
  { k: 'beats', x: 1012, y: 398, r: -4 },
];
export const hook = {
  build(sec, id) {
    sec.innerHTML = `<div class="pff-cam">
      <h1 class="pff-hk-h">${lines([words('You made'), words('the thing.'), `${words('Now')} <span class="pff-mkr"><i class="pff-mkr-bar"></i>${words('sell it.')}</span>`])}</h1>
      ${TILES.map((t, i) => `<div class="pff-hk-t" style="left:${t.x}px;top:${t.y}px">${tile(t.k, `${id}h${i}`)}</div>`).join('')}
    </div>`;
    const q = (s) => [...sec.querySelectorAll(s)];
    const ls = q('.pff-line');
    const st = { cam: sec.firstElementChild, w12: [...ls[0].querySelectorAll('.pff-w'), ...ls[1].querySelectorAll('.pff-w')], w3: [...ls[2].querySelectorAll('.pff-w')], bar: sec.querySelector('.pff-mkr-bar'), tiles: q('.pff-hk-t') };
    return {
      render(u) {
        push(st.cam, u, 2.6, 1.04);
        rise(st.w12, u, 0.05, 0.08);
        rise(st.w3, u, 1.1, 0.09);
        st.bar.style.transform = `scaleX(${outQuint(seg(u, 1.38, 1.78)).toFixed(4)})`;
        st.tiles.forEach((n, i) => {
          const p = seg(u, 0.32 + i * 0.13, 0.32 + i * 0.13 + 0.62);
          const e = outBack(p), r = TILES[i].r;
          n.style.opacity = outCubic(seg(p, 0, 0.4)).toFixed(3);
          n.style.transform = `translate3d(0,${((1 - e) * -46).toFixed(2)}px,0) rotate(${lerp(r - 9, r, e).toFixed(2)}deg) scale(${lerp(1.1, 1, outCubic(p)).toFixed(4)})`;
        });
      },
    };
  },
};

// ---------- 2. product page: the form fills, the live page builds beside it ----------
const NAME = 'Lightroom Presets Vol. 3';
export const page = {
  build(sec, id) {
    sec.innerHTML = `<div class="pff-cam">
      <h2 class="pff-h2 pff-pg-h">${lines([words('Your page,'), words('live in minutes.')])}</h2>
      <div class="pff-form">
        <div class="pff-fl"><label>Product name</label><div class="pff-in pff-in-on"><span class="pff-pg-nm"></span><i class="pff-caret"></i></div></div>
        <div class="pff-row2">
          <div class="pff-fl"><label>Price</label><div class="pff-in"><span class="pff-pg-pr"></span></div></div>
          <div class="pff-fl"><label>Currency</label><div class="pff-in pff-in-sel">USD<i class="pff-chev"></i></div></div>
        </div>
        <div class="pff-fl"><label>File</label><div class="pff-file"><span class="pff-file-ic">ZIP</span><div class="pff-file-m"><b>presets-vol-3.zip</b><span class="pff-file-bar"><i></i></span></div><span class="pff-file-pc">0%</span></div></div>
        <div class="pff-pub"><span class="pff-pub-t">Publish</span>${CHECK}</div>
      </div>
      <div class="pff-br">
        <div class="pff-br-bar"><span class="pff-br-dots"><i></i><i></i><i></i></span>
          <span class="pff-url"><svg viewBox="0 0 24 24" class="pff-lock"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>inesduarte.pocketsflow.com/presets-vol-3</span>
          <span class="pff-live">Live</span></div>
        <div class="pff-pp">
          <div class="pff-pp-cv"><div class="pff-ba pff-ba-a">${landscape(`${id}a`)}</div><div class="pff-ba pff-ba-b">${landscape(`${id}b`)}</div>
            <i class="pff-ba-h"><b></b></i><span class="pff-ba-l pff-ba-l1">Before</span><span class="pff-ba-l pff-ba-l2">After</span></div>
          <div class="pff-pp-by"><span class="pff-av">ID</span><div><b>Inês Duarte</b><small>@inesonfilm</small></div><span class="pff-rt">★ 4.9 <small>312 reviews</small></span></div>
          <div class="pff-pp-t"><span class="pff-pp-tt"></span></div>
          <p class="pff-pp-d">12 film presets for Lightroom. Warm skin, clean greens, soft highlights.</p>
          <div class="pff-pp-row"><span class="pff-chip">12 presets</span><span class="pff-chip">DNG + XMP</span><span class="pff-chip">Lifetime updates</span>
            <span class="pff-pp-pr">$29</span><span class="pff-buy">Buy now</span></div>
        </div>
      </div>
    </div>`;
    const $ = (s) => sec.querySelector(s);
    const st = {
      cam: sec.firstElementChild, w: [...sec.querySelectorAll('.pff-pg-h .pff-w')], form: $('.pff-form'), br: $('.pff-br'),
      nm: $('.pff-pg-nm'), caret: $('.pff-caret'), pr: $('.pff-pg-pr'), bar: $('.pff-file-bar i'), pc: $('.pff-file-pc'),
      pub: $('.pff-pub'), pubT: $('.pff-pub-t'), live: $('.pff-live'), tt: $('.pff-pp-tt'), cv: $('.pff-pp-cv'),
      after: $('.pff-ba-a'), handle: $('.pff-ba-h'), prc: $('.pff-pp-pr'), buy: $('.pff-buy'), nmIn: $('.pff-in-on'),
    };
    return {
      render(u) {
        push(st.cam, u, 2.6, 1.03);
        rise(st.w, u, 0.0, 0.06);
        land(st.form, seg(u, 0.05, 0.5), 0, 24);
        land(st.br, seg(u, 0.12, 0.6), 46, 0);
        // the name types, and the live page mirrors it letter by letter
        const n = Math.round(NAME.length * seg(u, 0.32, 1.05));
        setText(st.nm, NAME.slice(0, n));
        st.caret.style.opacity = u < 1.1 && (u % 0.5) < 0.3 ? '1' : '0';
        st.nmIn.classList.toggle('pff-in-on', u < 1.1);
        setText(st.tt, n ? NAME.slice(0, n) : 'Untitled product');
        st.tt.classList.toggle('pff-ph', !n);
        const pn = Math.round(3 * seg(u, 1.08, 1.22));
        setText(st.pr, '$29'.slice(0, pn));
        st.prc.style.opacity = pn >= 3 ? '1' : '0.18';
        // the file uploads; the cover develops as it lands
        const f = outCubic(seg(u, 0.75, 1.6));
        st.bar.style.width = `${(f * 100).toFixed(1)}%`;
        setText(st.pc, f >= 1 ? '48 MB' : `${Math.round(f * 100)}%`);
        st.cv.style.filter = `blur(${((1 - f) * 10).toFixed(2)}px) saturate(${lerp(0.2, 1, f).toFixed(3)})`;
        st.cv.style.opacity = lerp(0.35, 1, f).toFixed(3);
        // the before/after handle sweeps
        const hx = lerp(78, 46, inOutCubic(seg(u, 1.0, 2.3)));
        st.after.style.clipPath = `inset(0 ${(100 - hx).toFixed(2)}% 0 0)`;
        st.handle.style.left = `${hx.toFixed(2)}%`;
        // publish: press, then live
        const pr = seg(u, 1.72, 1.86);
        st.pub.style.transform = `scale(${(1 - 0.05 * Math.sin(Math.PI * pr)).toFixed(4)})`;
        st.pub.classList.toggle('pff-done', u >= 1.84);
        setText(st.pubT, u >= 1.84 ? 'Published' : 'Publish');
        const lv = outBack(seg(u, 1.9, 2.25));
        st.live.style.opacity = clamp(lv * 2).toFixed(3);
        st.live.style.transform = `scale(${lerp(0.4, 1, lv).toFixed(4)})`;
        st.buy.style.transform = `scale(${(1 + 0.06 * Math.sin(Math.PI * seg(u, 2.0, 2.4))).toFixed(4)})`;
      },
    };
  },
};

// ---------- 3. checkout: Apple Pay sheet, LAUNCH20, Face ID, paid ----------
const STATUS = `<div class="pff-sb"><b>9:41</b><span><i class="pff-sig"><i></i><i></i><i></i><i></i></i><svg viewBox="0 0 24 24" class="pff-wifi"><path d="M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19" r="1.4"/></svg><i class="pff-bat"><i></i></i></span></div>`;
const FACE = `<svg class="pff-face" viewBox="0 0 48 48" aria-hidden="true"><path d="M4 14V8a4 4 0 0 1 4-4h6M34 4h6a4 4 0 0 1 4 4v6M44 34v6a4 4 0 0 1-4 4h-6M14 44H8a4 4 0 0 1-4-4v-6M17 18v4M31 18v4M24 18v9h-2M17 33q7 5 14 0"/></svg>`;
export const checkout = {
  build(sec, id) {
    sec.innerHTML = `<div class="pff-cam">
      <h2 class="pff-h2 pff-co-h">${lines([words('Checkout'), words('that converts.')])}</h2>
      <div class="pff-pay">${[['applepay', 'Apple Pay'], ['googlepay', 'Google Pay'], ['visa', 'Cards'], ['paypal', 'PayPal']].map(([k, l]) => `<span class="pff-pm">${mark(k)}<b>${l}</b></span>`).join('')}</div>
      <div class="pff-tk"><i class="pff-tk-stub"></i><div><b>LAUNCH20</b><small>20% off until Sunday night</small></div><span class="pff-tk-ok">${CHECK}Applied</span></div>
      <div class="pff-paid">${CHECK}<div><b>Order #1043 paid</b><small>Presets Vol. 3, Lisbon</small></div><span>$23.20</span></div>
      <div class="pff-ph-w"><div class="pff-phone"><i class="pff-side"></i><div class="pff-scr">${STATUS}<i class="pff-isl"></i>
        <div class="pff-mp"><div class="pff-mp-cv">${landscape(`${id}m`)}</div><b class="pff-mp-t">Lightroom Presets Vol. 3</b><small class="pff-mp-by">Inês Duarte</small>
          <div class="pff-mp-row"><span>$29</span><span class="pff-mp-buy">Buy now</span></div><i class="pff-tap"></i></div>
        <i class="pff-dim"></i>
        <div class="pff-sheet">
          <div class="pff-sh-hd">${mark('applepay', 'pff-sh-ap')}<span>Cancel</span></div>
          <div class="pff-sh-r pff-sh-card"><span class="pff-card">${mark('visa', 'pff-card-v')}</span><div><b>Visa ••4242</b><small>Inês's card</small></div></div>
          <div class="pff-sh-r"><span>Presets Vol. 3</span><span>$29.00</span></div>
          <div class="pff-sh-r pff-sh-dc"><span>LAUNCH20</span><span>−$5.80</span></div>
          <div class="pff-sh-r pff-sh-tot"><span>Pay Pocketsflow</span><b>$23.20</b></div>
          <div class="pff-sh-fid"><span class="pff-fid">${FACE}<span class="pff-fid-ok">${CHECK}</span></span><small class="pff-fid-t">Confirm with Side Button</small></div>
        </div>
        <div class="pff-rc"><span class="pff-rc-ok">${CHECK}</span><b>It's yours.</b><small>Receipt sent to ines@duarte.studio</small><span class="pff-rc-dl">Download presets-vol-3.zip</span></div>
      </div></div></div>
    </div>`;
    const $ = (s) => sec.querySelector(s);
    const st = {
      cam: sec.firstElementChild, w: [...sec.querySelectorAll('.pff-co-h .pff-w')], pms: [...sec.querySelectorAll('.pff-pm')],
      tk: $('.pff-tk'), tkOk: $('.pff-tk-ok'), paid: $('.pff-paid'), phw: $('.pff-ph-w'), tap: $('.pff-tap'), dim: $('.pff-dim'),
      sheet: $('.pff-sheet'), dc: $('.pff-sh-dc'), side: $('.pff-side'), face: $('.pff-face'), fok: $('.pff-fid-ok'),
      fidT: $('.pff-fid-t'), rc: $('.pff-rc'),
    };
    return {
      render(u) {
        push(st.cam, u, 2.6, 1.03);
        rise(st.w, u, 0.0, 0.06);
        st.pms.forEach((n, i) => land(n, seg(u, 0.2 + i * 0.08, 0.55 + i * 0.08), 0, 14, 0.9));
        land(st.tk, seg(u, 0.5, 0.9), -20, 0);
        // the phone swings toward camera as the sheet comes up
        const sw = inOutCubic(seg(u, 0, 2.6));
        land(st.phw, seg(u, 0.0, 0.45), 60, 0);
        st.phw.firstElementChild.style.transform = `rotateY(${lerp(-18, -6, sw).toFixed(2)}deg) rotateX(${lerp(6, 2, sw).toFixed(2)}deg)`;
        const tp = seg(u, 0.24, 0.6);
        st.tap.style.opacity = (Math.sin(Math.PI * tp)).toFixed(3);
        st.tap.style.transform = `scale(${lerp(0.4, 1.6, tp).toFixed(3)})`;
        const sh = outQuint(seg(u, 0.36, 0.86)) * (1 - inOutCubic(seg(u, 1.95, 2.25)));
        st.dim.style.opacity = (sh * 0.42).toFixed(3);
        st.sheet.style.transform = `translate3d(0,${((1 - sh) * 104).toFixed(2)}%,0)`;
        // the discount lands on the sheet and the ticket on the left confirms it
        const dc = outCubic(seg(u, 0.78, 1.0));
        st.dc.style.opacity = dc.toFixed(3);
        land(st.tkOk, seg(u, 0.85, 1.1), 0, 6, 0.6);
        // side button double-click, Face ID scans, then the check
        const sb = seg(u, 1.0, 1.3);
        st.side.style.opacity = (0.25 + 0.75 * Math.abs(Math.sin(sb * Math.PI * 2))).toFixed(3);
        const scan = seg(u, 1.25, 1.65);
        const done = u >= 1.68;
        st.face.style.opacity = done ? '0' : '1';
        st.face.style.transform = `scale(${(1 + 0.08 * Math.sin(scan * Math.PI * 3)).toFixed(4)})`;
        land(st.fok, seg(u, 1.66, 1.86), 0, 0, 0.4);
        setText(st.fidT, done ? 'Done' : 'Confirm with Side Button');
        land(st.rc, seg(u, 2.05, 2.4), 0, 16);
        land(st.paid, seg(u, 1.9, 2.3), -26, 0);
      },
    };
  },
};
