import { describe, expect, it } from 'vitest';
import { getTextRevealDelay } from './EventLog';

describe('EventLog text speed', () => {
  it('maps settings to reveal delays', () => {
    expect(getTextRevealDelay('instant')).toBe(0);
    expect(getTextRevealDelay('normal')).toBe(22);
    expect(getTextRevealDelay('slow')).toBeGreaterThan(getTextRevealDelay('normal'));
  });
});
