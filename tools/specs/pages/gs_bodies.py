# Writes the EN/AR bodies + style for Glass Slides.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .gs{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,440px);gap:22px;align-items:start}
    @media(max-width:940px){.gs{grid-template-columns:1fr}.gs-stage{order:-1}}
    .gs-card{position:relative;border-radius:24px;padding:18px;margin-bottom:14px;background:linear-gradient(160deg,rgba(255,255,255,.10),rgba(255,255,255,.03));border:1px solid rgba(255,255,255,.16);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 20px 50px -30px rgba(0,0,0,.7);backdrop-filter:blur(18px) saturate(1.4);-webkit-backdrop-filter:blur(18px) saturate(1.4)}
    html[data-theme=light] .gs-card{background:linear-gradient(160deg,rgba(255,255,255,.85),rgba(255,255,255,.6));border-color:rgba(20,24,70,.1)}
    .gs-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    html[lang=ar] .gs-card h2{letter-spacing:0}
    .gs-slide{display:grid;grid-template-columns:34px minmax(0,1fr) auto;gap:10px;align-items:start;padding:10px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.03);margin-bottom:8px;animation:gsIn .35s cubic-bezier(.16,1,.3,1)}
    @keyframes gsIn{from{opacity:0;transform:translateY(-6px)}}
    .gs-n{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--cyan));color:#fff;font-size:13px}
    .gs-f input,.gs-f textarea{margin:0 0 6px;font-family:var(--font-ui)}
    .gs-f input{font-weight:700}.gs-f textarea{min-height:52px;font-size:14px;margin:0}
    .gs-b{display:flex;flex-direction:column;gap:4px}
    .gs-b button{width:32px;height:30px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--text-dim);cursor:pointer}
    .gs-b button:hover{border-color:var(--accent);color:var(--text)}
    #gsThemes{display:flex;gap:10px;flex-wrap:wrap}
    .gs-th{all:unset;cursor:pointer;width:54px;height:54px;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25);transition:transform .2s,box-shadow .2s}
    .gs-th:hover{transform:translateY(-3px)}
    .gs-th.on{box-shadow:inset 0 0 0 2px #fff,0 0 0 3px rgba(59,226,255,.45)}
    .gs-th:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
    .gs-row{display:grid;grid-template-columns:130px minmax(0,1fr);gap:10px;align-items:center;margin-top:10px}
    .gs-row label,.gs-row .gs-l{font-weight:700;color:var(--text-dim);font-size:14px}
    .gs-row select,.gs-row input{margin:0}
    @media(max-width:520px){.gs-row{grid-template-columns:1fr}}
    .gs-chips{display:flex;gap:6px;flex-wrap:wrap}
    .gs-stage{position:sticky;top:80px}
    .gs-frame{position:relative;margin:0 auto;width:min(100%,400px);padding:10px;border-radius:40px;background:linear-gradient(160deg,rgba(255,255,255,.22),rgba(255,255,255,.05));box-shadow:inset 0 1px 0 rgba(255,255,255,.4),0 40px 90px -30px rgba(107,91,255,.75);backdrop-filter:blur(10px)}
    .gs-screen{position:relative;border-radius:32px;overflow:hidden;background:#000;aspect-ratio:9/16}
    #gsCanvas{display:block;width:100%;height:100%}
    .gs-ctrl{display:flex;align-items:center;gap:10px;margin:12px auto 0;width:min(100%,400px)}
    .gs-ctrl button{width:42px;height:42px;border-radius:50%;border:1px solid var(--line-strong);background:var(--card);color:var(--text);cursor:pointer;flex:none}
    .gs-ctrl input{flex:1;margin:0;accent-color:var(--accent)}
    .gs-export{display:flex;justify-content:center;margin-top:14px}.gs-export .btn{padding:13px 26px;font-size:15px}
    #gsStatus{text-align:center;font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em}
    #gsBar{height:6px;border-radius:999px;background:var(--card);overflow:hidden;width:min(100%,400px);margin:8px auto 0}
    #gsBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan))}
    @media (prefers-reduced-motion:reduce){.gs-slide{animation:none}}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Glass Slides", b=("Video", "Runs in your browser", "Free"),
   h1="Glass Slides — Smooth Liquid-Glass Slide Videos at 60 fps",
   intro="Write a few slides and get a silky slide video: frosted glass cards floating over a slowly moving colour mesh (or your own photo), with spring-smooth transitions and text that fades in line by line. Export a 60 fps MP4 for Reels, TikTok, Shorts or a presentation. Arabic and English, free, no watermark.",
   sT="Slides", add="+ Add slide", lT="Look", theme="Colour mood", photo="Background photo", photoB="Use my photo", photoC="Remove photo", align="Text alignment", alO=[("center", "Centred"), ("start", "Start")],
   per="Seconds per slide", ratio="Format", fps="Smoothness", export="Download MP4",
   howT="Tips for a polished result",
   how=["Keep each slide short: a title of 2–5 words and one supporting line reads best on a phone.",
        "<strong>60 fps</strong> gives the smoothest motion (Instagram and TikTok keep it); choose 30 fps for smaller files.",
        "Use your own photo as the background for a branded look; the glass blurs it automatically behind the text.",
        "Between 2 and 3 seconds per slide feels calm; under 2 seconds feels energetic."],
   faqT="Frequently asked questions",
   faq=[("Is it free with no watermark?", "Yes. Downloads are free, unlimited and watermark-free."),
        ("Does it support Arabic?", "Yes. Arabic slides run right-to-left with proper letter joining."),
        ("Why 60 fps?", "Twice as many frames as standard video, so transitions and the moving background look silky, especially on newer phones."),
        ("Is anything uploaded?", "No. Your text and photo stay in your browser and the video is created on your device.")],
   rel="More creator tools", links=[("/paper-animation", "Paper Motion Studio"), ("/motion-titles", "Motion Titles"), ("/social-image-resizer", "Social Image Resizer"), ("/remove-background-from-image", "Remove Background")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="سلايدات زجاجية", b=("فيديو", "تعمل داخل متصفحك", "مجانية"),
   h1="سلايدات زجاجية — فيديو سلايدات بتصميم الزجاج الشفاف بسلاسة 60 إطارًا",
   intro="اكتب عدة سلايدات واحصل على فيديو ناعم جدًا: بطاقات زجاجية شفافة تطفو فوق ألوان تتحرك ببطء (أو صورتك أنت)، بانتقالات نابضة سلسة ونص يظهر سطرًا سطرًا. نزّله MP4 بسلاسة 60 إطارًا للريلز والتيك توك والشورتس أو للعروض. عربي وإنجليزي، مجانًا وبدون علامة مائية.",
   sT="السلايدات", add="+ أضف سلايد", lT="الشكل", theme="الألوان", photo="صورة خلفية", photoB="استخدم صورتي", photoC="إزالة الصورة", align="محاذاة النص", alO=[("center", "في الوسط"), ("start", "من البداية")],
   per="ثوانٍ لكل سلايد", ratio="المقاس", fps="السلاسة", export="تنزيل MP4",
   howT="نصائح لنتيجة احترافية",
   how=["اجعل كل سلايد قصيرًا: عنوان من 2 إلى 5 كلمات وسطر واحد يشرحه يُقرأ أفضل على الجوال.",
        "<strong>60 إطارًا</strong> تعطي أنعم حركة (إنستغرام وتيك توك يحتفظان بها)، واختر 30 لملف أصغر.",
        "استخدم صورتك كخلفية لمظهر خاص بك، والزجاج يمسح الصورة تلقائيًا خلف النص.",
        "من 2 إلى 3 ثوانٍ لكل سلايد إيقاع هادئ، وأقل من ثانيتين إيقاع سريع وحماسي."],
   faqT="أسئلة شائعة",
   faq=[("هل هو مجاني وبدون علامة مائية؟", "نعم، التنزيل مجاني وغير محدود وبدون علامة مائية."),
        ("هل يدعم العربي؟", "نعم، السلايدات العربية من اليمين لليسار بحروف متصلة صحيحة."),
        ("لماذا 60 إطارًا؟", "ضعف عدد الإطارات في الفيديو العادي، فتبدو الانتقالات والخلفية المتحركة ناعمة جدًا خاصة على الجوالات الحديثة."),
        ("هل يُرفع شيء؟", "لا، نصك وصورتك يبقيان في متصفحك والفيديو يُصنع على جهازك.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/ar/paper-animation", "استوديو أنيميشن الورق"), ("/ar/motion-titles", "العناوين المتحركة"), ("/ar/social-image-resizer", "مقاسات السوشال ميديا"), ("/remove-background-from-image", "إزالة خلفية الصورة")]),
}
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += ('  <div class="tool-panel" id="tool">\n    <div class="gs">\n      <div>\n'
          '        <div class="gs-card"><h2>%s</h2><div id="gsList"></div><button type="button" class="btn btn-secondary" id="gsAdd">%s</button></div>\n'
          '        <div class="gs-card"><h2>%s</h2>\n'
          '          <div class="gs-row"><span class="gs-l">%s</span><div id="gsThemes" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="gs-row"><span class="gs-l">%s</span><div class="gs-chips"><label class="btn btn-secondary" for="gsPhoto" style="cursor:pointer">%s</label><input type="file" id="gsPhoto" accept="image/*" class="sr-only"><button type="button" class="btn btn-secondary" id="gsPhotoClear" hidden>%s</button></div></div>\n'
          '          <div class="gs-row"><label for="gsAlign">%s</label><select id="gsAlign">%s</select></div>\n'
          '          <div class="gs-row"><label for="gsPer">%s <b id="gsPerV" dir="ltr"></b></label><input type="range" id="gsPer" min="1.5" max="5" step="0.1"></div>\n'
          '          <div class="gs-row"><span class="gs-l">%s</span><div class="gs-chips" id="gsRatio" role="group" aria-label="%s"><button type="button" class="chip" data-r="9:16">9:16</button><button type="button" class="chip" data-r="16:9">16:9</button><button type="button" class="chip" data-r="1:1">1:1</button></div></div>\n'
          '          <div class="gs-row"><span class="gs-l">%s</span><div class="gs-chips" id="gsFps" role="group" aria-label="%s"><button type="button" class="chip" data-f="60">60 fps</button><button type="button" class="chip" data-f="30">30 fps</button></div></div>\n'
          '        </div>\n      </div>\n'
          ) % (t["sT"], t["add"], t["lT"], t["theme"], t["theme"], "".join('<button type="button" class="gs-th" data-th="%s" aria-label="%s" aria-pressed="false"></button>' % (k, k) for k in ("aurora", "sunset", "ocean", "candy", "mono")),
               t["photo"], t["photoB"], t["photoC"], t["align"], "".join('<option value="%s">%s</option>' % o for o in t["alO"]), t["per"], t["ratio"], t["ratio"], t["fps"], t["fps"])
    s += ('      <div class="gs-stage">\n        <div class="gs-frame"><div class="gs-screen"><canvas id="gsCanvas" width="1080" height="1920" role="img" aria-label="%s"></canvas></div></div>\n'
          '        <div class="gs-ctrl"><button type="button" id="gsPlay" aria-label="Play / pause">❚❚</button><input type="range" id="gsScrub" min="0" max="1000" value="0" aria-label="Timeline"></div>\n'
          '        <div class="gs-export"><button type="button" class="btn" id="gsExport">%s</button></div>\n'
          '        <div id="gsBar" hidden><i id="gsBarFill"></i></div><div id="gsStatus" role="status"></div>\n      </div>\n    </div>\n  </div>\n'
          '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/glass-slides.js"></script>\n\n') % (t["crumb"], t["export"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("gs_style.html", STYLE); w("gs_en.html", body("en", False)); w("gs_ar.html", body("ar", True))
print("bodies written")
