import { describe, expect, it } from 'vitest';
import { TIMEZONE_OPTIONS } from '@/data/eventFields';
import { buildTimeOptions } from './DateTimePicker';

describe('DateTimePicker scheduling options', () => {
  it('starts the time list at 7:00 AM and keeps 15-minute intervals', () => {
    const options = buildTimeOptions();

    expect(options).toHaveLength(96);
    expect(options.slice(0, 4)).toEqual(['07:00', '07:15', '07:30', '07:45']);
    expect(options.at(-1)).toBe('06:45');
  });

  it('only offers the approved timezones', () => {
    expect(TIMEZONE_OPTIONS).toEqual(['PT', 'MT', 'CT', 'ET']);
  });
});
