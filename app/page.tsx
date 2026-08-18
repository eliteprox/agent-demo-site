import Link from "next/link";
import { Bot, CircleDollarSign, Cpu, Sparkles } from "lucide-react";
import { Button } from "@/components/Button";
import { SignInPanel } from "@/components/SignInPanel";
import { getCurrentUser } from "@/lib/current-user";
import { SITE } from "@/lib/constants";

const FORUM_POSTS = [
  { title: "Token economics of per-second billing", date: "Aug 12, 2026", replies: 14 },
  { title: "Protocol variants for agent-driven jobs", date: "Aug 9, 2026", replies: 6 },
  { title: "Notes from the orchestrator capacity survey", date: "Aug 3, 2026", replies: 21 },
];

export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <section className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            Get started with {SITE.name}
          </h1>
          <p className="mt-3 max-w-xl text-base text-muted">{SITE.oneLiner}</p>

          <ol className="mt-8 space-y-4">
            <li className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-dim font-mono text-sm font-semibold text-live-strong">
                1
              </span>
              <div>
                <p className="font-medium text-fg">Install Livepeer Agent</p>
                <p className="mt-1 text-sm text-muted">
                  Pull in the SDK and point it at your minted API key.{" "}
                  <a
                    href="https://docs.livepeer.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cool hover:underline"
                  >
                    Read the docs ↗
                  </a>
                </p>
              </div>
            </li>
            <li className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-dim font-mono text-sm font-semibold text-live-strong">
                2
              </span>
              <div>
                <p className="font-medium text-fg">Add credits</p>
                <p className="mt-1 text-sm text-muted">
                  Real Stripe Checkout via PymtHouse — top up in seconds.{" "}
                  <Link href="/billing" className="text-cool hover:underline">
                    Go to billing →
                  </Link>
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href="https://livepeer.org"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-lg border border-border bg-surface p-5 hover:border-border-strong"
            >
              <Cpu className="h-5 w-5 text-cool" strokeWidth={1.5} />
              <p className="mt-3 font-medium text-fg">Run an Orchestrator</p>
              <p className="mt-1 text-sm text-muted">
                Provide compute to the network and earn fees for jobs your node serves.
              </p>
            </a>
            <Link href="/playbooks" className="group rounded-lg border border-border bg-surface p-5 hover:border-border-strong">
              <Sparkles className="h-5 w-5 text-live-strong" strokeWidth={1.5} />
              <p className="mt-3 font-medium text-fg">Explore playbooks</p>
              <p className="mt-1 text-sm text-muted">
                Step-by-step recipes for creating and editing media with your agent.
              </p>
            </Link>
          </div>

          <section className="mt-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fg">Research</h2>
              <span className="text-xs text-faint">Demo content</span>
            </div>
            <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">
              {FORUM_POSTS.map((post) => (
                <li key={post.title} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-fg">
                    <Bot className="h-4 w-4 text-faint" strokeWidth={1.5} />
                    {post.title}
                  </div>
                  <span className="shrink-0 font-mono text-xs text-faint">
                    {post.date} · {post.replies} replies
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          {user ? (
            <div className="rounded-lg border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold text-fg">Welcome back</h3>
              <p className="mt-1 text-xs text-muted">Signed in as {user.email}</p>
              <Button href="/usage" variant="secondary" className="mt-4 w-full">
                <CircleDollarSign className="h-4 w-4" strokeWidth={1.5} /> View balance
              </Button>
            </div>
          ) : (
            <SignInPanel returnTo="/usage" />
          )}
        </aside>
      </section>
    </div>
  );
}
