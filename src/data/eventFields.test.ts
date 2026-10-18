import { describe, expect, it } from 'vitest';
import { eviteTemplates } from './eviteTemplates';
import { getEditorFields, type EventField, type EventType } from './eventFields';

function requiredFieldNames(eventType: EventType, templateId?: string): Set<string> {
  return new Set(
    getEditorFields(eventType, templateId)
      .filter((field: EventField) => field.required)
      .map((field: EventField) => field.name),
  );
}

function hasRequiredIdentity(eventType: EventType, names: Set<string>): boolean {
  if (eventType === 'marriage') return names.has('brideName') && names.has('groomName');
  if (eventType === 'bridetobe') {
    return names.has('celebrantName') || (names.has('brideName') && names.has('groomName'));
  }
  if (eventType === 'birthday' || eventType === 'babyshower') return names.has('celebrantName');
  if (eventType === 'genderreveal') return names.has('motherName');
  if (eventType === 'housewarming') return names.has('homeownerName');
  return names.has('eventName');
}

describe('evite identity fields', () => {
  it('collects a required identity for every stock template', () => {
    for (const template of eviteTemplates) {
      const required = requiredFieldNames(template.eventType, template.id);
      expect(
        hasRequiredIdentity(template.eventType, required),
        `${template.id} must collect the identity used by its public evite`,
      ).toBe(true);
    }
  });

  it('restores names for templates whose artwork does not print them', () => {
    expect(requiredFieldNames('babyshower', 'baby-c1').has('celebrantName')).toBe(true);
    expect(requiredFieldNames('babyshower', 'baby-c13').has('celebrantName')).toBe(true);
    expect(requiredFieldNames('birthday', 'bday-c7').has('celebrantName')).toBe(true);
    expect(requiredFieldNames('birthday', 'bday-c11').has('celebrantName')).toBe(true);
  });

  it('collects an event name when a stock design is repurposed for a custom event', () => {
    expect(requiredFieldNames('custom').has('eventName')).toBe(true);
  });
});
