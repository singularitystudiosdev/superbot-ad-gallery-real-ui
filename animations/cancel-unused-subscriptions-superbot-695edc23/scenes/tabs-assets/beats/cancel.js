// Superbot cancels the four: one line, two step chips, then the four account pages drawn in code as a stack of mini
// settings panels (each in its own app's look: Peacock black with its yellow, Audible white with its orange, Calm grey
// with its blue-violet, NYT Cooking white with its red), every Cancel button pressed in quick succession. Each press
// flips the matching row in DeepSeek's list to Cancelled (CLOCK.flips) and the savings card counts up to $48.93 a
// month, $587.16 a year.
import { clamp, lerp, seg, outCubic, outBack, inOutCubic, bump } from './anim.js';
import { SUBS, MONTHLY, YEARLY, money, CLOCK } from './subs.js';

const SAY = 'Cancelling all 4 now.';
const CPS = 110;
const CHIPS = [['Signing in to 4 accounts', 'Signed in to 4 accounts'], ['Cancelling 4 plans', 'Cancelled 4 plans']];

export default {
  times(r) {
    const T = { r, say: r + 0.03, deck: r + 0.1 };
    T.press = SUBS.map((_, i) => r + 0.36 + i * 0.2);
    T.flip = T.press.map((p) => p + 0.1);
    T.chips = [{ in: r + 0.06, done: T.press[0] - 0.02 }, { in: T.press[0] - 0.02, done: T.flip[3] + 0.06 }];
    T.sum = T.press[0] - 0.04;
    T.count = T.flip[3] + 0.16; // the savings land on their final figures
    T.end = T.flip[3] + 0.46;
    CLOCK.flips = T.flip;
    return T;
  },
  build(k, { el, esc, OK }) {
    const T = k.T;
    const say = el('<div class="qc-say"></div>');
    const chipRow = el(`<div class="dd-chiprow eb-chiprow">${CHIPS.map(([run]) => `<span class="ch-tool"><i class="spin"></i><span class="ch-tool-t">${esc(run)}</span></span>`).join('')}</div>`);
    const chips = [...chipRow.children].map((n, i) => ({ n, spin: n.querySelector('.spin'), txt: n.querySelector('.ch-tool-t'), c: T.chips[i], words: CHIPS[i], last: null }));
    const deck = el(`<div class="sb-deck">${SUBS.map((s, i) => `<div class="sb-pn sb-pn-${s.id}" style="z-index:${i + 1}">`
      + `<div class="sb-pn-bar"><i></i><i></i><i></i><span>${esc(s.host)}</span></div>`
      + `<div class="sb-pn-b"><b class="sb-pn-wm">${esc(s.name)}</b><span class="sb-pn-pg">${esc(s.page)}</span>`
      + `<span class="sb-pn-pl">${esc(s.pp)}<em>${money(s.price)}/mo</em></span>`
      + `<span class="sb-pn-btn"><i class="sb-pn-rip"></i><span class="sb-pn-bl">${esc(s.btn)}</span><span class="sb-pn-bd">${OK}Cancelled</span></span></div></div>`).join('')}</div>`);
    const pans = [...deck.children].map((n) => ({ n, z: n.style.zIndex, btn: n.querySelector('.sb-pn-btn'), rip: n.querySelector('.sb-pn-rip'), bl: n.querySelector('.sb-pn-bl'), bd: n.querySelector('.sb-pn-bd') }));
    const sum = el(`<div class="dd-card sb-sum"><span class="sb-sum-ic">${OK}</span><div class="sb-sum-t"><b><span class="sb-n">0</span> cancelled.</b>`
      + '<span><em class="sb-mo">$0.00</em> a month saved. <em class="sb-yr">$0.00</em> a year.</span></div></div>');
    const nEl = sum.querySelector('.sb-n'), moEl = sum.querySelector('.sb-mo'), yrEl = sum.querySelector('.sb-yr');
    let shown = -1, lastCount = '';
    return {
      nodes: [say, chipRow, deck, sum],
      marks: [[T.deck, deck], [T.sum, sum]],
      render(t) {
        const n = clamp(Math.floor((t - T.say) * CPS), 0, SAY.length);
        if (n !== shown) { say.innerHTML = `${esc(SAY.slice(0, n))}<span class="qc-hid">${esc(SAY.slice(n))}</span>`; shown = n; }
        chips.forEach((ch) => {
          const p = outBack(seg(t, ch.c.in, ch.c.in + 0.24));
          ch.n.style.opacity = seg(t, ch.c.in, ch.c.in + 0.12).toFixed(3);
          ch.n.style.transform = p >= 1 ? 'none' : `scale(${lerp(0.7, 1, p).toFixed(4)})`;
          const done = t >= ch.c.done;
          ch.spin.classList.toggle('done', done);
          ch.spin.style.transform = done ? 'none' : `rotate(${((t - ch.c.in) * 540).toFixed(1)}deg)`;
          const word = ch.words[done ? 1 : 0];
          if (word !== ch.last) { ch.txt.textContent = word; ch.last = word; }
          ch.n.classList.toggle('sb-chip-done', done);
        });
        pans.forEach((p, i) => {
          const a = T.deck + i * 0.05;
          const q = outCubic(seg(t, a, a + 0.26));
          const pr = T.press[i], fl = T.flip[i];
          const working = t >= pr - 0.08 && t < fl + 0.16;
          const lift = bump(seg(t, pr - 0.08, fl + 0.16));
          p.n.style.opacity = seg(t, a, a + 0.16).toFixed(3);
          p.n.style.transform = `translateY(${((1 - q) * 14 - lift * 5).toFixed(2)}px) scale(${(1 + lift * 0.035).toFixed(4)})`;
          p.n.style.zIndex = working ? '10' : p.z;
          p.n.classList.toggle('sb-on', working);
          p.btn.style.transform = `scale(${(1 - 0.09 * bump(seg(t, pr, pr + 0.12))).toFixed(4)})`;
          const rp = seg(t, pr, pr + 0.32);
          p.rip.style.opacity = rp > 0 && rp < 1 ? ((1 - rp) * 0.45).toFixed(3) : '0';
          p.rip.style.transform = `scale(${lerp(0.2, 3.2, outCubic(rp)).toFixed(3)})`;
          const d = seg(t, fl, fl + 0.12);
          p.bl.style.opacity = (1 - d).toFixed(3);
          p.bd.style.opacity = d.toFixed(3);
          p.n.classList.toggle('sb-done', t >= fl);
        });
        // the savings follow the cancellations: each flip adds that plan's price, the year is twelve months of it
        const s = outCubic(seg(t, T.sum, T.sum + 0.26));
        sum.style.opacity = seg(t, T.sum, T.sum + 0.16).toFixed(3);
        const pop = bump(seg(t, T.count - 0.04, T.count + 0.3));
        sum.style.transform = `translateY(${((1 - s) * 10).toFixed(2)}px) scale(${(1 + pop * 0.025).toFixed(4)})`;
        sum.style.setProperty('--glow', pop.toFixed(3));
        let mo = 0, cnt = 0;
        SUBS.forEach((sub, i) => { mo += sub.price * inOutCubic(seg(t, T.flip[i], T.flip[i] + 0.16)); if (t >= T.flip[i]) cnt++; });
        const fin = t >= T.count;
        const txt = `${cnt}|${fin ? money(MONTHLY) : money(mo)}|${fin ? money(YEARLY) : money(mo * 12)}`;
        if (txt !== lastCount) {
          const [c1, m1, y1] = txt.split('|');
          nEl.textContent = c1; moEl.textContent = m1; yrEl.textContent = y1; lastCount = txt;
        }
      },
    };
  },
};
