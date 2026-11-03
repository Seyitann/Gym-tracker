import type { Workout } from "../types";
import { localDateKey, startOfWeek } from "./dates";

export interface DayFocus {
  label: string;
  muscleGroups?: string[];
  categories?: string[];
}

// What the app suggests on each weekday (0 = Sunday)
export const dayFocus: Record<number, DayFocus> = {
  0: { label: "Full body", muscleGroups: ["full_body"] },
  1: { label: "Chest & shoulders", muscleGroups: ["chest", "shoulders"] },
  2: { label: "Arms", muscleGroups: ["arms"] },
  3: { label: "Legs", muscleGroups: ["legs"] },
  4: { label: "Back", muscleGroups: ["back"] },
  5: { label: "Core", muscleGroups: ["core"] },
  6: { label: "Cardio & HIIT", categories: ["cardio", "hiit"] },
};

export function matchesFocus(w: Workout, focus: DayFocus): boolean {
  if (focus.categories) return focus.categories.includes(w.category);
  return (focus.muscleGroups ?? []).includes(w.muscle_group);
}

// ---- skipping a workout day and pushing it later in the week ----

export interface Reschedule {
  from: number;
  to: number;
}

function storageKey(d: Date): string {
  return `reschedule_${localDateKey(startOfWeek(d))}`;
}

export function readReschedule(d: Date): Reschedule | null {
  try {
    const raw = localStorage.getItem(storageKey(d));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.from === "number" && typeof parsed.to === "number") return parsed;
  } catch {
    // ignore corrupt data
  }
  return null;
}

export function writeReschedule(d: Date, value: Reschedule) {
  localStorage.setItem(storageKey(d), JSON.stringify(value));
}

export function removeReschedule(d: Date) {
  localStorage.removeItem(storageKey(d));
}

// If a workout was pushed to today, today follows the pushed day's focus
export function focusDayFor(todayIdx: number, r: Reschedule | null): number {
  return r && r.to === todayIdx ? r.from : todayIdx;
}

export function plannedDaySet(days: number[], r: Reschedule | null): Set<number> {
  const set = new Set(days);
  if (r) {
    set.delete(r.from);
    set.add(r.to);
  }
  return set;
}
