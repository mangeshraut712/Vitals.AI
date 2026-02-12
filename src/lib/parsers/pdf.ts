import fs from 'fs';

export async function parsePdf(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('[Vitals.AI] PDF file not found:', filePath);
      return '';
    }

    const { default: pdfParse } = await import('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);

    console.log('[Vitals.AI] Parsed PDF:', filePath, `(${result.text.length} chars)`);

    return result.text;
  } catch (error) {
    console.error('[Vitals.AI] Error parsing PDF:', filePath, error);
    return '';
  }
}
