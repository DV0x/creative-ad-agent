import { useState } from 'react'
import { RefreshCw, Download } from 'lucide-react'

interface ImageCardProps {
  url: string
  hookHeadline: string
  index: number
}

export function ImageCard({ url, hookHeadline, index }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-bg-raised border border-border transition-all duration-200 cursor-pointer animate-fadeIn ${
        isHovered
          ? 'shadow-[0_0_30px_var(--color-accent-glow)] border-accent/50 -translate-y-1'
          : 'shadow-lg hover:shadow-xl'
      }`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div className="aspect-square relative">
        {!isLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={url}
          alt={hookHeadline}
          className={`w-full h-full object-cover transition-all duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${isHovered ? 'scale-105' : 'scale-100'}`}
          onLoad={() => setIsLoaded(true)}
        />

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent transition-opacity ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            <button
              className="w-8 h-8 rounded-full bg-bg-elevated/90 backdrop-blur-sm hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-150 border border-border hover:border-accent hover:scale-110 active:scale-95"
              title="Regenerate"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              className="w-8 h-8 rounded-full bg-bg-elevated/90 backdrop-blur-sm hover:bg-accent hover:text-white flex items-center justify-center transition-all duration-150 border border-border hover:border-accent hover:scale-110 active:scale-95"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Hook preview */}
      <div
        className={`px-4 py-3 border-t border-border bg-bg-raised/95 backdrop-blur-sm transition-all duration-200 ${
          isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <p className="text-sm text-text-secondary line-clamp-2 italic">
          "{hookHeadline}"
        </p>
      </div>
    </div>
  )
}
