import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';

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
  const [qrSession, setQrSession] = useState<{ token: string; image: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState('');

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

  const handleQRImport = async () => {
    setQrLoading(true);
    setQrError('');
    try {
      const session = await api.createQRSession();
      setQrSession({ token: session.session_token, image: session.qr_image });

      const channel = supabase
        .channel(`qr-${session.session_token}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'qr_contact_sessions',
            filter: `session_token=eq.${session.session_token}`,
          },
          (payload: { new: { status: string; contacts_json: Array<{ name: string; email?: string; phone?: string }> } }) => {
            if (payload.new.status === 'completed') {
              const newGuests = payload.new.contacts_json.map((c) => ({
                id: `guest-${++guestIdCounter}`,
                name: c.name || '',
                email: c.email || '',
                phone: c.phone || '',
              }));
              if (newGuests.length > 0) {
                const existing = guests.filter((g) => g.name.trim());
                onGuestsChange([...existing, ...newGuests]);
              }
              supabase.removeChannel(channel);
              setQrSession(null);
            }
          }
        )
        .subscribe();
    } catch {
      setQrError('Could not start QR session. Make sure you are signed in.');
    } finally {
      setQrLoading(false);
    }
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
      <div ref={headingRef} className="flex flex-col items-center mb-4 mt-2">
        <h1 className="text-2xl md:text-4xl font-serif-exp italic text-center mb-2 relative z-10">
          Who's on the <br />
          <span className="text-[#9cb092] not-italic font-agatho">guest list?</span>
        </h1>
        <div className="w-[1px] h-4 bg-[#9cb092]/40 mt-2" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
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

          {/* Add Guest Buttons */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={addGuest}
              className="py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
            >
              <span className="material-icons text-sm">add</span>
              Add Guest
            </button>

            {/* Upload Excel/CSV */}
            <label className="py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2 cursor-pointer">
              <span className="material-icons text-sm">upload_file</span>
              Upload Excel / CSV
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (evt) => {
                    const text = evt.target?.result as string;
                    if (!text) return;
                    const lines = text.split('\n').filter((l) => l.trim());
                    // Skip header row if it looks like one
                    const startIdx = lines[0]?.toLowerCase().includes('name') ? 1 : 0;
                    const newGuests: Guest[] = [];
                    for (let i = startIdx; i < lines.length; i++) {
                      const cols = lines[i].split(/[,\t]/).map((c) => c.trim().replace(/^"|"$/g, ''));
                      if (cols[0]) {
                        newGuests.push({
                          id: `guest-${++guestIdCounter}`,
                          name: cols[0] || '',
                          email: cols[1] || '',
                          phone: cols[2] || '',
                        });
                      }
                    }
                    if (newGuests.length > 0) {
                      // Replace the initial empty guest or append
                      const existing = guests.filter((g) => g.name.trim());
                      onGuestsChange([...existing, ...newGuests]);
                    }
                  };
                  reader.readAsText(file);
                  e.target.value = '';
                }}
              />
            </label>

            <button
              onClick={handleQRImport}
              disabled={qrLoading}
              className="py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span className="material-icons text-sm">qr_code_scanner</span>
              {qrLoading ? 'Starting...' : 'QR Import'}
            </button>

            {/* Select from Phone Contacts */}
            <button
              onClick={async () => {
                try {
                  if ('contacts' in navigator && (navigator as any).contacts) {
                    const contacts = await (navigator as any).contacts.select(
                      ['name', 'email', 'tel'],
                      { multiple: true }
                    );
                    const newGuests: Guest[] = contacts.map((c: any) => ({
                      id: `guest-${++guestIdCounter}`,
                      name: c.name?.[0] || '',
                      email: c.email?.[0] || '',
                      phone: c.tel?.[0] || '',
                    }));
                    if (newGuests.length > 0) {
                      const existing = guests.filter((g) => g.name.trim());
                      onGuestsChange([...existing, ...newGuests]);
                    }
                  } else {
                    alert('Contact picker is only available on mobile devices (Android Chrome). Please use the Excel upload option on desktop.');
                  }
                } catch {
                  // User cancelled or not supported
                }
              }}
              className="py-3 border border-dashed border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092] flex items-center justify-center gap-2"
            >
              <span className="material-icons text-sm">contacts</span>
              Phone Contacts
            </button>
          </div>

          <p className="mt-3 font-display text-[9px] text-[#b2c3b1]/40 leading-relaxed">
            CSV/Excel format: Name, Email, Phone (one guest per row). Header row is optional.
          </p>
        </div>
      </div>

      {qrSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a2418] border border-[#9cb092]/30 p-8 max-w-sm w-full text-center">
            <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-2">Scan with Phone</h3>
            <p className="font-display text-[10px] tracking-[0.15em] text-[#b2c3b1]/60 uppercase mb-6">
              Open this QR on your phone → pick contacts → they appear here automatically
            </p>
            <img
              src={`data:image/png;base64,${qrSession.image}`}
              alt="QR Code"
              className="w-48 h-48 mx-auto mb-6 border border-white/10"
            />
            {qrError && <p className="text-red-400 text-xs mb-4">{qrError}</p>}
            <button
              onClick={() => setQrSession(null)}
              className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 hover:text-[#9cb092] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { createGuest };
