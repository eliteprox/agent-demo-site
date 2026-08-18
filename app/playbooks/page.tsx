import type { Metadata } from "next";
import { PLAYBOOKS, PLAYBOOK_CATEGORIES } from "@/lib/constants";

export const metadata: Metadata = { title: "Playbooks" };

export default function PlaybooksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-semibold text-fg">Playbooks</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">
        Playbooks are step-by-step production recipes for AI agents. Choose one, customize the
        brief, then copy it into your agent to run.
      </p>

      {PLAYBOOK_CATEGORIES.map((category) => (
        <section key={category} className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">{category}</h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
            {PLAYBOOKS.filter((p) => p.category === category).map((p) => (
              <li key={p.slug} className="px-4 py-3 hover:bg-elevated">
                <p className="font-medium text-fg">{p.title}</p>
                <p className="mt-0.5 text-sm text-muted">{p.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
