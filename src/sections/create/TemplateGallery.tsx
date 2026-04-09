import { useEffect, useRef, useMemo, useCallback } from 'react';
import gsap from 'gsap';
import { eviteTemplates } from '@/data/eviteTemplates';
import { eventTypes, type EventType } from '@/data/eventFields';
import { CircularGallery, type GalleryItem } from '@/components/ui/circular-gallery';

interface TemplateGalleryProps {
  eventType: EventType;
  selectedTemplate: string | null;
  onSelect: (templateId: string) => void;
  formData: Record<string, string>;
}

export default function TemplateGallery({
  eventType,
  selectedTemplate,
  onSelect,
  formData,
}: TemplateGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const eventInfo = eventTypes.find((e) => e.id === eventType);
  const templates = eviteTemplates.filter((t) => t.eventType === eventType);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [eventType]);

  const selected = templates.find((t) => t.id === selectedTemplate);

  const displayName =
    formData.celebrantName ||
    formData.brideName ||
    formData.parentNames ||
    formData.hostName ||
    'Your Name';
  const displayDate = formData.eventDate
    ? new Date(formData.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Event Date';
  const displayVenue = formData.venue || 'Venue';

  // Memoize gallery items so the carousel doesn't get recreated on every render
  const galleryItems: GalleryItem[] = useMemo(
    () => templates.map((t) => ({ image: t.previewImage, text: t.name })),
    [eventType]
  );

  const handleItemClick = useCallback(
    (index: number) => onSelect(templates[index].id),
    [eventType, onSelect]
  );

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-4 mt-2">
        <h1 className="text-3xl md:text-5xl font-serif-exp italic text-center mb-3 relative z-10">
          Choose a design that <br />
          <span className="text-[#9cb092] not-italic font-agatho">tells your story.</span>
        </h1>
        <div className="w-[1px] h-6 bg-[#9cb092]/40 mt-2" />
      </div>

      {/* Two-panel layout: carousel left, preview right */}
      <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto items-stretch">
        {/* Circular Gallery Carousel */}
        <div className="flex-1 h-[400px] md:h-[480px]">
          <CircularGallery
            items={galleryItems}
            bend={3}
            borderRadius={0.02}
            scrollSpeed={3}
            scrollEase={0.06}
            className="text-[#e4eee1]"
            onItemClick={handleItemClick}
          />
        </div>

        {/* Live Preview — compact */}
        <div className="lg:w-[280px] flex-shrink-0">
          {selected ? (
            <div>
              <h3 className="font-display text-[10px] tracking-[0.25em] uppercase text-[#b2c3b1] mb-3 text-center">
                Live Preview
              </h3>
              <div className="overflow-hidden border border-white/15 shadow-2xl">
                <div className="relative aspect-[3/4]">
                  <img
                    src={selected.previewImage}
                    alt={selected.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4">
                    <p className="font-display text-[8px] tracking-[0.25em] uppercase text-white/50 mb-1">
                      You're invited to
                    </p>
                    <h4 className="font-serif-exp text-lg text-white italic leading-tight">
                      {eventInfo?.label === 'Marriage'
                        ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
                        : `${displayName}'s ${eventInfo?.label}`}
                    </h4>
                    <div className="space-y-1 mt-3">
                      <p className="font-display text-[9px] tracking-wide text-white/70 flex items-center gap-1.5">
                        <span className="material-icons text-[#9cb092] text-[10px]">calendar_today</span>
                        {displayDate}
                      </p>
                      {formData.eventTime && (
                        <p className="font-display text-[9px] tracking-wide text-white/70 flex items-center gap-1.5">
                          <span className="material-icons text-[#9cb092] text-[10px]">schedule</span>
                          {formData.eventTime}
                        </p>
                      )}
                      <p className="font-display text-[9px] tracking-wide text-white/70 flex items-center gap-1.5">
                        <span className="material-icons text-[#9cb092] text-[10px]">location_on</span>
                        {displayVenue}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#111914] p-3 text-center border-t border-white/10">
                  <p className="font-display text-[9px] tracking-[0.15em] text-[#b2c3b1] uppercase">
                    <span className="font-semibold text-[#9cb092]">{selected.name}</span>
                    <span className="text-[#b2c3b1]/40 mx-1.5">&middot;</span>
                    <span className="text-[#b2c3b1]/50">{selected.style}</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full border border-dashed border-white/10 bg-white/[0.02] min-h-[300px]">
              <span className="material-icons text-[#b2c3b1]/20 text-4xl mb-3">palette</span>
              <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/40 uppercase text-center px-4">
                Click a template to preview
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
