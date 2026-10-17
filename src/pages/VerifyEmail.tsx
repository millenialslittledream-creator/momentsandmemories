import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/AuthLayout";
import { getSafeRedirectPath } from "@/lib/authRedirect";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Where to continue after verifying (e.g. /create to resume the evite flow).
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
  const email = (location.state as { email?: string })?.email || (() => {
    try { return sessionStorage.getItem('mm_pending_signup_email') || ''; } catch { return ''; }
  })();

  const [otp, setOtp] = useState(["", "", "", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(120);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleChange = useCallback((index: number, value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits && value) return;
    const newOtp = [...otp];
    if (digits.length > 1) {
      for (let i = 0; i < digits.length && index + i < 8; i++) newOtp[index + i] = digits[i];
      setOtp(newOtp);
      inputRefs.current[Math.min(index + digits.length, 7)]?.focus();
      return;
    }
    newOtp[index] = digits.slice(-1);
    setOtp(newOtp);
    if (digits && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }, [otp]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 8);
    const newOtp = [...otp];
    for (let i = 0; i < text.length; i++) newOtp[i] = text[i];
    setOtp(newOtp);
    inputRefs.current[Math.min(text.length, 7)]?.focus();
  }, [otp]);

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 8) {
      toast.error("Please enter the full 8-digit code");
      return;
    }
    if (!email) {
      toast.error("Email not found. Please sign up again.");
      navigate("/sign-up");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSuccess(true);
      try { sessionStorage.removeItem('mm_pending_signup_email'); } catch { /* storage may be unavailable */ }
      toast.success("Email verified successfully!");
      // verifyOtp establishes a session, so the user is now signed in — send
      // them straight to where they left off (e.g. /create) when we have a
      // resume target; otherwise fall back to sign-in.
      setTimeout(
        () => navigate(redirectTo !== '/' ? redirectTo : '/sign-in', { replace: true }),
        2000
      );
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setResendCooldown(120);
      toast.success("New OTP sent to your email!");
    } catch {
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <AuthLayout>
          <main className="auth-panel auth-glass relative mx-auto flex w-full max-w-[500px] flex-col items-center overflow-hidden rounded-2xl p-6 sm:p-8">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 blur-3xl rounded-full pointer-events-none" />

            {success ? (
              <div className="text-center relative z-10 py-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-agatho text-3xl text-[#1a2418] mb-3">Verified!</h2>
                <p className="text-[#1a2418]/60 text-sm">
                  {redirectTo !== '/' ? 'Taking you back to continue...' : 'Redirecting to sign in...'}
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5 relative z-10">
                  <h1 className="font-agatho text-4xl font-normal text-[#1a2418] mb-2">Verify Email</h1>
                  <p className="text-[#1a2418]/60 font-mono text-[10px] tracking-[0.2em] uppercase">Account email confirmation</p>
                </div>
                <div className="text-center mb-5">
                  <p className="text-[#1a2418]/80 text-sm">
                    Enter the 8-digit code sent to <br />
                    <span className="font-bold text-[#1a2418] mt-1 block">{email || "your email"}</span>
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#1a2418]/55">
                    If it is not in your inbox, check Spam or Promotions. You can request a new code when the timer ends.
                  </p>
                </div>
                <div className="mb-6 grid w-full max-w-[420px] grid-cols-8 gap-1.5 sm:gap-2" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      className="auth-input w-full h-11 sm:h-12 min-w-0 rounded-lg text-center text-lg sm:text-xl font-serif-exp font-bold text-[#1a2418] placeholder-[#1a2418]/20 focus:ring-0"
                      maxLength={1}
                      placeholder="•"
                      inputMode="numeric"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      aria-label={`Verification digit ${i + 1}`}
                      value={digit}
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs w-full px-1 mb-5">
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    className="text-[#1a2418]/50 hover:text-primary transition-colors font-medium border-b border-transparent hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Resend Email OTP
                  </button>
                  <span className="font-mono text-[#1a2418]/50 font-medium">
                    {resendCooldown > 0 ? formatTime(resendCooldown) : "Ready"}
                  </span>
                </div>
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-xl py-3 auth-btn-primary text-white font-bold tracking-widest uppercase transition-all duration-300 border border-white/20 shadow-lg disabled:opacity-60"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm">
                    {loading ? "Verifying..." : "Verify"}
                    {!loading && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </span>
                </button>
              </>
            )}
          </main>
    </AuthLayout>
  );
};

export default VerifyEmail;
