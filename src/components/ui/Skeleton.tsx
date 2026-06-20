export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 ${className}`}
      aria-hidden="true"
    />
  );
}

/* TableSkeleton — full-width table placeholder */
export function TableSkeleton({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-sm" aria-busy="true" aria-label="Loading">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-6 py-3 text-left">
                <Skeleton className="h-3 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr
              key={r}
              className={r % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
            >
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-6 py-4">
                  <Skeleton
                    className={`h-3 ${
                      c === 0 ? "w-32" : c === cols - 1 ? "w-12" : "w-24"
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* CardGridSkeleton — grid of card placeholders */
export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 space-y-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-2.5 w-20" />
            </div>
          </div>
          <Skeleton className="h-5 w-28 rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
