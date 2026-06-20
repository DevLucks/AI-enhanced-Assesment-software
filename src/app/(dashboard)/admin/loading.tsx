import { TableSkeleton } from "@/components/ui/Skeleton";
import { CardGridSkeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header skeleton */}
      <div className="hidden lg:flex h-16 items-center justify-between border-b border-slate-100 bg-white px-8">
        <div className="space-y-1.5">
          <div className="h-5 w-40 rounded bg-slate-200 animate-pulse" />
          <div className="h-3 w-56 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-48 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse" />
        </div>
      </div>

      <main className="flex-1 p-4 lg:p-8 space-y-6">
        {/* Stat cards row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 animate-pulse"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-24 rounded bg-slate-200" />
                  <div className="h-7 w-16 rounded bg-slate-200" />
                  <div className="h-2.5 w-20 rounded bg-slate-100" />
                </div>
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Table or card grid */}
        <TableSkeleton rows={7} cols={5} />
      </main>
    </div>
  );
}
