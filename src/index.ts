/**
 * OBIX Zig Binding
 * Systems programming, compile-time optimization
 * Connects native FFI/polyglot bridge to Zig runtime
 */

// ── Type re-exports ───────────────────────────────────────────────────────────
export type {
  SchemaMode,
  InvocationEnvelope,
  BindingInvokeError,
  BindingAbiInvoker,
  ZigVersion,
  ZigBuildMode,
  ZigCompileTarget,
  ZigFFIDescriptor,
  ZigBindingConfig,
  ZigBindingBridge,
  ZigArenaStats,
  ArenaAllocatorAPI,
  ComptimeEntry,
  ComptimeCacheStats,
  ComptimeCacheAPI,
  ZigSchemaResolverConfig,
  ZigResolvedSchema,
  ZigSchemaResolverAPI,
  FFITransportConfig,
  FFITransportAPI,
} from './types.js';

// ── Sub-module factory re-exports ─────────────────────────────────────────────
export { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
export { createArenaAllocator } from './arena-allocator.js';
export { createComptimeCache } from './comptime-cache.js';
export { createSchemaResolver } from './schema-resolver.js';

// ── Imports for the main factory ──────────────────────────────────────────────
import type {
  ZigArenaStats,
  ZigBindingBridge,
  ZigBindingConfig,
} from './types.js';
import { createFFITransport, normalizeFunctionIdentifier } from './ffi-transport.js';
import { createArenaAllocator } from './arena-allocator.js';
import { createComptimeCache } from './comptime-cache.js';
import { createSchemaResolver } from './schema-resolver.js';

// ── Main factory ──────────────────────────────────────────────────────────────

/**
 * Create a Zig binding to the native bridge
 * @param config Configuration for the binding
 * @returns Bridge for invoking polyglot functions and managing Zig runtime state
 */
export function createZigBinding(config: ZigBindingConfig): ZigBindingBridge {
  let initialized = false;
  const ABI_BINDING_NAME = 'zig';

  const ffiTransport = createFFITransport({
    ffiPath: config.ffiPath,
    schemaMode: config.schemaMode,
    bindingName: ABI_BINDING_NAME,
  });

  const arenaAllocator = createArenaAllocator();

  const comptimeCache = createComptimeCache(config.comptimeCacheSize);

  const schemaResolver = createSchemaResolver({
    schemaMode: config.schemaMode,
    zigVersion: config.zigVersion ?? config.ffiDescriptor?.zigVersion,
  });

  const bridge: ZigBindingBridge = {
    async initialize(): Promise<void> {
      if (typeof config.ffiPath !== 'string' || config.ffiPath.trim().length === 0) {
        throw new Error(`Invalid ffiPath: ${config.ffiPath}`);
      }
      if (!schemaResolver.validate(config.schemaMode)) {
        throw new Error(`Invalid schemaMode: ${config.schemaMode}`);
      }
      initialized = true;
    },

    async invoke(fn: string | object, args: unknown[]): Promise<unknown> {
      const functionId = normalizeFunctionIdentifier(fn);
      const envelope = ffiTransport.buildEnvelope(functionId ?? '<unknown>', args);

      if (!initialized) {
        return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized', envelope };
      }
      if (!functionId) {
        return { code: 'MISSING_SYMBOL', message: 'Function identifier was not provided', envelope };
      }

      return ffiTransport.dispatch(envelope);
    },

    async destroy(): Promise<void> {
      arenaAllocator.destroy();
      comptimeCache.destroy();
      ffiTransport.destroy();
      schemaResolver.destroy();
      initialized = false;
    },

    getMemoryUsage(): ZigArenaStats {
      return arenaAllocator.snapshot();
    },

    getSchemaMode() {
      return schemaResolver.getMode();
    },

    isInitialized(): boolean {
      return initialized;
    },

    async submitComptimeEval(key: string, fn: string | object, args: unknown[]): Promise<unknown> {
      if (!initialized) {
        return { code: 'NOT_INITIALIZED', message: 'Binding is not initialized' };
      }

      if (comptimeCache.has(key)) {
        return comptimeCache.get(key);
      }

      const result = await bridge.invoke(fn, args);
      comptimeCache.set(key, result);
      return result;
    },

    getArenaStats(): ZigArenaStats {
      return arenaAllocator.snapshot();
    },

    resetArena(): void {
      arenaAllocator.reset();
    },

    get ffiTransport() { return ffiTransport; },
    get arenaAllocator() { return arenaAllocator; },
    get comptimeCache() { return comptimeCache; },
    get schemaResolver() { return schemaResolver; },
  };

  return bridge;
}
