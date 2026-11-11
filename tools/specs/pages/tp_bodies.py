# Writes EN/AR bodies + style for the Video Templates gallery (templates.js).
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
FACES = "".join('    @font-face{font-family:"QT %s";font-weight:%s;font-display:swap;src:url(/fonts/display/%s-%s-%s.woff2) format("woff2");unicode-range:%s}\n' % (fam, w, f, sub, w, ur)
    for fam, f, w in (("Lalezar", "lalezar", "400"), ("Amiri", "amiri", "700"))
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
PALS = [("electric", "#170a3a", "#3a0ca3", "#ffd60a"), ("sunset", "#ff5f6d", "#ffc371", "#2b1055"), ("mint", "#06302d", "#0f766e", "#a7f3d0"), ("noir", "#0b0b0f", "#22222b", "#ff2d55"), ("cream", "#fff8ea", "#ffe3c2", "#e4572e"), ("royal", "#081a36", "#13406f", "#e9c46a")]
STYLE = """  <style>
""" + FACES + """    .tp-cats{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 14px}
    #tpGallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}
    .tp-card{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:6px;padding:8px 8px 12px;border-radius:18px;border:1px solid var(--line);background:var(--card);transition:transform .25s,border-color .25s,box-shadow .25s}
    .tp-card:hover{transform:translateY(-4px);border-color:var(--accent);box-shadow:0 20px 40px -26px rgba(91,91,255,.8)}
    .tp-card.on{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(59,226,255,.3)}.tp-card:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .tp-card canvas{display:block;width:100%;aspect-ratio:9/16;border-radius:12px;background:#111}
    .tp-card b{font-size:14px;color:var(--text);padding:0 4px}.tp-card span{font-size:12px;color:var(--muted);padding:0 4px}
    .tp-card[hidden]{display:none}
    .tp-ed{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start;margin-top:26px;scroll-margin-top:80px}
    @media(max-width:980px){.tp-ed{grid-template-columns:1fr;gap:0}.tp-col{display:contents}.tp-c1{order:0}.tp-stage{order:1;margin-bottom:14px}.tp-c2{order:2}}
    .tp-box{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card);margin-bottom:14px}
    .tp-box h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}html[lang=ar] .tp-box h2{letter-spacing:0}
    #tpName{font-size:22px;margin:0 0 12px;color:var(--text)}
    .tp-row{display:grid;gap:6px;margin-bottom:12px}.tp-row label{font-weight:700;color:var(--text-dim);font-size:14px}.tp-row input,.tp-row textarea{margin:0;width:100%}
    .tp-row textarea{resize:vertical;font:600 15px/1.5 inherit;font-family:inherit}
    .tp-hint{font-size:13px;color:var(--muted);margin:0 0 12px}
    .tp-line{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}.tp-line .tp-l{font-weight:700;color:var(--text-dim);font-size:14px}
    .tp-line input[type=color]{height:42px;padding:4px;width:80px;margin:0}
    #tpPals{display:flex;flex-wrap:wrap;gap:8px}
    .tp-p{all:unset;cursor:pointer;width:42px;height:42px;border-radius:12px;border:2px solid transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15);transition:transform .15s}
    .tp-p:hover{transform:translateY(-2px)}.tp-p.on{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(59,226,255,.25)}.tp-p:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .tp-chips{display:flex;flex-wrap:wrap;gap:6px}
    @media(min-width:981px){.tp-stage{position:sticky;top:80px}}
    .tp-screen{margin:0 auto;max-width:100%;max-height:70vh;border-radius:20px;overflow:hidden;border:8px solid #15172a;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.7);background:#000}
    #tpCanvas{display:block;width:100%;height:100%}
    .tp-ctrl{display:flex;align-items:center;gap:10px;margin-top:12px}
    .tp-ctrl button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line-strong);background:var(--card);color:var(--text);cursor:pointer;flex:none}
    .tp-ctrl input{flex:1;margin:0;accent-color:var(--accent)}
    .tp-out{display:flex;justify-content:center;margin-top:14px}.tp-out .btn{padding:12px 24px;font-size:15px}
    #tpStatus{text-align:center;font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em}
    #tpBar{height:6px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:8px}#tpBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan))}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Video Templates", b=("Video", "Runs in your browser", "Free"),
   h1="Free Animated Video Templates — Reels, TikTok, Stories &amp; YouTube",
   intro="13 ready-made animated templates for the posts people make most: announcements, top-5 lists, sales, quotes, invites, before/after, product showcases, Ramadan &amp; Eid greetings, real estate, menu items, reviews, stats and Reels hooks. Pick one, type your text, add a photo and download a smooth 30 or 60 fps MP4 — Arabic and English, free, no watermark.",
   cats=[("all", "All"), ("promo", "Promo"), ("list", "Lists"), ("social", "Social"), ("event", "Events")],
   s1="Your content", hint="Tip: wrap words in *stars* to highlight them.", s2="Look", pal="Colours", accent="Accent", ratio="Format", fps="Smoothness", export="Download MP4",
   howT="How to use a template", how=["Tap a template above — the previews play live.", "Replace the text and add your photo where there is one.", "Pick colours (or save your brand kit in the Creator Studio to apply it automatically) and the format: 9:16 for Reels and TikTok, 1:1 or 4:5 for feed, 16:9 for YouTube.", "Download the MP4. 60 fps looks extra smooth on phones."],
   faqT="Frequently asked questions", faq=[("Are the templates free for commercial use?", "Yes. The animations are generated by this page, so you can use the videos for your business or clients without attribution."), ("Can I add music?", "Add music in CapCut, Instagram or TikTok after downloading — the MP4 is silent so you can pick a trending sound."), ("Do my photos get uploaded?", "No. Photos stay in your browser and the video is rendered on your device.")],
   rel="More creator tools", links=[("/creator-studio", "Creator Studio"), ("/add-subtitles-to-video", "Auto Subtitles"), ("/youtube-thumbnail-maker", "YouTube Thumbnail Maker"), ("/glass-slides", "Glass Slides"), ("/motion-titles", "Motion Titles")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="قوالب فيديو جاهزة", b=("فيديو", "تعمل داخل متصفحك", "مجانية"),
   h1="قوالب فيديو متحركة جاهزة مجانًا — للريلز والتيك توك والستوري واليوتيوب",
   intro="13 قالبًا متحركًا جاهزًا لأكثر المنشورات استخدامًا: إعلان، قائمة أفضل 5، عروض وخصومات، اقتباس، دعوة، قبل وبعد، عرض منتج، تهنئة رمضان والعيد، إعلان عقار، طبق من المنيو، رأي عميل، أرقام وإنجازات، وافتتاحية ريلز. اختر القالب واكتب نصك وأضف صورتك ونزّل فيديو MP4 ناعم بسرعة 30 أو 60 إطارًا — عربي وإنجليزي، مجانًا وبدون علامة مائية.",
   cats=[("all", "الكل"), ("promo", "ترويج"), ("list", "قوائم"), ("social", "سوشال"), ("event", "مناسبات")],
   s1="المحتوى", hint="نصيحة: ضع الكلمات بين *نجمتين* لتمييزها.", s2="الشكل", pal="الألوان", accent="لون التمييز", ratio="المقاس", fps="النعومة", export="تنزيل MP4",
   howT="كيف تستخدم القالب", how=["اضغط على أي قالب في الأعلى — المعاينات تتحرك مباشرة.", "غيّر النصوص وأضف صورتك إذا كان القالب فيه صورة.", "اختر الألوان (أو احفظ هوية قناتك في استوديو صناع المحتوى لتُطبّق تلقائيًا) والمقاس: 9:16 للريلز والتيك توك، 1:1 أو 4:5 للمنشورات، 16:9 لليوتيوب.", "نزّل الفيديو MP4. خيار 60 إطارًا يبدو ناعمًا جدًا على الجوال."],
   faqT="أسئلة شائعة", faq=[("هل القوالب مجانية للاستخدام التجاري؟", "نعم. الحركة تُنشأ داخل هذه الصفحة، فتقدر تستخدم الفيديوهات لمشروعك أو عملائك بدون ذكر المصدر."), ("هل أقدر أضيف موسيقى؟", "أضف الموسيقى في كاب كت أو إنستغرام أو تيك توك بعد التنزيل — الفيديو بدون صوت حتى تختار الصوت الترند."), ("هل تُرفع صوري؟", "لا. الصور تبقى في متصفحك والفيديو يُجهَّز على جهازك.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/ar/creator-studio", "استوديو صناع المحتوى"), ("/ar/add-subtitles-to-video", "ترجمة الفيديو تلقائيًا"), ("/ar/youtube-thumbnail-maker", "صانع صورة اليوتيوب"), ("/ar/glass-slides", "سلايدات زجاجية"), ("/ar/motion-titles", "العناوين المتحركة")]),
}
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="tp-cats" id="tpCats" role="group">%s</div>\n    <div id="tpGallery"></div>\n' % "".join('<button type="button" class="chip%s" data-c="%s">%s</button>' % (" active" if k == "all" else "", k, v) for k, v in t["cats"])
    s += ('    <div class="tp-ed" id="tpEditor" hidden>\n      <div class="tp-col">\n        <div class="tp-box tp-c1"><h2>%s</h2><h3 id="tpName"></h3><p class="tp-hint">%s</p><div id="tpFields"></div></div>\n'
          '        <div class="tp-box tp-c2"><h2>%s</h2>\n'
          '          <div class="tp-line"><span class="tp-l">%s</span><div id="tpPals" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="tp-line"><label class="tp-l" for="tpAccent">%s</label><input type="color" id="tpAccent"></div>\n'
          '          <div class="tp-line"><span class="tp-l">%s</span><div class="tp-chips" id="tpRatio" role="group" aria-label="%s"><button type="button" class="chip" data-r="9:16">9:16</button><button type="button" class="chip" data-r="4:5">4:5</button><button type="button" class="chip" data-r="1:1">1:1</button><button type="button" class="chip" data-r="16:9">16:9</button></div></div>\n'
          '          <div class="tp-line"><span class="tp-l">%s</span><div class="tp-chips" id="tpFps" role="group" aria-label="%s"><button type="button" class="chip" data-f="30">30 fps</button><button type="button" class="chip" data-f="60">60 fps</button></div></div>\n'
          '        </div>\n      </div>\n') % (t["s1"], t["hint"], t["s2"], t["pal"], t["pal"], "".join('<button type="button" class="tp-p" data-p="%s" aria-pressed="false" aria-label="%s" style="background:linear-gradient(135deg,%s,%s 60%%,%s 61%%)"></button>' % (k, k, a, b, c) for k, a, b, c in PALS),
          t["accent"], t["ratio"], t["ratio"], t["fps"], t["fps"])
    s += ('      <div class="tp-stage">\n        <div class="tp-screen" id="tpScreen"><canvas id="tpCanvas" width="540" height="960" role="img" aria-label="%s"></canvas></div>\n'
          '        <div class="tp-ctrl"><button type="button" id="tpPlay" aria-label="Play / pause">❚❚</button><button type="button" id="tpRestart" aria-label="Restart">↺</button><input type="range" id="tpScrub" min="0" max="1000" value="0" aria-label="Timeline"></div>\n'
          '        <div class="tp-out"><button type="button" class="btn" id="tpExport">%s</button></div><div id="tpBar" hidden><i id="tpBarFill"></i></div><div id="tpStatus" role="status"></div>\n      </div>\n    </div>\n  </div>\n'
          '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/brand.js"></script>\n  <script src="/templates.js"></script>\n\n') % (t["crumb"], t["export"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ol class="benefits">\n%s    </ol>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("tp_style.html", STYLE); w("tp_en.html", body("en", False)); w("tp_ar.html", body("ar", True))
print("bodies written")
