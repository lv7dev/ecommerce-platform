import { Skeleton } from '@/shared/ui/skeleton';

export function ProductGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border bg-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-4 p-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="flex items-end justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
