import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock, Flame, Play, Square, Zap } from "lucide-react";
import { createWorkoutLog, getWorkoutLogs, getWorkouts } from "../api/data";
import type { Workout as WorkoutType, WorkoutLog } from "../types";
import { fromKg, getPreferences, toKg } from "../utils/preferences";
import { playBeep, unlockAudio } from "../utils/sound";
import { notify } from "../utils/notify";
import { dayFocus, focusDayFor, matchesFocus, readReschedule } from "../utils/plan";
import Page, { PageHeader } from "../components/Page";
import { ErrorScreen, errorMessage } from "../components/PageState";
import { Skeleton } from "../components/Skeleton";
import { btnPrimary, chip, inputClass } from "../ui";

const motivation = [
  "Every rep counts. Nice work!",
  "You showed up. That's the hardest part.",
  "Stronger than yesterday.",
  "Consistency beats intensity. Keep going!",
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function WorkoutSkeleton() {
  return (
    <Page>
      <PageHeader title="Workout" back="/dashboard" />

      {/* Suggested / Choose my own tabs */}
      <Skeleton className="h-12 rounded-2xl mb-5" />

      {/* Exercise picker */}
      <div className="mb-5">
        <Skeleton className="h-4 w-44 mb-3" />
        <div className="flex gap-2 overflow-hidden -mx-5 px-5">
          {[28, 24, 32, 26].map((w, i) => (
            <Skeleton key={i} className="h-9 rounded-full flex-shrink-0" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {/* Hero card */}
        <Skeleton className="h-44 rounded-[2rem]" />

        {/* How to do it */}
        <div className="bg-white rounded-3xl shadow-card p-4 space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>

        {/* Your numbers */}
        <div className="bg-white rounded-3xl shadow-card p-4">
          <Skeleton className="h-5 w-28 mb-3" />
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-11 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Start button */}
        <Skeleton className="h-14 rounded-2xl" />
      </div>
    </Page>
  );
}

export default function Workout() {
  const today = useMemo(() => new Date(), []);
  const prefs = useMemo(getPreferences, []);
  const [searchParams] = useSearchParams();

  const [workouts, setWorkouts] = useState<WorkoutType[]>([]);
  const [pastLogs, setPastLogs] = useState<WorkoutLog[]>([]);
  const [focusLabelDay, setFocusLabelDay] = useState(today.getDay());
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutType | null>(null);
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
  const initialised = useRef(false);

  const [showRest, setShowRest] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const restTimerRef = useRef<number | null>(null);
  const restEndRef = useRef(0);

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ---------- load ----------
  useEffect(() => {
    let active = true;
    Promise.all([getWorkouts(), getWorkoutLogs()])
      .then(([workoutsData, logsData]) => {
        if (!active) return;
        setWorkouts(workoutsData);
        setPastLogs(logsData);
        // If a workout was pushed to today, suggestions follow that day's focus
        setFocusLabelDay(focusDayFor(today.getDay(), readReschedule(today)));
      })
      .catch((err) => active && setLoadError(errorMessage(err)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [today]);

  const focus = dayFocus[focusLabelDay];
  const suggestedWorkouts = workouts.filter((w) => matchesFocus(w, focus));

  // Pick the starting workout once the library has loaded
  useEffect(() => {
    if (workouts.length === 0 || initialised.current) return;
    initialised.current = true;
    const wanted = workouts.find((w) => String(w.id) === searchParams.get("w"));
    if (wanted) {
      setSelectedWorkout(wanted);
      if (!matchesFocus(wanted, focus)) {
        setUseSuggestion(false);
        setSelectedBodyPart(wanted.muscle_group);
      }
    } else {
      setSelectedWorkout(workouts.find((w) => matchesFocus(w, focus)) ?? workouts[0]);
    }
  }, [workouts, focus, searchParams]);

  // Smart weight and reps: pre-fill from the last time this exercise was logged
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

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
      if (restTimerRef.current !== null) window.clearInterval(restTimerRef.current);
    };
  }, []);

  // ---------- derived ----------
  const bodyParts = [...new Set(workouts.map((w) => w.muscle_group))];
  const equipmentForBodyPart = selectedBodyPart
    ? [...new Set(workouts.filter((w) => w.muscle_group === selectedBodyPart).map((w) => w.equipment))]
    : [];
  const manualWorkouts = workouts.filter(
    (w) =>
      selectedBodyPart !== null &&
      w.muscle_group === selectedBodyPart &&
      (selectedEquipment === null || w.equipment === selectedEquipment)
  );
  const displayed = useSuggestion ? suggestedWorkouts : manualWorkouts;

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

    // Count down to a fixed end time so it stays right even if the phone sleeps
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
        notify("Workout complete", motivation[Math.floor(Math.random() * motivation.length)]);
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

  function chooseSuggestion() {
    setUseSuggestion(true);
    setSelectedWorkout(suggestedWorkouts[0] ?? workouts[0] ?? null);
  }

  function handleSelectBodyPart(part: string) {
    setSelectedBodyPart(part);
    setSelectedEquipment(null);
  }

  if (loading) return <WorkoutSkeleton />;
  if (loadError) return <ErrorScreen message={loadError} />;

  const totalSeconds = selectedWorkout ? selectedWorkout.duration_mins * 60 : 1;
  const elapsed = isRunning ? Math.min(1, 1 - timeLeft / totalSeconds) : 0;

  const smallInput = `${inputClass} h-11 text-center font-bold`;

  return (
    <Page>
      <PageHeader title="Workout" back="/dashboard" />

      {/* Suggested or my own */}
      <div className="grid grid-cols-2 bg-white rounded-2xl p-1 shadow-card mb-5" role="tablist">
        <button
          role="tab"
          aria-selected={useSuggestion}
          disabled={isRunning}
          onClick={chooseSuggestion}
          className={`h-10 rounded-xl text-sm font-bold transition ${
            useSuggestion ? "bg-brand-500 text-white" : "text-ink/60"
          }`}
        >
          Suggested
        </button>
        <button
          role="tab"
          aria-selected={!useSuggestion}
          disabled={isRunning}
          onClick={() => setUseSuggestion(false)}
          className={`h-10 rounded-xl text-sm font-bold transition ${
            !useSuggestion ? "bg-brand-500 text-white" : "text-ink/60"
          }`}
        >
          Choose my own
        </button>
      </div>

      {!useSuggestion && (
        <div className="space-y-4 mb-5">
          <div>
            <p className="text-sm font-bold text-ink mb-2">Body part</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              {bodyParts.map((part) => (
                <button
                  key={part}
                  onClick={() => handleSelectBodyPart(part)}
                  className={`${chip(selectedBodyPart === part)} capitalize`}
                >
                  {part.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
          {selectedBodyPart && (
            <div>
              <p className="text-sm font-bold text-ink mb-2">Equipment</p>
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
                <button onClick={() => setSelectedEquipment(null)} className={chip(selectedEquipment === null)}>
                  Any
                </button>
                {equipmentForBodyPart.map((eq) => (
                  <button
                    key={eq}
                    onClick={() => setSelectedEquipment(eq)}
                    className={`${chip(selectedEquipment === eq)} capitalize`}
                  >
                    {eq === "none" ? "No equipment" : eq}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Picker */}
      <div className="mb-5">
        <p className="text-sm font-bold text-ink mb-2">
          {useSuggestion
            ? `Suggested today: ${focus.label}`
            : selectedBodyPart
            ? "Pick an exercise"
            : "Choose a body part to see exercises"}
        </p>
        {displayed.length === 0 ? (
          <p className="text-muted text-sm">
            {useSuggestion || selectedBodyPart ? "No exercises match this selection." : ""}
          </p>
        ) : prefs.tabDisplay === "grid" ? (
          <div className="grid grid-cols-2 gap-2">
            {displayed.map((w) => (
              <button
                key={w.id}
                onClick={() => !isRunning && setSelectedWorkout(w)}
                className={`p-3 rounded-2xl text-left text-sm font-bold transition ${
                  selectedWorkout?.id === w.id
                    ? "bg-brand-500 text-white shadow-float"
                    : "bg-white text-ink shadow-card"
                }`}
              >
                {w.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
            {displayed.map((w) => (
              <button
                key={w.id}
                onClick={() => !isRunning && setSelectedWorkout(w)}
                className={chip(selectedWorkout?.id === w.id)}
              >
                {w.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedWorkout && (
        <div className="space-y-4">
          {/* Hero / timer */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-400 text-white p-6 shadow-float">
            <div aria-hidden className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/15" />
            <div className="relative">
              <h2 className="text-2xl font-extrabold leading-tight">{selectedWorkout.name}</h2>
              <p className="text-white/85 text-sm capitalize mt-1">
                {selectedWorkout.muscle_group.replace("_", " ")},{" "}
                {selectedWorkout.equipment === "none" ? "no equipment" : selectedWorkout.equipment}
              </p>

              {isRunning ? (
                <div className="mt-5">
                  <p className="text-6xl font-extrabold tabular-nums tracking-tight">
                    {formatTime(timeLeft)}
                  </p>
                  <div className="mt-4 h-2 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white transition-[width] duration-300"
                      style={{ width: `${elapsed * 100}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/20 text-sm font-bold capitalize">
                    <Zap size={14} /> {selectedWorkout.difficulty}
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/20 text-sm font-bold">
                    <Clock size={14} /> {selectedWorkout.duration_mins} min
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white/20 text-sm font-bold">
                    <Flame size={14} /> {selectedWorkout.calories_estimate} kcal
                  </span>
                </div>
              )}
            </div>
          </section>

          {prefs.warmupEnabled && (
            <div className="bg-mint-50 rounded-3xl p-4">
              <p className="font-extrabold text-ink">Warm up first</p>
              <p className="text-sm text-muted mt-0.5">
                Five minutes of light cardio and mobility before you start the timer.
              </p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-card p-4">
            <p className="font-extrabold text-ink">How to do it</p>
            <p className="text-sm text-muted mt-1">{selectedWorkout.instructions}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-card p-4">
            <p className="font-extrabold text-ink mb-3">Your numbers</p>
            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className="block text-xs text-muted mb-1">Weight ({prefs.units})</span>
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
              </label>
              <label className="block">
                <span className="block text-xs text-muted mb-1">Sets</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={setsInput}
                  onChange={(e) => setSetsInput(e.target.value)}
                  disabled={isRunning}
                  className={smallInput}
                />
              </label>
              <label className="block">
                <span className="block text-xs text-muted mb-1">Reps</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={repsInput}
                  onChange={(e) => setRepsInput(e.target.value)}
                  disabled={isRunning}
                  className={smallInput}
                />
              </label>
            </div>
          </div>

          {!isRunning ? (
            <button onClick={handleStart} className={`${btnPrimary} w-full h-14 text-lg`}>
              <Play size={20} fill="currentColor" /> Start workout
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="w-full h-14 rounded-2xl bg-ink text-white font-bold text-lg inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <Square size={18} fill="currentColor" /> Stop
            </button>
          )}
        </div>
      )}

      {notice && (
        <p
          role={notice.type === "error" ? "alert" : "status"}
          className={`mt-4 text-sm text-center rounded-2xl px-4 py-3 ${
            notice.type === "success" ? "text-mint-600 bg-mint-50" : "text-brand-600 bg-brand-50"
          }`}
        >
          {notice.text}
        </p>
      )}

      {showRest && (
        <div className="fixed inset-0 z-50 bg-ink/60 flex items-center justify-center px-6">
          <div className="bg-white rounded-[2rem] p-8 text-center w-full max-w-xs shadow-card">
            <p className="text-muted font-semibold">Rest timer</p>
            <p className="text-6xl font-extrabold text-brand-500 tabular-nums my-4">
              {formatTime(restTimeLeft)}
            </p>
            <button onClick={skipRest} className="h-12 w-full rounded-2xl bg-surface font-bold text-ink">
              Skip rest
            </button>
          </div>
        </div>
      )}
    </Page>
  );
}
