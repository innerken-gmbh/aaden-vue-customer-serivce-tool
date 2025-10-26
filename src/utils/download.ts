/**
 * Helper to open a remote file through the backend download proxy.
 *
 * The proxy lives at the global API base (e.g., https://cloud-v2.aaden.io) under the path /downloadFile
 * and expects the full remote URL in the `fileUrl` query parameter.
 *
 * Usage:
 *   openDownloadViaProxy('https://bucket.s3.amazonaws.com/object.pdf')
 *   openDownloadViaProxy(url, { newTab: true }) // preview in a new tab if the browser can render it
 *
 * You can also only build the URL for use in href attributes:
 *   const href = getDownloadProxyUrl(url)
 */
export function getDownloadProxyBase(): string {
  // Prefer explicit env, fallback to production API base
  const envBase = (import.meta as any)?.env?.VITE_API_BASE as string | undefined
  const base = (envBase && envBase.trim().length > 0) ? envBase : 'https://cloud-v2.aaden.io'
  return base.replace(/\/$/, '')
}

export function getDownloadProxyUrl(remoteUrl: string): string {
  const base = getDownloadProxyBase()
  return `${base}/downloadFile?fileUrl=${encodeURIComponent(remoteUrl)}`
}

export function openDownloadViaProxy(remoteUrl: string, opts?: { newTab?: boolean }) {
  const href = getDownloadProxyUrl(remoteUrl)
  if (opts?.newTab) {
    window.open(href, '_blank', 'noopener')
    return
  }
  const a = document.createElement('a')
  a.href = href
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
