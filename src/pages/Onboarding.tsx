import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWeightLog, saveProfile } from "../api/data";
import { dayNamesShort, goals, serializeWorkoutDays } from "../constants";
import { errorMessage } from "../components/PageState";
import Page from "../components/Page";
import { btnPrimary, btnQuiet, inputClass } from "../ui";
import { CardSkeleton } from "../components/Skeleton";
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [startingWeight, setStartingWeight] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleFinish() {
    setSaving(true);
    setError("");
    try {
      const start = parseFloat(startingWeight);
      const target = parseFloat(targetWeight);
      const height = parseFloat(heightCm);
      await saveProfile({
        goal,
        height_cm: Number.isFinite(height) ? height : null,
        starting_weight: Number.isFinite(start) ? start : null,
        target_weight: Number.isFinite(target) ? target : null,
        workout_days: serializeWorkoutDays(selectedDays),
      });
      // Seed the weight chart with the starting weight
      if (Number.isFinite(start)) await createWeightLog(start);
      navigate("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Page nav={false}>
      <div className="flex gap-2 mb-8" aria-label={`Step ${step} of 3`}>
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              n <= step ? "bg-brand-500" : "bg-line"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <h1 className="text-[1.75rem] leading-tight font-extrabold text-ink">
            What do you want to achieve?
          </h1>
          <p className="text-muted mt-2 mb-6">We'll shape your plan around this.</p>
          <div className="grid grid-cols-2 gap-3 mb-8">
            {goals.map((g) => {
              const Icon = g.icon;
              const active = goal === g.value;
              return (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  aria-pressed={active}
                  className={`p-4 rounded-3xl text-left transition active:scale-[0.98] ${
                    active
                      ? "bg-brand-500 text-white shadow-float"
                      : "bg-white text-ink shadow-card"
                  }`}
                >
                  <span
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-3 ${
                      active ? "bg-white/25 text-white" : "bg-brand-50 text-brand-500"
                    }`}
                  >
                    <Icon size={22} />
                  </span>
                  <span className="font-bold text-sm">{g.label}</span>
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep(2)} disabled={!goal} className={`${btnPrimary} w-full`}>
            Continue
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-[1.75rem] leading-tight font-extrabold text-ink">Tell us about you</h1>
          <p className="text-muted mt-2 mb-6">All optional. You can change these later.</p>
          <div className="space-y-4 mb-8">
            <label className="block">
              <span className="block text-sm font-semibold mb-1.5">Height (cm)</span>
              <input
                type="number"
                inputMode="decimal"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                className={inputClass}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-semibold mb-1.5">Weight (kg)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={startingWeight}
                  onChange={(e) => setStartingWeight(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold mb-1.5">Target (kg)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className={`${btnQuiet} flex-1`}>
              Back
            </button>
            <button onClick={() => setStep(3)} className={`${btnPrimary} flex-1`}>
              Continue
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="text-[1.75rem] leading-tight font-extrabold text-ink">
            Which days will you train?
          </h1>
          <p className="text-muted mt-2 mb-6">Pick as many as fit your week.</p>
          <div className="grid grid-cols-7 gap-2 mb-3">
            {dayNamesShort.map((label, i) => {
              const active = selectedDays.includes(i);
              return (
                <button
                  key={label}
                  onClick={() => toggleDay(i)}
                  aria-label={label}
                  aria-pressed={active}
                  className={`aspect-square rounded-2xl text-sm font-bold transition ${
                    active ? "bg-brand-500 text-white shadow-float" : "bg-white text-ink/60 shadow-card"
                  }`}
                >
                  {label[0]}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-muted mb-8">
            {selectedDays.length === 0
              ? "Choose at least one day."
              : selectedDays.length === 1
              ? "1 day a week"
              : `${selectedDays.length} days a week`}
          </p>
          {error && (
            <p role="alert" className="text-sm text-brand-600 bg-brand-50 rounded-2xl px-4 py-3 mb-4">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className={`${btnQuiet} flex-1`}>
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={selectedDays.length === 0 || saving}
              className={`${btnPrimary} flex-1`}
            >
              {saving ? "Saving..." : "Finish"}
            </button>
          </div>
        </>
      )}
    </Page>
  );
}
