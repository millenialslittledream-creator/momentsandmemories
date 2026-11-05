import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ updateEvent: vi.fn(), deleteEvent: vi.fn() }));
vi.mock('@/lib/api', () => ({ api: { updateEvent: mocks.updateEvent, deleteEvent: mocks.deleteEvent } }));

import EventManageActions from '@/sections/dashboard/EventManageActions';

function setup(status: string) {
  const onStatusChange = vi.fn();
  const onDeleted = vi.fn();
  render(
    <EventManageActions event={{ id: 'evt-1', title: 'Ana & Ben', status }} onStatusChange={onStatusChange} onDeleted={onDeleted} />,
  );
  return { onStatusChange, onDeleted };
}

describe('EventManageActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.updateEvent.mockResolvedValue({ id: 'evt-1' });
    mocks.deleteEvent.mockResolvedValue({ deleted: true });
  });

  it('shows Unpublish and Delete for a published evite, and unpublishes it to a private draft', async () => {
    const { onStatusChange } = setup('published');
    expect(screen.queryByRole('button', { name: /^publish/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /unpublish/i }));
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('evt-1', 'draft'));
    expect(mocks.updateEvent).toHaveBeenCalledWith('evt-1', { status: 'draft' });
  });

  it('offers Publish again for a private (draft) evite', async () => {
    const { onStatusChange } = setup('draft');
    expect(screen.queryByRole('button', { name: /unpublish/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /publish/i }));
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('evt-1', 'published'));
    expect(mocks.updateEvent).toHaveBeenCalledWith('evt-1', { status: 'published' });
  });

  it('does not let the host re-publish an evite an admin archived (delete is still available)', () => {
    setup('archived');
    expect(screen.queryByRole('button', { name: /publish/i })).toBeNull();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('asks before deleting and spells out what is lost; Keep it deletes nothing', async () => {
    const { onDeleted } = setup('published');
    fireEvent.click(screen.getByRole('button', { name: /^delete/i }));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Ana & Ben');
    expect(dialog).toHaveTextContent(/guest list, RSVPs, messages and shared photos/i);
    expect(dialog).toHaveTextContent(/cannot be undone/i);

    fireEvent.click(screen.getByRole('button', { name: /keep it/i }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(mocks.deleteEvent).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('deletes only after confirming', async () => {
    const { onDeleted } = setup('published');
    fireEvent.click(screen.getByRole('button', { name: /^delete/i }));
    fireEvent.click(await screen.findByRole('button', { name: /delete evite/i }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('evt-1'));
    expect(mocks.deleteEvent).toHaveBeenCalledWith('evt-1');
  });

  it('shows the error on the page and changes nothing when the server refuses', async () => {
    mocks.deleteEvent.mockRejectedValue(new Error('Event not found'));
    mocks.updateEvent.mockRejectedValue(new Error('Network down'));
    const { onDeleted, onStatusChange } = setup('published');

    fireEvent.click(screen.getByRole('button', { name: /unpublish/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');

    fireEvent.click(screen.getByRole('button', { name: /^delete/i }));
    fireEvent.click(await screen.findByRole('button', { name: /delete evite/i }));
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Event not found'));
    expect(onDeleted).not.toHaveBeenCalled();
    expect(onStatusChange).not.toHaveBeenCalled();
  });
});
