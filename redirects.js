import { isLanguage } from './languages.js';

export const MAPS_PATTERN = '^https://www\\.google\\.com/maps([/?]|$)';

export function isMapsUrl(value) {
  try {
    const url = new URL(value);
    return url.origin === 'https://www.google.com'
      && (url.pathname === '/maps' || url.pathname.startsWith('/maps/'));
  } catch {
    return false;
  }
}

export function withLanguage(value, language) {
  if (!isMapsUrl(value) || !isLanguage(language)) throw new Error('invalidSelection');
  const url = new URL(value);
  url.searchParams.set('hl', language);
  return url.href;
}

export function languageRules(language, { firstId = 1, priority = 1, tabId } = {}) {
  if (!isLanguage(language)) throw new Error('invalidLanguage');
  const condition = {
    regexFilter: MAPS_PATTERN,
    isUrlFilterCaseSensitive: true,
    resourceTypes: ['main_frame'],
    requestMethods: ['get'],
    ...(tabId === undefined ? {} : { tabIds: [tabId] }),
  };
  return [
    {
      id: firstId,
      priority,
      action: { type: 'redirect', redirect: { transform: {
        queryTransform: { addOrReplaceParams: [{ key: 'hl', value: language }] },
      } } },
      condition,
    },
    {
      // Explicitly allow the desired language so a lower-priority default cannot
      // redirect a tab back after its temporary-language redirect completes.
      id: firstId + 1,
      priority: priority + 1,
      action: { type: 'allow' },
      condition: {
        ...condition,
        regexFilter: `^https://www\\.google\\.com/maps(/[^?#]*)?\\?([^&#]*&)*hl=${language}(&|#|$)`,
      },
    },
  ];
}

export function tabLanguage(rules, tabId) {
  const rule = rules.find(rule => rule.action.type === 'redirect' && rule.condition.tabIds?.includes(tabId));
  return rule?.action.redirect.transform.queryTransform.addOrReplaceParams[0].value;
}
