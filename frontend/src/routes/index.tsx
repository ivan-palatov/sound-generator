import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GenerationPage } from "../components/GenerationPage.tsx";
import { useHistory } from "../context/HistoryContext.tsx";
import type { HistoryEntry } from "../types.ts";

function IndexPage() {
  const navigate = useNavigate();
  const { refreshHistory } = useHistory();

  const handleGenerated = async (entry: HistoryEntry) => {
    await refreshHistory();
    navigate({ to: "/history/$entryId", params: { entryId: entry.id } });
  };

  return <GenerationPage mode="new" onGenerated={handleGenerated} />;
}

export const Route = createFileRoute("/")({
  component: IndexPage,
});
