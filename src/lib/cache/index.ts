// Cache Module Index
// Re-exports all cache utilities for easy importing

export { calculateFileHash, calculateFolderHash } from './file-hash';

export {
  readManifest,
  writeManifest,
  needsExtraction,
  updateManifestEntry,
  clearAllCache,
  type CacheManifest,
  type FileEntry,
} from './manifest';

export {
  readCache as readBiomarkerCache,
  writeCache as writeBiomarkerCache,
  isBiomarkerCacheValid,
  isCacheValid,
  clearCache as clearBiomarkerCache,
  normalizeBiomarkerName,
  getDisplayName,
  type BiomarkerCache,
  type CachedBiomarker,
} from './biomarker-cache';

export {
  readBodyCompCache,
  writeBodyCompCache,
  isBodyCompCacheValid,
  clearBodyCompCache,
  type BodyCompCache,
} from './body-comp-cache';
