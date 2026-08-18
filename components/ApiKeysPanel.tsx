"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

type MintedKey = {
  apiKey: string;
  sdkToken: string | null;
  mintedAt: string;
};

/**
 * PymtHouse's Builder API can mint a key but has no list/rename/revoke
 * surface, so — same as ComfyPeer's settings page — keys minted this session
 * are shown once, in-memory only. Refreshing the page clears the list; that's
 * honest given there's nowhere real to persist "last used" or "revoked"
 * without standing up a database we deliberately kept out of this app.
 */
export function ApiKeysPanel() {
  const [minted, setMinted] = useState<MintedKey[]>([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function mintKey() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/pymthouse/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(label.trim() ? { label: label.trim() } : {}),
      });
      const data = (await res.json()) as { apiKey?: string; sdkToken?: string; error?: string };
      if (!res.ok || !data.apiKey) throw new Error(data.error || "Failed to mint key");
      setMinted((prev) => [
        { apiKey: data.apiKey!, sdkToken: data.sdkToken ?? null, mintedAt: new Date().toISOString() },
        ...prev,
      ]);
      setLabel("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to mint key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-surface p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-fg">New API key</h3>
            <p className="mt-1 text-xs text-muted">
              Minted through PymtHouse. Shown once — copy it before you navigate away.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Label (optional)"
              className="h-9 w-40 rounded-md border border-border bg-white px-3 text-sm text-fg outline-none focus-visible:ring-1 focus-visible:ring-live/30"
            />
            <Button type="button" onClick={() => void mintKey()} disabled={busy}>
              {busy ? "Minting…" : "New API key"}
            </Button>
          </div>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-billing-block">
            {error}
          </p>
        ) : null}
      </div>

      {minted.length > 0 ? (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {minted.map((key) => (
            <li key={key.apiKey} className="space-y-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-faint">
                  Minted {new Date(key.mintedAt).toLocaleTimeString("en-US")} · shown once
                </p>
              </div>
              <code className="block break-all rounded-md bg-elevated px-3 py-2 font-mono text-xs text-live-strong">
                {key.apiKey}
              </code>
              {key.sdkToken ? (
                <>
                  <p className="text-xs text-faint">SDK token</p>
                  <code className="block break-all rounded-md bg-elevated px-3 py-2 font-mono text-xs text-cool">
                    {key.sdkToken}
                  </code>
                </>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted">No keys minted this session yet.</p>
          <p className="mt-1 text-xs text-faint">Mint one above to see it here.</p>
        </div>
      )}
    </div>
  );
}
