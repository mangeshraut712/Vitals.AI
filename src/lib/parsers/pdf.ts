import fs from 'fs';
import { PDFParse } from 'pdf-parse';

export async function parsePdf(filePath: string): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      console.error('[HealthAI] PDF file not found:', filePath);
      return '';
    }

    const dataBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    const result = await parser.getText();

    console.log('[HealthAI] Parsed PDF:', filePath, `(${result.numPages} pages, ${result.text.length} chars)`);

    await parser.destroy();

    return result.text;
  } catch (error) {
    console.error('[HealthAI] Error parsing PDF:', filePath, error);
    return '';
  }
}
