import { useEffect } from 'react';
import type { GeneratedImage } from '../types';

interface ImageLightboxProps {
  image: GeneratedImage;
  onClose: () => void;
}

export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const imageUrl = image.url.startsWith('http')
    ? image.url
    : image.urlPath;

  return (
    <div
      className="fixed inset-0 z-50 bg-void/95 backdrop-blur-sm
                 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10
                   w-10 h-10 flex items-center justify-center
                   border border-border hover:border-accent
                   text-text-secondary hover:text-accent
                   transition-colors"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Content container */}
      <div
        className="flex flex-col md:flex-row gap-6 max-w-6xl w-full max-h-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="flex-1 flex items-center justify-center min-h-0">
          <img
            src={imageUrl}
            alt={image.prompt}
            className="max-w-full max-h-[70vh] object-contain
                       border border-border"
          />
        </div>

        {/* Details panel */}
        <div className="w-full md:w-80 flex flex-col gap-4 max-h-[30vh] md:max-h-[70vh] overflow-y-auto">
          {/* Header */}
          <div className="border-mechanical bg-surface p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent text-xs font-bold tracking-wider">DETAILS</span>
              <span className="text-text-muted text-xs">//</span>
              <span className="text-text-muted text-xs tracking-wide">METADATA</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-text-muted block mb-1">FILENAME</span>
                <span className="text-text-primary font-mono">{image.filename}</span>
              </div>
              <div>
                <span className="text-text-muted block mb-1">ID</span>
                <span className="text-text-secondary font-mono text-[10px]">{image.id}</span>
              </div>
            </div>
          </div>

          {/* Prompt */}
          <div className="border-mechanical bg-surface p-4 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent text-xs font-bold tracking-wider">PROMPT</span>
            </div>
            <p className="text-text-secondary text-xs leading-relaxed font-mono">
              {image.prompt}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <a
              href={imageUrl}
              download={image.filename}
              className="flex-1 py-2 text-center
                         bg-accent text-void text-xs font-bold tracking-wider
                         hover:bg-text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              DOWNLOAD
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(image.prompt)}
              className="px-4 py-2
                         border border-border text-text-secondary text-xs font-bold tracking-wider
                         hover:border-accent hover:text-accent transition-colors"
            >
              COPY PROMPT
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 left-4 text-text-muted text-xs">
        Press <kbd className="px-1 py-0.5 bg-surface border border-border mx-1">ESC</kbd> to close
      </div>
    </div>
  );
}
