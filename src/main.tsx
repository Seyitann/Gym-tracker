import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

const root = createRoot(document.getElementById("root")!);

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-card p-6 max-w-md text-ink text-sm space-y-3">
        <p className="text-brand-600 text-lg font-extrabold">{title}</p>
        {children}
      </div>
    </div>
  );
}

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  root.render(
    <Notice title="Almost there: add your Supabase keys">
      <p>
        Create a file named <code className="text-brand-600">.env.local</code> in the project
        folder, next to <code className="text-brand-600">package.json</code>, containing:
      </p>
      <pre className="bg-surface rounded-2xl p-3 text-xs whitespace-pre-wrap break-all">
        {"VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key"}
      </pre>
      <p>
        Then stop the dev server (Ctrl+C) and run <code className="text-brand-600">npm run dev</code>{" "}
        again. On Vercel, add the same two variables in Project Settings, then redeploy.
      </p>
    </Notice>
  );
} else {
  // Loaded after the check above so a bad key or URL shows a message, not a blank page
  import("./App")
    .then(({ default: App }) => {
      root.render(
        <StrictMode>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </StrictMode>
      );
    })
    .catch((err: unknown) => {
      root.render(
        <Notice title="The app could not start">
          <p className="break-words">{err instanceof Error ? err.message : String(err)}</p>
          <p>Check the values in your environment variables, then restart or redeploy.</p>
        </Notice>
      );
    });
}
