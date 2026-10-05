// Shots 4-6 of the Pocketsflow launch film: tax handled worldwide, the week's revenue landing, the logo lockup.
// Same contract as shots-a: build once, render(u) a pure function of the shot's local time.
import { clamp, lerp, seg, outCubic, outQuint, outBack, inOutCubic } from '../lib.js';
import { el, words, lines, rise, land, push, money, setText } from './kit.f2628f01.js';
import { tile, worldDots, proj, MAP } from './art.f2628f01.js';

const CHECK = '<svg class="pff-ck" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const icon = (src) => `<img class="pff-pf" src="${src}" alt=""/>`;
const PF_ICON = new URL('../brand/pocketsflow-icon.png', import.meta.url).href;

// ---------- 4. global: every order taxed right, wherever it lands ----------
const MAP_X = 60, MAP_Y = 236;
const CITIES = [
  { c: 'Lisbon', lon: -9.1, lat: 38.7, amt: '€21.40', tax: 'IVA 23% handled', dx: -232, dy: 44 },
  { c: 'New York', lon: -74, lat: 40.7, amt: '$23.20', tax: 'Sales tax 8.875% handled', dx: -150, dy: -96 },
  { c: 'London', lon: -0.1, lat: 51.5, amt: '£18.30', tax: 'UK VAT 20% handled', dx: -150, dy: -122 },
  { c: 'Berlin', lon: 13.4, lat: 52.5, amt: '€21.40', tax: 'VAT 19% handled', dx: 54, dy: -104 },
  { c: 'Tokyo', lon: 139.7, lat: 35.7, amt: '¥3,480', tax: 'JCT 10% handled', dx: -150, dy: -128 },
  { c: 'Sydney', lon: 151.2, lat: -33.9, amt: 'A$35.60', tax: 'GST 10% handled', dx: -250, dy: -10 },
];
export const globe = {
  build(sec) {
    const pts = CITIES.map((c) => { const p = proj(c.lon, c.lat); return { ...c, x: MAP_X + p.x, y: MAP_Y + p.y }; });
    const CW = 196, CH = 54;
    const lead = pts.map((p) => {
      const cx = p.x + p.dx + CW / 2, cy = p.y + p.dy + CH / 2;
      const ex = clamp(p.x, p.x + p.dx, p.x + p.dx + CW), ey = clamp(p.y, p.y + p.dy, p.y + p.dy + CH);
      return `<line x1="${p.x.toFixed(1)}" y1="${p.y.toFixed(1)}" x2="${(ex === p.x ? cx : ex).toFixed(1)}" y2="${(ey === p.y ? cy : ey).toFixed(1)}"/>`;
    });
    sec.innerHTML = `<div class="pff-cam">
      <h2 class="pff-h2 pff-gl-h">${lines([words('Tax, VAT, fraud.'), `${words('Handled in')} <span class="pff-mkr"><i class="pff-mkr-bar"></i>${words('160+ countries.')}</span>`])}</h2>
      <img class="pff-map" src="${worldDots()}" alt="" style="left:${MAP_X}px;top:${MAP_Y}px;width:${MAP.w}px;height:${MAP.h}px"/>
      <svg class="pff-lead" viewBox="0 0 1280 720">${lead.join('')}</svg>
      ${pts.map((p) => `<i class="pff-ping" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px"><i class="pff-ring"></i></i>
        <div class="pff-rx" style="left:${(p.x + p.dx).toFixed(1)}px;top:${(p.y + p.dy).toFixed(1)}px;width:${CW}px"><div><b>${p.c}</b><span>${p.amt}</span></div><small>${p.tax}</small></div>`).join('')}
      <div class="pff-mor"><b>Pocketsflow is your merchant of record</b>
        ${['Sales tax and VAT filed for you', 'Every order screened for fraud', 'Chargebacks handled'].map((r) => `<span>${CHECK}${r}</span>`).join('')}</div>
    </div>`;
    const q = (s) => [...sec.querySelectorAll(s)];
    const st = { cam: sec.firstElementChild, w: q('.pff-gl-h .pff-line:first-child .pff-w'), w2: q('.pff-gl-h .pff-line:last-child .pff-w'), bar: sec.querySelector('.pff-mkr-bar'), map: sec.querySelector('.pff-map'), pings: q('.pff-ping'), rings: q('.pff-ring'), rx: q('.pff-rx'), lines: q('.pff-lead line'), mor: sec.querySelector('.pff-mor'), morR: q('.pff-mor span') };
    return {
      render(u) {
        push(st.cam, u, 2.4, 1.035);
        rise(st.w, u, 0.0, 0.06);
        rise(st.w2, u, 0.22, 0.06);
        st.bar.style.transform = `scaleX(${outQuint(seg(u, 0.55, 0.95)).toFixed(4)})`;
        land(st.map, seg(u, 0, 0.5), 0, 10);
        st.pings.forEach((n, i) => {
          const a = 0.3 + i * 0.2;
          const p = outBack(seg(u, a, a + 0.3));
          n.style.transform = `translate(-50%,-50%) scale(${clamp(p, 0, 1.4).toFixed(3)})`;
          const r = seg(u, a, a + 0.9);
          st.rings[i].style.transform = `translate(-50%,-50%) scale(${lerp(1, 4.2, outCubic(r)).toFixed(3)})`;
          st.rings[i].style.opacity = (r > 0 ? 1 - r : 0).toFixed(3);
          land(st.rx[i], seg(u, a + 0.08, a + 0.4), 0, 10, 0.92);
          st.lines[i].style.opacity = outCubic(seg(u, a + 0.05, a + 0.3)).toFixed(3);
        });
        land(st.mor, seg(u, 1.35, 1.75), 0, 18);
        st.morR.forEach((n, i) => land(n, seg(u, 1.5 + i * 0.12, 1.8 + i * 0.12), -10, 0));
      },
    };
  },
};

// ---------- 5. payouts: the week's revenue counts up, sales keep arriving ----------
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const VALS = [225, 295, 257, 375, 332, 461, 535];   // sums to $2,480: the week pocketsflow.com's own demo reports
const NOTES = [
  ['New sale: Presets Vol. 3', '$23.20 from Lisbon'],
  ['New sale: Presets Vol. 3', '¥3,480 from Tokyo'],
  ['New sale: Portra 400 Preset Pack', '$29.00 from London'],
  ['Weekly payout sent', 'On its way to your bank'],
];
export const payouts = {
  build(sec) {
    sec.innerHTML = `<div class="pff-cam">
      <h2 class="pff-h2 pff-po-h">${lines([`${words('Get paid.')} <span class="pff-mute">${words('Watch it grow.')}</span>`])}</h2>
      <div class="pff-dash">
        <div class="pff-dh">${icon(PF_ICON)}<b>Revenue</b><span class="pff-seg"><i>Today</i><i class="on">This week</i><i>Month</i></span></div>
        <div class="pff-big"><span class="pff-num">$0.00</span><span class="pff-up">+18% vs last week</span></div>
        <div class="pff-sub"><span><b class="pff-ord">0</b> orders</span><span><b>$39.37</b> average order</span><span>Next payout <b>Friday</b></span></div>
        <div class="pff-chart">
          ${[600, 400, 200, 0].map((v, i) => `<i class="pff-gl" style="top:${i * 56}px"><span>$${v}</span></i>`).join('')}
          ${VALS.map((v, i) => `<div class="pff-col" style="left:${70 + i * 88}px"><span class="pff-bv">$${v}</span><i class="pff-b${i === 6 ? ' pff-b-now' : ''}" style="height:${(v / 600 * 168).toFixed(1)}px"></i><small>${DAYS[i]}</small></div>`).join('')}
        </div>
      </div>
      <div class="pff-notes">${NOTES.map(([a, b]) => `<div class="pff-nt">${icon(PF_ICON)}<div><span class="pff-nt-h"><b>Pocketsflow</b><small>now</small></span><b class="pff-nt-t">${a}</b><small>${b}</small></div></div>`).join('')}</div>
    </div>`;
    const q = (s) => [...sec.querySelectorAll(s)];
    const st = { cam: sec.firstElementChild, w: q('.pff-po-h .pff-w'), dash: sec.querySelector('.pff-dash'), num: sec.querySelector('.pff-num'), up: sec.querySelector('.pff-up'), ord: sec.querySelector('.pff-ord'), bars: q('.pff-b'), bv: q('.pff-bv'), notes: q('.pff-nt') };
    return {
      render(u) {
        push(st.cam, u, 2.4, 1.03);
        rise(st.w, u, 0.0, 0.07);
        land(st.dash, seg(u, 0.0, 0.42), 0, 26);
        const c = outCubic(seg(u, 0.15, 1.45));
        setText(st.num, money(Math.round(2480 * c * 100) / 100));
        setText(st.ord, String(Math.round(63 * c)));
        land(st.up, seg(u, 1.3, 1.6), 0, 8, 0.7);
        st.bars.forEach((b, i) => {
          const p = outCubic(seg(u, 0.28 + i * 0.09, 0.78 + i * 0.09));
          b.style.transform = `scaleY(${p.toFixed(4)})`;
          st.bv[i].style.opacity = seg(u, 0.7 + i * 0.09, 0.9 + i * 0.09).toFixed(3);
        });
        // notifications arrive at the top of the stack and push the older ones down
        const AT = [0.3, 0.72, 1.14, 1.56], H = 96;
        st.notes.forEach((n, i) => {
          const p = outQuint(seg(u, AT[i], AT[i] + 0.45));
          const below = AT.slice(i + 1).reduce((s, a) => s + outQuint(seg(u, a, a + 0.45)), 0);
          n.style.opacity = p.toFixed(3);
          n.style.transform = `translate3d(0,${((1 - p) * -30 + below * H).toFixed(2)}px,0) scale(${lerp(0.94, 1, p).toFixed(4)})`;
        });
      },
    };
  },
};

// ---------- 6. lockup: yellow wipe, the mark, the line, the numbers ----------
const STATS = [[65, 'K+', 'creators selling', ''], [160, '+', 'countries', ''], [70, 'M+', 'processed', '$']];
export const LOCK_WIPE = 0.34;
export const lockup = {
  build(sec, id) {
    sec.innerHTML = `<div class="pff-lk-y"></div><div class="pff-cam">
      <img class="pff-lk-ic" src="${PF_ICON}" alt=""/>
      <div class="pff-lk-wm">${'Pocketsflow'.split('').map((ch) => `<span class="pff-w">${ch}</span>`).join('')}</div>
      <p class="pff-lk-tg"><span class="pff-line">${words('The payment infrastructure you deserve.')}</span></p>
      <div class="pff-lk-st">${STATS.map(([, s, l, p]) => `<div><b>${p}0${s}</b><small>${l}</small></div>`).join('')}</div>
      <span class="pff-lk-url">pocketsflow.com</span>
      <div class="pff-lk-t pff-lk-t1">${tile('zine', `${id}l1`)}</div>
      <div class="pff-lk-t pff-lk-t2">${tile('presets', `${id}l2`)}</div>
    </div>`;
    const q = (s) => [...sec.querySelectorAll(s)];
    const st = { y: sec.firstElementChild, cam: sec.lastElementChild, ic: sec.querySelector('.pff-lk-ic'), wm: q('.pff-lk-wm .pff-w'), tg: q('.pff-lk-tg .pff-w'), stats: q('.pff-lk-st > div'), nums: q('.pff-lk-st b'), url: sec.querySelector('.pff-lk-url'), tiles: q('.pff-lk-t') };
    return {
      render(u) {
        const wp = inOutCubic(seg(u, 0, LOCK_WIPE));
        st.y.style.transform = `translate3d(${((1 - wp) * 100).toFixed(2)}%,0,0)`;
        st.cam.style.opacity = u < LOCK_WIPE * 0.6 ? '0' : '1';
        push(st.cam, u, 2.4, 1.03);
        const ic = outBack(seg(u, 0.24, 0.66));
        st.ic.style.opacity = clamp(ic * 2).toFixed(3);
        st.ic.style.transform = `scale(${lerp(0.5, 1, ic).toFixed(4)}) rotate(${((1 - ic) * -10).toFixed(2)}deg)`;
        rise(st.wm, u, 0.3, 0.028, 0.5);
        rise(st.tg, u, 0.72, 0.05, 0.5);
        st.stats.forEach((n, i) => land(n, seg(u, 0.85 + i * 0.08, 1.15 + i * 0.08), 0, 16));
        st.nums.forEach((n, i) => {
          const [v, s, , p] = STATS[i];
          setText(n, `${p}${Math.round(v * outCubic(seg(u, 0.85 + i * 0.08, 1.15 + i * 0.08)))}${s}`);
        });
        land(st.url, seg(u, 1.45, 1.8), 0, 12, 0.9);
        st.tiles.forEach((n, i) => {
          const p = seg(u, 0.55 + i * 0.16, 1.15 + i * 0.16), e = outBack(p);
          n.style.opacity = outCubic(seg(p, 0, 0.4)).toFixed(3);
          n.style.transform = `translate3d(${((1 - e) * 160).toFixed(2)}px,0,0) rotate(${lerp(i ? 18 : -14, i ? 8 : -6, e).toFixed(2)}deg)`;
        });
      },
    };
  },
};
