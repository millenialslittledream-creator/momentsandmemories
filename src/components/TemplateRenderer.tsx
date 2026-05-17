import { useMemo, type CSSProperties } from 'react';
import type { EviteTemplate, TemplateFieldLayout } from '@/data/eviteTemplates';
import { formatFieldValue } from '@/utils/templateRendering';

interface TemplateRendererProps {
  template: EviteTemplate;
  formData: Record<string, string>;
  className?: string;
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
    whiteSpace: 'pre',
    pointerEvents: 'none',
    maxWidth: field.maxWidth
      ? `calc(${field.maxWidth} / ${naturalWidth} * 100cqi)`
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
    </div>
  );
}
