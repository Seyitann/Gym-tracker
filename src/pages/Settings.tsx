import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../api/auth";
import { getCurrentUser, getProfile } from "../api/data";
import type { AppUser, Profile } from "../types";
import { dayNamesShort, goalLabel, parseWorkoutDays } from "../constants";
import { getPreferences, updatePreference } from "../utils/preferences";
import type { Preferences } from "../utils/preferences";
import { notify, requestNotificationPermission } from "../utils/notify";
import ToggleRow from "../components/ToggleRow";
import { ErrorScreen, LoadingScreen, errorMessage } from "../components/PageState";

type ToggleKey = "smartWeightReps" | "warmupEnabled" | "soundsEnabled";
type NotifyKey = "workoutReminders" | "motivationalNotifications";

const rowClass =
  "w-full bg-gray-800 rounded-2xl shadow-xl p-4 flex items-center justify-between hover:bg-gray-700 transition";

export default function Settings() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prefs, setPrefs] = useState<Preferences>(getPreferences);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getCurrentUser(), getProfile()])
      .then(([u, p]) => {
        setUser(u);
        setProfile(p);
      })
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  function flash(text: string) {
    setMessage(text);
    window.setTimeout(() => setMessage(""), 2000);
  }

  function toggle(key: ToggleKey) {
    setPrefs(updatePreference(key, !prefs[key]));
    flash("Saved");
  }

  async function toggleNotifications(key: NotifyKey) {
    if (!prefs[key]) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        flash("Notifications are blocked or not supported in this browser");
        return;
      }
      notify(
        "Gym Tracker",
        key === "workoutReminders"
          ? "You'll get a reminder on your workout days."
          : "Encouragement is switched on."
      );
    }
    setPrefs(updatePreference(key, !prefs[key]));
    flash("Saved");
  }

  async function handleLogout() {
    await logoutUser();
    navigate("/login");
  }

  async function handleShare() {
    const url = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Gym Tracker", text: "Track your workouts with me.", url });
      } catch {
        // share sheet dismissed
      }
    } else {
      await navigator.clipboard.writeText(url);
      flash("Link copied");
    }
  }

  if (loading) return <LoadingScreen />;
  if (loadError) return <ErrorScreen message={loadError} />;

  const days = parseWorkoutDays(profile?.workout_days)
    .map((d) => dayNamesShort[d])
    .join(", ");

  return (
    <div className="min-h-screen bg-gray-900 px-4 pt-8 pb-28">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          {message && <span className="text-green-400 text-sm">{message}</span>}
        </div>

        <button onClick={() => navigate("/settings/profile")} className={rowClass}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center text-2xl">
              👤
            </div>
            <div className="text-left">
              <p className="text-white font-semibold">{user?.name || "Your name"}</p>
              <p className="text-gray-400 text-sm">Personal information</p>
            </div>
          </div>
          <span className="text-gray-500 text-xl">›</span>
        </button>

        <button onClick={() => navigate("/settings/profile")} className={rowClass}>
          <div className="text-left">
            <p className="text-white">🎯 Fitness goal</p>
            <p className="text-gray-400 text-sm">{goalLabel(profile?.goal)}</p>
          </div>
          <span className="text-gray-500 text-xl">›</span>
        </button>

        <button onClick={() => navigate("/settings/profile")} className={rowClass}>
          <div className="text-left">
            <p className="text-white">📅 Workout days</p>
            <p className="text-gray-400 text-sm">{days || "Not set"}</p>
          </div>
          <span className="text-gray-500 text-xl">›</span>
        </button>

        <button onClick={() => navigate("/settings/units")} className={rowClass}>
          <span className="text-white">📏 Units of measurement</span>
          <span className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{prefs.units}</span>
            <span className="text-gray-500 text-xl">›</span>
          </span>
        </button>

        <ToggleRow
          icon="💡"
          label="Smart weight & reps"
          description="Pre-fill your last weight, sets and reps"
          checked={prefs.smartWeightReps}
          onChange={() => toggle("smartWeightReps")}
        />

        <button onClick={() => navigate("/settings/rest-timer")} className={rowClass}>
          <span className="text-white">⏱️ Rest timer</span>
          <span className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">{prefs.restTimerSeconds}s</span>
            <span className="text-gray-500 text-xl">›</span>
          </span>
        </button>

        <ToggleRow
          icon="🤸"
          label="Warmup & stretching"
          description="Show a warmup step before each workout"
          checked={prefs.warmupEnabled}
          onChange={() => toggle("warmupEnabled")}
        />

        <ToggleRow
          icon="🔊"
          label="Sounds"
          description="Beep when a timer finishes"
          checked={prefs.soundsEnabled}
          onChange={() => toggle("soundsEnabled")}
        />

        <ToggleRow
          icon="🔔"
          label="Workout reminders"
          description="A notification on your workout days"
          checked={prefs.workoutReminders}
          onChange={() => toggleNotifications("workoutReminders")}
        />

        <ToggleRow
          icon="💬"
          label="Motivational notifications"
          description="Encouragement when you finish a workout"
          checked={prefs.motivationalNotifications}
          onChange={() => toggleNotifications("motivationalNotifications")}
        />

        <div className="bg-gray-800 rounded-2xl shadow-xl p-4">
          <p className="text-white mb-3">🖼️ Workout tab display</p>
          <div className="flex gap-2">
            {(["list", "grid"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setPrefs(updatePreference("tabDisplay", mode));
                  flash("Saved");
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize ${
                  prefs.tabDisplay === mode
                    ? "bg-yellow-400 text-gray-900"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl divide-y divide-gray-700">
          <button
            onClick={() => navigate("/settings/help")}
            className="w-full flex items-center gap-3 px-4 py-4 text-white hover:bg-gray-700 transition"
          >
            <span className="text-xl">❓</span> Help
          </button>
          <button
            onClick={() => flash("Thanks for the support!")}
            className="w-full flex items-center gap-3 px-4 py-4 text-white hover:bg-gray-700 transition"
          >
            <span className="text-xl">⭐</span> Rate the app
          </button>
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-4 py-4 text-white hover:bg-gray-700 transition"
          >
            <span className="text-xl">🎁</span> Share with friends
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-red-500 hover:bg-red-400 text-white font-semibold py-3 rounded-2xl transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}
