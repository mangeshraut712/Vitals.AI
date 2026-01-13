'use client';

import { CARD_CLASSES } from '@/lib/design/tokens';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps): React.JSX.Element {
  const baseClasses = 'animate-pulse bg-slate-200 rounded';

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function CardSkeleton(): React.JSX.Element {
  return (
    <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
      <Skeleton variant="text" className="w-24 h-4 mb-4" />
      <Skeleton variant="rectangular" className="w-full h-32 mb-4" />
      <Skeleton variant="text" className="w-full h-4 mb-2" />
      <Skeleton variant="text" className="w-3/4 h-4" />
    </div>
  );
}

export function TableRowSkeleton(): React.JSX.Element {
  return (
    <div className={`${CARD_CLASSES.base} p-4 grid grid-cols-12 gap-4 items-center`}>
      <Skeleton variant="text" className="col-span-4 h-4" />
      <Skeleton variant="text" className="col-span-2 h-6 w-20" />
      <Skeleton variant="text" className="col-span-2 h-4" />
      <Skeleton variant="rectangular" className="col-span-4 h-10" />
    </div>
  );
}

export function SummarySkeleton(): React.JSX.Element {
  return (
    <div className={`${CARD_CLASSES.base} ${CARD_CLASSES.padding}`}>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="text-center">
            <Skeleton variant="text" className="w-12 h-8 mx-auto mb-2" />
            <Skeleton variant="text" className="w-16 h-3 mx-auto" />
          </div>
        ))}
      </div>
      <Skeleton variant="rectangular" className="w-full h-3 rounded-full" />
    </div>
  );
}
