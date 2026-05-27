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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBack();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-6xl max-h-[92vh] h-full flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
          >
            <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
          </button>
        )}

        {/* ── Header — compact ── */}
        <div className="flex-shrink-0 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 md:px-8 py-3 border-b border-white/[0.06] bg-[#0e1712]">
          <div className="min-w-0">
            <h2 className="font-serif-exp text-base md:text-lg text-[#e4eee1] leading-tight truncate">
              What your guests will <span className="text-[#9cb092] font-agatho italic">receive</span>
            </h2>
            <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#b2c3b1]/45 mt-0.5">
              Sending to {guestCount} {guestCount === 1 ? 'guest' : 'guests'} · via {deliveryLabel}
            </p>
          </div>
          <div className="justify-self-center">
            <StepIndicator current={3} total={4} />
          </div>
          <div />
        </div>

        {/* ── Body — single screen, no scroll. Two side-by-side panels. ── */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 md:gap-8 px-6 md:px-10 py-5">
          {/* LEFT — Invitation card */}
          <div className="flex flex-col items-center justify-center min-h-0">
            <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-2 flex items-center gap-1.5">
              <span className="material-icons" style={{ fontSize: '12px' }}>image</span>
              Invitation Card
            </p>
            <div className="relative bg-[#0d1512] border border-white/10 shadow-2xl overflow-hidden h-full max-h-full flex items-center">
              <div className="aspect-[9/16] h-full max-h-full w-auto max-w-full">
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
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  )
                ) : selectedTemplate?.layout ? (
                  <TemplateRenderer template={selectedTemplate} formData={formData} />
                ) : selectedTemplate ? (
                  <div className="relative w-full h-full">
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
          </div>

          {/* RIGHT — Message preview as a phone screen */}
          <div className="flex flex-col items-center justify-center min-h-0">
            <p className="font-display text-[9px] tracking-[0.22em] uppercase text-[#9cb092]/60 mb-2 flex items-center gap-1.5">
              <span className="material-icons" style={{ fontSize: '12px' }}>
                {deliveryPreference === 'phone'
                  ? 'sms'
                  : deliveryPreference === 'email'
                  ? 'mail'
                  : 'mark_email_read'}
              </span>
              Message Preview
            </p>

            {/* Phone frame */}
            <div className="relative h-full max-h-full aspect-[9/16] max-w-full">
              <div className="absolute inset-0 bg-[#1a1f1a] rounded-[28px] border-[6px] border-[#2a302a] shadow-2xl overflow-hidden flex flex-col">
                {/* Phone status bar */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5 bg-[#0d1512] text-[#b2c3b1]/80 text-[10px] font-display">
                  <span>9:41</span>
                  <div className="flex items-center gap-1">
                    <span className="material-icons" style={{ fontSize: '12px' }}>signal_cellular_4_bar</span>
                    <span className="material-icons" style={{ fontSize: '12px' }}>wifi</span>
                    <span className="material-icons" style={{ fontSize: '12px' }}>battery_full</span>
                  </div>
                </div>

                {/* Chat-style message */}
                <div className="flex-1 min-h-0 p-3 overflow-hidden bg-gradient-to-b from-[#1a1f1a] to-[#141914]">
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#9cb092]/20 border border-[#9cb092]/40 flex-shrink-0 flex items-center justify-center">
                      <span className="material-icons text-[#9cb092]" style={{ fontSize: '14px' }}>
                        {deliveryPreference === 'phone' ? 'sms' : 'mail'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-[9px] text-[#b2c3b1]/55 uppercase tracking-wider">
                        moments &amp; memories
                      </p>
                      <p className="font-display text-[8px] text-[#b2c3b1]/35">
                        now
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-tl-sm p-3 space-y-2">
                    <p className="font-display text-[11px] text-[#e4eee1] leading-snug">
                      You're invited to{' '}
                      <span className="font-serif-exp italic text-[#9cb092]">{eventTitle}</span>
                    </p>

                    {displayDate && (
                      <p className="font-display text-[10px] text-[#b2c3b1]/85 flex items-start gap-1.5">
                        <span className="material-icons text-[#9cb092] mt-0.5" style={{ fontSize: '12px' }}>
                          event
                        </span>
                        <span className="leading-snug">
                          {displayDate}
                          {formData.eventTime && ` at ${formData.eventTime}`}
                          {formData.timezone && ` ${formData.timezone}`}
                        </span>
                      </p>
                    )}

                    {formData.venue && (
                      <p className="font-display text-[10px] text-[#b2c3b1]/85 flex items-start gap-1.5">
                        <span className="material-icons text-[#9cb092] mt-0.5" style={{ fontSize: '12px' }}>
                          location_on
                        </span>
                        <span className="leading-snug">{formData.venue}</span>
                      </p>
                    )}

                    {customMessage && (
                      <div className="pt-2 border-t border-white/[0.07]">
                        <p className="font-display text-[10px] text-[#e4eee1]/90 leading-snug italic whitespace-pre-wrap">
                          "{customMessage}"
                        </p>
                      </div>
                    )}

                    {/* Invitation card thumbnail in the message */}
                    <div className="pt-2 border-t border-white/[0.07]">
                      <div className="relative aspect-[9/16] w-16 bg-[#0d1512] border border-white/10 overflow-hidden mx-auto">
                        {uploadedTemplate ? (
                          uploadedTemplate.type === 'image' ? (
                            <img src={uploadedTemplate.url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <video src={uploadedTemplate.url} muted className="w-full h-full object-cover" />
                          )
                        ) : selectedTemplate ? (
                          <img src={selectedTemplate.previewImage} alt="" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <p className="font-display text-[8px] tracking-[0.18em] uppercase text-[#9cb092]/70 text-center mt-1.5">
                        Open Invitation
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-10 py-4 border-t border-white/[0.06] bg-[#0e1712]">
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
