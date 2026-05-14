import { useEffect, useId, type CSSProperties } from 'react';
import type {
  CurvePreset,
  Line,
  TemplateLayout,
  TextEffect,
  TextSource,
  Zone,
} from '@/lib/templateLayouts';
import { polygonBBox, polygonHorizontalExtent } from '@/lib/templateLayouts';
import { loadEviteFonts } from '@/lib/fontLoader';

interface OverlayContent {
  eventTitle: string;
  formData: Record<string, string>;
  displayDate?: string;
  eventInfoLabel?: string;
}

interface TemplateOverlayProps extends OverlayContent {
  layout: TemplateLayout | undefined;
  colorOverride?: string;
}

export default function TemplateOverlay({
  layout,
  colorOverride,
  ...content
}: TemplateOverlayProps) {
  useEffect(() => {
    loadEviteFonts();
  }, []);

  if (!layout || layout.zones.length === 0) {
    return <DefaultOverlay {...content} />;
  }

  const textColor = colorOverride ?? layout.palette.text_default;
  const sourceMap = buildSourceMap(content);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ containerType: 'inline-size' }}>
      {layout.zones.map((zone) => (
        <ZoneRender
          key={zone.id}
          zone={zone}
          sourceMap={sourceMap}
          defaultColor={textColor}
          scrim={layout.palette.scrim}
        />
      ))}
    </div>
  );
}

// ── Content resolution ───────────────────────────────────────────────────
function possessive(name: string): string {
  if (!name) return '';
  // Simple English possessive — append "'s". Names ending in s could take just "'",
  // but for evite display "'s" reads more naturally even there.
  return `${name}’s`;
}

function buildSourceMap(content: OverlayContent): Record<TextSource, string> {
  const fd = content.formData;
  const date = fd.eventDate ? new Date(fd.eventDate + 'T00:00:00') : null;
  const dow = date ? date.toLocaleDateString('en-US', { weekday: 'long' }) : '';
  const dowShort = date ? date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase() : '';
  const month = date ? date.toLocaleDateString('en-US', { month: 'long' }) : '';
  const monthShort = date ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : '';
  const dayNum = date ? String(date.getDate()) : '';
  const year = date ? String(date.getFullYear()) : '';
  const celebrant = fd.celebrantName || fd.eventName || '';
  const host = fd.hostName || '';

  return {
    literal: '',
    celebrant_name: celebrant,
    celebrant_possessive: possessive(celebrant),
    event_label: content.eventInfoLabel || '',
    event_title: content.eventTitle,
    host_name: host,
    host_possessive: possessive(host),
    bride_name: fd.brideName || '',
    groom_name: fd.groomName || '',
    names_combined:
      fd.brideName && fd.groomName ? `${fd.brideName} & ${fd.groomName}` : fd.brideName || fd.groomName || '',
    date_full: content.displayDate || '',
    date_day_num: dayNum,
    date_dow: dow,
    date_dow_short: dowShort,
    date_month: month,
    date_month_short: monthShort,
    date_year: year,
    time: fd.eventTime || '',
    timezone: fd.timezone || '',
    time_with_tz: fd.eventTime ? (fd.timezone ? `${fd.eventTime} · ${fd.timezone}` : fd.eventTime) : '',
    venue: fd.venue || '',
    rsvp_contact: fd.rsvpContact || '',
    custom_message: fd.customMessage || '',
  };
}

function lineText(line: Line, map: Record<TextSource, string>): string {
  let raw =
    line.text_source === 'literal' ? line.literal_text ?? '' : map[line.text_source] ?? '';
  // Allow simple {token} substitution in literal_text (e.g. pipe-date-row preset)
  if (line.text_source === 'literal' && raw.includes('{')) {
    raw = raw.replace(/\{(\w+)\}/g, (_m, key: string) => (map as Record<string, string>)[key] ?? '');
  }
  if (line.uppercase) raw = raw.toUpperCase();
  return raw;
}

// ── Zone render ──────────────────────────────────────────────────────────
function ZoneRender({
  zone,
  sourceMap,
  defaultColor,
  scrim,
}: {
  zone: Zone;
  sourceMap: Record<TextSource, string>;
  defaultColor: string;
  scrim: string | null;
}) {
  const linesWithText = zone.lines
    .map((l) => ({ line: l, text: lineText(l, sourceMap) }))
    .filter((x) => x.text.length > 0);
  if (linesWithText.length === 0) return null;

  const bb = polygonBBox(zone.polygon);
  if (bb.w <= 0 || bb.h <= 0) return null;

  const totalPct = linesWithText.reduce((sum, { line }) => sum + line.size_pct, 0);
  const scale = totalPct > 100 ? 100 / totalPct : 1;

  // For each line, find the polygon's horizontal extent at the line's vertical
  // mid-point. The text then renders at that left/width, so it follows the
  // polygon's contour vertically rather than the bounding rectangle.
  let cumulativeYPctOfImage = bb.y;
  const positionedLines = linesWithText.map(({ line, text }) => {
    const lineHeightPctOfImage = (line.size_pct * scale * bb.h) / 100;
    const midY = cumulativeYPctOfImage + lineHeightPctOfImage / 2;
    const extent =
      polygonHorizontalExtent(zone.polygon, midY) ?? { left: bb.x, right: bb.x + bb.w };
    const top = cumulativeYPctOfImage;
    const left = extent.left;
    const width = Math.max(extent.right - extent.left, 1);
    cumulativeYPctOfImage += lineHeightPctOfImage;
    return { line, text, top, left, width, height: lineHeightPctOfImage };
  });

  return (
    <>
      {positionedLines.map(({ line, text, top, left, width, height }, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            width: `${width}%`,
            height: `${height}%`,
            containerType: 'size',
          }}
        >
          {scrim && (
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: scrim, borderRadius: 2 }}
            />
          )}
          <LineFitted line={line} text={text} color={line.color ?? defaultColor} />
        </div>
      ))}
    </>
  );
}

function LineFitted({ line, text, color }: { line: Line; text: string; color: string }) {
  const curve: CurvePreset = line.curve_preset ?? 'flat';
  if (curve === 'flat') return <FlatFitted line={line} text={text} color={color} />;
  return <CurvedFitted line={line} text={text} color={color} />;
}

function FlatFitted({ line, text, color }: { line: Line; text: string; color: string }) {
  const effect: TextEffect = line.effect ?? 'shadow';
  const fxStyle = effectToCSS(effect, color);
  const style: CSSProperties = {
    fontFamily: `"${line.font_family}", serif`,
    fontWeight: line.font_weight,
    fontStyle: line.italic ? 'italic' : 'normal',
    letterSpacing: `${line.letter_spacing}em`,
    color,
    // 95% of container height — line fills the height; horizontal overflow is
    // already prevented by the parent's width matching the polygon contour.
    fontSize: '95cqh',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    justifyContent:
      line.align === 'center' ? 'center' : line.align === 'right' ? 'flex-end' : 'flex-start',
    width: '100%',
    height: '100%',
    ...fxStyle,
  };
  return <span style={style}>{text}</span>;
}

function CurvedFitted({ line, text, color }: { line: Line; text: string; color: string }) {
  return (
    <div className="w-full h-full">
      <CurvedLine line={line} text={text} color={color} />
    </div>
  );
}

// ── Curved text (SVG textPath) ───────────────────────────────────────────
function CurvedLine({
  line,
  text,
  color,
}: {
  line: Line;
  text: string;
  color: string;
}) {
  const pathId = useId();
  const filterId = `${pathId}-fx`;
  const gradId = `${pathId}-grad`;
  const curve: CurvePreset = line.curve_preset ?? 'flat';
  const effect: TextEffect = line.effect ?? 'shadow';

  // SVG fills the parent line container (sized by ZoneRender). viewBox aspect
  // is roughly 5:1 for arcs/waves and 1:1 for circle to give curves room.
  const W = 1000;
  const H = curve === 'circle' ? 1000 : 250;
  const d = buildPath(curve, line.curve_amount ?? 50, W, H);

  const startOffset = line.align === 'center' ? '50%' : line.align === 'right' ? '100%' : '0%';
  const textAnchor = line.align === 'center' ? 'middle' : line.align === 'right' ? 'end' : 'start';
  const fontSize = curve === 'circle' ? H * 0.16 : H * 0.55;
  const useGold = effect === 'gold';

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      width="100%"
      height="100%"
      style={{ overflow: 'visible' }}
    >
      <defs>
        <path id={pathId} d={d} fill="none" />
        {useGold && (
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6e27a" />
            <stop offset="35%" stopColor="#e9c46a" />
            <stop offset="55%" stopColor="#d4a73c" />
            <stop offset="100%" stopColor="#f6e27a" />
          </linearGradient>
        )}
        {effect === 'shadow' && (
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.35" />
          </filter>
        )}
      </defs>
      <text
        fontFamily={`"${line.font_family}", serif`}
        fontWeight={line.font_weight}
        fontStyle={line.italic ? 'italic' : 'normal'}
        letterSpacing={`${line.letter_spacing}em`}
        fontSize={fontSize}
        fill={useGold ? `url(#${gradId})` : color}
        stroke={effect === 'outline' ? color : undefined}
        strokeWidth={effect === 'outline' ? 1 : undefined}
        filter={effect === 'shadow' ? `url(#${filterId})` : undefined}
        textAnchor={textAnchor}
      >
        <textPath href={`#${pathId}`} startOffset={startOffset}>
          {text}
        </textPath>
      </text>
    </svg>
  );
}

function buildPath(preset: CurvePreset, amount: number, W: number, H: number): string {
  const a = Math.max(0, Math.min(100, amount)) / 100;
  switch (preset) {
    case 'arc-up': {
      const peak = H * 0.45 - a * H * 0.35;
      const baseline = H * 0.85;
      return `M 0 ${baseline} Q ${W / 2} ${peak} ${W} ${baseline}`;
    }
    case 'arc-down': {
      const dip = H * 0.55 + a * H * 0.35;
      const baseline = H * 0.2;
      return `M 0 ${baseline} Q ${W / 2} ${dip} ${W} ${baseline}`;
    }
    case 'wave': {
      const amp = H * 0.25 * a + 20;
      const midY = H / 2;
      return `M 0 ${midY} Q ${W / 4} ${midY - amp} ${W / 2} ${midY} T ${W} ${midY}`;
    }
    case 'circle': {
      const r = (H / 2) * (0.45 + (1 - a) * 0.35);
      const cx = W / 2;
      const cy = H / 2;
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
    }
    case 'flat':
    default:
      return `M 0 ${H / 2} L ${W} ${H / 2}`;
  }
}

function effectToCSS(effect: TextEffect, color: string): CSSProperties {
  switch (effect) {
    case 'shadow':
      return { textShadow: '0 1px 2px rgba(0,0,0,0.35), 0 0 1px rgba(0,0,0,0.2)' };
    case 'gold':
      return {
        backgroundImage:
          'linear-gradient(135deg, #f6e27a 0%, #e9c46a 35%, #d4a73c 55%, #f6e27a 85%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        color: 'transparent',
        textShadow: '0 1px 2px rgba(0,0,0,0.25)',
      };
    case 'outline':
      return {
        WebkitTextStrokeWidth: '0.5px',
        WebkitTextStrokeColor: color,
        color: 'transparent',
      } as CSSProperties;
    default:
      return {};
  }
}

// ── Legacy fallback when no layout exists ────────────────────────────────
function DefaultOverlay({
  eventTitle,
  formData,
  displayDate,
}: OverlayContent) {
  const fd = formData;
  return (
    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-6 pointer-events-none">
      <p className="font-display text-[8px] tracking-[0.25em] uppercase text-white/55 mb-1">
        You're invited to
      </p>
      <h4 className="font-serif-exp text-lg md:text-2xl text-white leading-tight">{eventTitle}</h4>
      <div className="space-y-1 mt-2">
        {displayDate && (
          <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
              calendar_today
            </span>
            {displayDate}
          </p>
        )}
        {fd.eventTime && (
          <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
              schedule
            </span>
            {fd.eventTime}
            {fd.timezone && ` · ${fd.timezone}`}
          </p>
        )}
        {fd.venue && (
          <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
              location_on
            </span>
            {fd.venue}
          </p>
        )}
        {fd.rsvpContact && (
          <p className="font-display text-[9px] md:text-[10px] text-white/75 flex items-center gap-1.5">
            <span className="material-icons text-[#9cb092]" style={{ fontSize: '11px' }}>
              mail
            </span>
            RSVP: {fd.rsvpContact}
          </p>
        )}
      </div>
      {fd.customMessage && (
        <p className="font-serif-exp italic text-[10px] md:text-xs text-white/65 mt-3 border-t border-white/10 pt-2">
          “{fd.customMessage}”
        </p>
      )}
    </div>
  );
}
