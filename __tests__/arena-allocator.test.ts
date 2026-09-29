import { describe, expect, it } from 'vitest';
import { createArenaAllocator } from '../src/arena-allocator';

describe('createArenaAllocator', () => {
  it('snapshot returns zero stats initially', () => {
    const alloc = createArenaAllocator();
    expect(alloc.snapshot()).toEqual({
      arenaBytes: 0,
      peakArenaBytes: 0,
      resetCount: 0,
      allocCount: 0,
      freeCount: 0,
    });
  });

  it('recordAlloc increases arenaBytes and allocCount', () => {
    const alloc = createArenaAllocator();
    alloc.recordAlloc(1024);
    expect(alloc.snapshot().arenaBytes).toBe(1024);
    expect(alloc.snapshot().allocCount).toBe(1);

    alloc.recordAlloc(512);
    expect(alloc.snapshot().arenaBytes).toBe(1536);
    expect(alloc.snapshot().allocCount).toBe(2);
  });

  it('recordAlloc updates peakArenaBytes', () => {
    const alloc = createArenaAllocator();
    alloc.recordAlloc(2000);
    expect(alloc.snapshot().peakArenaBytes).toBe(2000);

    alloc.recordAlloc(500);
    expect(alloc.snapshot().peakArenaBytes).toBe(2500);
  });

  it('recordFree decrements arenaBytes and increments freeCount', () => {
    const alloc = createArenaAllocator();
    alloc.recordAlloc(1000);
    alloc.recordFree(300);
    expect(alloc.snapshot().arenaBytes).toBe(700);
    expect(alloc.snapshot().freeCount).toBe(1);
  });

  it('recordFree clamps arenaBytes to 0', () => {
    const alloc = createArenaAllocator();
    alloc.recordAlloc(100);
    alloc.recordFree(9999);
    expect(alloc.snapshot().arenaBytes).toBe(0);
  });

  it('reset zeroes arenaBytes and increments resetCount', () => {
    const alloc = createArenaAllocator();
    alloc.recordAlloc(500);
    alloc.reset();
    expect(alloc.snapshot().arenaBytes).toBe(0);
    expect(alloc.snapshot().resetCount).toBe(1);
  });

  it('peakArenaBytes is preserved across reset', () => {
    const alloc = createArenaAllocator();
    alloc.recordAlloc(3000);
    alloc.reset();
    expect(alloc.snapshot().peakArenaBytes).toBe(3000);
  });

  it('multiple resets accumulate resetCount', () => {
    const alloc = createArenaAllocator();
    alloc.reset();
    alloc.reset();
    alloc.reset();
    expect(alloc.snapshot().resetCount).toBe(3);
  });

  it('destroy calls reset', () => {
    const alloc = createArenaAllocator();
    alloc.recordAlloc(800);
    alloc.destroy();
    expect(alloc.snapshot().arenaBytes).toBe(0);
    expect(alloc.snapshot().resetCount).toBe(1);
  });
});
