import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import StepIndicator from './StepIndicator';
import TemplateRenderer from '@/components/TemplateRenderer';
import { eventTypes, type EventType } from '@/data/eventFields';
import type { EviteTemplate } from '@/data/eviteTemplates';

interface PreviewStepProps {
  eventType: EventType | null;
  selectedTemplate: EviteTemplate | null;
  uploadedTemplate: { url: string; type: 'image' | 'video'; fileName?: string } | null;
  formData: Record<string, string>;
  deliveryPreference: 'email' | 'phone' | 'both';
  guestCount: number;
  onBack: () => void;
  onClose?: () => void;
  onProceed: () => void;
}

export default function PreviewStep({
  eventType,
  selectedTemplate,
  uploadedTemplate,
  formData,
  deliveryPreference,
  guestCount,
  onBack,
  onClose,
  onProceed,
}: PreviewStepProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backdropRef.current && panelRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: 'power2.out' }
      );
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
      );
    }
  }, []);

  const eventInfo = eventType ? eventTypes.find((e) => e.id === eventType) : null;

  const displayName =
    formData.celebrantName ||
    formData.eventName ||
    formData.brideName ||
    formData.parentNames ||
    formData.homeownerName ||
    formData.hostName ||
    '';

  const eventTitle =
    eventInfo?.label === 'Wedding'
      ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
      : eventType === 'custom'
      ? formData.eventName || displayName || 'Your Event'
      : displayName
      ? `${displayName}'s ${eventInfo?.label ?? ''}`
      : eventInfo?.label ?? 'Your Event';

  const displayDate = formData.eventDate
    ? new Date(formData.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  const deliveryLabel =
    deliveryPreference === 'email'
      ? 'Email'
      : deliveryPreference === 'phone'
      ? 'SMS'
      : 'Email + SMS';

  const customMessage = formData.customMessage?.trim() || '';

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBack();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-6xl max-h-[82vh] flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
          >
            <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
          </button>
        )}

        {/* Header */}
        <div className="flex-shrink-0 px-6 md:px-10 pt-8 pb-5 border-b border-white/[0.06]">
          <StepIndicator current={3} total={4} />
          <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight mt-2">
            Here's what your guests will <span className="text-[#9cb092] font-agatho italic">receive</span>
          </h2>
          <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/55 mt-3">
            A final look before payment — sent via {deliveryLabel}
          </p>
        </div>

        {/* Body — two columns: template preview + message preview */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-10 py-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Left: Template preview */}
            <div className="flex flex-col items-center">
              <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-3">
                Invitation Card
              </p>
              <div className="w-full max-w-[280px] bg-[#0d1512] border border-white/10 shadow-2xl overflow-hidden">
                {uploadedTemplate ? (
                  uploadedTemplate.type === 'image' ? (
                    <img
                      src={uploadedTemplate.url}
                      alt="Your invitation"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={uploadedTemplate.url}
                      controls
                      autoPlay
                      loop
                      muted
                      className="w-full h-full object-cover"
                    />
                  )
                ) : selectedTemplate?.layout ? (
                  <TemplateRenderer template={selectedTemplate} formData={formData} />
                ) : selectedTemplate ? (
                  <div className="relative aspect-[9/16]">
                    <img
                      src={selectedTemplate.previewImage}
                      alt={selectedTemplate.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4">
                      <p className="font-display text-[8px] tracking-[0.25em] uppercase text-white/55 mb-1">
                        You're invited to
                      </p>
                      <h4 className="font-serif-exp text-lg text-white leading-tight">
                        {eventTitle}
                      </h4>
                      <div className="space-y-1 mt-2">
                        {displayDate && (
                          <p className="font-display text-[9px] text-white/75 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
                              calendar_today
                            </span>
                            {displayDate}
                          </p>
                        )}
                        {formData.eventTime && (
                          <p className="font-display text-[9px] text-white/75 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
                              schedule
                            </span>
                            {formData.eventTime}
                            {formData.timezone && ` · ${formData.timezone}`}
                          </p>
                        )}
                        {formData.venue && (
                          <p className="font-display text-[9px] text-white/75 flex items-center gap-1.5">
                            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
                              location_on
                            </span>
                            {formData.venue}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right: Message preview */}
            <div className="flex flex-col">
              <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-3">
                Message your guests will see
              </p>
              <div className="bg-white/[0.03] border border-white/10 p-5 flex-1 space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-white/[0.07]">
                  <span className="material-icons text-[#9cb092] text-base">
                    {deliveryPreference === 'phone'
                      ? 'sms'
                      : deliveryPreference === 'email'
                      ? 'mail'
                      : 'mark_email_read'}
                  </span>
                  <p className="font-display text-[10px] tracking-[0.18em] uppercase text-[#b2c3b1]/70">
                    Delivered via {deliveryLabel}
                  </p>
                </div>

                <p className="font-display text-sm text-[#e4eee1] leading-relaxed">
                  You're invited to <span className="font-serif-exp italic text-[#9cb092]">{eventTitle}</span>
                </p>

                {displayDate && (
                  <p className="font-display text-xs text-[#b2c3b1]/85 flex items-start gap-2">
                    <span className="material-icons text-[#9cb092] mt-0.5" style={{ fontSize: '14px' }}>
                      event
                    </span>
                    <span>
                      {displayDate}
                      {formData.eventTime && ` at ${formData.eventTime}`}
                      {formData.timezone && ` ${formData.timezone}`}
                    </span>
                  </p>
                )}

                {formData.venue && (
                  <p className="font-display text-xs text-[#b2c3b1]/85 flex items-start gap-2">
                    <span className="material-icons text-[#9cb092] mt-0.5" style={{ fontSize: '14px' }}>
                      location_on
                    </span>
                    {formData.venue}
                  </p>
                )}

                {customMessage && (
                  <div className="pt-3 border-t border-white/[0.07]">
                    <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-1.5">
                      Your message
                    </p>
                    <p className="font-display text-xs text-[#e4eee1]/90 leading-relaxed italic whitespace-pre-wrap">
                      "{customMessage}"
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-white/[0.07]">
                  <p className="font-display text-[10px] text-[#b2c3b1]/55 leading-relaxed">
                    Tap to view your invitation →
                  </p>
                </div>
              </div>

              <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/40 mt-3 text-center">
                Sending to {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-10 py-5 border-t border-white/[0.06] bg-[#0e1712]">
          <button
            onClick={onBack}
            className="py-3 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>

          <button
            onClick={onProceed}
            className="py-3 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3] transition-colors flex items-center gap-2"
          >
            Continue to Payment
            <span className="material-icons text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
