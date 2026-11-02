import { useEffect, useMemo, useRef, useState } from "react";
import {
  createWorkoutLog,
  getCurrentUser,
  getProfile,
  getWorkoutLogs,
  getWorkouts,
} from "../api/data";
import type { Workout, WorkoutLog } from "../types";
import { dayNamesShort, dayNamesTwo, parseWorkoutDays } from "../constants";
import { fromKg, getPreferences, toKg } from "../utils/preferences";
import type { Preferences } from "../utils/preferences";
import { playBeep, unlockAudio } from "../utils/sound";
import { notificationsGranted, notify } from "../utils/notify";
import { localDateKey, startOfWeek } from "../utils/dates";
import { ErrorScreen, LoadingScreen, errorMessage } from "../components/PageState";

const categoryIcons: Record<string, string> = {
  strength: "💪",
  cardio: "🏃",
  flexibility: "🧘",
  hiit: "🔥",
};

const bodyPartIcons: Record<string, string> = {
  chest: "🫁",
  back: "🔙",
  legs: "🦵",
  arms: "💪",
  shoulders: "🏔️",
  core: "🎯",
  full_body: "🧍",
};

interface DayFocus {
  label: string;
  muscleGroups?: string[];
  categories?: string[];
}

// What the app suggests on each weekday (0 = Sunday)
const dayFocus: Record<number, DayFocus> = {
  0: { label: "Full Body", muscleGroups: ["full_body"] },
  1: { label: "Chest & Shoulders", muscleGroups: ["chest", "shoulders"] },
  2: { label: "Arms", muscleGroups: ["arms"] },
  3: { label: "Legs", muscleGroups: ["legs"] },
  4: { label: "Back", muscleGroups: ["back"] },
  5: { label: "Core", muscleGroups: ["core"] },
  6: { label: "Cardio & HIIT", categories: ["cardio", "hiit"] },
};

function matchesFocus(w: Workout, focus: DayFocus): boolean {
  if (focus.categories) return focus.categories.includes(w.category);
  return (focus.muscleGroups ?? []).includes(w.muscle_group);
}

const motivation = [
  "Every rep counts. Nice work!",
  "You showed up. That's the hardest part.",
  "Stronger than yesterday.",
  "Consistency beats intensity. Keep going!",
];

interface Reschedule {
  from: number;
  to: number;
}

function rescheduleKey(d: Date): string {
  return `reschedule_${localDateKey(startOfWeek(d))}`;
}

function readReschedule(d: Date): Reschedule | null {
  try {
    const raw = localStorage.getItem(rescheduleKey(d));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.from === "number" && typeof parsed.to === "number") return parsed;
  } catch {
    // ignore corrupt data
  }
  return null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const smallInput =
  "w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:opacity-50";

export default function Dashboard() {
  const today = useMemo(() => new Date(), []);
  const todayIdx = today.getDay();
  const [prefs] = useState<Preferences>(getPreferences);

  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [pastLogs, setPastLogs] = useState<WorkoutLog[]>([]);
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [reschedule, setReschedule] = useState<Reschedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [useSuggestion, setUseSuggestion] = useState(true);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  const [weightInput, setWeightInput] = useState("");
  const [setsInput, setSetsInput] = useState("");
  const [repsInput, setRepsInput] = useState("");

  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<number | null>(null);
  const endTimeRef = useRef(0);
  const finishedRef = useRef(false);

  const [showRest, setShowRest] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const restTimerRef = useRef<number | null>(null);
  const restEndRef = useRef(0);

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ---------- derived values ----------

  const weekStart = startOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const plannedDays = new Set(workoutDays);
  if (reschedule) {
    plannedDays.delete(reschedule.from);
    plannedDays.add(reschedule.to);
  }

  // If a workout was pushed to today, today follows the pushed day's focus
  const focusDay = reschedule && reschedule.to === todayIdx ? reschedule.from : todayIdx;
  const focus = dayFocus[focusDay];
  const canSkipToday = workoutDays.includes(todayIdx) && !reschedule;
  const freeDays = [0, 1, 2, 3, 4, 5, 6].filter((i) => i > todayIdx && !workoutDays.includes(i));
  const isRestDay = workoutDays.length > 0 && !plannedDays.has(todayIdx);

  const suggestedWorkouts = workouts.filter((w) => matchesFocus(w, focus));
  const bodyParts = [...new Set(workouts.map((w) => w.muscle_group))];
  const equipmentForBodyPart = selectedBodyPart
    ? [
        ...new Set(
          workouts.filter((w) => w.muscle_group === selectedBodyPart).map((w) => w.equipment)
        ),
      ]
    : [];
  const manualWorkouts = workouts.filter(
    (w) =>
      selectedBodyPart !== null &&
      w.muscle_group === selectedBodyPart &&
      (selectedEquipment === null || w.equipment === selectedEquipment)
  );
  const displayedWorkouts = useSuggestion ? suggestedWorkouts : manualWorkouts;

  // ---------- load data ----------

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [, workoutsData, logsData, profile] = await Promise.all([
          getCurrentUser(),
          getWorkouts(),
          getWorkoutLogs(),
          getProfile(),
        ]);
        if (!active) return;

        const days = profile ? parseWorkoutDays(profile.workout_days) : [];
        setWorkouts(workoutsData);
        setPastLogs(logsData);
        setWorkoutDays(days);
        setReschedule(readReschedule(today));

        // Gentle reminder once per day, only if it's a workout day and nothing is logged yet
        const todayKey = localDateKey(today);
        const reminderKey = `reminded_${todayKey}`;
        const loggedToday = logsData.some((l) => localDateKey(new Date(l.logged_at)) === todayKey);
        if (
          prefs.workoutReminders &&
          notificationsGranted() &&
          days.includes(todayIdx) &&
          !loggedToday &&
          !localStorage.getItem(reminderKey)
        ) {
          localStorage.setItem(reminderKey, "1");
          notify("Time to train 💪", `Today's focus: ${dayFocus[todayIdx].label}`);
        }
      } catch (err) {
        if (active) setLoadError(errorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [today, todayIdx, prefs.workoutReminders]);

  // In suggestion mode, keep the selected workout on today's suggestions
  useEffect(() => {
    if (workouts.length === 0 || isRunning || !useSuggestion) return;
    const first = workouts.find((w) => matchesFocus(w, focus)) ?? workouts[0];
    setSelectedWorkout(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workouts, focusDay, useSuggestion]);

  // Smart Weight & Reps: pre-fill from the last time this exercise was logged
  useEffect(() => {
    if (isRunning) return;
    if (!selectedWorkout || !prefs.smartWeightReps) {
      setWeightInput("");
      setSetsInput("");
      setRepsInput("");
      return;
    }
    const last = [...pastLogs]
      .filter((l) => l.workout_id === selectedWorkout.id && l.weight_used !== null)
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())[0];

    setWeightInput(last?.weight_used != null ? String(fromKg(last.weight_used, prefs.units)) : "");
    setSetsInput(last?.sets != null ? String(last.sets) : "");
    setRepsInput(last?.reps != null ? String(last.reps) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkout, pastLogs]);

  // Auto-dismiss the status message
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  // Stop timers if the user leaves the page
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (restTimerRef.current !== null) window.clearInterval(restTimerRef.current);
    };
  }, []);

  // ---------- timers ----------

  function clearTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function clearRestTimer() {
    if (restTimerRef.current !== null) {
      window.clearInterval(restTimerRef.current);
      restTimerRef.current = null;
    }
  }

  function handleStart() {
    if (!selectedWorkout || isRunning) return;
    unlockAudio();
    finishedRef.current = false;
    endTimeRef.current = Date.now() + selectedWorkout.duration_mins * 60 * 1000;
    setTimeLeft(selectedWorkout.duration_mins * 60);
    setIsRunning(true);

    // Compare against a fixed end time so the timer stays right even if the tab sleeps
    timerRef.current = window.setInterval(() => {
      const remaining = Math.ceil((endTimeRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearTimer();
        setTimeLeft(0);
        if (!finishedRef.current) {
          finishedRef.current = true;
          void finishWorkout();
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 250);
  }

  function handleStop() {
    finishedRef.current = true;
    clearTimer();
    setIsRunning(false);
    setTimeLeft(0);
  }

  async function finishWorkout() {
    if (!selectedWorkout) return;
    setIsRunning(false);
    try {
      const weight = parseFloat(weightInput);
      const sets = parseInt(setsInput, 10);
      const reps = parseInt(repsInput, 10);
      const saved = await createWorkoutLog(selectedWorkout.id, {
        duration_mins: selectedWorkout.duration_mins,
        weight_used: Number.isFinite(weight) ? toKg(weight, prefs.units) : null,
        sets: Number.isFinite(sets) ? sets : null,
        reps: Number.isFinite(reps) ? reps : null,
      });
      setPastLogs((prev) => [...prev, saved]);
      setNotice({ type: "success", text: "Workout completed and logged!" });
      if (prefs.soundsEnabled) playBeep();
      if (prefs.motivationalNotifications) {
        notify("Workout complete 💪", motivation[Math.floor(Math.random() * motivation.length)]);
      }
      if (prefs.restTimerSeconds > 0) startRestTimer();
    } catch (err) {
      setNotice({ type: "error", text: `Could not save your workout: ${errorMessage(err)}` });
    }
  }

  function startRestTimer() {
    clearRestTimer();
    restEndRef.current = Date.now() + prefs.restTimerSeconds * 1000;
    setRestTimeLeft(prefs.restTimerSeconds);
    setShowRest(true);
    restTimerRef.current = window.setInterval(() => {
      const remaining = Math.ceil((restEndRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearRestTimer();
        setShowRest(false);
        if (prefs.soundsEnabled) playBeep();
      } else {
        setRestTimeLeft(remaining);
      }
    }, 250);
  }

  function skipRest() {
    clearRestTimer();
    setShowRest(false);
  }

  // ---------- rescheduling ----------

  function handleReschedule(toDay: number) {
    const value: Reschedule = { from: todayIdx, to: toDay };
    localStorage.setItem(rescheduleKey(today), JSON.stringify(value));
    setReschedule(value);
  }

  function clearReschedule() {
    localStorage.removeItem(rescheduleKey(today));
    setReschedule(null);
  }

  function handleSelectBodyPart(part: string) {
    setSelectedBodyPart(part);
    setSelectedEquipment(null);
  }

  // ---------- render ----------

  if (loading) return <LoadingScreen />;
  if (loadError) return <ErrorScreen message={loadError} />;

  const pickerHint = useSuggestion
    ? "Suggested for you today"
    : selectedBodyPart
    ? "Pick a workout"
    : "Select a body part above to see workouts";

  return (
    <div className="min-h-screen bg-gray-900 px-4 pt-6 pb-28">
      <div className="max-w-3xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold text-white">My Plan</h1>

        {/* Week strip */}
        <div className="flex justify-between bg-gray-800 rounded-2xl p-3">
          {weekDates.map((d, i) => {
            const isToday = i === todayIdx;
            const isPlanned = plannedDays.has(i);
            return (
              <div
                key={i}
                className={`flex flex-col items-center px-2 py-1 rounded-xl ${
                  isToday ? "bg-yellow-400 text-gray-900" : "text-gray-400"
                }`}
              >
                <span className="text-xs font-medium">{dayNamesTwo[i]}</span>
                <span className="text-sm font-bold">{d.getDate()}</span>
                <span
                  className={`w-1 h-1 rounded-full mt-1 ${
                    isPlanned ? (isToday ? "bg-gray-900" : "bg-yellow-400") : "bg-transparent"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Skip / move today's workout */}
        {reschedule && reschedule.from === todayIdx && (
          <div className="bg-gray-800 rounded-2xl p-3 flex justify-between items-center">
            <p className="text-gray-300 text-sm">
              Today's workout moved to {dayNamesShort[reschedule.to]}
            </p>
            <button onClick={clearReschedule} className="text-yellow-400 text-sm font-medium">
              Undo
            </button>
          </div>
        )}
        {reschedule && reschedule.to === todayIdx && (
          <div className="bg-gray-800 rounded-2xl p-3 flex justify-between items-center">
            <p className="text-gray-300 text-sm">
              {dayNamesShort[reschedule.from]}'s workout was moved to today
            </p>
            <button onClick={clearReschedule} className="text-yellow-400 text-sm font-medium">
              Undo
            </button>
          </div>
        )}
        {canSkipToday && (
          <div className="bg-gray-800 rounded-2xl p-3 flex justify-between items-center">
            <p className="text-gray-300 text-sm">Can't work out today?</p>
            {freeDays.length > 0 ? (
              <select
                onChange={(e) => handleReschedule(parseInt(e.target.value, 10))}
                defaultValue=""
                aria-label="Move today's workout to another day"
                className="bg-gray-700 text-white text-sm rounded-lg px-2 py-1"
              >
                <option value="" disabled>
                  Move to...
                </option>
                {freeDays.map((i) => (
                  <option key={i} value={i}>
                    {dayNamesShort[i]}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-500 text-xs">No free days left this week</p>
            )}
          </div>
        )}

        {/* Focus + mode toggle */}
        <div className="bg-gray-800 rounded-2xl p-4">
          <div className="mb-3">
            <p className="text-white font-semibold">Today's focus: {focus.label}</p>
            <p className="text-gray-400 text-xs">
              {isRestDay
                ? "Rest day on your plan. Training is optional."
                : useSuggestion
                ? "Showing suggested workouts for today"
                : "Choose a body part to work on"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setUseSuggestion(true)}
              disabled={isRunning}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium ${
                useSuggestion ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-300"
              }`}
            >
              Use Suggestion
            </button>
            <button
              onClick={() => setUseSuggestion(false)}
              disabled={isRunning}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium ${
                !useSuggestion ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-300"
              }`}
            >
              Choose My Own
            </button>
          </div>
        </div>

        {/* Manual flow: body part -> equipment */}
        {!useSuggestion && (
          <div className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm mb-2">Choose a body part</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {bodyParts.map((part) => (
                  <button
                    key={part}
                    onClick={() => handleSelectBodyPart(part)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap ${
                      selectedBodyPart === part
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {bodyPartIcons[part] ?? "🏋️"} {part.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {selectedBodyPart && (
              <div>
                <p className="text-gray-400 text-sm mb-2">Choose equipment</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  <button
                    onClick={() => setSelectedEquipment(null)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                      selectedEquipment === null
                        ? "bg-yellow-400 text-gray-900"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    Any Equipment
                  </button>
                  {equipmentForBodyPart.map((eq) => (
                    <button
                      key={eq}
                      onClick={() => setSelectedEquipment(eq)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap ${
                        selectedEquipment === eq
                          ? "bg-yellow-400 text-gray-900"
                          : "bg-gray-800 text-gray-300"
                      }`}
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Workout picker */}
        <div>
          <p className="text-gray-400 text-sm mb-2">{pickerHint}</p>
          {displayedWorkouts.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {useSuggestion || selectedBodyPart ? "No workouts match this selection." : ""}
            </p>
          ) : (
            <div
              className={
                prefs.tabDisplay === "grid"
                  ? "grid grid-cols-2 gap-2 bg-gray-800 rounded-2xl p-2"
                  : "flex gap-2 overflow-x-auto pb-2 bg-gray-800 rounded-2xl p-2"
              }
            >
              {displayedWorkouts.map((w) => (
                <button
                  key={w.id}
                  onClick={() => !isRunning && setSelectedWorkout(w)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    prefs.tabDisplay === "grid" ? "text-left" : "flex-shrink-0 whitespace-nowrap"
                  } ${
                    selectedWorkout?.id === w.id
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {categoryIcons[w.category] ?? "🏋️"} {w.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedWorkout && (
          <>
            <h2 className="text-2xl font-extrabold text-white uppercase">{selectedWorkout.name}</h2>
            <p className="text-gray-400 capitalize">
              {selectedWorkout.muscle_group.replace("_", " ")} · {selectedWorkout.equipment}
            </p>

            <div className="bg-gray-800 rounded-2xl p-4 flex justify-around text-gray-300 text-sm">
              <span>⚡ {selectedWorkout.difficulty}</span>
              <span>⏱ {selectedWorkout.duration_mins} min</span>
              <span>🔥 {selectedWorkout.calories_estimate} cal</span>
            </div>

            {prefs.warmupEnabled && (
              <div className="bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center text-2xl">
                  🤸
                </div>
                <div>
                  <h3 className="text-white font-semibold">General Warmup</h3>
                  <p className="text-gray-400 text-sm">5 minutes of light cardio and mobility</p>
                </div>
              </div>
            )}

            <div className="bg-gray-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-14 h-14 bg-gray-700 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                {categoryIcons[selectedWorkout.category] ?? "🏋️"}
              </div>
              <div>
                <h3 className="text-white font-semibold">{selectedWorkout.name}</h3>
                <p className="text-gray-400 text-sm">{selectedWorkout.instructions}</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-2xl p-4 grid grid-cols-3 gap-3">
              <div>
                <label className="block text-gray-400 text-xs mb-1">Weight ({prefs.units})</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  min="0"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  disabled={isRunning}
                  className={smallInput}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Sets</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={setsInput}
                  onChange={(e) => setSetsInput(e.target.value)}
                  disabled={isRunning}
                  className={smallInput}
                />
              </div>
              <div>
                <label className="block text-gray-400 text-xs mb-1">Reps</label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={repsInput}
                  onChange={(e) => setRepsInput(e.target.value)}
                  disabled={isRunning}
                  className={smallInput}
                />
              </div>
            </div>

            {isRunning && (
              <div className="text-center text-5xl font-bold text-yellow-400 py-4">
                {formatTime(timeLeft)}
              </div>
            )}

            {!isRunning ? (
              <button
                onClick={handleStart}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-extrabold py-4 rounded-2xl transition text-lg"
              >
                START WORKOUT
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full bg-red-500 hover:bg-red-400 text-white font-extrabold py-4 rounded-2xl transition text-lg"
              >
                STOP
              </button>
            )}
          </>
        )}

        {notice && (
          <p
            className={`text-sm text-center ${
              notice.type === "success" ? "text-green-400" : "text-red-400"
            }`}
          >
            {notice.text}
          </p>
        )}
      </div>

      {showRest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-xs w-full">
            <p className="text-gray-400 mb-2">Rest timer</p>
            <p className="text-5xl font-bold text-yellow-400 mb-6">{formatTime(restTimeLeft)}</p>
            <button
              onClick={skipRest}
              className="w-full bg-gray-700 text-white font-semibold py-3 rounded-xl"
            >
              Skip rest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
