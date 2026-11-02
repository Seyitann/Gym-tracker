export interface AppUser {
  id: string;
  email: string;
  name: string;
}

export interface Profile {
  id: string;
  name: string;
  goal: string | null;
  height_cm: number | null;
  starting_weight: number | null;
  target_weight: number | null;
  workout_days: string; // e.g. "1,3,5" (0 = Sunday)
  onboarding_complete: boolean;
}

export interface ProfileInput {
  goal: string;
  height_cm: number | null;
  starting_weight: number | null;
  target_weight: number | null;
  workout_days: string;
}

export interface Workout {
  id: number;
  name: string;
  category: string;
  muscle_group: string;
  equipment: string;
  difficulty: string;
  duration_mins: number;
  calories_estimate: number;
  instructions: string;
}

export interface WeightLog {
  id: number;
  weight: number; // always stored in kg
  logged_at: string; // "YYYY-MM-DD"
}

export interface WorkoutLog {
  id: number;
  workout_id: number;
  logged_at: string; // ISO timestamp
  duration_mins: number | null;
  sets: number | null;
  reps: number | null;
  weight_used: number | null; // always stored in kg
  notes: string | null;
}

export interface WorkoutLogInput {
  duration_mins: number | null;
  weight_used?: number | null;
  sets?: number | null;
  reps?: number | null;
}

export interface BodyMeasurement {
  id: number;
  measurement_type: string;
  value: number; // cm
  logged_at: string;
}

export type PhotoType = "before" | "after";

export interface ProgressPhoto {
  id: number;
  photo_type: PhotoType;
  url: string; // temporary signed URL
  uploaded_at: string;
}
