// Shared Tailwind class strings so every screen uses the same look

export const card = "bg-white rounded-3xl shadow-card";

export const inputClass =
  "w-full h-12 px-4 rounded-2xl bg-surface border border-line text-ink focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100 disabled:opacity-60";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold shadow-float active:scale-[0.98] transition disabled:opacity-60 disabled:shadow-none";

export const btnSoft =
  "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold active:scale-[0.98] transition disabled:opacity-60";

export const btnQuiet =
  "inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-white border border-line text-ink font-semibold active:scale-[0.98] transition disabled:opacity-60";

export function chip(active: boolean): string {
  return `inline-flex items-center gap-1.5 px-4 h-10 rounded-full text-sm font-semibold whitespace-nowrap transition ${
    active ? "bg-brand-500 text-white shadow-float" : "bg-white text-ink/70 border border-line"
  }`;
}

export const sectionTitle = "text-lg font-extrabold text-ink";
