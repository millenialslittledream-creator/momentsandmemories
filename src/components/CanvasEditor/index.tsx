import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Text, Rect, Transformer } from 'react-konva';
import type Konva from 'konva';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import LayerPanel from './LayerPanel';
import PropertyPanel from './PropertyPanel';
import ImageNode from './ImageNode';
import VideoNode from './VideoNode';
import {
  type CanvasElementData,
  type TextElementData,
  type ImageElementData,
  type CanvasBackground,
  nextId,
} from './types';

const AUTOSAVE_DELAY_MS = 1500;

interface CanvasEditorProps {
  canvasWidth?: number;
  canvasHeight?: number;
  initialTemplateId?: string | null;
  initialBackground?: CanvasBackground;
  initialElements?: CanvasElementData[];
  eventType?: string;
  onClose: () => void;
  onSaved?: (templateId: string) => void;
  onFinish?: (pngDataUrl: string, templateId: string | null) => void;
}

export default function CanvasEditor({
  canvasWidth = 1080,
  canvasHeight = 1620,
  initialTemplateId = null,
  initialBackground = { type: 'color', value: '#ffffff' },
  initialElements = [],
  eventType,
  onClose,
  onSaved,
  onFinish,
}: CanvasEditorProps) {
  const [elements, setElements] = useState<CanvasElementData[]>(initialElements);
  const [background, setBackground] = useState<CanvasBackground>(initialBackground);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [containerWidth, setContainerWidth] = useState(360);
  const [uploading, setUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const nodeRefs = useRef<Map<string, Konva.Node>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scale = containerWidth / canvasWidth;

  // Fit the stage to the container's width responsively.
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Attach the Transformer to the currently selected node.
  useEffect(() => {
    const transformer = transformerRef.current;
    if (!transformer) return;
    const node = selectedId ? nodeRefs.current.get(selectedId) : null;
    if (node) {
      transformer.nodes([node]);
      transformer.getLayer()?.batchDraw();
    } else {
      transformer.nodes([]);
    }
  }, [selectedId, elements]);

  const selectedElement = useMemo(
    () => elements.find((el) => el.id === selectedId) ?? null,
    [elements, selectedId]
  );

  const persist = useCallback(async (): Promise<string | null> => {
    setSaveStatus('saving');
    try {
      const payload = {
        name: `Custom design${eventType ? ` — ${eventType}` : ''}`,
        event_type: eventType ?? null,
        canvas_width: canvasWidth,
        canvas_height: canvasHeight,
        background,
        elements,
      };
      let resolvedId = templateId;
      if (templateId) {
        await api.updateCustomTemplate(templateId, payload);
      } else {
        const created = await api.createCustomTemplate(payload);
        resolvedId = created.id;
        setTemplateId(created.id);
        onSaved?.(created.id);
      }
      setSaveStatus('saved');
      return resolvedId;
    } catch {
      setSaveStatus('error');
      return templateId;
    }
  }, [templateId, background, elements, canvasWidth, canvasHeight, eventType, onSaved]);

  // Debounced autosave whenever the design changes.
  useEffect(() => {
    if (elements.length === 0 && background.type === 'color' && background.value === '#ffffff') return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(persist, AUTOSAVE_DELAY_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, background]);

  const updateElement = useCallback((id: string, patch: Partial<CanvasElementData>) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? ({ ...el, ...patch } as CanvasElementData) : el))
    );
  }, []);

  const addText = () => {
    const newId = nextId('text');
    setElements((prev) => {
      const maxZ = prev.reduce((m, el) => Math.max(m, el.zIndex), 0);
      const offset = (prev.length % 8) * 24;
      const newEl: TextElementData = {
        id: newId,
        type: 'text',
        x: canvasWidth / 2 - 100 + offset,
        y: canvasHeight / 2 - 20 + offset,
        width: 200,
        rotation: 0,
        zIndex: maxZ + 1,
        locked: false,
        text: 'Double-click to edit',
        fontFamily: 'Cormorant Garamond',
        fontSize: 36,
        fontStyle: 'normal',
        textDecoration: 'none',
        fill: '#1a1a1a',
        align: 'center',
      };
      return [...prev, newEl];
    });
    setSelectedId(newId);
  };

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await api.uploadMedia(file);
      const newId = nextId('image');
      setElements((prev) => {
        const maxZ = prev.reduce((m, el) => Math.max(m, el.zIndex), 0);
        const offset = (prev.length % 8) * 24;
        const newEl: ImageElementData = {
          id: newId,
          type: 'image',
          mediaKind: uploaded.kind,
          x: canvasWidth / 2 - 150 + offset,
          y: canvasHeight / 2 - 150 + offset,
          width: 300,
          height: 300,
          rotation: 0,
          zIndex: maxZ + 1,
          locked: false,
          src: uploaded.public_url,
        };
        return [...prev, newEl];
      });
      setSelectedId(newId);
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const duplicateElement = (id: string) => {
    const el = elements.find((e) => e.id === id);
    if (!el) return;
    const maxZ = elements.reduce((m, e) => Math.max(m, e.zIndex), 0);
    const copy = { ...el, id: nextId(el.type), x: el.x + 20, y: el.y + 20, zIndex: maxZ + 1 };
    setElements((prev) => [...prev, copy]);
    setSelectedId(copy.id);
  };

  const deleteElement = (id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const toggleLock = (id: string) => {
    setElements((prev) => prev.map((e) => (e.id === id ? { ...e, locked: !e.locked } : e)));
  };

  const reorder = (id: string, direction: 'up' | 'down') => {
    setElements((prev) => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex((e) => e.id === id);
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[swapIdx];
      const aZ = a.zIndex;
      a.zIndex = b.zIndex;
      b.zIndex = aZ;
      return [...prev.map((e) => (e.id === a.id ? { ...e, zIndex: a.zIndex } : e.id === b.id ? { ...e, zIndex: b.zIndex } : e))];
    });
  };

  const sortedElements = useMemo(() => [...elements].sort((a, b) => a.zIndex - b.zIndex), [elements]);

  const handleFinish = async () => {
    setSelectedId(null);
    const resolvedId = await persist();
    // Wait a tick so the deselected Transformer doesn't appear in the exported image.
    requestAnimationFrame(() => {
      const dataUrl = stageRef.current?.toDataURL({ pixelRatio: 1080 / containerWidth });
      if (dataUrl) onFinish?.(dataUrl, resolvedId);
    });
  };

  const editingElement = editingId ? (elements.find((e) => e.id === editingId) as TextElementData | undefined) : undefined;

  const handleClose = async () => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      await persist();
    }
    onClose();
  };

  return (
    <div data-testid="canvas-editor" className="fixed inset-0 z-50 flex flex-col bg-[#0d1512]">
      {/* Top toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.07] bg-[#111914]">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close editor">
            <span className="material-icons text-base">arrow_back</span>
          </Button>
          <p className="font-display text-[10px] tracking-[0.28em] uppercase text-[#9cb092]">
            Design Editor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={addText}>
            <span className="material-icons text-base mr-1">text_fields</span>
            Add Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <span className="material-icons text-base mr-1">add_photo_alternate</span>
            {uploading ? 'Uploading…' : 'Add Image / Video'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/quicktime"
            className="hidden"
            onChange={handleFileChosen}
          />
          <label className="flex items-center gap-1.5 cursor-pointer" title="Background color">
            <span className="material-icons text-base text-[#b2c3b1]/70">palette</span>
            <input
              type="color"
              value={background.type === 'color' ? background.value : '#ffffff'}
              onChange={(e) => setBackground({ type: 'color', value: e.target.value })}
              className="h-6 w-6 bg-transparent border border-white/[0.1] cursor-pointer"
            />
          </label>

          <span className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/50 w-16 text-right">
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'saved' && 'Saved'}
            {saveStatus === 'error' && 'Save failed'}
          </span>

          <Button size="sm" onClick={handleFinish} disabled={elements.length === 0}>
            Done
            <span className="material-icons text-base ml-1">check</span>
          </Button>
        </div>
      </div>

      {/* Main editor body */}
      <div className="flex-1 flex min-h-0">
        <LayerPanel
          elements={elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleLock={toggleLock}
          onDuplicate={duplicateElement}
          onDelete={deleteElement}
          onReorder={reorder}
        />

        <div className="flex-1 flex items-center justify-center overflow-auto p-6">
          <div
            ref={containerRef}
            className="relative bg-white shadow-2xl"
            style={{ width: '100%', maxWidth: 480, aspectRatio: `${canvasWidth} / ${canvasHeight}` }}
          >
            <Stage
              ref={stageRef}
              width={containerWidth}
              height={containerWidth * (canvasHeight / canvasWidth)}
              scaleX={scale}
              scaleY={scale}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) setSelectedId(null);
              }}
            >
              <Layer>
                {background.type === 'color' ? (
                  <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill={background.value} />
                ) : (
                  <Rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="#eeeeee" />
                )}

                {sortedElements.map((el) =>
                  el.type === 'text' ? (
                    <Text
                      key={el.id}
                      ref={(node) => {
                        if (node) nodeRefs.current.set(el.id, node);
                        else nodeRefs.current.delete(el.id);
                      }}
                      x={el.x}
                      y={el.y}
                      width={el.width}
                      text={el.text}
                      fontFamily={el.fontFamily}
                      fontSize={el.fontSize}
                      fontStyle={el.fontStyle}
                      textDecoration={el.textDecoration}
                      fill={el.fill}
                      align={el.align}
                      rotation={el.rotation}
                      draggable={!el.locked}
                      visible={editingId !== el.id}
                      onClick={() => setSelectedId(el.id)}
                      onTap={() => setSelectedId(el.id)}
                      onDblClick={() => setEditingId(el.id)}
                      onDblTap={() => setEditingId(el.id)}
                      onDragEnd={(e) => updateElement(el.id, { x: e.target.x(), y: e.target.y() })}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        updateElement(el.id, {
                          x: node.x(),
                          y: node.y(),
                          width: Math.max(20, node.width() * node.scaleX()),
                          rotation: node.rotation(),
                        });
                        node.scaleX(1);
                        node.scaleY(1);
                      }}
                    />
                  ) : (el as ImageElementData).mediaKind === 'video' ? (
                    <VideoNode
                      key={el.id}
                      data={el as ImageElementData}
                      draggable={!el.locked}
                      onSelect={() => setSelectedId(el.id)}
                      onChange={(patch) => updateElement(el.id, patch)}
                      registerNode={(node) => {
                        if (node) nodeRefs.current.set(el.id, node);
                        else nodeRefs.current.delete(el.id);
                      }}
                    />
                  ) : (
                    <ImageNode
                      key={el.id}
                      data={el as ImageElementData}
                      isSelected={selectedId === el.id}
                      draggable={!el.locked}
                      onSelect={() => setSelectedId(el.id)}
                      onChange={(patch) => updateElement(el.id, patch)}
                      registerNode={(node) => {
                        if (node) nodeRefs.current.set(el.id, node);
                        else nodeRefs.current.delete(el.id);
                      }}
                    />
                  )
                )}

                <Transformer ref={transformerRef} rotateEnabled flipEnabled={false} />
              </Layer>
            </Stage>

            {editingElement && (
              <textarea
                autoFocus
                defaultValue={editingElement.text}
                onBlur={(e) => {
                  updateElement(editingElement.id, { text: e.target.value });
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setEditingId(null);
                }}
                style={{
                  position: 'absolute',
                  top: editingElement.y * scale,
                  left: editingElement.x * scale,
                  width: editingElement.width * scale,
                  fontSize: editingElement.fontSize * scale,
                  fontFamily: editingElement.fontFamily,
                  color: editingElement.fill,
                  textAlign: editingElement.align,
                  border: '1px dashed #9cb092',
                  background: 'rgba(255,255,255,0.9)',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.2,
                }}
              />
            )}
          </div>
        </div>

        <PropertyPanel element={selectedElement} onChange={updateElement} />
      </div>
    </div>
  );
}
