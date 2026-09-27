// Opus 5.5 timelapse beat, the opener of ?v=4. Claude Opus 5.5 cooks the whole Dark Souls build on a fast, hard-cut
// timelapse: a mini build card in the thread column whose TASK FEED flies by (about 96 plain-language tasks, a few per
// second at first and a blur at peak), whose elapsed clock races 0:00 to 3:40, whose counters climb (tasks 0 -> 96,
// files 0 -> 84, tests 0/312 -> 312/312 passing) and whose rows flip from a spinner to a green check as they land. It
// ends on the done line. NO SOURCE CODE IS SHOWN ANYWHERE: the body is the work Opus is finishing, never the code that
// finishes it. No code was ever on screen in v4's final cut either, only the tasks the model checked off.
//
// Pattern source (READ ONLY, another chat owns it): make-minecraft-every-model-superbot-b055c127/scenes/tabs-assets/
// beats/opus-code.js. Same framing (a card with a repo header and a list that fills under a scan sweep); here the list
// is a checklist of tasks landing at an accelerating rate instead of source typed file by file.
//
// IMAGERY / SOURCING: this beat draws no raster imagery. The only third-party mark is the Claude logomark,
// brand/claude-logo.svg, already vendored in this ad and already used by chat.js (APPS.opus). Source of record is
// brand/CREDITS.txt: "claude-logo.svg, Claude mark, https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/claude.svg
// (simple-icons, CC0 1.0). Fill set to #fff for the dark hub tile. Trademark of Anthropic." Used nominatively, to name
// the model superbot routed the request to. Everything else in the card (chrome, badge, check marks, scan sweep) is CSS
// on first-party UI chrome, not hand-drawn illustration. Task text, file tags and line counts are made up for the spot.
//
// Pure function of t (the tabs scene's local time): no Date, no rAF state, no self-running CSS animation or
// transition, so ?t=<sec> freezes an exact frame.
import { clamp, lerp, seg, outCubic, streamCount, rand } from '../../../lib.js';

const SAY = 'Engine, combat and bosses done.';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- the work Opus finishes, in landing order, under small section headers ----------
// Plain language only: a row is what got built, never the code that built it. The first row of every run of four
// carries a muted file tag, the rest carry the lines that landed with them (both are label text, not code).
const SECTIONS = [
  ['Combat', ['roll.ts', 'parry.ts', 'stamina.ts', 'frames.ts'], [
    'Roll with 13 i-frames',
    'Stamina drains on block',
    'Parry window 6 frames',
    'Backstab and riposte',
    'Poise and stagger',
    'Light and heavy swings',
    'Lock on tracks the nearest foe',
    'Weapon scaling in damage',
    'Hitbox sweep each frame',
    'Damage types and resistances',
    'Weapon durability and repair',
    'A roll cancels swing recovery',
    'Shield impact and ricochet',
  ]],
  ['Bosses', ['gatewarden.fsm.ts', 'gatewarden.phases.ts', 'telegraph.ts', 'bridge.ts'], [
    'Gatewarden phase 2 at 50% HP',
    'Third phase, the arena goes dark',
    'Telegraph windup arcs',
    'Greatsword sweep leaves an opening',
    'Boss death clears the fog gate',
    'Bell gargoyles share one arena',
    'Bridge drake strafe runs',
    'Asylum demon slam shockwave',
    'Boss health bar shows on aggro',
    'Enrage past two minutes',
    'Phase transition camera hold',
    'Boss souls and their trades',
  ]],
  ['World', ['bonfire.ts', 'firelink.ts', 'fog.wall.ts', 'items.ts'], [
    'Fog gate blocks until boss dies',
    'Bonfire rest respawns enemies',
    'Estus flask refills at bonfire',
    'Firelink Shrine lighting',
    'Shortcut doors from the far side',
    'Region music follows the map',
    'Lore notes on item pickup',
    'NPC dialog trees',
    'Merchant stock and souls',
    'Item pickup and inventory',
    'Chests and one mimic',
    'World streaming between regions',
    'Elevator travel between regions',
    'Souls lost on death, one bloodstain',
  ]],
  ['Enemies AI', ['hollow.fsm.ts', 'aggro.ts', 'patrol.ts', 'path.ts'], [
    'Hollow patrol and aggro',
    'Hollow flinch on heavy hits',
    'Aggro chains to nearby foes',
    'Sight and hearing radius',
    'Aggro drops after cooldown',
    'Pathfinding around props',
    'Ambush spawns hold still',
    'Archers lead their shots',
    'Dog packs stagger their rushes',
    'Enemy stagger meter',
    'Combo break after three swings',
    'One foe hangs back in a group',
  ]],
  ['Rendering', ['renderer.ts', 'lighting.ts', 'particles.ts', 'post.ts'], [
    'Global illumination bake',
    'Motion blur on the charge',
    'Fog volumes at the gate',
    'Torch falloff with distance',
    'Sparks on every parry',
    'Shadow pass on enemies',
    'Tone curve and vignette',
    'Texture atlas packing',
    'Wind sway on grass',
    'Water reflection pass',
    'Distance haze to black',
    'Damage flash and impact frame',
    'Camera shake on heavy hits',
    'Boss intro camera move',
  ]],
  ['UI', ['hud.ts', 'estus.ts', 'menu.ts', 'dialog.ts'], [
    'Health bar drains over the red',
    'Stamina bar pulses when empty',
    'Estus charge in the hotbar',
    'Damage numbers are off by default',
    'Menu pages and equip screen',
    'Coop HUD shows both bars',
    'Hollowing count on the HUD',
    'Item toasts and pickup text',
    'Compass and objective marker',
    'Damage vignette on low health',
    'Hit marker on every strike',
    'Pause menu resume and quit',
  ]],
  ['Audio hooks', ['audio.ts', 'sfx.ts', 'music.ts', 'ambience.ts'], [
    'Footsteps layer by surface',
    'Parry ding and swing whoosh',
    'Boss theme starts at the gate',
    'Score mutes on death',
    'Ambient loops by region',
    'Armor rattle and chain',
    'Bonfire lit cue',
    'Voice barks on aggro',
    'Low health heartbeat',
    'Coin and item pickup cues',
  ]],
  ['Save/Netcode', ['save.ts', 'session.ts', 'coop.ts', 'invaders.ts'], [
    'Save writes at every rest',
    'Save survives a hard crash',
    'Cloud save merge',
    'Coop sessions join by password',
    'Invaders cross into a session',
    'Message glyphs and rating',
    'Matchmaking by soul level',
    'Ping readout in the corner',
    'Session host migration',
  ]],
];

const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const clock = (m) => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

// the checklist: one row per section header, then one row per task. TASKS is flat and in landing order; TASKROW points
// a task back at its row so the scroll can be driven by the landing front rather than by the task index.
const ROWS = [], TASKS = [], TASKROW = [];
SECTIONS.forEach(([title, tags, items]) => {
  ROWS.push({ head: title, first: TASKS.length });
  items.forEach((text, j) => {
    const i = TASKS.length;
    TASKROW.push(ROWS.length);
    TASKS.push({ text, tag: j % 4 === 0 ? tags[(j / 4) | 0] : `+${fmt(14 + Math.floor(rand(i * 7.3 + 1.7) * 260))}` });
    ROWS.push({ task: i });
  });
});
const NT = TASKS.length;      // 96 tasks
const NFILES = 84;            // the files those tasks land in
const TOTAL_TESTS = 312;      // the suite goes green as the last tasks land

// ---------- constants ----------
const DEF = { say: SAY, span: 4.4 };
const RH = 14;                // design px: one task / header row
const FEED_H = 225;           // the task pane's height (30 header + 25 stats + 225 = the 280px card v4 already framed)
const CROSS = 0.12;           // the landing curve starts this far into the smootherstep, so row 1 lands at once

// the landing front: tasks completed = NT * ramp(prog), a smootherstep that starts at a few rows a second, peaks at a
// blur and eases onto the last rows. Both ramp and its slope are closed form, so a frozen frame is exact.
const ramp = (p) => { const x = CROSS + (1 - CROSS) * p; return x * x * x * (x * (x * 6 - 15) + 10); };
const slope = (p) => { const x = CROSS + (1 - CROSS) * p; return 30 * x * x * (x - 1) * (x - 1) * (1 - CROSS); };

export default {
  times(r, opts) {
    const o = { ...DEF, ...(opts || {}) };
    const T = { r };
    T.card = r + 0.16;             // the build card rises in
    T.run = T.card + 0.50;         // the thread has finished gliding, so the whole card is in frame: the clock starts
    T.done = T.run + o.span;       // the last rows land: clock 3:40, counters home, the badge stops
    T.say = T.done + 0.20;         // the done line streams
    T.end = T.say + 0.80;
    return T;
  },
  build(k, x) {
    const T = k.T;
    const o = { ...DEF, ...(k.opts || {}) };
    const say = x.el(`<div class="qc-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(o.say)}</span></div>`);

    const rowsHtml = ROWS.map((r) => (r.head
      ? `<div class="olap-sh">${x.esc(r.head)}</div>`
      : `<div class="olap-tk"><span class="olap-sg"><i class="olap-pd"></i>${x.OK}</span><span class="olap-tx">${x.esc(TASKS[r.task].text)}</span><em class="olap-tg">${x.esc(TASKS[r.task].tag)}</em></div>`)).join('');

    const card = x.el(`<div class="olap">
      <div class="olap-hd">
        <span class="olap-mk"><img src="${x.brand('claude-logo.svg')}" alt=""/></span>
        <b class="olap-rp">dark-souls</b><span class="olap-br">main</span>
        <span class="olap-bg"><i class="olap-rec"></i>TIMELAPSE x32</span>
        <span class="olap-pill"><i class="olap-spin"></i><span class="olap-pl">Cooking</span>${x.OK}</span>
      </div>
      <div class="olap-st">
        <span class="olap-s"><em>tasks</em><b class="olap-tasks">0</b></span>
        <span class="olap-s"><em>files</em><b class="olap-files">0</b></span>
        <span class="olap-s olap-ts"><em>tests</em><b class="olap-tests">0</b><i>/312</i></span>
        <span class="olap-s olap-clk"><em>elapsed</em><b class="olap-clock">0:00</b></span>
      </div>
      <div class="olap-fd">
        <div class="olap-list">${rowsHtml}</div>
        <i class="olap-sw"></i>
      </div>
    </div>`);

    const $ = (s) => card.querySelector(s);
    const rowNodes = [...card.querySelectorAll('.olap-sh, .olap-tk')];
    const meta = rowNodes.map((n) => ({ n, ck: n.querySelector('.qc-ok'), pd: n.querySelector('.olap-pd') }));
    const list = $('.olap-list'), sw = $('.olap-sw');
    const tasksEl = $('.olap-tasks'), filesEl = $('.olap-files'), testsEl = $('.olap-tests'), clockEl = $('.olap-clock');
    const pill = $('.olap-pill'), pl = $('.olap-pl'), spin = $('.olap-spin'), pOk = pill.querySelector('.qc-ok');
    const rec = $('.olap-rec'), badge = $('.olap-bg'), tsCell = $('.olap-ts');
    const vis = say.firstElementChild, hid = say.lastElementChild;

    // content px of each task row's bottom edge, so the scroll follows the landing front, not the task index
    const BASE = TASKROW.map((ri) => (ri + 1) * RH);
    const MAXOFF = Math.max(0, ROWS.length * RH - FEED_H);

    let shown = -1, lastLand = -1, lastDone = null;

    // one row's state: a header shows as its first task reaches the front, a task is done, pending (spinner up) or not
    // landed yet. Only the rows a frame actually changes are painted, so a 60fps frame over 104 rows stays cheap.
    const paint = (ri) => {
      const r = ROWS[ri], m = meta[ri];
      if (r.head) { m.n.style.opacity = r.first <= lastLandCur + 1 ? '1' : '0'; return; }
      const i = r.task;
      const on = i <= lastLandCur;
      m.n.style.opacity = on ? '1' : '0';
      m.n.classList.toggle('is-done', i < lastLandCur);
      m.n.classList.toggle('is-pend', i === lastLandCur);
      if (m.ck) m.ck.style.opacity = i < lastLandCur ? '1' : '0';
    };
    let lastLandCur = -1;

    return {
      // the reply text is the LAST node: the card is what the timelapse is about, the done line lands under it
      nodes: [card, say],
      marks: [[T.card, card], [T.done, card], [T.say, say]],
      render(t) {
        const n = streamCount(o.say, T.say + 0.05, 80, t);
        if (n !== shown) { vis.textContent = o.say.slice(0, n); hid.textContent = o.say.slice(n); shown = n; }

        // the card rises in, then holds perfectly still (no drift: a frozen frame must be identical)
        const ci = outCubic(seg(t, T.card, T.card + 0.45));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 16).toFixed(2)}px)`;

        // the timelapse: prog 0..1 over the run, land = how many tasks are checked off, frac = how far into the row
        // that is landing right now
        const prog = seg(t, T.run, T.done);
        const done = t >= T.done;
        const landF = (done ? 1 : ramp(prog)) * NT;
        const land = Math.min(NT, Math.floor(landF));
        const frac = done ? 1 : landF - land;

        // clock racing 0:00 to 3:40, and the counters homing on their final values
        clockEl.textContent = clock(done ? 220 : Math.floor(220 * Math.pow(prog, 0.86)));
        tasksEl.textContent = String(Math.round(landF));
        filesEl.textContent = String(Math.round(landF / NT * NFILES));
        testsEl.textContent = String(Math.round(prog * TOTAL_TESTS));

        // the badge: a red dot ticking while cooking, a stopped square when the run lands; the pill flips to Done
        if (done !== lastDone) {
          badge.classList.toggle('is-stop', done);
          pill.classList.toggle('is-done', done);
          tsCell.classList.toggle('is-ok', done);
          pl.textContent = done ? 'Done' : 'Cooking';
          lastDone = done;
        }
        rec.style.opacity = done ? '1' : (0.45 + 0.55 * Math.abs(Math.sin(t * 7.4))).toFixed(3);
        spin.style.opacity = done ? '0' : '1';
        spin.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        const po = seg(t, T.done, T.done + 0.26);
        pOk.style.opacity = po.toFixed(3);
        pOk.style.transform = `scale(${lerp(0.3, 1, po).toFixed(4)})`;

        // the task pane: rows land in bursts, the list scrolls so the row landing now sits at the bottom edge
        if (land !== lastLand) {
          lastLandCur = land;
          // paint from the row the old front sat on through the row landing now: the pending row is a TASK row, and a
          // section header sits between it and the last landed task, so the range has to reach TASKROW[land], not land
          const hi = land < NT ? TASKROW[land] : ROWS.length - 1;
          for (let ri = Math.max(0, Math.min(lastLand, land) - 1); ri <= hi; ri++) paint(ri);
          lastLand = land;
        }
        // the pending row: its spinner turns (from t, never a CSS animation) and its check pops in as the row completes
        const pendRow = land < NT ? TASKROW[land] : -1;
        const doneRow = land >= 1 ? TASKROW[land - 1] : -1;
        if (pendRow >= 0) {
          const pd = meta[pendRow].pd;
          if (pd) pd.style.transform = `rotate(${((t - T.card) * 420).toFixed(1)}deg)`;
        }
        if (doneRow >= 0) {
          const ck = meta[doneRow].ck;
          if (ck) {
            const pop = clamp(frac * 2.5);
            ck.style.opacity = pop.toFixed(3);
            ck.style.transform = `scale(${(0.4 + 0.6 * pop).toFixed(3)})`;
          }
        }

        // the scroll: the landing front is a pure function of landF, so the pane glides, never snaps
        const li = clamp(Math.floor(landF) - 1, 0, NT - 1), lj = Math.min(li + 1, NT - 1);
        const frontY = landF >= NT ? BASE[NT - 1] : lerp(BASE[li], BASE[lj], clamp(landF - 1 - li));
        const off = clamp(frontY - FEED_H + RH * 2, 0, MAXOFF);
        list.style.transform = off ? `translateY(${(-off).toFixed(1)}px)` : 'none';

        // the scan line: sits on the row landing now, its brightness following the landing rate (a blur at peak)
        const rate = done ? 0 : slope(prog) * NT / (T.done - T.run);
        if (pendRow >= 0) {
          sw.style.transform = `translateY(${((pendRow + 1) * RH - off).toFixed(1)}px)`;
          sw.style.opacity = (0.18 + 0.62 * clamp(rate / 44)).toFixed(3);
        } else {
          sw.style.opacity = '0';
        }
      },
    };
  },
};