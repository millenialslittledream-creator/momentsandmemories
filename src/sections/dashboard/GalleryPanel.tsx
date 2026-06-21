import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { GalleryPhoto } from '@/components/GuestGallery/MasonryGallery';

interface Props {
  eventId: string;
}

export default function GalleryPanel({ eventId }: Props) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () =>
    api.getOwnerGalleryPhotos(eventId)
      .then((p) => setPhotos(p as GalleryPhoto[]))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [eventId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/gallery/${eventId}`);
    toast.success('Guest upload link copied!');
  };

  const handleToggleApproval = async (photo: GalleryPhoto) => {
    await api.setPhotoApproval(photo.id, !photo.approved);
    load();
  };

  const handleDelete = async (photo: GalleryPhoto) => {
    await api.deleteGalleryPhoto(photo.id);
    load();
  };

  if (loading) return <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 py-6">Loading…</p>;

  return (
    <div className="py-4">
      <button
        onClick={handleCopyLink}
        className="mb-4 flex items-center gap-2 px-3 py-1.5 border border-white/10 hover:border-[#9cb092]/40 hover:text-[#9cb092] text-[#b2c3b1]/60 transition-colors font-display text-[9px] tracking-[0.15em] uppercase"
      >
        <span className="material-icons text-sm">link</span>
        Copy Guest Upload Link
      </button>

      {photos.length === 0 ? (
        <p className="font-display text-[10px] tracking-[0.2em] uppercase text-[#b2c3b1]/40 py-6">
          No guest photos yet
        </p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.public_url}
                alt=""
                className={`w-full aspect-square object-cover ${photo.approved ? '' : 'opacity-40'}`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                <button
                  onClick={() => handleToggleApproval(photo)}
                  title={photo.approved ? 'Hide from gallery' : 'Approve'}
                  className="text-white hover:text-[#9cb092]"
                >
                  <span className="material-icons text-base">{photo.approved ? 'visibility_off' : 'check_circle'}</span>
                </button>
                <button
                  onClick={() => handleDelete(photo)}
                  title="Delete"
                  className="text-white hover:text-red-400"
                >
                  <span className="material-icons text-base">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
