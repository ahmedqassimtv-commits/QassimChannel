/**
 * Resolves public asset paths cleanly for both root deploys (`/`)
 * and subpath deploys such as GitHub Pages (`/QassimChannel/`).
 */
export function assetUrl(path) {
  if (!path) return path
  if (/^(https?:|data:|blob:|\/\/)/.test(path)) return path
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  const clean = path.replace(/^\/+/, '')
  return `${normalizedBase}${clean}`
}
