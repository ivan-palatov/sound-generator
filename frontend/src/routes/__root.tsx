import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { HistoryPanel } from "../components/HistoryPanel.tsx";
import { LanguageSwitcher } from "../components/LanguageSwitcher.tsx";
import { ThemeToggle } from "../components/ThemeToggle.tsx";
import { HistoryProvider } from "../context/HistoryContext.tsx";
import { ThemeProvider } from "../context/ThemeContext.tsx";
import "../App.css";

function RootLayout() {
  const { t } = useTranslation();
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
                <h1>{t("app.title")}</h1>
                <p className="subtitle">{t("app.subtitle")}</p>
              </div>
              <div className="app-header-actions">
                <nav className="mode-tabs" aria-label={t("nav.generationMode")}>
                  <Link
                    to="/"
                    className={`mode-tab ${!isCover && !isTts ? "active" : ""}`}
                  >
                    {t("nav.newSong")}
                  </Link>
                  <Link to="/cover" className={`mode-tab ${isCover ? "active" : ""}`}>
                    {t("nav.newCover")}
                  </Link>
                  <Link to="/tts" className={`mode-tab ${isTts ? "active" : ""}`}>
                    {t("nav.textToSpeech")}
                  </Link>
                </nav>
                <LanguageSwitcher />
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
