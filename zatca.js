// QuickTiny — Saudi simplified tax invoice generator + ZATCA (Fatoora) phase-1 QR code, and a QR reader/verifier.
// The QR payload is Base64 of TLV fields: 1 seller name, 2 VAT number, 3 timestamp, 4 invoice total (with VAT), 5 VAT total.
// Everything runs in the browser; invoice details are only remembered in this browser's localStorage.

function qtUtf8Bytes(s) { return typeof TextEncoder !== "undefined" ? new TextEncoder().encode(s) : Buffer.from(s, "utf8"); }
function qtB64FromBytes(u8) { var b = ""; for (var i = 0; i < u8.length; i++) b += String.fromCharCode(u8[i]); return typeof btoa !== "undefined" ? btoa(b) : Buffer.from(u8).toString("base64"); }
function qtBytesFromB64(s) { var bin = typeof atob !== "undefined" ? atob(s) : Buffer.from(s, "base64").toString("binary"); var u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }

// fields: {seller, vat, time (ISO string), total, vatTotal} -> Base64 TLV
function qtZatcaTLV(f) {
  var vals = [f.seller, f.vat, f.time, f.total, f.vatTotal].map(function (v) { return qtUtf8Bytes(String(v == null ? "" : v)); });
  var parts = [], len = 0;
  vals.forEach(function (b, i) {
    if (b.length > 255) throw new Error("الحقل " + (i + 1) + " أطول من 255 بايت.");
    parts.push(i + 1, b.length); for (var k = 0; k < b.length; k++) parts.push(b[k]);
  });
  return qtB64FromBytes(Uint8Array.from(parts));
}
// Base64 TLV -> {tags:{1..n: string}, error}
function qtZatcaDecode(b64) {
  var s = String(b64 || "").trim().replace(/\s+/g, "");
  if (!s) return { error: "لا يوجد محتوى." };
  if (!/^[A-Za-z0-9+/=_-]+$/.test(s)) return { error: "المحتوى ليس بصيغة Base64 — قد لا يكون رمز فاتورة ضريبية سعودية." };
  var u;
  try { u = qtBytesFromB64(s.replace(/-/g, "+").replace(/_/g, "/")); } catch (e) { return { error: "تعذّر فك ترميز Base64." }; }
  var tags = {}, i = 0, dec = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { fatal: true }) : null;
  while (i < u.length) {
    var tag = u[i], ln = u[i + 1];
    if (ln === undefined || i + 2 + ln > u.length) return { error: "بنية TLV غير مكتملة — الرمز تالف أو ليس بصيغة الهيئة.", tags: tags };
    var bytes = u.slice(i + 2, i + 2 + ln), txt;
    try { txt = dec ? dec.decode(bytes) : Buffer.from(bytes).toString("utf8"); } catch (e) { txt = null; }
    tags[tag] = txt === null ? "(بيانات ثنائية " + ln + " بايت)" : txt;
    i += 2 + ln;
  }
  return { tags: tags };
}
function qtVatNumberValid(v) { return /^3\d{13}3$/.test(String(v || "").trim()); }

// Checks a decoded phase-1 QR: required tags present and consistent.
function qtZatcaCheck(tags) {
  var issues = [], ok = [];
  var need = { 1: "اسم البائع", 2: "الرقم الضريبي", 3: "تاريخ ووقت الفاتورة", 4: "إجمالي الفاتورة مع الضريبة", 5: "إجمالي ضريبة القيمة المضافة" };
  Object.keys(need).forEach(function (k) { if (tags[k] === undefined || tags[k] === "") issues.push("الحقل " + k + " (" + need[k] + ") غير موجود."); });
  if (tags[2] !== undefined) { if (qtVatNumberValid(tags[2])) ok.push("الرقم الضريبي بالصيغة الصحيحة (15 رقمًا يبدأ وينتهي بـ 3)."); else issues.push("الرقم الضريبي «" + tags[2] + "» لا يطابق الصيغة: 15 رقمًا يبدأ وينتهي بالرقم 3."); }
  if (tags[3] !== undefined) { var d = new Date(tags[3]); if (isNaN(d)) issues.push("التاريخ «" + tags[3] + "» ليس بصيغة ISO 8601."); else { ok.push("تاريخ صالح."); if (d > new Date(Date.now() + 86400000)) issues.push("تاريخ الفاتورة في المستقبل."); } }
  var t = parseFloat(tags[4]), v = parseFloat(tags[5]);
  if (tags[4] !== undefined && !isFinite(t)) issues.push("الإجمالي ليس رقمًا.");
  if (tags[5] !== undefined && !isFinite(v)) issues.push("مبلغ الضريبة ليس رقمًا.");
  if (isFinite(t) && isFinite(v) && t > 0) {
    var expected = t * 15 / 115;
    if (Math.abs(expected - v) <= 0.05) ok.push("مبلغ الضريبة يساوي 15% من الصافي.");
    else issues.push("مبلغ الضريبة (" + v.toFixed(2) + ") لا يساوي 15% من الصافي — المتوقع " + expected.toFixed(2) + " (قد تحتوي الفاتورة على بنود معفاة أو بنسبة صفر).");
  }
  if (Object.keys(tags).some(function (k) { return +k > 5; })) ok.push("يحتوي حقولًا إضافية (" + Object.keys(tags).filter(function (k) { return +k > 5; }).join("، ") + ") — غالبًا رمز المرحلة الثانية الموقّع.");
  return { issues: issues, ok: ok };
}
// ISO 8601 timestamp in local time with offset, e.g. 2026-11-10T14:30:00+03:00
function qtIsoLocal(d) {
  var p = function (n) { return (n < 10 ? "0" : "") + n; }, off = -d.getTimezoneOffset(), sign = off >= 0 ? "+" : "-"; off = Math.abs(off);
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) + sign + p(Math.floor(off / 60)) + ":" + p(off % 60);
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  var fmt = function (x) { return Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var num = function (v) { v = String(v || "").replace(/[٠-٩]/g, function (d) { return "٠١٢٣٤٥٦٧٨٩".indexOf(d); }).replace(/[,،\s]/g, "").replace("٫", "."); return v === "" ? 0 : +v; };
  var store = { get: function (k) { try { return JSON.parse(localStorage.getItem("qt_" + k) || "null"); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem("qt_" + k, JSON.stringify(v)); } catch (e) {} } };
  var SELLER = ["zvSeller", "zvVat", "zvCr", "zvAddr", "zvPhone"], logo = null;

  function qrSvg(text, size) {
    var qr = qrcode(0, "M"); qr.addData(text, "Byte"); qr.make();
    var n = qr.getModuleCount(), q = 4, s = n + q * 2, d = "";
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (qr.isDark(r, c)) d += "M" + (c + q) + " " + (r + q) + "h1v1h-1z";
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + s + " " + s + '" width="' + size + '" height="' + size + '" shape-rendering="crispEdges" role="img" aria-label="رمز QR للفاتورة"><rect width="' + s + '" height="' + s + '" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
  }
  function addRow(desc, qty, price) {
    var tr = document.createElement("tr");
    tr.innerHTML = '<td><input type="text" class="zv-desc" aria-label="وصف المنتج أو الخدمة" placeholder="وصف المنتج أو الخدمة" value="' + esc(desc || "") + '"></td><td><input type="text" inputmode="decimal" class="zv-qty cl-num" aria-label="الكمية" value="' + (qty || 1) + '"></td><td><input type="text" inputmode="decimal" class="zv-price cl-num" aria-label="سعر الوحدة" placeholder="0.00" value="' + (price || "") + '"></td><td><button type="button" class="vt-del" aria-label="حذف البند">×</button></td>';
    tr.querySelector(".vt-del").addEventListener("click", function () { if ($("zvRows").children.length > 1) tr.remove(); render(); });
    tr.querySelectorAll("input").forEach(function (i) { i.addEventListener("input", render); });
    $("zvRows").appendChild(tr);
  }
  function items() {
    return Array.prototype.map.call($("zvRows").children, function (tr) { return { desc: tr.querySelector(".zv-desc").value, qty: num(tr.querySelector(".zv-qty").value), price: num(tr.querySelector(".zv-price").value) }; })
      .filter(function (it) { return it.qty && it.price; });
  }
  function render() {
    var inc = $("zvInc").value === "inc", rate = 15, its = items(), r = qtVat(its, rate, inc, 2);
    var when = $("zvDate").value ? new Date($("zvDate").value) : new Date();
    var seller = $("zvSeller").value.trim(), vat = $("zvVat").value.trim();
    var vatOk = qtVatNumberValid(vat);
    $("zvVatErr").textContent = vat && !vatOk ? "الرقم الضريبي 15 رقمًا يبدأ وينتهي بالرقم 3." : "";
    var payload = "";
    try { payload = qtZatcaTLV({ seller: seller, vat: vat, time: qtIsoLocal(when), total: r.total.toFixed(2), vatTotal: r.vat.toFixed(2) }); } catch (e) { $("zvVatErr").textContent = e.message; }
    var rows = its.map(function (it, i) {
      var line = it.qty * it.price, net = inc ? line / 1.15 : line, v = inc ? line - net : line * 0.15;
      return "<tr><td>" + (i + 1) + "</td><td>" + esc(it.desc || "—") + '</td><td class="n">' + it.qty + '</td><td class="n">' + fmt(inc ? it.price / 1.15 : it.price) + '</td><td class="n">' + fmt(v) + '</td><td class="n">' + fmt(net + v) + "</td></tr>";
    }).join("");
    var buyer = $("zvBuyer").value.trim(), buyerVat = $("zvBuyerVat").value.trim();
    var dateTxt = when.toLocaleString("ar-SA-u-nu-latn-ca-gregory", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
    $("zvPreview").innerHTML =
      '<div class="iv-head"><div class="iv-seller">' + (logo ? '<img class="iv-logo" alt="" src="' + logo + '">' : "") + "<div><b>" + esc(seller || "اسم المنشأة") + "</b>" +
      (vat ? "<span>الرقم الضريبي: " + esc(vat) + "</span>" : "") + ($("zvCr").value ? "<span>السجل التجاري: " + esc($("zvCr").value) + "</span>" : "") +
      ($("zvAddr").value ? "<span>" + esc($("zvAddr").value) + "</span>" : "") + ($("zvPhone").value ? "<span>" + esc($("zvPhone").value) + "</span>" : "") + "</div></div>" +
      '<div class="iv-title"><h2>فاتورة ضريبية مبسطة</h2><span>Simplified Tax Invoice</span></div></div>' +
      '<div class="iv-meta"><div><span>رقم الفاتورة</span><b>' + esc($("zvNo").value || "—") + "</b></div><div><span>التاريخ والوقت</span><b>" + esc(dateTxt) + "</b></div>" +
      (buyer ? "<div><span>العميل</span><b>" + esc(buyer) + "</b>" + (buyerVat ? "<small>ر.ض: " + esc(buyerVat) + "</small>" : "") + "</div>" : "") + "</div>" +
      '<table class="iv-items"><thead><tr><th>#</th><th>البيان</th><th>الكمية</th><th>سعر الوحدة</th><th>الضريبة 15%</th><th>المجموع شامل الضريبة</th></tr></thead><tbody>' + (rows || '<tr><td colspan="6" class="iv-empty">أضف بنود الفاتورة</td></tr>') + "</tbody></table>" +
      '<div class="iv-foot"><div class="iv-qr">' + (payload && seller && vatOk ? qrSvg(payload, 132) : '<div class="iv-qr-ph">يظهر رمز QR بعد إدخال اسم المنشأة ورقمها الضريبي الصحيح</div>') + "</div>" +
      '<div class="iv-totals"><div><span>الإجمالي غير شامل الضريبة</span><b>' + fmt(r.net) + " ر.س</b></div><div><span>ضريبة القيمة المضافة 15%</span><b>" + fmt(r.vat) + " ر.س</b></div>" +
      '<div class="iv-grand"><span>الإجمالي شامل الضريبة</span><b>' + fmt(r.total) + " ر.س</b></div>" +
      (r.total && typeof qtTafqeet === "function" ? '<p class="iv-words">' + esc(qtTafqeet(r.total.toFixed(2), "SAR", { only: true }).text) + "</p>" : "") + "</div></div>" +
      ($("zvNotes").value ? '<p class="iv-notes">' + esc($("zvNotes").value) + "</p>" : "");
    $("zvPayload").textContent = payload && seller && vatOk ? payload : "";
    var s = {}; SELLER.forEach(function (id) { s[id] = $(id).value; }); s.logo = logo; s.inc = $("zvInc").value; store.set("zatca_seller", s);
  }
  function nextNo() { var n = (store.get("zatca_no") || 0) + 1; return "INV-" + String(n).padStart(5, "0"); }

  // ---------- reader ----------
  function showDecoded(text, src) {
    var out = $("zrOut");
    var d = qtZatcaDecode(text);
    if (d.error) { out.innerHTML = '<p class="zr-bad">' + esc(d.error) + "</p>" + (src ? '<p class="cl-note">النص المقروء: <code>' + esc(String(text).slice(0, 200)) + "</code></p>" : ""); return; }
    var names = { 1: "اسم البائع", 2: "الرقم الضريبي للبائع", 3: "تاريخ ووقت الفاتورة", 4: "الإجمالي مع الضريبة", 5: "مبلغ الضريبة", 6: "تجزئة الفاتورة (Hash)", 7: "التوقيع الرقمي", 8: "المفتاح العام", 9: "توقيع شهادة الهيئة" };
    var c = qtZatcaCheck(d.tags);
    out.innerHTML = '<table class="zr-table"><tbody>' + Object.keys(d.tags).map(function (k) {
      var v = d.tags[k], cell = esc(v.length > 90 ? v.slice(0, 90) + "…" : v);
      if (k === "3" && !isNaN(new Date(v))) cell += " <small>(" + esc(new Date(v).toLocaleString("ar-SA-u-nu-latn-ca-gregory")) + ")</small>";
      return "<tr><th>" + k + " · " + (names[k] || "حقل " + k) + "</th><td>" + cell + "</td></tr>";
    }).join("") + "</tbody></table>" +
      (c.issues.length ? '<ul class="zr-list zr-bad">' + c.issues.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : '<p class="zr-good">✓ الرمز سليم البنية ويحتوي الحقول الخمسة المطلوبة.</p>') +
      (c.ok.length ? '<ul class="zr-list zr-ok">' + c.ok.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") +
      '<p class="cl-note">هذا فحص لبنية الرمز وصحة صيغه فقط — لا يثبت أن الفاتورة مسجلة لدى الهيئة. للتحقق الرسمي استخدم تطبيق «الفوترة الإلكترونية» من هيئة الزكاة والضريبة والجمارك.</p>';
    qtTrack("zatca_read", { ok: c.issues.length ? 0 : 1 });
  }
  function readImage(file) {
    var url = URL.createObjectURL(file), img = new Image();
    img.onload = function () {
      var scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
      c.width = Math.round(img.naturalWidth * scale); c.height = Math.round(img.naturalHeight * scale);
      var x = c.getContext("2d"); x.drawImage(img, 0, 0, c.width, c.height);
      var data = x.getImageData(0, 0, c.width, c.height), res = jsQR(data.data, c.width, c.height, { inversionAttempts: "attemptBoth" });
      URL.revokeObjectURL(url);
      if (!res) { $("zrOut").innerHTML = '<p class="zr-bad">لم نجد رمز QR في الصورة. قصّ الصورة حول الرمز أو صوّره بوضوح أكبر.</p>'; return; }
      $("zrText").value = res.data; showDecoded(res.data, true);
    };
    img.onerror = function () { $("zrOut").innerHTML = '<p class="zr-bad">تعذّرت قراءة الصورة.</p>'; };
    img.src = url;
  }
  function showTab(t) {
    document.querySelectorAll("#zvTabs .chip").forEach(function (b) { var on = b.getAttribute("data-tab") === t; b.classList.toggle("active", on); b.setAttribute("aria-selected", on); });
    $("zvMake").hidden = t !== "make"; $("zvRead").hidden = t !== "read";
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!$("zvRows")) return;
    var s = store.get("zatca_seller") || {};
    SELLER.forEach(function (id) { if (s[id]) $(id).value = s[id]; });
    if (s.inc) $("zvInc").value = s.inc; if (s.logo) logo = s.logo;
    $("zvNo").value = nextNo();
    var now = new Date(); now.setSeconds(0, 0);
    $("zvDate").value = qtIsoLocal(now).slice(0, 16);
    addRow("", 1, "100");
    ["zvSeller", "zvVat", "zvCr", "zvAddr", "zvPhone", "zvNo", "zvDate", "zvBuyer", "zvBuyerVat", "zvNotes"].forEach(function (id) { $(id).addEventListener("input", render); });
    $("zvInc").addEventListener("change", render);
    $("zvAdd").addEventListener("click", function () { addRow(); render(); });
    $("zvLogo").addEventListener("change", function () {
      var f = this.files[0]; if (!f) return;
      var img = new Image(), u = URL.createObjectURL(f);
      img.onload = function () { var k = Math.min(1, 240 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas"); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); logo = c.toDataURL("image/png"); URL.revokeObjectURL(u); render(); };
      img.src = u;
    });
    $("zvLogoClear").addEventListener("click", function () { logo = null; render(); });
    $("zvPrint").addEventListener("click", function () {
      if (!qtVatNumberValid($("zvVat").value) || !$("zvSeller").value.trim()) { $("zvStatus").textContent = "أدخل اسم المنشأة والرقم الضريبي الصحيح أولًا."; $("zvStatus").className = "result error"; return; }
      var m = /(\d+)$/.exec($("zvNo").value); if (m) store.set("zatca_no", Math.max(store.get("zatca_no") || 0, +m[1]));
      qtTrack("zatca_print"); window.print();
    });
    $("zvNew").addEventListener("click", function () {
      var m = /(\d+)$/.exec($("zvNo").value); if (m) store.set("zatca_no", Math.max(store.get("zatca_no") || 0, +m[1]));
      $("zvNo").value = nextNo(); $("zvRows").innerHTML = ""; addRow(); $("zvBuyer").value = ""; $("zvBuyerVat").value = ""; $("zvNotes").value = "";
      var d = new Date(); d.setSeconds(0, 0); $("zvDate").value = qtIsoLocal(d).slice(0, 16); render();
    });
    $("zvCopy").addEventListener("click", function () { qtCopy($("zvPayload").textContent, $("zvStatus"), "تم نسخ محتوى الرمز"); });
    document.querySelectorAll("#zvTabs .chip").forEach(function (b) { b.addEventListener("click", function () { showTab(b.getAttribute("data-tab")); }); });
    $("zrText").addEventListener("input", function () { if ($("zrText").value.trim()) showDecoded($("zrText").value); else $("zrOut").innerHTML = ""; });
    var dz = $("zrDrop"), inp = $("zrFile");
    dz.addEventListener("click", function () { inp.click(); });
    dz.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inp.click(); } });
    dz.addEventListener("dragover", function (e) { e.preventDefault(); dz.classList.add("drag"); });
    dz.addEventListener("dragleave", function () { dz.classList.remove("drag"); });
    dz.addEventListener("drop", function (e) { e.preventDefault(); dz.classList.remove("drag"); if (e.dataTransfer.files[0]) readImage(e.dataTransfer.files[0]); });
    inp.addEventListener("change", function () { if (inp.files[0]) readImage(inp.files[0]); inp.value = ""; });
    document.addEventListener("paste", function (e) { if ($("zvRead").hidden) return; var f = Array.prototype.filter.call((e.clipboardData && e.clipboardData.files) || [], function (x) { return /^image\//.test(x.type); })[0]; if (f) readImage(f); });
    // Printing copies the invoice into a top-level element so it starts at the top of the page.
    var pa = document.createElement("div"); pa.id = "zvPrintArea"; pa.setAttribute("dir", "rtl"); document.body.appendChild(pa);
    window.addEventListener("beforeprint", function () { pa.innerHTML = $("zvPreview").innerHTML; });
    window.addEventListener("afterprint", function () { pa.innerHTML = ""; });
    var P = window.QT_PRESET || {};
    if (P.tab === "read" || location.hash === "#read") showTab("read");
    render();
  });
})();

if (typeof module !== "undefined") module.exports = { qtZatcaTLV: qtZatcaTLV, qtZatcaDecode: qtZatcaDecode, qtZatcaCheck: qtZatcaCheck, qtVatNumberValid: qtVatNumberValid, qtIsoLocal: qtIsoLocal };
