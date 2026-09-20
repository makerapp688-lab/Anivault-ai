import React from 'react';
import { Search, ShieldCheck, RefreshCw, X, Database } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenStats: () => void;
  isSyncing: boolean;
  onTriggerSync: () => void;
  totalAnime: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenStats,
  isSyncing,
  onTriggerSync,
  totalAnime
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <span className="font-black text-white text-lg tracking-tighter">AV</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">AniVault</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-indigo-950 text-indigo-400 border border-indigo-800/60 uppercase">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              Anime Discovery &amp; Catalogue
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-lg relative mx-2">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              id="global-anime-search"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search anime by title, English/Romaji name, or genre..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-700/70 hover:border-slate-600 focus:border-indigo-500 rounded-xl text-xs md:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                id="btn-clear-search"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Actions & Provider Status */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Provider Indicator */}
          <div
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
            title="Current active and verified content provider"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-slate-400">Provider:</span>
            <span className="font-semibold text-emerald-400">RareToon India</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          {/* Sync Trigger */}
          <button
            type="button"
            id="btn-trigger-sync"
            onClick={onTriggerSync}
            disabled={isSyncing}
            title="Sync catalogue from RareToon India"
            className={`p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center ${
              isSyncing ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Stats Drawer Button */}
          <button
            type="button"
            id="btn-open-stats"
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600/90 hover:bg-indigo-600 active:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Metrics</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-800 text-[10px] font-bold">
              {totalAnime}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
