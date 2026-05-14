import { useEffect, useState, type ReactNode } from 'react';
import {
  adminApi,
  clearStoredSecret,
  getStoredSecret,
  setStoredSecret,
} from '../lib/adminClient';

type GateStatus = 'checking' | 'locked' | 'unlocked';

/**
 * Shared-secret gate for the admin module.
 * Renders nothing recognizable until the secret is verified — to a curious
 * visitor it just looks like a blank page (and the API returns 404).
 */
export default function SecretGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Inject noindex meta and override the document title while in /_studio.
  useEffect(() => {
    const prevTitle = document.title;
    document.title = '';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow,noarchive';
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = getStoredSecret();
      if (!stored) {
        if (!cancelled) setStatus('locked');
        return;
      }
      try {
        await adminApi.verify();
        if (!cancelled) setStatus('unlocked');
      } catch {
        clearStoredSecret();
        if (!cancelled) setStatus('locked');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || submitting) return;
    setSubmitting(true);
    setError(null);
    setStoredSecret(input);
    try {
      await adminApi.verify();
      setStatus('unlocked');
    } catch {
      clearStoredSecret();
      setError('Invalid');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'checking') {
    return <div className="min-h-screen bg-[#0a0f0a]" />;
  }

  if (status === 'locked') {
    return (
      <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-xs space-y-4"
          aria-label="Access"
        >
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            placeholder=""
            aria-label="Access key"
            className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white/90 font-mono text-sm px-3 h-10 rounded-sm outline-none transition-colors"
          />
          {error && (
            <p className="text-red-400/70 font-mono text-[10px] tracking-wide">{error}</p>
          )}
          <button
            type="submit"
            disabled={!input || submitting}
            className="w-full h-10 bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white/70 font-mono text-xs tracking-[0.2em] uppercase disabled:opacity-40 transition-colors"
          >
            {submitting ? '...' : 'Enter'}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}
