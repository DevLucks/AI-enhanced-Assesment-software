interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "primary";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  neutral: "bg-slate-100 text-slate-600",
  primary: "bg-indigo-50 text-indigo-700",
};

export default function Badge({
  variant = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

/* GradeCircle — coloured circle with grade letter */
export function GradeCircle({ grade }: { grade: string }) {
  const letter = grade?.[0]?.toUpperCase() ?? "–";

  const colorMap: Record<string, string> = {
    A: "bg-emerald-500",
    B: "bg-blue-500",
    C: "bg-amber-500",
    D: "bg-orange-500",
    F: "bg-red-500",
  };

  return (
    <div
      className={`${colorMap[letter] ?? "bg-slate-400"} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm`}
    >
      {letter}
    </div>
  );
}
