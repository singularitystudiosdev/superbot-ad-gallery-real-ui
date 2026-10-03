// Reports beat: Gemini reads the player reports and the save logs of Lantern Bay Tycoon. Its line streams and a card
// rises (the sibling's repo.js grammar: a compact card, a counter, rows that resolve). First one player report, in a
// neutral superbot card (never a copy of Discord, Roblox or any other app's UI): a message glyph, the fictional
// player name, the report text, and a thin bar the save logs are read along ("Reading the save logs", spinner
// resolving to the check, 0/86 counting up). Then "Reading N player reports" ticks up to 1,240 and three findings
// resolve as rows (file glyph, mono path, one tag, the finding); the first, the root cause DataManager.luau:58,
// carries the highlight. The footer lands: "Root cause found across 1,240 player reports". Every name, path and
// number is made up for the spot (the player name was checked against users.roblox.com: no such user). Pure function
// of t: every moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { lerp, seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';
import { lc } from './lucide-icons.js?v=dfb32441';

const SAY = 'Read the player reports and the save logs for Lantern Bay Tycoon.';
export const REPORT = { player: 'PebbleQuayKid', text: 'Rejoined after a crash and my whole tycoon was gone', logs: 86 };
const TOTAL = 1240;
// the findings: [path, finding, tag, highlighted]
const FINDINGS = [
  ['src/server/DataManager.luau:58', 'When a load fails, a blank save overwrites the real one', 'Root cause', true],
  ['src/server/DataManager.luau:91', 'SetAsync lets a stale server overwrite newer data on rejoin', 'Rejoin', false],
  ['tests/DataManager.spec.luau', 'No test fails a load or rejoins on a second server', 'Gap', false],
];
const DONE = 'Root cause found across 1,240 player reports';
// timing (seconds from the reply start, or from the card where noted): the sibling's repo beat, unchanged
const CPS = 100;                       // the reply line streams at this many characters a second
const SAY_AT = 0.048;                  // reply start to the line's first character
const CARD = 0.144;                    // reply start to the card rising in
const RISE = 0.36;                     // the card rising in
const READ_AT = 0.12;                  // the card landing to the logs starting to be read
const READ = 0.5; /* deliberate */     // the logs read end to end (its bar fills)
const COUNT_AT = 0.08;                 // the logs read to the report counter starting
const COUNT = 0.6; /* deliberate */    // the counter running up to 1,240 (its bar fills with it)
const ROW_AT = 0.24;                   // the counter starting to the first finding
const STAGGER = 0.14;                  // one finding to the next
const ROW_IN = 0.24;                   // a finding rising in
const FOOT_AT = 0.24;                  // the last finding starting to the footer
const FOOT_IN = 0.24;                  // the footer rising in

const fmt = (n) => n.toLocaleString('en-US');

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.p0 = T.card + READ_AT;
    T.p1 = T.p0 + READ;
    T.c0 = T.p1 + COUNT_AT;
    T.c1 = T.c0 + COUNT;
    T.row = FINDINGS.map((_, i) => T.c0 + ROW_AT + i * STAGGER);
    T.foot = Math.max(T.row[FINDINGS.length - 1] + FOOT_AT, T.c1);
    T.end = Math.max(T.foot + FOOT_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="rr-card">
      <div class="rr-iss">
        ${lc('message-square-warning', 'rr-io')}
        <div class="rr-meta">
          <span class="rr-l2"><span class="rr-who">${x.esc(REPORT.player)}</span><i class="rr-lb">Player report</i></span>
          <span class="rr-title"><b>${x.esc(REPORT.text)}</b></span>
          <span class="rr-hd"><span class="rr-st"><i class="rr-spin"></i>${x.OK}</span>Reading the save logs<span class="rr-tc">0/${REPORT.logs}</span></span>
          <i class="rr-bar"><i class="rr-fill"></i></i>
        </div>
      </div>
      <div class="rr-ch"><span class="rr-st"><i class="rr-spin"></i>${x.OK}</span><b>Reading <span class="rr-n">0</span> player reports</b></div>
      <i class="rr-cbar"><i></i></i>
      <div class="rr-list">${FINDINGS.map(([path, text, tag, hi]) => `<div class="rr-row${hi ? ' rr-hi' : ''}">${lc('file-code', 'rr-fi')}
        <div class="rr-main"><span class="rr-r1"><code>${x.esc(path)}</code><span class="rr-tag">${x.esc(tag)}</span></span><span class="rr-tx">${x.esc(text)}</span></div></div>`).join('')}</div>
      <div class="rr-ft">${x.OK}<span>${x.esc(DONE)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const [vSt, cSt] = [...card.querySelectorAll('.rr-st')].map((n) => ({ spin: n.querySelector('.rr-spin'), ok: n.querySelector('.qc-ok') }));
    const fill = $('.rr-fill'), tc = $('.rr-tc');
    const ch = $('.rr-ch'), cbarW = $('.rr-cbar'), cbar = $('.rr-cbar i'), n = $('.rr-n'), ft = $('.rr-ft');
    const rows = [...card.querySelectorAll('.rr-row')];
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, count = '', read = '';

    const status = (s, t, a, b) => {
      const d = outCubic(seg(t, b, b + 0.2));
      s.spin.style.opacity = (1 - seg(t, b - 0.08, b + 0.06)).toFixed(3);
      s.spin.style.transform = `rotate(${((t - a) * 420).toFixed(1)}deg)`;
      s.ok.style.opacity = d.toFixed(3);
      s.ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.row[1], rows[1]], [T.foot, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the save logs: read end to end, the counter running 0/86 to 86/86
        const p = inOutCubic(seg(t, T.p0, T.p1));
        fill.style.transform = `scaleX(${p.toFixed(4)})`;
        const c = `${Math.round(p * REPORT.logs)}/${REPORT.logs}`;
        if (c !== read) { tc.textContent = c; read = c; }
        status(vSt, t, T.card, T.p1);

        // the report counter and its bar
        const cin = outCubic(seg(t, T.c0 - 0.1, T.c0 + 0.14));
        ch.style.opacity = cin.toFixed(3);
        cbarW.style.opacity = cin.toFixed(3);
        const q = inOutCubic(seg(t, T.c0, T.c1));
        const cn = fmt(Math.round(TOTAL * q));
        if (cn !== count) { n.textContent = cn; count = cn; }
        cbar.style.transform = `scaleX(${q.toFixed(4)})`;
        status(cSt, t, T.c0, T.c1);

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        const f = outCubic(seg(t, T.foot, T.foot + FOOT_IN));
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
