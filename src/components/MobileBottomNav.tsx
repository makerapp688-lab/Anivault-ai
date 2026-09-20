import React from 'react';
import { Home, Compass, Bookmark, Heart, Check, Scale, User } from 'lucide-react';
import { useUserData } from '../hooks/useUserData.ts';
import { NavTabType } from './Navbar.tsx';

interface MobileBottomNavProps {
  activeTab: NavTabType;
  setActiveTab: (tab: NavTabType) => void;
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
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95 backdrop-blur-lg border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 px-2 py-1.5 transition-colors safe-area-pb">
      <div className="flex items-center justify-around">
        <button
          type="button"
          id="mobile-nav-home"
          onClick={() => setActiveTab('browse')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'browse'
              ? 'text-rose-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Browse</span>
        </button>

        <button
          type="button"
          id="mobile-nav-watchlist"
          onClick={() => setActiveTab('watchlist')}
          className={`relative flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'watchlist'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          <Bookmark className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Watchlist</span>
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
              : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 light:text-slate-600'
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
          id="mobile-nav-compare"
          onClick={() => setActiveTab('compare')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'compare'
              ? 'text-rose-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Compare</span>
        </button>

        <button
          type="button"
          id="mobile-nav-account"
          onClick={() => setActiveTab('account')}
          className={`flex flex-col items-center justify-center p-1 rounded-xl transition-colors ${
            activeTab === 'account'
              ? 'text-rose-500 font-bold'
              : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 light:text-slate-600'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 max-w-[50px] truncate">
            {account.username || (isGuest ? 'Guest' : 'Account')}
          </span>
        </button>
      </div>
    </nav>
  );
};
