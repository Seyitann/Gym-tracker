export type Units = "kg" | "lbs";

export interface Preferences {
  units: Units;
  smartWeightReps: boolean;
  restTimerSeconds: number;
  warmupEnabled: boolean;
  soundsEnabled: boolean;
  workoutReminders: boolean;
  motivationalNotifications: boolean;
  tabDisplay: "list" | "grid";
}

const KEY = "gym_tracker_preferences";

const defaults: Preferences = {
  units: "kg",
  smartWeightReps: true,
  restTimerSeconds: 60,
  warmupEnabled: true,
  soundsEnabled: true,
  workoutReminders: false,
  motivationalNotifications: false,
  tabDisplay: "list",
};

export function getPreferences(): Preferences {
  try {
    const stored = localStorage.getItem(KEY);
    return stored ? { ...defaults, ...JSON.parse(stored) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function updatePreference<K extends keyof Preferences>(
  key: K,
  value: Preferences[K]
): Preferences {
  const updated = { ...getPreferences(), [key]: value };
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // storage unavailable (private mode): keep the in-memory value only
  }
  return updated;
}

// Weights are always stored in kilograms; these convert for display and input.
const LBS_PER_KG = 2.20462;

export function fromKg(kg: number, units: Units): number {
  const value = units === "lbs" ? kg * LBS_PER_KG : kg;
  return Math.round(value * 10) / 10;
}

export function toKg(value: number, units: Units): number {
  const kg = units === "lbs" ? value / LBS_PER_KG : value;
  return Math.round(kg * 100) / 100;
}
