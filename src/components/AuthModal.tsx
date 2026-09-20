import React, { useState } from 'react';
import {
  X,
  Shield,
  User,
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  LogOut,
  FolderSync,
  Heart,
  Bookmark,
  Check
} from 'lucide-react';
import { UserAccount } from '../types.ts';
import {
  getCurrentAccount,
  loginWithEmail,
  loginWithProvider,
  logoutToGuest,
  hasGuestDataToMigrate,
  migrateGuestDataToAccount,
  getGuestData,
  getUserData
} from '../utils/userStorage.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountChanged?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAccountChanged
}) => {
  if (!isOpen) return null;

  const currentAccount = getCurrentAccount();
  const isGuest = currentAccount.provider === 'guest';
  const userData = getUserData();
  const guestData = getGuestData();
  const canMigrate = isGuest && hasGuestDataToMigrate();

  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showMigratePrompt, setShowMigratePrompt] = useState(false);
  const [pendingAccount, setPendingAccount] = useState<UserAccount | null>(null);
  const [migrationStats, setMigrationStats] = useState<{
    favoritesCount: number;
    watchlistCount: number;
    completedCount: number;
  } | null>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (canMigrate) {
      // Create pending account and prompt user to migrate
      const cleanEmail = emailInput.trim().toLowerCase();
      const name = nameInput.trim() || cleanEmail.split('@')[0];
      const id = `user_${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
      const acc: UserAccount = {
        id,
        name,
        email: cleanEmail,
        provider: 'email',
        createdAt: new Date().toISOString()
      };
      setPendingAccount(acc);
      setShowMigratePrompt(true);
    } else {
      loginWithEmail(emailInput, nameInput);
      onAccountChanged?.();
      onClose();
    }
  };

  const handleProviderLogin = (provider: 'google' | 'apple') => {
    // Standard client OAuth flow or account profile creation
    const emailPrompt = prompt(
      `Enter your ${provider === 'google' ? 'Google / Gmail' : 'Apple ID'} email to sign in:`,
      provider === 'google' ? 'user@gmail.com' : 'user@icloud.com'
    );
    if (!emailPrompt || !emailPrompt.includes('@')) return;

    const name = emailPrompt.split('@')[0];
    if (canMigrate) {
      const id = `${provider}_${btoa(emailPrompt).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
      const acc: UserAccount = {
        id,
        name: `${provider === 'google' ? 'Google User' : 'Apple User'} (${name})`,
        email: emailPrompt.trim().toLowerCase(),
        provider,
        createdAt: new Date().toISOString()
      };
      setPendingAccount(acc);
      setShowMigratePrompt(true);
    } else {
      loginWithProvider(
        provider,
        emailPrompt.trim().toLowerCase(),
        `${provider === 'google' ? 'Google User' : 'Apple User'} (${name})`
      );
      onAccountChanged?.();
      onClose();
    }
  };

  const confirmMigration = (doMigrate: boolean) => {
    if (!pendingAccount) return;
    if (pendingAccount.provider === 'email') {
      loginWithEmail(pendingAccount.email || '', pendingAccount.name);
    } else {
      loginWithProvider(
        pendingAccount.provider as any,
        pendingAccount.email || '',
        pendingAccount.name
      );
    }

    if (doMigrate) {
      const stats = migrateGuestDataToAccount(pendingAccount.id);
      setMigrationStats(stats);
    }

    setShowMigratePrompt(false);
    onAccountChanged?.();
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleLogout = () => {
    logoutToGuest();
    onAccountChanged?.();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="auth-modal-overlay"
    >
      <div
        className="relative w-full max-w-md bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col transition-colors"
        onClick={e => e.stopPropagation()}
        id="auth-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900">
              AniVault Account
            </h2>
          </div>
          <button
            type="button"
            id="btn-close-auth-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-300 hover:text-white dark:text-slate-300 light:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-slate-200 dark:text-slate-200 light:text-slate-800">
          {/* Active Account Status */}
          <div className="p-4 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-bold">
                  {currentAccount.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-bold text-white dark:text-white light:text-slate-900">
                    {currentAccount.name}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500">
                    {currentAccount.email || 'Guest Explorer Session'}
                  </div>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                isGuest
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-700/50'
                  : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
              }`}>
                {currentAccount.provider}
              </span>
            </div>

            {/* Account Specific Data Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-center">
              <div className="p-2 bg-slate-900 dark:bg-slate-900 light:bg-white rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
                <div className="text-xs text-rose-400 font-bold flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500" />
                  <span>{userData.favorites.length}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Favorites</div>
              </div>

              <div className="p-2 bg-slate-900 dark:bg-slate-900 light:bg-white rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
                <div className="text-xs text-indigo-400 font-bold flex items-center justify-center gap-1">
                  <Bookmark className="w-3 h-3 fill-indigo-400" />
                  <span>{userData.watchlist.length}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Watch Later</div>
              </div>

              <div className="p-2 bg-slate-900 dark:bg-slate-900 light:bg-white rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
                <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>{userData.completed.length}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Watched</div>
              </div>
            </div>

            {!isGuest && (
              <button
                type="button"
                id="btn-logout-account"
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-rose-400 hover:text-rose-300 flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out (Return to Guest Mode)</span>
              </button>
            )}
          </div>

          {/* Migration Success Banner */}
          {migrationStats && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-700/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                Successfully imported {migrationStats.favoritesCount} favorites and {migrationStats.watchlistCount} watchlist items to your account!
              </span>
            </div>
          )}

          {/* Migration Confirmation Prompt */}
          {showMigratePrompt && (
            <div className="p-4 bg-indigo-950/60 border border-indigo-700/60 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wide">
                <FolderSync className="w-4 h-4 text-indigo-400" />
                <span>Migrate Guest Data?</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                You have <strong>{guestData.favorites.length} favorites</strong> and{' '}
                <strong>{guestData.watchlist.length} saved watchlist items</strong> in your guest session. Would you like to migrate them to your new account?
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  id="btn-confirm-migrate"
                  onClick={() => confirmMigration(true)}
                  className="flex-1 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                >
                  Import My Data
                </button>
                <button
                  type="button"
                  id="btn-skip-migrate"
                  onClick={() => confirmMigration(false)}
                  className="py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Start Fresh
                </button>
              </div>
            </div>
          )}

          {/* Sign In Options */}
          {isGuest && !showMigratePrompt && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">
                Sign In or Switch Account
              </div>

              {/* 3P OAuth Buttons: Google & Apple */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-auth-google"
                  onClick={() => handleProviderLogin('google')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 dark:bg-slate-800/90 dark:hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700 dark:border-slate-700 light:border-slate-300 text-xs font-semibold text-white dark:text-white light:text-slate-900 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.5 0 2.9.5 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                    />
                  </svg>
                  <span>Google Sign In</span>
                </button>

                <button
                  type="button"
                  id="btn-auth-apple"
                  onClick={() => handleProviderLogin('apple')}
                  className="py-2.5 px-3 rounded-xl bg-slate-800/90 hover:bg-slate-700 dark:bg-slate-800/90 dark:hover:bg-slate-700 light:bg-slate-100 light:hover:bg-slate-200 border border-slate-700 dark:border-slate-700 light:border-slate-300 text-xs font-semibold text-white dark:text-white light:text-slate-900 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.71-14.01-6.19-9.56-11.07-20.9-14.65-34.02-3.58-13.11-5.37-25.29-5.37-36.54 0-14.99 3.82-27.17 11.45-36.54 7.63-9.37 17.06-14.16 28.3-14.36 4.79 0 10.37 1.25 16.74 3.75 6.37 2.5 10.33 3.8 11.89 3.9 1.9-.3 6.13-1.74 12.7-4.33 6.57-2.58 12.22-3.78 16.94-3.6 12.49.6 22.84 5.3 31.06 14.1-10.9 6.6-16.2 15.7-15.9 27.3.3 9.1 3.8 16.7 10.5 22.8 6.7 6.1 14.6 9.6 23.7 10.5-2.2 6.6-5.1 13.5-8.7 20.7zM119.22 33.15c0-7.39 2.65-14.28 7.95-20.67 5.3-6.39 11.9-10.48 19.8-12.28.3 1.2.5 2.5.5 3.9 0 7.39-2.75 14.28-8.25 20.67-5.5 6.39-12.15 10.48-19.95 12.28-.1-1.3-.05-2.6-.05-3.9z" />
                  </svg>
                  <span>Apple Sign In</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800 dark:bg-slate-800 light:bg-slate-200" />
                <span className="text-[11px] text-slate-500 font-medium">or continue with email</span>
                <div className="h-px flex-1 bg-slate-800 dark:bg-slate-800 light:bg-slate-200" />
              </div>

              {/* Email Login Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      id="input-auth-email"
                      value={emailInput}
                      onChange={e => {
                        setEmailInput(e.target.value);
                        setAuthError(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 mb-1">
                    Display Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      id="input-auth-name"
                      value={nameInput}
                      onChange={e => setNameInput(e.target.value)}
                      placeholder="e.g. AnimeFan99"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-100 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-300 text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                {authError && (
                  <div className="text-[11px] text-rose-400 font-medium">
                    {authError}
                  </div>
                )}

                <button
                  type="submit"
                  id="btn-auth-submit"
                  className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Sign In &amp; Save Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Continue as Guest Button */}
          <div className="pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
            <button
              type="button"
              id="btn-auth-continue-guest"
              onClick={onClose}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800/60 hover:bg-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 light:bg-slate-100 light:hover:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 transition-colors text-center"
            >
              Continue Browsing as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
