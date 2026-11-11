# Writes the EN/AR bodies + style for the CV builder.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .cv-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:18px;align-items:start}
    @media(max-width:980px){.cv-grid{grid-template-columns:1fr}}
    .cv-form fieldset{border:1px solid var(--line);border-radius:16px;padding:12px 14px;margin:0 0 12px;background:var(--card)}
    .cv-form legend{font-weight:800;color:var(--text);padding:0 6px}
    .cv-fs{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px}
    @media(max-width:520px){.cv-fs{grid-template-columns:1fr}}
    .cv-f label,.cv-form .cv-lab{display:block;font-size:12.5px;font-weight:700;color:var(--muted);margin-bottom:3px}
    .cv-f input,.cv-f textarea,.cv-f select{margin:0}
    .cv-f textarea{min-height:64px;font-family:var(--font-ui);font-size:14px}
    .cv-wide{grid-column:1/-1}
    .cv-entry{display:grid;grid-template-columns:1fr 1fr;gap:8px 10px;background:transparent!important;border-style:dashed!important}
    @media(max-width:520px){.cv-entry{grid-template-columns:1fr}}
    .cv-rm{justify-self:start;padding:6px 12px;font-size:12.5px}
    .cv-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px}
    .cv-tools .btn{padding:9px 16px;font-size:14px}
    #cvTpl{display:inline-flex;gap:6px}
    #cvStatus{font-size:13px;color:var(--success);font-weight:700}
    .cv-sticky{position:sticky;top:80px}
    .cv-paper{background:#e9ebf3;border-radius:16px;padding:14px;overflow:auto;max-height:calc(100vh - 110px)}
    @media(max-width:980px){.cv-sticky{position:static}.cv-paper{max-height:none}}
    .cv-doc{background:#fff;color:#1d2030;width:100%;max-width:794px;min-height:1000px;margin:0 auto;padding:44px 48px;box-shadow:0 10px 30px -12px rgba(0,0,0,.35);border-radius:4px;
      font-family:"QT Arabic",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;font-size:13.5px;line-height:1.55}
    .cv-doc h1{margin:0;font-size:28px;line-height:1.2;color:#11131f;font-family:inherit;letter-spacing:0}
    .cv-title{margin:4px 0 0;font-size:15px;font-weight:700;color:var(--cv-accent)}
    .cv-contact{margin:8px 0 0;color:#4a4f66;font-size:12.5px;display:flex;flex-wrap:wrap;gap:4px 8px}
    .cv-contact i{font-style:normal;color:#b5b9cc}
    .cv-top{padding-bottom:12px;border-bottom:2px solid var(--cv-accent);margin-bottom:6px}
    .cv-sec h2{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--cv-accent);margin:16px 0 8px;font-family:inherit}
    .cv-doc[dir=rtl] .cv-sec h2{letter-spacing:0}
    .cv-sec p{margin:0;color:#2a2e45}
    .cv-item{margin-bottom:10px}
    .cv-row{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
    .cv-row b{font-size:14px;color:#11131f}
    .cv-date{color:#6b7090;font-size:12px;white-space:nowrap}
    .cv-sub{color:#4a4f66;font-weight:600}
    .cv-doc ul{margin:4px 0 0;padding-inline-start:18px}
    .cv-doc li{margin:2px 0;color:#2a2e45}
    .cv-tags{list-style:none;padding:0!important;display:flex;flex-wrap:wrap;gap:6px}
    .cv-tags li{background:#f1f2f8;border:1px solid #e1e3ee;border-radius:6px;padding:2px 9px;margin:0!important}
    /* Modern: coloured header band */
    .cv-modern .cv-top{background:var(--cv-accent);color:#fff;margin:-44px -48px 10px;padding:30px 48px 20px;border:0}
    .cv-modern h1{color:#fff}.cv-modern .cv-title{color:#fff;opacity:.92}.cv-modern .cv-contact{color:#fff;opacity:.9}.cv-modern .cv-contact i{color:#fff;opacity:.6}
    /* Compact: smaller type, two-column skills */
    .cv-compact{font-size:12.5px;padding:34px 38px}.cv-compact h1{font-size:24px}.cv-compact .cv-sec h2{margin-top:12px}
    @media(max-width:520px){.cv-doc{padding:26px 22px;min-height:0}.cv-modern .cv-top{margin:-26px -22px 10px;padding:22px}}
    @media print{
      @page{size:A4;margin:12mm}
      html,body{background:#fff!important}
      body>*:not(#main),#main>*:not(.tool-panel),.tool-panel>*:not(.cv-grid),.cv-grid>*:not(.cv-sticky){display:none!important}
      #main,.tool-panel,.cv-grid,.cv-sticky{display:block!important;position:static!important;margin:0!important;padding:0!important;border:0!important;background:none!important;box-shadow:none!important;backdrop-filter:none!important;max-width:none!important;width:auto!important}
      .cv-paper{background:none;padding:0;max-height:none;overflow:visible}
      .cv-doc{box-shadow:none;max-width:none;min-height:0;padding:0;border-radius:0}
      .cv-modern .cv-top{margin:0 0 10px;padding:18px 20px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .cv-tags li{-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .aurora,.grain,.site-header,footer,.qt-fb{display:none!important}
    }
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="CV Builder", b=("Career", "Runs in your browser", "Free"),
   h1="Free CV / Resume Builder — Arabic or English, PDF Download, No Sign-up",
   intro="Fill in the form and watch your CV take shape on the right. Choose an English or Arabic CV, pick a template and colour, then download a clean A4 PDF with real, selectable text that applicant tracking systems can read. No account, no watermark; your data stays in this browser.",
   lang="CV language", en="English", ar="Arabic", tpl="Template", tpls=("Classic", "Modern", "Compact"), color="Accent colour",
   pT="Personal details", name="Full name", title="Job title / headline", email="Email", phone="Phone", city="City", link="LinkedIn / website",
   sum="Summary", sumP="2–3 lines about your experience and what you're good at", expT="Experience", eduT="Education", add="+ Add", skills="Skills (comma-separated)", langs="Languages (comma-separated)", certs="Certifications (one per line)",
   pdf="Download PDF", sample="Load example", export="Save as file", import_="Open file", reset="Clear",
   tip="In the print window choose “Save as PDF”, paper size A4, and turn off “Headers and footers”.",
   howT="Tips for a CV that gets interviews",
   how=["<strong>One or two pages.</strong> Recruiters skim; put your strongest, most recent work first.",
        "<strong>Start bullets with a verb and a number:</strong> “Cut reporting time from 3 days to 2 hours” beats “Responsible for reports”.",
        "<strong>Match the job ad.</strong> Use the same skill names the posting uses so ATS filters find you.",
        "<strong>Skip the photo, age and marital status</strong> unless the employer or country expects them."],
   faqT="Frequently asked questions",
   faq=[("Is this CV builder really free?", "Yes — no account, no watermark, no paywall for the PDF."),
        ("Is the PDF ATS-friendly?", "Yes. The PDF contains real text in a simple one-column layout, which applicant tracking systems read well."),
        ("Where is my data stored?", "Only in this browser (localStorage). Use “Save as file” to keep a copy or move it to another device."),
        ("Can I make an Arabic CV?", "Yes — switch “CV language” to Arabic and the layout flips to right-to-left with Arabic headings.")],
   rel="More tools", links=[("/compress-image-to-kb", "Compress a photo to an exact size"), ("/pdf-tools", "PDF Tools"), ("/word-counter", "Word Counter"), ("/gpa-calculator", "GPA Calculator")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="صانع السيرة الذاتية", b=("وظائف", "تعمل داخل متصفحك", "مجانية"),
   h1="صانع السيرة الذاتية مجانًا — عربي أو إنجليزي، تحميل PDF بدون تسجيل",
   intro="املأ البيانات وشاهد سيرتك الذاتية تتشكل مباشرة. اختر سيرة بالعربي أو الإنجليزي، والقالب واللون، ثم حمّلها PDF بمقاس A4 بنص حقيقي قابل للتحديد تقرؤه أنظمة التوظيف (ATS). بدون حساب ولا علامة مائية، وبياناتك تبقى في متصفحك.",
   lang="لغة السيرة", en="الإنجليزية", ar="العربية", tpl="القالب", tpls=("كلاسيكي", "عصري", "مختصر"), color="لون القالب",
   pT="البيانات الشخصية", name="الاسم الكامل", title="المسمى الوظيفي", email="البريد الإلكتروني", phone="رقم الجوال", city="المدينة", link="LinkedIn أو موقعك",
   sum="نبذة مختصرة", sumP="سطران أو ثلاثة عن خبرتك وأهم ما تتقنه", expT="الخبرات العملية", eduT="التعليم", add="+ إضافة", skills="المهارات (افصل بفاصلة)", langs="اللغات (افصل بفاصلة)", certs="الشهادات والدورات (سطر لكل شهادة)",
   pdf="تحميل PDF", sample="تحميل مثال", export="حفظ كملف", import_="فتح ملف", reset="مسح",
   tip="في نافذة الطباعة اختر «حفظ بتنسيق PDF» ومقاس A4، وألغِ «الرؤوس والتذييلات».",
   howT="نصائح لسيرة ذاتية تحصل على مقابلات",
   how=["<strong>صفحة أو صفحتان فقط.</strong> مسؤول التوظيف يقرأ بسرعة؛ ضع أقوى وأحدث خبراتك أولًا.",
        "<strong>ابدأ كل نقطة بفعل ورقم:</strong> «خفضت وقت التقارير من 3 أيام إلى ساعتين» أقوى من «مسؤول عن التقارير».",
        "<strong>طابق الإعلان الوظيفي:</strong> استخدم نفس أسماء المهارات المذكورة في الإعلان حتى تلتقطك أنظمة الفرز الآلي.",
        "<strong>الصورة والعمر والحالة الاجتماعية</strong> لا تضعها إلا إذا طلبها صاحب العمل أو كانت عادة في بلدك."],
   faqT="أسئلة شائعة",
   faq=[("هل صانع السيرة الذاتية مجاني فعلًا؟", "نعم، بدون حساب ولا علامة مائية ولا دفع لتحميل PDF."),
        ("هل ملف PDF متوافق مع أنظمة التوظيف ATS؟", "نعم، الملف نص حقيقي بتنسيق بسيط من عمود واحد تقرؤه أنظمة الفرز الآلي بسهولة."),
        ("أين تُحفظ بياناتي؟", "في متصفحك فقط. استخدم «حفظ كملف» لتحتفظ بنسخة أو تنقلها لجهاز آخر."),
        ("هل أستطيع عمل سيرة ذاتية بالإنجليزي من هذه الصفحة؟", "نعم، غيّر «لغة السيرة» إلى الإنجليزية فتصبح العناوين إنجليزية والاتجاه من اليسار لليمين.")],
   rel="أدوات أخرى", links=[("/ar/compress-image-to-kb", "تصغير الصورة لحجم معين"), ("/ar/pdf-tools", "أدوات PDF"), ("/ar/word-counter", "عداد الكلمات"), ("/ar/gpa-calculator", "حساب المعدل التراكمي")]),
}
def body(L, ar):
    t = T[L]
    f = lambda k, label, wide=False, tag="input", ph="": '<div class="cv-f%s"><label for="cv_%s">%s</label>%s</div>' % (" cv-wide" if wide else "", k, label,
          ('<textarea id="cv_%s" rows="3"%s></textarea>' % (k, ' placeholder="%s"' % ph if ph else "")) if tag == "textarea" else '<input type="text" id="cv_%s"%s>' % (k, ' dir="auto"' if k in ("email", "phone", "link") else ""))
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="cv-tools">\n'
    s += '      <button type="button" class="btn" id="cvPrint">%s</button>\n' % t["pdf"]
    s += '      <span id="cvTpl" role="group" aria-label="%s"><button type="button" class="chip" data-t="classic">%s</button><button type="button" class="chip" data-t="modern">%s</button><button type="button" class="chip" data-t="compact">%s</button></span>\n' % (t["tpl"], *t["tpls"])
    s += '      <button type="button" class="btn btn-secondary" id="cvSample">%s</button><button type="button" class="btn btn-secondary" id="cvExport">%s</button>\n' % (t["sample"], t["export"])
    s += '      <label class="btn btn-secondary" for="cvImport" style="cursor:pointer">%s</label><input type="file" id="cvImport" accept="application/json,.json" class="sr-only">\n' % t["import_"]
    s += '      <button type="button" class="btn btn-secondary" id="cvReset">%s</button> <span id="cvStatus" role="status"></span>\n    </div>\n' % t["reset"]
    s += '    <p class="privacy-note" style="margin:0 0 12px">%s</p>\n' % t["tip"]
    s += '    <div class="cv-grid">\n      <form class="cv-form" id="cvForm" onsubmit="return false">\n'
    s += ('        <fieldset><legend>%s</legend><div class="cv-fs">%s%s'
          '<div class="cv-f"><label for="cv_lang">%s</label><select id="cv_lang"><option value="ar">%s</option><option value="en">%s</option></select></div>'
          '<div class="cv-f"><label for="cv_color">%s</label><input type="color" id="cv_color" style="height:42px;padding:4px"></div>'
          '%s%s%s%s</div></fieldset>\n') % (t["pT"], f("name", t["name"]), f("title", t["title"]), t["lang"], t["ar"], t["en"], t["color"], f("email", t["email"]), f("phone", t["phone"]), f("city", t["city"]), f("link", t["link"]))
    s += '        <fieldset><legend>%s</legend>%s</fieldset>\n' % (t["sum"], f("summary", t["sum"], True, "textarea", t["sumP"]))
    s += '        <fieldset><legend>%s</legend><div id="cvExp"></div><button type="button" class="btn btn-secondary" id="cvAddExp">%s</button></fieldset>\n' % (t["expT"], t["add"])
    s += '        <fieldset><legend>%s</legend><div id="cvEdu"></div><button type="button" class="btn btn-secondary" id="cvAddEdu">%s</button></fieldset>\n' % (t["eduT"], t["add"])
    s += '        <fieldset><legend>%s</legend><div class="cv-fs">%s%s%s</div></fieldset>\n' % (t["skills"].split(" (")[0], f("skills", t["skills"], True, "textarea"), f("langs", t["langs"], True, "textarea"), f("certs", t["certs"], True, "textarea"))
    s += '      </form>\n      <div class="cv-sticky"><div class="cv-paper" tabindex="0" role="region" aria-label="%s"><div id="cvPreview" aria-live="polite"></div></div></div>\n    </div>\n  </div>\n  <script src="/cv.js"></script>\n\n' % ("معاينة السيرة الذاتية" if ar else "CV preview")
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("cv_style.html", STYLE); w("cv_en.html", body("en", False)); w("cv_ar.html", body("ar", True))
print("bodies written")
