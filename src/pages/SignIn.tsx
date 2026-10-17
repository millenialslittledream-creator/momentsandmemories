import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/AuthLayout";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { getSafeRedirectPath } from "@/lib/authRedirect";

const SignIn = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
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
          try { sessionStorage.setItem('mm_pending_signup_email', email.trim()); } catch { /* storage may be unavailable */ }
          navigate(
            redirectTo !== '/' ? `/verify-email?redirect=${encodeURIComponent(redirectTo)}` : '/verify-email',
            { state: { email } }
          );
          return;
        }
        setError(authError.message);
        return;
      }

      if (data.user) {
        toast.success("Welcome back!");
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
        <main className="auth-panel auth-panel-signin auth-glass mx-auto flex w-full max-w-[500px] flex-col items-center rounded-2xl p-6 sm:p-8">
          <div className="auth-panel-heading text-center mb-8">
            <p className="font-serif-exp text-sm uppercase tracking-[0.2em] mb-2 opacity-60">moments & memories</p>
            <h1 className="font-agatho text-4xl text-[#1a2418] drop-shadow-sm">Sign In</h1>
          </div>

          {error && (
            <div className="w-full mb-6 py-2 px-4 bg-red-50 border border-red-100 rounded text-center">
              <p className="text-red-500 text-xs font-medium">{error}</p>
            </div>
          )}

          <form className="auth-panel-form w-full space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Email</label>
              <input autoComplete="email" className="auth-control w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="name@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1 mr-1">
                <label className="text-xs uppercase tracking-wider font-bold opacity-60">Password</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">Forgot Password?</Link>
              </div>
              <input autoComplete="current-password" className="auth-control w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="auth-submit w-full py-3.5 mt-2 bg-primary text-white rounded-lg font-bold tracking-wide uppercase text-xs auth-btn-glow hover:bg-primary/90 transition-all transform active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            <div className="auth-or-divider relative flex items-center py-3 w-full">
              <div className="flex-grow border-t border-black/10" />
              <span className="flex-shrink mx-4 text-[10px] uppercase tracking-widest opacity-40 font-bold">OR</span>
              <div className="flex-grow border-t border-black/10" />
            </div>

            <GoogleAuthButton
              redirectTo={redirectTo}
              disabled={loading}
              fallbackClassName="auth-google-button w-full py-4 bg-white/40 border border-black/10 rounded-lg flex items-center justify-center gap-3 hover:bg-white/60 transition-all active:scale-[0.99] disabled:opacity-60"
            />
          </form>

          <div className="auth-panel-footer mt-6 pt-5 border-t border-black/5 w-full text-center">
            <Link
              to={redirectTo !== '/' ? `/sign-up?redirect=${encodeURIComponent(redirectTo)}` : '/sign-up'}
              className="text-sm text-[#1a2418]/70 hover:text-primary transition-colors"
            >
              New here? <span className="font-bold underline decoration-1 underline-offset-2">Create Account</span>
            </Link>
          </div>
        </main>
    </AuthLayout>
  );
};

export default SignIn;
