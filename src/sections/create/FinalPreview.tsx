import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { eviteTemplates } from '@/data/eviteTemplates';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  onFieldChange?: (name: string, value: string) => void;
}

export default function FinalPreview({
  eventType,
  selectedTemplate,
  formData,
  onFieldChange,
}: FinalPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const eventInfo = eventTypes.find((e) => e.id === eventType);
  const template = eviteTemplates.find((t) => t.id === selectedTemplate);
  // Support custom uploaded designs
  const customImageUrl = selectedTemplate?.startsWith('custom_')
    ? selectedTemplate.slice('custom_'.length)
    : null;
  const previewImage = template?.previewImage ?? customImageUrl ?? '';

  const allFields = [...eventSpecificFields[eventType], ...commonFields];

  const displayName =
    formData.celebrantName ||
    formData.eventName ||
    formData.brideName ||
    formData.parentNames ||
    formData.hostName ||
    'Your Name';
  const displayDate = formData.eventDate
    ? new Date(formData.eventDate + 'T00:00:00').toLocaleDateString('en-US', {
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

  if (!template && !customImageUrl) return null;

  const startEditing = (fieldName: string) => {
    setEditingField(fieldName);
    setEditValue(formData[fieldName] || '');
  };

  const saveEdit = () => {
    if (editingField && onFieldChange) {
      onFieldChange(editingField, editValue);
    }
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const inputClass =
    'bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 text-xs';

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-3 mt-0">
        <h1 className="text-lg md:text-2xl font-serif-exp text-center mb-1 relative z-10">
          Here's your celebration, <br />
          <span className="text-[#9cb092] font-agatho">brought to life.</span>
        </h1>
        <div className="w-[1px] h-3 bg-[#9cb092]/40 mt-1.5" />
      </div>

      {/* Layout — card left, compact details right */}
      <div className="flex flex-col lg:flex-row gap-5 max-w-2xl mx-auto items-start">

        {/* Evite Card Preview — sized to fit viewport without scroll */}
        <div className="final-card max-w-[240px] w-full lg:w-[200px] xl:w-[220px] flex-shrink-0 mx-auto lg:mx-0">
          <div className="overflow-hidden border border-white/15 shadow-2xl shadow-[#9cb092]/5">
            <div className="relative aspect-[3/4]">
              <img
                src={previewImage}
                alt={template?.name ?? 'Custom design'}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-5">
                <p className="font-display text-[8px] tracking-[0.25em] uppercase text-white/50 mb-1">
                  You're invited to
                </p>
                <h4 className="font-serif-exp text-xl text-white leading-tight">
                  {eventInfo?.label === 'Wedding'
                    ? `${formData.brideName || 'Bride'} & ${formData.groomName || 'Groom'}`
                    : eventType === 'custom'
                    ? formData.eventName || displayName || 'Your Event'
                    : `${displayName}'s ${eventInfo?.label}`}
                </h4>
                <div className="space-y-1 mt-3">
                  <p className="font-display text-[9px] tracking-wide text-white/80 flex items-center gap-1.5">
                    <span className="material-icons text-[#9cb092] text-[10px]">calendar_today</span>
                    {displayDate}
                  </p>
                  {formData.eventTime && (
                    <p className="font-display text-[9px] tracking-wide text-white/80 flex items-center gap-1.5">
                      <span className="material-icons text-[#9cb092] text-[10px]">schedule</span>
                      {formData.eventTime}
                    </p>
                  )}
                  <p className="font-display text-[9px] tracking-wide text-white/80 flex items-center gap-1.5">
                    <span className="material-icons text-[#9cb092] text-[10px]">location_on</span>
                    {displayVenue}
                  </p>
                  {formData.rsvpContact && (
                    <p className="font-display text-[9px] tracking-wide text-white/80 flex items-center gap-1.5">
                      <span className="material-icons text-[#9cb092] text-[10px]">mail</span>
                      RSVP: {formData.rsvpContact}
                    </p>
                  )}
                </div>
                {formData.customMessage && (
                  <p className="font-serif-exp text-xs text-white/60 mt-3 border-t border-white/10 pt-2">
                    "{formData.customMessage}"
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Event Details Summary — compact, no sticky/scroll */}
        <div className="final-details flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-display text-[9px] tracking-[0.25em] uppercase text-[#b2c3b1]">
              Event Details
            </h3>
            <p className="font-display text-[8px] tracking-[0.12em] text-[#9cb092]/60 uppercase flex items-center gap-1">
              <span className="material-icons text-[10px]">edit</span>
              Tap to edit
            </p>
          </div>

          <div className="space-y-1.5">
            {allFields.map((field) => {
              const value = formData[field.name];
              if (!value && editingField !== field.name) return null;
              const isEditing = editingField === field.name;

              return (
                <div key={field.name} className="border-b border-white/5 pb-1.5">
                  <p className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/45 mb-0.5">
                    {field.label}
                  </p>
                  {isEditing ? (
                    <div className="flex flex-col gap-1.5">
                      {field.type === 'textarea' ? (
                        <Textarea
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={`${inputClass} min-h-[50px]`}
                          autoFocus
                        />
                      ) : (
                        <Input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className={inputClass}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit();
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={saveEdit}
                          className="font-display text-[8px] tracking-[0.12em] uppercase text-[#9cb092] hover:text-[#adc4a3] flex items-center gap-1 transition-colors"
                        >
                          <span className="material-icons text-[10px]">check</span>
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="font-display text-[8px] tracking-[0.12em] uppercase text-[#b2c3b1]/50 hover:text-[#b2c3b1] flex items-center gap-1 transition-colors"
                        >
                          <span className="material-icons text-[10px]">close</span>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(field.name)}
                      className="w-full text-left group/edit flex items-center justify-between gap-2"
                    >
                      <p className="font-serif-exp text-xs text-[#e4eee1] leading-snug">
                        {field.type === 'date'
                          ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : value}
                      </p>
                      <span className="material-icons text-[#9cb092]/0 group-hover/edit:text-[#9cb092]/60 text-[10px] transition-all flex-shrink-0">
                        edit
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
