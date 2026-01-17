import fs from 'fs';
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

    if (result.errors.length > 0) {
      console.warn('[Vitals.AI] CSV parsing warnings:', result.errors);
    }

    return result.data;
  } catch (error) {
    console.error('[Vitals.AI] Error reading CSV file:', filePath, error);
    return [];
  }
}
