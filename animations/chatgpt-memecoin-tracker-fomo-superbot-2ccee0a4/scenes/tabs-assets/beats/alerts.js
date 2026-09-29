// Ask 2's answer ("Looks good, let's do it"): superbot turns the alerts on and the fomo app opens out of the thread,
// drawn in the style of fomo's own screens (App Store shots, fomo 1.94): the profile band, then a watched token's
// 5-minute volume bars with the 3x-average line, its market stats, and the watchlist. It is an information screen
// only: no holdings and no action button anywhere in frame. As the volume bars cross the 3x line the
// first superbot alert lands over the app, and three more stack above it, iOS-banner style, each lighting its row.
// Two copies are built from the same markup: the one in the thread and the full-frame one in the scene root
// (outside the scaled hub); both are driven by the same clock, so the handoff between them is invisible.
import { lerp, seg, outCubic, outBack, inOutCubic, rand, streamCount } from '../../../lib.js';
import { WATCH, fmtPx, fmtCh } from './tracker.js';

const SAY = 'Alerts are on. Watching fomo for you.';
const FEAT = WATCH[0]; // $PAID, the token the volume bars belong to
const LIST = [2, 1, 5, 3].map((i) => WATCH[i]); // $JEANPHIL, $STONK, $CATE, $neet
const NB = 24; // 5-minute volume bars, as a multiple of the average bar
const BARS = Array.from({ length: NB }, (_, i) => (i >= NB - 3 ? [1.55, 2.3, 3.4][i - (NB - 3)] : 0.62 + rand(i * 17 + 5) * 0.72));
const BMAX = 3.7, CW = 390, CH = 118;
// the alerts: title, body, token icon, the watchlist row it lights (-1: the volume panel)
const NOTES = [
  { t: 'Volume spike · $PAID', b: 'Volume 3.4x its 5m average.', icon: 'paid.png', row: -1 },
  { t: 'Holder surge · $JEANPHIL', b: 'Holders +22% in the last hour, now 7.4K.', icon: 'jeanphil.png', row: 0 },
  { t: 'Trending · $CATE', b: "Entered fomo's top 10 trending.", icon: 'cate.png', row: 2 },
  { t: 'Price move · $STONK', b: 'Moved 10%+ in the last 15m.', icon: 'stonk.png', row: 1 },
];
const NT_H = 78; // one banner plus its gap
const ICONS = {
  gift: '<path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/>',
  hist: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4M12 8v4l3 2"/>',
  share: '<path d="M12 3v12M7 8l5-5 5 5M5 13v7h14v-7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  bell: '<path d="M10.3 21a2 2 0 0 0 3.4 0M4 17h16c-1.3-1.4-2-3-2-9A6 6 0 0 0 6 8c0 6-.7 7.6-2 9z"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  cal: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/>',
};
const ico = (n) => `<svg class="fo-i" viewBox="0 0 24 24">${ICONS[n]}</svg>`;
const BELL = `<svg viewBox="0 0 24 24">${ICONS.bell}</svg>`;

function times(r) {
  const T = { r, card: r + 0.25 };
  T.live = T.card + 0.45;
  T.zoom = T.live + 0.35;
  T.zoomEnd = T.zoom + 0.9;
  T.notes = NOTES.map((_, i) => T.zoomEnd + 0.15 + i * 0.8);
  T.watchEnd = T.live + 4.4;
  T.end = T.watchEnd + 1.3;
  return T;
}

function screenHtml(x, cls) {
  const bw = CW / NB;
  const yT = CH - (3 / BMAX) * CH;
  const bars = BARS.map((v, i) => `<rect class="fo-bar${v >= 3 ? ' hot' : ''}" x="${(i * bw + 1.5).toFixed(2)}" width="${(bw - 3).toFixed(2)}" y="${CH}" height="0" rx="2"/>`).join('');
  return `<div class="fo-win ${cls}">
    <div class="fo-prof">
      <div class="fo-top"><span class="fo-av"><i>${ico('pen')}</i></span><span class="fo-tools">${ico('gift')}${ico('hist')}${ico('share')}${ico('gear')}</span></div>
      <div class="fo-name">sam <img class="fo-clan" src="${x.sbSrc}" alt=""/></div>
      <div class="fo-handle">@sam</div>
      <div class="fo-bio"><i class="fo-dot"></i>superbot is watching 8 tokens (read-only)</div>
      <div class="fo-stats"><b>18</b> Following <b>342</b> Followers</div>
      <div class="fo-meta">${ico('bell')}<span>5 alert rules</span>${ico('eye')}<span>Read-only</span>${ico('cal')}<span>Joined Sep 2026</span></div>
    </div>
    <div class="fo-pf">
      <div class="fo-feat">
        <img class="fo-fti" src="${x.brand('tokens/' + FEAT.icon)}" alt=""/>
        <div class="fo-ftn"><b>Paid</b><small>${FEAT.tk} &middot; Holders ${FEAT.hold}</small></div>
        <div class="fo-ftp"><b>${fmtPx(FEAT.px)}</b><small class="${FEAT.ch < 0 ? 'dn' : ''}">${fmtCh(FEAT.ch)} 24h</small></div>
      </div>
      <div class="fo-vh"><span>Volume, 5m bars</span><div class="fo-tf"><span class="on">5m</span><span>1h</span><span>24h</span></div></div>
      <div class="fo-vbox">
        <svg class="fo-vol" viewBox="0 0 ${CW} ${CH}">${bars}
          <line class="fo-avg" x1="0" x2="${CW}" y1="${yT.toFixed(2)}" y2="${yT.toFixed(2)}"/></svg>
        <span class="fo-avgl" style="top:${(yT - 17).toFixed(1)}px">3x avg</span>
      </div>
      <div class="fo-s3"><div><small>Volume 24h</small><b>${FEAT.vol}</b></div><div><small>Holders</small><b>${FEAT.hold}</b></div><div><small>Liquidity</small><b>${FEAT.liq}</b></div></div>
      <div class="fo-posh"><span>Watchlist <em class="fo-n">(8)</em></span><span class="fo-oc"><span class="on">Alerts on <i></i></span></span></div>
      <div class="fo-rows">${LIST.map((w) => `<div class="fo-row"><span class="fo-ti"><img src="${x.brand('tokens/' + w.icon)}" alt=""/><i>${BELL}</i></span>
        <span class="fo-rt"><b>${w.tk}</b><small>Holders ${w.hold} &middot; Liq ${w.liq}</small></span><span class="fo-rv"><b>${fmtPx(w.px)}</b><small class="${w.ch < 0 ? 'dn' : ''}">${fmtCh(w.ch)}</small></span></div>`).join('')}</div>
    </div>
    <div class="fo-ntdim"></div>
    <div class="fo-nts">${NOTES.map((n) => `<div class="fo-nt"><img class="fo-nt-ic" src="${x.sbSrc}" alt=""/>
      <div class="fo-nt-tx"><div class="fo-nt-hd"><b>superbot</b><span>now</span></div><b class="fo-nt-t">${n.t}</b><span class="fo-nt-b">${n.b}</span></div>
      <img class="fo-nt-tok" src="${x.brand('tokens/' + n.icon)}" alt=""/></div>`).join('')}</div>
  </div>`;
}

function build(k, x) {
  const T = k.T;
  const mk = (cls) => {
    const win = x.el(screenHtml(x, cls));
    const q = (s) => win.querySelector(s);
    return {
      win, bars: [...win.querySelectorAll('.fo-bar')], avg: q('.fo-avg'), avgl: q('.fo-avgl'), vbox: q('.fo-vbox'),
      rows: [...win.querySelectorAll('.fo-row')], notes: [...win.querySelectorAll('.fo-nt')], dim: q('.fo-ntdim'),
    };
  };
  const inT = mk('fo-in');
  const big = mk('fo-big');
  x.root.appendChild(big.win);

  const sayEl = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
  const vis = sayEl.firstElementChild, hid = sayEl.lastElementChild;
  let shown = -1;
  const site = x.hub.closest('.sbsite');

  function paint(w, t) {
    // the volume bars fill in left to right; the last one crosses the 3x line as the first alert lands
    const span = T.notes[0] - 0.12 - T.live;
    w.bars.forEach((b, i) => {
      const a = T.live + (i / (NB - 1)) * span - 0.25;
      const h = (BARS[i] / BMAX) * CH * outCubic(seg(t, a, a + 0.25));
      b.setAttribute('y', (CH - h).toFixed(2));
      b.setAttribute('height', h.toFixed(2));
    });
    const hit = seg(t, T.notes[0] - 0.1, T.notes[0] + 0.2);
    w.avg.style.opacity = lerp(0.55, 1, hit).toFixed(3);
    w.avgl.classList.toggle('hot', t >= T.notes[0] - 0.1);
    const glow = Math.max(0, 1 - Math.abs(t - T.notes[0] - 0.2) / 0.9);
    w.vbox.style.boxShadow = glow > 0 ? `inset 0 0 0 1px rgba(84,104,252,${(0.7 * glow).toFixed(3)})` : '';

    // each alert lights its watchlist row, then leaves a small blue dot on it
    w.rows.forEach((r, j) => {
      const i = NOTES.findIndex((n) => n.row === j);
      if (i < 0) { r.style.background = ''; return; }
      const f = Math.max(0, 1 - Math.max(0, t - T.notes[i]) / 1.4) * (t >= T.notes[i] ? 1 : 0);
      r.style.background = f > 0 ? `rgba(84,104,252,${(0.16 * f).toFixed(3)})` : '';
      r.classList.toggle('lit', t >= T.notes[i]);
    });

    // a scrim behind the banners grows with the stack, so the app under them never reads through the gaps
    let stack = 0;
    T.notes.forEach((a) => { stack += inOutCubic(seg(t, a, a + 0.4)); });
    w.dim.style.height = stack > 0 ? `${(12 + stack * NT_H + 40).toFixed(2)}px` : '0px';
    w.dim.style.opacity = seg(t, T.notes[0], T.notes[0] + 0.3).toFixed(3);

    // the banners: each drops in at the top, and every newer one pushes the older ones down
    w.notes.forEach((n, i) => {
      const a = T.notes[i];
      const p = seg(t, a, a + 0.45);
      if (p <= 0) { n.style.opacity = '0'; return; }
      let y = 0;
      for (let j = i + 1; j < NOTES.length; j++) y += NT_H * inOutCubic(seg(t, T.notes[j], T.notes[j] + 0.4));
      const e = outBack(p, 1.2);
      n.style.opacity = seg(t, a, a + 0.2).toFixed(3);
      n.style.transform = `translateY(${(y + (1 - e) * -70).toFixed(2)}px) scale(${lerp(0.94, 1, outCubic(p)).toFixed(4)})`;
    });
  }

  function render(t) {
    const n = streamCount(SAY, T.r + 0.05, 70, t);
    if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
    const ci = seg(t, T.card, T.card + 0.5), e = outCubic(ci);
    inT.win.style.opacity = e.toFixed(3);
    inT.win.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - e) * 16).toFixed(2)}px) scale(${lerp(0.975, 1, e).toFixed(4)})`;
    paint(inT, t);

    // the zoom: the full-frame copy starts exactly over the thread copy, then flies to the centre of the frame
    if (t < T.zoom) { big.win.style.opacity = '0'; site.style.opacity = ''; return; }
    paint(big, t);
    const b = x.box(inT.win);
    const W0 = big.win.offsetWidth, H0 = big.win.offsetHeight;
    const RW = x.root.offsetWidth, RH = x.root.offsetHeight;
    const fit = Math.min((RW * 0.9) / W0, (RH * 0.94) / H0);
    const z = inOutCubic(seg(t, T.zoom, T.zoomEnd));
    const s = lerp(b.w / W0, fit, z);
    const tx = lerp(b.x, (RW - W0 * fit) / 2, z), ty = lerp(b.y, (RH - H0 * fit) / 2, z);
    big.win.style.opacity = '1';
    big.win.style.transform = `translate(${tx.toFixed(2)}px, ${ty.toFixed(2)}px) scale(${s.toFixed(4)})`;
    site.style.opacity = lerp(1, 0.12, seg(t, T.zoom, T.zoomEnd)).toFixed(3);
  }

  return { nodes: [sayEl, inT.win], marks: [[T.r, sayEl], [T.card, inT.win]], render };
}

export default { times, build };
