import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import GuestRSVPForm, { type RSVPEventInfo, type RSVPInvitee } from '@/components/GuestRSVPForm';
import { api } from '@/lib/api';

interface EventInfo extends RSVPEventInfo {
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
}

export default function RSVPPage() {
  const { eventId, inviteeId } = useParams<{ eventId: string; inviteeId: string }>();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [invitee, setInvitee] = useState<RSVPInvitee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId || !inviteeId) return;
    api.getRSVPPage(eventId, inviteeId)
      .then((data: { event: EventInfo; invitee: RSVPInvitee }) => {
        setEvent(data.event);
        setInvitee(data.invitee);
      })
      .catch(() => setError('This invitation link is not valid or has expired.'))
      .finally(() => setLoading(false));
  }, [eventId, inviteeId]);

  if (loading) return <div className="page-bokeh-bg product-light-shell min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#5f7256] rounded-full animate-spin" /></div>;

  if (error || !event || !invitee || !eventId) return (
    <div className="page-bokeh-bg product-light-shell min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#5f7256]/40">mail</span>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#44533e]/75 text-center max-w-xs">{error || 'Invitation not found'}</p>
    </div>
  );

  const dateStr = new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="page-bokeh-bg product-light-shell min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <main className="mx-auto w-full max-w-xl overflow-hidden border border-[#5f7256]/25 bg-[#fdfefb]/85 shadow-[0_22px_70px_rgba(61,74,53,0.14)] backdrop-blur-sm">
        {event.cover_image_url && <div data-preserve-theme className="h-40 w-full overflow-hidden sm:h-52"><img src={event.cover_image_url} alt="" className="h-full w-full object-cover" /></div>}
        <div className="px-5 py-8 sm:px-10 sm:py-10">
          <header className="mb-8 text-center">
            <p className="mb-3 font-display text-[10px] uppercase tracking-[0.35em] text-[#405138]">Moments &amp; Memories</p>
            <h1 className="mb-3 font-serif-exp text-3xl italic leading-tight text-[#2a3328] sm:text-4xl">{event.title}</h1>
            <div className="mx-auto mb-3 h-px w-10 bg-[#5f7256]/50" />
            <p className="font-display text-[10px] uppercase tracking-[0.14em] text-[#44533e]/80">{dateStr}</p>
            {event.location && <p className="mt-1 text-xs text-[#44533e]/75">{event.location}</p>}
          </header>
          <GuestRSVPForm eventId={eventId} event={event} invitee={invitee} />
        </div>
      </main>
    </div>
  );
}
