// Google Maps language catalogue. See README for the source and update policy.
// Keep URL codes separate from Intl's canonical display-name codes (e.g. iw/he).
export const LANGUAGE_CODES = Object.freeze([
  'af', 'sq', 'am', 'ar', 'hy', 'az', 'eu', 'be', 'bn', 'bs', 'bg', 'my',
  'ca', 'zh', 'zh-CN', 'zh-HK', 'zh-TW', 'hr', 'cs', 'da', 'nl', 'en',
  'en-AU', 'en-GB', 'et', 'fa', 'fi', 'fil', 'fr', 'fr-CA', 'gl', 'ka',
  'de', 'el', 'gu', 'iw', 'hi', 'hu', 'is', 'id', 'it', 'ja', 'kn', 'kk',
  'km', 'ko', 'ky', 'lo', 'lv', 'lt', 'mk', 'ms', 'ml', 'mr', 'mn', 'ne',
  'no', 'pl', 'pt', 'pt-BR', 'pt-PT', 'pa', 'ro', 'ru', 'sr', 'sr-Latn',
  'si', 'sk', 'sl', 'es', 'es-419', 'sw', 'sv', 'ta', 'te', 'th', 'tr',
  'uk', 'ur', 'uz', 'vi', 'zu',
]);

export const DEFAULT_LANGUAGE = 'ja';
export const DEFAULT_SHORTCUTS = Object.freeze(['en', 'ja', 'zh-TW', 'ko', 'es', 'vi']);
export const isLanguage = code => LANGUAGE_CODES.includes(code);

export function normalizeSettings(value = {}) {
  const shortcuts = Array.isArray(value.shortcuts)
    ? [...new Set(value.shortcuts.filter(isLanguage))].slice(0, 6)
    : [...DEFAULT_SHORTCUTS];
  return {
    defaultLanguage: isLanguage(value.defaultLanguage) ? value.defaultLanguage : DEFAULT_LANGUAGE,
    shortcuts,
  };
}

export function validateSettings(value) {
  if (!value || !isLanguage(value.defaultLanguage) || !Array.isArray(value.shortcuts)
      || value.shortcuts.length > 6 || !value.shortcuts.every(isLanguage)
      || new Set(value.shortcuts).size !== value.shortcuts.length) {
    throw new Error('invalidSettings');
  }
  return { defaultLanguage: value.defaultLanguage, shortcuts: [...value.shortcuts] };
}
