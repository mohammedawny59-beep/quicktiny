# Writes EN/AR bodies + style for the AI Clip Maker (clipper.js).
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
UP = '<svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4-2.5z"/></svg>'
FACES = "".join('    @font-face{font-family:"QT Lalezar";font-weight:400;font-display:swap;src:url(/fonts/display/lalezar-%s-400.woff2) format("woff2");unicode-range:%s}\n' % (sub, ur)
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
STYLE = """  <style>
""" + FACES + """    .ac-top{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,.9fr);gap:22px;align-items:start}
    @media(max-width:900px){.ac-top{grid-template-columns:1fr}}
    .ac-card{border:1px solid var(--line);border-radius:20px;padding:18px 20px;background:var(--card);margin-bottom:14px}
    .ac-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}html[lang=ar] .ac-card h2{letter-spacing:0}
    .ac-drop{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:30px 16px;border:2px dashed var(--line-strong);border-radius:18px;cursor:pointer;color:var(--text-dim);transition:border-color .2s,background .2s;background:linear-gradient(135deg,rgba(91,91,255,.08),rgba(59,226,255,.04))}
    .ac-drop.over,.ac-drop:hover{border-color:var(--accent);background:rgba(91,91,255,.1)}.ac-drop strong{color:var(--text);font-size:17px}
    .ac-drop input{position:absolute;width:1px;height:1px;opacity:0}.ac-drop:focus-within{outline:2px solid var(--accent);outline-offset:2px}
    #clName{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
    .ac-row{display:grid;grid-template-columns:130px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .ac-row label,.ac-row .ac-l{font-weight:700;color:var(--text-dim);font-size:14px}.ac-row select,.ac-row input{margin:0}.ac-row input[type=color]{height:42px;padding:4px;width:80px}
    @media(max-width:520px){.ac-row{grid-template-columns:1fr}}
    .ac-chips{display:flex;flex-wrap:wrap;gap:6px}.ac-checks{display:flex;flex-wrap:wrap;gap:8px 16px}.ac-checks label{display:flex;gap:6px;align-items:center;font-weight:600;font-size:14px;color:var(--text-dim)}
    .ac-go{width:100%;padding:15px 22px;font-size:17px;margin-top:8px}
    #clStatus{font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em;text-align:center}
    #clBar{height:7px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;margin-top:8px}#clBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan));transition:width .3s}
    .ac-note{font-size:13px;color:var(--muted);margin:8px 0 0}
    .ac-steps{display:grid;gap:10px;counter-reset:s}.ac-steps li{list-style:none;display:flex;gap:12px;align-items:flex-start;font-size:14.5px;color:var(--text-dim);line-height:1.5}
    .ac-steps li::before{counter-increment:s;content:counter(s);flex:none;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:800;background:linear-gradient(135deg,var(--accent),var(--cyan));color:#fff;font-size:13px}
    .ac-steps{padding:0;margin:0}
    #clResults{margin-top:10px}
    .ac-head{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;align-items:center;margin:8px 0 14px}.ac-head h2{margin:0;font-size:22px}
    #clList{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,420px),1fr));gap:14px}
    .cl-card{display:grid;grid-template-columns:110px minmax(0,1fr);gap:14px;padding:12px;border-radius:18px;border:1px solid var(--line);background:var(--card)}
    .cl-thumb{width:110px;height:196px;border-radius:12px;background:#000;object-fit:cover}
    .cl-body{display:flex;flex-direction:column;gap:8px;min-width:0}
    .cl-meta{display:flex;gap:10px;align-items:center;font-size:13px;color:var(--muted);flex-wrap:wrap}
    .cl-score{font-weight:800;color:#fff;background:linear-gradient(135deg,#ff5f6d,#ffb347);padding:3px 9px;border-radius:999px;font-size:12.5px}
    .cl-title{margin:0;font-weight:800;font-size:15.5px}
    .cl-text{margin:0;font-size:13px;line-height:1.55;color:var(--text-dim);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .cl-btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}.cl-btns .btn{padding:9px 14px;font-size:14px}
    .ac-stage{display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr);gap:22px;align-items:start;margin-top:18px}
    @media(max-width:760px){.ac-stage{grid-template-columns:1fr}}
    .ac-phone{border-radius:24px;overflow:hidden;border:8px solid #15172a;background:#000;aspect-ratio:9/16;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.7);max-height:72vh;margin:0 auto}
    #clCanvas{display:block;width:100%;height:100%}
    .ac-src video{width:100%;border-radius:14px;background:#000;max-height:46vh}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="AI Clip Maker", b=("Video · AI", "Your video never leaves your device", "Free"),
   h1="AI Clip Maker — Turn a Long Video Into Viral Reels Automatically, Free",
   intro="Drop in a podcast, lecture or livestream and get the best moments as ready-to-post vertical clips: speech is transcribed on your device, the strongest self-contained moments are picked and titled, a virtual camera follows the speaker’s face, pauses are cut and animated captions are burned in — MP4 with sound, Arabic and English, no upload, no watermark.",
   s1="1 · Your long video", drop="Choose a video or drop it here", dropS="Podcast, lecture, interview or livestream · up to 45 min", lang="Spoken language", langO=[("arabic", "Arabic"), ("english", "English"), ("", "Detect automatically")],
   model="Accuracy", modelO=[("base", "Fast (≈ 75 MB, once)"), ("small", "Best (≈ 250 MB, once)")], len="Clip length", lens=[("short", "15–35 s"), ("mid", "30–60 s"), ("long", "55–90 s")], count="Clips", go="✨ Find my best clips",
   note="The first run downloads the speech model once. A 10-minute video takes a few minutes to transcribe on a laptop.",
   s2="2 · Style", frame="Framing", frames=[("face", "Follow the face"), ("blur", "Blurred background")], cap="Captions", caps=[("box", "Highlight box"), ("pop", "Pop"), ("karaoke", "Karaoke"), ("bounce", "One word")], accent="Colour",
   checks=[("clCaps", "Animated captions"), ("clHook", "Hook title at the start"), ("clCut", "Cut silences"), ("clBarOn", "Progress bar")],
   how=["Transcribes every word on your device (Whisper).", "Scores every possible clip for a strong hook, a complete thought, pace and energy — then picks the best ones that don’t overlap.", "Tracks the speaker’s face so the 9:16 crop keeps them centred, smoothly.", "Cuts pauses, adds animated captions, a hook title and a progress bar — and exports each clip as MP4 with sound."],
   howT="What happens", resT="Your best clips", all="⬇ Download all clips", pvT="Preview",
   faqT="Frequently asked questions",
   faq=[("Is it really free with no watermark?", "Yes — unlimited clips, no sign-up, no watermark."), ("Is my video uploaded to a server?", "No. Transcription, face tracking and rendering all run in your browser. Only the AI models are downloaded once."), ("How does it pick the clips?", "It looks for moments that open with a hook (a question, a number, a strong claim), finish a complete thought, keep a lively pace and stay within the length you chose. You can rename, preview and skip any clip."), ("Which videos work best?", "Talking videos — podcasts, interviews, lectures, tutorials and livestreams. Clear speech and one main speaker give the best results.")],
   rel="More creator tools", links=[("/add-subtitles-to-video", "Auto Subtitles"), ("/remove-silence-from-video", "Silence Remover"), ("/horizontal-to-vertical-video", "Horizontal → Vertical"), ("/video-templates", "Video Templates"), ("/creator-studio", "Creator Studio")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="صانع الريلز بالذكاء الاصطناعي", b=("فيديو · ذكاء اصطناعي", "فيديوك لا يغادر جهازك", "مجاني"),
   h1="صانع الريلز بالذكاء الاصطناعي — حوّل الفيديو الطويل إلى ريلز جاهزة تلقائيًا ومجانًا",
   intro="ارفع بودكاست أو محاضرة أو بث مباشر واحصل على أقوى اللحظات كريلز عمودية جاهزة للنشر: الكلام يتحوّل لنص على جهازك، تُختار أقوى المقاطع المكتملة مع عنوان لكل مقطع، كاميرا ذكية تتبع وجه المتحدث، تُحذف السكتات وتُضاف ترجمة متحركة — MP4 بالصوت، عربي وإنجليزي، بدون رفع وبدون علامة مائية.",
   s1="١ · فيديوك الطويل", drop="اختر فيديو أو اسحبه هنا", dropS="بودكاست، محاضرة، مقابلة أو بث · حتى 45 دقيقة", lang="لغة الكلام", langO=[("arabic", "العربية"), ("english", "الإنجليزية"), ("", "تحديد تلقائي")],
   model="الدقة", modelO=[("base", "سريع (≈ 75 ميغا، مرة واحدة)"), ("small", "أدق (≈ 250 ميغا، مرة واحدة)")], len="طول المقطع", lens=[("short", "15–35 ث"), ("mid", "30–60 ث"), ("long", "55–90 ث")], count="عدد المقاطع", go="✨ استخرج أقوى المقاطع",
   note="أول مرة يتنزّل نموذج التعرّف على الكلام مرة واحدة. فيديو 10 دقائق يحتاج بضع دقائق للتحويل على اللابتوب.",
   s2="٢ · الشكل", frame="الكادر", frames=[("face", "تتبّع الوجه"), ("blur", "خلفية مموّهة")], cap="الترجمة", caps=[("box", "مربع ملوّن"), ("pop", "تكبير"), ("karaoke", "كاريوكي"), ("bounce", "كلمة كلمة")], accent="اللون",
   checks=[("clCaps", "ترجمة متحركة"), ("clHook", "عنوان جذاب في البداية"), ("clCut", "حذف السكتات"), ("clBarOn", "شريط التقدّم")],
   how=["يحوّل كل كلمة لنص على جهازك (Whisper).", "يقيّم كل مقطع ممكن: بداية تشد، فكرة مكتملة، سرعة كلام وحماس — ويختار الأفضل بدون تكرار.", "يتتبّع وجه المتحدث حتى يبقى في منتصف كادر 9:16 بحركة ناعمة.", "يحذف السكتات ويضيف ترجمة متحركة وعنوانًا وشريط تقدّم — وينزّل كل مقطع MP4 بالصوت."],
   howT="ماذا يحدث", resT="أقوى مقاطعك", all="⬇ نزّل كل المقاطع", pvT="معاينة",
   faqT="أسئلة شائعة",
   faq=[("هل هو مجاني فعلًا وبدون علامة مائية؟", "نعم — مقاطع غير محدودة، بدون تسجيل وبدون علامة مائية."), ("هل يُرفع الفيديو إلى سيرفر؟", "لا. تحويل الكلام وتتبّع الوجه والتجهيز كلها داخل متصفحك. فقط نماذج الذكاء الاصطناعي تتنزّل مرة واحدة."), ("كيف يختار المقاطع؟", "يبحث عن لحظات تبدأ بشيء يشد (سؤال، رقم، جملة قوية)، وتُكمل فكرة كاملة، وبإيقاع حيوي وضمن الطول الذي اخترته. تقدر تغيّر العنوان وتشاهد وتتجاوز أي مقطع."), ("ما أفضل الفيديوهات له؟", "فيديوهات الكلام — بودكاست، مقابلات، محاضرات، شروحات وبث مباشر. الكلام الواضح ومتحدث رئيسي واحد يعطيان أفضل نتيجة.")],
   rel="أدوات أخرى لصناع المحتوى", links=[("/ar/add-subtitles-to-video", "ترجمة الفيديو تلقائيًا"), ("/ar/remove-silence-from-video", "حذف السكتات"), ("/ar/horizontal-to-vertical-video", "تحويل الفيديو لعمودي"), ("/ar/video-templates", "قوالب فيديو جاهزة"), ("/ar/creator-studio", "استوديو صناع المحتوى")]),
}
def opts(o): return "".join('<option value="%s">%s</option>' % x for x in o)
def chips(i, attr, o): return '<div class="ac-chips" id="%s" role="group">%s</div>' % (i, "".join('<button type="button" class="chip" %s="%s">%s</button>' % (attr, k, v) for k, v in o))
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="ac-top">\n      <div>\n'
    s += ('        <div class="ac-card"><h2>%s</h2>\n          <label class="ac-drop" id="clDrop">%s<strong>%s</strong><span>%s</span><span id="clName"></span><input type="file" id="clFile" accept="video/*,.mp4,.mov,.webm,.m4v"></label>\n'
          '          <div class="ac-row" style="margin-top:14px"><label for="clLang">%s</label><select id="clLang">%s</select></div>\n'
          '          <div class="ac-row"><label for="clModel">%s</label><select id="clModel">%s</select></div>\n'
          '          <div class="ac-row"><span class="ac-l">%s</span>%s</div>\n'
          '          <div class="ac-row"><label for="clCount">%s</label><select id="clCount"><option>3</option><option>5</option><option>8</option><option>10</option></select></div>\n'
          '          <button type="button" class="btn ac-go" id="clGo" disabled>%s</button>\n'
          '          <div id="clBar" hidden><i id="clBarFill"></i></div><div id="clStatus" role="status" aria-live="polite"></div><p class="ac-note">%s</p>\n        </div>\n      </div>\n') % (
          t["s1"], UP, t["drop"], t["dropS"], t["lang"], opts(t["langO"]), t["model"], opts(t["modelO"]), t["len"], chips("clLen", "data-l", t["lens"]), t["count"], t["go"], t["note"])
    s += ('      <div>\n        <div class="ac-card"><h2>%s</h2>\n'
          '          <div class="ac-row"><span class="ac-l">%s</span>%s</div>\n'
          '          <div class="ac-row"><span class="ac-l">%s</span>%s</div>\n'
          '          <div class="ac-row"><label for="clAccent">%s</label><input type="color" id="clAccent"></div>\n'
          '          <div class="ac-checks">%s</div>\n        </div>\n'
          '        <div class="ac-card"><h2>%s</h2><ol class="ac-steps">%s</ol></div>\n      </div>\n    </div>\n') % (
          t["s2"], t["frame"], chips("clFrame", "data-f", t["frames"]), t["cap"], chips("clStyle", "data-s", t["caps"]), t["accent"],
          "".join('<label><input type="checkbox" id="%s"> %s</label>' % c for c in t["checks"]), t["howT"], "".join("<li>%s</li>" % h for h in t["how"]))
    s += ('    <div id="clResults" hidden>\n      <div class="ac-head"><h2>%s</h2><button type="button" class="btn" id="clAll">%s</button></div>\n      <div id="clList"></div>\n'
          '      <div class="ac-stage" id="clStage" hidden><div class="ac-phone"><canvas id="clCanvas" width="540" height="960" role="img" aria-label="%s"></canvas></div><div class="ac-src"><video id="clVideo" playsinline controls preload="metadata"></video></div></div>\n    </div>\n  </div>\n'
          '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/brand.js"></script>\n  <script src="/captions.js"></script>\n  <script src="/video-export.js"></script>\n  <script src="/clipper.js"></script>\n\n') % (t["resT"], t["all"], t["pvT"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n%s  </div>\n\n' % (t["faqT"], "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("ac_style.html", STYLE); w("ac_en.html", body("en", False)); w("ac_ar.html", body("ar", True))
print("bodies written")
