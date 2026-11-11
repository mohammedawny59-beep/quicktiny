# Writes the EN/AR bodies + style for image to text (OCR).
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .oc-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px;align-items:start}
    @media(max-width:860px){.oc-grid{grid-template-columns:1fr}}
    .oc-top{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
    .oc-top label{font-weight:700;color:var(--text-dim)}
    .oc-top select{width:auto;margin:0}
    #ocrImg{display:block;max-width:100%;max-height:420px;margin:12px auto 0;border-radius:12px;border:1px solid var(--line)}
    .oc-bar{height:8px;border-radius:999px;background:var(--card);overflow:hidden;margin:8px 0}
    .oc-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan));transition:width .3s}
    #ocrStatus{font-weight:700;color:var(--text-dim);min-height:1.4em}
    #ocrOut{min-height:300px;font-family:var(--font-ui);font-size:15.5px;line-height:1.8;margin:0}
    .oc-meta{font-size:13px;color:var(--muted);margin:6px 0 10px}
    .oc-actions{display:flex;gap:8px;flex-wrap:wrap}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Image to Text (OCR)", b=("Text", "Runs in your browser", "Free"),
   h1="Image to Text — Free OCR for Arabic &amp; English",
   intro="Extract text from photos, screenshots and scanned documents in Arabic or English. Drop an image or paste a screenshot, then copy or download the text. The image never leaves your device.",
   lang="Text language", la="Arabic", le="English", lb="Arabic + English", drop="<strong>Drop an image here</strong> or click to choose — you can also paste a screenshot (Ctrl+V)",
   dropS="JPG, PNG, WebP · first use downloads the reader (~4 MB) once", outL="Extracted text", copy="Copy text", txt="Download .txt",
   howT="Tips for accurate results",
   how=["Use a sharp, well-lit photo with the text straight (not at an angle). Screenshots give the best results.",
        "Pick the right language. Choose <strong>Arabic + English</strong> only when both appear, as it's a little slower.",
        "Crop to the text you need. Busy backgrounds, stamps and handwriting reduce accuracy.",
        "Always proof-read: OCR can confuse similar letters, especially in small or stylised fonts."],
   faqT="Frequently asked questions",
   faq=[("Is the image uploaded?", "No. Recognition runs entirely in your browser with the open-source Tesseract engine."),
        ("Does it read handwriting?", "Printed text works best; handwriting is usually not recognised reliably."),
        ("Can it read PDFs?", "Convert the PDF page to an image first with PDF to JPG, then drop the image here."),
        ("Why is the first run slow?", "The engine and language data (a few MB) download once and are then cached by your browser.")],
   rel="More text and image tools", links=[("/pdf-to-jpg", "PDF to JPG"), ("/word-counter", "Word Counter"), ("/clean-text", "Clean Text"), ("/image-converter", "Image Converter")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="استخراج النص من الصور", b=("نصوص", "تعمل داخل متصفحك", "مجانية"),
   h1="استخراج النص من الصور — تحويل الصورة إلى نص عربي وإنجليزي مجانًا",
   intro="حوّل الصور ولقطات الشاشة والمستندات الممسوحة إلى نص قابل للنسخ بالعربي أو الإنجليزي. اسحب الصورة أو الصق لقطة شاشة، ثم انسخ النص أو نزّله. الصورة لا تغادر جهازك.",
   lang="لغة النص", la="العربية", le="الإنجليزية", lb="العربية + الإنجليزية", drop="<strong>اسحب الصورة إلى هنا</strong> أو اضغط للاختيار — أو الصق لقطة شاشة (Ctrl+V)",
   dropS="JPG أو PNG أو WebP · أول استخدام يحمّل محرك القراءة (~4 ميجا) مرة واحدة", outL="النص المستخرج", copy="نسخ النص", txt="تنزيل ملف نصي",
   howT="نصائح لنتيجة أدق",
   how=["استخدم صورة واضحة وجيدة الإضاءة والنص فيها مستقيم. لقطات الشاشة تعطي أفضل نتيجة.",
        "اختر اللغة الصحيحة، ولا تختر <strong>العربية + الإنجليزية</strong> إلا إذا وُجدت اللغتان، لأنها أبطأ قليلًا.",
        "قصّ الصورة على النص المطلوب؛ الخلفيات المزدحمة والأختام والخط اليدوي تقلل الدقة.",
        "راجع النص دائمًا: قد يخلط القارئ الآلي بين الحروف المتشابهة، خاصة في الخطوط الصغيرة أو المزخرفة."],
   faqT="أسئلة شائعة",
   faq=[("هل تُرفع الصورة إلى الإنترنت؟", "لا، القراءة تتم بالكامل داخل متصفحك بمحرك Tesseract مفتوح المصدر."),
        ("هل يقرأ الخط اليدوي؟", "يعمل أفضل مع النص المطبوع؛ الخط اليدوي غالبًا لا يُقرأ بدقة."),
        ("هل يقرأ ملفات PDF؟", "حوّل صفحة PDF إلى صورة أولًا بأداة PDF إلى صور، ثم اسحب الصورة هنا."),
        ("لماذا أول مرة أبطأ؟", "يحمّل المتصفح محرك القراءة وبيانات اللغة (بضعة ميجابايت) مرة واحدة ثم يحتفظ بها.")],
   rel="أدوات أخرى للنصوص والصور", links=[("/ar/pdf-to-jpg", "تحويل PDF إلى صور"), ("/ar/word-counter", "عداد الكلمات"), ("/ar/arabic-text-tools", "أدوات النص العربي"), ("/ar/image-converter", "تحويل صيغ الصور")]),
}
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += ('  <div class="tool-panel" id="tool">\n    <div class="oc-top"><label for="ocrLang">%s</label><select id="ocrLang"><option value="%s">%s</option><option value="%s">%s</option><option value="ara+eng">%s</option></select></div>\n'
          '    <div class="oc-grid">\n      <div>\n        <div class="dropzone" id="ocrDrop" tabindex="0" role="button">%s<br><span style="font-size:13px">%s</span></div>\n'
          '        <input id="ocrFile" type="file" accept="image/*" class="sr-only" tabindex="-1" aria-label="%s">\n        <img id="ocrImg" alt="" hidden>\n      </div>\n'
          '      <div>\n        <div id="ocrStatus" role="status"></div>\n        <div class="oc-bar" id="ocrBar" hidden><i id="ocrBarFill"></i></div>\n'
          '        <label for="ocrOut" class="sr-only">%s</label><textarea id="ocrOut" dir="auto" placeholder="%s"></textarea>\n        <div class="oc-meta" id="ocrMeta"></div>\n'
          '        <div class="oc-actions"><button type="button" class="btn" id="ocrCopy" disabled>%s</button><button type="button" class="btn btn-secondary" id="ocrTxt" disabled>%s</button></div>\n'
          '        <div id="ocrCopyStatus" class="result" aria-live="polite"></div>\n      </div>\n    </div>\n  </div>\n  <script src="/ocr.js"></script>\n\n'
          ) % (t["lang"], "ara" if ar else "eng", t["la"] if ar else t["le"], "eng" if ar else "ara", t["le"] if ar else t["la"], t["lb"], t["drop"], t["dropS"], t["crumb"], t["outL"], t["outL"], t["copy"], t["txt"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("oc_style.html", STYLE); w("oc_en.html", body("en", False)); w("oc_ar.html", body("ar", True))
print("bodies written")
