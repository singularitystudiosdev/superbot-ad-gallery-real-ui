// B "Router first": a request crosses the switchboard, the plan deck flips into the key, the agents fold into one, the pipeline.
import { keyStack } from './scenes-key.js';
import { rails } from './scenes-route.js';
import { merge, steps } from './scenes-agents.js';
import { end } from './scenes-end.js';

export default {
  scenes: [
    { make: () => rails({
      caps: ['One request. Which model should take it?', 'Superbot picks the best one, every time.'],
      reqs: [
        { q: 'Why does checkout double charge on retry?', need: 'hard reasoning', m: 'opus' },
        { q: 'Watch this 40 minute demo and list every bug', need: 'long context', m: 'gemini' },
        { q: 'Translate 1,200 UI strings to Spanish', need: 'bulk work', m: 'deepseek' },
      ],
    }) },
    { make: () => keyStack({ caps: ['It runs on the plans you already pay for.', 'All of them, in one key.'] }), tr: 'pan', ov: 0.65 },
    { make: () => merge({ mode: 'fan', caps: ['The agents you juggle today.', 'One agent now.'] }), tr: 'pan', ov: 0.65 },
    { make: () => steps({
      mode: 'pipeline',
      task: 'Add dark mode to the dashboard',
      caps: ['Every subtask goes to the best model for it.', 'Best model per step. Not the priciest for all.'],
      list: [
        { t: 'Plan the theme tokens', m: 'opus' },
        { t: 'Scan 220 components for colors', m: 'gemini' },
        { t: 'Rewrite the styles', m: 'gpt' },
        { t: 'Snapshot test every screen', m: 'deepseek' },
        { t: 'Review and ship', m: 'opus' },
      ],
      summary: '<b>Done.</b> 5 subtasks, 4 models, 1 key.',
    }) },
    { make: () => end(), tr: 'zoom', ov: 0.55 },
  ],
};
