import fs from 'fs';
import path from 'path';
import { isWhoopFolder } from './parsers/whoop';

export type FileType = 'bloodwork' | 'dexa' | 'activity' | 'activity_folder' | 'unknown';
export type TrackerType = 'whoop' | 'apple' | 'oura' | 'fitbit' | 'unknown';

export interface DataFile {
  name: string;
  type: FileType;
  path: string;
  extension: string;
  size?: number;
  lastModified?: string;
  isFolder?: boolean;
  trackerType?: TrackerType;
}

const DATA_DIR = path.join(process.cwd(), 'data');

// Organized folder structure
const BLOODWORK_DIR = path.join(DATA_DIR, 'Bloodwork');
const BODY_SCAN_DIR = path.join(DATA_DIR, 'Body Scan');
const ACTIVITY_DIR = path.join(DATA_DIR, 'Activity');

// Tracker subfolders within Activity
const TRACKER_FOLDERS: { name: string; type: TrackerType }[] = [
  { name: 'Whoop', type: 'whoop' },
  { name: 'Apple Health', type: 'apple' },
  { name: 'Oura', type: 'oura' },
  { name: 'Fitbit', type: 'fitbit' },
];

const SUPPORTED_EXTENSIONS = ['.txt', '.csv', '.xlsx', '.pdf', '.xml', '.json', '.zip'];

/**
 * Check if a folder contains Apple Health export
 */
function isAppleHealthFolder(folderPath: string): boolean {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return false;
  }
  const files = fs.readdirSync(folderPath);
  return files.some(
    (f) => f.toLowerCase() === 'export.xml' || f.toLowerCase() === 'export.zip'
  );
}

/**
 * Check if a folder contains Oura export
 */
function isOuraFolder(folderPath: string): boolean {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return false;
  }
  const files = fs.readdirSync(folderPath);
  return files.some(
    (f) =>
      f.toLowerCase().includes('oura') ||
      f.toLowerCase().startsWith('daily_') ||
      f.toLowerCase().startsWith('sleep_') ||
      f.toLowerCase().startsWith('readiness_')
  );
}

/**
 * Check if a folder contains Fitbit export (Google Takeout format)
 */
function isFitbitFolder(folderPath: string): boolean {
  if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
    return false;
  }
  const files = fs.readdirSync(folderPath);
  // Fitbit exports have sleep-*.json, heart_rate-*.json, etc.
  return files.some(
    (f) =>
      f.toLowerCase().startsWith('sleep-') ||
      f.toLowerCase().startsWith('heart_rate-') ||
      f.toLowerCase().startsWith('steps-')
  );
}

/**
 * Scan a directory for supported files
 */
function scanDirectory(
  dirPath: string,
  fileType: FileType,
  trackerType?: TrackerType
): DataFile[] {
  const dataFiles: DataFile[] = [];

  if (!fs.existsSync(dirPath)) {
    return dataFiles;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const entryPath = path.join(dirPath, entry.name);
    const stats = fs.statSync(entryPath);

    if (entry.isDirectory()) {
      // For activity folders, check if it's a tracker data folder
      if (fileType === 'activity_folder') {
        dataFiles.push({
          name: entry.name,
          type: 'activity_folder',
          path: entryPath,
          extension: '',
          size: undefined,
          lastModified: stats.mtime.toISOString(),
          isFolder: true,
          trackerType,
        });
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        dataFiles.push({
          name: entry.name,
          type: fileType,
          path: entryPath,
          extension: ext,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          isFolder: false,
          trackerType,
        });
      }
    }
  }

  return dataFiles;
}

/**
 * Detect which tracker has data in the Activity folder
 * Returns the first tracker folder that contains data
 */
function detectActiveTracker(): { trackerType: TrackerType; path: string; files: DataFile[] } | null {
  if (!fs.existsSync(ACTIVITY_DIR)) {
    return null;
  }

  for (const tracker of TRACKER_FOLDERS) {
    const trackerPath = path.join(ACTIVITY_DIR, tracker.name);

    if (!fs.existsSync(trackerPath)) {
      continue;
    }

    // Check if this tracker folder has data
    let hasData = false;
    let dataPath = trackerPath;

    if (tracker.type === 'whoop') {
      // Whoop: look for subfolders with physiological_cycles.csv
      const subfolders = fs.readdirSync(trackerPath, { withFileTypes: true });
      for (const sub of subfolders) {
        if (sub.isDirectory() && !sub.name.startsWith('.')) {
          const subPath = path.join(trackerPath, sub.name);
          if (isWhoopFolder(subPath)) {
            hasData = true;
            dataPath = subPath;
            break;
          }
        }
      }
    } else if (tracker.type === 'apple') {
      // Apple Health: look for export.xml directly or in a subfolder
      if (isAppleHealthFolder(trackerPath)) {
        hasData = true;
      } else {
        // Check subfolders
        const subfolders = fs.readdirSync(trackerPath, { withFileTypes: true });
        for (const sub of subfolders) {
          if (sub.isDirectory() && !sub.name.startsWith('.')) {
            const subPath = path.join(trackerPath, sub.name);
            if (isAppleHealthFolder(subPath)) {
              hasData = true;
              dataPath = subPath;
              break;
            }
          }
        }
      }
    } else if (tracker.type === 'oura') {
      // Oura: look for oura_*.json or daily_*.csv
      if (isOuraFolder(trackerPath)) {
        hasData = true;
      } else {
        const subfolders = fs.readdirSync(trackerPath, { withFileTypes: true });
        for (const sub of subfolders) {
          if (sub.isDirectory() && !sub.name.startsWith('.')) {
            const subPath = path.join(trackerPath, sub.name);
            if (isOuraFolder(subPath)) {
              hasData = true;
              dataPath = subPath;
              break;
            }
          }
        }
      }
    } else if (tracker.type === 'fitbit') {
      // Fitbit: look for sleep-*.json, heart_rate-*.json
      if (isFitbitFolder(trackerPath)) {
        hasData = true;
      } else {
        const subfolders = fs.readdirSync(trackerPath, { withFileTypes: true });
        for (const sub of subfolders) {
          if (sub.isDirectory() && !sub.name.startsWith('.')) {
            const subPath = path.join(trackerPath, sub.name);
            if (isFitbitFolder(subPath)) {
              hasData = true;
              dataPath = subPath;
              break;
            }
          }
        }
      }
    }

    if (hasData) {
      const files: DataFile[] = [];
      const stats = fs.statSync(dataPath);

      files.push({
        name: path.basename(dataPath),
        type: 'activity_folder',
        path: dataPath,
        extension: '',
        size: undefined,
        lastModified: stats.mtime.toISOString(),
        isFolder: true,
        trackerType: tracker.type,
      });

      return {
        trackerType: tracker.type,
        path: dataPath,
        files,
      };
    }
  }

  return null;
}

/**
 * Get all data files from the organized folder structure
 *
 * Structure:
 * /data/
 * ├── Activity/
 * │   ├── Whoop/
 * │   ├── Apple Health/
 * │   ├── Oura/
 * │   └── Fitbit/
 * ├── Bloodwork/
 * └── Body Scan/
 */
export function getDataFiles(): DataFile[] {
  const dataFiles: DataFile[] = [];

  // Check if we have the organized folder structure
  const hasOrganizedStructure =
    fs.existsSync(BLOODWORK_DIR) ||
    fs.existsSync(BODY_SCAN_DIR) ||
    fs.existsSync(ACTIVITY_DIR);

  if (hasOrganizedStructure) {
    // Scan organized folders

    // Bloodwork
    const bloodworkFiles = scanDirectory(BLOODWORK_DIR, 'bloodwork');
    dataFiles.push(...bloodworkFiles);

    // Body Scan (DEXA)
    const dexaFiles = scanDirectory(BODY_SCAN_DIR, 'dexa');
    dataFiles.push(...dexaFiles);

    // Activity - detect which tracker has data
    const activeTracker = detectActiveTracker();
    if (activeTracker) {
      dataFiles.push(...activeTracker.files);
    }
  } else {
    // Fallback: scan root /data folder with old logic for backward compatibility
    dataFiles.push(...scanLegacyDataFolder());
  }

  console.log(
    '[Vitals.AI] Detected data sources:',
    dataFiles.map(
      (f) =>
        `${f.name} (${f.type}${f.trackerType ? `, ${f.trackerType}` : ''}${f.isFolder ? ', folder' : ''})`
    )
  );

  return dataFiles;
}

/**
 * Legacy scanning logic for backward compatibility
 * Used when files are directly in /data folder
 */
function scanLegacyDataFolder(): DataFile[] {
  if (!fs.existsSync(DATA_DIR)) {
    console.log('[Vitals.AI] Data directory not found:', DATA_DIR);
    return [];
  }

  const dataFiles: DataFile[] = [];
  const entries = fs.readdirSync(DATA_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;

    const entryPath = path.join(DATA_DIR, entry.name);
    const stats = fs.statSync(entryPath);

    if (entry.isDirectory()) {
      // Handle folders (like Whoop data exports)
      const folderType = getLegacyFolderType(entryPath, entry.name);
      if (folderType !== 'unknown') {
        dataFiles.push({
          name: entry.name,
          type: folderType,
          path: entryPath,
          extension: '',
          size: undefined,
          lastModified: stats.mtime.toISOString(),
          isFolder: true,
          trackerType: folderType === 'activity_folder' ? 'whoop' : undefined,
        });
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        dataFiles.push({
          name: entry.name,
          type: getLegacyFileType(entry.name),
          path: entryPath,
          extension: ext,
          size: stats.size,
          lastModified: stats.mtime.toISOString(),
          isFolder: false,
        });
      }
    }
  }

  return dataFiles;
}

function getLegacyFileType(filename: string): FileType {
  const lower = filename.toLowerCase();

  if (lower.includes('blood') || lower.includes('lab') || lower.includes('metabolic')) {
    return 'bloodwork';
  }
  if (lower.includes('dexa') || lower.includes('body') || lower.includes('composition')) {
    return 'dexa';
  }
  if (
    lower.includes('whoop') ||
    lower.includes('activity') ||
    lower.includes('hrv') ||
    lower.includes('sleep')
  ) {
    return 'activity';
  }

  return 'unknown';
}

function getLegacyFolderType(folderPath: string, folderName: string): FileType {
  // Check if it's a Whoop data export folder
  if (isWhoopFolder(folderPath)) {
    return 'activity_folder';
  }

  // Check folder name patterns
  const lower = folderName.toLowerCase();
  if (lower.includes('whoop') || lower.includes('activity') || lower.includes('fitness')) {
    return 'activity_folder';
  }

  return 'unknown';
}
