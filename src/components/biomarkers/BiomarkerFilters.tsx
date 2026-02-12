'use client';

export type StatusFilter = 'all' | 'optimal' | 'normal' | 'outOfRange';
export type CategoryFilter = 'all' | 'phenoage' | 'lipids' | 'metabolic' | 'thyroid' | 'other';

interface BiomarkerFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  categoryFilter: CategoryFilter;
  onCategoryChange: (category: CategoryFilter) => void;
  onReset: () => void;
}

export function BiomarkerFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  onReset,
}: BiomarkerFiltersProps): React.JSX.Element {
  const hasActiveFilters = searchQuery || statusFilter !== 'all' || categoryFilter !== 'all';

  const baseInputClass = "bg-card text-foreground border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";

  return (
    <div className="flex flex-wrap items-center gap-3 vitals-fade-in-delay-1">
      {/* Search input */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <input
          type="text"
          placeholder="Search biomarkers..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`${baseInputClass} w-full pl-10`}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Status filter */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className={`${baseInputClass} cursor-pointer min-w-[140px]`}
      >
        <option value="all">All Ranges</option>
        <option value="optimal">Optimal</option>
        <option value="normal">Normal</option>
        <option value="outOfRange">Out of Range</option>
      </select>

      {/* Category filter */}
      <select
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value as CategoryFilter)}
        className={`${baseInputClass} cursor-pointer min-w-[140px]`}
      >
        <option value="all">All Categories</option>
        <option value="phenoage">PhenoAge</option>
        <option value="lipids">Lipids</option>
        <option value="metabolic">Metabolic</option>
        <option value="thyroid">Thyroid</option>
        <option value="other">Other</option>
      </select>

      {/* Reset button */}
      <div className={`transition-all duration-300 ${hasActiveFilters ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        <button
          onClick={onReset}
          className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
}

// Category mappings for filtering
export const BIOMARKER_CATEGORIES: Record<string, CategoryFilter> = {
  // PhenoAge biomarkers
  albumin: 'phenoage',
  creatinine: 'phenoage',
  glucose: 'phenoage',
  crp: 'phenoage',
  lymphocytePercent: 'phenoage',
  mcv: 'phenoage',
  rdw: 'phenoage',
  alkalinePhosphatase: 'phenoage',
  wbc: 'phenoage',

  // Lipids
  ldl: 'lipids',
  hdl: 'lipids',
  triglycerides: 'lipids',
  totalCholesterol: 'lipids',

  // Metabolic
  vitaminD: 'metabolic',
  hba1c: 'metabolic',
  fastingInsulin: 'metabolic',
  homocysteine: 'metabolic',
  ferritin: 'metabolic',

  // Thyroid
  tsh: 'thyroid',
  freeT4: 'thyroid',
  freeT3: 'thyroid',

  // Other (body comp)
  bodyFatPercent: 'other',
  visceralFat: 'other',
  boneDensityTScore: 'other',
};
