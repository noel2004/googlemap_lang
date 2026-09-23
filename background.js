import { isLanguage, normalizeSettings, validateSettings } from './languages.js';
import { isMapsUrl, languageRules, tabLanguage, withLanguage } from './redirects.js';

const dnr = chrome.declarativeNetRequest;
const readSettings = async () => normalizeSettings((await chrome.storage.local.get('settings')).settings);

async function installDefault(language) {
  const rules = await dnr.getDynamicRules();
  await dnr.updateDynamicRules({ removeRuleIds: rules.map(rule => rule.id), addRules: languageRules(language) });
}

async function initialize() {
  const settings = await readSettings();
  await installDefault(settings.defaultLanguage);
  await chrome.storage.local.set({ settings });
  // Session rules survive worker suspension. Only discard rules for closed tabs.
  const tabs = new Set((await chrome.tabs.query({})).map(tab => tab.id));
  const stale = (await dnr.getSessionRules()).filter(rule => !tabs.has(rule.condition.tabIds?.[0]));
  if (stale.length) await dnr.updateSessionRules({ removeRuleIds: stale.map(rule => rule.id) });
}

// Serialize settings and tab-rule mutations so rapid selections cannot race.
let queue = initialize();
function enqueue(work) {
  const result = queue.then(work);
  queue = result.catch(error => console.error(error));
  return result;
}
// Attach a rejection handler even if no UI is open when initialization fails.
queue = queue.catch(error => console.error(error));

async function saveSettings(value) {
  const settings = validateSettings(value);
  const previous = await readSettings();
  await installDefault(settings.defaultLanguage);
  try {
    await chrome.storage.local.set({ settings });
  } catch (error) {
    await installDefault(previous.defaultLanguage);
    throw error;
  }
  return settings;
}

async function clearTab(tabId) {
  const rules = (await dnr.getSessionRules()).filter(rule => rule.condition.tabIds?.includes(tabId));
  if (rules.length) await dnr.updateSessionRules({ removeRuleIds: rules.map(rule => rule.id) });
}

async function setTabLanguage(tabId, language) {
  const rules = await dnr.getSessionRules();
  const old = rules.filter(rule => rule.condition.tabIds?.includes(tabId));
  const firstId = old.length ? Math.min(...old.map(rule => rule.id))
    : Math.max(99, ...rules.map(rule => rule.id)) + 1;
  await dnr.updateSessionRules({
    removeRuleIds: old.map(rule => rule.id),
    addRules: languageRules(language, { firstId, priority: 10, tabId }),
  });
}

async function getState(tabId) {
  const settings = await readSettings();
  let tab;
  if (Number.isInteger(tabId) && tabId >= 0) {
    try { tab = await chrome.tabs.get(tabId); } catch { /* Tab was closed. */ }
  }
  const temporaryLanguage = tabLanguage(await dnr.getSessionRules(), tabId);
  return {
    settings,
    canApply: isMapsUrl(tab?.pendingUrl || tab?.url),
    language: temporaryLanguage || settings.defaultLanguage,
    temporary: Boolean(temporaryLanguage),
  };
}

async function handle(message) {
  switch (message.type) {
    case 'getState': return getState(message.tabId);
    case 'saveSettings': return { settings: await saveSettings(message.settings) };
    case 'selectLanguage': {
      if (!isLanguage(message.language) || typeof message.persistent !== 'boolean'
          || !Number.isInteger(message.tabId) || message.tabId < 0) throw new Error('invalidSelection');
      const tab = await chrome.tabs.get(message.tabId);
      if (!isMapsUrl(tab.pendingUrl || tab.url)) throw new Error('notMaps');
      if (message.persistent) {
        await saveSettings({ ...await readSettings(), defaultLanguage: message.language });
        await clearTab(tab.id);
      } else {
        await setTabLanguage(tab.id, message.language);
      }
      // Re-read in case the user navigated while rules were being updated.
      const current = await chrome.tabs.get(tab.id);
      const url = current.pendingUrl || current.url;
      if (isMapsUrl(url)) {
        const next = withLanguage(url, message.language);
        if (next !== url) await chrome.tabs.update(tab.id, { url: next });
      }
      return getState(tab.id);
    }
    case 'useDefault': {
      if (!Number.isInteger(message.tabId) || message.tabId < 0) throw new Error('invalidSelection');
      await clearTab(message.tabId);
      const tab = await chrome.tabs.get(message.tabId);
      const url = tab.pendingUrl || tab.url;
      if (isMapsUrl(url)) {
        const { defaultLanguage } = await readSettings();
        const next = withLanguage(url, defaultLanguage);
        if (next !== url) await chrome.tabs.update(tab.id, { url: next });
      }
      return getState(tab.id);
    }
    default: throw new Error('unknownMessage');
  }
}

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  // Accept commands only from this extension's own pages.
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(''))) return;
  enqueue(() => handle(message)).then(
    data => respond({ ok: true, ...data }),
    error => respond({ ok: false, error: error.message }),
  );
  return true;
});
chrome.tabs.onRemoved.addListener(tabId => { void enqueue(() => clearTab(tabId)); });
chrome.runtime.onInstalled.addListener(() => { void enqueue(initialize); });
chrome.runtime.onStartup.addListener(() => { void enqueue(initialize); });
