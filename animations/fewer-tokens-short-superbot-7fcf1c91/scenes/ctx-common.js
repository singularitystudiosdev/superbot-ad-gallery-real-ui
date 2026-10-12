// Shared bootstrap for the Tidy scene: ext (api + helpers) + the Settings > Context captured states (snap-ext2) and their extra CSS.
import { ensureExt } from './ext-common.js'
export async function ensureCtx(SB, states = []) {
  await ensureExt(SB, [])
  if (!document.querySelector('link[data-sb-ext2]')) {
    await new Promise((res, rej) => {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'snap-ext2/app-ext2.css'; l.setAttribute('data-sb-ext2', '')
      l.onload = res; l.onerror = () => rej(new Error('snap-ext2/app-ext2.css failed to load')); document.head.appendChild(l)
    })
  }
  await SB.loadCtx(states)
  return SB
}
