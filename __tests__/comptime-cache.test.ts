import { describe, expect, it } from 'vitest';
import { createComptimeCache } from '../src/comptime-cache';

describe('createComptimeCache', () => {
  it('getStats returns zero counts initially', () => {
    const cache = createComptimeCache();
    expect(cache.getStats()).toEqual({
      entryCount: 0,
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
    });
  });

  it('get on missing key returns undefined and increments missCount', () => {
    const cache = createComptimeCache();
    const result = cache.get('missing');
    expect(result).toBeUndefined();
    expect(cache.getStats().missCount).toBe(1);
  });

  it('set then get returns the stored value and increments hitCount', () => {
    const cache = createComptimeCache();
    cache.set('pi', 3.14159);
    const result = cache.get('pi');
    expect(result).toBe(3.14159);
    expect(cache.getStats().hitCount).toBe(1);
    expect(cache.getStats().missCount).toBe(0);
  });

  it('has returns true for existing key', () => {
    const cache = createComptimeCache();
    cache.set('key', 'value');
    expect(cache.has('key')).toBe(true);
  });

  it('has returns false for absent key', () => {
    const cache = createComptimeCache();
    expect(cache.has('nope')).toBe(false);
  });

  it('delete removes entry', () => {
    const cache = createComptimeCache();
    cache.set('x', 42);
    cache.delete('x');
    expect(cache.has('x')).toBe(false);
    expect(cache.getStats().entryCount).toBe(0);
  });

  it('listKeys returns all stored keys', () => {
    const cache = createComptimeCache();
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    expect(cache.listKeys().sort()).toEqual(['a', 'b', 'c']);
  });

  it('getStats.entryCount reflects current size', () => {
    const cache = createComptimeCache();
    cache.set('one', 1);
    cache.set('two', 2);
    expect(cache.getStats().entryCount).toBe(2);
    cache.delete('one');
    expect(cache.getStats().entryCount).toBe(1);
  });

  it('evicts LRU entry when maxSize is exceeded', () => {
    const cache = createComptimeCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    // 'a' is now LRU — adding 'd' should evict 'a'
    cache.set('d', 4);
    expect(cache.has('a')).toBe(false);
    expect(cache.has('d')).toBe(true);
    expect(cache.getStats().evictionCount).toBe(1);
    expect(cache.getStats().entryCount).toBe(3);
  });

  it('get promotes accessed entry (not evicted first)', () => {
    const cache = createComptimeCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    // Access 'a' to promote it to MRU
    cache.get('a');
    // Now 'b' is LRU — adding 'd' should evict 'b'
    cache.set('d', 4);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(cache.getStats().evictionCount).toBe(1);
  });

  it('set on existing key refreshes without eviction', () => {
    const cache = createComptimeCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('a', 99); // refresh, no eviction
    expect(cache.getStats().evictionCount).toBe(0);
    expect(cache.getStats().entryCount).toBe(3);
    expect(cache.get('a')).toBe(99);
  });

  it('destroy clears all entries', () => {
    const cache = createComptimeCache();
    cache.set('x', 1);
    cache.set('y', 2);
    cache.destroy();
    expect(cache.getStats().entryCount).toBe(0);
    expect(cache.listKeys()).toEqual([]);
  });
});
