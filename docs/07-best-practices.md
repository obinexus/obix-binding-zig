# Best Practices

- **Install `__obixAbiInvoker` before `invoke()`.** Without it every call
  returns `MISSING_SYMBOL`. In tests, stub it; in production the host runtime
  provides it. See [02-installation-and-setup.md](02-installation-and-setup.md).
- **Check the result shape.** `invoke` returns either the native value or a
  `BindingInvokeError` — narrow on `'code' in result` before trusting it.
- **Keep `args` JSON-serialisable.** The envelope is `JSON.stringify`-d across
  the boundary; functions, `BigInt`, cycles, and class instances won't survive.
- **Pick the narrowest `schemaMode`.** Use `monoglot` unless you actually need
  cross-language marshalling — it skips the polyglot machinery.
- **Always `await binding.destroy()`.** It tears down every sub-module and clears state; the instance is single-use.
- **Treat memory/stat snapshots as advisory.** `getMemoryUsage()` mirrors what the
  native side reports — it is not a direct read of the Zig runtime.
- **Guard optional native paths.** Sub-module factories assume the ABI layer feeds them; with no native side they simply report zeros.
