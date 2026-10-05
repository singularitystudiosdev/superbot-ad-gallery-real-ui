// Step 5, Claude Opus 5.5 in Claude Code: the edit, written as code. Claude Code's own transcript (dark terminal,
// ⏺ tool bullets, ⎿ results, the Write preview with line numbers and "… +N lines (ctrl+r to expand)"). superbot's
// hand-off is the prompt: the storyboard, the mascot clips and the bed from the earlier steps. Opus writes a Remotion
// composition (real Remotion 4 API: AbsoluteFill, Audio, Sequence, staticFile; the clips play through OffthreadVideo in
// the scene files) and typechecks it.
// Titles, UI and the halftone look are drawn here in code, which is the job a coding model is the specialist for.
import { seg, clamp, outExpo, inOutSine, rise } from '../../../lib.js';
import { shimmer } from './media.js';

const ASK = 'cut the launch film in Remotion from these assets';
const SAY = 'Five scenes on the 120 BPM grid, the two Hailuo clips under a halftone pass, titles and UI in code.';
const CODE = [
  ['k', "import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';"],
  ['k', "import {Hook, Products, Store, Checkout, Close} from './scenes';"],
  ['', ''],
  ['k', 'export const LaunchFilm: React.FC = () => ('],
  ['j', "  <AbsoluteFill style={{background: '#fff'}}>"],
  ['j', "    <Audio src={staticFile('launch-bed.mp3')} />"],
];
const hl = (s) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/('[^']*')/g, '<span class="s">$1</span>')
  .replace(/\b(import|from|export|const)\b/g, '<span class="kw">$1</span>')
  .replace(/(&lt;\/?)([A-Z][A-Za-z]*)/g, '$1<span class="tg">$2</span>');

export default {
  id: 'opus', app: 'opus', model: 'Claude Opus 5.5', logo: 'claude-logo.svg', dur: 3.8,
  summary: 'Remotion project, 5 scenes, typecheck clean',

  build({ brand, el, esc }) {
    const n = el(`<div class="cc">
  <div class="cc-hd"><span class="cc-tile"><img src="${brand('claude-logo.svg')}" alt=""/></span><b>Claude Code</b><span class="cc-model">Opus 5.5</span><span class="cc-path">~/pocketsflow-launch</span></div>
  <div class="cc-bd">
    <div class="cc-ln cc-ask"><i>&gt;</i>${esc(ASK)}</div>
    <div class="cc-ln"><i class="w">⏺</i><span class="cc-txt"><span class="cc-say"></span><span class="cc-ghost">${esc(SAY)}</span></span></div>
    <div class="cc-ln"><i class="g">⏺</i><span><b>Write</b>(src/LaunchFilm.tsx)</span></div>
    <div class="cc-ln cc-r"><i>⎿</i>Wrote 86 lines to src/LaunchFilm.tsx</div>
    ${CODE.map(([, src], i) => `<div class="cc-code"><u>${i + 1}</u>${hl(src)}</div>`).join('')}
    <div class="cc-ln cc-r cc-more"><i></i>… +80 lines (ctrl+r to expand)</div>
    <div class="cc-ln"><i class="g">⏺</i><span><b>Bash</b>(npx tsc --noEmit)</span></div>
    <div class="cc-ln cc-r"><i>⎿</i>(No content)</div>
    <div class="cc-st"><i>✻</i><span class="cc-sh">Cutting the film…</span><small>(esc to interrupt)</small></div>
  </div>
</div>`);
    const lines = [...n.querySelectorAll('.cc-ln, .cc-code')];
    const say = n.querySelector('.cc-say'), ghost = n.querySelector('.cc-ghost'), st = n.querySelector('.cc-st'), sh = n.querySelector('.cc-sh'), star = n.querySelector('.cc-st i');
    // when each line lands: the ask, Opus' line, Write + result, the preview rows, the fold line, Bash + result
    const AT = [0.12, 0.35, 0.82, 0.92, ...CODE.map((_, i) => 1.02 + i * 0.06), 1.42, 1.62, 1.82];
    let lastN = -1;
    return {
      el: n,
      render(lt) {
        if (lt < -0.2 || lt > 5) return;
        lines.forEach((ln, i) => rise(ln, outExpo(seg(lt, AT[i], AT[i] + 0.45)), 6));
        const k = Math.round(SAY.length * seg(lt, 0.38, 0.8));
        if (k !== lastN) { say.textContent = SAY.slice(0, k); ghost.textContent = SAY.slice(k); lastN = k; }
        sh.style.setProperty('--sh', shimmer(lt));
        star.style.transform = `rotate(${(lt * 90).toFixed(1)}deg)`;
        st.style.opacity = (outExpo(seg(lt, 0.3, 0.7)) * (1 - inOutSine(seg(lt, 2.4, 2.75)))).toFixed(3);
      },
    };
  },
};
