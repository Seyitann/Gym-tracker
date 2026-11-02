interface Props {
  icon: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

export default function ToggleRow({ icon, label, description, checked, onChange }: Props) {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-white">{label}</p>
          <p className="text-gray-500 text-xs">{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={`w-12 h-7 rounded-full transition relative flex-shrink-0 ${
          checked ? "bg-yellow-400" : "bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
