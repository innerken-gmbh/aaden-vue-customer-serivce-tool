// Utility to strip all undefined keys from plain objects and arrays recursively.
// - Preserves Dates, Firestore FieldValue/Timestamp and other non-plain objects
// - Does not mutate the original input
export function stripUndefinedDeep<T = any>(value: T): T {
  if (value === undefined) return value as any
  if (value === null) return value
  const t = typeof value
  if (t !== 'object') return value

  if (Array.isArray(value)) {
    const arr = (value as any[]).map((v) => stripUndefinedDeep(v)).filter((v) => v !== undefined)
    return arr as any
  }

  const isPlain = Object.prototype.toString.call(value) === '[object Object]' &&
                  (value as any).constructor === Object
  if (!isPlain) return value

  const out: any = {}
  for (const [k, v] of Object.entries(value as any)) {
    if (v === undefined) continue
    const cleaned = stripUndefinedDeep(v as any)
    if (cleaned !== undefined) out[k] = cleaned
  }
  return out
}
