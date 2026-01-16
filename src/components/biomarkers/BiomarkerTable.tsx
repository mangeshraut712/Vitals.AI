'use client';

import { useMemo, useState } from 'react';
import { STATUS_CLASSES, CARD_CLASSES, getStatusType, type StatusType } from '@/lib/design/tokens';
import { getBiomarkerStatus, BIOMARKER_REFERENCES, type BiomarkerStatus } from '@/lib/types/health';
import { Sparkline } from '@/components/charts/Sparkline';
import { StatusFilter, CategoryFilter, BIOMARKER_CATEGORIES } from './BiomarkerFilters';
import { BiomarkerInfoModal } from './BiomarkerInfoModal';

export interface BiomarkerRow {
  key: string;
  name: string;
  value: number;
  unit: string;
  status: BiomarkerStatus;
  statusType: StatusType;
  category: string;
  history?: number[];
  optimalRange?: { min?: number; max?: number };
}

interface BiomarkerTableProps {
  biomarkers: BiomarkerRow[];
  searchQuery: string;
  statusFilter: StatusFilter;
  categoryFilter: CategoryFilter;
}

type SortField = 'name' | 'status' | 'value';
type SortDirection = 'asc' | 'desc';

function getStatusLabel(status: BiomarkerStatus): string {
  switch (status) {
    case 'optimal': return 'Optimal';
    case 'normal': return 'Normal';
    case 'borderline': return 'Borderline';
    case 'out_of_range': return 'Out of Range';
  }
}

function getStatusPriority(status: BiomarkerStatus): number {
  switch (status) {
    case 'out_of_range': return 0;
    case 'borderline': return 1;
    case 'normal': return 2;
    case 'optimal': return 3;
  }
}

function mapStatusToType(status: BiomarkerStatus): StatusType {
  if (status === 'optimal') return 'optimal';
  if (status === 'out_of_range') return 'outOfRange';
  return 'normal';
}

export function BiomarkerTable({
  biomarkers,
  searchQuery,
  statusFilter,
  categoryFilter,
}: BiomarkerTableProps): React.JSX.Element {
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedBiomarker, setSelectedBiomarker] = useState<BiomarkerRow | null>(null);

  const filteredAndSorted = useMemo(() => {
    let result = [...biomarkers];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((b) => b.name.toLowerCase().includes(query));
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((b) => {
        if (statusFilter === 'optimal') return b.status === 'optimal';
        if (statusFilter === 'normal') return b.status === 'normal' || b.status === 'borderline';
        if (statusFilter === 'outOfRange') return b.status === 'out_of_range';
        return true;
      });
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      result = result.filter((b) => BIOMARKER_CATEGORIES[b.key] === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = getStatusPriority(a.status) - getStatusPriority(b.status);
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [biomarkers, searchQuery, statusFilter, categoryFilter, sortField, sortDirection]);

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  if (filteredAndSorted.length === 0) {
    return (
      <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding} text-center`}>
        <p className="text-slate-500">No biomarkers match your filters.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-slate-500">
        <button
          onClick={() => handleSort('name')}
          className="col-span-4 flex items-center gap-1 hover:text-slate-700 text-left"
        >
          Name
          <SortIndicator field="name" current={sortField} direction={sortDirection} />
        </button>
        <button
          onClick={() => handleSort('status')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-700 text-left"
        >
          Status
          <SortIndicator field="status" current={sortField} direction={sortDirection} />
        </button>
        <button
          onClick={() => handleSort('value')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-700 text-left"
        >
          Value
          <SortIndicator field="value" current={sortField} direction={sortDirection} />
        </button>
        <div className="col-span-4 text-left">History</div>
      </div>

      {/* Biomarker rows */}
      {filteredAndSorted.map((biomarker) => (
        <BiomarkerRowItem
          key={biomarker.key}
          biomarker={biomarker}
          onClick={() => setSelectedBiomarker(biomarker)}
        />
      ))}

      {/* Info Modal */}
      {selectedBiomarker && (
        <BiomarkerInfoModal
          biomarkerId={selectedBiomarker.key}
          name={selectedBiomarker.name}
          value={selectedBiomarker.value}
          unit={selectedBiomarker.unit}
          status={selectedBiomarker.status}
          category={selectedBiomarker.category}
          onClose={() => setSelectedBiomarker(null)}
        />
      )}
    </div>
  );
}

interface BiomarkerRowItemProps {
  biomarker: BiomarkerRow;
  onClick: () => void;
}

function BiomarkerRowItem({ biomarker, onClick }: BiomarkerRowItemProps): React.JSX.Element {
  const statusType = mapStatusToType(biomarker.status);
  const statusClasses = STATUS_CLASSES[statusType];

  return (
    <button
      onClick={onClick}
      className={`${CARD_CLASSES.base} ${CARD_CLASSES.hover} grid grid-cols-12 gap-4 items-center px-4 py-4 w-full text-left cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]`}>
      {/* Name */}
      <div className="col-span-4">
        <span className="font-medium text-slate-900">{biomarker.name}</span>
      </div>

      {/* Status badge */}
      <div className="col-span-2">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusClasses.dot}`} />
          {getStatusLabel(biomarker.status)}
        </span>
      </div>

      {/* Value */}
      <div className="col-span-2">
        <span className="font-medium text-slate-900">{biomarker.value}</span>
        <span className="text-slate-500 ml-1 text-sm">{biomarker.unit}</span>
      </div>

      {/* Sparkline */}
      <div className="col-span-4">
        <Sparkline
          data={biomarker.history || [biomarker.value]}
          status={statusType}
          optimalRange={biomarker.optimalRange}
          currentValue={biomarker.value}
        />
      </div>
    </button>
  );
}

interface SortIndicatorProps {
  field: SortField;
  current: SortField;
  direction: SortDirection;
}

function SortIndicator({ field, current, direction }: SortIndicatorProps): React.JSX.Element {
  if (field !== current) {
    return (
      <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }

  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={direction === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
      />
    </svg>
  );
}
