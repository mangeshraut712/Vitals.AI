import { getDataFiles, type DataFile, type FileType } from '@/lib/files';
import { DataSourcesClient } from './DataSourcesClient';

export interface DataSourceInfo {
  name: string;
  type: FileType;
  extension: string;
  size: number;
  lastModified: string;
  status: 'loaded' | 'error' | 'pending';
  extractedData?: string[];
}

function getDataSourcesInfo(): DataSourceInfo[] {
  const files = getDataFiles();

  return files.map((file): DataSourceInfo => {
    const extractedData: string[] = [];

    // Describe what data was extracted
    if (file.type === 'bloodwork') {
      extractedData.push('Biomarker values', 'Lab reference ranges', 'Patient age');
    } else if (file.type === 'dexa') {
      extractedData.push('Body fat percentage', 'Lean mass', 'Bone density');
    } else if (file.type === 'activity') {
      extractedData.push('Heart rate variability', 'Resting heart rate', 'Sleep data');
    }

    return {
      name: file.name,
      type: file.type,
      extension: file.extension,
      size: file.size ?? 0,
      lastModified: file.lastModified ?? new Date().toISOString(),
      status: 'loaded',
      extractedData,
    };
  });
}

export default function DataSourcesPage(): React.JSX.Element {
  const dataSources = getDataSourcesInfo();

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Data Sources</h1>
        <p className="text-gray-500 mt-1">Manage your health data files</p>
      </header>

      <DataSourcesClient dataSources={dataSources} />
    </div>
  );
}
