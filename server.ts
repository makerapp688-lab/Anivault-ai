import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { runIngestion } from './server/raretoon-ingest.js';
import { fullImporter } from './server/raretoon-full-importer.js';
import { ArtworkManager } from './server/artwork-manager.js';
import {
  scanArtwork,
  repairMissingArtwork,
  retryFailedArtwork,
  runFullArtworkAuditBatch,
  getArtworkManagerStatus
} from './server/artwork-pipeline.js';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache for catalogue
let catalogueCache: any[] = [];
let statsCache: any = null;
let isSyncing = false;
let syncMessage = 'Idle';
let lastSyncTimestamp = new Date().toISOString();

function loadCatalogue() {
  try {
    const dataPath = path.join(process.cwd(), 'server', 'data', 'anivault-catalogue.json');
    const statsPath = path.join(process.cwd(), 'server', 'data', 'sync-report.json');

    if (fs.existsSync(dataPath)) {
      catalogueCache = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    }
    if (fs.existsSync(statsPath)) {
      statsCache = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    }
    console.log(`[AniVault DB] Loaded ${catalogueCache.length} anime entries into memory.`);
  } catch (err: any) {
    console.error('[AniVault DB] Error loading catalogue:', err.message);
  }
}

// Initial load
loadCatalogue();

// API ROUTES FIRST
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'AniVault',
    totalAnime: catalogueCache.length,
    activeProvider: 'RareToon India (RareAnimes)',
    providerUrl: 'https://www.rareanimes.mov/home/'
  });
});

app.get('/api/stats', (req, res) => {
  if (!statsCache) {
    loadCatalogue();
  }
  res.json({
    stats: statsCache,
    totalAnime: catalogueCache.length,
    lastSyncTimestamp
  });
});

app.get('/api/genres', (req, res) => {
  const counts: Record<string, number> = {};
  for (const item of catalogueCache) {
    if (Array.isArray(item.genres)) {
      for (const g of item.genres) {
        counts[g] = (counts[g] || 0) + 1;
      }
    }
  }
  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([genre, count]) => ({ genre, count }));

  res.json({ genres: sorted });
});

app.get('/api/anime', (req, res) => {
  let results = [...catalogueCache];

  const { search, genre, type, sort, page = '1', limit = '30' } = req.query;

  // Search filter
  if (typeof search === 'string' && search.trim().length > 0) {
    const query = search.trim().toLowerCase();
    results = results.filter(item => {
      const matchTitle = item.title?.toLowerCase().includes(query);
      const matchAlt = item.alternateTitle?.toLowerCase().includes(query);
      const matchSynopsis = item.synopsis?.toLowerCase().includes(query);
      const matchGenres = item.genres?.some((g: string) => g.toLowerCase().includes(query));
      return matchTitle || matchAlt || matchSynopsis || matchGenres;
    });
  }

  // Genre filter
  if (typeof genre === 'string' && genre.trim().length > 0 && genre !== 'All') {
    const target = genre.trim().toLowerCase();
    results = results.filter(item =>
      item.genres?.some((g: string) => g.toLowerCase() === target)
    );
  }

  // Type filter (TV / Movie)
  if (typeof type === 'string' && (type === 'TV' || type === 'Movie')) {
    results = results.filter(item => item.type === type);
  }

  // Sorting
  if (sort === 'title') {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === 'year') {
    results.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
  } else if (sort === 'seasons') {
    results.sort((a, b) => (b.seasons?.length || 0) - (a.seasons?.length || 0));
  } else {
    // Default popularity: prioritized major anime first
    results.sort((a, b) => {
      const aSeasons = a.seasons?.length || 0;
      const bSeasons = b.seasons?.length || 0;
      return bSeasons - aSeasons;
    });
  }

  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit as string, 10) || 30);
  const total = results.length;
  const totalPages = Math.ceil(total / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const paginated = results.slice(startIndex, startIndex + limitNum);

  res.json({
    anime: paginated,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    }
  });
});

app.get('/api/anime/:id', (req, res) => {
  const { id } = req.params;
  const item = catalogueCache.find(a => a.id === id);
  if (!item) {
    res.status(404).json({ error: `Anime with id '${id}' not found in AniVault catalogue.` });
    return;
  }
  res.json(item);
});

// Trigger Catalogue Sync
app.post('/api/sync', async (req, res) => {
  if (isSyncing) {
    res.json({ status: 'already_syncing', message: syncMessage });
    return;
  }

  isSyncing = true;
  syncMessage = 'Syncing catalogue from RareToon India...';

  // Run in background
  (async () => {
    try {
      syncMessage = 'Crawling sitemaps and paginated archives...';
      const report = await runIngestion();
      loadCatalogue();
      lastSyncTimestamp = new Date().toISOString();
      syncMessage = `Sync complete. ${report.finalCatalogueCount} anime catalogued.`;
    } catch (err: any) {
      console.error('[Sync Error]', err);
      syncMessage = `Sync failed: ${err.message}`;
    } finally {
      isSyncing = false;
    }
  })();

  res.json({ status: 'started', message: 'Sync process started in background.' });
});

app.get('/api/sync-status', (req, res) => {
  res.json({
    isSyncing,
    message: syncMessage,
    lastSyncTimestamp,
    stats: statsCache
  });
});

// FULL CATALOGUE IMPORT SYSTEM ROUTES
app.post('/api/full-import/start', async (req, res) => {
  const result = await fullImporter.startImport();
  loadCatalogue();
  res.json(result);
});

app.post('/api/full-import/pause', (req, res) => {
  const result = fullImporter.pauseImport();
  res.json(result);
});

app.post('/api/full-import/reset', (req, res) => {
  fullImporter.resetState();
  res.json({ status: 'reset', state: fullImporter.getState() });
});

app.get('/api/full-import/status', (req, res) => {
  loadCatalogue();
  res.json({
    report: fullImporter.getReport(),
    state: fullImporter.getState(),
    totalProductionAnime: catalogueCache.length
  });
});

// ARTWORK MANAGER API ROUTES
app.get('/api/artwork/manager-status', async (req, res) => {
  try {
    const report = await getArtworkManagerStatus();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artwork/scan', async (req, res) => {
  try {
    const report = await scanArtwork();
    loadCatalogue();
    res.json({ status: 'completed', report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artwork/repair', async (req, res) => {
  try {
    const report = await repairMissingArtwork(25);
    loadCatalogue();
    res.json({ status: 'completed', report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artwork/retry-failed', async (req, res) => {
  try {
    const report = await retryFailedArtwork();
    loadCatalogue();
    res.json({ status: 'completed', report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/artwork/audit', async (req, res) => {
  try {
    const report = await runFullArtworkAuditBatch(50);
    loadCatalogue();
    res.json({ status: 'completed', report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/artwork/audit', async (req, res) => {
  try {
    const report = await getArtworkManagerStatus();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AniVault server listening at http://0.0.0.0:${PORT}`);
    // Automatic ArtworkManager initialization & health check
    ArtworkManager.scanAndRepairCatalogue(50)
      .then(() => loadCatalogue())
      .catch(err => console.error('[ArtworkManager Initialization Error]', err));
  });
}

startServer();
