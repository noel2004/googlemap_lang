# Asset provenance

The icon was generated with the built-in image generation tool, then exported
at the Chrome icon sizes. The original output is preserved at
`store/artwork/icon-master.png`. The 128px icon has a 96px artwork area with
16px transparent padding, following Chrome's store guidance. Smaller toolbar
exports use their available canvas for legibility.

## Generation prompt

Use case: logo-brand. Asset type: Chrome extension icon, square 1024 by 1024
pixels. Primary request: a single uppercase cursive letter "L", bold and elegant,
in flat terracotta #C58D6F, with a clean strong black #000000 outline/trimming
around the letter. Background is solid pale warm cream #FFF8F3, exactly uniform,
edge to edge. The L should be clearly recognizable at small toolbar sizes: thick
calligraphic strokes, restrained cursive swashes, no hairline details. Center
the L optically with about 18 percent clear space around its outermost edges.
Flat two-dimensional icon, crisp vector-like edges, no gradient, no shadow,
no texture, no bevel, no rounded tile outline. Only one letter "L", no other
text, no other symbols, no branding or watermark. Output a single finished
icon, not a mockup or sheet.

The generator returned a 1254px square raster. Generated pixels approximate the
requested palette; the promotional layout uses exact #FFF8F3 and #C58D6F CSS colors.

## Store graphics

The small promotional tile is a browser-rendered layout using the generated
icon. Screenshots are captured from the actual extension HTML/CSS and controls.
The menu captures embed the actual popup in a branded presentation and use a Maps
test tab solely to enable the real language controls; no fabricated Google Maps
content is shown. The settings screenshot is a direct viewport capture at 80% zoom.
No Google logos, Maps imagery, or personal Maps history is included.

Regenerate the assets using `scripts/capture-store.mjs` with CHROME_BIN set to an
extension-capable Chromium executable. Screenshots use the English interface.
