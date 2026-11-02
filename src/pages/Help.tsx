import { useNavigate } from "react-router-dom";

const faqs = [
  {
    q: "How do I log a workout?",
    a: "Open the Workout tab, pick an exercise, add your weight, sets and reps, and tap Start Workout. It logs itself when the timer finishes.",
  },
  {
    q: "What does Stop do?",
    a: "Stop cancels the timer without saving anything.",
  },
  {
    q: "How do I skip a workout day?",
    a: "On a planned workout day, use the Move to menu on the Workout tab to push it to a later day this week.",
  },
  {
    q: "How do I change my goal or workout days?",
    a: "Go to Settings, then Personal information.",
  },
  {
    q: "Can I use pounds instead of kilograms?",
    a: "Yes. Go to Settings, then Units of measurement. Your saved data converts automatically.",
  },
  {
    q: "Where do my progress photos go?",
    a: "They are stored privately in your account and only you can see them.",
  },
];

export default function Help() {
  const navigate = useNavigate();

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
          <h1 className="text-2xl font-bold text-white">Help</h1>
        </div>

        <div className="space-y-3">
          {faqs.map((item) => (
            <div key={item.q} className="bg-gray-800 rounded-2xl p-4">
              <p className="text-white font-semibold mb-1">{item.q}</p>
              <p className="text-gray-400 text-sm">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
