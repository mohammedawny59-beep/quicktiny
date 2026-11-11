// QuickTiny CV builder: a form on the left, a live A4 preview on the right, "Download PDF" via the browser's print
// dialog (real, selectable text — readable by applicant tracking systems). Everything stays in localStorage.
function qtCvEsc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
// Bullet lines: one per line, leading "-", "•" or "*" removed.
function qtCvBullets(text) { return String(text || "").split(/\r?\n/).map(function (l) { return l.replace(/^\s*[-•*]\s*/, "").trim(); }).filter(Boolean); }
// Renders the CV document HTML from the data object.
function qtCvHtml(d) {
  var ar = d.lang === "ar", L = ar ? { sum: "نبذة", exp: "الخبرات العملية", edu: "التعليم", skills: "المهارات", langs: "اللغات", certs: "الشهادات والدورات", present: "حتى الآن" }
                                  : { sum: "Summary", exp: "Experience", edu: "Education", skills: "Skills", langs: "Languages", certs: "Certifications", present: "Present" };
  var e = qtCvEsc, h = '<div class="cv-doc cv-' + e(d.template || "classic") + '" dir="' + (ar ? "rtl" : "ltr") + '" lang="' + (ar ? "ar" : "en") + '" style="--cv-accent:' + e(d.color || "#3b4cca") + '">';
  h += '<div class="cv-top"><h1>' + e(d.name || (ar ? "اسمك الكامل" : "Your Name")) + "</h1>";
  if (d.title) h += '<p class="cv-title">' + e(d.title) + "</p>";
  var contact = [d.email, d.phone, d.city, d.link].filter(Boolean).map(function (c) { return '<span dir="auto">' + e(c) + "</span>"; });
  if (contact.length) h += '<p class="cv-contact">' + contact.join('<i aria-hidden="true">•</i>') + "</p>";
  h += "</div>";
  var sec = function (t, body) { return body ? '<section class="cv-sec"><h2>' + t + "</h2>" + body + "</section>" : ""; };
  if (d.summary) h += sec(L.sum, "<p>" + e(d.summary).replace(/\n/g, "<br>") + "</p>");
  var items = function (list, kind) {
    return (list || []).filter(function (x) { return x && (x.a || x.b); }).map(function (x) {
      var dates = [x.from, x.to || (x.from ? L.present : "")].filter(Boolean).join(" – ");
      var bl = qtCvBullets(x.notes);
      return '<div class="cv-item"><div class="cv-row"><b>' + e(x.a) + "</b>" + (dates ? '<span class="cv-date" dir="auto">' + e(dates) + "</span>" : "") + "</div>" +
        (x.b ? '<div class="cv-sub">' + e(x.b) + "</div>" : "") + (bl.length ? "<ul>" + bl.map(function (b) { return "<li>" + e(b) + "</li>"; }).join("") + "</ul>" : "") + "</div>";
    }).join("");
  };
  h += sec(L.exp, items(d.exp)); h += sec(L.edu, items(d.edu));
  var tags = function (s) { var a = String(s || "").split(/[,،\n]/).map(function (x) { return x.trim(); }).filter(Boolean); return a.length ? '<ul class="cv-tags">' + a.map(function (x) { return "<li>" + e(x) + "</li>"; }).join("") + "</ul>" : ""; };
  h += sec(L.skills, tags(d.skills)); h += sec(L.langs, tags(d.langs));
  var certs = qtCvBullets(d.certs); h += sec(L.certs, certs.length ? "<ul>" + certs.map(function (c) { return "<li>" + e(c) + "</li>"; }).join("") + "</ul>" : "");
  return h + "</div>";
}

(function () {
  if (typeof document === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  if (!$("cvForm")) return;
  var AR = (document.documentElement.lang || "").indexOf("ar") === 0, KEY = "qtCv";
  var T = AR ? { role: "المسمى الوظيفي", org: "الجهة / الشركة", deg: "الدرجة / التخصص", school: "الجامعة / المعهد", from: "من", to: "إلى (اتركه فارغًا إن كان حاليًا)", notes: "الإنجازات والمهام (سطر لكل نقطة)", remove: "حذف", saved: "✓ محفوظ على جهازك", cleared: "تم مسح البيانات", confirm: "سيتم مسح كل بيانات السيرة الذاتية من هذا الجهاز. متابعة؟", bad: "الملف غير صالح." }
             : { role: "Job title", org: "Company / organisation", deg: "Degree / major", school: "University / school", from: "From", to: "To (leave empty if current)", notes: "Achievements (one per line)", remove: "Remove", saved: "✓ Saved on this device", cleared: "Cleared", confirm: "This deletes the CV data stored on this device. Continue?", bad: "That file isn't a QuickTiny CV." };
  var SAMPLE = AR ? {
    lang: "ar", template: "classic", color: "#3b4cca", name: "سارة أحمد", title: "محللة بيانات", email: "sara@example.com", phone: "+966 5x xxx xxxx", city: "الرياض", link: "linkedin.com/in/example",
    summary: "محللة بيانات بخبرة 4 سنوات في تحويل البيانات إلى قرارات، أتقن SQL وPower BI وPython، وأحب تبسيط الأرقام لفرق العمل.",
    exp: [{ a: "محللة بيانات", b: "شركة مثال للتقنية", from: "2023", to: "", notes: "بناء لوحات Power BI يستخدمها 40 مديرًا أسبوعيًا\nخفض وقت التقارير الشهرية من 3 أيام إلى ساعتين" },
          { a: "محللة بيانات مبتدئة", b: "شركة مثال للتجزئة", from: "2021", to: "2023", notes: "تحليل مبيعات 120 فرعًا واقتراح تحسينات للمخزون" }],
    edu: [{ a: "بكالوريوس نظم المعلومات", b: "جامعة الملك سعود", from: "2017", to: "2021", notes: "المعدل 4.6 من 5" }],
    skills: "SQL، Power BI، Python، Excel المتقدم، عرض النتائج", langs: "العربية (اللغة الأم)، الإنجليزية (ممتاز)", certs: "Google Data Analytics Certificate — 2022" }
  : {
    lang: "en", template: "classic", color: "#3b4cca", name: "Sarah Ahmed", title: "Data Analyst", email: "sarah@example.com", phone: "+1 555 0100", city: "Dubai", link: "linkedin.com/in/example",
    summary: "Data analyst with 4 years of experience turning data into decisions. Strong in SQL, Power BI and Python, and good at making numbers simple for busy teams.",
    exp: [{ a: "Data Analyst", b: "Example Tech", from: "2023", to: "", notes: "Built Power BI dashboards used weekly by 40 managers\nCut monthly reporting from 3 days to 2 hours" },
          { a: "Junior Data Analyst", b: "Example Retail", from: "2021", to: "2023", notes: "Analysed sales for 120 stores and proposed stock improvements" }],
    edu: [{ a: "BSc Information Systems", b: "Example University", from: "2017", to: "2021", notes: "GPA 3.7 / 4.0" }],
    skills: "SQL, Power BI, Python, Advanced Excel, Presenting insights", langs: "English (native), Arabic (fluent)", certs: "Google Data Analytics Certificate — 2022" };
  var data;
  try { data = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
  if (!data || typeof data !== "object") data = JSON.parse(JSON.stringify(SAMPLE));
  var FIELDS = ["lang", "template", "color", "name", "title", "email", "phone", "city", "link", "summary", "skills", "langs", "certs"];
  function listEditor(kind, labels) {
    var box = $(kind === "exp" ? "cvExp" : "cvEdu"); box.innerHTML = "";
    (data[kind] || []).forEach(function (x, i) {
      var f = document.createElement("fieldset"); f.className = "cv-entry";
      var mk = function (k, label, tag) {
        var id = "cv_" + kind + i + k, w = document.createElement("div"); w.className = "cv-f" + (k === "notes" ? " cv-wide" : "");
        var lb = document.createElement("label"); lb.htmlFor = id; lb.textContent = label;
        var inp = document.createElement(tag || "input"); inp.id = id; if (!tag) inp.type = "text"; if (tag) inp.rows = 3; inp.value = x[k] || "";
        inp.addEventListener("input", function () { data[kind][i][k] = inp.value; save(); });
        w.appendChild(lb); w.appendChild(inp); f.appendChild(w);
      };
      mk("a", labels[0]); mk("b", labels[1]); mk("from", T.from); mk("to", T.to); mk("notes", T.notes, "textarea");
      var rm = document.createElement("button"); rm.type = "button"; rm.className = "btn btn-secondary cv-rm"; rm.textContent = T.remove;
      rm.addEventListener("click", function () { data[kind].splice(i, 1); listEditor(kind, labels); save(); });
      f.appendChild(rm); box.appendChild(f);
    });
  }
  function bind() {
    FIELDS.forEach(function (k) { var el = $("cv_" + k); if (!el) return; el.value = data[k] == null ? "" : data[k]; });
    listEditor("exp", [T.role, T.org]); listEditor("edu", [T.deg, T.school]);
    document.querySelectorAll("#cvTpl .chip").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-t") === data.template); });
  }
  var timer = null;
  function save() {
    render();
    clearTimeout(timer);
    timer = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(data)); $("cvStatus").textContent = T.saved; } catch (e) {} }, 300);
  }
  function render() { $("cvPreview").innerHTML = qtCvHtml(data); }
  FIELDS.forEach(function (k) { var el = $("cv_" + k); if (el) el.addEventListener("input", function () { data[k] = el.value; save(); }); });
  $("cv_lang").addEventListener("change", function () { data.lang = $("cv_lang").value; save(); });
  document.querySelectorAll("#cvTpl .chip").forEach(function (b) { b.addEventListener("click", function () { data.template = b.getAttribute("data-t"); bind(); save(); }); });
  $("cvAddExp").addEventListener("click", function () { (data.exp = data.exp || []).push({}); listEditor("exp", [T.role, T.org]); save(); });
  $("cvAddEdu").addEventListener("click", function () { (data.edu = data.edu || []).push({}); listEditor("edu", [T.deg, T.school]); save(); });
  $("cvPrint").addEventListener("click", function () {
    var old = document.title; document.title = (data.name || "CV").replace(/[\\/:*?"<>|]+/g, " ") + " — CV";
    if (typeof qtEvent === "function") qtEvent("cv_pdf");
    window.print();
    setTimeout(function () { document.title = old; }, 1000);
  });
  $("cvExport").addEventListener("click", function () {
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = "cv-quicktiny.json"; a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 3000);
  });
  $("cvImport").addEventListener("change", function () {
    var f = this.files[0]; if (!f) return;
    f.text().then(function (t) { var d = JSON.parse(t); if (!d || typeof d !== "object" || !("name" in d)) throw 0; data = d; bind(); save(); })
      .catch(function () { $("cvStatus").textContent = T.bad; });
    this.value = "";
  });
  $("cvReset").addEventListener("click", function () {
    if (!confirm(T.confirm)) return;
    try { localStorage.removeItem(KEY); } catch (e) {}
    data = { lang: AR ? "ar" : "en", template: "classic", color: "#3b4cca", exp: [{}], edu: [{}] }; bind(); render(); $("cvStatus").textContent = T.cleared;
  });
  $("cvSample").addEventListener("click", function () { data = JSON.parse(JSON.stringify(SAMPLE)); bind(); save(); });
  bind(); render();
})();

if (typeof module !== "undefined") module.exports = { qtCvHtml: qtCvHtml, qtCvBullets: qtCvBullets, qtCvEsc: qtCvEsc };
