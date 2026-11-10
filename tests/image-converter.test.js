const ROOT = require("path").join(__dirname, "..");
const assert = require("assert");
const I = require(ROOT + "/image-converter.js");
const Z = require(ROOT + "/qt-zip.js");
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const ftyp = (brand) => Uint8Array.from([0, 0, 0, 24, ...Buffer.from("ftyp" + brand)]);

// HEIC detection by type, extension and file signature
ok(I.qtIcIsHeic("IMG_1.HEIC", ""), "extension");
ok(I.qtIcIsHeic("photo", "image/heif"), "mime");
ok(I.qtIcIsHeic("photo.bin", "", ftyp("heic")), "ftyp heic");
ok(I.qtIcIsHeic("photo.bin", "", ftyp("mif1")), "ftyp mif1");
ok(!I.qtIcIsHeic("photo.avif", "image/avif", ftyp("avif")), "avif is not heic");
ok(!I.qtIcIsHeic("a.jpg", "image/jpeg", Uint8Array.from([255, 216, 255, 224, 0, 16, 74, 70, 73, 70, 0, 1])), "jpeg");

// Resize targets keep aspect ratio
const t = (w, h, o) => { const r = I.qtIcTarget(w, h, o); return r.w + "x" + r.h; };
ok(t(4000, 3000, { mode: "none" }) === "4000x3000", "none");
ok(t(4000, 3000, { mode: "max", w: 1920, h: 1920 }) === "1920x1440", "fit box");
ok(t(800, 600, { mode: "max", w: 1920, h: 1920 }) === "800x600", "fit never enlarges");
ok(t(4000, 3000, { mode: "pct", pct: 25 }) === "1000x750", "percent");
ok(t(4000, 3000, { mode: "w", w: 1000 }) === "1000x750", "exact width");
ok(t(4000, 3000, { mode: "h", h: 300 }) === "400x300", "exact height");
ok(t(3, 3, { mode: "pct", pct: 1 }) === "1x1", "min 1px");

ok(I.qtIcOutName("IMG_1234.HEIC", "jpg") === "IMG_1234.jpg", "rename");
ok(I.qtIcOutName("archive.tar.png", "webp") === "archive.tar.webp", "last extension only");
ok(I.qtIcOutName("", "png") === "image.png", "empty name");

// ZIP writer: read it back and verify names, sizes and CRCs
(async () => {
  const files = [{ name: "a.jpg", data: Uint8Array.from([1, 2, 3]) }, { name: "a.jpg", data: new TextEncoder().encode("hello") }, { name: "مرحبا.txt", data: new Uint8Array(0) }];
  const buf = Buffer.from(await Z.qtZip(files).arrayBuffer());
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 5, 6]));
  const count = buf.readUInt16LE(eocd + 10), cdOff = buf.readUInt32LE(eocd + 16);
  ok(count === 3, "entry count");
  let p = cdOff; const names = [];
  for (let i = 0; i < count; i++) {
    const nl = buf.readUInt16LE(p + 28), crc = buf.readUInt32LE(p + 16), size = buf.readUInt32LE(p + 20), lho = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nl).toString("utf8"); names.push(name);
    const lnl = buf.readUInt16LE(lho + 26), data = buf.slice(lho + 30 + lnl, lho + 30 + lnl + size);
    ok(Z.crc32(new Uint8Array(data)) === crc, "crc " + name);
    p += 46 + nl;
  }
  ok(names.join("|") === "a.jpg|a (1).jpg|مرحبا.txt", "unique names: " + names.join("|"));
  ok(Z.crc32(new TextEncoder().encode("123456789")) === 0xcbf43926, "crc32 check value");
  console.log("image converter + zip tests:", n, "passed");
})().catch((e) => { console.error(e); process.exitCode = 1; });
