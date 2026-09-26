/* ad.js - config for the "Home Assistant + Google Home + Alexa + SmartThings + Hue, ChatGPT vs Superbot" spot
   (variant A).
   Kit contract: animations/just-works-kit-42aac446 (engine.js + kit.css).
   Beats: ChatGPT cannot sign in to Home Assistant, Google Home, Alexa, SmartThings or Philips Hue or see the
   devices, so it cannot build the inventory -> the "superbot can do it!" popup is clicked -> superbot signs in
   to all five apps read-only, pulls 214 device entries, merges 87 duplicate listings, sorts 127 unique devices
   into 9 rooms and flags 6 offline, 9 low battery, 11 behind on firmware and 4 automations that have not fired
   in a week. It changes nothing in Home Assistant, Google Home, Alexa, SmartThings or Philips Hue. Every figure
   below is read from data.js, so the hub, the steps and the page agree.
   This folder is a copy of the superbot-only variant (just-works-home-audit-superbot-42aac446): every asset, the
   site and the config below the gpt block are that spot's, unchanged, so the two variants share one page and one
   hub. */

import { accounts, counts } from './data.js';

const acc = (id) => accounts.find((a) => a.id === id);
const src = (id, name) => ({ id, name, logo: acc(id).logo, count: acc(id).pulled, what: `${acc(id).what} pulled` });

export default {
  id: 'just-works-home-audit-gpt-superbot-42aac446',
  title: 'Home Assistant + Google Home + Alexa + SmartThings + Hue, ChatGPT vs Superbot',
  // slug stays B's: it is the site's CSS scope class (.site-home-audit), shared by both variants
  slug: 'home-audit',

  ask: 'Sign into my Home Assistant, Google Home, Alexa, SmartThings and Philips Hue accounts, pull every device into one room-by-room inventory, and flag which ones are offline, low on battery, behind on firmware, or stuck in an automation that hasn\'t fired in a week.',

  // the ChatGPT beat: it tries the Home Assistant sign-in page, that load fails, and the refusal explains why
  // the whole ask is beyond it. No cfg.dur.gpt on purpose: the beat lays itself out so the popup's click fits.
  gpt: {
    attempt: 'Opening my.home-assistant.io',
    reply:
      "I can't sign in to your Home Assistant, Google Home, Alexa, SmartThings or Philips Hue accounts, so I can't see your devices, which ones are offline, their battery levels, their firmware, or when your automations last ran.\n\nWhat I can do instead: give you a checklist to go through each app by hand.",
  },
  card: null,

  // the opt-in kit popup, clicked on its chat button, which hands the spot to the hub
  popup: { text: 'superbot can do it!', button: 'chat' },

  // what superbot read, with the counts that tick up in the chat (78 + 41 + 33 + 29 + 33 = 214)
  sources: [
    src('ha', 'Home Assistant entities'),
    src('google', 'Google Home devices'),
    src('alexa', 'Alexa devices'),
    src('smartthings', 'SmartThings devices'),
    src('hue', 'Philips Hue lights'),
  ],

  steps: [
    `Signed in to all ${counts.accounts} apps, read-only`,
    `Pulled ${counts.pulled} entries and merged ${counts.dupes} duplicates`,
    `Sorted ${counts.devices} devices into ${counts.rooms} rooms`,
    `Flagged ${counts.offline} offline, ${counts.battery} low battery, ${counts.firmware} firmware behind, ${counts.stale} stale automations`,
  ],

  found: { n: counts.devices, one: 'device', many: 'devices', label: `unique devices, ${counts.rooms} rooms` },

  build: {
    file: 'home-audit',
    url: 'superbot.app/p/home-audit',
    tabTitle: `Home inventory · ${counts.devices} devices`,
    favicon: './brand/app.svg',
  },

  // f in 0..1 of the browser scene -> scroll target. Monotonic. Four beats, each with a hold:
  // 1. 0.13 and 0.3 both name the hero, so the page holds on the sync card while render(p) reads the five
  //    apps (p 0 to 0.15, see site.js SYNC_A/SYNC_B) and merges the duplicates (214 pulled, 87 a device
  //    another app already listed, 127 unique, p 0.165 to 0.285, MERGE_A/MERGE_B); the finished card holds ~0.85 s.
  // 2. 0.355 and 0.52 both name the flags strip, whose four counters ease in as it lands (p 0.36 to 0.44,
  //    see GROW_A/GROW_B): settled at 6 / 9 / 11 / 4 from f 0.38, then held about 1.3 s with the cursor on
  //    the Offline tile before the scroll leaves.
  // 3. 0.575 and 0.66 hold on the room grid; its nine cards settle in as it arrives (ROOM_A/ROOM_B) and the
  //    cursor rests on the Garage, the room with the worst automation.
  // 4. 0.7 and 0.745 hold on the device list, the window the click on the Automations tab is timed against.
  //    The click swaps the automations panel into the same slot, 0.78 settles on it and the cursor rests
  //    on "Garage door closes at 10 PM", the automation that has not fired in 16 days, to the end.
  scroll: [
    [0, 0],
    [0.13, '.hm-hero'],
    [0.3, '.hm-hero'],
    [0.355, '.hm-flags'],
    [0.52, '.hm-flags'],
    [0.575, '.hm-rooms'],
    [0.66, '.hm-rooms'],
    [0.7, '.hm-panels'],
    [0.745, '.hm-panels'],
    [0.78, '.hm-panel--2'],
  ],

  // the cursor points at each beat: the merge counters, the offline tile, the garage, then the stale automation
  hover: [
    [0.1, 0.29, '.hm-merge'],
    [0.39, 0.52, '.hm-flag--offline'],
    [0.59, 0.66, '.hm-room--garage'],
    [0.79, 0.97, '.hm-arow--garage-close'],
  ],

  // the cursor clicks the Automations tab in the sticky top bar; site.css swaps the panel on that class
  click: [[0.74, '.hm-tab--2']],

  end: { text: 'Superbot just works' },

  // same lengths as the series' other hub-first spots: hub + browser + end lands near 25 s
  dur: { hub: 11, browser: 10.5 },
};
