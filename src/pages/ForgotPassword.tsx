import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageTransition from "@/components/PageTransition";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      setSent(true);
      toast.success("If an account exists, a reset link has been sent.");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-stone-matte text-[#1a2418] font-display min-h-screen flex flex-col overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: "linear-gradient(rgba(61,74,53,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(61,74,53,0.04) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />

        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-[80px]" />
          <div className="absolute -bottom-32 -right-20 w-[30rem] h-[30rem] bg-[#B0BBA8]/20 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 left-[15%] w-24 h-24 opacity-20 rotate-12">
            <div className="w-full h-full bg-gradient-to-br from-primary to-transparent rounded-[40%_60%_70%_30%/40%_50%_60%_50%] blur-xl" />
          </div>
        </div>

        <nav className="fixed top-0 left-0 w-full z-50 p-8 flex justify-between items-start">
          <div className="cursor-pointer group">
            <span className="block text-xs tracking-[0.3em] font-bold mb-1 opacity-60 group-hover:opacity-100 transition-opacity text-[#1a2418]">MOMENTS & MEMORIES</span>
          </div>
        </nav>

        <main className="flex-grow flex items-center justify-center relative z-10 px-4">
          <div className="auth-glass-card w-full max-w-md p-8 md:p-10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-b from-white/20 to-transparent transform rotate-45 translate-x-1/2 -translate-y-1/2 blur-2xl pointer-events-none" />

            {sent ? (
              <div className="text-center relative z-10 py-4">
                <div className="w-16 h-16 mx-auto mb-6 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20">
                  <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-agatho text-3xl text-[#1a2418] mb-3">Check Your Email</h2>
                <p className="text-[#1a2418]/60 text-sm leading-relaxed max-w-xs mx-auto mb-6">
                  If an account exists for <span className="font-bold">{email}</span>, you'll receive a password reset link shortly.
                </p>
                <Link to="/sign-in" className="inline-flex items-center text-xs tracking-widest text-[#1a2418]/50 hover:text-primary transition-colors uppercase font-medium group">
                  <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8 relative z-10">
                  <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center border border-primary/20 backdrop-blur-sm">
                    <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="font-agatho text-4xl text-[#1a2418] mb-3 tracking-normal font-normal capitalize">Retrieve Your Story</h1>
                  <p className="text-[#1a2418]/60 text-sm font-light leading-relaxed max-w-xs mx-auto">
                    We'll email you a password reset link if an account exists.
                  </p>
                </div>
                <form className="space-y-6 relative z-10" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[#1a2418]/40 group-focus-within:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      className="auth-input-forgot block w-full pl-12 pr-4 py-4 rounded-xl text-sm placeholder-[#1a2418]/40"
                      placeholder="Email Address"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-btn-primary w-full text-white font-bold py-4 rounded-xl text-sm tracking-widest uppercase hover:brightness-110 flex items-center justify-center group disabled:opacity-60"
                  >
                    <span>{loading ? "Sending..." : "Send Reset Link"}</span>
                    {!loading && (
                      <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    )}
                  </button>
                </form>
                <div className="mt-8 text-center relative z-10">
                  <Link to="/sign-in" className="inline-flex items-center text-xs tracking-widest text-[#1a2418]/50 hover:text-primary transition-colors uppercase font-medium group">
                    <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Return to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>

        <footer className="absolute bottom-6 w-full text-center z-10">
          <p className="text-[10px] text-[#1a2418]/30 tracking-[0.2em] uppercase font-bold">Secure Access &bull; moments & memories</p>
        </footer>
      </div>
    </PageTransition>
  );
};

export default ForgotPassword;
