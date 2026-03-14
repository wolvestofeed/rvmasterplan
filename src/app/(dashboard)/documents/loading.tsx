import { Skeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="container mx-auto py-10 px-4 md:px-8 max-w-6xl">
      <Skeleton className="w-full aspect-[21/9] max-h-[400px] rounded-xl mb-8 mt-6" />
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="h-5 w-48 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
