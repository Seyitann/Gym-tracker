import type { ReactNode } from "react";

interface Props {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

export default function ToggleRow({ icon, label, description, checked, onChange }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-ink font-semibold">{label}</p>
          <p className="text-muted text-xs">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`w-12 h-7 rounded-full transition relative flex-shrink-0 ${
          checked ? "bg-brand-500" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
