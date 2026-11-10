// QuickTiny minimal ZIP writer (store, no compression) — shared by tools that export many files.
// qtZip([{ name: "a.jpg", data: Uint8Array }]) -> Blob
(function (root) {
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function uniq(files) {
    var seen = {};
    return files.map(function (f) {
      var n = f.name, base = n.replace(/(\.[^.]*)?$/, ""), ext = (n.match(/\.[^.]*$/) || [""])[0], i = 1;
      while (seen[n.toLowerCase()]) n = base + " (" + (i++) + ")" + ext;
      seen[n.toLowerCase()] = 1; return { name: n, data: f.data };
    });
  }
  function qtZip(files) {
    var parts = [], central = [], offset = 0, enc = new TextEncoder();
    uniq(files).forEach(function (f) {
      var name = enc.encode(f.name), data = f.data, crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(8, 0, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true); h.setUint16(26, name.length, true);
      parts.push(new Uint8Array(h.buffer), name, data);
      var c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      central.push(new Uint8Array(c.buffer), name);
      offset += 30 + name.length + data.length;
    });
    var cSize = central.reduce(function (a, p) { return a + p.length; }, 0);
    var e = new DataView(new ArrayBuffer(22));
    var count = files.length;
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, count, true); e.setUint16(10, count, true); e.setUint32(12, cSize, true); e.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [new Uint8Array(e.buffer)]), { type: "application/zip" });
  }
  root.qtZip = qtZip; root.qtCrc32 = crc32;
  if (typeof module !== "undefined") module.exports = { qtZip: qtZip, crc32: crc32 };
})(typeof window !== "undefined" ? window : globalThis);
