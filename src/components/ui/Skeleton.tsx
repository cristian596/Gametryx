import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-sm bg-surface-2", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-3 rounded-md bg-surface p-3">
      <Skeleton className="aspect-square w-full rounded-sm" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="mt-2 h-7 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div aria-hidden className="flex items-center gap-4 py-3">
      <Skeleton className="size-16 shrink-0" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return <Skeleton className="h-[min(72vh,640px)] w-full rounded-none" />;
}
