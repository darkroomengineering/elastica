export function isEmptyArray(arr) {
  if (!arr) return true

  return Array.isArray(arr) && arr.length === 0
}
