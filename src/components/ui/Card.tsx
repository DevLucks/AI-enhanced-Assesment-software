interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  className = "",
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-100 shadow-sm p-5 ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* StatCard                                                             */
/* ------------------------------------------------------------------ */

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: "indigo" | "violet" | "green" | "amber" | "red" | "blue";
  sub?: string;
  trend?: string;
  trendUp?: boolean;
}

const iconBg: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  violet: "bg-violet-50 text-violet-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
  blue: "bg-blue-50 text-blue-600",
};

export function StatCard({
  label,
  value,
  icon,
  color = "indigo",
  sub,
  trend,
  trendUp,
}: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 font-heading leading-none">
            {value}
          </p>
          {sub && (
            <p className="mt-1 text-xs text-slate-400 truncate">{sub}</p>
          )}
          {trend && (
            <p
              className={`mt-1 text-xs font-medium ${
                trendUp ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <div
          className={`shrink-0 p-3 rounded-xl ${iconBg[color]}`}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
