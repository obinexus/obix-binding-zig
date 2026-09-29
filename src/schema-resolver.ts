import type {
  SchemaMode,
  ZigResolvedSchema,
  ZigSchemaResolverAPI,
  ZigSchemaResolverConfig,
} from './types.js';

const VALID_MODES: readonly SchemaMode[] = ['monoglot', 'polyglot', 'hybrid'];

export function createSchemaResolver(config: ZigSchemaResolverConfig): ZigSchemaResolverAPI {
  const mode = config.schemaMode;

  return {
    resolve(): ZigResolvedSchema {
      return {
        mode,
        zigVersion: config.zigVersion ?? 'unknown',
        supportsMultiLanguage: mode === 'polyglot' || mode === 'hybrid',
        wasmEnabled: mode !== 'monoglot',
        cImportEnabled: mode === 'polyglot' || mode === 'hybrid',
        comptimeEvalEnabled: true,
      };
    },

    validate(m: SchemaMode): boolean {
      return (VALID_MODES as readonly string[]).includes(m);
    },

    getMode(): SchemaMode {
      return mode;
    },

    destroy(): void {
      // Stateless
    },
  };
}
