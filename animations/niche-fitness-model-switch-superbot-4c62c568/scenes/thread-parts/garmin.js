// Garmin's partner consent page in a Chrome popup window: the OAuth 2.0 PKCE authorize step
// (connect.garmin.com/oauth2Confirm) with Garmin's current data-sharing screen, its copy as Garmin words it for any
// partner app ("Control the information you share." / "Data shared from Garmin Connect to the X app" / "Data shared
// from the X app to Garmin Connect", per-type toggles, the partner's privacy policy, Save and Cancel).
// Activities arrive on (superbot reads runs); Workouts start off and the cursor turns them on, because that is the
// permission that lets superbot put the plan on the calendar. Open Sans, Garmin's web face; Garmin blue #11a9ed.
import { seg, lerp } from '../../lib.js';
import { standard } from './ease.js';
import { h, ms } from './feed.js';

export function buildPopup() {
  const tog = (on) => `<span class="gc-tog${on ? ' on' : ''}"><i class="tr"></i><i class="fl"></i><i class="kn"></i></span>`;
  const el = h(`<div class="gc-pop">
    <div class="mac-bar"><i class="tl r"></i><i class="tl y"></i><i class="tl g"></i><span>Garmin Connect</span></div>
    <div class="url">${ms('lock')}<span><b>connect.garmin.com</b>/oauth2Confirm?client_id=superbot</span></div>
    <div class="gc-top"><img src="brand/garmin-logo.svg" alt="Garmin"></div>
    <div class="gc-body">
      <div class="gc-app"><img src="brand/tile.svg" alt=""></div>
      <h1>Control the information you share.</h1>
      <p>You get to decide what information you share with superbot, as well as what information superbot shares
        with your Garmin Connect account. You can change these selections at any time in your Garmin Connect settings.</p>
      <div class="gc-sec">Data shared from Garmin Connect to the superbot app</div>
      <div class="gc-row"><span>Activities</span>${tog(true)}</div>
      <div class="gc-sec">Data shared from the superbot app to Garmin Connect</div>
      <div class="gc-row"><span>Workouts</span>${tog(false)}</div>
      <div class="gc-pp">superbot Privacy Policy</div>
      <div class="gc-btns"><span class="gc-cancel">Cancel</span><span class="gc-save">Save</span></div>
    </div>
  </div>`);
  const t2 = el.querySelectorAll('.gc-tog')[1];
  return { el, tog: t2, fill: t2.querySelector('.fl'), knob: t2.querySelector('.kn'), save: el.querySelector('.gc-save') };
}

/** the Workouts toggle: track fills green and the knob slides on the standard curve, the knob squashes a touch
    under the press (iOS-style switch feel), a soft halo marks the tap */
export function paintToggle(p, t, at, pressAmt) {
  const f = standard(seg(t, at, at + 0.26));
  p.fill.style.opacity = f.toFixed(3);
  const squash = 1 + 0.18 * pressAmt;
  p.knob.style.transform = `translateX(${lerp(0, 20, f).toFixed(2)}px) scaleX(${squash.toFixed(3)})`;
  p.tog.style.setProperty('--halo', (Math.sin(Math.PI * seg(t, at - 0.05, at + 0.5)) * 0.18).toFixed(3));
}
