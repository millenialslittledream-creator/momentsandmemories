import type { EventType } from '@/data/eventFields';

type EventFormData = Record<string, unknown>;

const EVENT_LABELS: Record<EventType, string> = {
  birthday: 'Birthday',
  marriage: 'Wedding',
  babyshower: 'Baby Shower',
  bridetobe: 'Pre-Wedding Party',
  genderreveal: 'Gender Reveal',
  housewarming: 'Housewarming',
  custom: 'Event',
};

function value(data: EventFormData, key: string): string {
  const raw = data[key];
  return typeof raw === 'string' ? raw.trim() : '';
}

function possessive(name: string): string {
  return name ? `${name}${/s$/i.test(name) ? "'" : "'s"}` : '';
}

export function inferEventType(
  formData: EventFormData,
  explicitType?: EventType | null,
): EventType | undefined {
  if (explicitType) return explicitType;
  if (value(formData, 'brideName') || value(formData, 'groomName')) return 'marriage';
  if (value(formData, 'babyGender') || value(formData, 'registryLink')) return 'babyshower';
  if (value(formData, 'motherName') || value(formData, 'fatherName')) return 'genderreveal';
  if (value(formData, 'homeownerName')) return 'housewarming';
  if (value(formData, 'eventName')) return 'custom';
  if (value(formData, 'celebrantName')) return 'birthday';
  return undefined;
}

export function getEventDisplayTitle(
  eventType: EventType | null | undefined,
  formData: EventFormData,
  fallback = 'My Event',
): string {
  if (eventType === 'marriage') {
    const couple = [value(formData, 'brideName'), value(formData, 'groomName')].filter(Boolean);
    return couple.join(' & ') || fallback;
  }

  const primaryName =
    value(formData, 'celebrantName') ||
    value(formData, 'eventName') ||
    value(formData, 'motherName') ||
    value(formData, 'parentNames') ||
    value(formData, 'homeownerName') ||
    value(formData, 'hostName');

  if (eventType === 'custom') return value(formData, 'eventName') || fallback;
  return primaryName && eventType
    ? `${possessive(primaryName)} ${EVENT_LABELS[eventType]}`
    : primaryName || (eventType ? EVENT_LABELS[eventType] : fallback);
}

export function getInvitationSentence(
  eventType: EventType | null | undefined,
  formData: EventFormData,
  fallbackTitle: string,
): string {
  if (eventType === 'marriage') {
    const couple = [value(formData, 'brideName'), value(formData, 'groomName')].filter(Boolean);
    if (couple.length === 2) return `You are invited to ${couple[0]} and ${possessive(couple[1])} wedding.`;
    if (couple.length === 1) return `You are invited to ${possessive(couple[0])} wedding.`;
  }

  const celebrant = value(formData, 'celebrantName');
  if (eventType === 'birthday' && celebrant) {
    return `You are invited to ${possessive(celebrant)} birthday party.`;
  }
  if (eventType === 'babyshower' && celebrant) {
    return `You are invited to ${possessive(celebrant)} baby shower.`;
  }
  if (eventType === 'bridetobe' && celebrant) {
    return `You are invited to ${possessive(celebrant)} pre-wedding celebration.`;
  }
  if (eventType === 'genderreveal') {
    const parents = [value(formData, 'motherName'), value(formData, 'fatherName')].filter(Boolean);
    if (parents.length === 2) return `You are invited to ${parents[0]} and ${possessive(parents[1])} gender reveal.`;
    if (parents.length === 1) return `You are invited to ${possessive(parents[0])} gender reveal.`;
  }
  if (eventType === 'housewarming') {
    const homeowner = value(formData, 'homeownerName');
    if (homeowner) return `You are invited to ${possessive(homeowner)} housewarming.`;
  }

  const customName = value(formData, 'eventName');
  return `You are invited to ${customName || fallbackTitle}.`;
}
