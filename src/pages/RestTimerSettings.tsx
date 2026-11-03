import { useState } from "react";
import { Check } from "lucide-react";
import { getPreferences, updatePreference } from "../utils/preferences";
import Page, { PageHeader } from "../components/Page";
import { CardSkeleton } from "../components/Skeleton";
const options = [0, 30, 60, 90, 120, 180];

export default function RestTimerSettings() {
  const [seconds, setSeconds] = useState(getPreferences().restTimerSeconds);

  function handleSelect(value: number) {
    updatePreference("restTimerSeconds", value);
    setSeconds(value);
  }

  return (
    <Page>
      <PageHeader title="Rest timer" back="/settings" />
      <p className="text-muted text-sm mb-4">
        How long the rest timer runs after you finish a workout. Choose Off to skip it.
      </p>
      <div className="bg-white rounded-3xl shadow-card divide-y divide-line overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className="w-full flex items-center justify-between px-5 py-4 text-ink font-semibold"
          >
            {opt === 0 ? "Off" : `${opt} seconds`}
            {seconds === opt && <Check size={20} className="text-brand-500" strokeWidth={3} />}
          </button>
        ))}
      </div>
    </Page>
  );
}
