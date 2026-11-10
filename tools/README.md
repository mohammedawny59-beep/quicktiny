# QuickTiny build tools

The site is plain HTML/CSS/JS — the committed `.html` files are the source of truth. These scripts generate **new** pages so they share the same head, header, footer, CSP-friendly markup and structured data as the rest of the site. Run them from the repo root with Python 3 (no packages needed, except Pillow + NumPy for `cutout.py`).

| Script | What it does |
| --- | --- |
| `make_page.py` | New English tool page from `compress-image.html`'s header/footer + your `<style>` file and body file. Writes `<slug>.html` with WebApplication + Breadcrumb JSON-LD. |
| `make_ar.py` | New Arabic (RTL) pages from a JSON spec (title, description, alternates, EN/AR switch, FAQ JSON-LD). Uses `templates/footer_ar.html`. Body/style paths in the spec are relative to the spec file. |
| `pair_en.py` | Adds `hreflang` en/ar/x-default and the EN/AR switch to an English page that has an Arabic twin. |
| `landing.py` | Search-intent landing pages copied from a tool page: new title/meta/canonical/H1/intro, an extra "how to" section + FAQ, and `window.QT_PRESET` so the tool opens in the right mode. `landing.py . specs/x.json` builds only the pages in that spec. |
| `wire.py` | Wires new tools into the site: homepage cards (EN/AR), "Popular tasks" chips, footer links on every page, sitemap entries and tool counts. |
| `indexnow.mjs` | Submits URLs to IndexNow (Bing, Yandex…) using the key file at the repo root: `--all`, or `--since <git-ref>` for URLs newly added to `sitemap.xml`; `--dry-run` to preview. The `IndexNow` GitHub workflow runs it automatically when `sitemap.xml` changes on `main`. |
| `cutout.py` | Turns a glass icon rendered on black into a 192 px transparent WebP for `assets/icons/`. |

`specs/` holds the specs used for the latest packs as examples.

## Typical flow for a new tool

```bash
python tools/make_page.py . my-tool "Title | QuickTiny" "Description…" "QuickTiny My Tool" "My Tool" style.html body.html UtilitiesApplication
python tools/wire.py . my-wire-spec.json
node tests/run-all.mjs
```

Tools that support presets read `window.QT_PRESET` (see `pdf-tools.js`, `qr-studio.js`, `image-converter.js`, …); a URL `#hash` always wins over a preset.

## Tests

`node tests/run-all.mjs` runs the unit tests for the tool engines (regex explainer, diff/patch, JWT verify, cron schedule, VAT/zakat/end-of-service, tafqeet, image converter, ZIP) and `tests/site-check.mjs`, which checks every page for broken internal links, sitemap coverage, canonical/hreflang correctness, missing titles/descriptions/H1, duplicate ids and stray Google Fonts. GitHub Actions runs the same command on every pull request.
