import fs from 'fs';
import pdfParse from 'pdf-parse';

export async function parsePdf(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('[Vitals.AI] PDF file not found:', filePath);
      return '';
    }

    const dataBuffer = fs.readFileSync(filePath);
    const result = await pdfParse(dataBuffer);

    console.log('[Vitals.AI] Parsed PDF:', filePath, `(${result.text.length} chars)`);

    return result.text;
  } catch (error) {
    console.error('[Vitals.AI] Error parsing PDF:', filePath, error);
    return '';
  }
}
