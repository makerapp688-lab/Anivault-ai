export interface Artwork {
  verifiedArtworkUrl: string;
  isVerified: boolean;
  verificationSource: string;
  aspectRatio: string;
}

export interface RareToonProviderInfo {
  providerAnimeId: string;
  canonicalUrl: string;
  verificationStatus: 'VERIFIED' | 'UNAVAILABLE';
  dubLanguage: string;
  quality: string;
}

export interface Episode {
  episodeNumber: number;
  title: string;
  canonicalUrl: string;
}

export interface Season {
  seasonNumber: number;
  title: string;
  canonicalUrl: string;
  episodeCount: number;
  episodes: Episode[];
}

export interface Anime {
  id: string;
  title: string;
  alternateTitle: string | null;
  synopsis: string;
  releaseYear: number;
  status: 'Completed' | 'Ongoing';
  type: 'TV' | 'Movie';
  genres: string[];
  artwork: Artwork;
  providers: {
    raretoonIndia: RareToonProviderInfo;
  };
  seasons: Season[];
}

export interface CatalogueStats {
  totalUniqueAnime: number;
  totalRareToonUrlsScraped: number;
  verifiedArtworkCount: number;
  placeholderArtworkCount: number;
  exactProviderMappings: number;
  genresBreakdown: Record<string, number>;
}

export interface SyncStatus {
  isSyncing: boolean;
  message: string;
  lastSyncTimestamp?: string;
  stats?: CatalogueStats;
}
