import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PaymentStepProps {
  guestCount: number;
  onConfirm: () => void;
}

export default function PaymentStep({ guestCount, onConfirm }: PaymentStepProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | null>(null);
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [agreed, setAgreed] = useState(false);

  const pricePerEvite = 2.99;
  const total = guestCount * pricePerEvite;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        headingRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
      );
      gsap.fromTo(
        '.payment-section',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.3 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const inputClass =
    'bg-white/[0.06] backdrop-blur-sm border-white/15 focus:border-[#9cb092] text-[#e4eee1] font-display placeholder:text-[#b2c3b1]/30';

  const isFormValid = () => {
    if (!paymentMethod || !agreed) return false;
    if (paymentMethod === 'card') {
      return cardData.number && cardData.expiry && cardData.cvc && cardData.name;
    }
    return !!upiId;
  };

  return (
    <div ref={containerRef}>
      {/* Heading */}
      <div ref={headingRef} className="flex flex-col items-center mb-6 mt-4">
        <h1 className="text-3xl md:text-5xl font-serif-exp italic text-center mb-3 relative z-10">
          Almost there, <br />
          <span className="text-[#9cb092] not-italic font-agatho">let's wrap it up.</span>
        </h1>
        <div className="w-[1px] h-6 bg-[#9cb092]/40 mt-3" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Order Summary */}
        <div className="payment-section glass-panel rounded-none p-8">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-6 pb-3 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">receipt_long</span>
            Order Summary
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-display text-[11px] tracking-[0.1em] text-[#b2c3b1]">
                Digital Evite × {guestCount} {guestCount === 1 ? 'guest' : 'guests'}
              </span>
              <span className="font-display text-sm text-[#e4eee1]">
                ${(guestCount * pricePerEvite).toFixed(2)}
              </span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="font-display text-[11px] tracking-[0.15em] uppercase text-[#9cb092] font-semibold">
                Total
              </span>
              <span className="font-serif-exp text-xl text-[#9cb092] italic">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="payment-section glass-panel rounded-none p-8">
          <h3 className="font-serif-exp text-lg text-[#e4eee1] italic mb-6 pb-3 border-b border-white/10 flex items-center gap-3">
            <span className="material-icons text-[#9cb092] text-lg">payment</span>
            Payment Method
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`py-5 px-4 border transition-all duration-300 flex items-center gap-4 ${
                paymentMethod === 'card'
                  ? 'border-[#9cb092] bg-[#9cb092]/10 shadow-lg shadow-[#9cb092]/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <span
                className={`material-icons text-2xl ${
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

            <button
              onClick={() => setPaymentMethod('upi')}
              className={`py-5 px-4 border transition-all duration-300 flex items-center gap-4 ${
                paymentMethod === 'upi'
                  ? 'border-[#9cb092] bg-[#9cb092]/10 shadow-lg shadow-[#9cb092]/10'
                  : 'border-white/10 bg-white/[0.03] hover:border-white/25'
              }`}
            >
              <span
                className={`material-icons text-2xl ${
                  paymentMethod === 'upi' ? 'text-[#9cb092]' : 'text-[#b2c3b1]/50'
                }`}
              >
                account_balance
              </span>
              <div className="text-left">
                <p className="font-display text-[10px] tracking-[0.15em] uppercase text-[#e4eee1]">
                  UPI
                </p>
                <p className="font-display text-[9px] text-[#b2c3b1]/50 mt-0.5">
                  GPay, PhonePe, Paytm
                </p>
              </div>
            </button>
          </div>

          {/* Card Fields */}
          {paymentMethod === 'card' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                      setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })
                    }
                    placeholder="123"
                    className={inputClass}
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* UPI Field */}
          {paymentMethod === 'upi' && (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Label className="text-[#b2c3b1] font-display text-[10px] tracking-[0.15em] uppercase">
                UPI ID
              </Label>
              <Input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="yourname@upi"
                className={inputClass}
              />
            </div>
          )}
        </div>

        {/* Terms */}
        <div className="payment-section flex items-start gap-3 px-2">
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

        {/* Pay Button */}
        <div className="payment-section flex justify-center pb-8">
          <div className="noise-btn-container">
            <div className="noise-btn-bg" />
            <div className="noise-texture" />
            <button
              onClick={onConfirm}
              disabled={!isFormValid()}
              className={`btn-inner px-14 py-4 font-display text-[10px] tracking-[0.2em] uppercase flex items-center gap-3 transition-all ${
                isFormValid()
                  ? 'bg-[#9cb092] text-[#111914] hover:bg-[#adc4a3] shadow-lg font-bold'
                  : 'bg-white/5 text-white/20 cursor-not-allowed'
              }`}
            >
              <span className="material-icons text-sm">lock</span>
              Pay ${total.toFixed(2)} & Send Evites
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
