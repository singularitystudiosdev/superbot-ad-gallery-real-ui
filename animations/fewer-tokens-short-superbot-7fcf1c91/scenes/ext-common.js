// Shared bootstrap for the extension scenes (ext-*.js): loads app/app-ext.css (the rules the kit's app.css lacks) and ext.js (SB helpers),
// then the extension snapshots a scene needs. Use:  const SBx = await ensureExt(SB, ['api-top', ...])
export async function ensureExt(SB, states = []) {
  if (!document.querySelector('link[data-sb-ext]')) {
    await new Promise((res, rej) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'app/app-ext.css'; l.setAttribute('data-sb-ext', '')
      l.onload = res; l.onerror = () => rej(new Error('app/app-ext.css failed to load')); document.head.appendChild(l)
    })
  }
  if (!SB.ext) {
    await new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'ext.js'; s.onload = res; s.onerror = () => rej(new Error('ext.js failed to load')); document.head.appendChild(s)
    })
  }
  await SB.loadExt(states)
  return SB
}
