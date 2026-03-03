/**
 * i18n 国际化配置模块。
 *
 * 使用 vue-i18n Composition API 模式，支持中英文切换。
 * 语言偏好通过 localStorage（key: "locale"）持久化，默认英文。
 */
import type { Ref } from "vue";
import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import zhCN from "./locales/zh-CN.json";

/**
 * 从 localStorage 读取用户上次选择的语言，未设置时默认英文
 */
const savedLocale = localStorage.getItem("locale") || "en";

/**
 * 创建 vue-i18n 实例。
 * - legacy: false — 启用 Composition API 模式（useI18n()）
 * - fallbackLocale — 翻译缺失时回退到英文
 */
const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: "en",
  messages: { en, "zh-CN": zhCN },
});

/**
 * Composition API 模式下 i18n.global.locale 实际是 Ref<string>，
 * 但 vue-i18n 类型定义为联合类型，此处做一次类型窄化以便直接 .value 读写。
 */
const localeRef = i18n.global.locale as unknown as Ref<string>;

/**
 * 切换当前语言。
 * 同时更新 vue-i18n locale、localStorage 持久化、<html lang> 属性。
 *
 * @param locale 目标语言（"en" 或 "zh-CN"）
 */
export function setLocale(locale: "en" | "zh-CN") {
  localeRef.value = locale;
  localStorage.setItem("locale", locale);
  document.documentElement.setAttribute("lang", locale === "zh-CN" ? "zh" : "en");
}

/**
 * 获取当前语言对应的 Accept-Language 请求头值。
 * 由 Axios 请求拦截器调用，告知后端返回对应语言的消息。
 */
export function getAcceptLanguage(): string {
  return localeRef.value === "zh-CN" ? "zh-CN,zh;q=0.9,en;q=0.8" : "en-US,en;q=0.9";
}

export default i18n;
