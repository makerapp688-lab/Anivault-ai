import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Film,
  Tv,
  CheckCircle2,
  Database
} from 'lucide-react';
import { Anime, CatalogueStats } from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { CategoryFilter } from './components/CategoryFilter.tsx';
import { AnimeCard } from './components/AnimeCard.tsx';
import { AnimeDetailsModal } from './components/AnimeDetailsModal.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';

// Static fallback bundle
import fallbackCatalogue from './data/anivault-catalogue.json';
import fallbackReport from './data/sync-report.json';

export function App() {
  const [allAnime, setAllAnime] = useState<Anime[]>(fallbackCatalogue as Anime[]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'popular' | 'title' | 'year' | 'seasons'>('popular');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [stats, setStats] = useState<CatalogueStats | null>(fallbackReport as CatalogueStats);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 24;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const categoriesSectionRef = useRef<HTMLDivElement>(null);

  // Fetch from backend API
  const fetchCatalogue = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/anime?limit=300');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.anime) && data.anime.length > 0) {
          setAllAnime(data.anime);
        }
      }
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.stats) {
          setStats(statsData.stats);
        }
      }
    } catch (err) {
      console.warn('API fetch warning, using pre-bundled catalogue data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalogue();
  }, []);

  // Compute genre list with accurate counts
  const genresWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of allAnime) {
      if (Array.isArray(a.genres)) {
        for (const g of a.genres) {
          counts[g] = (counts[g] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([genre, count]) => ({ genre, count }));
  }, [allAnime]);

  // Client-side search and filtering for instant response
  const filteredAnime = useMemo(() => {
    let result = [...allAnime];

    // Search filter
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => {
        const matchTitle = item.title?.toLowerCase().includes(q);
        const matchAlt = item.alternateTitle?.toLowerCase().includes(q);
        const matchDesc = item.synopsis?.toLowerCase().includes(q);
        const matchGenres = item.genres?.some(g => g.toLowerCase().includes(q));
        const matchProviderId = item.providers?.raretoonIndia?.providerAnimeId?.toLowerCase().includes(q);
        return matchTitle || matchAlt || matchDesc || matchGenres || matchProviderId;
      });
    }

    // Genre filter
    if (selectedGenre !== 'All') {
      result = result.filter(item =>
        item.genres?.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
      );
    }

    // Type filter (TV / Movie)
    if (selectedType !== 'All') {
      result = result.filter(item => item.type === selectedType);
    }

    // Sorting
    if (sortBy === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'year') {
      result.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
    } else if (sortBy === 'seasons') {
      result.sort((a, b) => (b.seasons?.length || 0) - (a.seasons?.length || 0));
    } else {
      // Default 'popular': multi-season titles first, then by title
      result.sort((a, b) => {
        const aSeasons = a.seasons?.length || 0;
        const bSeasons = b.seasons?.length || 0;
        if (bSeasons !== aSeasons) return bSeasons - aSeasons;
        return a.title.localeCompare(b.title);
      });
    }

    return result;
  }, [allAnime, searchQuery, selectedGenre, selectedType, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedGenre, selectedType, sortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAnime.length / ITEMS_PER_PAGE));
  const paginatedAnime = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAnime.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAnime, currentPage]);

  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      if (res.ok) {
        // Poll sync status
        const interval = setInterval(async () => {
          try {
            const statusRes = await fetch('/api/sync-status');
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              if (!statusData.isSyncing) {
                clearInterval(interval);
                setIsSyncing(false);
                fetchCatalogue();
              }
            }
          } catch {
            clearInterval(interval);
            setIsSyncing(false);
          }
        }, 2000);
      } else {
        setIsSyncing(false);
      }
    } catch {
      setIsSyncing(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white pb-16 sm:pb-0">
      {/* Navigation Bar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenStats={() => setIsStatsOpen(true)}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        totalAnime={allAnime.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Notice Bar */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-slate-800/90 p-4 md:p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/90 text-emerald-300 border border-emerald-700/50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Provider Connected: RareToon India
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  100% Verified Deep-Links
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-bold text-white tracking-tight">
                Authentic Anime Discovery &amp; Watch Catalogue
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-2xl leading-relaxed">
                Browse verified Hindi Dubbed and Dual Audio anime. Pressing{' '}
                <strong className="text-slate-200">“OPEN THIS ANIME TO WATCH”</strong>{' '}
                takes you directly to the exact corresponding anime page on RareToon India.
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
              <button
                type="button"
                id="btn-view-metrics-hero"
                onClick={() => setIsStatsOpen(true)}
                className="flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Catalogue Audit</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category & Format Filters */}
        <div ref={categoriesSectionRef}>
          <CategoryFilter
            selectedGenre={selectedGenre}
            onSelectGenre={setSelectedGenre}
            selectedType={selectedType}
            onSelectType={setSelectedType}
            genres={genresWithCounts}
            totalCount={filteredAnime.length}
          />
        </div>

        {/* Sort Controls & Active Filter Status */}
        <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Sort by:</span>
            <select
              id="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="popular">Popular (Most Seasons)</option>
              <option value="title">Title (A - Z)</option>
              <option value="year">Release Year (Newest)</option>
              <option value="seasons">Season Count</option>
            </select>
          </div>

          {(selectedGenre !== 'All' || selectedType !== 'All' || searchQuery) && (
            <button
              type="button"
              id="btn-reset-all-filters"
              onClick={() => {
                setSelectedGenre('All');
                setSelectedType('All');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Anime Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 py-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 animate-pulse"
              >
                <div className="w-full aspect-video bg-slate-800 rounded-lg" />
                <div className="h-4 bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : paginatedAnime.length === 0 ? (
          <div
            id="empty-catalogue-state"
            className="p-12 text-center bg-slate-900/50 border border-slate-800/80 rounded-2xl my-6 space-y-3"
          >
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-200">No Anime Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No anime matches your filter criteria "{searchQuery || selectedGenre}". Try searching another title or resetting your filters.
            </p>
            <button
              type="button"
              id="btn-clear-search-empty"
              onClick={() => {
                setSearchQuery('');
                setSelectedGenre('All');
                setSelectedType('All');
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors inline-block"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div
            id="anime-catalogue-grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {paginatedAnime.map(anime => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                onSelect={setSelectedAnime}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between py-6 border-t border-slate-800/80">
            <button
              type="button"
              id="btn-prev-page"
              disabled={currentPage <= 1}
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1));
                scrollToTop();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-slate-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400">
              Page <strong className="text-slate-200">{currentPage}</strong> of{' '}
              <strong className="text-slate-200">{totalPages}</strong> ({filteredAnime.length} anime)
            </span>

            <button
              type="button"
              id="btn-next-page"
              disabled={currentPage >= totalPages}
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1));
                scrollToTop();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800 text-slate-200 transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center font-black text-white text-xs">
                AV
              </div>
              <span className="font-bold text-slate-200">AniVault Foundation</span>
              <span className="text-slate-500">•</span>
              <span>Anime Discovery &amp; Metadata Engine</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Content Provider: RareToon India
              </span>
              <a
                href="https://raretoonindia.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>Visit Source Site</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <p>
              AniVault is a catalogue and discovery platform. We do not host, store, or stream media files.
              All watch links connect directly to verified pages on RareToon India.
            </p>
            <p>Stable Identity &amp; Verified Artwork Architecture</p>
          </div>
        </div>
      </footer>

      {/* Anime Details Modal */}
      {selectedAnime && (
        <AnimeDetailsModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
        />
      )}

      {/* Stats / Audit Modal */}
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        totalAnime={allAnime.length}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onBrowseClick={() => {
          setSelectedGenre('All');
          setSelectedType('All');
          setSearchQuery('');
          scrollToTop();
        }}
        onSearchClick={() => {
          const searchInput = document.getElementById('global-anime-search') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
            scrollToTop();
          }
        }}
        onCategoriesClick={() => {
          if (categoriesSectionRef.current) {
            categoriesSectionRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onStatsClick={() => setIsStatsOpen(true)}
      />
    </div>
  );
}

export default App;
