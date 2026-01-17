# Vitals.AI Knowledge Base

This document contains verified health knowledge embedded into the agent's system prompt.

## Levine PhenoAge Formula

**Source:** Levine et al. (2018) "An epigenetic biomarker of aging for lifespan and healthspan"
**DOI:** https://doi.org/10.18632/aging.101414

### Required Biomarkers (9 inputs)

| Biomarker | Unit | Variable Name |
|-----------|------|---------------|
| Albumin | g/dL | albumin |
| Creatinine | mg/dL | creatinine |
| Glucose (fasting) | mg/dL | glucose |
| C-Reactive Protein (CRP) | mg/L | crp |
| Lymphocyte Percent | % | lymphocyte_pct |
| Mean Cell Volume (MCV) | fL | mcv |
| Red Cell Distribution Width (RDW) | % | rdw |
| Alkaline Phosphatase | U/L | alp |
| White Blood Cell Count | 10³/µL | wbc |
| Chronological Age | years | age |

### Calculation Steps

**Step 1: Calculate xb (linear combination)**
```
xb = -19.9067
     - 0.0336 × albumin
     + 0.0095 × creatinine
     + 0.1953 × glucose
     + 0.0954 × ln(crp)
     - 0.0120 × lymphocyte_pct
     + 0.0268 × mcv
     + 0.3306 × rdw
     + 0.00188 × alp
     + 0.0554 × wbc
     + 0.0804 × age
```

Note: `ln(crp)` is the natural logarithm of CRP.

**Step 2: Calculate mortality risk (m)**
```
m = 1 - exp(-exp(xb) × (exp(120 × 0.0077) - 1) / 0.0077)
```

**Step 3: Calculate PhenoAge**
```
PhenoAge = 141.50225 + ln(-0.00553 × ln(1 - m)) / 0.090165
```

### Implementation Notes

- If CRP ≤ 0, use CRP = 0.01 (avoid log of zero)
- All biomarkers must be present; return null if any missing
- Round PhenoAge to 1 decimal place for display
- Delta = PhenoAge - Chronological Age (negative = biologically younger)

### Example Calculation

```
Inputs:
  albumin = 4.5 g/dL
  creatinine = 0.9 mg/dL
  glucose = 85 mg/dL
  crp = 0.5 mg/L
  lymphocyte_pct = 30%
  mcv = 88 fL
  rdw = 12.5%
  alp = 50 U/L
  wbc = 5.5 10³/µL
  age = 35 years

Expected output:
  PhenoAge ≈ 31.2 years
  Delta = -3.8 years (biologically younger)
```

---

## Biomarker Reference Ranges

### Levine PhenoAge Inputs

| Biomarker | Optimal | Normal | Unit | Notes |
|-----------|---------|--------|------|-------|
| Albumin | 4.5-5.0 | 3.5-5.5 | g/dL | Higher generally better |
| Creatinine | 0.7-1.0 | 0.6-1.2 | mg/dL | Kidney function |
| Glucose (fasting) | 70-85 | 70-100 | mg/dL | Lower is better (within range) |
| CRP | <0.5 | <3.0 | mg/L | Lower is better; inflammation marker |
| Lymphocyte % | 25-35 | 20-40 | % | Immune function |
| MCV | 82-92 | 80-100 | fL | Red blood cell size |
| RDW | 11.5-13.0 | 11.5-14.5 | % | Lower is better |
| Alkaline Phosphatase | 40-70 | 44-147 | U/L | Liver/bone health |
| WBC | 4.0-6.0 | 4.5-11.0 | 10³/µL | Lower-normal is better |

### Lipid Panel

| Biomarker | Optimal | Normal | Unit | Notes |
|-----------|---------|--------|------|-------|
| Total Cholesterol | <200 | <200 | mg/dL | Context-dependent |
| LDL | <70 | <100 | mg/dL | Lower is better for longevity |
| HDL | >60 | >40 (M) / >50 (F) | mg/dL | Higher is better |
| Triglycerides | <100 | <150 | mg/dL | Lower is better |
| ApoB | <70 | <90 | mg/dL | Best predictor of cardiovascular risk |

### Metabolic Markers

| Biomarker | Optimal | Normal | Unit | Notes |
|-----------|---------|--------|------|-------|
| HbA1c | <5.2 | <5.7 | % | 3-month glucose average |
| Fasting Insulin | 2-5 | <25 | µIU/mL | Lower is better |
| HOMA-IR | <1.0 | <2.5 | ratio | Insulin resistance score |
| Vitamin D (25-OH) | 50-70 | 30-100 | ng/mL | Most people deficient |
| Homocysteine | <7 | <15 | µmol/L | Lower is better |

### Inflammation Markers

| Biomarker | Optimal | Normal | Unit | Notes |
|-----------|---------|--------|------|-------|
| hs-CRP | <0.5 | <1.0 | mg/L | High-sensitivity CRP |
| Ferritin | 30-100 | 12-300 | ng/mL | Iron storage; high can be bad |
| Fibrinogen | 200-300 | 200-400 | mg/dL | Clotting factor |

### Hormones

| Biomarker | Optimal | Normal | Unit | Notes |
|-----------|---------|--------|------|-------|
| TSH | 1.0-2.0 | 0.4-4.0 | mIU/L | Thyroid function |
| Free T3 | 3.0-4.0 | 2.3-4.2 | pg/mL | Active thyroid hormone |
| Free T4 | 1.2-1.5 | 0.8-1.8 | ng/dL | Thyroid storage form |
| Testosterone (M) | 600-900 | 300-1000 | ng/dL | Age-dependent |
| DHEA-S | varies | varies | µg/dL | Age-dependent |

---

## Body Composition (DEXA)

### Reference Ranges

| Metric | Optimal (M) | Optimal (F) | Unit |
|--------|-------------|-------------|------|
| Body Fat % | 10-18 | 18-25 | % |
| Visceral Fat | <1.0 | <1.0 | lbs |
| Bone Mineral Density | T-score > -1 | T-score > -1 | — |
| Appendicular Lean Mass Index | >7.26 | >5.45 | kg/m² |

### Interpretation

- **Body Fat %:** Lower is generally better for metabolic health, but too low (<6% M, <14% F) is unhealthy
- **Visceral Fat:** Fat around organs; strongly linked to metabolic disease
- **Bone Density:** T-score compares to young adult; >-1 is normal, -1 to -2.5 is osteopenia, <-2.5 is osteoporosis
- **ALMI:** Appendicular Lean Mass Index = (arm + leg lean mass in kg) / height²

---

## Activity Metrics

### Heart Rate Variability (HRV)

| Age | Good | Excellent | Unit |
|-----|------|-----------|------|
| 20-29 | 55-80 | >80 | ms (RMSSD) |
| 30-39 | 50-75 | >75 | ms |
| 40-49 | 45-65 | >65 | ms |
| 50-59 | 35-55 | >55 | ms |
| 60+ | 25-45 | >45 | ms |

Higher HRV = better recovery capacity and parasympathetic tone.

### Resting Heart Rate

| Category | Range | Unit |
|----------|-------|------|
| Excellent | <50 | bpm |
| Good | 50-60 | bpm |
| Average | 60-70 | bpm |
| Below Average | 70-80 | bpm |
| Poor | >80 | bpm |

### Sleep

| Metric | Optimal | Acceptable | Unit |
|--------|---------|------------|------|
| Duration | 7-9 | 6-10 | hours |
| REM % | 20-25 | 15-30 | % |
| Deep Sleep % | 15-20 | 10-25 | % |
| Sleep Efficiency | >90 | >85 | % |

---

## Verified Sources

### Primary Research

| Source | URL | Use For |
|--------|-----|---------|
| PubMed | https://pubmed.ncbi.nlm.nih.gov | Research studies, clinical evidence |
| NIH | https://nih.gov | Health guidelines, reference ranges |
| Examine.com | https://examine.com | Supplement evidence, dosing |

### Longevity Protocols

| Source | URL | Use For |
|--------|-----|---------|
| Bryan Johnson Blueprint | https://blueprint.bryanjohnson.com | Protocols, supplement stacks, targets |
| Peter Attia / Outlive | https://peterattiamd.com | Longevity framework, zone 2, lipids |

### Agent Search Instructions

When searching for health information:

1. **Prefer primary sources:** PubMed, NIH over blogs
2. **Check publication date:** Prefer studies from last 5 years
3. **Look for meta-analyses:** More reliable than single studies
4. **Bryan Johnson Blueprint:** Good for practical protocols
5. **Examine.com:** Best for supplement questions
6. **Avoid:** Random health blogs, supplement company sites, anecdotal forums

### Citation Format

When citing sources in responses:
```
According to [Source Name], [claim]. (URL)
```

Example:
```
According to a 2018 study in Aging, the Levine PhenoAge formula uses 9 biomarkers to predict biological age. (https://doi.org/10.18632/aging.101414)
```

---

## Common Recommendations

### Low Vitamin D (<30 ng/mL)

- **Target:** 50-70 ng/mL
- **Action:** Supplement D3, 2000-5000 IU daily
- **Retest:** 3 months
- **Source:** Examine.com, Blueprint

### High LDL (>100 mg/dL)

- **Target:** <70 mg/dL (longevity-focused)
- **Action:** Reduce saturated fat, consider plant sterols, exercise
- **Advanced:** Discuss statins with doctor if ApoB elevated
- **Source:** Peter Attia, AHA guidelines

### High Fasting Glucose (>100 mg/dL)

- **Target:** 70-85 mg/dL
- **Action:** Reduce refined carbs, increase fiber, zone 2 exercise
- **Monitor:** HbA1c for longer-term trend
- **Source:** NIH diabetes prevention guidelines

### Low HRV

- **Target:** Age-appropriate range (see table above)
- **Action:** Prioritize sleep, reduce alcohol, manage stress, aerobic exercise
- **Note:** HRV is highly individual; track YOUR trend over time
- **Source:** Whoop research, HRV4Training studies

### High CRP (>1.0 mg/L)

- **Target:** <0.5 mg/L
- **Action:** Identify inflammation source, omega-3s, reduce processed foods
- **Rule out:** Acute infection (retest if sick when drawn)
- **Source:** Cleveland Clinic, Blueprint

---

## Disclaimer

This knowledge base is for informational purposes only. Vitals.AI is not a medical device and does not provide medical advice. Always consult a qualified healthcare provider for medical decisions.

Users should:
- Share results with their doctor
- Not make medication changes based solely on this tool
- Understand that "optimal" ranges are based on longevity research, not clinical standards
- Recognize individual variation exists

The Levine PhenoAge formula is a research tool, not a clinical diagnostic.
