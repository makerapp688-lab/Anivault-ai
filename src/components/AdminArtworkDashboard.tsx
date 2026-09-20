import React, { useState, useEffect } from 'react';
import {
  Image,
  RefreshCw,
  Search,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  Sparkles,
  Lock,
  Layers
} from 'lucide-react';
import {
  ArtworkManagerStatus,
  fetchArtworkManagerStatus,
  scanArtwork,
  repairMissingArtwork,
  retryFailedArtwork,
  runFullArtworkAudit
} from '../utils/artworkManager.ts';

interface AdminArtworkDashboardProps {
  isAdmin?: boolean;
  onCatalogueUpdated?: () => void;
}

export const AdminArtworkDashboard: React.FC<AdminArtworkDashboardProps> = ({
  isAdmin = true,
  onCatalogueUpdated
}) => {
  const [status, setStatus] = useState<ArtworkManagerStatus | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadStatus = async () => {
    try {
      const data = await fetchArtworkManagerStatus();
      setStatus(data);
    } catch (err: any) {
      console.error('Failed to load artwork manager status:', err);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadStatus();
    const interval = setInterval(loadStatus, 4000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  if (!isAdmin) {
    return null; // Normal users must NEVER see admin controls
  }

  const handleScan = async () => {
    setLoadingAction('scanning');
    setErrorMsg(null);
    try {
      const res = await scanArtwork();
      setStatus(res);
      if (onCatalogueUpdated) onCatalogueUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Scan failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRepair = async () => {
    setLoadingAction('repairing');
    setErrorMsg(null);
    try {
      const res = await repairMissingArtwork();
      setStatus(res);
      if (onCatalogueUpdated) onCatalogueUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Repair failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRetryFailed = async () => {
    setLoadingAction('retrying');
    setErrorMsg(null);
    try {
      const res = await retryFailedArtwork();
      setStatus(res);
      if (onCatalogueUpdated) onCatalogueUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Retry failed');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRunAudit = async () => {
    setLoadingAction('auditing');
    setErrorMsg(null);
    try {
      const res = await runFullArtworkAudit();
      setStatus(res);
      if (onCatalogueUpdated) onCatalogueUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'Audit failed');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-4 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-2xl space-y-4 shadow-lg" id="admin-artwork-dashboard">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <Image className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900">
                Artwork Manager (Admin Console)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Admin Only
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600">
              Self-maintaining artwork resolution, automated health check, and repair queue
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        {status?.currentlyRepairing && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950 text-amber-300 border border-amber-800/60 flex items-center gap-1.5 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Currently Repairing...
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 10 Required Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Media</span>
          <span className="font-black text-slate-100 dark:text-slate-100 light:text-slate-900 text-lg">{status?.totalMedia ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Verified Artwork</span>
          <span className="font-black text-emerald-400 text-lg">{status?.verifiedArtwork ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Missing Artwork</span>
          <span className="font-black text-rose-400 text-lg">{status?.missingArtwork ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Broken Artwork</span>
          <span className="font-black text-amber-400 text-lg">{status?.brokenArtwork ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Pending Repairs</span>
          <span className="font-black text-indigo-400 text-lg">{status?.pendingRepairs ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Currently Repairing</span>
          <span className="font-black text-amber-400 text-lg">{status?.currentlyRepairing ? 'Yes' : 'No'}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Successfully Repaired</span>
          <span className="font-black text-cyan-400 text-lg">{status?.successfullyRepaired ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Permanently Unavailable</span>
          <span className="font-black text-slate-400 text-lg">{status?.permanentlyUnavailable ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Failed Attempts</span>
          <span className="font-black text-pink-400 text-lg">{status?.failedAttempts ?? 0}</span>
        </div>

        <div className="p-3 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 col-span-2 sm:col-span-1">
          <span className="text-slate-400 block text-[10px] font-semibold uppercase">Last Artwork Check</span>
          <span className="font-bold text-slate-300 text-[11px] block truncate mt-1">
            {status?.lastArtworkCheck ? new Date(status.lastArtworkCheck).toLocaleTimeString() : 'Pending'}
          </span>
        </div>
      </div>

      {/* Admin Action Controls */}
      <div className="pt-2 border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 flex flex-wrap items-center gap-2">
        <button
          type="button"
          id="btn-admin-scan-artwork"
          onClick={handleScan}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <Search className={`w-3.5 h-3.5 ${loadingAction === 'scanning' ? 'animate-spin' : ''}`} />
          <span>Scan Artwork</span>
        </button>

        <button
          type="button"
          id="btn-admin-repair-missing"
          onClick={handleRepair}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'repairing' ? 'animate-spin' : ''}`} />
          <span>Repair Missing Artwork</span>
        </button>

        <button
          type="button"
          id="btn-admin-retry-failed"
          onClick={handleRetryFailed}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition-colors disabled:opacity-50"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${loadingAction === 'retrying' ? 'animate-spin' : ''}`} />
          <span>Retry Failed Artwork</span>
        </button>

        <button
          type="button"
          id="btn-admin-run-full-audit"
          onClick={handleRunAudit}
          disabled={loadingAction !== null}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${loadingAction === 'auditing' ? 'animate-spin' : ''}`} />
          <span>Run Full Artwork Audit</span>
        </button>
      </div>
    </div>
  );
};
