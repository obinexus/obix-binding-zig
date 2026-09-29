import { describe, expect, it } from 'vitest';
import { createSchemaResolver } from '../src/schema-resolver';

describe('createSchemaResolver', () => {
  it('resolve returns correct shape for monoglot mode', () => {
    const resolver = createSchemaResolver({ schemaMode: 'monoglot', zigVersion: '0.13' });
    expect(resolver.resolve()).toEqual({
      mode: 'monoglot',
      zigVersion: '0.13',
      supportsMultiLanguage: false,
      wasmEnabled: false,
      cImportEnabled: false,
      comptimeEvalEnabled: true,
    });
  });

  it('resolve returns correct shape for polyglot mode', () => {
    const resolver = createSchemaResolver({ schemaMode: 'polyglot', zigVersion: '0.12' });
    expect(resolver.resolve()).toEqual({
      mode: 'polyglot',
      zigVersion: '0.12',
      supportsMultiLanguage: true,
      wasmEnabled: true,
      cImportEnabled: true,
      comptimeEvalEnabled: true,
    });
  });

  it('resolve returns correct shape for hybrid mode', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid' });
    expect(resolver.resolve()).toEqual({
      mode: 'hybrid',
      zigVersion: 'unknown',
      supportsMultiLanguage: true,
      wasmEnabled: true,
      cImportEnabled: true,
      comptimeEvalEnabled: true,
    });
  });

  it('comptimeEvalEnabled is always true regardless of mode', () => {
    for (const mode of ['monoglot', 'polyglot', 'hybrid'] as const) {
      const resolver = createSchemaResolver({ schemaMode: mode });
      expect(resolver.resolve().comptimeEvalEnabled).toBe(true);
    }
  });

  it('validate returns true for valid schema modes', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid' });
    expect(resolver.validate('monoglot')).toBe(true);
    expect(resolver.validate('polyglot')).toBe(true);
    expect(resolver.validate('hybrid')).toBe(true);
  });

  it('validate returns false for invalid schema mode', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid' });
    expect(resolver.validate('unknown' as any)).toBe(false);
    expect(resolver.validate('' as any)).toBe(false);
  });

  it('getMode returns configured mode', () => {
    const resolver = createSchemaResolver({ schemaMode: 'polyglot' });
    expect(resolver.getMode()).toBe('polyglot');
  });

  it('destroy does not throw', () => {
    const resolver = createSchemaResolver({ schemaMode: 'hybrid' });
    expect(() => resolver.destroy()).not.toThrow();
  });
});
