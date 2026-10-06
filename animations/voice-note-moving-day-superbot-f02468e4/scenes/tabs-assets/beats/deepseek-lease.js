// DeepSeek V4 Flash reads the 14-page lease PDF and 3 years of email: the lease's pages turn from 1 to 6, where the
// deposit clause (section 6) is highlighted, while an email counter runs to 1,284; then the four facts land with
// their sources: the $2,800 deposit with Greenpoint Realty Mgmt, the 14-day return with photos required, the old
// address (218 Kent Ave, Apt 3R) and the new one (45 Prospect Pl, Apt 2, from the new lease).
import { clamp, seg, inOutCubic } from '../../../lib.js';
import { sayLine, rise } from './kit.js';

const SAY = 'Read the 14-page lease and 3 years of email.';
const PAGES = 14, STOP = 6;
const HEADS = ['RESIDENTIAL LEASE AGREEMENT', '2. TERM AND RENT', '3. UTILITIES', '4. USE OF PREMISES', '5. MAINTENANCE AND REPAIRS', '6. SECURITY DEPOSIT'];
const CLAUSE = ['Tenant has paid a security deposit of $2,800 to', 'Greenpoint Realty Mgmt. The deposit will be returned', 'within 14 days of move-out. Tenant must provide', 'dated move-out photos of every room.'];
const FACTS = [
  ['Deposit', '$2,800 with Greenpoint Realty Mgmt', 'Lease, section 6'],
  ['Return', 'Within 14 days of move-out, photos required', 'Lease, section 6'],
  ['Old address', '218 Kent Ave, Apt 3R', 'Lease, page 1'],
  ['New address', '45 Prospect Pl, Apt 2', 'New lease, email Sep 14'],
];
const EMAILS = 1284;
const IC = {
  pdf: '<svg viewBox="0 0 24 24"><path d="M6 2.5h8l5 5v14H6z"/><path d="M14 2.5v5h5"/></svg>',
  mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>',
};
// a page of generic lease text: a heading, then grey lines of varying length (page 6 carries the real clause)
function pageHTML(i) {
  const lens = [92, 86, 95, 70, 90, 88, 60, 94, 83, 91, 77, 89, 66, 93, 85];
  const lines = (from, n) => Array.from({ length: n }, (_, j) => `<i style="width:${lens[(from + j * 3 + i) % lens.length]}%"></i>`).join('');
  if (i === STOP - 1) {
    return `<div class="dl-pg" data-p="${i + 1}"><div class="dl-ln">${lines(0, 5)}</div><b class="dl-hd">${HEADS[i]}</b>`
      + `<div class="dl-cl">${CLAUSE.map((c) => `<span><mark></mark>${c}</span>`).join('')}</div><div class="dl-ln">${lines(5, 6)}</div><small class="dl-no">6</small></div>`;
  }
  return `<div class="dl-pg" data-p="${i + 1}"><b class="dl-hd${i === 0 ? ' dl-title' : ''}">${HEADS[i] || ''}</b><div class="dl-ln">${lines(i, i === 0 ? 14 : 13)}</div><small class="dl-no">${i + 1}</small></div>`;
}

export default {
  times(r) {
    const T = { say: r + 0.02, card: r + 0.2 };
    T.flips = Array.from({ length: STOP - 1 }, (_, i) => r + 0.5 + i * 0.2); // page i+1 turns away
    T.hl = T.flips[T.flips.length - 1] + 0.3;
    T.count0 = r + 0.5; T.count1 = r + 1.7;
    T.facts = FACTS.map((_, i) => T.hl + 0.45 + i * 0.36);
    T.end = r + 5.0;
    return T;
  },

  cues(T) {
    return [
      ...T.flips.map((t) => ({ t, kind: 'flip' })),
      { t: T.count0, kind: 'whirr', dur: T.count1 - T.count0 },
      { t: T.hl, kind: 'tag' },
      ...T.facts.map((t) => ({ t, kind: 'tag' })),
    ];
  },

  build(k, { el, esc }) {
    const T = k.T;
    const say = sayLine(el, esc, SAY);
    // pages stacked in reverse so page 1 sits on top; each turned page swings away about its left edge
    const pages = Array.from({ length: STOP }, (_, i) => pageHTML(i)).reverse().join('');
    const thumbs = Array.from({ length: PAGES }, (_, i) => `<i data-p="${i + 1}"></i>`).join('');
    const card = el(`<div class="mv-card dl-card">
  <div class="dl-pdf">
    <div class="dl-ph"><span>${IC.pdf}Lease_218_Kent_Ave.pdf</span><b class="dl-pn">1 / 14</b></div>
    <div class="dl-book">${pages}</div>
    <div class="dl-th">${thumbs}</div>
  </div>
  <div class="dl-side">
    <div class="dl-mail">${IC.mail}<span>Email, Oct 2023 to Oct 2026</span><b class="dl-cnt">0</b></div>
    ${FACTS.map(([l, v, src]) => `<div class="dl-f"><small>${esc(l)}</small><b>${esc(v)}</b><em>${esc(src)}</em></div>`).join('')}
  </div>
</div>`.replace(/>\s+</g, '><'));
    const pgs = [...card.querySelectorAll('.dl-pg')].reverse();
    const n = {
      pgs, pn: card.querySelector('.dl-pn'), th: [...card.querySelectorAll('.dl-th i')], cnt: card.querySelector('.dl-cnt'),
      marks: [...card.querySelectorAll('.dl-cl mark')], facts: [...card.querySelectorAll('.dl-f')],
    };
    let lastPn = '', lastCnt = '';

    return {
      nodes: [say.node, card],
      marks: [[T.card, card]],
      render(t) {
        say.render(t, T.say);
        rise(card, t, T.card, 14);
        let cur = 1;
        n.pgs.forEach((pg, i) => {
          if (i >= STOP - 1) return;
          const f = inOutCubic(seg(t, T.flips[i], T.flips[i] + 0.22));
          if (f > 0.5) cur = i + 2;
          pg.style.transform = f <= 0 ? 'none' : `perspective(700px) rotateY(${(-f * 100).toFixed(2)}deg)`;
          pg.style.opacity = f >= 1 ? '0' : '1';
          pg.style.boxShadow = f > 0 && f < 1 ? `${(-f * 14).toFixed(1)}px 0 18px rgba(0,0,0,${(0.35 * Math.sin(Math.PI * f)).toFixed(3)})` : '';
        });
        const pn = `${cur} / ${PAGES}`;
        if (pn !== lastPn) { n.pn.textContent = pn; n.th.forEach((x, i) => x.classList.toggle('on', i + 1 === cur)); lastPn = pn; }
        n.marks.forEach((m, i) => { m.style.width = (inOutCubic(seg(t, T.hl + i * 0.12, T.hl + i * 0.12 + 0.22)) * 100).toFixed(2) + '%'; });
        const c = Math.round(EMAILS * inOutCubic(clamp(seg(t, T.count0, T.count1))));
        const cs = c.toLocaleString('en-US');
        if (cs !== lastCnt) { n.cnt.textContent = cs; lastCnt = cs; }
        n.facts.forEach((f, i) => rise(f, t, T.facts[i], 8, 0.3));
      },
    };
  },
};
