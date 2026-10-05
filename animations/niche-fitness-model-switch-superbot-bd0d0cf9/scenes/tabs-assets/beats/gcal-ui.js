// The Google Calendar web client (2026, Material 3), month view, as Sam sees it on Mon Oct 5 2026, built as markup
// for gcal.js's full-frame layer. Laid out at a 1440 x 810 design size (a 1080p screen at 133%):
// top bar (menu, the app's dated logo + "Calendar", Today, the chevrons, "October 2026"; search, help, settings, the
// "Month" view menu, the Calendar/Tasks toggle, the apps grid, Sam's monogram), the side bar (Create, the mini month,
// Search for people, My calendars with the new "Half Marathon Plan" calendar in Tangerine, Other calendars), the
// white month surface, and the side panel (Keep, Tasks, Contacts, Maps: Google's own icons from gstatic, then "+"). Weeks start Sunday (US). Three month grids (Oct, Nov, Dec) are laid out; gcal.js shows one.
// Timed events read like the real month view, "dot, 7am, title"; race day is an all-day bar in Tangerine; holidays
// from Google's "Holidays in United States" calendar are all-day bars in Basil. Every run comes from plan-data.js SESSIONS. Glyphs: ui-icons.js (Material Symbols).
import { SESSIONS, RACE } from './plan-data.js?v=bd0d0cf9';

export const COLORS = { plan: '#f4511e', me: '#039be5', holidays: '#0b8043', birthdays: '#33b679', tasks: '#3f51b5' };
const HOLIDAYS = {
  '2026-10-12': 'Columbus Day', '2026-10-31': 'Halloween', '2026-11-01': 'Daylight Saving Time ends',
  '2026-11-03': 'Election Day', '2026-11-11': 'Veterans Day', '2026-11-26': 'Thanksgiving Day',
  '2026-12-24': 'Christmas Eve', '2026-12-25': 'Christmas Day', '2026-12-31': "New Year's Eve",
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const BY_DAY = new Map(SESSIONS.map((s, i) => [key(s.date), { s, i }]));
export const TODAY = new Date(2026, 9, 5);
export const VIEW_MONTHS = [9, 10, 11];
export const monthTitle = (m) => `${MONTHS[m]} 2026`;

// the grid's days: from the Sunday on or before the 1st, whole weeks through the month's last day
function days(m) {
  const first = new Date(2026, m, 1), last = new Date(2026, m + 1, 0);
  const start = new Date(first); start.setDate(1 - first.getDay());
  const n = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  return Array.from({ length: n }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

function cell(d, m, row, esc) {
  const out = d.getMonth() !== m, today = key(d) === key(TODAY);
  const label = d.getDate() === 1 ? `${MONTHS[d.getMonth()].slice(0, 3)} 1` : d.getDate();
  const hol = HOLIDAYS[key(d)];
  const ev = BY_DAY.get(key(d));
  // race day is an all-day event (a Tangerine bar); every training run is timed at 7am (dot, time, title)
  const run = !ev ? '' : ev.s === RACE
    ? `<span class="gc-ad gc-ev gc-raceev" data-i="${ev.i}">${esc(ev.s.title)}</span>`
    : `<span class="gc-ev" data-i="${ev.i}"><i class="gc-dot"></i><span class="gc-tm">7am</span><b>${esc(ev.s.title)}</b></span>`;
  return `<div class="gc-cell${out ? ' gc-out' : ''}">${row === 0 ? `<span class="gc-wd">${WD[d.getDay()]}</span>` : ''}
    <span class="gc-dn${today ? ' gc-today' : ''}">${label}</span>${hol ? `<span class="gc-ad">${esc(hol)}</span>` : ''}${run}</div>`;
}

export function monthGrid(m, esc) {
  const ds = days(m);
  const rows = ds.length / 7;
  return `<div class="gc-month" data-m="${m}" style="--rows:${rows}">${ds.map((d, i) => cell(d, m, Math.floor(i / 7), esc)).join('')}</div>`;
}

function mini(m, nav) {
  const ds = days(m);
  while (ds.length < 42) { const d = new Date(ds[ds.length - 1]); d.setDate(d.getDate() + 1); ds.push(d); }
  return `<div class="gc-mini" data-m="${m}"><div class="gc-mh"><b>${monthTitle(m)}</b><span class="gc-mnav">${nav}</span></div>
    <div class="gc-mg">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((l) => `<i>${l}</i>`).join('')}${ds.map((d) => `<span class="${d.getMonth() !== m ? 'gc-mo' : ''}${key(d) === key(TODAY) ? ' gc-mt' : ''}">${d.getDate()}</span>`).join('')}</div></div>`;
}

export function clientMarkup({ ico, logo, esc, brand }) {
  const btn = (name, cls = '') => `<span class="gc-ib ${cls}">${ico(name, 'gc-i')}</span>`;
  const cal = (name, color, cls = '') => `<div class="gc-cal ${cls}"><i class="gc-cb" style="--c:${color}">${ico('ms_check', 'gc-ck')}</i><span>${esc(name)}</span></div>`;
  return `<div class="gc-client">
    <header class="gc-top">
      ${btn('ms_menu', 'gc-menu')}<img class="gc-logo" src="${logo}" alt=""/><span class="gc-word">Calendar</span>
      <span class="gc-today-btn">Today</span>${btn('ms_chevron_left', 'gc-prev')}${btn('ms_chevron_right', 'gc-next')}
      <h1 class="gc-title">${monthTitle(9)}</h1>
      <span class="gc-tr">${btn('ms_search')}${btn('ms_help_outline')}${btn('ms_settings_outline')}
        <span class="gc-view">Month${ico('ms_arrow_drop_down', 'gc-i gc-dd')}</span>
        <span class="gc-seg"><span class="on">${ico('ms_calendar_month_outline', 'gc-i')}</span><span>${ico('ms_task_alt', 'gc-i')}</span></span>
        ${btn('ms_apps')}<i class="gc-av">S</i></span>
    </header>
    <aside class="gc-side">
      <span class="gc-create">${ico('ms_add', 'gc-i')}<b>Create</b>${ico('ms_arrow_drop_down', 'gc-i gc-dd')}</span>
      <div class="gc-minis">${VIEW_MONTHS.map((m) => mini(m, btn('ms_chevron_left', 'gc-sm') + btn('ms_chevron_right', 'gc-sm'))).join('')}</div>
      <div class="gc-people">${ico('ms_group_outline', 'gc-i')}<span>Search for people</span></div>
      <div class="gc-sec"><b>My calendars</b>${ico('ms_keyboard_arrow_up', 'gc-i')}</div>
      ${cal('Sam Rivera', COLORS.me)}${cal('Half Marathon Plan', COLORS.plan, 'gc-new')}${cal('Birthdays', COLORS.birthdays)}${cal('Tasks', COLORS.tasks)}
      <div class="gc-sec"><b>Other calendars</b><span class="gc-sec-r">${ico('ms_add', 'gc-i')}${ico('ms_keyboard_arrow_up', 'gc-i')}</span></div>
      ${cal('Holidays in United States', COLORS.holidays)}
    </aside>
    <aside class="gc-rail">${['keep_2020q4v3', 'tasks_2021', 'contacts_2022', 'maps_v2'].map((n) => `<span class="gc-ri"><img src="${brand(`gside-${n}.png`)}" alt=""/></span>`).join('')}<i class="gc-rdiv"></i><span class="gc-ri">${ico('ms_add', 'gc-i')}</span></aside>
    <main class="gc-main"><div class="gc-months">${VIEW_MONTHS.map((m) => monthGrid(m, esc)).join('')}</div></main>
  </div>`;
}

// the event details card for race day (the real popover's anatomy: the action row, colour square + title, the date
// line, then the description and calendar rows)
export function popoverMarkup({ ico, esc }) {
  const d = RACE.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  return `<div class="gc-pop">
    <div class="gc-pa">${['ms_edit_outline', 'ms_delete_outline', 'ms_mail_outline', 'ms_more_vert', 'ms_close'].map((n) => `<span class="gc-ib">${ico(n, 'gc-i')}</span>`).join('')}</div>
    <div class="gc-ph"><i class="gc-sq" style="background:${COLORS.plan}"></i><div><h2>${esc(RACE.title)}</h2><p>${esc(d)}</p></div></div>
    <div class="gc-pr">${ico('ms_subject', 'gc-i')}<span>13.1 mi. Go out at 8:40/mi, settle to 8:33. Goal 1:52:00.</span></div>
    <div class="gc-pr">${ico('ms_calendar_today_outline', 'gc-i')}<span>Half Marathon Plan</span></div>
  </div>`;
}

// Google's OAuth consent page as superbot's sign-in sheet shows it (the browser frame, then accounts.google.com's
// "Sign in with Google" page, single column at this width): the account chip, the one scope superbot asks for,
// calendar.app.created, worded as Google words it (developers.google.com OAuth 2.0 Scopes, 2026-10-05), the trust
// paragraph, Cancel and Continue.
export function consentMarkup({ ico, esc, brand }) {
  return `<div class="go-web">
    <div class="cn-bar">${ico('ms_lock', 'cn-lock')}<span>accounts.google.com</span></div>
    <div class="go-page">
      <div class="go-top"><img src="${brand('google-g.svg')}" alt=""/><span>Sign in with Google</span></div>
      <h2 class="go-h">superbot wants to access your Google Account</h2>
      <span class="go-acct"><i>S</i>sam.rivera@gmail.com${ico('ms_keyboard_arrow_down', 'go-i')}</span>
      <p class="go-will">This will allow <b>superbot</b> to:</p>
      <div class="go-sc">${ico('ms_calendar_today_outline', 'go-i')}<span>${esc('Make secondary Google calendars, and see, create, change, and delete events on them')}</span>${ico('ms_info_outline', 'go-i')}</div>
      <p class="go-trust"><b>Make sure you trust superbot</b>You may be sharing sensitive info with this site or app. You can always see or remove access in your Google Account.</p>
      <div class="go-btns"><span class="go-cancel">Cancel</span><span class="go-cont">Continue</span></div>
    </div>
  </div>`;
}
