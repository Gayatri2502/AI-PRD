export function parseJsonSafe<T>(value: string, fallback: T): T { try { return JSON.parse(value) as T; } catch { return fallback; } }
export function lines(value: string) { return value.split(/\r?\n/).filter(Boolean); }
