/**
 * Adjusts an array to a specific length by repeating its elements.
 * @param arr - The source array to adjust
 * @param length - The target length of the output array
 * @param override - If array length matches this value, return as-is
 * @returns A new array of the specified length
 */
export function adjustArrayLength<T>(
  arr: T[] = [],
  length = 12,
  override = 100
): T[] {
  if (arr.length === override) return arr
  if (!arr || arr.length === 0) return []
  return Array.from({ length }, (_, i) => arr[i % arr.length] as T)
}

/**
 * Checks if an array is empty or undefined/null.
 * @param arr - The array to check
 * @returns True if the array is empty, null, or undefined
 */
export function isEmptyArray<T>(arr: T[] | null | undefined): boolean {
  if (!arr) return true
  return Array.isArray(arr) && arr.length === 0
}
