import io, sys, os
P = sys.argv[1]
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
JUMP = '<svg class="jump-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'
T = {
 "en": dict(home="/", homeL="Home", crumb="Compress Image to KB", sw="", badges=("Image", "Nothing uploaded", "Free"),
  h1="Compress Image to a Specific Size — 20 KB, 50 KB, 100 KB, 200 KB",
  p="Upload forms for jobs, exams, visas and government portals often say “photo must be under 100 KB”. Pick the size, drop your photos, and get the sharpest image that still fits — in your browser, without uploading anything.",
  jump="Compress now", drop="<strong>Drop photos here</strong> or click to choose — you can also paste", dropsub="JPG, PNG, WebP, GIF · many at once",
  lblT="Maximum file size", lblFmt="Format", lblW="Max width (optional, px)", lblH="Max height (optional, px)",
  zip="Download all (ZIP)", redo="Run again with new size", clear="Clear", strings="",
  content="""    <h2>How it works</h2>
    <ul class="benefits">
      <li><strong>Best quality that fits</strong> — it searches for the highest JPEG quality under your limit instead of guessing, so your photo stays as sharp as possible.</li>
      <li><strong>Shrinks only when needed</strong> — if a photo can't fit even at lower quality, it's scaled down step by step, keeping its proportions.</li>
      <li><strong>Safe for every form</strong> — “100 KB” is treated as 100,000 bytes, so the file is under the limit whether the site counts 1,000 or 1,024 bytes per KB.</li>
      <li><strong>Private</strong> — ID photos and documents never leave your device.</li>
    </ul>
    <h2>Common size limits</h2>
    <ul class="benefits">
      <li><span>Passport and visa photos on many portals: 50–240 KB.</span></li>
      <li><span>Job and exam applications: often 20–100 KB for photos and 10–50 KB for signatures.</span></li>
      <li><span>Email-friendly photos: 200–500 KB.</span></li>
    </ul>
    <h2>Frequently asked questions</h2>
    <details class="faq-item"><summary>Will my photo look bad at 20 KB?</summary><p>It's scaled to a smaller size so it stays clear — a 20 KB photo is usually around 300–450 px wide, which is what most forms expect anyway.</p></details>
    <details class="faq-item"><summary>The form also needs exact dimensions — what do I do?</summary><p>Fill in max width and height (for example 200 × 230). The photo is fitted inside that box first, then compressed to the size limit.</p></details>
    <details class="faq-item"><summary>Can I compress a PDF to 100 KB?</summary><p>Use <a href="/compress-pdf">Compress PDF</a> — it works best on scanned documents.</p></details>""",
  related=[("/image-converter", "Image Converter"), ("/compress-image", "Image Compressor"), ("/compress-pdf", "Compress PDF"), ("/resize-image", "Resize Image")], relT="More image tools"),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="ضغط الصورة إلى حجم معين", sw="<!--LANG-SWITCH-->\n", badges=("صور", "بدون رفع", "مجاني"),
  h1="ضغط الصورة إلى حجم معين — 20 أو 50 أو 100 أو 200 كيلوبايت",
  p="منصات التوظيف والجامعات والتأشيرات والخدمات الحكومية تطلب غالبًا «ألا يزيد حجم الصورة عن 100 كيلوبايت». اختر الحجم واسحب صورك لتحصل على أوضح صورة ممكنة ضمن الحد — داخل متصفحك وبدون رفع.",
  jump="اضغط الآن", drop="<strong>اسحب الصور هنا</strong> أو اضغط للاختيار — ويمكنك اللصق", dropsub="JPG وPNG وWebP وGIF · عدة صور مرة واحدة",
  lblT="أقصى حجم للملف", lblFmt="الصيغة", lblW="أقصى عرض (اختياري، بكسل)", lblH="أقصى ارتفاع (اختياري، بكسل)",
  zip="تنزيل الكل (ZIP)", redo="أعد بحجم جديد", clear="مسح",
  strings='  <script>window.QT_STRINGS = {waiting:"بالانتظار…",working:"نبحث عن أفضل جودة ضمن الحد…",download:"تنزيل",under:"أقل من",quality:"الجودة",already:"حجمها مناسب أصلًا — لم تتغير",cannot:"تعذّر تصغير الصورة إلى هذا الحجم — جرّب حدًا أكبر.",cantRead:"المتصفح لا يستطيع قراءة الملف كصورة (HEIC؟ حوّله إلى JPG أولًا)."};</script>\n',
  content="""    <h2>كيف تعمل الأداة؟</h2>
    <ul class="benefits">
      <li><strong>أفضل جودة ضمن الحد</strong> — تبحث عن أعلى جودة ممكنة تحت الحجم المطلوب بدل التخمين، فتبقى الصورة واضحة قدر الإمكان.</li>
      <li><strong>تصغّر الأبعاد عند الحاجة فقط</strong> — إذا لم تكفِ الجودة الأقل تُصغّر الصورة تدريجيًا مع الحفاظ على تناسبها.</li>
      <li><strong>مقبولة في كل المنصات</strong> — نعتبر 100 كيلوبايت = 100,000 بايت، فيبقى الملف تحت الحد مهما كانت طريقة المنصة في الحساب.</li>
      <li><strong>خصوصية</strong> — صور الهوية والمستندات لا تغادر جهازك.</li>
    </ul>
    <h2>أسئلة شائعة</h2>
    <details class="faq-item"><summary>كيف أصغّر حجم الصورة إلى 100 كيلوبايت؟</summary><p>اختر 100 KB، واسحب الصورة، ونزّل الناتج — يظهر لك الحجم النهائي والجودة والأبعاد.</p></details>
    <details class="faq-item"><summary>المنصة تطلب أبعادًا محددة أيضًا، ماذا أفعل؟</summary><p>اكتب أقصى عرض وارتفاع (مثل 200 × 230)، فتُوضع الصورة داخل هذه الأبعاد أولًا ثم تُضغط إلى الحجم المطلوب.</p></details>
    <details class="faq-item"><summary>كيف أضغط ملف PDF؟</summary><p>استخدم <a href="/ar/compress-pdf">ضغط ملف PDF</a> — مناسب للمستندات الممسوحة ضوئيًا.</p></details>""",
  related=[("/ar/image-converter", "تحويل صيغ الصور"), ("/ar/compress-image", "ضغط الصور"), ("/ar/compress-pdf", "ضغط ملف PDF")], relT="أدوات صور أخرى"),
}
for lang, t in T.items():
    presets = "".join('<button type="button" class="chip%s" data-kb="%d">%s</button>' % (" active" if k == 100 else "", k, ("%d KB" % k) if k < 1000 else "%g MB" % (k / 1000)) for k in (20, 50, 100, 150, 200, 300, 500, 1000, 2000))
    rel = "".join('      <a href="%s">%s%s</a>\n' % (u, n, GO) for u, n in t["related"])
    b = f"""<div class="wrap">
  <div class="breadcrumb"><a href="{t['home']}">{t['homeL']}</a> <span>/</span><span style="color:var(--text-dim)">{t['crumb']}</span></div>
{t['sw']}  <section class="hero compact">
    <div class="hero-badges">
      <span class="badge">{t['badges'][0]}</span>
      <span class="badge local">{LOCK}{t['badges'][1]}</span>
      <span class="badge">{t['badges'][2]}</span>
    </div>
    <h1>{t['h1']}</h1>
    <p>{t['p']}</p>
    <a href="#tool" class="jump-to-tool">{t['jump']} {JUMP}</a>
  </section>

  <div class="tool-panel" id="tool">
    <div class="ts-target">
      <div><label class="field-label" for="tsKb">{t['lblT']}</label><input type="text" inputmode="decimal" id="tsKb" value="100"></div>
      <div><label class="field-label" for="tsUnit">KB / MB</label><select id="tsUnit"><option value="kb">KB</option><option value="mb">MB</option></select></div>
      <div><label class="field-label" for="tsFormat">{t['lblFmt']}</label><select id="tsFormat"><option value="jpg">JPG</option><option value="webp">WebP</option></select></div>
      <div><label class="field-label" for="tsMaxW">{t['lblW']}</label><input type="number" id="tsMaxW" min="1" style="width:130px"></div>
      <div><label class="field-label" for="tsMaxH">{t['lblH']}</label><input type="number" id="tsMaxH" min="1" style="width:130px"></div>
    </div>
    <div id="tsPresets">{presets}</div>
    <div class="dropzone" id="tsDrop" tabindex="0" role="button" style="margin-top:16px">
      {t['drop']}<br><span style="font-size:13px">{t['dropsub']}</span>
    </div>
    <input id="tsFile" type="file" accept="image/*" multiple class="sr-only" tabindex="-1" aria-label="file">
    <ul id="tsList" aria-live="polite"></ul>
    <div id="tsBar" hidden>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn" type="button" id="tsZip" disabled>{t['zip']}</button>
        <button class="btn btn-secondary" type="button" id="tsRedo">{t['redo']}</button>
        <button class="btn btn-secondary" type="button" id="tsClear">{t['clear']}</button>
      </div>
    </div>
  </div>
{t['strings']}  <script src="/qt-zip.js"></script>
  <script src="/target-size.js"></script>

  <div class="content">
{t['content']}
  </div>

  <div class="section related-section">
    <h2 class="related-title">{t['relT']}</h2>
    <div class="related-grid">
{rel}    </div>
  </div>
</div>
"""
    io.open(os.path.join(P, "ts_body_%s.html" % lang), "w", encoding="utf-8", newline="\n").write(b)
print("bodies written")
