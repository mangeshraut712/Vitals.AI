import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { parseXlsx } from '../parsers/xlsx';

const require = createRequire(import.meta.url);

describe('parseXlsx', () => {
  it('keeps legacy archive wildcard selection compatible and excludes other files', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'vitals-glob-test-'));

    try {
      await writeFile(path.join(directory, 'sample.xlsx'), 'synthetic filename fixture');
      await writeFile(path.join(directory, 'ignore.txt'), 'not a spreadsheet');
      const archiveUtils = require('archiver-utils') as {
        file: { expand(options: { cwd: string }, pattern: string): string[] };
      };

      expect(archiveUtils.file.expand({ cwd: directory }, '*.xlsx')).toEqual(['sample.xlsx']);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('reads multiple XLSX sheets and cell values, including cached formula results', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'vitals-xlsx-test-'));

    try {
      const filePath = path.join(directory, 'synthetic.xlsx');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Synthetic data');
      sheet.addRow(['Label', 'Value', 'Enabled', 'Date', 'Formula', 'Rich text']);
      sheet.addRow([
        'example',
        12.5,
        true,
        new Date('2026-01-02T00:00:00.000Z'),
        { formula: '1+2', result: 3 },
        { richText: [{ text: 'plain ' }, { text: 'text', font: { bold: true } }] },
      ]);
      const secondSheet = workbook.addWorksheet('Second sheet');
      secondSheet.addRow(['Name', 'Count']);
      secondSheet.addRow(['another example', 0]);
      await workbook.xlsx.writeFile(filePath);

      expect(await parseXlsx(filePath)).toEqual([
        {
          name: 'Synthetic data',
          data: [{
            Label: 'example',
            Value: 12.5,
            Enabled: true,
            Date: '2026-01-02T00:00:00.000Z',
            Formula: 3,
            'Rich text': 'plain text',
          }],
        },
        { name: 'Second sheet', data: [{ Name: 'another example', Count: 0 }] },
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
