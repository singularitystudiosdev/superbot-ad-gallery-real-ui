// Script beat (beats/script.js): the ask lands on Claude Opus 5.5 and it writes the build script for Inkwave, the 3D
// ink shooter. This is step 1 of the one published routing and the document the other eight steps are dispatched from:
// its six numbered sections ARE the routing chips that follow ("Script §1 -> DeepSeek V4 Flash" is §1 Research, "§2 ->
// Meshy 5" is §2 Models, and so on), so each section carries the tile of the app that will own it (x.tile(app)) on the
// right edge of its line, and §4 Sound carries two (ElevenLabs + Suno v5, the parallel fork).
//
// Referent: a coding agent's markdown artifact card. The reply streams, a script card named inkwave.script.md rises
// under it, and the document types itself in: the title line, then each section's heading (a lime § badge, the section
// name, its body typed character by character) with its owner tile on the right, then the match's VO block in
// screenplay format (ANNOUNCER centered, its four calls under it) and the match-flow line the script closes on
// (READY > 3:00 > JUDGING > VICTORY). The copy is the post's own material: Tidewater Plaza, the squad (Juno, Squiddo,
// Loop, Suki, Cloud), lime against magenta, the announcer's four lines, the 3:00 clock, the JUDGING and VICTORY plates.
// Everything on it reads: the card is a document to read, not a wall of crawling text.
//
// IMAGERY / SOURCING: no raster asset of its own, and nothing here is drawn by hand. The only marks on the card are
// the app tiles, the official marks this ad already carries (brand/claude-logo.svg, brand/deepseek-logo.svg,
// brand/meshy-logo.svg, brand/hunyuan-logo.png, brand/elevenlabs-logo.svg, brand/suno-logo.svg, brand/gemini-logo.svg;
// provenance in brand/CREDITS.txt), drawn through x.tile, plus the check tick (x.OK). The "md" mark in the card header
// is a text badge, not artwork. The lime (#b6f000) and magenta (#e5189a) accents are the ad's own ink palette, the same
// two the routing chips paint the § badge and the arrow with (chat.css .qc-sec / .qc-arrow).
//
// Pure function of t (the tabs scene's local time): every value is written from t, so ?t=<sec> freezes an exact frame.
// No Date, no rAF, no self-running CSS animation or transition.
import { lerp, seg, outCubic, outBack, typed, streamCount, typeEnd, blink } from '../../../lib.js';

const SAY = 'Wrote the Inkwave script. Six sections, one model each.';

// the artifact's own name and title, and the post's map/squad line (real material from the spot's source post)
const FILE = 'inkwave.script.md';
const TITLE = 'INKWAVE · Turf War';
const MAP = 'Tidewater Plaza';
const SQUAD = 'Juno, Squiddo, Loop, Suki, Cloud';

// The six sections: the numbered dispatch the routing chips carry, each owned by the app that will run it. The body is
// what that section hands over, in the spot's words.
const SECTIONS = [
  { title: 'Research', apps: ['deepseek'], body: 'turf war rules, ink coverage scoring, CC0 seaside assets' },
  { title: 'Models', apps: ['meshy'], body: 'Juno the inkling, palm trees, crates, KRAKEN billboard' },
  { title: 'Motion', apps: ['hymotion'], body: 'swim dive, ink shot, super jump, victory pose' },
  { title: 'Sound', apps: ['eleven', 'suno'], body: "splats, squid swim, announcer, 'Tidewater Riot' track" },
  { title: 'Art', apps: ['gemini'], body: 'LOW TIDE RIOT posters, splat decals, HUD icons' },
  { title: 'Build', apps: ['opus'], body: 'ink paint, coverage judge, 3:00 match' },
];
const NSEC = SECTIONS.length; // 6 sections

// the match VO the script writes for the announcer (screenplay format: the role, then its lines), and the flow the
// script says the match runs through. "Lime wins!" is the win state the post ends on; lime and magenta are the two
// teams' inks.
const VO = ['Ready? GO!', '1 minute left!', "TIME'S UP!", 'Lime wins!'];
const STAGES = ['READY', '3:00', 'JUDGING', 'VICTORY'];

// pace. The whole beat runs T.end = r + 4.5: the line streams while the card rises, the title and the six sections type
// themselves in, then the VO block and the match-flow line land, then the header pill resolves.
const SAY_CPS = 95;     // the reply line
const TITLE_CPS = 46;   // the document's title line types slowly, like a heading being written
const CPS = 120;        // each section's body
const VCPS = 70;        // each announcer line
const SSTEP = 0.34;     // one section lands every SSTEP
const VSTEP = 0.15;     // one announcer line lands every VSTEP
const DUR = 4.5;        // the beat holds this long after its reply lands

const set = (n, s) => { if (n.textContent !== s) n.textContent = s; };

export default {
  times(r) {
    const T = { r };
    T.say = r + 0.05;                                                         // the reply line streams (the beat's own line)
    T.card = r + 0.10;                                                        // the script card rises in
    T.title = T.card + 0.08;                                                  // the title line types itself
    T.titleEnd = typeEnd(TITLE, T.title, TITLE_CPS);
    T.sub = T.titleEnd + 0.06;                                                // the map / teams / squad line lands
    T.sec = SECTIONS.map((_, i) => T.sub + 0.20 + i * SSTEP);                  // each section lands
    T.body = SECTIONS.map((s, i) => typeEnd(s.body, T.sec[i] + 0.04, CPS));    // ...and its body finishes typing
    T.vo = T.body[NSEC - 1] - 0.12;                                           // the block rises under §6 as its last words land
    T.line = VO.map((_, i) => T.vo + 0.16 + i * VSTEP);                       // each of its calls types in
    T.flow = T.line[VO.length - 1] - 0.05;                                    // the match-flow line lands as the last call types
    T.stage = STAGES.map((_, i) => T.flow + 0.10 + i * 0.06);
    T.ready = T.stage[STAGES.length - 1] + 0.16;                              // the header pill resolves: script written
    T.end = r + DUR;                                                          // the script is done; the next request routes
    return T;
  },
  build(k, x) {
    const T = k.T;

    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);

    const rows = SECTIONS.map((s, i) => `<div class="qb-script-l">
      <b class="qb-script-n">&#167;${i + 1}</b><b class="qb-script-ti">${x.esc(s.title)}</b>
      <span class="qb-script-tx"><span class="qb-script-tv"></span><span class="qb-script-th">${x.esc(s.body)}</span></span>
      <i class="qb-script-ca"></i><span class="qb-script-ow">${s.apps.map((a) => x.tile(a)).join('')}</span>
    </div>`).join('');

    const vo = VO.map((line) => `<div class="qb-script-d">
      <span class="qb-script-dv"></span><span class="qb-script-dh">${x.esc(line)}</span><i class="qb-script-ca"></i>
    </div>`).join('');

    const stages = STAGES.map((s, i) => `${i ? '<i class="qb-script-ar">&gt;</i>' : ''}<span class="qb-script-st${i === STAGES.length - 1 ? ' qb-script-v' : ''}">${x.esc(s)}</span>`).join('');

    const card = x.el(`<div class="qb-script-card">
      <div class="qb-script-hd">
        <i class="qb-script-fi">md</i><b class="qb-script-fn">${x.esc(FILE)}</b>
        <span class="qb-script-pill"><i class="qb-script-spin"></i><span class="qb-script-pl">0 of ${NSEC} written</span>${x.OK}</span>
      </div>
      <div class="qb-script-bd">
        <div class="qb-script-title"><i class="qb-script-h1">#</i><span class="qb-script-tv"></span><span class="qb-script-th">${x.esc(TITLE)}</span><i class="qb-script-ca"></i></div>
        <div class="qb-script-meta"><span>${x.esc(MAP)}</span><i class="qb-script-dot">·</i><span><b class="qb-script-lime">lime</b> vs <b class="qb-script-mag">magenta</b></span><i class="qb-script-dot">·</i><span class="qb-script-sq">${x.esc(SQUAD)}</span></div>
        <div class="qb-script-ll">${rows}</div>
        <div class="qb-script-vo"><div class="qb-script-role">ANNOUNCER</div>${vo}</div>
        <div class="qb-script-flow"><span class="qb-script-fl">match flow</span>${stages}</div>
      </div>
    </div>`);

    const $ = (s) => card.querySelector(s);
    const vis = say.firstElementChild, hid = say.lastElementChild;
    const ttv = $('.qb-script-title .qb-script-tv'), tth = $('.qb-script-title .qb-script-th');
    const tCa = $('.qb-script-title .qb-script-ca');
    const meta = $('.qb-script-meta');
    const rowEls = [...card.querySelectorAll('.qb-script-l')];
    const tvs = rowEls.map((r) => r.querySelector('.qb-script-tv'));
    const ths = rowEls.map((r) => r.querySelector('.qb-script-th'));
    const cas = rowEls.map((r) => r.querySelector('.qb-script-ca'));
    const ows = rowEls.map((r) => r.querySelector('.qb-script-ow'));
    const voEl = $('.qb-script-vo');
    const role = $('.qb-script-role');
    const dEls = [...card.querySelectorAll('.qb-script-d')];
    const dvs = dEls.map((d) => d.querySelector('.qb-script-dv'));
    const dhs = dEls.map((d) => d.querySelector('.qb-script-dh'));
    const dCas = dEls.map((d) => d.querySelector('.qb-script-ca'));
    const flow = $('.qb-script-flow');
    const stageEls = [...card.querySelectorAll('.qb-script-st')];
    const arEls = [...card.querySelectorAll('.qb-script-ar')];
    const pill = $('.qb-script-pill'), pl = $('.qb-script-pl'), spin = $('.qb-script-spin'), pOk = pill.querySelector('.qc-ok');

    // last text written per typed line: the DOM is touched only when the frame's text differs, so a still frame costs
    // nothing and a seek backwards still repaints
    const was = SECTIONS.map(() => -1), wasV = VO.map(() => -1);
    let shown = -1, titleN = -1, lastWritten = -1, lastReady = null;
    const rise = (n, p, dy) => { const e = outCubic(p); n.style.opacity = e.toFixed(3); n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - e) * dy).toFixed(2)}px)`; };

    return {
      nodes: [say, card],
      // the thread glides to the card as it lands, then keeps the VO block and the match-flow line in frame
      marks: [[T.card, card], [T.vo, voEl], [T.flow, flow]],
      render(t) {
        const n = streamCount(SAY, T.say, SAY_CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }

        // the card rises in, then holds perfectly still
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;

        // the title types itself in (the caret blinks only while characters are still landing)
        const ti = typed(TITLE, T.title, TITLE_CPS, t);
        if (ti.n !== titleN) { titleN = ti.n; ttv.textContent = TITLE.slice(0, ti.n); tth.textContent = TITLE.slice(ti.n); }
        tCa.style.opacity = ti.typing && blink(t) ? '1' : '0';

        // the map / teams / squad line lands whole: it is the post's material, not the model's prose
        rise(meta, seg(t, T.sub, T.sub + 0.3), 5);

        // the six sections: the line lands, its § badge and its owner tile punch in, then its body types itself in
        let written = 0;
        rowEls.forEach((row, i) => {
          const a = T.sec[i];
          rise(row, seg(t, a, a + 0.22), 6);
          const tp = outBack(seg(t, a + 0.03, a + 0.24));
          ows[i].style.opacity = seg(t, a + 0.03, a + 0.14).toFixed(3);
          ows[i].style.transform = `scale(${lerp(0.55, 1, tp).toFixed(3)})`;
          const ty = typed(SECTIONS[i].body, a + 0.04, CPS, t);
          if (ty.n !== was[i]) { was[i] = ty.n; tvs[i].textContent = SECTIONS[i].body.slice(0, ty.n); ths[i].textContent = SECTIONS[i].body.slice(ty.n); }
          cas[i].style.opacity = ty.typing && blink(t) ? '1' : '0';
          row.classList.toggle('is-on', ty.done);
          if (ty.done) written++;
        });

        // the announcer block: the role lands, then its four calls type in, the last one in lime (the winning ink)
        rise(voEl, seg(t, T.vo, T.vo + 0.3), 7);
        role.style.opacity = seg(t, T.vo + 0.04, T.vo + 0.22).toFixed(3);
        dEls.forEach((d, i) => {
          const a = T.line[i];
          const ty = typed(VO[i], a, VCPS, t);
          if (ty.n !== wasV[i]) { wasV[i] = ty.n; dvs[i].textContent = VO[i].slice(0, ty.n); dhs[i].textContent = VO[i].slice(ty.n); }
          dCas[i].style.opacity = ty.typing && blink(t) ? '1' : '0';
          d.classList.toggle('is-on', ty.done);
        });

        // the match-flow line: the label, then the four stages pop in one after the other, VICTORY last in lime
        rise(flow, seg(t, T.flow, T.flow + 0.3), 6);
        stageEls.forEach((s, i) => {
          const p = outBack(seg(t, T.stage[i], T.stage[i] + 0.22));
          s.style.opacity = seg(t, T.stage[i], T.stage[i] + 0.14).toFixed(3);
          s.style.transform = `scale(${lerp(0.6, 1, p).toFixed(3)})`;
          s.classList.toggle('is-on', t >= T.stage[i]);
        });
        arEls.forEach((a, i) => { a.style.opacity = seg(t, T.stage[i + 1] - 0.06, T.stage[i + 1] + 0.1).toFixed(3); });

        // header pill: the sections written count up, then it resolves to "Script ready" with the tick, like a routing chip
        const ready = t >= T.ready;
        if (ready !== lastReady) { lastReady = ready; pill.classList.toggle('is-done', ready); }
        const w = ready ? NSEC : written;
        if (w !== lastWritten) { lastWritten = w; set(pl, ready ? 'Script ready' : `${w} of ${NSEC} written`); }
        spin.style.opacity = (1 - seg(t, T.ready - 0.08, T.ready + 0.05)).toFixed(3);
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        pOk.style.opacity = seg(t, T.ready, T.ready + 0.22).toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, outBack(seg(t, T.ready, T.ready + 0.24))).toFixed(3)})`;
      },
    };
  },
};