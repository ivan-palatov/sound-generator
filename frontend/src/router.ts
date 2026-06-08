import { createRouter } from "@tanstack/react-router";
import type { GenerationPrefill } from "./lib/generation.ts";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface HistoryState {
    duplicate?: GenerationPrefill;
  }
}
