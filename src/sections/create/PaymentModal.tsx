import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FlowStepper from './FlowStepper';

interface PaymentModalProps {
  guestCount: number;
  deliveryPreference: 'email' | 'phone' | 'both' | 'link';
  invitationCount: number;
  onBack: () => void;
  onConfirm: () => void;
}

// Pricing-style font: SF Pro / Inter with tabular numerals — what most e-commerce uses.
const priceFontClass =
  "[font-family:'SF_Pro_Display','Inter','Segoe_UI',system-ui,sans-serif] [font-variant-numeric:tabular-nums] tracking-tight";

const SUPPORT_ITEMS = [
  { icon: 'palette', label: 'Create beautiful templates' },
  { icon: 'auto_awesome', label: 'Build new features' },
  { icon: 'cloud', label: 'Keep the platform running' },
  { icon: 'favorite', label: 'Serve you better' },
];

export default function PaymentModal({
  guestCount,
  deliveryPreference,
  invitationCount,
  onBack,
  onConfirm,
}: PaymentModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [payMethod, setPayMethod] = useState<'card' | 'paypal'>('card');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [saveCard, setSaveCard] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Optional "buy us a coffee" support tip.
  const [tip, setTip] = useState(0);
  const [customTip, setCustomTip] = useState('');

  const pricePerEvite = 2.99;
  const eviteTotal = guestCount * pricePerEvite;
  const grandTotal = eviteTotal + tip;
  // Nothing to charge (e.g. shareable-link flow with 0 guests and no tip) —
  // skip the card form entirely and let the user finish for free.
  const isFree = grandTotal <= 0;

  const deliveryLabel =
    deliveryPreference === 'email'
      ? 'Email'
      : deliveryPreference === 'phone'
      ? 'SMS'
      : deliveryPreference === 'link'
      ? 'Shareable Link'
      : 'SMS + Email';

  useEffect(() => {
    if (backdropRef.current && panelRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.28, ease: 'power2.out' });
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, scale: 0.96, y: 24 },
        { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: 'power3.out' }
      );
    }
  }, []);

  const inputClass =
    'bg-white/[0.06] border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30';

  const isFormValid = () => {
    if (isFree) return true;
    if (payMethod === 'paypal') return true;
    return cardData.number && cardData.expiry && cardData.cvc && cardData.name;
  };

  const handleSubmit = async () => {
    if (!isFormValid() || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  const pickTip = (amount: number) => {
    setTip(amount);
    setCustomTip('');
  };

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
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 md:px-10 pt-4 pb-4 border-b border-white/[0.06] bg-[#0e1712]">
          <FlowStepper current={6} className="max-w-2xl mx-auto mb-3" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif-exp text-xl md:text-2xl text-[#e4eee1] leading-tight">
                Your invitations are <span className="text-[#9cb092] font-agatho italic">ready!</span> 🎉
              </h2>
              <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/50 mt-1">
                We can't wait for your guests to receive them.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <span className="material-icons text-[#9cb092] text-base">verified_user</span>
              <div className="text-right">
                <p className="font-display text-[9px] tracking-[0.15em] uppercase text-[#e4eee1]/80 leading-tight">
                  Secure Checkout
                </p>
                <p className="font-display text-[8px] text-[#b2c3b1]/45 leading-tight">
                  Your information is safe
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div
          data-lenis-prevent
          className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-10 py-6 grid grid-cols-1 lg:grid-cols-[1fr_0.85fr] gap-6"
        >
          {/* LEFT — support / coffee */}
          <div className="space-y-5">
            {/* Buy us a coffee */}
            <div className="border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="font-serif-exp text-lg text-[#e4eee1] leading-tight mb-2 flex items-center gap-2">
                Would you buy us a coffee? ☕
              </h3>
              <p className="font-display text-[11px] text-[#b2c3b1]/60 leading-relaxed mb-4">
                Moments &amp; Memories is built with love to help you celebrate life's special moments.
                If you enjoyed using our platform, consider buying us a coffee — your support keeps us
                going! 💚
              </p>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { amount: 5, note: "You're awesome!" },
                  { amount: 10, note: 'Amazing!' },
                ].map(({ amount, note }) => {
                  const active = tip === amount && !customTip;
                  return (
                    <button
                      key={amount}
                      onClick={() => pickTip(amount)}
                      className={`py-3 px-2 border text-center transition-all ${
                        active
                          ? 'border-[#9cb092] bg-[#9cb092]/15'
                          : 'border-white/10 bg-white/[0.03] hover:border-[#9cb092]/40'
                      }`}
                    >
                      <p className={`text-lg font-semibold text-[#e4eee1] ${priceFontClass}`}>${amount}</p>
                      <p className="font-display text-[8px] tracking-[0.08em] uppercase text-[#b2c3b1]/55 mt-0.5">
                        {note}
                      </p>
                    </button>
                  );
                })}

                {/* Custom */}
                <div
                  className={`border text-center transition-all flex flex-col items-center justify-center px-2 py-2 ${
                    customTip ? 'border-[#9cb092] bg-[#9cb092]/15' : 'border-white/10 bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-0.5">
                    <span className={`text-sm text-[#b2c3b1]/70 ${priceFontClass}`}>$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customTip}
                      onChange={(e) => {
                        const v = e.target.value.replace(/[^\d.]/g, '');
                        setCustomTip(v);
                        setTip(v ? parseFloat(v) || 0 : 0);
                      }}
                      placeholder="0"
                      className={`w-12 bg-transparent outline-none text-center text-lg font-semibold text-[#e4eee1] ${priceFontClass}`}
                    />
                  </div>
                  <p className="font-display text-[8px] tracking-[0.08em] uppercase text-[#b2c3b1]/55">
                    Custom
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setTip(0);
                  setCustomTip('');
                }}
                className="w-full mt-3 py-2.5 border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex items-center justify-between px-4 group"
              >
                <span className="font-display text-[10px] tracking-[0.15em] uppercase text-[#b2c3b1]/70">
                  No thanks, continue for free
                </span>
                <span className="material-icons text-[#b2c3b1]/50 text-base group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </button>
            </div>

            {/* What your support helps you do */}
            <div className="border border-white/[0.07] bg-white/[0.02] p-5">
              <p className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-4">
                What your support helps us do
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {SUPPORT_ITEMS.map((item) => (
                  <div key={item.label} className="flex flex-col items-center text-center gap-2">
                    <span className="material-icons text-[#9cb092]/70 text-xl">{item.icon}</span>
                    <p className="font-display text-[9px] text-[#b2c3b1]/55 leading-tight">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy */}
            <div className="flex items-start gap-3 border border-white/[0.07] bg-white/[0.02] p-4">
              <span className="material-icons text-[#9cb092]/70 text-base mt-0.5">shield</span>
              <div>
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#e4eee1]/80">
                  We respect your privacy
                </p>
                <p className="font-display text-[9px] text-[#b2c3b1]/50 leading-relaxed mt-0.5">
                  We'll never share your information with anyone.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT — order summary + payment */}
          <div className="space-y-5">
            {/* Order Summary */}
            <div className="border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-4 flex items-center gap-2">
                <span className="material-icons text-[14px]">receipt_long</span>
                Order Summary
              </h3>
              <div className="space-y-2.5 font-display text-[11px]">
                <div className="flex justify-between text-[#b2c3b1]">
                  <span>Invitations</span>
                  <span className="text-[#e4eee1]">
                    {invitationCount} {invitationCount === 1 ? 'version' : 'versions'}
                  </span>
                </div>
                <div className="flex justify-between text-[#b2c3b1]">
                  <span>Guests</span>
                  <span className="text-[#e4eee1]">
                    {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
                  </span>
                </div>
                <div className="flex justify-between text-[#b2c3b1]">
                  <span>Delivery</span>
                  <span className="text-[#e4eee1]">{deliveryLabel}</span>
                </div>
                <div className="flex justify-between text-[#b2c3b1]">
                  <span>Digital evites</span>
                  <span className={`text-[#e4eee1] ${priceFontClass}`}>${eviteTotal.toFixed(2)}</span>
                </div>
                {tip > 0 && (
                  <div className="flex justify-between text-[#b2c3b1]">
                    <span>Support tip ☕</span>
                    <span className={`text-[#e4eee1] ${priceFontClass}`}>${tip.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-white/10 pt-2.5 flex justify-between items-center">
                  <span className="tracking-[0.15em] uppercase text-[#9cb092] font-semibold">Total</span>
                  <span className={`text-2xl text-[#9cb092] font-semibold ${priceFontClass}`}>
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Free — nothing to charge */}
            {isFree && (
              <div className="border border-[#9cb092]/25 bg-[#9cb092]/[0.06] p-5 text-center">
                <span className="material-icons text-[#9cb092] text-2xl mb-1">celebration</span>
                <p className="font-serif-exp text-base text-[#e4eee1]">It's on us — no payment needed!</p>
                <p className="font-display text-[10px] text-[#b2c3b1]/55 leading-relaxed mt-1">
                  Your total is $0.00, so just hit send and your invitations are ready to share.
                </p>
              </div>
            )}

            {/* Payment Details */}
            {!isFree && (
            <div className="border border-white/[0.07] bg-white/[0.02] p-5">
              <h3 className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-4 flex items-center gap-2">
                <span className="material-icons text-[14px]">payment</span>
                Payment Details
              </h3>

              {/* Method tabs */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {([
                  { key: 'card', icon: 'credit_card', label: 'Card' },
                  { key: 'paypal', icon: 'account_balance_wallet', label: 'PayPal' },
                ] as const).map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setPayMethod(m.key)}
                    className={`py-2.5 border flex items-center justify-center gap-2 transition-all ${
                      payMethod === m.key
                        ? 'border-[#9cb092] bg-[#9cb092]/10 text-[#9cb092]'
                        : 'border-white/10 bg-white/[0.03] text-[#b2c3b1]/60 hover:border-white/25'
                    }`}
                  >
                    <span className="material-icons text-base">{m.icon}</span>
                    <span className="font-display text-[10px] tracking-[0.12em] uppercase">{m.label}</span>
                  </button>
                ))}
              </div>

              {payMethod === 'card' ? (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                      Card Number
                    </Label>
                    <Input
                      type="text"
                      value={cardData.number}
                      onChange={(e) =>
                        setCardData({
                          ...cardData,
                          number: e.target.value
                            .replace(/\D/g, '')
                            .replace(/(\d{4})/g, '$1 ')
                            .trim()
                            .slice(0, 19),
                        })
                      }
                      placeholder="1234 5678 9012 3456"
                      className={inputClass}
                      maxLength={19}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                      Name on Card
                    </Label>
                    <Input
                      type="text"
                      value={cardData.name}
                      onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                      placeholder="John Doe"
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                        Expiry Date
                      </Label>
                      <Input
                        type="text"
                        value={cardData.expiry}
                        onChange={(e) => {
                          let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                          if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
                          setCardData({ ...cardData, expiry: v });
                        }}
                        placeholder="MM/YY"
                        className={inputClass}
                        maxLength={5}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                        CVC
                      </Label>
                      <Input
                        type="text"
                        value={cardData.cvc}
                        onChange={(e) =>
                          setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
                        }
                        placeholder="123"
                        className={inputClass}
                        maxLength={4}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => setSaveCard((v) => !v)}
                    className="flex items-center gap-2.5"
                  >
                    <span
                      className={`w-4 h-4 flex-shrink-0 border rounded-sm flex items-center justify-center transition-all ${
                        saveCard ? 'bg-[#9cb092] border-[#9cb092] text-[#111914]' : 'border-white/20 bg-white/5'
                      }`}
                    >
                      {saveCard && <span className="material-icons text-[12px]">check</span>}
                    </span>
                    <span className="font-display text-[10px] text-[#b2c3b1]/70">
                      Save card for faster payments
                    </span>
                  </button>
                </div>
              ) : (
                <div className="border border-white/10 bg-white/[0.02] p-6 text-center">
                  <span className="material-icons text-[#9cb092]/70 text-3xl mb-2">account_balance_wallet</span>
                  <p className="font-display text-[11px] text-[#b2c3b1]/60 leading-relaxed">
                    You'll be redirected to PayPal to complete your payment securely.
                  </p>
                </div>
              )}

              <div className="mt-5 flex items-center gap-2 border-t border-white/[0.06] pt-4">
                <span className="material-icons text-[#9cb092]/70 text-base">lock</span>
                <p className="font-display text-[9px] text-[#b2c3b1]/50 leading-tight">
                  100% Secure Payment · Your payment is encrypted and secure.
                </p>
              </div>
            </div>
            )}

            {/* Complete payment / send */}
            <button
              onClick={handleSubmit}
              disabled={!isFormValid() || submitting}
              className={`w-full py-3.5 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center justify-center gap-2 ${
                isFormValid() && !submitting
                  ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3]'
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
              }`}
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />
                  Processing…
                </>
              ) : isFree ? (
                <>
                  <span className="material-icons text-sm">send</span>
                  Send Invitations — Free
                </>
              ) : (
                <>
                  <span className="material-icons text-sm">lock</span>
                  <span>
                    Complete Payment <span className={priceFontClass}>${grandTotal.toFixed(2)}</span>
                  </span>
                </>
              )}
            </button>
            <p className="font-display text-[8px] text-[#b2c3b1]/40 text-center leading-relaxed">
              By completing your purchase, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>

        {/* Footer — back */}
        <div className="flex-shrink-0 px-6 md:px-10 py-3 border-t border-white/[0.06] bg-[#0e1712]">
          <button
            onClick={onBack}
            className="py-2 px-4 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
