import React from 'react';
import { Home, Compass, Bookmark, Heart, User, Check } from 'lucide-react';
import { useUserData } from '../hooks/useUserData.ts';

interface MobileBottomNavProps {
  activeTab: 'browse' | 'watchlist' | 'favorites' | 'completed';
  setActiveTab: (tab: 'browse' | 'watchlist' | 'favorites' | 'completed') => void;
  onOpenAuth: () => void;
  onScrollToCategories: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onScrollToCategories
}) => {
  const { userData, account, isGuest } = useUserData();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95 backdrop-blur-lg border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 px-3 py-2 transition-colors safe-area-pb">
      <div className="flex items-center justify-around">
        <button
          type="button"
          id="mobile-nav-home"
          onClick={() => setActiveTab('browse')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'browse'
              ? 'text-rose-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Browse</span>
        </button>

        <button
          type="button"
          id="mobile-nav-discover"
          onClick={() => {
            setActiveTab('browse');
            onScrollToCategories();
          }}
          className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Genres</span>
        </button>

        <button
          type="button"
          id="mobile-nav-watchlist"
          onClick={() => setActiveTab('watchlist')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'watchlist'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Watch Later</span>
          {userData.watchlist.length > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">
              {userData.watchlist.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="mobile-nav-favorites"
          onClick={() => setActiveTab('favorites')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'favorites'
              ? 'text-rose-500 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Favorites</span>
          {userData.favorites.length > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center">
              {userData.favorites.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="mobile-nav-completed"
          onClick={() => setActiveTab('completed')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'completed'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Check className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Watched</span>
          {userData.completed.length > 0 && (
            <span className="absolute top-0 right-1 w-4 h-4 rounded-full bg-emerald-600 text-[9px] font-bold text-white flex items-center justify-center">
              {userData.completed.length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="mobile-nav-account"
          onClick={onOpenAuth}
          className="flex flex-col items-center justify-center p-1 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{isGuest ? 'Guest' : 'Profile'}</span>
        </button>
      </div>
    </nav>
  );
};
