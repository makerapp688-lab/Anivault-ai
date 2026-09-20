import React from 'react';
import { ExternalLink, CheckCircle2, Tv, Film } from 'lucide-react';
import { Anime } from '../types.ts';
import { AnimeArtwork } from './AnimeArtwork.tsx';

interface AnimeCardProps {
  anime: Anime;
  onSelect: (anime: Anime) => void;
}

export const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onSelect }) => {
  const primaryProvider = anime.providers?.raretoonIndia;
  const canonicalUrl = primaryProvider?.canonicalUrl;
  const isVerified = primaryProvider?.verificationStatus === 'VERIFIED';
  const dubBadge = primaryProvider?.dubLanguage || 'Hindi Dubbed';
  const totalSeasons = anime.seasons?.length || 1;

  const handleWatchDirect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canonicalUrl) {
      window.open(canonicalUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      id={`anime-card-${anime.id}`}
      onClick={() => onSelect(anime)}
      className="group relative flex flex-col bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800/80 hover:border-indigo-500/50 rounded-xl overflow-hidden transition-all duration-200 shadow-md hover:shadow-indigo-950/30 cursor-pointer"
    >
      {/* Artwork Container */}
      <div className="relative w-full aspect-video overflow-hidden">
        <AnimeArtwork
          src={anime.artwork?.verifiedArtworkUrl}
          alt={anime.title}
          aspectRatio="aspect-video"
        />

        {/* Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-950/85 backdrop-blur-md text-slate-200 border border-slate-700/50">
            {anime.type === 'Movie' ? (
              <>
                <Film className="w-3 h-3 text-amber-400" />
                <span>Movie</span>
              </>
            ) : (
              <>
                <Tv className="w-3 h-3 text-cyan-400" />
                <span>{totalSeasons} {totalSeasons === 1 ? 'Season' : 'Seasons'}</span>
              </>
            )}
          </span>
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-950/80 backdrop-blur-md text-indigo-300 border border-indigo-800/40">
            {anime.releaseYear}
          </span>
        </div>

        {/* Verification Pill */}
        {isVerified && (
          <div className="absolute top-2 right-2 z-20 pointer-events-none">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/90 backdrop-blur-md text-emerald-300 border border-emerald-700/50 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>RareToon</span>
            </span>
          </div>
        )}

        {/* Audio Format Overlay */}
        <div className="absolute bottom-2 left-2 z-20 pointer-events-none">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/80 backdrop-blur-md text-amber-300 border border-amber-500/30">
            {dubBadge}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-100 text-sm md:text-base leading-snug line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {anime.title}
          </h3>
          {anime.alternateTitle && (
            <p className="text-xs text-slate-400 italic line-clamp-1 mt-0.5">
              {anime.alternateTitle}
            </p>
          )}

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mt-2">
            {anime.genres.slice(0, 3).map(g => (
              <span
                key={g}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                {g}
              </span>
            ))}
            {anime.genres.length > 3 && (
              <span className="text-[10px] text-slate-400 self-center">
                +{anime.genres.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
          <button
            type="button"
            id={`btn-details-${anime.id}`}
            onClick={() => onSelect(anime)}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 text-center transition-colors"
          >
            Details
          </button>
          {canonicalUrl && (
            <button
              type="button"
              id={`btn-card-watch-${anime.id}`}
              onClick={handleWatchDirect}
              title={`Watch ${anime.title} on RareToon India`}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Watch</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
