import { describe, expect, it } from 'vitest';
import {
  formatCurrency,
  getLocalDateKey,
  getRecentDateKeys,
  getSafeErrorMessage,
  normalizeSearchText,
  shouldRotatePushSubscription,
} from '../src/lib/productUtils';

describe('product utilities', () => {
  it('formats a stable local date key', () => {
    expect(getLocalDateKey(new Date(2026, 8, 9))).toBe('2026-09-09');
  });

  it('returns recent date keys including today without mutating the input date', () => {
    const now = new Date(2026, 8, 9, 12);
    expect([...getRecentDateKeys(3, now)]).toEqual(['2026-09-09', '2026-09-08', '2026-09-07']);
    expect(now.getDate()).toBe(9);
  });

  it('normalizes Czech accents and whitespace for search', () => {
    expect(normalizeSearchText('  Žhavé Přání  ')).toBe('zhave prani');
  });

  it('formats invalid currency values as zero instead of NaN', () => {
    expect(formatCurrency('not-a-number')).toContain('0');
  });

  it('does not surface oversized technical error payloads', () => {
    expect(getSafeErrorMessage({ message: 'x'.repeat(241) })).toBe('Akce se nepodařila. Zkus to prosím znovu.');
  });

  it('rotates a subscription when the public VAPID key changes or is unknown', () => {
    expect(shouldRotatePushSubscription(null, 'current-key')).toBe(true);
    expect(shouldRotatePushSubscription('old-key', 'current-key')).toBe(true);
    expect(shouldRotatePushSubscription('current-key', 'current-key')).toBe(false);
  });
});
