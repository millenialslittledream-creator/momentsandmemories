import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import GoogleIcon from "@/components/GoogleIcon";
import { rememberOAuthRedirect } from "@/lib/authRedirect";

/**
 * Google sign-in / sign-up button.
 *
 * With VITE_GOOGLE_CLIENT_ID set, this uses Google Identity Services: Google's own
 * popup identifies *this site* ("Sign in to mymomentsnmemories.com") and the returned
 * ID token is exchanged with Supabase via signInWithIdToken. This avoids the redirect
 * flow whose Google page reads "to continue to <project-ref>.supabase.co".
 *
 * Without a client id (or if Google's script is blocked) it falls back to the standard
 * Supabase OAuth redirect so sign-in keeps working.
 */

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const GSI_SRC = "https://accounts.google.com/gsi/client";

interface GsiApi {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        nonce: string;
        callback: (response: { credential: string }) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: {
          type: "standard";
          theme: "outline";
          size: "large";
          text: "continue_with";
          shape: "rectangular";
          width: number;
        },
      ) => void;
    };
  };
}

let gsiScript: Promise<GsiApi> | null = null;

const getGsi = () => (window as unknown as { google?: { accounts?: GsiApi["accounts"] } }).google;

function loadGsi(): Promise<GsiApi> {
  if (gsiScript) return gsiScript;
  gsiScript = new Promise<GsiApi>((resolve, reject) => {
    const ready = () => {
      const api = getGsi();
      if (api?.accounts?.id) resolve(api as GsiApi);
      else reject(new Error("Google Identity Services unavailable"));
    };
    if (getGsi()?.accounts?.id) return ready();
    const script = document.createElement("script");
    script.src = GSI_SRC;
    script.async = true;
    script.onload = ready;
    script.onerror = () => reject(new Error("Google Identity Services failed to load"));
    document.head.appendChild(script);
  }).catch((err) => {
    gsiScript = null;
    throw err;
  });
  return gsiScript;
}

function randomNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

interface GoogleAuthButtonProps {
  redirectTo: string;
  disabled?: boolean;
  /** Classes for the redirect-flow fallback button (the Google-rendered button is fixed). */
  fallbackClassName?: string;
}

export default function GoogleAuthButton({ redirectTo, disabled, fallbackClassName }: GoogleAuthButtonProps) {
  const navigate = useNavigate();
  const holder = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [gsiFailed, setGsiFailed] = useState(false);
  const useGsi = Boolean(CLIENT_ID) && !gsiFailed;

  useEffect(() => {
    if (!useGsi) return;
    let cancelled = false;

    (async () => {
      try {
        const gsi = await loadGsi();
        const rawNonce = randomNonce();
        const hashedNonce = await sha256Hex(rawNonce);
        const el = holder.current;
        if (cancelled || !el) return;

        gsi.accounts.id.initialize({
          client_id: CLIENT_ID,
          nonce: hashedNonce,
          callback: async ({ credential }) => {
            setBusy(true);
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: credential,
              nonce: rawNonce,
            });
            if (error) {
              toast.error(error.message);
              setBusy(false);
              return;
            }
            toast.success("Welcome!");
            navigate(redirectTo, { replace: true });
          },
        });
        gsi.accounts.id.renderButton(el, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          width: Math.min(Math.max(el.clientWidth, 200), 400),
        });
      } catch {
        if (!cancelled) setGsiFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [useGsi, redirectTo, navigate]);

  const handleRedirectFlow = async () => {
    setBusy(true);
    try {
      rememberOAuthRedirect(redirectTo);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${redirectTo}` },
      });
      if (error) {
        toast.error(error.message);
        setBusy(false);
      }
    } catch {
      toast.error("Failed to continue with Google");
      setBusy(false);
    }
  };

  if (useGsi) {
    return (
      <div
        ref={holder}
        aria-busy={busy}
        className={`w-full flex justify-center min-h-[44px] ${busy || disabled ? "pointer-events-none opacity-60" : ""}`}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleRedirectFlow}
      disabled={busy || disabled}
      className={
        fallbackClassName ??
        "w-full py-3 px-4 rounded-lg auth-input flex items-center justify-center gap-3 hover:bg-white/60 transition-all active:scale-[0.99] disabled:opacity-60"
      }
    >
      <GoogleIcon />
      <span className="font-agatho text-lg text-[#1a2418]">Continue with Google</span>
    </button>
  );
}
