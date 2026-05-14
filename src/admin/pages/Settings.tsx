import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LLM_PROVIDER_INFO,
  loadSettings,
  saveSettings,
  type LLMProvider,
  type StudioSettings,
} from '../lib/settings';

export default function Settings() {
  const [settings, setSettings] = useState<StudioSettings>(() => loadSettings());
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const update = (patch: Partial<StudioSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    setSavedAt(Date.now());
  };

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white/90">
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/_studio"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white/80"
          >
            ← Studio
          </Link>
          <h1 className="font-mono text-xs tracking-[0.25em] uppercase text-white/60">Settings</h1>
        </div>
        {savedAt && (
          <span className="font-mono text-[10px] text-[#9cb092]">Saved</span>
        )}
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <section>
          <h2 className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/70 mb-1">
            LLM provider
          </h2>
          <p className="font-mono text-[10px] text-white/40 leading-relaxed mb-4">
            How the studio gets typography / preset suggestions when you click "Suggest" on a
            template. Stored only in your browser; never sent to the server unless you call the
            relevant endpoint.
          </p>

          <div className="space-y-2">
            {(Object.keys(LLM_PROVIDER_INFO) as LLMProvider[]).map((p) => {
              const info = LLM_PROVIDER_INFO[p];
              const sel = settings.llm_provider === p;
              return (
                <label
                  key={p}
                  className={`block px-4 py-3 border cursor-pointer transition-colors ${
                    sel
                      ? 'border-[#9cb092] bg-[#9cb092]/5'
                      : 'border-white/10 hover:border-white/30'
                  } ${info.status === 'planned' ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="llm_provider"
                      value={p}
                      checked={sel}
                      onChange={() => update({ llm_provider: p })}
                      className="accent-[#9cb092]"
                    />
                    <span className="font-mono text-sm text-white/90">{info.label}</span>
                    <span
                      className={`font-mono text-[9px] tracking-[0.2em] uppercase ${
                        info.status === 'ready' ? 'text-[#9cb092]' : 'text-yellow-400/60'
                      }`}
                    >
                      {info.status === 'ready' ? '· ready' : '· planned'}
                    </span>
                  </div>
                  <p className="font-mono text-[10px] text-white/50 mt-1 pl-7">{info.tagline}</p>
                </label>
              );
            })}
          </div>
        </section>

        {settings.llm_provider === 'anthropic' && (
          <section className="space-y-2">
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60">
              Anthropic API key
            </h3>
            <input
              type="password"
              value={settings.anthropic_api_key}
              onChange={(e) => update({ anthropic_api_key: e.target.value })}
              placeholder="sk-ant-..."
              className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white/90 font-mono text-xs px-3 h-10 outline-none"
            />
            <p className="font-mono text-[9px] text-white/40">
              Stored in your browser's localStorage. Get a key at console.anthropic.com.
            </p>
            <p className="font-mono text-[9px] text-yellow-400/70">
              Wiring through backend proxy comes next turn — saving the key is functional now.
            </p>
          </section>
        )}

        {settings.llm_provider === 'ollama' && (
          <section className="space-y-2">
            <h3 className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60">
              Ollama URL
            </h3>
            <input
              type="text"
              value={settings.ollama_url}
              onChange={(e) => update({ ollama_url: e.target.value })}
              placeholder="http://localhost:11434"
              className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white/90 font-mono text-xs px-3 h-10 outline-none"
            />
            <p className="font-mono text-[9px] text-white/40">
              Run <code>ollama pull llama3.2-vision</code> first. Default port is 11434.
            </p>
            <p className="font-mono text-[9px] text-yellow-400/70">
              Wiring through backend proxy comes next turn.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
