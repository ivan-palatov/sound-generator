import { createRootRoute, Outlet } from "@tanstack/react-router";
import { HistoryPanel } from "../components/HistoryPanel.tsx";
import { HistoryProvider } from "../context/HistoryContext.tsx";
import "../App.css";

function RootLayout() {
  return (
    <HistoryProvider>
      <div className="app">
        <header className="app-header">
          <h1>Sound Generator</h1>
          <p className="subtitle">MiniMax Music Generation</p>
        </header>

        <div className="app-layout">
          <HistoryPanel />
          <Outlet />
        </div>
      </div>
    </HistoryProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
