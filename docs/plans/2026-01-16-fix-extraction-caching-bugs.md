# Fix Extraction Caching Bugs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix caching layer bugs that cause empty data to be cached on API failures, breaking body composition and potentially biomarkers.

**Architecture:** The current caching layer saves extraction results regardless of success/failure. We need to: (1) only cache successful extractions, (2) add proper error handling that throws instead of returning empty objects, (3) add cache validation to reject empty/invalid cached data.

**Tech Stack:** Next.js 15, TypeScript, Anthropic API

---

## Root Causes Identified

1. **Failed extractions are cached:** When 429 rate limit error occurs, `extractBodyCompWithAI()` catches the error and returns `{}`. This empty object is then cached. Future loads read `{}` from cache.

2. **No validation on cached data:** `readBodyCompCache()` returns whatever is in the cache file, even if `data: {}`.

3. **Extractors swallow errors:** Both `extractBodyCompWithAI()` and `extractBiomarkersWithAI()` catch all errors and return empty objects instead of throwing.

---

## Task 1: Add Cache Validation for Body Composition

**Files:**
- Modify: `src/lib/cache/body-comp-cache.ts:50-70`

**Step 1: Read the current cache validation logic**

Current `readBodyCompCache()` returns any cached data without validation.

**Step 2: Add validation function**

Add after line 45 in `body-comp-cache.ts`:

```typescript
/**
 * Check if body composition data is valid (not empty)
 */
function isValidBodyCompData(data: BodyComposition): boolean {
  // Must have at least one meaningful field
  return !!(
    data.bodyFatPercent ||
    data.leanMass ||
    data.fatMass ||
    data.boneMass ||
    data.totalMass
  );
}
```

**Step 3: Update readBodyCompCache to validate**

Modify `readBodyCompCache()` to return null if data is invalid:

```typescript
export function readBodyCompCache(): BodyCompCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }
    const raw = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(raw) as BodyCompCache;

    // Validate cached data is not empty
    if (!isValidBodyCompData(cache.data)) {
      console.log('[Cache] Body comp cache contains invalid/empty data, ignoring');
      return null;
    }

    return cache;
  } catch (error) {
    console.error('[Cache] Error reading body comp cache:', error);
    return null;
  }
}
```

**Step 4: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/cache/body-comp-cache.ts
git commit -m "fix(cache): validate body comp cache data is not empty"
```

---

## Task 2: Prevent Caching Failed Body Comp Extractions

**Files:**
- Modify: `src/lib/store/health-data.ts:162-168`

**Step 1: Read the current caching logic**

Lines 162-168 cache the result regardless of whether extraction succeeded.

**Step 2: Add validation before caching**

Modify lines 162-168 to only cache if data is valid:

```typescript
            if (pdfText) {
              this.data.bodyComp = await extractBodyCompWithAI(pdfText);
              usedAIBodyCompExtraction = true;

              // Only cache if extraction succeeded (has meaningful data)
              const hasData = !!(
                this.data.bodyComp.bodyFatPercent ||
                this.data.bodyComp.leanMass ||
                this.data.bodyComp.fatMass
              );

              if (hasData) {
                writeBodyCompCache(this.data.bodyComp, relativePath, fileHash);
                updateManifestEntry(manifest, relativePath, fileHash, 'dexa');
                manifestChanged = true;
                console.log('[HealthAI] Body comp extraction successful, cached');
              } else {
                console.warn('[HealthAI] Body comp extraction returned empty, NOT caching');
              }
            }
```

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/store/health-data.ts
git commit -m "fix(cache): only cache body comp if extraction succeeded"
```

---

## Task 3: Add Cache Validation for Biomarkers

**Files:**
- Modify: `src/lib/cache/biomarker-cache.ts:335-346`

**Step 1: Update readCache to validate biomarker count**

Modify `readCache()` function:

```typescript
export function readCache(): BiomarkerCache | null {
  try {
    if (!fs.existsSync(CACHE_FILE)) {
      return null;
    }
    const data = fs.readFileSync(CACHE_FILE, 'utf-8');
    const cache = JSON.parse(data) as BiomarkerCache;

    // Validate cache has meaningful data (at least 10 biomarkers)
    if (!cache.biomarkers || cache.biomarkers.length < 10) {
      console.log(`[Cache] Biomarker cache has only ${cache.biomarkers?.length ?? 0} items, ignoring`);
      return null;
    }

    return cache;
  } catch (error) {
    console.error('[Cache] Error reading cache:', error);
    return null;
  }
}
```

**Step 2: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/lib/cache/biomarker-cache.ts
git commit -m "fix(cache): validate biomarker cache has minimum entries"
```

---

## Task 4: Prevent Caching Failed Biomarker Extractions

**Files:**
- Modify: `src/lib/store/health-data.ts:121-135`

**Step 1: Read the current biomarker caching logic**

Lines 121-135 cache biomarkers without validating extraction success.

**Step 2: Add validation before caching**

Modify the biomarker caching section:

```typescript
            if (pdfText) {
              this.data.biomarkers = await extractBiomarkersWithAI(pdfText);
              usedAIExtraction = true;

              // Only cache if extraction succeeded (has meaningful data)
              const biomarkerCount = this.data.biomarkers.all?.length ?? 0;

              if (biomarkerCount >= 10) {
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
                console.log(`[HealthAI] Biomarker extraction successful (${biomarkerCount}), cached`);
              } else {
                console.warn(`[HealthAI] Biomarker extraction returned only ${biomarkerCount} items, NOT caching`);
              }
            }
```

**Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/store/health-data.ts
git commit -m "fix(cache): only cache biomarkers if extraction succeeded"
```

---

## Task 5: Clear Invalid Cached Data

**Files:**
- Modify: `src/app/api/sync/route.ts`

**Step 1: Read current sync route**

Current sync route clears all cache. This is correct behavior.

**Step 2: Add logging to confirm cache cleared**

No changes needed - current implementation is correct. Just verify it works.

**Step 3: Manual test**

1. Check current cache state: `cat data/.cache/body-composition.json`
2. If `data: {}`, call sync: `curl -X POST http://localhost:3001/api/sync`
3. Verify cache cleared: `ls data/.cache/` should show no files or directory gone

**Step 4: Commit (if any changes)**

No commit needed for this task.

---

## Task 6: Test the Fix End-to-End

**Manual Testing Steps:**

**Step 1: Clear existing bad cache**

```bash
rm -rf data/.cache/
```

**Step 2: Wait for rate limit to reset**

Check headers from previous 429 error for `anthropic-ratelimit-output-tokens-reset` timestamp. Wait until that time passes.

**Step 3: Start fresh dev server**

```bash
rm -rf .next/
npm run dev
```

**Step 4: Trigger extraction**

Open http://localhost:3000/dashboard in browser. Watch server logs for:
- `[HealthAI] Extracting biomarkers with AI...`
- `[HealthAI] AI extracted XX biomarkers`
- `[HealthAI] Biomarker extraction successful (XX), cached`

**Step 5: Verify body comp**

Open http://localhost:3000/body-comp. Should show actual data, not zeros.

**Step 6: Verify cache files**

```bash
cat data/.cache/biomarkers.json | grep -c '"id":'  # Should be 90+
cat data/.cache/body-composition.json | jq '.data'  # Should have bodyFatPercent etc
```

---

## Success Criteria

1. Body composition page shows actual values, not zeros
2. Biomarkers page shows 90+ biomarkers
3. Cache files contain valid data
4. If extraction fails (429), cache is NOT updated with empty data
5. On next page load after failed extraction, extraction is retried (not cached failure)

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/lib/cache/body-comp-cache.ts` | Add validation to reject empty cached data |
| `src/lib/cache/biomarker-cache.ts` | Add minimum count validation |
| `src/lib/store/health-data.ts` | Only cache successful extractions |

---

## Rollback Plan

If issues persist, revert the caching layer entirely:

```bash
git revert 6221ea3 4b06cf7 5600b2d 332b837 bfbf416 460acc5 3d8d74d ecb1b51
```

This reverts all caching commits back to the pre-caching state (commit 8b0b932).
