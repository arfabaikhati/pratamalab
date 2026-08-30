"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MantineProvider } from "@mantine/core";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

// Mantine core styles — required by BlockNote editor
import "@mantine/core/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      })
  );

  return (
    <MantineProvider>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "var(--bg-secondary)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "14px",
            },
          }}
        />
      </QueryClientProvider>
    </MantineProvider>
  );
}
