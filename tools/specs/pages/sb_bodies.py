# Writes the EN/AR bodies + style for Auto Subtitles (speech-to-text captions burned into your video).
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
UP = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4-2.5z"/></svg>'
FACES = "".join('    @font-face{font-family:"QT Lalezar";font-weight:400;font-display:swap;src:url(/fonts/display/lalezar-%s-400.woff2) format("woff2");unicode-range:%s}\n' % (sub, ur)
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
STYLE = """  <style>
""" + FACES + """    .sb{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start}
    @media(max-width:980px){.sb{grid-template-columns:1fr;gap:0}.sb-col{display:contents}.sb-c1{order:0}.sb-stage{order:1;margin-bottom:14px}.sb-c2{order:2}}
    .sb-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card);margin-bottom:14px}
    .sb-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    html[lang=ar] .sb-card h2{letter-spacing:0}
    .sb-drop{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:26px 16px;border:2px dashed var(--line-strong);border-radius:16px;cursor:pointer;color:var(--text-dim);transition:border-color .2s,background .2s}
    .sb-drop.over,.sb-drop:hover{border-color:var(--accent);background:rgba(91,91,255,.06)}
    .sb-drop strong{color:var(--text);font-size:16px}.sb-drop input{position:absolute;width:1px;height:1px;opacity:0}
    .sb-drop:focus-within{outline:2px solid var(--accent);outline-offset:2px}
    #sbName{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
    .sb-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .sb-row label,.sb-row .sb-l{font-weight:700;color:var(--text-dim);font-size:14px}
    .sb-row input,.sb-row select{margin:0}.sb-row input[type=color]{height:42px;padding:4px;width:80px}.sb-row input[type=range]{accent-color:var(--accent)}
    @media(max-width:520px){.sb-row{grid-template-columns:1fr}}
    .sb-go{width:100%;padding:14px 22px;font-size:16px;margin-top:6px}
    #sbStatus{font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em;text-align:center}
    #sbBar{height:6px;border-radius:999px;background:var(--bg-soft,rgba(255,255,255,.06));overflow:hidden;margin-top:8px}
    #sbBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan));transition:width .3s}
    .sb-note{font-size:13px;color:var(--muted);margin:8px 0 0}
    #sbStyles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    @media(max-width:520px){#sbStyles{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .sb-s{all:unset;cursor:pointer;text-align:center;padding:10px 6px;border-radius:12px;border:1px solid var(--line);font-weight:700;font-size:13px;color:var(--text);transition:border-color .2s,box-shadow .2s}
    .sb-s:hover{border-color:var(--accent)}.sb-s.on{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(59,226,255,.25)}.sb-s:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .sb-chips,.sb-checks{display:flex;flex-wrap:wrap;gap:6px 16px}.sb-checks label{display:flex;gap:6px;align-items:center;font-weight:600;font-size:14px;color:var(--text-dim)}
    @media(min-width:981px){.sb-stage{position:sticky;top:80px}}
    .sb-screen{position:relative;margin:0 auto;max-width:100%;max-height:70vh;border-radius:14px;overflow:hidden;background:#000;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.6)}
    .sb-screen video,.sb-screen canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
    .sb-screen canvas{pointer-events:none}
    #sbCues{display:grid;gap:6px;max-height:340px;overflow:auto;padding-inline-end:4px}
    .sb-cue{display:grid;grid-template-columns:58px minmax(0,1fr);gap:8px;align-items:center}
    .sb-cue input{margin:0;padding:8px 10px;font-size:15px}
    .sb-tm{all:unset;cursor:pointer;font:600 12px/1 ui-monospace,monospace;color:var(--cyan);text-align:center;padding:8px 0;border-radius:8px;border:1px solid var(--line)}
    .sb-tm:hover{border-color:var(--cyan)}.sb-tm:focus-visible{outline:2px solid var(--accent)}
    .sb-out{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}.sb-out .btn{padding:12px 20px;font-size:15px}
    #sbInfo{font-size:13px;color:var(--muted)}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Auto Subtitles", b=("Video", "Your video never leaves your device", "Free"),
   h1="Auto Subtitles — Add Animated Captions to Your Video Automatically, Free",
   intro="Upload a video and get word-by-word animated captions in a minute: speech is turned into text right in your browser (Arabic, English and 90+ languages), you fix any word, pick a style and download the video with the captions burned in — sound included. Or grab an .srt file. Free, no watermark, no upload.",
   s1="1 · Your video", drop="Choose a video or drop it here", dropS="MP4, MOV or WebM · up to 20 minutes", lang="Spoken language", langO=[("arabic", "Arabic"), ("english", "English"), ("", "Detect automatically")],
   model="Accuracy", modelO=[("base", "Fast (≈ 75 MB, once)"), ("small", "Best (≈ 250 MB, once)")], go="Generate subtitles",
   note="The first run downloads the speech model and keeps it in your browser, so the next videos start straight away.",
   s2="2 · Fix the words", s3="3 · Caption style", styles=[("pop", "Pop"), ("box", "Highlight box"), ("karaoke", "Karaoke"), ("bounce", "One word")],
   per="Words on screen", perO=[("1", "1 word"), ("2", "2 words"), ("3", "3 words"), ("4", "4 words")], accent="Highlight", font="Font", fontO=[("bold", "Bold display"), ("sans", "Clean sans")], size="Size",
   outline="Outline", upper="UPPERCASE", pos="Position", posO=[("bottom", "Bottom"), ("middle", "Middle"), ("top", "Top")],
   export="Download video with captions", srt="Download .srt",
   howT="How it works",
   how=["Pick your video. Nothing is uploaded — the audio is read and transcribed on your phone or computer.",
        "Press <strong>Generate subtitles</strong>. Whisper, an open speech-recognition model, writes down every word with its timing.",
        "Tap any line to jump to it and correct a word. Timing stays in sync.",
        "Choose a style and download the MP4 with the captions burned in, or an .srt for YouTube, CapCut or Premiere."],
   faqT="Frequently asked questions",
   faq=[("Is it really free?", "Yes — no sign-up, no watermark, no limits on the number of videos."),
        ("Is my video uploaded?", "No. Speech recognition and video rendering both run on your device. Only the speech model itself is downloaded once."),
        ("How accurate is the Arabic?", "Clear Modern Standard Arabic comes out well; strong dialects and background music lower the accuracy, so review the text before exporting. “Best” accuracy helps."),
        ("How long does it take?", "Roughly real time for transcription on a laptop with “Fast”, and about the length of the video to render. Phones are slower.")],
   rel="More creator tools", links=[("/animated-captions", "Animated Captions (text / .srt)"), ("/creator-studio", "Creator Studio"), ("/motion-titles", "Motion Titles"), ("/glass-slides", "Glass Slides"), ("/paper-animation", "Paper Motion Studio")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="ترجمة الفيديو تلقائيًا", b=("فيديو", "فيديوك لا يغادر جهازك", "مجانية"),
   h1="ترجمة الفيديو تلقائيًا — أضف كابشن متحرك لفيديوك بالذكاء الاصطناعي مجانًا",
   intro="ارفع فيديوك واحصل على كابشن متحرك كلمة بكلمة خلال دقيقة: الكلام يتحوّل إلى نص داخل متصفحك (عربي وإنجليزي وأكثر من 90 لغة)، تعدّل أي كلمة، تختار الستايل وتنزّل الفيديو والترجمة مطبوعة عليه — مع الصوت. أو نزّل ملف SRT. مجانًا، بدون علامة مائية وبدون رفع.",
   s1="١ · فيديوك", drop="اختر فيديو أو اسحبه هنا", dropS="MP4 أو MOV أو WebM · حتى 20 دقيقة", lang="لغة الكلام", langO=[("arabic", "العربية"), ("english", "الإنجليزية"), ("", "تحديد تلقائي")],
   model="الدقة", modelO=[("base", "سريع (≈ 75 ميغا، مرة واحدة)"), ("small", "أدق (≈ 250 ميغا، مرة واحدة)")], go="استخرج الترجمة",
   note="أول مرة يتنزّل نموذج التعرّف على الكلام ويبقى محفوظًا في متصفحك، فالفيديوهات التالية تبدأ فورًا.",
   s2="٢ · صحّح الكلمات", s3="٣ · شكل الكابشن", styles=[("pop", "تكبير"), ("box", "مربع ملوّن"), ("karaoke", "كاريوكي"), ("bounce", "كلمة كلمة")],
   per="كلمات على الشاشة", perO=[("1", "كلمة واحدة"), ("2", "كلمتان"), ("3", "3 كلمات"), ("4", "4 كلمات")], accent="لون التمييز", font="الخط", fontO=[("bold", "عريض"), ("sans", "بسيط")], size="الحجم",
   outline="حدود", upper="أحرف كبيرة (EN)", pos="الموضع", posO=[("bottom", "أسفل"), ("middle", "منتصف"), ("top", "أعلى")],
   export="تنزيل الفيديو مع الترجمة", srt="تنزيل ملف SRT",
   howT="كيف تعمل",
   how=["اختر فيديوك. لا شيء يُرفع — الصوت يُقرأ ويتحوّل لنص على جوالك أو كمبيوترك.",
        "اضغط <strong>استخرج الترجمة</strong>. نموذج Whisper المفتوح يكتب كل كلمة مع توقيتها.",
        "اضغط على أي سطر لتنتقل له وتصحّح أي كلمة، والتوقيت يبقى مضبوطًا.",
        "اختر الستايل ونزّل الفيديو MP4 والترجمة مطبوعة عليه، أو ملف SRT ليوتيوب أو كاب كت أو بريمير."],
   faqT="أسئلة شائعة",
   faq=[("هل هي مجانية فعلًا؟", "نعم — بدون تسجيل وبدون علامة مائية وبدون حد لعدد الفيديوهات."),
        ("هل يُرفع الفيديو؟", "لا. تحويل الكلام لنص وتجهيز الفيديو يتمّان على جهازك. فقط نموذج التعرّف على الكلام يتنزّل مرة واحدة."),
        ("ما دقة العربي؟", "الفصحى الواضحة ممتازة؛ اللهجات القوية والموسيقى العالية تقلل الدقة، لذلك راجع النص قبل التنزيل. خيار «أدق» يساعد."),
        ("كم يستغرق؟", "التحويل تقريبًا بطول الفيديو على اللابتوب مع خيار «سريع»، والتنزيل بنفس المدة تقريبًا. الجوال أبطأ.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/ar/animated-captions", "الترجمة المتحركة (نص / SRT)"), ("/ar/creator-studio", "استوديو صناع المحتوى"), ("/ar/motion-titles", "العناوين المتحركة"), ("/ar/glass-slides", "سلايدات زجاجية"), ("/ar/paper-animation", "استوديو أنيميشن الورق")]),
}
def opts(o): return "".join('<option value="%s">%s</option>' % x for x in o)
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="sb">\n      <div class="sb-col">\n'
    s += ('        <div class="sb-card sb-c1"><h2>%s</h2>\n          <label class="sb-drop" id="sbDrop">%s<strong>%s</strong><span>%s</span><span id="sbName"></span><input type="file" id="sbFile" accept="video/*,.mp4,.mov,.webm,.m4v"></label>\n'
          '          <div class="sb-row" style="margin-top:14px"><label for="sbLang">%s</label><select id="sbLang">%s</select></div>\n'
          '          <div class="sb-row"><label for="sbModel">%s</label><select id="sbModel">%s</select></div>\n'
          '          <button type="button" class="btn sb-go" id="sbGo" disabled>%s</button>\n'
          '          <div id="sbBar" hidden><i id="sbBarFill"></i></div><div id="sbStatus" role="status" aria-live="polite"></div><p class="sb-note">%s</p>\n        </div>\n') % (
          t["s1"], UP, t["drop"], t["dropS"], t["lang"], opts(t["langO"]), t["model"], opts(t["modelO"]), t["go"], t["note"])
    s += '        <div class="sb-card sb-c2" id="sbEdit" hidden><h2>%s <span id="sbInfo"></span></h2><div id="sbCues"></div></div>\n' % t["s2"]
    s += ('        <div class="sb-card sb-c2"><h2>%s</h2>\n          <div id="sbStyles" style="margin-bottom:12px">%s</div>\n'
          '          <div class="sb-row"><label for="sbPer">%s</label><select id="sbPer">%s</select></div>\n'
          '          <div class="sb-row"><label for="sbAccent">%s</label><input type="color" id="sbAccent"></div>\n'
          '          <div class="sb-row"><label for="sbFont">%s</label><select id="sbFont">%s</select></div>\n'
          '          <div class="sb-row"><label for="sbSize">%s</label><input type="range" id="sbSize" min="48" max="150" step="2"></div>\n'
          '          <div class="sb-row"><span class="sb-l"></span><div class="sb-checks"><label><input type="checkbox" id="sbOutline"> %s</label><label><input type="checkbox" id="sbUpper"> %s</label></div></div>\n'
          '          <div class="sb-row"><span class="sb-l">%s</span><div class="sb-chips" id="sbPos" role="group" aria-label="%s">%s</div></div>\n        </div>\n      </div>\n') % (
          t["s3"], "".join('<button type="button" class="sb-s" data-s="%s" aria-pressed="false">%s</button>' % x for x in t["styles"]), t["per"], opts(t["perO"]), t["accent"], t["font"], opts(t["fontO"]), t["size"],
          t["outline"], t["upper"], t["pos"], t["pos"], "".join('<button type="button" class="chip" data-p="%s">%s</button>' % x for x in t["posO"]))
    s += ('      <div class="sb-stage" id="sbStage" hidden>\n        <div class="sb-screen" id="sbScreen"><video id="sbVideo" playsinline controls preload="metadata"></video><canvas id="sbOverlay" width="1280" height="720" aria-hidden="true"></canvas></div>\n'
          '        <div class="sb-out" id="sbOut" hidden><button type="button" class="btn" id="sbExport">%s</button><button type="button" class="btn btn-secondary" id="sbSrt">%s</button></div>\n      </div>\n    </div>\n  </div>\n'
          '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/captions.js"></script>\n  <script src="/subtitles.js"></script>\n\n') % (t["export"], t["srt"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ol class="benefits">\n%s    </ol>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("sb_style.html", STYLE); w("sb_en.html", body("en", False)); w("sb_ar.html", body("ar", True))
print("bodies written")
