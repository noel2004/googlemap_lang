import { writeFileSync } from 'node:fs';
import { extensionId, launch, until } from '../tests/chrome.mjs';

// Capture real extension views in an isolated profile, without personal Maps data.
const browser = await launch({ locale: 'en' });
const base = `chrome-extension://${extensionId}/`;
const output = new URL('../store/artwork/', import.meta.url);
async function capture(page, filename, width, height) {
  await page.command('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await until(() => page.evaluate('document.fonts.status === "loaded" && [...document.images].every(image => image.complete && image.naturalWidth > 0)'));
  const { data } = await page.command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  writeFileSync(new URL(filename, output), Buffer.from(data, 'base64'));
  console.log(filename);
}

try {
  const settings = await browser.page();
  await settings.navigate(`${base}options.html`);
  await until(() => settings.evaluate('!document.getElementById("settings-fields").disabled'));
  // Equivalent to viewing the settings page at 80% browser zoom.
  await settings.evaluate('document.documentElement.style.zoom = "0.8"');
  await capture(settings, 'screenshot-settings-1280x800.png', 1280, 800);

  const maps = await browser.page();
  await maps.mock();
  await maps.navigate('https://www.google.com/maps');
  const tabs = await settings.evaluate('chrome.tabs.query({})');
  const tabId = tabs.find(tab => tab.url?.startsWith('https://www.google.com/maps')).id;
  await settings.evaluate(`chrome.tabs.update(${tabId}, { active: true })`);

  for (const mode of ['menu', 'more', 'promo']) {
    const url = `${base}store/artwork-layout.html?mode=${mode}`;
    await settings.evaluate(`chrome.tabs.create({ url: ${JSON.stringify(url)}, active: false })`);
    const { targetInfos } = await browser.call('Target.getTargets');
    const page = await browser.page(targetInfos.find(target => target.url === url).targetId);
    await until(() => page.evaluate('document.getElementById("menu")?.contentDocument?.querySelectorAll("#shortcuts button").length === 6'));
    if (mode !== 'promo') {
      const disabled = await page.evaluate('document.getElementById("menu").contentDocument.querySelector("#shortcuts button").disabled');
      if (disabled) throw new Error('The screenshot must show an enabled, working menu.');
    }
    if (mode === 'more') await page.evaluate('document.getElementById("menu").contentDocument.getElementById("more").click()');
    const filename = mode === 'promo' ? 'promo-440x280.png' : `screenshot-${mode === 'more' ? 'languages' : 'menu'}-1280x800.png`;
    await capture(page, filename, mode === 'promo' ? 440 : 1280, mode === 'promo' ? 280 : 800);
  }
} finally {
  await browser.close();
}
