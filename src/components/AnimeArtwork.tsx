import React, { useState } from 'react';
import { Film, ImageOff } from 'lucide-react';

interface AnimeArtworkProps {
  src?: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  priority?: boolean;
}

export const AnimeArtwork: React.FC<AnimeArtworkProps> = ({
  src,
  alt,
  className = '',
  aspectRatio = 'aspect-video'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const cleanSrc = src && src.trim().length > 0 ? src.trim() : null;

  if (!cleanSrc || hasError) {
    return (
      <div
        className={`w-full ${aspectRatio} bg-slate-800/80 border border-slate-700/60 rounded-lg flex flex-col items-center justify-center p-3 text-center text-slate-400 select-none ${className}`}
        id={`artwork-placeholder-${alt.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="w-10 h-10 rounded-full bg-slate-700/60 flex items-center justify-center mb-2">
          {hasError ? <ImageOff className="w-5 h-5 text-amber-400" /> : <Film className="w-5 h-5 text-indigo-400" />}
        </div>
        <span className="text-xs font-medium text-slate-300 line-clamp-2 px-1">{alt}</span>
        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">AniVault Artwork</span>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${aspectRatio} overflow-hidden rounded-lg bg-slate-900 border border-slate-800/80 ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-slate-800/70 animate-pulse flex items-center justify-center z-10">
          <Film className="w-6 h-6 text-slate-600 animate-spin" />
        </div>
      )}
      <img
        src={cleanSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
};
