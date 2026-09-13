// checkShopifyProductImageLimits — tiny, dependency-free check against Shopify's
// verified product/collection image upload limits (25 megapixels, 20 MB),
// enforced independently of each other. See:
// https://quicktinyv2.vercel.app/shopify-image-upload-limits-test-2026
//
// Usage:
//   checkShopifyProductImageLimits({ width: 5200, height: 5200, bytes: 12000000 })
//   -> { megapixels: 27.04, passesMegapixels: false, passesFileSize: true, passes: false }
//
// Scope: Shopify's product and collection image upload path specifically.
// Other upload contexts (theme assets, blog images, general Files uploads)
// use different limits — see the source page above before reusing elsewhere.

function checkShopifyProductImageLimits(options) {
  var width = options.width;
  var height = options.height;
  var bytes = options.bytes;

  var MAX_PIXELS = 25000000; // Shopify's verified product/collection megapixel ceiling
  var MAX_BYTES = 20 * 1024 * 1024; // Shopify's verified product/collection file-size ceiling

  var pixelCount = width * height;
  var passesMegapixels = pixelCount <= MAX_PIXELS;
  var passesFileSize = bytes <= MAX_BYTES;

  return {
    megapixels: pixelCount / 1000000,
    passesMegapixels: passesMegapixels,
    passesFileSize: passesFileSize,
    passes: passesMegapixels && passesFileSize
  };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { checkShopifyProductImageLimits: checkShopifyProductImageLimits };
}
