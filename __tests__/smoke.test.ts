import { afterEach, describe, expect, it } from 'vitest';

import { createZigBinding } from '../src/index';

describe('zig binding smoke', () => {
  afterEach(() => {
    delete (globalThis as any).__obixAbiInvoker;
  });

  it('toggles initialize/destroy state and uses shared invocation envelope', async () => {
    const ffiPath = '/tmp/obix-zig-ffi.mock';

    const binding = createZigBinding({
      ffiPath,
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    expect(binding.isInitialized()).toBe(false);

    const beforeInit = await binding.invoke('ping', [1]);
    expect(beforeInit).toMatchObject({ code: 'NOT_INITIALIZED' });

    await binding.initialize();
    expect(binding.isInitialized()).toBe(true);

    const noSymbol = await binding.invoke('ping', [1]);
    expect(noSymbol).toMatchObject({ code: 'MISSING_SYMBOL' });

    (globalThis as any).__obixAbiInvoker = {
      invoke: (payload: string) => {
        const envelope = JSON.parse(payload);
        return { ok: true, echo: envelope };
      },
    };

    const result = await binding.invoke('ping', [1, 2, 3]);
    expect(result).toMatchObject({
      ok: true,
      echo: {
        functionId: 'ping',
        args: [1, 2, 3],
        metadata: { binding: 'zig', ffiPath },
      },
    });

    await binding.destroy();
    expect(binding.isInitialized()).toBe(false);
  });

  it('getMemoryUsage returns ZigArenaStats shape', () => {
    const binding = createZigBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'monoglot',
      memoryModel: 'manual',
    });

    expect(binding.getMemoryUsage()).toEqual({
      arenaBytes: 0,
      peakArenaBytes: 0,
      resetCount: 0,
      allocCount: 0,
      freeCount: 0,
    });
  });

  it('getArenaStats returns same shape as getMemoryUsage', () => {
    const binding = createZigBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    expect(binding.getArenaStats()).toEqual(binding.getMemoryUsage());
  });

  it('getSchemaMode returns configured mode', () => {
    const binding = createZigBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'polyglot',
      memoryModel: 'gc',
    });

    expect(binding.getSchemaMode()).toBe('polyglot');
  });

  it('sub-module accessors are defined', () => {
    const binding = createZigBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    expect(binding.ffiTransport).toBeDefined();
    expect(binding.arenaAllocator).toBeDefined();
    expect(binding.comptimeCache).toBeDefined();
    expect(binding.schemaResolver).toBeDefined();
  });

  it('submitComptimeEval returns NOT_INITIALIZED before init', async () => {
    const binding = createZigBinding({
      ffiPath: '/tmp/test.so',
      schemaMode: 'hybrid',
      memoryModel: 'hybrid',
    });

    const result = await binding.submitComptimeEval('key1', 'fn', []);
    expect(result).toMatchObject({ code: 'NOT_INITIALIZED' });
  });
});
