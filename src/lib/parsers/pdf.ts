import fs from 'fs';
import path from 'path';

type PdfParseResult = { text?: string };
type PdfParseFn = (data: Buffer) => Promise<PdfParseResult>;
let pdfParseOverride: PdfParseFn | null = null;

export function __setPdfParseForTests(fn: PdfParseFn | null): void {
  pdfParseOverride = fn;
}

function loadPdfParse(): PdfParseFn {
  if (pdfParseOverride) {
    return pdfParseOverride;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('pdf-parse/lib/pdf-parse.js') as PdfParseFn;
}

/**
 * Parse a PDF file and extract its text content.
 *
 * pdf-parse has a known bug where dynamic `import()` triggers a test-file read.
 * We work around it by requiring the library's internal lib file directly,
 * which skips the test-runner bootstrap code in the package's index.js.
 */
export async function parsePdf(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('[Vitals.AI] PDF file not found:', filePath);
      return '';
    }

    const dataBuffer = fs.readFileSync(filePath);

    // Use internal parser path to bypass package index bootstrap in tests/runtimes.
    const pdfParse = loadPdfParse();
    const originalWarn = console.warn;
    const originalLog = console.log;
    const shouldSuppress = (args: unknown[]): boolean =>
      typeof args[0] === 'string' && args[0].startsWith('Warning: TT: undefined function:');

    console.warn = (...args: unknown[]) => {
      if (shouldSuppress(args)) return;
      originalWarn(...args);
    };
    console.log = (...args: unknown[]) => {
      if (shouldSuppress(args)) return;
      originalLog(...args);
    };

    let result: PdfParseResult;
    try {
      result = await pdfParse(dataBuffer);
    } finally {
      console.warn = originalWarn;
      console.log = originalLog;
    }

    const text = result.text?.trim() ?? '';
    console.log('[Vitals.AI] Parsed PDF:', path.basename(filePath), `(${text.length} chars)`);

    return text;
  } catch (error) {
    console.error('[Vitals.AI] Error parsing PDF:', filePath, error);
    return '';
  }
}
