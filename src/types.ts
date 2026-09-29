/**
 * OBIX Zig Binding — shared types
 */

// ── Shared FFI / Envelope ─────────────────────────────────────────────────────

export type SchemaMode = 'monoglot' | 'polyglot' | 'hybrid';

export interface InvocationEnvelope {
  functionId: string;
  args: unknown[];
  metadata: {
    schemaMode: SchemaMode;
    binding: string;
    timestampMs: number;
    ffiPath: string;
  };
}

export interface BindingInvokeError {
  code: 'NOT_INITIALIZED' | 'MISSING_SYMBOL' | 'INVOCATION_FAILED';
  message: string;
  envelope: InvocationEnvelope;
  cause?: unknown;
}

export interface BindingAbiInvoker {
  invoke(envelopeJson: string): unknown | Promise<unknown>;
}

// ── FFI Transport ─────────────────────────────────────────────────────────────

export interface FFITransportConfig {
  ffiPath: string;
  schemaMode: SchemaMode;
  bindingName: string;
}

export interface FFITransportAPI {
  buildEnvelope(functionId: string, args: unknown[]): InvocationEnvelope;
  dispatch(envelope: InvocationEnvelope): Promise<unknown>;
  destroy(): void;
}

// ── Zig-specific descriptor ──────────────────────────────────────────────────

export type ZigVersion = '0.11' | '0.12' | '0.13' | 'nightly';

export type ZigBuildMode = 'Debug' | 'ReleaseSafe' | 'ReleaseFast' | 'ReleaseSmall';

export type ZigCompileTarget =
  | 'native'
  | 'wasm32-wasi'
  | 'wasm32-emscripten'
  | 'x86_64-linux-gnu'
  | 'x86_64-windows'
  | 'aarch64-linux-gnu'
  | 'aarch64-darwin';

export interface ZigFFIDescriptor {
  ffiPath: string;
  zigVersion: ZigVersion;
  compileTarget: ZigCompileTarget;
  buildMode: ZigBuildMode;
  compileTimeOptimization: boolean;
}

export interface ZigBindingConfig {
  ffiPath: string;
  zigVersion?: ZigVersion;
  schemaMode: SchemaMode;
  memoryModel: 'gc' | 'manual' | 'hybrid';
  compileTarget?: ZigCompileTarget;
  buildMode?: ZigBuildMode;
  compileTimeEvaluation?: boolean;
  compileTimeOptimization?: boolean;
  allocator?: 'general-purpose' | 'arena' | 'stack' | 'page';
  llvmOptLevel?: '0' | '1' | '2' | '3' | 's' | 'z';
  comptimeCacheSize?: number;
  ffiDescriptor?: ZigFFIDescriptor;
}

// ── Arena Allocator ───────────────────────────────────────────────────────────

export interface ZigArenaStats {
  arenaBytes: number;
  peakArenaBytes: number;
  resetCount: number;
  allocCount: number;
  freeCount: number;
}

export interface ArenaAllocatorAPI {
  recordAlloc(bytes: number): void;
  recordFree(bytes: number): void;
  reset(): void;
  snapshot(): ZigArenaStats;
  destroy(): void;
}

// ── Comptime Cache ────────────────────────────────────────────────────────────

export interface ComptimeEntry {
  key: string;
  value: unknown;
  computedAtMs: number;
}

export interface ComptimeCacheStats {
  entryCount: number;
  hitCount: number;
  missCount: number;
  evictionCount: number;
}

export interface ComptimeCacheAPI {
  set(key: string, value: unknown): void;
  get(key: string): unknown;
  has(key: string): boolean;
  delete(key: string): void;
  listKeys(): string[];
  getStats(): ComptimeCacheStats;
  destroy(): void;
}

// ── Schema Resolver ──────────────────────────────────────────────────────────

export interface ZigSchemaResolverConfig {
  schemaMode: SchemaMode;
  zigVersion?: ZigVersion;
}

export interface ZigResolvedSchema {
  mode: SchemaMode;
  zigVersion: string;
  supportsMultiLanguage: boolean;
  wasmEnabled: boolean;
  cImportEnabled: boolean;
  comptimeEvalEnabled: boolean;
}

export interface ZigSchemaResolverAPI {
  resolve(): ZigResolvedSchema;
  validate(mode: SchemaMode): boolean;
  getMode(): SchemaMode;
  destroy(): void;
}

// ── Main Bridge ──────────────────────────────────────────────────────────────

export interface ZigBindingBridge {
  initialize(): Promise<void>;
  invoke(fn: string | object, args: unknown[]): Promise<unknown>;
  destroy(): Promise<void>;
  getMemoryUsage(): ZigArenaStats;
  getSchemaMode(): SchemaMode;
  isInitialized(): boolean;
  submitComptimeEval(key: string, fn: string | object, args: unknown[]): Promise<unknown>;
  getArenaStats(): ZigArenaStats;
  resetArena(): void;

  readonly ffiTransport: FFITransportAPI;
  readonly arenaAllocator: ArenaAllocatorAPI;
  readonly comptimeCache: ComptimeCacheAPI;
  readonly schemaResolver: ZigSchemaResolverAPI;
}
