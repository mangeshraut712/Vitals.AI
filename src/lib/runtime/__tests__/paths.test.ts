import { afterEach, describe, expect, it } from 'vitest';
import { getBasePath, withBasePath } from '@/lib/runtime/paths';

const ORIGINAL_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH;

afterEach(() => {
  if (ORIGINAL_BASE_PATH === undefined) {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
  } else {
    process.env.NEXT_PUBLIC_BASE_PATH = ORIGINAL_BASE_PATH;
  }
});

describe('withBasePath', () => {
  it('returns the path unchanged when no base path is set', () => {
    delete process.env.NEXT_PUBLIC_BASE_PATH;
    expect(getBasePath()).toBe('');
    expect(withBasePath('/api/chat')).toBe('/api/chat');
  });

  it('prefixes GitHub Pages project paths', () => {
    process.env.NEXT_PUBLIC_BASE_PATH = '/Vitals.AI/';
    expect(getBasePath()).toBe('/Vitals.AI');
    expect(withBasePath('/api/chat')).toBe('/Vitals.AI/api/chat');
    expect(withBasePath('manifest.json')).toBe('/Vitals.AI/manifest.json');
  });
});
