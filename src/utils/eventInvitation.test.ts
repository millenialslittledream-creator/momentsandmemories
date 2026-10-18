import { describe, expect, it } from 'vitest';
import {
  getEventDisplayTitle,
  getInvitationHeadingParts,
  getInvitationSentence,
  inferEventType,
} from './eventInvitation';

describe('event invitation copy', () => {
  it('uses both partners in wedding titles and invitation sentences', () => {
    const formData = { brideName: 'Lavanya', groomName: 'Jeevan' };
    expect(inferEventType(formData)).toBe('marriage');
    expect(getEventDisplayTitle('marriage', formData)).toBe('Lavanya & Jeevan');
    expect(getInvitationSentence('marriage', formData, 'Wedding')).toBe(
      "You are invited to Lavanya and Jeevan's wedding.",
    );
  });

  it('writes an occasion-specific birthday sentence', () => {
    const formData = { celebrantName: 'Jeevan' };
    expect(getInvitationSentence('birthday', formData, 'Birthday')).toBe(
      "You are invited to Jeevan's birthday party.",
    );
    expect(getInvitationHeadingParts('birthday', formData, 'Birthday')).toMatchObject({
      names: 'Jeevan',
      occasionLabel: 'Birthday Party',
    });
  });

  it.each([
    ['marriage', { brideName: 'Lavanya', groomName: 'Jeevan' }, 'Lavanya and Jeevan', 'Wedding'],
    ['babyshower', { celebrantName: 'Ananya' }, 'Ananya', 'Baby Shower'],
    ['bridetobe', { brideName: 'Maya', groomName: 'Arjun' }, 'Maya and Arjun', 'Pre-Wedding Celebration'],
    ['genderreveal', { motherName: 'Asha', fatherName: 'Ravi' }, 'Asha and Ravi', 'Gender Reveal'],
    ['housewarming', { homeownerName: 'The Shah Family' }, 'The Shah Family', 'Housewarming'],
    ['custom', { eventName: 'Graduation Dinner' }, 'Graduation Dinner', 'Celebration'],
  ] as const)('separates the %s name from its occasion label', (eventType, formData, names, occasionLabel) => {
    expect(getInvitationHeadingParts(eventType, formData, 'Celebration')).toMatchObject({
      lead: 'You are invited to ',
      names,
      occasionLabel,
    });
  });

  it('uses stored event type metadata for uploaded invitations', () => {
    expect(inferEventType({ eventType: 'babyshower', celebrantName: 'Ananya' })).toBe('babyshower');
  });

  it('uses both names for pre-wedding display titles', () => {
    expect(getEventDisplayTitle('bridetobe', { brideName: 'Maya', groomName: 'Arjun' })).toBe('Maya & Arjun');
  });

  it('falls back to the saved title for older events', () => {
    expect(getInvitationSentence(undefined, {}, 'Garden Celebration')).toBe(
      'You are invited to Garden Celebration.',
    );
  });
});
