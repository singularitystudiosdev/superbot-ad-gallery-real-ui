// Shared bits for the flow's node panels: element factory, asset URLs, the model registry the graph, the composer
// chip and the switch chips all read.
export const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const gen = (f) => new URL('../../../img/gen/' + f, import.meta.url).href;
export const brand = (f) => new URL('../../../brand/' + f, import.meta.url).href;
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const SB_MARK = '<i class="sbm sbm-c"></i><i class="sbm sbm-m"></i><i class="sbm sbm-w"></i>';

// name: the composer chip; chip: the routing chip superbot lands; task: the node's one line of work
export const APPS = {
  opus: { name: 'Claude Opus 5.5', logo: brand('claude-logo.svg'), chip: 'Switching to Claude Opus 5.5', task: 'Build the buy page' },
  nbp: { name: 'Nano Banana Pro', logo: brand('gemini-logo.svg'), chip: 'Switching to Nano Banana Pro', task: 'Shoot it in the real world' },
  blender: { name: 'Blender 5.2', logo: brand('blender-logo.svg'), chip: 'Connecting to Blender', task: 'Model the PF tile in 3D' },
  deepseek: { name: 'DeepSeek V4.1 Flash', logo: brand('deepseek-logo.svg'), chip: 'Switching to DeepSeek V4.1 Flash', task: 'Scrape every fee page' },
  eleven: { name: 'ElevenLabs v3', logo: brand('elevenlabs-logo.svg'), chip: 'Switching to ElevenLabs', task: 'Voice the script' },
  render: { name: 'Superbot', logo: null, chip: 'Switched to Superbot', task: 'Cut and render the film' },
};

export const tile = (app, cls = '') => `<span class="qc-tile fg-t-${app} ${cls}">${app === 'render' ? SB_MARK : `<img src="${APPS[app].logo}" alt=""/>`}</span>`;
export const fmtS = (ms) => (ms / 1000).toFixed(1) + 's';
