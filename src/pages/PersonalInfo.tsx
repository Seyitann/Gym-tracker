import { useEffect, useState } from "react";
import { getCurrentUser, getProfile, saveProfile, updateName } from "../api/data";
import type { AppUser } from "../types";
import { dayNamesShort, goals, parseWorkoutDays, serializeWorkoutDays } from "../constants";
import { fromKg, getPreferences, toKg } from "../utils/preferences";
import Page, { PageHeader } from "../components/Page";
import TextField from "../components/TextField";
import { ErrorScreen, errorMessage } from "../components/PageState";
import { Skeleton } from "../components/Skeleton";
import { btnPrimary } from "../ui";

function FieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-12 rounded-2xl" />
    </div>
  );
}

function PersonalInfoSkeleton() {
  return (
    <Page>
      <PageHeader title="Personal information" back="/settings" />

      <div className="space-y-5">
        {/* Text fields */}
        <section className="bg-white rounded-3xl shadow-card p-5 space-y-4">
          <FieldSkeleton />
          <FieldSkeleton />
          <FieldSkeleton />
          <div className="grid grid-cols-2 gap-3">
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
        </section>

        {/* Fitness goal */}
        <section className="bg-white rounded-3xl shadow-card p-5">
          <h2 className="font-extrabold text-ink mb-3">Fitness goal</h2>
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-2xl" />
            ))}
          </div>
        </section>

        {/* Workout days */}
        <section className="bg-white rounded-3xl shadow-card p-5">
          <h2 className="font-extrabold text-ink mb-3">Workout days</h2>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        </section>

        {/* Save button */}
        <Skeleton className="h-12 rounded-2xl" />
      </div>
    </Page>
  );
}

export default function PersonalInfo() {
  const units = getPreferences().units;

  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("general_fitness");
  const [heightCm, setHeightCm] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [days, setDays] = useState<number[]>([]);

  useEffect(() => {
    Promise.all([getCurrentUser(), getProfile()])
      .then(([u, p]) => {
        setUser(u);
        setName(u.name);
        if (p) {
          setGoal(p.goal ?? "general_fitness");
          setHeightCm(p.height_cm?.toString() ?? "");
          setStartingWeight(p.starting_weight != null ? String(fromKg(p.starting_weight, units)) : "");
          setTargetWeight(p.target_weight != null ? String(fromKg(p.target_weight, units)) : "");
          setDays(parseWorkoutDays(p.workout_days));
        }
      })
      .catch((err) => setLoadError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, [units]);

  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSave() {
    if (days.length === 0) {
      setMessage({ type: "error", text: "Pick at least one workout day." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      if (user && name.trim() !== user.name) await updateName(name.trim());
      const start = parseFloat(startingWeight);
      const target = parseFloat(targetWeight);
      const height = parseFloat(heightCm);
      await saveProfile({
        goal,
        height_cm: Number.isFinite(height) ? height : null,
        starting_weight: Number.isFinite(start) ? toKg(start, units) : null,
        target_weight: Number.isFinite(target) ? toKg(target, units) : null,
        workout_days: serializeWorkoutDays(days),
      });
      setMessage({ type: "ok", text: "Saved!" });
    } catch (err) {
      setMessage({ type: "error", text: errorMessage(err) });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PersonalInfoSkeleton />;
  if (loadError) return <ErrorScreen message={loadError} />;

  return (
    <Page>
      <PageHeader title="Personal information" back="/settings" />

      <div className="space-y-5">
        <section className="bg-white rounded-3xl shadow-card p-5 space-y-4">
          <TextField label="Name" value={name} onChange={setName} autoComplete="name" />
          <TextField label="Email" type="email" value={user?.email ?? ""} onChange={() => {}} disabled />
          <TextField
            label="Height (cm)"
            type="number"
            inputMode="decimal"
            value={heightCm}
            onChange={setHeightCm}
          />
          <div className="grid grid-cols-2 gap-3">
            <TextField
              label={`Weight (${units})`}
              type="number"
              inputMode="decimal"
              step="0.1"
              value={startingWeight}
              onChange={setStartingWeight}
            />
            <TextField
              label={`Target (${units})`}
              type="number"
              inputMode="decimal"
              step="0.1"
              value={targetWeight}
              onChange={setTargetWeight}
            />
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-card p-5">
          <h2 className="font-extrabold text-ink mb-3">Fitness goal</h2>
          <div className="grid grid-cols-2 gap-2">
            {goals.map((g) => {
              const Icon = g.icon;
              const active = goal === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 p-3 rounded-2xl text-sm font-bold text-left transition ${
                    active ? "bg-brand-500 text-white" : "bg-surface text-ink"
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" /> {g.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="bg-white rounded-3xl shadow-card p-5">
          <h2 className="font-extrabold text-ink mb-3">Workout days</h2>
          <div className="grid grid-cols-7 gap-2">
            {dayNamesShort.map((label, i) => (
              <button
                key={label}
                onClick={() => toggleDay(i)}
                aria-label={label}
                aria-pressed={days.includes(i)}
                className={`aspect-square rounded-2xl text-sm font-bold transition ${
                  days.includes(i) ? "bg-brand-500 text-white" : "bg-surface text-ink/60"
                }`}
              >
                {label[0]}
              </button>
            ))}
          </div>
        </section>

        <button onClick={handleSave} disabled={saving} className={`${btnPrimary} w-full`}>
          {saving ? "Saving..." : "Save changes"}
        </button>

        {message && (
          <p
            role={message.type === "error" ? "alert" : "status"}
            className={`text-sm text-center rounded-2xl px-4 py-3 ${
              message.type === "ok" ? "text-mint-600 bg-mint-50" : "text-brand-600 bg-brand-50"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </Page>
  );
}
