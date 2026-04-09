import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

const SUB_EVENTS = [
  { id: 'mehendi', label: 'Mehendi', icon: 'spa' },
  { id: 'haldi', label: 'Haldi', icon: 'local_florist' },
  { id: 'sangeet', label: 'Sangeet', icon: 'music_note' },
] as const;

interface EventDetailsFormProps {
  eventType: EventType;
  formData: Record<string, string>;
  onChange: (name: string, value: string) => void;
  errors: Record<string, boolean>;
}

/* ── Time Picker (scroll-friendly number inputs) ──────────── */
function TimePicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) {
  const parseTime = (v: string) => {
    if (!v) return { hour: '', minute: '', period: 'PM' };
    const match24 = v.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      let h = parseInt(match24[1]);
      const m = match24[2];
      const period = h >= 12 ? 'PM' : 'AM';
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      return { hour: String(h), minute: m, period };
    }
    const match12 = v.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match12) {
      return { hour: match12[1], minute: match12[2], period: match12[3].toUpperCase() };
    }
    return { hour: '', minute: '', period: 'PM' };
  };

  const { hour, minute, period } = parseTime(value);

  const buildTime = (h: string, m: string, p: string) => {
    if (!h || !m) return '';
    return `${h}:${m} ${p}`;
  };

  const clampHour = (n: number) => ((n - 1 + 12) % 12) + 1;
  const clampMinute = (n: number) => ((n % 60) + 60) % 60;

  const baseClass = `bg-white/[0.06] backdrop-blur-sm border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display text-center text-sm outline-none transition-colors h-9 rounded-md ${
    hasError ? 'border-red-400/60 ring-1 ring-red-400/20' : ''
  }`;

  return (
    <div className="flex items-center gap-1.5">
      {/* Hour */}
      <input
        type="number"
        min={1}
        max={12}
        value={hour}
        placeholder="HH"
        onChange={(e) => {
          const h = clampHour(parseInt(e.target.value) || 1);
          onChange(buildTime(String(h), minute || '00', period));
        }}
        onWheel={(e) => {
          e.preventDefault();
          const cur = parseInt(hour) || 12;
          const h = clampHour(cur + (e.deltaY < 0 ? 1 : -1));
          onChange(buildTime(String(h), minute || '00', period));
        }}
        className={`${baseClass} w-[56px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />

      <span className="text-[#b2c3b1]/60 font-display text-lg font-bold">:</span>

      {/* Minute */}
      <input
        type="number"
        min={0}
        max={59}
        value={minute}
        placeholder="MM"
        onChange={(e) => {
          const m = clampMinute(parseInt(e.target.value) || 0);
          onChange(buildTime(hour || '12', String(m).padStart(2, '0'), period));
        }}
        onWheel={(e) => {
          e.preventDefault();
          const cur = parseInt(minute) || 0;
          const m = clampMinute(cur + (e.deltaY < 0 ? 5 : -5));
          onChange(buildTime(hour || '12', String(m).padStart(2, '0'), period));
        }}
        className={`${baseClass} w-[56px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
      />

      {/* AM/PM toggle button */}
      <button
        type="button"
        onClick={() => {
          const newP = period === 'AM' ? 'PM' : 'AM';
          onChange(buildTime(hour || '12', minute || '00', newP));
        }}
        className={`${baseClass} w-[56px] cursor-pointer hover:bg-[#9cb092]/10 active:scale-95`}
      >
        {period}
      </button>
    </div>
  );
}

/* ── Date Picker ───────────────────────────────────────────── */
function DatePicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T00:00:00') : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-3 w-full px-3 py-2 text-left bg-white/[0.06] backdrop-blur-sm border border-white/15 hover:border-[#9cb092]/60 transition-colors font-display text-sm ${
            hasError ? 'border-red-400/60 ring-1 ring-red-400/20' : ''
          } ${value ? 'text-[#e4eee1]' : 'text-[#b2c3b1]/30'}`}
        >
          <span className="material-icons text-[#9cb092] text-lg">calendar_today</span>
          {selected ? format(selected, 'MMMM d, yyyy') : 'Select a date'}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-[#1a2418] border-white/15 backdrop-blur-xl"
        align="start"
      >
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }
          }}
          disabled={{ before: new Date() }}
          className="bg-transparent text-[#e4eee1]"
          classNames={{
            day: 'text-[#e4eee1] hover:bg-[#9cb092]/20 rounded-md h-9 w-9 p-0 font-display text-sm aria-selected:bg-[#9cb092] aria-selected:text-[#111914]',
            today: 'bg-[#9cb092]/10 text-[#9cb092] font-bold rounded-md',
            month_caption: 'font-display text-[#e4eee1] text-sm flex items-center justify-center h-8',
            weekday: 'text-[#b2c3b1]/50 font-display text-[10px] uppercase',
            button_previous: 'text-[#b2c3b1] hover:text-[#9cb092] hover:bg-[#9cb092]/10 rounded-md h-8 w-8 p-0',
            button_next: 'text-[#b2c3b1] hover:text-[#9cb092] hover:bg-[#9cb092]/10 rounded-md h-8 w-8 p-0',
            outside: 'text-[#b2c3b1]/20',
            disabled: 'text-[#b2c3b1]/15',
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

/* ── Venue Autocomplete ────────────────────────────────────── */
function VenueAutocomplete({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps?.places) return;
    const existing = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existing) return;

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!apiKey) return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Attach autocomplete once Google Maps is available
  useEffect(() => {
    if (autocompleteRef.current || !inputRef.current) return;

    const tryAttach = () => {
      if (!window.google?.maps?.places || !inputRef.current) return false;
      try {
        const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['establishment', 'geocode'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          const val = place?.formatted_address || place?.name || '';
          if (val) onChangeRef.current(val);
        });
        autocompleteRef.current = ac;
        return true;
      } catch {
        return false;
      }
    };

    if (tryAttach()) return;

    // Poll until Google Maps loads (it's async)
    const interval = setInterval(() => {
      if (tryAttach()) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const baseInputClass = `bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 ${
    hasError ? 'border-red-400/60 ring-1 ring-red-400/20' : ''
  }`;

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-[#9cb092] text-lg pointer-events-none">
        location_on
      </span>
      {/* Use defaultValue instead of value so Google Autocomplete can manipulate the DOM input */}
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing an address..."
        className={`flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none ${baseInputClass} pl-10`}
      />
    </div>
  );
}

/* ── Field Renderer ────────────────────────────────────────── */
function renderField(
  field: EventField,
  value: string,
  onChange: (name: string, value: string) => void,
  hasError: boolean
) {
  const baseInputClass = `bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30 ${
    hasError ? 'border-red-400/60 ring-1 ring-red-400/20' : ''
  }`;

  // Date field — use modern calendar popover
  if (field.type === 'date') {
    return (
      <DatePicker
        value={value}
        onChange={(val) => onChange(field.name, val)}
        hasError={hasError}
      />
    );
  }

  // Time field — use segmented time picker
  if (field.type === 'time') {
    return (
      <TimePicker
        value={value}
        onChange={(val) => onChange(field.name, val)}
        hasError={hasError}
      />
    );
  }

  // Venue field — use autocomplete
  if (field.name === 'venue') {
    return (
      <VenueAutocomplete
        value={value}
        onChange={(val) => onChange(field.name, val)}
        hasError={hasError}
      />
    );
  }

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
  const [hasSubEvents, setHasSubEvents] = useState(
    () => SUB_EVENTS.some((se) => formData[`sub_${se.id}_enabled`] === 'true')
  );
  const [enabledSubEvents, setEnabledSubEvents] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SUB_EVENTS.map((se) => [se.id, formData[`sub_${se.id}_enabled`] === 'true']))
  );

  const eventInfo = eventTypes.find((e) => e.id === eventType);
  const specificFields = eventSpecificFields[eventType];

  const toggleSubEvent = (id: string) => {
    const newVal = !enabledSubEvents[id];
    setEnabledSubEvents((prev) => ({ ...prev, [id]: newVal }));
    onChange(`sub_${id}_enabled`, newVal ? 'true' : '');
    if (!newVal) {
      // Clear sub-event fields when disabled
      onChange(`sub_${id}_date`, '');
      onChange(`sub_${id}_time`, '');
      onChange(`sub_${id}_venue`, '');
    }
  };

  const toggleHasSubEvents = () => {
    const newVal = !hasSubEvents;
    setHasSubEvents(newVal);
    if (!newVal) {
      // Clear all sub-event data
      SUB_EVENTS.forEach((se) => {
        setEnabledSubEvents((prev) => ({ ...prev, [se.id]: false }));
        onChange(`sub_${se.id}_enabled`, '');
        onChange(`sub_${se.id}_date`, '');
        onChange(`sub_${se.id}_time`, '');
        onChange(`sub_${se.id}_venue`, '');
      });
    }
  };

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
      <div ref={headingRef} className="flex flex-col items-center mb-8 mt-4">
        <h1 className="text-3xl md:text-5xl font-serif-exp italic text-center mb-4 relative z-10">
          Bring your celebration to life <br />
          <span className="text-[#9cb092] not-italic font-agatho">with the details.</span>
        </h1>
        <div className="w-[1px] h-8 bg-[#9cb092]/40 mt-4" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
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

        {/* Sub-events toggle — only for marriage */}
        {eventType === 'marriage' && (
          <div className="glass-panel rounded-none p-8">
            {/* Toggle */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h3 className="font-serif-exp text-lg text-[#e4eee1] italic flex items-center gap-3">
                <span className="material-icons text-[#9cb092] text-lg">celebration</span>
                Multiple Events
              </h3>
              <button
                onClick={toggleHasSubEvents}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  hasSubEvents ? 'bg-[#9cb092]' : 'bg-white/15'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                    hasSubEvents ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {!hasSubEvents && (
              <p className="font-display text-[11px] text-[#b2c3b1]/50 leading-relaxed">
                Toggle this on if your celebration includes multiple events like Mehendi, Haldi, or Sangeet.
              </p>
            )}

            {hasSubEvents && (
              <div className="space-y-6">
                {/* Sub-event checkboxes */}
                <div className="flex flex-wrap gap-3">
                  {SUB_EVENTS.map((se) => (
                    <button
                      key={se.id}
                      onClick={() => toggleSubEvent(se.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 border transition-all duration-300 ${
                        enabledSubEvents[se.id]
                          ? 'border-[#9cb092] bg-[#9cb092]/10 text-[#9cb092]'
                          : 'border-white/10 bg-white/[0.03] text-[#b2c3b1]/60 hover:border-white/25'
                      }`}
                    >
                      <span className={`w-4 h-4 border rounded-sm flex items-center justify-center transition-all ${
                        enabledSubEvents[se.id]
                          ? 'bg-[#9cb092] border-[#9cb092] text-[#111914]'
                          : 'border-white/30'
                      }`}>
                        {enabledSubEvents[se.id] && (
                          <span className="material-icons text-xs">check</span>
                        )}
                      </span>
                      <span className="material-icons text-sm">{se.icon}</span>
                      <span className="font-display text-[10px] tracking-[0.15em] uppercase">
                        {se.label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Fields for each enabled sub-event */}
                {SUB_EVENTS.filter((se) => enabledSubEvents[se.id]).map((se) => (
                  <div
                    key={se.id}
                    className="p-5 border border-white/5 bg-white/[0.02] space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <h4 className="font-serif-exp text-base text-[#e4eee1] italic flex items-center gap-2">
                      <span className="material-icons text-[#9cb092] text-base">{se.icon}</span>
                      {se.label}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Date
                        </Label>
                        <DatePicker
                          value={formData[`sub_${se.id}_date`] || ''}
                          onChange={(val) => onChange(`sub_${se.id}_date`, val)}
                          hasError={false}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Time
                        </Label>
                        <TimePicker
                          value={formData[`sub_${se.id}_time`] || ''}
                          onChange={(val) => onChange(`sub_${se.id}_time`, val)}
                          hasError={false}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Venue
                        </Label>
                        <VenueAutocomplete
                          value={formData[`sub_${se.id}_venue`] || ''}
                          onChange={(val) => onChange(`sub_${se.id}_venue`, val)}
                          hasError={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
