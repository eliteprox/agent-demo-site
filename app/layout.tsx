import type { Metadata } from "next";
import { NavShell } from "@/components/NavShell";
import { getCurrentUser } from "@/lib/current-user";
import { SITE } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.oneLiner,
  metadataBase: new URL(SITE.url),
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas text-fg antialiased">
        <NavShell user={user} />
        <main>{children}</main>
      </body>
    </html>
  );
}
