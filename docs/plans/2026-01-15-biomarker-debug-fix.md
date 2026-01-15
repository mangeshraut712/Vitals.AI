# Biomarker System Debug & Fix Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix calculation errors, add missing normalizations, and ensure all 165+ biomarkers from the reference table are properly supported.

**Architecture:** Three-phase fix - (1) Fix broken calculations (SIRI, PLR), (2) Add missing name normalizations in cache system, (3) Add missing calculated ratios. Each fix includes corresponding reference entry if missing.

**Tech Stack:** TypeScript, Next.js, existing biomarker infrastructure

---

## Critical Issues Found

### Bug #1: SIRI Calculation Wrong (1439 instead of ~1.44)
**Root Cause:** Unit mismatch - values in cells/µL need conversion to ×10³/µL

Current (WRONG):
```typescript
const siri = (monocytes * neutrophils) / lymphocytes;
// (587 * 5696) / 2323 = 1439.33
```

Correct formula from rules:
```typescript
// Convert cells/µL to ×10³/µL (divide by 1000)
SIRI = (mono/1000 × neut/1000) / (lymph/1000)
     = (monocytes × neutrophils) / (lymphocytes × 1000)
// (587 * 5696) / (2323 * 1000) = 1.44
```

### Bug #2: PLR Calculation Wrong (0 instead of ~142)
**Root Cause:** Platelets in ×10³/µL, Lymphocytes in cells/µL - needs unit conversion

Current (WRONG):
```typescript
value: round(raw.platelets / lymphocytes, 0)
// 330 / 2323 = 0.14 → rounds to 0
```

Correct formula from rules:
```typescript
PLR = (Platelets × 1000) / Lymphocytes_Abs
// (330 * 1000) / 2323 = 142.06
```

### Bug #3: Missing Name Normalizations (66 extracted → ~46 matched)
Many biomarkers extracted from PDF don't match reference IDs:
- `iron__total` → should be `serumIron`
- `iron_binding_capacity` → should be `tibc`
- `testosterone__total__ms` → should be `totalTestosterone`
- `urea_nitrogen__bun_` → should be `bun`
- `dhea_sulfate` → should be `dheas`
- Plus ~20 more

### Bug #4: Missing Calculated Ratios
Reference table lists these that we don't calculate:
- LMR (Lymphocyte/Monocyte) - inverse of MLR
- PWR (Platelet/WBC ratio)
- NLPR (NLR / Platelets)
- MHR (Monocyte/HDL ratio)
- NHR (Neutrophil/HDL ratio)
- RDW/MCV ratio
- BUN/Creatinine ratio (partially working)
- Ferritin-to-Albumin
- CAR (CRP-to-Albumin)
- GGT-to-HDL ratio

### Bug #5: Status Classification Edge Cases
HbA1c = 5.7% currently shows as "normal" but should be "out_of_range" per ADA prediabetes threshold.

---

## Task 1: Fix SIRI Calculation

**Files:**
- Modify: `src/lib/biomarkers/calculations.ts:250-261`

**Step 1: Locate SIRI calculation**

Find lines 250-261 in calculations.ts containing:
```typescript
// SIRI (Systemic Inflammation Response Index)
if (monocytes && neutrophils && lymphocytes && lymphocytes > 0) {
  const siri = (monocytes * neutrophils) / lymphocytes;
```

**Step 2: Fix unit conversion**

Replace with:
```typescript
// SIRI (Systemic Inflammation Response Index)
// Formula: (Mono × Neut) / (Lymph × 1000) when values in cells/µL
// This converts to ×10³/µL units for proper ratio
if (monocytes && neutrophils && lymphocytes && lymphocytes > 0) {
  const siri = (monocytes * neutrophils) / (lymphocytes * 1000);
  calculated.push({
    id: 'siri',
    name: 'SIRI (Inflammation Response Index)',
    value: round(siri, 2),
    unit: 'index',
    formula: '(Monocytes × Neutrophils) ÷ (Lymphocytes × 1000)',
    inputs: ['monocytes', 'neutrophils', 'lymphocytes'],
  });
}
```

**Step 3: Verify by checking expected value**

With test data:
- Monocytes: 587
- Neutrophils: 5696
- Lymphocytes: 2323

Expected: (587 × 5696) / (2323 × 1000) = 1.44 ✓

**Step 4: Commit**

```bash
git add src/lib/biomarkers/calculations.ts
git commit -m "fix(biomarkers): correct SIRI calculation unit conversion"
```

---

## Task 2: Fix PLR Calculation

**Files:**
- Modify: `src/lib/biomarkers/calculations.ts:213-223`

**Step 1: Locate PLR calculation**

Find lines 213-223 containing:
```typescript
// PLR (Platelet-to-Lymphocyte Ratio)
if (raw.platelets && lymphocytes && lymphocytes > 0) {
  calculated.push({
    id: 'plr',
    name: 'PLR (Platelet/Lymphocyte)',
    value: round(raw.platelets / lymphocytes, 0),
```

**Step 2: Fix unit conversion**

Replace with:
```typescript
// PLR (Platelet-to-Lymphocyte Ratio)
// Platelets in ×10³/µL, Lymphocytes in cells/µL
// Multiply platelets by 1000 to get same units
if (raw.platelets && lymphocytes && lymphocytes > 0) {
  const plr = (raw.platelets * 1000) / lymphocytes;
  calculated.push({
    id: 'plr',
    name: 'PLR (Platelet/Lymphocyte)',
    value: round(plr, 0),
    unit: 'ratio',
    formula: '(Platelets × 1000) ÷ Lymphocytes',
    inputs: ['platelets', 'lymphocytes'],
  });
}
```

**Step 3: Verify by checking expected value**

With test data:
- Platelets: 330 (×10³/µL)
- Lymphocytes: 2323 (cells/µL)

Expected: (330 × 1000) / 2323 = 142 ✓

**Step 4: Commit**

```bash
git add src/lib/biomarkers/calculations.ts
git commit -m "fix(biomarkers): correct PLR calculation unit conversion"
```

---

## Task 3: Add Missing Name Normalizations

**Files:**
- Modify: `src/lib/cache/biomarker-cache.ts:34-238` (NAME_TO_ID map)

**Step 1: Add missing aliases to NAME_TO_ID**

Add these entries to the NAME_TO_ID map:

```typescript
// Iron panel - missing aliases
'iron, total': 'serumIron',
'iron total': 'serumIron',
'total iron': 'serumIron',
'iron binding capacity': 'tibc',
'iron bind.cap.(tibc)': 'tibc',

// Thyroid - missing aliases
't3 uptake': 't3Uptake',
't4 (thyroxine), total': 'totalT4',
't4, total': 'totalT4',
'thyroxine, total': 'totalT4',
'free t4 index (t7)': 'freeT4Index',
'free t4 index': 'freeT4Index',
't7': 'freeT4Index',

// Testosterone - missing aliases
'testosterone, total, ms': 'totalTestosterone',
'testosterone total': 'totalTestosterone',
'testosterone, free': 'freeTestosterone',
'testosterone, bioavailable': 'bioavailableTestosterone',
'bioavailable testosterone': 'bioavailableTestosterone',

// Lipid ratios from lab
'chol/hdlc ratio': 'tcHdlRatio',
'cholesterol/hdl ratio': 'tcHdlRatio',
'ldl/hdl ratio': 'ldlHdlRatio',
'non hdl cholesterol': 'nonHdlC',
'non-hdl cholesterol': 'nonHdlC',

// Metabolic - missing aliases
'urea nitrogen (bun)': 'bun',
'urea nitrogen': 'bun',
'protein, total': 'totalProtein',
'albumin/globulin ratio': 'agRatio',
'a/g ratio': 'agRatio',
'eag (mg/dl)': 'eagMgDl',
'eag (mmol/l)': 'eagMmolL',

// Liver - missing aliases
'bilirubin, direct': 'directBilirubin',
'direct bilirubin': 'directBilirubin',
'bilirubin, indirect': 'indirectBilirubin',
'indirect bilirubin': 'indirectBilirubin',

// Hormones - missing aliases
'dhea sulfate': 'dheas',
'dhea-sulfate': 'dheas',
'cortisol, total': 'cortisolAm',
'cortisol total': 'cortisolAm',
'estradiol': 'estradiolMale',

// WBC Differential - absolute counts
'absolute eosinophils': 'eosinophilsAbs',
'eosinophils absolute': 'eosinophilsAbs',
'absolute basophils': 'basophilsAbs',
'basophils absolute': 'basophilsAbs',
'neutrophils (absolute)': 'neutrophils',
'lymphocytes (absolute)': 'lymphocytes',
'monocytes (absolute)': 'monocytes',
```

**Step 2: Add missing reference entries**

Add to `src/lib/biomarkers/reference.ts`:

```typescript
// T3 Uptake
t3Uptake: {
  id: 't3Uptake',
  name: 'T3 Uptake',
  category: 'thyroid',
  unit: '%',
  standardRange: { min: 22, max: 35 },
  optimalRange: { min: 24, max: 32 },
  direction: 'mid-range',
},

// Total T4
totalT4: {
  id: 'totalT4',
  name: 'Total T4',
  category: 'thyroid',
  unit: 'mcg/dL',
  standardRange: { min: 4.5, max: 12.5 },
  optimalRange: { min: 6, max: 10 },
  direction: 'mid-range',
},

// Free T4 Index
freeT4Index: {
  id: 'freeT4Index',
  name: 'Free T4 Index',
  category: 'thyroid',
  unit: 'index',
  standardRange: { min: 1.4, max: 3.8 },
  optimalRange: { min: 1.5, max: 4.5 },
  direction: 'mid-range',
},

// Bioavailable Testosterone
bioavailableTestosterone: {
  id: 'bioavailableTestosterone',
  name: 'Bioavailable Testosterone',
  category: 'male-hormones',
  unit: 'ng/dL',
  standardRange: { min: 130, max: 680 },
  optimalRange: { min: 250, max: 500 },
  direction: 'higher',
},

// eAG
eagMgDl: {
  id: 'eagMgDl',
  name: 'eAG (Estimated Average Glucose)',
  category: 'metabolic',
  unit: 'mg/dL',
  standardRange: { max: 117 },
  optimalRange: { max: 100 },
  direction: 'lower',
},

// Direct/Indirect Bilirubin
directBilirubin: {
  id: 'directBilirubin',
  name: 'Direct Bilirubin',
  category: 'liver',
  unit: 'mg/dL',
  standardRange: { max: 0.3 },
  optimalRange: { max: 0.2 },
  direction: 'lower',
},
indirectBilirubin: {
  id: 'indirectBilirubin',
  name: 'Indirect Bilirubin',
  category: 'liver',
  unit: 'mg/dL',
  standardRange: { min: 0.1, max: 0.9 },
  optimalRange: { min: 0.1, max: 0.8 },
  direction: 'lower',
},

// Eosinophils/Basophils Absolute (distinct from percentage)
eosinophilsAbs: {
  id: 'eosinophilsAbs',
  name: 'Eosinophils (Absolute)',
  category: 'cbc',
  unit: 'cells/µL',
  standardRange: { min: 15, max: 500 },
  optimalRange: { min: 50, max: 300 },
  direction: 'lower',
},
basophilsAbs: {
  id: 'basophilsAbs',
  name: 'Basophils (Absolute)',
  category: 'cbc',
  unit: 'cells/µL',
  standardRange: { min: 0, max: 300 },
  optimalRange: { min: 0, max: 100 },
  direction: 'lower',
},
```

**Step 3: Commit**

```bash
git add src/lib/cache/biomarker-cache.ts src/lib/biomarkers/reference.ts
git commit -m "feat(biomarkers): add missing name normalizations and reference entries"
```

---

## Task 4: Add Missing Calculated Ratios

**Files:**
- Modify: `src/lib/biomarkers/calculations.ts`
- Modify: `src/lib/biomarkers/reference.ts`

**Step 1: Add LMR (Lymphocyte-to-Monocyte Ratio)**

In calculations.ts after MLR:
```typescript
// LMR (Lymphocyte-to-Monocyte Ratio) - inverse of MLR
if (lymphocytes && monocytes && monocytes > 0) {
  calculated.push({
    id: 'lmr',
    name: 'LMR (Lymphocyte/Monocyte)',
    value: round(lymphocytes / monocytes, 2),
    unit: 'ratio',
    formula: 'Lymphocytes ÷ Monocytes',
    inputs: ['lymphocytes', 'monocytes'],
  });
}
```

In reference.ts:
```typescript
lmr: {
  id: 'lmr',
  name: 'LMR (Lymphocyte-to-Monocyte)',
  category: 'cbc-ratios',
  unit: 'ratio',
  optimalRange: { min: 4.0 },
  direction: 'higher',
  isCalculated: true,
  formula: 'lymphocytes / monocytes',
},
```

**Step 2: Add PWR (Platelet-to-WBC Ratio)**

```typescript
// PWR (Platelet-to-WBC Ratio)
if (raw.platelets && raw.wbc && raw.wbc > 0) {
  // Platelets in ×10³/µL, WBC in ×10³/µL (same units)
  const pwr = raw.platelets / raw.wbc;
  calculated.push({
    id: 'pwr',
    name: 'PWR (Platelet/WBC)',
    value: round(pwr, 1),
    unit: 'ratio',
    formula: 'Platelets ÷ WBC',
    inputs: ['platelets', 'wbc'],
  });
}
```

Reference:
```typescript
pwr: {
  id: 'pwr',
  name: 'PWR (Platelet-to-WBC)',
  category: 'cbc-ratios',
  unit: 'ratio',
  optimalRange: { min: 30, max: 45 },
  direction: 'mid-range',
  isCalculated: true,
  formula: 'platelets / wbc',
},
```

**Step 3: Add MHR (Monocyte-to-HDL Ratio)**

```typescript
// MHR (Monocyte-to-HDL Ratio)
// Monocytes in cells/µL, HDL in mg/dL
if (monocytes && raw.hdl && raw.hdl > 0) {
  const mhr = monocytes / raw.hdl;
  calculated.push({
    id: 'mhr',
    name: 'MHR (Monocyte/HDL)',
    value: round(mhr, 1),
    unit: 'ratio',
    formula: 'Monocytes ÷ HDL',
    inputs: ['monocytes', 'hdl'],
  });
}
```

Reference:
```typescript
mhr: {
  id: 'mhr',
  name: 'MHR (Monocyte-to-HDL)',
  category: 'cbc-ratios',
  unit: 'ratio',
  optimalRange: { max: 10 },
  direction: 'lower',
  isCalculated: true,
  formula: 'monocytes / hdl',
},
```

**Step 4: Add NHR (Neutrophil-to-HDL Ratio)**

```typescript
// NHR (Neutrophil-to-HDL Ratio)
if (neutrophils && raw.hdl && raw.hdl > 0) {
  const nhr = neutrophils / raw.hdl;
  calculated.push({
    id: 'nhr',
    name: 'NHR (Neutrophil/HDL)',
    value: round(nhr, 1),
    unit: 'ratio',
    formula: 'Neutrophils ÷ HDL',
    inputs: ['neutrophils', 'hdl'],
  });
}
```

Reference:
```typescript
nhr: {
  id: 'nhr',
  name: 'NHR (Neutrophil-to-HDL)',
  category: 'cbc-ratios',
  unit: 'ratio',
  optimalRange: { max: 100 },
  direction: 'lower',
  isCalculated: true,
  formula: 'neutrophils / hdl',
},
```

**Step 5: Add RDW/MCV Ratio**

```typescript
// RDW/MCV Ratio
if (raw.rdw && raw.mcv && raw.mcv > 0) {
  calculated.push({
    id: 'rdwMcvRatio',
    name: 'RDW/MCV Ratio',
    value: round(raw.rdw / raw.mcv, 3),
    unit: 'ratio',
    formula: 'RDW ÷ MCV',
    inputs: ['rdw', 'mcv'],
  });
}
```

Reference:
```typescript
rdwMcvRatio: {
  id: 'rdwMcvRatio',
  name: 'RDW/MCV Ratio',
  category: 'cbc-ratios',
  unit: 'ratio',
  optimalRange: { max: 0.14 },
  direction: 'lower',
  isCalculated: true,
  formula: 'rdw / mcv',
},
```

**Step 6: Add Ferritin-to-Albumin Ratio**

```typescript
// Ferritin-to-Albumin Ratio
if (raw.ferritin && raw.albumin && raw.albumin > 0) {
  calculated.push({
    id: 'ferritinAlbuminRatio',
    name: 'Ferritin/Albumin Ratio',
    value: round(raw.ferritin / raw.albumin, 1),
    unit: 'ratio',
    formula: 'Ferritin ÷ Albumin',
    inputs: ['ferritin', 'albumin'],
  });
}
```

Reference:
```typescript
ferritinAlbuminRatio: {
  id: 'ferritinAlbuminRatio',
  name: 'Ferritin-to-Albumin',
  category: 'inflammation',
  unit: 'ratio',
  optimalRange: { max: 15 },
  direction: 'lower',
  isCalculated: true,
  formula: 'ferritin / albumin',
},
```

**Step 7: Add CAR (CRP-to-Albumin Ratio)**

```typescript
// CAR (CRP-to-Albumin Ratio)
if (raw.crp && raw.albumin && raw.albumin > 0) {
  calculated.push({
    id: 'car',
    name: 'CAR (CRP/Albumin)',
    value: round(raw.crp / raw.albumin, 2),
    unit: 'ratio',
    formula: 'hs-CRP ÷ Albumin',
    inputs: ['crp', 'albumin'],
  });
}
```

Reference:
```typescript
car: {
  id: 'car',
  name: 'CAR (CRP-to-Albumin)',
  category: 'inflammation',
  unit: 'ratio',
  optimalRange: { max: 0.25 },
  direction: 'lower',
  isCalculated: true,
  formula: 'crp / albumin',
},
```

**Step 8: Add GGT-to-HDL Ratio**

```typescript
// GGT-to-HDL Ratio (MetS indicator)
if (raw.ggt && raw.hdl && raw.hdl > 0) {
  calculated.push({
    id: 'ggtHdlRatio',
    name: 'GGT/HDL Ratio',
    value: round(raw.ggt / raw.hdl, 2),
    unit: 'ratio',
    formula: 'GGT ÷ HDL',
    inputs: ['ggt', 'hdl'],
  });
}
```

Reference:
```typescript
ggtHdlRatio: {
  id: 'ggtHdlRatio',
  name: 'GGT-to-HDL',
  category: 'liver',
  unit: 'ratio',
  optimalRange: { max: 0.40 },
  direction: 'lower',
  isCalculated: true,
  formula: 'ggt / hdl',
},
```

**Step 9: Commit**

```bash
git add src/lib/biomarkers/calculations.ts src/lib/biomarkers/reference.ts
git commit -m "feat(biomarkers): add 8 missing calculated ratios"
```

---

## Task 5: Fix HbA1c Classification Edge Case

**Files:**
- Modify: `src/lib/biomarkers/calculations.ts:335-376` (getBiomarkerStatus function)

**Step 1: Add special handling for HbA1c**

Update the `getBiomarkerStatus` function to handle the prediabetes threshold:

```typescript
export function getBiomarkerStatus(
  id: string,
  value: number
): 'optimal' | 'normal' | 'borderline' | 'out_of_range' {
  const ref = BIOMARKER_REFERENCES[id];
  if (!ref) return 'normal';

  // Special case: HbA1c - ≥5.7% is prediabetes (out_of_range)
  if (id === 'hba1c' && value >= 5.7) {
    return 'out_of_range';
  }

  const { optimalRange, standardRange, direction } = ref;

  // Check optimal range first
  if (optimalRange) {
    const inOptimal = isInRange(value, optimalRange);
    if (inOptimal) return 'optimal';
  }

  // Check standard range
  if (standardRange) {
    const inStandard = isInRange(value, standardRange);
    if (!inStandard) return 'out_of_range';
  }

  // In standard but not optimal = normal (or borderline for some)
  return 'normal';
}
```

**Step 2: Verify HbA1c classification**

Test cases:
- HbA1c = 5.2% → optimal (within 4.5-5.25)
- HbA1c = 5.6% → normal (within 5.26-5.69)
- HbA1c = 5.7% → out_of_range (prediabetes threshold)
- HbA1c = 6.0% → out_of_range

**Step 3: Commit**

```bash
git add src/lib/biomarkers/calculations.ts
git commit -m "fix(biomarkers): HbA1c ≥5.7% now correctly classified as out_of_range"
```

---

## Task 6: Update MLR Optimal Range

**Files:**
- Modify: `src/lib/biomarkers/reference.ts`

**Step 1: Fix MLR threshold**

Current:
```typescript
mlr: {
  optimalRange: { max: 0.29 },
```

Per reference table (row 87):
```
| 87 | MLR | ... | <0.25 | 0.25-0.40 | >0.40 |
```

Update to:
```typescript
mlr: {
  id: 'mlr',
  name: 'MLR (Monocyte-to-Lymphocyte)',
  category: 'cbc-ratios',
  unit: 'ratio',
  optimalRange: { max: 0.25 },
  standardRange: { max: 0.40 },
  direction: 'lower',
  isCalculated: true,
  formula: 'monocytes / lymphocytes (absolute)',
},
```

**Step 2: Commit**

```bash
git add src/lib/biomarkers/reference.ts
git commit -m "fix(biomarkers): correct MLR optimal threshold to <0.25"
```

---

## Task 7: Run Sync and Verify Fixes

**Step 1: Restart dev server**

```bash
# Kill existing server (Ctrl+C in terminal)
npm run dev
```

**Step 2: Trigger sync**

Navigate to http://localhost:3000/data-sources and click "Sync Data"

**Step 3: Check terminal logs**

Expected:
```
[Sync] AI extracted ~71 raw biomarkers
[Sync] Calculated ~22 derived biomarkers (was 14)
[Cache] Saved ~90 biomarkers to cache (was 80)
```

**Step 4: Verify in cache file**

```bash
cat data/.cache/biomarkers.json | grep -E '"id"|"value"' | head -50
```

Check:
- SIRI value ≈ 1.44 (not 1439)
- PLR value ≈ 142 (not 0)
- New ratios present (LMR, PWR, MHR, etc.)

**Step 5: Check biomarkers page**

Navigate to http://localhost:3000/biomarkers

Verify:
- Total count increased from 79 to ~90+
- No more 0 values for PLR
- SIRI shows reasonable value (~1.44)
- HbA1c shows "Out of Range" (red) since value is 5.7%

---

## Summary of Changes

| Issue | Fix | File(s) |
|-------|-----|---------|
| SIRI = 1439 (wrong) | Divide by (lymph × 1000) | calculations.ts:250-261 |
| PLR = 0 (wrong) | Multiply platelets × 1000 | calculations.ts:213-223 |
| Missing normalizations | Add 25+ aliases to NAME_TO_ID | biomarker-cache.ts:34-238 |
| Missing reference entries | Add 10+ biomarker definitions | reference.ts |
| Missing calculated ratios | Add LMR, PWR, MHR, NHR, etc. | calculations.ts |
| HbA1c = 5.7% = normal (wrong) | Add special case ≥5.7 = out_of_range | calculations.ts:335-376 |
| MLR threshold wrong | Change 0.29 → 0.25 | reference.ts |

**Expected Results After Fix:**
- Total biomarkers: ~90-95 (up from 79)
- SIRI: ~1.44 (down from 1439)
- PLR: ~142 (up from 0)
- HbA1c 5.7%: "Out of Range" (was "Normal")
- New ratios: LMR, PWR, MHR, NHR, RDW/MCV, Ferritin/Albumin, CAR, GGT/HDL
