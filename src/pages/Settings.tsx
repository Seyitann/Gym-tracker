import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Gift,
  KeyRound,
  LayoutGrid,
  Lightbulb,
  LogOut,
  MessageCircle,
  PersonStanding,
  Ruler,
  Star,
  Target,
  Timer,
  User,
  Volume2,
} from "lucide-react";
import { logoutUser } from "../api/auth";
import { getCurrentUser, getProfile } from "../api/data";
import type { AppUser, Profile } from "../types";
import { dayNamesShort, goalLabel, parseWorkoutDays } from "../constants";
import { getPreferences, updatePreference } from "../utils/preferences";
import type { Preferences } from "../utils/preferences";
import { notify, requestNotificationPermission } from "../utils/notify";
import Page from "../components/Page";
import ToggleRow from "../components/ToggleRow";
import { ErrorScreen, errorMessage } from "../components/PageState";
import { Skeleton } from "../components/Skeleton";

type ToggleKey = "smartWeightReps" | "warmupEnabled" | "soundsEnabled";
type NotifyKey = "workoutReminders" | "motivationalNotifications";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-bold text-muted mb-2 px-1">{title}</h2>
      <div className="bg-white rounded-3xl shadow-card divide-y divide-line overflow-hidden">
        {children}
      </div>
    </section>
  );
}

interface RowProps {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}

function Row({ icon, label, value, onClick }: RowProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-surface transition"
    >
      <span className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-ink font-semibold">{label}</span>
      {value && <span className="text-sm text-muted truncate max-w-[40%]">{value}</span>}
      <ChevronRight size={18} className="text-muted flex-shrink-0" />
    </button>
  );
}

function SkeletonRow({ labelWidth }: { labelWidth: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="w-10 h-10 rounded-2xl flex-shrink-0" />
      <Skeleton className={`h-4 ${labelWidth}`} />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <Page>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
      </div>

      <div className="space-y-6">
        {/* Profile card */}
        <div className="flex items-center gap-4 bg-white shadow-card rounded-3xl p-4">
          <Skeleton className="w-14 h-14 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <Group title="Account">
          {["w-40", "w-28", "w-32", "w-36"].map((w, i) => (
            <SkeletonRow key={i} labelWidth={w} />
          ))}
        </Group>

        <Group title="Training">
          {["w-16", "w-44", "w-24", "w-40", "w-32"].map((w, i) => (
            <SkeletonRow key={i} labelWidth={w} />
          ))}
        </Group>

        <Group title="Alerts">
          {["w-20", "w-40", "w-52"].map((w, i) => (
            <SkeletonRow key={i} labelWidth={w} />
          ))}
        </Group>

        <Group title="Support">
          {["w-16", "w-28", "w-40"].map((w, i) => (
            <SkeletonRow key={i} labelWidth={w} />
          ))}
        </Group>

        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </Page>
  );
}

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
    window.setTimeout(() => setMessage(""), 2200);
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

  if (loading) return <SettingsSkeleton />;
  if (loadError) return <ErrorScreen message={loadError} />;

  const days = parseWorkoutDays(profile?.workout_days)
    .map((d) => dayNamesShort[d])
    .join(", ");

  return (
    <Page>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        {message && (
          <span role="status" className="text-sm font-bold text-mint-600">
            {message}
          </span>
        )}
      </div>

      <div className="space-y-6">
        <button
          onClick={() => navigate("/settings/profile")}
          className="w-full flex items-center gap-4 bg-brand-50 rounded-3xl p-4 text-left active:scale-[0.99] transition"
        >
          <span className="w-14 h-14 rounded-full bg-brand-500 text-white text-xl font-extrabold flex items-center justify-center flex-shrink-0">
            {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
          </span>
          <span className="flex-1 min-w-0">
            <span className="block font-extrabold text-ink truncate">{user?.name || "Your name"}</span>
            <span className="block text-sm text-muted truncate">{user?.email}</span>
          </span>
          <ChevronRight size={18} className="text-muted" />
        </button>

        <Group title="Account">
          <Row icon={<User size={20} />} label="Personal information" onClick={() => navigate("/settings/profile")} />
          <Row
            icon={<Target size={20} />}
            label="Fitness goal"
            value={goalLabel(profile?.goal)}
            onClick={() => navigate("/settings/profile")}
          />
          <Row
            icon={<CalendarDays size={20} />}
            label="Workout days"
            value={days || "Not set"}
            onClick={() => navigate("/settings/profile")}
          />
          <Row icon={<KeyRound size={20} />} label="Change password" onClick={() => navigate("/settings/password")} />
        </Group>

        <Group title="Training">
          <Row
            icon={<Ruler size={20} />}
            label="Units"
            value={prefs.units}
            onClick={() => navigate("/settings/units")}
          />
          <ToggleRow
            icon={<Lightbulb size={20} />}
            label="Smart weight and reps"
            description="Pre-fill your last weight, sets and reps"
            checked={prefs.smartWeightReps}
            onChange={() => toggle("smartWeightReps")}
          />
          <Row
            icon={<Timer size={20} />}
            label="Rest timer"
            value={prefs.restTimerSeconds === 0 ? "Off" : `${prefs.restTimerSeconds}s`}
            onClick={() => navigate("/settings/rest-timer")}
          />
          <ToggleRow
            icon={<PersonStanding size={20} />}
            label="Warmup reminder"
            description="Show a warmup step before each workout"
            checked={prefs.warmupEnabled}
            onChange={() => toggle("warmupEnabled")}
          />
          <div className="flex items-center justify-between gap-3 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center">
                <LayoutGrid size={20} />
              </span>
              <span className="text-ink font-semibold">Exercise picker</span>
            </div>
            <div className="flex bg-surface rounded-xl p-1">
              {(["list", "grid"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => {
                    setPrefs(updatePreference("tabDisplay", mode));
                    flash("Saved");
                  }}
                  aria-pressed={prefs.tabDisplay === mode}
                  className={`px-3 h-8 rounded-lg text-sm font-bold capitalize ${
                    prefs.tabDisplay === mode ? "bg-brand-500 text-white" : "text-ink/60"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </Group>

        <Group title="Alerts">
          <ToggleRow
            icon={<Volume2 size={20} />}
            label="Sounds"
            description="Beep when a timer finishes"
            checked={prefs.soundsEnabled}
            onChange={() => toggle("soundsEnabled")}
          />
          <ToggleRow
            icon={<Bell size={20} />}
            label="Workout reminders"
            description="A notification on your workout days"
            checked={prefs.workoutReminders}
            onChange={() => toggleNotifications("workoutReminders")}
          />
          <ToggleRow
            icon={<MessageCircle size={20} />}
            label="Motivational notifications"
            description="Encouragement when you finish a workout"
            checked={prefs.motivationalNotifications}
            onChange={() => toggleNotifications("motivationalNotifications")}
          />
        </Group>

        <Group title="Support">
          <Row icon={<CircleHelp size={20} />} label="Help" onClick={() => navigate("/settings/help")} />
          <Row icon={<Star size={20} />} label="Rate the app" onClick={() => flash("Thanks for the support!")} />
          <Row icon={<Gift size={20} />} label="Share with friends" onClick={handleShare} />
        </Group>

        <button
          onClick={handleLogout}
          className="w-full h-12 rounded-2xl bg-white border border-line text-brand-600 font-bold inline-flex items-center justify-center gap-2 active:scale-[0.98] transition"
        >
          <LogOut size={18} /> Log out
        </button>
      </div>
    </Page>
  );
}
