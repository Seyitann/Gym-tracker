import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { inputClass } from "../ui";

interface Props
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "className"> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  icon?: ReactNode;
}

export default function TextField({ label, value, onChange, hint, icon, type = "text", ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="block text-sm font-semibold text-ink mb-1.5">{label}</span>
      <span className="relative block">
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          {...rest}
          type={isPassword && visible ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${icon ? "pl-11" : ""} ${isPassword ? "pr-12" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-muted"
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
      {hint && <span className="block text-xs text-muted mt-1.5">{hint}</span>}
    </label>
  );
}
