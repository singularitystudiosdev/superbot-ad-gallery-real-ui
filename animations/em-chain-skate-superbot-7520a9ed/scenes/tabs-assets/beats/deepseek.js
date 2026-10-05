// DeepSeek V4 Flash: the open-weights model superbot sends to the jobs other assistants decline. It goes through
// the 1688.com slider wall to the factory's own listing (in Chinese), reads shop pages behind Cloudflare and
// Xianyu reviews, then does the arithmetic: factory cost -> landed cost -> what the market pays -> the price.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Most models stop at the wall. Going through it.';
const STEPS = [
  ['Solving the 1688.com slider wall', '1688.com · 7-ply maple OEM · ¥38 at 100 pcs'],
  ['Reading 212 shop pages past Cloudflare', '212 deck listings · median $64.95'],
  ['Searching Xianyu for factory reviews', 'Ningbo factory · 4.8 ★ · ships in 9 days'],
];
// [label, value, source] — the last row is the answer the page ships with
const ROWS = [
  ['Blank + 4-colour print', 5.30, '1688'],
  ['Freight + duty', 3.10, 'Flexport'],
  ['Landed per deck', 8.40, ''],
  ['Shop median', 64.95, '212 pages'],
];
const PRICE = 59;

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.2;
    T.step = STEPS.map((_, i) => r + 0.42 + i * 0.3);
    T.card = r + 1.35;
    T.drag0 = T.card + 0.25; T.drag1 = T.drag0 + 0.7;
    T.open = T.drag1 + 0.12;
    T.row = ROWS.map((_, i) => T.card + 0.55 + i * 0.26);
    T.price = T.row[ROWS.length - 1] + 0.4;
    T.end = T.price + 1.05;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el('<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Running search + scrape</span><b class="yt-count">0 pages</b></div></div>');
    const rows = STEPS.map(([run]) => x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">${x.esc(run)}</span></div></div>`));
    const card = x.el(`<div class="ds-card">
      <div class="ds-web">
        <div class="ds-bar"><i></i><i></i><i></i><span>detail.1688.com/offer/7213604458.html</span></div>
        <div class="ds-page">
          <div class="ds-listing">
            <span class="ds-ph"><img src="${x.img('blank.png')}" alt=""/></span>
            <span class="ds-info">
              <b>7层加拿大枫木滑板 空白板面 OEM定制印刷</b>
              <span class="ds-price"><small>¥</small>38<small>.00</small><i>起批 ≥100件</i></span>
              <span class="ds-meta"><em>宁波工厂</em><em>4.8 ★</em><em>9天发货</em></span>
            </span>
          </div>
          <div class="ds-wall">
            <div class="ds-cap"><b>请按住滑块，拖动到最右边</b><div class="ds-track"><i class="ds-fill"></i><span class="ds-knob"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></span><span class="ds-tt">验证通过</span></div></div>
          </div>
        </div>
      </div>
      <div class="ds-calc">
        ${ROWS.map(([l, v, s], i) => `<div class="ds-row${i === 2 ? ' ds-sum' : ''}"><span>${x.esc(l)}${s ? `<small>${x.esc(s)}</small>` : ''}</span><b data-v="${v}">$0.00</b></div>`).join('')}
        <div class="ds-row ds-ans"><span>Launch price<small>undercuts median 9% · 86% margin</small></span><b>$${PRICE}</b></div>
      </div>
    </div>`);
    const spin = chip.querySelector('.spin'), clab = chip.querySelector('.ch-tool-t'), count = chip.querySelector('.yt-count');
    const beats = rows.map((r) => r.firstElementChild);
    const knob = card.querySelector('.ds-knob'), fill = card.querySelector('.ds-fill'), track = card.querySelector('.ds-track');
    const wall = card.querySelector('.ds-wall'), listing = card.querySelector('.ds-listing');
    const calc = [...card.querySelectorAll('.ds-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    let shown = -1;
    return {
      nodes: [say, chip, ...rows, card],
      marks: [[T.r, say], [T.chip, chip], ...rows.map((r, i) => [T.step[i], r]), [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 90, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const cd = t >= T.price;
        spin.classList.toggle('done', cd);
        spin.style.transform = cd ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        const cl = cd ? 'search + scrape · done' : 'Running search + scrape';
        if (clab.textContent !== cl) clab.textContent = cl;
        const pages = Math.round(214 * outCubic(seg(t, T.chip + 0.1, T.price - 0.3)));
        const ct = `${pages} pages`;
        if (count.textContent !== ct) count.textContent = ct;
        beats.forEach((c, i) => {
          rise(rows[i], seg(t, T.step[i], T.step[i] + 0.3), 8);
          const done = i === 0 ? t >= T.open : t >= T.step[i] + 0.55;
          const sp = c.firstElementChild;
          sp.classList.toggle('done', done);
          sp.style.transform = done ? '' : `rotate(${(((t - T.step[i]) * 450) % 360).toFixed(1)}deg)`;
          const lab = done ? STEPS[i][1] : STEPS[i][0];
          if (c.lastElementChild.textContent !== lab) c.lastElementChild.textContent = lab;
        });

        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? '' : `translateY(${((1 - ci) * 18).toFixed(2)}px)`;
        // the slider wall: the knob is dragged to the end by the agent, the wall reports success and lifts
        const d = seg(t, T.drag0, T.drag1);
        const e = d < 0.5 ? 2 * d * d : 1 - Math.pow(-2 * d + 2, 2) / 2;
        const tw = track.clientWidth - knob.offsetWidth;
        knob.style.transform = `translateX(${(tw * e + Math.sin(d * Math.PI * 3) * 3 * (1 - d)).toFixed(1)}px)`;
        fill.style.width = `${(knob.offsetWidth / 2 + tw * e).toFixed(1)}px`;
        track.classList.toggle('ok', t >= T.drag1);
        const lift = outCubic(seg(t, T.open, T.open + 0.35));
        wall.style.opacity = (1 - lift).toFixed(3);
        wall.style.visibility = lift >= 1 ? 'hidden' : '';
        listing.style.filter = lift >= 1 ? 'none' : `blur(${((1 - lift) * 6).toFixed(2)}px)`;
        // the arithmetic: each row lands and counts up to its value
        calc.forEach((row, i) => {
          if (i < ROWS.length) {
            const p = seg(t, T.row[i], T.row[i] + 0.4);
            rise(row, p * 1.6 > 1 ? 1 : p * 1.6, 6);
            const v = ROWS[i][1] * outCubic(p);
            const s = `$${v.toFixed(2)}`;
            const b = row.lastElementChild;
            if (b.textContent !== s) b.textContent = s;
          } else {
            const p = seg(t, T.price, T.price + 0.45);
            rise(row, p, 8);
            row.style.transform = `${row.style.transform || ''} scale(${lerp(1, 1.04, Math.sin(Math.PI * p)).toFixed(4)})`;
          }
        });
      },
    };
  },
};