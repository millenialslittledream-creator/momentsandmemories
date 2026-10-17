import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import AuthLayout from "@/components/AuthLayout";
import GoogleAuthButton from "@/components/GoogleAuthButton";
import { getSafeRedirectPath } from "@/lib/authRedirect";

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.trim()) e.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
    if (!form.password) e.password = "Required";
    else if (form.password.length < 8) e.password = "Min 8 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          // Land the email-confirmation link back where the user left off
          // (e.g. /create to resume the evite flow) instead of the site root.
          emailRedirectTo: `${window.location.origin}${redirectTo}`,
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          },
        },
      });

      if (error) {
        toast.error(error.message);
        setErrors({ email: error.message });
        return;
      }

      if (data.user && !data.session) {
        toast.success("Account created. Check your inbox for an 8-digit verification code.");
        try { sessionStorage.setItem('mm_pending_signup_email', form.email.trim()); } catch { /* storage may be unavailable */ }
        // Carry the resume target through verification so the user lands back
        // in the flow (e.g. /create) after confirming, not on the homepage.
        navigate(
          redirectTo !== '/' ? `/verify-email?redirect=${encodeURIComponent(redirectTo)}` : '/verify-email',
          { state: { email: form.email } }
        );
      } else if (data.session) {
        toast.success("Account created successfully!");
        navigate(redirectTo, { replace: true });
      } else {
        toast.error("Sign up failed. Please try again.");
        setErrors({ email: "Sign up failed. Please try again." });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      toast.error(message);
      setErrors({ email: message });
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <AuthLayout>
        <main className="auth-panel auth-panel-signup auth-glass mx-auto flex w-full max-w-[500px] flex-col items-center rounded-2xl p-6 sm:p-8">
          <div className="auth-panel-heading text-center mb-6">
            <p className="font-serif-exp text-sm uppercase tracking-[0.2em] mb-2 opacity-60">moments & memories</p>
            <h1 className="font-agatho text-4xl text-[#1a2418] drop-shadow-sm">Create Account</h1>
          </div>

          <form className="auth-panel-form w-full space-y-3" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <div className="flex gap-4">
              <div className="space-y-1 w-1/2">
                <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">First Name</label>
                <input autoComplete="given-name" className="auth-control w-full px-4 py-2.5 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="John" value={form.firstName} onChange={set("firstName")} />
                {errors.firstName && <p className="text-xs text-red-500 ml-1">{errors.firstName}</p>}
              </div>
              <div className="space-y-1 w-1/2">
                <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Last Name</label>
                <input autoComplete="family-name" className="auth-control w-full px-4 py-2.5 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="Doe" value={form.lastName} onChange={set("lastName")} />
                {errors.lastName && <p className="text-xs text-red-500 ml-1">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Email Address</label>
              <input autoComplete="email" className="auth-control w-full px-4 py-2.5 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="name@example.com" type="email" value={form.email} onChange={set("email")} />
              {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Password</label>
              <input autoComplete="new-password" className="auth-control w-full px-4 py-2.5 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="••••••••" type="password" value={form.password} onChange={set("password")} />
              {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Confirm Password</label>
              <input autoComplete="new-password" className="auth-control w-full px-4 py-2.5 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="••••••••" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-red-500 ml-1">{errors.confirmPassword}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="auth-submit w-full py-3 mt-2 bg-primary text-white rounded-lg font-bold tracking-wide uppercase text-xs auth-btn-glow hover:bg-primary/90 transition-all transform active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <div className="auth-social w-full mt-4 flex flex-col items-center gap-3">
              <div className="flex items-center w-full gap-4 opacity-30">
                <div className="h-[1px] bg-[#1a2418] flex-grow" />
                <span className="text-[10px] font-bold uppercase tracking-widest">OR</span>
                <div className="h-[1px] bg-[#1a2418] flex-grow" />
              </div>
              <GoogleAuthButton
                redirectTo={redirectTo}
                disabled={loading}
                fallbackClassName="auth-google-button w-full py-3 px-4 rounded-lg auth-input flex items-center justify-center gap-3 hover:bg-white/60 transition-all active:scale-[0.99] disabled:opacity-60"
              />
            </div>
          </form>

          <div className="auth-panel-footer mt-5 pt-4 border-t border-black/5 w-full text-center">
            <Link
              to={redirectTo !== '/' ? `/sign-in?redirect=${encodeURIComponent(redirectTo)}` : '/sign-in'}
              className="text-sm text-[#1a2418]/70 hover:text-primary transition-colors"
            >
              Already have an account? <span className="font-bold underline decoration-1 underline-offset-2">Sign In</span>
            </Link>
          </div>
        </main>
    </AuthLayout>
  );
};

export default SignUp;
