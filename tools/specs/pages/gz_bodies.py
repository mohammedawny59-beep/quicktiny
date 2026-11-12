# Writes EN/AR bodies + style for the GTA 6 Zone (unofficial fan section, gta.js). Original neon design; the official
# logo appears only in the editorial "what we know" box, credited to Rockstar Games.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
FACES = "".join('    @font-face{font-family:"QT Lalezar";font-weight:400;font-display:swap;src:url(/fonts/display/lalezar-%s-400.woff2) format("woff2");unicode-range:%s}\n' % (sub, ur)
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
STYLE = """  <style>
""" + FACES + """    /* the whole page turns into the zone while #gtaZone is on it */
    body:has(#gtaZone){--accent:#ff2d95;--cyan:#3cf0ff;--card:rgba(20,6,40,.62);--line:rgba(255,120,220,.22);--line-strong:rgba(255,120,220,.4);--muted:#d9b8ff;--text-dim:#f3dcff;background:#0b0420!important}
    body:has(#gtaZone) header,body:has(#gtaZone) .site-header{background:rgba(11,4,32,.72)!important;backdrop-filter:blur(10px)}
    body:has(#gtaZone) footer{background:rgba(8,2,18,.85)}
    #gtaWorld{position:fixed;inset:0;width:100vw;height:100vh;z-index:-1;display:block}
    .gta-hero{text-align:center;padding:40px 0 10px}
    .gta-kick{display:inline-block;font:800 12px/1 Sora,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#3cf0ff;border:1px solid rgba(60,240,255,.45);padding:8px 14px;border-radius:999px;background:rgba(0,0,0,.25)}
    html[lang=ar] .gta-kick{letter-spacing:0;font-family:"QT Arabic",sans-serif}
    .gta-title{margin:18px 0 8px;font:400 clamp(54px,12vw,128px)/.95 "QT Lalezar",Sora,sans-serif;background:linear-gradient(180deg,#fff6a8 0%,#ffb347 40%,#ff2d95 75%,#9b30ff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 6px 0 rgba(0,0,0,.45)) drop-shadow(0 0 28px rgba(255,45,149,.55));animation:gtaGlow 3s ease-in-out infinite alternate}
    html[lang=en] .gta-title{font-family:Sora,"Arial Black",sans-serif;font-weight:800;letter-spacing:-.03em}
    @keyframes gtaGlow{to{filter:drop-shadow(0 6px 0 rgba(0,0,0,.45)) drop-shadow(0 0 46px rgba(60,240,255,.55))}}
    .gta-sub{max-width:720px;margin:0 auto;font-size:17px;line-height:1.7;color:#f3dcff;text-shadow:0 2px 10px rgba(0,0,0,.5)}
    #gtaCount{display:flex;justify-content:center;gap:12px;margin:26px 0 8px;flex-wrap:wrap}
    .gta-cell{min-width:92px;padding:14px 10px 10px;border-radius:18px;background:rgba(10,2,25,.6);border:1px solid rgba(255,45,149,.45);box-shadow:0 0 24px rgba(255,45,149,.25),inset 0 0 20px rgba(60,240,255,.08)}
    .gta-cell b{display:block;font:800 46px/1 Sora,sans-serif;color:#fff;text-shadow:0 0 18px #ff2d95;font-variant-numeric:tabular-nums}
    .gta-cell span{display:block;margin-top:6px;font-size:12px;color:#3cf0ff;letter-spacing:.12em;text-transform:uppercase}
    html[lang=ar] .gta-cell span{letter-spacing:0}
    .gta-cell.tick b{animation:gtaTick .45s cubic-bezier(.2,1.6,.4,1)}
    @keyframes gtaTick{from{transform:translateY(-10px) scale(1.15);opacity:.4}}
    @media(max-width:480px){#gtaCount{gap:7px}.gta-cell{min-width:0;flex:1 1 0;padding:10px 4px 8px}.gta-cell b{font-size:30px}.gta-cell span{font-size:10.5px}}
    .gta-out{font:800 34px/1.2 Sora,"QT Lalezar",sans-serif;color:#fff;text-shadow:0 0 22px #3cf0ff}
    .gta-note{font-size:13px;color:#d9b8ff}
    .gta-nav{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:20px 0 6px}
    .gta-nav a{padding:10px 16px;border-radius:999px;border:1px solid rgba(60,240,255,.4);color:#fff;text-decoration:none;font-weight:700;font-size:14px;background:rgba(0,0,0,.3);transition:background .2s,transform .2s}
    .gta-nav a:hover{background:rgba(255,45,149,.35);transform:translateY(-2px)}
    .gta-box{border-radius:24px;padding:22px;margin:22px 0;background:var(--card);border:1px solid var(--line);backdrop-filter:blur(8px);box-shadow:0 30px 60px -40px rgba(255,45,149,.8);scroll-margin-top:80px}
    .gta-box h2{margin:0 0 6px;font:400 30px/1.15 "QT Lalezar",Sora,sans-serif;color:#fff;text-shadow:0 0 18px rgba(255,45,149,.6)}
    html[lang=en] .gta-box h2{font:800 26px/1.2 Sora,sans-serif}
    .gta-box>p{color:#f3dcff;margin:0 0 14px}
    .gta-facts{display:grid;grid-template-columns:200px minmax(0,1fr);gap:22px;align-items:center}
    @media(max-width:640px){.gta-facts{grid-template-columns:1fr;text-align:center}}
    .gta-facts figure{margin:0}.gta-facts img{width:100%;max-width:200px;height:auto;display:block;margin:0 auto;filter:drop-shadow(0 10px 22px rgba(0,0,0,.5))}
    .gta-facts figcaption{font-size:11.5px;color:#cfa8ff;margin-top:8px;line-height:1.5}
    .gta-facts ul{margin:0;padding:0;list-style:none;display:grid;gap:8px}.gta-facts li{color:#fff;font-size:15px}.gta-facts li b{color:#ffb347}
    .gta-src{font-size:12.5px;color:#cfa8ff;margin-top:10px}.gta-src a{color:#3cf0ff}
    .gta-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:20px;align-items:start}
    @media(max-width:860px){.gta-two{grid-template-columns:1fr}}
    .gta-row{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}.gta-row label,.gta-row .gl{font-weight:700;color:#f3dcff;font-size:14px}
    .gta-row input{margin:0}.gta-chips{display:flex;flex-wrap:wrap;gap:6px}
    @media(max-width:520px){.gta-row{grid-template-columns:1fr}}
    .gta-screen{border-radius:16px;overflow:hidden;border:6px solid #15052b;box-shadow:0 0 0 1px rgba(255,120,220,.35),0 24px 50px -24px rgba(255,45,149,.8);background:#000;max-height:60vh;margin:0 auto}
    .gta-screen canvas{display:block;width:100%;height:100%}
    .gta-msg{font-weight:700;color:#f3dcff;min-height:1.4em;margin-top:8px;text-align:center}
    #gtaCrews{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;margin:12px 0}
    .gta-crew{all:unset;cursor:pointer;display:flex;justify-content:space-between;gap:10px;align-items:center;padding:14px 16px;border-radius:14px;background:linear-gradient(135deg,rgba(255,45,149,.18),rgba(60,240,255,.08));border:1px solid rgba(255,120,220,.3);transition:transform .2s,border-color .2s}
    .gta-crew:hover{transform:translateY(-2px);border-color:#3cf0ff}.gta-crew.ok{border-color:#47ff9c}.gta-crew:focus-visible{outline:2px solid #3cf0ff}
    .gta-crew b{color:#fff;font-size:16px}.gta-crew span{font:800 13px/1 Sora,monospace;color:#3cf0ff}
    #gtaWp{display:block;margin:0 auto;border-radius:14px;box-shadow:0 20px 40px -20px rgba(0,0,0,.8)}
    .gta-files label.btn{cursor:pointer}.gta-files input{position:absolute;width:1px;height:1px;opacity:0}
    #gtaCheck{display:grid;gap:8px;margin:10px 0}
    #gtaCheck label{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border-radius:12px;background:rgba(0,0,0,.25);border:1px solid rgba(255,120,220,.2);color:#fff;cursor:pointer;line-height:1.5}
    #gtaCheck input{margin-top:3px;accent-color:#ff2d95;width:18px;height:18px;flex:none}
    .gta-bar{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}.gta-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ff2d95,#ffb347,#3cf0ff);transition:width .4s}
    .gta-kit{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px}
    .gta-kit a{display:block;padding:16px;border-radius:16px;text-decoration:none;color:#fff;background:rgba(0,0,0,.3);border:1px solid rgba(60,240,255,.3);transition:transform .2s,border-color .2s}
    .gta-kit a:hover{transform:translateY(-3px);border-color:#ff2d95}.gta-kit b{display:block;font-size:16px;margin-bottom:4px}.gta-kit span{font-size:13px;color:#d9b8ff;line-height:1.5}
    .gta-disc{font-size:12.5px;color:#cfa8ff;text-align:center;margin:26px 0 8px;line-height:1.6}
    /* arrival through the portal: scanline wipe + chroma flash */
    html.gta-arrive body::after{content:"";position:fixed;inset:0;z-index:9999;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,45,149,.35) 0 2px,rgba(60,240,255,.18) 2px 4px),linear-gradient(180deg,#ff2d95,#3cf0ff);mix-blend-mode:screen;animation:gtaArrive 1.3s cubic-bezier(.2,.8,.2,1) forwards}
    @keyframes gtaArrive{0%{opacity:1;clip-path:inset(0 0 0 0)}60%{opacity:.8}100%{opacity:0;clip-path:inset(100% 0 0 0)}}
    @media (prefers-reduced-motion: reduce){.gta-title{animation:none}html.gta-arrive body::after{display:none}}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="GTA 6 Zone", kick="Fan zone · unofficial", title="GTA 6 ZONE",
   sub="Everything a player and creator needs for launch week: a live countdown, mission-style overlays for your clips, crew names, photo-mode wallpapers and a launch-day checklist. Free, in Arabic and English.",
   cdNote="Countdown to 19 November 2026, midnight your time — Rockstar hasn’t announced the exact unlock time yet.",
   nav=[("#facts", "What we know"), ("#overlays", "Mission overlays"), ("#crews", "Crew names"), ("#wallpapers", "Wallpapers"), ("#checklist", "Launch checklist"), ("#kit", "Creator kit")],
   factsT="What we know so far", logoAlt="Grand Theft Auto VI logo", credit="Grand Theft Auto VI logo © Rockstar Games — shown for news and identification only.",
   facts=["<b>Release:</b> Thursday 19 November 2026", "<b>Platforms:</b> PlayStation 5 and Xbox Series X|S", "<b>PC:</b> not announced yet", "<b>Unlock time:</b> not announced yet"],
   src="Sources", ovT="Mission overlays", ovP="Animated “mission passed / failed / busted” style overlays in our own design — download a green-screen MP4 and drop it on your gameplay clip.",
   kind="Type", kinds=[("passed", "Passed"), ("failed", "Failed"), ("busted", "Busted"), ("respect", "Respect +")], text="Big text", sub2="Small text", bg="Background", bgs=[("green", "Green"), ("blue", "Blue"), ("black", "Black")], ratio="Format", go="⬇ Download overlay MP4",
   crewT="Crew name generator", crewP="Tap a name to copy it with its tag.", more="🎲 More names",
   wpT="Photo-mode wallpapers", wpP="Turn your best screenshot into a phone or desktop wallpaper with a neon finish. Your photo stays on your device.",
   pick="Choose a screenshot", pre="Size", pres=[("phone", "Phone"), ("iphone", "iPhone"), ("desktop", "Desktop 1440p"), ("uhd", "4K")], fx="Finish", fxs=[("neon", "Neon"), ("vhs", "VHS"), ("none", "Clean")], focusX="Focus ↔", focusY="Focus ↕", wgo="⬇ Download wallpaper",
   chT="Launch-day checklist", chP="Ticks are saved in this browser.",
   checks=["Console system software updated", "Free up storage space (the official size isn’t announced yet — leave plenty)", "Online play: an active PlayStation Plus / Xbox Game Pass (Core or above) subscription", "Controller charged + a spare cable", "Recording/streaming set up (capture card or the console’s built-in capture)", "Turn on auto-download / pre-load if your store offers it", "Plan your first clip: hook, captions, thumbnail"],
   kitT="Creator kit for your GTA videos", kit=[("/youtube-thumbnail-maker?theme=vice&title=GTA+6+*first+look*&badge=NEW", "Neon thumbnail", "The thumbnail maker opens with a neon theme and a ready title."), ("/ai-clip-maker", "AI Clip Maker", "Long stream → the best moments as Reels, captions included."), ("/horizontal-to-vertical-video", "Gameplay → vertical", "16:9 gameplay to 9:16 Shorts with a blurred fill."), ("/add-subtitles-to-video", "Auto subtitles", "Burn your commentary in as animated captions."), ("/video-templates#hook", "Reels hook", "A punchy animated opener for your clip.")],
   disc="Unofficial fan section. Not affiliated with, endorsed or sponsored by Rockstar Games or Take-Two Interactive. Grand Theft Auto, GTA and the GTA VI logo are trademarks of their respective owners. All visuals on this page except the credited logo are original."),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="منطقة GTA 6", kick="منطقة اللاعبين · غير رسمية", title="منطقة GTA 6",
   sub="كل اللي يحتاجه اللاعب وصانع المحتوى بأسبوع الإطلاق: عدّاد مباشر، طبقات مهمات متحركة لمقاطعك، أسماء عصابات، خلفيات من لقطاتك وقائمة تجهيز ليوم النزول. مجانًا بالعربي والإنجليزي.",
   cdNote="العدّاد لـ 19 نوفمبر 2026 منتصف الليل بتوقيتك — روكستار لم تعلن ساعة الفتح بالضبط بعد.",
   nav=[("#facts", "اللي نعرفه"), ("#overlays", "طبقات المهمات"), ("#crews", "أسماء العصابات"), ("#wallpapers", "الخلفيات"), ("#checklist", "قائمة التجهيز"), ("#kit", "أدوات صناع المحتوى")],
   factsT="اللي نعرفه لحد الآن", logoAlt="شعار Grand Theft Auto VI", credit="شعار Grand Theft Auto VI ملك لـ Rockstar Games — معروض لأغراض إخبارية وتعريفية فقط.",
   facts=["<b>موعد النزول:</b> الخميس 19 نوفمبر 2026", "<b>المنصات:</b> بلايستيشن 5 وإكسبوكس سيريس X|S", "<b>الكمبيوتر:</b> لم يُعلن بعد", "<b>ساعة الفتح:</b> لم تُعلن بعد"],
   src="المصادر", ovT="طبقات المهمات", ovP="طبقات متحركة على نمط «المهمة نجحت / فشلت / انمسكت» بتصميمنا الخاص — نزّلها MP4 بشاشة خضراء وحطها على مقطع اللعب.",
   kind="النوع", kinds=[("passed", "نجحت"), ("failed", "فشلت"), ("busted", "انمسكت"), ("respect", "احترام +")], text="النص الكبير", sub2="النص الصغير", bg="الخلفية", bgs=[("green", "خضراء"), ("blue", "زرقاء"), ("black", "سوداء")], ratio="المقاس", go="⬇ نزّل الطبقة MP4",
   crewT="مولّد أسماء العصابات", crewP="اضغط على أي اسم لتنسخه مع التاغ.", more="🎲 أسماء جديدة",
   wpT="خلفيات من لقطات التصوير", wpP="حوّل أحلى لقطة عندك لخلفية جوال أو كمبيوتر بلمسة نيون. صورتك تبقى على جهازك.",
   pick="اختر لقطة شاشة", pre="المقاس", pres=[("phone", "جوال"), ("iphone", "آيفون"), ("desktop", "كمبيوتر 1440p"), ("uhd", "4K")], fx="اللمسة", fxs=[("neon", "نيون"), ("vhs", "VHS"), ("none", "بدون")], focusX="التركيز ↔", focusY="التركيز ↕", wgo="⬇ نزّل الخلفية",
   chT="قائمة التجهيز ليوم النزول", chP="العلامات تنحفظ في متصفحك.",
   checks=["حدّث نظام الجهاز", "فضّي مساحة تخزين (الحجم الرسمي لم يُعلن بعد — خلّي مساحة كبيرة)", "للعب أونلاين: اشتراك فعّال في PlayStation Plus أو Xbox Game Pass (Core أو أعلى)", "اشحن اليد وجهّز كيبل احتياط", "جهّز التسجيل أو البث (كرت كابتشر أو التسجيل المدمج بالجهاز)", "فعّل التنزيل التلقائي أو التنزيل المسبق إذا المتجر وفّره", "خطّط لأول مقطع: بداية تشد، ترجمة، وصورة مصغّرة"],
   kitT="أدوات صناع المحتوى لفيديوهات GTA", kit=[("/youtube-thumbnail-maker?theme=vice&title=GTA+6+*أول+نظرة*&badge=جديد", "صورة مصغّرة نيون", "صانع الصورة المصغّرة يفتح بثيم نيون وعنوان جاهز."), ("/ar/ai-clip-maker", "صانع الريلز بالذكاء الاصطناعي", "بث طويل ← أقوى اللحظات كريلز مع الترجمة."), ("/ar/horizontal-to-vertical-video", "اللعب ← عمودي", "حوّل مقطع 16:9 لشورت 9:16 بخلفية مموّهة."), ("/ar/add-subtitles-to-video", "ترجمة تلقائية", "حط تعليقك كترجمة متحركة على الفيديو."), ("/ar/video-templates#hook", "افتتاحية ريلز", "بداية متحركة قوية لمقطعك.")],
   disc="قسم معجبين غير رسمي، غير تابع أو معتمد أو مموّل من Rockstar Games أو Take-Two Interactive. Grand Theft Auto وGTA وشعار GTA VI علامات تجارية لأصحابها. كل التصاميم في هذه الصفحة أصلية ما عدا الشعار المذكور مصدره."),
}
SOURCES = [("https://www.rockstargames.com/VI", "Rockstar Games"), ("https://www.gamesradar.com/gta-6-guide", "GamesRadar"), ("https://www.tomsguide.com/news/gta-6", "Tom's Guide")]
def chips(i, attr, o, active): return '<div class="gta-chips" id="%s" role="group">%s</div>' % (i, "".join('<button type="button" class="chip%s" data-%s="%s">%s</button>' % (" active" if k == active else "", attr, k, v) for k, v in o))
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <canvas id="gtaWorld" aria-hidden="true"></canvas>\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n%s'
         '  <section class="gta-hero" id="gtaZone">\n    <span class="gta-kick">%s</span>\n    <h1 class="gta-title">%s</h1>\n    <p class="gta-sub">%s</p>\n'
         '    <div id="gtaCount" role="timer" aria-live="off">%s</div>\n    <p class="gta-note">%s</p>\n    <nav class="gta-nav" aria-label="%s">%s</nav>\n  </section>\n\n') % (
         t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["kick"], t["title"], t["sub"],
         "".join('<div class="gta-cell" id="%s"><b>--</b><span></span></div>' % i for i in ("gtaD", "gtaH", "gtaM", "gtaS")), t["cdNote"], t["crumb"],
         "".join('<a href="%s">%s</a>' % x for x in t["nav"]))
    s += ('  <section class="gta-box" id="facts">\n    <h2>%s</h2>\n    <div class="gta-facts"><figure><img src="/assets/gta6/gta6-logo.webp" width="286" height="222" alt="%s" loading="lazy"><figcaption>%s</figcaption></figure>\n'
          '    <div><ul>%s</ul><p class="gta-src">%s: %s</p></div></div>\n  </section>\n\n') % (t["factsT"], t["logoAlt"], t["credit"], "".join("<li>%s</li>" % f for f in t["facts"]), t["src"],
          " · ".join('<a href="%s" rel="noopener" target="_blank">%s</a>' % x for x in SOURCES))
    s += ('  <section class="gta-box" id="overlays">\n    <h2>%s</h2>\n    <p>%s</p>\n    <div class="gta-two"><div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <div class="gta-row"><label for="gtaOvlTitle">%s</label><input type="text" id="gtaOvlTitle" dir="auto" maxlength="40"></div>\n'
          '      <div class="gta-row"><label for="gtaOvlSub">%s</label><input type="text" id="gtaOvlSub" dir="auto" maxlength="50"></div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <button type="button" class="btn" id="gtaOvlGo">%s</button><div class="gta-msg" id="gtaOvlMsg" role="status"></div>\n'
          '    </div><div class="gta-screen"><canvas id="gtaOvl" width="960" height="540" role="img" aria-label="%s"></canvas></div></div>\n  </section>\n\n') % (
          t["ovT"], t["ovP"], t["kind"], chips("gtaOvlKind", "k", t["kinds"], "passed"), t["text"], t["sub2"], t["bg"], chips("gtaOvlBg", "b", t["bgs"], "green"),
          t["ratio"], chips("gtaOvlRatio", "r", [("16:9", "16:9"), ("9:16", "9:16")], "16:9"), t["go"], t["ovT"])
    s += ('  <section class="gta-box" id="crews">\n    <h2>%s</h2>\n    <p>%s</p>\n    <div id="gtaCrews"></div>\n    <button type="button" class="btn" id="gtaCrewGo">%s</button><div class="gta-msg" id="gtaCrewMsg" role="status"></div>\n  </section>\n\n') % (t["crewT"], t["crewP"], t["more"])
    s += ('  <section class="gta-box" id="wallpapers">\n    <h2>%s</h2>\n    <p>%s</p>\n    <div class="gta-two"><div>\n'
          '      <div class="gta-files" style="margin-bottom:12px"><label class="btn">%s<input type="file" id="gtaWpFile" accept="image/*"></label></div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <div class="gta-row"><span class="gl">%s</span>%s</div>\n'
          '      <div class="gta-row"><label for="gtaWpX">%s</label><input type="range" id="gtaWpX" min="0" max="100" value="50"></div>\n'
          '      <div class="gta-row"><label for="gtaWpY">%s</label><input type="range" id="gtaWpY" min="0" max="100" value="50"></div>\n'
          '      <button type="button" class="btn" id="gtaWpGo">%s</button><div class="gta-msg" id="gtaWpMsg" role="status"></div>\n'
          '    </div><div><canvas id="gtaWp" width="180" height="390" role="img" aria-label="%s"></canvas></div></div>\n  </section>\n\n') % (
          t["wpT"], t["wpP"], t["pick"], t["pre"], chips("gtaWpPre", "p", t["pres"], "phone"), t["fx"], chips("gtaWpFx", "f", t["fxs"], "neon"), t["focusX"], t["focusY"], t["wgo"], t["wpT"])
    s += ('  <section class="gta-box" id="checklist">\n    <h2>%s</h2>\n    <p>%s <b id="gtaCheckN"></b></p>\n    <div class="gta-bar"><i id="gtaCheckBar"></i></div>\n    <div id="gtaCheck">%s</div>\n  </section>\n\n') % (
          t["chT"], t["chP"], "".join('<label><input type="checkbox" id="gtaC%d"> <span>%s</span></label>' % (i, c) for i, c in enumerate(t["checks"])))
    s += ('  <section class="gta-box" id="kit">\n    <h2>%s</h2>\n    <div class="gta-kit">%s</div>\n  </section>\n\n') % (t["kitT"], "".join('<a href="%s"><b>%s</b><span>%s</span></a>' % k for k in t["kit"]))
    s += '  <p class="gta-disc">%s</p>\n  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/gta.js"></script>\n</div>\n' % t["disc"]
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("gz_style.html", STYLE); w("gz_en.html", body("en", False)); w("gz_ar.html", body("ar", True))
print("bodies written")
