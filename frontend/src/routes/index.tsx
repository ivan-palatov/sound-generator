import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { GenerationPage } from "../components/GenerationPage.tsx";
import { useHistory } from "../context/HistoryContext.tsx";
import type { HistoryEntry } from "../types.ts";

function IndexPage() {
  const navigate = useNavigate();
  const { refreshHistory } = useHistory();
  const prefill = useRouterState({
    select: (state) => state.location.state?.duplicate,
  });

  const handleGenerated = async (entry: HistoryEntry) => {
    await refreshHistory();
    navigate({ to: "/history/$entryId", params: { entryId: entry.id } });
  };

  return <GenerationPage mode="new" prefill={prefill} onGenerated={handleGenerated} />;
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
