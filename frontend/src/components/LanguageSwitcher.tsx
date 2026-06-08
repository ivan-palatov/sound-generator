import { useTranslation } from "react-i18next";
import i18n from "../i18n/index.ts";

export function LanguageSwitcher() {
  const { t } = useTranslation();
  const current = i18n.language.startsWith("ru") ? "ru" : "en";
  const next = current === "en" ? "ru" : "en";

  return (
    <button
      type="button"
      className="language-switcher"
      onClick={() => void i18n.changeLanguage(next)}
      aria-label={t("language.switchTo", { language: t(`language.${next}`) })}
      title={t(`language.${next}`)}
    >
      {current.toUpperCase()}
    </button>
  );
}
