import { StrictMode } from "react";
import type { ReactNode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";

const root = createRoot(document.getElementById("root")!);

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md text-gray-300 text-sm space-y-3">
        <p className="text-yellow-400 text-lg font-semibold">{title}</p>
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
        Create a file named <code className="text-yellow-400">.env.local</code> in the project
        folder, next to <code className="text-yellow-400">package.json</code>, containing:
      </p>
      <pre className="bg-gray-900 rounded-lg p-3 text-xs whitespace-pre-wrap break-all">
        {"VITE_SUPABASE_URL=https://your-project-id.supabase.co\nVITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key"}
      </pre>
      <p>
        Then stop the dev server (Ctrl+C) and run <code className="text-yellow-400">npm run dev</code>{" "}
        again. Vite only reads the file when it starts.
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
          <p>Check the values in .env.local, then restart npm run dev.</p>
        </Notice>
      );
    });
}
