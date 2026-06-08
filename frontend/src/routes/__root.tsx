import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { HistoryPanel } from "../components/HistoryPanel.tsx";
import { HistoryProvider } from "../context/HistoryContext.tsx";
import "../App.css";

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCover = pathname.startsWith("/cover");

  return (
    <HistoryProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-header-top">
            <div>
              <h1>Sound Generator</h1>
              <p className="subtitle">MiniMax Music Generation</p>
            </div>
            <nav className="mode-tabs" aria-label="Generation mode">
              <Link to="/" className={`mode-tab ${!isCover ? "active" : ""}`}>
                New Song
              </Link>
              <Link to="/cover" className={`mode-tab ${isCover ? "active" : ""}`}>
                New Cover
              </Link>
            </nav>
          </div>
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
