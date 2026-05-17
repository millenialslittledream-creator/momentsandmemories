import type {
  EviteTemplate,
  TemplateFieldLayout,
} from '@/data/eviteTemplates';
import { formatFieldValue, loadImage } from './templateRendering';

function fontShorthand(
  fontFamily: string,
  fontSize: number,
  fontWeight?: string,
  fontStyle?: 'normal' | 'italic'
): string {
  const style = fontStyle || 'normal';
  const weight = fontWeight || '400';
  return `${style} ${weight} ${fontSize}px "${fontFamily}"`;
}

function drawFieldLine(
  ctx: CanvasRenderingContext2D,
  field: TemplateFieldLayout,
  line: string,
  baselineY: number
): void {
  const hasIcon = !!field.iconBefore;
  const iconSize = field.iconSize ?? field.fontSize;
  const iconGap = field.iconGap ?? 12;

  ctx.font = fontShorthand(
    field.fontFamily,
    field.fontSize,
    field.fontWeight,
    field.fontStyle
  );
  ctx.textBaseline = 'top';
  ctx.fillStyle = field.color;

  // letterSpacing is supported via ctx.letterSpacing in modern browsers.
  if (field.letterSpacing) {
    (ctx as unknown as { letterSpacing: string }).letterSpacing =
      `${field.letterSpacing}px`;
  } else {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = '0px';
  }

  const textWidth = ctx.measureText(line).width;

  let iconWidth = 0;
  if (hasIcon) {
    ctx.font = `${iconSize}px "Material Icons"`;
    iconWidth = ctx.measureText(field.iconBefore!).width;
  }

  const totalWidth = hasIcon ? iconWidth + iconGap + textWidth : textWidth;

  let startX = field.x;
  if (field.align === 'center') startX = field.x - totalWidth / 2;
  else if (field.align === 'right') startX = field.x - totalWidth;

  if (hasIcon) {
    ctx.font = `${iconSize}px "Material Icons"`;
    ctx.fillStyle = field.iconColor || field.color;
    ctx.textAlign = 'left';
    ctx.fillText(field.iconBefore!, startX, baselineY);
  }

  ctx.font = fontShorthand(
    field.fontFamily,
    field.fontSize,
    field.fontWeight,
    field.fontStyle
  );
  ctx.fillStyle = field.color;
  ctx.textAlign = 'left';
  const textX = hasIcon ? startX + iconWidth + iconGap : startX;
  ctx.fillText(line, textX, baselineY);
}

export async function renderTemplateToCanvas(
  template: EviteTemplate,
  formData: Record<string, string>
): Promise<HTMLCanvasElement> {
  if (!template.layout) {
    throw new Error(
      `Template ${template.id} has no layout config — cannot render to canvas.`
    );
  }

  const { naturalWidth, naturalHeight, fields } = template.layout;
  const canvas = document.createElement('canvas');
  canvas.width = naturalWidth;
  canvas.height = naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  const bg = await loadImage(template.previewImage);
  ctx.drawImage(bg, 0, 0, naturalWidth, naturalHeight);

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  for (const field of fields) {
    const text = formatFieldValue(field, formData);
    if (!text && !field.iconBefore) continue;

    const lineHeight = field.lineHeight || field.fontSize * 1.3;
    const lines = text ? text.split('\n') : [''];
    lines.forEach((line, i) => {
      drawFieldLine(ctx, field, line, field.y + i * lineHeight);
    });
  }

  return canvas;
}

export async function downloadTemplatePng(
  template: EviteTemplate,
  formData: Record<string, string>,
  filename?: string
): Promise<void> {
  const canvas = await renderTemplateToCanvas(template, formData);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to encode canvas as PNG'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `${template.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/png');
  });
}
