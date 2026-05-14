import { useEffect, useRef, useState } from 'react';
import type { Line, Point, Zone } from '../types';
import { polygonBBox, polygonClipPath, FONT_LABELS } from '../types';

interface ZoneCanvasProps {
  imageUrl: string;
  zones: Zone[];
  selectedIndex: number | null;
  textColor: string;
  onSelect: (index: number) => void;
  onUpdate: (index: number, zone: Zone) => void;
}

type DragState =
  | { kind: 'vertex'; zoneIdx: number; vertexIdx: number; offsetX: number; offsetY: number }
  | { kind: 'zone'; zoneIdx: number; startX: number; startY: number; originalPolygon: Point[] }
  | null;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function ZoneCanvas({
  imageUrl,
  zones,
  selectedIndex,
  textColor,
  onSelect,
  onUpdate,
}: ZoneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(null);
  const zonesRef = useRef(zones);
  const onUpdateRef = useRef(onUpdate);
  zonesRef.current = zones;
  onUpdateRef.current = onUpdate;

  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);

  const pctFromClient = (clientX: number, clientY: number) => {
    const el = containerRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  };

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const z = zonesRef.current[drag.zoneIdx];
      if (!z) return;
      const { x, y } = pctFromClient(e.clientX, e.clientY);

      if (drag.kind === 'vertex') {
        const nx = clamp(x - drag.offsetX, 0, 100);
        const ny = clamp(y - drag.offsetY, 0, 100);
        const polygon = z.polygon.map((p, i) =>
          i === drag.vertexIdx ? { x: nx, y: ny } : p
        );
        onUpdateRef.current(drag.zoneIdx, { ...z, polygon });
      } else if (drag.kind === 'zone') {
        const dx = x - drag.startX;
        const dy = y - drag.startY;
        const polygon = drag.originalPolygon.map((p) => ({
          x: clamp(p.x + dx, 0, 100),
          y: clamp(p.y + dy, 0, 100),
        }));
        onUpdateRef.current(drag.zoneIdx, { ...z, polygon });
      }
    };
    const handleUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        rerender();
      }
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

  // Add a new vertex on the midpoint of the edge between vertexIdx and vertexIdx+1
  const splitEdge = (zoneIdx: number, edgeIdx: number) => {
    const z = zones[zoneIdx];
    const a = z.polygon[edgeIdx];
    const b = z.polygon[(edgeIdx + 1) % z.polygon.length];
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    const polygon = [
      ...z.polygon.slice(0, edgeIdx + 1),
      mid,
      ...z.polygon.slice(edgeIdx + 1),
    ];
    onUpdate(zoneIdx, { ...z, polygon });
  };

  const removeVertex = (zoneIdx: number, vertexIdx: number) => {
    const z = zones[zoneIdx];
    if (z.polygon.length <= 3) return; // Must have at least a triangle
    const polygon = z.polygon.filter((_, i) => i !== vertexIdx);
    onUpdate(zoneIdx, { ...z, polygon });
  };

  const beginZoneDrag = (e: React.PointerEvent, zoneIdx: number) => {
    e.stopPropagation();
    onSelect(zoneIdx);
    const { x, y } = pctFromClient(e.clientX, e.clientY);
    const z = zones[zoneIdx];
    dragRef.current = {
      kind: 'zone',
      zoneIdx,
      startX: x,
      startY: y,
      originalPolygon: z.polygon.map((p) => ({ ...p })),
    };
  };

  const beginVertexDrag = (e: React.PointerEvent, zoneIdx: number, vertexIdx: number) => {
    e.stopPropagation();
    onSelect(zoneIdx);
    const { x, y } = pctFromClient(e.clientX, e.clientY);
    const v = zones[zoneIdx].polygon[vertexIdx];
    dragRef.current = {
      kind: 'vertex',
      zoneIdx,
      vertexIdx,
      offsetX: x - v.x,
      offsetY: y - v.y,
    };
  };

  return (
    <div
      ref={containerRef}
      className="relative select-none w-full max-w-[500px] mx-auto aspect-[3/4] bg-black/40 border border-white/10 overflow-hidden"
    >
      <img
        src={imageUrl}
        alt="template"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Polygon outlines — drawn in SVG so we get proper hit testing */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
      >
        {zones.map((z, i) => {
          const selected = i === selectedIndex;
          const points = z.polygon.map((p) => `${p.x},${p.y}`).join(' ');
          return (
            <polygon
              key={`${z.id}-poly`}
              points={points}
              fill={selected ? 'rgba(156,176,146,0.10)' : 'rgba(255,255,255,0.05)'}
              stroke={selected ? '#9cb092' : 'rgba(255,255,255,0.5)'}
              strokeWidth={selected ? 0.4 : 0.25}
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {/* Per-zone content + drag/edit handles */}
      {zones.map((z, i) => {
        const selected = i === selectedIndex;
        const bb = polygonBBox(z.polygon);
        if (bb.w <= 0 || bb.h <= 0) return null;
        const clipPath = polygonClipPath(z.polygon);
        const previewLines = z.lines.slice(0, 3);

        return (
          <div key={z.id}>
            {/* Clickable polygon-shaped overlay for selection + zone drag */}
            <div
              onPointerDown={(e) => beginZoneDrag(e, i)}
              style={{
                left: `${bb.x}%`,
                top: `${bb.y}%`,
                width: `${bb.w}%`,
                height: `${bb.h}%`,
                clipPath,
              }}
              className={`absolute cursor-move flex flex-col justify-center items-center px-1 ${
                selected ? '' : 'hover:bg-white/[0.03]'
              }`}
            >
              {/* Mini preview lines using their actual fonts */}
              <div className="pointer-events-none w-full h-full flex flex-col justify-center overflow-hidden text-center">
                {previewLines.map((line, li) => (
                  <LinePreview key={li} line={line} color={textColor} />
                ))}
              </div>
            </div>

            {/* Zone ID label above bbox */}
            <div
              className="absolute font-mono text-[9px] tracking-[0.15em] uppercase whitespace-nowrap pointer-events-none"
              style={{
                left: `${bb.x}%`,
                top: `calc(${bb.y}% - 18px)`,
                color: selected ? '#9cb092' : 'rgba(255,255,255,0.6)',
              }}
            >
              {z.id}
            </div>

            {/* Vertex handles + edge midpoints — only on selected zone */}
            {selected &&
              z.polygon.map((p, vIdx) => {
                const next = z.polygon[(vIdx + 1) % z.polygon.length];
                const mid = { x: (p.x + next.x) / 2, y: (p.y + next.y) / 2 };
                return (
                  <div key={vIdx}>
                    {/* Corner vertex */}
                    <div
                      onPointerDown={(e) => beginVertexDrag(e, i, vIdx)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        removeVertex(i, vIdx);
                      }}
                      style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute w-3 h-3 bg-[#9cb092] border border-black cursor-grab hover:scale-125 transition-transform"
                      title="Drag to move, right-click to remove"
                    />
                    {/* Edge midpoint — click to insert a new vertex here */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        splitEdge(i, vIdx);
                      }}
                      style={{
                        left: `${mid.x}%`,
                        top: `${mid.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      className="absolute w-2 h-2 rounded-full bg-white/40 border border-black/60 hover:bg-white hover:scale-150 transition-all cursor-cell"
                      title="Click to split this edge"
                    />
                  </div>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

function LinePreview({ line, color }: { line: Line; color: string }) {
  const sample =
    line.text_source === 'literal' ? line.literal_text || '' : sampleFor(line.text_source);
  const text = line.uppercase ? sample.toUpperCase() : sample;
  const curve = line.curve_preset ?? 'flat';
  const baseColor = line.color ?? color;

  if (curve !== 'flat' && text) {
    // Tiny SVG preview of the curve so admin sees their pick applied.
    const W = 1000;
    const H = curve === 'circle' ? 1000 : 250;
    const d = buildPreviewPath(curve, line.curve_amount ?? 50, W, H);
    const pxHeight = Math.max(12, line.size_pct * 0.35);
    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: `${pxHeight}px`, overflow: 'visible', display: 'block' }}
      >
        <defs>
          <path id={`prev-${line.text_source}-${curve}`} d={d} fill="none" />
        </defs>
        <text
          fontFamily={`"${line.font_family}", serif`}
          fontWeight={line.font_weight}
          fontStyle={line.italic ? 'italic' : 'normal'}
          letterSpacing={`${line.letter_spacing}em`}
          fontSize={curve === 'circle' ? H * 0.16 : H * 0.55}
          fill={baseColor}
          textAnchor={line.align === 'center' ? 'middle' : line.align === 'right' ? 'end' : 'start'}
        >
          <textPath
            href={`#prev-${line.text_source}-${curve}`}
            startOffset={line.align === 'center' ? '50%' : line.align === 'right' ? '100%' : '0%'}
          >
            {text}
          </textPath>
        </text>
      </svg>
    );
  }

  return (
    <span
      className="block leading-tight truncate"
      style={{
        fontFamily: `"${line.font_family}", serif`,
        fontWeight: line.font_weight,
        fontStyle: line.italic ? 'italic' : 'normal',
        letterSpacing: `${line.letter_spacing}em`,
        color: baseColor,
        fontSize: `${Math.max(7, line.size_pct * 0.2)}px`,
        textAlign: line.align,
      }}
      title={`${FONT_LABELS[line.font_family]} ${line.font_weight}`}
    >
      {text || '—'}
    </span>
  );
}

function buildPreviewPath(preset: string, amount: number, W: number, H: number): string {
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
    default:
      return `M 0 ${H / 2} L ${W} ${H / 2}`;
  }
}

function sampleFor(source: string): string {
  const map: Record<string, string> = {
    celebrant_name: 'Alex',
    celebrant_possessive: 'Alex’s',
    event_label: 'Birthday',
    event_title: "Alex's Birthday",
    host_name: 'Sam',
    host_possessive: 'Sam’s',
    bride_name: 'Riley',
    groom_name: 'Jordan',
    names_combined: 'Riley & Jordan',
    date_full: 'Saturday, June 14, 2026',
    date_day_num: '14',
    date_dow: 'Saturday',
    date_dow_short: 'SAT',
    date_month: 'June',
    date_month_short: 'JUN',
    date_year: '2026',
    time: '6:00 PM',
    timezone: 'ET',
    time_with_tz: '6:00 PM · ET',
    venue: '123 Garden Ave',
    rsvp_contact: 'rsvp@example.com',
    custom_message: 'Join us to celebrate!',
  };
  return map[source] ?? source;
}
