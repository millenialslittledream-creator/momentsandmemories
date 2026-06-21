import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BookBuilder from './index';

vi.mock('@/lib/api', () => ({
  api: {
    listInvitationBooks: vi.fn(() => Promise.resolve([])),
    getInvitationBook: vi.fn(),
    createInvitationBook: vi.fn(() => Promise.resolve({ id: 'book-1' })),
    updateInvitationBook: vi.fn(() => Promise.resolve({})),
    uploadMedia: vi.fn(() => Promise.resolve({ public_url: '/uploaded.jpg' })),
  },
}));

import { api } from '@/lib/api';

describe('BookBuilder frame picker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with no pages and no frame swatches to pick from', async () => {
    render(<BookBuilder eventId="event-1" eventTitle="Alex & Sam" onClose={() => {}} />);
    await waitFor(() => expect(api.listInvitationBooks).toHaveBeenCalled());
    expect(screen.getByText('No pages yet — add images to build your book')).toBeInTheDocument();
  });

  it('lets the host pick a frame for an uploaded page and persists it via autosave', async () => {
    const user = userEvent.setup();
    render(<BookBuilder eventId="event-1" eventTitle="Alex & Sam" onClose={() => {}} />);
    await waitFor(() => expect(api.listInvitationBooks).toHaveBeenCalled());

    const addButton = screen.getByText('Add Page(s)');
    const fileInput = addButton.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    await user.upload(fileInput, file);

    await waitFor(() => expect(screen.getByText('Page 1')).toBeInTheDocument());

    await waitFor(() => expect(api.createInvitationBook).toHaveBeenCalled(), { timeout: 3000 });

    const sageSwatch = screen.getByLabelText('Sage Hairline');
    await user.click(sageSwatch);

    await waitFor(() => {
      const calls = (api.updateInvitationBook as ReturnType<typeof vi.fn>).mock.calls;
      const lastCall = calls[calls.length - 1]?.[1];
      expect(lastCall?.pages?.[0]?.frame).toBe('sage-hairline');
    }, { timeout: 3000 });
  });
});
