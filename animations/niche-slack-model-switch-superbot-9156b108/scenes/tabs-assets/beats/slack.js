// Slack beat, the finale: superbot puts the catch-up in Sam's Slack DMs, and sends nothing. Its line streams and
// Slack's OAuth consent screen lands in the chat as a card (the Slack mark and superbot's app icon, "superbot is
// requesting permission to access the Tidecrest Slack workspace", what it will be able to view and do, Cancel /
// Allow). The pointer taps Allow, the consent folds away and the card turns into the run: four steps ticking in turn
// ("Connected to Tidecrest", "14 channels summarized", "5 replies drafted, nothing sent", "Catch-up sent to your DMs")
// above a mini Slack window. The card holds (CARD_HOLD) and the window opens to full frame (GROW), the connect-card
// grammar of the sibling platform forks (their connect beat and its full-frame client). Full frame is Slack's desktop client (the 2023+ layout: the workspace rail with Home, DMs, Activity,
// Files, More; the Aubergine sidebar with Channels, Direct messages and Apps; the search bar on top; the conversation
// pane in the light theme) open on the superbot app DM. superbot's message builds in as Block Kit: the header, the
// context line, then one section per conversation (its summary, and where Sam owes a reply a draft quote with Send /
// Edit); each conversation's unread count clears in the sidebar as its section lands. Then the one bold moment: the
// drafts land (the chime plays here, render.mjs reads window.__AD_MARKS.chime), a focus ring pulses on the first
// draft's Send and the pointer hovers it, and nothing is sent: the pane scrolls on to the footer row ("Send all 5",
// "Review one by one", "Nothing is sent until you tap Send.") and the drafts stay waiting through the end.
//
// There is ONE Slack client, on a layer in the scene root (outside the camera). While the card sits in the chat the
// layer is pinned over the card's window frame; GROW interpolates it from there to the whole frame. The client is laid
// out once at a design size (the frame divided by APP_SCALE) and scaled to the layer, so the mini window and the full
// frame are the same pixels at two sizes. On a portrait frame (4:5) it takes a narrow layout: no rail and no sidebar
// (the top bar keeps the workspace's search), sections 1 to 3 with their drafts, a line naming the rest, the footer.
// Pure function of t: every moving value is written from t.
import { lerp, seg, outCubic, inOutCubic, streamCount, placeCursor } from '../../../lib.js';
import { icon } from './sk-icons.js?v=9156b108';
import { WORKSPACE, AWAY, SECTIONS, DRAFTS, CHANNELS, MESSAGES, HUDDLES } from './digest.js?v=9156b108';

const USER = 'Sam';
const SAY = 'Putting your catch-up in your Slack DMs. Nothing gets sent without you.';
const NOW = '9:02 AM';
// the consent screen, in Slack's own words (docs.slack.dev OAuth install flow; the "What will <app> be able to view /
// do?" headings as Slack shows them on its install and app-management pages)
const VIEW = [['dms', 'Content and info about channels & conversations'], ['users', 'Content and info about you']];
const DO = [['pencil', 'Send messages on your behalf']];
const STEPS = [
  `Connected to <b>${WORKSPACE}</b>`,
  `${CHANNELS} channels summarized`,
  `${DRAFTS.length} replies drafted, nothing sent`,
  'Catch-up sent to your DMs',
];
const HEADER = `Welcome back, ${USER}. Here's what you missed (${AWAY})`;
const CONTEXT = `${CHANNELS} channels, ${MESSAGES.toLocaleString('en-US')} messages, ${HUDDLES} huddles. ${DRAFTS.length} replies drafted, nothing sent yet.`;
const FOOT = 'Nothing is sent until you tap Send.';
const NARROW_SHOWN = 3; // 4:5 shows sections 1 to 3 whole; the rest are named in one context line
const narrowRest = () => { const r = SECTIONS.slice(NARROW_SHOWN); return `+${r.length} more: ${r.map(secName).join(', ')}`; };
const secName = (s) => (s.kind === 'dm' ? `${s.name} (DM)` : `#${s.name}`);
// the sidebar: Slack lists channels alphabetically; the five summarized ones start unread (bold, with their count)
const SIDE_CH = [...SECTIONS.filter((s) => s.kind === 'ch').map((s) => s.name), 'random'].sort();
const SIDE_DM = ['Dana', 'Leo', 'Marcus', 'Priya'];

const APP_SCALE = { wide: 1.25, tall: 1.2 };    // full frame: the client's px to frame px
// timing (seconds from the reply start, or from the card / full frame where noted)
const CPS = 80;                                  // the reply line streams
const CARD_AT = 0.25;                            // the line streams, then the card lands
const CARD_IN = 0.3;                             // the card rising into the thread
const ALLOW_AT = 0.5;                            // the card landing to Allow tapped (the pointer is on it before)
const SWAP_AT = 0.15, SWAP = 0.35;               // Allow to the consent folding away / the run opening
const CHECK_AT = 0.3;                            // the run opening to the first step checked
const CHECK_STAGGER = 0.13;                      // one step to the next
const POP = 0.16;                                // a check popping in
const CARD_HOLD = 0.3; /* deliberate */          // the last check in, the card holds before it opens
const GROW = 0.4; /* deliberate */               // the window opens to full frame
const MSG_AT = 0.12;                             // full frame to superbot's message landing (head, header, context)
const SEC_AT = 0.18, SEC_STAGGER = 0.1;          // the message landed to the first section, and one to the next
const LAND = 0.3;                                // a block's slot opening and its content fading up
const FOOT_AT = 0.06;                            // the last section to the footer row
const READ_AT = 0.12;                            // a section landing to its sidebar row reading (bold and count clear)
const DRAFTS_AT = 0.12;                          // the footer to the drafts landing (the bold moment, the chime)
const DRAFT_STAGGER = 0.04, DRAFT_IN = 0.32;     // one draft to the next, a draft's slot opening
const RING_AT = 0.08, RING = 0.6;                // the last draft in to the focus ring pulsing on the first Send
const HOVER_IN = 0.4;                            // the pointer gliding onto that Send (it never presses)
const SCROLL_AT = 0.6, SCROLL = 0.6;             // the ring pulsing to the pane scrolling on to the footer row
const READ = 1.5; /* deliberate */               // the final state holds, readable, before the scene's fade
const RADIUS = 8;                                // the card's window radius, eased to 0 at full frame

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const avatar = (name, cls = 'sx-av') => `<span class="${cls}" style="--c: var(--sk-av-${name.toLowerCase()})">${name[0]}</span>`;

export default {
  times(r) {
    const T = { r };
    T.card = r + CARD_AT;                             // the consent card lands
    T.allow = T.card + ALLOW_AT;                      // Allow tapped
    T.swap = T.allow + SWAP_AT;                       // the consent folds away, the run opens
    T.ok = STEPS.map((_, i) => T.swap + CHECK_AT + i * CHECK_STAGGER);
    T.grow = T.ok[STEPS.length - 1] + POP + CARD_HOLD; // the window starts opening
    T.full = T.grow + GROW;                           // full frame
    T.msg = T.full + MSG_AT;                          // superbot's message: head, header, context
    T.sec = SECTIONS.map((_, i) => T.msg + SEC_AT + i * SEC_STAGGER);
    T.read = T.sec.map((a) => a + READ_AT);           // each conversation reads in the sidebar
    T.foot = T.sec[SECTIONS.length - 1] + FOOT_AT;
    T.drafts = T.foot + LAND + DRAFTS_AT;             // the drafts land (the chime)
    T.draft = DRAFTS.map((_, i) => T.drafts + i * DRAFT_STAGGER);
    T.ring = T.draft[DRAFTS.length - 1] + DRAFT_IN + RING_AT; // the focus ring pulses on the first Send
    T.hover = T.ring - HOVER_IN + 0.1;                // the pointer starts toward it
    T.scroll = T.ring + SCROLL_AT;                    // the pane scrolls on to the footer row
    T.settle = T.scroll + SCROLL;                     // the last visible change
    T.end = T.settle + READ;                          // the final state holds, then the scene fades to the end card
    return T;
  },
  build(k, x) {
    const T = k.T;
    if (typeof window !== 'undefined') window.__AD_MARKS = Object.assign(window.__AD_MARKS || {}, { chime: T.drafts });
    const mark = x.brand('slack-logo.svg');
    const sbIcon = (cls) => `<span class="${cls} sx-sb"><img src="${x.sbSrc}" alt=""/></span>`;

    // ---- the consent card in the chat ----
    const say = x.el(`<div class="qc-say sx-say"><span class="qc-vis"></span><span class="qc-hid">${x.esc(SAY)}</span></div>`);
    const perm = ([ic, s]) => `<li>${icon(ic, 'sx-pi')}<span>${esc(s)}</span></li>`;
    const card = x.el(`<div class="sx-card">
      <div class="sx-fold sx-ask"><div class="sx-fold-in">
        <div class="sx-logos"><span class="sx-lg"><img src="${mark}" alt=""/></span><i class="sx-dots"><i></i><i></i><i></i></i>${sbIcon('sx-lg')}</div>
        <div class="sx-ah"><b>superbot</b> is requesting permission to access the <b>${WORKSPACE}</b> Slack workspace</div>
        <div class="sx-q">What will superbot be able to view?</div><ul class="sx-perm">${VIEW.map(perm).join('')}</ul>
        <div class="sx-q">What will superbot be able to do?</div><ul class="sx-perm">${DO.map(perm).join('')}</ul>
        <div class="sx-abtn"><span class="sx-b sx-b2">Cancel</span><span class="sx-b sx-b1">Allow</span></div>
      </div></div>
      <div class="sx-fold sx-run"><div class="sx-fold-in">
        ${STEPS.map((s, i) => `<div class="sx-step">${i === 0 ? `<span class="sx-sl"><img src="${mark}" alt=""/></span>` : ''}<span class="sx-tx">${s}</span><span class="sx-ok"><i class="sx-spin"></i>${icon('check', 'sx-ck')}</span></div>`).join('')}
        <div class="sx-shot"></div>
      </div></div>
    </div>`);
    const shot = card.querySelector('.sx-shot');
    const [ask, run] = [...card.querySelectorAll('.sx-fold')];
    const allow = card.querySelector('.sx-b1');
    const checks = [...card.querySelectorAll('.sx-ok')].map((n) => ({ spin: n.querySelector('.sx-spin'), ck: n.querySelector('.sx-ck') }));

    // ---- the full-frame Slack client ----
    const badge = (n) => `<span class="sx-badge">${n}</span>`;
    const secIdx = (kind, name) => SECTIONS.findIndex((s) => s.kind === kind && s.name === name);
    const sideRow = (kind, name) => {
      const i = secIdx(kind, name), unread = i >= 0;
      const lead = kind === 'ch' ? icon('hash', 'sx-si') : `<span class="sx-sav-w">${avatar(name, 'sx-sav')}<i class="sx-pres"></i></span>`;
      return `<div class="sx-row${unread ? ' sx-unread' : ''}"${unread ? ` data-s="${i}"` : ''}>${lead}<span class="sx-rn">${esc(name)}</span>${unread ? badge(SECTIONS[i].n) : ''}</div>`;
    };
    const btns = (a, b) => `<div class="sx-acts"><span class="sx-btn sx-pri">${esc(a)}</span><span class="sx-btn">${esc(b)}</span></div>`;
    const section = (s, i) => `<div class="sx-slot sx-secw${i >= NARROW_SHOWN ? ' sx-wide-only' : ''}"><div class="sx-sec">
      <div class="sx-sh"><a class="sx-link">${esc(secName(s))}</a><span class="sx-new">${s.n} new</span></div>
      ${s.lines.map((l) => `<div class="sx-li"><i>&bull;</i><span>${esc(l)}</span></div>`).join('')}
      ${s.draft ? `<div class="sx-dslot"><div class="sx-draft">
        <div class="sx-quote"><b>Draft to ${esc(s.to)}</b><span>${esc(s.draft)}</span></div>
        ${btns('Send', 'Edit')}
      </div></div>` : '<div class="sx-fyi">No reply needed</div>'}
    </div></div>`;
    const railItem = (ic, label, on) => `<span class="sx-ri${on ? ' on' : ''}"><span class="sx-rib">${icon(ic)}</span><small>${label}</small></span>`;
    const layer = x.el(`<div class="sx-full" aria-hidden="true"><div class="sx-app">
      <header class="sx-top">
        <span class="sx-nav">${icon('left')}${icon('right')}${icon('history')}</span>
        <span class="sx-search">${icon('search')}<span>Search ${esc(WORKSPACE)}</span></span>
        <span class="sx-help">${icon('help')}</span>
      </header>
      <div class="sx-body">
        <nav class="sx-rail">
          <span class="sx-ws">${WORKSPACE[0]}</span>
          ${railItem('house', 'Home', true)}${railItem('dms', 'DMs')}${railItem('bell', 'Activity')}${railItem('files', 'Files')}${railItem('more', 'More')}
          <span class="sx-rsp"></span>
          <span class="sx-radd">${icon('plus')}</span>
          <span class="sx-sav-w sx-me">${avatar(USER, 'sx-meav')}<i class="sx-pres"></i></span>
        </nav>
        <div class="sx-win">
          <aside class="sx-side">
            <header class="sx-wsh"><b>${esc(WORKSPACE)}</b>${icon('caret', 'sx-car')}<span class="sx-cmp">${icon('compose')}</span></header>
            <div class="sx-row">${icon('threads', 'sx-si')}<span class="sx-rn">Threads</span></div>
            <div class="sx-row">${icon('headphones', 'sx-si')}<span class="sx-rn">Huddles</span></div>
            <div class="sx-row">${icon('send', 'sx-si')}<span class="sx-rn">Drafts &amp; sent</span></div>
            <div class="sx-cat">${icon('caret', 'sx-car')}Channels</div>
            ${SIDE_CH.map((c) => sideRow('ch', c)).join('')}
            <div class="sx-cat">${icon('caret', 'sx-car')}Direct messages</div>
            ${SIDE_DM.map((d) => sideRow('dm', d)).join('')}
            <div class="sx-cat">${icon('caret', 'sx-car')}Apps</div>
            <div class="sx-row sx-sel">${sbIcon('sx-sav')}<span class="sx-rn">superbot</span></div>
          </aside>
          <main class="sx-pane">
            <header class="sx-ch">${sbIcon('sx-chav')}<b>superbot</b><span class="sx-app-b">APP</span>${icon('caret', 'sx-car')}</header>
            <div class="sx-tabs"><span class="on">Messages</span><span>About</span></div>
            <div class="sx-scroll"><div class="sx-list">
              <div class="sx-day"><span>Today</span></div>
              <div class="sx-slot sx-msgw"><div class="sx-msg">
                ${sbIcon('sx-mav')}
                <div class="sx-mh"><b>superbot</b><span class="sx-app-b">APP</span><time>${NOW}</time></div>
                <div class="sx-hdr">${esc(HEADER)}</div>
                <div class="sx-ctx">${esc(CONTEXT)}</div>
              </div></div>
              ${SECTIONS.map(section).join('')}
              <div class="sx-slot sx-narrow-only"><div class="sx-sec sx-rest">${esc(narrowRest())}</div></div>
              <div class="sx-slot sx-footw"><div class="sx-sec sx-foot">${btns(`Send all ${DRAFTS.length}`, 'Review one by one')}<div class="sx-fctx">${esc(FOOT)}</div></div></div>
            </div></div>
            <div class="sx-comp">
              <div class="sx-cin">Message superbot</div>
              <div class="sx-ctools">${icon('plus', 'sx-cplus')}${icon('aa')}${icon('smile')}${icon('at')}<i class="sx-csep"></i>${icon('video')}${icon('mic')}<span class="sx-csend">${icon('send')}</span></div>
            </div>
          </main>
        </div>
      </div>
    </div></div>`);
    x.root.appendChild(layer);
    const app = layer.firstElementChild;
    const scrollBox = layer.querySelector('.sx-scroll'), list = layer.querySelector('.sx-list');
    const blk = (sel) => [...layer.querySelectorAll(sel)].map((s) => ({ s, c: s.firstElementChild, h: -1 }));
    const msgSlot = blk('.sx-msgw')[0];
    const secSlots = blk('.sx-secw');
    const restSlot = blk('.sx-narrow-only')[0];
    const footSlot = blk('.sx-footw')[0];
    const draftSlots = blk('.sx-dslot');
    const reads = [...layer.querySelectorAll('.sx-row[data-s]')].map((n) => ({ n, i: +n.dataset.s, b: n.querySelector('.sx-badge') }));
    const send1 = layer.querySelector('.sx-dslot .sx-pri');
    let pointer = null;
    // the client's type is Lato (vendored, slack.css): ask for every weight it uses up front so a seek never measures
    // a slot in the fallback face
    if (document.fonts && document.fonts.load) ['400', '700', '900'].forEach((w) => document.fonts.load(`${w} 16px "Lato SK"`));

    const vis = say.firstElementChild, hid = say.lastElementChild;
    let shown = -1, geo = '', feed = null, tall = false;
    let AW = 1536, AH = 864;

    // the client's design size from the frame: W x H over APP_SCALE; a portrait frame takes the narrow layout
    const layout = () => {
      const W = x.root.offsetWidth, H = x.root.offsetHeight;
      if (!W || !H) return;
      const key = `${W}x${H}`;
      if (key === geo) return;
      geo = key;
      tall = W < H;
      const s = tall ? APP_SCALE.tall : APP_SCALE.wide;
      AW = Math.round(W / s); AH = Math.round(H / s);
      app.style.width = `${AW}px`; app.style.height = `${AH}px`;
      app.classList.toggle('sx-narrow', tall);
      shot.style.aspectRatio = `${W} / ${H}`;
      card.classList.toggle('sx-tall', tall);
    };
    // a fold: its height follows its content's own height times g (0..1), its content fading with it
    const fold = (n, g) => {
      const h = n.firstElementChild.offsetHeight;
      n.style.height = g >= 1 ? 'auto' : `${(h * g).toFixed(2)}px`;
      n.style.opacity = g.toFixed(3);
    };
    // a block landing: its slot opens to the content's own height and the content fades up behind it
    const land = (m, at, dur) => {
      const g = outCubic(seg(t0, at, at + dur));
      const want = g >= 1 ? 'auto' : `${(m.c.offsetHeight * g).toFixed(2)}px`;
      if (want !== m.h) { m.s.style.height = want; m.h = want; }
      const f = outCubic(seg(t0, at + dur * 0.3, at + dur));
      m.c.style.opacity = f.toFixed(3);
      m.c.style.transform = f >= 1 ? 'none' : `translateY(${((1 - f) * 8).toFixed(2)}px)`;
    };
    let t0 = 0;

    return {
      nodes: [say, card],
      marks: [[T.r, say], [T.card, card]],
      render(t) {
        t0 = t;
        layout();
        const n = streamCount(SAY, T.r + 0.05, CPS, t);
        if (n !== shown) { vis.textContent = SAY.slice(0, n); hid.textContent = SAY.slice(n); shown = n; }
        const ci = outCubic(seg(t, T.card, T.card + CARD_IN));
        card.style.opacity = ci.toFixed(3);
        card.style.transform = ci >= 1 ? 'none' : `translateY(${((1 - ci) * 14).toFixed(2)}px)`;
        // Allow: tapped (a short dip, no overshoot), then the consent folds away as the run opens
        const dip = Math.sin(Math.PI * seg(t, T.allow - 0.1, T.allow + 0.14));
        allow.style.transform = dip > 0 ? `scale(${(1 - 0.08 * dip).toFixed(4)})` : 'none';
        allow.classList.toggle('sx-down', t >= T.allow - 0.05);
        const sw = inOutCubic(seg(t, T.swap, T.swap + SWAP));
        fold(ask, 1 - sw);
        fold(run, sw);
        // the four steps: a spinner each, resolving to a green check in turn
        T.ok.forEach((at, i) => {
          const c = checks[i], o = outCubic(seg(t, at, at + POP));
          c.spin.style.opacity = (1 - seg(t, at - 0.06, at + 0.04)).toFixed(3);
          c.spin.style.transform = `rotate(${((t - T.swap) * 420).toFixed(1)}deg)`;
          c.ck.style.opacity = o.toFixed(3);
          c.ck.style.transform = `scale(${lerp(0.4, 1, o).toFixed(4)})`;
        });

        // superbot's message: its head, the sections one by one, the footer; then the drafts open inside them
        land(msgSlot, T.msg, LAND);
        secSlots.forEach((m, i) => land(m, T.sec[i], LAND));
        land(restSlot, T.sec[NARROW_SHOWN], LAND);
        land(footSlot, T.foot, LAND);
        draftSlots.forEach((m, i) => land(m, T.draft[i], DRAFT_IN));
        // each conversation reads in the sidebar as its section lands: the bold clears, the count fades
        reads.forEach(({ n: row, i, b }) => {
          const q = seg(t, T.read[i], T.read[i] + 0.2);
          row.classList.toggle('sx-unread', q < 0.5);
          b.style.opacity = (1 - q).toFixed(3);
          b.style.transform = q > 0 ? `scale(${lerp(1, 0.6, q).toFixed(3)})` : 'none';
        });
        // the focus ring on the first draft's Send: one pulse, then it holds (Slack's focus blue); never pressed
        const rp = seg(t, T.ring, T.ring + RING);
        const ringW = t < T.ring ? 0 : 2 + 3 * Math.sin(Math.PI * Math.min(1, rp * 1.4)) * (1 - rp * 0.5);
        send1.style.boxShadow = ringW > 0 ? `0 0 0 2px #fff, 0 0 0 ${(2 + ringW).toFixed(2)}px var(--sk-ring)` : 'none';
        // the pane scrolls on to the footer row (as far as the list overflows; none when it fits)
        const viewH = scrollBox.clientHeight;
        const over = Math.max(0, list.scrollHeight - viewH);
        const sp = inOutCubic(seg(t, T.scroll, T.settle));
        list.style.transform = `translateY(${(-over * sp).toFixed(2)}px)`;
      },
      // after the camera: pin the layer over the card's window, then open it to the whole frame; the pointer
      after(t) {
        pointer = pointer || x.root.querySelector(':scope > .cursor');
        // the pointer: in to Allow and tapping it, then (full frame) hovering the first Send, never pressing it
        if (pointer) {
          if (t >= T.allow - 0.5 && t < T.swap + 0.3) {
            const b = x.box(allow);
            const g = inOutCubic(seg(t, T.allow - 0.5, T.allow - 0.08));
            const p = seg(t, T.allow - 0.06, T.allow) * (1 - seg(t, T.allow + 0.06, T.allow + 0.2));
            placeCursor(pointer, lerp(b.cx + 70, b.cx + 4, g), lerp(b.cy + 90, b.cy + 6, g), p, outCubic(seg(t, T.allow - 0.5, T.allow - 0.35)) * (1 - seg(t, T.swap + 0.1, T.swap + 0.3)));
          } else if (t >= T.hover && t < T.scroll) {
            const b = x.box(send1);
            const g = inOutCubic(seg(t, T.hover, T.hover + HOVER_IN));
            placeCursor(pointer, lerp(b.cx + 120, b.cx + 10, g), lerp(b.cy + 140, b.cy + 8, g), 0, outCubic(seg(t, T.hover, T.hover + 0.2)) * (1 - seg(t, T.scroll - 0.25, T.scroll)));
          }
        }
        if (t < T.card) { layer.style.opacity = '0'; return; }
        layout();
        const b = x.box(shot);
        const root = x.root;
        feed = feed || card.closest('.feed');
        const W = root.offsetWidth, H = root.offsetHeight;
        const g = inOutCubic(seg(t, T.grow, T.full));
        const L = lerp(b.x, 0, g), Tp = lerp(b.y, 0, g), Wd = lerp(b.w, W, g), Ht = lerp(b.h, H, g);
        const s = shot.offsetWidth ? b.w / shot.offsetWidth : 1; // the camera's scale on the card
        layer.style.left = `${L.toFixed(2)}px`;
        layer.style.top = `${Tp.toFixed(2)}px`;
        layer.style.width = `${Wd.toFixed(2)}px`;
        layer.style.height = `${Ht.toFixed(2)}px`;
        layer.style.borderRadius = `${(RADIUS * s * (1 - g)).toFixed(2)}px`;
        app.style.transform = `scale(${(Wd / AW).toFixed(5)})`;
        // while the card sits in the chat the layer is cut to the feed's viewport, as the card itself is, so it never
        // draws over the composer. Released as it opens.
        const fb = feed ? x.box(feed) : null;
        const cutT = fb ? Math.max(0, fb.y - Tp) * (1 - g) : 0, cutB = fb ? Math.max(0, Tp + Ht - (fb.y + fb.h)) * (1 - g) : 0;
        layer.style.clipPath = cutT > 0.01 || cutB > 0.01 ? `inset(${cutT.toFixed(2)}px 0 ${cutB.toFixed(2)}px 0 round ${(RADIUS * s * (1 - g)).toFixed(2)}px)` : '';
        // the run's window (inside the run's fold) only shows once the consent has folded away and the run is open
        layer.style.opacity = (+card.style.opacity * seg(t, T.swap + SWAP * 0.8, T.swap + SWAP + 0.12)).toFixed(3);
      },
    };
  },
};
