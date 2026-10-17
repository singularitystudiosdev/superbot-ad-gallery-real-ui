// A 2023 web image creator (the screen recordings a_ and b_ under .tmp/clone-9e82faf1/reveal-refs/copilot, spec confidence
// 0.66), dark theme: a plain-text 'Image Creator' header, a prompt field whose magenta 'Create' pill turns into a grey
// 'Creating' with trailing dots, a 3-4 px magenta bar filling left to right on a grey track under it, the caption 'Your image
// is being created by AI', a static Tip card in the canvas (no partial or blurred image is ever previewed), and a right
// 'Recent' rail whose pending tile is a dark square with a clock glyph. A job's four results snap into a centred 2x2 grid in
// ONE frame. Ten images are three jobs (4 + 4 + 2), each snapping in at the end of its last image's slot, in order; a
// finished grid moves into the Recent rail when the next one replaces it. No Microsoft or Bing logo or wordmark is drawn.
import { seg } from '../../../../lib.9b47fc30.js';
import { injectStyle, restTransform, restFilter, ownSrc, UI_FONT } from './util.9e82faf1.js';

const P = 'rv-bi';
const CSS = `
.${P} { box-sizing: border-box; width: 560px; max-width: 100%; padding: 0 0 10px; border-radius: 12px; background: #1a1a17; color: #e5e5e5; font-family: ${UI_FONT}; -webkit-font-smoothing: antialiased; overflow: hidden; box-shadow: 0 0 0 1px #2f2f2c; }
.${P}-hd { display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 12px; background: #202021; font-size: 11px; font-weight: 600; color: #f3f3f3; }
.${P}-hd em { padding: 1px 5px; border-radius: 3px; background: #f5b82e; font-style: normal; font-size: 7.5px; font-weight: 700; letter-spacing: .04em; color: #1a1a17; }
.${P}-hd span { margin-left: auto; display: grid; place-items: center; width: 17px; height: 17px; border-radius: 50%; background: #f5b82e; font-size: 8px; color: #1a1a17; }
.${P}-pr { display: flex; align-items: center; gap: 7px; margin: 10px 12px 0; }
.${P}-in { flex: 1; min-width: 0; height: 28px; padding: 0 10px; border-radius: 8px; background: #2a2a2b; box-shadow: inset 0 0 0 1px #4d4d50; font-size: 10.5px; line-height: 28px; color: #cfcfd1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.${P}-b { flex: none; height: 26px; padding: 0 12px; border-radius: 13px; font-size: 10.5px; font-weight: 600; line-height: 26px; white-space: nowrap; }
.${P}-go { min-width: 62px; text-align: center; background: #dd3998; color: #fff; }
.${P}-go.busy { background: #4a4a4c; color: #c4c4c6; }
.${P}-sp { box-shadow: inset 0 0 0 1px #6b6b6e; color: #e5e5e5; }
.${P}-tabs { display: flex; gap: 16px; margin: 8px 12px 0; font-size: 10px; line-height: 18px; color: #a3a3a6; }
.${P}-tabs span.on { color: #f3f3f3; box-shadow: 0 2px 0 #dd3998; }
.${P}-barw { height: 4px; margin: 6px 12px 0; border-radius: 2px; background: #52494c; overflow: hidden; }
.${P}-bar { height: 100%; width: 100%; border-radius: 2px; background: #dd3998; transform-origin: 0 50%; transform: scaleX(0); }
.${P}-cap { height: 14px; margin: 3px 12px 0; font-size: 9px; line-height: 14px; color: #9a9a9d; }
.${P}-main { display: flex; gap: 10px; margin: 4px 12px 0; }
.${P}-cv { position: relative; flex: 1; min-width: 0; height: 290px; }
.${P}-tip { position: absolute; left: 50%; top: 50%; width: 330px; margin: -41px 0 0 -165px; box-sizing: border-box; display: flex; gap: 11px; padding: 9px; border-radius: 10px; background: #3a3a3b; }
.${P}-ill { flex: none; position: relative; width: 56px; height: 64px; border-radius: 6px; background: linear-gradient(160deg, #2fb8d4, #1d7fa8); overflow: hidden; }
.${P}-ill::before { content: ""; position: absolute; left: 20px; top: 11px; width: 16px; height: 16px; border-radius: 50%; background: #f1c9a0; }
.${P}-ill::after { content: ""; position: absolute; left: 11px; top: 30px; width: 34px; height: 40px; border-radius: 14px 14px 0 0; background: #e8793c; }
.${P}-tt { font-size: 9.5px; line-height: 13px; color: #d9d9db; }
.${P}-tt b { display: block; font-size: 10px; color: #fff; margin-bottom: 1px; }
.${P}-tt i { display: block; margin-top: 4px; font-style: normal; color: #a9a9ac; }
.${P}-gr { position: absolute; left: 50%; top: 50%; display: grid; grid-template-columns: repeat(2, 132px); gap: 6px; width: 270px; margin: -135px 0 0 -135px; }
.${P}-gr div, .${P}-mn div { position: relative; overflow: hidden; background: #26262a; }
.${P}-gr div { width: 132px; height: 132px; border-radius: 7px; }
.${P}-gr img, .${P}-mn img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; object-fit: cover; }
.${P}-rail { flex: none; width: 66px; display: flex; flex-direction: column; gap: 6px; }
.${P}-rail h6 { margin: 0 0 1px; font: 600 9px/12px ${UI_FONT}; color: #cfcfd1; }
.${P}-pend { display: grid; place-items: center; width: 62px; height: 62px; border-radius: 8px; background: #252626; box-shadow: 0 0 0 1px #3a3a3b; }
.${P}-pend svg { width: 22px; height: 22px; fill: none; stroke: #f3f3f3; stroke-width: 1.6; stroke-linecap: round; }
.${P}-mn { display: grid; grid-template-columns: repeat(2, 29px); gap: 3px; width: 62px; }
.${P}-mn div { width: 29px; height: 29px; border-radius: 4px; }
`;

const JOBS = [4, 4, 2];
const IMG = (src, i, g, alt) => `<img src="${src}" width="870" height="1024" decoding="sync" alt="${alt} ${i + 1}" style="transform-origin: ${g.origin}"/>`;

export default {
  id: 'bing-image-creator',
  label: 'Bing Image Creator (2023)',
  source: {
    platform: 'Bing Image Creator (bing.com/images/create), 2023 dark web UI',
    feature: 'Create button to Creating, magenta progress bar and caption, static Tip card, pending tile in the Recent rail, all four results snapping into a 2x2 grid (adapted to jobs of 4 + 4 + 2)',
    refs: [
      { url: 'https://www.youtube.com/watch?v=w1YhNDi-Pk4', retrieved: '2026-10-14' },
      { url: 'https://www.youtube.com/watch?v=vJs8kZK6u2U', retrieved: '2026-10-14' },
    ],
  },
  build(x, ctx) {
    injectStyle(P, CSS);
    const { tiles } = ctx;
    const src = ownSrc(ctx.src, 'bing-image-creator');
    // the ten images, cut into jobs; job k's first image index and the time it snaps in (the end of its last image's slot)
    const firsts = [], ends = [];
    let n = 0;
    JOBS.forEach((len) => { firsts.push(n); n += len; ends.push(ctx.seq(n - 1)[1]); });
    const starts = [ctx.seq(0)[0], ends[0], ends[1]];
    const grid = [0, 1, 2, 3].map((k) => `<div>${IMG(src, k, tiles[k], 'Muse meme')}</div>`).join('');
    const mini = (job) => `<div class="${P}-mn" data-job="${job}">${Array.from({ length: JOBS[job] }, (_, k) => `<div>${IMG(src, firsts[job] + k, tiles[firsts[job] + k], 'Muse meme')}</div>`).join('')}</div>`;
    const root = x.el(`<div class="${P}"><div class="${P}-hd">Image Creator<em>PREVIEW</em><span>25</span></div><div class="${P}-pr"><div class="${P}-in">a cheerful ghost holding a handwritten note in a lecture hall</div><div class="${P}-b ${P}-go"></div><div class="${P}-b ${P}-sp">Surprise Me</div></div><div class="${P}-tabs"><span>Explore ideas</span><span class="on">Creations</span></div><div class="${P}-barw"><div class="${P}-bar"></div></div><div class="${P}-cap">Your image is being created by AI</div><div class="${P}-main"><div class="${P}-cv"><div class="${P}-tip"><i class="${P}-ill"></i><div class="${P}-tt"><b>Tip</b>Describe an art movement, like impressionism<i>Try: “A ghost holding a note in a lecture hall, impressionism”</i></div></div><div class="${P}-gr" style="display:none">${grid}</div></div><div class="${P}-rail"><h6>Recent</h6><div class="${P}-pend"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg></div>${mini(1)}${mini(0)}</div></div></div>`);
    const go = root.querySelector(`.${P}-go`), bar = root.querySelector(`.${P}-bar`), barw = root.querySelector(`.${P}-barw`), cap = root.querySelector(`.${P}-cap`);
    const tip = root.querySelector(`.${P}-tip`), gr = root.querySelector(`.${P}-gr`), pend = root.querySelector(`.${P}-pend`);
    const gcells = [...gr.children].map((d) => ({ d, im: d.querySelector('img') }));
    const minis = [0, 1].map((job) => root.querySelector(`.${P}-mn[data-job="${job}"]`));
    const mimgs = [0, 1].map((job) => [...minis[job].querySelectorAll('img')]);
    ctx.gate([...gcells.map((c) => c.im), ...mimgs.flat()]);
    // the mini groups sit newest first under the pending tile
    mimgs.forEach((list, job) => list.forEach((im, k) => { im.style.filter = restFilter(tiles[firsts[job] + k]); im.style.transform = restTransform(tiles[firsts[job] + k]); }));

    let showJob = -2, label = null, busy = null, over = null;
    return {
      root,
      render(t) {
        let done = 0;
        while (done < JOBS.length && t >= ends[done]) done++;
        const finished = done === JOBS.length;
        // the canvas: the Tip card until the first job lands, then the newest job's grid
        const job = done - 1;
        if (job !== showJob) {
          tip.style.display = job < 0 ? '' : 'none';
          gr.style.display = job < 0 ? 'none' : '';
          if (job >= 0) {
            gr.style.marginTop = JOBS[job] > 2 ? '-135px' : '-66px'; // a pair sits centred on its own row
            gcells.forEach((c, k) => {
              const have = k < JOBS[job];
              c.d.style.display = have ? '' : 'none';
              if (have) {
                const g = tiles[firsts[job] + k];
                c.im.style.transformOrigin = g.origin;
                c.im.style.filter = restFilter(g);
                c.im.style.transform = restTransform(g);
              }
            });
          }
          // earlier jobs have moved into the rail
          minis.forEach((m, j) => { m.style.display = j < job ? '' : 'none'; });
          showJob = job;
        }
        // the status: the pill, the bar and the caption belong to the running job
        const running = !finished;
        const k = Math.min(done, JOBS.length - 1);
        const frac = finished ? 1 : seg(t, starts[k], ends[k]);
        bar.style.transform = `scaleX(${frac.toFixed(4)})`;
        const lab = finished ? 'Create' : `Creating${'.'.repeat(Math.floor(t * 2.5) % 3)}`;
        if (lab !== label) { go.textContent = lab; label = lab; }
        if (running !== busy) { go.classList.toggle('busy', running); busy = running; }
        if (finished !== over) {
          barw.style.visibility = finished ? 'hidden' : '';
          cap.style.visibility = finished ? 'hidden' : '';
          pend.style.display = finished ? 'none' : '';
          over = finished;
        }
      },
    };
  },
};
