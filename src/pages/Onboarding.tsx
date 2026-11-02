import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createWeightLog, saveProfile } from "../api/data";
import { dayNamesShort, goals, serializeWorkoutDays } from "../constants";
import { errorMessage } from "../components/PageState";

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400";

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
      const start = startingWeight ? parseFloat(startingWeight) : null;
      await saveProfile({
        goal,
        height_cm: heightCm ? parseFloat(heightCm) : null,
        starting_weight: start,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        workout_days: serializeWorkoutDays(selectedDays),
      });
      // Seed the weight chart with the starting weight
      if (start) await createWeightLog(start);
      navigate("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-8">
      <div className="bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
        <p className="text-gray-500 text-xs mb-3">Step {step} of 3</p>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">What's your goal?</h2>
            <p className="text-gray-400 text-sm mb-6">We'll tailor your plan around this.</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {goals.map((g) => (
                <button
                  key={g.value}
                  onClick={() => setGoal(g.value)}
                  className={`p-4 rounded-xl text-left transition ${
                    goal === g.value ? "bg-yellow-400 text-gray-900" : "bg-gray-700 text-gray-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{g.icon}</div>
                  <div className="text-sm font-medium">{g.label}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!goal}
              className="w-full bg-yellow-400 disabled:opacity-40 hover:bg-yellow-300 text-gray-900 font-semibold py-3 rounded-xl transition"
            >
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Tell us about you</h2>
            <p className="text-gray-400 text-sm mb-6">All optional. You can change these later.</p>
            <div className="space-y-4 mb-6">
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
              <div>
                <label className="block text-gray-300 text-sm mb-1">Current weight (kg)</label>
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
                <label className="block text-gray-300 text-sm mb-1">Target weight (kg)</label>
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
            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-gray-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold py-3 rounded-xl transition"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">
              Which days do you want to work out?
            </h2>
            <p className="text-gray-400 text-sm mb-6">Pick as many as fit your week.</p>
            <div className="flex gap-2 justify-between mb-6">
              {dayNamesShort.map((label, i) => (
                <button
                  key={label}
                  onClick={() => toggleDay(i)}
                  aria-label={label}
                  aria-pressed={selectedDays.includes(i)}
                  className={`w-10 h-10 rounded-full text-sm font-semibold ${
                    selectedDays.includes(i)
                      ? "bg-yellow-400 text-gray-900"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {label[0]}
                </button>
              ))}
            </div>
            {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-700 text-white font-semibold py-3 rounded-xl transition"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={selectedDays.length === 0 || saving}
                className="flex-1 bg-yellow-400 disabled:opacity-40 hover:bg-yellow-300 text-gray-900 font-semibold py-3 rounded-xl transition"
              >
                {saving ? "Saving..." : "Finish"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
