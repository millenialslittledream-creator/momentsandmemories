import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageTransition from "@/components/PageTransition";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
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
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
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
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < text.length; i++) newOtp[i] = text[i];
    setOtp(newOtp);
    inputRefs.current[Math.min(text.length, 5)]?.focus();
  }, [otp]);

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      toast.error("Please enter the full 6-digit code");
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
      toast.success("Email verified successfully!");
      setTimeout(() => navigate("/sign-in"), 2000);
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
    <PageTransition>
      <div className="bg-stone-matte text-[#1a2418] font-display h-screen w-screen overflow-hidden flex flex-col items-center justify-center relative">
        <div className="absolute inset-0 auth-grid-bg pointer-events-none" style={{ backgroundSize: "40px 40px" }} />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#B0BBA8]/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="absolute top-8 left-8 z-50">
          <div className="flex items-center gap-3">
            <span className="font-serif-exp font-bold text-xl tracking-wide text-[#1a2418]">moments & memories</span>
          </div>
        </div>

        <main className="relative z-10 w-full max-w-lg px-6 flex flex-col items-center">
          <div className="auth-glass-dark w-full rounded-2xl p-8 md:p-10 flex flex-col relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 blur-3xl rounded-full pointer-events-none" />

            {success ? (
              <div className="text-center relative z-10 py-8">
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                  <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-agatho text-3xl text-[#1a2418] mb-3">Verified!</h2>
                <p className="text-[#1a2418]/60 text-sm">Redirecting to sign in...</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8 relative z-10">
                  <h1 className="font-agatho text-4xl md:text-5xl font-normal text-[#1a2418] mb-3">Verify Email</h1>
                  <p className="text-[#1a2418]/60 font-mono text-[10px] md:text-xs tracking-[0.2em] uppercase">Secure Two-Factor Authentication</p>
                </div>
                <div className="text-center mb-8">
                  <p className="text-[#1a2418]/80 text-sm">
                    Enter the 6-digit code sent to <br />
                    <span className="font-bold text-[#1a2418] mt-1 block">{email || "your email"}</span>
                  </p>
                </div>
                <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      className="auth-input-dark w-12 h-14 rounded-lg text-center text-2xl font-serif-exp font-bold text-[#1a2418] placeholder-[#1a2418]/20 focus:ring-0"
                      maxLength={1}
                      placeholder="•"
                      value={digit}
                      onChange={e => handleChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-xs w-full px-2 mb-8">
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
                  className="w-full relative group overflow-hidden rounded-xl py-3.5 auth-btn-primary text-white font-bold tracking-widest uppercase transition-all duration-300 border border-white/20 shadow-lg disabled:opacity-60"
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
          </div>
        </main>

        <div className="fixed bottom-6 w-full text-center pointer-events-none">
          <span className="text-[10px] font-mono text-[#1a2418]/20 tracking-[0.5em]">SECURE ENVIRONMENT 256-BIT ENCRYPTION</span>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyEmail;
