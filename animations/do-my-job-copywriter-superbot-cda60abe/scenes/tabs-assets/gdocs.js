// gdocs.js: the copywriter's desk, a Google Docs copy deck for Mailchimp, and the four beats superbot works on it.
// It is one DOM tree built at mount and then driven purely from local time t (?t=<s> reproduces any frame), so the
// spot is seek-safe at every ratio. The Docs editor (title bar, menus, toolbar, ruler, page, Document tabs panel,
// comment rail, Suggesting mode) is rebuilt in HTML/CSS from reference captures kept outside the repo in
// /tmp/cw-ad.cda60abe/ref (see ref/NOTES.md; every colour and size in gdocs.css traces to a line there).
// The motion is the call-center spot's (e360.js) beat for beat: CONNECT / VOICE / LEARN / ANSWER / LAND, the three
// WINS, the queue's tAns / tRes, the step ticks and the HUD rules are unchanged; only what the desk shows is a
// copywriter's work. Column for column: the call queue is the deck's Document tabs (one per deliverable: open
// comment, drafting, resolved), the caller header and SmartConnect statements are the tab's heading, the request
// comment and the platform's spec line, the solution pills are three checks, the related details are the deck
// table with a live character count per line, the transcript is the comment thread (the request, then your reply
// in your voice) while the drafts stream into the page as suggestions, and the ticket flip plus End Conversation is
// the Resolve press that closes the thread.
// Real marks: the Google Docs icon in the title bar (../../img/google-docs-logo.svg, see ../../img/CREDITS.txt).
// Icons are Material Symbols paths (Apache 2.0), UI furniture only. All content comes from gdocs-data.js.
import { clamp, lerp, seg, outCubic, inOutCubic, rand, press, esc, streamCount } from '../../lib.js';
import { DOC_TITLE, USER, DELIVERABLES, STYLE, CHIPS } from './gdocs-data.js';

// ---------- the desk's own clock (seconds, local to the desk layer): the call-center spot's, unchanged ----------
export const DUR = 18.40;
const CONNECT = { a: 0.00, b: 2.10 };
const VOICE = { a: 2.10, b: 4.60 };
const LEARN = { a: 4.60, b: 8.60 };
const ANSWER = { a: 8.60, b: 16.10 };
const LAND = { a: 16.10, b: DUR };

// the three deliverables worked on the page, start to end
const WINS = [[8.90, 11.60], [11.60, 14.00], [14.00, 16.10]];
// where each step of a main lands inside its window, as a fraction of it (the source's prob / cause / sol / turn1 /
// turn2 / closed / end roles: the tab opens with its request, the drafts stream in, the checks tick, the reply,
// Resolve)
// Audit retime (2026-09-29): the drafts land by 0.44 so the reply (posted as Sam R.) can stream 0.44 to 0.58 and hold
// until Resolve at 0.86; at the old 0.62 / 0.76 / 0.80 it was on screen whole for under 0.1 s and never read.
const FR = { open: 0.00, spec: 0.04, lines: 0.05, linesEnd: 0.44, check: 0.44, reply: 0.44, replyEnd: 0.58, closed: 0.86, end: 0.92 };
const STEP_DONE = [1.75, 4.35, 8.35, 16.15];
// the queue's answer / resolve times, the call-center QUEUE's own (motion, not content): the three mains first
// (the three mains' resolve times are their Resolve presses, WINS[i][0] + FR.closed of the window: 11.222, 13.664, 15.806)
const TIMES = [[8.90, 11.222], [11.60, 13.664], [14.00, 15.806], [10.95, 12.60], [11.35, 13.10], [11.80, 13.45],
  [12.30, 14.20], [12.85, 14.55], [13.35, 15.20], [13.85, 15.60], [14.35, 15.92], [14.75, 16.02]];
const N_DEL = DELIVERABLES.length;
const MAINS = DELIVERABLES.filter((d) => d.main !== null && d.main !== undefined).sort((a, b) => a.main - b.main);

// ---------- icons: Material Symbols (outlined, 24px grid, viewBox 0 -960 960 960), UI furniture only ----------
const ms = (d, cls = '') => `<svg class="gi${cls ? ' ' + cls : ''}" viewBox="0 -960 960 960" aria-hidden="true"><path d="${d}"/></svg>`;
const P = {
  star: 'm354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z', // star
  move: 'm488-400-65 65 56 56 161-161-161-161-56 56 65 65H320v80h168ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z', // drive_file_move
  cloudDone: 'm414-280 226-226-58-58-169 169-84-84-57 57 142 142ZM260-160q-91 0-155.5-63T40-377q0-78 47-139t123-78q25-92 100-149t170-57q117 0 198.5 81.5T760-520q69 8 114.5 59.5T920-340q0 75-52.5 127.5T740-160H260Zm0-80h480q42 0 71-29t29-71q0-42-29-71t-71-29h-60v-80q0-83-58.5-141.5T480-720q-83 0-141.5 58.5T280-520h-20q-58 0-99 41t-41 99q0 58 41 99t99 41Zm220-240Z', // cloud_done
  sync: 'M160-160v-80h109q-51-44-80-106t-29-134q0-112 68-197.5T400-790v84q-70 25-115 86.5T240-480q0 54 21.5 99.5T320-302v-98h80v240H160Zm440 0q-50 0-85-35t-35-85q0-48 33-82.5t81-36.5q17-36 50.5-58.5T720-480q53 0 91.5 34.5T858-360q42 0 72 29t30 70q0 42-29 71.5T860-160H600Zm116-360q-7-41-27-76t-49-62v98h-80v-240h240v80H691q43 38 70.5 89T797-520h-81ZM600-240h260q8 0 14-6t6-14q0-8-6-14t-14-6h-70v-50q0-29-20.5-49.5T720-400q-29 0-49.5 20.5T650-330v10h-50q-17 0-28.5 11.5T560-280q0 17 11.5 28.5T600-240Zm120-80Z', // cloud_sync
  history: 'M480-120q-138 0-240.5-91.5T122-440h82q14 104 92.5 172T480-200q117 0 198.5-81.5T760-480q0-117-81.5-198.5T480-760q-69 0-129 32t-101 88h110v80H120v-240h80v94q51-64 124.5-99T480-840q75 0 140.5 28.5t114 77q48.5 48.5 77 114T840-480q0 75-28.5 140.5t-77 114q-48.5 48.5-114 77T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z', // history
  comment: 'M240-400h480v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM880-80 720-240H160q-33 0-56.5-23.5T80-320v-480q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v720ZM160-320h594l46 45v-525H160v480Zm0 0v-480 480Z', // comment
  addComment: 'M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z', // add_comment
  video: 'M360-320h80v-120h120v-80H440v-120h-80v120H240v80h120v120ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z', // video_call
  lock: 'M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm296.5-143.5Q560-327 560-360t-23.5-56.5Q513-440 480-440t-56.5 23.5Q400-393 400-360t23.5 56.5Q447-280 480-280t56.5-23.5ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z', // lock
  search: 'M784-120 532-372q-30 24-69 38t-83 14q-109 0-184.5-75.5T120-580q0-109 75.5-184.5T380-840q109 0 184.5 75.5T640-580q0 44-14 83t-38 69l252 252-56 56ZM380-400q75 0 127.5-52.5T560-580q0-75-52.5-127.5T380-760q-75 0-127.5 52.5T200-580q0 75 52.5 127.5T380-400Z', // search
  undo: 'M280-200v-80h284q63 0 109.5-40T720-420q0-60-46.5-100T564-560H312l104 104-56 56-200-200 200-200 56 56-104 104h252q97 0 166.5 63T800-420q0 94-69.5 157T564-200H280Z', // undo
  redo: 'M396-200q-97 0-166.5-63T160-420q0-94 69.5-157T396-640h252L544-744l56-56 200 200-200 200-56-56 104-104H396q-63 0-109.5 40T240-420q0 60 46.5 100T396-280h284v80H396Z', // redo
  print: 'M640-640v-120H320v120h-80v-200h480v200h-80Zm-480 80h640-640Zm560 100q17 0 28.5-11.5T760-500q0-17-11.5-28.5T720-540q-17 0-28.5 11.5T680-500q0 17 11.5 28.5T720-460Zm-80 260v-160H320v160h320Zm80 80H240v-160H80v-240q0-51 35-85.5t85-34.5h560q51 0 85.5 34.5T880-520v240H720v160Zm80-240v-160q0-17-11.5-28.5T760-560H200q-17 0-28.5 11.5T160-520v160h80v-80h480v80h80Z', // print
  spell: 'M564-80 394-250l56-56 114 114 226-226 56 56L564-80ZM120-320l194-520h94l194 520h-92l-46-132H254l-46 132h-88Zm162-208h156l-76-216h-4l-76 216Z', // spellcheck
  paint: 'M440-80q-33 0-56.5-23.5T360-160v-160H240q-33 0-56.5-23.5T160-400v-280q0-66 47-113t113-47h480v440q0 33-23.5 56.5T720-320H600v160q0 33-23.5 56.5T520-80h-80ZM240-560h480v-200h-40v160h-80v-160h-40v80h-80v-80H320q-33 0-56.5 23.5T240-680v120Zm0 160h480v-80H240v80Zm0 0v-80 80Z', // format_paint
  drop: 'M480-360 280-560h400L480-360Z', // arrow_drop_down
  minus: 'M200-440v-80h560v80H200Z', // remove
  plus: 'M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z', // add
  bold: 'M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z', // format_bold
  italic: 'M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z', // format_italic
  under: 'M200-120v-80h560v80H200Zm123-223q-56-63-56-167v-330h103v336q0 56 28 91t82 35q54 0 82-35t28-91v-336h103v330q0 104-56 167t-157 63q-101 0-157-63Z', // format_underlined
  textColor: 'M80 0v-160h800V0H80Zm140-280 210-560h100l210 560h-96l-50-144H368l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z', // format_color_text
  highlight: 'M80 0v-160h800V0H80Zm504-480L480-584 320-424l103 104 161-160Zm-47-160 103 103 160-159-104-104-159 160Zm-84-29 216 216-189 190q-24 24-56.5 24T367-263l-27 23H140l126-125q-24-24-25-57.5t23-57.5l189-189Zm0 0 187-187q24-24 56.5-24t56.5 24l104 103q24 24 24 56.5T857-640L669-453 453-669Z', // format_ink_highlighter
  link: 'M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z', // link
  image: 'M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z', // image
  alignLeft: 'M120-120v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Z', // format_align_left
  spacing: 'M240-160 80-320l56-56 64 62v-332l-64 62-56-56 160-160 160 160-56 56-64-62v332l64-62 56 56-160 160Zm240-40v-80h400v80H480Zm0-240v-80h400v80H480Zm0-240v-80h400v80H480Z', // format_line_spacing
  checklist: 'M222-200 80-342l56-56 85 85 170-170 56 57-225 226Zm0-320L80-662l56-56 85 85 170-170 56 57-225 226Zm298 240v-80h360v80H520Zm0-320v-80h360v80H520Z', // checklist
  bullets: 'M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm-56.5-263.5Q120-687 120-720t23.5-56.5Q167-800 200-800t56.5 23.5Q280-753 280-720t-23.5 56.5Q233-640 200-640t-56.5-23.5Z', // format_list_bulleted
  numbered: 'M120-80v-60h100v-30h-60v-60h60v-30H120v-60h120q17 0 28.5 11.5T280-280v40q0 17-11.5 28.5T240-200q17 0 28.5 11.5T280-160v40q0 17-11.5 28.5T240-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h60v-30H120v-60h120q17 0 28.5 11.5T280-560v70q0 17-11.5 28.5T240-450h-60v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z', // format_list_numbered
  indentL: 'M120-120v-80h720v80H120Zm320-160v-80h400v80H440Zm0-160v-80h400v80H440Zm0-160v-80h400v80H440ZM120-760v-80h720v80H120Zm160 440L120-480l160-160v320Z', // format_indent_decrease
  indentR: 'M120-120v-80h720v80H120Zm320-160v-80h400v80H440Zm0-160v-80h400v80H440Zm0-160v-80h400v80H440ZM120-760v-80h720v80H120Zm0 440v-320l160 160-160 160Z', // format_indent_increase
  clear: 'm528-546-93-93-121-121h486v120H568l-40 94ZM792-56 460-388l-80 188H249l119-280L56-792l56-56 736 736-56 56Z', // format_clear
  more: 'M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z', // more_vert
  edit: 'M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z', // edit
  suggest: 'M240-400h122l200-200q9-9 13.5-20.5T580-643q0-11-5-21.5T562-684l-36-38q-9-9-20-13.5t-23-4.5q-11 0-22.5 4.5T440-722L240-522v122Zm280-243-37-37 37 37ZM300-460v-38l101-101 20 18 18 20-101 101h-38Zm121-121 18 20-38-38 20 18Zm26 181h273v-80H527l-80 80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z', // rate_review
  up: 'm296-345-56-56 240-240 240 240-56 56-184-184-184 184Z', // expand_less
  check: 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z', // check
  checkCircle: 'm424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z', // check_circle
  tab: 'M280-280h280v-80H280v80Zm0-160h400v-80H280v80Zm0-160h400v-80H280v80Zm-80 480q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm0-560v560-560Z', // article
  linkChip: 'M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z', // link
  arrowBack: 'm313-440 224 224-57 56-320-320 320-320 57 56-224 224h487v80H313Z', // arrow_back
  chevDown: 'M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z', // keyboard_arrow_down
};
const I = Object.fromEntries(Object.entries(P).map(([k, d]) => [k, ms(d)]));
const HUD_CHECK = '<svg class="gd-hc" viewBox="0 0 24 24" aria-hidden="true"><path d="M4.8 12.6 9 16.8 19.2 6.6"/></svg>';
const CB_CHECK = '<svg class="gd-cbx-c" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.4l4.4 4.4L19 7.2"/></svg>';

// ---------- small helpers ----------
const $ = (s, root) => root.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const setT = (n, s) => { if (n && n.textContent !== s) n.textContent = s; };
const setCls = (n, c, on) => { if (n.classList.contains(c) !== on) n.classList.toggle(c, on); };
// A tab name that does not fit its one-line box is cut with an ellipsis, character by character, as the Docs tabs
// panel does ("Microbiome resources key…" in ref doc A)
const fontState = () => (document.fonts ? document.fonts.status : 'loaded');
function fitT(n, s) {
  if (!n) return;
  const key = `${s}|${el && el.lay ? el.lay.W : 0}|${fontState()}`;
  if (n._fit === key && n.textContent === n._fitOut) return;
  if (n.textContent !== s) n.textContent = s;
  if (!n.clientWidth) { n._fit = null; return; }
  // one-line boxes are judged on width only (glyphs may overhang a tight line box without wrapping)
  const over = () => n.scrollWidth > n.clientWidth + 0.5;
  if (over()) {
    let lo = 1, hi = s.length - 1, best = 1;
    const cut = (m) => s.slice(0, m).replace(/[\s·]+$/, '') + '…';
    while (lo <= hi) { const m = (lo + hi) >> 1; n.textContent = cut(m); if (over()) hi = m - 1; else { best = m; lo = m + 1; } }
    n.textContent = cut(best);
  }
  n._fit = key; n._fitOut = n.textContent;
}

let el = null;

// ---------- mount ----------
export function mount(section, ctx) {
  const asset = (n) => new URL(`../../img/${n}`, import.meta.url).href;
  const root = h(`<div class="gd-root"></div>`);
  const hudMark = ctx.shell.makeMark(26);
  const tb = (icon, cls = '') => `<span class="gd-tb${cls ? ' ' + cls : ''}">${icon}</span>`;
  root.innerHTML = `
<div class="gd">
  <header class="gd-top">
    <span class="gd-logo"><img src="${asset('google-docs-logo.svg')}" alt="Google Docs"/></span>
    <div class="gd-tm">
      <div class="gd-trow">
        <span class="gd-title">${esc(DOC_TITLE)}</span>
        <span class="gd-ti">${I.star}</span><span class="gd-ti">${I.move}</span>
        <span class="gd-ti gd-cloud"><span class="gd-cl-done">${I.cloudDone}</span><span class="gd-cl-sync">${I.sync}</span></span>
        <span class="gd-saved">Saved to Drive</span>
      </div>
      <nav class="gd-menus"><span>File</span><span>Edit</span><span>View</span><span>Insert</span><span>Format</span><span>Tools</span><span>Extensions</span><span>Help</span></nav>
    </div>
    <div class="gd-tr">
      <span class="gd-ri gd-ri-hist">${I.history}</span>
      <span class="gd-ri gd-ri-com">${I.comment}</span>
      <span class="gd-ri gd-ri-meet">${I.video}${I.drop}</span>
      <span class="gd-share">${I.lock}<b>Share</b></span>
      <span class="gd-me">${esc(USER.initial)}</span>
    </div>
  </header>

  <div class="gd-bar">
    <span class="gd-srch">${I.search}Menus</span>${tb(I.undo)}${tb(I.redo)}${tb(I.print, 'p2')}${tb(I.spell, 'p2')}${tb(I.paint, 'p2')}
    <span class="gd-dd gd-zoom"><b class="gd-zoom-v">100%</b>${I.drop}</span><i class="gd-sep"></i>
    <span class="gd-dd gd-style"><b>Normal text</b>${I.drop}</span><i class="gd-sep"></i>
    <span class="gd-dd gd-font p1"><b>Arial</b>${I.drop}</span><i class="gd-sep p1"></i>
    <span class="gd-size p1">${tb(I.minus)}<b class="gd-size-v">11</b>${tb(I.plus)}</span><i class="gd-sep p1"></i>
    ${tb(I.bold)}${tb(I.italic)}${tb(I.under)}${tb(I.textColor, 'gd-tc')}${tb(I.highlight, 'p2')}<i class="gd-sep"></i>
    ${tb(I.link, 'p1')}${tb(I.addComment)}<i class="gd-sep p2"></i>
    <span class="gd-tb gd-tb2 p2">${I.alignLeft}${I.drop}</span>${tb(I.spacing, 'p2')}${tb(I.checklist, 'p3')}${tb(I.drop, 'gd-split p3')}${tb(I.bullets, 'p3')}${tb(I.drop, 'gd-split p3')}${tb(I.numbered, 'p3')}${tb(I.drop, 'gd-split p3')}${tb(I.indentL, 'p3')}${tb(I.indentR, 'p3')}${tb(I.clear, 'p3')}
    ${tb(I.more, 'gd-tb-more')}
    <span class="gd-mode"><span class="gd-mode-i gd-mode-ed">${I.edit}</span><span class="gd-mode-i gd-mode-sg">${I.suggest}</span><b class="gd-mode-t">Editing</b>${I.drop}</span>
    <i class="gd-sep gd-sep-m"></i><span class="gd-tb gd-tb-up">${I.up}</span>
  </div>

  <div class="gd-body">
    <span class="gd-vr"></span>
    <aside class="gd-tabs">
      <span class="gd-tabs-back">${I.arrowBack}</span>
      <div class="gd-tabs-h"><b>Document tabs</b><span class="gd-tabs-add">${I.plus}</span></div>
      <div class="gd-tabs-list"></div>
      <div class="gd-tabs-foot"><b class="gd-tf-n">0</b> of ${N_DEL} comments resolved</div>
    </aside>
    <div class="gd-canvas">
      <div class="gd-ruler"><div class="gd-ruler-in"></div></div>
      <div class="gd-scroll">
        <div class="gd-zoomer">
          <div class="gd-page"><div class="gd-pviews"></div></div>
        </div>
        <div class="gd-rail"></div>
      </div>
    </div>
  </div>

  <div class="gd-hud">
    <div class="gd-hud-h"><span class="gd-hud-mark"></span><span class="gd-hud-cur">Opening your copy deck</span></div>
    <ul class="gd-hud-steps">${['Connected to Google Docs', 'Matched your writing style', 'Read the Mailchimp style guide', 'Drafting the copy deck'].map((s) => `<li><i></i>${esc(s)}</li>`).join('')}</ul>
    <div class="gd-hud-voice">
      <div class="gd-hud-lane"><b>You</b><span class="gd-hud-bars" data-l="you"></span></div>
      <div class="gd-hud-lane sb"><b>Superbot</b><span class="gd-hud-bars" data-l="sb"></span></div>
      <div class="gd-hud-mh"><span>Writing style</span><b class="gd-hud-ok">${HUD_CHECK}matched</b></div>
    </div>
    <div class="gd-hud-res"><b>What the style guide says</b><div class="gd-hud-chips"></div></div>
  </div>
</div>`;
  section.appendChild(root);
  $('.gd-hud-mark', root).appendChild(hudMark.el);

  // ---- the ruler: inch numbers and eighth-inch ticks across the page width (Docs' ruler, 96 px to the inch) ----
  const rulerIn = $('.gd-ruler-in', root);
  let rh = '';
  for (let i = 0; i <= 68; i++) {
    const x = i * 12, inch = i % 8 === 0, half = i % 4 === 0;
    if (inch) rh += `<b class="gd-rn" style="left:${x}px">${Math.abs(i / 8 - 1) || ''}</b>`;
    else rh += `<i class="gd-rt${half ? ' h' : ''}" style="left:${x}px"></i>`;
  }
  rh += '<span class="gd-ind gd-ind-l"></span><span class="gd-ind gd-ind-f"></span><span class="gd-ind gd-ind-r"></span>';
  rulerIn.innerHTML = rh;

  // ---- the Document tabs panel: Overview, Style guide, then one tab per deliverable ----
  const list = $('.gd-tabs-list', root);
  const tabRow = (name, extra = '') => h(`<div class="gd-tab">
      <span class="gd-tab-i">${I.tab}</span><span class="gd-tab-n"><span class="gd-fit">${esc(name)}</span></span>
      ${extra}</div>`);
  const tOverview = tabRow('Overview');
  const tStyle = tabRow('Style guide');
  list.appendChild(tOverview); list.appendChild(tStyle);
  const tabs = DELIVERABLES.map((d, i) => {
    const n = tabRow(d.tab, `<span class="gd-st"><span class="gd-st-c">1</span><span class="gd-st-d">${I.edit}</span><span class="gd-st-r">${I.checkCircle}</span></span>`);
    list.appendChild(n);
    return { n, d, i, tAns: TIMES[i][0], tRes: TIMES[i][1], c: $('.gd-st-c', n), dr: $('.gd-st-d', n), r: $('.gd-st-r', n) };
  });

  // ---- page views: Overview (the deck's cover table), Style guide (LEARN), one per main (ANSWER) ----
  const pv = $('.gd-pviews', root);
  const vOverview = h(`<div class="gd-pv gd-pv-ov">
    <p class="gd-p-title">${esc(DOC_TITLE)}</p>
    <p class="gd-p-sub">${N_DEL} deliverables, one tab each. Requests are comments. Drafts go in as suggestions.</p>
    <table class="gd-t gd-t-ov"><colgroup><col style="width:41%"><col style="width:30%"><col style="width:15%"><col style="width:14%"></colgroup>
      <tr class="gd-th"><td>Deliverable</td><td>Spec</td><td>Team</td><td>Status</td></tr>
      ${DELIVERABLES.map((d) => `<tr><td>${esc(d.deck)}</td><td>${esc(d.limitLabel)}</td><td>${esc(d.team.replace(/ team$/, ''))}</td><td class="gd-ov-st"><b>Open</b></td></tr>`).join('')}
    </table></div>`);
  pv.appendChild(vOverview);
  const ovSt = [...vOverview.querySelectorAll('.gd-ov-st b')];

  const sections = [...new Set(STYLE.rules.map((r) => r.section))];
  const vStyle = h(`<div class="gd-pv gd-pv-sg">
    <p class="gd-p-h1">${esc(STYLE.title)}</p>
    <p class="gd-p-src">From <span class="gd-lnk">${esc(STYLE.url.replace(/^https?:\/\//, '').replace(/\/$/, ''))}</span> · <b class="gd-sg-n">0</b> of ${STYLE.rules.length} rules read</p>
    ${sections.map((sec) => `<p class="gd-p-h2">${esc(sec)}</p>
    <ul class="gd-rules">${STYLE.rules.filter((r) => r.section === sec).map((r) => `<li>${r.head ? `<b>${esc(r.head)}</b><br>` : ''}${esc(r.text)}</li>`).join('')}</ul>`).join('')}
  </div>`);
  pv.appendChild(vStyle);
  const ruleEls = [...vStyle.querySelectorAll('.gd-rules li')];

  const mains = MAINS.map((d, k) => {
    const hasW = d.lines.some((l) => l.wordLimit);
    const specLine = (sp) => `<p class="gd-p-spec">${esc(sp.label)}: “${esc(sp.text)}” <span class="gd-p-srcl">(<span class="gd-lnk">${esc(sp.host)}</span>)</span></p>`;
    const v = h(`<div class="gd-pv gd-pv-m">
      <p class="gd-p-h1"><span class="gd-anchor">${esc(d.h1)}</span></p>
      ${d.specs.map(specLine).join('')}
      ${d.extra ? `<p class="gd-p-spec">${esc(d.extra.label)}: ${esc(d.extra.text)} <span class="gd-p-srcl">(<span class="gd-lnk">${esc(d.extra.host)}</span>)</span></p>` : ''}
      <ul class="gd-cl">${d.checks.map((c) => `<li><span class="gd-cbx">${CB_CHECK}</span><span>${esc(c)}</span></li>`).join('')}</ul>
      <table class="gd-t gd-t-m"><colgroup>${hasW ? '<col style="width:22%"><col style="width:52%"><col style="width:13%"><col style="width:13%">' : '<col style="width:22%"><col style="width:63%"><col style="width:15%">'}</colgroup>
        <tr class="gd-th"><td>Field</td><td>Copy</td><td>Chars</td>${hasW ? '<td>Words</td>' : ''}</tr>
        ${d.lines.map((l) => `<tr><td class="gd-lbl">${esc(l.label)}</td><td class="gd-cp">${l.was ? `<span class="gd-was">${esc(l.was)}</span>` : ''}<span class="gd-sg"></span><i class="gd-caret"><span class="gd-yrs">You’re suggesting</span></i></td><td class="gd-ch"><span class="gd-cnt"></span></td>${hasW ? '<td class="gd-ch gd-wd"><span class="gd-wn"></span></td>' : ''}</tr>`).join('')}
      </table>
      <div class="gd-src"><p class="gd-src-h">Sources</p>
        ${d.sources.map((s) => `<p class="gd-src-l"><span class="gd-src-u">${esc(s.use)}</span> ← “${esc(s.q)}” <span class="gd-chip">${I.linkChip}<span>${esc(s.host)}</span></span></p>`).join('')}
      </div></div>`);
    pv.appendChild(v);
    const rows = [...v.querySelectorAll('.gd-t-m tr:not(.gd-th)')].map((tr, j) => ({
      tr, sg: $('.gd-sg', tr), caret: $('.gd-caret', tr), cnt: $('.gd-cnt', tr), ch: $('.gd-ch', tr), line: d.lines[j],
      was: $('.gd-was', tr), wn: $('.gd-wn', tr), wd: $('.gd-wd', tr),
    }));
    const srcLines = [...v.querySelectorAll('.gd-src-l')].map((n, k) => ({ n, line: d.sources[k].line }));
    return { v, d, rows, anchor: $('.gd-anchor', v), checks: [...v.querySelectorAll('.gd-cl li')], srcH: $('.gd-src-h', v), srcLines };
  });

  // ---- the comment rail: one thread per main (the request, assigned to you; your reply; Resolve) ----
  const rail = $('.gd-rail', root);
  const threads = MAINS.map((d) => {
    const n = h(`<div class="gd-cm">
      <div class="gd-cm-h">
        <span class="gd-av" style="background:${d.teamHue}">${esc(d.teamInitial)}</span>
        <span class="gd-cm-who"><b>${esc(d.team)}</b><small>Assigned to you</small></span>
        <span class="gd-cm-res">${I.check}</span><span class="gd-cm-more">${I.more}</span>
      </div>
      <p class="gd-cm-tx">${esc(d.request)}</p>
      <div class="gd-cm-rp">
        <div class="gd-cm-h"><span class="gd-av gd-av-me">${esc(USER.initial)}</span><span class="gd-cm-who"><b>${esc(USER.name)}</b></span></div>
        <p class="gd-cm-tx gd-cm-rt"></p>
      </div>
      <div class="gd-cm-in"><span class="gd-cm-ph">Reply or add others with @</span></div>
    </div>`);
    rail.appendChild(n);
    return { n, d, res: $('.gd-cm-res', n), rp: $('.gd-cm-rp', n), rt: $('.gd-cm-rt', n), inp: $('.gd-cm-in', n) };
  });

  // ---- the HUD's style lanes: 26 deterministic bars each ----
  const lane = (which) => {
    const box = $(`.gd-hud-bars[data-l="${which}"]`, root);
    const out = [];
    for (let i = 0; i < 26; i++) { const b = document.createElement('i'); box.appendChild(b); out.push(b); }
    return out;
  };
  const barsYou = lane('you'), barsSb = lane('sb');
  const YOU = Array.from({ length: 26 }, (_, i) => clamp(0.26 + 0.74 * Math.abs(Math.sin(i * 0.58 + 0.7)) * (0.52 + 0.48 * Math.abs(Math.sin(i * 0.21 + 1.3))) * (0.68 + 0.32 * rand(i + 3)), 0, 1));
  const OTHER = YOU.map((_, i) => clamp(0.24 + 0.76 * YOU[(i * 5 + 3) % 26], 0, 1));
  const chipBox = $('.gd-hud-chips', root);
  const resChips = CHIPS.map((r) => {
    const n = h(`<span class="gd-hud-chip">${HUD_CHECK}${esc(r)}</span>`);
    chipBox.appendChild(n);
    return n;
  });

  el = {
    root, hudMark, gd: $('.gd', root),
    saved: $('.gd-saved', root), cloud: $('.gd-cloud', root),
    mode: $('.gd-mode', root), modeT: $('.gd-mode-t', root), zoomV: $('.gd-zoom-v', root),
    tOverview, tStyle, tabs, tabsFootN: $('.gd-tf-n', root), list,
    canvas: $('.gd-canvas', root), scroll: $('.gd-scroll', root), zoomer: $('.gd-zoomer', root), page: $('.gd-page', root), rulerIn,
    vOverview, ovSt, vStyle, ruleEls, sgN: $('.gd-sg-n', root), mains, threads, rail,
    hudCur: $('.gd-hud-cur', root), hudSteps: [...root.querySelectorAll('.gd-hud-steps li')],
    hudVoice: $('.gd-hud-voice', root), hudOk: $('.gd-hud-ok', root), hudRes: $('.gd-hud-res', root), resChips,
    barsYou, barsSb, YOU, OTHER, lay: null,
    fits: [...root.querySelectorAll('.gd-fit')].map((n) => { n._src = n.textContent; return n; }),
  };
  return el;
}

// ---------- per-frame render ----------
function callState(t) {
  for (let i = 0; i < WINS.length; i++) {
    if (t >= WINS[i][0] && t < WINS[i][1]) return { i, a: WINS[i][0], b: WINS[i][1] };
  }
  if (t >= WINS[2][1]) return { i: 2, a: WINS[2][0], b: WINS[2][1], done: true };
  return null;
}
const st = (c, k) => c.a + FR[k] * (c.b - c.a);

// which view the page shows: 'ov' (cover), 'sg' (style guide), 0..2 (a main)
function viewAt(t) {
  if (t >= LAND.a + 0.15) return 'ov';
  const c = callState(t);
  if (c && t >= WINS[0][0] - 0.12) return c.i;
  if (t >= LEARN.a + 0.10 && t < ANSWER.a + 0.20) return 'sg';
  return 'ov';
}

function renderChrome(t) {
  // CONNECT: Editing -> Suggesting (the source's CTI OFF -> ON)
  const sug = t >= 0.45;
  setCls(el.mode, 'on', sug);
  setT(el.modeT, sug ? 'Suggesting' : 'Editing');
  const mp = press(t, 0.45, 0.07, 0.06, 0.14);
  el.mode.style.transform = `scale(${(1 - 0.06 * mp).toFixed(4)})`;
  // the document status: syncing while a draft streams in, saved once it lands
  const c = callState(t);
  const typing = c && !c.done && t >= st(c, 'lines') && t < st(c, 'replyEnd');
  setCls(el.cloud, 'sync', !!typing);
  const sv = outCubic(seg(t, LAND.a + 0.30, LAND.a + 0.70));
  el.saved.style.opacity = sv.toFixed(3);
  el.saved.style.transform = sv >= 1 ? 'none' : `translateX(${((1 - sv) * -6).toFixed(2)}px)`;
  // the panel's tally: resolved comments, counted from the tabs on screen
  const resolved = el.tabs.filter((tb) => t >= tb.tRes).length;
  setT(el.tabsFootN, String(resolved));
}

function renderTabs(t, view) {
  el.tabs.forEach((tb) => {
    const drafting = t >= tb.tAns && t < tb.tRes, done = t >= tb.tRes;
    tb.c.style.display = !drafting && !done ? '' : 'none';
    tb.dr.style.display = drafting ? '' : 'none';
    tb.r.style.display = done ? '' : 'none';
    if (drafting) {
      const b = Math.abs(Math.sin((t - tb.tAns) * 5.2));
      tb.dr.style.opacity = (0.55 + 0.45 * b).toFixed(3);
    }
    if (done) {
      const p = outCubic(seg(t, tb.tRes, tb.tRes + 0.3));
      tb.r.style.transform = `scale(${lerp(0.6, 1, p).toFixed(3)})`;
      tb.r.style.opacity = p.toFixed(3);
    }
    setCls(tb.n, 'sel', view === tb.i && tb.d.main !== null);
  });
  setCls(el.tOverview, 'sel', view === 'ov');
  setCls(el.tStyle, 'sel', view === 'sg');
}

function renderViews(t, view) {
  // tab switches are near-instant in Docs; a 0.18 s cross-fade keeps the cut soft on video
  const vis = (n, on, since) => {
    const o = on ? outCubic(seg(t, since, since + 0.18)) : 0;
    n.style.opacity = o.toFixed(3);
    n.style.visibility = on ? 'visible' : 'hidden';
  };
  const since = view === 'sg' ? LEARN.a + 0.10 : view === 'ov' ? (t >= LAND.a ? LAND.a + 0.15 : -1) : WINS[view][0] - 0.12;
  vis(el.vOverview, view === 'ov', since);
  vis(el.vStyle, view === 'sg', since);
  el.mains.forEach((m, k) => vis(m.v, view === k, since));
  // the Overview's status column: every deliverable as its comment is resolved
  el.ovSt.forEach((c, i) => {
    const done = t >= el.tabs[i].tRes;
    setCls(c, 'ok', done);
    setT(c, done ? 'Resolved' : 'Open');
  });
}

function renderLearn(t) {
  // the rules are read top to bottom; the one being read is selected, the canvas scrolls to keep it in view
  const n = el.ruleEls.length;
  const p = seg(t, LEARN.a + 0.35, 7.60);
  const cur = Math.min(n - 1, Math.floor(p * n));
  const read = t < LEARN.a + 0.35 ? 0 : p >= 1 ? n : cur + 1;
  setT(el.sgN, String(read));
  el.ruleEls.forEach((li, i) => setCls(li, 'rd', t >= LEARN.a + 0.35 && t < 8.45 && i === cur && p < 1));
  // scroll: only as far as the list overflows the canvas (portrait); 0 on a frame where it fits
  if (el.lay) {
    const over = el.lay.sgOver;
    const y = over > 0 && t >= LEARN.a ? over * inOutCubic(seg(t, LEARN.a + 0.8, 7.9)) : 0;
    el.vStyle.style.transform = y ? `translateY(${(-y).toFixed(2)}px)` : '';
  }
}

function renderCall(t, view) {
  const c = callState(t);
  el.threads.forEach((th, k) => { th.n.style.display = typeof view === 'number' && view === k ? '' : 'none'; });
  if (!c || typeof view !== 'number') return;
  const k = c.i, m = el.mains[k], d = m.d, th = el.threads[k];
  // the request's anchor (the tab's heading) is highlighted while its comment is open
  const closeAt = st(c, 'closed');
  setCls(m.anchor, 'hl', t < closeAt + 0.05);
  setCls(m.anchor, 'hl-on', t < closeAt + 0.05);
  // the drafts: each line is a suggestion typed into its Copy cell, with its live character count
  const a = st(c, 'lines'), b = st(c, 'linesEnd');
  const nL = m.rows.length;
  const gap = nL > 1 ? (b - a) * 0.5 / (nL - 1) : 0;
  let typingRow = -1;
  const landAt = [];
  m.rows.forEach((r, j) => {
    // a row replacing live copy first strikes the old text through (a suggested deletion), then types the new
    const strike = r.was ? 0.14 : 0;
    const s0 = a + j * gap + strike;
    const dur = Math.max(0.12, Math.min(r.line.text.length / 95, b - s0));
    const cps = r.line.text.length / dur;
    landAt[j] = s0 + dur;
    const nC = t < s0 ? 0 : streamCount(r.line.text, s0, cps, t);
    setT(r.sg, r.line.text.slice(0, nC));
    if (r.was) setCls(r.was, 'del', t >= a + j * gap);
    const typing = nC > 0 && nC < r.line.text.length;
    if (typing) typingRow = j;
    r.caret.style.display = typing ? '' : 'none';
    // the live counters: what is on the page, over the field's limit when the platform publishes one
    const lim = r.line.limit;
    setT(r.cnt, nC > 0 ? (lim ? `${nC}/${lim}` : String(nC)) : '');
    setCls(r.ch, 'full', nC >= r.line.text.length);
    if (r.wn) {
      const w = nC > 0 ? r.line.text.slice(0, nC).trim().split(/\s+/).length : 0;
      setT(r.wn, nC > 0 && r.line.wordLimit ? `${w}/${r.line.wordLimit}` : '');
      setCls(r.wd, 'full', nC >= r.line.text.length);
    }
  });
  // the Sources block: each line types in (as a suggestion) once the drafted line it backs has landed
  const srcIn = (at) => outCubic(seg(t, at, at + 0.22));
  const h0 = srcIn(landAt[0] - 0.08);
  m.srcH.style.opacity = h0.toFixed(3);
  m.srcLines.forEach((sl) => {
    const p = srcIn(landAt[sl.line] ?? Infinity);
    sl.n.style.opacity = p.toFixed(3);
    sl.n.style.transform = p >= 1 ? '' : `translateY(${((1 - p) * 4).toFixed(2)}px)`;
  });
  // the three checks tick in turn once the lines are in (each a small press)
  m.checks.forEach((li, i) => {
    const at = st(c, 'check') + i * 0.10;
    const on = t >= at;
    setCls(li, 'on', on);
    const pr = press(t, at, 0.05, 0.05, 0.12);
    li.firstElementChild.style.transform = `scale(${(1 - 0.18 * pr).toFixed(4)})`;
  });
  // the thread: shown from the tab's opening; the reply streams in your voice; Resolve is pressed and it folds away
  const tin = outCubic(seg(t, c.a - 0.05, c.a + 0.30));
  const fold = inOutCubic(seg(t, closeAt + 0.02, closeAt + 0.30));
  th.n.style.opacity = (tin * (1 - fold)).toFixed(3);
  th.n.style.transform = `translate(${((1 - tin) * 14 + fold * 24).toFixed(2)}px, 0)`;
  const r0 = st(c, 'reply'), r1 = st(c, 'replyEnd');
  const nR = streamCount(d.reply, r0, d.reply.length / (r1 - r0), t);
  th.rp.style.display = nR > 0 ? '' : 'none';
  setT(th.rt, d.reply.slice(0, nR));
  th.inp.style.display = nR > 0 ? 'none' : '';
  const rp = press(t, closeAt, 0.07, 0.08, 0.14);
  setCls(th.res, 'press', t >= closeAt - 0.07 && t < closeAt + 0.3);
  th.res.style.transform = `scale(${(1 - 0.12 * rp).toFixed(4)})`;
}

function renderHud(t) {
  const resolved = el.tabs.filter((tb) => t >= tb.tRes).length;
  const cur = t < 1.50 ? 'Opening your copy deck'
    : t < VOICE.a ? 'Suggesting mode on'
      : t < 4.30 ? 'Matching your writing style'
        : t < LEARN.a ? 'Writing style matched'
          : t < 8.30 ? 'Reading the Mailchimp style guide'
            : t < LAND.a ? 'Drafting the copy deck' : `Deck done · ${resolved} comments resolved`;
  setT(el.hudCur, cur);
  el.hudSteps.forEach((li, i) => {
    const done = t >= STEP_DONE[i];
    const on = !done && t >= (i === 0 ? 0 : STEP_DONE[i - 1]);
    setCls(li, 'done', done);
    setCls(li, 'cur', on);
    const dot = li.firstElementChild;
    if (on) {
      const b = 0.5 - 0.5 * Math.cos((t - (i === 0 ? 0 : STEP_DONE[i - 1])) * Math.PI * 2 / 1.1);
      dot.style.boxShadow = `inset 0 0 0 1.5px #34c759, 0 0 0 ${(1 + 3 * b).toFixed(2)}px rgba(52,199,89,${(0.35 * (1 - b)).toFixed(3)})`;
    } else if (dot.style.boxShadow) dot.style.boxShadow = '';
  });
  // the style panel (VOICE): no score, just "matched" with a check once the lanes agree
  const vo = inOutCubic(seg(t, VOICE.a + 0.04, VOICE.a + 0.34)) * (1 - inOutCubic(seg(t, 4.40, 4.72)));
  el.hudVoice.style.maxHeight = (100 * vo).toFixed(1) + 'px';
  el.hudVoice.style.opacity = vo.toFixed(3);
  if (vo > 0.01) {
    const cv = outCubic(seg(t, VOICE.a + 0.25, 4.15));
    const play = t * 2.6;
    for (let i = 0; i < 26; i++) {
      const swell = 0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play));
      el.barsYou[i].style.height = (3 + 21 * el.YOU[i] * swell).toFixed(2) + 'px';
      el.barsSb[i].style.height = (3 + 21 * lerp(el.OTHER[i], el.YOU[i], cv) * (0.62 + 0.38 * Math.abs(Math.sin(i * 0.34 - play + 1.9)))).toFixed(2) + 'px';
      el.barsSb[i].style.opacity = (0.55 + 0.45 * cv).toFixed(3);
    }
    const p = outCubic(seg(t, 4.0, 4.3));
    setCls(el.hudOk, 'on', p > 0.5);
    el.hudOk.style.opacity = (0.4 + 0.6 * p).toFixed(3);
  }
  // what superbot learned (LEARN); it folds away again once the drafting starts
  const ro = inOutCubic(seg(t, 6.55, 6.85)) * (1 - inOutCubic(seg(t, ANSWER.a + 0.35, ANSWER.a + 0.75)));
  el.hudRes.style.opacity = ro.toFixed(3);
  el.hudRes.style.maxHeight = (120 * ro).toFixed(1) + 'px';
  el.resChips.forEach((n, i) => {
    const p = outCubic(seg(t, 6.62 + i * 0.15, 6.62 + i * 0.15 + 0.4));
    n.style.opacity = (p * ro).toFixed(3);
    n.style.transform = p >= 1 ? 'none' : `translateY(${((1 - p) * 8).toFixed(2)}px)`;
  });
  el.hudMark.render(t);
}

// the desk is authored in design px and scaled up to the frame, so its type reads at the size the real editor shows
// it. Narrower ratios scale less, zoom the page and restack (gdocs.css). Same factors as the call-center spot.
const UI_SCALE = (W) => (W >= 1900 ? 1.3 : W >= 1400 ? 1.2 : W >= 1000 ? 1.1 : 1.05);
// the page zoom per ratio, as Docs' zoom menu names it (100% at 16:9, 90% elsewhere). Audit (2026-09-29): 4:3 was 75%
// and 4:5 "Fit" (~73%), which put the table copy at 13 px and 11 px in the exported frame; at 90% the page is wider
// than the canvas slot on 4:3 and 4:5, so it is scrolled sideways to centre the text column (its margins clipped, as
// a zoomed-in Docs page in a narrow window) and on 4:3 the comment rail sits over the page's right margin.
const ZOOM = { '16x9': [1, '100%'], '4x3': [0.9, '90%'], '1x1': [0.9, '90%'], '4x5': [0.9, '90%'] };
function layout(W) {
  const key = (window.AR && window.AR.key) || '16x9';
  const fk = `${W}|${fontState()}`;
  if (el.lay && el.lay.fk === fk) return el.lay;
  const S = UI_SCALE(W);
  el.gd.style.width = (W / S).toFixed(2) + 'px';
  el.gd.style.height = (1080 / S).toFixed(2) + 'px';
  el.gd.style.transform = `scale(${S})`;
  let [z, zl] = ZOOM[key] || ZOOM['16x9'];
  if (!z) {
    // "Fit": the page fills the width the canvas leaves beside the tabs panel
    const avail = el.canvas.clientWidth - 24;
    z = Math.floor((avail / 816) * 100) / 100;
  }
  el.zoomer.style.zoom = String(z);
  el.rulerIn.style.zoom = String(z);
  // the page sits centred in what the canvas leaves beside the comment rail (the rail floats over the page on portrait)
  const railW = getComputedStyle(el.rail).position === 'absolute' ? 0 : el.rail.offsetWidth + 20;
  const pageW = 816 * z;
  const slot = el.canvas.clientWidth - railW;
  let left = Math.floor((slot - pageW) / 2);
  if (left < 12) left = Math.round((slot - 624 * z) / 2 - 96 * z);
  // CSS zoom scales an element's own margins too, so they are written in unzoomed px (the ruler's left already is)
  el.zoomer.style.marginLeft = `${(left / z).toFixed(2)}px`;
  // a rail pushed over the page's right margin keeps 16px off the window edge
  el.zoomer.style.marginRight = railW ? `${(Math.min(0, slot - left - pageW - (slot - left - pageW < 0 ? 16 : 0)) / z).toFixed(2)}px` : '';
  el.rulerIn.style.left = `${(left / z).toFixed(2)}px`;
  setT(el.zoomV, zl);
  // how far the style-guide list overflows the canvas (LEARN scrolls exactly that far)
  el.vStyle.style.transform = '';
  const sgH = el.vStyle.offsetHeight * z + 20;
  const visH = el.scroll.clientHeight;
  el.lay = { fk, W, S, z, sgOver: Math.max(0, sgH - visH + 40) };
  return el.lay;
}

export function render(t, W = 1920) {
  if (!el) return;
  layout(W);
  for (const n of el.fits) if (n.offsetParent) fitT(n, n._src);
  const view = viewAt(t);
  renderChrome(t);
  renderTabs(t, view);
  renderViews(t, view);
  renderLearn(t);
  renderCall(t, view);
  renderHud(t);
}

export default { id: 'gdocs', DUR, mount, render };
