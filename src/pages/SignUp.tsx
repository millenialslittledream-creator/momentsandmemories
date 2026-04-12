import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import PageTransition from "@/components/PageTransition";
import GoogleIcon from "@/components/GoogleIcon";

const SignUp = () => {
  const navigate = useNavigate();
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
          data: {
            first_name: form.firstName.trim(),
            last_name: form.lastName.trim(),
            full_name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          },
        },
      });

      if (error) {
        setErrors({ email: error.message });
        return;
      }

      if (data.user && !data.session) {
        toast.success("Account created! Please verify your email.");
        navigate("/verify-email", { state: { email: form.email } });
      } else if (data.session) {
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch {
      setErrors({ email: "An unexpected error occurred" });
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
      toast.error("Failed to sign up with Google");
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <PageTransition>
      <div className="bg-stone-matte text-[#1a2418] font-display min-h-screen w-full overflow-hidden flex items-center justify-center relative py-10">
        <div className="absolute inset-0 auth-grid-bg pointer-events-none" />
        <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3" />
        <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-[#B0BBA8]/20 rounded-full blur-[100px] pointer-events-none" />

        <main className="auth-glass relative z-10 w-full max-w-lg p-8 md:p-10 rounded-2xl flex flex-col items-center mx-4">
          <div className="text-center mb-6">
            <p className="font-serif-exp text-sm uppercase tracking-[0.2em] mb-2 opacity-60">moments & memories</p>
            <h1 className="font-agatho text-4xl text-[#1a2418] drop-shadow-sm">Create Account</h1>
          </div>

          <form className="w-full space-y-4" onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
            <div className="flex gap-4">
              <div className="space-y-1 w-1/2">
                <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">First Name</label>
                <input className="w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="John" value={form.firstName} onChange={set("firstName")} />
                {errors.firstName && <p className="text-xs text-red-500 ml-1">{errors.firstName}</p>}
              </div>
              <div className="space-y-1 w-1/2">
                <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Last Name</label>
                <input className="w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="Doe" value={form.lastName} onChange={set("lastName")} />
                {errors.lastName && <p className="text-xs text-red-500 ml-1">{errors.lastName}</p>}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Email Address</label>
              <input className="w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="name@example.com" type="email" value={form.email} onChange={set("email")} />
              {errors.email && <p className="text-xs text-red-500 ml-1">{errors.email}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Password</label>
              <input className="w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="••••••••" type="password" value={form.password} onChange={set("password")} />
              {errors.password && <p className="text-xs text-red-500 ml-1">{errors.password}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60 ml-1">Confirm Password</label>
              <input className="w-full px-4 py-3 rounded-lg auth-input text-sm placeholder-gray-500/50" placeholder="••••••••" type="password" value={form.confirmPassword} onChange={set("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-red-500 ml-1">{errors.confirmPassword}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-4 bg-primary text-white rounded-lg font-bold tracking-wide uppercase text-xs auth-btn-glow hover:bg-primary/90 transition-all transform active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>

            <div className="w-full mt-6 flex flex-col items-center gap-4">
              <div className="flex items-center w-full gap-4 opacity-30">
                <div className="h-[1px] bg-[#1a2418] flex-grow" />
                <span className="text-[10px] font-bold uppercase tracking-widest">OR</span>
                <div className="h-[1px] bg-[#1a2418] flex-grow" />
              </div>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg auth-input flex items-center justify-center gap-3 hover:bg-white/60 transition-all transform active:scale-[0.99] group disabled:opacity-60"
              >
                <GoogleIcon />
                <span className="font-agatho text-lg text-[#1a2418]/80 group-hover:text-[#1a2418]">Continue with Google</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-black/5 w-full text-center">
            <Link to="/sign-in" className="text-sm text-[#1a2418]/70 hover:text-primary transition-colors">
              Already have an account? <span className="font-bold underline decoration-1 underline-offset-2">Sign In</span>
            </Link>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default SignUp;
