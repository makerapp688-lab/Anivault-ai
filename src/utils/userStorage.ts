import { UserAccount, UserData, ThemeMode } from '../types.ts';

const GUEST_ACCOUNT: UserAccount = {
  id: 'guest_user',
  name: 'Anime Explorer',
  provider: 'guest',
  createdAt: new Date().toISOString()
};

const DEFAULT_USER_DATA: UserData = {
  favorites: [],
  watchlist: [],
  completed: [],
  history: [],
  theme: 'dark'
};

const STORAGE_KEYS = {
  CURRENT_ACCOUNT: 'anivault_current_account',
  ACCOUNTS_LIST: 'anivault_accounts_list',
  GUEST_DATA: 'anivault_guest_data',
  USER_DATA_PREFIX: 'anivault_user_data_'
};

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (err) {
      console.error('Error notifying userStorage listener:', err);
    }
  });
}

export function subscribeUserStorage(callback: Listener): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getCurrentAccount(): UserAccount {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_ACCOUNT);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse current account, defaulting to guest:', err);
  }
  return GUEST_ACCOUNT;
}

export function getUserData(accountId?: string): UserData {
  const currentId = accountId || getCurrentAccount().id;
  try {
    const key = currentId === 'guest_user' ? STORAGE_KEYS.GUEST_DATA : `${STORAGE_KEYS.USER_DATA_PREFIX}${currentId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
        watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
        history: Array.isArray(parsed.history) ? parsed.history : [],
        theme: parsed.theme === 'light' || parsed.theme === 'system' ? parsed.theme : 'dark'
      };
    }
  } catch (err) {
    console.warn('Failed to load user data:', err);
  }
  return { ...DEFAULT_USER_DATA };
}

export function saveUserData(data: UserData, accountId?: string): void {
  const currentId = accountId || getCurrentAccount().id;
  try {
    const key = currentId === 'guest_user' ? STORAGE_KEYS.GUEST_DATA : `${STORAGE_KEYS.USER_DATA_PREFIX}${currentId}`;
    localStorage.setItem(key, JSON.stringify(data));
    notifyListeners();
  } catch (err) {
    console.warn('Failed to save user data:', err);
  }
}

export function toggleFavorite(animeId: string): boolean {
  const data = getUserData();
  const exists = data.favorites.includes(animeId);
  const updatedFavorites = exists
    ? data.favorites.filter(id => id !== animeId)
    : [...data.favorites, animeId];
  saveUserData({ ...data, favorites: updatedFavorites });
  return !exists;
}

export function toggleWatchlist(animeId: string): boolean {
  const data = getUserData();
  const exists = data.watchlist.includes(animeId);
  const updatedWatchlist = exists
    ? data.watchlist.filter(id => id !== animeId)
    : [...data.watchlist, animeId];
  saveUserData({ ...data, watchlist: updatedWatchlist });
  return !exists;
}

export function toggleCompleted(animeId: string): boolean {
  const data = getUserData();
  const exists = data.completed.includes(animeId);
  const updatedCompleted = exists
    ? data.completed.filter(id => id !== animeId)
    : [...data.completed, animeId];
  saveUserData({ ...data, completed: updatedCompleted });
  return !exists;
}

export function addToHistory(animeId: string): void {
  const data = getUserData();
  const filtered = data.history.filter(h => h.animeId !== animeId);
  const updatedHistory = [{ animeId, timestamp: Date.now() }, ...filtered].slice(0, 20);
  saveUserData({ ...data, history: updatedHistory });
}

export function clearHistory(): void {
  const data = getUserData();
  saveUserData({ ...data, history: [] });
}

export function setThemeMode(theme: ThemeMode): void {
  const data = getUserData();
  saveUserData({ ...data, theme });
  applyThemeClass(theme);
}

export function applyThemeClass(theme: ThemeMode): void {
  const root = document.documentElement;
  let isDark = true;
  if (theme === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } else {
    isDark = theme === 'dark';
  }
  if (isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }
}

export function getGuestData(): UserData {
  return getUserData('guest_user');
}

export function hasGuestDataToMigrate(): boolean {
  const guestData = getGuestData();
  return (
    guestData.favorites.length > 0 ||
    guestData.watchlist.length > 0 ||
    guestData.completed.length > 0
  );
}

export function migrateGuestDataToAccount(targetAccountId: string): {
  favoritesCount: number;
  watchlistCount: number;
  completedCount: number;
} {
  const guestData = getGuestData();
  const targetData = getUserData(targetAccountId);

  const mergedFavorites = Array.from(new Set([...targetData.favorites, ...guestData.favorites]));
  const mergedWatchlist = Array.from(new Set([...targetData.watchlist, ...guestData.watchlist]));
  const mergedCompleted = Array.from(new Set([...targetData.completed, ...guestData.completed]));
  
  // Merge history
  const historyMap = new Map<string, number>();
  for (const h of [...targetData.history, ...guestData.history]) {
    if (!historyMap.has(h.animeId) || (historyMap.get(h.animeId)! < h.timestamp)) {
      historyMap.set(h.animeId, h.timestamp);
    }
  }
  const mergedHistory = Array.from(historyMap.entries())
    .map(([animeId, timestamp]) => ({ animeId, timestamp }))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 30);

  saveUserData({
    ...targetData,
    favorites: mergedFavorites,
    watchlist: mergedWatchlist,
    completed: mergedCompleted,
    history: mergedHistory
  }, targetAccountId);

  // Clear guest data after successful migration
  saveUserData({ ...DEFAULT_USER_DATA }, 'guest_user');

  return {
    favoritesCount: mergedFavorites.length,
    watchlistCount: mergedWatchlist.length,
    completedCount: mergedCompleted.length
  };
}

export function loginWithEmail(email: string, customName?: string): UserAccount {
  const cleanEmail = email.trim().toLowerCase();
  const name = customName?.trim() || cleanEmail.split('@')[0] || 'Explorer';
  const id = `user_${btoa(cleanEmail).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
  
  const account: UserAccount = {
    id,
    name,
    email: cleanEmail,
    provider: 'email',
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, JSON.stringify(account));
  notifyListeners();
  return account;
}

export function loginWithProvider(provider: 'google' | 'apple', email: string, name: string): UserAccount {
  const id = `${provider}_${btoa(email).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)}`;
  const account: UserAccount = {
    id,
    name,
    email,
    provider,
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, JSON.stringify(account));
  notifyListeners();
  return account;
}

export function switchAccount(account: UserAccount): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, JSON.stringify(account));
  notifyListeners();
}

export function logoutToGuest(): void {
  localStorage.setItem(STORAGE_KEYS.CURRENT_ACCOUNT, JSON.stringify(GUEST_ACCOUNT));
  notifyListeners();
}
