export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "2026-07-07" -> local Date (avoids the UTC shift of new Date("2026-07-07"))
export function parseDateOnly(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(d: Date): Date {
  const s = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  s.setDate(s.getDate() - s.getDay());
  return s;
}

export function shortDate(value: string): string {
  return parseDateOnly(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// Longest run of consecutive days, given "YYYY-MM-DD" keys
export function longestStreak(dayKeys: string[]): number {
  const days = [...new Set(dayKeys)]
    .map((k) => {
      const [y, m, d] = k.split("-").map(Number);
      return Math.round(Date.UTC(y, m - 1, d) / 86400000);
    })
    .sort((a, b) => a - b);

  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}
