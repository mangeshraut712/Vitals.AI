import fs from 'fs';
import path from 'path';

export type FileType = 'bloodwork' | 'dexa' | 'activity' | 'unknown';

export interface DataFile {
  name: string;
  type: FileType;
  path: string;
  extension: string;
  size?: number;
  lastModified?: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');

function getFileType(filename: string): FileType {
  const lower = filename.toLowerCase();

  if (lower.includes('blood') || lower.includes('lab') || lower.includes('metabolic')) {
    return 'bloodwork';
  }
  if (lower.includes('dexa') || lower.includes('body') || lower.includes('composition')) {
    return 'dexa';
  }
  if (lower.includes('whoop') || lower.includes('activity') || lower.includes('hrv') || lower.includes('sleep')) {
    return 'activity';
  }

  return 'unknown';
}

export function getDataFiles(): DataFile[] {
  const supportedExtensions = ['.txt', '.csv', '.xlsx', '.pdf'];

  if (!fs.existsSync(DATA_DIR)) {
    console.log('[HealthAI] Data directory not found:', DATA_DIR);
    return [];
  }

  const files = fs.readdirSync(DATA_DIR);
  const dataFiles: DataFile[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();

    if (supportedExtensions.includes(ext)) {
      const filePath = path.join(DATA_DIR, file);
      const stats = fs.statSync(filePath);
      const dataFile: DataFile = {
        name: file,
        type: getFileType(file),
        path: filePath,
        extension: ext,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
      };
      dataFiles.push(dataFile);
    }
  }

  console.log('[HealthAI] Detected data files:', dataFiles.map(f => `${f.name} (${f.type})`));

  return dataFiles;
}
