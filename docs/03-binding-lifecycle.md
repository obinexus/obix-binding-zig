# Binding Lifecycle and Configuration

## Factory

```ts
const binding = createZigBinding(config);
```

## `ZigBindingConfig`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ffiPath` | `string` | **required** | Path to the native bridge shared library |
| `schemaMode` | `'monoglot' \| 'polyglot' \| 'hybrid'` | **required** | Polyglot interop mode |
| `arenaChunkSize` | `number` | — | Arena allocator chunk size |
| `comptimeCacheMax` | `number` | — | Max entries in the comptime result cache |
| `zigVersion` | `string` | — | Zig version for the schema resolver |

## Lifecycle methods

| Method | Description |
|--------|-------------|
| `initialize(): Promise<void>` | Validates `ffiPath` (non-empty string) and `schemaMode` (valid enum). **Throws** on invalid input. Marks the binding ready. |
| `invoke(fn, args): Promise<unknown>` | Build an envelope for `fn` and dispatch it. Returns the native result, or a `BindingInvokeError` object — **never throws**. |
| `destroy(): Promise<void>` | Tear down every sub-module and mark the binding uninitialised. Not reusable afterwards. |
| `isInitialized(): boolean` | Ready state. |
| `getSchemaMode(): SchemaMode` | The resolved schema mode. |
| `getMemoryUsage()` | Zig memory snapshot (`ZigMemoryStats`). |

`fn` may be a string, or an object with `functionId` / `id` / `name` — see
[04-ffi-transport-and-abi.md](04-ffi-transport-and-abi.md).

## Sub-module accessors

```ts
binding.ffiTransport        // FFITransportAPI
binding.arenaAllocator      // ArenaAllocatorAPI
binding.comptimeCache       // ComptimeCacheAPI
binding.schemaResolver      // ZigSchemaResolverAPI
```

## Example

```ts
const binding = createZigBinding({
  ffiPath: '/opt/lib/libnativebridge.so',
  schemaMode: 'polyglot',
  memoryModel: 'hybrid',
});

await binding.initialize();
const result = await binding.invoke('renderFrame', [1920, 1080]);
console.log(binding.getMemoryUsage());
await binding.destroy();
```
