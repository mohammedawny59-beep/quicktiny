# Generates landing specs for "compress image to N KB" searches (EN + AR). Run, then feed to tools/landing.py.
import json, io, os
here = os.path.dirname(os.path.abspath(__file__))
EN = {
 20: ("signatures and exam application photos", "Many exam and recruitment portals cap scanned signatures at 10–20 KB and photos at 20–50 KB. At 20 KB the image is scaled to roughly 300–400 px wide so text and faces stay readable."),
 50: ("passport-size photos and job portals", "50 KB is a common limit for passport-size photos on job, university and government portals. Most photos fit at their original size with slightly lower quality, or at about 600 px wide."),
 100: ("government, university and visa forms", "“Under 100 KB” is the most common photo limit on application forms. A typical phone photo fits at around 800–1000 px wide with good quality."),
 200: ("visa applications and ID uploads", "200 KB keeps photos sharp enough for ID checks — usually 1200–1600 px wide — while staying under the limit of most visa and identity portals."),
 500: ("email, listings and website uploads", "500 KB is a sweet spot for email attachments, marketplace listings and CMS uploads: full-HD photos with no visible quality loss."),
 1000: ("upload limits like “max 1 MB”", "Lots of sites cap uploads at 1 MB. Most phone photos fit at full resolution with high quality, so you lose almost nothing."),
}
AR = {
 50: ("صور الهوية الشخصية ومنصات التوظيف", "50 كيلوبايت حدّ شائع لصور الهوية في منصات التوظيف والجامعات. أغلب الصور تناسبه بجودة أقل قليلًا أو بعرض 600 بكسل تقريبًا."),
 100: ("المنصات الحكومية والجامعات والتأشيرات", "«ألا يزيد حجم الصورة عن 100 كيلوبايت» هو أكثر شرط شائع في نماذج التقديم. صورة الجوال المعتادة تناسبه بعرض 800–1000 بكسل وبجودة جيدة."),
 200: ("طلبات التأشيرة ورفع الهويات", "200 كيلوبايت تُبقي الصورة واضحة لفحص الهوية — بعرض 1200–1600 بكسل عادة — وتبقى ضمن حدود أغلب منصات التأشيرات."),
}
def label(k): return ("%d KB" % k) if k < 1000 else "%g MB" % (k / 1000)
def slug(k): return ("compress-image-to-%dkb" % k) if k < 1000 else "compress-image-to-%dmb" % (k // 1000)
en, ar = [], []
for k, (use, why) in EN.items():
    L = label(k)
    p = {"base": "compress-image-to-kb", "slug": slug(k), "preset": {"kb": k}, "crumb": "Compress to " + L,
         "title": "Compress Image to %s Online — Free, Best Quality | QuickTiny" % L,
         "desc": "Reduce a photo to under %s for %s. Finds the best quality that fits, keeps proportions, works on many photos at once. No upload, no sign-up." % (L, use),
         "h1": "Compress Image to %s" % L,
         "intro": "Need a photo under %s for %s? Drop it here — the tool finds the highest quality that fits under %s and keeps the proportions. Everything happens in your browser." % (L, use, L),
         "about": "<h2>Why %s?</h2><p>%s</p><h2>Steps</h2><ol><li>The size is already set to %s.</li><li>Drop one or more photos (JPG, PNG, WebP).</li><li>Download each photo or all of them as a ZIP — every file is guaranteed to be under %s.</li></ol>" % (L, why, L, L),
         "faq": [["Is the result really under %s?" % L, "Yes. %s is treated as %s bytes, which is under the limit whether a site counts 1,000 or 1,024 bytes per KB." % (L, format(k * 1000, ","))],
                 ["Does it work on my phone?", "Yes — it runs in mobile browsers, and photos never leave your device."]]}
    if k in AR: p["alts"] = {"ar": "ar/" + slug(k)}
    en.append(p)
for k, (use, why) in AR.items():
    L = "%d كيلوبايت" % k
    ar.append({"base": "ar/compress-image-to-kb", "slug": "ar/" + slug(k), "preset": {"kb": k}, "crumb": "تصغير الصورة إلى " + L,
               "title": "تصغير حجم الصورة إلى %s — مجانًا وبأفضل جودة | QuickTiny" % L,
               "desc": "صغّر حجم الصورة إلى أقل من %s لـ%s. أعلى جودة ممكنة ضمن الحد مع الحفاظ على التناسب، لعدة صور مرة واحدة. بدون رفع وبدون تسجيل." % (L, use),
               "h1": "تصغير حجم الصورة إلى %s" % L,
               "intro": "تحتاج صورة أقل من %s لـ%s؟ اسحبها هنا، وستحصل على أعلى جودة ممكنة ضمن الحد مع الحفاظ على تناسب الصورة — كل شيء داخل متصفحك." % (L, use),
               "about": "<h2>لماذا %s؟</h2><p>%s</p><h2>الخطوات</h2><ol><li>الحجم مضبوط مسبقًا على %s.</li><li>اسحب صورة أو أكثر (JPG أو PNG أو WebP).</li><li>نزّل كل صورة أو الكل في ملف ZIP — كل ملف مضمون أقل من %s.</li></ol>" % (L, why, L, L),
               "faq": [["هل الناتج فعلًا أقل من %s؟" % L, "نعم، نعتبر %s = %s بايت، فيبقى أقل من الحد مهما كانت طريقة المنصة في الحساب." % (L, format(k * 1000, ","))],
                       ["هل تعمل على الجوال؟", "نعم، تعمل في متصفح الجوال والصور لا تغادر جهازك."]],
               "alts": {"en": slug(k)}})
io.open(os.path.join(here, "landing_size_en.json"), "w", encoding="utf-8").write(json.dumps(en, ensure_ascii=False, indent=1))
io.open(os.path.join(here, "landing_size_ar.json"), "w", encoding="utf-8").write(json.dumps(ar, ensure_ascii=False, indent=1))
print(len(en), "EN +", len(ar), "AR specs")
