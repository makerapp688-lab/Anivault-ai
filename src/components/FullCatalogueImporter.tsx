import React, { useState, useEffect } from 'react';
import {
  Database,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Image,
  RefreshCw,
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import {
  FullImportReport,
  ArtworkAuditReport,
  fetchFullImportStatus,
  startFullImport,
  pauseFullImport,
  resetFullImport,
  runArtworkRepair,
  fetchArtworkAudit
} from '../utils/fullCatalogueImporter.ts';

interface FullCatalogueImporterProps {
  onCatalogueUpdated?: () => void;
}

export const FullCatalogueImporter: React.FC<FullCatalogueImporterProps> = ({ onCatalogueUpdated }) => {
  const [report, setReport] = useState<FullImportReport | null>(null);
  const [artworkAudit, setArtworkAudit] = useState<ArtworkAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRepairingArt, setIsRepairingArt] = useState<boolean>(false);

  const refreshStatus = async () => {
    try {
      const data = await fetchFullImportStatus();
      setReport(data.report);
      const audit = await fetchArtworkAudit();
      if (audit) setArtworkAudit(audit);
    } catch (err) {
      console.error('Error refreshing importer status:', err);
    }
  };

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    setIsLoading(true);
    try {
      await startFullImport();
      await refreshStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePause = async () => {
    setIsLoading(true);
    try {
      await pauseFullImport();
      await refreshStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset Full Import checkpoint? Existing production catalogue remains safe.')) return;
    setIsLoading(true);
    try {
      await resetFullImport();
      await refreshStatus();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepairArtwork = async () => {
    setIsRepairingArt(true);
    try {
      const audit = await runArtworkRepair();
      setArtworkAudit(audit);
      if (onCatalogueUpdated) onCatalogueUpdated();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRepairingArt(false);
    }
  };

  const status = report?.importStatus || 'idle';
  const isRunning = status === 'running';

  return (
    <div className="space-y-4" id="full-catalogue-importer-container">
      {/* Importer Engine Card */}
      <div className="p-4 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              Full Catalogue Import System
            </h3>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                status === 'running'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800 animate-pulse'
                  : status === 'completed'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : status === 'paused'
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Status: {status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {status === 'running' ? (
              <button
                type="button"
                id="btn-pause-full-import"
                onClick={handlePause}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Import
              </button>
            ) : (
              <button
                type="button"
                id="btn-start-full-import"
                onClick={handleStart}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                {status === 'paused' ? 'Resume Import' : 'Start Full Import'}
              </button>
            )}

            <button
              type="button"
              id="btn-reset-full-import"
              onClick={handleReset}
              disabled={isLoading || isRunning}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Reset checkpoint state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
          Multi-page pagination scanner automatically traverses RareToon sitemaps, category pages, and paginated archives. Stages raw URLs, verifies MAL + AniList media identities, resolves verified CDN artwork, and merges entries into the production catalogue without data loss.
        </p>

        {/* Live Batch Progress Bar */}
        {report && report.totalDiscovered > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-300 dark:text-slate-300 light:text-slate-700">
              <span>Batch Progress: {report.processedCount} / {report.totalDiscovered} Discovered URLs</span>
              <span>{Math.round((report.processedCount / Math.max(1, report.totalDiscovered)) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-rose-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (report.processedCount / Math.max(1, report.totalDiscovered)) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Metrics Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Pages Scanned</span>
            <span className="font-black text-cyan-400 text-base">{report?.pagesScanned || 0}</span>
          </div>
          <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">New Added</span>
            <span className="font-black text-emerald-400 text-base">{report?.addedCount || 0}</span>
          </div>
          <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Updated</span>
            <span className="font-black text-amber-400 text-base">{report?.updatedCount || 0}</span>
          </div>
          <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
            <span className="text-slate-400 block text-[10px] font-semibold uppercase">Final Catalogue</span>
            <span className="font-black text-rose-500 text-base">{report?.finalCatalogueCount || 401}</span>
          </div>
        </div>
      </div>

      {/* Artwork Repair Card */}
      <div className="p-4 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-100 border border-slate-800 dark:border-slate-800 light:border-slate-300 rounded-xl space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-white dark:text-white light:text-slate-900">
              Permanent Artwork Verification &amp; Repair Engine
            </h3>
          </div>

          <button
            type="button"
            id="btn-repair-artwork-now"
            onClick={handleRepairArtwork}
            disabled={isRepairingArt}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRepairingArt ? 'animate-spin' : ''}`} />
            <span>{isRepairingArt ? 'Repairing Artwork...' : 'Repair Artwork Now'}</span>
          </button>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
          Queries AniList GraphQL API and MAL database to resolve exact high-resolution cover artwork (CDN) for every media entry in AniVault. Replaces generic key-visual placeholders while maintaining strict 1-to-1 media identity binding.
        </p>

        {artworkAudit && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Total Media</span>
              <span className="font-black text-slate-200 dark:text-slate-200 light:text-slate-800 text-base">{artworkAudit.totalMedia}</span>
            </div>
            <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Verified CDN Artwork</span>
              <span className="font-black text-emerald-400 text-base">{artworkAudit.verifiedArtwork}</span>
            </div>
            <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Artwork Repaired</span>
              <span className="font-black text-cyan-400 text-base">{artworkAudit.artworkRepaired}</span>
            </div>
            <div className="p-2.5 bg-slate-900/90 dark:bg-slate-900/90 light:bg-slate-50 rounded-lg border border-slate-800 dark:border-slate-800 light:border-slate-200">
              <span className="text-slate-400 block text-[10px] font-semibold uppercase">Genuinely Unavailable</span>
              <span className="font-black text-amber-400 text-base">{artworkAudit.genuinelyUnavailable}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
