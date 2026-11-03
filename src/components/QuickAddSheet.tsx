import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Dumbbell, Ruler, Scale } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const actions = [
  { label: "Start a workout", hint: "Pick an exercise and run the timer", icon: Dumbbell, to: "/workout", tone: "bg-brand-50 text-brand-600" },
  { label: "Log my weight", hint: "Add today's weigh-in", icon: Scale, to: "/progress?add=weight", tone: "bg-mint-50 text-mint-600" },
  { label: "Add a measurement", hint: "Waist, chest, biceps and more", icon: Ruler, to: "/progress?tab=body", tone: "bg-brand-50 text-brand-600" },
];

export default function QuickAddSheet({ open, onClose }: Props) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Quick add">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-ink/40" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-[2rem] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
        <p className="text-lg font-extrabold text-ink mb-3">What would you like to do?</p>
        <ul className="space-y-2">
          {actions.map(({ label, hint, icon: Icon, to, tone }) => (
            <li key={label}>
              <button
                onClick={() => {
                  onClose();
                  navigate(to);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-surface text-left active:scale-[0.99] transition"
              >
                <span className={`w-11 h-11 rounded-2xl flex items-center justify-center ${tone}`}>
                  <Icon size={22} />
                </span>
                <span className="flex-1">
                  <span className="block font-bold text-ink">{label}</span>
                  <span className="block text-sm text-muted">{hint}</span>
                </span>
                <ChevronRight size={18} className="text-muted" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
