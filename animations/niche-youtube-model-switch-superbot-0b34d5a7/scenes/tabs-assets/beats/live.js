// Live beat: Grok 4.6 answers the one question the video cannot. Kai asked whether firmware 2.1 fixed the hiss on the
// $49 mic; 2.1 shipped Oct 2, after the upload, so no amount of watching answers it. Grok is the route's live-search
// model (X in real time plus the web), so it gets exactly this one question. Its line streams and a card rises: the
// header "Searching X and the web" (spinner resolving to the check) with the window it searched, the query typing into
// a search field, then three sources landing in turn (X posts this week, the maker's 2.1 release notes, a Reddit thread),
// each a logo tile, the source, its age and a one-line quote. Then the verdict tag and the footer. Every source is made
// up for the spot (no real brand or post is quoted). Pure function of t: every moving value is written from t, so ?t=
// and __AD.seek freeze any frame.
import { lerp, seg, outCubic, streamCount } from '../../../lib.js';

const SAY = 'Kai asked about firmware 2.1, which shipped after you posted. Checked X and the web.';
const QUERY = 'firmware 2.1 hiss $49 dynamic mic';
// [logo, source, age, quote]
const SOURCES = [
  ['x', '41 posts on X', 'this week', '"Updated to 2.1 last night. The hiss is gone."'],
  ['web', 'Maker support: firmware 2.1 notes', 'Oct 2', 'Fixed: hiss at high gain over USB-C.'],
  ['reddit', 'r/podcasting', '2 days ago', '"Noise floor dropped a lot after 2.1."'],
];
export const VERDICT = 'Fixed in firmware 2.1 (Oct 2), after your upload';
const TALLY = '3 sources agree, answer ready for Kai';
// timing (seconds from the reply start, or from the card where noted), in the base's v3 pace
const CPS = 100;            // the reply line streams at this many characters a second
const SAY_AT = 0.048;       // reply start to the line's first character
const CARD = 0.144;         // reply start to the card rising in
const RISE = 0.36;          // the card rising in
const Q_AT = 0.12;          // the card landing to the query starting to type
const Q_CPS = 90;           // the query types at this many characters a second
const SRC_AT = 0.16;        // the query typed to the first source landing
const STAGGER = 0.2;        // one source to the next
const SRC_IN = 0.26;        // a source rising in
const VERDICT_AT = 0.1;     // the last source landed to the verdict tag
const VERDICT_IN = 0.24;
const TALLY_AT = 0.16;      // the verdict to the footer
const TALLY_IN = 0.24;

const GLOBE = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.125 21.213q-1.825-.788-3.187-2.15t-2.15-3.188T2 11.988t.788-3.875t2.15-3.175t3.187-2.15T12.013 2t3.875.788t3.175 2.15t2.15 3.175t.787 3.875t-.787 3.887t-2.15 3.188t-3.175 2.15t-3.875.787t-3.888-.787M12 19.95q.65-.9 1.125-1.875T13.9 16h-3.8q.3 1.1.775 2.075T12 19.95m-2.6-.4q-.45-.825-.787-1.713T8.05 16H5.1q.725 1.25 1.813 2.175T9.4 19.55m5.2 0q1.4-.45 2.488-1.375T18.9 16h-2.95q-.225.95-.562 1.838T14.6 19.55M4.25 14h3.4q-.075-.5-.112-.987T7.5 12t.038-1.012T7.65 10h-3.4q-.125.5-.187.988T4 12t.063 1.013t.187.987m5.4 0h4.7q.075-.5.113-.987T14.5 12t-.038-1.012T14.35 10h-4.7q-.075.5-.112.988T9.5 12t.038 1.013t.112.987m6.7 0h3.4q.125-.5.188-.987T20 12t-.062-1.012T19.75 10h-3.4q.075.5.113.988T16.5 12t-.038 1.013t-.112.987m-.4-6h2.95q-.725-1.25-1.812-2.175T14.6 4.45q.45.825.788 1.713T15.95 8M10.1 8h3.8q-.3-1.1-.775-2.075T12 4.05q-.65.9-1.125 1.875T10.1 8m-5 0h2.95q.225-.95.563-1.838T9.4 4.45Q8 4.9 6.912 5.825T5.1 8"/></svg>';
const SEARCH = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14"/></svg>';
const TICK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD;
    T.q0 = T.card + Q_AT;
    T.q1 = T.q0 + QUERY.length / Q_CPS;
    T.src = SOURCES.map((_, i) => T.q1 + SRC_AT + i * STAGGER);
    T.found = T.src[SOURCES.length - 1] + SRC_IN;     // the search settles: spinner -> check
    T.verdict = T.found + VERDICT_AT;
    T.tally = T.verdict + TALLY_AT;
    T.end = Math.max(T.tally + TALLY_IN, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const logo = (kind) => (kind === 'web' ? `<span class="lv-lg lv-web">${GLOBE}</span>`
      : `<span class="lv-lg lv-${kind}"><img src="${x.brand(`${kind}-logo.svg`)}" alt=""/></span>`);
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const card = x.el(`<div class="lv-card">
      <div class="lv-hd"><span class="lv-st"><i class="lv-spin"></i>${x.OK}</span><b>Searching X and the web</b><span class="lv-win">Past 7 days</span></div>
      <div class="lv-q">${SEARCH}<span class="lv-qt"></span><i class="lv-caret"></i></div>
      <div class="lv-list">${SOURCES.map(([kind, src, age, quote]) => `<div class="lv-slot"><div class="lv-row">${logo(kind)}
        <div class="lv-main"><span class="lv-l1"><b>${x.esc(src)}</b><span class="lv-age">${x.esc(age)}</span></span><span class="lv-tx">${x.esc(quote)}</span></div></div></div>`).join('')}</div>
      <div class="lv-slot"><div class="lv-vwrap"><span class="lv-verdict">${TICK}${x.esc(VERDICT)}</span></div></div>
      <div class="lv-slot"><div class="lv-ft">${x.OK}<span>${x.esc(TALLY)}</span></div></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const rows = [...card.querySelectorAll('.lv-row')];
    const qt = $('.lv-qt'), caret = $('.lv-caret'), verdict = $('.lv-verdict'), ft = $('.lv-ft');
    const spin = $('.lv-spin'), ok = $('.lv-st .qc-ok');
    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, typed = -1;
    // a slot's height follows its content's eased entrance (auto once landed, 0 before), so the card only holds what landed
    const slot = (n, o) => {
      const sl = n.closest('.lv-slot');
      const want = o >= 1 ? '' : `${(sl.firstElementChild.offsetHeight * o).toFixed(2)}px`;
      if (sl.style.height !== want) sl.style.height = want;
    };

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card], [T.src[1], rows[1]], [T.tally, ft]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${lerp(0.97, 1, ci).toFixed(4)})`;

        // the query types in, the caret blinking only while it types
        const nq = streamCount(QUERY, T.q0, Q_CPS, t);
        if (nq !== typed) { qt.textContent = QUERY.slice(0, nq); typed = nq; }
        caret.style.opacity = t >= T.q0 - 0.05 && t < T.q1 + 0.12 ? '1' : '0';

        rows.forEach((row, i) => {
          const o = outCubic(seg(t, T.src[i], T.src[i] + SRC_IN));
          slot(row, o);
          row.style.opacity = o.toFixed(3);
          row.style.transform = o >= 1 ? 'none' : `translateY(${((1 - o) * 8).toFixed(2)}px)`;
        });
        // the search settles: the spinner resolves to the check as the last source lands
        const d = outCubic(seg(t, T.found, T.found + 0.2));
        spin.style.opacity = (1 - seg(t, T.found - 0.08, T.found + 0.06)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        ok.style.opacity = d.toFixed(3);
        ok.style.transform = `scale(${lerp(0.4, 1, d).toFixed(4)})`;

        const v = outCubic(seg(t, T.verdict, T.verdict + VERDICT_IN));
        slot(verdict, v);
        verdict.style.opacity = v.toFixed(3);
        verdict.style.transform = v >= 1 ? 'none' : `translateY(${((1 - v) * 6).toFixed(2)}px) scale(${lerp(0.94, 1, v).toFixed(4)})`;
        const f = outCubic(seg(t, T.tally, T.tally + TALLY_IN));
        slot(ft, f);
        ft.style.opacity = f.toFixed(3);
        ft.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 6).toFixed(2)}px)`;
      },
    };
  },
};
