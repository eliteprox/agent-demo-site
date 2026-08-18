import type { Metadata } from "next";
import { FileText } from "lucide-react";
import { requireCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = { title: "API Logs" };

export default async function ApiLogsPage() {
  await requireCurrentUser();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-fg">API logs</h1>
          <p className="mt-1 text-sm text-muted">View your 100 most recent API requests and errors.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" disabled /> Errors only
          </label>
          <button type="button" disabled className="text-faint">
            Refresh
          </button>
          <button type="button" disabled className="text-faint">
            Clear
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="grid grid-cols-6 gap-2 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wide text-faint">
          <span>Method</span>
          <span>Endpoint</span>
          <span>Status</span>
          <span>Duration</span>
          <span>Time</span>
          <span>API key</span>
        </div>
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <FileText className="h-6 w-6 text-faint" strokeWidth={1.5} />
          <p className="text-sm text-muted">No API logs yet.</p>
          <p className="text-xs text-faint">Make an API request to see it here.</p>
        </div>
      </div>
    </div>
  );
}
