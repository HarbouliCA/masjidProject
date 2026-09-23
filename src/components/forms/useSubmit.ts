"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

/** Shared submit lifecycle: busy + error + saved, with query invalidation. */
export function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const queryClient = useQueryClient();

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      await fn();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  async function runAndInvalidate(fn: () => Promise<unknown>) {
    await run(fn);
    queryClient.invalidateQueries();
  }

  return { busy, error, saved, run, runAndInvalidate };
}
