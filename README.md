# QuickTiny

Paste JSON, text, a URL, or an image and get the right browser tool quickly. QuickTiny has **12 free tools** that need no account, plus a separate **$4.99 one-time Pro batch image compressor**. Text and image processing happens in your browser.

**Try a free tool directly:**

| Task | Tool |
| --- | --- |
| Format, validate, or repair common JSON mistakes | [JSON Formatter](https://quicktinyv2.vercel.app/json-formatter?utm_source=github&utm_medium=readme&utm_campaign=tool_links) |
| Compress one JPG or PNG without uploading it | [Image Compressor](https://quicktinyv2.vercel.app/compress-image?utm_source=github&utm_medium=readme&utm_campaign=tool_links) |
| Count words and characters | [Word Counter](https://quicktinyv2.vercel.app/word-counter?utm_source=github&utm_medium=readme&utm_campaign=tool_links) |
| Encode or decode Base64 text | [Base64](https://quicktinyv2.vercel.app/base64-encode-decode?utm_source=github&utm_medium=readme&utm_campaign=tool_links) |
| Sort a list of lines | [Sort Lines](https://quicktinyv2.vercel.app/sort-lines?utm_source=github&utm_medium=readme&utm_campaign=tool_links) |

Or [open all 13 tools](https://quicktinyv2.vercel.app/?utm_source=github&utm_medium=readme&utm_campaign=tool_links). The batch compressor is the only paid feature; the 12 tools above and on the site are free.

**One useful edge case:** If `fetch(...).json()` reports `Unexpected token '<'`, the API probably returned an HTML page. Check the HTTP response and URL before trying to repair JSON. For actual JSON syntax errors, [the formatter explains the error and offers fixes for common, safe cases](https://quicktinyv2.vercel.app/json-formatter?utm_source=github&utm_medium=readme&utm_campaign=tool_links).

## Reusable Shopify image-limit check

`check-shopify-image-limits.js` is a tiny, dependency-free function other developers are welcome to copy into their own projects. It checks an image's dimensions and file size against Shopify's product/collection image upload limits (25 megapixels, under 20 MB — see [the test results and dataset](https://quicktinyv2.vercel.app/shopify-image-upload-limits-test-2026)).

```js
checkShopifyProductImageLimits({ width: 5200, height: 5200, bytes: 12000000 });
// => { megapixels: 27.04, passesMegapixels: false, passesFileSize: true, passes: false }
```

Works in the browser (`<script src="check-shopify-image-limits.js">`) or in Node (`require("./check-shopify-image-limits")`). No dependencies, no build step.

Scope: Shopify's product and collection image upload path specifically. Other Shopify upload contexts (theme assets, blog images, general Files uploads) use different limits — don't assume this function's thresholds apply there without checking.

## Embed the free Shopify image checker

Publishers writing for Shopify merchants can embed the single-image checker on a resource page without an account or an API key. The visitor chooses a product photo in their own browser; the image is not uploaded to QuickTiny. The checker reports whether the file exceeds the product/collection image limits and offers a local fix for an oversized image.

```html
<iframe
  src="https://quicktinyv2.vercel.app/embed/shopify-image-checker"
  title="Shopify product image limit checker"
  loading="lazy"
  style="width:100%;height:340px;border:0"
></iframe>
```

[Try the stand-alone checker](https://quicktinyv2.vercel.app/compress-product-images-for-shopify) before embedding. The checker is not a Shopify app and is not affiliated with Shopify. Its 25 MP / 20 MB checks apply to product and collection images, not every image uploader in Shopify. Editorial inclusion is optional; no paid placement or reciprocal link is requested.
