export interface GalleryPhoto {
  id: string;
  public_url: string;
  uploaded_by_name: string | null;
  approved: boolean;
  created_at: string;
}

interface MasonryGalleryProps {
  photos: GalleryPhoto[];
  emptyMessage?: string;
  renderOverlay?: (photo: GalleryPhoto) => React.ReactNode;
}

export default function MasonryGallery({ photos, emptyMessage = 'No photos yet — be the first to share one!', renderOverlay }: MasonryGalleryProps) {
  if (photos.length === 0) {
    return (
      <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 text-center py-10">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="columns-2 sm:columns-3 md:columns-4 gap-3 [&>*]:mb-3">
      {photos.map((photo) => (
        <div key={photo.id} className="relative break-inside-avoid group">
          <img
            src={photo.public_url}
            alt={photo.uploaded_by_name ? `Shared by ${photo.uploaded_by_name}` : 'Guest photo'}
            className="w-full object-cover bg-white/5"
            loading="lazy"
          />
          {photo.uploaded_by_name && (
            <p className="absolute bottom-1.5 left-1.5 font-display text-[8px] tracking-[0.15em] uppercase text-white bg-black/50 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {photo.uploaded_by_name}
            </p>
          )}
          {renderOverlay?.(photo)}
        </div>
      ))}
    </div>
  );
}
