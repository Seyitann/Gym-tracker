import { NavLink } from "react-router-dom";

const navItems = [
  { path: "/dashboard", label: "Workout", icon: "🏋️" },
  { path: "/workouts", label: "Exercises", icon: "🏃" },
  { path: "/progress", label: "Progress", icon: "📈" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 flex justify-around pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs px-3 py-1 ${
              isActive ? "text-yellow-400" : "text-gray-400"
            }`
          }
        >
          <span className="text-xl mb-1">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
