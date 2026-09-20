import fs from 'node:fs';
import path from 'node:path';

/**
 * ANIVAULT — PERMANENT AUTOMATIC ARTWORK MANAGER & VALIDATION PIPELINE
 * 
 * Rules:
 * 1. An artwork URL is ONLY verified if the actual image can be successfully retrieved (HTTP 200 + image Content-Type).
 * 2. Never trust `isVerified = true` by itself. Dead/invalid URLs must be repaired.
 * 3. Store exact URLs returned by AniList or MAL metadata APIs — never construct, guess, or invent CDN URLs.
 * 4. Exact AniList ID lookup -> Exact MAL ID lookup -> Title search last resort.
 * 5. Invalid cached URLs are purged from cache and re-resolved.
 * 6. Placeholders use `isVerified = false` and `artworkStatus = 'pending'`.
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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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

/**
 * IMAGE URL HEALTH CHECK FUNCTION
 * Determines whether a URL is reachable and returns a valid image.
 */
export async function validateArtworkUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  if (trimmed.includes('unsplash.com')) return false; // Unsplash is placeholder, not verified artwork

  try {
    // 1. HEAD request for fast HTTP check
    const headRes = await fetch(trimmed, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(3500)
    });

    if (headRes.ok) {
      const type = headRes.headers.get('content-type') || '';
      if (type.includes('image') || type.includes('octet-stream')) {
        return true;
      }
    }

    // 2. GET request fallback if HEAD returns 405/403 or non-standard headers
    const getRes = await fetch(trimmed, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(4000)
    });

    if (getRes.ok) {
      const type = getRes.headers.get('content-type') || '';
      return type.includes('image') || type.includes('octet-stream');
    }

    return false;
  } catch {
    return false;
  }
}

// 1. ANILIST GRAPHQL LOOKUP WITH RATE LIMIT HANDLING & RETRY
async function fetchAniListArtwork(aniListId, malId, title) {
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
  else if (title) variables.search = cleanTitleForSearch(title);
  else return null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AniVaultApp/1.0'
        },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(6000)
      });

      if (res.status === 429) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      if (!res.ok) return null;

      const json = await res.json();
      if (json.data && json.data.Media) {
        const media = json.data.Media;
        const cover = media.coverImage?.extraLarge || media.coverImage?.large || media.coverImage?.medium;
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
      await sleep(500);
    }
  }
  return null;
}

// 2. MAL / JIKAN LOOKUP
async function fetchMalArtwork(malId, title) {
  try {
    let url = null;
    if (malId) {
      url = `https://api.jikan.moe/v4/anime/${malId}`;
    } else if (title) {
      url = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(cleanTitleForSearch(title))}&limit=1`;
    } else {
      return null;
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'AniVaultApp/1.0' },
      signal: AbortSignal.timeout(5000)
    });
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

// 3. KITSU FALLBACK LOOKUP
async function fetchKitsuArtwork(title) {
  if (!title) return null;
  const clean = cleanTitleForSearch(title);
  if (!clean) return null;

  try {
    const url = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(clean)}&page[limit]=1`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.api+json',
        'User-Agent': 'AniVaultApp/1.0'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) return null;
    const json = await res.json();
    const poster = json.data?.[0]?.attributes?.posterImage?.large || json.data?.[0]?.attributes?.posterImage?.original || json.data?.[0]?.attributes?.posterImage?.medium;

    if (poster) {
      return {
        verifiedArtworkUrl: poster,
        source: 'KITSU_OFFICIAL_CDN'
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Helpers for cache & queue
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
 * CORE ITEM ARTWORK RESOLUTION & VALIDATION ENGINE
 */
export async function resolveItemArtwork(item, forceRefresh = false) {
  if (!item || !item.id) return item;

  const cache = getCache();
  const cacheKey = item.id;

  // 1. Check cache first IF not forceRefresh
  if (!forceRefresh && cache[cacheKey]) {
    const cachedArt = cache[cacheKey];
    const cachedUrl = typeof cachedArt === 'string' ? cachedArt : cachedArt?.verifiedArtworkUrl || cachedArt?.artworkUrl;

    if (cachedArt.isVerified && cachedUrl) {
      // Validate cached URL — DO NOT TRUST BLINDLY!
      const isValidCached = await validateArtworkUrl(cachedUrl);
      if (isValidCached) {
        item.artwork = {
          mediaId: item.id,
          animeId: item.id,
          anilistId: cachedArt.anilistId || item.aniListId || null,
          malId: cachedArt.malId || item.malId || null,
          verifiedArtworkUrl: cachedUrl,
          artworkUrl: cachedUrl,
          isVerified: true,
          verificationSource: cachedArt.verificationSource || 'OFFICIAL_CDN_CACHE',
          aspectRatio: '3/4',
          artworkStatus: 'verified',
          lastVerified: new Date().toISOString()
        };
        if (cachedArt.anilistId) item.aniListId = cachedArt.anilistId;
        if (cachedArt.malId) item.malId = cachedArt.malId;
        return item;
      } else {
        // Cache contains dead URL -> Delete entry and re-resolve fresh!
        delete cache[cacheKey];
        saveCache(cache);
      }
    }
  }

  // 2. Check item's current artwork property
  const currentUrl = typeof item.artwork === 'string' ? item.artwork : item.artwork?.verifiedArtworkUrl || item.artwork?.artworkUrl;
  if (!forceRefresh && item.artwork?.isVerified && currentUrl) {
    const isValidCurrent = await validateArtworkUrl(currentUrl);
    if (isValidCurrent) {
      const verifiedArt = {
        mediaId: item.id,
        animeId: item.id,
        anilistId: item.aniListId || null,
        malId: item.malId || null,
        providerId: item.providerId || null,
        verifiedArtworkUrl: currentUrl,
        artworkUrl: currentUrl,
        isVerified: true,
        verificationSource: item.artwork?.verificationSource || 'VERIFIED_ON_RECORD',
        aspectRatio: '3/4',
        artworkStatus: 'verified',
        lastVerified: new Date().toISOString()
      };
      cache[cacheKey] = verifiedArt;
      saveCache(cache);
      item.artwork = verifiedArt;
      return item;
    }
  }

  // 3. Re-resolve using EXACT AniList ID first
  if (item.aniListId) {
    const aniListResult = await fetchAniListArtwork(item.aniListId, null, null);
    if (aniListResult && aniListResult.verifiedArtworkUrl) {
      const isValidAniList = await validateArtworkUrl(aniListResult.verifiedArtworkUrl);
      if (isValidAniList) {
        const verifiedArt = {
          mediaId: item.id,
          animeId: item.id,
          anilistId: aniListResult.aniListId || item.aniListId || null,
          malId: aniListResult.malId || item.malId || null,
          providerId: item.providerId || null,
          verifiedArtworkUrl: aniListResult.verifiedArtworkUrl,
          artworkUrl: aniListResult.verifiedArtworkUrl,
          isVerified: true,
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
    }
  }

  // 4. Try MAL / Jikan ID second
  if (item.malId) {
    const aniListMalResult = await fetchAniListArtwork(null, item.malId, null);
    if (aniListMalResult && aniListMalResult.verifiedArtworkUrl) {
      const isValidAniListMal = await validateArtworkUrl(aniListMalResult.verifiedArtworkUrl);
      if (isValidAniListMal) {
        const verifiedArt = {
          mediaId: item.id,
          animeId: item.id,
          anilistId: aniListMalResult.aniListId || item.aniListId || null,
          malId: aniListMalResult.malId || item.malId || null,
          providerId: item.providerId || null,
          verifiedArtworkUrl: aniListMalResult.verifiedArtworkUrl,
          artworkUrl: aniListMalResult.verifiedArtworkUrl,
          isVerified: true,
          verificationSource: 'ANILIST_MAL_ID_GRAPHQL_OFFICIAL_CDN',
          aspectRatio: '3/4',
          artworkStatus: 'verified',
          lastVerified: new Date().toISOString(),
          retryCount: 0
        };

        cache[cacheKey] = verifiedArt;
        saveCache(cache);
        item.artwork = verifiedArt;
        if (aniListMalResult.aniListId) item.aniListId = aniListMalResult.aniListId;
        if (aniListMalResult.malId) item.malId = aniListMalResult.malId;
        return item;
      }
    }

    const malResult = await fetchMalArtwork(item.malId, null);
    if (malResult && malResult.verifiedArtworkUrl) {
      const isValidMal = await validateArtworkUrl(malResult.verifiedArtworkUrl);
      if (isValidMal) {
        const verifiedArt = {
          mediaId: item.id,
          animeId: item.id,
          anilistId: item.aniListId || null,
          malId: malResult.malId || item.malId || null,
          providerId: item.providerId || null,
          verifiedArtworkUrl: malResult.verifiedArtworkUrl,
          artworkUrl: malResult.verifiedArtworkUrl,
          isVerified: true,
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
    }
  }

  // 5. Title search as last resort
  const titleAniListResult = await fetchAniListArtwork(null, null, item.title);
  if (titleAniListResult && titleAniListResult.verifiedArtworkUrl) {
    const isValidTitleAniList = await validateArtworkUrl(titleAniListResult.verifiedArtworkUrl);
    if (isValidTitleAniList) {
      const verifiedArt = {
        mediaId: item.id,
        animeId: item.id,
        anilistId: titleAniListResult.aniListId || item.aniListId || null,
        malId: titleAniListResult.malId || item.malId || null,
        providerId: item.providerId || null,
        verifiedArtworkUrl: titleAniListResult.verifiedArtworkUrl,
        artworkUrl: titleAniListResult.verifiedArtworkUrl,
        isVerified: true,
        verificationSource: 'ANILIST_TITLE_SEARCH_OFFICIAL_CDN',
        aspectRatio: '3/4',
        artworkStatus: 'verified',
        lastVerified: new Date().toISOString(),
        retryCount: 0
      };

      cache[cacheKey] = verifiedArt;
      saveCache(cache);
      item.artwork = verifiedArt;
      if (titleAniListResult.aniListId) item.aniListId = titleAniListResult.aniListId;
      if (titleAniListResult.malId) item.malId = titleAniListResult.malId;
      return item;
    }
  }

  const kitsuResult = await fetchKitsuArtwork(item.title);
  if (kitsuResult && kitsuResult.verifiedArtworkUrl) {
    const isValidKitsu = await validateArtworkUrl(kitsuResult.verifiedArtworkUrl);
    if (isValidKitsu) {
      const verifiedArt = {
        mediaId: item.id,
        animeId: item.id,
        anilistId: item.aniListId || null,
        malId: item.malId || null,
        providerId: item.providerId || null,
        verifiedArtworkUrl: kitsuResult.verifiedArtworkUrl,
        artworkUrl: kitsuResult.verifiedArtworkUrl,
        isVerified: true,
        verificationSource: 'KITSU_OFFICIAL_CDN',
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
  }

  // 6. If all lookups fail, mark as pending placeholder and add to retry queue
  const queue = getRetryQueue();
  const existingIndex = queue.findIndex(q => q.animeId === item.id || q.mediaId === item.id);
  const currentRetryCount = existingIndex !== -1 ? (queue[existingIndex].retryCount || 0) + 1 : 0;

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
    if (existingIndex !== -1) queue[existingIndex] = queueEntry;
    else queue.push(queueEntry);
    saveRetryQueue(queue);

    item.artwork = {
      mediaId: item.id,
      animeId: item.id,
      verifiedArtworkUrl: DEFAULT_PLACEHOLDER,
      artworkUrl: DEFAULT_PLACEHOLDER,
      isVerified: false,
      artworkStatus: 'pending',
      verificationSource: 'ANIVAULT_PLACEHOLDER_RETRY_PENDING',
      aspectRatio: '3/4',
      lastVerified: new Date().toISOString(),
      retryCount: currentRetryCount
    };
  } else {
    item.artwork = {
      mediaId: item.id,
      animeId: item.id,
      verifiedArtworkUrl: DEFAULT_PLACEHOLDER,
      artworkUrl: DEFAULT_PLACEHOLDER,
      isVerified: false,
      artworkStatus: 'unavailable',
      verificationSource: 'ANIVAULT_PLACEHOLDER_UNAVAILABLE',
      aspectRatio: '3/4',
      lastVerified: new Date().toISOString(),
      retryCount: currentRetryCount
    };
  }

  return item;
}

/**
 * SCAN ENTIRE CATALOGUE & AUDIT IMAGE URL HEALTH
 */
export async function scanArtwork() {
  const catalogue = loadMasterCatalogue();
  const queue = getRetryQueue();

  let totalMedia = catalogue.length;
  let verifiedCount = 0;
  let repairedCount = 0;
  let deadRemovedCount = 0;
  let missingCount = 0;
  let brokenCount = 0;
  let pendingCount = 0;
  let unavailableCount = 0;

  for (const item of catalogue) {
    const art = item.artwork;
    const url = typeof art === 'string' ? art : art?.verifiedArtworkUrl || art?.artworkUrl;
    const isUnsplash = url && url.includes('unsplash.com');

    if (!url || isUnsplash || !art?.isVerified) {
      missingCount++;
      if (art?.artworkStatus === 'unavailable') {
        unavailableCount++;
      } else {
        pendingCount++;
      }
    } else {
      // Test URL validity
      const isValid = await validateArtworkUrl(url);
      if (isValid) {
        verifiedCount++;
        if (art?.verificationSource === 'ANILIST_GRAPHQL_OFFICIAL_CDN' || art?.verificationSource === 'MAL_JIKAN_OFFICIAL_CDN' || art?.verificationSource === 'KITSU_OFFICIAL_CDN') {
          repairedCount++;
        }
      } else {
        // Dead/invalid URL detected!
        deadRemovedCount++;
        brokenCount++;
        pendingCount++;
        item.artwork = {
          ...art,
          isVerified: false,
          artworkStatus: 'pending',
          verifiedArtworkUrl: DEFAULT_PLACEHOLDER
        };

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
      }
    }
  }

  saveRetryQueue(queue);

  const auditReport = {
    totalCatalogue: totalMedia,
    totalMedia,
    validArtwork: verifiedCount,
    verifiedArtwork: verifiedCount,
    artworkRepaired: repairedCount,
    deadArtworkUrlsRemoved: deadRemovedCount,
    missingArtwork: missingCount,
    brokenArtwork: brokenCount,
    stillPending: pendingCount,
    pendingRepairs: pendingCount,
    currentlyRepairing: isCurrentlyRepairing,
    successfullyRepaired: repairedCount,
    unavailable: unavailableCount,
    permanentlyUnavailable: unavailableCount,
    lastArtworkCheck: new Date().toISOString()
  };

  fs.mkdirSync(path.dirname(AUDIT_REPORT_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(CLIENT_AUDIT_REPORT_FILE), { recursive: true });

  fs.writeFileSync(AUDIT_REPORT_FILE, JSON.stringify(auditReport, null, 2));
  fs.writeFileSync(CLIENT_AUDIT_REPORT_FILE, JSON.stringify(auditReport, null, 2));

  return auditReport;
}

/**
 * REPAIR CATALOGUE ARTWORK IN BATCHES
 */
export async function repairMissingArtwork(batchSize = 25) {
  isCurrentlyRepairing = true;
  const catalogue = loadMasterCatalogue();

  // Find all items needing repair (unverified, dead URL, or in retry queue)
  const itemsNeedingRepair = [];
  for (const item of catalogue) {
    const url = typeof item.artwork === 'string' ? item.artwork : item.artwork?.verifiedArtworkUrl || item.artwork?.artworkUrl;
    const isUnsplash = url && url.includes('unsplash.com');

    if (!item.artwork?.isVerified || !url || isUnsplash || item.artwork?.artworkStatus === 'pending') {
      itemsNeedingRepair.push(item);
    } else {
      // Quick check if URL is valid
      const isValid = await validateArtworkUrl(url);
      if (!isValid) {
        itemsNeedingRepair.push(item);
      }
    }
  }

  console.log(`[Artwork Manager] Repairing artwork for ${Math.min(batchSize, itemsNeedingRepair.length)} entries out of ${itemsNeedingRepair.length} needing repair...`);

  const batch = itemsNeedingRepair.slice(0, batchSize);
  let updatedCount = 0;

  for (const item of batch) {
    const resolved = await resolveItemArtwork(item, true); // forceRefresh
    if (resolved.artwork?.isVerified) {
      updatedCount++;
    }
    await sleep(300); // Friendly pause between requests
  }

  if (updatedCount > 0) {
    saveMasterCatalogue(catalogue);
  }

  isCurrentlyRepairing = false;
  return await scanArtwork();
}

/**
 * RESET RETRY COUNTS AND RETRY ALL UNVERIFIED / FAILED ARTWORK
 */
export async function retryFailedArtwork() {
  const catalogue = loadMasterCatalogue();
  const queue = [];

  for (const item of catalogue) {
    const url = typeof item.artwork === 'string' ? item.artwork : item.artwork?.verifiedArtworkUrl;
    const isUnsplash = url && url.includes('unsplash.com');

    if (!item.artwork?.isVerified || isUnsplash || item.artwork?.artworkStatus === 'pending' || item.artwork?.artworkStatus === 'unavailable') {
      item.artwork = {
        mediaId: item.id,
        animeId: item.id,
        verifiedArtworkUrl: DEFAULT_PLACEHOLDER,
        artworkUrl: DEFAULT_PLACEHOLDER,
        isVerified: false,
        artworkStatus: 'pending',
        lastVerified: new Date().toISOString(),
        retryCount: 0
      };
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
  }

  saveRetryQueue(queue);
  saveMasterCatalogue(catalogue);

  return await repairMissingArtwork(50);
}

/**
 * RUN FULL CATALOGUE ARTWORK REPAIR
 */
export async function runFullArtworkAuditBatch(batchSize = 50) {
  return await repairMissingArtwork(batchSize);
}

export async function processArtworkRetryQueue() {
  return await repairMissingArtwork(25);
}

export async function runArtworkAudit() {
  return await scanArtwork();
}

export async function getArtworkManagerStatus() {
  return await scanArtwork();
}

