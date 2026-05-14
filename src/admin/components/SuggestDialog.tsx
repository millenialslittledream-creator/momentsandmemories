import { useEffect, useMemo, useState } from 'react';
import type { Palette, Zone } from '../types';
import { adminApi } from '../lib/adminClient';
import { loadSettings, type LLMProvider } from '../lib/settings';
import { normalizeSuggestion, type NormalizedSuggestion } from '../lib/normalizer';

interface Props {
  open: boolean;
  templateId: string;
  templateImageUrl: string;
  onClose: () => void;
  onApply: (suggestion: { zones: Zone[]; palette: Palette }) => void;
}

const PROMPT = `You are designing text placement on an invitation/flier template image. I'm attaching the template image.

OUTPUT: a single JSON object. No markdown fences. No preamble. No commentary. Just JSON.

Schema:
{
  "zones": [
    {
      "id": "string",
      "polygon": [{"x": number 0-100, "y": number 0-100}, ...3-24 points, in clockwise order],
      "lines": [
        {
          "text_source": "literal" | "celebrant_name" | "celebrant_possessive" | "event_label" | "event_title" | "host_name" | "host_possessive" | "bride_name" | "groom_name" | "names_combined" | "date_full" | "date_day_num" | "date_dow" | "date_dow_short" | "date_month" | "date_month_short" | "date_year" | "time" | "timezone" | "time_with_tz" | "venue" | "rsvp_contact" | "custom_message",
          "literal_text": "string (only if text_source=='literal')",
          "font_family": "Italiana" | "Cormorant Garamond" | "Playfair Display" | "Bodoni Moda" | "Cinzel" | "DM Serif Display" | "Abril Fatface" | "Tenor Sans" | "Inter" | "Allura" | "Great Vibes" | "Sacramento",
          "font_weight": 100-900,
          "italic": boolean,
          "letter_spacing": number (em),
          "uppercase": boolean,
          "size_pct": number (line height as % of zone height; lines in a zone should sum to ~100),
          "align": "left" | "center" | "right",
          "effect": "none" | "shadow" | "gold" | "outline",
          "curve_preset": "flat" | "arc-up" | "arc-down" | "wave" | "circle",
          "curve_amount": 0-100,
          "max_chars": number
        }
      ]
    }
  ],
  "palette": {
    "text_default": "#hex",
    "text_alts": ["#hex", "#hex"],
    "scrim": null
  }
}

Example response for a pink-pastel birthday card with empty space in the center:
{
  "zones": [
    {
      "id": "hero",
      "polygon": [{"x": 10, "y": 28}, {"x": 90, "y": 28}, {"x": 90, "y": 60}, {"x": 10, "y": 60}],
      "lines": [
        {"text_source":"literal","literal_text":"You're invited to celebrate","font_family":"Tenor Sans","font_weight":400,"italic":true,"letter_spacing":0.08,"uppercase":false,"size_pct":12,"align":"center","effect":"shadow","curve_preset":"flat","curve_amount":50,"max_chars":40},
        {"text_source":"celebrant_possessive","literal_text":null,"font_family":"Allura","font_weight":400,"italic":false,"letter_spacing":0,"uppercase":false,"size_pct":58,"align":"center","effect":"shadow","curve_preset":"flat","curve_amount":50,"max_chars":18},
        {"text_source":"event_label","literal_text":null,"font_family":"Tenor Sans","font_weight":500,"italic":false,"letter_spacing":0.4,"uppercase":true,"size_pct":14,"align":"center","effect":"shadow","curve_preset":"flat","curve_amount":50,"max_chars":24}
      ]
    },
    {
      "id": "date-block",
      "polygon": [{"x": 8, "y": 66}, {"x": 28, "y": 66}, {"x": 28, "y": 90}, {"x": 8, "y": 90}],
      "lines": [
        {"text_source":"date_month_short","literal_text":null,"font_family":"Tenor Sans","font_weight":500,"italic":false,"letter_spacing":0.28,"uppercase":true,"size_pct":22,"align":"center","effect":"shadow","curve_preset":"flat","curve_amount":50,"max_chars":6},
        {"text_source":"date_day_num","literal_text":null,"font_family":"Bodoni Moda","font_weight":700,"italic":false,"letter_spacing":0,"uppercase":false,"size_pct":55,"align":"center","effect":"shadow","curve_preset":"flat","curve_amount":50,"max_chars":4},
        {"text_source":"date_dow","literal_text":null,"font_family":"Tenor Sans","font_weight":500,"italic":false,"letter_spacing":0.28,"uppercase":true,"size_pct":18,"align":"center","effect":"shadow","curve_preset":"flat","curve_amount":50,"max_chars":10}
      ]
    }
  ],
  "palette": {"text_default": "#1a1a2e", "text_alts": ["#1a1a2e","#7a2848","#c9b037","#ffffff"], "scrim": null}
}

Guidance:
- Identify empty / low-contrast regions where text would be legible.
- For irregular empty space, draw a polygon with 5-8 vertices that traces it (not just a rectangle).
- Build hero zones with 2-3 stacked lines: a small italic invitation phrase, a big script possessive name, a tracked uppercase event label.
- Include separate zones for the date block and details (time/venue/RSVP) when there's room.
- Pick fonts to match the template's aesthetic: scripts (Allura/Great Vibes/Sacramento) for soft templates, bold display serifs (DM Serif Display, Abril Fatface) for bold designs.
- Pick text_default from a color that already appears in the image so it harmonizes.

Now produce the JSON for the attached image.`;

type Step = 'configure' | 'preview';

export default function SuggestDialog({
  open,
  templateId,
  templateImageUrl,
  onClose,
  onApply,
}: Props) {
  const [pastedJson, setPastedJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [normalized, setNormalized] = useState<NormalizedSuggestion | null>(null);
  const [step, setStep] = useState<Step>('configure');

  const settings = loadSettings();
  const provider: LLMProvider = settings.llm_provider;

  useEffect(() => {
    if (open) {
      setPastedJson('');
      setError(null);
      setInfo(null);
      setCopied(false);
      setLoading(false);
      setResponse(null);
      setNormalized(null);
      setStep('configure');
    }
  }, [open]);

  const fullImageUrl = useMemo(() => {
    if (typeof window === 'undefined') return templateImageUrl;
    try {
      return new URL(templateImageUrl, window.location.origin).toString();
    } catch {
      return templateImageUrl;
    }
  }, [templateImageUrl]);

  if (!open) return null;

  // ── L1 helpers: copy prompt + image to clipboard so a single Ctrl+V in
  //    Claude.ai attaches the image AND inserts the text. Falls back to
  //    copy-text + download-image when ClipboardItem isn't supported.
  const copyPromptAndImage = async () => {
    setError(null);
    setInfo(null);
    try {
      const res = await fetch(fullImageUrl);
      if (!res.ok) throw new Error(`fetch image: HTTP ${res.status}`);
      const blob = await res.blob();
      // Claude.ai expects PNG/JPEG; ensure type is set.
      const imgType = blob.type || 'image/jpeg';
      // ClipboardItem requires PNG on many platforms — re-encode JPEG to PNG via canvas.
      let finalBlob = blob;
      let finalType = imgType;
      if (imgType !== 'image/png') {
        try {
          finalBlob = await jpegToPng(blob);
          finalType = 'image/png';
        } catch {
          // Stick with the original — most clipboards accept JPEG too.
        }
      }
      const item = new ClipboardItem({
        [finalType]: finalBlob,
        'text/plain': new Blob([PROMPT], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      setInfo('Copied. In Claude: paste once (Ctrl+V) to attach the image and insert the prompt, then press Enter.');
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (e) {
      // Fallback: copy text only, plus offer a download for the image.
      try {
        await navigator.clipboard.writeText(PROMPT);
        setInfo(
          "Copied prompt only — your browser doesn't allow combined image+text copy. Use 'Download image' next to attach it manually in Claude."
        );
      } catch {
        setError(`Could not copy: ${e instanceof Error ? e.message : 'unknown'}`);
      }
    }
  };

  const downloadImage = async () => {
    setError(null);
    try {
      const res = await fetch(fullImageUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = templateId + (blob.type.includes('png') ? '.png' : '.jpg');
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setInfo(`Downloaded ${filename}. Drag it into Claude alongside the pasted prompt.`);
    } catch (e) {
      setError(`Download failed: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  };

  const openClaude = () => {
    window.open('https://claude.ai/new', '_blank', 'noopener,noreferrer');
  };

  const tryNormalize = (raw: string) => {
    setError(null);
    try {
      const result = normalizeSuggestion(raw);
      setNormalized(result);
      setStep('preview');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'parse failed');
    }
  };

  const callBackend = async (which: 'anthropic' | 'ollama') => {
    setLoading(true);
    setError(null);
    setResponse(null);
    setNormalized(null);
    try {
      const res = await adminApi.llmSuggest({
        provider: which,
        image_url: fullImageUrl,
        prompt: PROMPT,
        api_key: which === 'anthropic' ? settings.anthropic_api_key : undefined,
        ollama_url: which === 'ollama' ? settings.ollama_url : undefined,
      });
      setResponse(res.text);
      tryNormalize(res.text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'request failed');
    } finally {
      setLoading(false);
    }
  };

  const applyNormalized = () => {
    if (!normalized) return;
    onApply({ zones: normalized.zones, palette: normalized.palette });
    onClose();
  };

  // ── Bodies per provider / step ────────────────────────────────────
  const renderBody = () => {
    if (step === 'preview' && normalized) {
      return <PreviewBody />;
    }
    if (provider === 'paste') return <PasteBody />;
    if (provider === 'anthropic') return <ApiBody which="anthropic" />;
    if (provider === 'ollama') return <ApiBody which="ollama" />;
    return (
      <div className="p-6 font-mono text-[11px] text-white/70 leading-relaxed">
        No LLM provider selected. Go to{' '}
        <a href="/_studio/settings" className="underline text-[#9cb092]">
          Settings
        </a>{' '}
        and choose one.
      </div>
    );
  };

  function PasteBody() {
    return (
      <div className="p-5 space-y-4">
        <ol className="font-mono text-[11px] text-white/70 space-y-1.5 list-decimal pl-5 leading-relaxed">
          <li>Click <strong>Copy image + prompt</strong>.</li>
          <li>Click <strong>Open claude.ai</strong>.</li>
          <li>In Claude, press <kbd className="bg-white/10 px-1">Ctrl</kbd>+<kbd className="bg-white/10 px-1">V</kbd> — the image attaches and the prompt fills in.</li>
          <li>Press <strong>Enter</strong>.</li>
          <li>Copy Claude's JSON response, paste it below, click <strong>Parse</strong>.</li>
        </ol>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={copyPromptAndImage}
            className="px-3 h-9 bg-[#9cb092]/20 border border-[#9cb092]/60 hover:bg-[#9cb092]/30 text-[#9cb092] font-mono text-[11px] tracking-[0.2em] uppercase"
          >
            {copied ? '✓ Copied' : '📋 Copy image + prompt'}
          </button>
          <button
            onClick={downloadImage}
            className="px-3 h-9 border border-white/15 hover:border-white/40 text-white/80 font-mono text-[11px] tracking-[0.2em] uppercase"
            title="Fallback if combined copy didn't work"
          >
            ⬇ Download image
          </button>
          <button
            onClick={openClaude}
            className="px-3 h-9 border border-white/15 hover:border-white/40 text-white/80 font-mono text-[11px] tracking-[0.2em] uppercase"
          >
            ↗ Open claude.ai
          </button>
        </div>

        {info && (
          <p className="font-mono text-[10px] text-[#9cb092]/90 bg-[#9cb092]/5 border border-[#9cb092]/20 px-2 py-1.5">
            {info}
          </p>
        )}

        <div className="space-y-1">
          <label className="font-mono text-[10px] tracking-[0.15em] uppercase text-white/50">
            Paste Claude's JSON response here
          </label>
          <textarea
            value={pastedJson}
            onChange={(e) => setPastedJson(e.target.value)}
            placeholder='{"zones":[...],"palette":{...}}'
            rows={10}
            className="w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white/90 font-mono text-[11px] px-3 py-2 outline-none resize-none"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => tryNormalize(pastedJson)}
            disabled={!pastedJson.trim()}
            className="px-4 h-9 bg-[#9cb092]/20 border border-[#9cb092]/60 hover:bg-[#9cb092]/30 text-[#9cb092] font-mono text-[11px] tracking-[0.2em] uppercase disabled:opacity-40"
          >
            Parse →
          </button>
        </div>
      </div>
    );
  }

  function ApiBody({ which }: { which: 'anthropic' | 'ollama' }) {
    const label = which === 'anthropic' ? 'Anthropic API key' : 'Local Ollama';
    const ready = which === 'anthropic' ? !!settings.anthropic_api_key : !!settings.ollama_url;
    return (
      <div className="p-5 space-y-4">
        <p className="font-mono text-[11px] text-white/70">
          Provider: <strong>{label}</strong>
        </p>
        {!ready && (
          <p className="font-mono text-[10px] text-yellow-400/80">
            {which === 'anthropic'
              ? 'No API key set. Go to Settings.'
              : 'Ollama URL is empty. Set it in Settings.'}
          </p>
        )}
        <p className="font-mono text-[10px] text-white/50">
          The studio sends the template image + prompt to{' '}
          {which === 'anthropic'
            ? 'Claude Haiku 4.5'
            : "your local Ollama (llama3.2-vision)"}{' '}
          and applies the returned layout JSON.
        </p>
        <button
          onClick={() => callBackend(which)}
          disabled={!ready || loading}
          className="px-4 h-10 bg-[#9cb092]/20 border border-[#9cb092]/60 hover:bg-[#9cb092]/30 text-[#9cb092] font-mono text-[11px] tracking-[0.2em] uppercase disabled:opacity-40"
        >
          {loading ? 'Calling…' : '✨ Generate suggestion'}
        </button>
        {response && (
          <details className="border border-white/10 p-3">
            <summary className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/50 cursor-pointer">
              Raw response
            </summary>
            <pre className="font-mono text-[9px] text-white/60 mt-2 whitespace-pre-wrap leading-relaxed max-h-60 overflow-auto">
              {response}
            </pre>
          </details>
        )}
      </div>
    );
  }

  function PreviewBody() {
    if (!normalized) return null;
    return (
      <div className="p-5 space-y-4">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60">
          Suggestion preview
        </p>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {normalized.zones.map((z, i) => (
            <div key={i} className="border border-white/10 px-3 py-2 bg-white/[0.02]">
              <p className="font-mono text-[10px] text-white/80">
                <strong>{z.id}</strong>{' '}
                <span className="text-white/50">
                  · {z.polygon.length}-pt polygon · {z.lines.length} lines
                </span>
              </p>
              {z.lines.map((l, li) => (
                <p
                  key={li}
                  className="font-mono text-[10px] text-white/60 ml-2 truncate"
                  style={{
                    fontFamily: `"${l.font_family}", serif`,
                    fontStyle: l.italic ? 'italic' : 'normal',
                  }}
                >
                  · {l.text_source}
                  {l.text_source === 'literal' && l.literal_text ? `: "${l.literal_text}"` : ''}
                  <span className="text-white/30 ml-2">
                    {l.font_family} {l.font_weight} · {Math.round(l.size_pct)}%
                    {l.curve_preset !== 'flat' ? ` · ${l.curve_preset}` : ''}
                  </span>
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] text-white/60">
          <span>palette:</span>
          <span
            className="w-5 h-5 border border-white/20"
            style={{ background: normalized.palette.text_default }}
            title={normalized.palette.text_default}
          />
          {normalized.palette.text_alts.slice(0, 4).map((c, i) => (
            <span
              key={i}
              className="w-4 h-4 border border-white/20"
              style={{ background: c }}
              title={c}
            />
          ))}
        </div>

        {normalized.warnings.length > 0 && (
          <details className="border border-yellow-400/20 px-3 py-2 bg-yellow-400/[0.03]">
            <summary className="font-mono text-[10px] tracking-[0.15em] uppercase text-yellow-400/80 cursor-pointer">
              {normalized.warnings.length} warnings (normalized automatically)
            </summary>
            <ul className="font-mono text-[10px] text-yellow-400/70 mt-2 pl-4 list-disc space-y-1">
              {normalized.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex justify-between gap-2">
          <button
            onClick={() => {
              setStep('configure');
              setNormalized(null);
            }}
            className="px-3 h-9 border border-white/15 hover:border-white/40 text-white/60 font-mono text-[11px] tracking-[0.2em] uppercase"
          >
            ← Back
          </button>
          <button
            onClick={applyNormalized}
            className="px-4 h-9 bg-[#9cb092]/20 border border-[#9cb092]/60 hover:bg-[#9cb092]/30 text-[#9cb092] font-mono text-[11px] tracking-[0.2em] uppercase"
          >
            Apply to canvas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-[#0a0f0a] border border-white/15 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-mono text-xs tracking-[0.25em] uppercase text-white/80">
            Suggest with{' '}
            {step === 'preview'
              ? 'preview'
              : provider === 'paste'
              ? 'Claude (paste)'
              : provider === 'anthropic'
              ? 'Claude API'
              : provider === 'ollama'
              ? 'Ollama'
              : '—'}
          </h2>
          <button onClick={onClose} className="font-mono text-xs text-white/40 hover:text-white/80">
            ✕
          </button>
        </div>
        {error && (
          <p className="font-mono text-[10px] text-red-400/80 px-5 pt-3 whitespace-pre-wrap">
            {error}
          </p>
        )}
        {renderBody()}
      </div>
    </div>
  );
}

// ── JPEG → PNG conversion for clipboard compatibility ────────────────────
async function jpegToPng(blob: Blob): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('image load'));
    i.src = URL.createObjectURL(blob);
  });
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d ctx');
  ctx.drawImage(img, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => {
      URL.revokeObjectURL(img.src);
      if (b) resolve(b);
      else reject(new Error('toBlob failed'));
    }, 'image/png');
  });
}
