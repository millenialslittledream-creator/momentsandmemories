import { eventTypes, type EventType } from '@/data/eventFields';

export interface EventOccurrence {
  index: number;
  name: string;
  date: string;
  time: string;
  timezone: string;
  venue: string;
  guestCount: string;
}

export function getEventOccurrences(
  eventType: EventType | null | undefined,
  formData: Record<string, string>,
): EventOccurrence[] {
  const defaultMainName = eventType === 'custom'
    ? formData.eventName?.trim() || 'Main Event'
    : eventTypes.find((event) => event.id === eventType)?.label || 'Main Event';
  const occurrences: EventOccurrence[] = [{
    index: 0,
    name: defaultMainName,
    date: formData.eventDate || '',
    time: formData.eventTime || '',
    timezone: formData.timezone || '',
    venue: formData.venue || '',
    guestCount: formData.guestCount || '',
  }];

  const additionalCount = parseInt(formData.sub_events_count || '0', 10) || 0;
  for (let index = 0; index < additionalCount; index += 1) {
    occurrences.push({
      index: index + 1,
      name: formData[`sub_${index}_name`]?.trim() || `Event ${index + 2}`,
      date: formData[`sub_${index}_date`] || '',
      time: formData[`sub_${index}_time`] || '',
      timezone: formData[`sub_${index}_timezone`] || '',
      venue: formData[`sub_${index}_venue`] || '',
      guestCount: formData[`sub_${index}_guestCount`] || '',
    });
  }

  return occurrences;
}

export function getSingleEventFormData(
  eventType: EventType | null | undefined,
  formData: Record<string, string>,
  occurrence: EventOccurrence,
): Record<string, string> {
  const singleEventData = Object.fromEntries(
    Object.entries(formData).filter(([key]) => key !== 'sub_events_count' && !/^sub_\d+_/.test(key)),
  );

  return {
    ...singleEventData,
    ...(eventType === 'custom' ? { eventName: occurrence.name } : {}),
    eventDate: occurrence.date,
    eventTime: occurrence.time,
    timezone: occurrence.timezone,
    venue: occurrence.venue,
    guestCount: occurrence.guestCount,
    publishedEventName: occurrence.name,
    sub_events_count: '0',
  };
}
