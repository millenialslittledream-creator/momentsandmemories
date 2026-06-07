import { Fragment, useMemo, type CSSProperties, type ReactNode } from 'react';
import type {
  EventsListColumnStyle,
  EventsListLayout,
  EviteTemplate,
  TemplateFieldLayout,
} from '@/data/eviteTemplates';
import { formatFieldValue } from '@/utils/templateRendering';

interface TemplateRendererProps {
  template: EviteTemplate;
  formData: Record<string, string>;
  className?: string;
}

function formatDateShort(yyyymmdd: string): string {
  if (!yyyymmdd) return '';
  const d = new Date(yyyymmdd + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return yyyymmdd;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function formatTime12h(hhmm: string): string {
  if (!hhmm) return '';
  const [hStr, mStr] = hhmm.split(':');
  const hh = Number(hStr);
  const mm = Number(mStr);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return hhmm;
  const meridian = hh >= 12 ? 'PM' : 'AM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${meridian}`;
}

/**
 * Wrap `text` into multiple lines, each line at most `limit` characters
 * long, breaking at the nearest space boundary. Used by the events-list
 * venue renderer so long addresses cascade onto line 2, 3, 4… without
 * spilling past the right edge.
 */
function wrapAfter(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const lines: string[] = [];
  let rest = text.trim();
  while (rest.length > limit) {
    // Prefer the last space at or before the limit.
    let breakIdx = rest.lastIndexOf(' ', limit);
    if (breakIdx <= 0) {
      // No space in the first `limit` chars — fall back to the first
      // space ANYWHERE after the limit. If there's no space at all,
      // dump what's left as a single line and bail.
      breakIdx = rest.indexOf(' ', limit);
      if (breakIdx <= 0) {
        lines.push(rest);
        return lines.join('\n');
      }
    }
    lines.push(rest.slice(0, breakIdx));
    rest = rest.slice(breakIdx + 1).trimStart();
  }
  if (rest) lines.push(rest);
  return lines.join('\n');
}

function fieldStyle(
  field: TemplateFieldLayout,
  naturalWidth: number,
  naturalHeight: number
): CSSProperties {
  const leftPct = (field.x / naturalWidth) * 100;
  const topPct = (field.y / naturalHeight) * 100;
  const translateX =
    field.align === 'center' ? '-50%' : field.align === 'right' ? '-100%' : '0';
  const lineHeightRatio = field.lineHeight
    ? field.lineHeight / field.fontSize
    : 1.3;

  return {
    position: 'absolute',
    left: `${leftPct}%`,
    top: `${topPct}%`,
    transform: `translateX(${translateX})`,
    transformOrigin: 'top left',
    display: 'inline-flex',
    alignItems: 'center',
    gap: field.iconBefore
      ? `calc(${field.iconGap ?? 12} / ${naturalWidth} * 100cqi)`
      : undefined,
    fontFamily: `"${field.fontFamily}"`,
    fontWeight: field.fontWeight || 400,
    fontStyle: field.fontStyle || 'normal',
    color: field.color,
    fontSize: `calc(${field.fontSize} / ${naturalWidth} * 100cqi)`,
    lineHeight: lineHeightRatio,
    letterSpacing: field.letterSpacing
      ? `calc(${field.letterSpacing} / ${naturalWidth} * 100cqi)`
      : undefined,
    textAlign: field.align,
    textTransform: field.textTransform,
    whiteSpace: 'pre',
    pointerEvents: 'none',
    maxWidth: field.maxWidth
      ? `calc(${field.maxWidth} / ${naturalWidth} * 100cqi)`
      : undefined,
  };
}

/**
 * Build the absolute-positioned style for a single piece of text inside
 * one sub-event row. `y` is the absolute Y in image pixels (sourced
 * from the row entry's nameY / dateTimeY / venueY).
 */
function eventColumnStyle(
  col: EventsListColumnStyle,
  y: number,
  naturalWidth: number,
  naturalHeight: number
): CSSProperties {
  const leftPct = (col.x / naturalWidth) * 100;
  const topPct = (y / naturalHeight) * 100;
  const align = col.align ?? 'left';
  const translateX = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0';
  const lineHeightRatio = col.lineHeight ? col.lineHeight / col.fontSize : 1.3;

  return {
    position: 'absolute',
    left: `${leftPct}%`,
    top: `${topPct}%`,
    transform: `translateX(${translateX})`,
    transformOrigin: 'top left',
    fontFamily: `"${col.fontFamily}"`,
    fontWeight: col.fontWeight || 400,
    fontStyle: col.fontStyle || 'normal',
    color: col.color,
    fontSize: `calc(${col.fontSize} / ${naturalWidth} * 100cqi)`,
    lineHeight: lineHeightRatio,
    letterSpacing: col.letterSpacing
      ? `calc(${col.letterSpacing} / ${naturalWidth} * 100cqi)`
      : undefined,
    textAlign: align,
    textTransform: col.textTransform,
    whiteSpace: 'pre',
    pointerEvents: 'none',
    maxWidth: col.maxWidth
      ? `calc(${col.maxWidth} / ${naturalWidth} * 100cqi)`
      : undefined,
  };
}

function iconStyle(
  field: TemplateFieldLayout,
  naturalWidth: number
): CSSProperties {
  const size = field.iconSize ?? field.fontSize;
  return {
    fontFamily: '"Material Icons"',
    fontStyle: 'normal',
    fontWeight: 'normal',
    fontSize: `calc(${size} / ${naturalWidth} * 100cqi)`,
    color: field.iconColor || field.color,
    letterSpacing: 'normal',
    lineHeight: 1,
    flexShrink: 0,
  };
}

export default function TemplateRenderer({
  template,
  formData,
  className,
}: TemplateRendererProps) {
  const layout = template.layout;

  const fieldNodes = useMemo(() => {
    if (!layout) return null;
    return layout.fields.map((field, idx) => {
      const text = formatFieldValue(field, formData);
      if (!text && !field.iconBefore) return null;
      const key = field.formKey || field.text || `field-${idx}`;
      return (
        <div
          key={`${key}-${idx}`}
          style={fieldStyle(field, layout.naturalWidth, layout.naturalHeight)}
        >
          {field.iconBefore && (
            <span style={iconStyle(field, layout.naturalWidth)}>
              {field.iconBefore}
            </span>
          )}
          {text && <span>{text}</span>}
        </div>
      );
    });
  }, [layout, formData]);

  // Dynamic events list. Row 0 is ALWAYS the main event (sourced from
  // the main form's eventDate / eventTime / timezone / venue, with its
  // name pulled from layout.eventsList.mainEventName, defaulting to
  // "Main Event"). Rows 1+ are sub-events the host added via the
  // Multiple Events toggle (sub_0_*, sub_1_*, ...). Capped at maxRows.
  const eventListNodes = useMemo<ReactNode>(() => {
    if (!layout?.eventsList) return null;
    const list: EventsListLayout = layout.eventsList;

    // Build the combined event list (main + sub) in order.
    type Row = { name: string; date: string; time: string; tz: string; venue: string };
    const events: Row[] = [];

    // Row 0 — main event from the main form
    const mainName = (list.mainEventName ?? 'Main Event').trim();
    const mainDate = formData['eventDate'] || '';
    const mainTime = formData['eventTime'] || '';
    const mainTz = formData['timezone'] || '';
    const mainVenue = formData['venue']?.trim() || '';
    if (mainName || mainDate || mainTime || mainVenue) {
      events.push({
        name: mainName,
        date: mainDate,
        time: mainTime,
        tz: mainTz,
        venue: mainVenue,
      });
    }

    // Rows 1+ — sub-events
    const subCount = parseInt(formData['sub_events_count'] || '0', 10) || 0;
    const maxRows = list.rows.length;
    for (let i = 0; i < subCount; i++) {
      if (events.length >= maxRows) break;
      const name = formData[`sub_${i}_name`]?.trim() || '';
      const date = formData[`sub_${i}_date`] || '';
      const time = formData[`sub_${i}_time`] || '';
      const tz = formData[`sub_${i}_timezone`] || '';
      const venue = formData[`sub_${i}_venue`]?.trim() || '';
      if (!name && !date && !time && !venue) continue;
      events.push({ name, date, time, tz, venue });
    }

    if (events.length === 0) return null;

    const nodes: ReactNode[] = [];
    events.forEach((ev, i) => {
      const row = list.rows[i];
      // Date on line 1, time + timezone on line 2.
      // The renderer's `whiteSpace: 'pre'` honors the \n as a real break.
      const dateStr = formatDateShort(ev.date);
      const timeStr = formatTime12h(ev.time);
      const lines: string[] = [];
      if (dateStr) lines.push(dateStr);
      if (timeStr) lines.push(timeStr + (ev.tz ? ` ${ev.tz}` : ''));
      const dateTimeStr = lines.join('\n');

      const venueStr = list.venue.wrapAfterChars
        ? wrapAfter(ev.venue, list.venue.wrapAfterChars)
        : ev.venue;

      const nameStr = list.name.wrapAfterChars
        ? wrapAfter(ev.name, list.name.wrapAfterChars)
        : ev.name;

      nodes.push(
        <Fragment key={`evrow-${i}`}>
          {nameStr && (
            <div style={eventColumnStyle(list.name, row.nameY, layout.naturalWidth, layout.naturalHeight)}>
              {nameStr}
            </div>
          )}
          {dateTimeStr && (
            <div style={eventColumnStyle(list.dateTime, row.dateTimeY, layout.naturalWidth, layout.naturalHeight)}>
              {dateTimeStr}
            </div>
          )}
          {venueStr && (
            <div style={eventColumnStyle(list.venue, row.venueY, layout.naturalWidth, layout.naturalHeight)}>
              {venueStr}
            </div>
          )}
        </Fragment>
      );
    });

    return nodes;
  }, [layout, formData]);

  if (!layout) {
    return (
      <div className={className}>
        <img
          src={template.previewImage}
          alt={template.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        containerType: 'inline-size',
        aspectRatio: `${layout.naturalWidth} / ${layout.naturalHeight}`,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
      }}
    >
      <img
        src={template.previewImage}
        alt={template.name}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      {fieldNodes}
      {eventListNodes}
    </div>
  );
}
