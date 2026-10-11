import { useMemo, useState } from 'react';
import { api, type RSVPConfig } from '@/lib/api';

export type RSVPStatus = 'accepted' | 'declined' | 'maybe' | null;

export interface RSVPInvitee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  rsvp_status: string;
  rsvp_message: string | null;
  dietary_requirements: string | null;
  party_size: number | null;
  kids_count: number | null;
  food_preference: string | null;
  meal_preferences: Record<string, number> | null;
}

export interface RSVPEventInfo {
  id: string;
  rsvp_enabled: boolean;
  rsvp_config?: Partial<RSVPConfig>;
}

interface Props {
  eventId: string;
  event: RSVPEventInfo;
  invitee?: RSVPInvitee | null;
  requireName?: boolean;
  onSubmitted?: () => void;
}

const DEFAULT_CONFIG: RSVPConfig = {
  enabled: true,
  responseOptions: { yes: true, no: true, maybe: true },
  collectGuestCount: true,
  collectKidsCount: true,
  collectFoodPreference: false,
  foodOptions: ['Vegetarian', 'Non-Vegetarian', 'Vegan', 'Kids Meal'],
  collectAdditionalInfo: true,
  childAgeCutoff: 12,
};

function normalizeRSVPConfig(raw?: Partial<RSVPConfig>): RSVPConfig {
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    responseOptions: {
      ...DEFAULT_CONFIG.responseOptions,
      ...(raw?.responseOptions ?? {}),
      yes: true,
      no: true,
    },
    foodOptions: raw?.foodOptions?.filter(Boolean).length
      ? raw.foodOptions.filter(Boolean)
      : DEFAULT_CONFIG.foodOptions,
  };
}

function CountStepper({ label, hint, value, min, onChange }: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#738269]/25 bg-white/75 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#2a3328]">{label}</p>
        <p className="text-xs text-[#44533e]/70">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="h-8 w-8 rounded-full border border-[#5f7256]/35 bg-white/70 text-lg text-[#405138] transition hover:bg-[#eef2e9] disabled:cursor-not-allowed disabled:border-[#5f7256]/20 disabled:text-[#5f7256]/45">−</button>
        <span className="w-5 text-center font-display text-sm text-[#2a3328]" aria-live="polite">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} className="h-8 w-8 rounded-full border border-[#5f7256]/35 bg-white/70 text-lg text-[#405138] transition hover:bg-[#eef2e9]">+</button>
      </div>
    </div>
  );
}

export default function GuestRSVPForm({ eventId, event, invitee = null, requireName = false, onSubmitted }: Props) {
  const existingKids = Math.max(0, invitee?.kids_count ?? 0);
  const existingTotal = Math.max(1, invitee?.party_size ?? 1);
  const existingStatus = invitee?.rsvp_status && invitee.rsvp_status !== 'pending'
    ? invitee.rsvp_status as Exclude<RSVPStatus, null>
    : null;

  const [name, setName] = useState(invitee?.name ?? '');
  const [phone, setPhone] = useState(invitee?.phone ?? '');
  const [nameConfirmed, setNameConfirmed] = useState(!requireName);
  const [currentInviteeId, setCurrentInviteeId] = useState(invitee?.id ?? '');
  const [status, setStatus] = useState<RSVPStatus>(existingStatus);
  const [message, setMessage] = useState(invitee?.rsvp_message ?? '');
  const [dietary, setDietary] = useState(invitee?.dietary_requirements ?? '');
  const [adults, setAdults] = useState(Math.max(1, existingTotal - existingKids));
  const [children, setChildren] = useState(existingKids);
  const [meals, setMeals] = useState<Record<string, number>>(invitee?.meal_preferences ?? {});
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(Boolean(existingStatus));
  const [messageSent, setMessageSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const config = useMemo(() => normalizeRSVPConfig(event.rsvp_config), [event.rsvp_config]);
  const totalAttendees = adults + (config.collectKidsCount ? children : 0);
  const mealTotal = Object.values(meals).reduce((sum, value) => sum + value, 0);
  const mealsValid = !config.collectFoodPreference || mealTotal === totalAttendees;
  const phoneValid = phone.replace(/\D/g, '').length >= 7 && phone.replace(/\D/g, '').length <= 15;
  const contactValid = Boolean(name.trim()) && phoneValid;
  const canSubmit = Boolean(status) && !(status === 'accepted' && !mealsValid);
  const rsvpOpen = Boolean(event.rsvp_enabled && config.enabled);
  const responseChoices = [
    config.responseOptions.yes && { value: 'accepted' as const, label: 'Yes, I’ll be there!', icon: 'check_circle' },
    config.responseOptions.no && { value: 'declined' as const, label: "Sorry, I can’t make it", icon: 'cancel' },
    config.responseOptions.maybe && { value: 'maybe' as const, label: 'Maybe', icon: 'help_outline' },
  ].filter(Boolean) as Array<{ value: Exclude<RSVPStatus, null>; label: string; icon: string }>;

  const setMealQuantity = (option: string, quantity: number) => {
    setMeals((current) => {
      if (quantity <= 0) {
        const next = { ...current };
        delete next[option];
        return next;
      }
      return { ...current, [option]: quantity };
    });
  };

  const handleSubmit = async () => {
    if (!status || !name.trim() || (requireName && !phoneValid) || (status === 'accepted' && !mealsValid)) return;
    setSubmitting(true);
    setSubmitError('');
    const payload = {
      status,
      message: config.collectAdditionalInfo ? message : '',
      dietary_requirements: status === 'accepted' && config.collectAdditionalInfo ? dietary : '',
      adults_count: status === 'accepted' ? adults : null,
      children_count: status === 'accepted' && config.collectKidsCount ? children : null,
      meal_preferences: status === 'accepted' && config.collectFoodPreference ? meals : {},
    };
    try {
      if (currentInviteeId) {
        await api.submitRSVP(eventId, currentInviteeId, payload);
      } else {
        const result = await api.submitOpenRSVP(eventId, { ...payload, name: name.trim(), phone: phone.trim() });
        setCurrentInviteeId(result.invitee_id);
      }
      setDone(true);
      onSubmitted?.();
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!guestMessage.trim() || !currentInviteeId) return;
    try {
      await api.sendGuestMessage(eventId, currentInviteeId, guestMessage, name.trim() || 'Guest');
      setGuestMessage('');
      setMessageSent(true);
    } catch {
      // Optional follow-up messaging must never undo a successful RSVP.
    }
  };

  if (!rsvpOpen) {
    return (
      <div className="py-6 text-center" data-testid="rsvp-closed">
        <span className="material-icons mb-3 text-3xl text-[#5f7256]/55">event_busy</span>
        <h2 className="font-serif-exp text-xl italic text-[#2a3328]">RSVPs are closed</h2>
        <p className="mt-2 text-sm text-[#44533e]/75">Please contact the host if you need to change your response.</p>
      </div>
    );
  }

  if (requireName && !nameConfirmed) {
    return (
      <section aria-labelledby="guest-name-heading" data-testid="share-link-name-step">
        <div className="mb-5 text-center">
          <p className="font-display text-[9px] uppercase tracking-[0.26em] text-[#5f7256]">Step 1 of 2</p>
          <h2 id="guest-name-heading" className="mt-1 font-serif-exp text-2xl italic text-[#2a3328]">First, your contact details</h2>
          <p className="mt-2 text-sm text-[#44533e]/75">The host will use these details to identify your response.</p>
        </div>
        <label htmlFor="share-rsvp-name" className="mb-2 block text-sm font-semibold text-[#2a3328]">Guest name <span className="text-red-700">*</span></label>
        <input
          id="share-rsvp-name"
          autoComplete="name"
          autoFocus
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full rounded-lg border border-[#5f7256]/35 bg-white/85 px-4 py-3 text-sm text-[#2a3328] outline-none placeholder:text-[#44533e]/45 focus:border-[#405138] focus:ring-2 focus:ring-[#5f7256]/15"
        />
        <label htmlFor="share-rsvp-phone" className="mb-2 mt-4 block text-sm font-semibold text-[#2a3328]">Phone number <span className="text-red-700">*</span></label>
        <input
          id="share-rsvp-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={32}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && contactValid) setNameConfirmed(true);
          }}
          placeholder="Enter your phone number"
          aria-describedby="share-rsvp-phone-hint"
          className="w-full rounded-lg border border-[#5f7256]/35 bg-white/85 px-4 py-3 text-sm text-[#2a3328] outline-none placeholder:text-[#44533e]/45 focus:border-[#405138] focus:ring-2 focus:ring-[#5f7256]/15"
        />
        <p id="share-rsvp-phone-hint" className="mt-1 text-[11px] text-[#44533e]/65">Include the country code if you are outside the host's country.</p>
        <button type="button" disabled={!contactValid} onClick={() => setNameConfirmed(true)} className={`mt-4 w-full rounded-full border py-3.5 font-display text-[10px] uppercase tracking-[0.25em] transition ${contactValid ? 'border-[#20251f] bg-[#20251f] text-white hover:bg-[#3d4a35]' : 'cursor-not-allowed border-[#5f7256]/35 bg-white/60 text-[#596653]'}`}>
          Continue to RSVP →
        </button>
      </section>
    );
  }

  if (done) {
    return (
      <div className="text-center" data-testid="rsvp-success">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#738269]/35 bg-[#eef2e9]"><span className="material-icons text-2xl text-[#5f7256]">{status === 'accepted' ? 'check' : status === 'maybe' ? 'help_outline' : 'close'}</span></div>
        <h2 className="font-serif-exp text-2xl italic text-[#2a3328]">{status === 'accepted' ? 'See you there!' : status === 'maybe' ? 'Thanks for letting us know' : 'Sorry to miss you'}</h2>
        <p className="mt-1 font-display text-[9px] uppercase tracking-[0.18em] text-[#44533e]/70">Your RSVP has been recorded for {name}</p>
        {status === 'accepted' && <p className="mt-4 text-sm text-[#44533e]/80">{totalAttendees} {totalAttendees === 1 ? 'attendee' : 'attendees'}{config.collectFoodPreference ? ` · ${mealTotal} meals` : ''}</p>}
        <button type="button" onClick={() => { setDone(false); setSubmitError(''); }} className="mt-5 rounded-full border border-[#5f7256]/45 bg-white/55 px-5 py-2 font-display text-[9px] uppercase tracking-[0.18em] text-[#405138] transition hover:bg-[#eef2e9]">Update RSVP</button>
        {config.collectAdditionalInfo && !messageSent ? (
          <div className="mt-8 border-t border-[#738269]/20 pt-6 text-left">
            <label htmlFor="host-note" className="mb-2 block text-sm font-medium text-[#2a3328]">Leave another message for the host <span className="font-normal text-[#44533e]/65">(optional)</span></label>
            <textarea id="host-note" value={guestMessage} onChange={(e) => setGuestMessage(e.target.value)} placeholder="Write something…" rows={3} className="w-full rounded-lg border border-[#738269]/30 bg-white/85 p-3 text-sm text-[#2a3328] outline-none placeholder:text-[#44533e]/45 focus:border-[#405138]" />
            <button type="button" onClick={handleSendMessage} disabled={!guestMessage.trim()} className="mt-2 w-full rounded-lg border border-[#5f7256]/40 bg-white/55 py-3 font-display text-[9px] uppercase tracking-[0.18em] text-[#405138] transition hover:bg-[#eef2e9] disabled:cursor-not-allowed disabled:text-[#44533e]/45">Send Message</button>
          </div>
        ) : messageSent ? <p className="mt-6 text-sm text-[#405138]">✓ Message sent</p> : null}
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} data-testid="rsvp-form">
      <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-[#738269]/20 bg-[#eef2e9]/80 px-4 py-3">
        <p className="font-display text-[9px] uppercase tracking-[0.16em] text-[#44533e]/75">Responding as <strong className="text-[#2a3328]">{name}</strong>{requireName && <span> · {phone}</span>}</p>
        {requireName && !currentInviteeId && <button type="button" onClick={() => setNameConfirmed(false)} className="font-display text-[8px] uppercase tracking-[0.15em] text-[#405138] underline underline-offset-4">Edit</button>}
      </div>

      <fieldset>
        <legend className="mb-3 text-base font-semibold text-[#2a3328]">Will you be attending?</legend>
        <div className="space-y-2">
          {responseChoices.map((choice) => (
            <label key={choice.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${status === choice.value ? 'border-[#405138] bg-[#eef2e9]' : 'border-[#738269]/25 bg-white/75 hover:border-[#405138]/55'}`}>
              <input type="radio" name="rsvp-status" value={choice.value} checked={status === choice.value} onChange={() => setStatus(choice.value)} className="accent-[#3d4a35]" />
              <span className="material-icons text-lg text-[#405138]">{choice.icon}</span>
              <span className="text-sm text-[#2a3328]">{choice.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {status === 'accepted' && (
        <div className="mt-7 space-y-6">
          {(config.collectGuestCount || config.collectKidsCount) && (
            <section aria-labelledby="attendee-heading">
              <h2 id="attendee-heading" className="mb-3 text-base font-semibold text-[#2a3328]">Number of attendees</h2>
              <div className="space-y-2">
                {config.collectGuestCount && <CountStepper label="Adults" hint="Including yourself" value={adults} min={1} onChange={setAdults} />}
                {config.collectKidsCount && <CountStepper label="Children" hint={`Under ${config.childAgeCutoff} years`} value={children} min={0} onChange={setChildren} />}
              </div>
              <div className="mt-2 flex items-center justify-between rounded-lg bg-[#dfe7db] px-4 py-3"><span className="text-sm font-semibold text-[#2a3328]">Total attendees</span><strong className="text-lg text-[#2a3328]">{totalAttendees}</strong></div>
            </section>
          )}

          {config.collectFoodPreference && (
            <section aria-labelledby="food-heading">
              <h2 id="food-heading" className="text-base font-semibold text-[#2a3328]">Food preferences</h2>
              <p className="mb-3 mt-1 text-xs leading-relaxed text-[#44533e]/75">Select all applicable meal options and specify how many people prefer each.</p>
              <div className="space-y-2">
                {config.foodOptions.map((option) => {
                  const quantity = meals[option] ?? 0;
                  const selected = quantity > 0;
                  return (
                    <div key={option} className={`rounded-xl border px-4 py-3 transition ${selected ? 'border-[#405138]/55 bg-[#eef2e9]' : 'border-[#738269]/25 bg-white/75'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex min-w-0 cursor-pointer items-center gap-3"><input type="checkbox" checked={selected} onChange={() => setMealQuantity(option, selected ? 0 : 1)} className="accent-[#3d4a35]" /><span className="text-sm text-[#2a3328]">{option}</span></label>
                        {selected && <div className="flex items-center gap-2"><button type="button" aria-label={`Decrease ${option} meals`} onClick={() => setMealQuantity(option, quantity - 1)} className="h-7 w-7 rounded-full border border-[#5f7256]/35 bg-white/70 text-[#405138]">−</button><span className="w-4 text-center text-sm text-[#2a3328]">{quantity}</span><button type="button" aria-label={`Increase ${option} meals`} onClick={() => setMealQuantity(option, quantity + 1)} className="h-7 w-7 rounded-full border border-[#5f7256]/35 bg-white/70 text-[#405138]">+</button></div>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 rounded-lg bg-[#dfe7db] px-4 py-3">
                <div className="flex items-center justify-between text-sm font-semibold text-[#2a3328]"><span>Meals selected</span><span>{mealTotal} / {totalAttendees}</span></div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/85"><div className={`h-full rounded-full transition-all ${mealsValid ? 'bg-emerald-700' : 'bg-amber-600'}`} style={{ width: `${Math.min(100, (mealTotal / Math.max(1, totalAttendees)) * 100)}%` }} /></div>
                <p className={`mt-2 text-xs ${mealsValid ? 'text-emerald-800' : 'text-amber-800'}`} aria-live="polite">{mealsValid ? '✓ All attendees have a meal preference.' : mealTotal < totalAttendees ? `Choose ${totalAttendees - mealTotal} more ${totalAttendees - mealTotal === 1 ? 'meal' : 'meals'}.` : `Remove ${mealTotal - totalAttendees} ${mealTotal - totalAttendees === 1 ? 'meal' : 'meals'}.`}</p>
              </div>
            </section>
          )}

          {config.collectAdditionalInfo && (
            <div>
              <label htmlFor="dietary-needs" className="mb-2 block text-sm font-medium text-[#2a3328]">Other / Special dietary needs <span className="font-normal text-[#44533e]/65">(optional)</span></label>
              <textarea id="dietary-needs" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Allergies or special requests, e.g. gluten-free" rows={2} className="w-full rounded-lg border border-[#738269]/30 bg-white/85 p-3 text-sm text-[#2a3328] outline-none placeholder:text-[#44533e]/45 focus:border-[#405138]" />
              <p className="mt-1 text-[11px] text-[#44533e]/65">This is recorded separately from meal counts so guests are never counted twice.</p>
            </div>
          )}
        </div>
      )}

      {status && config.collectAdditionalInfo && <div className="mt-6"><label htmlFor="rsvp-message" className="mb-2 block text-sm font-medium text-[#2a3328]">Message to host <span className="font-normal text-[#44533e]/65">(optional)</span></label><textarea id="rsvp-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a note…" rows={3} className="w-full rounded-lg border border-[#738269]/30 bg-white/85 p-3 text-sm text-[#2a3328] outline-none placeholder:text-[#44533e]/45 focus:border-[#405138]" /></div>}
      {submitError && <p className="mt-4 rounded-lg border border-red-800/20 bg-red-50/75 px-3 py-2 text-center text-sm text-red-800" role="alert">{submitError}</p>}
      <button type="submit" disabled={!canSubmit || submitting} className={`mt-7 w-full rounded-full border py-3.5 font-display text-[10px] uppercase tracking-[0.25em] transition ${canSubmit && !submitting ? 'border-[#20251f] bg-[#20251f] text-white hover:bg-[#3d4a35]' : 'cursor-not-allowed border-[#5f7256]/35 bg-white/60 text-[#596653]'}`}>{submitting ? 'Sending…' : 'Confirm RSVP →'}</button>
    </form>
  );
}
