import type { ComptimeCacheAPI, ComptimeCacheStats, ComptimeEntry } from './types.js';

const DEFAULT_MAX_SIZE = 256;

export function createComptimeCache(maxSize: number = DEFAULT_MAX_SIZE): ComptimeCacheAPI {
  // Insertion-ordered map — keys at the front are oldest (LRU eviction target)
  const entries = new Map<string, ComptimeEntry>();
  let hitCount = 0;
  let missCount = 0;
  let evictionCount = 0;

  function evictLRU(): void {
    const oldestKey = entries.keys().next().value;
    if (oldestKey !== undefined) {
      entries.delete(oldestKey);
      evictionCount++;
    }
  }

  const api: ComptimeCacheAPI = {
    set(key: string, value: unknown): void {
      if (entries.has(key)) {
        // Refresh: remove then re-insert to move to end (most-recently-used)
        entries.delete(key);
      } else if (entries.size >= maxSize) {
        evictLRU();
      }
      entries.set(key, { key, value, computedAtMs: Date.now() });
    },

    get(key: string): unknown {
      const entry = entries.get(key);
      if (entry === undefined) {
        missCount++;
        return undefined;
      }
      hitCount++;
      // Move to end (most-recently-used)
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },

    has(key: string): boolean {
      return entries.has(key);
    },

    delete(key: string): void {
      entries.delete(key);
    },

    listKeys(): string[] {
      return Array.from(entries.keys());
    },

    getStats(): ComptimeCacheStats {
      return {
        entryCount: entries.size,
        hitCount,
        missCount,
        evictionCount,
      };
    },

    destroy(): void {
      entries.clear();
    },
  };

  return api;
}
