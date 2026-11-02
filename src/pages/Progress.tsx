import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  createBodyMeasurement,
  createProgressPhoto,
  createWeightLog,
  getBodyMeasurements,
  getProgressPhotos,
  getWeightLogs,
  getWorkoutLogs,
  getWorkouts,
} from "../api/data";
import type {
  BodyMeasurement,
  PhotoType,
  ProgressPhoto,
  WeightLog,
  Workout,
  WorkoutLog,
} from "../types";
import { dayNamesShort } from "../constants";
import { fromKg, getPreferences, toKg } from "../utils/preferences";
import { localDateKey, longestStreak, shortDate, startOfWeek } from "../utils/dates";
import { resizeImage } from "../utils/image";
import { ErrorScreen, LoadingScreen, errorMessage } from "../components/PageState";

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

const inputClass =
  "px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400";

const tooltipStyle = { backgroundColor: "#1f2937", border: "none", borderRadius: 8 };

export default function Progress() {
  const [prefs] = useState(getPreferences);
  const units = prefs.units;

  const [tab, setTab] = useState<"activity" | "body">("activity");
  const [range, setRange] = useState<Range>("1W");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [measurements, setMeasurements] = useState<BodyMeasurement[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);

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
    ])
      .then(([weights, logs, library, measures, photoList]) => {
        if (!active) return;
        setWeightLogs(weights);
        setWorkoutLogs(logs);
        setWorkouts(library);
        setMeasurements(measures);
        setPhotos(photoList);
      })
      .catch((err) => active && setLoadError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

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

  if (loading) return <LoadingScreen />;
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

  // ---------- Body tab data ----------
  const currentWeightKg = weightLogs.length ? weightLogs[weightLogs.length - 1].weight : null;
  const calorieTarget = currentWeightKg ? Math.round(currentWeightKg * 30) : null;
  const proteinTarget = currentWeightKg ? Math.round(currentWeightKg * 2) : null;

  function latestMeasurement(type: string): number | null {
    const entries = measurements.filter((m) => m.measurement_type === type);
    return entries.length ? entries[entries.length - 1].value : null;
  }

  const beforePhoto = photos.find((p) => p.photo_type === "before");
  const afterPhoto = photos.find((p) => p.photo_type === "after");

  return (
    <div className="min-h-screen bg-gray-900 px-4 pt-8 pb-28">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white">Progress</h1>

        <div className="flex bg-gray-800 rounded-full p-1">
          {(["activity", "body"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold capitalize ${
                tab === t ? "bg-gray-700 text-white" : "text-gray-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

        {tab === "activity" && (
          <>
            <div className="bg-gray-800 rounded-2xl p-4">
              <div className="flex justify-around mb-4">
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                      range === r ? "bg-yellow-400 text-gray-900" : "text-yellow-400"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{workoutCount}</p>
                  <p className="text-gray-400 text-xs">Workouts</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{hoursAtGym}</p>
                  <p className="text-gray-400 text-xs">Hours at the gym</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{lifted.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs">Weight lifted ({units})</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-4">
              <p className="text-gray-400 text-xs text-center mb-3">Your workouts this week</p>
              <div className="flex justify-between">
                {weekDates.map((d, i) => {
                  const done = loggedDays.has(localDateKey(d));
                  const isToday = localDateKey(d) === todayKey;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400">{dayNamesShort[i]}</span>
                      <span
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-semibold ${
                          done
                            ? "bg-yellow-400 text-gray-900"
                            : isToday
                            ? "border border-yellow-400 text-white"
                            : "text-gray-500"
                        }`}
                      >
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-4">
              <h2 className="text-lg font-semibold text-yellow-400 mb-3">Achievements</h2>
              <div className="flex flex-wrap gap-2">
                {achievements.map((a) => (
                  <span
                    key={a.label}
                    className={`px-3 py-1 rounded-full text-sm ${
                      a.unlocked ? "bg-yellow-400 text-gray-900 font-medium" : "bg-gray-700 text-gray-500"
                    }`}
                  >
                    {a.unlocked ? "🏅" : "🔒"} {a.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Weight progress</h2>
              <form onSubmit={handleAddWeight} className="flex gap-2 mb-6">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder={`Enter weight (${units})`}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  required
                  className={`flex-1 min-w-0 ${inputClass}`}
                />
                <button
                  type="submit"
                  className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-4 py-2 rounded-lg transition"
                >
                  Log
                </button>
              </form>
              {weightChart.length === 0 ? (
                <p className="text-gray-400 text-sm">Log your weight to start your chart.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={weightChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={(v) => shortDate(String(v))} />
                    <YAxis domain={["auto", "auto"]} stroke="#9ca3af" width={40} />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelStyle={{ color: "#e5e7eb" }}
                      labelFormatter={(v) => shortDate(String(v))}
                      formatter={(value) => [`${value} ${units}`, "Weight"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#facc15"
                      strokeWidth={2}
                      dot={{ fill: "#facc15" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Exercise graphs</h2>
              <select
                value={trackedWorkoutId}
                onChange={(e) => setTrackedWorkoutId(e.target.value)}
                className={`w-full mb-4 ${inputClass}`}
              >
                <option value="">Select an exercise to track</option>
                {workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>

              {trackedWorkoutId &&
                (trackedChart.length === 0 ? (
                  <p className="text-gray-400 text-sm">
                    No weights logged yet for {trackedName}. Enter a weight when you start this
                    workout and it will show up here.
                  </p>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-white font-semibold">{trackedName}</p>
                      <p className="text-yellow-400 font-bold">
                        {trackedMax} {units} max
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={trackedChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9ca3af" tickFormatter={(v) => shortDate(String(v))} />
                        <YAxis stroke="#9ca3af" width={40} />
                        <Tooltip
                          contentStyle={tooltipStyle}
                          labelStyle={{ color: "#e5e7eb" }}
                          labelFormatter={(v) => shortDate(String(v))}
                          formatter={(value) => [`${value} ${units}`, "Weight"]}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#facc15"
                          strokeWidth={2}
                          dot={{ fill: "#facc15" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ))}
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Workout history</h2>
              {workoutLogs.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  Nothing logged yet. Finish a workout and it will appear here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {workoutLogs.map((log) => {
                    const workout = workouts.find((w) => w.id === log.workout_id);
                    return (
                      <li
                        key={log.id}
                        className="flex justify-between items-center gap-3 bg-gray-700 rounded-lg px-4 py-2 text-gray-200"
                      >
                        <span>{workout?.name ?? "Unknown workout"}</span>
                        <span className="text-gray-400 text-xs text-right">
                          {new Date(log.logged_at).toLocaleString()}
                          {log.duration_mins ? ` · ${log.duration_mins} min` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        )}

        {tab === "body" && (
          <>
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Measurements</h2>
              <div className="text-center mb-6">
                <p className="text-3xl font-bold text-white">
                  {currentWeightKg !== null ? fromKg(currentWeightKg, units) : "--"}{" "}
                  <span className="text-lg">{units}</span>
                </p>
                <p className="text-gray-400 text-xs">Current weight</p>
              </div>
              <ul className="space-y-2">
                {measurementTypes.map((type) => {
                  const latest = latestMeasurement(type);
                  return (
                    <li key={type} className="flex items-center gap-3">
                      <span className="w-24 text-gray-300 text-sm capitalize">{type}</span>
                      <span className="w-16 text-gray-500 text-sm">
                        {latest !== null ? `${latest} cm` : "--"}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        placeholder="cm"
                        value={measurementInputs[type] ?? ""}
                        onChange={(e) =>
                          setMeasurementInputs((prev) => ({ ...prev, [type]: e.target.value }))
                        }
                        className={`flex-1 min-w-0 ${inputClass}`}
                      />
                      <button
                        onClick={() => handleAddMeasurement(type)}
                        className="bg-yellow-400 text-gray-900 text-sm font-semibold px-3 py-2 rounded-lg"
                      >
                        Log
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Nutrition</h2>
              {calorieTarget && proteinTarget ? (
                <>
                  <div className="flex justify-around text-center mb-3">
                    <div>
                      <p className="text-2xl font-bold text-white">{calorieTarget}</p>
                      <p className="text-gray-400 text-xs">Calories (cal)</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">{proteinTarget}</p>
                      <p className="text-gray-400 text-xs">Protein (g)</p>
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs text-center">
                    Rough daily estimates from your latest weight. They are not medical advice.
                  </p>
                </>
              ) : (
                <p className="text-gray-400 text-sm">
                  Log your weight on the Activity tab to see daily targets.
                </p>
              )}
            </div>

            <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Before and after</h2>
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
            </div>
          </>
        )}
      </div>
    </div>
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
    <label className="relative block aspect-[3/4] bg-gray-700 rounded-xl overflow-hidden cursor-pointer">
      {photo ? (
        <img src={photo.url} alt={label} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
          + Add {label.toLowerCase()} photo
        </div>
      )}
      {busy && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm">
          Uploading...
        </div>
      )}
      <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
    </label>
  );
}
