import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import BookViewer, { type BookPage } from '@/components/BookBuilder/BookViewer';
import TemplateRenderer, { type PhotoOverlay } from '@/components/TemplateRenderer';
import { eviteTemplates, type TemplateFieldLayout } from '@/data/eviteTemplates';
import GuestRSVPForm from '@/components/GuestRSVPForm';
import type { RSVPConfig } from '@/lib/api';

interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  rsvp_enabled: boolean;
  rsvp_config?: Partial<RSVPConfig>;
  invitee_count: number;
  template_id: string | null;
  form_data: Record<string, string> | null;
  customization: {
    template_id: string;
    field_overrides: Record<string, Partial<TemplateFieldLayout>> | null;
    photo_overlay: PhotoOverlay | null;
  } | null;
}

export default function EventPublic() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookPages, setBookPages] = useState<BookPage[]>([]);
  const [showBook, setShowBook] = useState(false);
  const [showInvitation, setShowInvitation] = useState(false);
  const rsvpSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!eventId) return;
    api.getPublicEvent(eventId)
      .then((e) => setEvent(e as PublicEvent))
      .catch(() => setError('This event is not available or has not been published yet.'))
      .finally(() => setLoading(false));
    api.getPublicBook(eventId)
      .then((book) => setBookPages((book as { pages: BookPage[] }).pages || []))
      .catch(() => setBookPages([]));
  }, [eventId]);

  // A direct event link can inherit the browser's previous scroll restoration
  // position. Keep the route at the artwork hero while the async event data
  // and its image settle, then release restoration when the route changes.
  useEffect(() => {
    if (!eventId) return;
    const previousRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    let cancelled = false;
    const forceTop = () => {
      if (!cancelled) window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    };
    forceTop();
    const timers = [0, 80, 250, 600, 1200].map((delay) => window.setTimeout(forceTop, delay));
    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.history.scrollRestoration = previousRestoration;
    };
  }, [eventId, event?.id]);

  // The stock template (with its positioned layout) used to re-render the
  // designed invitation. Null for uploaded / canvas designs, which fall back
  // to the hosted cover image instead.
  const template = useMemo(
    () => (event?.template_id ? eviteTemplates.find((t) => t.id === event.template_id) ?? null : null),
    [event]
  );

  const scrollToRsvp = () => {
    rsvpSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) return (
    <div className="page-bokeh-bg product-light-shell min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (error || !event) return (
    <div className="page-bokeh-bg product-light-shell min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#9cb092]/30">event_busy</span>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60 text-center">
        {error || 'Event not found'}
      </p>
    </div>
  );

  const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  // Render the actual designed invitation as the hero: the layout template
  // (with the host's text + font/colour/size/position overrides + photo) when
  // available, otherwise the hosted cover image (uploaded / canvas designs).
  const hasTemplateDesign = !!(template?.layout && event.form_data);
  // Some older uploaded cover URLs were persisted with an empty trailing '?'.
  // It is harmless for most browsers but can prevent a direct image request in
  // stricter environments, so normalize it before rendering the public hero.
  const coverImageUrl = event.cover_image_url?.replace(/\?$/, '') || null;
  const hasDesign = hasTemplateDesign || !!coverImageUrl;
  const aspect = template?.layout
    ? `${template.layout.naturalWidth} / ${template.layout.naturalHeight}`
    : '9 / 16';
  const [aspectWidth, aspectHeight] = aspect.split('/').map((value) => Number(value.trim()));
  const aspectRatioValue = aspectWidth > 0 && aspectHeight > 0 ? aspectWidth / aspectHeight : 9 / 16;

  const renderInvitation = () => {
    if (hasTemplateDesign) {
      return (
        <TemplateRenderer
          template={template!}
          formData={event.form_data ?? {}}
          overrides={event.customization?.field_overrides ?? undefined}
          photoOverlay={event.customization?.photo_overlay ?? null}
        />
      );
    }
    if (coverImageUrl) {
      return <img src={coverImageUrl} alt={event.title} loading="eager" decoding="async" className="w-full h-full object-contain" />;
    }
    return null;
  };

  return (
    <div className="page-bokeh-bg product-light-shell min-h-screen">
      <div className="max-w-md mx-auto px-5 py-10 md:py-14">
        {/* Designed invitation */}
        {hasDesign && (
          <div className="mb-9">
            <button
              type="button"
              data-testid="public-invitation"
              aria-label="Open invitation preview"
              onClick={() => setShowInvitation(true)}
              className="group relative block w-full mx-auto cursor-zoom-in rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#9cb092] focus-visible:ring-offset-4 focus-visible:ring-offset-[#e8eee2]"
              style={{ maxWidth: 420 }}
            >
              <div
                data-preserve-theme
                className="relative w-full overflow-hidden rounded-sm shadow-2xl border border-white/[0.06] bg-[#0d1512]"
                style={{ aspectRatio: aspect }}
              >
                {renderInvitation()}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-gradient-to-t from-[#0d1512]/75 to-transparent px-4 pb-3 pt-10 font-display text-[9px] uppercase tracking-[0.2em] text-white/90 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <span className="material-icons text-sm">zoom_in</span>
                  Tap to view full invitation
                </span>
              </div>
            </button>
            <div className="mt-5 flex flex-col items-center gap-2 text-center">
              <p className="font-display text-[9px] uppercase tracking-[0.24em] text-[#44533e]/65">
                Invitation preview · tap to enlarge
              </p>
              <button
                type="button"
                onClick={scrollToRsvp}
                className="inline-flex items-center gap-2 rounded-full border border-[#5f7256]/35 bg-[#fdfefb]/75 px-4 py-2 font-display text-[10px] uppercase tracking-[0.2em] text-[#405138] transition hover:border-[#405138] hover:bg-white"
              >
                Scroll down to RSVP
                <span className="material-icons text-base">south</span>
              </button>
            </div>
          </div>
        )}

        <div className={hasDesign ? 'text-center' : ''}>
          <p className="font-display text-[10px] tracking-[0.35em] uppercase text-[#9cb092] mb-3">
            You&apos;re invited
          </p>
          <h1 className="font-serif-exp text-2xl md:text-4xl text-[#e4eee1] italic leading-tight mb-5">
            {event.title}
          </h1>

          <div className={`w-12 h-px bg-[#9cb092]/40 mb-6 ${hasDesign ? 'mx-auto' : ''}`} />

          {/* Meta */}
          <div className={`space-y-2 mb-8 ${hasDesign ? 'inline-flex flex-col items-start text-left' : ''}`}>
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
          </div>

          {/* Description */}
          {event.description && (
            <div className={`border-l-2 border-[#9cb092]/30 pl-4 mb-10 ${hasDesign ? 'text-left max-w-sm mx-auto' : ''}`}>
              <p className="font-display text-sm text-[#b2c3b1]/70 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Optional invitation book — sharing is intentionally omitted here;
              guests already arrived through the host's invite link. */}
          {bookPages.length > 0 && (
            <div className={`flex flex-col sm:flex-row gap-3 ${hasDesign ? 'justify-center' : ''}`}>
              <button
                onClick={() => setShowBook(true)}
                className="flex-1 py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
              >
                <span className="material-icons text-sm">menu_book</span>
                View Invitation Book
              </button>
            </div>
          )}

          <div className="my-9 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[#5f7256]/25" />
            <span className="material-icons text-lg text-[#405138]/70">how_to_reg</span>
            <span className="h-px flex-1 bg-[#5f7256]/25" />
          </div>

          <section ref={rsvpSectionRef} className="scroll-mt-6 border border-[#5f7256]/25 bg-[#fdfefb]/85 p-5 text-left shadow-[0_16px_50px_rgba(61,74,53,0.12)] backdrop-blur-sm sm:p-7" aria-labelledby="public-rsvp-heading">
            <div className="mb-6 text-center">
              <p className="font-display text-[9px] uppercase tracking-[0.28em] text-[#405138]">Guest RSVP</p>
              <h2 id="public-rsvp-heading" className="mt-1 font-serif-exp text-2xl italic text-[#2a3328]">Let the host know</h2>
              <p className="mt-2 text-sm text-[#44533e]/75">Your answers are added directly to the host’s event analytics.</p>
            </div>
            <GuestRSVPForm eventId={event.id} event={event} requireName />
          </section>
        </div>
      </div>

      {showInvitation && (
        <div
          data-testid="invitation-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Invitation preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d1512]/90 p-4 backdrop-blur-md"
          onClick={() => setShowInvitation(false)}
        >
          <button
            type="button"
            aria-label="Close invitation preview"
            onClick={() => setShowInvitation(false)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-[#0d1512]/70 text-white transition hover:border-[#9cb092] hover:text-[#9cb092]"
          >
            <span className="material-icons">close</span>
          </button>
          <div
            data-preserve-theme
            className="relative max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)] overflow-hidden rounded-sm bg-[#0d1512] shadow-2xl"
            style={{
              aspectRatio: aspect,
              width: `min(92vw, calc((100vh - 2rem) * ${aspectRatioValue}))`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {renderInvitation()}
          </div>
        </div>
      )}

      {showBook && (
        <div
          data-testid="book-viewer-modal"
          className="hero-bokeh-bg product-light-shell fixed inset-0 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setShowBook(false)}
        >
          <button
            onClick={() => setShowBook(false)}
            aria-label="Close book"
            className="absolute top-4 right-4 text-[#e4eee1] hover:text-[#9cb092]"
          >
            <span className="material-icons text-2xl">close</span>
          </button>
          <div data-preserve-theme className="relative z-10" onClick={(e) => e.stopPropagation()}>
            <BookViewer pages={bookPages} />
          </div>
        </div>
      )}
    </div>
  );
}
