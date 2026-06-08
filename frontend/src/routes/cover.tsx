import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { CoverPage } from "../components/CoverPage.tsx";
import { useHistory } from "../context/HistoryContext.tsx";
import type { CoverPrefill } from "../lib/cover.ts";
import type { HistoryEntry } from "../types.ts";

function CoverRoutePage() {
  const navigate = useNavigate();
  const { refreshHistory } = useHistory();
  const prefill = useRouterState({
    select: (state) => {
      const duplicate = state.location.state?.duplicate;
      if (!duplicate || !("form" in duplicate && "workflow" in duplicate.form)) {
        return undefined;
      }
      return duplicate as CoverPrefill;
    },
  });

  const handleGenerated = async (entry: HistoryEntry) => {
    await refreshHistory();
    navigate({ to: "/history/$entryId", params: { entryId: entry.id } });
  };

  return <CoverPage mode="new" prefill={prefill} onGenerated={handleGenerated} />;
}

export const Route = createFileRoute("/cover")({
  component: CoverRoutePage,
});
