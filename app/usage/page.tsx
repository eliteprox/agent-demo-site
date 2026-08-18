import type { Metadata } from "next";
import { UsageBalanceCard } from "@/components/UsageBalanceCard";
import { requireCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = { title: "Usage" };

export default async function UsagePage() {
  await requireCurrentUser();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-fg">Usage</h1>
      <p className="mt-1 text-sm text-muted">Your account balance, at a glance.</p>
      <div className="mt-6">
        <UsageBalanceCard />
      </div>
    </div>
  );
}
