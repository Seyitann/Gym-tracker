import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Camera, Check, Flame, Lock, Trophy } from "lucide-react";
import {
  createBodyMeasurement,
  createProgressPhoto,
  createWeightLog,
  getBodyMeasurements,
  getProfile,
  getProgressPhotos,
  getWeightLogs,
  getWorkoutLogs,
  getWorkouts,
} from "../api/data";
import type {
  BodyMeasurement,
  PhotoType,
  Profile,
  ProgressPhoto,
  WeightLog,
  Workout,
  WorkoutLog,
} from "../types";
import { dayNamesShort } from "../constants";
import { fromKg, getPreferences, toKg } from "../utils/preferences";
import { localDateKey, longestStreak, shortDate, startOfWeek } from "../utils/dates";
import { resizeImage } from "../utils/image";
import Page from "../components/Page";
import ProgressRing from "../components/ProgressRing";
import { ErrorScreen, errorMessage } from "../components/PageState";
import { Skeleton } from "../components/Skeleton";
import { btnPrimary, inputClass, sectionTitle } from "../ui";

const measurementTypes = ["biceps", "abs", "waist", "chest", "shoulders", "thigh", "calf"];
const ranges = ["1W", "1M", "6M", "1Y", "All"] as const;
type Range = (typeof ranges)[number];

function rangeStart(range: Range, now: Date): Date | null {
  const d = new Date(now);
  if (range === "1W") d.setDate(d.getDate() - 7);
  else if (range === "1M") d.setMonth(d.getMonth() - 1);
  else if (range === "6M") d.setMonth(d.getMonth() - 6);
  else if (range === "1Y") d.setFullYear(d.getFullYear() - 1);
  else return null;
  return d;
}

const tooltipStyle = {
  border: "none",
  borderRadius: 12,
  boxShadow: "0 8px 24px -10px rgba(0,0,0,.25)",
};

function ProgressSkeleton() {
  return (
    <Page>
      <h1 className="text-2xl font-extrabold text-ink mb-5">Progress</h1>

      {/* Activity / Body tabs */}
      <Skeleton className="h-12 rounded-2xl mb-5" />

      <div className="space-y-5">
        {/* Stats */}
        <section className="bg-white rounded-3xl shadow-card p-4">
          <div className="grid grid-cols-5 gap-1 mb-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </section>

        {/* Your week */}
        <section className="bg-white rounded-3xl shadow-card p-4">
          <Skeleton className="h-5 w-24 mb-3" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-3 w-6" />
                <Skeleton className="w-9 h-9 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Weight */}
        <section className="bg-white rounded-3xl shadow-card p-4">
          <Skeleton className="h-6 w-20 mb-3" />
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-12 flex-1 rounded-2xl" />
            <Skeleton className="h-12 w-20 rounded-2xl" />
          </div>
          <Skeleton className="h-[200px] rounded-2xl" />
        </section>

        {/* Achievements */}
        <section className="bg-white rounded-3xl shadow-card p-4">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-12" />
          </div>
          <div className="flex flex-wrap gap-2">
            {[28, 24, 24, 28, 28, 24, 24].map((w, i) => (
              <Skeleton key={i} className="h-9 rounded-full" style={{ width: `${w * 4}px` }} />
            ))}
          </div>
        </section>

        {/* Exercise graph */}
        <section className="bg-white rounded-3xl shadow-card p-4">
          <Skeleton className="h-6 w-36 mb-3" />
          <Skeleton className="h-12 rounded-2xl" />
        </section>

        {/* Workout history */}
        <section>
          <Skeleton className="h-6 w-40 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white shadow-card px-4 py-3"
              >
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </Page>
  );
}

export default function Progress() {
  const prefs = getPreferences();
  const units = prefs.units;
  const [searchParams, setSearchParams] = useSearchParams();
  const weightInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<"activity" | "body">("activity");
  const [range, setRange] = useState<Range>("1W");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [newWeight, setNewWeight] = useState("");
  const [trackedWorkoutId, setTrackedWorkoutId] = useState("");
  const [measurementInputs, setMeasurementInputs] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<PhotoType | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getWeightLogs(),
      getWorkoutLogs(),
      getWorkouts(),
      getBodyMeasurements(),
      getProgressPhotos(),
      getProfile(),
    ])
      .then(([weights, logs, library, measures, photoList, profileData]) => {
        if (!active) return;
        setWeightLogs(weights);
        setWorkoutLogs(logs);
        setWorkouts(library);
        setMeasurements(measures);
        setPhotos(photoList);
        setProfile(profileData);
      })
      .catch((err) => active && setLoadError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // The + button can open this page straight to "log weight" or the Body tab
  useEffect(() => {
    if (loading) return;
    const tabParam = searchParams.get("tab");
    const add = searchParams.get("add");
    if (!tabParam && !add) return;
    if (tabParam === "body") setTab("body");
    if (add === "weight") {
      setTab("activity");
      window.setTimeout(() => {
        weightInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        weightInputRef.current?.focus();
      }, 150);
    }
    setSearchParams({}, { replace: true });
  }, [loading, searchParams, setSearchParams]);

  async function handleAddWeight(e: FormEvent) {
    e.preventDefault();
    setActionError("");
    const value = parseFloat(newWeight);
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      const created = await createWeightLog(toKg(value, units));
      setWeightLogs((prev) => [...prev, created]);
      setNewWeight("");
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  async function handleAddMeasurement(type: string) {
    setActionError("");
    const value = parseFloat(measurementInputs[type] ?? "");
    if (!Number.isFinite(value) || value <= 0) return;
    try {
      const created = await createBodyMeasurement(type, value);
      setMeasurements((prev) => [...prev, created]);
      setMeasurementInputs((prev) => ({ ...prev, [type]: "" }));
    } catch (err) {
      setActionError(errorMessage(err));
    }
  }

  async function handlePhotoUpload(e: ChangeEvent<HTMLInputElement>, type: PhotoType) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setActionError("");
    setUploading(type);
    try {
      const resized = await resizeImage(file);
      const created = await createProgressPhoto(type, resized);
      setPhotos((prev) => [...prev.filter((p) => p.photo_type !== type), created]);
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  if (loading) return <ProgressSkeleton />;
  if (loadError) return <ErrorScreen message={loadError} />;

  // ---------- Activity tab data ----------
  const now = new Date();
  const start = rangeStart(range, now);
  const logsInRange = start
    ? workoutLogs.filter((l) => new Date(l.logged_at) >= start)
    : workoutLogs;

  const workoutCount = logsInRange.length;
  const hoursAtGym = (logsInRange.reduce((s, l) => s + (l.duration_mins ?? 0), 0) / 60).toFixed(1);
  const liftedKg = logsInRange.reduce(
    (s, l) => (l.weight_used ? s + l.weight_used * (l.sets ?? 1) * (l.reps ?? 1) : s),
    0
  );
  const lifted = Math.round(fromKg(liftedKg, units));

  const weekStart = startOfWeek(now);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const loggedDays = new Set(workoutLogs.map((l) => localDateKey(new Date(l.logged_at))));
  const todayKey = localDateKey(now);

  const weightChart = weightLogs.map((l) => ({
    date: l.logged_at,
    weight: fromKg(l.weight, units),
  }));

  const trackedId = parseInt(trackedWorkoutId, 10);
  const trackedChart = trackedWorkoutId
    ? workoutLogs
        .filter((l) => l.workout_id === trackedId && l.weight_used)
        .map((l) => ({
          date: localDateKey(new Date(l.logged_at)),
          weight: fromKg(l.weight_used as number, units),
        }))
    : [];
  const trackedMax = trackedChart.length ? Math.max(...trackedChart.map((p) => p.weight)) : 0;
  const trackedName = workouts.find((w) => w.id === trackedId)?.name;

  // Achievements, worked out from your logs
  const streak = longestStreak([...loggedDays]);
  const lostKg =
    weightLogs.length > 1 ? weightLogs[0].weight - weightLogs[weightLogs.length - 1].weight : 0;
  const achievements = [
    { label: "First workout", unlocked: workoutLogs.length >= 1 },
    { label: "10 workouts", unlocked: workoutLogs.length >= 10 },
    { label: "50 workouts", unlocked: workoutLogs.length >= 50 },
    { label: "3-day streak", unlocked: streak >= 3 },
    { label: "7-day streak", unlocked: streak >= 7 },
    { label: "2 kg lost", unlocked: lostKg >= 2 },
    { label: "5 kg lost", unlocked: lostKg >= 5 },
  ];
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  // ---------- Body tab data ----------
  const currentWeightKg = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : null;
  const calorieTarget = currentWeightKg ? Math.round(currentWeightKg * 30) : null;
  const proteinTarget = currentWeightKg ? Math.round(currentWeightKg * 2) : null;

  // How far you've moved from your starting weight toward your target
  const startKg = profile?.starting_weight ?? (weightLogs.length ? weightLogs[0].weight : null);
  const targetKg = profile?.target_weight ?? null;
  let goalProgress: number | null = null;
  if (startKg !== null && targetKg !== null && currentWeightKg !== null && startKg !== targetKg) {
    goalProgress = Math.max(0, Math.min(1, (currentWeightKg - startKg) / (targetKg - startKg)));
  }

  function latestMeasurement(type: string): number | null {
    const entries = measurements.filter((m) => m.measurement_type === type);
    return entries.length ? entries[entries.length - 1].value : null;
  }

  const beforePhoto = photos.find((p) => p.photo_type === "before");
  const afterPhoto = photos.find((p) => p.photo_type === "after");

  return (
    <Page>
      <h1 className="text-2xl font-extrabold text-ink mb-5">Progress</h1>

      <div className="grid grid-cols-2 bg-white rounded-2xl p-1 shadow-card mb-5" role="tablist">
        {(["activity", "body"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`h-10 rounded-xl text-sm font-bold capitalize transition ${
              tab === t ? "bg-brand-500 text-white" : "text-ink/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-brand-600 bg-brand-50 rounded-2xl px-4 py-3">
          {actionError}
        </p>
      )}

      {tab === "activity" && (
        <div className="space-y-5">
          {/* Stats */}
          <section className="bg-white rounded-3xl shadow-card p-4">
            <div className="grid grid-cols-5 gap-1 mb-5">
              {ranges.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  aria-pressed={range === r}
                  className={`h-9 rounded-xl text-sm font-bold transition ${
                    range === r ? "bg-brand-500 text-white" : "text-brand-600"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 text-center">
              <div>
                <p className="text-2xl font-extrabold text-ink">{workoutCount}</p>
                <p className="text-xs text-muted">Workouts</p>
              </div>
              <div className="border-x border-line">
                <p className="text-2xl font-extrabold text-ink">{hoursAtGym}</p>
                <p className="text-xs text-muted">Hours trained</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-ink">{lifted.toLocaleString()}</p>
                <p className="text-xs text-muted">{units} lifted</p>
              </div>
            </div>
          </section>

          {/* This week */}
          <section className="bg-brand-50 rounded-3xl p-4">
            <p className="font-extrabold text-ink mb-3">Your week</p>
            <div className="grid grid-cols-7 gap-1">
              {weekDates.map((d, i) => {
                const done = loggedDays.has(localDateKey(d));
                const isToday = localDateKey(d) === todayKey;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <span className="text-[11px] text-muted font-semibold">{dayNamesShort[i]}</span>
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                        done
                          ? "bg-brand-500 text-white"
                          : isToday
                          ? "bg-white text-ink ring-2 ring-brand-500"
                          : "bg-white text-muted"
                      }`}
                    >
                      {done ? <Check size={16} strokeWidth={3.5} /> : d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Weight */}
          <section className="bg-white rounded-3xl shadow-card p-4">
            <h2 className={`${sectionTitle} mb-3`}>Weight</h2>
            <form onSubmit={handleAddWeight} className="flex gap-2 mb-4">
              <input
                ref={weightInputRef}
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder={`Today's weight (${units})`}
                aria-label={`Weight in ${units}`}
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                required
                className={`${inputClass} flex-1 min-w-0`}
              />
              <button type="submit" className={`${btnPrimary} px-5`}>
                Log
              </button>
            </form>
            {weightChart.length === 0 ? (
              <p className="text-muted text-sm">Log your weight to start your chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={weightChart} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff6b4a" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#ff6b4a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eceef3" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b91a3", fontSize: 11 }}
                    tickFormatter={(v) => shortDate(String(v))}
                  />
                  <YAxis
                    domain={["auto", "auto"]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#8b91a3", fontSize: 11 }}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(v) => shortDate(String(v))}
                    formatter={(value) => [`${value} ${units}`, "Weight"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#ff6b4a"
                    strokeWidth={3}
                    fill="url(#weightFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* Achievements */}
          <section className="bg-mint-50 rounded-3xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className={sectionTitle}>Achievements</h2>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-mint-600">
                <Trophy size={16} /> {unlockedCount}/{achievements.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {achievements.map((a) => (
                <span
                  key={a.label}
                  className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-bold ${
                    a.unlocked ? "bg-mint-500 text-white" : "bg-white text-muted"
                  }`}
                >
                  {a.unlocked ? <Check size={14} strokeWidth={3} /> : <Lock size={13} />}
                  {a.label}
                </span>
              ))}
            </div>
          </section>

          {/* Exercise graph */}
          <section className="bg-white rounded-3xl shadow-card p-4">
            <h2 className={`${sectionTitle} mb-3`}>Exercise graph</h2>
            <select
              value={trackedWorkoutId}
              onChange={(e) => setTrackedWorkoutId(e.target.value)}
              aria-label="Exercise to track"
              className={`${inputClass} mb-4`}
            >
              <option value="">Choose an exercise to track</option>
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            {trackedWorkoutId &&
              (trackedChart.length === 0 ? (
                <p className="text-muted text-sm">
                  No weights logged yet for {trackedName}. Enter a weight when you start this
                  workout and it will show up here.
                </p>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-bold text-ink">{trackedName}</p>
                    <p className="text-brand-600 font-extrabold">
                      {trackedMax} {units} max
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={trackedChart} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trackedFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2fbf9f" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2fbf9f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#eceef3" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8b91a3", fontSize: 11 }}
                        tickFormatter={(v) => shortDate(String(v))}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#8b91a3", fontSize: 11 }}
                        width={44}
                      />
                      <Tooltip
                        contentStyle={tooltipStyle}
                        labelFormatter={(v) => shortDate(String(v))}
                        formatter={(value) => [`${value} ${units}`, "Weight"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#2fbf9f"
                        strokeWidth={3}
                        fill="url(#trackedFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              ))}
          </section>

          {/* History */}
          <section>
            <h2 className={`${sectionTitle} mb-3`}>Workout history</h2>
            {workoutLogs.length === 0 ? (
              <p className="text-muted text-sm">
                Nothing logged yet. Finish a workout and it will appear here.
              </p>
            ) : (
              <ul className="space-y-2">
                {workoutLogs.map((log) => {
                  const workout = workouts.find((w) => w.id === log.workout_id);
                  return (
                    <li
                      key={log.id}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-white shadow-card px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-ink truncate">{workout?.name ?? "Unknown workout"}</p>
                        <p className="text-xs text-muted">{new Date(log.logged_at).toLocaleString()}</p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-brand-600 flex-shrink-0">
                        <Flame size={14} /> {log.duration_mins ?? 0} min
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === "body" && (
        <div className="space-y-5">
          {/* Goal ring */}
          <section className="bg-brand-50 rounded-3xl p-5 flex items-center gap-5">
            {goalProgress !== null ? (
              <ProgressRing value={goalProgress} size={104} stroke={11}>
                <span className="text-2xl font-extrabold text-ink leading-none">
                  {Math.round(goalProgress * 100)}%
                </span>
              </ProgressRing>
            ) : (
              <div className="w-[104px] h-[104px] rounded-full bg-white flex items-center justify-center text-center text-xs text-muted px-3 flex-shrink-0">
                No goal yet
              </div>
            )}
            <div className="min-w-0">
              <p className="font-extrabold text-ink">Weight goal</p>
              <p className="text-3xl font-extrabold text-ink mt-1">
                {currentWeightKg !== null ? fromKg(currentWeightKg, units) : "--"}
                <span className="text-base font-bold text-muted"> {units}</span>
              </p>
              <p className="text-sm text-muted mt-0.5">
                {targetKg !== null
                  ? `Target ${fromKg(targetKg, units)} ${units}`
                  : "Set a target in Personal information"}
              </p>
            </div>
          </section>

          {/* Measurements */}
          <section className="bg-white rounded-3xl shadow-card p-4">
            <h2 className={`${sectionTitle} mb-3`}>Measurements</h2>
            <ul className="space-y-3">
              {measurementTypes.map((type) => {
                const latest = latestMeasurement(type);
                return (
                  <li key={type} className="flex items-center gap-3">
                    <div className="w-20">
                      <p className="text-sm font-bold text-ink capitalize">{type}</p>
                      <p className="text-xs text-muted">{latest !== null ? `${latest} cm` : "No entry"}</p>
                    </div>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      placeholder="cm"
                      aria-label={`${type} in centimetres`}
                      value={measurementInputs[type] ?? ""}
                      onChange={(e) =>
                        setMeasurementInputs((prev) => ({ ...prev, [type]: e.target.value }))
                      }
                      className={`${inputClass} h-11 flex-1 min-w-0`}
                    />
                    <button
                      onClick={() => handleAddMeasurement(type)}
                      className="h-11 px-4 rounded-2xl bg-brand-50 text-brand-600 font-bold"
                    >
                      Log
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Nutrition */}
          <section>
            <h2 className={`${sectionTitle} mb-3`}>Daily targets</h2>
            {calorieTarget && proteinTarget ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-mint-50 rounded-3xl p-4">
                    <p className="text-3xl font-extrabold text-ink">{calorieTarget}</p>
                    <p className="text-sm text-muted">Calories</p>
                  </div>
                  <div className="bg-brand-50 rounded-3xl p-4">
                    <p className="text-3xl font-extrabold text-ink">{proteinTarget} g</p>
                    <p className="text-sm text-muted">Protein</p>
                  </div>
                </div>
                <p className="text-xs text-muted mt-3">
                  Rough estimates from your latest weight. They are not medical advice.
                </p>
              </>
            ) : (
              <p className="text-muted text-sm">Log your weight to see daily targets.</p>
            )}
          </section>

          {/* Photos */}
          <section className="bg-white rounded-3xl shadow-card p-4">
            <h2 className={`${sectionTitle} mb-3`}>Before and after</h2>
            <div className="grid grid-cols-2 gap-3">
              <PhotoSlot
                label="Before"
                photo={beforePhoto}
                busy={uploading === "before"}
                onUpload={(e) => handlePhotoUpload(e, "before")}
              />
              <PhotoSlot
                label="After"
                photo={afterPhoto}
                busy={uploading === "after"}
                onUpload={(e) => handlePhotoUpload(e, "after")}
              />
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}

interface PhotoSlotProps {
  label: string;
  photo?: ProgressPhoto;
  busy: boolean;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
}

function PhotoSlot({ label, photo, busy, onUpload }: PhotoSlotProps) {
  return (
    <label className="relative block aspect-[3/4] bg-brand-50 rounded-3xl overflow-hidden cursor-pointer">
      {photo ? (
        <img src={photo.url} alt={`${label} photo`} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-brand-600 text-sm font-bold">
          <Camera size={26} />
          Add {label.toLowerCase()} photo
        </div>
      )}
      {busy && (
        <div className="absolute inset-0 bg-ink/50 flex items-center justify-center text-white text-sm font-bold">
          Uploading...
        </div>
      )}
      <input type="file" accept="image/*" onChange={onUpload} className="sr-only" />
    </label>
  );
}
