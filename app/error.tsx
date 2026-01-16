"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <html>
      <body className="bg-white">
        <div className="fixed inset-0 z-[10030] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/5">
            <div className="p-6 space-y-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                !
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Something went wrong</h2>
              <p className="text-sm text-slate-600">
                We hit a snag while loading this page. Try again, or go back and continue
                browsing. Your data is safe.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => window.history.back()}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Go back
                </button>
                <button
                  onClick={reset}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-accents hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
              {error.digest ? (
                <p className="text-[11px] text-slate-400">Ref: {error.digest}</p>
              ) : null}
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
