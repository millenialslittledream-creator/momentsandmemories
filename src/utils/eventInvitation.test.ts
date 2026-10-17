import { describe, expect, it } from 'vitest';
import { getEventDisplayTitle, getInvitationSentence, inferEventType } from './eventInvitation';

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
  });

  it('falls back to the saved title for older events', () => {
    expect(getInvitationSentence(undefined, {}, 'Garden Celebration')).toBe(
      'You are invited to Garden Celebration.',
    );
  });
});
