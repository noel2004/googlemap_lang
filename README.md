# Your lang for google map

A Chrome extension published by **Stringon Inc.** for choosing Google Maps' language without changing
Chrome's display language. It applies only to `https://www.google.com/maps` and
paths beneath `/maps/`. Japanese is the initial default.

Support: [support@stringon.co.jp](mailto:support@stringon.co.jp).

Independent extension; not affiliated with or endorsed by Google.
See the [public privacy policy](https://noel2004.github.io/googlemap_lang/privacy.html)
for details of local URL processing and settings storage.
Product homepage: https://noel2004.github.io/googlemap_lang/.

## Install or update

1. Download and extract the extension ZIP to a permanent folder, or use this
   repository's folder directly. No build step or dependency installation is needed. These are developer/testing instructions; store users install through the Chrome Web Store once the listing is published.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the folder containing `manifest.json`.
4. Pin **Your lang for google map** through Chrome's extensions menu (the puzzle icon).
5. Open Google Maps and click the extension's toolbar icon.

On Windows, use **Extract All** before loading the folder. Keep that folder in
place: Chrome reads the extension from it. When updating an existing installation,
replace its files and click **Reload** on its card at `chrome://extensions`.
Reload any open Maps tabs. Chrome 96 or newer is required.

## Language menu

The first menu lists up to six shortcuts, initially in this order:

1. English
2. Japanese
3. Traditional Chinese
4. Korean
5. Spanish
6. Vietnamese

**More** opens the full language catalogue, with search by translated name,
native name, or language code. **Back** (or Escape) returns to the shortcuts.
Selecting a language immediately reloads the active Maps tab in that language,
preserving its location, directions, search parameters, and fragment.

**Persistent** is unchecked each time you open the menu:

- **Unchecked:** the choice applies only to the current tab. It survives reloads,
  navigation in that tab, and background-worker suspension. Closing the tab,
  restarting Chrome, or reloading/updating the extension clears it. New tabs use
  the saved default. **Use default** clears the current tab's temporary choice.
- **Checked:** the next language you select becomes the saved default and is
  applied to the current tab. The choice survives Chrome restarts. Other open
  tabs use it on their next page load, unless they have their own temporary choice.
  Checking the box alone does not save anything.

When the active tab is not Google Maps, language choices are disabled. You can
still open Maps or access settings.

## Settings and interface language

Click **Settings** in the menu to choose the default Maps language and up to six
ordered shortcuts. Select **None** for unused slots; even zero shortcuts is valid.
Duplicate shortcuts are prevented. Click **Save settings** to apply changes.
Changing the default does not discard other tabs' temporary selections.

The menu and settings follow **Chrome's display language**, independently of the
language selected for Maps. English, Japanese, Traditional Chinese, Korean,
Spanish, and Vietnamese interfaces are included, with English as the fallback.
Language names are localized using Chrome's built-in `Intl.DisplayNames` data.

The full catalogue currently contains the 82 language codes in Google's
[published Maps language list](https://developers.google.com/maps/faq#languagesupport),
including regional variants. Google controls which text and language variants
are available on the Maps website; some variants may fall back to a broader
language. To update the catalogue, edit `languages.js`.

## Scope and privacy

The extension adds or replaces the URL's `hl` parameter on top-level GET requests
to `https://www.google.com/maps` and its subpaths. Google Search, other domains,
embedded map frames, and background requests are unaffected. Sharing links are
handled if they redirect to this Maps address. It does not monitor URL changes
made inside an already-loaded page without a new request; reload if necessary.
Google may leave business names or user-written reviews in their original language.

Permissions:

- `declarativeNetRequestWithHostAccess`: apply language redirect rules.
- `https://www.google.com/*`: Chrome grants host access at the origin level;
  the actual rules are restricted to Maps paths.
- `storage`: keep the default language and shortcuts locally in this Chrome
  profile. Preferences are not synchronized to other devices.

There are no analytics, external services, API keys, content scripts, or access
to browsing history. The extension uses its existing Google host permission to
read the current Maps URL; a broad `tabs` permission is not required. Incognito
access must be enabled separately in Chrome's extension details.

## Development and verification

The extension uses native JavaScript modules, HTML, CSS, and Chrome APIs. The
background worker maintains persistent default rules and higher-priority,
tab-specific session rules. Explicit allow rules prevent the default language
from overriding an already-applied temporary choice. Only extension pages can
send settings commands, and all settings mutations are validated and serialized.

Run the unit and locale-completeness tests with Node.js 22 or newer:

```sh
npm test
```

Run actual browser integration tests with an extension-capable Chromium or
Chrome for Testing executable:

```sh
CHROME_BIN=/path/to/chrome npm run test:browser
```

The browser tests use isolated temporary profiles and mocked Maps responses.
They cover the actual popup and settings, tab isolation, persistence, worker and
browser restarts, and every interface locale plus English fallback. On restricted
Linux test containers that require it, set `CHROME_NO_SANDBOX=1`. This is a test
runner option, not an installation requirement. Live Maps content and Windows
installation still require manual testing.

Build a ZIP with Python 3 (no third-party packages required):

```sh
python3 scripts/build.py
```

The ZIP and SHA-256 checksum are written to `dist/`. Packages contain only the
extension files, translations, README, and license. Test files, browser caches,
and signing keys are excluded.

## Chrome Web Store submission

See [store/SUBMISSION.md](store/SUBMISSION.md) for listing text, permission
justifications, privacy disclosures, artwork, and the remaining dashboard steps.
The submission ZIP and artwork bundle are built by `python3 scripts/build.py`.

GitHub Pages serves the product homepage and privacy policy from `main:/docs`.
Keep `docs/privacy.html` identical to the bundled `privacy.html` when updating
the policy. Pushing changes in `docs/` to `main` redeploys the public site.

Chrome API references:
[request rules](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest),
[internationalization](https://developer.chrome.com/docs/extensions/reference/api/i18n),
[local storage](https://developer.chrome.com/docs/extensions/reference/api/storage).
