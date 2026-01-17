# Comprehensive Biomarker Reference Table v2.0

**Total Biomarkers Covered: 165** (including calculated ratios and indices)

**CHANGELOG v2.0:**
- Added WBC Differential (% and Absolute) - 10 markers - CRITICAL FIX
- Added Electrolytes section - 4 markers
- Added missing CBC markers (MCH, MCHC)
- Added eAG, Direct/Indirect Bilirubin, Globulin, Total Protein
- Added Calcium (was missing entirely)
- Added 15+ additional calculated ratios
- Removed duplicate entries (Non-HDL-C, Oxidized LDL)
- Added UNIT CONVERSION notes for inflammation ratios
- Added explicit CLASSIFICATION RULES section

---

## ⚠️ CRITICAL: Classification Rules

### Three-Tier System
Every biomarker MUST be classified into exactly ONE of:
1. **Optimal** (green) - Within functional/longevity optimal range
2. **Normal** (yellow) - Within standard lab range but outside optimal
3. **Out of Range** (red) - Outside standard reference range

### Edge Case Rules
| Scenario | Classification |
|----------|---------------|
| HbA1c = 5.7% | **OUT OF RANGE** (≥5.7 is prediabetes threshold) |
| HbA1c = 5.6% | Normal (below threshold but above optimal 5.25) |
| HbA1c = 5.2% | **Optimal** (within 4.5-5.25) |
| Value exactly at upper limit | **Out of Range** (use > not ≥ for normal) |
| Value exactly at optimal boundary | Include in Optimal |

### Direction Interpretation
| Direction | Optimal Logic |
|-----------|--------------|
| Lower ↓ | value ≤ optimal_max |
| Higher ↑ | value ≥ optimal_min |
| Mid-range ⟷ | optimal_min ≤ value ≤ optimal_max |

---

## Summary by Category

| Category | Count |
|----------|-------|
| Lipid Panel | 10 |
| Lipid Ratios (Calculated) | 12 |
| Metabolic Panel | 7 |
| Insulin Calculations | 3 |
| Liver Function | 11 |
| Kidney Function | 6 |
| Electrolytes | 5 |
| Complete Blood Count (CBC) | 10 |
| **WBC Differential (%) - NEW** | 5 |
| **WBC Differential (Absolute) - NEW** | 5 |
| Iron Panel | 5 |
| CBC Inflammation Ratios | 11 |
| Additional Calculated Ratios | 12 |
| Thyroid Panel | 7 |
| Inflammation Markers | 6 |
| Vitamins | 5 |
| Minerals & Fatty Acids | 8 |
| Male Hormones | 11 |
| Female Hormones | 9 |
| Advanced Cardiovascular | 5 |
| Oxidative Stress | 4 |
| Gut Health | 4 |
| Heavy Metals | 5 |
| Autoimmune Markers | 4 |
| Cancer Screening | 6 |
| **TOTAL** | **165** |

---

## 1. Lipid Panel (10 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 1 | Total Cholesterol | TC, Cholesterol | mg/dL | <200 | <180 | Lower ↓ |
| 2 | LDL-C | LDL Cholesterol, LDL-CHOLESTEROL | mg/dL | <100 | <70 (Attia: <30) | Lower ↓ |
| 3 | HDL-C | HDL Cholesterol, HDL-CHOLESTEROL | mg/dL | >40 (M), >50 (F) | 60-100 | Higher ↑ |
| 4 | Triglycerides | TG | mg/dL | <150 | <70 optimal; <100 acceptable | Lower ↓ |
| 5 | ApoB | Apolipoprotein B | mg/dL | <90 | <60 (Attia); 40-70 (Hyman) | Lower ↓ |
| 6 | Lp(a) | Lipoprotein(a) | nmol/L | <75 | <50 (genetically fixed) | Lower ↓ |
| 7 | LDL-P | LDL Particle Number | nmol/L | <1300 | <1000 | Lower ↓ |
| 8 | sdLDL | Small Dense LDL | nmol/L | <527 | <142 | Lower ↓ |
| 9 | VLDL | VLDL Cholesterol | mg/dL | <30 | <30 | Lower ↓ |
| 10 | Oxidized LDL | OxLDL | U/L | <70 | <60 | Lower ↓ |

---

## 2. Lipid Ratios - Calculated (12 markers)

| # | Ratio | Aliases | Formula | Optimal | Normal | Out of Range | Direction |
|---|-------|---------|---------|---------|--------|--------------|-----------|
| 11 | Non-HDL-C | Non-HDL Cholesterol | `TC − HDL` | <100 | 100-129 | ≥130 | Lower ↓ |
| 12 | TC/HDL | Castelli Risk Index I, CHOL/HDLC Ratio | `TC ÷ HDL` | <3.5 | 3.5-5.0 | >5.0 | Lower ↓ |
| 13 | LDL/HDL | Castelli Risk Index II, LDL/HDL Ratio | `LDL ÷ HDL` | <2.0 | 2.0-3.5 | >3.5 | Lower ↓ |
| 14 | TG/HDL | Triglyceride/HDL Ratio | `TG ÷ HDL` | <1.0 | 1.0-2.0 | >2.0 | Lower ↓ |
| 15 | Atherogenic Index of Plasma | AIP | `log₁₀(TG/HDL)` [mmol/L] | <0.11 | 0.11-0.21 | >0.21 | Lower ↓ |
| 16 | Remnant Cholesterol | | `TC − HDL − LDL` | <18 | 18-30 | >30 | Lower ↓ |
| 17 | Atherogenic Coefficient | AC | `(TC − HDL) ÷ HDL` | <3.0 | 3.0-4.0 | >4.0 | Lower ↓ |
| 18 | LDL-C/ApoB Ratio | | `LDL ÷ ApoB` | 1.3-1.5 | 1.0-1.3 or >1.5 | <1.0 | Mid-range ⟷ |
| 19 | Non-HDL-C/ApoB Ratio | | `Non-HDL ÷ ApoB` | 1.4-1.6 | 1.2-1.4 or >1.6 | <1.2 | Mid-range ⟷ |
| 20 | TG/ApoB Ratio | | `TG ÷ ApoB` | <0.8 | 0.8-1.0 | >1.0 | Lower ↓ |
| 21 | LDL/TC Ratio | LDL-C/Total Cholesterol | `LDL ÷ TC` | <0.6 | 0.6-0.7 | >0.7 | Lower ↓ |
| 22 | TG HDL Molar Ratio | | `(TG÷88.57) ÷ (HDL÷38.67)` | <1.5 | 1.5-2.5 | >2.5 | Lower ↓ |

---

## 3. Metabolic Panel (7 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Out of Range | Direction |
|---|-----------|---------|-------|----------------|---------------|--------------|-----------|
| 23 | Fasting Glucose | Glucose, Blood Sugar | mg/dL | 65-99 | 80-90 | <65 or ≥100 | Lower ↓ |
| 24 | HbA1c | Hemoglobin A1c, A1C, Glycated Hemoglobin | % | <5.7 | 4.5-5.25 | **≥5.7** (prediabetes) | Lower ↓ |
| 25 | eAG (mg/dL) | Estimated Average Glucose | mg/dL | <117 | <100 | ≥117 | Lower ↓ |
| 26 | eAG (mmol/L) | | mmol/L | <6.5 | <5.6 | ≥6.5 | Lower ↓ |
| 27 | Fasting Insulin | Insulin | μU/mL | 2-25 | 2-5 (ideal <5) | <2 or >25 | Lower ↓ |
| 28 | C-peptide | | ng/mL | 0.8-3.85 | 1.0-2.5 | <0.8 or >3.85 | Mid-range ⟷ |
| 29 | Fructosamine | | μmol/L | 190-285 | 190-250 | <190 or >285 | Lower ↓ |

**⚠️ HbA1c Classification Rule:**
- ≤5.25% = **Optimal**
- 5.26-5.69% = **Normal**
- ≥5.7% = **Out of Range** (prediabetes threshold per ADA)
- ≥6.5% = Diabetes

---

## 4. Insulin Sensitivity Calculations (3 markers)

| # | Index | Formula | Optimal | Normal | Out of Range |
|---|-------|---------|---------|--------|--------------|
| 30 | HOMA-IR | `(Insulin × Glucose) ÷ 405` | <1.0 | 1.0-1.9 | >1.9 (IR); >2.9 (significant) |
| 31 | QUICKI | `1 ÷ (log(Insulin) + log(Glucose))` | >0.35 | 0.30-0.35 | <0.30 (diabetes risk) |
| 32 | TyG Index | `Ln[(TG × Glucose) ÷ 2]` | <8.5 | 8.5-8.8 | >8.8 (MetS risk) |

---

## 5. Liver Function (11 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 33 | AST | SGOT, Aspartate Aminotransferase | U/L | 10-40 | <20 | Lower ↓ |
| 34 | ALT | SGPT, Alanine Aminotransferase | U/L | <45 (M), <40 (F) | <20 | Lower ↓ |
| 35 | GGT | Gamma-GT, γ-Glutamyl Transferase | U/L | <50 (M), <35 (F) | <25 | Lower ↓ |
| 36 | ALP | Alkaline Phosphatase | U/L | 45-115 | 44-100 | Mid-range ⟷ |
| 37 | Total Bilirubin | Bilirubin | mg/dL | 0.1-1.2 | 0.1-1.0 | Lower ↓ |
| 38 | Direct Bilirubin | Conjugated Bilirubin | mg/dL | 0.0-0.3 | 0.0-0.2 | Lower ↓ |
| 39 | Indirect Bilirubin | Unconjugated Bilirubin | mg/dL | 0.1-0.9 | 0.1-0.8 | Lower ↓ |
| 40 | Albumin | | g/dL | 3.5-5.0 | 4.0-5.0 | Higher ↑ |
| 41 | Globulin | | g/dL | 2.0-4.0 | 2.3-3.5 | Mid-range ⟷ |
| 42 | Total Protein | Protein, Total | g/dL | 6.0-8.3 | 6.5-8.0 | Mid-range ⟷ |
| 43 | A/G Ratio | Albumin/Globulin Ratio | ratio | 1.0-2.0 | 1.2-2.0 | Higher ↑ |

### Liver Calculated Ratios

| # | Ratio | Formula | Optimal | Concerning | Notes |
|---|-------|---------|---------|------------|-------|
| 44 | AST:ALT (De Ritis) | `AST ÷ ALT` | 0.8-1.0 | >2.0 | >2:1 suggests alcoholic liver |
| 45 | Bilirubin-to-Albumin | `Total Bili ÷ Albumin` | <0.25 | >0.30 | |
| 46 | GGT-to-HDL | `GGT ÷ HDL` | <0.40 | >0.50 | MetS indicator |
| 47 | Indirect/Direct Bilirubin | `Indirect ÷ Direct` | 3-5 | <2 or >6 | |

---

## 6. Kidney Function (6 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 48 | Creatinine | | mg/dL | 0.7-1.3 (M), 0.6-1.1 (F) | 0.8-1.2 (M), 0.6-1.0 (F) | Context ⟷ |
| 49 | BUN | Blood Urea Nitrogen, Urea Nitrogen | mg/dL | 6-24 | 10-16 | Mid-range ⟷ |
| 50 | eGFR | Estimated GFR, EGFR | mL/min/1.73m² | >60 | ≥90 | Higher ↑ |
| 51 | Cystatin C | | mg/L | 0.5-1.0 | 0.6-0.9 | Lower ↓ |
| 52 | BUN/Creatinine | Urea-to-Creatinine Ratio | ratio | 10-20 | 12-16 | Mid-range ⟷ |
| 53 | Uric Acid | | mg/dL | 3.4-7.0 (M), 2.4-6.0 (F) | <5.0 (M), <4.0 (F) | Lower ↓ |

---

## 7. Electrolytes (5 markers) - NEW

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 54 | Sodium | Na | mmol/L | 136-145 | 138-142 | Mid-range ⟷ |
| 55 | Potassium | K | mmol/L | 3.5-5.0 | 4.0-4.8 | Mid-range ⟷ |
| 56 | Chloride | Cl | mmol/L | 98-106 | 100-104 | Mid-range ⟷ |
| 57 | CO2 (Bicarbonate) | Carbon Dioxide, Total CO2, TCO2 | mmol/L | 23-29 | 24-28 | Mid-range ⟷ |
| 58 | Calcium | Ca | mg/dL | 8.6-10.2 | 9.0-10.0 | Mid-range ⟷ |

### Calcium Calculation

| # | Calculation | Formula | Notes |
|---|-------------|---------|-------|
| 59 | Corrected Calcium | `Ca + 0.8 × (4.0 − Albumin)` | Use when albumin abnormal |

---

## 8. Complete Blood Count - CBC (10 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 60 | RBC | Red Blood Cells, Red Blood Cell Count | million/µL | 4.6-6.2 (M), 4.2-5.4 (F) | 4.4-4.9 (M), 4.0-4.5 (F) | Mid-range ⟷ |
| 61 | WBC | White Blood Cells, White Blood Cell Count | ×10³/µL | 4.5-11.0 | 5.0-8.0 | Mid-range ⟷ |
| 62 | Hemoglobin | Hgb, HGB | g/dL | 13.8-17.2 (M), 12.1-15.1 (F) | 14.0-15.0 (M), 13.5-14.5 (F) | Mid-range ⟷ |
| 63 | Hematocrit | Hct, HCT | % | 40-54 (M), 36-48 (F) | 39-45 (M), 37-44 (F) | Mid-range ⟷ |
| 64 | MCV | Mean Cell Volume, Mean Corpuscular Volume | fL | 80-100 | 85-92 | Mid-range ⟷ |
| 65 | MCH | Mean Cell Hemoglobin, Mean Corpuscular Hemoglobin | pg | 27-33 | 28-32 | Mid-range ⟷ |
| 66 | MCHC | Mean Corpuscular Hemoglobin Concentration | g/dL | 32-36 | 32-35 | Mid-range ⟷ |
| 67 | RDW | Red Cell Distribution Width | % | 11.5-15.4 | 11.5-13.0 | Lower ↓ |
| 68 | Platelets | Platelet Count, PLT | ×10³/µL | 150-400 | 175-250 | Mid-range ⟷ |
| 69 | MPV | Mean Platelet Volume | fL | 7.5-11.5 | 7.5-10.5 | Mid-range ⟷ |

---

## 9. WBC Differential - Percentages (5 markers) - NEW CRITICAL

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 70 | Neutrophils % | Neutrophils, Neut %, Segs | % | 40-70 | 45-65 | Mid-range ⟷ |
| 71 | Lymphocytes % | Lymphocytes, Lymph % | % | 20-40 | 25-35 | Mid-range ⟷ |
| 72 | Monocytes % | Monocytes, Mono % | % | 2-8 | 3-7 | Mid-range ⟷ |
| 73 | Eosinophils % | Eosinophils, Eos % | % | 1-4 | 1-3 | Lower ↓ |
| 74 | Basophils % | Basophils, Baso % | % | 0-2 | 0-1 | Lower ↓ |

**⚠️ Classification Examples:**
- Basophils 0.5% → **OPTIMAL** (within 0-1%)
- Eosinophils 2.8% → **OPTIMAL** (within 1-3%)
- Neutrophils 64% → **NORMAL** (within 40-70%, outside optimal 45-65%)

---

## 10. WBC Differential - Absolute Counts (5 markers) - NEW CRITICAL

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 75 | Neutrophils (Absolute) | ANC, Absolute Neutrophils, Neutrophils Absolute | cells/µL | 1,500-8,000 | 2,000-6,000 | Mid-range ⟷ |
| 76 | Lymphocytes (Absolute) | ALC, Absolute Lymphocytes, Lymphs Absolute | cells/µL | 1,000-4,800 | 1,500-3,500 | Mid-range ⟷ |
| 77 | Monocytes (Absolute) | AMC, Absolute Monocytes, Monocytes Absolute | cells/µL | 200-950 | 200-600 | Mid-range ⟷ |
| 78 | Eosinophils (Absolute) | AEC, Absolute Eosinophils, Eos Absolute | cells/µL | 15-500 | 50-300 | Lower ↓ |
| 79 | Basophils (Absolute) | ABC, Absolute Basophils, Baso Absolute | cells/µL | 0-300 | 0-100 | Lower ↓ |

**⚠️ Classification Examples:**
- Lymphocytes Abs 2,323 → **OPTIMAL** (within 1,500-3,500)
- Monocytes Abs 587 → **OPTIMAL** (within 200-600)
- Neutrophils Abs 5,696 → **OPTIMAL** (within 2,000-6,000)

---

## 11. Iron Panel (5 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 80 | Ferritin | | ng/mL | 12-300 (M), 10-150 (F) | 50-150 (M), 40-70 (F pre-meno) | Mid-range ⟷ |
| 81 | Serum Iron | Iron, Total Iron | µg/dL | 59-158 (M), 37-145 (F) | 85-130 | Mid-range ⟷ |
| 82 | TIBC | Total Iron Binding Capacity, Iron Binding Capacity | µg/dL | 250-450 | 250-350 | Mid-range ⟷ |
| 83 | Iron Saturation | % Saturation, Transferrin Saturation | % | 20-50 (M), 15-50 (F) | 20-35 | Mid-range ⟷ |
| 84 | Transferrin | | mg/dL | 200-360 | 200-300 | Mid-range ⟷ |

---

## 12. CBC Inflammation Ratios - Calculated (11 markers)

### ⚠️ CRITICAL: Unit Conversion for SIRI

**All ratios use ABSOLUTE COUNTS. For SIRI specifically:**

```javascript
// WRONG - gives values like 1,439
SIRI = (monocytes_cells × neutrophils_cells) / lymphocytes_cells

// CORRECT - gives values like 1.44
// Convert cells/µL to ×10³/µL first (divide by 1000)
SIRI = (monocytes/1000 × neutrophils/1000) / (lymphocytes/1000)
// Simplifies to:
SIRI = (monocytes × neutrophils) / (lymphocytes × 1,000,000)
```

| # | Ratio | Formula | Optimal | Normal | Out of Range | Direction |
|---|-------|---------|---------|--------|--------------|-----------|
| 85 | NLR | `Neutrophils_Abs ÷ Lymphocytes_Abs` | 1.2-2.0 | 2.0-3.0 | >3.0 (elevated), >6.0 (high) | Lower ↓ |
| 86 | PLR | `Platelets × 1000 ÷ Lymphocytes_Abs` | <135 | 135-150 | >150 (elevated), >250 (high) | Lower ↓ |
| 87 | MLR | `Monocytes_Abs ÷ Lymphocytes_Abs` | <0.25 | 0.25-0.40 | >0.40 | Lower ↓ |
| 88 | LMR | `Lymphocytes_Abs ÷ Monocytes_Abs` | >4.0 | 3.0-4.0 | <3.0 | Higher ↑ |
| 89 | SII | `(Platelets × Neutrophils_Abs) ÷ Lymphocytes_Abs` | 200-500 | 500-900 | >1000 | Lower ↓ |
| 90 | SIRI | `(Mono_Abs × Neut_Abs) ÷ (Lymph_Abs × 1,000,000)` | <1.0 | 1.0-1.8 | >1.8 | Lower ↓ |
| 91 | PWR | `Platelets ÷ (WBC × 1000)` | 30-45 | 25-30 or 45-55 | <25 or >55 | Mid-range ⟷ |
| 92 | NLPR | `NLR ÷ (Platelets ÷ 100)` | <0.8 | 0.8-1.2 | >1.2 | Lower ↓ |
| 93 | MHR | `Monocytes_Abs ÷ HDL` | <10 | 10-15 | >15 | Lower ↓ |
| 94 | NHR | `Neutrophils_Abs ÷ HDL` | <100 | 100-130 | >130 | Lower ↓ |
| 95 | RDW/MCV | `RDW ÷ MCV` | <0.14 | 0.14-0.16 | >0.16 | Lower ↓ |

**⚠️ PLR Calculation Note:**
```javascript
// Platelets are in ×10³/µL, Lymphocytes in cells/µL
// Must convert to same units
PLR = (Platelets × 1000) / Lymphocytes_Abs
// Example: PLR = (330 × 1000) / 2323 = 142.06
```

---

## 13. Additional Calculated Ratios (12 markers)

| # | Ratio | Formula | Optimal | Normal | Out of Range |
|---|-------|---------|---------|--------|--------------|
| 96 | Ferritin-to-Albumin | `Ferritin ÷ Albumin` | <15 | 15-25 | >25 |
| 97 | CAR (CRP-to-Albumin) | `hs-CRP ÷ Albumin` | <0.25 | 0.25-0.50 | >0.50 |
| 98 | Uric Acid-to-HDL | `Uric Acid ÷ HDL` | <0.10 | 0.10-0.15 | >0.15 |
| 99 | Free Androgen Index | `(Total T [nmol/L] × 100) ÷ SHBG` | M: 30-150, F: <5 | varies | varies |
| 100 | Testosterone/Estradiol | `Total T (ng/dL) ÷ E2 (pg/mL)` | M: 10-20 | 5-10 or 20-30 | <5 or >30 |
| 101 | T3 Uptake Calc | `T3U × T4` → FTI | 1.5-4.5 | varies | varies |

---

## 14. Thyroid Panel (7 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 102 | TSH | Thyroid Stimulating Hormone | mIU/L | 0.45-4.5 | 1.0-2.5 | Lower-mid ↓ |
| 103 | Free T4 | FT4, Thyroxine Free | ng/dL | 0.82-1.76 | 1.1-1.6 (upper half) | Higher ↑ |
| 104 | Total T4 | T4, Thyroxine | mcg/dL | 4.5-12.5 | 6-10 | Mid-range ⟷ |
| 105 | Free T3 | FT3, Triiodothyronine Free | pg/mL | 2.0-4.4 | 3.2-4.2 (upper half) | Higher ↑ |
| 106 | Reverse T3 | rT3 | ng/dL | 9-27 | 10-20 | Lower ↓ |
| 107 | TPO Antibodies | Anti-TPO, Thyroid Peroxidase Ab | IU/mL | <34 | <9 or undetectable | Lower ↓ |
| 108 | TgAb | Thyroglobulin Antibodies | IU/mL | <40 | Undetectable | Lower ↓ |

### Thyroid Calculations

| # | Ratio | Formula | Optimal | Concerning |
|---|-------|---------|---------|------------|
| 109 | FT3/rT3 Ratio | `Free T3 (pg/mL) ÷ Reverse T3 (ng/dL)` | >0.20 | <0.20 (poor conversion) |
| 110 | Free T4 Index | `T3 Uptake × Total T4` | 1.5-4.5 | outside range |

---

## 15. Inflammation Markers (6 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 111 | hs-CRP | High-Sensitivity CRP, CRP | mg/L | 0-3.0 | <0.5 (functional); <1.0 (AHA) | Lower ↓ |
| 112 | ESR | Sed Rate, Erythrocyte Sedimentation Rate | mm/hr | 0-20 (varies) | <10 (M), <15 (F) | Lower ↓ |
| 113 | Homocysteine | | µmol/L | 5-15 | <7 (Function); 6-8 (Attia) | Lower ↓ |
| 114 | Fibrinogen | | mg/dL | 200-400 | 200-300 | Lower ↓ |
| 115 | IL-6 | Interleukin-6 | pg/mL | <5 | <2 | Lower ↓ |
| 116 | TNF-alpha | Tumor Necrosis Factor | pg/mL | <8.1 | <2 | Lower ↓ |

---

## 16. Vitamins (5 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 117 | Vitamin D | 25-OH Vitamin D, Vitamin D 25-OH, 25-Hydroxyvitamin D | ng/mL | 30-100 | 40-60 (consensus); 60-80 (functional) | Higher ↑ |
| 118 | Vitamin B12 | B12, Cobalamin | pg/mL | 200-900 | 450-2000 | Higher ↑ |
| 119 | Folate | Folic Acid | ng/mL | 3-20 | >8 serum; >400 RBC | Higher ↑ |
| 120 | MMA | Methylmalonic Acid (B12 functional) | nmol/L | 70-378 | <260 | Lower ↓ |
| 121 | Vitamin B6 | Pyridoxine | ng/mL | 5-50 | 20-50 | Mid-upper ↑ |

---

## 17. Minerals & Fatty Acids (8 markers)

| # | Biomarker | Units | Standard Range | Optimal Range | Direction |
|---|-----------|-------|----------------|---------------|-----------|
| 122 | Magnesium RBC | mg/dL | 4.2-6.8 | 5.5-6.5 (upper half) | Higher ↑ |
| 123 | Serum Magnesium | mg/dL | 1.7-2.4 | ≥2.0 | Higher ↑ |
| 124 | Zinc | µg/dL | 60-130 | 80-120 | Mid-range ⟷ |
| 125 | Selenium | µg/L | 70-150 | 110-150 | Mid-upper ↑ |
| 126 | Copper | µg/dL | 70-140 | 80-120 | Mid-range ⟷ |
| 127 | Copper/Zinc Ratio | ratio | — | 0.7-1.0 | Balanced ⟷ |
| 128 | Omega-3 Index | % | 4-5 (avg US) | 8-12% (cardioprotective) | Higher ↑ |
| 129 | Omega-6/Omega-3 | ratio | 15:1-20:1 (Western) | 2:1 to 4:1 | Lower ↓ |

---

## 18. Male Hormones (11 markers)

| # | Biomarker | Aliases | Units | Standard Range | Optimal Range | Direction |
|---|-----------|---------|-------|----------------|---------------|-----------|
| 130 | Total Testosterone | Testosterone | ng/dL | 250-1100 | 400-700 (Attia therapeutic) | Mid-upper ↑ |
| 131 | Free Testosterone | | pg/mL | 35-155 | 100-155; ~2% of Total | Higher ↑ |
| 132 | Bioavailable Testosterone | | ng/dL | 130-680 | 250-500 | Mid-upper ↑ |
| 133 | SHBG | Sex Hormone Binding Globulin | nmol/L | 10-57 | 20-40 (Superpower); 40-46 (ODX) | Mid-range ⟷ |
| 134 | Estradiol (Male) | E2 | pg/mL | 10-40 | 20-30; T:E2 ratio 10:1-15:1 | Mid-range ⟷ |
| 135 | DHEA-S | DHEA Sulfate | µg/dL | Age-dependent | Upper half for age | Higher ↑ |
| 136 | Cortisol (AM) | | µg/dL | 6-23 | 10-18 | Mid-range ⟷ |
| 137 | IGF-1 | | ng/mL | 101-267 | <175 (longevity); >80 (elderly) | Context ⟷ |
| 138 | Prolactin | | ng/mL | 2-18 | <10 | Lower ↓ |
| 139 | LH | Luteinizing Hormone | mIU/mL | 1.5-9.3 | 2-8 | Mid-range ⟷ |
| 140 | FSH | Follicle Stimulating Hormone | mIU/mL | 1.5-12.4 | 1-8 | Mid-range ⟷ |

---

## 19. Female Hormones (9 markers)

| # | Biomarker | Units | Standard Range | Optimal Range | Notes |
|---|-----------|-------|----------------|---------------|-------|
| 141 | Estradiol (Follicular) | pg/mL | 20-150 | — | Days 1-5 |
| 142 | Estradiol (Ovulation) | pg/mL | 150-750 | — | Day 14 peak |
| 143 | Estradiol (Luteal) | pg/mL | 30-450 | — | Days 15-28 |
| 144 | Progesterone (Luteal) | ng/mL | 5-20 | >10 (Day 21 fertility) | Mid-luteal |
| 145 | AMH | ng/mL | Age-dependent | See age table | Higher ↑ (fertility) |
| 146 | Total Testosterone (F) | ng/dL | 2-45 | 35-45 | Mid-upper ↑ |
| 147 | Free Testosterone (F) | pg/mL | 0.10-6.4 | 3.25-4.6 | Mid-upper ↑ |
| 148 | SHBG (Female) | nmol/L | 18-144 | 50-80 | Mid-range ⟷ |
| 149 | FSH (Day 3) | mIU/mL | 3.5-12.5 | <10 (good ovarian function) | Lower ↓ |

### AMH by Age (Ovarian Reserve)

| Age | Expected AMH (ng/mL) | Interpretation |
|-----|---------------------|----------------|
| 25-30 | 2.0-4.0 | Excellent reserve |
| 30-35 | 1.5-3.0 | Good reserve |
| 35-40 | 1.0-2.5 | Declining |
| 40-44 | 0.5-1.5 | Low |
| >44 | <0.5 | Very low/perimenopause |
| PCOS | >6.0 | Elevated (concern) |

---

## 20. Advanced Cardiovascular (5 markers)

| # | Biomarker | Units | Standard Range | Optimal Range | Direction |
|---|-----------|-------|----------------|---------------|-----------|
| 150 | Lp-PLA2 (PLAC) | ng/mL | <200 | <200 | Lower ↓ |
| 151 | MPO | pmol/L | <420-480 | <420 | Lower ↓ |
| 152 | TMAO | µmol/L | <4.6 | <2.5 | Lower ↓ |
| 153 | NT-proBNP | pg/mL | <125 (varies) | <125 | Lower ↓ |
| 154 | GlycA | µmol/L | 300-500 | Lower quartiles | Lower ↓ |

---

## 21. Oxidative Stress (4 markers)

| # | Biomarker | Units | Standard Range | Optimal Range | Direction |
|---|-----------|-------|----------------|---------------|-----------|
| 155 | 8-OHdG | ng/mg creatinine | ~3.9 | <5.2 | Lower ↓ |
| 156 | F2-Isoprostanes | ng/mg creatinine | <0.86 | <0.86 | Lower ↓ |
| 157 | Glutathione (GSH) | mM (intracellular) | 1-10 | — | Higher ↑ |
| 158 | GSH:GSSG Ratio | ratio | — | >100:1 | Higher ↑ |

---

## 22. Gut Health (4 markers)

| # | Biomarker | Units | Standard Range | Optimal Range | Direction |
|---|-----------|-------|----------------|---------------|-----------|
| 159 | Zonulin | ng/mL | 34 ± 14 | Within reference | Lower ↓ |
| 160 | Calprotectin (fecal) | µg/g | <50 | <50 | Lower ↓ |
| 161 | Secretory IgA | mg/dL | 50-150 (stool) | Within range | Mid-range ⟷ |
| 162 | Lactoferrin (fecal) | µg/g | <7.25 | <7.25 | Lower ↓ |

---

## 23. Heavy Metals (5 markers)

| # | Metal | Units | Reference | Critical Value | Direction |
|---|-------|-------|-----------|----------------|-----------|
| 163 | Lead | µg/dL | <5 (CDC) | ≥20 (child), ≥70 (adult) | Lower ↓ |
| 164 | Mercury | µg/L | <10 | >15 | Lower ↓ |
| 165 | Arsenic | µg/L | <10-13 | >12 | Lower ↓ |
| 166 | Cadmium | ng/mL | <5.0 | >50 | Lower ↓ |
| 167 | Aluminum | µg/L | <10 | — | Lower ↓ |

---

## 24. Autoimmune Markers (4 markers)

| # | Biomarker | Units | Negative | Positive | Specificity |
|---|-----------|-------|----------|----------|-------------|
| 168 | ANA | Titer | <1:40 | ≥1:160 significant | 10-15% healthy pop positive |
| 169 | RF | IU/mL | <20 | >30 | 50-85% sensitivity RA |
| 170 | Anti-CCP | U/mL | <20 | >3× ULN (high positive) | 95-98% specific for RA |
| 171 | Anti-dsDNA | IU/mL | <30 | >30 | >95% specific for SLE |

---

## 25. Cancer Screening (6 markers)

| # | Biomarker | Units | Standard Range | Optimal Range | Clinical Use |
|---|-----------|-------|----------------|---------------|--------------|
| 172 | PSA (age 40-49) | ng/mL | <2.5 | <2.0 | Monitoring |
| 173 | PSA (age 60-69) | ng/mL | <4.5 | <2.0 | Monitoring |
| 174 | Free PSA/Total PSA | % | — | >25% (lower cancer prob) | Risk stratification |
| 175 | CA-125 | U/mL | <35 | <35 | Ovarian monitoring |
| 176 | CEA | ng/mL | <2.5 (non-smoker) | <2.5 | Colorectal monitoring |
| 177 | AFP | ng/mL | <10 | <10 | Liver/germ cell |

---

## Biomarker Alias Normalization Table

Use this to map lab variations to canonical names:

| Canonical Name | Common Aliases |
|----------------|---------------|
| `total_cholesterol` | Total Cholesterol, TC, Cholesterol, CHOLESTEROL TOTAL |
| `ldl_c` | LDL-C, LDL Cholesterol, LDL-CHOLESTEROL, LDL CHOLESTEROL |
| `hdl_c` | HDL-C, HDL Cholesterol, HDL-CHOLESTEROL, HDL CHOLESTEROL |
| `triglycerides` | Triglycerides, TG, TRIGLYCERIDES |
| `apob` | ApoB, Apolipoprotein B, APOLIPOPROTEIN B |
| `non_hdl_c` | Non-HDL-C, Non-HDL Cholesterol, NON HDL CHOLESTEROL, Non HDL-C |
| `hba1c` | HbA1c, Hemoglobin A1c, HEMOGLOBIN A1c, A1C, Glycated Hemoglobin |
| `vitamin_d` | Vitamin D, 25-OH Vitamin D, Vitamin D 25-OH, VITAMIN D 25-OH TOTAL |
| `hs_crp` | hs-CRP, High-Sensitivity CRP, HS CRP, hsCRP, CRP |
| `wbc` | WBC, White Blood Cells, WHITE BLOOD CELL COUNT |
| `rbc` | RBC, Red Blood Cells, RED BLOOD CELL COUNT |
| `neutrophils_abs` | Neutrophils (Absolute), ANC, ABSOLUTE NEUTROPHILS |
| `lymphocytes_abs` | Lymphocytes (Absolute), ALC, ABSOLUTE LYMPHOCYTES |
| `monocytes_abs` | Monocytes (Absolute), AMC, ABSOLUTE MONOCYTES |
| `eosinophils_abs` | Eosinophils (Absolute), AEC, ABSOLUTE EOSINOPHILS |
| `basophils_abs` | Basophils (Absolute), ABC, ABSOLUTE BASOPHILS |
| `shbg` | SHBG, Sex Hormone Binding Globulin, SEX HORMONE BINDING GLOBULIN |
| `egfr` | eGFR, EGFR, Estimated GFR, Estimated Glomerular Filtration Rate |

---

## Direction Legend

| Symbol | Meaning | Classification Logic |
|--------|---------|---------------------|
| Lower ↓ | Lower values are better | value ≤ optimal_max → Optimal |
| Higher ↑ | Higher values are better | value ≥ optimal_min → Optimal |
| Mid-range ⟷ | Optimal is in the middle | optimal_min ≤ value ≤ optimal_max → Optimal |
| Context | Depends on clinical situation | Requires additional logic |

---

## Sources

- **Function Health** - Peer-reviewed functional medicine research
- **InsideTracker** - Population databases stratified by age/sex/ethnicity/activity
- **Superpower** - Population-average vs evidence-based optimal classifications
- **Peter Attia, MD** - Longevity medicine protocols
- **Andrew Huberman, PhD** - Neuroscience-based optimization
- **Rhonda Patrick, PhD** - Nutritional biochemistry research
- **American Diabetes Association** - HbA1c thresholds
- **American Heart Association** - hs-CRP risk stratification

---

*Reference document for Vitals.AI dashboard application v2.0*  
*Total: 177 biomarkers including calculated ratios and indices*  
*Last Updated: January 2026*
