// The Pocketsflow launch film: one 15 s, 1280x720 piece rendered as a pure function of film time `ft`.
// The same film plays in the tweet, resolves as Nano Banana Pro's style frames, runs in Kling's shot player, sits
// under the ElevenLabs mix and the Remotion preview, and premieres full frame at the end, so every model's output in
// the ad is a piece of this one film. mountFilm(host, width) builds an instance scaled to `width` px.
import { clamp, lerp, seg, outCubic, outQuint, inOutCubic, outBack, press } from '../lib.js';
import { FILM_HTML, SHOTS } from './markup.js';

export { SHOTS };
export const FILM_W = 1280, FILM_H = 720, FILM_DUR = 15;
export const SHOT_NAMES = ['Hook', 'Upload', 'Share', 'Checkout', 'Dashboard', 'Lockup'];
/** the moment of each shot that best stands for it (style frames, thumbnails) */
export const KEY_FRAMES = [1.75, 4.55, 6.9, 9.95, 12.3, 14.4];

const CUR = [ // [country, currency, city, price, tax label, tax, total]
  ['US', 'USD', 'Austin', '$29.00', 'Sales tax (8.25%)', '$2.39', '$31.39'],
  ['DE', 'EUR', 'Berlin', '€27.00', 'VAT (19%)', '€5.13', '€32.13'],
  ['GB', 'GBP', 'London', '£23.00', 'VAT (20%)', '£4.60', '£27.60'],
  ['JP', 'JPY', 'Tokyo', '¥4,400', 'JCT (10%)', '¥440', '¥4,840'],
];
const CUR_AT = [0, 0.55, 0.95, 1.35];
const SALE_AT = [2.02, 0.6, 1.0, 0.15], SALE_Y = [186, 62, 124, 0]; // Tokyo, Berlin, London, Austin
const FEED_AT = [0.12, 0.72, 1.22, 1.78];
const NAME = 'Portra 400 Preset Pack';

const q = (r, s) => r.querySelector(s);
const qa = (r, s) => [...r.querySelectorAll(s)];
const f2 = (x) => x.toFixed(2);
const show = (el, v) => { el.style.opacity = f2(clamp(v)); el.style.visibility = v > 0.001 ? 'visible' : 'hidden'; };
const rise = (el, p, dy = 26, blur = 0) => {
  el.style.opacity = f2(p);
  el.style.transform = `translateY(${f2((1 - p) * dy)}px)`;
  if (blur) el.style.filter = p < 1 ? `blur(${f2((1 - p) * blur)}px)` : 'none';
};
const mix = (a, b, f) => `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], f))).join(',')})`;
const GREY = [212, 212, 212], INK = [10, 10, 10];

/** layout position of `el` inside `root` in film px (offset chain, so camera transforms never skew it) */
function posIn(el, root) {
  let x = 0, y = 0, n = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
}
/** where film point p lands after a camera `scale(s)` about the centre plus a (tx, ty) shift */
const camPt = (p, s, tx = 0, ty = 0) => ({ x: 640 + (p.x - 640) * s + tx, y: 360 + (p.y - 360) * s + ty });
const cam = (el, s, tx = 0, ty = 0) => { el.style.transform = `translate(${f2(tx)}px, ${f2(ty)}px) scale(${s.toFixed(4)})`; };
/** cursor keyframes eased between neighbours */
function along(t, keys) {
  if (t <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  for (let i = 1; i < keys.length; i++) {
    const [ta, xa, ya] = keys[i - 1], [tb, xb, yb] = keys[i];
    if (t <= tb) { const f = inOutCubic(seg(t, ta, tb)); return { x: lerp(xa, xb, f), y: lerp(ya, yb, f) }; }
  }
  const z = keys[keys.length - 1]; return { x: z[1], y: z[2] };
}

export function mountFilm(host, width = FILM_W) {
  host.classList.add('pf-host');
  host.innerHTML = FILM_HTML;
  const root = q(host, '.pf-film');
  const fit = (w) => { host.style.width = `${w}px`; host.style.height = `${(w * FILM_H) / FILM_W}px`; root.style.transform = `scale(${(w / FILM_W).toFixed(5)})`; };
  fit(width);
  const S = qa(root, '.pf-s');
  const C = S.map((s) => q(s, '[class$="-cam"]'));
  const r = {
    cur: q(root, '.pf-curw'),
    s1tag: q(root, '.pf-s1-tag'), words: qa(root, '.pf-hook i'), cards: qa(root, '.pf-pc'),
    s2: { tag: q(S[1], '.pf-tag'), hl: qa(S[1], '.pf-hl'), form: q(S[1], '.pf-form'), st: q(S[1], '.pf-form-st'),
      name: q(S[1], '.pf-in-name'), price: q(S[1], '.pf-in-price'), file: q(S[1], '.pf-file'), size: q(S[1], '.pf-file-s'),
      ok: q(S[1], '.pf-file-ok'), bar: q(S[1], '.pf-bar i'), pub: q(S[1], '.pf-pub'), pa: q(S[1], '.pf-pub-a'), pb: q(S[1], '.pf-pub-b') },
    s3: { tag: q(S[2], '.pf-tag'), hl: qa(S[2], '.pf-hl'), link: q(S[2], '.pf-link'), copy: q(S[2], '.pf-link-c'), toast: q(S[2], '.pf-toast'),
      phone: q(S[2], '.pf-phone'), scroll: q(S[2], '.pf-scroll'), buy: q(S[2], '.pf-buy'), tap: q(S[2], '.pf-tap') },
    s4: { tag: q(S[3], '.pf-tag'), hl: qa(S[3], '.pf-hl'), mor: q(S[3], '.pf-mor'), co: q(S[3], '.pf-co'),
      cc: q(S[3], '.pf-co-cc'), cur: q(S[3], '.pf-co-cur'), city: q(S[3], '.pf-co-city'), p: q(S[3], '.pf-co-p'), sub: q(S[3], '.pf-co-sub'),
      taxl: q(S[3], '.pf-co-taxl'), tax: q(S[3], '.pf-co-tax'), tot: q(S[3], '.pf-co-total'), ap: q(S[3], '.pf-ap'),
      apa: q(S[3], '.pf-ap-a'), apb: q(S[3], '.pf-ap-b'), sales: qa(S[3], '.pf-sale') },
    s5: { tag: q(S[4], '.pf-tag'), hl: qa(S[4], '.pf-hl'), db: q(S[4], '.pf-db'), rev: q(S[4], '.pf-k-rev'), ord: q(S[4], '.pf-k-ord'),
      cv: q(S[4], '.pf-k-cv'), line: q(S[4], '.pf-ch-line'), area: q(S[4], '.pf-ch-area'), dot: q(S[4], '.pf-ch-dot'), feed: qa(S[4], '.pf-fd') },
    s6: { ic: q(S[5], '.pf-lock-ic'), wm: q(S[5], '.pf-lock-wm'), line: q(S[5], '.pf-lock-line'), stats: qa(S[5], '.pf-stats span'), url: q(S[5], '.pf-url-pill') },
  };
  let spots = null, last = NaN;
  const measure = () => {
    if (spots && spots.ok) return spots;
    spots = {
      ok: document.fonts ? document.fonts.status === 'loaded' : true,
      name: posIn(r.s2.name, root), price: posIn(r.s2.price, root), pub: posIn(r.s2.pub, root),
      buy: posIn(r.s3.buy, root), buyIn: posIn(r.s3.buy, r.s3.scroll), scr: posIn(q(root, '.pf-scr'), root), ap: posIn(r.s4.ap, root),
    };
    return spots;
  };

  function s1(t) {
    const exit = seg(t, 2.12, 2.44);
    cam(C[0], (1 + 0.035 * seg(t, 0, 2.4)) * (1 + 0.75 * exit * exit));
    show(S[0], 1 - seg(t, 2.24, 2.44));
    rise(r.s1tag, outCubic(seg(t, 0.05, 0.45)), 10);
    r.words.forEach((w, i) => rise(w, outQuint(seg(t, 0.1 + i * 0.09, 0.62 + i * 0.09)), 46, 12));
    const rot = [-7, 6, 5, -6], dir = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    r.cards.forEach((c, j) => {
      const p = seg(t, 0.72 + j * 0.1, 1.27 + j * 0.1), b = outBack(p);
      const fl = Math.sin((t + j * 0.9) * 2.2) * 5, out = exit * exit * 260;
      c.style.opacity = f2(clamp(p * 3));
      c.style.transform = `translate(${f2(dir[j][0] * out)}px, ${f2(fl + dir[j][1] * out + (1 - b) * 30)}px) rotate(${f2(rot[j] * (0.4 + 0.6 * b))}deg) scale(${f2(0.62 + 0.38 * b)})`;
    });
  }

  function s2(t, sp) {
    const u = t - 2.4, inn = outCubic(seg(t, 2.3, 2.62)), out = seg(t, 4.86, 5.06);
    show(S[1], inn * (1 - out));
    cam(C[1], (0.94 + 0.06 * inn) * (1 + 0.03 * seg(u, 0, 2.6)), -110 * inOutCubic(out));
    rise(r.s2.tag, outCubic(seg(u, 0, 0.35)), 10);
    const lit = [seg(u, 0.3, 0.45), seg(u, 1.12, 1.27), seg(u, 1.45, 1.6)];
    r.s2.hl.forEach((h, i) => { rise(h, outQuint(seg(u, 0.04 + i * 0.07, 0.5 + i * 0.07)), 30); h.style.color = mix(GREY, INK, lit[i]); });
    rise(r.s2.form, outQuint(seg(u, 0, 0.5)), 46);
    const nOn = u > 0.3 && u < 1.12, pOn = u >= 1.12 && u < 1.45;
    r.s2.name.classList.toggle('on', nOn);
    r.s2.price.classList.toggle('on', pOn);
    r.s2.name.firstElementChild.textContent = NAME.slice(0, clamp(Math.floor((u - 0.36) * 30), 0, NAME.length));
    r.s2.price.querySelector('.pf-typed').textContent = '29'.slice(0, clamp(Math.floor((u - 1.18) * 12), 0, 2));
    rise(r.s2.file, outCubic(seg(u, 1.45, 1.7)), 14);
    const up = outCubic(seg(u, 1.52, 2.06));
    r.s2.bar.style.width = `${f2(up * 100)}%`;
    r.s2.size.textContent = up < 1 ? `${Math.round(up * 48)} of 48 MB` : '48 MB, ready';
    const ok = outBack(seg(u, 2.04, 2.26));
    r.s2.ok.style.transform = `scale(${f2(ok)})`;
    const pr = press(u, 2.28), done = seg(u, 2.32, 2.42);
    r.s2.pub.style.transform = `scale(${f2(1 - 0.06 * pr)})`;
    r.s2.pub.style.background = done > 0 ? '#2563eb' : '#0a0a0a';
    r.s2.pa.style.opacity = f2(1 - done); r.s2.pb.style.opacity = f2(done);
    r.s2.st.textContent = done > 0 ? 'Live' : 'Draft';
    const s = (0.94 + 0.06 * inn) * (1 + 0.03 * seg(u, 0, 2.6));
    const k = (p) => camPt(p, s, -110 * inOutCubic(out));
    const a = k({ x: sp.name.x + 60, y: sp.name.y + 6 }), b = k({ x: sp.price.x - 20, y: sp.price.y + 6 }), c = k({ x: sp.pub.x + 10, y: sp.pub.y + 4 });
    return { v: seg(u, 0.12, 0.3) * (1 - seg(u, 2.5, 2.6)), p: Math.max(press(u, 0.3), press(u, 1.13), pr),
      at: along(u, [[0.12, a.x + 160, a.y + 150], [0.3, a.x, a.y], [1.0, a.x + 30, a.y + 10], [1.12, b.x, b.y], [1.5, b.x + 60, b.y + 120], [2.22, c.x, c.y]]) };
  }

  function s3(t, sp) {
    const v = t - 5.0, inn = outCubic(seg(t, 4.92, 5.2)), zoom = inOutCubic(seg(v, 2.28, 2.62));
    show(S[2], inn * (1 - seg(v, 2.5, 2.62)));
    const scroll = -150 * inOutCubic(seg(v, 0.85, 1.65));
    const target = { x: sp.buy.x, y: sp.buy.y + scroll };
    const s = (1 + 0.02 * seg(v, 0, 2.6)) * (1 + 1.6 * zoom);
    const tx = 90 * (1 - inn) + zoom * (640 - (640 + (target.x - 640) * s)), ty = zoom * (360 - (360 + (target.y - 360) * s));
    cam(C[2], s, tx, ty);
    rise(r.s3.tag, outCubic(seg(v, 0.05, 0.4)), 10);
    r.s3.hl.forEach((h, i) => rise(h, outQuint(seg(v, 0.08 + i * 0.07, 0.56 + i * 0.07)), 30));
    rise(r.s3.link, outQuint(seg(v, 0.32, 0.8)), 20);
    r.s3.copy.style.transform = `scale(${f2(1 - 0.12 * press(v, 0.95))})`;
    const toast = seg(v, 1.0, 1.18) * (1 - seg(v, 1.9, 2.05));
    r.s3.toast.style.opacity = f2(toast); r.s3.toast.style.transform = `translateY(${f2((1 - outBack(seg(v, 1.0, 1.25))) * 10)}px)`;
    const ph = outQuint(seg(v, 0, 0.62));
    r.s3.phone.style.transform = `translateY(${f2((1 - ph) * 140)}px) rotate(${f2((1 - ph) * 4)}deg)`;
    r.s3.phone.style.opacity = f2(clamp(ph * 2));
    r.s3.scroll.style.transform = `translateY(${f2(scroll)}px)`;
    const tp = press(v, 2.12, 0.06, 0.1, 0.2), rip = seg(v, 2.06, 2.42);
    r.s3.buy.style.transform = `scale(${f2(1 - 0.05 * tp)})`;
    r.s3.tap.style.left = `${f2(sp.buyIn.x)}px`; r.s3.tap.style.top = `${f2(sp.buyIn.y + scroll)}px`;
    r.s3.tap.style.opacity = f2(rip > 0 && rip < 1 ? 1 - rip : 0);
    r.s3.tap.style.transform = `scale(${f2(0.4 + rip * 1.1)})`;
  }

  function s4(t, sp) {
    const p = t - 7.6, inn = outCubic(seg(t, 7.5, 7.78));
    show(S[3], inn * (1 - seg(t, 10.1, 10.24)));
    cam(C[3], (0.9 + 0.1 * inn) * (1 + 0.03 * seg(p, 0, 2.6)));
    rise(r.s4.tag, outCubic(seg(p, 0.05, 0.4)), 10);
    r.s4.hl.forEach((h, i) => rise(h, outQuint(seg(p, 0.08 + i * 0.08, 0.58 + i * 0.08)), 30));
    rise(r.s4.mor, outCubic(seg(p, 0.35, 0.8)), 16);
    let i = 0; CUR_AT.forEach((a, j) => { if (p >= a) i = j; });
    const c = CUR[i], roll = outCubic(seg(p, CUR_AT[i], CUR_AT[i] + 0.22));
    [[r.s4.p, c[3]], [r.s4.sub, c[3]], [r.s4.tax, c[5]], [r.s4.tot, c[6]]].forEach(([el, txt]) => {
      if (el.textContent !== txt) el.textContent = txt;
      el.style.opacity = f2(i ? roll : 1); el.style.transform = `translateY(${f2(i ? (1 - roll) * 12 : 0)}px)`;
    });
    r.s4.taxl.textContent = c[4]; r.s4.cc.textContent = c[0]; r.s4.cur.textContent = c[1]; r.s4.city.textContent = c[2];
    const pr = press(p, 1.88), paid = seg(p, 1.94, 2.04);
    r.s4.ap.style.transform = `scale(${f2(1 - 0.05 * pr)})`;
    r.s4.ap.style.background = paid > 0 ? '#2563eb' : '#0a0a0a';
    r.s4.apa.style.opacity = f2(1 - paid); r.s4.apb.style.opacity = f2(paid);
    r.s4.sales.forEach((el, j) => { const a = outQuint(seg(p, SALE_AT[j], SALE_AT[j] + 0.4)); el.style.opacity = f2(a); el.style.transform = `translate(${f2((1 - a) * 34)}px, ${SALE_Y[j]}px)`; });
    const s = (0.9 + 0.1 * inn) * (1 + 0.03 * seg(p, 0, 2.6)), ap = camPt({ x: sp.ap.x + 40, y: sp.ap.y + 4 }, s);
    return { v: seg(p, 1.3, 1.5) * (1 - seg(p, 2.3, 2.45)), p: pr, at: along(p, [[1.3, ap.x + 170, ap.y + 160], [1.8, ap.x, ap.y], [2.4, ap.x + 30, ap.y + 40]]) };
  }

  function s5(t) {
    const d = t - 10.2, inn = outCubic(seg(t, 10.14, 10.42));
    show(S[4], inn * (t < 12.8 ? 1 : 0));
    cam(C[4], (0.96 + 0.04 * inn) * (1 + 0.035 * seg(d, 0, 2.6)));
    rise(r.s5.tag, outCubic(seg(d, 0.05, 0.4)), 10);
    r.s5.hl.forEach((h, i) => rise(h, outQuint(seg(d, 0.1 + i * 0.1, 0.6 + i * 0.1)), 30));
    rise(r.s5.db, outQuint(seg(d, 0, 0.5)), 40);
    const k = outCubic(seg(d, 0.15, 1.45));
    r.s5.rev.textContent = `$${Math.round(2480 * k).toLocaleString('en-US')}`;
    r.s5.ord.textContent = String(Math.round(63 * k));
    r.s5.cv.textContent = `${(4.2 * k).toFixed(1)}%`;
    const ln = inOutCubic(seg(d, 0.22, 1.5));
    r.s5.line.style.strokeDashoffset = f2(1 - ln);
    r.s5.area.style.opacity = f2(ln);
    r.s5.dot.style.opacity = f2(seg(d, 1.42, 1.55));
    const ap = FEED_AT.map((a) => outQuint(seg(d, a, a + 0.42)));
    r.s5.feed.forEach((el, i) => {
      const below = ap.slice(i + 1).reduce((s, x) => s + x, 0);
      el.style.opacity = f2(ap[i]);
      el.style.transform = `translateY(${f2(below * 86 - (1 - ap[i]) * 18)}px) scale(${f2(0.96 + 0.04 * ap[i])})`;
    });
  }

  function s6(t) {
    const e = t - 12.8;
    show(S[5], t >= 12.8 ? 1 : 0);
    cam(C[5], 1 + 0.045 * seg(e, 0, 2.2));
    const ic = outBack(seg(e, 0.02, 0.5));
    r.s6.ic.style.transform = `scale(${f2(0.55 + 0.45 * ic)})`; r.s6.ic.style.opacity = f2(seg(e, 0.02, 0.2));
    rise(r.s6.wm, outQuint(seg(e, 0.1, 0.6)), 30, 10);
    rise(r.s6.line, outQuint(seg(e, 0.36, 0.86)), 18);
    r.s6.stats.forEach((s, i) => rise(s, outQuint(seg(e, 0.58 + i * 0.07, 1.0 + i * 0.07)), 14));
    rise(r.s6.url, outCubic(seg(e, 0.88, 1.25)), 10);
    r.s6.url.style.transform += ' translateX(-50%)';
  }

  function render(ftIn) {
    const ft = clamp(ftIn, 0, FILM_DUR);
    if (ft === last && spots && spots.ok) return;
    last = ft;
    const sp = measure();
    const vis = (a, b) => ft > a && ft < b;
    if (vis(-1, 2.5)) s1(ft); else show(S[0], 0);
    let cur = null;
    if (vis(2.25, 5.1)) cur = s2(ft, sp); else show(S[1], 0);
    if (vis(4.9, 7.65)) s3(ft, sp); else show(S[2], 0);
    if (vis(7.48, 10.26)) { const c = s4(ft, sp); if (c.v > 0) cur = c; } else show(S[3], 0);
    if (vis(10.12, 12.8)) s5(ft); else show(S[4], 0);
    if (ft >= 12.8) s6(ft); else show(S[5], 0);
    if (cur && cur.v > 0) {
      r.cur.style.opacity = f2(cur.v);
      r.cur.style.transform = `translate(${f2(cur.at.x - 6)}px, ${f2(cur.at.y - 3)}px) scale(${f2(1 - 0.14 * cur.p)})`;
    } else r.cur.style.opacity = '0';
  }

  return { host, root, render, fit };
}
