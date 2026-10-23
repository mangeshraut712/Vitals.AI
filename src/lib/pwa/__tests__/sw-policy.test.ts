import { describe, expect, it } from 'vitest';
import { isCacheableRequest, notificationUrl } from '../sw-policy';

const ORIGIN = 'https://mangeshraut712.github.io';

describe('service worker policy', () => {
  it('caches only same-origin non-API requests', () => {
    expect(isCacheableRequest(`${ORIGIN}/Vitals.AI/dashboard/`, ORIGIN)).toBe(true);
    expect(isCacheableRequest(`${ORIGIN}/Vitals.AI/api/sync`, ORIGIN)).toBe(false);
    expect(isCacheableRequest('https://cdn.example.com/app.js', ORIGIN)).toBe(false);
    expect(isCacheableRequest('data:text/html,hi', ORIGIN)).toBe(false);
  });

  it('opens notification targets only on the app origin', () => {
    expect(notificationUrl('/Vitals.AI/dashboard/', ORIGIN, '/Vitals.AI/dashboard/'))
      .toBe(`${ORIGIN}/Vitals.AI/dashboard/`);
    expect(notificationUrl('https://evil.example/phish', ORIGIN, '/Vitals.AI/dashboard/'))
      .toBe(`${ORIGIN}/Vitals.AI/dashboard/`);
    expect(notificationUrl('javascript:alert(1)', ORIGIN, '/Vitals.AI/dashboard/'))
      .toBe(`${ORIGIN}/Vitals.AI/dashboard/`);
  });
});
