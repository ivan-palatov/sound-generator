import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { HistoryPanel } from "../components/HistoryPanel.tsx";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { HistoryProvider } from "../context/HistoryContext.tsx";
import { ThemeProvider } from "../context/ThemeContext.tsx";
import "../App.css";

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCover = pathname.startsWith("/cover");
  const isTts = pathname.startsWith("/tts");

  return (
    <ThemeProvider>
      <HistoryProvider>
        <div className="app">
          <header className="app-header">
            <div className="app-header-top">
              <div>
                <h1>Sound Generator</h1>
                <p className="subtitle">MiniMax Music & Speech Generation</p>
              </div>
              <div className="app-header-actions">
                <nav className="mode-tabs" aria-label="Generation mode">
                  <Link
                    to="/"
                    className={`mode-tab ${!isCover && !isTts ? "active" : ""}`}
                  >
                    New Song
                  </Link>
                  <Link to="/cover" className={`mode-tab ${isCover ? "active" : ""}`}>
                    New Cover
                  </Link>
                  <Link to="/tts" className={`mode-tab ${isTts ? "active" : ""}`}>
                    Text to Speech
                  </Link>
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </header>

          <div className="app-layout">
            <HistoryPanel />
            <Outlet />
          </div>
        </div>
      </HistoryProvider>
    </ThemeProvider>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});
