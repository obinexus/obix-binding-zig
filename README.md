# obix-binding-zig

> Previous name: `@obinexusltd/obix-binding-zig` — OBIX packages are named without an npm scope since decision D-102 (2026-09-29); the package, its version and its exports are unchanged.

TypeScript bindings for OBIX Zig runtime integration through the native ABI bridge.

## Overview

`obix-binding-zig` provides a modular bridge API for:

- Creating and initializing a Zig binding configuration
- Invoking ABI-backed polyglot functions with structured envelopes
- Returning consistent typed invocation errors
- Tracking arena allocator state across the binding lifecycle
- Caching compile-time (`comptime`) evaluation results via an LRU cache
- Resolving schema capabilities per `SchemaMode` (WASM, `@cImport`, comptime)

## Installation

```bash
npm install obix-binding-zig
```

## Usage

```ts
import { createZigBinding } from 'obix-binding-zig';

const binding = createZigBinding({
  ffiPath: '/path/to/libnativebridge.so',
  zigVersion: '0.13',
  schemaMode: 'hybrid',
  memoryModel: 'manual',
  buildMode: 'ReleaseFast',
  compileTarget: 'native',
  comptimeCacheSize: 128,
});

await binding.initialize();

const result = await binding.invoke('exampleFunction', ['arg1', 42]);
console.log(result);

// Cache a comptime evaluation result
const cached = await binding.submitComptimeEval('myConstant', 'computeConstant', []);

// Inspect arena usage
const stats = binding.getArenaStats();
console.log(stats.arenaBytes, stats.peakArenaBytes);

// Reset the arena (e.g. end of request scope)
binding.resetArena();

await binding.destroy();
```

## API

### `createZigBinding(config: ZigBindingConfig): ZigBindingBridge`

Creates a binding bridge with lifecycle and invocation methods.

#### Lifecycle

| Method | Description |
|--------|-------------|
| `initialize()` | Validates `ffiPath` and `schemaMode`, marks binding ready |
| `invoke(fn, args)` | Invokes a polyglot function through the native ABI |
| `destroy()` | Tears down all sub-modules and marks binding uninitialized |
| `isInitialized()` | Returns whether the binding is ready |

#### Memory

| Method | Description |
|--------|-------------|
| `getMemoryUsage()` | Returns `ZigArenaStats` snapshot |
| `getArenaStats()` | Alias for `getMemoryUsage()` |
| `resetArena()` | Resets arena byte count (preserves peak) |

#### Comptime

| Method | Description |
|--------|-------------|
| `submitComptimeEval(key, fn, args)` | Invokes `fn` and caches result under `key`; returns cached value on subsequent calls |

#### Sub-module accessors

| Accessor | Type | Description |
|----------|------|-------------|
| `ffiTransport` | `FFITransportAPI` | Raw envelope builder and dispatcher |
| `arenaAllocator` | `ArenaAllocatorAPI` | Arena allocation tracker |
| `comptimeCache` | `ComptimeCacheAPI` | LRU comptime result cache |
| `schemaResolver` | `ZigSchemaResolverAPI` | Schema mode resolver and validator |

### `ZigBindingConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ffiPath` | `string` | required | Path to the native bridge shared library |
| `schemaMode` | `'monoglot' \| 'polyglot' \| 'hybrid'` | required | Polyglot interop mode |
| `memoryModel` | `'gc' \| 'manual' \| 'hybrid'` | required | Memory management strategy |
| `zigVersion` | `ZigVersion` | `undefined` | Zig toolchain version (`'0.11'`–`'nightly'`) |
| `buildMode` | `ZigBuildMode` | `undefined` | `Debug`, `ReleaseSafe`, `ReleaseFast`, or `ReleaseSmall` |
| `compileTarget` | `ZigCompileTarget` | `undefined` | Target triple (e.g. `'native'`, `'wasm32-wasi'`) |
| `comptimeCacheSize` | `number` | `256` | Maximum LRU entries in the comptime cache |
| `allocator` | `string` | `undefined` | Preferred allocator hint (`'arena'`, `'stack'`, etc.) |
| `llvmOptLevel` | `string` | `undefined` | LLVM optimization level (`'0'`–`'3'`, `'s'`, `'z'`) |

## Error model

Invocation errors are returned as typed objects (never thrown):

| Code | Meaning |
|------|---------|
| `NOT_INITIALIZED` | `invoke` or `submitComptimeEval` called before `initialize()` |
| `MISSING_SYMBOL` | No `__obixAbiInvoker` registered, or function identifier missing |
| `INVOCATION_FAILED` | The ABI invoker threw during dispatch |

Each error includes the full `InvocationEnvelope` for debugging at ABI boundaries.

## Schema capabilities by mode

| Capability | `monoglot` | `hybrid` | `polyglot` |
|-----------|-----------|---------|-----------|
| `wasmEnabled` | No | Yes | Yes |
| `cImportEnabled` | No | Yes | Yes |
| `comptimeEvalEnabled` | Yes | Yes | Yes |
| `supportsMultiLanguage` | No | Yes | Yes |

## Development

```bash
npm run build
npm test
```

## Documentation

In-depth guides live in [`docs/`](docs/):

| # | Guide |
|---|-------|
| 01 | [Overview](docs/01-overview.md) |
| 02 | [Installation and Setup](docs/02-installation-and-setup.md) |
| 03 | [Binding Lifecycle and Configuration](docs/03-binding-lifecycle.md) |
| 04 | [FFI Transport and the ABI Boundary](docs/04-ffi-transport-and-abi.md) |
| 05 | [Schema Modes](docs/05-schema-modes.md) |
| 06 | [Runtime Features](docs/06-runtime-features.md) |
| 07 | [Best Practices](docs/07-best-practices.md) |

---

## License

MIT

<!-- obix-release:begin — generated by scripts/release/prepare.mjs; edit the text above this line -->

## Installation

```bash
npm install obix-binding-zig
```

> **Not yet on npm.** The OBIX packages are prepared for publication and are published only on the owner's authorisation; until then this is the command the published package will answer to.

## API surface

- `obix-binding-zig` — 6 value exports: `createArenaAllocator`, `createComptimeCache`, `createFFITransport`, `createSchemaResolver`, `createZigBinding`, `normalizeFunctionIdentifier`
- Type declarations: `./dist/index.d.ts` (and a declaration next to every JS entry point).

## Architecture role

`obix-binding-zig` is a **binding**: it connects OBIX to another syntax, paradigm or language.

The architecture of OBIX — the package families and which packages are public API — is indexed in the umbrella: [docs/architecture.md](https://github.com/obinexus/obix/blob/main/docs/architecture.md).

## Package relationships

- Depends on (OBIX): no other OBIX package.
- Used by (OBIX): no other OBIX package.

## Testing

- 5 test files ship in the npm package (`__tests__/`): they are the evidence of the package's contract, published so that its verification can be read — not runtime code (no entry point reaches them).
- Run them with `npm test` (`vitest run`) in the OBIX monorepo, which provides the test tooling (Node's test runner, Vitest, TypeScript).

## Documentation

- [docs/01-overview.md](docs/01-overview.md)
- [docs/02-installation-and-setup.md](docs/02-installation-and-setup.md)
- [docs/03-binding-lifecycle.md](docs/03-binding-lifecycle.md)
- [docs/04-ffi-transport-and-abi.md](docs/04-ffi-transport-and-abi.md)
- [docs/05-schema-modes.md](docs/05-schema-modes.md)
- [docs/06-runtime-features.md](docs/06-runtime-features.md)
- [docs/07-best-practices.md](docs/07-best-practices.md)
- [CHANGELOG.md](CHANGELOG.md)
- The OBIX architecture index: [obix/docs/architecture.md](https://github.com/obinexus/obix/blob/main/docs/architecture.md)

## Repository

- https://github.com/obinexus/obix-binding-zig — `git@github.com:obinexus/obix-binding-zig.git`
- Issues: https://github.com/obinexus/obix-binding-zig/issues
- The repository is a clean export of the package from the OBIX monorepo; its lineage (the monorepo commit it was exported from, the sources it was recovered from, earlier names) is in `PROVENANCE.json`.

## License

MIT — see [LICENSE](LICENSE).

<!-- obix-release:end -->
