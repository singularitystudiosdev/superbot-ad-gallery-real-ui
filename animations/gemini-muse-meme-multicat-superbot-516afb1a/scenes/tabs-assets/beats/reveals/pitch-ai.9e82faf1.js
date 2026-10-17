// Pitch AI agent, deck generation in the Pitch editor (a first-party Pitch product demo on YouTube, 'Pitch Agent: On-brand AI presentations, made
// for professionals', sFP0JFVk6vs, published 2026-05-27, a macOS browser window, t~17.1-26 s; spec .tmp/clone-9e82faf1/reveal-refs/pitch-ai/spec.json,
// confidence 0.72; frames ap_pitch_01..11.png). The light editor: a header (menu, deck title, a purple Share pill), the numbered slide rail on the
// left, the open 16:9 slide in the middle and, docked on the right, the 'Pitch Agent' panel carrying the sent prompt as a grey bubble and then the
// agent's trace: a 'Thinking' header with a chevron, the plan line ('Let me start by understanding your template and building the deck's
// structure. Then I'll add content.'), a checklist that fills in row by row as each step finishes ('Analyzed brand', 'Built outline', 'Added
// slides x5' - an active row shows a turning arc and a greyed label, a finished one a grey bullet and its past-tense label), the line 'Now I'll
// fill in the content for each slide.', a nested 'Wrote text', and last a row with a circular spinner, 'Generating images', while the slides'
// pictures are still being drawn into the rail. The composer ('What do you want to do?', '+', a sliders icon, an 'Auto' chip and a purple send
// button) sits under the trace.
// Adapted to ten images: the same trace from render(t) (the plan line typing out behind a caret), then ten slide thumbnails in the rail, each a
// dark skeleton slide that hands over to its picture, one after another in strict reading order, the 'Generating images' spinner running until the
// last one has landed. Omitted: the macOS window chrome and wallpaper, the context chips, the tool strip, the far-right icon rail, the sparkle button,
// and the editor's zoom readout (it is the canvas zoom, not progress, and is not drawn). The footage's pictures are never reproduced: every
// thumbnail is our own meme, and no logo, wordmark or platform font is drawn (plain glyphs, plain boxes, system type).
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-pit';
const ROOT_H = 392, RAIL_W = 64, PANE_W = 212;
const INK = '#2b2d3a', MUTED = '#8b8e9b', ACC = '#6c4cf0';
const CSS = `
.${P} { box-sizing: border-box; display: flex; flex-direction: column; width: 560px; max-width: 100%; height: ${ROOT_H}px; border-radius: 10px; background: #fbfbfd; color: ${INK}; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #e4e3ee; }
.${P}-top { flex: none; display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 10px; }
.${P}-burger { flex: none; display: flex; flex-direction: column; gap: 2.3px; width: 9px; }
.${P}-burger i { display: block; height: 1.2px; border-radius: 1px; background: #5a5d6b; }
.${P}-ttl { flex: none; font-size: 8.5px; font-weight: 700; color: ${INK}; white-space: nowrap; }
.${P}-sp { flex: 1; }
.${P}-share { flex: none; display: grid; place-items: center; height: 16px; padding: 0 9px; border-radius: 8px; background: ${ACC}; font-size: 7.5px; font-weight: 600; color: #fff; }
.${P}-body { flex: 1; min-height: 0; display: flex; }
.${P}-rail { flex: none; box-sizing: border-box; display: flex; flex-direction: column; gap: 5px; width: ${RAIL_W}px; padding: 2px 6px 6px 8px; overflow: hidden; }
.${P}-add { flex: none; display: grid; place-items: center; height: 14px; border-radius: 5px; box-shadow: inset 0 0 0 1px #e1e0ec; font-size: 6.5px; color: #4a4d5b; white-space: nowrap; }
.${P}-slot { flex: none; display: flex; align-items: center; gap: 4px; }
.${P}-slot em { flex: none; width: 6px; font-style: normal; font-size: 5.5px; text-align: right; color: ${MUTED}; }
.${P}-t { position: relative; flex: 1; min-width: 0; aspect-ratio: 16 / 10; border-radius: 3px; overflow: hidden; background: #1d1e24; }
.${P}-t img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-cov { position: absolute; inset: 0; background: #1d1e24; }
.${P}-cov i { position: absolute; left: 12%; display: block; height: 2px; border-radius: 1px; background: #4a4c57; }
.${P}-cov b { position: absolute; right: 10%; bottom: 14%; width: 38%; height: 40%; border-radius: 2px; background: #2d2f38; }
.${P}-cv { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; padding: 20px 6px 0 2px; }
.${P}-sl { position: relative; box-sizing: border-box; width: 100%; aspect-ratio: 16 / 10; border-radius: 2px; overflow: hidden; background: #fff85a; padding: 0 0 14px 14px; display: flex; flex-direction: column; justify-content: flex-end; }
.${P}-sl small { position: absolute; right: 9px; top: 8px; font-size: 3.6px; letter-spacing: .5px; color: #3a3a1a; }
.${P}-sl b { display: block; font-size: 16px; line-height: 15px; font-weight: 900; font-style: italic; color: #1c1c1c; text-transform: uppercase; }
.${P}-sl b:first-child { color: rgba(28, 28, 28, .45); }
.${P}-style { flex: none; display: flex; align-items: center; gap: 6px; margin-top: 12px; height: 17px; padding: 0 8px; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px #e8e7f0; font-size: 6.5px; color: #4a4d5b; white-space: nowrap; }
.${P}-style i { display: block; width: 7px; height: 7px; border-radius: 2px; background: #fff85a; box-shadow: 0 0 0 1px #d8d84a; }
.${P}-style u { display: block; width: 7px; height: 7px; border-radius: 50%; background: #1c1c1c; text-decoration: none; }
.${P}-pane { flex: none; box-sizing: border-box; display: flex; flex-direction: column; width: ${PANE_W}px; margin: 2px 8px 8px 0; padding: 8px 10px 8px; border-radius: 9px; background: #fff; box-shadow: 0 0 0 1px #e8e7f0, 0 1px 3px rgba(40, 36, 80, .06); }
.${P}-ph { flex: none; display: flex; align-items: center; justify-content: space-between; height: 14px; font-size: 7.5px; font-weight: 700; color: ${INK}; }
.${P}-ph span { font-size: 6px; font-weight: 500; padding: 0 5px; height: 11px; line-height: 11px; border-radius: 4px; box-shadow: inset 0 0 0 1px #e1e0ec; color: #4a4d5b; }
.${P}-bub { flex: none; box-sizing: border-box; margin: 6px 0 0 14px; padding: 6px 8px; border-radius: 8px; background: #f5f5f7; font-size: 7px; line-height: 10px; color: ${INK}; }
.${P}-th { flex: none; display: flex; align-items: center; gap: 4px; margin-top: 12px; height: 12px; font-size: 7.5px; font-weight: 500; color: #3a3c4a; }
.${P}-th svg { width: 7px; height: 7px; fill: none; stroke: #3a3c4a; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.${P}-ptxt { flex: none; margin-top: 5px; height: 22px; font-size: 6.8px; line-height: 11px; color: #4a4d5b; overflow: hidden; }
.${P}-caret { display: inline-block; width: 1px; height: 7px; margin-left: 1px; vertical-align: -1px; background: ${INK}; }
.${P}-row { flex: none; display: flex; align-items: center; gap: 8px; height: 12px; margin-top: 5px; font-size: 6.8px; color: ${INK}; white-space: nowrap; }
.${P}-row.${P}-act { color: ${MUTED}; }
.${P}-mk { position: relative; flex: none; width: 9px; height: 9px; }
.${P}-mk i { position: absolute; left: 3px; top: 3px; width: 3px; height: 3px; border-radius: 50%; background: #d3d4dc; }
.${P}-mk svg { position: absolute; left: 0; top: 0; width: 9px; height: 9px; fill: none; stroke: #7b7e8c; stroke-width: 1.5; stroke-linecap: round; }
.${P}-row small { font-size: 6px; color: ${MUTED}; margin-left: -4px; }
.${P}-note { flex: none; margin-top: 8px; height: 11px; font-size: 6.8px; line-height: 11px; color: #4a4d5b; white-space: nowrap; }
.${P}-comp { flex: none; margin-top: auto; box-sizing: border-box; height: 40px; padding: 6px 8px 0; border-radius: 8px; background: #fff; box-shadow: 0 0 0 1px #ececf3; }
.${P}-comp span { display: block; height: 11px; font-size: 6.8px; line-height: 11px; color: ${MUTED}; }
.${P}-cb { display: flex; align-items: center; gap: 7px; margin-top: 5px; height: 14px; font-size: 6.5px; color: #4a4d5b; }
.${P}-cb s { text-decoration: none; font-size: 9px; line-height: 9px; color: #5a5d6b; }
.${P}-send { margin-left: auto; width: 13px; height: 13px; border-radius: 50%; background: ${ACC}; position: relative; }
.${P}-send::after { content: ""; position: absolute; left: 4px; top: 3.5px; width: 3.5px; height: 3.5px; border-left: 1.3px solid #fff; border-top: 1.3px solid #fff; transform: rotate(45deg); }
`;

const PROMPT = 'Create a product overview deck about muse memes';
const PLAN = "Let me start by understanding your template and building the deck's structure. Then I'll add content.";
const REF = 1.84;                                 // the beat in seconds from the card's entrance: cardIn .. lastLand, stretched with the real window
const THINK_AT = 0.08;                            // 'Thinking' appears
const PLAN_FROM = 0.12, PLAN_TO = 0.44;           // the plan line types out behind a caret
// the trace rows: [active label, done label, starts, done]; each starts as the one before finishes
const STEPS = [['Analyzing brand', 'Analyzed brand', 0.4, 0.56], ['Building outline', 'Built outline', 0.56, 0.7], ['Adding slides', 'Added slides', 0.7, 0.84]];
const NOTE_AT = 0.86;                             // 'Now I'll fill in the content for each slide.'
const WRITE = ['Writing text', 'Wrote text', 0.88, 1.02];
const GEN_AT = 1.04;                              // the 'Generating images' spinner row begins, and the rail fills with skeleton slides
const LAND = Array.from({ length: 10 }, (_, i) => 1.12 + i * 0.08);   // thumbnail i's skeleton hands over to the picture (reading order), the last at 1.84
const FADE = 0.05;                                // the skeleton thins away over this long before the picture lands
const SPIN = 560;                                 // degrees per layout second of the spinner arcs

export default {
  id: 'pitch-ai',
  label: 'Pitch AI agent (2026)',
  source: {
    platform: "Pitch web editor in desktop Chrome on macOS (light theme; a first-party Pitch product demo on YouTube, 1920x1080, the Pitch Agent run at t~17.1-26 s)",
    feature: "the editor with the 'Pitch Agent' panel docked right: 'Thinking' with a chevron, the plan line, resolved rows 'Analyzed brand' / 'Built outline' / 'Added slides x5' appearing in turn (an active row shows a turning arc and a greyed label), 'Now I'll fill in the content for each slide.' with a nested 'Wrote text', then a final spinner row 'Generating images' while the slides' pictures are drawn into the left rail (adapted to 10: ten rail thumbnails whose pictures land one after another in reading order)",
    refs: [{ url: 'https://www.youtube.com/watch?v=sFP0JFVk6vs', retrieved: '2026-10-14' }, { url: 'https://www.youtube.com/watch?v=7Nab49BybXU', retrieved: '2026-10-14' }],
    videoIds: ['sFP0JFVk6vs', '7Nab49BybXU'],
    dates: { published: '2026-05-27', secondary: '2025-11-07', retrieved: '2026-10-14' },
    extrapolated: "The footage fills its slide rail with the deck's own slides (theme slides with text, a few with stock photographs) while 'Generating images' runs, and the run's end is cut: the ten rail thumbnails each being a dark skeleton slide that hands over to one of our memes, the strict one-by-one reading-order landing, the spinner row resolving to a check with 'Generated images' once the last one lands (the footage cuts away with the spinner still turning), every active-row gerund ('Analyzing brand', 'Building outline', 'Adding slides', 'Writing text'; only 'Building outline' is seen in the footage) and the 'x5' being shown at 5 while ten thumbnails land (the footage's count) are extrapolated, as is every timing (the plan line typing at 0.12-0.44 s, the rows at 0.4 / 0.56 / 0.7 / 0.88 s, the spinner row at 1.04 s, the first picture at 1.12 s and the last at 1.84 s; the demo's cuts make its real latency untrustworthy). The prompt text is ours ('muse memes', not the demo's product), the context chips, window chrome, tool strip and zoom readout are omitted (the '70%' is the editor zoom, not progress), and the arc speed is a guess.",
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'pitch-ai');
    const skel = `<div class="${P}-cov" style="opacity: 1"><i style="top: 22%; width: 44%"></i><i style="top: 36%; width: 28%"></i><b></b></div>`;
    const slot = (g, i) => `<div class="${P}-slot" style="visibility: hidden"><em>${i + 1}</em><div class="${P}-t"><img src="${src}" width="870" height="1024" decoding="sync" alt="Muse meme ${i + 1}" style="visibility: hidden; transform-origin: ${g.origin}"/>${skel}</div></div>`;
    const arc = '<svg viewBox="0 0 12 12"><circle cx="6" cy="6" r="4.6" stroke-dasharray="10 20"/></svg>';
    const row = `<div class="${P}-row" style="visibility: hidden"><span class="${P}-mk"><i></i>${arc}</span><span></span></div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-top"><div class="${P}-burger"><i></i><i></i><i></i></div><b class="${P}-ttl">Muse memes deck</b><span class="${P}-sp"></span><span class="${P}-share">Share</span></div><div class="${P}-body"><div class="${P}-rail"><div class="${P}-add">+ Add slide</div>${tiles.map(slot).join('')}</div><div class="${P}-cv"><div class="${P}-sl"><small>MUSEMEMES.DECK</small><b>Muse</b><b>Memes</b><b>Overview</b></div><div class="${P}-style"><i></i>Slide style<u></u>Slide color</div></div><div class="${P}-pane"><div class="${P}-ph">Pitch Agent<span>Clear</span></div><div class="${P}-bub">${x.esc(PROMPT)}</div><div class="${P}-th" style="visibility: hidden">Thinking<svg viewBox="0 0 8 8"><path d="M1.5 3l2.5 2.5L6.5 3"/></svg></div><div class="${P}-ptxt"></div>${row}${row}${row}<div class="${P}-note" style="visibility: hidden">Now I'll fill in the content for each slide.</div>${row}${row}<div class="${P}-comp"><span>What do you want to do?</span><div class="${P}-cb"><s>+</s>Auto<i class="${P}-send"></i></div></div></div></div></div>`);
    const q = (sel) => root.querySelector(sel);
    const th = q(`.${P}-th`), plan = q(`.${P}-ptxt`), note = q(`.${P}-note`);
    const rowEls = [...root.querySelectorAll(`.${P}-row`)].map((n) => ({ n, dot: n.querySelector('i'), arc: n.querySelector('svg'), lab: n.querySelector(`.${P}-mk + span`) }));
    const slots = [...root.querySelectorAll(`.${P}-slot`)].map((n, i) => ({ n, im: n.querySelector('img'), cov: n.querySelector(`.${P}-cov`), g: tiles[i] }));
    ctx.gate(slots.map((c) => c.im));

    // memoised writes: the DOM is set from t alone, so a seek lands on the same state whatever came before
    const memo = new Map();
    const put = (key, v, fn) => { if (memo.get(key) !== v) { memo.set(key, v); fn(v); } };

    return {
      root,
      render(t) {
        const k = (ctx.lastLand - ctx.cardIn) / REF;   // the beat's window against the layout above
        const s = (t - ctx.cardIn) / k;                // layout seconds since the card entered
        const sc = Math.min(Math.max(s, 0), LAND[9]);  // the spinners turn until the last picture lands, then stop

        // 'Thinking' and the plan line typing out behind a caret
        put('th', s >= THINK_AT, (v) => { th.style.visibility = v ? 'visible' : 'hidden'; });
        const n = Math.floor(seg(s, PLAN_FROM, PLAN_TO) * PLAN.length);
        const caret = s >= THINK_AT && s < STEPS[0][2] + 0.06;
        put('plan', `${n}|${caret ? 1 : 0}`, () => { plan.innerHTML = x.esc(PLAN.slice(0, n)) + (caret ? `<i class="${P}-caret"></i>` : ''); });
        put('note', s >= NOTE_AT, (v) => { note.style.visibility = v ? 'visible' : 'hidden'; });

        // the trace rows: hidden, then a turning arc with a greyed label, then a bullet with the past-tense label
        const spinDeg = ((sc * SPIN) % 360).toFixed(1);
        const defs = [...STEPS, WRITE, ['Generating images', 'Generated images', GEN_AT, LAND[9]]];
        defs.forEach(([act, done, a, b], j) => {
          const st = s >= b ? 2 : s >= a ? 1 : 0;
          const r = rowEls[j];
          put(`r${j}`, `${st}|${st === 1 ? spinDeg : ''}`, () => {
            r.n.style.visibility = st === 0 ? 'hidden' : 'visible';
            r.n.classList.toggle(`${P}-act`, st === 1);
            r.dot.style.display = st === 1 ? 'none' : '';
            r.arc.style.display = st === 1 ? 'block' : 'none';
            r.arc.style.transform = st === 1 ? `rotate(${spinDeg}deg)` : 'none';
            r.lab.innerHTML = st === 2 ? (j === 2 ? `${done} <small>×5</small>` : done) : act;
          });
        });

        // the rail fills with skeleton slides once the slides are added; each hands over to its picture in turn
        put('rail', s >= STEPS[2][3], (v) => { slots.forEach((c) => { c.n.style.visibility = v ? 'visible' : 'hidden'; }); });
        slots.forEach((c, i) => {
          const a = LAND[i];
          const f = seg(s, a - FADE, a);
          c.im.style.transform = restTransform(c.g);
          c.im.style.filter = restFilter(c.g);
          put(`i${i}`, s >= a - FADE, (v) => { c.im.style.visibility = v ? '' : 'hidden'; });
          put(`c${i}`, f.toFixed(3), () => {
            if (f >= 1) { c.cov.style.display = 'none'; c.cov.style.opacity = ''; } else { c.cov.style.display = ''; c.cov.style.opacity = (1 - f).toFixed(3); }
          });
        });
      },
    };
  },
};
