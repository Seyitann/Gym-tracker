import type { CSSProperties } from "react";

export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <div className={`animate-pulse rounded-xl bg-line ${className}`} style={style} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-white border border-line p-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-5 w-2/3 mt-3" />
      <Skeleton className="h-4 w-1/3 mt-2" />
    </div>
  );
}