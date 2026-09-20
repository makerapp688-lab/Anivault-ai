import fs from 'node:fs';
import path from 'node:path';
import {
  resolveItemArtwork,
  scanArtwork,
  repairMissingArtwork,
  retryFailedArtwork,
  runFullArtworkAuditBatch,
  getArtworkManagerStatus
} from './artwork-pipeline.js';

/**
 * ANIVAULT — ARTWORK MANAGER UTILITY
 * 
 * Performs batch validation and repair of anime artwork by cross-referencing
 * AniList and MAL IDs against a verified database, ensuring only high-quality,
 * official posters are stored. Integrated into app initialization & sync lifecycle.
 */
export class ArtworkManager {
  /**
   * Validate and resolve artwork for a batch of anime entries.
   * Cross-references AniList and MAL IDs to ensure official high-res cover art.
   */
  static async validateAndRepairBatch(items = []) {
    if (!Array.isArray(items) || items.length === 0) return items;

    console.log(`[ArtworkManager] Validating & repairing artwork for batch of ${items.length} items...`);
    const processed = [];

    for (const item of items) {
      try {
        const resolved = await resolveItemArtwork(item);
        processed.push(resolved);
      } catch (err) {
        console.error(`[ArtworkManager] Error processing ${item.title || item.id}:`, err);
        processed.push(item);
      }
    }

    return processed;
  }

  /**
   * Scan entire catalogue and repair missing or unverified artwork in background.
   */
  static async scanAndRepairCatalogue(batchSize = 50) {
    console.log(`[ArtworkManager] Initiating full catalogue scan & repair (batch size: ${batchSize})...`);
    const report = await scanArtwork();

    if (report.pendingRepairs > 0 || report.missingArtwork > 0 || report.brokenArtwork > 0) {
      console.log(`[ArtworkManager] Found ${report.pendingRepairs} pending repairs / ${report.missingArtwork} missing artwork. Executing repair...`);
      return await repairMissingArtwork(batchSize);
    }

    return report;
  }

  /**
   * Resolve artwork for a single anime item.
   */
  static async resolveSingle(item) {
    return await resolveItemArtwork(item);
  }

  /**
   * Force retry for failed or unavailable artwork entries.
   */
  static async retryFailed() {
    return await retryFailedArtwork();
  }

  /**
   * Run full batched audit across production database.
   */
  static async runAudit(batchSize = 50) {
    return await runFullArtworkAuditBatch(batchSize);
  }

  /**
   * Get current Artwork Manager status metrics.
   */
  static async getStatus() {
    return await getArtworkManagerStatus();
  }
}

export default ArtworkManager;
