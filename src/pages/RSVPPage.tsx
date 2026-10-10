import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type RSVPConfig } from '@/lib/api';

type RSVPStatus = 'accepted' | 'declined' | 'maybe' | null;

interface Invitee {
  id: string;
  name: string;
  email: string;
  rsvp_status: string;
  rsvp_message: string | null;
  dietary_requirements: string | null;
  party_size: number | null;
  kids_count: number | null;
  food_preference: string | null;
  meal_preferences: Record<string, number> | null;
}

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  rsvp_enabled: boolean;
  rsvp_config?: Partial<RSVPConfig>;
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

function normalizeConfig(raw?: Partial<RSVPConfig>): RSVPConfig {
  return {
    ...DEFAULT_CONFIG,
    ...raw,
    responseOptions: { ...DEFAULT_CONFIG.responseOptions, ...(raw?.responseOptions ?? {}), yes: true, no: true },
    foodOptions: raw?.foodOptions?.filter(Boolean).length ? raw.foodOptions.filter(Boolean) : DEFAULT_CONFIG.foodOptions,
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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-[#738269]/20 bg-white/70 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-[#2a3328]">{label}</p>
        <p className="text-xs text-[#5a6c50]/60">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="h-8 w-8 rounded-full border border-[#738269]/25 text-lg text-[#5f7256] transition hover:bg-[#eef2e9] disabled:opacity-30">−</button>
        <span className="w-5 text-center font-display text-sm text-[#2a3328]" aria-live="polite">{value}</span>
        <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(value + 1)} className="h-8 w-8 rounded-full border border-[#738269]/25 text-lg text-[#5f7256] transition hover:bg-[#eef2e9]">+</button>
      </div>
    </div>
  );
}

export default function RSVPPage() {
  const { eventId, inviteeId } = useParams<{ eventId: string; inviteeId: string }>();
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [invitee, setInvitee] = useState<Invitee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<RSVPStatus>(null);
  const [message, setMessage] = useState('');
  const [dietary, setDietary] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [meals, setMeals] = useState<Record<string, number>>({});
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!eventId || !inviteeId) return;
    api.getRSVPPage(eventId, inviteeId)
      .then((data: { event: EventInfo; invitee: Invitee }) => {
        const existingKids = Math.max(0, data.invitee.kids_count ?? 0);
        const existingTotal = Math.max(1, data.invitee.party_size ?? 1);
        setEvent(data.event);
        setInvitee(data.invitee);
        setMessage(data.invitee.rsvp_message || '');
        setDietary(data.invitee.dietary_requirements || '');
        setAdults(Math.max(1, existingTotal - existingKids));
        setChildren(existingKids);
        setMeals(data.invitee.meal_preferences ?? {});
        if (data.invitee.rsvp_status !== 'pending') {
          setStatus(data.invitee.rsvp_status as RSVPStatus);
          setDone(true);
        }
      })
      .catch(() => setError('This invitation link is not valid or has expired.'))
      .finally(() => setLoading(false));
  }, [eventId, inviteeId]);

  const config = useMemo(() => normalizeConfig(event?.rsvp_config), [event?.rsvp_config]);
  const totalAttendees = adults + (config.collectKidsCount ? children : 0);
  const mealTotal = Object.values(meals).reduce((sum, value) => sum + value, 0);
  const mealsValid = !config.collectFoodPreference || mealTotal === totalAttendees;
  const rsvpOpen = Boolean(event?.rsvp_enabled && config.enabled);
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
    if (!status || !eventId || !inviteeId || (status === 'accepted' && !mealsValid)) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.submitRSVP(eventId, inviteeId, {
        status,
        message: config.collectAdditionalInfo ? message : '',
        dietary_requirements: status === 'accepted' ? dietary : '',
        adults_count: status === 'accepted' ? adults : null,
        children_count: status === 'accepted' && config.collectKidsCount ? children : null,
        meal_preferences: status === 'accepted' && config.collectFoodPreference ? meals : {},
      });
      setDone(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!guestMessage.trim() || !eventId || !inviteeId) return;
    try {
      await api.sendGuestMessage(eventId, inviteeId, guestMessage, invitee?.name || 'Guest');
      setGuestMessage('');
      setMessageSent(true);
    } catch {
      // This note is optional; the recorded RSVP remains successful.
    }
  };

  if (loading) return <div className="page-bokeh-bg product-light-shell min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#5f7256] rounded-full animate-spin" /></div>;

  if (error || !event || !invitee) return (
    <div className="page-bokeh-bg product-light-shell min-h-screen flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#5f7256]/30">mail</span>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#5a6c50]/70 text-center max-w-xs">{error || 'Invitation not found'}</p>
    </div>
  );

  const dateStr = new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page-bokeh-bg product-light-shell min-h-screen px-4 py-10 sm:px-6 sm:py-16">
      <main className="mx-auto w-full max-w-xl overflow-hidden border border-[#738269]/15 bg-[#fdfefb]/80 shadow-[0_22px_70px_rgba(61,74,53,0.11)] backdrop-blur-sm">
        {event.cover_image_url && <div data-preserve-theme className="h-40 w-full overflow-hidden sm:h-52"><img src={event.cover_image_url} alt="" className="h-full w-full object-cover" /></div>}
        <div className="px-5 py-8 sm:px-10 sm:py-10">
          <header className="mb-8 text-center">
            <p className="mb-3 font-display text-[10px] uppercase tracking-[0.35em] text-[#5f7256]">Moments &amp; Memories</p>
            <h1 className="mb-3 font-serif-exp text-3xl italic leading-tight text-[#2a3328] sm:text-4xl">{event.title}</h1>
            <div className="mx-auto mb-3 h-px w-10 bg-[#738269]/40" />
            <p className="font-display text-[10px] uppercase tracking-[0.14em] text-[#5a6c50]/70">{dateStr}</p>
            {event.location && <p className="mt-1 text-xs text-[#5a6c50]/60">{event.location}</p>}
          </header>
          <div className="mb-7 rounded-lg border border-[#738269]/15 bg-[#eef2e9]/70 px-4 py-3 text-center"><p className="font-display text-[10px] uppercase tracking-[0.18em] text-[#5a6c50]/65">Invitation for <span className="font-semibold text-[#2a3328]">{invitee.name}</span></p></div>

          {!rsvpOpen ? (
            <div className="py-6 text-center"><span className="material-icons mb-3 text-3xl text-[#5f7256]/50">event_busy</span><h2 className="font-serif-exp text-xl italic text-[#2a3328]">RSVPs are closed</h2><p className="mt-2 text-sm text-[#5a6c50]/65">Please contact the host if you need to change your response.</p></div>
          ) : done ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#738269]/35 bg-[#eef2e9]"><span className="material-icons text-2xl text-[#5f7256]">{status === 'accepted' ? 'check' : status === 'maybe' ? 'help_outline' : 'close'}</span></div>
              <h2 className="font-serif-exp text-2xl italic text-[#2a3328]">{status === 'accepted' ? 'See you there!' : status === 'maybe' ? 'Thanks for letting us know' : 'Sorry to miss you'}</h2>
              <p className="mt-1 font-display text-[9px] uppercase tracking-[0.18em] text-[#5a6c50]/55">Your RSVP has been recorded</p>
              {status === 'accepted' && <p className="mt-4 text-sm text-[#5a6c50]/70">{totalAttendees} {totalAttendees === 1 ? 'attendee' : 'attendees'}{config.collectFoodPreference ? ` · ${mealTotal} meals` : ''}</p>}
              <button type="button" onClick={() => { setDone(false); setSubmitError(''); }} className="mt-5 rounded-full border border-[#5f7256]/35 px-5 py-2 font-display text-[9px] uppercase tracking-[0.18em] text-[#5f7256] transition hover:bg-[#eef2e9]">Update RSVP</button>
              {config.collectAdditionalInfo && !messageSent ? (
                <div className="mt-8 border-t border-[#738269]/15 pt-6 text-left">
                  <label htmlFor="host-note" className="mb-2 block text-sm font-medium text-[#2a3328]">Leave another message for the host <span className="font-normal text-[#5a6c50]/55">(optional)</span></label>
                  <textarea id="host-note" value={guestMessage} onChange={(e) => setGuestMessage(e.target.value)} placeholder="Write something…" rows={3} className="w-full rounded-lg border border-[#738269]/25 bg-white/80 p-3 text-sm text-[#2a3328] outline-none placeholder:text-[#5a6c50]/35 focus:border-[#5f7256]" />
                  <button type="button" onClick={handleSendMessage} disabled={!guestMessage.trim()} className="mt-2 w-full rounded-lg border border-[#5f7256]/30 py-3 font-display text-[9px] uppercase tracking-[0.18em] text-[#5f7256] transition hover:bg-[#eef2e9] disabled:opacity-35">Send Message</button>
                </div>
              ) : messageSent ? <p className="mt-6 text-sm text-[#5f7256]">✓ Message sent</p> : null}
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}>
              <fieldset>
                <legend className="mb-3 text-base font-semibold text-[#2a3328]">Will you be attending?</legend>
                <div className="space-y-2">
                  {responseChoices.map((choice) => <label key={choice.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${status === choice.value ? 'border-[#5f7256] bg-[#eef2e9]' : 'border-[#738269]/20 bg-white/65 hover:border-[#5f7256]/45'}`}><input type="radio" name="rsvp-status" value={choice.value} checked={status === choice.value} onChange={() => setStatus(choice.value)} className="accent-[#3d4a35]" /><span className="material-icons text-lg text-[#5f7256]">{choice.icon}</span><span className="text-sm text-[#2a3328]">{choice.label}</span></label>)}
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
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-[#e7ebe3] px-4 py-3"><span className="text-sm font-semibold text-[#2a3328]">Total attendees</span><strong className="text-lg text-[#2a3328]">{totalAttendees}</strong></div>
                    </section>
                  )}

                  {config.collectFoodPreference && (
                    <section aria-labelledby="food-heading">
                      <h2 id="food-heading" className="text-base font-semibold text-[#2a3328]">Food preferences</h2>
                      <p className="mb-3 mt-1 text-xs leading-relaxed text-[#5a6c50]/65">Select all applicable meal options and specify how many people prefer each.</p>
                      <div className="space-y-2">
                        {config.foodOptions.map((option) => {
                          const quantity = meals[option] ?? 0;
                          const selected = quantity > 0;
                          return (
                            <div key={option} className={`rounded-xl border px-4 py-3 transition ${selected ? 'border-[#5f7256]/45 bg-[#eef2e9]' : 'border-[#738269]/20 bg-white/65'}`}>
                              <div className="flex items-center justify-between gap-3">
                                <label className="flex min-w-0 cursor-pointer items-center gap-3"><input type="checkbox" checked={selected} onChange={() => setMealQuantity(option, selected ? 0 : 1)} className="accent-[#3d4a35]" /><span className="text-sm text-[#2a3328]">{option}</span></label>
                                {selected && <div className="flex items-center gap-2"><button type="button" aria-label={`Decrease ${option} meals`} onClick={() => setMealQuantity(option, quantity - 1)} className="h-7 w-7 rounded-full border border-[#738269]/25 text-[#5f7256]">−</button><span className="w-4 text-center text-sm text-[#2a3328]">{quantity}</span><button type="button" aria-label={`Increase ${option} meals`} onClick={() => setMealQuantity(option, quantity + 1)} className="h-7 w-7 rounded-full border border-[#738269]/25 text-[#5f7256]">+</button></div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 rounded-lg bg-[#e7ebe3] px-4 py-3">
                        <div className="flex items-center justify-between text-sm font-semibold text-[#2a3328]"><span>Meals selected</span><span>{mealTotal} / {totalAttendees}</span></div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80"><div className={`h-full rounded-full transition-all ${mealsValid ? 'bg-emerald-600' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, (mealTotal / Math.max(1, totalAttendees)) * 100)}%` }} /></div>
                        <p className={`mt-2 text-xs ${mealsValid ? 'text-emerald-700' : 'text-amber-700'}`} aria-live="polite">{mealsValid ? '✓ All attendees have a meal preference.' : mealTotal < totalAttendees ? `Choose ${totalAttendees - mealTotal} more ${totalAttendees - mealTotal === 1 ? 'meal' : 'meals'}.` : `Remove ${mealTotal - totalAttendees} ${mealTotal - totalAttendees === 1 ? 'meal' : 'meals'}.`}</p>
                      </div>
                      <label htmlFor="dietary-needs" className="mb-2 mt-4 block text-sm font-medium text-[#2a3328]">Other / Special dietary needs <span className="font-normal text-[#5a6c50]/55">(optional)</span></label>
                      <textarea id="dietary-needs" value={dietary} onChange={(e) => setDietary(e.target.value)} placeholder="Allergies or special requests, e.g. gluten-free" rows={2} className="w-full rounded-lg border border-[#738269]/25 bg-white/80 p-3 text-sm text-[#2a3328] outline-none placeholder:text-[#5a6c50]/35 focus:border-[#5f7256]" />
                    </section>
                  )}
                </div>
              )}

              {status && config.collectAdditionalInfo && <div className="mt-6"><label htmlFor="rsvp-message" className="mb-2 block text-sm font-medium text-[#2a3328]">Message to host <span className="font-normal text-[#5a6c50]/55">(optional)</span></label><textarea id="rsvp-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a note…" rows={3} className="w-full rounded-lg border border-[#738269]/25 bg-white/80 p-3 text-sm text-[#2a3328] outline-none placeholder:text-[#5a6c50]/35 focus:border-[#5f7256]" /></div>}
              {submitError && <p className="mt-4 text-center text-sm text-red-700" role="alert">{submitError}</p>}
              <button type="submit" disabled={!status || submitting || (status === 'accepted' && !mealsValid)} className="mt-7 w-full rounded-full bg-[#20251f] py-3.5 font-display text-[10px] uppercase tracking-[0.25em] text-white transition hover:bg-[#3d4a35] disabled:cursor-not-allowed disabled:opacity-35">{submitting ? 'Sending…' : 'Confirm RSVP →'}</button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
