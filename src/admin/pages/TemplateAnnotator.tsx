import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { eviteTemplates } from '@/data/eviteTemplates';
import { adminApi } from '../lib/adminClient';
import {
  CURVE_PRESETS,
  DEFAULT_PALETTE,
  EFFECTS,
  FONT_GROUPS,
  FONT_LABELS,
  FONT_WEIGHTS,
  TEXT_SOURCES,
  type FontFamily,
  type Line,
  type Palette,
  type TextSource,
  type Zone,
} from '../types';
import { loadEviteFonts } from '@/lib/fontLoader';
import { invalidateTemplateLayouts } from '@/lib/templateLayouts';
import { ZONE_PRESETS, zoneFromPreset } from '../presets';
import { loadSettings } from '../lib/settings';
import ZoneCanvas from '../components/ZoneCanvas';
import PalettePicker from '../components/PalettePicker';
import SuggestDialog from '../components/SuggestDialog';

export default function TemplateAnnotator() {
  useEffect(() => {
    loadEviteFonts();
  }, []);
  const { templateId } = useParams<{ templateId: string }>();
  const template = useMemo(
    () => eviteTemplates.find((t) => t.id === templateId) ?? null,
    [templateId]
  );

  const [zones, setZones] = useState<Zone[]>([]);
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedLineIdx, setSelectedLineIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [presetPickerOpen, setPresetPickerOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const llmProvider = loadSettings().llm_provider;

  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    (async () => {
      try {
        const layout = await adminApi.getLayout(templateId);
        if (cancelled) return;
        setZones(layout.zones);
        setPalette(layout.palette);
      } catch {
        if (cancelled) return;
        setZones([]);
        setPresetPickerOpen(true); // empty layout → suggest picking a preset
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (!template) {
    return (
      <div className="min-h-screen bg-[#0a0f0a] text-white/70 flex items-center justify-center font-mono text-xs">
        Template not found ·{' '}
        <Link to="/_studio" className="underline ml-2">
          back
        </Link>
      </div>
    );
  }

  const addPreset = (presetId: string) => {
    const preset = ZONE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const zone = zoneFromPreset(preset, zones.length + 1);
    setZones((prev) => [...prev, zone]);
    setSelectedIndex(zones.length);
    setSelectedLineIdx(0);
    setDirty(true);
    setPresetPickerOpen(false);
  };

  const removeZone = (index: number) => {
    setZones((prev) => prev.filter((_, i) => i !== index));
    setSelectedIndex(null);
    setSelectedLineIdx(null);
    setDirty(true);
  };

  const updateZone = (index: number, next: Zone) => {
    setZones((prev) => prev.map((z, i) => (i === index ? next : z)));
    setDirty(true);
  };

  const updateLine = (zoneIdx: number, lineIdx: number, next: Line) => {
    setZones((prev) =>
      prev.map((z, i) =>
        i === zoneIdx ? { ...z, lines: z.lines.map((l, li) => (li === lineIdx ? next : l)) } : z
      )
    );
    setDirty(true);
  };

  const addLine = (zoneIdx: number) => {
    setZones((prev) =>
      prev.map((z, i) =>
        i === zoneIdx
          ? {
              ...z,
              lines: [
                ...z.lines,
                {
                  text_source: 'literal' as TextSource,
                  literal_text: 'New line',
                  font_family: 'Cormorant Garamond' as FontFamily,
                  font_weight: 500,
                  italic: false,
                  letter_spacing: 0.02,
                  size_pct: 20,
                  align: 'center',
                  effect: 'shadow',
                  curve_preset: 'flat',
                  curve_amount: 50,
                  max_chars: 40,
                },
              ],
            }
          : z
      )
    );
    setDirty(true);
  };

  const removeLine = (zoneIdx: number, lineIdx: number) => {
    setZones((prev) =>
      prev.map((z, i) =>
        i === zoneIdx ? { ...z, lines: z.lines.filter((_, li) => li !== lineIdx) } : z
      )
    );
    if (selectedLineIdx === lineIdx) setSelectedLineIdx(null);
    setDirty(true);
  };

  const reorderLine = (zoneIdx: number, fromIdx: number, toIdx: number) => {
    setZones((prev) =>
      prev.map((z, i) => {
        if (i !== zoneIdx) return z;
        const lines = z.lines.slice();
        const [moved] = lines.splice(fromIdx, 1);
        lines.splice(toIdx, 0, moved);
        return { ...z, lines };
      })
    );
    if (selectedLineIdx === fromIdx) setSelectedLineIdx(toIdx);
    setDirty(true);
  };

  const save = async () => {
    if (!templateId) return;
    setSaving(true);
    setError(null);
    try {
      await adminApi.saveLayout(templateId, zones, palette);
      invalidateTemplateLayouts();
      setDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectedZone = selectedIndex !== null ? zones[selectedIndex] : null;
  const selectedLine =
    selectedZone && selectedLineIdx !== null ? selectedZone.lines[selectedLineIdx] : null;

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white/90">
      <header className="border-b border-white/10 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/_studio"
            className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/40 hover:text-white/80"
          >
            ← Studio
          </Link>
          <div>
            <p className="font-mono text-[10px] text-white/40 tracking-wide">{template.id}</p>
            <p className="font-mono text-sm text-white/90">{template.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPresetPickerOpen((v) => !v)}
            className="px-3 h-8 border border-white/15 hover:border-white/40 text-white/70 font-mono text-[10px] tracking-[0.2em] uppercase"
          >
            + Add preset
          </button>
          {llmProvider !== 'none' && (
            <button
              onClick={() => setSuggestOpen(true)}
              className="px-3 h-8 border border-[#9cb092]/40 hover:border-[#9cb092] hover:bg-[#9cb092]/10 text-[#9cb092] font-mono text-[10px] tracking-[0.2em] uppercase"
              title={`Generate suggestions (${llmProvider})`}
            >
              ✨ Suggest
            </button>
          )}
          {error && <span className="font-mono text-[10px] text-red-400/80">{error}</span>}
          {dirty && !saving && (
            <span className="font-mono text-[10px] text-yellow-400/70 tracking-wider">UNSAVED</span>
          )}
          <button
            onClick={save}
            disabled={!dirty || saving}
            className="px-4 h-8 bg-[#9cb092]/20 border border-[#9cb092]/60 hover:bg-[#9cb092]/30 text-[#9cb092] font-mono text-[11px] tracking-[0.2em] uppercase disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </header>

      <SuggestDialog
        open={suggestOpen}
        templateId={template.id}
        templateImageUrl={template.previewImage}
        onClose={() => setSuggestOpen(false)}
        onApply={({ zones: nz, palette: np }) => {
          setZones(nz);
          setPalette(np);
          setSelectedIndex(null);
          setSelectedLineIdx(null);
          setDirty(true);
        }}
      />

      {presetPickerOpen && (
        <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-white/60">
              Choose a preset to drop into this template
            </p>
            <button
              onClick={() => setPresetPickerOpen(false)}
              className="font-mono text-[10px] text-white/40 hover:text-white/80"
            >
              ✕ close
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {ZONE_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => addPreset(p.id)}
                className="p-3 text-left border border-white/10 hover:border-[#9cb092] hover:bg-[#9cb092]/5 transition-colors"
              >
                <p className="font-mono text-[10px] text-white/90 mb-1">{p.name}</p>
                <p className="font-mono text-[9px] text-white/50 leading-snug">{p.description}</p>
                <div className="mt-2 space-y-0.5">
                  {p.lines.slice(0, 3).map((l, i) => (
                    <p
                      key={i}
                      className="truncate text-[10px]"
                      style={{
                        fontFamily: `"${l.font_family}", serif`,
                        fontWeight: l.font_weight,
                        fontStyle: l.italic ? 'italic' : 'normal',
                        color: '#9cb092',
                      }}
                    >
                      {l.literal_text || `<${l.text_source}>`}
                    </p>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-6 font-mono text-[10px] text-white/30">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 p-6">
          <div>
            <ZoneCanvas
              imageUrl={template.previewImage}
              zones={zones}
              selectedIndex={selectedIndex}
              textColor={palette.text_default}
              onSelect={(i) => {
                setSelectedIndex(i);
                setSelectedLineIdx(0);
              }}
              onUpdate={updateZone}
            />
            {zones.length === 0 && (
              <p className="text-center mt-6 font-mono text-[10px] text-white/40">
                No zones yet. Click <strong>+ Add preset</strong> above to drop one in.
              </p>
            )}
          </div>

          <aside className="space-y-5">
            <section>
              <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40 mb-2">
                Zones
              </p>
              <div className="space-y-1">
                {zones.map((z, i) => (
                  <button
                    key={z.id}
                    onClick={() => {
                      setSelectedIndex(i);
                      setSelectedLineIdx(0);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 h-8 border font-mono text-[10px] tracking-wide text-left ${
                      i === selectedIndex
                        ? 'border-[#9cb092] bg-[#9cb092]/10 text-[#9cb092]'
                        : 'border-white/10 text-white/60 hover:border-white/25'
                    }`}
                  >
                    <span className="truncate">{z.id}</span>
                    <span className="text-white/30">{z.lines.length} lines</span>
                  </button>
                ))}
              </div>
            </section>

            {selectedZone && selectedIndex !== null && (
              <ZoneInspector
                zone={selectedZone}
                selectedLineIdx={selectedLineIdx}
                onSelectLine={setSelectedLineIdx}
                onZoneChange={(next) => updateZone(selectedIndex, next)}
                onLineChange={(li, next) => updateLine(selectedIndex, li, next)}
                onAddLine={() => addLine(selectedIndex)}
                onRemoveLine={(li) => removeLine(selectedIndex, li)}
                onReorderLine={(from, to) => reorderLine(selectedIndex, from, to)}
                onRemoveZone={() => removeZone(selectedIndex)}
              />
            )}

            {selectedLine !== null && selectedLineIdx !== null && selectedIndex !== null && (
              <LineInspector
                line={selectedLine}
                onChange={(next) => updateLine(selectedIndex, selectedLineIdx, next)}
              />
            )}

            <section className="pt-3 border-t border-white/10">
              <PalettePicker
                imageUrl={template.previewImage}
                selected={palette.text_default}
                alts={palette.text_alts}
                onChange={(hex) => {
                  setPalette({ ...palette, text_default: hex });
                  setDirty(true);
                }}
                onAltsChange={(alts) => {
                  setPalette({ ...palette, text_alts: alts });
                  setDirty(true);
                }}
              />
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}

// ── Zone-level inspector (geometry + rotation + line list) ──────────────
function ZoneInspector({
  zone,
  selectedLineIdx,
  onSelectLine,
  onAddLine,
  onRemoveLine,
  onReorderLine,
  onRemoveZone,
}: {
  zone: Zone;
  selectedLineIdx: number | null;
  onSelectLine: (i: number) => void;
  onZoneChange: (z: Zone) => void;
  onLineChange: (i: number, l: Line) => void;
  onAddLine: () => void;
  onRemoveLine: (i: number) => void;
  onReorderLine: (from: number, to: number) => void;
  onRemoveZone: () => void;
}) {
  const label = 'font-mono text-[9px] tracking-[0.15em] uppercase text-white/50';
  return (
    <section className="space-y-3 pt-3 border-t border-white/10">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40">Zone</p>

      <div className="text-[10px] font-mono text-white/40 leading-relaxed">
        <p>· Drag any green vertex to reshape</p>
        <p>· Click a white midpoint to add a new vertex</p>
        <p>· Right-click a green vertex to remove it</p>
        <p>· {zone.polygon.length} vertices</p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className={label}>Lines</span>
          <button
            onClick={onAddLine}
            className="font-mono text-[9px] text-[#9cb092] hover:text-[#adc4a3]"
          >
            + add
          </button>
        </div>
        <div className="space-y-1">
          {zone.lines.map((line, i) => {
            const isSel = i === selectedLineIdx;
            const canUp = i > 0;
            const canDown = i < zone.lines.length - 1;
            return (
              <div
                key={i}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', String(i));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData('text/plain'));
                  if (!Number.isNaN(from) && from !== i) onReorderLine(from, i);
                }}
                className={`flex items-center gap-1 px-2 h-7 border ${
                  isSel
                    ? 'border-[#9cb092] bg-[#9cb092]/10 text-[#9cb092]'
                    : 'border-white/10 text-white/60 hover:border-white/25'
                }`}
              >
                <span
                  className="cursor-grab text-white/30 font-mono text-[10px] select-none"
                  title="Drag to reorder"
                >
                  ⋮⋮
                </span>
                <button
                  onClick={() => onSelectLine(i)}
                  className="flex-1 text-left truncate font-mono text-[10px]"
                  title={line.text_source}
                  style={{
                    fontFamily: `"${line.font_family}", serif`,
                    fontStyle: line.italic ? 'italic' : 'normal',
                  }}
                >
                  {line.text_source === 'literal' ? line.literal_text : line.text_source}
                </button>
                <span className="text-white/30 font-mono text-[9px]">
                  {Math.round(line.size_pct)}%
                </span>
                <button
                  onClick={() => canUp && onReorderLine(i, i - 1)}
                  disabled={!canUp}
                  className="text-white/40 hover:text-white disabled:opacity-20 font-mono text-[10px] px-0.5"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => canDown && onReorderLine(i, i + 1)}
                  disabled={!canDown}
                  className="text-white/40 hover:text-white disabled:opacity-20 font-mono text-[10px] px-0.5"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => onRemoveLine(i)}
                  className="text-red-400/40 hover:text-red-400/80 font-mono text-[10px]"
                  title="Remove line"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onRemoveZone}
        className="w-full h-7 border border-red-400/20 hover:border-red-400/50 hover:bg-red-400/5 text-red-400/70 font-mono text-[10px] tracking-[0.15em] uppercase transition-colors"
      >
        Remove zone
      </button>
    </section>
  );
}

// ── Line-level inspector (the part you edit most) ───────────────────────
function LineInspector({ line, onChange }: { line: Line; onChange: (l: Line) => void }) {
  const label = 'font-mono text-[9px] tracking-[0.15em] uppercase text-white/50';
  const inputCls =
    'mt-1 w-full bg-white/[0.04] border border-white/10 focus:border-white/30 text-white/90 font-mono text-xs px-2 h-8 outline-none';
  return (
    <section className="space-y-3 pt-3 border-t border-white/10">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40">Line</p>

      {/* Text source */}
      <label className="block">
        <span className={label}>Text</span>
        <select
          value={line.text_source}
          onChange={(e) => onChange({ ...line, text_source: e.target.value as TextSource })}
          className={`${inputCls} cursor-pointer appearance-none`}
        >
          {TEXT_SOURCES.map((s) => (
            <option key={s.id} value={s.id} className="bg-[#0a0f0a]">
              {s.label} — {s.example}
            </option>
          ))}
        </select>
      </label>

      {line.text_source === 'literal' && (
        <label className="block">
          <span className={label}>Literal text</span>
          <input
            type="text"
            value={line.literal_text ?? ''}
            onChange={(e) => onChange({ ...line, literal_text: e.target.value })}
            className={inputCls}
          />
        </label>
      )}

      {/* Font */}
      <label className="block">
        <span className={label}>Font</span>
        <select
          value={line.font_family}
          onChange={(e) => onChange({ ...line, font_family: e.target.value as FontFamily })}
          className={`${inputCls} cursor-pointer appearance-none`}
          style={{ fontFamily: `"${line.font_family}", serif` }}
        >
          {FONT_GROUPS.map((g) => (
            <optgroup key={g.group} label={g.group}>
              {g.fonts.map((f) => (
                <option
                  key={f}
                  value={f}
                  className="bg-[#0a0f0a]"
                  style={{ fontFamily: `"${f}", serif` }}
                >
                  {FONT_LABELS[f]}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>

      <label className="block">
        <span className={label}>Weight</span>
        <div className="mt-1 flex gap-1">
          {FONT_WEIGHTS.map((w) => (
            <button
              key={w}
              onClick={() => onChange({ ...line, font_weight: w })}
              className={`flex-1 h-7 border font-mono text-[10px] tracking-wide ${
                line.font_weight === w
                  ? 'bg-white/10 border-white/40 text-white'
                  : 'border-white/10 text-white/50 hover:border-white/25'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </label>

      <div className="flex gap-2">
        <button
          onClick={() => onChange({ ...line, italic: !line.italic })}
          className={`flex-1 h-7 border font-mono text-[10px] tracking-wider uppercase ${
            line.italic
              ? 'bg-white/10 border-white/40 text-white italic'
              : 'border-white/10 text-white/50 hover:border-white/25'
          }`}
        >
          Italic
        </button>
        <button
          onClick={() => onChange({ ...line, uppercase: !line.uppercase })}
          className={`flex-1 h-7 border font-mono text-[10px] tracking-wider uppercase ${
            line.uppercase
              ? 'bg-white/10 border-white/40 text-white'
              : 'border-white/10 text-white/50 hover:border-white/25'
          }`}
        >
          UPPER
        </button>
      </div>

      <label className="block">
        <span className={label}>Size ({Math.round(line.size_pct)}% of zone)</span>
        <input
          type="range"
          min={5}
          max={100}
          step={1}
          value={line.size_pct}
          onChange={(e) => onChange({ ...line, size_pct: Number(e.target.value) })}
          className="mt-1 w-full"
        />
      </label>

      <label className="block">
        <span className={label}>Tracking ({line.letter_spacing.toFixed(3)}em)</span>
        <input
          type="range"
          min={-0.05}
          max={0.4}
          step={0.005}
          value={line.letter_spacing}
          onChange={(e) => onChange({ ...line, letter_spacing: Number(e.target.value) })}
          className="mt-1 w-full"
        />
      </label>

      <label className="block">
        <span className={label}>Align</span>
        <div className="mt-1 flex gap-1">
          {(['left', 'center', 'right'] as const).map((a) => (
            <button
              key={a}
              onClick={() => onChange({ ...line, align: a })}
              className={`flex-1 h-7 border font-mono text-[10px] uppercase tracking-wide ${
                line.align === a
                  ? 'bg-white/10 border-white/40 text-white'
                  : 'border-white/10 text-white/50 hover:border-white/25'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </label>

      <label className="block">
        <span className={label}>Effect</span>
        <div className="mt-1 grid grid-cols-4 gap-1">
          {EFFECTS.map((e) => (
            <button
              key={e}
              onClick={() => onChange({ ...line, effect: e })}
              className={`h-7 border font-mono text-[10px] tracking-wider uppercase ${
                (line.effect ?? 'shadow') === e
                  ? 'bg-white/10 border-white/40 text-white'
                  : 'border-white/10 text-white/50 hover:border-white/25'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </label>

      <label className="block">
        <span className={label}>Curve</span>
        <div className="mt-1 grid grid-cols-5 gap-1">
          {CURVE_PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => onChange({ ...line, curve_preset: p })}
              className={`h-7 border font-mono text-[9px] tracking-wider uppercase ${
                (line.curve_preset ?? 'flat') === p
                  ? 'bg-[#9cb092]/20 border-[#9cb092]/60 text-[#9cb092]'
                  : 'border-white/10 text-white/50 hover:border-white/25'
              }`}
              title={p}
            >
              {p === 'arc-up' ? '⌒' : p === 'arc-down' ? '⌣' : p === 'wave' ? '∿' : p === 'circle' ? '◯' : '—'}
            </button>
          ))}
        </div>
      </label>

      {(line.curve_preset ?? 'flat') !== 'flat' && (
        <label className="block">
          <span className={label}>Curve amount ({Math.round(line.curve_amount ?? 50)})</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={line.curve_amount ?? 50}
            onChange={(e) => onChange({ ...line, curve_amount: Number(e.target.value) })}
            className="mt-1 w-full"
          />
        </label>
      )}

      <label className="block">
        <span className={label}>Max characters</span>
        <input
          type="number"
          min={1}
          max={500}
          value={line.max_chars}
          onChange={(e) => onChange({ ...line, max_chars: Math.max(1, Number(e.target.value) || 1) })}
          className={inputCls}
        />
      </label>
    </section>
  );
}
