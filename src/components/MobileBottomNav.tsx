import React from 'react';
import { Home, Search, Layers, ShieldCheck } from 'lucide-react';

interface MobileBottomNavProps {
  onBrowseClick: () => void;
  onSearchClick: () => void;
  onCategoriesClick: () => void;
  onStatsClick: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  onBrowseClick,
  onSearchClick,
  onCategoriesClick,
  onStatsClick
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 sm:hidden">
      <div className="grid grid-cols-4 h-16">
        <button
          type="button"
          id="btn-mobile-browse"
          onClick={onBrowseClick}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 active:text-indigo-400 hover:text-slate-200 transition-colors"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Browse</span>
        </button>

        <button
          type="button"
          id="btn-mobile-search"
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 active:text-indigo-400 hover:text-slate-200 transition-colors"
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Search</span>
        </button>

        <button
          type="button"
          id="btn-mobile-categories"
          onClick={onCategoriesClick}
          className="flex flex-col items-center justify-center gap-1 text-slate-400 active:text-indigo-400 hover:text-slate-200 transition-colors"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Genres</span>
        </button>

        <button
          type="button"
          id="btn-mobile-stats"
          onClick={onStatsClick}
          className="flex flex-col items-center justify-center gap-1 text-emerald-400 active:text-emerald-300 transition-colors"
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-semibold">RareToon</span>
        </button>
      </div>
    </nav>
  );
};
