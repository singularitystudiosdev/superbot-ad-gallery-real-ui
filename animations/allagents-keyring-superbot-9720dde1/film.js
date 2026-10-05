// A "One key": plans pack into one key, the .env swap, chat routing, four agents merge, the steps.
import { keyRow, envSwap } from './scenes-key.js';
import { routeChat } from './scenes-route.js';
import { merge, steps } from './scenes-agents.js';
import { end } from './scenes-end.js';

export default {
  scenes: [
    { make: () => keyRow({ caps: ['Every AI plan you already pay for.', 'Packed into one key.'] }) },
    { make: () => envSwap({ caps: ['Drop it in where your old keys were.', 'One base URL. Same code.'] }), tr: 'push', ov: 0.6 },
    { make: () => routeChat({
      caps: ['Every request goes to the model that fits it.', 'Not Opus prices for every job.'],
      reqs: [
        { q: 'Find the race condition in our payments queue', need: 'hard reasoning', fit: [0.94, 0.62, 0.41], m: 'opus', a: 'Two workers can claim the same job before the lock is written. Here is the fix.' },
        { q: 'Read 300 support tickets and group them by bug', need: 'long context', fit: [0.66, 0.95, 0.52], m: 'gemini', a: 'Grouped into 14 bugs, sorted by how many customers hit each one.' },
        { q: 'Write docstrings for all 412 functions', need: 'bulk work', fit: [0.48, 0.57, 0.93], m: 'deepseek', a: 'Writing docstrings across 38 files. The first 120 are done.' },
      ],
    }), tr: 'push', ov: 0.6 },
    { make: () => merge({ mode: 'grid', caps: ['Claude Code. Codex. Gemini CLI. Cursor.', 'Now they are one agent.'] }), tr: 'push', ov: 0.6 },
    { make: () => steps({
      mode: 'list',
      task: 'Add a checkout page to the store and ship it',
      caps: ['Each step goes to the model that fits it.', 'Opus where it counts. Cheaper everywhere else.'],
      list: [
        { t: 'Plan the checkout flow', m: 'opus' },
        { t: 'Read all 140 files in /src', m: 'gemini' },
        { t: 'Write the cart and payment components', m: 'gpt' },
        { t: 'Generate 60 unit tests', m: 'deepseek' },
        { t: 'Review the diff and open the PR', m: 'opus' },
      ],
      summary: '<b>Shipped.</b> 5 steps, 4 models, 1 key, billed to plans you already pay for.',
    }) },
    { make: () => end(), tr: 'zoom', ov: 0.55 },
  ],
};
