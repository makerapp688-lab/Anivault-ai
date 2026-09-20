/**
 * Full Catalogue Importer & Artwork Repair Client Utilities
 */

export interface FullImportReport {
  importStatus: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  pagesScanned: number;
  totalDiscovered: number;
  stagedCount: number;
  processedCount: number;
  addedCount: number;
  updatedCount: number;
  duplicatesSkipped: number;
  moviesCount: number;
  rejectedCount: number;
  failedCount: number;
  verificationPendingCount: number;
  finalCatalogueCount: number;
  lastImportTime: string;
}

export interface ArtworkAuditReport {
  totalMedia: number;
  verifiedArtwork: number;
  artworkRepaired: number;
  stillPending: number;
  genuinelyUnavailable: number;
  brokenArtwork: number;
  incorrectMismatchedDetected: number;
  auditTimestamp: string;
}

export async function fetchFullImportStatus(): Promise<{ report: FullImportReport; state: any; totalProductionAnime: number }> {
  const res = await fetch('/api/full-import/status');
  if (!res.ok) throw new Error('Failed to fetch import status');
  return res.json();
}

export async function startFullImport(): Promise<any> {
  const res = await fetch('/api/full-import/start', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to start full import');
  return res.json();
}

export async function pauseFullImport(): Promise<any> {
  const res = await fetch('/api/full-import/pause', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to pause full import');
  return res.json();
}

export async function resetFullImport(): Promise<any> {
  const res = await fetch('/api/full-import/reset', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset full import');
  return res.json();
}

export async function runArtworkRepair(): Promise<ArtworkAuditReport> {
  const res = await fetch('/api/artwork/repair', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run artwork repair');
  const data = await res.json();
  return data.report;
}

export async function fetchArtworkAudit(): Promise<ArtworkAuditReport | null> {
  const res = await fetch('/api/artwork/audit');
  if (!res.ok) return null;
  return res.json();
}
