# Submission handoff

Prepared for **Stringon Inc.**, with verified contact email
**support@stringon.co.jp**, for **Your lang for google map** version **1.1.0**.

## Files to upload

Run `python3 scripts/build.py` from the repository root.

| Dashboard item | File |
| --- | --- |
| Extension package | `dist/your-lang-for-google-map-1.1.0.zip` |
| Store icon | `icons/icon128.png` |
| Small promotional tile | `store/artwork/promo-440x280.png` |
| Screenshot: settings | `store/artwork/screenshot-settings-1280x800.png` |
| Screenshot: language menu | `store/artwork/screenshot-menu-1280x800.png` |
| Screenshot: all languages | `store/artwork/screenshot-languages-1280x800.png` |
| Listing copy | `store/LISTING.md` |
| Public privacy policy URL | `https://noel2004.github.io/googlemap_lang/privacy.html` |

The build also creates `dist/your-lang-for-google-map-submission-1.1.0.zip`,
containing the extension ZIP, artwork, privacy page, and these instructions.
Extract that handoff archive first: upload the **inner extension ZIP** to the
Web Store, and upload artwork separately in the listing fields.

## Publisher and public links

- Set the dashboard publisher name to **Stringon Inc.**. The manifest's author
  field is supplementary metadata and does not configure the publisher account.
- Use **support@stringon.co.jp** as the verified contact email.
- The current non-trader declaration is an account setting and has not been changed.
  The account owner is responsible for keeping that declaration accurate.
- Enter `https://noel2004.github.io/googlemap_lang/privacy.html` in the dashboard's
  Privacy policy URL field. The policy is published through GitHub Pages.
- Homepage: `https://noel2004.github.io/googlemap_lang/`.
- The extension itself includes an offline privacy-policy link in Settings and
  a support email link. No store item ID or final listing URL is available yet.

## Single purpose — paste into Privacy practices

Allow users to choose and remember the display language used by Google Maps,
either temporarily for one tab or as a saved default, without changing Chrome's
display language.

## Permission justifications — paste into Privacy practices

### declarativeNetRequestWithHostAccess

Used to apply the selected language to Google Maps page requests by adding or
replacing the hl URL parameter. Persistent rules apply the saved default;
tab-specific session rules apply temporary choices. Rules are restricted to
top-level GET requests at https://www.google.com/maps and its subpaths. The
extension does not block advertising or modify unrelated website content.

### storage

Used to save the user's default Maps language and up to six ordered menu shortcuts
in Chrome's local extension storage. These preferences are not sent to Stringon
Inc. or synchronized to another device. Maps URLs are not stored.

### https://www.google.com/* host access

Required for automatic language redirects and to identify and update the current
Maps tab's URL when the user selects a language. Chrome grants host access at
the origin level; the extension restricts its redirect rules and URL updates to
the /maps path and its subpaths. No other domains, embedded frames, or background
requests are modified.

## Remote code

Select **No**. All JavaScript, styles, language data, and images are bundled in
the extension. No remotely hosted executable code or external runtime library
is loaded. Links to support, the homepage, and Google's privacy policy do not
load code into the extension.

## Data-use disclosures

Google's policy covers data handled locally, including URLs. Do not claim that
the extension never accesses user data simply because there is no server.

- Disclose **Web history / browsing activity** for local processing of current
  Maps URLs and tab identifiers. Describe this as transient processing for the
  language-selection feature; no browsing-history log is stored or sent to
  Stringon Inc. The extension does not use the Chrome history API.
- There is no automatic collection of personally identifiable, health, financial,
  authentication, communication, page-content, or interaction-tracking data.
- No geolocation permission or independent location lookup is used. A Maps URL
  may contain user-selected addresses or coordinates; that local URL processing
  is explicitly covered by the privacy policy and listing. Answer any more
  specific dashboard questions according to their wording.
- Voluntary support email is handled separately from the extension, as described
  in the policy.
- Confirm the Limited Use certifications: information is used only for the
  disclosed language-selection purpose, not sold, not used for unrelated
  purposes, and not used for creditworthiness or lending decisions.

The linked privacy policy explains ordinary Maps navigation to Google, local
retention, user controls, and optional support correspondence.

## Reviewer instructions

No account, payment, API key, or sign-in is required.

1. Install the extension and open https://www.google.com/maps?hl=en.
2. Japanese is the initial default; the URL should use hl=ja.
3. Open the toolbar menu. It should show the six initial shortcuts and More.
4. Leave Persistent unchecked and choose English. This tab should use hl=en;
   another Maps tab should still use the Japanese default.
5. Check Persistent and choose another language. New Maps visits should use that
   default, and it should survive a browser restart.
6. Open More and search for another language by name or code.
7. Open Settings, change the default and shortcuts, save, and reopen the menu.
8. Verify that the Privacy policy and Support links are available in Settings.

The UI follows Chrome's display language rather than the selected Maps language.
The requested language does not guarantee translation of every place name or review.

## Final dashboard steps

1. Upload the extension ZIP, listing text, icon, promo tile, and screenshots.
2. Enter the public privacy URL and complete the disclosures above.
3. Confirm publisher/contact details and distribution settings.
4. Run a final check in Windows Chrome using the actual Maps website.
5. Submit for review when ready. This project preparation does not submit,
   publish, or change the Chrome Web Store account.

The extension's version is 1.1.0. If that version was already uploaded, increase
both `manifest.json` and `package.json` to the next version before rebuilding.
Future Web Store uploads must use increasing version numbers.

## Updating the public policy

GitHub Pages publishes the `/docs` directory from the repository's `main` branch.
The extension bundles `privacy.html`; the public copy is `docs/privacy.html`.
When the policy changes, update both copies and push `docs/privacy.html` to
`main`. GitHub automatically deploys the updated public page. Rebuild the
extension to include the same revised policy in the next extension release.

## References

- [Prepare the extension](https://developer.chrome.com/docs/webstore/prepare)
- [Store image requirements](https://developer.chrome.com/docs/webstore/images)
- [Local-only data disclosure](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Limited Use policy](https://developer.chrome.com/docs/webstore/program-policies/limited-use)
- [Publisher setup](https://developer.chrome.com/docs/webstore/set-up-account)
- [Trader declaration](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq)
