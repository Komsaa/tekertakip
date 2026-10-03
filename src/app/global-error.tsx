"use client";
import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="tr">
      <body style={{ fontFamily: "sans-serif", padding: 40 }}>
        <h1>Sayfa yüklenemedi</h1>
        <p>Lütfen tekrar deneyin.</p>
        <button onClick={reset}>Tekrar dene</button>
      </body>
    </html>
  );
}
