import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Dumbbell, House, Plus, Settings, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import QuickAddSheet from "./QuickAddSheet";

interface Item {
  path: string;
  label: string;
  icon: LucideIcon;
}

const left: Item[] = [
  { path: "/dashboard", label: "Home", icon: House },
  { path: "/workouts", label: "Exercises", icon: Dumbbell },
];
const right: Item[] = [
  { path: "/progress", label: "Progress", icon: TrendingUp },
  { path: "/settings", label: "Settings", icon: Settings },
];

function Tab({ item }: { item: Item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-1 text-[11px] font-semibold ${
          isActive ? "text-brand-500" : "text-muted"
        }`
      }
    >
      <Icon size={22} strokeWidth={2.2} />
      {item.label}
    </NavLink>
  );
}

export default function BottomNav() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white rounded-t-[2rem] shadow-[0_-12px_30px_-14px_rgba(31,36,48,0.25)] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-5 items-end">
          {left.map((item) => (
            <Tab key={item.path} item={item} />
          ))}
          <div className="flex justify-center">
            <button
              onClick={() => setSheetOpen(true)}
              aria-label="Quick add"
              className="-mt-9 w-14 h-14 rounded-full bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center shadow-float ring-4 ring-surface active:scale-95 transition"
            >
              <Plus size={28} strokeWidth={2.6} />
            </button>
          </div>
          {right.map((item) => (
            <Tab key={item.path} item={item} />
          ))}
        </div>
      </nav>
      <QuickAddSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
