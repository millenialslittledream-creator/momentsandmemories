import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import WebsiteBuilder from './index';

vi.mock('@/lib/api', () => ({
  api: {
    listEventWebsites: vi.fn(() => Promise.resolve([])),
    getEventWebsite: vi.fn(),
    createEventWebsite: vi.fn(() => Promise.resolve({ id: 'site-1', slug: 'test-slug' })),
    updateEventWebsite: vi.fn(() => Promise.resolve({})),
    uploadMedia: vi.fn(),
  },
}));

import { api } from '@/lib/api';

describe('WebsiteBuilder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts empty and shows the no-sections state', async () => {
    render(<WebsiteBuilder eventId="event-1" eventTitle="Alex & Sam's Wedding" onClose={() => {}} />);
    await waitFor(() => expect(api.listEventWebsites).toHaveBeenCalled());
    expect(screen.getByText('No sections yet')).toBeInTheDocument();
  });

  it('adds a hero section and edits its heading', async () => {
    const user = userEvent.setup();
    render(<WebsiteBuilder eventId="event-1" eventTitle="Alex & Sam's Wedding" onClose={() => {}} />);
    await waitFor(() => expect(api.listEventWebsites).toHaveBeenCalled());

    await user.click(screen.getByText('+ Add Section'));
    await user.click(screen.getByText('Hero / Cover'));

    expect(screen.queryByText('Select a section to edit')).not.toBeInTheDocument();
    const headingInput = screen.getByDisplayValue("Let's Celebrate");
    await user.clear(headingInput);
    await user.type(headingInput, 'Welcome to our wedding');

    await waitFor(() => {
      expect(screen.getByText('Welcome to our wedding')).toBeInTheDocument();
    });
  });

  it('removes a section', async () => {
    const user = userEvent.setup();
    render(<WebsiteBuilder eventId="event-1" eventTitle="Alex & Sam's Wedding" onClose={() => {}} />);
    await waitFor(() => expect(api.listEventWebsites).toHaveBeenCalled());

    await user.click(screen.getByText('+ Add Section'));
    await user.click(screen.getByText('FAQ'));
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Remove section'));
    expect(screen.getByText('No sections yet')).toBeInTheDocument();
  });

  it('publishing calls createEventWebsite with published true', async () => {
    const user = userEvent.setup();
    render(<WebsiteBuilder eventId="event-1" eventTitle="Alex & Sam's Wedding" onClose={() => {}} />);
    await waitFor(() => expect(api.listEventWebsites).toHaveBeenCalled());

    await user.click(screen.getByText('Publish'));

    await waitFor(() => {
      expect(api.createEventWebsite).toHaveBeenCalledWith(
        expect.objectContaining({ event_id: 'event-1', published: true })
      );
    });
  });
});
