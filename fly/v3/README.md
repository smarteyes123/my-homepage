# Smart Eyes Property Studio v3

Entry: `fly/flyer-maker-v3.html`. This is a separate sales-property editor; the existing rental pages remain available.

## Use

1. Enter the name, layout and area; expand the optional building, management and company sections as needed.
2. Upload JPG, PNG or WebP images. Assign the floorplan and exterior roles, add captions, and optionally choose a primary photograph. Disable photos that should be excluded.
3. Generate four compositions. Photo selection uses role, caption, aspect ratio and the primary-photo preference. It does not inspect image content with a vision model.
4. Choose a composition and click a photograph to replace it or adjust fit, position and zoom. Floorplans always use containment. The optional white-border trim works on a reversible copy.
5. Print the selected composition: A4 landscape, 100%, no browser headers/footers, background graphics enabled. Content overflow or changes made since generation block export until corrected or regenerated.
6. Save a JSON draft to retain data, compressed images, selected composition and crop settings. Reopen it later in the same editor.

The page processes images locally with no upload endpoint or third-party script. Drafts include the images and should be stored with the property materials. Images are normalized to a maximum 2200-pixel edge; accepted uploads are limited to 20 MB each. Draft imports are limited to 100 MB.

For investment properties, gross yield = annual rent / (price in万円 × 10,000). Blank expense fields remain unknown; a partial monthly total is labelled as the total of recorded costs. Price/tax status, area measurement method and source date can be marked as unconfirmed.

## Verification

Run `node --test tests/flyer-v3.test.cjs` and `node --check fly/v3/studio.js`.

Browser QA covers generation, selection, crop isolation, floorplan controls, draft download/reimport, and stale-data export prevention. Local property fixture `fly/v3-demo/` is ignored; `?demo=1` loads it only where that private fixture exists. Actual property images and generated PDFs are not part of the repository.

A local QA run with a real property confirmed four single-page A4 landscape PDFs and a four-page comparison PDF, then rasterized and inspected every composition. Source floorplan resolution limits output detail; use the original high-resolution plan when available.
