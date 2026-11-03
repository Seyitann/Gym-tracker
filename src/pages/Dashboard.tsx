import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Check, Clock, Flame, Play } from "lucide-react";
import { getCurrentUser, getProfile, getWorkoutLogs, getWorkouts } from "../api/data";
import type { AppUser, Workout, WorkoutLog } from "../types";
import { dayNamesShort, dayNamesTwo, parseWorkoutDays } from "../constants";
import { getPreferences } from "../utils/preferences";
import { notificationsGranted, notify } from "../utils/notify";
import { localDateKey, startOfWeek } from "../utils/dates";
import {
  dayFocus,
  focusDayFor,
  matchesFocus,
  plannedDaySet,
  readReschedule,
  removeReschedule,
  writeReschedule,
} from "../utils/plan";
import type { Reschedule } from "../utils/plan";
import Page from "../components/Page";
import ProgressRing from "../components/ProgressRing";
import { ErrorScreen, errorMessage } from "../components/PageState";
import { Skeleton } from "../components/Skeleton";
import { sectionTitle } from "../ui";

function greeting(date: Date): string {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function DashboardSkeleton() {
  return (
    <Page>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-52" />
        </div>
        <Skeleton className="w-11 h-11 rounded-full" />
      </header>

      {/* Today's plan */}
      <Skeleton className="h-48 rounded-[2rem]" />

      {/* Week strip */}
      <section className="mt-6">
        <div className="bg-white rounded-3xl shadow-card p-3 grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Weekly goal + this week */}
      <section className="mt-6 grid grid-cols-2 gap-4">
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
      </section>

      {/* Activity chart */}
      <section className="mt-8">
        <Skeleton className="h-6 w-32 mb-3" />
        <Skeleton className="h-52 rounded-3xl" />
      </section>

      {/* Best fit */}
      <section className="mt-8">
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      </section>
    </Page>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const todayIdx = today.getDay();
  const todayKey = localDateKey(today);
  const prefs = useMemo(getPreferences, []);

  const [user, setUser] = useState<AppUser | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [workoutDays, setWorkoutDays] = useState<number[]>([]);
  const [reschedule, setReschedule] = useState<Reschedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [userData, workoutsData, logsData, profile] = await Promise.all([
          getCurrentUser(),
          getWorkouts(),
          getWorkoutLogs(),
          getProfile(),
        ]);
        if (!active) return;

        const days = profile ? parseWorkoutDays(profile.workout_days) : [];
        setUser(userData);
        setWorkouts(workoutsData);
        setLogs(logsData);
        setWorkoutDays(days);
        setReschedule(readReschedule(today));

        // One gentle reminder a day, only on a workout day with nothing logged yet
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
          notify("Time to train", `Today's focus: ${dayFocus[todayIdx].label}`);
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
  }, [today, todayIdx, todayKey, prefs.workoutReminders]);

  if (loading) return <DashboardSkeleton />;
  if (loadError) return <ErrorScreen message={loadError} />;

  // ---------- week ----------
  const weekStart = startOfWeek(today);
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });
  const doneKeys = new Set(logs.map((l) => localDateKey(new Date(l.logged_at))));
  const planned = plannedDaySet(workoutDays, reschedule);
  const daysDone = weekDates.filter((d) => doneKeys.has(localDateKey(d))).length;
  const ringValue = planned.size > 0 ? daysDone / planned.size : daysDone > 0 ? 1 : 0;
  const doneToday = doneKeys.has(todayKey);

  const weekLogs = logs.filter((l) => new Date(l.logged_at) >= weekStart);
  const weekMinutes = weekLogs.reduce((sum, l) => sum + (l.duration_mins ?? 0), 0);
  const weekKcal = weekLogs.reduce(
    (sum, l) => sum + (workouts.find((w) => w.id === l.workout_id)?.calories_estimate ?? 0),
    0
  );

  // ---------- today's plan ----------
  const focusDay = focusDayFor(todayIdx, reschedule);
  const focus = dayFocus[focusDay];
  const suggested = workouts.filter((w) => matchesFocus(w, focus));
  const first = suggested[0];
  const canSkipToday = workoutDays.includes(todayIdx) && !reschedule;
  const freeDays = [0, 1, 2, 3, 4, 5, 6].filter((i) => i > todayIdx && !workoutDays.includes(i));

  // ---------- last 7 days chart ----------
  const activity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = localDateKey(d);
    const minutes = logs
      .filter((l) => localDateKey(new Date(l.logged_at)) === key)
      .reduce((sum, l) => sum + (l.duration_mins ?? 0), 0);
    return { day: dayNamesTwo[d.getDay()], minutes };
  });

  function startWorkout(w?: Workout) {
    navigate(w ? `/workout?w=${w.id}` : "/workout");
  }

  function handleReschedule(toDay: number) {
    const value: Reschedule = { from: todayIdx, to: toDay };
    writeReschedule(today, value);
    setReschedule(value);
  }

  function handleUndo() {
    removeReschedule(today);
    setReschedule(null);
  }

  const firstName = user?.name.trim().split(/\s+/)[0] || "there";
  const dateLabel = today.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Page>
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <p className="text-muted text-sm">{dateLabel}</p>
          <h1 className="text-2xl font-extrabold text-ink">
            {greeting(today)}, {firstName}
          </h1>
        </div>
        <Link
          to="/settings/profile"
          aria-label="Your profile"
          className="w-11 h-11 rounded-full bg-brand-100 text-brand-600 font-extrabold flex items-center justify-center"
        >
          {firstName.charAt(0).toUpperCase()}
        </Link>
      </header>

      {/* Today's plan */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-500 to-brand-400 text-white p-6 shadow-float">
        <div aria-hidden className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/15" />
        <div aria-hidden className="absolute right-6 -bottom-14 w-32 h-32 rounded-full bg-white/10" />
        <div className="relative">
          <p className="text-white/80 text-sm font-semibold">
            {doneToday ? "Done for today" : "Today's plan"}
          </p>
          <h2 className="text-3xl font-extrabold mt-1 leading-tight">{focus.label}</h2>
          {first ? (
            <p className="text-white/90 mt-2">
              Start with {first.name}, about {first.duration_mins} minutes.
            </p>
          ) : (
            <p className="text-white/90 mt-2">Pick any exercise you like.</p>
          )}
          <button
            onClick={() => startWorkout(first)}
            className="mt-5 inline-flex items-center gap-2 h-12 pl-5 pr-6 rounded-2xl bg-white text-brand-600 font-extrabold active:scale-[0.98] transition"
          >
            {doneToday ? <Check size={18} strokeWidth={3} /> : <Play size={18} fill="currentColor" />}
            {doneToday ? "Train again" : "Start workout"}
          </button>
        </div>
      </section>

      {/* Week strip */}
      <section className="mt-6">
        <div className="bg-white rounded-3xl shadow-card p-3 grid grid-cols-7 gap-1">
          {weekDates.map((d, i) => {
            const isToday = i === todayIdx;
            const done = doneKeys.has(localDateKey(d));
            const isPlanned = planned.has(i);
            return (
              <div
                key={i}
                className={`flex flex-col items-center py-2 rounded-2xl ${
                  isToday ? "bg-brand-500 text-white" : "text-ink"
                }`}
              >
                <span className={`text-[11px] font-semibold ${isToday ? "text-white/80" : "text-muted"}`}>
                  {dayNamesTwo[i]}
                </span>
                <span className="text-base font-extrabold">{d.getDate()}</span>
                <span className="h-4 flex items-center">
                  {done ? (
                    <Check size={12} strokeWidth={3.5} className={isToday ? "text-white" : "text-mint-600"} />
                  ) : isPlanned ? (
                    <span className={`w-1.5 h-1.5 rounded-full ${isToday ? "bg-white" : "bg-brand-500"}`} />
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>

        {/* Skip today and push it later */}
        {reschedule && reschedule.from === todayIdx && (
          <div className="mt-3 flex items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 shadow-card">
            <p className="text-sm text-ink">
              Today's workout moved to <strong>{dayNamesShort[reschedule.to]}</strong>.
            </p>
            <button onClick={handleUndo} className="text-sm font-bold text-brand-600">
              Undo
            </button>
          </div>
        )}
        {reschedule && reschedule.to === todayIdx && (
          <div className="mt-3 flex items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 shadow-card">
            <p className="text-sm text-ink">
              <strong>{dayNamesShort[reschedule.from]}</strong>'s workout was moved to today.
            </p>
            <button onClick={handleUndo} className="text-sm font-bold text-brand-600">
              Undo
            </button>
          </div>
        )}
        {canSkipToday && (
          <div className="mt-3 flex items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 shadow-card">
            <p className="text-sm text-ink">Can't train today?</p>
            {freeDays.length > 0 ? (
              <select
                onChange={(e) => handleReschedule(parseInt(e.target.value, 10))}
                defaultValue=""
                aria-label="Move today's workout to another day"
                className="h-9 rounded-xl bg-surface border border-line text-sm font-semibold px-2"
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
              <p className="text-xs text-muted">No free days left this week</p>
            )}
          </div>
        )}
      </section>

      {/* Weekly goal + this week */}
      <section className="mt-6 grid grid-cols-2 gap-4">
        <div className="bg-brand-50 rounded-3xl p-4 flex flex-col items-center text-center">
          <p className="text-sm font-bold text-ink mb-3">Weekly goal</p>
          <ProgressRing value={ringValue} size={92} stroke={10}>
            <span className="text-xl font-extrabold text-ink leading-none">
              {daysDone}
              <span className="text-muted text-sm font-bold">/{planned.size || "–"}</span>
            </span>
            <span className="text-[10px] text-muted mt-0.5">days</span>
          </ProgressRing>
        </div>
        <div className="bg-mint-50 rounded-3xl p-4 flex flex-col justify-between">
          <p className="text-sm font-bold text-ink">This week</p>
          <div className="space-y-3 mt-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white text-mint-600 flex items-center justify-center">
                <Clock size={16} />
              </span>
              <div>
                <p className="text-base font-extrabold text-ink leading-none">{weekMinutes}</p>
                <p className="text-[11px] text-muted">minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-white text-brand-500 flex items-center justify-center">
                <Flame size={16} />
              </span>
              <div>
                <p className="text-base font-extrabold text-ink leading-none">{weekKcal}</p>
                <p className="text-[11px] text-muted">kcal, estimated</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Activity chart */}
      <section className="mt-8">
        <h2 className={`${sectionTitle} mb-3`}>Your activity</h2>
        <div className="bg-white rounded-3xl shadow-card p-4 pt-5">
          <p className="text-xs text-muted mb-2">Minutes trained, last 7 days</p>
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={activity} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2fbf9f" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2fbf9f" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8b91a3", fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{ border: "none", borderRadius: 12, boxShadow: "0 8px 24px -10px rgba(0,0,0,.25)" }}
                formatter={(value) => [`${value} min`, "Trained"]}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="#2fbf9f"
                strokeWidth={3}
                fill="url(#activityFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Best fit */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className={sectionTitle}>Best fit for you</h2>
          <Link to="/workouts" className="text-sm font-bold text-brand-600">
            View all
          </Link>
        </div>
        {suggested.length === 0 ? (
          <p className="text-muted text-sm">No exercises match today's focus yet.</p>
        ) : (
          <ul className="space-y-3">
            {suggested.slice(0, 4).map((w, i) => (
              <li key={w.id}>
                <button
                  onClick={() => startWorkout(w)}
                  className={`w-full flex items-center gap-4 p-4 rounded-3xl text-left active:scale-[0.99] transition ${
                    i % 2 === 0 ? "bg-brand-50" : "bg-mint-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-extrabold text-ink truncate">{w.name}</p>
                    <p className="text-xs text-muted capitalize mt-0.5">
                      {w.equipment === "none" ? "No equipment" : w.equipment}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white text-xs font-bold text-ink">
                        <Clock size={12} /> {w.duration_mins} min
                      </span>
                      <span className="inline-flex items-center gap-1 h-7 px-2.5 rounded-full bg-white text-xs font-bold text-ink">
                        <Flame size={12} /> {w.calories_estimate} kcal
                      </span>
                    </div>
                  </div>
                  <span
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                      i % 2 === 0 ? "bg-brand-500" : "bg-mint-500"
                    }`}
                  >
                    <Play size={18} fill="currentColor" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
