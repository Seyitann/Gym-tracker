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
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You're offline. Check your internet connection and try again.";
  }

  const raw =
    err instanceof Error
      ? err.message
      : typeof err === "string"
      ? err
      : typeof err === "object" && err !== null && "message" in err
      ? String((err as { message: unknown }).message)
      : "";
  const text = raw.toLowerCase();
  const status =
    typeof err === "object" && err !== null && "status" in err
      ? Number((err as { status: unknown }).status)
      : 0;

  // Fetch fails like this when the network is down or very weak
  if (
    text.includes("failed to fetch") ||
    text.includes("load failed") ||
    text.includes("networkerror") ||
    text.includes("network request failed") ||
    text.includes("fetch failed")
  ) {
    return "Can't reach the server. Check your network connection and try again.";
  }

  if (text.includes("timeout") || text.includes("timed out") || status === 408) {
    return "The request took too long. Your connection may be slow, so please try again.";
  }

  if (status === 401 || text.includes("jwt expired") || text.includes("not authenticated")) {
    return "Your session has expired. Please log in again.";
  }

  if (status >= 500) {
    return "Something went wrong on our side. Please try again in a moment.";
  }

  // Keep specific messages such as "Invalid login credentials"
  return raw || "Something went wrong. Please try again.";
}