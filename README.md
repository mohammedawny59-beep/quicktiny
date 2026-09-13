# QuickTiny

13 free, browser-local tools (JSON formatter, Base64/URL encode-decode, timestamp converter, word counter, image compressor, Shopify product-image checker/fixer, and more), plus a one-time-purchase batch image compressor. Live at [quicktinyv2.vercel.app](https://quicktinyv2.vercel.app).

## Reusable Shopify image-limit check

`check-shopify-image-limits.js` is a tiny, dependency-free function other developers are welcome to copy into their own projects. It checks an image's dimensions and file size against Shopify's verified product/collection image upload limits (25 megapixels, 20 MB — tested directly against Shopify's own uploader; see [the full test results and dataset](https://quicktinyv2.vercel.app/shopify-image-upload-limits-test-2026)).

```js
checkShopifyProductImageLimits({ width: 5200, height: 5200, bytes: 12000000 });
// => { megapixels: 27.04, passesMegapixels: false, passesFileSize: true, passes: false }
```

Works in the browser (`<script src="check-shopify-image-limits.js">`) or in Node (`require("./check-shopify-image-limits")`). No dependencies, no build step.

Scope: Shopify's product and collection image upload path specifically. Other Shopify upload contexts (theme assets, blog images, general Files uploads) use different limits — don't assume this function's thresholds apply there without checking.
