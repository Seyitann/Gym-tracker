import type { ReactNode } from "react";
import { Dumbbell } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="min-h-screen bg-[#ebecf1]">
      <div className="relative mx-auto w-full max-w-md min-h-screen bg-surface overflow-hidden px-6 pt-14 pb-10 sm:shadow-[0_0_60px_-24px_rgba(31,36,48,0.3)]">
        <div aria-hidden className="absolute -top-28 -right-24 w-72 h-72 rounded-full bg-brand-100" />
        <div aria-hidden className="absolute top-52 -left-28 w-56 h-56 rounded-full bg-mint-100/70" />

        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-brand-500 text-white flex items-center justify-center shadow-float">
            <Dumbbell size={24} />
          </div>
          <h1 className="mt-8 text-[1.75rem] leading-tight font-extrabold text-ink">{title}</h1>
          <p className="mt-2 text-muted">{subtitle}</p>
        </div>

        <div className="relative mt-8 bg-white rounded-[2rem] shadow-card p-6">{children}</div>

        {footer && <div className="relative mt-6 text-center text-sm text-muted">{footer}</div>}
      </div>
    </div>
  );
}
