import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

const savedLocale = localStorage.getItem("locale") || "en";

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: "en",
  messages: { en, "zh-CN": zhCN },
});

export function setLocale(locale: "en" | "zh-CN") {
  (i18n.global.locale as any).value = locale;
  localStorage.setItem("locale", locale);
  document.documentElement.setAttribute("lang", locale === "zh-CN" ? "zh" : "en");
}

export function getAcceptLanguage(): string {
  const locale = (i18n.global.locale as any).value;
  return locale === "zh-CN" ? "zh-CN,zh;q=0.9,en;q=0.8" : "en-US,en;q=0.9";
}

export default i18n;
