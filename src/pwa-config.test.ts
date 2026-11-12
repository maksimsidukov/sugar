import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('PWA update mode', () => {
  it('использует явный prompt вместо автоматической перезагрузки с несохранённым вводом', () => {
    const config = readFileSync(new URL('../vite.config.ts', import.meta.url), 'utf8');
    expect(config).toContain("registerType: 'prompt'");
    expect(config).not.toMatch(/skipWaiting:\s*true/);
    expect(config).not.toMatch(/clientsClaim:\s*true/);
  });
});
