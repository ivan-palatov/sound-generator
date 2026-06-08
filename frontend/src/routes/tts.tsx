import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { TtsPage } from "../components/TtsPage.tsx";
import { useHistory } from "../context/HistoryContext.tsx";
import type { TtsPrefill } from "../lib/tts.ts";
import type { HistoryEntry } from "../types.ts";

function TtsRoutePage() {
  const navigate = useNavigate();
  const { refreshHistory } = useHistory();
  const prefill = useRouterState({
    select: (state) => {
      const duplicate = state.location.state?.duplicate;
      if (!duplicate || !("form" in duplicate && "text" in duplicate.form)) {
        return undefined;
      }
      return duplicate as TtsPrefill;
    },
  });

  const handleGenerated = async (entry: HistoryEntry) => {
    await refreshHistory();
    navigate({ to: "/history/$entryId", params: { entryId: entry.id } });
  };

  return <TtsPage mode="new" prefill={prefill} onGenerated={handleGenerated} />;
}

export const Route = createFileRoute("/tts")({
  component: TtsRoutePage,
});
