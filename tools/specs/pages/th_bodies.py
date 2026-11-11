# Writes the EN/AR bodies + style for the YouTube Thumbnail Maker.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
FACES = "".join('    @font-face{font-family:"QT Lalezar";font-weight:400;font-display:swap;src:url(/fonts/display/lalezar-%s-400.woff2) format("woff2");unicode-range:%s}\n' % (sub, ur)
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
THEMES = [("fire", "#ff4d00", "#8a0b00"), ("neon", "#7b2bff", "#12002e"), ("ocean", "#00b4ff", "#002a6b"), ("lime", "#c6ff00", "#1f7a00"), ("dark", "#2b2f3a", "#06070a"), ("sun", "#ffe600", "#ff9500")]
STYLE = """  <style>
""" + FACES + """    .th{display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.3fr);gap:22px;align-items:start}
    @media(max-width:980px){.th{grid-template-columns:1fr;gap:0}.th-col{display:contents}.th-c1{order:0}.th-stage{order:1;margin-bottom:14px}.th-c2{order:2}}
    .th-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card);margin-bottom:14px}
    .th-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    html[lang=ar] .th-card h2{letter-spacing:0}
    #thTitle{width:100%;min-height:84px;resize:vertical;margin:0;font:700 17px/1.5 inherit;font-family:inherit}
    .th-hint{font-size:13px;color:var(--muted);margin:6px 0 0}
    .th-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .th-row label,.th-row .th-l{font-weight:700;color:var(--text-dim);font-size:14px}
    .th-row input,.th-row select{margin:0}.th-row input[type=color]{height:42px;padding:4px;width:80px}
    @media(max-width:520px){.th-row{grid-template-columns:1fr}}
    .th-files{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .th-files label.btn{cursor:pointer;padding:10px 16px;font-size:14px}.th-files input[type=file]{position:absolute;width:1px;height:1px;opacity:0}
    .th-files label.btn:focus-within{outline:2px solid var(--accent);outline-offset:2px}
    .th-checks{display:flex;flex-wrap:wrap;gap:6px 16px}.th-checks label{display:flex;gap:6px;align-items:center;font-weight:600;font-size:14px;color:var(--text-dim)}
    .th-chips{display:flex;flex-wrap:wrap;gap:6px}
    #thThemes{display:flex;flex-wrap:wrap;gap:8px}
    .th-t{all:unset;cursor:pointer;width:44px;height:44px;border-radius:12px;border:2px solid transparent;box-shadow:inset 0 0 0 1px rgba(255,255,255,.15);transition:transform .15s}
    .th-t:hover{transform:translateY(-2px)}.th-t.on{border-color:var(--cyan);box-shadow:0 0 0 3px rgba(59,226,255,.25)}.th-t:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    @media(min-width:981px){.th-stage{position:sticky;top:80px}}
    .th-screen{border-radius:14px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.6);background:#000;aspect-ratio:16/9}
    #thCanvas{display:block;width:100%;height:100%}
    .th-out{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}.th-out .btn{padding:12px 22px;font-size:15px}
    #thStatus{text-align:center;font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em}
    .th-minis{display:flex;gap:14px;flex-wrap:wrap;margin-top:16px;justify-content:center}
    .th-mini{display:flex;flex-direction:column;gap:6px;width:246px;font-size:12px;color:var(--muted)}
    .th-mini .th-mf{position:relative;border-radius:10px;overflow:hidden}
    .th-mini canvas{display:block;width:100%;height:auto}
    .th-mini .th-dur{position:absolute;right:6px;bottom:6px;background:rgba(0,0,0,.8);color:#fff;font:600 11px/1 system-ui;padding:3px 5px;border-radius:4px}
    .th-mini b{color:var(--text);font-size:13px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .th-mini.sm{width:168px}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="YouTube Thumbnail Maker", b=("Image", "Runs in your browser", "Free"),
   h1="YouTube Thumbnail Maker — Free, With Background Removal &amp; Arabic Text",
   intro="Make a click-worthy 1280×720 YouTube thumbnail in a minute: add your photo and the background is removed automatically, type a huge outlined title, highlight the key words, pick a colour theme and add a badge or arrow. Download a JPG under YouTube’s 2 MB limit — free, no watermark, nothing uploaded.",
   s1="Title", hint="Wrap words in *stars* to highlight them — e.g. I made *$10,000*.", hi="Highlight", hiO=[("color", "Coloured words"), ("box", "Colour box")], badge="Badge", upper="UPPERCASE",
   s2="Photo &amp; background", photo="Add your photo", photoX="Remove photo", cut="Remove background", outline="White outline", bgimg="Background image", bgX="Remove background image", blur="Blur background",
   s3="Layout &amp; colours", layout="Layout", layO=[("right", "Photo right"), ("left", "Photo left"), ("bottom", "Photo bottom"), ("center", "Text only")], theme="Theme", accent="Accent", arrow="Arrow to photo",
   jpg="Download JPG", png="Download PNG", miniT="How it looks in the feed", miniTitle="Your video title goes here — keep it short and clear", mini2="Phone",
   howT="Tips for thumbnails that get clicks",
   how=["Use 3–5 big words. The thumbnail should add to the title, not repeat it.",
        "A face with a clear emotion gets more clicks — the background remover cuts you out and adds a white sticker outline.",
        "Highlight one number or key word in a bright colour.",
        "Keep the bottom-right corner clear: YouTube covers it with the video length.",
        "Check the small previews — if you can’t read it at phone size, make it shorter."],
   faqT="Frequently asked questions",
   faq=[("What size is a YouTube thumbnail?", "1280×720 pixels (16:9), JPG or PNG, under 2 MB. This maker exports exactly that and lowers JPG quality automatically if the file would be too big."),
        ("Is my photo uploaded?", "No. Background removal runs on your device with a small AI model; your photo never leaves your browser."),
        ("Does it support Arabic titles?", "Yes — Arabic is written right-to-left in a bold Arabic display font and the layout mirrors itself."),
        ("Is it free?", "Yes, free with no watermark and no sign-up.")],
   rel="More creator tools", links=[("/youtube-thumbnail-size", "YouTube Thumbnail Size Guide"), ("/remove-background-from-image", "Remove Background"), ("/add-subtitles-to-video", "Auto Subtitles"), ("/creator-studio", "Creator Studio"), ("/motion-titles", "Motion Titles")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="صانع صورة يوتيوب المصغّرة", b=("صورة", "تعمل داخل متصفحك", "مجانية"),
   h1="صانع الصورة المصغّرة لليوتيوب — مجانًا مع إزالة الخلفية وخط عربي عريض",
   intro="اصنع صورة مصغّرة جذابة لليوتيوب بمقاس 1280×720 خلال دقيقة: أضف صورتك وتُزال خلفيتها تلقائيًا، اكتب عنوانًا عريضًا بحدود سوداء، ميّز الكلمات المهمة، اختر الألوان وأضف شارة أو سهمًا. نزّلها JPG أقل من 2 ميغا كما يشترط يوتيوب — مجانًا، بدون علامة مائية ولا يُرفع شيء.",
   s1="العنوان", hint="ضع الكلمات بين *نجمتين* لتمييزها — مثال: ربحت *10,000$*.", hi="التمييز", hiO=[("color", "كلمات ملوّنة"), ("box", "مربع ملوّن")], badge="الشارة", upper="أحرف كبيرة (EN)",
   s2="الصورة والخلفية", photo="أضف صورتك", photoX="إزالة الصورة", cut="إزالة الخلفية", outline="حدود بيضاء", bgimg="صورة خلفية", bgX="إزالة صورة الخلفية", blur="تمويه الخلفية",
   s3="التصميم والألوان", layout="التصميم", layO=[("right", "الصورة يمين"), ("left", "الصورة يسار"), ("bottom", "الصورة أسفل"), ("center", "نص فقط")], theme="الألوان", accent="لون التمييز", arrow="سهم نحو الصورة",
   jpg="تنزيل JPG", png="تنزيل PNG", miniT="كيف تظهر في الصفحة الرئيسية", miniTitle="عنوان الفيديو هنا — اجعله قصيرًا وواضحًا", mini2="الجوال",
   howT="نصائح لصورة مصغّرة تجيب ضغطات",
   how=["استخدم 3–5 كلمات كبيرة فقط. الصورة تكمّل العنوان ولا تكرره.",
        "الوجه مع تعبير واضح يجيب ضغطات أكثر — إزالة الخلفية تقصّك وتضيف حدودًا بيضاء مثل الملصق.",
        "ميّز رقمًا أو كلمة واحدة بلون قوي.",
        "اترك الزاوية السفلية اليمنى فاضية: يوتيوب يضع عليها مدة الفيديو.",
        "شوف المعاينة الصغيرة — إذا ما انقرأت بحجم الجوال، قصّر النص."],
   faqT="أسئلة شائعة",
   faq=[("ما مقاس صورة اليوتيوب المصغّرة؟", "1280×720 بكسل (16:9)، JPG أو PNG، أقل من 2 ميغا. الأداة تصدّر هذا المقاس بالضبط وتخفّض جودة JPG تلقائيًا إذا كان الملف كبيرًا."),
        ("هل تُرفع صورتي؟", "لا. إزالة الخلفية تتم على جهازك بنموذج ذكاء اصطناعي صغير، وصورتك لا تغادر المتصفح."),
        ("هل تدعم العناوين العربية؟", "نعم — العربي من اليمين لليسار بخط عربي عريض، والتصميم ينعكس تلقائيًا."),
        ("هل هي مجانية؟", "نعم، مجانية بدون علامة مائية وبدون تسجيل.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/remove-background-from-image", "إزالة خلفية الصورة"), ("/ar/add-subtitles-to-video", "ترجمة الفيديو تلقائيًا"), ("/ar/creator-studio", "استوديو صناع المحتوى"), ("/ar/motion-titles", "العناوين المتحركة"), ("/ar/social-image-resizer", "مقاسات السوشال ميديا")]),
}
def opts(o): return "".join('<option value="%s">%s</option>' % x for x in o)
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="th">\n      <div class="th-col">\n'
    s += ('        <div class="th-card th-c1"><h2>%s</h2><label for="thTitle" class="sr-only">%s</label><textarea id="thTitle" dir="auto" maxlength="120"></textarea><p class="th-hint">%s</p>\n'
          '          <div class="th-row" style="margin-top:10px"><label for="thHi">%s</label><select id="thHi">%s</select></div>\n'
          '          <div class="th-row"><label for="thBadge">%s</label><input type="text" id="thBadge" maxlength="16" dir="auto"></div>\n'
          '          <div class="th-row"><span class="th-l"></span><div class="th-checks"><label><input type="checkbox" id="thUpper"> %s</label></div></div>\n        </div>\n') % (
          t["s1"], t["s1"], t["hint"], t["hi"], opts(t["hiO"]), t["badge"], t["upper"])
    s += ('        <div class="th-card th-c2"><h2>%s</h2>\n          <div class="th-files"><label class="btn">%s<input type="file" id="thPhoto" accept="image/*"></label><button type="button" class="chip" id="thPhotoClear" hidden>%s</button></div>\n'
          '          <div class="th-checks" style="margin:10px 0 14px"><label><input type="checkbox" id="thCut"> %s</label><label><input type="checkbox" id="thOutline"> %s</label></div>\n'
          '          <div class="th-files"><label class="btn btn-secondary">%s<input type="file" id="thBg" accept="image/*"></label><button type="button" class="chip" id="thBgClear" hidden>%s</button><label class="th-checks"><span style="display:flex;gap:6px;align-items:center;font-weight:600;font-size:14px;color:var(--text-dim)"><input type="checkbox" id="thBlur"> %s</span></label></div>\n        </div>\n') % (
          t["s2"], t["photo"], t["photoX"], t["cut"], t["outline"], t["bgimg"], t["bgX"], t["blur"])
    s += ('        <div class="th-card th-c2"><h2>%s</h2>\n'
          '          <div class="th-row"><span class="th-l">%s</span><div class="th-chips" id="thLayout" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="th-row"><span class="th-l">%s</span><div id="thThemes" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="th-row"><label for="thAccent">%s</label><input type="color" id="thAccent"></div>\n'
          '          <div class="th-row"><span class="th-l"></span><div class="th-checks"><label><input type="checkbox" id="thArrow"> %s</label></div></div>\n        </div>\n      </div>\n') % (
          t["s3"], t["layout"], t["layout"], "".join('<button type="button" class="chip" data-l="%s">%s</button>' % x for x in t["layO"]),
          t["theme"], t["theme"], "".join('<button type="button" class="th-t" data-t="%s" aria-pressed="false" aria-label="%s" style="background:linear-gradient(135deg,%s,%s)"></button>' % (k, k, a, b) for k, a, b in THEMES),
          t["accent"], t["arrow"])
    s += ('      <div class="th-stage">\n        <div class="th-screen"><canvas id="thCanvas" width="1280" height="720" role="img" aria-label="%s"></canvas></div>\n'
          '        <div class="th-out"><button type="button" class="btn" id="thJpg">%s</button><button type="button" class="btn btn-secondary" id="thPng">%s</button></div><div id="thStatus" role="status"></div>\n'
          '        <div class="th-minis" aria-label="%s">\n          <div class="th-mini"><div class="th-mf"><canvas width="492" height="277" aria-hidden="true"></canvas><span class="th-dur">12:34</span></div><b>%s</b><span>QuickTiny · 12K views</span></div>\n'
          '          <div class="th-mini sm"><div class="th-mf"><canvas width="336" height="189" aria-hidden="true"></canvas><span class="th-dur">12:34</span></div><span>%s</span></div>\n        </div>\n      </div>\n    </div>\n  </div>\n'
          '  <script src="/brand.js"></script>\n  <script src="/thumbnail.js"></script>\n\n') % (t["crumb"], t["jpg"], t["png"], t["miniT"], t["miniTitle"], t["mini2"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("th_style.html", STYLE); w("th_en.html", body("en", False)); w("th_ar.html", body("ar", True))
print("bodies written")
