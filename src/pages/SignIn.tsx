import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageTransition from "@/components/PageTransition";
import GoogleIcon from "@/components/GoogleIcon";

const SignIn = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        if (authError.message.includes("Email not confirmed")) {
          toast.info("Please verify your email first.");
          navigate("/verify-email", { state: { email } });
          return;
        }
        setError(authError.message);
        return;
      }

      if (data.user) {
        toast.success("Welcome back!");
        navigate("/");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
        setLoading(false);
      }
    } catch {
      toast.error("Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="bg-stone-matte text-[#1a2418] font-display min-h-screen w-full overflow-hidden flex items-center justify-center relative py-10">
        <div className="absolute inset-0 auth-grid-bg pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-[#B0BBA8]/30 rounded-full blur-[120px] pointer-events-none" />

        <main className="auth-glass relative z-10 w-full max-w-md p-8 md:p-10 rounded-2xl flex flex-col items-center mx-4">
          <div className="text-center mb-8">
            <p className="font-serif-exp text-sm uppercase tracking-[0.2em] mb-2 opacity-60">moments & memories</p>
            <h1 className="font-agatho text-4xl text-[#1a2418] drop-shadow-sm">Sign In</h1>
          </div>

          {error && (
            <div className="w-full mb-6 py-2 px-4 bg-red-50 border border-red-100 rounded text-center">
              <p className="text-red-500 text-xs font-medium">{error}</p>
            </div>
          )}

          <form className="w-full space-y-5" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Email</label>
              <input className="w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="name@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1 mr-1">
                <label className="text-xs uppercase tracking-wider font-bold opacity-60">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">Forgot Password?</Link>
              </div>
              <input className="w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-primary text-white rounded-lg font-bold tracking-wide uppercase text-xs auth-btn-glow hover:bg-primary/90 transition-all transform active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="relative flex items-center py-5 w-full">
              <div className="flex-grow border-t border-black/10" />
              <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest opacity-40 font-bold">OR</span>
              <div className="flex-grow border-t border-black/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full py-4 bg-white/40 border border-black/10 rounded-lg flex items-center justify-center gap-3 hover:bg-white/60 transition-all active:scale-[0.99] disabled:opacity-60"
            >
              <GoogleIcon />
              <span className="font-agatho text-lg text-[#1a2418]">Continue with Google</span>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-black/5 w-full text-center">
            <Link to="/sign-up" className="text-sm text-[#1a2418]/70 hover:text-primary transition-colors">
              New here? <span className="font-bold underline decoration-1 underline-offset-2">Create Account</span>
            </Link>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default SignIn;
