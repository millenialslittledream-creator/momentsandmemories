import type { EventType } from '@/data/eventFields';

type EventFormData = Record<string, unknown>;

export interface InvitationHeadingParts {
  lead: string;
  names: string;
  occasion: string;
}

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

function possessiveOccasion(name: string, occasion: string): string {
  return `${/s$/i.test(name) ? "'" : "'s"} ${occasion}.`;
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
  const heading = getInvitationHeadingParts(eventType, formData, fallbackTitle);
  return `${heading.lead}${heading.names}${heading.occasion}`;
}

export function getInvitationHeadingParts(
  eventType: EventType | null | undefined,
  formData: EventFormData,
  fallbackTitle: string,
): InvitationHeadingParts {
  const lead = 'You are invited to ';
  if (eventType === 'marriage') {
    const couple = [value(formData, 'brideName'), value(formData, 'groomName')].filter(Boolean);
    if (couple.length === 2) return { lead, names: `${couple[0]} and ${couple[1]}`, occasion: possessiveOccasion(couple[1], 'wedding') };
    if (couple.length === 1) return { lead, names: couple[0], occasion: possessiveOccasion(couple[0], 'wedding') };
  }

  const celebrant = value(formData, 'celebrantName');
  if (eventType === 'birthday' && celebrant) {
    return { lead, names: celebrant, occasion: possessiveOccasion(celebrant, 'birthday party') };
  }
  if (eventType === 'babyshower' && celebrant) {
    return { lead, names: celebrant, occasion: possessiveOccasion(celebrant, 'baby shower') };
  }
  if (eventType === 'bridetobe' && celebrant) {
    return { lead, names: celebrant, occasion: possessiveOccasion(celebrant, 'pre-wedding celebration') };
  }
  if (eventType === 'genderreveal') {
    const parents = [value(formData, 'motherName'), value(formData, 'fatherName')].filter(Boolean);
    if (parents.length === 2) return { lead, names: `${parents[0]} and ${parents[1]}`, occasion: possessiveOccasion(parents[1], 'gender reveal') };
    if (parents.length === 1) return { lead, names: parents[0], occasion: possessiveOccasion(parents[0], 'gender reveal') };
  }
  if (eventType === 'housewarming') {
    const homeowner = value(formData, 'homeownerName');
    if (homeowner) return { lead, names: homeowner, occasion: possessiveOccasion(homeowner, 'housewarming') };
  }

  const customName = value(formData, 'eventName');
  return { lead, names: customName || fallbackTitle, occasion: '.' };
}
