import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import { DEFAULT_SHORTCUTS, LANGUAGE_CODES, normalizeSettings, validateSettings } from '../languages.js';
import { isMapsUrl, languageRules, withLanguage } from '../redirects.js';

test('settings validate defaults, empty shortcuts, order and invalid input', () => {
  assert.deepEqual(normalizeSettings(), { defaultLanguage: 'ja', shortcuts: [...DEFAULT_SHORTCUTS] });
  assert.deepEqual(normalizeSettings({ defaultLanguage: 'bad', shortcuts: ['vi', 'vi', 'bad', 'en'] }), { defaultLanguage: 'ja', shortcuts: ['vi', 'en'] });
  assert.deepEqual(validateSettings({ defaultLanguage: 'zh-TW', shortcuts: [] }).shortcuts, []);
  for (const value of [null, {}, { defaultLanguage: 'x', shortcuts: [] },
    { defaultLanguage: 'ja', shortcuts: ['en', 'en'] },
    { defaultLanguage: 'ja', shortcuts: [...DEFAULT_SHORTCUTS, 'fr'] },
    { defaultLanguage: 'ja', shortcuts: ['fake'] }]) assert.throws(() => validateSettings(value));
});

test('scope excludes lookalike domains, unrelated paths and protocols', () => {
  for (const url of ['https://www.google.com/maps', 'https://www.google.com/maps?hl=en', 'https://www.google.com/maps/search/?q=Tokyo', 'https://www.google.com/maps#details']) assert.ok(isMapsUrl(url), url);
  for (const url of ['http://www.google.com/maps', 'https://maps.google.com/', 'https://www.google.co.jp/maps', 'https://www.google.com/mapsfoo', 'https://www.google.com.evil.example/maps', 'https://example.com/?q=https://www.google.com/maps', 'invalid']) assert.equal(isMapsUrl(url), false, url);
});

test('selection preserves place, repeated search values and hash; replaces all hl values', () => {
  const before = new URL('https://www.google.com/maps/search/東京?query=Tokyo+Station&layer=a&layer=b&hl=en&hl=ko#details');
  const after = new URL(withLanguage(before.href, 'zh-TW'));
  assert.equal(after.pathname, before.pathname);
  assert.equal(after.hash, before.hash);
  assert.deepEqual(after.searchParams.getAll('layer'), ['a', 'b']);
  assert.equal(after.searchParams.get('query'), 'Tokyo Station');
  assert.deepEqual(after.searchParams.getAll('hl'), ['zh-TW']);
  assert.equal(withLanguage(after.href, 'zh-TW'), after.href);
});

test('each catalogue language has a higher priority tab allow rule to prevent fallback loops', () => {
  assert.equal(new Set(LANGUAGE_CODES).size, LANGUAGE_CODES.length);
  for (const code of LANGUAGE_CODES) {
    const [redirect, allow] = languageRules(code, { firstId: 100, priority: 10, tabId: 17 });
    assert.ok(allow.priority > redirect.priority);
    assert.deepEqual(redirect.condition.tabIds, [17]);
    const pattern = new RegExp(allow.condition.regexFilter);
    for (const path of ['/maps', '/maps/', '/maps/search/']) {
      assert.ok(pattern.test(`https://www.google.com${path}?hl=${code}`));
      assert.ok(pattern.test(`https://www.google.com${path}?hl=${code}#details`));
      assert.ok(pattern.test(`https://www.google.com${path}?q=Tokyo&hl=${code}&a=1`));
      assert.equal(pattern.test(`https://www.google.com${path}?hl=${code}-invalid`), false);
      assert.equal(pattern.test(`https://www.google.com${path}?q=hl=${code}`), false);
    }
  }
});

test('all interface locales contain the same complete messages and substitutions', () => {
  const base = new URL('../_locales/', import.meta.url);
  const en = JSON.parse(readFileSync(new URL('en/messages.json', base)));
  const names = readdirSync(base).sort();
  assert.deepEqual(names, ['en', 'es', 'ja', 'ko', 'vi', 'zh_TW']);
  for (const name of names) {
    const messages = JSON.parse(readFileSync(new URL(`${name}/messages.json`, base)));
    assert.deepEqual(Object.keys(messages).sort(), Object.keys(en).sort());
    for (const [key, { message }] of Object.entries(messages)) {
      assert.ok(message.trim(), `${name}: ${key}`);
      assert.deepEqual(message.match(/\$\d+/g), en[key].message.match(/\$\d+/g), `${name}: ${key}`);
    }
  }
  for (const file of ['popup.html', 'options.html']) {
    const html = readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
    for (const match of html.matchAll(/data-i18n(?:-placeholder)?="([^"]+)"/g)) assert.ok(en[match[1]], match[1]);
  }
});

test('store metadata, privacy links, translations and icon exports are complete', () => {
  const root = new URL('../', import.meta.url);
  const manifest = JSON.parse(readFileSync(new URL('manifest.json', root)));
  assert.equal(manifest.author, 'Stringon Inc.');
  assert.equal(manifest.version, JSON.parse(readFileSync(new URL('package.json', root))).version);
  assert.equal(manifest.default_locale, 'en');
  for (const locale of readdirSync(new URL('_locales/', root))) {
    const messages = JSON.parse(readFileSync(new URL(`_locales/${locale}/messages.json`, root)));
    assert.equal(messages.extensionName.message, 'Your lang for google map');
    assert.ok(messages.extensionDescription.message.length <= 132);
    assert.ok(messages.privacyPolicy.message && messages.support.message);
  }
  for (const [size, path] of Object.entries(manifest.icons)) {
    const image = readFileSync(new URL(path, root));
    assert.equal(image.toString('hex', 0, 8), '89504e470d0a1a0a');
    assert.equal(image.readUInt32BE(16), Number(size));
    assert.equal(image.readUInt32BE(20), Number(size));
  }
  const policy = readFileSync(new URL('privacy.html', root), 'utf8');
  assert.ok(policy.includes('support@stringon.co.jp'));
  assert.ok(policy.includes('Limited Use'));
  const options = readFileSync(new URL('options.html', root), 'utf8');
  assert.ok(options.includes('href="privacy.html"'));
  assert.ok(options.includes('mailto:support@stringon.co.jp'));
  assert.equal(readFileSync(new URL('LICENSE', root), 'utf8').includes('Copyright (c)'), false);
});
