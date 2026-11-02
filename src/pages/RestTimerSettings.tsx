import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPreferences, updatePreference } from "../utils/preferences";

const options = [0, 30, 60, 90, 120, 180];

export default function RestTimerSettings() {
  const [seconds, setSeconds] = useState(getPreferences().restTimerSeconds);
  const navigate = useNavigate();

  function handleSelect(value: number) {
    updatePreference("restTimerSeconds", value);
    setSeconds(value);
  }

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
          <h1 className="text-2xl font-bold text-white">Rest timer</h1>
        </div>

        <p className="text-gray-400 text-sm">
          How long the rest timer runs after you finish a workout. Choose Off to skip it.
        </p>

        <div className="bg-gray-800 rounded-2xl shadow-xl divide-y divide-gray-700">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              className="w-full flex items-center justify-between px-4 py-4 text-white"
            >
              {opt === 0 ? "Off" : `${opt} seconds`}
              {seconds === opt && <span className="text-yellow-400">✓</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
