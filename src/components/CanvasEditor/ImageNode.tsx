import { Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import type Konva from 'konva';
import type { ImageElementData } from './types';

interface ImageNodeProps {
  data: ImageElementData;
  isSelected: boolean;
  draggable: boolean;
  onSelect: () => void;
  onChange: (patch: Partial<ImageElementData>) => void;
  registerNode: (node: Konva.Image | null) => void;
}

export default function ImageNode({ data, draggable, onSelect, onChange, registerNode }: ImageNodeProps) {
  const [img] = useImage(data.src, 'anonymous');

  return (
    <KonvaImage
      ref={registerNode}
      image={img}
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
