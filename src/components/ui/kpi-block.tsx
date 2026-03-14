import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export type KpiVariant = "primary" | "accent" | "solar" | "water";

const variantStyles: Record<KpiVariant, string> = {
  primary:
    "bg-gradient-to-br from-white/90 via-white/40 to-brand-primary/30 border-2 border-brand-primary/20",
  accent:
    "bg-gradient-to-br from-white/90 via-white/40 to-brand-accent/40 border-2 border-brand-accent/20",
  solar:
    "bg-gradient-to-br from-white/90 via-white/40 to-brand-solar/30 border-2 border-brand-solar/20",
  water:
    "bg-gradient-to-br from-white/90 via-white/40 to-brand-blue-accent/30 border-2 border-brand-blue-accent/20",
};

interface KpiBlockProps {
  label: string;
  variant?: KpiVariant;
  children: React.ReactNode;
  className?: string;
}

export function KpiBlock({
  label,
  variant = "primary",
  children,
  className,
}: KpiBlockProps) {
  return (
    <div
      className={cn(
        variantStyles[variant],
        "p-4 rounded-lg shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden",
        className
      )}
    >
      <div className="text-sm text-brand-primary font-medium mb-1 relative z-10">
        {label}
      </div>
      {children}
    </div>
  );
}

export function KpiBlockSkeleton({ variant = "primary", className }: { variant?: KpiVariant; className?: string }) {
  return (
    <div
      className={cn(
        variantStyles[variant],
        "p-4 rounded-lg shadow-[4px_4px_12px_rgba(0,0,0,0.15)] text-center relative overflow-hidden",
        className
      )}
    >
      <Skeleton className="h-4 w-20 mx-auto mb-2" />
      <Skeleton className="h-7 w-24 mx-auto" />
    </div>
  );
}
