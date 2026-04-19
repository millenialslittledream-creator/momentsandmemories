import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageTransition from "@/components/PageTransition";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const checks = useMemo(() => ({
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }), [password]);

  const allValid = checks.length && checks.uppercase && checks.special;

  const handleSubmit = async () => {
    if (!allValid) {
      toast.error("Please meet all password requirements");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/sign-in"), 1500);
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="auth-stone-grid-bg text-[#1a2418] font-display min-h-screen flex flex-col overflow-hidden relative selection:bg-primary/20">
        <nav className="fixed top-0 left-0 w-full z-50 p-8 flex justify-between items-start pointer-events-none">
          <Link to="/sign-in" className="pointer-events-auto cursor-pointer group flex items-center gap-3">
            <svg className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="block text-xs tracking-[0.2em] font-bold opacity-70 group-hover:opacity-100 transition-opacity uppercase">Back to Login</span>
          </Link>
          <div className="pointer-events-auto text-right">
            <span className="block text-2xl font-serif-exp text-primary">moments & memories</span>
          </div>
        </nav>

        <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] auth-stone-floater rounded-full mix-blend-multiply bg-stone-matte" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[30vw] h-[30vw] auth-stone-floater rounded-full bg-[#B0BBA8] mix-blend-multiply" style={{ animationDelay: "1s" }} />

        <main className="flex-grow flex items-center justify-center relative z-10 w-full h-screen px-4">
          <div className="w-full max-w-md mx-auto p-6">
            <div className="auth-glass-vertical rounded-2xl p-8 md:p-12 relative overflow-hidden">
              <div className="mb-10 text-center relative z-10">
                <div className="w-16 h-16 bg-white/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm backdrop-blur-sm">
                  <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <h1 className="text-4xl font-agatho mb-2 drop-shadow-md">Reset Password</h1>
                <p className="text-sm text-[#1a2418]/50 tracking-wide">Secure your account</p>
              </div>

              <form className="space-y-6 relative z-10" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                <div className="space-y-2 group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2418]/50 group-focus-within:text-primary transition-colors">New Password</label>
                  <div className="relative">
                    <input
                      className="auth-input-reset w-full px-4 py-3 rounded-lg text-sm placeholder-gray-400 focus:ring-0"
                      placeholder="••••••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 cursor-pointer hover:text-gray-600">
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#1a2418]/50 group-focus-within:text-primary transition-colors">Confirm Password</label>
                  <div className="relative">
                    <input
                      className="auth-input-reset w-full px-4 py-3 rounded-lg text-sm placeholder-gray-400 focus:ring-0"
                      placeholder="••••••••••••"
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <div className="auth-checklist rounded-lg p-4 space-y-2 mt-4">
                  <p className="text-[10px] uppercase text-[#1a2418]/50 font-bold tracking-wider mb-2">Security Requirements</p>
                  {[
                    { label: "At least 10 characters", valid: checks.length },
                    { label: "One uppercase letter", valid: checks.uppercase },
                    { label: "One special character (!@#$)", valid: checks.special },
                  ].map(({ label, valid }) => (
                    <div key={label} className="flex items-center gap-2">
                      {valid ? (
                        <svg className="w-4 h-4 text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-gray-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                      )}
                      <span className={`text-xs transition-colors ${valid ? "text-green-700 font-medium" : "text-gray-500"}`}>{label}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || !allValid}
                  className="w-full auth-btn-primary text-white font-bold py-4 px-6 rounded-lg tracking-widest text-sm uppercase mt-6 flex items-center justify-center gap-2 group disabled:opacity-60"
                >
                  {loading ? "Updating..." : "Update Password"}
                  {!loading && (
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  )}
                </button>
              </form>

              <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            </div>

            <p className="text-center text-xs text-[#1a2418]/40 mt-8 font-mono">SECURE ENCRYPTED CONNECTION</p>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default ResetPassword;
