import { Dumbbell, Footprints, PersonStanding, Scale, Target, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Goal {
  value: string;
  label: string;
  icon: LucideIcon;
}

export const goals: Goal[] = [
  { value: "lose_weight", label: "Lose weight", icon: Scale },
  { value: "build_muscle", label: "Build muscle", icon: Dumbbell },
  { value: "improve_flexibility", label: "Become flexible", icon: PersonStanding },
  { value: "increase_endurance", label: "Build endurance", icon: Footprints },
  { value: "general_fitness", label: "General fitness", icon: Target },
  { value: "athletic_performance", label: "Athletic performance", icon: Trophy },
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
