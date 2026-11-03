import { ChevronDown } from "lucide-react";
import Page, { PageHeader } from "../components/Page";
import { CardSkeleton } from "../components/Skeleton";
const faqs = [
  {
    q: "How do I log a workout?",
    a: "Tap Start workout on Home, or the + button. Pick an exercise, add your weight, sets and reps, then start the timer. It logs itself when the timer finishes.",
  },
  {
    q: "What does Stop do?",
    a: "Stop cancels the timer without saving anything.",
  },
  {
    q: "How do I skip a workout day?",
    a: "On a planned workout day, use the Move to menu on Home to push it to a later day this week.",
  },
  {
    q: "How do I change my goal or workout days?",
    a: "Go to Settings, then Personal information.",
  },
  {
    q: "Can I use pounds instead of kilograms?",
    a: "Yes. Go to Settings, then Units. Your saved data converts automatically.",
  },
  {
    q: "I forgot my password.",
    a: "On the log in screen, tap Forgot password and we'll email you a link to choose a new one.",
  },
  {
    q: "Where do my progress photos go?",
    a: "They're stored privately in your account and only you can see them.",
  },
];

export default function Help() {
  return (
    <Page>
      <PageHeader title="Help" back="/settings" />
      <div className="space-y-3">
        {faqs.map((item, i) => (
          <details
            key={item.q}
            className={`group rounded-3xl p-4 ${i % 2 === 0 ? "bg-brand-50" : "bg-mint-50"}`}
          >
            <summary className="flex items-center justify-between gap-3 cursor-pointer list-none font-bold text-ink">
              {item.q}
              <ChevronDown size={18} className="text-muted transition group-open:rotate-180 flex-shrink-0" />
            </summary>
            <p className="text-sm text-ink/70 mt-2">{item.a}</p>
          </details>
        ))}
      </div>
    </Page>
  );
}
