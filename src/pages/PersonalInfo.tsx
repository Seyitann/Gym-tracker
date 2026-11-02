import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, getProfile, saveProfile, updateName } from "../api/data";
import type { AppUser } from "../types";
import { dayNamesShort, goals, parseWorkoutDays, serializeWorkoutDays } from "../constants";
import { fromKg, getPreferences, toKg } from "../utils/preferences";
import { ErrorScreen, LoadingScreen, errorMessage } from "../components/PageState";

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400";

export default function PersonalInfo() {
  const units = getPreferences().units;
  const navigate = useNavigate();

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

  if (loading) return <LoadingScreen />;
  if (loadError) return <ErrorScreen message={loadError} />;

  return (
    <div className="min-h-screen bg-gray-900 px-4 pt-8 pb-28">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/settings")}
            aria-label="Back to settings"
            className="text-yellow-400 text-3xl leading-none"
          >
            ‹
          </button>
          <h1 className="text-2xl font-bold text-white">Personal information</h1>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
          <div>
            <label className="block text-gray-300 text-sm mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Email</label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full px-3 py-2 rounded-lg bg-gray-900 text-gray-500 border border-gray-700 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm mb-1">Height (cm)</label>
            <input
              type="number"
              inputMode="decimal"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Current weight ({units})</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={startingWeight}
                onChange={(e) => setStartingWeight(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm mb-1">Target weight ({units})</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-white font-semibold mb-3">Fitness goal</h2>
          <div className="grid grid-cols-2 gap-2">
            {goals.map((g) => (
              <button
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`p-3 rounded-xl text-sm text-left ${
                  goal === g.value ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-300"
                }`}
              >
                {g.icon} {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl p-6">
          <h2 className="text-white font-semibold mb-3">Workout days</h2>
          <div className="flex gap-2 justify-between">
            {dayNamesShort.map((label, i) => (
              <button
                key={label}
                onClick={() => toggleDay(i)}
                aria-label={label}
                aria-pressed={days.includes(i)}
                className={`w-10 h-10 rounded-full text-sm font-semibold ${
                  days.includes(i) ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-300"
                }`}
              >
                {label[0]}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:opacity-50 text-gray-900 font-semibold py-3 rounded-xl transition"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>

        {message && (
          <p
            className={`text-sm text-center ${
              message.type === "ok" ? "text-green-400" : "text-red-400"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
