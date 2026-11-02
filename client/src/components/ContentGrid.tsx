import type { Content, ContentKind } from '../types';
import { ContentCard } from './ContentCard';
import { cn } from '../utils/format';

interface ContentGridProps {
  items: Content[];
  loading?: boolean;
  skeletonCount?: number;
  className?: string;
  emptyState?: React.ReactNode;
  defaultKind?: ContentKind;
}

export function ContentGrid({
  items,
  loading = false,
  skeletonCount = 12,
  className,
  emptyState,
  defaultKind,
}: ContentGridProps) {
  if (loading && items.length === 0) {
    return (
      <div
        className={cn(
          'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={index}>
            <div className="aspect-[2/3] skeleton rounded-xl" />
            <div className="mt-3 h-3.5 w-4/5 skeleton" />
            <div className="mt-2 h-2.5 w-2/5 skeleton" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
        className
      )}
    >
      {items.map((item, index) => (
        <ContentCard
          key={`${item.content_type ?? defaultKind ?? 'movie'}-${item.id}-${index}`}
          content={item}
          defaultKind={defaultKind}
        />
      ))}
    </div>
  );
}
