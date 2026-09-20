import React, { useState } from 'react';
import {
  Scale,
  ArrowLeftRight,
  Search,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Tv,
  Film,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { Anime } from '../types.ts';
import { AnimeArtwork } from './AnimeArtwork.tsx';
import { RARETOON_PROVIDER_NAME } from '../utils/provider.ts';

interface CompareAnimeViewProps {
  allAnime: Anime[];
  initialAnimeId1?: string;
  initialAnimeId2?: string;
  onOpenDetails: (anime: Anime) => void;
}

export const CompareAnimeView: React.FC<CompareAnimeViewProps> = ({
  allAnime,
  initialAnimeId1,
  initialAnimeId2,
  onOpenDetails
}) => {
  const [anime1, setAnime1] = useState<Anime | null>(() => {
    if (initialAnimeId1) {
      return allAnime.find(a => a.id === initialAnimeId1) || null;
    }
    return allAnime[0] || null;
  });

  const [anime2, setAnime2] = useState<Anime | null>(() => {
    if (initialAnimeId2) {
      return allAnime.find(a => a.id === initialAnimeId2) || null;
    }
    return allAnime[1] || null;
  });

  const [search1, setSearch1] = useState('');
  const [search2, setSearch2] = useState('');
  const [isSelecting1, setIsSelecting1] = useState(false);
  const [isSelecting2, setIsSelecting2] = useState(false);

  // Quick swap anime 1 & 2
  const handleSwap = () => {
    const temp = anime1;
    setAnime1(anime2);
    setAnime2(temp);
  };

  const filtered1 = allAnime.filter(a => {
    if (!search1.trim()) return true;
    const q = search1.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.alternateTitle?.toLowerCase().includes(q);
  }).slice(0, 10);

  const filtered2 = allAnime.filter(a => {
    if (!search2.trim()) return true;
    const q = search2.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.alternateTitle?.toLowerCase().includes(q);
  }).slice(0, 10);

  const getTotalEpisodes = (a: Anime) => {
    if (typeof a.totalEpisodes === 'number') return a.totalEpisodes;
    return a.seasons?.reduce((sum, s) => sum + (s.episodeCount || 0), 0) || 0;
  };

  const getSharedGenres = () => {
    if (!anime1 || !anime2) return new Set<string>();
    const g1 = new Set(anime1.genres);
    return new Set(anime2.genres.filter(g => g1.has(g)));
  };

  const sharedGenres = getSharedGenres();

  const presets = [
    { title: 'Vinland Saga vs Attack on Titan', id1: 'vinland-saga', id2: 'attack-on-titan' },
    { title: 'Jujutsu Kaisen vs Demon Slayer', id1: 'jujutsu-kaisen', id2: 'demon-slayer' },
    { title: 'Death Note vs Classroom of the Elite', id1: 'death-note', id2: 'classroom-of-the-elite' },
    { title: 'Solo Leveling vs Kaiju No. 8', id1: 'solo-leveling', id2: 'kaiju-no-8' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" id="compare-anime-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
                Compare Anime
              </h1>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
                Detailed side-by-side metric comparison, release data, episode counts, and provider sync
              </p>
            </div>
          </div>
        </div>

        {/* Quick Swap Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-swap-anime"
            onClick={handleSwap}
            disabled={!anime1 || !anime2}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 text-slate-200 dark:text-slate-200 light:text-slate-800 border border-slate-800 dark:border-slate-800 light:border-slate-300 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
            title="Swap left and right anime"
          >
            <ArrowLeftRight className="w-4 h-4 text-rose-500" />
            <span>Swap Sides</span>
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400 dark:text-slate-400 light:text-slate-500 font-semibold flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Popular Matchups:</span>
        </span>
        {presets.map(p => {
          const match1 = allAnime.find(a => a.id === p.id1);
          const match2 = allAnime.find(a => a.id === p.id2);
          if (!match1 || !match2) return null;
          return (
            <button
              key={p.title}
              type="button"
              onClick={() => {
                setAnime1(match1);
                setAnime2(match2);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 text-[11px] font-medium text-slate-300 dark:text-slate-300 light:text-slate-700 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-colors"
            >
              {p.title}
            </button>
          );
        })}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Anime 1 Column */}
        <div className="space-y-4 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 sm:p-5 shadow-lg transition-colors flex flex-col">
          {/* Header / Selector */}
          <div className="relative">
            {anime1 ? (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300">
                <div className="truncate">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                    Anime 1
                  </span>
                  <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 truncate">
                    {anime1.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSelecting1(!isSelecting1)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-800"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnime1(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSelecting1(true)}
                className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-slate-700 dark:border-slate-700 light:border-slate-300 hover:border-rose-500 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-rose-500" />
                <span>Select First Anime to Compare</span>
              </button>
            )}

            {/* Selection Dropdown */}
            {isSelecting1 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl shadow-2xl p-2 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={search1}
                    onChange={e => setSearch1(e.target.value)}
                    placeholder="Search anime catalogue..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 dark:bg-slate-950 light:bg-slate-100 border border-slate-700 dark:border-slate-700 light:border-slate-300 text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filtered1.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setAnime1(a);
                        setIsSelecting1(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-semibold text-white dark:text-white light:text-slate-900 truncate">
                        {a.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {a.releaseYear} • {a.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Anime 1 Data Card */}
          {anime1 ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Artwork Poster */}
              <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-900 shadow-md">
                <AnimeArtwork
                  artwork={anime1.artwork}
                  title={anime1.title}
                  aspectRatio="16:9"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 text-[10px] font-bold text-white">
                  {anime1.type === 'Movie' ? <Film className="w-3 h-3 text-amber-400" /> : <Tv className="w-3 h-3 text-cyan-400" />}
                  <span>{anime1.type}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    anime1.status === 'Completed'
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/60'
                      : 'bg-blue-950/90 text-blue-300 border border-blue-600/60'
                  }`}>
                    {anime1.status}
                  </span>
                </div>
              </div>

              {/* Title & Alternate */}
              <div>
                <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                  {anime1.title}
                </h2>
                {anime1.alternateTitle && (
                  <p className="text-xs text-slate-400 italic mt-0.5">{anime1.alternateTitle}</p>
                )}
              </div>

              {/* Metrics Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Release</div>
                  <div className="text-sm font-black text-white dark:text-white light:text-slate-900 mt-0.5">
                    {anime1.releaseYear}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Seasons</div>
                  <div className="text-sm font-black text-rose-500 mt-0.5">
                    {anime1.seasons?.length || 1}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Episodes</div>
                  <div className="text-sm font-black text-white dark:text-white light:text-slate-900 mt-0.5">
                    {getTotalEpisodes(anime1)}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1">
                    {anime1.status}
                  </div>
                </div>
              </div>

              {/* Season Breakdown */}
              <div className="p-3 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Season Breakdown ({anime1.seasons?.length || 1} Seasons)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {anime1.seasons?.map(s => (
                    <div
                      key={s.seasonNumber}
                      className="p-1.5 rounded-lg bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 flex justify-between"
                    >
                      <span className="text-slate-400 font-medium truncate">{s.title || `Season ${s.seasonNumber}`}</span>
                      <span className="font-bold text-white dark:text-white light:text-slate-900 ml-1">
                        {s.episodeCount} eps
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Genres</div>
                <div className="flex flex-wrap gap-1.5">
                  {anime1.genres?.map(g => {
                    const isShared = sharedGenres.has(g);
                    return (
                      <span
                        key={g}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isShared
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        {g} {isShared && '★'}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Synopsis */}
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Synopsis</div>
                <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed line-clamp-4">
                  {anime1.synopsis || 'No synopsis available.'}
                </p>
              </div>

              {/* Content Provider Sync & Link */}
              <div className="pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{RARETOON_PROVIDER_NAME} Verified</span>
                </div>

                <a
                  href={anime1.providers?.raretoonIndia?.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 transition-colors"
                >
                  <span>Stream on RareToon</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center">
              <Scale className="w-12 h-12 stroke-[1.5] mb-2 opacity-30" />
              <p className="text-xs">No anime chosen on left side</p>
            </div>
          )}
        </div>

        {/* Anime 2 Column */}
        <div className="space-y-4 bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-4 sm:p-5 shadow-lg transition-colors flex flex-col">
          {/* Header / Selector */}
          <div className="relative">
            {anime2 ? (
              <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300">
                <div className="truncate">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                    Anime 2
                  </span>
                  <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900 truncate">
                    {anime2.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsSelecting2(!isSelecting2)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-800"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnime2(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400"
                    title="Clear selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSelecting2(true)}
                className="w-full py-4 px-4 rounded-xl border-2 border-dashed border-slate-700 dark:border-slate-700 light:border-slate-300 hover:border-indigo-500 text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4 text-indigo-400" />
                <span>Select Second Anime to Compare</span>
              </button>
            )}

            {/* Selection Dropdown */}
            {isSelecting2 && (
              <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl shadow-2xl p-2 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={search2}
                    onChange={e => setSearch2(e.target.value)}
                    placeholder="Search anime catalogue..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 dark:bg-slate-950 light:bg-slate-100 border border-slate-700 dark:border-slate-700 light:border-slate-300 text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1">
                  {filtered2.map(a => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        setAnime2(a);
                        setIsSelecting2(false);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-semibold text-white dark:text-white light:text-slate-900 truncate">
                        {a.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                        {a.releaseYear} • {a.type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Anime 2 Data Card */}
          {anime2 ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Artwork Poster */}
              <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-slate-900 shadow-md">
                <AnimeArtwork
                  artwork={anime2.artwork}
                  title={anime2.title}
                  aspectRatio="16:9"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-sm border border-slate-700/60 text-[10px] font-bold text-white">
                  {anime2.type === 'Movie' ? <Film className="w-3 h-3 text-amber-400" /> : <Tv className="w-3 h-3 text-cyan-400" />}
                  <span>{anime2.type}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    anime2.status === 'Completed'
                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-600/60'
                      : 'bg-blue-950/90 text-blue-300 border border-blue-600/60'
                  }`}>
                    {anime2.status}
                  </span>
                </div>
              </div>

              {/* Title & Alternate */}
              <div>
                <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                  {anime2.title}
                </h2>
                {anime2.alternateTitle && (
                  <p className="text-xs text-slate-400 italic mt-0.5">{anime2.alternateTitle}</p>
                )}
              </div>

              {/* Metrics Table */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Release</div>
                  <div className="text-sm font-black text-white dark:text-white light:text-slate-900 mt-0.5">
                    {anime2.releaseYear}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Seasons</div>
                  <div className="text-sm font-black text-indigo-400 mt-0.5">
                    {anime2.seasons?.length || 1}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Episodes</div>
                  <div className="text-sm font-black text-white dark:text-white light:text-slate-900 mt-0.5">
                    {getTotalEpisodes(anime2)}
                  </div>
                </div>

                <div className="p-2.5 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1">
                    {anime2.status}
                  </div>
                </div>
              </div>

              {/* Season Breakdown */}
              <div className="p-3 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-300 dark:text-slate-300 light:text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Season Breakdown ({anime2.seasons?.length || 1} Seasons)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  {anime2.seasons?.map(s => (
                    <div
                      key={s.seasonNumber}
                      className="p-1.5 rounded-lg bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 flex justify-between"
                    >
                      <span className="text-slate-400 font-medium truncate">{s.title || `Season ${s.seasonNumber}`}</span>
                      <span className="font-bold text-white dark:text-white light:text-slate-900 ml-1">
                        {s.episodeCount} eps
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Genres */}
              <div>
                <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Genres</div>
                <div className="flex flex-wrap gap-1.5">
                  {anime2.genres?.map(g => {
                    const isShared = sharedGenres.has(g);
                    return (
                      <span
                        key={g}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          isShared
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                            : 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                        }`}
                      >
                        {g} {isShared && '★'}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Synopsis */}
              <div className="flex-1">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Synopsis</div>
                <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed line-clamp-4">
                  {anime2.synopsis || 'No synopsis available.'}
                </p>
              </div>

              {/* Content Provider Sync & Link */}
              <div className="pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{RARETOON_PROVIDER_NAME} Verified</span>
                </div>

                <a
                  href={anime2.providers?.raretoonIndia?.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/50 transition-colors"
                >
                  <span>Stream on RareToon</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-500 text-center">
              <Scale className="w-12 h-12 stroke-[1.5] mb-2 opacity-30" />
              <p className="text-xs">No anime chosen on right side</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
