import { getDataFiles, type FileType } from '@/lib/files';
import { DataSourcesClient } from './DataSourcesClient';
import { PageHero } from '@/components/layout/PageHero';
import { FolderSync } from 'lucide-react';

export const dynamic = 'force-dynamic';

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
    <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
      <PageHero
        eyebrow="Data Layer"
        title="Data Sources"
        description="Manage local files powering your dashboards. Imports are privacy-first and processed directly in your project runtime."
        icon={FolderSync}
      />

      <DataSourcesClient dataSources={dataSources} />
    </div>
  );
}
