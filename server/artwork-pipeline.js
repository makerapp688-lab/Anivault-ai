import fs from 'node:fs';
import path from 'node:path';

/**
 * ANIVAULT — PERMANENT AUTOMATIC ARTWORK MANAGER & RESOLUTION PIPELINE
 * 
 * Hierarchy:
 * 1. RareToon thumbnail (when legitimately available & valid image)
 * 2. AniList GraphQL API (exact AniList ID -> coverImage.extraLarge / large)
 * 3. MAL / Jikan API (exact MAL ID -> images.jpg.large_image_url)
 * 4. AniVault Placeholder (artworkStatus = 'unavailable')
 * 
 * Stores 1-to-1 binding:
 * AniVault Media ID <-> AniList ID <-> MAL ID <-> Provider ID <-> Artwork URL
 */

const PROD_FILE = path.join(process.cwd(), 'server', 'data', 'anivault-catalogue.json');
const CLIENT_PROD_FILE = path.join(process.cwd(), 'src', 'data', 'anivault-catalogue.json');
const SEED_FILE = path.join(process.cwd(), 'scripts', 'master-seed-catalogue.json');
const ARTWORK_CACHE_FILE = path.join(process.cwd(), 'server', 'data', 'artwork-cache.json');
const RETRY_QUEUE_FILE = path.join(process.cwd(), 'server', 'data', 'artwork-retry-queue.json');
const AUDIT_REPORT_FILE = path.join(process.cwd(), 'server', 'data', 'artwork-audit-report.json');
const CLIENT_AUDIT_REPORT_FILE = path.join(process.cwd(), 'src', 'data', 'artwork-audit-report.json');

const DEFAULT_PLACEHOLDER = 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80';

let isCurrentlyRepairing = false;

function cleanTitleForSearch(title) {
  if (!title) return '';
  return title
    .replace(/\s+season\s+\d+/i, '')
    .replace(/\s+part\s+\d+/i, '')
    .replace(/\s+cour\s+\d+/i, '')
    .replace(/hindi\s+dubbed.*/i, '')
    .replace(/download.*/i, '')
    .replace(/episodes.*/i, '')
    .replace(/hd.*/i, '')
    .trim();
}

// 1. ANILIST GRAPHQL LOOKUP
async function fetchAniListArtwork(title, malId, aniListId) {
  const query = `
    query ($id: Int, $idMal: Int, $search: String) {
      Media (id: $id, idMal: $idMal, search: $search, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          medium
        }
      }
    }
  `;

  const variables = {};
  if (aniListId) variables.id = Number(aniListId);
  else if (malId) variables.idMal = Number(malId);
  else variables.search = cleanTitleForSearch(title);

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) return null;
    const json = await res.json();
    if (json.data && json.data.Media) {
      const media = json.data.Media;
      const cover = media.coverImage?.extraLarge || media.coverImage?.large;
      if (cover) {
        return {
          verifiedArtworkUrl: cover,
          aniListId: media.id,
          malId: media.idMal,
          source: 'ANILIST_GRAPHQL_OFFICIAL_CDN'
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}

// 2. MAL / JIKAN LOOKUP
async function fetchMalArtwork(malId, title) {
  try {
    const url = malId
      ? `https://api.jikan.moe/v4/anime/${malId}`
      : `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitleForSearch(title))}&limit=1`;

    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const json = await res.json();
    const anime = Array.isArray(json.data) ? json.data[0] : json.data;

    if (anime && anime.images?.jpg?.large_image_url) {
      return {
        verifiedArtworkUrl: anime.images.jpg.large_image_url,
        malId: anime.mal_id,
        source: 'MAL_JIKAN_OFFICIAL_CDN'
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Helper: load & save cache
function getCache() {
  if (fs.existsSync(ARTWORK_CACHE_FILE)) {
    try { return JSON.parse(fs.readFileSync(ARTWORK_CACHE_FILE, 'utf-8')); } catch {}
  }
  return {};
}

function saveCache(cache) {
  fs.mkdirSync(path.dirname(ARTWORK_CACHE_FILE), { recursive: true });
  fs.writeFileSync(ARTWORK_CACHE_FILE, JSON.stringify(cache, null, 2));
}

// Helper: load & save retry queue
function getRetryQueue() {
  if (fs.existsSync(RETRY_QUEUE_FILE)) {
    try { return JSON.parse(fs.readFileSync(RETRY_QUEUE_FILE, 'utf-8')); } catch {}
  }
  return [];
}

function saveRetryQueue(queue) {
  fs.mkdirSync(path.dirname(RETRY_QUEUE_FILE), { recursive: true });
  fs.writeFileSync(RETRY_QUEUE_FILE, JSON.stringify(queue, null, 2));
}

// Helper: load current catalogue
function loadMasterCatalogue() {
  let catalogue = [];
  const candidatePaths = [PROD_FILE, SEED_FILE, CLIENT_PROD_FILE];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(p, 'utf-8'));
        if (Array.isArray(parsed) && parsed.length > catalogue.length) {
          catalogue = parsed;
        }
      } catch {}
    }
  }
  return catalogue;
}

function saveMasterCatalogue(catalogue) {
  fs.mkdirSync(path.dirname(PROD_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(CLIENT_PROD_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(SEED_FILE), { recursive: true });

  fs.writeFileSync(PROD_FILE, JSON.stringify(catalogue, null, 2));
  fs.writeFileSync(CLIENT_PROD_FILE, JSON.stringify(catalogue, null, 2));
  fs.writeFileSync(SEED_FILE, JSON.stringify(catalogue, null, 2));
}

/**
 * Single Item Artwork Resolution Function
 */
export async function resolveItemArtwork(item) {
  if (!item || !item.id) return item;

  const cache = getCache();
  const cacheKey = item.id;

  // 1. Check cache first
  if (cache[cacheKey] && cache[cacheKey].isVerified) {
    item.artwork = cache[cacheKey];
    if (cache[cacheKey].anilistId) item.aniListId = cache[cacheKey].anilistId;
    if (cache[cacheKey].malId) item.malId = cache[cacheKey].malId;
    return item;
  }

  // 2. Check if item already has legitimate verified non-placeholder artwork
  const currentUrl = typeof item.artwork === 'string' ? item.artwork : item.artwork?.verifiedArtworkUrl;
  const isUnsplash = currentUrl && currentUrl.includes('unsplash.com');
  const isPlaceholder = !currentUrl || isUnsplash || item.artwork?.isVerified === false;

  if (!isPlaceholder && currentUrl) {
    const verifiedArt = {
      mediaId: item.id,
      animeId: item.id,
      anilistId: item.aniListId || null,
      malId: item.malId || null,
      providerId: item.providerId || item.providerAnimeId || null,
      artworkUrl: currentUrl,
      verifiedArtworkUrl: currentUrl,
      isVerified: true,
      artworkSource: item.artwork?.verificationSource || 'RARETOON_CANONICAL_POST_THUMBNAIL',
      verificationSource: item.artwork?.verificationSource || 'RARETOON_CANONICAL_POST_THUMBNAIL',
      aspectRatio: '3/4',
      artworkStatus: 'verified',
      lastVerified: new Date().toISOString(),
      retryCount: 0
    };

    cache[cacheKey] = verifiedArt;
    saveCache(cache);
    item.artwork = verifiedArt;
    return item;
  }

  // 3. Level 2 Fallback: AniList GraphQL
  const aniListResult = await fetchAniListArtwork(item.title, item.malId, item.aniListId);
  if (aniListResult) {
    const verifiedArt = {
      mediaId: item.id,
      animeId: item.id,
      anilistId: aniListResult.aniListId,
      malId: aniListResult.malId || item.malId || null,
      providerId: item.providerId || item.providerAnimeId || null,
      artworkUrl: aniListResult.verifiedArtworkUrl,
      verifiedArtworkUrl: aniListResult.verifiedArtworkUrl,
      isVerified: true,
      artworkSource: 'ANILIST_GRAPHQL_OFFICIAL_CDN',
      verificationSource: 'ANILIST_GRAPHQL_OFFICIAL_CDN',
      aspectRatio: '3/4',
      artworkStatus: 'verified',
      lastVerified: new Date().toISOString(),
      retryCount: 0
    };

    cache[cacheKey] = verifiedArt;
    saveCache(cache);
    item.artwork = verifiedArt;
    if (aniListResult.aniListId) item.aniListId = aniListResult.aniListId;
    if (aniListResult.malId) item.malId = aniListResult.malId;
    return item;
  }

  // 4. Level 3 Fallback: MAL / Jikan API
  const malResult = await fetchMalArtwork(item.malId, item.title);
  if (malResult) {
    const verifiedArt = {
      mediaId: item.id,
      animeId: item.id,
      anilistId: item.aniListId || null,
      malId: malResult.malId,
      providerId: item.providerId || item.providerAnimeId || null,
      artworkUrl: malResult.verifiedArtworkUrl,
      verifiedArtworkUrl: malResult.verifiedArtworkUrl,
      isVerified: true,
      artworkSource: 'MAL_JIKAN_OFFICIAL_CDN',
      verificationSource: 'MAL_JIKAN_OFFICIAL_CDN',
      aspectRatio: '3/4',
      artworkStatus: 'verified',
      lastVerified: new Date().toISOString(),
      retryCount: 0
    };

    cache[cacheKey] = verifiedArt;
    saveCache(cache);
    item.artwork = verifiedArt;
    if (malResult.malId) item.malId = malResult.malId;
    return item;
  }

  // 5. Level 4: Add to Retry Queue if failed
  const queue = getRetryQueue();
  const existingQueueIndex = queue.findIndex(q => q.animeId === item.id || q.mediaId === item.id);

  let currentRetryCount = 0;
  if (existingQueueIndex !== -1) {
    currentRetryCount = (queue[existingQueueIndex].retryCount || 0) + 1;
  }

  if (currentRetryCount < 3) {
    const queueEntry = {
      mediaId: item.id,
      animeId: item.id,
      title: item.title,
      malId: item.malId || null,
      aniListId: item.aniListId || null,
      retryCount: currentRetryCount,
      lastTriedAt: new Date().toISOString()
    };

    if (existingQueueIndex !== -1) queue[existingQueueIndex] = queueEntry;
    else queue.push(queueEntry);
    saveRetryQueue(queue);

    item.artwork = {
      mediaId: item.id,
      animeId: item.id,
      artworkUrl: DEFAULT_PLACEHOLDER,
      verifiedArtworkUrl: DEFAULT_PLACEHOLDER,
      isVerified: false,
      artworkSource: 'ANIVAULT_PLACEHOLDER_RETRY_PENDING',
      verificationSource: 'ANIVAULT_PLACEHOLDER_RETRY_PENDING',
      aspectRatio: '3/4',
      artworkStatus: 'pending',
      lastVerified: new Date().toISOString(),
      retryCount: currentRetryCount
    };
  } else {
    // Exceeded 3 retries -> genuinely unavailable
    item.artwork = {
      mediaId: item.id,
      animeId: item.id,
      artworkUrl: DEFAULT_PLACEHOLDER,
      verifiedArtworkUrl: DEFAULT_PLACEHOLDER,
      isVerified: false,
      artworkSource: 'ANIVAULT_PLACEHOLDER_UNAVAILABLE',
      verificationSource: 'ANIVAULT_PLACEHOLDER_UNAVAILABLE',
      aspectRatio: '3/4',
      artworkStatus: 'unavailable',
      lastVerified: new Date().toISOString(),
      retryCount: currentRetryCount
    };
  }

  return item;
}

/**
 * Scan entire catalogue for missing, broken, or placeholder artwork.
 * Enqueues items that require repair and builds comprehensive status report.
 */
export async function scanArtwork() {
  const catalogue = loadMasterCatalogue();
  const queue = getRetryQueue();

  let missingCount = 0;
  let brokenCount = 0;
  let placeholderCount = 0;
  let verifiedCount = 0;
  let repairedCount = 0;
  let pendingCount = 0;
  let unavailableCount = 0;
  let failedAttempts = 0;

  for (const item of catalogue) {
    const art = item.artwork;
    const url = typeof art === 'string' ? art : art?.verifiedArtworkUrl || art?.artworkUrl;
    const isUnsplash = url && url.includes('unsplash.com');
    const isMissing = !url || url.trim() === '';
    const isBroken = url && !url.startsWith('http');

    if (isMissing) {
      missingCount++;
    } else if (isBroken) {
      brokenCount++;
    } else if (isUnsplash || art?.isVerified === false || art?.artworkStatus === 'pending') {
      placeholderCount++;
    }

    if (art?.isVerified && url && !isUnsplash && !isBroken) {
      verifiedCount++;
      if (art?.verificationSource === 'ANILIST_GRAPHQL_OFFICIAL_CDN' || art?.verificationSource === 'MAL_JIKAN_OFFICIAL_CDN') {
        repairedCount++;
      }
    } else if (art?.artworkStatus === 'pending' || isMissing || isBroken || isUnsplash) {
      // Enqueue if not already in queue
      const existingInQueue = queue.find(q => q.animeId === item.id || q.mediaId === item.id);
      if (!existingInQueue) {
        queue.push({
          mediaId: item.id,
          animeId: item.id,
          title: item.title,
          malId: item.malId || null,
          aniListId: item.aniListId || null,
          retryCount: 0,
          lastTriedAt: new Date().toISOString()
        });
      }
      if (existingInQueue && existingInQueue.retryCount >= 3) {
        unavailableCount++;
      } else {
        pendingCount++;
      }
    } else {
      unavailableCount++;
    }
  }

  saveRetryQueue(queue);

  for (const q of queue) {
    failedAttempts += (q.retryCount || 0);
  }

  const statusReport = {
    totalMedia: catalogue.length,
    verifiedArtwork: verifiedCount,
    missingArtwork: missingCount,
    brokenArtwork: brokenCount,
    pendingRepairs: pendingCount,
    currentlyRepairing: isCurrentlyRepairing,
    successfullyRepaired: repairedCount,
    permanentlyUnavailable: unavailableCount,
    failedAttempts,
    lastArtworkCheck: new Date().toISOString()
  };

  fs.mkdirSync(path.dirname(AUDIT_REPORT_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(CLIENT_AUDIT_REPORT_FILE), { recursive: true });

  fs.writeFileSync(AUDIT_REPORT_FILE, JSON.stringify(statusReport, null, 2));
  fs.writeFileSync(CLIENT_AUDIT_REPORT_FILE, JSON.stringify(statusReport, null, 2));

  return statusReport;
}

/**
 * Process pending artwork repair queue in batches
 */
export async function repairMissingArtwork(batchSize = 25) {
  isCurrentlyRepairing = true;
  const queue = getRetryQueue();
  if (queue.length === 0) {
    isCurrentlyRepairing = false;
    return await scanArtwork();
  }

  console.log(`[Artwork Manager] Repairing missing artwork for ${Math.min(batchSize, queue.length)} queued entries...`);

  const catalogue = loadMasterCatalogue();
  const batch = queue.splice(0, batchSize);
  const remainingQueue = [...queue];

  let updatedCount = 0;

  for (const qEntry of batch) {
    const item = catalogue.find(a => a.id === qEntry.animeId || a.id === qEntry.mediaId);
    if (!item) continue;

    const resolved = await resolveItemArtwork(item);
    if (resolved.artwork?.isVerified) {
      updatedCount++;
    } else if ((resolved.artwork?.retryCount || 0) < 3) {
      remainingQueue.push({
        ...qEntry,
        retryCount: (resolved.artwork?.retryCount || (qEntry.retryCount || 0) + 1)
      });
    }
  }

  saveRetryQueue(remainingQueue);

  if (updatedCount > 0) {
    saveMasterCatalogue(catalogue);
  }

  isCurrentlyRepairing = false;
  return await scanArtwork();
}

/**
 * Reset failed attempts and re-enqueue for retry
 */
export async function retryFailedArtwork() {
  const catalogue = loadMasterCatalogue();
  const newQueue = [];

  for (const item of catalogue) {
    const art = item.artwork;
    const url = typeof art === 'string' ? art : art?.verifiedArtworkUrl;
    const isUnsplash = url && url.includes('unsplash.com');

    if (!art?.isVerified || isUnsplash || art?.artworkStatus === 'pending' || art?.artworkStatus === 'unavailable') {
      newQueue.push({
        mediaId: item.id,
        animeId: item.id,
        title: item.title,
        malId: item.malId || null,
        aniListId: item.aniListId || null,
        retryCount: 0,
        lastTriedAt: new Date().toISOString()
      });
      item.artwork = {
        ...item.artwork,
        artworkStatus: 'pending',
        retryCount: 0
      };
    }
  }

  saveRetryQueue(newQueue);
  saveMasterCatalogue(catalogue);

  return await repairMissingArtwork(50);
}

/**
 * Run full artwork audit in batches across entire catalogue
 */
export async function runFullArtworkAuditBatch(batchSize = 50) {
  const catalogue = loadMasterCatalogue();
  console.log(`[Artwork Audit] Running batched audit across ${catalogue.length} catalogue records (batch size: ${batchSize})...`);

  for (let i = 0; i < catalogue.length; i += batchSize) {
    const batch = catalogue.slice(i, i + batchSize);
    for (const item of batch) {
      const url = typeof item.artwork === 'string' ? item.artwork : item.artwork?.verifiedArtworkUrl;
      const isUnsplash = url && url.includes('unsplash.com');

      if (!item.artwork || !url || isUnsplash || item.artwork?.isVerified === false) {
        if (!item.artwork?.artworkStatus) {
          item.artwork = {
            mediaId: item.id,
            animeId: item.id,
            verifiedArtworkUrl: url || DEFAULT_PLACEHOLDER,
            artworkUrl: url || DEFAULT_PLACEHOLDER,
            isVerified: false,
            artworkStatus: 'pending',
            artworkSource: 'ANIVAULT_PLACEHOLDER_RETRY_PENDING',
            lastVerified: new Date().toISOString(),
            retryCount: 0
          };
        }
      }
    }
  }

  saveMasterCatalogue(catalogue);
  return await scanArtwork();
}

/**
 * Backwards compatibility export
 */
export async function processArtworkRetryQueue() {
  return await repairMissingArtwork(25);
}

export async function runArtworkAudit() {
  return await scanArtwork();
}

export async function getArtworkManagerStatus() {
  return await scanArtwork();
}
