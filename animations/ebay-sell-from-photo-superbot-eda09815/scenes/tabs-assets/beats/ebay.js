// Superbot's answer: it drives eBay's "List an item" form for real. Photos upload, the title types, condition and
// item specifics fill, pricing and shipping set, then the gradient "List it" pill spins and the card turns into
// the live listing with its watcher count ticking up.
import { lerp, seg, outCubic, outBack, streamCount } from '../../../lib.js';
import { SHOTS, TITLE, SPECS, PRICE, ACCEPT, SHIP, WATCHERS, STATS } from './listing.js';

const SAY = 'Listing it on eBay now.';
const CHIPS = [
  ['Opening eBay', 'Opened eBay'],
  ['Uploading 4 photos', 'Uploaded 4 photos'],
  ['Pricing from sold listings', `Priced at $${STATS.price} from ${STATS.n} sold`],
];
const WORDMARK = '<span class="eb-wm" aria-label="ebay"><i class="e">e</i><i class="b">b</i><i class="a">a</i><i class="y">y</i></span>';
const CHECK = '<svg class="dd-check" viewBox="0 0 24 24"><path class="dd-check-p" d="M4.5 12.5l5 5L19.5 7"/></svg>';
const TAG = '<svg class="dd-bag" viewBox="0 0 24 24"><path d="M3 12V4h8l10 10-8 8Z"/><circle cx="7.5" cy="8.5" r="1.4"/></svg>';
const CHEV = '<svg class="eb-chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>';
const EYE = '<svg class="eb-eye" viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
const OK = '<svg class="eb-ok" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11"/><path d="M7 12.5l3.2 3.2L17 9"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + 0.25;
    T.ph0 = T.card + 0.2;
    T.phDone = T.ph0 + 3 * 0.12 + 0.35;
    T.ti0 = T.card + 0.75;
    T.ti1 = T.ti0 + 1.2;
    T.cond = T.ti1;
    T.spec = [T.ti1 + 0.08, T.ti1 + 0.16, T.ti1 + 0.24];
    T.price = T.spec[2] + 0.08;
    T.offer = T.price + 0.25;
    T.acc = T.offer + 0.08;
    T.ship = T.acc + 0.1;
    T.press = T.ship + 0.16;
    T.done = T.press + 0.5;
    T.live = T.done + 0.12;
    T.watch = [T.live + 0.35, T.live + 0.55, T.live + 0.75];
    T.chipIn = [r + 0.12, T.ph0, T.price];
    T.chipDone = [T.card + 0.15, T.phDone + 0.02, T.acc + 0.05];
    T.end = T.watch[2] + 0.48;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const row = x.el(`<div class="dd-chiprow eb-chiprow">${CHIPS.map(([run]) => `<div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div>`).join('')}</div>`);
    const field = (lab, val, cls = '') => `<div class="eb-in ${cls}"><small>${x.esc(lab)}</small><span class="eb-val">${val}</span></div>`;
    const card = x.el(`<div class="eb-card">
      <div class="eb-head">${WORDMARK}<i class="eb-sep"></i><span class="eb-ht"><b class="eb-h1">List an item</b><b class="eb-h2">Your listing</b></span><span class="eb-draft">Draft saved</span></div>
      <div class="eb-body">
        <div class="eb-form">
          <div class="eb-sec">
            <div class="eb-lab"><span>PHOTOS &amp; VIDEO</span><em class="eb-pc">0/24 photos</em></div>
            <div class="eb-prow">
              ${SHOTS.map((s) => `<div class="eb-pt"><img src="${x.img(s.f)}" alt="${x.esc(s.label)}"/><i class="eb-prog"><b></b></i></div>`).join('')}
              <div class="eb-pt eb-add"><b>+</b><small>Add photos</small></div>
            </div>
          </div>
          <div class="eb-sec">
            <div class="eb-lab"><span>TITLE</span><em class="eb-tc">0/80</em></div>
            <div class="eb-in eb-title"><small>Item title</small><span class="eb-val"><span class="eb-tt"></span><i class="eb-caret"></i></span></div>
          </div>
          <div class="eb-grid4">
            <div class="eb-sec"><div class="eb-lab"><span>CONDITION</span></div>${field('Item condition', `Used${CHEV}`, 'eb-f-cond')}</div>
            <div class="eb-sec eb-span3"><div class="eb-lab"><span>ITEM SPECIFICS</span></div>
              <div class="eb-specs">${SPECS.map(([a, b]) => field(a, x.esc(b), 'eb-f-spec')).join('')}</div></div>
          </div>
          <div class="eb-sec"><div class="eb-lab"><span>PRICING</span></div>
            <div class="eb-prc">
              ${field('Format', `Buy It Now${CHEV}`, 'eb-f-fmt')}
              ${field('Price', `<span class="eb-pv"></span>`, 'eb-f-price')}
              <div class="eb-offer"><span class="eb-tog"><i></i></span><span class="eb-ot"><b>Allow offers</b><small>Auto-accept at <em>${ACCEPT}</em></small></span></div>
            </div>
          </div>
          <div class="eb-sec"><div class="eb-lab"><span>SHIPPING</span></div>
            <div class="eb-shp">${field('Shipping service', x.esc(SHIP), 'eb-f-ship')}<span class="eb-chk"><i>${OK}</i>Free shipping</span></div>
          </div>
          <div class="dd-btn eb-btn">
            <span class="dd-grp eb-grp-0">${TAG}<span>List it</span></span>
            <span class="dd-grp dd-grp-a"><span class="eb-bspin"></span><span class="dd-lab-a">Listing</span></span>
            <span class="dd-grp dd-grp-b">${CHECK}<span class="dd-lab-b">Listed</span></span>
            <i class="dd-shine" aria-hidden="true"></i>
          </div>
        </div>
        <div class="eb-live">
          <div class="eb-banner">${OK}<b>Your listing is live</b><span>on eBay.com</span></div>
          <div class="eb-item">
            <div class="eb-hero"><img src="${x.img(SHOTS[0].f)}" alt="Listing photo"/><span class="eb-dots"><i class="on"></i><i></i><i></i><i></i></span></div>
            <div class="eb-info">
              <h4>${x.esc(TITLE)}</h4>
              <div class="eb-cnd">Condition: <b>Used</b></div>
              <div class="eb-bin">US ${PRICE}</div>
              <div class="eb-or">or Best Offer</div>
              <div class="eb-free"><b>Free shipping</b><span>${x.esc(SHIP)}</span></div>
              <div class="eb-btns"><span class="eb-b1">Buy It Now</span><span class="eb-b2">Add to cart</span><span class="eb-b2">Make offer</span></div>
              <div class="eb-watch">${EYE}<b class="eb-wn">0</b><span class="eb-wl">watchers</span></div>
            </div>
          </div>
          <div class="eb-about"><b>Item specifics</b><div class="eb-kv"><span><small>Condition</small>Used</span>${SPECS.map(([a, b]) => `<span><small>${x.esc(a)}</small>${x.esc(b)}</span>`).join('')}</div></div>
        </div>
      </div>
    </div>`);
    const $ = (s) => card.querySelector(s), $$ = (s) => [...card.querySelectorAll(s)];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const chips = [...row.children];
    const pts = $$('.eb-prow .eb-pt:not(.eb-add)'), pc = $('.eb-pc');
    const tt = $('.eb-tt'), tc = $('.eb-tc'), caret = $('.eb-caret'), titleF = $('.eb-title');
    const cond = $('.eb-f-cond'), specs = $$('.eb-f-spec'), fmt = $('.eb-f-fmt'), price = $('.eb-f-price'), pv = $('.eb-pv');
    const offer = $('.eb-offer'), tog = $('.eb-tog'), ot = $('.eb-ot small'), ship = $('.eb-f-ship'), chk = $('.eb-chk');
    const btn = $('.eb-btn'), g0 = $('.eb-grp-0'), grpA = $('.dd-grp-a'), grpB = $('.dd-grp-b'), labA = $('.dd-lab-a');
    const shine = $('.dd-shine'), check = $('.dd-check'), checkP = $('.dd-check-p'), bspin = $('.eb-bspin');
    const form = $('.eb-form'), live = $('.eb-live'), h1 = $('.eb-h1'), h2 = $('.eb-h2'), draft = $('.eb-draft');
    const wn = $('.eb-wn'), wl = $('.eb-wl'), watch = $('.eb-watch'), banner = $('.eb-banner');
    let shown = -1, typedN = -1;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    // a field that just got its value glows blue for a beat, like a focused eBay input
    const fill = (el, at) => {
      const p = seg(t0, at, at + 0.22);
      el.classList.toggle('is-set', t0 >= at);
      el.querySelector('.eb-val').style.opacity = outCubic(p).toFixed(3);
      el.style.setProperty('--focus', (seg(t0, at - 0.04, at + 0.06) * (1 - seg(t0, at + 0.3, at + 0.55))).toFixed(3));
    };
    let t0 = 0;
    return {
      nodes: [say, row, card],
      marks: [[T.r, say], [T.chipIn[0], row], [T.card, card]],
      render(t) {
        t0 = t;
        const n = streamCount(SAY, T.r + 0.05, 80, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        chips.forEach((c, i) => {
          const p = seg(t, T.chipIn[i], T.chipIn[i] + 0.3), e = outCubic(p);
          c.style.opacity = e.toFixed(3);
          c.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * 8).toFixed(2)}px)`;
          const done = t >= T.chipDone[i], sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.chipIn[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? CHIPS[i][1] : CHIPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });
        const ci = seg(t, T.card, T.card + 0.5);
        card.style.opacity = outCubic(ci).toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - outCubic(ci)) * 20).toFixed(2)}px) scale(${lerp(0.97, 1, outCubic(ci)).toFixed(4)})`;

        // photos: each tile fills a blue progress bar, then the shot fades in
        let up = 0;
        pts.forEach((pt, i) => {
          const a = T.ph0 + i * 0.12, p = seg(t, a, a + 0.35);
          const bar = pt.querySelector('.eb-prog'), im = pt.firstElementChild;
          bar.firstElementChild.style.transform = `scaleX(${outCubic(p).toFixed(4)})`;
          bar.style.opacity = (seg(t, a - 0.02, a + 0.04) * (1 - seg(t, a + 0.35, a + 0.45))).toFixed(3);
          im.style.opacity = outCubic(seg(t, a + 0.22, a + 0.42)).toFixed(3);
          if (t >= a + 0.35) up++;
        });
        const pcT = `${up}/24 photos`;
        if (pc.textContent !== pcT) pc.textContent = pcT;

        // title types into the field with its character counter
        const tn = Math.round(TITLE.length * seg(t, T.ti0, T.ti1));
        if (tn !== typedN) { tt.textContent = TITLE.slice(0, tn); tc.textContent = `${tn}/80`; typedN = tn; }
        const typing = t >= T.ti0 - 0.1 && t < T.ti1 + 0.2;
        caret.style.opacity = typing ? '1' : '0';
        titleF.style.setProperty('--focus', (seg(t, T.ti0 - 0.12, T.ti0) * (1 - seg(t, T.ti1 + 0.1, T.ti1 + 0.35))).toFixed(3));

        fill(cond, T.cond);
        specs.forEach((s, i) => fill(s, T.spec[i]));
        fill(fmt, T.price - 0.06);
        fill(price, T.price);
        const pn = Math.round(PRICE.length * seg(t, T.price, T.price + 0.2));
        if (pv.textContent.length !== pn) pv.textContent = PRICE.slice(0, pn);
        const o = outCubic(seg(t, T.offer, T.offer + 0.18));
        tog.style.setProperty('--on', o.toFixed(3));
        offer.classList.toggle('is-on', t >= T.offer);
        ot.style.opacity = lerp(0.35, 1, seg(t, T.acc, T.acc + 0.2)).toFixed(3);
        fill(ship, T.ship);
        const c2 = seg(t, T.ship + 0.06, T.ship + 0.22);
        chk.classList.toggle('is-on', t >= T.ship + 0.06);
        chk.firstElementChild.style.transform = `scale(${lerp(0.6, 1, outBack(c2)).toFixed(3)})`;

        // List it -> Listing (spinner) -> Listed
        const P = T.press, D = T.done;
        const down = seg(t, P - 0.06, P + 0.04) * (1 - seg(t, P + 0.1, P + 0.24));
        const pop = seg(t, D, D + 0.4);
        btn.style.transform = `scale(${(1 - 0.05 * down + 0.03 * Math.sin(Math.PI * pop)).toFixed(4)})`;
        const r0 = seg(t, P + 0.02, P + 0.2);
        g0.style.opacity = (1 - outCubic(r0)).toFixed(3);
        g0.style.transform = `translate(-50%, calc(-50% - ${(outCubic(r0) * 10).toFixed(2)}px))`;
        const ai = seg(t, P + 0.08, P + 0.26), ao = seg(t, D - 0.02, D + 0.16);
        grpA.style.opacity = (outCubic(ai) * (1 - outCubic(ao))).toFixed(3);
        grpA.style.transform = `translate(-50%, calc(-50% + ${(((1 - outCubic(ai)) - outCubic(ao)) * 10).toFixed(2)}px))`;
        bspin.style.transform = `rotate(${(((t - P) * 540) % 360).toFixed(1)}deg)`;
        labA.textContent = 'Listing' + '.'.repeat(1 + (Math.floor(Math.max(0, t - P) * 6) % 3));
        const bi = seg(t, D + 0.04, D + 0.3);
        grpB.style.opacity = outCubic(bi).toFixed(3);
        grpB.style.transform = `translate(-50%, calc(-50% + ${((1 - outCubic(bi)) * 10).toFixed(2)}px)) scale(${lerp(0.9, 1, outBack(seg(t, D, D + 0.36))).toFixed(4)})`;
        checkP.style.strokeDashoffset = (23 * (1 - outCubic(seg(t, D + 0.06, D + 0.3)))).toFixed(2);
        check.style.transform = `scale(${lerp(0.55, 1, outBack(seg(t, D + 0.06, D + 0.3))).toFixed(3)})`;
        const sh = seg(t, D - 0.04, D + 0.5);
        shine.style.opacity = (sh > 0 && sh < 1 ? Math.sin(Math.PI * Math.min(1, sh * 1.25)) : 0).toFixed(3);
        shine.style.transform = `translateX(${lerp(-160, 300, 0.5 - Math.cos(Math.PI * sh) / 2).toFixed(1)}%) skewX(-20deg)`;

        // the form gives way to the live listing
        const L = outCubic(seg(t, T.live, T.live + 0.3));
        form.style.opacity = (1 - L).toFixed(3);
        form.style.transform = L > 0 ? `scale(${lerp(1, 0.985, L).toFixed(4)})` : '';
        live.style.opacity = L.toFixed(3);
        live.style.transform = L >= 1 ? '' : `translateY(${((1 - L) * 10).toFixed(2)}px)`;
        live.style.visibility = L > 0 ? 'visible' : 'hidden';
        h1.style.opacity = (1 - L).toFixed(3);
        h2.style.opacity = L.toFixed(3);
        draft.style.opacity = ((1 - L) * seg(t, T.ti0 + 0.3, T.ti0 + 0.5)).toFixed(3);
        banner.style.setProperty('--glow', (seg(t, T.live + 0.1, T.live + 0.3) * (1 - seg(t, T.live + 0.6, T.live + 1.1))).toFixed(3));
        const w = T.watch.filter((a) => t >= a).length;
        const wT = String(Math.min(WATCHERS, w));
        if (wn.textContent !== wT) { wn.textContent = wT; wl.textContent = wT === '1' ? 'watcher' : 'watchers'; }
        const last = T.watch.reduce((m, a) => (t >= a ? a : m), -1);
        watch.style.setProperty('--bump', last < 0 ? '0' : (1 - seg(t, last, last + 0.25)).toFixed(3));
      },
    };
  },
};
