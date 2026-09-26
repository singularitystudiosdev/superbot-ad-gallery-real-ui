/* data.js - the numbers behind superbot.app/p/home-audit, "Home inventory".
   One read-only sync of five smart-home apps (Home Assistant, Google Home, Alexa, SmartThings, Philips Hue)
   on Sat Sep 26 at 9:12 AM: 214 device entries pulled, 87 of them a device another app already listed
   (every Hue bulb shows up in Hue, Home Assistant, Google Home and Alexa), leaving 127 unique devices sorted
   into 9 rooms. Then four checks: 6 devices offline, 9 on a battery under 20%, 11 behind on firmware and 4
   automations that have not fired in 7 days or more. Nothing is edited, updated or deleted in any account:
   Superbot reads, it does not touch.
   The household, the device list and the automations are invented for the spot; the product names are real
   products. Every figure the page, the hub and the steps print is derived here, so they never disagree:
   the flag totals are counted from the flagged device list, the room flag chips from the same list, and the
   26 flagged devices (6 + 9 + 11) are 26 different devices, so 101 of the 127 need nothing. */

const n0 = (n) => Number(n).toLocaleString('en-US');
export { n0 };

export const meta = {
  user: 'dana.okafor',
  home: 'The Okafor house',
  city: 'Portland, Oregon',
  day: 'Sat, Sep 26',
  synced: '9:12 AM',
  // the clock the top bar prints: the sync starts at 9:11:38 AM and lands at 9:12:12 AM, 34 s in
  syncStart: 9 * 3600 + 11 * 60 + 38,
  syncSecs: 34,
  resync: 'Every Saturday, 9:00 AM',
  staleDays: 7,
  lowBattery: 20,
};

/* the five apps the devices came out of: what each one listed, and what survived the merge.
   Hue is the home of every Hue device, so the 30 Hue lights and sensors Home Assistant also lists, the 23
   Google Home entries and the 21 Alexa entries that point at a device another app already owns, and the 13
   SmartThings entries that mirror a Home Assistant device, all merge into the one device they are. */
export const accounts = [
  { id: 'ha', name: 'Home Assistant', short: 'Home Assistant', what: 'entities', handle: 'okafor-home.local', logo: './brand/homeassistant.svg', pulled: 78, kept: 48 },
  { id: 'google', name: 'Google Home', short: 'Google', what: 'devices', handle: 'dana.okafor@gmail.com', logo: './brand/googlehome.svg', pulled: 41, kept: 18 },
  { id: 'alexa', name: 'Alexa', short: 'Alexa', what: 'devices', handle: 'Dana’s Alexa', logo: './brand/alexa.svg', pulled: 33, kept: 12 },
  { id: 'smartthings', name: 'SmartThings', short: 'SmartThings', what: 'devices', handle: 'Okafor Home', logo: './brand/smartthings.svg', pulled: 29, kept: 16 },
  { id: 'hue', name: 'Philips Hue', short: 'Hue', what: 'lights', handle: 'Hue Bridge, Hallway', logo: './brand/hue.svg', pulled: 33, kept: 33 },
];

const PULLED = accounts.reduce((a, s) => a + s.pulled, 0);          // 214
const DEVICES = accounts.reduce((a, s) => a + s.kept, 0);           // 127
const DUPES = PULLED - DEVICES;                                     // 87

/* the 9 rooms: [key, name, icon, devices, apps the devices came from, what is in it] */
const ROOMS = [
  ['living', 'Living room', 'sofa', 22, ['hue', 'google', 'alexa', 'ha'], 'Hue Play bars, Chromecast, Nest Wifi point'],
  ['kitchen', 'Kitchen', 'cooking-pot', 18, ['google', 'alexa', 'ha', 'hue'], 'Nest Hub, Echo Show 8, leak sensors'],
  ['primary', 'Primary bedroom', 'bed-double', 14, ['hue', 'alexa', 'ha'], 'Echo Dot, window sensors, Hue lamps'],
  ['kids', 'Kids room', 'baby', 11, ['hue', 'alexa', 'google'], 'Night light, Echo Dot, Hue dimmer'],
  ['office', 'Office', 'monitor', 15, ['ha', 'smartthings', 'hue'], 'SmartThings Hub v3, SkyConnect, Hue Go'],
  ['hallway', 'Hallway', 'door-open', 12, ['hue', 'google', 'ha'], 'Hue Bridge, Nest Thermostat, motion'],
  ['garage', 'Garage', 'warehouse', 13, ['smartthings', 'ha'], 'Meross opener, tilt and door sensors'],
  ['porch', 'Porch', 'lamp', 9, ['smartthings', 'alexa', 'hue'], 'Yale lock, Ring doorbell, Hue Lily'],
  ['backyard', 'Backyard', 'trees', 13, ['smartthings', 'alexa', 'hue', 'ha'], 'Ring Spotlight Cam, string lights'],
];

/* every flagged device, one row each: [key, name, product, room, app, kind, value, sort weight]
   kind: offline (value = how long), battery (value = percent), firmware (value = versions behind) */
const FLAGGED = [
  ['yard-plug', 'Backyard string lights plug', 'SmartThings Smart Outlet', 'backyard', 'smartthings', 'offline', '12 d', 12],
  ['garage-door', 'Garage side door sensor', 'Aqara Door and Window Sensor', 'garage', 'ha', 'offline', '3 d', 3],
  ['kids-dot', 'Kids room Echo Dot', 'Echo Dot (5th Gen)', 'kids', 'alexa', 'offline', '2 d', 2],
  ['office-go', 'Office desk lamp', 'Hue Go', 'office', 'hue', 'offline', '5 d', 5],
  ['yard-cam', 'Backyard camera', 'Ring Spotlight Cam Plus', 'backyard', 'alexa', 'offline', '26 h', 1],
  ['tv-bar', 'TV light bar, left', 'Hue Play Light Bar', 'living', 'hue', 'offline', '1 d', 1],

  ['garage-tilt', 'Garage door tilt sensor', 'SmartThings Multipurpose Sensor', 'garage', 'smartthings', 'battery', 7, 7],
  ['hall-motion', 'Hallway motion sensor', 'Hue Motion Sensor', 'hallway', 'hue', 'battery', 9, 9],
  ['kids-dimmer', 'Kids room dimmer', 'Hue Dimmer Switch', 'kids', 'hue', 'battery', 11, 11],
  ['front-lock', 'Front door lock', 'Yale Assure Lock 2', 'porch', 'smartthings', 'battery', 12, 12],
  ['sink-leak', 'Under-sink leak sensor', 'Aqara Water Leak Sensor', 'kitchen', 'ha', 'battery', 14, 14],
  ['office-temp', 'Office room sensor', 'Ecobee SmartSensor', 'office', 'ha', 'battery', 15, 15],
  ['bed-window', 'Bedroom window sensor', 'Aqara Door and Window Sensor', 'primary', 'ha', 'battery', 16, 16],
  ['doorbell', 'Front doorbell', 'Ring Video Doorbell', 'porch', 'alexa', 'battery', 18, 18],
  ['gate', 'Backyard gate sensor', 'SmartThings Multipurpose Sensor', 'backyard', 'smartthings', 'battery', 19, 19],

  ['hue-bridge', 'Hue Bridge', 'Hue Bridge (2nd gen)', 'hallway', 'hue', 'firmware', 2, 2],
  ['chromecast', 'Living room TV', 'Chromecast with Google TV', 'living', 'google', 'firmware', 2, 2],
  ['thermostat', 'Hallway thermostat', 'Nest Thermostat', 'hallway', 'google', 'firmware', 1, 1],
  ['nest-hub', 'Kitchen display', 'Nest Hub (2nd gen)', 'kitchen', 'google', 'firmware', 1, 1],
  ['echo-show', 'Kitchen Echo Show', 'Echo Show 8', 'kitchen', 'alexa', 'firmware', 1, 1],
  ['st-hub', 'SmartThings hub', 'SmartThings Hub v3', 'office', 'smartthings', 'firmware', 1, 1],
  ['skyconnect', 'Zigbee stick', 'Home Assistant SkyConnect', 'office', 'ha', 'firmware', 1, 1],
  ['wifi-point', 'Living room Wi-Fi point', 'Nest Wifi Pro', 'living', 'google', 'firmware', 1, 1],
  ['opener', 'Garage door opener', 'Meross Smart Garage Door Opener', 'garage', 'ha', 'firmware', 1, 1],
  ['yard-motion', 'Backyard motion sensor', 'Hue Outdoor Motion Sensor', 'backyard', 'hue', 'firmware', 1, 1],
  ['bed-dot', 'Bedroom Echo Dot', 'Echo Dot (5th Gen)', 'primary', 'alexa', 'firmware', 1, 1],
];

export const accOf = (id) => accounts.find((a) => a.id === id);

export const flagged = FLAGGED.map(([key, name, product, room, app, kind, value, w]) => ({
  key, name, product, room, app, kind, value, w,
  valueText:
    kind === 'offline' ? `offline ${value}` :
    kind === 'battery' ? `${value}%` :
    `${value} ${value === 1 ? 'version' : 'versions'} behind`,
  statusText:
    kind === 'offline' ? `Offline ${value}` :
    kind === 'battery' ? 'Low battery' :
    value === 1 ? 'Update waiting' : `${value} updates waiting`,
}));

/* the automations the five apps run: [key, name, app, trigger, last fired, days since, why it stopped] */
const AUTOMATIONS = [
  ['garage-close', 'Garage door closes at 10 PM', 'ha', 'Every night, 10:00 PM', 'Thu, Sep 10', 16, 'Waits on the garage door tilt sensor, battery 7%'],
  ['yard-off', 'Backyard lights off at midnight', 'smartthings', 'Every night, 12:00 AM', 'Mon, Sep 14', 12, 'Targets the string lights plug, offline 12 d'],
  ['porch-sunset', 'Porch lights at sunset', 'alexa', 'Sunset', 'Thu, Sep 17', 9, 'Points at a Hue group renamed in the Hue app'],
  ['morning-heat', 'Morning heat at 6:30 AM', 'google', 'Weekdays, 6:30 AM', 'Fri, Sep 18', 8, 'Schedule paused in Google Home on Sep 18'],
  ['doorbell-chime', 'Doorbell rings the kitchen speaker', 'alexa', 'Doorbell press', 'Today, 8:51 AM', 0, ''],
  ['good-morning', 'Good morning', 'alexa', 'Weekends, 8:00 AM', 'Today, 8:00 AM', 0, ''],
  ['hall-night', 'Hallway night light on motion', 'hue', 'Motion, 11 PM to 6 AM', 'Today, 2:14 AM', 0, ''],
  ['wind-down', 'Wind down lights', 'hue', 'Every night, 9:30 PM', 'Fri, Sep 25, 9:30 PM', 1, ''],
  ['movie', 'Movie time', 'google', 'Hey Google, movie time', 'Fri, Sep 25, 8:40 PM', 1, ''],
  ['leaving', 'Leaving home: lock and lights off', 'ha', 'Last phone leaves', 'Fri, Sep 25, 8:05 AM', 1, ''],
  ['eco-away', 'Thermostat to eco when away', 'google', 'Nobody home', 'Fri, Sep 25, 8:07 AM', 1, ''],
  ['garage-light', 'Garage light on door open', 'smartthings', 'Garage door opens', 'Thu, Sep 24, 6:18 PM', 2, ''],
];

/* the room each automation acts on, so a room card can carry its stale automations too */
const AUTO_ROOM = {
  'garage-close': 'garage', 'yard-off': 'backyard', 'porch-sunset': 'porch', 'morning-heat': 'hallway',
  'doorbell-chime': 'kitchen', 'good-morning': 'primary', 'hall-night': 'hallway', 'wind-down': 'living',
  movie: 'living', leaving: 'porch', 'eco-away': 'hallway', 'garage-light': 'garage',
};

export const automations = AUTOMATIONS.map(([key, name, app, trigger, last, days, why]) => ({
  key, name, app, trigger, last, days, why, room: AUTO_ROOM[key], stale: days >= meta.staleDays,
  ago: days === 0 ? 'today' : days === 1 ? '1 d ago' : `${days} d ago`,
}));

const kindCount = (k) => flagged.filter((f) => f.kind === k).length;
const staleAutos = automations.filter((a) => a.stale);

export const rooms = ROOMS.map(([key, name, icon, devices, apps, what]) => {
  const inRoom = flagged.filter((f) => f.room === key);
  const by = (k) => inRoom.filter((f) => f.kind === k).length;
  return {
    key, name, icon, devices, apps, what,
    flags: {
      offline: by('offline'),
      battery: by('battery'),
      firmware: by('firmware'),
      stale: staleAutos.filter((a) => a.room === key).length,
    },
    flaggedN: inRoom.length,
  };
});

export const counts = {
  accounts: accounts.length,
  pulled: PULLED,
  dupes: DUPES,
  devices: DEVICES,
  rooms: rooms.length,
  roomDevices: rooms.reduce((a, r) => a + r.devices, 0),   // 127, the rooms hold every device once
  offline: kindCount('offline'),                          // 6
  battery: kindCount('battery'),                          // 9
  firmware: kindCount('firmware'),                        // 11
  stale: staleAutos.length,                               // 4
  automations: automations.length,                        // 12
  flaggedDevices: flagged.length,                         // 26
  healthy: DEVICES - flagged.length,                      // 101
  hueDupes: accOf('ha').pulled - accOf('ha').kept,        // 30 Hue devices Home Assistant also lists
};

/* the hubs the devices hang off, read from the device lists above */
export const hubs = ['Hue Bridge (2nd gen)', 'SmartThings Hub v3', 'Home Assistant SkyConnect'];

/* the four flag tiles: [kind, label, icon, what the check is, the examples it prints] */
/* the three examples each tile names: the ones a household would miss first, not simply the worst numbers */
const EXAMPLES = {
  offline: ['garage-door', 'yard-plug', 'kids-dot'],
  battery: ['front-lock', 'garage-tilt', 'hall-motion'],
  firmware: ['hue-bridge', 'chromecast', 'thermostat'],
};
const top = (kind, n) => EXAMPLES[kind].slice(0, n).map((k) => flagged.find((f) => f.key === k && f.kind === kind));
export const flags = [
  { kind: 'offline', label: 'Offline', icon: 'wifi-off', n: counts.offline, rule: 'Not seen by any app in 24 h',
    examples: top('offline', 3).map((f) => ({ name: f.name, v: f.valueText })) },
  { kind: 'battery', label: 'Low battery', icon: 'battery-low', n: counts.battery, rule: `Under ${meta.lowBattery}%`,
    examples: top('battery', 3).map((f) => ({ name: f.name, v: f.valueText })) },
  { kind: 'firmware', label: 'Firmware behind', icon: 'cpu', n: counts.firmware, rule: 'An update is waiting',
    examples: top('firmware', 3).map((f) => ({ name: f.name, v: f.valueText })) },
  { kind: 'stale', label: 'Stale automations', icon: 'timer-off', n: counts.stale, rule: `Not fired in ${meta.staleDays}+ days`,
    examples: staleAutos.slice(0, 3).map((a) => ({ name: a.name, v: `${a.days} d ago` })) },
];

/* the device list panel 1 prints: merged devices, one row each, with every app it was found in */
const DEVICE_ROWS = [
  ['living-lamp', 'Living room floor lamp', 'Hue White and Color A19', 'living', ['hue', 'ha', 'google', 'alexa'], '100%', 'ok'],
  ['tv-bar', 'TV light bar, left', 'Hue Play Light Bar', 'living', ['hue', 'ha', 'google'], '', 'offline'],
  ['thermostat', 'Hallway thermostat', 'Nest Thermostat', 'hallway', ['google', 'ha'], '', 'firmware'],
  ['front-lock', 'Front door lock', 'Yale Assure Lock 2', 'porch', ['smartthings', 'ha', 'alexa'], '12%', 'battery'],
  ['doorbell', 'Front doorbell', 'Ring Video Doorbell', 'porch', ['alexa', 'ha'], '18%', 'battery'],
  ['kitchen-dot', 'Kitchen speaker', 'Echo Dot (5th Gen)', 'kitchen', ['alexa'], '', 'ok'],
  ['garage-tilt', 'Garage door tilt sensor', 'SmartThings Multipurpose Sensor', 'garage', ['smartthings', 'ha'], '7%', 'battery'],
  ['office-go', 'Office desk lamp', 'Hue Go', 'office', ['hue', 'ha', 'alexa'], '', 'offline'],
  ['office-temp', 'Office room sensor', 'Ecobee SmartSensor', 'office', ['ha', 'google'], '15%', 'battery'],
  ['hue-bridge', 'Hue Bridge', 'Hue Bridge (2nd gen)', 'hallway', ['hue', 'ha'], '', 'firmware'],
];

export const devices = DEVICE_ROWS.map(([key, name, product, room, apps, battery, status]) => {
  const f = flagged.find((x) => x.key === key);
  return {
    key, name, product, room, apps, battery, status,
    roomName: (rooms.find((r) => r.key === room) || {}).name || room,
    statusText: f ? f.statusText : 'OK',
  };
});

/* the rows the hub's live card previews while the sync runs */
export const items = [
  { img: './brand/device.svg', title: 'Front door lock', price: '12%', meta: 'Yale Assure Lock 2 · Porch · low battery', source: 'smartthings' },
  { img: './brand/device.svg', title: 'Living room floor lamp', price: '4 apps', meta: 'Hue White and Color A19 · merged to one', source: 'hue' },
  { img: './brand/device.svg', title: 'Garage side door sensor', price: 'Offline', meta: 'Aqara Door and Window Sensor · 3 d', source: 'ha' },
  { img: './brand/device.svg', title: 'Hallway thermostat', price: '1 behind', meta: 'Nest Thermostat · firmware update waiting', source: 'google' },
  { img: './brand/device.svg', title: 'Porch lights at sunset', price: '9 d', meta: 'Alexa routine · has not fired', source: 'alexa' },
];

const worst = staleAutos.slice().sort((a, b) => b.days - a.days)[0];

/* prose the page prints about its own numbers */
export const copy = {
  kicker: `Home Assistant + Google Home + Alexa + SmartThings + Hue, synced ${meta.synced}`,
  heroH1: `${counts.pulled} device entries pulled. ${counts.dupes} were a device another app already listed.`,
  heroDek: `Superbot signed in to all ${counts.accounts} apps, pulled every device, merged the copies into ${counts.devices} unique devices and sorted them into ${counts.rooms} rooms. Read-only, nothing was changed in any account.`,
  flagsH: 'What needs a look',
  flagsDek: `${counts.flaggedDevices} of ${counts.devices} devices and ${counts.stale} of ${counts.automations} automations. Found and listed, nothing fixed without you.`,
  roomsH: 'Room by room',
  roomsDek: `${counts.devices} devices in ${counts.rooms} rooms, each counted once no matter how many apps list it.`,
  devicesH: 'Every device, one row each',
  devicesDek: `The ${DEVICE_ROWS.length} below are a slice of ${counts.devices}. A Hue bulb Home Assistant, Google Home and Alexa all list is one row here.`,
  autosH: 'Automations, last time each one fired',
  autosDek: `${counts.automations} automations across ${counts.accounts} apps. ${counts.stale} have not fired in ${meta.staleDays} days or more.`,
  worstNote: `${worst.name} last fired ${worst.last}, ${worst.days} days ago. ${worst.why}. Flagged in Superbot’s view only, nothing in ${accOf(worst.app).name} was changed.`,
  watchH: 'Keeps watching',
  watchDek: 'The next sync runs on its own. You hear about it only when something changes.',
};

/* what Superbot keeps an eye on after the sync */
export const watch = [
  { icon: 'clock', k: 'Next sync', v: 'Sat, Oct 3, 9:00 AM', note: `All ${counts.accounts} apps, read-only` },
  { icon: 'battery-low', k: 'Batteries', v: `${counts.battery} under ${meta.lowBattery}%`, note: 'Front door lock first, it is the one you would miss' },
  { icon: 'cpu', k: 'Firmware', v: `${counts.firmware} updates waiting`, note: 'Listed, never installed for you' },
  { icon: 'timer-off', k: 'Automations', v: `${counts.stale} stale, ${counts.automations - counts.stale} running`, note: `A ping if one misses ${meta.staleDays} days` },
];
