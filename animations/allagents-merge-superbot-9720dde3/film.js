// C "Four windows": four agents hit their limits and fold into one; the plans pack into its key; chat routing; the steps.
import { routeChat } from './scenes-route.js';
import { merge, steps, settingsKey } from './scenes-agents.js';
import { PLANS } from './core.js';
import { end } from './scenes-end.js';

export default {
  scenes: [
    { make: () => merge({ mode: 'limits', caps: ['Four agents. Four usage limits.', 'One agent. Every model you pay for.'] }) },
    { make: () => settingsKey({ plans: PLANS, caps: ['Every plan you pay for.', 'One key. Drop-in base URL.'] }) },
    { make: () => routeChat({
      caps: ['Ask anything. It routes the request.', 'Hard parts on Opus. Bulk work on DeepSeek.'],
      reqs: [
        { q: 'Plan the move from REST to GraphQL', need: 'hard reasoning', fit: [0.93, 0.6, 0.44], m: 'opus', a: 'Three phases. Start with read-only queries so nothing breaks for clients.' },
        { q: 'Read the 900 page API spec and find breaking changes', need: 'long context', fit: [0.63, 0.96, 0.5], m: 'gemini', a: 'Found 23 breaking changes, listed by endpoint with the fix for each.' },
        { q: 'Rename userId to accountId across the repo', need: 'bulk work', fit: [0.45, 0.55, 0.94], m: 'deepseek', a: 'Renamed in 2,031 places across 412 files. Tests still pass.' },
      ],
    }), tr: 'zoom', ov: 0.55 },
    { make: () => steps({
      mode: 'list',
      task: 'Migrate the API to GraphQL and update the clients',
      caps: ['Then it splits the job and hands out each step.', 'Paid by the plans you already have.'],
      list: [
        { t: 'Map every REST endpoint', m: 'gemini' },
        { t: 'Design the schema', m: 'opus' },
        { t: 'Write the resolvers', m: 'gpt' },
        { t: 'Update 38 client calls', m: 'deepseek' },
        { t: 'Review the migration', m: 'opus' },
      ],
      summary: '<b>Migrated.</b> 5 steps, 4 models, 1 key, on plans you already pay for.',
    }), tr: 'zoom', ov: 0.55 },
    { make: () => end(), tr: 'zoom', ov: 0.55 },
  ],
};
