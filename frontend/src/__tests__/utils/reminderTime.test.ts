import { isoToLocalInput, localInputToIso, whenLabel } from '@/utils/reminderTime';

describe('reminderTime helpers', () => {
  it('isoToLocalInput handles empty and invalid input', () => {
    expect(isoToLocalInput()).toBe('');
    expect(isoToLocalInput(null)).toBe('');
    expect(isoToLocalInput('not-a-date')).toBe('');
    expect(isoToLocalInput('2026-06-01T09:05:00Z')).toMatch(/^2026-06-01T\d\d:\d\d$/);
  });

  it('localInputToIso handles empty and invalid input', () => {
    expect(localInputToIso('')).toBeNull();
    expect(localInputToIso('nonsense')).toBeNull();
    expect(localInputToIso('2026-06-01T09:00')).toBe(new Date('2026-06-01T09:00').toISOString());
  });

  it('whenLabel handles empty and invalid input', () => {
    expect(whenLabel()).toBe('');
    expect(whenLabel('bad')).toBe('');
    expect(whenLabel('2026-06-01T09:00:00Z')).not.toBe('');
  });
});
