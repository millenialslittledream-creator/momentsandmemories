import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface GuestDetailsProps {
  guests: Guest[];
  onGuestsChange: (guests: Guest[]) => void;
  deliveryPreference: 'email' | 'phone' | 'both';
  onDeliveryPreferenceChange: (pref: 'email' | 'phone' | 'both') => void;
}

let guestIdCounter = 0;

function createGuest(): Guest {
  return { id: `guest-${++guestIdCounter}`, name: '', email: '', phone: '' };
}

export default function GuestDetails({
  guests,
  onGuestsChange,
  deliveryPreference,
  onDeliveryPreferenceChange,
}: GuestDetailsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.guest-section',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const addGuest = () => {
    onGuestsChange([...guests, createGuest()]);
  };

  const removeGuest = (id: string) => {
    if (guests.length <= 1) return;
    onGuestsChange(guests.filter((g) => g.id !== id));
  };

  const updateGuest = (id: string, field: keyof Guest, value: string) => {
    onGuestsChange(
      guests.map((g) => (g.id === id ? { ...g, [field]: value } : g))
    );
  };

  const inputClass =
    'bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30';

  const prefOptions: { value: 'email' | 'phone' | 'both'; label: string; icon: string }[] = [
    { value: 'email', label: 'Email', icon: 'email' },
    { value: 'phone', label: 'Phone / SMS', icon: 'smartphone' },
    { value: 'both', label: 'Both', icon: 'mark_email_read' },
  ];

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-6 mt-4">
        <h1 className="text-3xl md:text-5xl font-serif-exp italic text-center mb-3 relative z-10">
          Who's on the <br />
          <span className="text-[#9cb092] not-italic font-agatho">guest list?</span>
        </h1>
        <div className="w-[1px] h-6 bg-[#9cb092]/40 mt-3" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Delivery Preference */}
        <div className="guest-section glass-panel rounded-none p-8">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-6 pb-3 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">send</span>
            How should we deliver the evite?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {prefOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onDeliveryPreferenceChange(opt.value)}
                className={`group relative overflow-hidden text-center py-5 px-4 border transition-all duration-300 ${
                  deliveryPreference === opt.value
                    ? 'border-[#9cb092] bg-[#9cb092]/10 shadow-lg shadow-[#9cb092]/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                }`}
              >
                <span
                  className={`material-icons text-2xl mb-2 block transition-colors ${
                    deliveryPreference === opt.value
                      ? 'text-[#9cb092]'
                      : 'text-[#b2c3b1]/50'
                  }`}
                >
                  {opt.icon}
                </span>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#e4eee1]">
                  {opt.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Guest List */}
        <div className="guest-section glass-panel rounded-none p-8">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
            <h3 className="font-serif-exp text-lg text-[#e4eee1] italic flex items-center gap-3">
              <span className="material-icons text-[#9cb092] text-lg">group</span>
              Guest List
            </h3>
            <span className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/50">
              {guests.length} {guests.length === 1 ? 'guest' : 'guests'}
            </span>
          </div>

          <div className="space-y-6">
            {guests.map((guest, index) => (
              <div
                key={guest.id}
                className="relative p-5 border border-white/5 bg-white/[0.02]"
              >
                {/* Guest number & remove */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-display text-[9px] tracking-[0.2em] uppercase text-[#9cb092]">
                    Guest {index + 1}
                  </span>
                  {guests.length > 1 && (
                    <button
                      onClick={() => removeGuest(guest.id)}
                      className="text-[#b2c3b1]/30 hover:text-red-400/70 transition-colors"
                    >
                      <span className="material-icons text-sm">close</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name — always shown */}
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                      Name <span className="text-[#9cb092]">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={guest.name}
                      onChange={(e) => updateGuest(guest.id, 'name', e.target.value)}
                      placeholder="Guest name"
                      className={inputClass}
                    />
                  </div>

                  {/* Email — shown for email or both */}
                  {(deliveryPreference === 'email' || deliveryPreference === 'both') && (
                    <div className="space-y-1.5">
                      <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                        Email <span className="text-[#9cb092]">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={guest.email}
                        onChange={(e) => updateGuest(guest.id, 'email', e.target.value)}
                        placeholder="guest@email.com"
                        className={inputClass}
                      />
                    </div>
                  )}

                  {/* Phone — shown for phone or both */}
                  {(deliveryPreference === 'phone' || deliveryPreference === 'both') && (
                    <div className="space-y-1.5">
                      <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                        Phone <span className="text-[#9cb092]">*</span>
                      </Label>
                      <Input
                        type="tel"
                        value={guest.phone}
                        onChange={(e) => updateGuest(guest.id, 'phone', e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className={inputClass}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Guest Button */}
          <button
            onClick={addGuest}
            className="mt-6 w-full py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
          >
            <span className="material-icons text-sm">add</span>
            Add Another Guest
          </button>
        </div>
      </div>
    </div>
  );
}

export { createGuest };
