# Creator hub: a "Creator Studio" strip on both homepages (looping previews of the four video studios), the shared CSS,
# the autoplay-when-visible script, and the bodies for /creator-studio and /ar/creator-studio.
# Idempotent: re-running replaces the marked blocks.  usage: creator_hub.py <repo>
import io, os, re, sys
root = sys.argv[1]; os.chdir(root)
def rd(p): return io.open(p, encoding="utf-8").read()
def wr(p, s, nl=""): io.open(p, "w", encoding="utf-8", newline=nl).write(s)
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

STUDIOS = {
 "en": [("captions", "/animated-captions", "Animated Captions", "Word-by-word captions for Reels &amp; TikTok, from your script or an .srt.",
         ["Pop, highlight box, karaoke &amp; one-word styles", "Upload .srt from CapCut and keep the timing", "Arabic captions run right-to-left"]),
        ("paper", "/paper-animation", "Paper Motion Studio", "Newspaper, cut-out letters, typewriter, receipts and sticky notes.",
         ["8 paper-craft animation styles", "Add your own photo as a sticker", "Arabic letters cut out the right way"]),
        ("glass", "/glass-slides", "Glass Slides", "Liquid-glass slide videos with springy transitions at 60 fps.",
         ["Frosted glass over moving colour or your photo", "Line-by-line text reveal", "Silky 60 fps MP4"]),
        ("titles", "/motion-titles", "Motion Titles", "Lower thirds, subscribe button, big titles and countdowns.",
         ["Green-screen overlays for any editor", "Your colour, your text", "16:9, 9:16 and 1:1"])],
 "ar": [("captions", "/ar/animated-captions", "الترجمة المتحركة", "كابشن كلمة بكلمة للريلز والتيك توك من نصك أو ملف SRT.",
         ["تكبير، مربع ملوّن، كاريوكي وكلمة كلمة", "ارفع ملف SRT من كاب كت وحافظ على التوقيت", "الترجمة العربية من اليمين لليسار"]),
        ("paper", "/ar/paper-animation", "استوديو أنيميشن الورق", "جرائد، حروف مقصوصة، آلة كاتبة، فواتير وأوراق لاصقة.",
         ["8 أنماط أنيميشن ورقية", "أضف صورتك كملصق", "حروف عربية مقصوصة بشكل صحيح"]),
        ("glass", "/ar/glass-slides", "سلايدات زجاجية", "فيديو سلايدات بتصميم الزجاج الشفاف وانتقالات ناعمة 60 إطارًا.",
         ["زجاج شفاف فوق ألوان متحركة أو صورتك", "النص يظهر سطرًا سطرًا", "MP4 بسلاسة 60 إطارًا"]),
        ("titles", "/ar/motion-titles", "العناوين المتحركة", "شريط الاسم، زر الاشتراك، عنوان كبير وعد تنازلي.",
         ["عناصر بشاشة خضراء لأي برنامج مونتاج", "لونك ونصك", "16:9 و9:16 و1:1"])],
}
L = {
 "en": dict(kick="New · Creator Studio", h="Make videos that stop the scroll", sub="Four free video studios that run in your browser — captions, paper animation, glass slides and motion titles. MP4 in seconds, no watermark, nothing uploaded.",
            all="See the Creator Studio", open="Open studio"),
 "ar": dict(kick="جديد · استوديو صناع المحتوى", h="فيديوهات توقف السكرول", sub="أربعة استوديوهات فيديو مجانية تعمل داخل متصفحك — ترجمة متحركة، أنيميشن الورق، سلايدات زجاجية وعناوين متحركة. MP4 خلال ثوانٍ، بدون علامة مائية ولا يُرفع شيء.",
            all="افتح استوديو صناع المحتوى", open="افتح الاستوديو"),
}
def card(lang, key, href, name, desc, feats=None, eager=False):
    f = ""
    if feats: f = '<ul class="ch-feats">' + "".join("<li>%s</li>" % x for x in feats) + "</ul>"
    return ('      <a class="ch-card" href="%s">\n        <span class="ch-phone"><video src="/assets/previews/%s-%s.mp4" poster="/assets/previews/%s-%s.jpg" muted loop playsinline preload="none" data-qt-autoplay aria-hidden="true" width="360" height="640"></video></span>\n'
            '        <h3>%s</h3>\n        <p>%s</p>%s\n        <span class="go">%s %s</span>\n      </a>\n') % (href, key, lang, key, lang, name, desc, f, L[lang]["open"], GO)
EXTRA = {
 "en": [("/add-subtitles-to-video", "🎙️", "Auto Subtitles", "Your speech becomes animated captions on your video — on-device AI.", "AI · New"),
        ("/youtube-thumbnail-maker", "🖼️", "YouTube Thumbnail Maker", "Photo cut-out, huge outlined title and themes — 1280×720.", "New")],
 "ar": [("/ar/add-subtitles-to-video", "🎙️", "ترجمة الفيديو تلقائيًا", "كلامك يتحوّل لكابشن متحرك على فيديوك — ذكاء اصطناعي على جهازك.", "ذكاء اصطناعي · جديد"),
        ("/ar/youtube-thumbnail-maker", "🖼️", "صانع صورة اليوتيوب المصغّرة", "صورتك بدون خلفية وعنوان عريض وألوان — 1280×720.", "جديد")],
}
def more(lang):
    return '    <div class="ch-more">\n' + "".join('      <a class="ch-wide" href="%s"><span class="ch-emo" aria-hidden="true">%s</span><span><b>%s <i>%s</i></b><span>%s</span></span>%s</a>\n' % (h, e, n, tag, d, GO) for h, e, n, d, tag in EXTRA[lang]) + "    </div>\n"
def strip(lang):
    t = L[lang]; hub = "/creator-studio" if lang == "en" else "/ar/creator-studio"
    return ('  <!--CREATOR-HUB-->\n  <section class="section ch" id="creator-studio" aria-labelledby="chTitle">\n    <div class="section-head"><div><span class="ch-kick">%s</span><h2 class="section-title" id="chTitle">%s</h2><p class="section-sub">%s</p></div></div>\n'
            '    <div class="ch-grid">\n%s    </div>\n%s    <p class="ch-all"><a class="btn" href="%s">%s %s</a></p>\n  </section>\n  <!--/CREATOR-HUB-->\n\n') % (
            t["kick"], t["h"], t["sub"], "".join(card(lang, k, h, n, d) for k, h, n, d, _ in STUDIOS[lang]), more(lang), hub, t["all"], GO)

for page, lang in (("index.html", "en"), ("ar.html", "ar")):
    s = rd(page)
    s = re.sub(r"  <!--CREATOR-HUB-->.*?<!--/CREATOR-HUB-->\n\n", "", s, flags=re.S)
    anchor = '  <section class="section" id="tools">'
    assert anchor in s, page
    s = s.replace(anchor, strip(lang) + anchor, 1)
    wr(page, s)

CSS = """/* creator-hub */
.ch-kick{display:inline-block;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--cyan);margin-bottom:6px}
html[lang=ar] .ch-kick{letter-spacing:0}
.ch-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
@media(max-width:900px){.ch-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ch-card{display:flex;flex-direction:column;text-decoration:none;color:inherit;border-radius:22px;padding:10px 10px 14px;background:var(--card);border:1px solid var(--line);transition:transform .25s,border-color .25s,box-shadow .25s}
.ch-card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 24px 50px -30px rgba(91,91,255,.8)}
.ch-card:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.ch-phone{display:block;aspect-ratio:9/16;border-radius:16px;overflow:hidden;background:#151a2c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
.ch-phone video{display:block;width:100%;height:100%;object-fit:cover}
.ch-card h3{font-size:16px;margin:12px 4px 4px}
.ch-card p{font-size:13px;line-height:1.5;color:var(--muted);margin:0 4px 8px}
.ch-card .go{margin:auto 4px 0;padding-top:12px;border-top:1px solid var(--line);font-size:13px;font-weight:700;color:var(--muted);display:flex;align-items:center;gap:5px;transition:gap .2s,color .2s}
.ch-card .go-ico{width:14px;height:14px;transition:transform .2s}
.ch-card:hover .go{color:var(--cyan);gap:9px}
html[dir=rtl] .ch-card .go-ico{transform:scaleX(-1)}
@media(max-width:600px){.ch-feats{display:none}.ch-card h3{font-size:15px}}
.ch-feats{margin:0 4px 10px;padding:0 0 0 18px;font-size:13px;color:var(--text-dim);line-height:1.6}
html[dir=rtl] .ch-feats{padding:0 18px 0 0}
.ch-all{text-align:center;margin:18px 0 0}
.ch-more{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:16px}
@media(max-width:700px){.ch-more{grid-template-columns:1fr}}
.ch-wide{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:20px;background:linear-gradient(135deg,rgba(91,91,255,.16),rgba(59,226,255,.06));border:1px solid var(--line);text-decoration:none;color:inherit;transition:transform .25s,border-color .25s}
.ch-wide:hover{transform:translateY(-3px);border-color:var(--accent)}.ch-wide:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.ch-emo{font-size:34px;line-height:1;flex:none}
.ch-wide b{display:block;font-size:16px;margin-bottom:3px}.ch-wide b i{font-style:normal;font-size:11px;font-weight:800;color:var(--cyan);margin-inline-start:6px;letter-spacing:.04em}
.ch-wide>span:nth-child(2){flex:1;min-width:0}.ch-wide>span>span{font-size:13px;color:var(--muted);line-height:1.45}
.ch-wide .go-ico{width:16px;height:16px;flex:none;color:var(--muted)}html[dir=rtl] .ch-wide .go-ico{transform:scaleX(-1)}
/* /creator-hub */
"""
s = rd("styles.css")
s = re.sub(r"/\* creator-hub \*/.*?/\* /creator-hub \*/\n", "", s, flags=re.S)
wr("styles.css", s.rstrip("\n") + "\n" + CSS)

JS = """// creator-hub: decorative preview videos play only while on screen (and never with reduced motion)
(function () {
  var vids = document.querySelectorAll("video[data-qt-autoplay]");
  if (!vids.length || typeof IntersectionObserver === "undefined") return;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else if (!v.paused) v.pause();
    });
  }, { threshold: .35 });
  vids.forEach(function (v) { io.observe(v); });
})();
// /creator-hub
"""
s = rd("site.js")
s = re.sub(r"// creator-hub: .*?// /creator-hub\n", "", s, flags=re.S)
wr("site.js", s.rstrip("\n") + "\n" + JS)

# ---- hub page bodies ----
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
P = {
 "en": dict(home="/", homeL="Home", crumb="Creator Studio", b=("Video", "Runs in your browser", "Free"),
   h1="Creator Studio — Free Video Tools for Reels, TikTok &amp; YouTube",
   intro="Everything a short-video creator needs on top of the footage: animated captions, paper-craft animations, liquid-glass slides and motion titles. Each studio exports an MP4 in seconds, works in Arabic and English, adds no watermark and never uploads your files.",
   flowT="One video, four studios", flow=["<strong>Hook</strong> — open with a Paper Motion headline or a big Motion Title in the first second.",
     "<strong>Story</strong> — explain your points with Glass Slides between your clips.",
     "<strong>Captions</strong> — paste your script or .srt into Animated Captions so people watching on mute follow along.",
     "<strong>Call to action</strong> — finish with the subscribe button or a like-and-comment reminder from Motion Titles."],
   faqT="Frequently asked questions",
   faq=[("Are these tools really free?", "Yes. All four studios are free with unlimited downloads and no watermark."),
        ("Do I need to install anything?", "No. They run in Chrome, Edge, Safari or Firefox on your phone or computer; the video is encoded on your device."),
        ("How do I put the green-screen clips on my video?", "Add the MP4 as an overlay in CapCut, InShot, Premiere or DaVinci and apply Chroma key to remove the green."),
        ("Which format should I pick?", "9:16 for Reels, TikTok and Shorts; 16:9 for YouTube; 1:1 for feed posts.")],
   rel="More free tools", links=[("/remove-background-from-image", "Remove Background"), ("/social-image-resizer", "Social Image Resizer"), ("/youtube-thumbnail-size", "YouTube Thumbnail Size"), ("/image-to-text", "Image to Text"), ("/qr-code-generator", "QR Code Generator")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="استوديو صناع المحتوى", b=("فيديو", "تعمل داخل متصفحك", "مجانية"),
   h1="استوديو صناع المحتوى — أدوات فيديو مجانية للريلز والتيك توك واليوتيوب",
   intro="كل ما يحتاجه صانع المحتوى فوق المقاطع: ترجمة متحركة، أنيميشن ورقي، سلايدات زجاجية وعناوين متحركة. كل استوديو يصدّر MP4 خلال ثوانٍ، يدعم العربي والإنجليزي، بدون علامة مائية ولا يرفع ملفاتك.",
   flowT="فيديو واحد، أربعة استوديوهات", flow=["<strong>البداية</strong> — افتح بعنوان من أنيميشن الورق أو عنوان كبير متحرك في أول ثانية.",
     "<strong>المحتوى</strong> — اشرح أفكارك بسلايدات زجاجية بين مقاطعك.",
     "<strong>الترجمة</strong> — الصق نص كلامك أو ملف SRT في الترجمة المتحركة حتى يتابع من يشاهد بدون صوت.",
     "<strong>الختام</strong> — أنهِ بزر الاشتراك أو تذكير اللايك والتعليق من العناوين المتحركة."],
   faqT="أسئلة شائعة",
   faq=[("هل الأدوات مجانية فعلًا؟", "نعم، الاستوديوهات الأربعة مجانية بتنزيل غير محدود وبدون علامة مائية."),
        ("هل أحتاج لتثبيت برنامج؟", "لا، تعمل على كروم وإيدج وسفاري وفايرفوكس على الجوال أو الكمبيوتر، والفيديو يُجهَّز على جهازك."),
        ("كيف أضع المقاطع بالشاشة الخضراء على فيديوي؟", "أضف الـMP4 كتراكب في كاب كت أو إن شوت أو بريمير أو دافنشي ثم استخدم مفتاح اللون (Chroma key) لإزالة الأخضر."),
        ("أي مقاس أختار؟", "9:16 للريلز والتيك توك والشورتس، 16:9 لليوتيوب، و1:1 لمنشورات الصفحة.")],
   rel="أدوات مجانية أخرى", links=[("/remove-background-from-image", "إزالة خلفية الصورة"), ("/ar/social-image-resizer", "مقاسات السوشال ميديا"), ("/ar/image-to-text", "استخراج النص من الصور"), ("/ar/qr-code-generator", "مولد باركود QR"), ("/ar", "كل الأدوات العربية")]),
}
def body(lang):
    t = P[lang]; ar = lang == "ar"
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <section class="section ch">\n    <div class="ch-grid">\n%s    </div>\n%s  </section>\n\n' % ("".join(card(lang, k, h, n, d, f) for k, h, n, d, f in STUDIOS[lang]), more(lang))
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ol class="benefits">\n%s    </ol>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["flowT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["flow"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
wr("tools/specs/pages/ch_en.html", body("en"), "\n"); wr("tools/specs/pages/ch_ar.html", body("ar"), "\n")
print("creator hub: homepages, styles.css, site.js, hub bodies")
