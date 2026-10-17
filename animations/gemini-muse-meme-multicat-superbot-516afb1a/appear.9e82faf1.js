// The 10-image variant's appear style: how the ten generations arrive. 'default' keeps the grid whose tiles resolve out of a
// blur, one after another; every other style is a recreation of one platform's real image-generation UI, a module in
// scenes/tabs-assets/beats/reveals/ (index.9e82faf1.js lists them; the beat, gemini.9b47fc30.js, shows the chosen
// module's block in place of the grid). Read from ?appear= so a frozen frame (?t=) keeps it; the sub-selector under the
// variant selector (variant-select.9e82faf1.js), shown only on the '10' variant, changes it live, without a reload, and the
// beat reads it every frame. Kept apart from variant.9e82faf1.js, which other variants extend.
import { REVEALS } from './scenes/tabs-assets/beats/reveals/index.9e82faf1.js?v=2';

const KEY = 'appear';
export const APPEARS = [{ id: 'default', label: 'Default' }, ...REVEALS.map(({ id, label }) => ({ id, label }))];
const valid = (v) => APPEARS.some((x) => x.id === v);
const asked = new URLSearchParams(location.search).get(KEY);
let current = valid(asked) ? asked : APPEARS[0].id;

export const appear = () => current;

export function setAppear(v) {
  if (!valid(v) || v === current) return;
  current = v;
  const u = new URL(location.href);
  if (v === APPEARS[0].id) u.searchParams.delete(KEY); else u.searchParams.set(KEY, v);
  history.replaceState(null, '', u);
  dispatchEvent(new CustomEvent('appearchange', { detail: v }));
}
