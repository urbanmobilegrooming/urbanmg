"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <div className="rounded-xl bg-red-50 px-6 py-4 text-center">
        <h2 className="text-lg font-bold text-red-800">Something went wrong</h2>
        <p className="mt-1 text-sm text-red-600">{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="rounded-lg bg-[#f2c037] px-4 py-2 text-sm font-semibold text-[#1a0a3e] hover:bg-[#e5a818]"
      >
        Try again
      </button>
    </div>
  );
}
