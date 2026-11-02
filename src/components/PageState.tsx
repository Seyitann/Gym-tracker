export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <p className="text-gray-300">Loading...</p>
    </div>
  );
}

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm text-center">
        <p className="text-red-400 font-semibold mb-2">Something went wrong</p>
        <p className="text-gray-400 text-sm mb-4">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-yellow-400 text-gray-900 font-semibold px-4 py-2 rounded-lg"
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
