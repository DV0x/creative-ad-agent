import { useState } from 'react';
import { useAppStore } from '../store';
import { ImageCard } from './ImageCard';
import { ImageLightbox } from './ImageLightbox';
import type { GeneratedImage } from '../types';

export function ImageGrid() {
  const { images, status } = useAppStore();
  const [lightboxImage, setLightboxImage] = useState<GeneratedImage | null>(null);

  if (status === 'idle' && images.length === 0) return null;

  const skeletonCount = Math.max(0, 6 - images.length);
  const showSkeletons = status === 'generating';

  return (
    <>
      <div className="border border-border bg-surface p-3 md:p-4 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <span className="text-accent text-[10px] md:text-xs font-bold tracking-wider">OUTPUT</span>
            <span className="text-text-muted text-[10px]">{images.length}/6</span>
          </div>
          {status === 'complete' && images.length > 0 && (
            <button className="text-accent text-[10px] font-bold tracking-wider hover:text-text-primary transition-colors">
              DOWNLOAD
            </button>
          )}
        </div>

        {/* Grid - 2 cols mobile, 3 cols tablet+ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {images.map((image, index) => (
            <ImageCard
              key={image.id}
              image={image}
              index={index}
              onClick={() => setLightboxImage(image)}
            />
          ))}

          {/* Skeleton loaders */}
          {showSkeletons && Array(skeletonCount).fill(0).map((_, i) => (
            <div
              key={`skeleton-${i}`}
              className="aspect-square bg-surface-raised border border-border
                         flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-5 h-5 md:w-6 md:h-6 border border-border border-t-text-muted animate-spin" />
                <span className="text-text-muted text-[10px] font-mono">
                  {String(images.length + i + 1).padStart(2, '0')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {lightboxImage && (
        <ImageLightbox
          image={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </>
  );
}
