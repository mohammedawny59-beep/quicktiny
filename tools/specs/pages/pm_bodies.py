# Writes the EN/AR bodies + style for Paper Motion Studio.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
FACES = "".join('    @font-face{font-family:"QT %s";font-weight:%s;font-display:swap;src:url(/fonts/display/%s-%s-%s.woff2) format("woff2");unicode-range:%s}\n' % (fam, w, f, sub, w, ur)
    for fam, f, w in (("Amiri", "amiri", "700"), ("Lalezar", "lalezar", "400"), ("Rakkas", "rakkas", "400"))
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
STYLE = """  <style>
""" + FACES + """    .pm{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,420px);gap:22px;align-items:start}
    @media(max-width:900px){.pm{grid-template-columns:1fr}.pm-stage{order:-1;position:static}}
    .pm-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card);margin-bottom:14px}
    .pm-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    html[lang=ar] .pm-card h2{letter-spacing:0}
    #pmStyles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    @media(min-width:1100px){#pmStyles{grid-template-columns:repeat(4,minmax(0,1fr))}}
    .pm-style{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.01));transition:transform .2s,border-color .2s,box-shadow .2s}
    .pm-style b{font-size:15px;color:var(--text)} .pm-style span{font-size:12.5px;color:var(--muted);line-height:1.4} .pm-style i{font-style:normal;font-size:24px}
    .pm-style:hover{transform:translateY(-3px);border-color:var(--accent)}
    .pm-style.on{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(59,226,255,.25),0 14px 30px -18px rgba(59,226,255,.6)}
    .pm-style:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .pm-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .pm-row label{font-weight:700;color:var(--text-dim);font-size:14px}
    .pm-row input,.pm-row select{margin:0}
    .pm-row input[type=color]{height:42px;padding:4px;width:80px}
    @media(max-width:520px){.pm-row{grid-template-columns:1fr}}
    #pmImgWrap{border:1.5px dashed var(--line-strong);border-radius:14px;padding:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
    #pmImgWrap.pm-need{border-color:var(--cyan);animation:pmPulse 1.6s ease-in-out infinite}
    @keyframes pmPulse{50%{box-shadow:0 0 0 4px rgba(59,226,255,.15)}}
    #pmThumb{width:56px;height:56px;object-fit:cover;border-radius:10px}
    @media(min-width:981px){.pm-stage{position:sticky;top:80px}}
    .pm-phone{position:relative;margin:0 auto;width:min(100%,380px);padding:12px;border-radius:38px;background:linear-gradient(160deg,#2a2d48,#0b0c18);box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.7),inset 0 1px 0 rgba(255,255,255,.15)}
    .pm-screen{position:relative;border-radius:28px;overflow:hidden;background:#000;aspect-ratio:9/16;background-image:repeating-conic-gradient(#222 0 25%,#2c2c2c 0 50%);background-size:20px 20px}
    #pmCanvas{display:block;width:100%;height:100%}
    .pm-ctrl{display:flex;align-items:center;gap:10px;margin:12px auto 0;width:min(100%,380px)}
    .pm-ctrl button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line-strong);background:var(--card);color:var(--text);cursor:pointer;font-size:14px;flex:none}
    .pm-ctrl input{flex:1;margin:0;accent-color:var(--accent)}
    .pm-export{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}
    .pm-export .btn{padding:12px 22px;font-size:15px}
    #pmStatus{text-align:center;font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em}
    #pmBar{height:6px;border-radius:999px;background:var(--card);overflow:hidden;width:min(100%,380px);margin:8px auto 0}
    #pmBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan))}
    #pmRatio{display:inline-flex;gap:6px}
    .pm-badges{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px}
    .pm-badges span{font-size:12px;font-weight:700;color:var(--text-dim);border:1px solid var(--line);border-radius:999px;padding:4px 10px}
    @media (prefers-reduced-motion:reduce){#pmImgWrap.pm-need{animation:none}}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Paper Motion Studio", b=("Video", "Runs in your browser", "Free"),
   h1="Paper Motion Studio — Paper-Cut Text &amp; Image Animations for Reels",
   intro="Type a word or drop a photo and get a scroll-stopping paper animation for Reels, TikTok and Shorts: newspaper clippings, cut-out letters, a photo that unfolds like paper, posts, a typewriter, a printed receipt, sticky notes or live marker handwriting. Works in Arabic and English. Export a vertical MP4 or a green-screen version for your editor — free, no watermark, nothing uploaded.",
   styles=[("newspaper", "📰", "Newspaper", "Your word in headline after headline, then highlighted"), ("cutout", "✂️", "Cut-out letters", "Ransom-note letters drop in one by one"),
           ("unfold", "📜", "Paper unfold", "Your photo unfolds like folded paper (with AI cut-out)"), ("posts", "💬", "Posts", "Posts stack up with your word highlighted"),
           ("typewriter", "⌨️", "Typewriter", "Typed letter by letter on a sheet of paper"), ("receipt", "🧾", "Receipt", "Prints out of a slot with your word as the total"),
           ("sticky", "🟨", "Sticky notes", "One note per word, slapped onto the board"), ("marker", "🖊️", "Marker", "Handwritten live, then underlined and circled")],
   s1="Style", s2="Text", s3="Look", text="Main word", sub="Second line", subP="optional", img="Photo", imgB="Choose photo", cut="Remove background (AI)",
   accent="Highlight", bg="Background", bgs=[("kraft", "Kraft paper desk"), ("dark", "Dark"), ("color", "Solid colour"), ("green", "Green screen (for editors)")], bgc="Colour",
   dur="Length", ratio="Format", export="Download MP4", png="Save frame (PNG)",
   badges=["1080×1920", "No watermark", "Nothing uploaded", "Arabic + English"],
   howT="How to use it in your video",
   how=["Pick a style, type your word (or drop a photo for <strong>Paper unfold</strong>), then press <strong>Download MP4</strong>.",
        "Use <strong>Green screen</strong> to drop the animation over your own footage. Key out the green in CapCut, Premiere or DaVinci (Chroma key).",
        "Keep the main word short, 1–3 words. Put the details in the second line or in your voice-over.",
        "Every frame is drawn on your device, so the download is the exact animation you see."],
   faqT="Frequently asked questions",
   faq=[("Is it really free with no watermark?", "Yes. Exports are free, unlimited and watermark-free."),
        ("Does it support Arabic?", "Yes. Arabic text is laid out right-to-left with proper letter joining, and cut-out letters split Arabic only where letters don't connect."),
        ("Which video format do I get?", "MP4 (H.264, 1080×1920 at 30 fps) in Chrome, Edge and Safari. Browsers without H.264 encoding get WebM, which CapCut and Instagram also accept."),
        ("Is my photo uploaded?", "No. Background removal and rendering run in your browser.")],
   rel="More creator tools", links=[("/glass-slides", "Glass Slides"), ("/motion-titles", "Motion Titles"), ("/remove-background-from-image", "Remove Background"), ("/social-image-resizer", "Social Image Resizer"), ("/image-to-text", "Image to Text"), ("/qr-code-generator", "QR Code Generator")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="استوديو أنيميشن الورق", b=("فيديو", "تعمل داخل متصفحك", "مجانية"),
   h1="استوديو أنيميشن الورق — فيديوهات نصوص وصور ورقية للريلز والتيك توك",
   intro="اكتب كلمة أو أضف صورة واحصل على أنيميشن ورقي يوقف التمرير للريلز والتيك توك والشورتس: قصاصات جرائد، حروف مقصوصة، صورة تنفتح كالورق، منشورات، آلة كاتبة، إيصال مطبوع، ملاحظات لاصقة، أو كتابة بقلم الماركر. يدعم العربي والإنجليزي. نزّله فيديو MP4 عموديًا أو بخلفية خضراء لبرنامج المونتاج — مجانًا وبدون علامة مائية ولا رفع.",
   styles=[("newspaper", "📰", "قصاصات جرائد", "كلمتك في عناوين جرائد متتالية ثم تُظلَّل"), ("cutout", "✂️", "حروف مقصوصة", "حروف ورقية تسقط واحدًا تلو الآخر"),
           ("unfold", "📜", "ورقة تنفتح", "صورتك تنفتح كورقة مطوية (مع قص الخلفية بالذكاء الاصطناعي)"), ("posts", "💬", "منشورات", "منشورات تتراكم وكلمتك مظللة"),
           ("typewriter", "⌨️", "آلة كاتبة", "تُكتب حرفًا حرفًا على ورقة"), ("receipt", "🧾", "إيصال", "يُطبع من آلة وكلمتك هي الإجمالي"),
           ("sticky", "🟨", "ملاحظات لاصقة", "ورقة لكل كلمة تُلصق على اللوح"), ("marker", "🖊️", "قلم ماركر", "تُكتب بخط اليد ثم يُسطَّر تحتها وتُحاط بدائرة")],
   s1="النمط", s2="النص", s3="الشكل", text="الكلمة الرئيسية", sub="سطر ثانٍ", subP="اختياري", img="الصورة", imgB="اختر صورة", cut="إزالة الخلفية (ذكاء اصطناعي)",
   accent="لون التظليل", bg="الخلفية", bgs=[("kraft", "مكتب ورق كرافت"), ("dark", "داكنة"), ("color", "لون واحد"), ("green", "شاشة خضراء (للمونتاج)")], bgc="اللون",
   dur="المدة", ratio="المقاس", export="تنزيل MP4", png="حفظ لقطة (PNG)",
   badges=["1080×1920", "بدون علامة مائية", "لا يُرفع شيء", "عربي + إنجليزي"],
   howT="كيف تستخدمه في فيديوهاتك",
   how=["اختر النمط واكتب كلمتك (أو أضف صورة لنمط <strong>ورقة تنفتح</strong>) ثم اضغط <strong>تنزيل MP4</strong>.",
        "اختر <strong>شاشة خضراء</strong> لتضع الأنيميشن فوق فيديوك، ثم أزل اللون الأخضر في كاب كت أو بريمير أو دافنشي (Chroma key).",
        "اجعل الكلمة الرئيسية قصيرة (1–3 كلمات)، والتفاصيل في السطر الثاني أو في تعليقك الصوتي.",
        "كل إطار يُرسم على جهازك، فالفيديو الذي تنزّله هو نفس الأنيميشن الذي تراه بالضبط."],
   faqT="أسئلة شائعة",
   faq=[("هل هو مجاني فعلًا وبدون علامة مائية؟", "نعم، التنزيل مجاني وغير محدود وبدون علامة مائية."),
        ("هل يدعم العربي؟", "نعم، النص العربي من اليمين لليسار بحروف متصلة صحيحة، والحروف المقصوصة تُقسَّم فقط عند الحروف التي لا تتصل بما بعدها."),
        ("ما صيغة الفيديو؟", "MP4 (H.264، 1080×1920، 30 إطارًا) في كروم وإيدج وسفاري. المتصفحات التي لا تدعم ذلك تحصل على WebM ويقبله كاب كت وإنستغرام."),
        ("هل تُرفع صورتي؟", "لا، إزالة الخلفية والرسم يتمان داخل متصفحك.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/ar/glass-slides", "سلايدات زجاجية"), ("/ar/motion-titles", "العناوين المتحركة"), ("/remove-background-from-image", "إزالة خلفية الصورة"), ("/ar/social-image-resizer", "مقاسات السوشال ميديا"), ("/ar/image-to-text", "استخراج النص من الصور"), ("/ar/qr-code-generator", "مولّد QR")]),
}
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="pm">\n      <div class="pm-controls">\n'
    s += '        <div class="pm-card"><h2>%s</h2><div id="pmStyles">%s</div></div>\n' % (t["s1"], "".join(
        '<button type="button" class="pm-style" data-s="%s" aria-pressed="false"><i aria-hidden="true">%s</i><b>%s</b><span>%s</span></button>' % st for st in t["styles"]))
    s += ('        <div class="pm-card"><h2>%s</h2>\n          <div class="pm-row"><label for="pmText">%s</label><input type="text" id="pmText" maxlength="40" dir="auto"></div>\n'
          '          <div class="pm-row"><label for="pmSub">%s</label><input type="text" id="pmSub" maxlength="60" dir="auto" placeholder="%s"></div>\n'
          '          <div class="pm-row"><span class="cv-lab" style="font-weight:700;color:var(--text-dim);font-size:14px">%s</span><div id="pmImgWrap"><img id="pmThumb" alt="" hidden><label class="btn btn-secondary" for="pmImg" style="cursor:pointer">%s</label><input type="file" id="pmImg" accept="image/*" class="sr-only">'
          '<label style="display:flex;gap:6px;align-items:center;font-size:13.5px"><input type="checkbox" id="pmCut" checked> %s</label></div></div>\n        </div>\n'
          ) % (t["s2"], t["text"], t["sub"], t["subP"], t["img"], t["imgB"], t["cut"])
    s += ('        <div class="pm-card"><h2>%s</h2>\n          <div class="pm-row"><label for="pmAccent">%s</label><input type="color" id="pmAccent"></div>\n'
          '          <div class="pm-row"><label for="pmBg">%s</label><select id="pmBg">%s</select></div>\n'
          '          <div class="pm-row" id="pmBgColorWrap"><label for="pmBgColor">%s</label><input type="color" id="pmBgColor"></div>\n'
          '          <div class="pm-row"><label for="pmDur">%s <b id="pmDurV" dir="ltr"></b></label><input type="range" id="pmDur" min="3" max="10" step="1"></div>\n'
          '          <div class="pm-row"><span style="font-weight:700;color:var(--text-dim);font-size:14px">%s</span><span id="pmRatio" role="group" aria-label="%s"><button type="button" class="chip" data-r="9:16">9:16</button><button type="button" class="chip" data-r="1:1">1:1</button><button type="button" class="chip" data-r="16:9">16:9</button></span></div>\n'
          '        </div>\n      </div>\n') % (t["s3"], t["accent"], t["bg"], "".join('<option value="%s">%s</option>' % b for b in t["bgs"]), t["bgc"], t["dur"], t["ratio"], t["ratio"])
    s += ('      <div class="pm-stage">\n        <div class="pm-phone"><div class="pm-screen"><canvas id="pmCanvas" width="1080" height="1920" aria-label="%s" role="img"></canvas></div></div>\n'
          '        <div class="pm-ctrl"><button type="button" id="pmPlay" aria-label="Play / pause">❚❚</button><input type="range" id="pmScrub" min="0" max="1000" value="0" aria-label="Timeline"></div>\n'
          '        <div class="pm-export"><button type="button" class="btn" id="pmExport">%s</button><button type="button" class="btn btn-secondary" id="pmPng">%s</button></div>\n'
          '        <div id="pmBar" hidden><i id="pmBarFill"></i></div><div id="pmStatus" role="status"></div>\n'
          '        <div class="pm-badges">%s</div>\n      </div>\n    </div>\n  </div>\n'
          '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/brand.js"></script>\n  <script src="/paper-studio.js"></script>\n\n') % (t["crumb"], t["export"], t["png"], "".join("<span>%s</span>" % b for b in t["badges"]))
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("pm_style.html", STYLE); w("pm_en.html", body("en", False)); w("pm_ar.html", body("ar", True))
print("bodies written")
