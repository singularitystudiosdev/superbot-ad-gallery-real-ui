// UI furniture glyphs for the reads and Strava beats, bodies verbatim from the Iconify API (api.iconify.design),
// fetched 2026-10-03: Framework7 Icons (f7, 5.0.5, MIT, 56 grid: the check) and Material Symbols (material-symbols,
// Apache-2.0, 24 grid: search, bell, link, the run glyph on every workout chip, the race-day flag).
// brand/CREDITS.txt lists them. Each export is an inline <svg> string taking currentColor.
const svg = (vb, body, cls) => '<svg class="' + cls + '" viewBox="0 0 ' + vb + ' ' + vb + '" aria-hidden="true">' + body + '</svg>';
const B = {
  f7_checkmark_alt: [56, "<path fill=\"currentColor\" d=\"m45.646 14.646l.708.708a2 2 0 0 1 0 2.828l-22.94 22.94a2 2 0 0 1-2.828 0l-9.94-9.94a2 2 0 0 1 0-2.828l.708-.708a2 2 0 0 1 2.828 0l6.404 6.404a2 2 0 0 0 2.828 0l19.404-19.404a2 2 0 0 1 2.828 0\"/>"],
  ms_search: [24, "<path fill=\"currentColor\" d=\"m19.6 21l-6.3-6.3q-.75.6-1.725.95T9.5 16q-2.725 0-4.612-1.888T3 9.5t1.888-4.612T9.5 3t4.613 1.888T16 9.5q0 1.1-.35 2.075T14.7 13.3l6.3 6.3zM9.5 14q1.875 0 3.188-1.312T14 9.5t-1.312-3.187T9.5 5T6.313 6.313T5 9.5t1.313 3.188T9.5 14\"/>"],
  ms_notifications_outline: [24, "<path fill=\"currentColor\" d=\"M4 19v-2h2v-7q0-2.075 1.25-3.687T10.5 4.2v-.7q0-.625.438-1.062T12 2t1.063.438T13.5 3.5v.7q2 .5 3.25 2.113T18 10v7h2v2zm8 3q-.825 0-1.412-.587T10 20h4q0 .825-.587 1.413T12 22m-4-5h8v-7q0-1.65-1.175-2.825T12 6T9.175 7.175T8 10z\"/>"],
  ms_link_rounded: [24, "<path fill=\"currentColor\" d=\"M7 17q-2.075 0-3.537-1.463T2 12t1.463-3.537T7 7h3q.425 0 .713.288T11 8t-.288.713T10 9H7q-1.25 0-2.125.875T4 12t.875 2.125T7 15h3q.425 0 .713.288T11 16t-.288.713T10 17zm2-4q-.425 0-.712-.288T8 12t.288-.712T9 11h6q.425 0 .713.288T16 12t-.288.713T15 13zm5 4q-.425 0-.712-.288T13 16t.288-.712T14 15h3q1.25 0 2.125-.875T20 12t-.875-2.125T17 9h-3q-.425 0-.712-.288T13 8t.288-.712T14 7h3q2.075 0 3.538 1.463T22 12t-1.463 3.538T17 17z\"/>"],
  ms_directions_run: [24, "<path fill=\"currentColor\" d=\"M13 23v-6l-2.1-2l-1 4.4L3 18l.4-2l4.8 1l1.6-8.1l-1.8.7V13H6V8.3l3.95-1.7q.875-.375 1.288-.487T12 6q.525 0 .975.275T13.7 7l1 1.6q.65 1.05 1.763 1.725T19 11v2q-1.65 0-3.088-.687T13.5 10.5l-.6 3l2.1 2V23zm-.913-18.088Q11.5 4.325 11.5 3.5t.588-1.412T13.5 1.5t1.413.588T15.5 3.5t-.587 1.413T13.5 5.5t-1.412-.587\"/>"],
  ms_flag_rounded: [24, "<path fill=\"currentColor\" d=\"M7 14v6q0 .425-.288.713T6 21t-.712-.288T5 20V5q0-.425.288-.712T6 4h7.175q.35 0 .625.225t.35.575L14.4 6H19q.425 0 .713.288T20 7v8q0 .425-.288.713T19 16h-5.175q-.35 0-.625-.225t-.35-.575L12.6 14z\"/>"],
};
export const ico = (name, cls = 'ui-i') => svg(B[name][0], B[name][1], cls);
