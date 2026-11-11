# Writes the EN/AR bodies + style for Motion Titles (animated overlays for video creators).
import io, os, importlib.util
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("pm", os.path.join(here, "pm_bodies.py"))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
FACES = "".join('    @font-face{font-family:"QT %s";font-weight:%s;font-display:swap;src:url(/fonts/display/%s-%s-%s.woff2) format("woff2");unicode-range:%s}\n' % (fam, w, f, sub, w, ur)
    for fam, f, w in (("Lalezar", "lalezar", "400"), ("Rakkas", "rakkas", "400"))
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
STYLE = """  <style>
""" + FACES + """    .mt{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.3fr);gap:22px;align-items:start}
    @media(max-width:980px){.mt{grid-template-columns:1fr}.mt-stage{order:-1}}
    .mt-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card);margin-bottom:14px}
    .mt-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    html[lang=ar] .mt-card h2{letter-spacing:0}
    #mtTpl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
    @media(max-width:520px){#mtTpl{grid-template-columns:repeat(2,minmax(0,1fr))}}
    .mt-t{all:unset;cursor:pointer;display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center;padding:12px 8px;border-radius:14px;border:1px solid var(--line);background:linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.01));transition:transform .2s,border-color .2s,box-shadow .2s}
    .mt-t i{font-style:normal;font-size:26px}.mt-t b{font-size:14px;color:var(--text)}
    .mt-t:hover{transform:translateY(-3px);border-color:var(--accent)}
    .mt-t.on{border-color:var(--cyan);box-shadow:0 0 0 2px rgba(59,226,255,.25),0 14px 30px -18px rgba(59,226,255,.6)}
    .mt-t:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
    .mt-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .mt-row label,.mt-row .mt-l{font-weight:700;color:var(--text-dim);font-size:14px}
    .mt-row input,.mt-row select{margin:0}.mt-row input[type=color]{height:42px;padding:4px;width:80px}
    @media(max-width:520px){.mt-row{grid-template-columns:1fr}}
    .mt-chips{display:flex;flex-wrap:wrap;gap:6px}
    .mt-stage{position:sticky;top:80px}
    .mt-screen{position:relative;margin:0 auto;max-width:100%;max-height:72vh;border-radius:16px;overflow:hidden;border:10px solid #15172a;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.7);background:#000}
    #mtCanvas{display:block;width:100%;height:100%}
    .mt-ctrl{display:flex;align-items:center;gap:10px;margin-top:12px}
    .mt-ctrl button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line-strong);background:var(--card);color:var(--text);cursor:pointer;flex:none}
    .mt-ctrl input{flex:1;margin:0;accent-color:var(--accent)}
    .mt-export{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}.mt-export .btn{padding:12px 22px;font-size:15px}
    #mtStatus{text-align:center;font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em}
    #mtBar{height:6px;border-radius:999px;background:var(--card);overflow:hidden;margin-top:8px}
    #mtBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan))}
    .mt-note{font-size:13px;color:var(--muted);text-align:center;margin-top:8px}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Motion Titles", b=("Video", "Runs in your browser", "Free"),
   h1="Motion Titles — Free Animated Lower Thirds, Subscribe Button &amp; Overlays",
   intro="Animated overlays for YouTube, Reels and TikTok: name lower thirds, a subscribe button that gets clicked, big animated titles, hand-drawn arrows, 3-2-1 countdowns and like/comment reminders. Type your text, pick a colour and download a green-screen MP4 to drop on top of your video. Arabic and English, free, no watermark.",
   tpls=[("lower", "🪪", "Lower third"), ("subscribe", "🔔", "Subscribe"), ("title", "🎬", "Big title"), ("arrow", "↗️", "Arrow + label"), ("countdown", "⏱️", "Countdown"), ("like", "❤️", "Like &amp; comment")],
   s1="Template", s2="Text &amp; look", a="Main text", b2="Second line", accent="Colour", pos="Position", posO=[("start", "Start side"), ("end", "End side")], count="Like count",
   bg="Background", bgs=[("green", "Green screen"), ("blue", "Blue screen"), ("black", "Black"), ("photo", "Preview on video")], ratio="Format",
   export="Download MP4", note="“Preview on video” is only for looking; the download uses a green screen.",
   howT="How to put it on your video",
   how=["Download the MP4 with a <strong>green screen</strong> (or blue if your video has a lot of green).",
        "In CapCut: <em>Overlay</em> → add the clip → <em>Remove background</em> → <em>Chroma key</em> → pick the green. In Premiere / DaVinci use <em>Ultra Key</em> / <em>3D Keyer</em>.",
        "Use 16:9 for YouTube and 9:16 for Reels, TikTok and Shorts so the overlay sits in the right place.",
        "Pick a colour that matches your brand and reuse it everywhere for a consistent channel look."],
   faqT="Frequently asked questions",
   faq=[("Is it free with no watermark?", "Yes, unlimited free downloads with no watermark."),
        ("Can I get a transparent background?", "Videos with transparency aren't supported by most phone editors, so the tool exports a clean green or blue screen that every editor can key out in one click."),
        ("Does it support Arabic?", "Yes. Arabic text runs right-to-left with proper letter joining, and the layout mirrors itself for Arabic."),
        ("Are the YouTube or Instagram logos included?", "No. The overlays use neutral designs, so you can use them on any platform without trademark issues.")],
   rel="More creator tools", links=[("/paper-animation", "Paper Motion Studio"), ("/remove-background-from-image", "Remove Background"), ("/social-image-resizer", "Social Image Resizer"), ("/image-to-text", "Image to Text")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="العناوين المتحركة", b=("فيديو", "تعمل داخل متصفحك", "مجانية"),
   h1="العناوين المتحركة — شريط الاسم وزر الاشتراك وعناصر متحركة لفيديوهاتك مجانًا",
   intro="عناصر متحركة جاهزة لليوتيوب والريلز والتيك توك: شريط الاسم والصفة، زر «اشترك» يُضغط عليه، عنوان كبير متحرك، سهم مرسوم باليد، عد تنازلي 3-2-1، وتذكير اللايك والتعليق. اكتب نصك واختر لونك ونزّل فيديو MP4 بشاشة خضراء لتضعه فوق فيديوك. عربي وإنجليزي، مجانًا وبدون علامة مائية.",
   tpls=[("lower", "🪪", "شريط الاسم"), ("subscribe", "🔔", "زر الاشتراك"), ("title", "🎬", "عنوان كبير"), ("arrow", "↗️", "سهم وتعليق"), ("countdown", "⏱️", "عد تنازلي"), ("like", "❤️", "لايك وتعليق")],
   s1="العنصر", s2="النص والشكل", a="النص الرئيسي", b2="السطر الثاني", accent="اللون", pos="الموضع", posO=[("start", "جهة البداية"), ("end", "الجهة الأخرى")], count="عدد اللايكات",
   bg="الخلفية", bgs=[("green", "شاشة خضراء"), ("blue", "شاشة زرقاء"), ("black", "سوداء"), ("photo", "معاينة فوق فيديو")], ratio="المقاس",
   export="تنزيل MP4", note="«معاينة فوق فيديو» للعرض فقط؛ التنزيل يكون بشاشة خضراء.",
   howT="كيف تضعه فوق فيديوك",
   how=["نزّل الفيديو بـ<strong>شاشة خضراء</strong> (أو زرقاء إذا كان في فيديوك لون أخضر كثير).",
        "في كاب كت: <em>تراكب</em> ← أضف المقطع ← <em>إزالة الخلفية</em> ← <em>مفتاح اللون (Chroma key)</em> ← اختر الأخضر. وفي بريمير أو دافنشي استخدم Ultra Key أو 3D Keyer.",
        "استخدم 16:9 لليوتيوب و9:16 للريلز والتيك توك والشورتس حتى يظهر العنصر في مكانه الصحيح.",
        "اختر لونًا يناسب هوية قناتك واستخدمه في كل العناصر لمظهر موحّد."],
   faqT="أسئلة شائعة",
   faq=[("هل هو مجاني وبدون علامة مائية؟", "نعم، تنزيل مجاني غير محدود وبدون علامة مائية."),
        ("هل يمكن تنزيله بخلفية شفافة؟", "أغلب برامج المونتاج على الجوال لا تدعم الفيديو الشفاف، لذلك نصدّره بشاشة خضراء أو زرقاء نظيفة تُزال بضغطة واحدة في أي برنامج."),
        ("هل يدعم العربي؟", "نعم، النص العربي من اليمين لليسار بحروف متصلة صحيحة، والتصميم ينعكس تلقائيًا للعربي."),
        ("هل فيه شعارات يوتيوب أو إنستغرام؟", "لا، التصاميم محايدة حتى تستخدمها على أي منصة بدون مشاكل حقوق.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/ar/paper-animation", "استوديو أنيميشن الورق"), ("/remove-background-from-image", "إزالة خلفية الصورة"), ("/ar/social-image-resizer", "مقاسات السوشال ميديا"), ("/ar/image-to-text", "استخراج النص من الصور")]),
}
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="mt">\n      <div>\n'
    s += '        <div class="mt-card"><h2>%s</h2><div id="mtTpl">%s</div></div>\n' % (t["s1"], "".join('<button type="button" class="mt-t" data-t="%s" aria-pressed="false"><i aria-hidden="true">%s</i><b>%s</b></button>' % x for x in t["tpls"]))
    s += ('        <div class="mt-card"><h2>%s</h2>\n'
          '          <div class="mt-row"><label for="mtA">%s</label><input type="text" id="mtA" maxlength="40" dir="auto"></div>\n'
          '          <div class="mt-row" id="mtBRow"><label for="mtB">%s</label><input type="text" id="mtB" maxlength="50" dir="auto"></div>\n'
          '          <div class="mt-row" id="mtCountRow"><label for="mtCount">%s</label><input type="number" id="mtCount" min="1" max="9999999"></div>\n'
          '          <div class="mt-row"><label for="mtAccent">%s</label><input type="color" id="mtAccent"></div>\n'
          '          <div class="mt-row" id="mtPosRow"><label for="mtPos">%s</label><select id="mtPos">%s</select></div>\n'
          '          <div class="mt-row"><span class="mt-l">%s</span><div class="mt-chips" id="mtBg" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="mt-row"><span class="mt-l">%s</span><div class="mt-chips" id="mtRatio" role="group" aria-label="%s"><button type="button" class="chip" data-r="16:9">16:9</button><button type="button" class="chip" data-r="9:16">9:16</button><button type="button" class="chip" data-r="1:1">1:1</button></div></div>\n'
          '        </div>\n      </div>\n') % (t["s2"], t["a"], t["b2"], t["count"], t["accent"], t["pos"], "".join('<option value="%s">%s</option>' % o for o in t["posO"]),
                                           t["bg"], t["bg"], "".join('<button type="button" class="chip" data-b="%s">%s</button>' % o for o in t["bgs"]), t["ratio"], t["ratio"])
    s += ('      <div class="mt-stage">\n        <div class="mt-screen"><canvas id="mtCanvas" width="1920" height="1080" role="img" aria-label="%s"></canvas></div>\n'
          '        <div class="mt-ctrl"><button type="button" id="mtPlay" aria-label="Play / pause">❚❚</button><input type="range" id="mtScrub" min="0" max="1000" value="0" aria-label="Timeline"></div>\n'
          '        <div class="mt-export"><button type="button" class="btn" id="mtExport">%s</button></div>\n'
          '        <div id="mtBar" hidden><i id="mtBarFill"></i></div><div id="mtStatus" role="status"></div><p class="mt-note">%s</p>\n      </div>\n    </div>\n  </div>\n'
          '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/motion-titles.js"></script>\n\n') % (t["crumb"], t["export"], t["note"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("mt_style.html", STYLE); w("mt_en.html", body("en", False)); w("mt_ar.html", body("ar", True))
print("bodies written")
