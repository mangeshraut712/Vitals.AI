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
    expect(biomarkers.rdw).toBeUndefined();
    expect(biomarkers.wbc).toBe(6.2);
    expect(biomarkers.lymphocytePercent).toBe(35.2);
    expect(biomarkers.patientAge).toBe(26);
  });

  it('reads RDW-CV percent and ignores a neighboring RDW-SD femtoliter value', () => {
    const text = `
fL
44.9
40.0-50.0
Red Cell Distribution Width

%
13.2
11.5-14.5
Red Cell Distribution Width

RDW-CV: 13.4%
RDW: 44.9
`;

    const biomarkers = extractBiomarkers(text);

    expect(biomarkers.rdw).toBe(13.2);
  });

  it('accepts a plain RDW percent and rejects an unlabeled RDW-SD value', () => {
    expect(extractBiomarkers('RDW: 12.8').rdw).toBe(12.8);
    expect(extractBiomarkers('RDW: 44.9').rdw).toBeUndefined();
  });

  // Regression (review on #57): the RDW fallback used to try only its first
  // match, so a rejected RDW-SD femtoliter value hid a valid RDW-CV later in
  // the report and left rdw unset. Every match of a pattern is now tried.
  it('skips a rejected RDW-SD and still reads a later RDW-CV with no percent sign', () => {
    const text = 'RDW 44.9 fL\nRDW-CV 13.2 11.5-14.5';

    expect(extractBiomarkers(text).rdw).toBe(13.2);
  });

  it('keeps an RDW-CV that appears before an RDW-SD line', () => {
    expect(extractBiomarkers('RDW-CV 12.9 %\nRDW-SD 44.9 fL').rdw).toBe(12.9);
  });

  it('skips several RDW-SD values before finding RDW-CV', () => {
    expect(extractBiomarkers('RDW 41.0 fL\nRDW 47.0 fL\nRDW 13.6').rdw).toBe(13.6);
  });

  it('returns no RDW rather than an out-of-range value, even when nothing else matches', () => {
    expect(extractBiomarkers('RDW-SD 46.0 fL').rdw).toBeUndefined();
    expect(extractBiomarkers('RDW-CV 130').rdw).toBeUndefined();
  });

  it('accepts RDW at both ends of the percent band and rejects just outside it', () => {
    expect(extractBiomarkers('RDW 8').rdw).toBe(8);
    expect(extractBiomarkers('RDW 30').rdw).toBe(30);
    expect(extractBiomarkers('RDW 7.9').rdw).toBeUndefined();
    expect(extractBiomarkers('RDW 30.1').rdw).toBeUndefined();
  });

  // The CV pattern needs a separator right after "rdw", so an explicit SD
  // label is never mistaken for a CV value, whatever the number is.
  it('does not read an RDW-SD label as RDW-CV even when its value is in range', () => {
    expect(extractBiomarkers('RDW-SD 15 fL').rdw).toBeUndefined();
  });
});
