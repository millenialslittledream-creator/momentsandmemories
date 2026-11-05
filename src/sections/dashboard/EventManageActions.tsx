import { useState } from 'react';
import { api } from '@/lib/api';
import InlineNotice, { type Notice } from '@/components/InlineNotice';
import ConfirmDeleteDialog from '@/components/ConfirmDeleteDialog';

interface EventManageActionsProps {
  event: { id: string; title: string; status: string };
  /** Called with the new status after a successful publish / unpublish. */
  onStatusChange: (eventId: string, status: 'draft' | 'published') => void;
  /** Called after the event has been deleted. */
  onDeleted: (eventId: string) => void;
}

const BUTTON =
  'flex-shrink-0 flex items-center gap-1 px-2 md:px-3 py-1.5 border transition-colors font-display text-[9px] tracking-[0.15em] uppercase disabled:opacity-50';
const NEUTRAL = `${BUTTON} border-[#3d4a35]/15 hover:border-[#5f7256]/50 hover:text-[#5f7256] text-[#5a6c50]/70`;
const DANGER = `${BUTTON} border-red-700/20 hover:border-red-700/50 hover:text-red-700 text-red-700/70`;

/**
 * Unpublish / Publish again / Delete controls for one evite on the host's dashboard.
 *  - Unpublish makes the evite private again (the public link and RSVP page stop working) and
 *    keeps the guest list and everything else, so it can be published again later.
 *  - Delete removes the evite for good (with its guests, RSVPs, messages and photos), after a
 *    confirmation that spells out what is lost.
 * Events an admin has archived are left alone: the host cannot re-publish those from here.
 */
export default function EventManageActions({ event, onStatusChange, onDeleted }: EventManageActionsProps) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const changeStatus = async (status: 'draft' | 'published') => {
    setBusy(true);
    setNotice(null);
    try {
      await api.updateEvent(event.id, { status });
      onStatusChange(event.id, status);
    } catch (error) {
      setNotice({
        kind: 'error',
        text: error instanceof Error ? error.message : `Could not ${status === 'draft' ? 'unpublish' : 'publish'} this evite.`,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    setNotice(null);
    try {
      await api.deleteEvent(event.id);
      setConfirmOpen(false);
      onDeleted(event.id);
    } catch (error) {
      setConfirmOpen(false);
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'Could not delete this evite.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {event.status === 'published' && (
        <button
          type="button"
          onClick={() => changeStatus('draft')}
          disabled={busy}
          title="Make this evite private. The link stops working until you publish it again."
          className={NEUTRAL}
        >
          <span className="material-icons text-sm">visibility_off</span>
          <span className="hidden sm:inline">Unpublish</span>
        </button>
      )}
      {event.status === 'draft' && (
        <button
          type="button"
          onClick={() => changeStatus('published')}
          disabled={busy}
          title="Make this evite public again"
          className={NEUTRAL}
        >
          <span className="material-icons text-sm">public</span>
          <span className="hidden sm:inline">Publish</span>
        </button>
      )}
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        title="Delete this evite"
        className={DANGER}
      >
        <span className="material-icons text-sm">delete</span>
        <span className="hidden sm:inline">Delete</span>
      </button>
      <InlineNotice notice={notice} className="px-1" />

      <ConfirmDeleteDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this evite?"
        description={`“${event.title}” will be deleted permanently, together with its guest list, RSVPs, messages and shared photos. Its link will stop working for everyone. This cannot be undone. To hide it without losing anything, use Unpublish instead.`}
        confirmLabel="Delete evite"
        busy={busy}
        onConfirm={() => void confirmDelete()}
      />
    </>
  );
}
