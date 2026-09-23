import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { extensionId, launch, until } from './chrome.mjs';

const base = `chrome-extension://${extensionId}/`;
let browser;
let checks = 0;
const pass = label => { checks++; console.log(`PASS ${label}`); };
const stateMessage = (type, fields = {}) => JSON.stringify({ type, ...fields });

async function controlPage() {
  const control = await browser.page();
  await control.navigate(`${base}options.html`);
  await until(() => control.evaluate('!document.getElementById("settings-fields").disabled'));
  return control;
}

async function screenshot(page, filename) {
  const { data } = await page.command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  writeFileSync(filename, Buffer.from(data, 'base64'));
}

try {
  browser = await launch();
  let control = await controlPage();
  const send = (type, fields) => control.evaluate(`chrome.runtime.sendMessage(${stateMessage(type, fields)})`);
  assert.equal((await send('getState')).settings.defaultLanguage, 'ja');
  pass('fresh installation defaults to Japanese');

  const mapsA = await browser.page();
  const mapsB = await browser.page();
  await mapsA.mock(); await mapsB.mock();
  await mapsA.navigate('https://www.google.com/maps/search/?q=alpha&hl=ko#place');
  await mapsB.navigate('https://www.google.com/maps?q=beta');
  await until(() => mapsA.evaluate('location.search.includes("hl=ja")'));
  await until(() => mapsB.evaluate('location.search.includes("hl=ja")'));
  const tabs = await control.evaluate('chrome.tabs.query({})');
  const tabA = tabs.find(tab => tab.url?.includes('q=alpha')).id;
  const tabB = tabs.find(tab => tab.url?.includes('q=beta')).id;
  pass('default redirects both Maps tabs');

  // Open the actual popup document in an inactive tab while Maps is active.
  await control.evaluate(`chrome.tabs.update(${tabA}, {active: true})`);
  await control.evaluate(`chrome.tabs.create({url: ${JSON.stringify(`${base}popup.html`)}, active: false})`);
  const targets = await browser.call('Target.getTargets');
  const popup = await browser.page(targets.targetInfos.find(target => target.url === `${base}popup.html`).targetId);
  await until(() => popup.evaluate('document.querySelectorAll("#shortcuts button").length === 6'));
  assert.deepEqual(await popup.evaluate('[...document.querySelectorAll("#shortcuts button")].map(node => node.dataset.language)'), ['en', 'ja', 'zh-TW', 'ko', 'es', 'vi']);
  assert.equal(await popup.evaluate('document.getElementById("persistent").checked'), false);
  await popup.command('Emulation.setDeviceMetricsOverride', { width: 360, height: 600, deviceScaleFactor: 1, mobile: false });
  assert.ok(await popup.evaluate('document.querySelector("footer").getBoundingClientRect().bottom <= 600'));
  await screenshot(popup, '/tmp/maps-language-popup.png');
  pass('popup has the six requested shortcuts and an unchecked Persistent box');

  await popup.evaluate('document.getElementById("more").click()');
  assert.equal(await popup.evaluate('document.getElementById("all-view").hidden'), false);
  assert.equal(await popup.evaluate('document.querySelectorAll("#all-languages button").length'), 82);
  await popup.evaluate('document.getElementById("language-search").value = "한국"; document.getElementById("language-search").dispatchEvent(new Event("input"))');
  assert.deepEqual(await popup.evaluate('[...document.querySelectorAll("#all-languages button")].map(node => node.dataset.language)'), ['ko']);
  await popup.evaluate('document.getElementById("back").click()');
  pass('More opens the full list; native-language search and Back work');

  await popup.evaluate('document.querySelector("#shortcuts [data-language=en]").click()');
  await until(() => mapsA.evaluate('location.search.includes("hl=en")')).catch(async error => {
    console.error('Selection diagnostics:', await popup.evaluate('document.body.innerText'),
      await control.evaluate('chrome.declarativeNetRequest.getSessionRules()'),
      await control.evaluate('chrome.tabs.query({})'));
    throw error;
  });
  await until(() => popup.evaluate('document.getElementById("status").textContent.includes("applied")'));
  assert.equal((await send('getState')).settings.defaultLanguage, 'ja');
  assert.equal(new URL(await mapsB.evaluate('location.href')).searchParams.get('hl'), 'ja');
  await mapsA.navigate('https://www.google.com/maps/search/?q=alpha&hl=ja#place');
  await until(() => mapsA.evaluate('location.search.includes("hl=en")'));
  assert.equal(await mapsA.evaluate('location.hash'), '#place');
  pass('temporary selection changes only its tab and survives reload without a loop');

  await control.command('ServiceWorker.enable');
  await control.command('ServiceWorker.stopAllWorkers');
  assert.equal((await send('getState', { tabId: tabA })).language, 'en');
  assert.equal((await send('getState', { tabId: tabA })).temporary, true);
  pass('temporary choice survives service-worker suspension');

  await popup.evaluate('document.getElementById("persistent").checked = true; document.getElementById("persistent").dispatchEvent(new Event("change")); document.querySelector("#shortcuts [data-language=es]").click()');
  await until(() => mapsA.evaluate('location.search.includes("hl=es")'));
  await until(async () => (await send('getState')).settings.defaultLanguage === 'es');
  assert.equal((await send('getState', { tabId: tabA })).temporary, false);
  await mapsB.navigate('https://www.google.com/maps?q=beta&hl=ja');
  await until(() => mapsB.evaluate('location.search.includes("hl=es")'));
  assert.equal(await popup.evaluate('document.documentElement.lang'), 'en');
  pass('Persistent saves the default, clears this tab override, and does not change UI language');

  await popup.navigate(`${base}popup.html`);
  await until(() => popup.evaluate('document.querySelectorAll("#shortcuts button").length === 6'));
  assert.equal(await popup.evaluate('document.getElementById("persistent").checked'), false);
  pass('reopening the menu resets Persistent to unchecked');

  assert.equal((await send('selectLanguage', { tabId: tabA, language: 'ko', persistent: false })).ok, true);
  await until(() => mapsA.evaluate('location.search.includes("hl=ko")'));
  assert.equal((await send('saveSettings', { settings: { defaultLanguage: 'vi', shortcuts: ['en', 'ja', 'zh-TW', 'ko', 'es', 'vi', 'fr'] } })).ok, false);
  assert.equal((await send('saveSettings', { settings: { defaultLanguage: 'vi', shortcuts: ['en', 'en'] } })).ok, false);
  pass('worker rejects over-six and duplicate shortcuts');

  // Exercise the settings form itself, including an empty slot and ordering.
  await control.navigate(`${base}options.html`);
  await until(() => control.evaluate('!document.getElementById("settings-fields").disabled'));
  assert.equal(await control.evaluate('document.querySelector("#shortcut-1 option[value=ja]").disabled'), true);
  await control.evaluate(`
    document.getElementById('default-language').value = 'vi';
    ['fr', 'en', '', '', '', ''].forEach((value, index) => {
      const select = document.getElementById('shortcut-' + (index + 1));
      select.value = value; select.dispatchEvent(new Event('change'));
    });
    document.getElementById('settings-form').requestSubmit();
  `);
  await until(() => control.evaluate('document.getElementById("status").textContent === "Settings saved."'));
  assert.deepEqual((await send('getState')).settings, { defaultLanguage: 'vi', shortcuts: ['fr', 'en'] });
  assert.equal((await send('getState', { tabId: tabA })).language, 'ko');
  await mapsA.navigate('https://www.google.com/maps?q=alpha&hl=vi');
  await until(() => mapsA.evaluate('location.search.includes("hl=ko")'));
  await screenshot(control, '/tmp/maps-language-settings.png');
  pass('settings save ordered shortcuts and a new default without replacing other tab overrides');

  await send('saveSettings', { settings: { defaultLanguage: 'vi', shortcuts: [] } });
  await until(() => popup.evaluate('document.querySelectorAll("#shortcuts button").length === 0'));
  await popup.evaluate('document.getElementById("more").click()');
  assert.equal(await popup.evaluate('document.querySelectorAll("#all-languages button").length'), 82);
  await send('saveSettings', { settings: { defaultLanguage: 'vi', shortcuts: ['fr', 'en'] } });
  pass('zero shortcuts still leaves the full language menu available');

  assert.equal((await send('useDefault', { tabId: tabA })).ok, true);
  await until(() => mapsA.evaluate('location.search.includes("hl=vi")'));
  assert.equal((await send('getState', { tabId: tabA })).temporary, false);
  pass('Use default removes the tab override and applies the saved language');

  await send('selectLanguage', { tabId: tabB, language: 'en', persistent: false });
  await until(() => mapsB.evaluate('location.search.includes("hl=en")'));
  await control.evaluate(`chrome.tabs.remove(${tabB})`);
  await until(async () => !(await control.evaluate('chrome.declarativeNetRequest.getSessionRules()')).some(rule => rule.condition.tabIds.includes(tabB)));
  pass('closing a tab deletes its temporary rules');

  await mapsA.navigate('https://www.google.com/search?q=alpha');
  const before = await mapsA.evaluate('location.href');
  assert.equal((await send('selectLanguage', { tabId: tabA, language: 'en', persistent: true })).ok, false);
  assert.equal(await mapsA.evaluate('location.href'), before);
  assert.equal((await send('getState')).settings.defaultLanguage, 'vi');
  pass('non-Maps tabs cannot change their URL or the saved default through selection');

  await mapsA.navigate('https://www.google.com/maps?q=alpha');
  await send('selectLanguage', { tabId: tabA, language: 'ja', persistent: false });
  const profile = browser.profile;
  for (const page of [control, mapsA, popup]) assert.deepEqual(page.errors, []);
  await browser.close({ keepProfile: true });
  browser = await launch({ profile });
  control = await controlPage();
  assert.deepEqual((await send('getState')).settings, { defaultLanguage: 'vi', shortcuts: ['fr', 'en'] });
  assert.deepEqual(await control.evaluate('chrome.declarativeNetRequest.getSessionRules()'), []);
  const restored = await browser.page(); await restored.mock();
  await restored.navigate('https://www.google.com/maps?hl=ja');
  await until(() => restored.evaluate('location.search.includes("hl=vi")'));
  pass('browser restart retains saved preferences and clears temporary selections');
  await browser.close(); browser = undefined;

  for (const [locale, expected] of [['en', 'en'], ['ja', 'ja'], ['zh-TW', 'zh-TW'], ['ko', 'ko'], ['es', 'es'], ['vi', 'vi'], ['fr', 'en']]) {
    browser = await launch({ locale });
    control = await controlPage();
    assert.equal(await control.evaluate('document.documentElement.lang'), expected);
    assert.equal(await control.evaluate('document.querySelector("h1").textContent === chrome.i18n.getMessage("settings")'), true);
    assert.equal(await control.evaluate('document.getElementById("default-language").value'), 'ja');
    if (locale === 'ja') await screenshot(control, '/tmp/maps-language-settings-ja.png');
    pass(`Chrome UI locale ${locale} → interface ${expected}, independent of Maps default`);
    await browser.close(); browser = undefined;
  }
  console.log(`${checks} browser scenarios passed. Maps responses were mocked; no live map content was tested.`);
} finally {
  await browser?.close();
}
