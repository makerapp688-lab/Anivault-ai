import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Tv,
  Film,
  Calendar,
  Layers,
  Sparkles,
  Play
} from 'lucide-react';
import { Anime } from '../types.ts';
import { AnimeArtwork } from './AnimeArtwork.tsx';

interface AnimeDetailsModalProps {
  anime: Anime | null;
  onClose: () => void;
}

export const AnimeDetailsModal: React.FC<AnimeDetailsModalProps> = ({ anime, onClose }) => {
  if (!anime) return null;

  const [activeSeasonNumber, setActiveSeasonNumber] = useState<number>(
    anime.seasons?.[0]?.seasonNumber || 1
  );

  const primaryProvider = anime.providers?.raretoonIndia;
  const isVerified = primaryProvider?.verificationStatus === 'VERIFIED';

  // Find currently selected season
  const activeSeason = anime.seasons?.find(s => s.seasonNumber === activeSeasonNumber) || anime.seasons?.[0];

  // The direct watch link prioritizes the specific active season's canonical URL, or the anime's primary canonical URL
  const targetWatchUrl = activeSeason?.canonicalUrl || primaryProvider?.canonicalUrl;

  const handleOpenToWatch = () => {
    if (targetWatchUrl) {
      window.open(targetWatchUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="anime-details-modal-overlay"
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={e => e.stopPropagation()}
        id={`anime-details-${anime.id}`}
      >
        {/* Sticky Header with Close Button */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800/80 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              AniVault Anime Details
            </span>
          </div>
          <button
            type="button"
            id="btn-close-details-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto p-4 md:p-6 space-y-6 flex-1 text-slate-200">
          {/* Hero Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div className="md:col-span-1 w-full">
              <AnimeArtwork
                src={anime.artwork?.verifiedArtworkUrl}
                alt={anime.title}
                aspectRatio="aspect-video md:aspect-square"
                className="shadow-xl"
              />
              <div className="mt-2 text-center">
                <span className="text-[11px] text-slate-400 font-mono">
                  ID: {anime.id}
                </span>
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                    {anime.type === 'Movie' ? <Film className="w-3.5 h-3.5" /> : <Tv className="w-3.5 h-3.5" />}
                    {anime.type}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {anime.releaseYear}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-950/80 text-amber-300 border border-amber-700/50">
                    {primaryProvider?.dubLanguage || 'Hindi Dubbed'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-emerald-400 border border-slate-700">
                    {anime.status}
                  </span>
                </div>

                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                  {anime.title}
                </h1>
                {anime.alternateTitle && (
                  <p className="text-sm text-slate-400 italic mt-0.5">
                    {anime.alternateTitle}
                  </p>
                )}
              </div>

              {/* Verified Provider Notification */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Content Provider:</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    RareToon India (Verified)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Audio &amp; Quality:</span>
                  <span className="text-slate-200 font-medium">
                    {primaryProvider?.dubLanguage} • {primaryProvider?.quality || '1080p FHD'}
                  </span>
                </div>
              </div>

              {/* CRITICAL ACTION: OPEN THIS ANIME TO WATCH */}
              <div className="pt-2">
                {targetWatchUrl && isVerified ? (
                  <div>
                    <button
                      type="button"
                      id="btn-open-anime-to-watch"
                      onClick={handleOpenToWatch}
                      className="w-full py-3 px-5 rounded-xl font-bold text-sm md:text-base bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98]"
                    >
                      <Play className="w-5 h-5 fill-current" />
                      <span>OPEN THIS ANIME TO WATCH</span>
                      <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
                    </button>
                    <p className="text-[11px] text-slate-400 text-center mt-1.5 font-mono truncate px-1">
                      Target: {targetWatchUrl}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 flex items-center gap-2 text-amber-300 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Direct RareToon watch link currently undergoing verification.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Synopsis */}
          <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Synopsis &amp; Details
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed max-w-prose">
              {anime.synopsis}
            </p>

            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 mr-1 self-center">Genres:</span>
              {anime.genres.map(g => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-800 text-slate-200 border border-slate-700"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Strict Season & Episode Architecture */}
          {anime.seasons && anime.seasons.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>Seasons &amp; Episodes ({anime.seasons.length} Available)</span>
                </h3>
              </div>

              {/* Season Selection Tabs */}
              {anime.seasons.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {anime.seasons.map(s => (
                    <button
                      key={s.seasonNumber}
                      type="button"
                      id={`btn-season-${s.seasonNumber}`}
                      onClick={() => setActiveSeasonNumber(s.seasonNumber)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                        activeSeasonNumber === s.seasonNumber
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{s.title || `Season ${s.seasonNumber}`}</span>
                      {s.canonicalUrl && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Active Season Information */}
              {activeSeason && (
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {activeSeason.title || `Season ${activeSeason.seasonNumber}`}
                    </span>
                    <a
                      href={activeSeason.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                    >
                      <span>Open this season on RareToon</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Episodes List */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2">
                    {activeSeason.episodes?.map(ep => (
                      <a
                        key={ep.episodeNumber}
                        href={ep.canonicalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/60 flex items-center justify-between text-xs text-slate-200 transition-colors group"
                      >
                        <span className="font-medium group-hover:text-indigo-300 truncate">
                          {ep.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-indigo-400 shrink-0 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Provider: RareToon India</span>
          <button
            type="button"
            id="btn-footer-close"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
