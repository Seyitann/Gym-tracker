import { supabase } from "../lib/supabase";
import type {
  AppUser,
  BodyMeasurement,
  PhotoType,
  Profile,
  ProfileInput,
  ProgressPhoto,
  WeightLog,
  Workout,
  WorkoutLog,
  WorkoutLogInput,
} from "../types";

async function requireUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("You are not signed in.");
  return data.user.id;
}

// ---------- User & profile ----------

export async function getCurrentUser(): Promise<AppUser> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw error ?? new Error("You are not signed in.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", data.user.id)
    .maybeSingle();

  return { id: data.user.id, email: data.user.email ?? "", name: profile?.name ?? "" };
}

export async function updateName(name: string): Promise<AppUser> {
  const userId = await requireUserId();
  const { error } = await supabase.from("profiles").update({ name }).eq("id", userId);
  if (error) throw error;
  return getCurrentUser();
}

// Returns null until onboarding has been completed
export async function getProfile(): Promise<Profile | null> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.onboarding_complete) return null;
  return data as Profile;
}

export async function saveProfile(input: ProfileInput): Promise<Profile> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...input, onboarding_complete: true })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

// ---------- Workout library ----------

export async function getWorkouts(): Promise<Workout[]> {
  const { data, error } = await supabase.from("workouts").select("*").order("id");
  if (error) throw error;
  return data as Workout[];
}

// ---------- Weight ----------

export async function getWeightLogs(): Promise<WeightLog[]> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, weight, logged_at")
    .order("logged_at")
    .order("id");
  if (error) throw error;
  return data as WeightLog[];
}

export async function createWeightLog(weightKg: number, loggedAt?: string): Promise<WeightLog> {
  const { data, error } = await supabase
    .from("weight_logs")
    .insert({ weight: weightKg, logged_at: loggedAt })
    .select("id, weight, logged_at")
    .single();
  if (error) throw error;
  return data as WeightLog;
}

// ---------- Workout logs ----------

export async function getWorkoutLogs(): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from("workout_logs")
    .select("*")
    .order("logged_at")
    .order("id");
  if (error) throw error;
  return data as WorkoutLog[];
}

export async function createWorkoutLog(
  workoutId: number,
  input: WorkoutLogInput
): Promise<WorkoutLog> {
  const { data, error } = await supabase
    .from("workout_logs")
    .insert({
      workout_id: workoutId,
      duration_mins: input.duration_mins,
      weight_used: input.weight_used ?? null,
      sets: input.sets ?? null,
      reps: input.reps ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as WorkoutLog;
}

// ---------- Body measurements ----------

export async function getBodyMeasurements(): Promise<BodyMeasurement[]> {
  const { data, error } = await supabase
    .from("body_measurements")
    .select("id, measurement_type, value, logged_at")
    .order("logged_at")
    .order("id");
  if (error) throw error;
  return data as BodyMeasurement[];
}

export async function createBodyMeasurement(
  measurementType: string,
  value: number
): Promise<BodyMeasurement> {
  const { data, error } = await supabase
    .from("body_measurements")
    .insert({ measurement_type: measurementType, value })
    .select("id, measurement_type, value, logged_at")
    .single();
  if (error) throw error;
  return data as BodyMeasurement;
}

// ---------- Progress photos (Supabase Storage) ----------

const BUCKET = "progress-photos";

async function signedUrl(path: string): Promise<string> {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? "";
}

export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  const { data, error } = await supabase
    .from("progress_photos")
    .select("id, photo_type, image_path, uploaded_at")
    .order("uploaded_at");
  if (error) throw error;

  return Promise.all(
    data.map(async (row) => ({
      id: row.id as number,
      photo_type: row.photo_type as PhotoType,
      url: await signedUrl(row.image_path as string),
      uploaded_at: row.uploaded_at as string,
    }))
  );
}

export async function createProgressPhoto(
  photoType: PhotoType,
  file: Blob
): Promise<ProgressPhoto> {
  const userId = await requireUserId();
  const path = `${userId}/${photoType}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (uploadError) throw uploadError;

  await supabase.from("progress_photos").delete().eq("photo_type", photoType);
  const { data, error } = await supabase
    .from("progress_photos")
    .insert({ photo_type: photoType, image_path: path })
    .select("id, photo_type, uploaded_at")
    .single();
  if (error) throw error;

  return {
    id: data.id as number,
    photo_type: data.photo_type as PhotoType,
    url: await signedUrl(path),
    uploaded_at: data.uploaded_at as string,
  };
}
