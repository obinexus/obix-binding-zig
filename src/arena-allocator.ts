import type { ArenaAllocatorAPI, ZigArenaStats } from './types.js';

export function createArenaAllocator(): ArenaAllocatorAPI {
  let arenaBytes = 0;
  let peakArenaBytes = 0;
  let resetCount = 0;
  let allocCount = 0;
  let freeCount = 0;

  const api: ArenaAllocatorAPI = {
    recordAlloc(bytes: number): void {
      arenaBytes += bytes;
      allocCount++;
      if (arenaBytes > peakArenaBytes) {
        peakArenaBytes = arenaBytes;
      }
    },

    recordFree(bytes: number): void {
      freeCount++;
      arenaBytes = Math.max(0, arenaBytes - bytes);
    },

    reset(): void {
      arenaBytes = 0;
      resetCount++;
      // peakArenaBytes is preserved across resets — it tracks the lifetime peak
    },

    snapshot(): ZigArenaStats {
      return {
        arenaBytes,
        peakArenaBytes,
        resetCount,
        allocCount,
        freeCount,
      };
    },

    destroy(): void {
      api.reset();
    },
  };

  return api;
}
