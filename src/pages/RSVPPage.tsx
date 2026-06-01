import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';

type RSVPStatus = 'accepted' | 'declined' | null;

interface Invitee {
  id: string;
  name: string;
  email: string;
  rsvp_status: string;
  rsvp_message: string | null;
  dietary_requirements: string | null;
}

interface EventInfo {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  location: string | null;
  cover_image_url: string | null;
  rsvp_enabled: boolean;
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
  const [guestMessage, setGuestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!eventId || !inviteeId) return;
    api.getRSVPPage(eventId, inviteeId)
      .then((data: { event: EventInfo; invitee: Invitee }) => {
        setEvent(data.event);
        setInvitee(data.invitee);
        if (data.invitee.rsvp_status !== 'pending') {
          setStatus(data.invitee.rsvp_status as RSVPStatus);
          setMessage(data.invitee.rsvp_message || '');
          setDietary(data.invitee.dietary_requirements || '');
          setDone(true);
        }
      })
      .catch(() => setError('This invitation link is not valid or has expired.'))
      .finally(() => setLoading(false));
  }, [eventId, inviteeId]);

  const handleSubmit = async () => {
    if (!status || !eventId || !inviteeId) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.submitRSVP(eventId, inviteeId, {
        status,
        message,
        dietary_requirements: dietary,
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
      // silently fail — message is optional
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (error || !event || !invitee) return (
    <div className="min-h-screen bg-[#1a2418] flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#9cb092]/30">mail</span>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60 text-center max-w-xs">
        {error || 'Invitation not found'}
      </p>
    </div>
  );

  const dateStr = new Date(event.event_date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#1a2418] flex flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">

        {/* Cover strip */}
        {event.cover_image_url && (
          <div className="w-full h-32 overflow-hidden mb-8 -mx-0">
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover opacity-60" />
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <p className="font-display text-[10px] tracking-[0.35em] uppercase text-[#9cb092] mb-3">You're Invited</p>
          <h1 className="font-serif-exp text-3xl text-[#e4eee1] italic leading-tight mb-3">{event.title}</h1>
          <div className="w-8 h-px bg-[#9cb092]/40 mx-auto mb-3" />
          <p className="font-display text-[11px] tracking-[0.15em] uppercase text-[#b2c3b1]/60">{dateStr}</p>
          {event.location && (
            <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/40 mt-1">{event.location}</p>
          )}
        </div>

        {/* Guest name badge */}
        <div className="border border-[#9cb092]/20 bg-[#9cb092]/5 px-4 py-3 text-center mb-8">
          <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50">
            Invitation for <span className="text-[#e4eee1]">{invitee.name}</span>
          </p>
        </div>

        {done ? (
          /* ── Already responded ── */
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-5 flex items-center justify-center border-2 ${
              status === 'accepted' ? 'border-[#9cb092]' : 'border-[#b2c3b1]/30'
            }`}>
              <span className="material-icons text-2xl" style={{ color: status === 'accepted' ? '#9cb092' : '#b2c3b1' }}>
                {status === 'accepted' ? 'check' : 'close'}
              </span>
            </div>
            <p className="font-serif-exp text-xl text-[#e4eee1] italic mb-1">
              {status === 'accepted' ? 'See you there!' : 'Sorry to miss you'}
            </p>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 mb-8">
              Your RSVP has been recorded
            </p>

            {/* Message to organiser */}
            {!messageSent ? (
              <div className="text-left mt-4">
                <label className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 block mb-2">
                  Leave a message for the host (optional)
                </label>
                <textarea
                  value={guestMessage}
                  onChange={e => setGuestMessage(e.target.value)}
                  placeholder="Write something..."
                  rows={3}
                  className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60 resize-none mb-2"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!guestMessage.trim()}
                  className="w-full py-3 border border-[#9cb092]/30 hover:border-[#9cb092]/60 bg-[#9cb092]/5 hover:bg-[#9cb092]/10 disabled:opacity-30 transition-all font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]"
                >
                  Send Message
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="material-icons text-sm text-[#9cb092]">check_circle</span>
                <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#9cb092]">Message sent</p>
              </div>
            )}
          </div>
        ) : (
          /* ── RSVP form ── */
          <>
            <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 text-center mb-4">
              Will you be attending?
            </p>

            {/* Yes / No buttons */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <button
                onClick={() => setStatus('accepted')}
                className={`py-5 border transition-all font-display text-[10px] tracking-[0.2em] uppercase flex flex-col items-center gap-2 ${
                  status === 'accepted'
                    ? 'border-[#9cb092] bg-[#9cb092]/15 text-[#9cb092]'
                    : 'border-[#9cb092]/30 text-[#b2c3b1]/60 hover:border-[#9cb092]/60 hover:text-[#9cb092]'
                }`}
              >
                <span className="material-icons text-xl">check_circle</span>
                Attending
              </button>
              <button
                onClick={() => setStatus('declined')}
                className={`py-5 border transition-all font-display text-[10px] tracking-[0.2em] uppercase flex flex-col items-center gap-2 ${
                  status === 'declined'
                    ? 'border-red-400/60 bg-red-400/10 text-red-400/80'
                    : 'border-[#9cb092]/30 text-[#b2c3b1]/60 hover:border-red-400/40 hover:text-[#b2c3b1]'
                }`}
              >
                <span className="material-icons text-xl">cancel</span>
                Can't Make It
              </button>
            </div>

            {/* Optional fields — shown after selecting */}
            {status && (
              <div className="space-y-4 mb-8">
                {status === 'accepted' && (
                  <div>
                    <label className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 block mb-2">
                      Dietary requirements <span className="text-[#b2c3b1]/30">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={dietary}
                      onChange={e => setDietary(e.target.value)}
                      placeholder="e.g. vegetarian, nut allergy"
                      className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60"
                    />
                  </div>
                )}
                <div>
                  <label className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/50 block mb-2">
                    Message to host <span className="text-[#b2c3b1]/30">(optional)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write a note..."
                    rows={3}
                    className="w-full bg-transparent border border-[#9cb092]/30 p-3 font-display text-xs text-[#e4eee1] placeholder-[#b2c3b1]/30 focus:outline-none focus:border-[#9cb092]/60 resize-none"
                  />
                </div>
              </div>
            )}

            {submitError && (
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-red-400/80 mb-4 text-center">{submitError}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={!status || submitting}
              className="w-full py-4 bg-[#9cb092] hover:bg-[#9cb092]/90 disabled:bg-[#9cb092]/20 disabled:text-[#b2c3b1]/30 disabled:cursor-not-allowed transition-all font-display text-[10px] tracking-[0.3em] uppercase text-[#1a2418] font-medium"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 border border-[#1a2418]/30 border-t-[#1a2418] rounded-full animate-spin" />
                  Sending...
                </span>
              ) : 'Confirm RSVP'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
