import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

export interface CsvRow {
  [key: string]: string | number | undefined;
}

export function parseCsv(filePath: string): CsvRow[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const result = Papa.parse<CsvRow>(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
    });

    // Filter out benign errors like "TooFewFields" which often occur on trailing newlines
    const meaningfulErrors = result.errors.filter((err) => err.code !== 'TooFewFields');

    if (meaningfulErrors.length > 0) {
      const preview = meaningfulErrors
        .slice(0, 5)
        .map((err) => {
          const row = typeof err.row === 'number' ? `row ${err.row}` : 'row ?';
          return `${row}: ${err.code}`;
        })
        .join(', ');

      console.warn(
        `[Vitals.AI] CSV parsing warnings in ${path.basename(filePath)}: ` +
        `${meaningfulErrors.length} total (${preview}${meaningfulErrors.length > 5 ? ', ...' : ''})`
      );
    }

    return result.data;
  } catch (error) {
    console.error('[Vitals.AI] Error reading CSV file:', filePath, error);
    return [];
  }
}
