export default function isArrayAndNotEmpty<T>(value: T | undefined | null): value is T {
  return Array.isArray(value) && value.length > 0;
}


