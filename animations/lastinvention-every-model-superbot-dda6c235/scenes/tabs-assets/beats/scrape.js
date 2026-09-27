// Scrape beat, the fact check: the routed model (DeepSeek V4 Flash) sweeps THE LAST INVENTION's own claims against
// the record. Its line streams, the "Checking 10 claims" chip spins while a sourced count climbs, and the fact-check
// sheet rises, set in the film's own grammar: a true black ground, the lower-third brass rule, Instrument Serif for
// what the film says (italic for its verbatim narration and its end-card small print, upright for a name), letter
// spaced Inter caps for the source, the host that was read in mono. Each claim lands, its lookup runs (a hairline
// fills from river teal to tungsten under the row while the stamp reads "looking up"), then its verdict stamps:
// VERIFIED in brass, IN RANGE in tungsten, and the two rows the film itself settles in its own words, the date it
// refuses to give (NO DATE, AS NARRATED) and its presenter (FICTIONAL, AS CREDITED, the end card's small print).
// The tally under the sheet counts each verdict in as it lands.
//
// Every sourced row is one real lookup, read 2026-09-27 (the host on the row is the page that was read):
//   Good's quote, 1965 ............ en.wikipedia.org/wiki/Technological_singularity (quotes Good 1965 verbatim)
//   intelligence explosion ........ en.wikipedia.org/wiki/I._J._Good (Speculations Concerning the First
//                                   Ultraintelligent Machine, Advances in Computers vol. 6, 1965)
//   Bletchley Park, 1916-2009 ..... en.wikipedia.org/wiki/I._J._Good ("cryptologist at Bletchley Park with Alan Turing";
//                                   9 December 1916, 5 April 2009): one page, one lookup, one row
//   the on-screen definition ...... en.wikipedia.org/wiki/Superintelligence (Bostrom's "greatly exceeds the cognitive
//                                   performance of humans in virtually all domains of interest"), the book itself
//                                   en.wikipedia.org/wiki/Superintelligence:_Paths,_Dangers,_Strategies (OUP, 2014)
//   the narrated definition ....... nickbostrom.com/ethics/ai, Ethical Issues in Advanced Artificial Intelligence
//                                   (2003): "vastly outperforms the best human brains in practically every field".
//                                   Not the 2014 book, and not 1998 (nickbostrom.com/superintelligence reads "much
//                                   smarter than the best human brains in practically every field").
//   paperclip maximizer ........... nickbostrom.com/ethics/ai (2003): "to manufacture as many paperclips as possible"
//   the gorilla problem ........... people.eecs.berkeley.edu/~russell/hc.html (Russell's page for Human Compatible,
//                                   Viking 2019; en.wikipedia.org/wiki/Human_Compatible for the imprint)
//   a data centre, a small city ... iea.org/reports/energy-and-ai/executive-summary (IEA 2025): "A typical
//                                   AI-focused data centre consumes as much electricity as 100 000 households". A
//                                   town, not a city of millions: IN RANGE, not VERIFIED.
//   no date ....................... the film marks it unknowable itself; nothing is looked up.
//   Dr Imogen Ashby ............... the film's end card, verbatim (img/li/assets.json film.endCardNote).
// Pure function of t: every moving value is written from t, so ?t= freezes any frame.
import { seg, outCubic, outBack, streamCount } from '../../../lib.js';

const SAY = "Checking the film's claims against the record.";
// the verdicts, in the film's colours (scrape.css .sc-st-*); the two long ones break after their comma (pre-line)
const STAMP = { ok: 'VERIFIED', range: 'IN RANGE', date: 'NO DATE,\nAS NARRATED', fict: 'FICTIONAL,\nAS CREDITED' };
// [what the film says, set as ('q' verbatim narration in italic quotes, 'n' a name or subject upright), the source,
//  the host read (or where the film says it), the year of the source, verdict, the source line set as the end card
//  sets it (italic serif) instead of caps]
const ROWS = [
  ['the last invention that man need ever make', 'q', 'I. J. GOOD, ADVANCES IN COMPUTERS VOL. 6', 'en.wikipedia.org', '1965', 'ok'],
  ['He called it an intelligence explosion.', 'q', 'GOOD, THE FIRST ULTRAINTELLIGENT MACHINE', 'en.wikipedia.org', '1965', 'ok'],
  ['I. J. “Jack” Good, 1916-2009, at Bletchley Park with Turing', 'n', 'CRYPTOLOGIST WITH ALAN TURING, 9 DEC 1916, 5 APR 2009', 'en.wikipedia.org', '', 'ok'],
  ['greatly exceeds the cognitive performance of humans in virtually all domains of interest', 'q', 'NICK BOSTROM, SUPERINTELLIGENCE, OUP', 'en.wikipedia.org', '2014', 'ok'],
  ['vastly outperforms the best humans in practically every field', 'q', 'BOSTROM, ETHICAL ISSUES IN ADVANCED AI', 'nickbostrom.com', '2003', 'ok'],
  ['The paperclip maximizer', 'n', 'BOSTROM, ETHICAL ISSUES IN ADVANCED AI', 'nickbostrom.com', '2003', 'ok'],
  ['The Gorilla Problem', 'n', 'STUART RUSSELL, HUMAN COMPATIBLE', 'people.eecs.berkeley.edu', '2019', 'ok'],
  ['about as much electricity as a small city', 'q', 'IEA, ENERGY AND AI: 100,000 HOUSEHOLDS', 'iea.org', '2025', 'range'],
  ['Nobody knows. And anyone who gives you a date is selling something.', 'q', 'THE NARRATION GIVES NO DATE', 'no lookup', '', 'date'],
  ['Dr Imogen Ashby', 'n', 'Imogen Ashby is fictional. Every frame, voice and note in this film was generated.', 'end card', '', 'fict', true],
];
const LOOKUPS = ROWS.filter((r) => r[5] === 'ok' || r[5] === 'range').length;   // rows settled by reading a source (not by the film itself)
const LOOK = 0.24;   // one row's lookup, claim landed to verdict stamped
const TALLY = [['ok', 'verified'], ['range', 'in range'], ['date', 'no date'], ['fict', 'fictional']];

export default {
  times(r) {
    const T = { r };
    T.chip = r + 0.12;
    T.card = r + 0.22;
    T.row = ROWS.map((_, i) => r + 0.32 + i * 0.095);   // each claim lands (the last at r + 1.175)
    T.stamp = T.row.map((a) => a + LOOK);               // its verdict stamps
    T.done = r + 1.53;   // the chip resolves: Checked 10 claims
    T.end = T.done + 0.3;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const chip = x.el(`<div class="dd-chiprow"><div class="ch-tool"><span class="spin"></span><span class="ch-tool-t">Checking ${ROWS.length} claims</span><b class="sc-count">0/${LOOKUPS} sourced</b></div></div>`);
    const row = ([claim, set, src, host, year, st, it]) => `<div class="sc-row sc-st-${st}">
        <span class="sc-claim${set === 'q' ? ' sc-q' : ''}">${set === 'q' ? `“${x.esc(claim)}”` : x.esc(claim)}</span>
        <span class="sc-stamp"><i></i><b>looking up</b></span>
        <span class="sc-src"><span class="${it ? 'sc-note' : 'sc-caps'}">${x.esc(src)}</span><code>${x.esc(host)}${year ? ` · ${year}` : ''}</code></span>
        <span class="sc-look"><i></i></span>
      </div>`;
    const card = x.el(`<div class="sc-card">
      <div class="sc-head"><i class="sc-rule"></i><span class="sc-kicker">FACT CHECK</span><b class="sc-title">The Last Invention</b><span class="sc-n">${ROWS.length} CLAIMS · ${LOOKUPS} LOOKUPS</span></div>
      <div class="sc-rows">${ROWS.map(row).join('')}</div>
      <div class="sc-tally">${TALLY.map(([st, w]) => `<span class="sc-st-${st}"><b>0</b> ${w}</span>`).join('')}</div>
    </div>`);
    const rows = [...card.querySelectorAll('.sc-row')].map((n) => ({ n, stamp: n.querySelector('.sc-stamp'), word: n.querySelector('.sc-stamp b'), look: n.querySelector('.sc-look i') }));
    const tally = [...card.querySelectorAll('.sc-tally > span')].map((n) => n.querySelector('b'));
    const head = card.querySelector('.sc-head'), rule = card.querySelector('.sc-rule'), tallyEl = card.querySelector('.sc-tally');
    const chipEl = chip.firstElementChild, spin = chipEl.querySelector('.spin');
    const clab = chipEl.querySelector('.ch-tool-t'), ccount = chipEl.querySelector('.sc-count');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? '' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };
    const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };
    const verified = ROWS.filter((r) => r[5] === 'ok').length;
    let shown = -1;

    return {
      nodes: [say, chip, card],
      marks: [[T.r, say], [T.chip, chip], [T.card, card]],
      render(t) {
        const n = streamCount(SAY, T.r + 0.06, 85, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the chip: spinner and a climbing sourced count, then a check and "Checked 10 claims"
        rise(chip, seg(t, T.chip, T.chip + 0.3), 8);
        const done = t >= T.done;
        spin.classList.toggle('done', done);
        spin.style.transform = done ? '' : `rotate(${(((t - T.chip) * 420) % 360).toFixed(1)}deg)`;
        chipEl.classList.toggle('sc-done', done);
        set(clab, done ? `Checked ${ROWS.length} claims` : `Checking ${ROWS.length} claims`);

        // the sheet rises; its brass rule draws in from the left, as the film's lower thirds do
        rise(card, seg(t, T.card, T.card + 0.4), 14);
        rise(head, seg(t, T.card + 0.04, T.card + 0.3), 4);
        rule.style.transform = `scaleX(${outCubic(seg(t, T.card + 0.06, T.card + 0.34)).toFixed(4)})`;

        // each claim lands, its lookup hairline fills, then the verdict stamps in with a small settle
        const counts = { ok: 0, range: 0, date: 0, fict: 0 };
        let sourced = 0;
        rows.forEach((m, i) => {
          const a = T.row[i], b = T.stamp[i], st = ROWS[i][5];
          rise(m.n, seg(t, a, a + 0.2), 5);
          const l = seg(t, a + 0.04, b);
          m.look.style.transform = `scaleX(${outCubic(l).toFixed(4)})`;
          const on = t >= b;
          m.n.classList.toggle('on', on);
          set(m.word, on ? STAMP[st] : (st === 'date' || st === 'fict' ? 'from the film' : 'looking up'));
          const p = seg(t, b, b + 0.18);
          m.stamp.style.transform = on && p < 1 ? `scale(${(1.18 - 0.18 * outBack(p)).toFixed(4)})` : '';
          if (on) { counts[st]++; if (st === 'ok' || st === 'range') sourced++; }
        });
        set(ccount, done ? `${verified} verified` : `${sourced}/${LOOKUPS} sourced`);

        // the tally counts each verdict in as it lands
        rise(tallyEl, seg(t, T.stamp[0] - 0.06, T.stamp[0] + 0.2), 3);
        tally.forEach((b, i) => set(b, String(counts[TALLY[i][0]])));
      },
    };
  },
};
