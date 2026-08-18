import type { Metadata } from "next";
import { BillingPanel } from "@/components/BillingPanel";
import { requireCurrentUser } from "@/lib/current-user";

export const metadata: Metadata = { title: "Billing" };

export default async function BillingPage() {
  await requireCurrentUser();
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-fg">Billing</h1>
      <p className="mt-1 text-sm text-muted">Balance, payment method, and invoice history via PymtHouse.</p>
      <div className="mt-6">
        <BillingPanel />
      </div>
    </div>
  );
}
