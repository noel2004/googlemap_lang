import { LANGUAGE_CODES } from './languages.js';

export const t = (key, substitutions) => chrome.i18n.getMessage(key, substitutions);
export const uiLocale = t('uiLocale') || 'en';
const displayNames = new Intl.DisplayNames([uiLocale], { type: 'language' });
const displayCode = code => ({ iw: 'he', 'zh-CN': 'zh-Hans', 'zh-TW': 'zh-Hant' }[code] || code);

export const languageName = code => displayNames.of(displayCode(code)) || code;
export const nativeName = code => new Intl.DisplayNames([displayCode(code)], { type: 'language' }).of(displayCode(code)) || code;
export const sortedLanguages = () => [...LANGUAGE_CODES].sort((a, b) => languageName(a).localeCompare(languageName(b), uiLocale));

export function localize() {
  document.documentElement.lang = uiLocale;
  document.title = t(document.body.dataset.title || 'extensionName');
  for (const node of document.querySelectorAll('[data-i18n]')) node.textContent = t(node.dataset.i18n);
  for (const node of document.querySelectorAll('[data-i18n-placeholder]')) node.placeholder = t(node.dataset.i18nPlaceholder);
}

export async function send(message) {
  const result = await chrome.runtime.sendMessage(message);
  if (!result?.ok) throw new Error(result?.error || 'requestFailed');
  return result;
}

export function fillLanguages(select, { empty = false } = {}) {
  if (empty) select.add(new Option(t('none'), ''));
  for (const code of sortedLanguages()) select.add(new Option(languageName(code), code));
}
