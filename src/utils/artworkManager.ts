/**
 * Client Utility for AniVault Artwork Manager
 */

export interface ArtworkManagerStatus {
  totalMedia: number;
  verifiedArtwork: number;
  missingArtwork: number;
  brokenArtwork: number;
  pendingRepairs: number;
  currentlyRepairing: boolean;
  successfullyRepaired: number;
  permanentlyUnavailable: number;
  failedAttempts: number;
  lastArtworkCheck: string;
}

export async function fetchArtworkManagerStatus(): Promise<ArtworkManagerStatus> {
  const res = await fetch('/api/artwork/manager-status');
  if (!res.ok) throw new Error('Failed to fetch artwork manager status');
  return res.json();
}

export async function scanArtwork(): Promise<ArtworkManagerStatus> {
  const res = await fetch('/api/artwork/scan', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to scan artwork');
  const data = await res.json();
  return data.report;
}

export async function repairMissingArtwork(): Promise<ArtworkManagerStatus> {
  const res = await fetch('/api/artwork/repair', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to repair missing artwork');
  const data = await res.json();
  return data.report;
}

export async function retryFailedArtwork(): Promise<ArtworkManagerStatus> {
  const res = await fetch('/api/artwork/retry-failed', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to retry failed artwork');
  const data = await res.json();
  return data.report;
}

export async function runFullArtworkAudit(): Promise<ArtworkManagerStatus> {
  const res = await fetch('/api/artwork/audit', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to run full artwork audit');
  const data = await res.json();
  return data.report;
}
