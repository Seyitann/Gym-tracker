export const goals = [
  { value: "lose_weight", label: "Lose Weight", icon: "⚖️" },
  { value: "build_muscle", label: "Build Muscle", icon: "💪" },
  { value: "improve_flexibility", label: "Become Flexible", icon: "🧘" },
  { value: "increase_endurance", label: "Increase Endurance", icon: "🏃" },
  { value: "general_fitness", label: "General Fitness", icon: "🎯" },
  { value: "athletic_performance", label: "Athletic Performance", icon: "🏆" },
];

export const dayNamesShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const dayNamesTwo = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function goalLabel(value: string | null | undefined): string {
  return goals.find((g) => g.value === value)?.label ?? "Not set";
}

export function parseWorkoutDays(value: string | null | undefined): number[] {
  if (!value) return [];
  return value
    .split(",")
    .filter((d) => d !== "")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
}

export function serializeWorkoutDays(days: number[]): string {
  return [...days].sort((a, b) => a - b).join(",");
}
