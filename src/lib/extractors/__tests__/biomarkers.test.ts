import { describe, expect, it } from 'vitest';
import { extractBiomarkers } from '@/lib/extractors/biomarkers';

describe('extractBiomarkers', () => {
  it('extracts Thyrocare-style CBC and chemistry values correctly', () => {
    const text = `
C.L.I.A
9.74
Bio. Ref. Interval. :-
ng/mL25-OH VITAMIN D

PHOTOMETRY
93.1
mg/dL
FASTING BLOOD SUGAR

ALBUMIN - SERUMPHOTOMETRY3.2-4.8gm/dL 4.34
CREATININE - SERUMPHOTOMETRY0.72-1.18mg/dL 0.92
ALKALINE PHOSPHATASEPHOTOMETRY45-129U/L 114

fL
92.3
83.0-101.0
Mean Corpuscular Volume (MCV)

fL
44.9
40.0-50.0
Red Cell Distribution Width

X 10³ / μL
6.2
4.0 - 10.0
TOTAL LEUCOCYTE COUNT (WBC)

%
35.2
20-40
Lymphocytes Percentage

Mangesh Raut(26Y/M)
`;

    const biomarkers = extractBiomarkers(text);

    expect(biomarkers.vitaminD).toBe(9.74);
    expect(biomarkers.glucose).toBe(93.1);
    expect(biomarkers.albumin).toBe(4.34);
    expect(biomarkers.creatinine).toBe(0.92);
    expect(biomarkers.alkalinePhosphatase).toBe(114);
    expect(biomarkers.mcv).toBe(92.3);
    expect(biomarkers.rdw).toBe(44.9);
    expect(biomarkers.wbc).toBe(6.2);
    expect(biomarkers.lymphocytePercent).toBe(35.2);
    expect(biomarkers.patientAge).toBe(26);
  });
});
