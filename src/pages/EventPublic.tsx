import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import BookViewer, { type BookPage } from '@/components/BookBuilder/BookViewer';

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  rsvp_enabled: boolean;
  invitee_count: number;
}

export default function EventPublic() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookPages, setBookPages] = useState<BookPage[]>([]);
  const [showBook, setShowBook] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    api.getPublicEvent(eventId)
      .then(setEvent)
      .catch(() => setError('This event is not available or has not been published yet.'))
      .finally(() => setLoading(false));
    api.getPublicBook(eventId)
      .then((book) => setBookPages((book as { pages: BookPage[] }).pages || []))
      .catch(() => setBookPages([]));
  }, [eventId]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Event link copied!');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="min-h-screen bg-[#1a2418] flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#9cb092]/30">event_busy</span>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60 text-center">
        {error || 'Event not found'}
      </p>
    </div>
  );

  const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#1a2418]">
      {/* Cover image */}
      {event.cover_image_url ? (
        <div className="w-full h-56 md:h-80 overflow-hidden">
          <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover opacity-75" />
        </div>
      ) : (
        <div className="w-full h-32 bg-[#9cb092]/5 border-b border-[#9cb092]/10" />
      )}

      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Title */}
        <p className="font-display text-[10px] tracking-[0.35em] uppercase text-[#9cb092] mb-3">Event</p>
        <h1 className="font-serif-exp text-3xl md:text-4xl text-[#e4eee1] italic leading-tight mb-6">
          {event.title}
        </h1>

        {/* Divider */}
        <div className="w-12 h-px bg-[#9cb092]/40 mb-6" />

        {/* Meta */}
        <div className="space-y-2 mb-8">
          <div className="flex items-center gap-2">
            <span className="material-icons text-sm text-[#9cb092]/60">calendar_today</span>
            <p className="font-display text-[11px] tracking-[0.15em] uppercase text-[#b2c3b1]/80">{dateStr}</p>
          </div>
          {event.event_time && (
            <div className="flex items-center gap-2">
              <span className="material-icons text-sm text-[#9cb092]/60">schedule</span>
              <p className="font-display text-[11px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">{event.event_time}</p>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="material-icons text-sm text-[#9cb092]/60">location_on</span>
              <p className="font-display text-[11px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">{event.location}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="material-icons text-sm text-[#9cb092]/60">group</span>
            <p className="font-display text-[11px] tracking-[0.15em] uppercase text-[#b2c3b1]/40">
              {event.invitee_count} {event.invitee_count === 1 ? 'guest' : 'guests'} invited
            </p>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div className="border-l-2 border-[#9cb092]/30 pl-4 mb-10">
            <p className="font-display text-sm text-[#b2c3b1]/70 leading-relaxed">{event.description}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {bookPages.length > 0 && (
            <button
              onClick={() => setShowBook(true)}
              className="flex-1 py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
            >
              <span className="material-icons text-sm">menu_book</span>
              View Invitation Book
            </button>
          )}
          <button
            onClick={handleShare}
            className="flex-1 py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
          >
            <span className="material-icons text-sm">share</span>
            Share Event
          </button>
        </div>
      </div>

      {showBook && (
        <div
          data-testid="book-viewer-modal"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-4"
          onClick={() => setShowBook(false)}
        >
          <button
            onClick={() => setShowBook(false)}
            aria-label="Close book"
            className="absolute top-4 right-4 text-[#e4eee1] hover:text-[#9cb092]"
          >
            <span className="material-icons text-2xl">close</span>
          </button>
          <div onClick={(e) => e.stopPropagation()}>
            <BookViewer pages={bookPages} />
          </div>
        </div>
      )}
    </div>
  );
}
