// Garmin Connect on iPhone, Calendar tab, dark theme, built to the 2025 app (Final Surge's and Garmin's own
// screenshots): bell left and kebab right in Garmin blue, "Calendar" title, "< October 2026 >" month switcher,
// a Monday-first grid of dark rounded day tiles with the day number top-left, today outlined in blue, scheduled
// workouts as orange bars, the selected day's workouts listed under the grid, and the five-tab bar
// (Home / Activities / Challenges / Calendar / More). The plan's workouts arrive as superbot posts them.
import { esc } from '../../lib.js';
import { h, ms } from './feed.js';

export function buildPhone(month, runDays, card) {
  const cells = [];
  for (let i = 0; i < 35; i++) {
    const inMonth = i >= month.lead && i < month.lead + month.days;
    const n = inMonth ? i - month.lead + 1 : i < month.lead ? month.first + i : i - month.lead - month.days + 1;
    const dow = (i + 1) % 7; // column 0 is Monday -> Date.getDay 1
    const run = i >= month.lead + month.select - 1 && runDays.includes(dow);
    cells.push({ n, inMonth, run, today: inMonth && n === month.today, sel: inMonth && n === month.select });
  }
  const tab = (icon, label, on) => `<span class="tb${on ? ' on' : ''}">${ms(icon)}<i>${label}</i></span>`;
  const el = h(`<div class="ph">
    <div class="ph-scr">
      <div class="ph-sb"><b>9:41</b><span class="isl"></span><span class="sbi">${ms('signal-cellular-alt')}${ms('wifi')}${ms('battery-full-alt', 'bat')}</span></div>
      <div class="ph-nav">${ms('notifications-outline')}<b>Calendar</b>${ms('more-vert')}</div>
      <div class="ph-mo">${ms('chevron-left')}<b>${esc(month.title)}</b>${ms('chevron-right')}</div>
      <div class="ph-wd">${['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => `<i>${d}</i>`).join('')}</div>
      <div class="ph-grid">${cells.map((c) => `<span class="c${c.inMonth ? '' : ' dim'}"><em>${c.n}</em>${c.run ? '<i class="bar"></i>' : ''}</span>`).join('')}<i class="ring"></i></div>
      <div class="ph-day">
        <div class="dh">${esc(card.head)}</div>
        <div class="dc"><span class="ico">${ms('directions-run')}</span><span class="nm"><b>${esc(card.name)}</b><i>${esc(card.meta)}</i></span><span class="tm">${esc(card.time)}</span></div>
      </div>
      <div class="ph-tabs">${tab('home-outline', 'Home')}${tab('directions-run', 'Activities')}${tab('trophy-outline', 'Challenges')}${tab('calendar-month', 'Calendar', true)}${tab('more-horiz', 'More')}</div>
      <i class="ph-home"></i>
    </div>
  </div>`);
  const cellEls = [...el.querySelectorAll('.ph-grid .c')];
  const bars = cellEls.map((c, i) => ({ i, bar: c.querySelector('.bar') })).filter((b) => b.bar);
  return {
    el, cells, cellEls, bars, ring: el.querySelector('.ring'), day: el.querySelector('.ph-day'),
    todayIdx: cells.findIndex((c) => c.today), selIdx: cells.findIndex((c) => c.sel),
  };
}
