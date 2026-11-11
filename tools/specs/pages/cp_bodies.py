# Writes the EN/AR bodies + style for Animated Captions (word-by-word subtitles for Reels/TikTok/Shorts).
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
FACES = "".join('    @font-face{font-family:"QT %s";font-weight:%s;font-display:swap;src:url(/fonts/display/%s-%s-%s.woff2) format("woff2");unicode-range:%s}\n' % (fam, w, f, sub, w, ur)
    for fam, f, w in (("Lalezar", "lalezar", "400"),)
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
STYLE = """  <style>
""" + FACES + """    .cp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start}
    @media(max-width:980px){.cp{grid-template-columns:1fr}.cp-stage{order:-1;position:static}.cp-screen{max-width:min(100%,320px)}}
    .cp-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card);margin-bottom:14px}
    .cp-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    html[lang=ar] .cp-card h2{letter-spacing:0}
    #capText{width:100%;min-height:150px;resize:vertical;margin:0;font:600 16px/1.6 inherit;font-family:inherit}
    #capText:disabled{opacity:.55}
    .cp-srt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:10px}
    .cp-srt label.btn{cursor:pointer;padding:9px 16px;font-size:14px}
    .cp-srt input[type=file]{position:absolute;width:1px;height:1px;opacity:0}
    #capInfo{font-size:13px;color:var(--muted)}
    #capStyles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
    @media(max-width:520px){#capStyles{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .cp-s{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:6px;align-items:center;text-align:center;padding:12px 6px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.01));transition:transform .2s,border-color .2s,box-shadow .2s}
    .cp-s i{font-style:normal;font-family:"QT Lalezar",Impact,sans-serif;font-size:20px;line-height:1.2;color:#fff;text-shadow:0 2px 0 #000}
    .cp-s i em{font-style:normal;color:#ffd400}.cp-s i u{text-decoration:none;background:#ffd400;color:#111;border-radius:5px;padding:0 4px;text-shadow:none}
    .cp-s b{font-size:13px;color:var(--text)}
    .cp-s:hover{transform:translateY(-3px);border-color:var(--accent)}
    .cp-s.on{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(59,226,255,.25),0 14px 30px -18px rgba(59,226,255,.6)}
    .cp-s:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .cp-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .cp-row label,.cp-row .cp-l{font-weight:700;color:var(--text-dim);font-size:14px}
    .cp-row input,.cp-row select{margin:0}.cp-row input[type=color]{height:42px;padding:4px;width:80px}
    .cp-row input[type=range]{accent-color:var(--accent)}
    .cp-checks{display:flex;gap:16px;flex-wrap:wrap}.cp-checks label{display:flex;gap:6px;align-items:center;font-weight:600;font-size:14px;color:var(--text-dim)}
    @media(max-width:520px){.cp-row{grid-template-columns:1fr}}
    .cp-chips{display:flex;flex-wrap:wrap;gap:6px}
    @media(min-width:981px){.cp-stage{position:sticky;top:80px}}
    .cp-screen{position:relative;margin:0 auto;max-width:100%;max-height:72vh;border-radius:22px;overflow:hidden;border:10px solid #15172a;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.7);background:#000}
    #capCanvas{display:block;width:100%;height:100%}
    .cp-ctrl{display:flex;align-items:center;gap:10px;margin-top:12px}
    .cp-ctrl button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line-strong);background:var(--card);color:var(--text);cursor:pointer;flex:none}
    .cp-ctrl input{flex:1;margin:0;accent-color:var(--accent)}
    .cp-export{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}.cp-export .btn{padding:12px 22px;font-size:15px}
    #capStatus{text-align:center;font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em}
    #capBar{height:6px;border-radius:999px;background:var(--card);overflow:hidden;margin-top:8px}
    #capBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan))}
    .cp-note{font-size:13px;color:var(--muted);text-align:center;margin-top:8px}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Animated Captions", b=("Video", "Runs in your browser", "Free"),
   h1="Animated Captions — Free Word-by-Word Subtitles for Reels, TikTok &amp; Shorts",
   intro="Make the bold, word-by-word captions viral short videos use. Paste your script (or upload an .srt from CapCut or any editor), pick a style — pop, highlight box, karaoke or one word at a time — and download a green-screen MP4 to lay over your video. Arabic and English, free, no watermark, nothing uploaded.",
   styles=[("pop", "a <em>big</em> word", "Pop"), ("box", "a <u>big</u> word", "Highlight box"), ("karaoke", "<em>a big</em> word", "Karaoke"), ("bounce", "<em>big</em>", "One word")],
   s0="Your words", ph="Type or paste your script. Each line becomes its own caption.", srt="Upload .srt", srtClear="Use typed text", wpm="Speaking speed",
   s1="Style", s2="Look", per="Words on screen", perO=[("1", "1 word"), ("2", "2 words"), ("3", "3 words"), ("4", "4 words")], accent="Highlight", font="Font", fontO=[("bold", "Bold display"), ("sans", "Clean sans")], size="Size",
   upper="UPPERCASE", outline="Outline", pos="Position", posO=[("bottom", "Bottom"), ("middle", "Middle"), ("top", "Top")],
   bg="Background", bgs=[("green", "Green screen"), ("blue", "Blue screen"), ("black", "Black"), ("photo", "Preview")], ratio="Format",
   export="Download MP4", note="“Preview” is only for looking; the download uses a green screen.",
   howT="How to add the captions to your video",
   how=["Got a subtitle file? Export <strong>.srt</strong> from CapCut, Premiere or YouTube Studio and upload it here — every word keeps its timing.",
        "No subtitles yet? Paste your script, set the speaking speed and nudge it until it matches your voice.",
        "Download the MP4, add it as an <em>overlay</em> above your video and apply <em>Chroma key</em> to remove the green. Line the start up with your first word.",
        "Use 2–3 words on screen for fast Reels and 4 for slower talking videos."],
   faqT="Frequently asked questions",
   faq=[("Does it transcribe my audio automatically?", "Not yet — it animates captions from your text or an .srt file. Most editors (CapCut, YouTube Studio) can auto-generate an .srt you can upload here."),
        ("Is it free with no watermark?", "Yes, unlimited free downloads with no watermark."),
        ("Does it support Arabic?", "Yes. Arabic words run right-to-left with proper letter joining, and the karaoke highlight moves from right to left."),
        ("Is my script uploaded anywhere?", "No. Everything — including the video encoding — happens on your device.")],
   rel="More creator tools", links=[("/motion-titles", "Motion Titles"), ("/glass-slides", "Glass Slides"), ("/paper-animation", "Paper Motion Studio"), ("/remove-background-from-image", "Remove Background"), ("/image-to-text", "Image to Text")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="الترجمة المتحركة", b=("فيديو", "تعمل داخل متصفحك", "مجانية"),
   h1="الترجمة المتحركة — كابشن كلمة بكلمة للريلز والتيك توك والشورتس مجانًا",
   intro="اعمل الكابشن العريض اللي يظهر كلمة كلمة مثل الفيديوهات المنتشرة. الصق نص كلامك (أو ارفع ملف ‎.srt من كاب كت أو أي برنامج)، اختر الستايل — تكبير، مربع ملوّن، كاريوكي أو كلمة كلمة — ونزّل فيديو MP4 بشاشة خضراء تضعه فوق فيديوك. عربي وإنجليزي، مجانًا وبدون علامة مائية، ولا شيء يُرفع.",
   styles=[("pop", "كلمة <em>كبيرة</em>", "تكبير"), ("box", "كلمة <u>كبيرة</u>", "مربع ملوّن"), ("karaoke", "<em>كلمة</em> كبيرة", "كاريوكي"), ("bounce", "<em>كبيرة</em>", "كلمة كلمة")],
   s0="كلامك", ph="اكتب أو الصق نص كلامك. كل سطر يصير كابشن مستقل.", srt="رفع ملف ترجمة SRT", srtClear="استخدم النص المكتوب", wpm="سرعة الكلام",
   s1="الستايل", s2="الشكل", per="كلمات على الشاشة", perO=[("1", "كلمة واحدة"), ("2", "كلمتان"), ("3", "3 كلمات"), ("4", "4 كلمات")], accent="لون التمييز", font="الخط", fontO=[("bold", "عريض"), ("sans", "بسيط")], size="الحجم",
   upper="أحرف كبيرة (EN)", outline="حدود", pos="الموضع", posO=[("bottom", "أسفل"), ("middle", "منتصف"), ("top", "أعلى")],
   bg="الخلفية", bgs=[("green", "شاشة خضراء"), ("blue", "شاشة زرقاء"), ("black", "سوداء"), ("photo", "معاينة")], ratio="المقاس",
   export="تنزيل MP4", note="«معاينة» للعرض فقط؛ التنزيل يكون بشاشة خضراء.",
   howT="كيف تضيف الترجمة على فيديوك",
   how=["عندك ملف ترجمة؟ صدّر <strong>‎.srt</strong> من كاب كت أو بريمير أو يوتيوب ستوديو وارفعه هنا — كل كلمة تحافظ على توقيتها.",
        "ما عندك ترجمة؟ الصق نص كلامك واضبط سرعة الكلام حتى تطابق صوتك.",
        "نزّل الفيديو وأضفه <em>تراكب</em> فوق فيديوك ثم استخدم <em>مفتاح اللون (Chroma key)</em> لإزالة الأخضر، وطابق البداية مع أول كلمة.",
        "استخدم 2–3 كلمات على الشاشة للريلز السريعة و4 كلمات للفيديوهات الهادئة."],
   faqT="أسئلة شائعة",
   faq=[("هل تحوّل الصوت لنص تلقائيًا؟", "ليس بعد — الأداة تحرّك الترجمة من نصك أو من ملف ‎.srt. أغلب البرامج (كاب كت، يوتيوب ستوديو) تولّد ملف ‎.srt تلقائيًا وتقدر ترفعه هنا."),
        ("هل هي مجانية وبدون علامة مائية؟", "نعم، تنزيل مجاني غير محدود وبدون علامة مائية."),
        ("هل تدعم العربي؟", "نعم، الكلمات العربية من اليمين لليسار بحروف متصلة صحيحة، وتمييز الكاريوكي يمشي من اليمين لليسار."),
        ("هل يُرفع النص لأي مكان؟", "لا، كل شيء بما فيه تجهيز الفيديو يتم على جهازك.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/ar/motion-titles", "العناوين المتحركة"), ("/ar/glass-slides", "سلايدات زجاجية"), ("/ar/paper-animation", "استوديو أنيميشن الورق"), ("/remove-background-from-image", "إزالة خلفية الصورة"), ("/ar/image-to-text", "استخراج النص من الصور")]),
}
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="cp">\n      <div>\n'
    s += ('        <div class="cp-card"><h2>%s</h2>\n          <label for="capText" class="sr-only">%s</label><textarea id="capText" dir="auto" maxlength="3000" placeholder="%s"></textarea>\n'
          '          <div class="cp-srt"><label class="btn btn-ghost" for="capSrt">%s</label><input type="file" id="capSrt" accept=".srt,.vtt,text/plain"><button type="button" class="chip" id="capSrtClear" hidden>%s</button><span id="capInfo"></span></div>\n'
          '          <div class="cp-row" id="capWpmRow" style="margin-top:12px"><label for="capWpm">%s</label><div><input type="range" id="capWpm" min="80" max="260" step="5" style="width:100%%"> <span id="capWpmV"></span> wpm</div></div>\n        </div>\n') % (t["s0"], t["s0"], t["ph"], t["srt"], t["srtClear"], t["wpm"])
    s += '        <div class="cp-card"><h2>%s</h2><div id="capStyles">%s</div></div>\n' % (t["s1"], "".join('<button type="button" class="cp-s" data-s="%s" aria-pressed="false"><i aria-hidden="true">%s</i><b>%s</b></button>' % x for x in t["styles"]))
    s += ('        <div class="cp-card"><h2>%s</h2>\n'
          '          <div class="cp-row"><label for="capPer">%s</label><select id="capPer">%s</select></div>\n'
          '          <div class="cp-row"><label for="capAccent">%s</label><input type="color" id="capAccent"></div>\n'
          '          <div class="cp-row"><label for="capFont">%s</label><select id="capFont">%s</select></div>\n'
          '          <div class="cp-row"><label for="capSize">%s</label><input type="range" id="capSize" min="56" max="150" step="2"></div>\n'
          '          <div class="cp-row"><span class="cp-l"></span><div class="cp-checks"><label><input type="checkbox" id="capOutline"> %s</label><label><input type="checkbox" id="capUpper"> %s</label></div></div>\n'
          '          <div class="cp-row"><span class="cp-l">%s</span><div class="cp-chips" id="capPos" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="cp-row"><span class="cp-l">%s</span><div class="cp-chips" id="capBg" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="cp-row"><span class="cp-l">%s</span><div class="cp-chips" id="capRatio" role="group" aria-label="%s"><button type="button" class="chip" data-r="9:16">9:16</button><button type="button" class="chip" data-r="16:9">16:9</button><button type="button" class="chip" data-r="1:1">1:1</button></div></div>\n'
          '        </div>\n      </div>\n') % (t["s2"], t["per"], "".join('<option value="%s">%s</option>' % o for o in t["perO"]), t["accent"], t["font"], "".join('<option value="%s">%s</option>' % o for o in t["fontO"]), t["size"],
                                           t["outline"], t["upper"], t["pos"], t["pos"], "".join('<button type="button" class="chip" data-p="%s">%s</button>' % o for o in t["posO"]),
                                           t["bg"], t["bg"], "".join('<button type="button" class="chip" data-b="%s">%s</button>' % o for o in t["bgs"]), t["ratio"], t["ratio"])
    s += ('      <div class="cp-stage">\n        <div class="cp-screen"><canvas id="capCanvas" width="1080" height="1920" role="img" aria-label="%s"></canvas></div>\n'
          '        <div class="cp-ctrl"><button type="button" id="capPlay" aria-label="Play / pause">❚❚</button><input type="range" id="capScrub" min="0" max="1000" value="0" aria-label="Timeline"></div>\n'
          '        <div class="cp-export"><button type="button" class="btn" id="capExport">%s</button></div>\n'
          '        <div id="capBar" hidden><i id="capBarFill"></i></div><div id="capStatus" role="status"></div><p class="cp-note">%s</p>\n      </div>\n    </div>\n  </div>\n'
          '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/captions.js"></script>\n\n') % (t["crumb"], t["export"], t["note"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("cp_style.html", STYLE); w("cp_en.html", body("en", False)); w("cp_ar.html", body("ar", True))
print("bodies written")
