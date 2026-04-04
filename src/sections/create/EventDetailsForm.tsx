import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  commonFields,
  eventSpecificFields,
  eventTypes,
  type EventType,
  type EventField,
} from '@/data/eventFields';

interface EventDetailsFormProps {
  eventType: EventType;
  formData: Record<string, string>;
  onChange: (name: string, value: string) => void;
  errors: Record<string, boolean>;
}

function renderField(
  field: EventField,
  value: string,
  onChange: (name: string, value: string) => void,
  hasError: boolean
) {
  const baseInputClass = `bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 ${
    hasError ? 'border-red-400/60 ring-1 ring-red-400/20' : ''
  }`;

  switch (field.type) {
    case 'textarea':
      return (
        <Textarea
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={`${baseInputClass} min-h-[100px]`}
        />
      );
    case 'select':
      return (
        <Select value={value} onValueChange={(val) => onChange(field.name, val)}>
          <SelectTrigger className={`${baseInputClass} w-full`}>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2418] border-white/15 backdrop-blur-xl">
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt} className="font-display text-[#e4eee1] focus:bg-[#9cb092]/20 focus:text-[#e4eee1]">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input
          type={field.type}
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.placeholder}
          className={baseInputClass}
        />
      );
  }
}

export default function EventDetailsForm({
  eventType,
  formData,
  onChange,
  errors,
}: EventDetailsFormProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  const eventInfo = eventTypes.find((e) => e.id === eventType);
  const specificFields = eventSpecificFields[eventType];

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.form-field',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: 'power3.out',
          delay: 0.3,
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, [eventType]);

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-16 mt-8">
        <h1 className="text-4xl md:text-6xl font-serif-exp italic text-center mb-6 relative z-10">
          Tell us the <br />
          <span className="text-[#9cb092] not-italic font-agatho">Details</span>
        </h1>
        <p className="text-xs md:text-sm font-display tracking-[0.25em] text-[#b2c3b1] uppercase">
          Fill in the details for your <span className="font-semibold text-[#9cb092]">{eventInfo?.label}</span> invitation
        </p>
        <div className="w-[1px] h-12 bg-[#9cb092]/40 mt-8" />
      </div>

      <div className="max-w-2xl mx-auto space-y-12">
        {/* Event-specific fields first */}
        <div className="glass-panel rounded-none p-8">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-8 pb-3 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">{eventInfo?.icon}</span>
            {eventInfo?.label} Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specificFields.map((field) => (
              <div
                key={field.name}
                className={`form-field space-y-2 ${
                  field.type === 'textarea' ? 'md:col-span-2' : ''
                }`}
              >
                <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                  {field.label}
                  {field.required && <span className="text-[#9cb092] ml-1">*</span>}
                </Label>
                {renderField(field, formData[field.name] || '', onChange, !!errors[field.name])}
                {errors[field.name] && (
                  <p className="text-red-400/80 text-[10px] font-display tracking-wide">This field is required</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Common fields */}
        <div className="glass-panel rounded-none p-8">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-8 pb-3 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">event</span>
            Event Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {commonFields.map((field) => (
              <div
                key={field.name}
                className={`form-field space-y-2 ${
                  field.type === 'textarea' ? 'md:col-span-2' : ''
                }`}
              >
                <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                  {field.label}
                  {field.required && <span className="text-[#9cb092] ml-1">*</span>}
                </Label>
                {renderField(field, formData[field.name] || '', onChange, !!errors[field.name])}
                {errors[field.name] && (
                  <p className="text-red-400/80 text-[10px] font-display tracking-wide">This field is required</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
