// GTA 6 Zone — "Get your setup ready" advisor with Amazon affiliate links.
// Pick a console, free storage and what you'll do (play / stream / record) -> a personal, prioritised gear list with
// the specs that matter. Links are Amazon *search* links on the visitor's store (SA / AE / EG / global), so they never
// point at a dead product page; the owner's Associates tag is appended when it is set below.
//
// ===== Owner: paste your Amazon Associates tracking IDs here (one per store you joined). Empty = plain link. =====
var QT_AFF_TAGS = { sa: "", ae: "", eg: "", com: "" };
// ==================================================================================================================
var QT_GEAR_STORES = { sa: "www.amazon.sa", ae: "www.amazon.ae", eg: "www.amazon.eg", com: "www.amazon.com" };
var QT_GEAR_NEED = 212; // official pre-load size in GB

function qtGearLink(store, query, tags) {
  var host = QT_GEAR_STORES[store] || QT_GEAR_STORES.com, tag = (tags || QT_AFF_TAGS)[store] || "";
  return "https://" + host + "/s?k=" + encodeURIComponent(query).replace(/%20/g, "+") + (tag ? "&tag=" + encodeURIComponent(tag) : "");
}
function qtGearStoreFor(tz, lang) {
  tz = tz || "";
  if (/Riyadh|Aden|Kuwait|Bahrain|Qatar/.test(tz)) return "sa";
  if (/Dubai|Muscat|Amman|Baghdad|Beirut|Damascus|Gaza|Hebron/.test(tz)) return "ae";
  if (/Cairo/.test(tz)) return "eg";
  return lang === "ar" ? "sa" : "com";
}
// family: ps | xbox | cloud
function qtGearFamily(c) { return /^ps5/.test(c) ? "ps" : c === "xone" ? "cloud" : "xbox"; }
// -> [{ id, pri: 1 must | 2 recommended | 3 nice, q: search query, size? }]
function qtGearPlan(o) {
  var c = o.console || "ps5", fam = qtGearFamily(c), uses = o.uses || ["play"], free = Number(o.freeGb);
  var out = [], need = QT_GEAR_NEED * 1.1, short = isFinite(free) && o.freeGb !== "" && o.freeGb != null ? Math.max(0, Math.ceil(need - free)) : null;
  if (fam === "cloud") {
    out.push({ id: "net", pri: 1, q: "Cat 6 ethernet cable 10m" });
    out.push({ id: "router", pri: 2, q: "WiFi 6 router" });
    out.push({ id: "pad", pri: 3, q: "Xbox Wireless Controller" });
  } else {
    if (short !== null && short > 0) {
      var size = short > 150 ? "2TB" : "1TB"; // almost no room left -> go big, the next big games come too
      out.push(fam === "ps" ? { id: "ssd_ps", pri: 1, q: "PS5 M.2 NVMe SSD " + size + " heatsink PCIe Gen4", size: size, short: short }
                            : { id: "card_xb", pri: 1, q: "Seagate Storage Expansion Card Xbox Series X " + size, size: size, short: short });
    } else if (short === null) {
      out.push(fam === "ps" ? { id: "ssd_ps", pri: 2, q: "PS5 M.2 NVMe SSD 2TB heatsink PCIe Gen4", size: "2TB" } : { id: "card_xb", pri: 2, q: "Seagate Storage Expansion Card Xbox Series X 1TB", size: "1TB" });
    }
    out.push(fam === "ps" ? { id: "game", pri: 2, q: "Grand Theft Auto VI PS5" } : { id: "game", pri: 2, q: "Grand Theft Auto VI Xbox Series X" });
    out.push(fam === "ps" ? { id: "pad", pri: 2, q: c === "ps5pro" ? "DualSense Edge controller" : "DualSense wireless controller" } : { id: "pad", pri: 2, q: "Xbox Wireless Controller" });
    out.push(fam === "ps" ? { id: "charge", pri: 3, q: "DualSense charging station" } : { id: "charge", pri: 3, q: "Xbox rechargeable battery kit" });
    out.push(fam === "ps" ? { id: "audio", pri: 3, q: "PS5 wireless headset 3D audio" } : { id: "audio", pri: 3, q: "Xbox wireless headset" });
  }
  if (uses.indexOf("stream") >= 0) {
    if (fam !== "cloud") out.push({ id: "capture", pri: 1, q: "Elgato HD60 X capture card" });
    out.push({ id: "mic", pri: 2, q: "USB microphone for streaming" });
    out.push({ id: "light", pri: 3, q: "LED key light for streaming" });
  }
  if (uses.indexOf("record") >= 0) {
    out.push({ id: "clips", pri: 2, q: "portable SSD 1TB USB-C" });
    if (uses.indexOf("stream") < 0 && fam !== "cloud") out.push({ id: "capture", pri: 3, q: "Elgato HD60 X capture card" });
  }
  var seen = {}; out = out.filter(function (x) { if (seen[x.id]) return false; seen[x.id] = 1; return true; });
  return out.sort(function (a, b) { return a.pri - b.pri; });
}

(function () {
  if (typeof document === "undefined") return;
  var box = document.getElementById("gsGear"); if (!box) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0, $ = function (id) { return document.getElementById(id); };
  var T = AR ? {
    pri: ["", "ضروري", "مستحسن", "إضافي"], go: "شوف الأسعار على أمازون", none: "اختار جهازك فوق لتطلعلك القائمة.",
    ssd_ps: ["هارد M.2 NVMe للـ PS5", function (x) { return (x.short ? "ناقصك تقريبًا " + x.short + " غيغا. " : "") + "خذ " + x.size + " بسرعة 5500MB/s أو أكثر (PCIe Gen4) ومعه مبرّد heatsink، وبيتركّب بمنفذ التوسعة جوّا الجهاز."; }],
    card_xb: ["كرت التوسعة الرسمي لإكسبوكس", function (x) { return (x.short ? "ناقصك تقريبًا " + x.short + " غيغا. " : "") + "ألعاب Series X|S الحديثة لازم تشتغل من التخزين الداخلي أو كرت Seagate الرسمي (" + x.size + "). الهارد الـ USB العادي بس للتخزين."; }],
    game: ["نسخة GTA 6", function () { return "النسخة الفيزيائية بتجيك بكود تفعيل، وبتقدر تبلّش التنزيل المسبق فيه."; }],
    pad: ["يد تحكم إضافية", function (x) { return /Edge/.test(x.q) ? "DualSense Edge: أزرار خلفية وحساسية قابلة للتعديل، بتفرق بالتصويب والسواقة." : "يد احتياط مشحونة عشان الجلسات الطويلة يوم الإطلاق."; }],
    charge: ["محطة شحن", function () { return "اشحن يدين مع بعض وخلّيها جاهزة دايمًا."; }],
    audio: ["سماعة رأس", function () { return "الصوت المحيطي بيخلّيك تسمع وين السيارات والطلقات. اختار سماعة لاسلكية متوافقة مع جهازك."; }],
    capture: ["كرت تسجيل وبث — Capture Card", function () { return "عشان تبث من الجهاز للكمبيوتر بجودة 1080p60 أو 4K، وبيشتغل مع OBS وعدة البث تبعنا."; }],
    mic: ["مايك USB", function () { return "صوتك أهم من الصورة بالبث. مايك USB بيركب مباشرة على الكمبيوتر بدون كرت صوت."; }],
    light: ["إضاءة للكاميرا", function () { return "ضوء ناعم من قدّام بيخلّي الكاميرا أوضح بكتير."; }],
    clips: ["هارد خارجي SSD للمقاطع", function () { return "انقل مقاطعك لتعدّلها، وخلي مساحة الجهاز للعبة."; }],
    net: ["كيبل إنترنت (Ethernet)", function () { return "اللعب السحابي على Xbox One بيحتاج اتصال ثابت. الكيبل أحسن بكتير من الواي فاي."; }],
    router: ["راوتر Wi-Fi 6", function () { return "إذا ما بتقدر تمد كيبل، راوتر Wi-Fi 6 بيقلل التقطيع بالبث السحابي."; }]
  } : {
    pri: ["", "Must-have", "Recommended", "Nice to have"], go: "See prices on Amazon", none: "Pick your console above to get your list.",
    ssd_ps: ["M.2 NVMe SSD for PS5", function (x) { return (x.short ? "You're about " + x.short + " GB short. " : "") + "Get " + x.size + " rated 5,500 MB/s or faster (PCIe Gen4) with a heatsink; it fits the expansion slot inside the console."; }],
    card_xb: ["Official Xbox expansion card", function (x) { return (x.short ? "You're about " + x.short + " GB short. " : "") + "Series X|S games must run from internal storage or the official Seagate card (" + x.size + "). A normal USB drive is for storage only."; }],
    game: ["A copy of GTA 6", function () { return "The boxed copy includes a code so you can start the pre-load."; }],
    pad: ["A second controller", function (x) { return /Edge/.test(x.q) ? "DualSense Edge: back buttons and adjustable sticks — a real edge for aiming and driving." : "A charged spare for long launch-day sessions."; }],
    charge: ["Charging station", function () { return "Charge two controllers at once so one is always ready."; }],
    audio: ["Headset", function () { return "Surround sound tells you where cars and shots are coming from. Pick a wireless one made for your console."; }],
    capture: ["Capture card", function () { return "Stream from your console to a PC at 1080p60 or 4K; works with OBS and our stream kit."; }],
    mic: ["USB microphone", function () { return "Your voice matters more than the picture — a USB mic plugs straight into the PC."; }],
    light: ["Key light", function () { return "Soft front light makes any webcam look much sharper."; }],
    clips: ["Portable SSD for clips", function () { return "Move clips off the console to edit them and keep space for the game."; }],
    net: ["Ethernet cable", function () { return "Cloud play on Xbox One needs a stable connection — a cable beats Wi-Fi by far."; }],
    router: ["Wi-Fi 6 router", function () { return "If you can't run a cable, a Wi-Fi 6 router cuts cloud-streaming stutter."; }]
  };
  var st = { console: "ps5", uses: ["play"], store: qtGearStoreFor(Intl.DateTimeFormat().resolvedOptions().timeZone, AR ? "ar" : "en") };
  function chips(id, key, multi) {
    var g = $(id); if (!g) return;
    var sync = function () { g.querySelectorAll(".chip").forEach(function (b) { var v = b.getAttribute("data-v"), on = multi ? st[key].indexOf(v) >= 0 : st[key] === v; b.classList.toggle("active", on); b.setAttribute("aria-pressed", on ? "true" : "false"); }); };
    g.addEventListener("click", function (e) {
      var b = e.target.closest(".chip"); if (!b) return; var v = b.getAttribute("data-v");
      if (multi) { var i = st[key].indexOf(v); if (i >= 0 && st[key].length > 1) st[key].splice(i, 1); else if (i < 0) st[key].push(v); } else st[key] = v;
      sync(); render();
    });
    sync();
  }
  function render() {
    var free = $("gsGearFree").value, plan = qtGearPlan({ console: st.console, freeGb: free, uses: st.uses }), list = $("gsGearList");
    list.textContent = "";
    if (!plan.length) { list.textContent = T.none; return; }
    plan.forEach(function (x, i) {
      var t = T[x.id]; if (!t) return;
      var a = document.createElement("a"); a.className = "gs-gear-card p" + x.pri; a.href = qtGearLink(st.store, x.q); a.target = "_blank"; a.rel = "sponsored nofollow noopener";
      a.style.setProperty("--d", (i * .05).toFixed(2) + "s");
      var tag = document.createElement("span"); tag.className = "pri"; tag.textContent = T.pri[x.pri];
      var b = document.createElement("b"); b.textContent = t[0];
      var p = document.createElement("p"); p.textContent = t[1](x);
      var go = document.createElement("span"); go.className = "go"; go.textContent = T.go + " →";
      a.appendChild(tag); a.appendChild(b); a.appendChild(p); a.appendChild(go);
      a.addEventListener("click", function () { if (typeof qtEvent === "function") qtEvent("gta_gear_click"); });
      list.appendChild(a);
    });
  }
  chips("gsGearCon", "console"); chips("gsGearUse", "uses", true); chips("gsGearStore", "store");
  var fIn = $("gsGearFree"), other = $("gsFree");
  fIn.addEventListener("input", render);
  if (other) other.addEventListener("input", function () { fIn.value = other.value; render(); }); // reuse the storage calculator's answer
  render();
})();
if (typeof module !== "undefined") module.exports = { qtGearPlan: qtGearPlan, qtGearLink: qtGearLink, qtGearStoreFor: qtGearStoreFor, qtGearFamily: qtGearFamily, QT_AFF_TAGS: QT_AFF_TAGS };
