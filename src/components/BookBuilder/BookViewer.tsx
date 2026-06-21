import { forwardRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import FrameOverlay from './FrameOverlay';

export interface BookPage {
  id: string;
  image_url: string;
  frame?: string;
}

interface BookViewerProps {
  pages: BookPage[];
  width?: number;
  height?: number;
}

const Page = forwardRef<HTMLDivElement, { imageUrl: string; frame?: string }>(function Page(
  { imageUrl, frame },
  ref
) {
  return (
    <div ref={ref} className="relative bg-white">
      <img src={imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
      <FrameOverlay frame={frame} />
    </div>
  );
});

export default function BookViewer({ pages, width = 360, height = 540 }: BookViewerProps) {
  if (pages.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-white/5 border border-dashed border-white/10 text-sm text-[#b2c3b1]/50"
        style={{ width, height }}
      >
        No pages yet
      </div>
    );
  }

  return (
    <HTMLFlipBook
      width={width}
      height={height}
      size="fixed"
      minWidth={200}
      maxWidth={1000}
      minHeight={300}
      maxHeight={1500}
      drawShadow
      flippingTime={600}
      usePortrait
      startZIndex={0}
      autoSize={false}
      maxShadowOpacity={0.5}
      showCover={false}
      mobileScrollSupport
      clickEventForward
      useMouseEvents
      swipeDistance={30}
      showPageCorners
      disableFlipByClick={false}
      startPage={0}
      className="shadow-2xl"
      style={{}}
    >
      {pages.map((page) => (
        <Page key={page.id} imageUrl={page.image_url} frame={page.frame} />
      ))}
    </HTMLFlipBook>
  );
}
