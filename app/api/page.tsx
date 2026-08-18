import type { Metadata } from "next";
import { ApiKeysPanel } from "@/components/ApiKeysPanel";
import { requireCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = { title: "API Keys" };

export default async function ApiKeysPage() {
  await requireCurrentUser();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-fg">API keys</h1>
      <p className="mt-1 text-sm text-muted">Create and manage the keys used to authenticate API requests.</p>
      <div className="mt-6">
        <ApiKeysPanel />
      </div>
    </div>
  );
}
