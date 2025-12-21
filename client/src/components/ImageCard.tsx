import { useState } from 'react';
import type { GeneratedImage } from '../types';
import { API_BASE } from '../api/config';

interface ImageCardProps {
  image: GeneratedImage;
  onClick: () => void;
  index: number;
}

export function ImageCard({ image, onClick, index }: ImageCardProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // In production, prepend API_BASE to relative paths
  const imageUrl = image.url.startsWith('http')
    ? image.url
    : `${API_BASE}${image.urlPath}`;

  return (
    <div
      onClick={onClick}
      className="group relative aspect-square overflow-hidden cursor-pointer
                 border border-border hover:border-accent
                 transition-all duration-300 animate-fadeIn"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Index badge */}
      <div className="absolute top-1.5 left-1.5 z-10
                      bg-void/80 px-1.5 py-0.5
                      text-[10px] font-mono text-text-secondary
                      border border-border">
        {String(index + 1).padStart(2, '0')}
      </div>

      {/* Loading */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-surface flex items-center justify-center">
          <div className="w-5 h-5 border border-border border-t-accent animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface gap-1">
          <span className="text-error text-lg">!</span>
          <span className="text-text-muted text-[10px]">Error</span>
        </div>
      )}

      {/* Image */}
      <img
        src={imageUrl}
        alt={image.prompt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-all duration-500
                    group-hover:scale-105
                    ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Hover overlay - hidden on mobile */}
      <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent
                      opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      hidden md:block">
        <div className="absolute bottom-2 left-2 right-2">
          <span className="text-accent text-[10px] font-bold tracking-wider">VIEW</span>
        </div>
      </div>
    </div>
  );
}
