import { useEffect, useRef, useMemo, useCallback, useState } from 'react';
import gsap from 'gsap';
import { eviteTemplates } from '@/data/eviteTemplates';
import { eventTypes, type EventType } from '@/data/eventFields';
import { CircularGallery, type GalleryItem } from '@/components/ui/circular-gallery';
import TemplateRenderer from '@/components/TemplateRenderer';

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
  const [zoomedId, setZoomedId] = useState<string | null>(null);

  const templates = useMemo(
    () => eviteTemplates.filter((t) => t.eventType === eventType),
    [eventType],
  );

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

  const galleryItems: GalleryItem[] = useMemo(
    () => templates.map((t) => ({ image: t.previewImage, text: t.name })),
    [templates],
  );

  const handleItemClick = useCallback(
    (index: number) => setZoomedId(templates[index].id),
    [templates],
  );

  const zoomedTemplate = templates.find((t) => t.id === zoomedId);

  // Derive display info for the zoom preview card
  const eventInfo = eventTypes.find((e) => e.id === eventType);
  const displayName =
    formData.celebrantName ||
    formData.eventName ||
    formData.brideName ||
    formData.parentNames ||
    formData.hostName ||
    '';
  const displayDate = formData.eventDate
    ? new Date(formData.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';
  const displayVenue = formData.venue || '';
  const eventTitle =
    eventInfo?.label === 'Wedding'
      ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
      : eventType === 'custom'
      ? formData.eventName || displayName
      : displayName
      ? `${displayName}'s ${eventInfo?.label ?? ''}`
      : eventInfo?.label ?? '';

  // Shared upload handler used by both desktop & mobile labels
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onSelect(`custom_${URL.createObjectURL(file)}`);
  };

  return (
    <div ref={containerRef}>

      {/* ── Zoom overlay ────────────────────────────────────────── */}
      {zoomedTemplate && (
        <div className="fixed inset-0 z-[100] bg-[#0d1510]/96 backdrop-blur-sm flex flex-col items-center justify-center gap-4 px-4">

          {/* Template name */}
          <div className="text-center">
            <p className="font-display text-[8px] tracking-[0.25em] uppercase text-[#b2c3b1]/40 mb-0.5">
              {zoomedTemplate.style}
            </p>
            <h3 className="font-serif-exp text-xl text-[#e4eee1]">{zoomedTemplate.name}</h3>
          </div>

          {/* Card: back arrow overlaid + details at bottom */}
          <div className="relative max-w-[200px] md:max-w-[230px] w-full">
            <div className="relative overflow-hidden shadow-2xl border border-white/10">
              {zoomedTemplate.layout ? (
                <TemplateRenderer template={zoomedTemplate} formData={formData} />
              ) : (
                <div className="relative aspect-[3/4]">
                  <img
                    src={zoomedTemplate.previewImage}
                    alt={zoomedTemplate.name}
                    className="w-full h-full object-cover"
                  />
                  {/* Details overlay — bottom of card */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent flex flex-col justify-end p-3">
                    <p className="font-display text-[6px] tracking-[0.2em] uppercase text-white/30 mb-0.5">
                      You're invited to
                    </p>
                    {eventTitle && (
                      <h4 className="font-serif-exp text-sm text-white leading-tight mb-1.5">
                        {eventTitle}
                      </h4>
                    )}
                    <div className="space-y-0.5">
                      {displayDate && (
                        <p className="font-display text-[7px] text-white/55 flex items-center gap-1">
                          <span className="material-icons text-[#9cb092]" style={{ fontSize: '8px' }}>
                            calendar_today
                          </span>
                          {displayDate}
                        </p>
                      )}
                      {formData.eventTime && (
                        <p className="font-display text-[7px] text-white/55 flex items-center gap-1">
                          <span className="material-icons text-[#9cb092]" style={{ fontSize: '8px' }}>
                            schedule
                          </span>
                          {formData.eventTime}
                        </p>
                      )}
                      {displayVenue && (
                        <p className="font-display text-[7px] text-white/55 flex items-center gap-1">
                          <span className="material-icons text-[#9cb092]" style={{ fontSize: '8px' }}>
                            location_on
                          </span>
                          {displayVenue}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Back arrow — top-left corner of the card */}
              <button
                onClick={() => setZoomedId(null)}
                className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-[#9cb092]/70 flex items-center justify-center transition-all"
              >
                <span className="material-icons text-white" style={{ fontSize: '14px' }}>
                  arrow_back
                </span>
              </button>
            </div>
          </div>

          {/* Select button */}
          <button
            onClick={() => { onSelect(zoomedId!); setZoomedId(null); }}
            className="px-8 py-2.5 bg-[#9cb092] hover:bg-[#adc4a3] text-[#111914] font-display text-[10px] tracking-[0.25em] uppercase transition-all shadow-lg flex items-center gap-2"
          >
            <span className="material-icons text-sm">check_circle</span>
            Select This Design
          </button>
        </div>
      )}

      {/* ── Heading row: [spacer] | title | [upload box] ────────── */}
      <div
        ref={headingRef}
        className="flex items-center gap-4 mb-6 mt-0 max-w-4xl mx-auto w-full px-2"
      >
        {/* Left spacer — mirrors upload box width to keep title centred */}
        <div className="hidden md:block w-[86px] flex-shrink-0" />

        {/* Centred title */}
        <div className="flex-1 flex flex-col items-center min-w-0">
          <h1 className="text-2xl md:text-4xl font-serif-exp text-center mb-3 relative z-10">
            Choose a design that <br />
            <span className="text-[#9cb092] font-agatho">tells your story.</span>
          </h1>
          <div className="w-[1px] h-5 bg-[#9cb092]/40 mt-2" />
        </div>

        {/* Upload — small rectangle, right of title, desktop only */}
        <label className="hidden md:flex flex-shrink-0 flex-col items-center gap-1.5 border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer px-3 py-3 w-[86px]">
          <span className="material-icons text-[#9cb092]/55" style={{ fontSize: '18px' }}>
            cloud_upload
          </span>
          <span className="font-display text-[7px] tracking-[0.08em] text-[#b2c3b1]/45 uppercase text-center leading-tight">
            Upload your own
          </span>
          <input type="file" accept="image/*,video/mp4" className="hidden" onChange={handleUpload} />
        </label>
      </div>

      {/* ── Carousel — full width, centred ─────────────────────── */}
      <div className="max-w-4xl mx-auto w-full">
        {templates.length > 0 ? (
          <div className="h-[340px] md:h-[430px]">
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
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center border border-dashed border-white/10 bg-white/[0.02]">
            <span className="material-icons text-[#b2c3b1]/20 text-4xl mb-2">palette</span>
            <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/40 uppercase text-center px-6">
              No preset templates for this event type
            </p>
            <p className="font-display text-[9px] text-[#b2c3b1]/30 mt-1 text-center px-6">
              Use the upload button to add your own design
            </p>
          </div>
        )}

        {/* Upload — compact strip, mobile only */}
        <label className="md:hidden flex items-center justify-center gap-2 mt-4 mx-auto px-5 py-2.5 border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
          <span className="material-icons text-[#9cb092]/50" style={{ fontSize: '15px' }}>
            cloud_upload
          </span>
          <span className="font-display text-[8px] tracking-[0.1em] text-[#b2c3b1]/45 uppercase">
            Upload your own
          </span>
          <input type="file" accept="image/*,video/mp4" className="hidden" onChange={handleUpload} />
        </label>

        {selectedTemplate?.startsWith('custom_') && (
          <p className="font-display text-[8px] tracking-[0.1em] text-[#9cb092]/70 text-center mt-2 flex items-center justify-center gap-1">
            <span className="material-icons text-xs">check_circle</span>
            Custom design selected
          </p>
        )}
      </div>
    </div>
  );
}
