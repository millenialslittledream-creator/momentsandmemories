import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentModalProps {
  guestCount: number;
  onBack: () => void;
  onConfirm: () => void;
}

export default function PaymentModal({ guestCount, onBack, onConfirm }: PaymentModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const [paymentMethod, setPaymentMethod] = useState<'card' | null>('card');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [billing, setBilling] = useState({ address: '', city: '', state: '', zip: '' });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const pricePerEvite = 2.99;
  const total = guestCount * pricePerEvite;

  useEffect(() => {
    if (backdropRef.current && panelRef.current) {
      gsap.fromTo(
        backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: 'power2.out' }
      );
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
    if (!paymentMethod || !agreed) return false;
    return (
      cardData.number &&
      cardData.expiry &&
      cardData.cvc &&
      cardData.name &&
      billing.address &&
      billing.city &&
      billing.state &&
      billing.zip
    );
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

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
      style={{ backgroundColor: 'rgba(13, 21, 18, 0.92)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBack();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-2xl h-full max-h-[88vh] flex flex-col bg-[#111914] border border-white/[0.09] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onBack}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 transition-all duration-200 hover:border-[#9cb092]/40"
        >
          <span className="material-icons text-[#b2c3b1] text-[18px]">close</span>
        </button>

        {/* Header */}
        <div className="flex-shrink-0 px-6 md:px-10 pt-8 pb-5 border-b border-white/[0.06]">
          <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092]/50 mb-2">
            Step 3 of 3
          </p>
          <h2 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] leading-tight">
            Almost there, <span className="text-[#9cb092] font-agatho italic">let's wrap it up.</span>
          </h2>
        </div>

        {/* Scrollable body */}
        <div data-lenis-prevent className="flex-1 min-h-0 overflow-y-auto scrollbar-subtle px-6 md:px-10 py-6 space-y-6">
          {/* Order Summary */}
          <div className="border border-white/[0.07] bg-white/[0.02] p-5">
            <h3 className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-4 flex items-center gap-2">
              <span className="material-icons text-[14px]">receipt_long</span>
              Order Summary
            </h3>
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-display text-[11px] tracking-wide text-[#b2c3b1]">
                  Digital Evite × {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
                </span>
                <span className="font-display text-sm text-[#e4eee1]">
                  ${(guestCount * pricePerEvite).toFixed(2)}
                </span>
              </div>
              <div className="border-t border-white/10 pt-2.5 flex justify-between items-center">
                <span className="font-display text-[11px] tracking-[0.15em] uppercase text-[#9cb092] font-semibold">
                  Total
                </span>
                <span className="font-serif-exp text-xl text-[#9cb092]">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="border border-white/[0.07] bg-white/[0.02] p-5">
            <h3 className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-4 flex items-center gap-2">
              <span className="material-icons text-[14px]">payment</span>
              Payment Method
            </h3>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full py-3.5 px-4 border transition-all flex items-center gap-4 mb-5 ${
                paymentMethod === 'card'
                  ? 'border-[#9cb092] bg-[#9cb092]/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <span
                className={`material-icons text-xl ${
                  paymentMethod === 'card' ? 'text-[#9cb092]' : 'text-[#b2c3b1]/50'
                }`}
              >
                credit_card
              </span>
              <div className="text-left">
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#e4eee1]">
                  Credit / Debit Card
                </p>
                <p className="font-display text-[9px] text-[#b2c3b1]/50 mt-0.5">
                  Visa, Mastercard, Amex
                </p>
              </div>
            </button>

            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                    Cardholder Name
                  </Label>
                  <Input
                    type="text"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    placeholder="Name on card"
                    className={inputClass}
                  />
                </div>
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
                    placeholder="0000 0000 0000 0000"
                    className={inputClass}
                    maxLength={19}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                      Expiry
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
                        setCardData({
                          ...cardData,
                          cvc: e.target.value.replace(/\D/g, '').slice(0, 4),
                        })
                      }
                      placeholder="123"
                      className={inputClass}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Billing Address */}
          <div className="border border-white/[0.07] bg-white/[0.02] p-5">
            <h3 className="font-display text-[10px] tracking-[0.22em] uppercase text-[#9cb092] mb-4 flex items-center gap-2">
              <span className="material-icons text-[14px]">home</span>
              Billing Address
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                  Street Address
                </Label>
                <Input
                  type="text"
                  value={billing.address}
                  onChange={(e) => setBilling({ ...billing, address: e.target.value })}
                  placeholder="123 Main Street"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                    City
                  </Label>
                  <Input
                    type="text"
                    value={billing.city}
                    onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                    placeholder="City"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                    State
                  </Label>
                  <Input
                    type="text"
                    value={billing.state}
                    onChange={(e) => setBilling({ ...billing, state: e.target.value })}
                    placeholder="State"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="w-1/2">
                <div className="space-y-1.5">
                  <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                    ZIP Code
                  </Label>
                  <Input
                    type="text"
                    value={billing.zip}
                    onChange={(e) =>
                      setBilling({
                        ...billing,
                        zip: e.target.value.replace(/\D/g, '').slice(0, 5),
                      })
                    }
                    placeholder="12345"
                    className={inputClass}
                    maxLength={5}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-3">
            <button
              onClick={() => setAgreed(!agreed)}
              className={`mt-0.5 w-5 h-5 flex-shrink-0 border rounded-sm flex items-center justify-center transition-all ${
                agreed
                  ? 'bg-[#9cb092] border-[#9cb092] text-[#111914]'
                  : 'border-white/20 bg-white/5'
              }`}
            >
              {agreed && <span className="material-icons text-sm">check</span>}
            </button>
            <p className="font-display text-[11px] text-[#b2c3b1]/70 leading-relaxed">
              I agree to the terms of service and understand that evites will be delivered to all
              listed guests upon payment confirmation.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 md:px-10 py-5 border-t border-white/[0.06] bg-[#0e1712]">
          <button
            onClick={onBack}
            className="py-3 px-5 border border-white/15 text-[#b2c3b1] font-display text-[10px] tracking-[0.2em] uppercase hover:border-[#9cb092]/40 hover:text-[#9cb092] transition-all flex items-center gap-2"
          >
            <span className="material-icons text-sm">arrow_back</span>
            Back
          </button>

          <button
            onClick={handleSubmit}
            disabled={!isFormValid() || submitting}
            className={`py-3 px-8 font-display text-[11px] tracking-[0.22em] uppercase font-bold transition-colors flex items-center gap-2 ${
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
            ) : (
              <>
                <span className="material-icons text-sm">lock</span>
                Pay ${total.toFixed(2)} & Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
