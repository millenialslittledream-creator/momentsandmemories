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
    ? new Date(formData.eventDate).toLocaleDateString('en-US', {
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
      <div ref={headingRef} className="flex flex-col items-center mb-8 mt-8">
        <h1 className="text-4xl md:text-6xl font-serif-exp italic text-center mb-6 relative z-10">
          Pick your <br />
          <span className="text-[#9cb092] not-italic font-agatho">Design</span>
        </h1>
        <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase">
          Choose a template for your <span className="font-semibold text-[#9cb092]">{eventInfo?.label}</span> evite
        </p>
        <div className="w-[1px] h-12 bg-[#9cb092]/40 mt-8" />
      </div>

      {/* Circular Gallery Carousel */}
      <div className="w-full h-[500px] md:h-[600px] mb-12">
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

      {/* Preview Panel */}
      {selected && (
        <div className="max-w-md mx-auto">
          <h3 className="font-display text-[10px] tracking-[0.25em] uppercase text-[#b2c3b1] mb-4 text-center">
            Live Preview
          </h3>
          <div className="overflow-hidden border border-white/15 shadow-2xl">
            <div className="relative aspect-[3/4]">
              <img
                src={selected.previewImage}
                alt={selected.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                <p className="font-display text-[9px] tracking-[0.25em] uppercase text-white/50 mb-1">
                  You're invited to
                </p>
                <h4 className="font-serif-exp text-2xl text-white italic">
                  {eventInfo?.label === 'Marriage'
                    ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
                    : `${displayName}'s ${eventInfo?.label}`}
                </h4>
                <div className="space-y-1.5 mt-4">
                  <p className="font-display text-[10px] tracking-wide text-white/70 flex items-center gap-2">
                    <span className="material-icons text-[#9cb092] text-xs">calendar_today</span>
                    {displayDate}
                  </p>
                  {formData.eventTime && (
                    <p className="font-display text-[10px] tracking-wide text-white/70 flex items-center gap-2">
                      <span className="material-icons text-[#9cb092] text-xs">schedule</span>
                      {formData.eventTime}
                    </p>
                  )}
                  <p className="font-display text-[10px] tracking-wide text-white/70 flex items-center gap-2">
                    <span className="material-icons text-[#9cb092] text-xs">location_on</span>
                    {displayVenue}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-[#111914] p-4 text-center border-t border-white/10">
              <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1] uppercase">
                Template: <span className="font-semibold text-[#9cb092]">{selected.name}</span>
              </p>
              <p className="font-display text-[9px] tracking-widest text-[#b2c3b1]/50 uppercase mt-1">{selected.style}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
