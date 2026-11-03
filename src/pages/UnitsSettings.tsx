import { useState } from "react";
import { Check } from "lucide-react";
import { getPreferences, updatePreference } from "../utils/preferences";
import type { Units } from "../utils/preferences";
import Page, { PageHeader } from "../components/Page";
import { CardSkeleton } from "../components/Skeleton";
const options: { value: Units; label: string }[] = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "lbs", label: "Pounds (lbs)" },
];

export default function UnitsSettings() {
  const [units, setUnits] = useState<Units>(getPreferences().units);

  function handleSelect(value: Units) {
    updatePreference("units", value);
    setUnits(value);
  }

  return (
    <Page>
      <PageHeader title="Units" back="/settings" />
      <div className="bg-white rounded-3xl shadow-card divide-y divide-line overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleSelect(opt.value)}
            className="w-full flex items-center justify-between px-5 py-4 text-ink font-semibold"
          >
            {opt.label}
            {units === opt.value && <Check size={20} className="text-brand-500" strokeWidth={3} />}
          </button>
        ))}
      </div>
      <p className="text-muted text-sm mt-4">
        Applies to your body weight and the weight you lift. Everything is stored in kilograms and
        converted for display, so you can switch whenever you like without losing anything. Body
        measurements stay in centimetres.
      </p>
    </Page>
  );
}
