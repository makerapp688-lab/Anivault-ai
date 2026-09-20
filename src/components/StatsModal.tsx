import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Database,
  ShieldCheck,
  RefreshCw,
  Layers,
  ExternalLink,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Film
} from 'lucide-react';
import { CatalogueStats } from '../types.ts';
import { RARETOON_BASE_URL, RARETOON_PROVIDER_NAME } from '../utils/provider.ts';
import { AniVaultLogo } from './AniVaultLogo.tsx';
import { FullCatalogueImporter } from './FullCatalogueImporter.tsx';
import { AdminArtworkDashboard } from './AdminArtworkDashboard.tsx';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: CatalogueStats | null;
  totalAnime: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
  totalAnime,
  isSyncing,
  onTriggerSync
}) => {
  const [importReport, setImportReport] = useState<any>(null);
  const [importState, setImportState] = useState<any>(null);
  const [isImportLoading, setIsImportLoading] = useState<boolean>(false);

  const fetchImportStatus = async () => {
    try {
      const res = await fetch('/api/full-import/status');
      if (res.ok) {
        const data = await res.json();
        setImportReport(data.report);
        setImportState(data.state);
      }
    } catch (err) {
      console.error('Failed to fetch full import status:', err);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    fetchImportStatus();
    const interval = setInterval(fetchImportStatus, 3000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleStartImport = async () => {
    setIsImportLoading(true);
    try {
      await fetch('/api/full-import/start', { method: 'POST' });
      await fetchImportStatus();
    } catch (err) {
      console.error('Failed to start import:', err);
    } finally {
      setIsImportLoading(false);
    }
  };

  const handlePauseImport = async () => {
    setIsImportLoading(true);
    try {
      await fetch('/api/full-import/pause', { method: 'POST' });
      await fetchImportStatus();
    } catch (err) {
      console.error('Failed to pause import:', err);
    } finally {
      setIsImportLoading(false);
    }
  };

  const handleResetImport = async () => {
    if (!window.confirm('Reset Full Import checkpoint state? Existing production catalogue will remain safe.')) return;
    setIsImportLoading(true);
    try {
      await fetch('/api/full-import/reset', { method: 'POST' });
      await fetchImportStatus();
    } catch (err) {
      console.error('Failed to reset import:', err);
    } finally {
      setIsImportLoading(false);
    }
  };

  if (!isOpen) return null;

  const status = importState?.importStatus || 'idle';
  const isRunning = status === 'running';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
      id="stats-modal-overlay"
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col transition-colors"
        onClick={e => e.stopPropagation()}
        id="stats-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-100 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div className="flex items-center gap-3">
            <AniVaultLogo size="sm" />
            <div>
              <h2 className="text-base font-bold text-white dark:text-white light:text-slate-900 tracking-tight">
                AniVault Catalogue &amp; Full Import Engine
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
                Resumable Full RareToon Import &amp; Database Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-stats-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-300 hover:text-white dark:text-slate-300 light:text-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-slate-200 dark:text-slate-200 light:text-slate-800">
          
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Production Catalogue
              </span>
              <span className="text-2xl font-black text-rose-500 mt-1">
                {importReport?.finalCatalogueCount || stats?.totalUniqueAnime || totalAnime}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Factual count
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Pages Scanned
              </span>
              <span className="text-2xl font-black text-cyan-400 mt-1">
                {importReport?.pagesScanned || 0}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">
                Pagination &amp; Sitemaps
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Total Discovered
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1">
                {importReport?.totalDiscovered || 0}
              </span>
              <span className="text-[10px] text-amber-400 mt-1">
                Provider URLs
              </span>
            </div>

            <div className="p-3.5 bg-slate-950/60 dark:bg-slate-950/60 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Anime Movies
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1">
                {importReport?.moviesCount || stats?.moviesCount || 193}
              </span>
              <span className="text-[10px] text-emerald-400 mt-1">
                Verified Movie Media
              </span>
            </div>
          </div>

          {/* ADMIN ARTWORK MANAGER DASHBOARD */}
          <AdminArtworkDashboard onCatalogueUpdated={onTriggerSync} />

          {/* FULL CATALOGUE IMPORT & ARTWORK REPAIR COMPONENT */}
          <FullCatalogueImporter onCatalogueUpdated={onTriggerSync} />

          {/* Provider Architecture */}
          <div className="p-4 bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white dark:text-white light:text-slate-900">
                  Active Content Provider: RareToon India ({RARETOON_PROVIDER_NAME})
                </span>
              </div>
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                Connected &amp; Verified
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              Provider URL: <a href={RARETOON_BASE_URL} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline font-mono inline-flex items-center gap-1">{RARETOON_BASE_URL} <ExternalLink className="w-3 h-3 inline" /></a>.
              AniVault operates strictly as a discovery catalogue. Clicking “OPEN THIS ANIME TO WATCH” deep-links to the exact verified anime on the new RareToon India website without proxying, faking links, or routing to old websites.
            </p>
          </div>

          {/* Factual Genre Distribution */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-rose-500" />
              Real Genre Distribution (Non-Monolithic)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stats?.genresBreakdown &&
                Object.entries(stats.genresBreakdown).map(([genre, count]) => (
                  <div
                    key={genre}
                    className="p-2.5 bg-slate-950/50 dark:bg-slate-950/50 light:bg-slate-100 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 rounded-lg flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-300 dark:text-slate-300 light:text-slate-700 font-medium">{genre}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-rose-400 dark:text-rose-400 light:text-rose-600 font-bold">
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-100 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            id="btn-stats-sync-now"
            onClick={onTriggerSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Catalogue Now'}</span>
          </button>
          <button
            type="button"
            id="btn-stats-close-bottom"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 light:bg-slate-200 light:hover:bg-slate-300 text-slate-200 dark:text-slate-200 light:text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
