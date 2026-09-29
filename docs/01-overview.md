# Zig Binding Overview

`obix-binding-zig` is a TypeScript binding that connects the **native FFI /
polyglot ABI bridge** to a Zig runtime, for systems programming and compile-time optimisation.

## What it does

The binding is a thin, typed control plane over one native entry point. It:

- Builds a structured **invocation envelope** for every call.
- Dispatches envelopes across the ABI boundary via `globalThis.__obixAbiInvoker`.
- Returns **typed error objects** instead of throwing at the FFI edge.
- Resolves interop capabilities from a **schema mode** (`monoglot` /
  `polyglot` / `hybrid`).
- Tracks Zig-runtime state (memory / concurrency) through dedicated helpers.

It does **not** embed a Zig runtime itself — it marshals calls to whatever
native library `ffiPath` points at and records what that library reports back.

## Capabilities

1. Lifecycle: `initialize` / `invoke` / `destroy` / `isInitialized`
2. FFI transport — envelope build + dispatch
3. Schema-mode resolution and validation
4. Typed error model at the ABI boundary
5. Arena Allocation and the Comptime Cache

## Module map

| Accessor | Type | Responsibility |
|----------|------|----------------|
| `ffiTransport` | `FFITransportAPI` | Envelope builder and ABI dispatcher |
| `arenaAllocator` | `ArenaAllocatorAPI` | Arena/bump allocation bookkeeping |
| `comptimeCache` | `ComptimeCacheAPI` | Cache of comptime-evaluated results |
| `schemaResolver` | `ZigSchemaResolverAPI` | Schema-mode resolver and validator |

See [03-binding-lifecycle.md](03-binding-lifecycle.md) for the full bridge API.
