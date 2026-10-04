// Scrape beat: DeepSeek V4 Pro searches the web for mic-review channel trailers, then bulk-scrapes 40 of them with
// yt-dlp (auto subtitles plus every comment, no video download) and ranks the hook patterns it finds. Its line streams,
// then one card in DeepSeek's language (its blue #4D6BFE on the hub's dark card) rises: a header whose state reads
// "Searching the web" with a spinner, resolving to the check and "Searched 52 web pages" (DeepSeek's search mode
// wording); three counters ticking (channels 40/40, transcripts 40/40, comments 212,480); a fixed-height body where a
// fast tool log rolls (two web searches, the channel /videos fetches, the yt-dlp batch with its real output lines,
// the comment API paging), then gives way to the three ranked hook patterns with fill bars and counts and the
// takeaway "Hook: open on the $29 winner."; and a one-line footer tag for the bulk scrape. Every channel handle is
// made up for the spot. The body never changes height, so the card never re-lays out. Pure function of t: every
// moving value is written from t, so ?t= and __AD.seek freeze any frame.
import { seg, outCubic, inOutCubic, streamCount } from '../../../lib.js';

const SAY = 'Scraped 40 mic-review trailers and 212,480 comments. Here is what makes people click.';
const PAGES = 52;
const CHANNELS = 40;
const COMMENTS = 212480;
// the tool log: [kind, text, status]. kind: q = web search, f = page fetch, c = shell command, o = yt-dlp output
const LOG = [
  ['q', 'search: "budget mic review" channel trailer', '31 pages'],
  ['q', 'search: "usb mic under $50" review channel', '21 pages'],
  ['f', 'fetch youtube.com/@benchmicnotes/videos', '200'],
  ['f', 'fetch youtube.com/@deskaudioweekly/videos', '200'],
  ['f', 'fetch youtube.com/@thirtydollarsound/videos', '200'],
  ['f', 'fetch youtube.com/@capsulecheck/videos', '200'],
  ['f', 'fetch 36 more channel pages', '40/40'],
  ['c', 'yt-dlp -a trailers.txt --skip-download \\', ''],
  ['k', '    --write-auto-subs --write-comments', ''],
  ['o', '[info] Writing video subtitles to: trailer-01.en.vtt', '1/40'],
  ['o', '[youtube] Downloading comment API JSON page 1 (0/~5,312)', ''],
  ['o', '[youtube] Downloading comment API JSON page 54 (5,300/~5,312)', ''],
  ['o', '[youtube] Extracted 5,312 comments', '40/40'],
];
const VIS = 7;            // log lines the body shows at once (it rolls up past that)
const LH = 18;            // one log line, design px (matches .ds-l in scrape.css)
// the ranked hook patterns: [label, count of 40]
const HOOKS = [
  ['Winner on screen in the first 2 s', 31],
  ['Price on screen', 27],
  ['Face and product in one shot', 24],
];
const TAG = 'Other assistants declined this bulk scrape. DeepSeek ran it.';
const TAKE = ['Hook:', 'open on the $29 winner.'];

// timing (seconds from the reply start, or from the mark named)
const CPS = 110;          // the reply line streams at this many characters a second
const SAY_AT = 0.04;      // reply start to the line's first character
const CARD_AT = 0.1;      // reply start to the card rising
const RISE = 0.24;        // the card rising in
const LOG_AT = 0.12;      // the card rising to the first log line
const STEP = 0.07;        // one log line to the next (a fast tool log)
const LINE_IN = 0.07;     // a log line fading up, and the roll per line past VIS
const DONE_AT = 0.08;     // the last log line to the search state resolving
const SWAP_AT = 0.1;      // the state resolving to the log giving way
const SWAP = 0.18;        // the log lifting out
const ROW_AT = 0.06;      // the log lifting out to the first ranked row
const STAGGER = 0.1;      // one row to the next
const ROW_IN = 0.2;       // a row fading up
const FILL = 0.4;         // a bar filling (its count ticks with it)
const TAKE_AT = 0.02;     // the last bar full to the takeaway
const TAKE_IN = 0.2;      // the takeaway rising in
const HOLD = 0.4; /* deliberate */ // the finished card reads before the next pill

const fmt = (n) => n.toLocaleString('en-US');
const setText = (n, s) => { if (n.textContent !== s) n.textContent = s; };
const GLASS = '<svg class="ds-ico" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>';

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;
    T.line = LOG.map((_, i) => T.card + LOG_AT + i * STEP);
    T.done = T.line[LOG.length - 1] + DONE_AT;
    // counters: channels tick with the fetches, transcripts with the subtitle line, comments with the paging
    T.ch = [T.line[2], T.line[6] + LINE_IN];
    T.tr = [T.line[8], T.line[9] + 0.08];
    T.cm = [T.line[9], T.line[12] + LINE_IN];
    T.swap = T.done + SWAP_AT;
    T.row = HOOKS.map((_, i) => T.swap + ROW_AT + i * STAGGER);
    T.take = T.row[HOOKS.length - 1] + FILL + TAKE_AT;
    T.end = Math.max(T.take + TAKE_IN + HOLD, r + SAY_AT + SAY.length / CPS);
    return T;
  },
  build(k, x) {
    const T = k.T;
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const tok = (kind, s) => {
      const e = x.esc(s);
      if (kind === 'q') return e.replace(/"([^"]*)"/, '<i class="ds-s">"$1"</i>').replace(/^search:/, '<i class="ds-k">search:</i>');
      if (kind === 'f') return e.replace(/^fetch/, '<i class="ds-k">fetch</i>');
      if (kind === 'k') return e.replace(/(--[a-z-]+)/g, '<i class="ds-f">$1</i>');
      if (kind === 'c') return `<i class="ds-p">$</i> ${e.replace(/^yt-dlp/, '<i class="ds-k">yt-dlp</i>').replace(/(--[a-z-]+)/g, '<i class="ds-f">$1</i>')}`;
      return e.replace(/^(\[[a-z]+\])/, '<i class="ds-t">$1</i>');
    };
    const card = x.el(`<div class="ds-card">
      <div class="ds-hd">${GLASS}<b>Search and scrape</b><span class="ds-sub">YouTube, mic reviews</span>
        <em class="ds-state"><span class="ds-st"><i class="ds-spin"></i>${x.OK}</span><span class="ds-sl">Searching the web</span></em></div>
      <div class="ds-stats">
        <span class="ds-stat">Channels <b class="ds-n">0/${CHANNELS}</b></span>
        <span class="ds-stat">Transcripts <b class="ds-n">0/${CHANNELS}</b></span>
        <span class="ds-stat">Comments <b class="ds-n">0</b></span>
      </div>
      <div class="ds-bd">
        <div class="ds-log"><div class="ds-clip"><div class="ds-roll">${LOG.map(([kind, s, st]) => `<div class="ds-l ds-${kind}"><code>${tok(kind, s)}</code>${st ? `<span class="ds-r${st === '200' || st.startsWith('40/') ? ' ok' : ''}">${x.esc(st)}</span>` : ''}</div>`).join('')}</div></div></div>
        <div class="ds-res">
          ${HOOKS.map(([label, n], i) => `<div class="ds-row"><span class="ds-rk">${i + 1}</span><div class="ds-rm"><span class="ds-rl"><b>${x.esc(label)}</b><span class="ds-cnt">0 of ${CHANNELS}</span></span><i class="ds-bar"><i style="width: ${((n / CHANNELS) * 100).toFixed(2)}%"></i></i></div></div>`).join('')}
          <div class="ds-take">${x.OK}<b>${x.esc(TAKE[0])}</b><span>${x.esc(TAKE[1])}</span></div>
        </div>
      </div>
      <div class="ds-ft">${x.OK}<span>${x.esc(TAG)}</span></div>
    </div>`);
    const $ = (s) => card.querySelector(s);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const st = { spin: $('.ds-spin'), ok: $('.ds-st .qc-ok') }, sl = $('.ds-sl'), state = $('.ds-state');
    const [nCh, nTr, nCm] = [...card.querySelectorAll('.ds-n')];
    const log = $('.ds-log'), roll = $('.ds-roll'), lines = [...card.querySelectorAll('.ds-l')];
    const res = $('.ds-res'), rows = [...card.querySelectorAll('.ds-row')].map((n) => ({ n, bar: n.querySelector('.ds-bar i'), cnt: n.querySelector('.ds-cnt') }));
    const take = $('.ds-take'), ft = $('.ds-ft');
    let shown = -1;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        const ns = streamCount(SAY, T.r + SAY_AT, CPS, t);
        if (ns !== shown) { vis.textContent = SAY.slice(0, ns); hid.textContent = SAY.slice(ns); shown = ns; }
        const ci = outCubic(seg(t, T.card, T.card + RISE));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px) scale(${(0.97 + 0.03 * ci).toFixed(4)})`;

        // the header state: spinner while searching, the check and the page count once the scrape has landed
        const d = t >= T.done;
        const pop = outCubic(seg(t, T.done, T.done + 0.2));
        st.spin.style.opacity = (1 - seg(t, T.done - 0.08, T.done + 0.06)).toFixed(3);
        st.spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        st.ok.style.opacity = pop.toFixed(3);
        st.ok.style.transform = `scale(${(0.4 + 0.6 * pop).toFixed(4)})`;
        setText(sl, d ? `Searched ${PAGES} web pages` : 'Searching the web');
        state.classList.toggle('ok', d);

        // the counters
        const c1 = Math.round(CHANNELS * seg(t, T.ch[0], T.ch[1]));
        const c2 = Math.round(CHANNELS * seg(t, T.tr[0], T.tr[1]));
        const c3 = Math.round(COMMENTS * inOutCubic(seg(t, T.cm[0], T.cm[1])));
        setText(nCh, `${c1}/${CHANNELS}`);
        setText(nTr, `${c2}/${CHANNELS}`);
        setText(nCm, fmt(c3));

        // the log: each line fades up as it lands; past VIS lines the roll moves up one line per landing
        let up = 0;
        lines.forEach((n, i) => {
          const o = outCubic(seg(t, T.line[i], T.line[i] + LINE_IN));
          n.style.opacity = o.toFixed(3);
          if (i >= VIS) up += o;
        });
        roll.style.transform = `translateY(${(-up * LH).toFixed(2)}px)`;
        const sw = outCubic(seg(t, T.swap, T.swap + SWAP));
        log.style.opacity = (1 - sw).toFixed(3);
        log.style.transform = sw > 0 ? `translateY(${(-16 * sw).toFixed(2)}px)` : 'none';
        log.style.visibility = sw >= 1 ? 'hidden' : '';

        // the ranked hook patterns: each row fades up, its bar fills and its count ticks with it
        res.style.visibility = t >= T.row[0] ? '' : 'hidden';
        rows.forEach((o, i) => {
          const a = outCubic(seg(t, T.row[i], T.row[i] + ROW_IN));
          o.n.style.opacity = a.toFixed(3);
          o.n.style.transform = a >= 1 ? 'none' : `translateY(${((1 - a) * 8).toFixed(2)}px)`;
          const f = outCubic(seg(t, T.row[i], T.row[i] + FILL));
          o.bar.style.transform = `scaleX(${f.toFixed(4)})`;
          setText(o.cnt, `${Math.round(HOOKS[i][1] * f)} of ${CHANNELS}`);
        });
        const tk = outCubic(seg(t, T.take, T.take + TAKE_IN));
        take.style.opacity = tk.toFixed(3);
        take.style.transform = tk >= 1 ? 'none' : `translateY(${((1 - tk) * 6).toFixed(2)}px)`;

        // the footer tag lands with the scrape
        const fo = outCubic(seg(t, T.done, T.done + 0.2));
        ft.style.opacity = fo.toFixed(3);
        card.classList.toggle('ds-fin', t >= T.take);
      },
    };
  },
};
