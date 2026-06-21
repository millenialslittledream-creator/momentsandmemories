import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import MasonryGallery, { type GalleryPhoto } from '@/components/GuestGallery/MasonryGallery';

export default function GuestGalleryUpload() {
  const { eventId } = useParams<{ eventId: string }>();
  const [eventTitle, setEventTitle] = useState('');
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [guestName, setGuestName] = useState(() => localStorage.getItem('guestGalleryName') || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshPhotos = useCallback(() => {
    if (!eventId) return;
    api.getGalleryPhotos(eventId).then(setPhotos).catch(() => {});
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    api.getPublicEvent(eventId)
      .then((event: { title: string }) => setEventTitle(event.title))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    refreshPhotos();
  }, [eventId, refreshPhotos]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0 || !eventId) return;
    if (!guestName.trim()) {
      toast.error('Add your name first so the host knows who shared it');
      return;
    }
    localStorage.setItem('guestGalleryName', guestName.trim());
    setUploading(true);
    try {
      for (const file of files) {
        await api.uploadGalleryPhoto(eventId, file, guestName.trim());
      }
      toast.success(files.length > 1 ? 'Photos shared!' : 'Photo shared!');
      refreshPhotos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#1a2418] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#9cb092]/30 border-t-[#9cb092] rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-[#1a2418] flex flex-col items-center justify-center gap-4 px-6">
      <span className="material-icons text-4xl text-[#9cb092]/30">photo_library</span>
      <p className="font-display text-[11px] tracking-[0.2em] uppercase text-[#b2c3b1]/60 text-center">
        This event is not available
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#1a2418] px-4 md:px-8 py-10">
      <div className="max-w-3xl mx-auto">
        <p className="font-display text-[10px] tracking-[0.35em] uppercase text-[#9cb092] mb-2 text-center">
          Share Your Photos
        </p>
        <h1 className="font-serif-exp text-2xl md:text-3xl text-[#e4eee1] italic text-center mb-8">
          {eventTitle}
        </h1>

        <div className="bg-white/[0.03] border border-white/[0.07] p-5 mb-8 max-w-md mx-auto">
          <label className="font-display text-[8px] tracking-[0.18em] uppercase text-[#b2c3b1]/55 block mb-1.5">
            Your Name
          </label>
          <input
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="So the host knows who shared it"
            className="w-full bg-[#192116] border border-white/[0.1] text-[#e4eee1] text-sm px-3 py-2 mb-4 focus:outline-none focus:border-[#9cb092]/50"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full py-3 bg-[#9cb092] text-[#111914] font-display text-[10px] tracking-[0.2em] uppercase font-bold hover:bg-[#adc4a3] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-icons text-base">add_a_photo</span>
            {uploading ? 'Uploading…' : 'Add Photos'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        <MasonryGallery photos={photos} />
      </div>
    </div>
  );
}
