# Arena Allocation and the Comptime Cache

## Arena allocator

`binding.arenaAllocator` models Zig's arena pattern: allocations are grouped into
chunks (`arenaChunkSize`) and released together with `reset()` rather than
individually. `getMemoryUsage()` returns the arena's live bytes, chunk count, and
high-water mark.

## Comptime cache

`binding.comptimeCache` memoises results the native side marks as
compile-time-evaluable, keyed by call signature, up to `comptimeCacheMax`
entries. Repeated identical invocations return the cached value without crossing
the FFI boundary again.
