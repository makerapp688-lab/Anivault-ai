import React, { useState } from 'react';
import {
  User,
  Shield,
  Moon,
  Sun,
  Monitor,
  CheckCircle2,
  Edit2,
  Check,
  Heart,
  Bookmark,
  LogOut,
  FolderSync,
  History,
  Trash2,
  Users
} from 'lucide-react';
import { useUserData } from '../hooks/useUserData.ts';
import {
  updateUsername,
  setThemeMode,
  logoutToGuest,
  hasGuestDataToMigrate,
  migrateGuestDataToAccount,
  clearHistory,
  getSavedAccounts,
  switchAccount
} from '../utils/userStorage.ts';
import { ThemeMode, UserAccount } from '../types.ts';
import { AniVaultLogo } from './AniVaultLogo.tsx';
import { AdminArtworkDashboard } from './AdminArtworkDashboard.tsx';

interface AccountViewProps {
  onOpenAuthModal: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({ onOpenAuthModal }) => {
  const { account, userData, isGuest } = useUserData();
  const [editingUsername, setEditingUsername] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [usernameInput, setUsernameInput] = useState(account.username || 'AnimeExplorer');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [migrationStats, setMigrationStats] = useState<{
    favoritesCount: number;
    watchlistCount: number;
    completedCount: number;
  } | null>(null);

  const canMigrate = isGuest && hasGuestDataToMigrate();
  const savedAccounts = getSavedAccounts();

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    updateUsername(usernameInput.trim());
    setEditingUsername(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  const handleMigrate = () => {
    if (!account.id || account.id === 'guest_user') {
      onOpenAuthModal();
      return;
    }
    const stats = migrateGuestDataToAccount(account.id);
    setMigrationStats(stats);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" id="account-view-container">
      {/* Title */}
      <div className="pb-4 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white dark:text-white light:text-slate-900 tracking-tight">
            Account &amp; Preferences
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">
            Manage your AniVault username, persistent profile authentication, and display theme
          </p>
        </div>
        <AniVaultLogo size="lg" className="hidden sm:inline-flex" />
      </div>

      {/* Profile Overview Card */}
      <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-6 shadow-xl space-y-6 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-pink-500 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-rose-600/30">
              {(account.username || account.name).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white dark:text-white light:text-slate-900">
                  {account.username || 'AnimeExplorer'}
                </h2>
                <button
                  type="button"
                  id="btn-edit-username"
                  onClick={() => {
                    setUsernameInput(account.username || 'AnimeExplorer');
                    setEditingUsername(!editingUsername);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Edit username"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  account.provider === 'apple'
                    ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                    : account.provider === 'google'
                    ? 'bg-blue-950/80 text-blue-300 border border-blue-700/50'
                    : isGuest
                    ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                    : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                }`}>
                  {account.provider === 'apple' ? 'Apple ID' : account.provider === 'google' ? 'Google Account' : account.provider}
                </span>

                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
                  {account.email ? account.email : 'Local Guest Session'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isGuest ? (
              <button
                type="button"
                id="btn-connect-account-main"
                onClick={onOpenAuthModal}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 transition-all"
              >
                Sign In / Connect Identity
              </button>
            ) : (
              <button
                type="button"
                id="btn-signout-main"
                onClick={logoutToGuest}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 text-rose-400 border border-slate-800 dark:border-slate-800 light:border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Username Edit Form */}
        {editingUsername && (
          <form onSubmit={handleSaveUsername} className="p-4 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-300 space-y-3">
            <div className="text-xs font-bold text-white dark:text-white light:text-slate-900">
              Change Display Username
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              This username is shown throughout AniVault (e.g. &quot;Welcome, AnimeExplorer&quot;). Your login email and authentication identity remain securely tied to your Google or Apple credentials.
            </p>
            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                id="input-account-username"
                value={usernameInput}
                onChange={e => setUsernameInput(e.target.value)}
                placeholder="Enter AniVault username"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 dark:bg-slate-950 light:bg-white border border-slate-700 dark:border-slate-700 light:border-slate-300 text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-rose-500"
                required
              />
              <button
                type="submit"
                id="btn-submit-account-username"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingUsername(false)}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {saveSuccess && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Display username updated successfully!</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-center">
          <div className="p-3 bg-slate-900 dark:bg-slate-900 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center justify-center gap-1 text-sm font-black text-rose-500">
              <Heart className="w-4 h-4 fill-rose-500" />
              <span>{userData.favorites.length}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Favorites</div>
          </div>

          <div className="p-3 bg-slate-900 dark:bg-slate-900 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center justify-center gap-1 text-sm font-black text-indigo-400">
              <Bookmark className="w-4 h-4 fill-indigo-400" />
              <span>{userData.watchlist.length}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Watch Later</div>
          </div>

          <div className="p-3 bg-slate-900 dark:bg-slate-900 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <div className="flex items-center justify-center gap-1 text-sm font-black text-emerald-400">
              <Check className="w-4 h-4" />
              <span>{userData.completed.length}</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">Watched</div>
          </div>
        </div>
      </div>

      {/* Admin Mode Toggle & Admin Artwork Manager */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <span>Administrator Console Controls</span>
          </div>
          <button
            type="button"
            id="btn-toggle-admin-mode"
            onClick={() => setIsAdmin(!isAdmin)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
              isAdmin
                ? 'bg-amber-950/80 border-amber-700/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {isAdmin ? 'Admin Mode: ACTIVE' : 'Admin Mode: HIDDEN'}
          </button>
        </div>

        {isAdmin && <AdminArtworkDashboard isAdmin={isAdmin} />}
      </div>

      {/* Theme Settings Card (Requirement 5) */}
      <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 transition-colors">
        <div>
          <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
            Display Theme
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-0.5">
            Select your preferred visual appearance. Persists immediately across sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            id="theme-btn-dark"
            onClick={() => handleThemeSelect('dark')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              userData.theme === 'dark'
                ? 'bg-slate-900 border-rose-500 shadow-md'
                : 'bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white dark:text-white light:text-slate-900">Dark Mode</div>
                <div className="text-[11px] text-slate-400">Deep obsidian background</div>
              </div>
            </div>
            {userData.theme === 'dark' && <Check className="w-4 h-4 text-rose-500" />}
          </button>

          <button
            type="button"
            id="theme-btn-light"
            onClick={() => handleThemeSelect('light')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              userData.theme === 'light'
                ? 'bg-slate-100 dark:bg-slate-900 border-amber-500 shadow-md'
                : 'bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white dark:text-white light:text-slate-900">Light Mode</div>
                <div className="text-[11px] text-slate-400">Crisp high-contrast theme</div>
              </div>
            </div>
            {userData.theme === 'light' && <Check className="w-4 h-4 text-amber-500" />}
          </button>

          <button
            type="button"
            id="theme-btn-system"
            onClick={() => handleThemeSelect('system')}
            className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
              userData.theme === 'system'
                ? 'bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border-cyan-500 shadow-md'
                : 'bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white dark:text-white light:text-slate-900">System Sync</div>
                <div className="text-[11px] text-slate-400">Matches device settings</div>
              </div>
            </div>
            {userData.theme === 'system' && <Check className="w-4 h-4 text-cyan-400" />}
          </button>
        </div>
      </div>

      {/* Saved Accounts Switcher */}
      {savedAccounts.length > 0 && (
        <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 transition-colors">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-rose-500" />
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Saved Accounts &amp; Identities
            </h3>
          </div>
          <div className="space-y-2">
            {savedAccounts.map(acc => {
              const isCurrent = acc.id === account.id;
              return (
                <div
                  key={acc.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isCurrent
                      ? 'bg-rose-500/10 border-rose-500/40 text-white'
                      : 'bg-slate-900 dark:bg-slate-900 light:bg-slate-50 border-slate-800 dark:border-slate-800 light:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-500 to-pink-600 text-white font-bold flex items-center justify-center text-xs">
                      {(acc.username || acc.name).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-white dark:text-white light:text-slate-900">
                        {acc.username || acc.name} {isCurrent && '(Active)'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {acc.email || acc.provider}
                      </div>
                    </div>
                  </div>

                  {!isCurrent && (
                    <button
                      type="button"
                      onClick={() => switchAccount(acc)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-rose-400 transition-colors"
                    >
                      Switch to this account
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History & Watch Activity */}
      <div className="bg-slate-950/80 dark:bg-slate-950/80 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              Recently Viewed History
            </h3>
          </div>
          {userData.history.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {userData.history.length === 0 ? (
          <p className="text-xs text-slate-400">No recently viewed anime yet.</p>
        ) : (
          <div className="text-xs text-slate-400">
            {userData.history.length} anime entries in your recent viewing log.
          </div>
        )}
      </div>
    </div>
  );
};
