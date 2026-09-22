# Google Maps in Japanese

A small local Chrome extension that adds `hl=ja` to Google Maps page URLs,
or replaces another `hl` value with `ja`. Chrome's language preferences stay
unchanged. No build step, dependencies, account, or API key is required.

## Install

1. Open `chrome://extensions` in Chrome.
2. Turn on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select this folder:
   `/home/combray/Code/my_projects/gmap_lang`.
4. Open `https://www.google.com/maps` in a new tab. The URL should include
   `hl=ja` and Maps should display in Japanese.

Keep this folder in place. The extension stays installed across Chrome restarts.
Reload any Maps tabs that were already open when you installed it.

## Behavior

- Applies only to `https://www.google.com/maps`, its query parameters, and
  paths beneath `/maps/` (such as place, search, and directions pages).
- Preserves the URL's place, directions, search parameters, and fragment while
  setting `hl=ja`.
- Applies to top-level GET page requests only. Google Search, other websites,
  embedded map frames, and background requests are unaffected.
- URLs already using `hl=ja` need no redirect: Chrome skips a redirect when its
  destination is identical to the requested URL.
- Runs automatically whenever a supported Maps page is loaded. There is no
  toolbar action or settings screen.
- Requests Japanese even if a link explicitly asks for another language. To use
  another language temporarily, disable this extension in `chrome://extensions`
  and then change Maps' language.

Short sharing links and other Google domains are handled if they redirect to
`https://www.google.com/maps`. URLs that stay on other domains are unaffected.
The extension does not monitor
URL changes made inside an already-loaded page without a new page request;
reload the page if its language changes during a session. Japanese mode does
not guarantee translations of every business name or user-written review.

## Permissions and privacy

The extension contains only a manifest and a static redirect ruleset. It has no
scripts, analytics, storage, or external service. Chrome applies the rules.

`declarativeNetRequestWithHostAccess` and the single `https://www.google.com/*`
host permission allow Chrome to rewrite matching Maps requests. Chrome grants
host access at the origin level; the actual rule is restricted to `/maps` and
`/maps/` paths. Allow access to this site for automatic redirects to work. Incognito requires
enabling **Allow in Incognito** in the extension's details separately.

## Check after installation

1. Open `https://www.google.com/maps` and verify that it loads with `hl=ja`.
2. Open `https://www.google.com/maps?hl=en` and verify that `en` becomes `ja`.
3. Open `https://www.google.com/maps/search/?api=1&query=Tokyo+Station&hl=en`.
   Verify that the search is preserved and the page is in Japanese.
4. Reload a page already using `hl=ja`; it should load normally without a loop.
5. Open `https://www.google.com/search?q=Tokyo` and verify that its URL is unchanged
   by the extension.
6. Restart Chrome and open Maps again to check that the extension remains active.

After editing either JSON file, click **Reload** on the extension's card at
`chrome://extensions`, then reload Maps. To uninstall, click **Remove** there.

## Implementation references

- [Chrome declarative request rules](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- [Loading a local extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked)
