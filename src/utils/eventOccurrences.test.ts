import { describe, expect, it } from 'vitest';
import { getEventOccurrences, getSingleEventFormData } from './eventOccurrences';

const wedding = {
  brideName: 'Asha',
  groomName: 'Ravi',
  eventDate: '2027-03-12',
  eventTime: '18:00',
  timezone: 'PT',
  venue: 'Garden Hall',
  guestCount: '40',
  sub_events_count: '2',
  sub_0_name: 'Sangeet',
  sub_0_date: '2027-03-13',
  sub_0_time: '19:00',
  sub_0_timezone: 'PT',
  sub_0_venue: 'Music Hall',
  sub_0_guestCount: '60',
  sub_1_name: 'Reception',
  sub_1_date: '2027-03-14',
  sub_1_time: '20:00',
  sub_1_timezone: 'PT',
  sub_1_venue: 'Grand Ballroom',
  sub_1_guestCount: '100',
};

describe('event occurrences', () => {
  it('counts the primary event plus every additional event', () => {
    expect(getEventOccurrences('marriage', wedding).map((event) => event.name)).toEqual([
      'Wedding',
      'Sangeet',
      'Reception',
    ]);
  });

  it('creates a standalone form payload for each published event', () => {
    const reception = getEventOccurrences('marriage', wedding)[2];
    const result = getSingleEventFormData('marriage', wedding, reception);

    expect(result).toMatchObject({
      brideName: 'Asha',
      eventDate: '2027-03-14',
      eventTime: '20:00',
      timezone: 'PT',
      venue: 'Grand Ballroom',
      guestCount: '100',
      publishedEventName: 'Reception',
      sub_events_count: '0',
    });
    expect(result).not.toHaveProperty('sub_0_name');
    expect(result).not.toHaveProperty('sub_1_name');
  });
});
