import type { CanvasElementData } from './types';

interface LayerPanelProps {
  elements: CanvasElementData[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
}

export default function LayerPanel({
  elements,
  selectedId,
  onSelect,
  onToggleLock,
  onDuplicate,
  onDelete,
  onReorder,
}: LayerPanelProps) {
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="w-48 shrink-0 border-r border-white/[0.07] bg-[#141c15] px-3 py-5 overflow-y-auto scrollbar-subtle">
      <p className="font-display text-[9px] tracking-[0.28em] uppercase text-[#9cb092] mb-3 px-1">Layers</p>
      {sorted.length === 0 && (
        <p className="font-display text-[9px] tracking-[0.18em] text-[#b2c3b1]/40 px-1">
          No elements yet — add text or an image
        </p>
      )}
      <div className="space-y-1">
        {sorted.map((el) => (
          <div
            key={el.id}
            onClick={() => onSelect(el.id)}
            className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors ${
              selectedId === el.id ? 'bg-[#9cb092]/15 border border-[#9cb092]/40' : 'border border-transparent hover:bg-white/[0.04]'
            }`}
          >
            <span className="material-icons text-[#b2c3b1]/70 text-sm">
              {el.type === 'text' ? 'text_fields' : el.mediaKind === 'video' ? 'movie' : 'image'}
            </span>
            <span className="flex-1 truncate text-[11px] text-[#e4eee1]">
              {el.type === 'text' ? (el.text || 'Text') : el.mediaKind === 'video' ? 'Video' : 'Image'}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onReorder(el.id, 'up'); }}
              aria-label="Move layer up"
              className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-[#9cb092]"
            >
              <span className="material-icons text-xs">arrow_upward</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onReorder(el.id, 'down'); }}
              aria-label="Move layer down"
              className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-[#9cb092]"
            >
              <span className="material-icons text-xs">arrow_downward</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
              aria-label={el.locked ? 'Unlock layer' : 'Lock layer'}
              className={`text-[#b2c3b1]/60 hover:text-[#9cb092] ${el.locked ? '' : 'opacity-0 group-hover:opacity-100'}`}
            >
              <span className="material-icons text-xs">{el.locked ? 'lock' : 'lock_open'}</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(el.id); }}
              aria-label="Duplicate layer"
              className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-[#9cb092]"
            >
              <span className="material-icons text-xs">content_copy</span>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}
              aria-label="Delete layer"
              className="opacity-0 group-hover:opacity-100 text-[#b2c3b1]/60 hover:text-red-400"
            >
              <span className="material-icons text-xs">delete</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
