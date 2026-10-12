export function computeGrade(scored: number, total: number): string {
  const pct = total > 0 ? (scored / total) * 100 : 0;
  if (pct >= 70) return "A";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 45) return "D";
  return "F";
}
