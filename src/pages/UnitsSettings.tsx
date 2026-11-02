import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPreferences, updatePreference } from "../utils/preferences";
import type { Units } from "../utils/preferences";

export default function UnitsSettings() {
  const [units, setUnits] = useState<Units>(getPreferences().units);
  const navigate = useNavigate();

  function handleSelect(value: Units) {
    updatePreference("units", value);
    setUnits(value);
  }

  const options: { value: Units; label: string }[] = [
    { value: "kg", label: "Kilograms (kg)" },
    { value: "lbs", label: "Pounds (lbs)" },
  ];

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
          <h1 className="text-2xl font-bold text-white">Units of measurement</h1>
        </div>

        <div className="bg-gray-800 rounded-2xl shadow-xl divide-y divide-gray-700">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className="w-full flex items-center justify-between px-4 py-4 text-white"
            >
              {opt.label}
              {units === opt.value && <span className="text-yellow-400">✓</span>}
            </button>
          ))}
        </div>

        <p className="text-gray-500 text-xs">
          Applies to body weight and the weight you lift. Everything is stored in kilograms and
          converted for display, so you can switch at any time without losing data. Body
          measurements stay in centimetres.
        </p>
      </div>
    </div>
  );
}
