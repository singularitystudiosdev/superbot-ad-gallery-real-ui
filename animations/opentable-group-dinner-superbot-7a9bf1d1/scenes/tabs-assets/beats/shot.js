// The attached screenshot: the "Fri crew" group chat in iOS Messages (light), drawn at phone size (260 x 540 design
// px) and scaled by its holder: the composer thumbnail, the sent message and Gemini's card all use this one markup.
import { GROUP, PEOPLE, SHOT_TIME } from './dinner.js';

const BARS = '<svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="5" y="5.5" width="3" height="6.5" rx=".8"/><rect x="10" y="3" width="3" height="9" rx=".8"/><rect x="15" y="0" width="3" height="12" rx=".8"/></svg>';
const WIFI = '<svg viewBox="0 0 16 12"><path d="M8 11.6 5.6 9.1a3.4 3.4 0 0 1 4.8 0Z"/><path d="M3.4 6.9a6.5 6.5 0 0 1 9.2 0l-1.3 1.3a4.6 4.6 0 0 0-6.6 0Z"/><path d="M1.1 4.6a9.8 9.8 0 0 1 13.8 0l-1.3 1.3a7.9 7.9 0 0 0-11.2 0Z"/></svg>';
const BATT = '<svg viewBox="0 0 27 13"><rect x=".5" y=".5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="16" height="9" rx="2.2"/><path d="M25 4.5v4c.8-.3 1.4-1.1 1.4-2s-.6-1.7-1.4-2Z" opacity=".45"/></svg>';
const VIDEO = '<svg viewBox="0 0 24 16"><rect x="1" y="2" width="15" height="12" rx="3.2"/><path d="M17.5 6.4 22.4 3.6c.4-.2.8 0 .8.5v7.8c0 .5-.4.7-.8.5l-4.9-2.8Z"/></svg>';

export function shotHTML(cls = '') {
  const av = (p) => `<span class="fc-av">${p.init}</span>`;
  return `<div class="fc-ph ${cls}">
    <div class="fc-sb"><b>${SHOT_TIME.clock}</b><span class="fc-sbi">${BARS}${WIFI}${BATT}</span></div>
    <div class="fc-nav">
      <span class="fc-back"><svg viewBox="0 0 12 20"><path d="M10 2 2 10l8 8"/></svg><em>12</em></span>
      <span class="fc-grp"><span class="fc-av4">${PEOPLE.map(av).join('')}</span><b>${GROUP}<svg viewBox="0 0 8 12"><path d="M2 1.5 6.5 6 2 10.5"/></svg></b></span>
      <span class="fc-vid">${VIDEO}</span>
    </div>
    <div class="fc-body">
      <div class="fc-ts"><b>${SHOT_TIME.stamp.split(' ')[0]}</b> ${SHOT_TIME.stamp.split(' ').slice(1).join(' ')}</div>
      ${PEOPLE.map((p, i) => `<div class="fc-msg" data-i="${i}"><small>${p.name}</small><div class="fc-row">${av(p)}<span class="fc-bub">${p.msg.replace('$', '&#36;')}</span></div></div>`).join('')}
    </div>
    <div class="fc-in"><span class="fc-plus">+</span><span class="fc-field">iMessage</span></div>
  </div>`;
}
