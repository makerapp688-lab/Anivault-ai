import React, { useState } from 'react';
import {
  Sparkles,
  Database,
  ExternalLink,
  Dice5,
  Sun,
  Moon,
  Monitor,
  User,
  Shield,
  Layers,
  Heart,
  Bookmark,
  Check
} from 'lucide-react';
import { RARETOON_BASE_URL, RARETOON_PROVIDER_NAME } from '../utils/provider.ts';
import { useUserData } from '../hooks/useUserData.ts';
import { ThemeMode } from '../types.ts';

interface NavbarProps {
  onOpenStats: () => void;
  onOpenSurprise: () => void;
  onOpenAuth: () => void;
  activeTab: 'browse' | 'watchlist' | 'favorites' | 'completed';
  setActiveTab: (tab: 'browse' | 'watchlist' | 'favorites' | 'completed') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenStats,
  onOpenSurprise,
  onOpenAuth,
  activeTab,
  setActiveTab
}) => {
  const { account, userData, setTheme, isGuest } = useUserData();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
    setShowThemeMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95 backdrop-blur-md border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo - matching Screenshot 1 */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => setActiveTab('browse')}
          id="nav-logo-group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center shadow-lg shadow-rose-600/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white dark:text-white light:text-slate-900 tracking-tight font-display">
                AniVault
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40">
                CATALOGUE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-500 hidden sm:block -mt-0.5">
              Discovery &amp; Metadata Browser
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs (Desktop) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/80 dark:bg-slate-900/80 light:bg-slate-100 p-1 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300">
          <button
            type="button"
            id="nav-tab-browse"
            onClick={() => setActiveTab('browse')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'browse'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200'
            }`}
          >
            Browse All
          </button>
          <button
            type="button"
            id="nav-tab-watchlist"
            onClick={() => setActiveTab('watchlist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'watchlist'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watch Later</span>
            {userData.watchlist.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-500 text-white font-bold">
                {userData.watchlist.length}
              </span>
            )}
          </button>
          <button
            type="button"
            id="nav-tab-favorites"
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'favorites'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>Favorites</span>
            {userData.favorites.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                {userData.favorites.length}
              </span>
            )}
          </button>
          <button
            type="button"
            id="nav-tab-completed"
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:text-white hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Watched</span>
            {userData.completed.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500 text-white font-bold">
                {userData.completed.length}
              </span>
            )}
          </button>
        </div>

        {/* Right Tools & Account Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Active Provider Pill - points to new RareToon website */}
          <a
            href={RARETOON_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="nav-provider-pill"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 shadow-sm transition-colors"
            title="Active Content Provider: RareToon India (New site: rareanimes.mov)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{RARETOON_PROVIDER_NAME}</span>
            <ExternalLink className="w-3 h-3 text-emerald-400" />
          </a>

          {/* Surprise Me / Dice Button */}
          <button
            type="button"
            id="nav-btn-surprise"
            onClick={onOpenSurprise}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/40 shadow-sm transition-all"
            title="Roll the Dice / Surprise Me with a random anime"
          >
            <Dice5 className="w-4 h-4" />
            <span className="hidden sm:inline">Surprise Me</span>
          </button>

          {/* Theme Mode Toggle */}
          <div className="relative">
            <button
              type="button"
              id="nav-btn-theme"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 flex items-center justify-center text-slate-300 dark:text-slate-300 light:text-slate-700 transition-colors"
              title="Change Theme (Dark, Light, System)"
            >
              {userData.theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : userData.theme === 'system' ? (
                <Monitor className="w-4 h-4 text-cyan-400" />
              ) : (
                <Moon className="w-4 h-4 text-rose-400" />
              )}
            </button>

            {showThemeMenu && (
              <div
                className="absolute right-0 mt-2 w-32 bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl shadow-xl py-1 z-50 text-xs text-slate-200 dark:text-slate-200 light:text-slate-800"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  id="theme-opt-dark"
                  onClick={() => handleThemeChange('dark')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 ${
                    userData.theme === 'dark' ? 'text-rose-400 font-bold' : ''
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>
                <button
                  type="button"
                  id="theme-opt-light"
                  onClick={() => handleThemeChange('light')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 ${
                    userData.theme === 'light' ? 'text-amber-500 font-bold' : ''
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>
                <button
                  type="button"
                  id="theme-opt-system"
                  onClick={() => handleThemeChange('system')}
                  className={`w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 ${
                    userData.theme === 'system' ? 'text-cyan-400 font-bold' : ''
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>System</span>
                </button>
              </div>
            )}
          </div>

          {/* Account Profile / Auth Button */}
          <button
            type="button"
            id="nav-btn-account"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-800 transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-[10px] text-rose-400 font-bold">
              {account.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline max-w-[90px] truncate">
              {isGuest ? 'Guest' : account.name}
            </span>
          </button>

          {/* DB Report Modal Button */}
          <button
            type="button"
            id="nav-btn-stats"
            onClick={onOpenStats}
            className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-800 dark:border-slate-800 light:border-slate-300 flex items-center justify-center text-slate-300 hover:text-white dark:text-slate-300 light:text-slate-700 transition-colors"
            title="Open AniVault Production Catalogue Report"
          >
            <Database className="w-4 h-4 text-slate-400 hover:text-rose-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
