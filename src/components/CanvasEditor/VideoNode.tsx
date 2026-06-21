import { useEffect, useRef, useState } from 'react';
import { Image as KonvaImage } from 'react-konva';
import Konva from 'konva';
import type { ImageElementData } from './types';

interface VideoNodeProps {
  data: ImageElementData;
  draggable: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageElementData>) => void;
  registerNode: (node: Konva.Image | null) => void;
}

// Konva.Image can draw an HTMLVideoElement directly — each animation tick reads
// whatever frame the video is currently on, which is how Konva plays video on canvas.
export default function VideoNode({ data, draggable, onSelect, onChange, registerNode }: VideoNodeProps) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const imageNodeRef = useRef<Konva.Image | null>(null);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = data.src;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    const onLoaded = () => {
      video.play().catch(() => {});
      setVideoEl(video);
    };
    video.addEventListener('loadedmetadata', onLoaded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.pause();
      video.src = '';
    };
  }, [data.src]);

  useEffect(() => {
    if (!videoEl) return;
    const layer = imageNodeRef.current?.getLayer();
    if (!layer) return;
    const anim = new Konva.Animation(() => {}, layer);
    anim.start();
    return () => { anim.stop(); };
  }, [videoEl]);

  return (
    <KonvaImage
      ref={(node) => {
        imageNodeRef.current = node;
        registerNode(node);
      }}
      image={videoEl ?? undefined}
      x={data.x}
      y={data.y}
      width={data.width}
      height={data.height}
      rotation={data.rotation}
      draggable={draggable}
      onClick={onSelect}
      onTap={onSelect}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={(e) => {
        const node = e.target;
        onChange({
          x: node.x(),
          y: node.y(),
          width: Math.max(20, node.width() * node.scaleX()),
          height: Math.max(20, node.height() * node.scaleY()),
          rotation: node.rotation(),
        });
        node.scaleX(1);
        node.scaleY(1);
      }}
    />
  );
}
