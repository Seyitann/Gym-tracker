import { TriangleAlert } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div
        role="status"
        aria-label="Loading"
        className="w-10 h-10 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin"
      />
    </div>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl shadow-card p-6 max-w-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto mb-3">
          <TriangleAlert size={24} />
        </div>
        <p className="text-ink font-extrabold mb-1">Something went wrong</p>
        <p className="text-muted text-sm mb-4 break-words">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="h-11 px-5 rounded-2xl bg-brand-500 text-white font-bold"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error. Please try again.";
}
