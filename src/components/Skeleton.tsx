export function ProjectCardSkeleton() {
  return (
    <div className="glass overflow-hidden">
      <div className="skeleton aspect-video rounded-none" />
      <div className="space-y-3 p-5">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-4/5" />
        <div className="flex gap-2 pt-2">
          <div className="skeleton h-5 w-12" />
          <div className="skeleton h-5 w-12" />
        </div>
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="glass p-6">
      <div className="skeleton mb-3 h-3 w-20" />
      <div className="skeleton h-8 w-16" />
    </div>
  );
}

export function RowSkeleton() {
  return <div className="skeleton h-14 w-full" />;
}
