type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "h-4 w-full" }: SkeletonProps) {
  return <div className={`rs-skeleton ${className}`} aria-hidden />;
}

export function SkeletonCard() {
  return (
    <div className="rs-card space-y-3 p-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
