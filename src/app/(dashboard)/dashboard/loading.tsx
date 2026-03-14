import { Skeleton } from "@/components/ui/skeleton";
import { KpiBlockSkeleton } from "@/components/ui/kpi-block";

export default function DashboardLoading() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
      {/* Hero skeleton */}
      <Skeleton className="w-full aspect-[21/9] max-h-[400px] rounded-xl mb-8 mt-6" />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 mt-6">
        <KpiBlockSkeleton variant="primary" />
        <KpiBlockSkeleton variant="accent" />
        <KpiBlockSkeleton variant="primary" />
        <KpiBlockSkeleton variant="accent" />
        <KpiBlockSkeleton variant="solar" />
        <KpiBlockSkeleton variant="solar" />
        <KpiBlockSkeleton variant="water" />
        <KpiBlockSkeleton variant="water" />
      </div>

      {/* Chart skeleton */}
      <div className="rounded-lg border bg-card p-6 mb-8">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <Skeleton className="h-[300px] w-full" />
      </div>

      {/* Weight distribution skeleton */}
      <div className="rounded-lg border bg-card p-6 mb-8">
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-4 w-72 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>

      {/* Activity + Events skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-36 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="h-5 w-44 mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
