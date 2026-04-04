import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { eviteTemplates } from '@/data/eviteTemplates';
import {
  eventTypes,
  commonFields,
  eventSpecificFields,
  type EventType,
} from '@/data/eventFields';

interface FinalPreviewProps {
  eventType: EventType;
  selectedTemplate: string;
  formData: Record<string, string>;
}

export default function FinalPreview({
  eventType,
  selectedTemplate,
  formData,
}: FinalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const eventInfo = eventTypes.find((e) => e.id === eventType);
  const template = eviteTemplates.find((t) => t.id === selectedTemplate);
  const allFields = [...eventSpecificFields[eventType], ...commonFields];

  const displayName =
    formData.celebrantName ||
    formData.brideName ||
    formData.parentNames ||
    formData.hostName ||
    'Your Name';
  const displayDate = formData.eventDate
    ? new Date(formData.eventDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Event Date';
  const displayVenue = formData.venue || 'Venue';

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.final-card',
        { opacity: 0, y: 60, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', delay: 0.3 }
      );
      gsap.fromTo(
        '.final-details',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.6 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  if (!template) return null;

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-12 mt-8">
        <h1 className="text-4xl md:text-6xl font-serif-exp italic text-center mb-6 relative z-10">
          Your Evite is <br />
          <span className="text-[#9cb092] not-italic font-agatho">Ready</span>
        </h1>
        <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase">
          Here's a final look at your{' '}
          <span className="font-semibold text-[#9cb092]">{eventInfo?.label}</span>{' '}
          invitation
        </p>
        <div className="w-[1px] h-12 bg-[#9cb092]/40 mt-8" />
      </div>

      <div className="flex flex-col lg:flex-row gap-12 max-w-5xl mx-auto">
        {/* Evite Card Preview */}
        <div className="final-card flex-1 max-w-md mx-auto lg:mx-0">
          <div className="overflow-hidden border border-white/15 shadow-2xl shadow-[#9cb092]/5">
            <div className="relative aspect-[3/4]">
              <img
                src={template.previewImage}
                alt={template.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8">
                <p className="font-display text-[9px] tracking-[0.25em] uppercase text-white/50 mb-2">
                  You're invited to
                </p>
                <h4 className="font-serif-exp text-3xl md:text-4xl text-white italic leading-tight">
                  {eventInfo?.label === 'Marriage'
                    ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
                    : `${displayName}'s ${eventInfo?.label}`}
                </h4>
                <div className="space-y-2 mt-6">
                  <p className="font-display text-[11px] tracking-wide text-white/80 flex items-center gap-2">
                    <span className="material-icons text-[#9cb092] text-sm">calendar_today</span>
                    {displayDate}
                  </p>
                  {formData.eventTime && (
                    <p className="font-display text-[11px] tracking-wide text-white/80 flex items-center gap-2">
                      <span className="material-icons text-[#9cb092] text-sm">schedule</span>
                      {formData.eventTime}
                    </p>
                  )}
                  <p className="font-display text-[11px] tracking-wide text-white/80 flex items-center gap-2">
                    <span className="material-icons text-[#9cb092] text-sm">location_on</span>
                    {displayVenue}
                  </p>
                  {formData.rsvpContact && (
                    <p className="font-display text-[11px] tracking-wide text-white/80 flex items-center gap-2">
                      <span className="material-icons text-[#9cb092] text-sm">mail</span>
                      RSVP: {formData.rsvpContact}
                    </p>
                  )}
                </div>
                {formData.customMessage && (
                  <p className="font-serif-exp text-sm text-white/60 italic mt-6 border-t border-white/10 pt-4">
                    "{formData.customMessage}"
                  </p>
                )}
              </div>
            </div>
            <div className="bg-[#111914] p-4 text-center border-t border-white/10">
              <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1] uppercase">
                Design: <span className="font-semibold text-[#9cb092]">{template.name}</span>
                <span className="text-[#b2c3b1]/40 mx-2">&middot;</span>
                <span className="text-[#b2c3b1]/50">{template.style}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Event Details Summary */}
        <div className="final-details flex-1 lg:max-w-sm">
          <div className="sticky top-32">
            <h3 className="font-display text-[10px] tracking-[0.25em] uppercase text-[#b2c3b1] mb-6">
              Event Details
            </h3>
            <div className="space-y-4">
              {allFields.map((field) => {
                const value = formData[field.name];
                if (!value) return null;
                return (
                  <div key={field.name} className="border-b border-white/5 pb-3">
                    <p className="font-display text-[9px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 mb-1">
                      {field.label}
                    </p>
                    <p className="font-serif-exp text-sm text-[#e4eee1] italic">
                      {field.type === 'date'
                        ? new Date(value).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 p-5 border border-[#9cb092]/20 bg-[#9cb092]/5">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-icons text-[#9cb092] text-lg">check_circle</span>
                <h4 className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">
                  All set!
                </h4>
              </div>
              <p className="font-display text-[11px] text-[#b2c3b1]/70 leading-relaxed">
                Your evite looks great. You can go back to make changes, or confirm to finalize your invitation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
