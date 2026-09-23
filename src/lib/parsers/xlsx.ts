import ExcelJS from 'exceljs';

export interface XlsxRow {
  [key: string]: string | number | boolean | undefined;
}

export interface XlsxSheet {
  name: string;
  data: XlsxRow[];
}

function cellValue(value: ExcelJS.CellValue): string | number | boolean | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    if ('result' in value) return cellValue(value.result as ExcelJS.CellValue);
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join('');
    }
    if ('text' in value && value.text != null) return String(value.text);
  }
  return String(value);
}

export async function parseXlsx(filePath: string): Promise<XlsxSheet[]> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheets: XlsxSheet[] = [];

    workbook.eachSheet((worksheet) => {
      const rows: XlsxRow[] = [];
      let headers: string[] = [];
      worksheet.eachRow((row, rowNumber) => {
        const values = (row.values as ExcelJS.CellValue[]).slice(1);
        if (rowNumber === 1) {
          headers = values.map((value, index) => {
            const header = cellValue(value);
            return header == null || header === '' ? `column_${index + 1}` : String(header);
          });
          return;
        }
        const record: XlsxRow = {};
        values.forEach((value, index) => {
          const key = headers[index] || `column_${index + 1}`;
          record[key] = cellValue(value);
        });
        rows.push(record);
      });
      sheets.push({ name: worksheet.name, data: rows });
    });

    return sheets;
  } catch (error) {
    console.error('[Vitals.AI] Error reading XLSX file:', filePath, error);
    return [];
  }
}
