# Extraction Caching Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Skip AI extraction for unchanged files by caching extracted values with file hashes.

**Architecture:** Add a manifest that tracks file hashes. On load, compare current file hashes against manifest. Only run AI extraction for changed/new files. Load unchanged files from cache.

**Tech Stack:** Node.js fs, crypto (for hashing), existing cache directory structure

---

## Current State

- `src/lib/cache/biomarker-cache.ts` exists with basic read/write
- No file hash tracking
- No body composition caching
- No manifest for tracking processed files
- Every server restart re-runs AI extraction (~2000 tokens)

## Target State

```
/data/.cache/
├── manifest.json              # File hashes + timestamps
├── biomarkers.json            # Extracted biomarker values (exists)
├── body-composition.json      # Extracted DEXA values (NEW)
└── activity-stats.json        # Pre-computed activity averages (NEW)
```

---

### Task 1: Create File Hash Utility

**Files:**
- Create: `src/lib/cache/file-hash.ts`

**Step 1: Create the hash utility module**

```typescript
// src/lib/cache/file-hash.ts
import fs from 'fs';
import crypto from 'crypto';

/**
 * Calculate MD5 hash of a file's contents
 * Used to detect if a file has changed since last extraction
 */
export function calculateFileHash(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    console.error(`[Cache] Error hashing file ${filePath}:`, error);
    return '';
  }
}

/**
 * Calculate hash for a folder (based on file list + sizes)
 * Used for activity data folders (Whoop, etc.)
 */
export function calculateFolderHash(folderPath: string): string {
  try {
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    const fileInfo = files
      .filter(f => f.isFile())
      .map(f => {
        const stats = fs.statSync(`${folderPath}/${f.name}`);
        return `${f.name}:${stats.size}:${stats.mtimeMs}`;
      })
      .sort()
      .join('|');

    return crypto.createHash('md5').update(fileInfo).digest('hex');
  } catch (error) {
    console.error(`[Cache] Error hashing folder ${folderPath}:`, error);
    return '';
  }
}
```

**Step 2: Verify module compiles**

Run: `npm run typecheck`
Expected: No errors in `file-hash.ts`

**Step 3: Commit**

```bash
git add src/lib/cache/file-hash.ts
git commit -m "feat(cache): add file hash utility for change detection"
```

---

### Task 2: Create Cache Manifest

**Files:**
- Create: `src/lib/cache/manifest.ts`

**Step 1: Create the manifest module**

```typescript
// src/lib/cache/manifest.ts
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_DIR = path.join(DATA_DIR, '.cache');
const MANIFEST_FILE = path.join(CACHE_DIR, 'manifest.json');

export interface FileEntry {
  path: string;
  hash: string;
  extractedAt: string;
  type: 'bloodwork' | 'dexa' | 'activity';
}

export interface CacheManifest {
  version: number;
  lastUpdated: string;
  files: Record<string, FileEntry>; // keyed by relative path
}

const CURRENT_VERSION = 1;

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read the cache manifest
 */
export function readManifest(): CacheManifest {
  try {
    if (fs.existsSync(MANIFEST_FILE)) {
      const data = fs.readFileSync(MANIFEST_FILE, 'utf-8');
      const manifest = JSON.parse(data) as CacheManifest;

      // Version check - if outdated, return empty manifest
      if (manifest.version !== CURRENT_VERSION) {
        console.log('[Cache] Manifest version mismatch, starting fresh');
        return createEmptyManifest();
      }

      return manifest;
    }
  } catch (error) {
    console.error('[Cache] Error reading manifest:', error);
  }

  return createEmptyManifest();
}

/**
 * Write the cache manifest
 */
export function writeManifest(manifest: CacheManifest): void {
  try {
    ensureCacheDir();
    manifest.lastUpdated = new Date().toISOString();
    fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2));
    console.log(`[Cache] Manifest updated with ${Object.keys(manifest.files).length} files`);
  } catch (error) {
    console.error('[Cache] Error writing manifest:', error);
  }
}

/**
 * Check if a file needs re-extraction
 */
export function needsExtraction(manifest: CacheManifest, relativePath: string, currentHash: string): boolean {
  const entry = manifest.files[relativePath];

  if (!entry) {
    console.log(`[Cache] ${relativePath}: not in manifest, needs extraction`);
    return true;
  }

  if (entry.hash !== currentHash) {
    console.log(`[Cache] ${relativePath}: hash changed, needs extraction`);
    return true;
  }

  console.log(`[Cache] ${relativePath}: unchanged, using cache`);
  return false;
}

/**
 * Update manifest entry after successful extraction
 */
export function updateManifestEntry(
  manifest: CacheManifest,
  relativePath: string,
  hash: string,
  type: FileEntry['type']
): void {
  manifest.files[relativePath] = {
    path: relativePath,
    hash,
    extractedAt: new Date().toISOString(),
    type,
  };
}

function createEmptyManifest(): CacheManifest {
  return {
    version: CURRENT_VERSION,
    lastUpdated: new Date().toISOString(),
    files: {},
  };
}

/**
 * Clear the entire cache (manifest + all cached data)
 */
export function clearAllCache(): void {
  try {
    if (fs.existsSync(CACHE_DIR)) {
      fs.rmSync(CACHE_DIR, { recursive: true });
      console.log('[Cache] All cache cleared');
    }
  } catch (error) {
    console.error('[Cache] Error clearing cache:', error);
  }
}
```

**Step 2: Verify module compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/cache/manifest.ts
git commit -m "feat(cache): add manifest for tracking processed files"
```

---

### Task 3: Add Body Composition Cache

**Files:**
- Create: `src/lib/cache/body-comp-cache.ts`

**Step 1: Create body composition cache module**

```typescript
// src/lib/cache/body-comp-cache.ts
import fs from 'fs';
import path from 'path';
import { BodyComposition } from '@/lib/extractors/body-comp';

const DATA_DIR = path.join(process.cwd(), 'data');
const CACHE_DIR = path.join(DATA_DIR, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'body-composition.json');

export interface BodyCompCache {
  version: number;
  extractedAt: string;
  sourceFile: string;
  sourceHash: string;
  data: BodyComposition;
}

const CURRENT_VERSION = 1;

function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read body composition from cache
 */
export function readBodyCompCache(): BodyCompCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(data) as BodyCompCache;

    if (cache.version !== CURRENT_VERSION) {
      return null;
    }

    return cache;
  } catch (error) {
    console.error('[Cache] Error reading body comp cache:', error);
    return null;
  }
}

/**
 * Write body composition to cache
 */
export function writeBodyCompCache(
  data: BodyComposition,
  sourceFile: string,
  sourceHash: string
): void {
  try {
    ensureCacheDir();
    const cache: BodyCompCache = {
      version: CURRENT_VERSION,
      extractedAt: new Date().toISOString(),
      sourceFile,
      sourceHash,
      data,
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log('[Cache] Body composition saved to cache');
  } catch (error) {
    console.error('[Cache] Error writing body comp cache:', error);
  }
}

/**
 * Check if cached body comp matches current file hash
 */
export function isBodyCompCacheValid(currentHash: string): boolean {
  const cache = readBodyCompCache();
  return cache !== null && cache.sourceHash === currentHash;
}
```

**Step 2: Verify module compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/cache/body-comp-cache.ts
git commit -m "feat(cache): add body composition cache"
```

---

### Task 4: Update Biomarker Cache with Hash Support

**Files:**
- Modify: `src/lib/cache/biomarker-cache.ts`

**Step 1: Add hash field to BiomarkerCache interface**

In `src/lib/cache/biomarker-cache.ts`, update the interface around line 25:

```typescript
export interface BiomarkerCache {
  version: number;
  extractedAt: string;
  sourceFile: string;
  sourceHash: string;  // ADD THIS LINE
  patientAge?: number;
  biomarkers: CachedBiomarker[];
}
```

**Step 2: Update writeCache to accept hash**

Modify the `writeCache` function signature and add hash validation helper:

```typescript
/**
 * Write biomarker cache to file
 */
export function writeCache(cache: BiomarkerCache): void {
  try {
    ensureCacheDir();
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
    console.log(`[Cache] Saved ${cache.biomarkers.length} biomarkers to cache`);
  } catch (error) {
    console.error('[Cache] Error writing cache:', error);
    throw error;
  }
}

/**
 * Check if cached biomarkers match current file hash
 */
export function isBiomarkerCacheValid(currentHash: string): boolean {
  const cache = readCache();
  return cache !== null && cache.sourceHash === currentHash && cache.biomarkers.length > 0;
}
```

**Step 3: Verify module compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 4: Commit**

```bash
git add src/lib/cache/biomarker-cache.ts
git commit -m "feat(cache): add hash validation to biomarker cache"
```

---

### Task 5: Create Cache Index Module

**Files:**
- Create: `src/lib/cache/index.ts`

**Step 1: Create unified cache export**

```typescript
// src/lib/cache/index.ts

// Re-export all cache modules for easy importing
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
  type BodyCompCache,
} from './body-comp-cache';
```

**Step 2: Verify module compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/cache/index.ts
git commit -m "feat(cache): add unified cache index module"
```

---

### Task 6: Integrate Cache into HealthDataStore

**Files:**
- Modify: `src/lib/store/health-data.ts`

This is the main integration task. We need to:
1. Check manifest before extraction
2. Use cached values if hash matches
3. Only run AI extraction for changed files
4. Update cache after extraction

**Step 1: Add cache imports at top of file**

```typescript
import {
  calculateFileHash,
  calculateFolderHash,
  readManifest,
  writeManifest,
  needsExtraction,
  updateManifestEntry,
  readBiomarkerCache,
  writeBiomarkerCache,
  readBodyCompCache,
  writeBodyCompCache,
} from '@/lib/cache';
```

**Step 2: Update loadAllData to use caching**

Replace the `loadAllData` method with a version that:
- Reads the manifest at start
- Checks hashes before extraction
- Uses cache for unchanged files
- Updates manifest after extraction

Key changes in the file processing loop:

For bloodwork PDF:
```typescript
if (file.type === 'bloodwork' && file.extension === '.pdf') {
  const relativePath = path.relative(process.cwd(), file.path);
  const fileHash = calculateFileHash(file.path);

  if (!needsExtraction(manifest, relativePath, fileHash)) {
    // Use cached biomarkers
    const cached = readBiomarkerCache();
    if (cached && cached.sourceHash === fileHash) {
      this.data.biomarkers = this.convertCachedToExtracted(cached);
      console.log('[HealthAI] Loaded biomarkers from cache');
    }
  } else {
    // Extract with AI
    const pdfText = await parsePdf(file.path);
    if (pdfText) {
      this.data.biomarkers = await extractBiomarkersWithAI(pdfText);
      // Save to cache
      writeBiomarkerCache({
        version: 1,
        extractedAt: new Date().toISOString(),
        sourceFile: relativePath,
        sourceHash: fileHash,
        patientAge: this.data.biomarkers.patientAge,
        biomarkers: this.convertExtractedToCached(this.data.biomarkers),
      });
      updateManifestEntry(manifest, relativePath, fileHash, 'bloodwork');
      manifestChanged = true;
    }
  }
}
```

Similar pattern for DEXA PDF.

**Step 3: Add helper methods for cache conversion**

```typescript
private convertCachedToExtracted(cached: BiomarkerCache): ExtractedBiomarkers {
  const result: ExtractedBiomarkers = {
    patientAge: cached.patientAge,
    all: cached.biomarkers.map(b => ({
      name: b.name,
      value: b.value,
      unit: b.unit,
      referenceRange: b.referenceRange,
      status: b.labStatus,
      category: b.category,
    })),
  };

  // Map to known keys
  for (const biomarker of cached.biomarkers) {
    (result as Record<string, unknown>)[biomarker.id] = biomarker.value;
  }

  return result;
}

private convertExtractedToCached(extracted: ExtractedBiomarkers): CachedBiomarker[] {
  if (!extracted.all) return [];

  return extracted.all.map(b => ({
    id: normalizeBiomarkerName(b.name),
    name: b.name,
    value: b.value,
    unit: b.unit,
    referenceRange: b.referenceRange,
    labStatus: b.status,
    category: b.category,
    source: 'measured' as const,
  }));
}
```

**Step 4: Save manifest at end of loadAllData**

```typescript
// At end of loadAllData():
if (manifestChanged) {
  writeManifest(manifest);
}
```

**Step 5: Verify everything compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 6: Test with existing data**

1. Start dev server: `npm run dev`
2. Load dashboard - should see "Extracting with AI..."
3. Stop and restart server
4. Load dashboard - should see "Loaded from cache"

**Step 7: Commit**

```bash
git add src/lib/store/health-data.ts
git commit -m "feat(cache): integrate file-hash caching into health data store"
```

---

### Task 7: Add Cache Clear API Endpoint (Optional)

**Files:**
- Create: `src/app/api/cache/clear/route.ts`

**Step 1: Create the endpoint**

```typescript
// src/app/api/cache/clear/route.ts
import { NextResponse } from 'next/server';
import { clearAllCache } from '@/lib/cache';

export async function POST() {
  try {
    clearAllCache();
    return NextResponse.json({ success: true, message: 'Cache cleared' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify module compiles**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/cache/clear/route.ts
git commit -m "feat(cache): add API endpoint to clear cache"
```

---

## Verification Checklist

After all tasks complete:

1. [ ] Fresh start (no cache): AI extraction runs, data displays correctly
2. [ ] Server restart (cache exists): "Loaded from cache" messages, no AI calls
3. [ ] Modify bloodwork PDF: Only bloodwork re-extracts
4. [ ] Modify DEXA PDF: Only body comp re-extracts
5. [ ] Activity data unchanged: No re-processing
6. [ ] Clear cache via API: Next load triggers fresh extraction

---

## Token Savings Summary

| Scenario | Before | After |
|----------|--------|-------|
| Server restart (no changes) | ~2000 tokens | 0 tokens |
| Server restart (bloodwork changed) | ~2000 tokens | ~1000 tokens |
| Server restart (DEXA changed) | ~2000 tokens | ~800 tokens |
| Server restart (activity changed) | ~2000 tokens | 0 tokens (no AI) |

---

## Future Enhancement: Health Summary MD

After this caching layer is working, we can add:
- `health-summary.md` generation for chatbot context
- Regenerated only when extractions change
- Reduces chatbot context tokens from ~1500 to ~500

This is Phase 2 - implement after extraction caching is proven.
