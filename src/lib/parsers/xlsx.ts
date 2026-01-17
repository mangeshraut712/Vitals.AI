import * as XLSX from 'xlsx';

export interface XlsxRow {
  [key: string]: string | number | boolean | undefined;
}

export interface XlsxSheet {
  name: string;
  data: XlsxRow[];
}

export function parseXlsx(filePath: string): XlsxSheet[] {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheets: XlsxSheet[] = [];

    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<XlsxRow>(worksheet);
      sheets.push({
        name: sheetName,
        data,
      });
    }

    return sheets;
  } catch (error) {
    console.error('[Vitals.AI] Error reading XLSX file:', filePath, error);
    return [];
  }
}
