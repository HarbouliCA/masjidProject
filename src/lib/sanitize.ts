/**
 * Firestore rejects `undefined` field values ("Unsupported field value:
 * undefined"). Strip undefined (recursively) before every client write.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (
    value &&
    typeof value === "object" &&
    Object.prototype.toString.call(value) === "[object Object]" &&
    value.constructor === Object
  ) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) out[k] = stripUndefined(v);
    }
    return out as T;
  }
  return value;
}
