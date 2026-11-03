import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  children: ReactNode;
  nav?: boolean; // leave room for the bottom bar
  className?: string;
}

// One centred, phone-width column. On a desktop it looks like the app on a phone.
export default function Page({ children, nav = true, className = "" }: PageProps) {
  return (
    <div
      className={`mx-auto w-full max-w-md min-h-screen bg-surface px-5 pt-[calc(env(safe-area-inset-top,0px)+2rem)] sm:shadow-[0_0_60px_-24px_rgba(31,36,48,0.3)] ${
  nav ? "pb-36" : "pb-12"
} ${className}`}
    >
      {children}
    </div>
  );
}

interface HeaderProps {
  title: string;
  back?: string; // path to go to
  right?: ReactNode;
}

export function PageHeader({ title, back, right }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3 min-w-0">
        {back && (
          <button
            onClick={() => navigate(back)}
            aria-label="Go back"
            className="w-10 h-10 rounded-full bg-white border border-line flex items-center justify-center text-ink flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-ink truncate">{title}</h1>
      </div>
      {right}
    </header>
  );
}
