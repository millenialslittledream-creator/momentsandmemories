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

// Sub-events are now dynamic — users can add any event type

interface EventDetailsFormProps {
  eventType: EventType;
  formData: Record<string, string>;
  onChange: (name: string, value: string) => void;
  errors: Record<string, boolean>;
  onAutoAdvance?: () => void;
}

/* ── Time Picker (text inputs with local state — validates on blur) ── */
function TimePicker({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (val: string) => void;
  hasError: boolean;
}) {
  // Parse the parent value once for initial/sync state
  const parse = (v: string) => {
    if (!v) return { h: '', m: '', p: 'PM' };
    const m12 = v.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (m12) return { h: m12[1], m: m12[2], p: m12[3].toUpperCase() };
    const m24 = v.match(/^(\d{1,2}):(\d{2})$/);
    if (m24) {
      let hr = parseInt(m24[1]);
      const per = hr >= 12 ? 'PM' : 'AM';
      if (hr > 12) hr -= 12;
      if (hr === 0) hr = 12;
      return { h: String(hr), m: m24[2], p: per };
    }
    return { h: '', m: '', p: 'PM' };
  };

  const parsed = parse(value);
  const [hour, setHour] = useState(parsed.h);
  const [minute, setMinute] = useState(parsed.m);
  const [period, setPeriod] = useState(parsed.p);

  // Sync from parent when value changes externally
  useEffect(() => {
    const p = parse(value);
    setHour(p.h);
    setMinute(p.m);
    setPeriod(p.p);
  }, [value]);

  const commit = (h: string, m: string, p: string) => {
    if (h && m) onChange(`${h}:${m} ${p}`);
  };

  const baseClass = `bg-white/[0.06] backdrop-blur-sm border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display text-center text-sm outline-none transition-colors h-9 rounded-md ${
    hasError ? 'border-red-400/60 ring-1 ring-red-400/20' : ''
  }`;

  return (
    <div className="flex items-center gap-1.5">
      {/* Hour */}
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={hour}
        placeholder="HH"
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
          setHour(raw);
        }}
        onBlur={() => {
          let h = parseInt(hour) || 0;
          if (h < 1) h = 12;
          if (h > 12) h = 12;
          const s = String(h);
          setHour(s);
          commit(s, minute || '00', period);
        }}
        className={`${baseClass} w-[56px]`}
      />

      <span className="text-[#b2c3b1]/60 font-display text-lg font-bold select-none">:</span>

      {/* Minute */}
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={minute}
        placeholder="MM"
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, '').slice(0, 2);
          setMinute(raw);
        }}
        onBlur={() => {
          let m = parseInt(minute) || 0;
          if (m > 59) m = 59;
          const s = String(m).padStart(2, '0');
          setMinute(s);
          commit(hour || '12', s, period);
        }}
        className={`${baseClass} w-[56px]`}
      />

      {/* AM/PM toggle */}
      <button
        type="button"
        onClick={() => {
          const newP = period === 'AM' ? 'PM' : 'AM';
          setPeriod(newP);
          commit(hour || '12', minute || '00', newP);
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

/* ── Timezone Select — compact inline version ─────────────── */
const TIMEZONE_OPTIONS = [
  'PT',
  'MT',
  'CT',
  'ET',
  'AKT',
  'HAT',
  'AST',
  'SST',
  'ChST',
  'IST',
];

function TimezoneSelect({
  value,
  onChange,
  hasError,
}: {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}) {
  return (
    <div className="relative flex-1 min-w-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white/[0.06] backdrop-blur-sm border border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display text-sm h-9 rounded-md w-full pl-3 pr-7 appearance-none cursor-pointer outline-none transition-colors ${
          hasError ? 'border-red-400/60 ring-1 ring-red-400/20' : ''
        }`}
      >
        <option value="">Timezone</option>
        {TIMEZONE_OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-[#1a2418] text-[#e4eee1]">
            {opt}
          </option>
        ))}
      </select>
      <span className="material-icons absolute right-1.5 top-1/2 -translate-y-1/2 text-[#9cb092] pointer-events-none" style={{ fontSize: '14px' }}>
        expand_more
      </span>
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

  // Timezone — native select for smooth scrolling & keyboard letter-jump
  if (field.name === 'timezone') {
    return (
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          className={`${baseInputClass} w-full h-9 rounded-md px-3 pr-8 text-sm appearance-none cursor-pointer`}
        >
          <option value="">Select timezone</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt} className="bg-[#1a2418] text-[#e4eee1]">
              {opt}
            </option>
          ))}
        </select>
        <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-[#9cb092] text-sm pointer-events-none">
          expand_more
        </span>
      </div>
    );
  }

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

  // Venue field — plain text input (Google autocomplete available if API key is configured)
  if (field.name === 'venue') {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    const hasValidKey = apiKey && apiKey !== 'paste_your_key_here';
    if (hasValidKey) {
      return (
        <VenueAutocomplete
          value={value}
          onChange={(val) => onChange(field.name, val)}
          hasError={hasError}
        />
      );
    }
    // Fallback: plain input — lets user type any location
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-[#9cb092] text-lg pointer-events-none">
          location_on
        </span>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder="Enter venue or address"
          className={`${baseInputClass} pl-10`}
        />
      </div>
    );
  }

  switch (field.type) {
    case 'textarea':
      return (
        <div className="space-y-1">
          <Textarea
            value={value}
            onChange={(e) => {
              if (e.target.value.length <= 200) onChange(field.name, e.target.value);
            }}
            placeholder={field.placeholder}
            className={`${baseInputClass} min-h-[80px]`}
            maxLength={200}
          />
          <p className="text-[9px] font-display text-[#b2c3b1]/40 text-right">
            {value.length}/200 characters
          </p>
        </div>
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
    () => !!formData['sub_events_count']
  );


  // Dynamic sub-events: stored as sub_0_name, sub_0_date, etc.
  const getSubEventCount = () => parseInt(formData['sub_events_count'] || '0');

  const addSubEvent = () => {
    const count = getSubEventCount();
    onChange('sub_events_count', String(count + 1));
  };

  const removeSubEvent = (index: number) => {
    const count = getSubEventCount();
    // Shift all events after this one down
    for (let i = index; i < count - 1; i++) {
      onChange(`sub_${i}_name`, formData[`sub_${i + 1}_name`] || '');
      onChange(`sub_${i}_date`, formData[`sub_${i + 1}_date`] || '');
      onChange(`sub_${i}_time`, formData[`sub_${i + 1}_time`] || '');
      onChange(`sub_${i}_timezone`, formData[`sub_${i + 1}_timezone`] || '');
      onChange(`sub_${i}_venue`, formData[`sub_${i + 1}_venue`] || '');
    }
    // Clear the last one
    onChange(`sub_${count - 1}_name`, '');
    onChange(`sub_${count - 1}_date`, '');
    onChange(`sub_${count - 1}_time`, '');
    onChange(`sub_${count - 1}_timezone`, '');
    onChange(`sub_${count - 1}_venue`, '');
    onChange('sub_events_count', String(count - 1));
  };

  const toggleHasSubEvents = () => {
    const newVal = !hasSubEvents;
    setHasSubEvents(newVal);
    if (!newVal) {
      const count = getSubEventCount();
      for (let i = 0; i < count; i++) {
        onChange(`sub_${i}_name`, '');
        onChange(`sub_${i}_date`, '');
        onChange(`sub_${i}_time`, '');
        onChange(`sub_${i}_timezone`, '');
        onChange(`sub_${i}_venue`, '');
      }
      onChange('sub_events_count', '');
    } else if (!formData['sub_events_count']) {
      onChange('sub_events_count', '1');
    }
  };

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
      <div ref={headingRef} className="flex flex-col items-center mb-6 mt-0">
        <h1 className="text-2xl md:text-4xl font-serif-exp text-center mb-2 relative z-10">
          Bring your celebration to life <br />
          <span className="text-[#9cb092] font-agatho">with the details.</span>
        </h1>
        <div className="w-[1px] h-4 bg-[#9cb092]/40 mt-2" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Multiple Events — for weddings and custom events */}
        {(eventType === 'marriage' || eventType === 'custom') && (
          <div className="glass-panel rounded-none p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <h3 className="font-serif-exp text-lg text-[#e4eee1] flex items-center gap-3">
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
                {eventType === 'marriage'
                  ? 'Toggle this on if your celebration includes multiple events (e.g. Ceremony, Reception, Rehearsal Dinner, etc.)'
                  : 'Toggle this on if your celebration spans multiple events (e.g. Welcome Dinner, Main Event, After-Party, etc.)'}
              </p>
            )}

            {hasSubEvents && (
              <div className="space-y-6">
                {Array.from({ length: getSubEventCount() }, (_, i) => (
                  <div
                    key={i}
                    className="p-5 border border-white/5 bg-white/[0.02] space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif-exp text-base text-[#e4eee1] flex items-center gap-2">
                        <span className="material-icons text-[#9cb092] text-base">event</span>
                        Event {i + 1}
                      </h4>
                      <button
                        onClick={() => removeSubEvent(i)}
                        className="text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors"
                      >
                        <span className="material-icons text-sm">close</span>
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                        Event Name <span className="text-[#9cb092]">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formData[`sub_${i}_name`] || ''}
                        onChange={(e) => onChange(`sub_${i}_name`, e.target.value)}
                        placeholder={eventType === 'marriage'
                          ? 'e.g. Ceremony, Reception, Rehearsal Dinner...'
                          : 'e.g. Welcome Dinner, Main Event, After-Party...'}
                        className="bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Date
                        </Label>
                        <DatePicker
                          value={formData[`sub_${i}_date`] || ''}
                          onChange={(val) => onChange(`sub_${i}_date`, val)}
                          hasError={false}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Time
                        </Label>
                        <TimePicker
                          value={formData[`sub_${i}_time`] || ''}
                          onChange={(val) => onChange(`sub_${i}_time`, val)}
                          hasError={false}
                        />
                      </div>
                      {/* Timezone spans full width, sits directly below date+time row */}
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Timezone
                        </Label>
                        <TimezoneSelect
                          value={formData[`sub_${i}_timezone`] || ''}
                          onChange={(val) => onChange(`sub_${i}_timezone`, val)}
                        />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                          Venue
                        </Label>
                        <VenueAutocomplete
                          value={formData[`sub_${i}_venue`] || ''}
                          onChange={(val) => onChange(`sub_${i}_venue`, val)}
                          hasError={false}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addSubEvent}
                  className="w-full py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
                >
                  <span className="material-icons text-sm">add</span>
                  Add Another Event
                </button>
              </div>
            )}
          </div>
        )}

        {/* Event-specific fields */}
        <div className="glass-panel rounded-none p-6">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] mb-5 pb-2 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">{eventInfo?.icon}</span>
            Event Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event-specific fields */}
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
            {/* Common fields — timezone is inlined with eventTime, not standalone */}
            {commonFields.map((field) => {
              if (field.name === 'timezone') return null; // rendered inline with time

              const isTime = field.name === 'eventTime';

              return (
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

                  {isTime ? (
                    /* TimePicker stacked above compact TimezoneSelect — stays in its grid cell */
                    <div className="space-y-2">
                      <TimePicker
                        value={formData[field.name] || ''}
                        onChange={(val) => onChange(field.name, val)}
                        hasError={!!errors[field.name]}
                      />
                      <TimezoneSelect
                        value={formData['timezone'] || ''}
                        onChange={(val) => onChange('timezone', val)}
                        hasError={!!errors['timezone']}
                      />
                    </div>
                  ) : (
                    renderField(field, formData[field.name] || '', onChange, !!errors[field.name])
                  )}

                  {(errors[field.name] || (isTime && errors['timezone'])) && (
                    <p className="text-red-400/80 text-[10px] font-display tracking-wide">This field is required</p>
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
