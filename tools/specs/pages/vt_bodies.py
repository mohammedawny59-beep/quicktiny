# Writes EN/AR bodies + styles for two video tools sharing video-export.js:
#   rv_*  Horizontal → Vertical (Reels) converter      sl_*  Silence remover (jump cuts)
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
UP = '<svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4-2.5z"/></svg>'
FACES = "".join('    @font-face{font-family:"QT Lalezar";font-weight:400;font-display:swap;src:url(/fonts/display/lalezar-%s-400.woff2) format("woff2");unicode-range:%s}\n' % (sub, ur)
    for sub, ur in (("arabic", "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC"),
                    ("latin", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")))
CSS = """  <style>
""" + FACES + """    .vt{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:22px;align-items:start}
    @media(max-width:980px){.vt{grid-template-columns:1fr;gap:0}.vt-col{display:contents}.vt-c1{order:0}.vt-stage{order:1;margin-bottom:14px}.vt-c2{order:2}}
    .vt-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card);margin-bottom:14px}
    .vt-card h2{margin:0 0 12px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
    html[lang=ar] .vt-card h2{letter-spacing:0}
    .vt-drop{display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center;padding:24px 16px;border:2px dashed var(--line-strong);border-radius:16px;cursor:pointer;color:var(--text-dim);transition:border-color .2s,background .2s}
    .vt-drop.over,.vt-drop:hover{border-color:var(--accent);background:rgba(91,91,255,.06)}.vt-drop strong{color:var(--text);font-size:16px}
    .vt-drop input{position:absolute;width:1px;height:1px;opacity:0}.vt-drop:focus-within{outline:2px solid var(--accent);outline-offset:2px}
    .vt-name{font-size:13px;color:var(--muted);overflow-wrap:anywhere}
    .vt-row{display:grid;grid-template-columns:120px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .vt-row label,.vt-row .vt-l{font-weight:700;color:var(--text-dim);font-size:14px}
    .vt-row input,.vt-row select{margin:0}.vt-row input[type=color]{height:42px;padding:4px;width:80px}.vt-row input[type=range]{accent-color:var(--accent);width:100%}
    .vt-row output{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
    @media(max-width:520px){.vt-row{grid-template-columns:1fr}}
    .vt-chips{display:flex;flex-wrap:wrap;gap:6px}.vt-checks label{display:flex;gap:6px;align-items:center;font-weight:600;font-size:14px;color:var(--text-dim)}
    #rvTitle{width:100%;margin:0}
    .vt-hint{font-size:13px;color:var(--muted);margin:4px 0 0}
    @media(min-width:981px){.vt-stage{position:sticky;top:80px}}
    .vt-screen{position:relative;margin:0 auto;max-width:100%;max-height:68vh;border-radius:18px;overflow:hidden;background:#000;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 40px 80px -30px rgba(91,91,255,.6)}
    .vt-screen canvas{display:block;width:100%;height:100%}
    .vt-src{width:100%;border-radius:14px;background:#000;max-height:52vh;display:block}
    .vt-ctrl{display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap}
    .vt-ctrl button.round{width:42px;height:42px;border-radius:50%;border:1px solid var(--line-strong);background:var(--card);color:var(--text);cursor:pointer;flex:none}
    .vt-trim{display:grid;grid-template-columns:1fr 1fr;gap:8px;flex:1;min-width:200px}.vt-trim input{margin:0;accent-color:var(--accent)}
    #rvTrim{font-size:13px;color:var(--muted);font-variant-numeric:tabular-nums}
    .vt-out{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:14px}.vt-out .btn{padding:12px 22px;font-size:15px}
    .vt-status{text-align:center;font-weight:700;color:var(--text-dim);margin-top:10px;min-height:1.4em}
    .vt-bar{height:6px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden;margin-top:8px}.vt-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--cyan))}
    .vt-next{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px}.vt-next .btn{padding:10px 16px;font-size:14px}
    #slWave{display:block;width:100%;height:110px;border-radius:12px;background:rgba(0,0,0,.35);cursor:pointer;margin-top:12px}
    #slStats{margin-top:10px;font-size:14px;color:var(--text-dim);text-align:center}#slStats b{color:var(--text)}
    .vt-legend{display:flex;gap:14px;justify-content:center;font-size:12px;color:var(--muted);margin-top:6px}.vt-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;margin-inline-end:5px;vertical-align:-1px}
  </style>
"""
def opts(o): return "".join('<option value="%s">%s</option>' % x for x in o)
def head(t, ar):
    return ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
            '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
            '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
def tail(t):
    s = ('  <div class="content">\n    <h2>%s</h2>\n    <ol class="benefits">\n%s    </ol>\n    <h2>%s</h2>\n%s  </div>\n\n'
         % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
            "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    return s + ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
                + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
def drop(pfx, t):
    return '          <label class="vt-drop" id="%sDrop">%s<strong>%s</strong><span>%s</span><span class="vt-name" id="%sName"></span><input type="file" id="%sFile" accept="video/*,.mp4,.mov,.webm,.m4v"></label>\n' % (pfx, UP, t["drop"], t["dropS"], pfx, pfx)
def nxt(pfx, t, items):
    return '        <div class="vt-next" id="%sNext" hidden>%s</div>\n' % (pfx, "".join('<button type="button" class="btn btn-secondary" data-to="%s" data-input="%s">%s →</button>' % i for i in items))
SUB = {"en": ("/add-subtitles-to-video", "sbFile"), "ar": ("/ar/add-subtitles-to-video", "sbFile")}
RV = {"en": ("/horizontal-to-vertical-video", "rvFile"), "ar": ("/ar/horizontal-to-vertical-video", "rvFile")}
SL = {"en": ("/remove-silence-from-video", "slFile"), "ar": ("/ar/remove-silence-from-video", "slFile")}

R = {
 "en": dict(home="/", homeL="Home", crumb="Horizontal to Vertical Video", b=("Video", "Your video never leaves your device", "Free"),
   h1="Convert Horizontal Video to Vertical (9:16) for Reels, TikTok &amp; Shorts — Free",
   intro="Turn a 16:9 YouTube or camera video into a 9:16 Reel in seconds: blurred background fill, smart crop or a colour background, an optional headline above the video, and trimming — exported as MP4 with the original sound. Free, no watermark, nothing uploaded.",
   s1="1 · Your video", drop="Choose a video or drop it here", dropS="MP4, MOV or WebM", s2="2 · Look", fmt="Format", mode="Fill", modes=[("blur", "Blurred background"), ("crop", "Crop to fill"), ("color", "Colour background")],
   focus="Focus", zoom="Zoom", bg="Background", round="Rounded video", title="Headline", titleHint="Optional — appears above the video. Wrap words in *stars* to highlight them.", accent="Highlight", go="Download MP4",
   next="Next", subs="Add subtitles", sil="Remove silences",
   howT="How it works", how=["Pick your video — it stays on your device.", "Choose 9:16 for Reels, TikTok and Shorts, 1:1 or 4:5 for feed posts.", "<strong>Blurred background</strong> keeps the whole picture; <strong>Crop to fill</strong> fills the screen — slide <em>Focus</em> to keep the speaker in frame.", "Add a headline, trim the start and end, and download. Then send it straight to Auto Subtitles."],
   faqT="Frequently asked questions", faq=[("Does it keep the sound?", "Yes, the MP4 keeps the original audio (in Chrome, Edge and other browsers with WebCodecs audio support)."), ("Is there a length limit?", "No hard limit, but rendering takes roughly as long as the clip on a laptop, so trim to the part you need."), ("Is my video uploaded?", "No. Everything — decoding, drawing and encoding — happens in your browser.")],
   rel="More video tools", links=[("/add-subtitles-to-video", "Auto Subtitles"), ("/remove-silence-from-video", "Silence Remover"), ("/creator-studio", "Creator Studio"), ("/youtube-thumbnail-maker", "YouTube Thumbnail Maker"), ("/animated-captions", "Animated Captions")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="تحويل الفيديو من أفقي إلى عمودي", b=("فيديو", "فيديوك لا يغادر جهازك", "مجانية"),
   h1="تحويل الفيديو من أفقي إلى عمودي 9:16 للريلز والتيك توك والشورتس — مجانًا",
   intro="حوّل فيديو يوتيوب أو كاميرا 16:9 إلى ريل 9:16 خلال ثوانٍ: خلفية مموّهة من نفس الفيديو أو قص ذكي أو خلفية بلون، عنوان اختياري فوق الفيديو، وقص البداية والنهاية — MP4 بنفس الصوت. مجانًا وبدون علامة مائية ولا يُرفع شيء.",
   s1="١ · فيديوك", drop="اختر فيديو أو اسحبه هنا", dropS="MP4 أو MOV أو WebM", s2="٢ · الشكل", fmt="المقاس", mode="التعبئة", modes=[("blur", "خلفية مموّهة"), ("crop", "قص لملء الشاشة"), ("color", "خلفية بلون")],
   focus="مركز القص", zoom="التكبير", bg="لون الخلفية", round="زوايا دائرية", title="عنوان", titleHint="اختياري — يظهر فوق الفيديو. ضع الكلمات بين *نجمتين* لتمييزها.", accent="لون التمييز", go="تنزيل MP4",
   next="التالي", subs="أضف ترجمة", sil="احذف السكتات",
   howT="كيف تعمل", how=["اختر فيديوك — يبقى على جهازك.", "اختر 9:16 للريلز والتيك توك والشورتس، أو 1:1 و4:5 لمنشورات الصفحة.", "<strong>الخلفية المموّهة</strong> تُظهر الصورة كاملة؛ <strong>القص لملء الشاشة</strong> يملأ الشاشة — حرّك <em>مركز القص</em> ليبقى المتحدث في الكادر.", "أضف عنوانًا، قصّ البداية والنهاية ونزّل الفيديو، ثم أرسله مباشرة لأداة ترجمة الفيديو تلقائيًا."],
   faqT="أسئلة شائعة", faq=[("هل يبقى الصوت؟", "نعم، الفيديو ينزل بنفس الصوت الأصلي (على كروم وإيدج والمتصفحات التي تدعم ترميز الصوت)."), ("هل يوجد حد لطول الفيديو؟", "لا يوجد حد ثابت، لكن التجهيز يأخذ تقريبًا مدة المقطع على اللابتوب، لذلك قصّ الجزء الذي تحتاجه."), ("هل يُرفع الفيديو؟", "لا، كل شيء يتم داخل متصفحك.")],
   rel="أدوات فيديو أخرى", links=[("/ar/add-subtitles-to-video", "ترجمة الفيديو تلقائيًا"), ("/ar/remove-silence-from-video", "حذف السكتات من الفيديو"), ("/ar/creator-studio", "استوديو صناع المحتوى"), ("/ar/youtube-thumbnail-maker", "صانع صورة اليوتيوب"), ("/ar/animated-captions", "الترجمة المتحركة")]),
}
S = {
 "en": dict(home="/", homeL="Home", crumb="Silence Remover", b=("Video", "Your video never leaves your device", "Free"),
   h1="Remove Silence From Video Automatically — Free Jump-Cut Editor",
   intro="Cut out the pauses, breaths and dead air from talking videos in one click. The audio is analysed on your device, you see every cut on the waveform, tune the sensitivity, preview the result and download a tighter MP4 with the sound — free, no watermark, no upload.",
   s1="1 · Your video", drop="Choose a video or drop it here", dropS="MP4, MOV or WebM", s2="2 · Sensitivity", thr="Silence below", auto="Auto", min="Shortest pause", pad="Keep around speech", skip="Preview without the cuts", go="Download MP4",
   kept="Kept", cut="Cut", subs="Add subtitles", vert="Make it vertical",
   howT="How it works", how=["Pick your video. Its audio is measured in 20 ms steps right in your browser.", "Every stretch quieter than the threshold and longer than the shortest pause is marked for cutting (red on the waveform).", "Play the preview — it jumps over the cuts so you hear exactly what you’ll get.", "Download the MP4, then send it to Auto Subtitles or the vertical converter."],
   faqT="Frequently asked questions", faq=[("The cuts sound abrupt — what do I change?", "Raise “Keep around speech” to 0.15–0.2 s, or increase the shortest pause so only long gaps are removed."), ("It cuts quiet words.", "Lower the threshold (more negative dB) or press Auto again after changing the microphone level."), ("Is my video uploaded?", "No — analysis and rendering happen on your device.")],
   rel="More video tools", links=[("/add-subtitles-to-video", "Auto Subtitles"), ("/horizontal-to-vertical-video", "Horizontal to Vertical"), ("/creator-studio", "Creator Studio"), ("/animated-captions", "Animated Captions"), ("/motion-titles", "Motion Titles")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="حذف السكتات من الفيديو", b=("فيديو", "فيديوك لا يغادر جهازك", "مجانية"),
   h1="حذف السكتات من الفيديو تلقائيًا — قص الوقفات (Jump Cuts) مجانًا",
   intro="احذف الوقفات والأنفاس والصمت من فيديوهات الكلام بضغطة. الصوت يُحلَّل على جهازك، تشوف كل قصّة على موجة الصوت، تضبط الحساسية، تسمع المعاينة وتنزّل فيديو MP4 أقصر بنفس الصوت — مجانًا وبدون علامة مائية وبدون رفع.",
   s1="١ · فيديوك", drop="اختر فيديو أو اسحبه هنا", dropS="MP4 أو MOV أو WebM", s2="٢ · الحساسية", thr="الصمت تحت", auto="تلقائي", min="أقصر سكتة", pad="هامش حول الكلام", skip="معاينة بدون السكتات", go="تنزيل MP4",
   kept="يبقى", cut="يُحذف", subs="أضف ترجمة", vert="حوّله عمودي",
   howT="كيف تعمل", how=["اختر فيديوك. الصوت يُقاس كل 20 جزءًا من الثانية داخل متصفحك.", "كل جزء أهدأ من الحد وأطول من أقصر سكتة يُعلَّم للحذف (بالأحمر على الموجة).", "شغّل المعاينة — تقفز فوق السكتات لتسمع النتيجة كما هي.", "نزّل الفيديو، ثم أرسله لترجمة الفيديو تلقائيًا أو لتحويله عمودي."],
   faqT="أسئلة شائعة", faq=[("القص يبدو مفاجئًا — ماذا أغيّر؟", "ارفع «هامش حول الكلام» إلى 0.15–0.2 ث، أو زِد أقصر سكتة حتى تُحذف الوقفات الطويلة فقط."), ("يحذف كلمات هادئة.", "خفّض الحد (رقم dB أكثر سالبًا) أو اضغط «تلقائي» مرة أخرى."), ("هل يُرفع الفيديو؟", "لا — التحليل والتجهيز يتمّان على جهازك.")],
   rel="أدوات فيديو أخرى", links=[("/ar/add-subtitles-to-video", "ترجمة الفيديو تلقائيًا"), ("/ar/horizontal-to-vertical-video", "تحويل الفيديو لعمودي"), ("/ar/creator-studio", "استوديو صناع المحتوى"), ("/ar/animated-captions", "الترجمة المتحركة"), ("/ar/motion-titles", "العناوين المتحركة")]),
}
SCRIPTS = '  <script src="/vendor/mp4-muxer.js"></script>\n  <script src="/brand.js"></script>\n  <script src="/video-export.js"></script>\n  <script src="/%s.js"></script>\n\n'
def rv(L):
    t, ar = R[L], L == "ar"
    s = head(t, ar) + '  <div class="tool-panel" id="tool">\n    <div class="vt">\n      <div class="vt-col">\n'
    s += '        <div class="vt-card vt-c1"><h2>%s</h2>\n%s        </div>\n' % (t["s1"], drop("rv", t))
    s += ('        <div class="vt-card vt-c2"><h2>%s</h2>\n'
          '          <div class="vt-row"><span class="vt-l">%s</span><div class="vt-chips" id="rvRatio" role="group" aria-label="%s"><button type="button" class="chip" data-r="9:16">9:16</button><button type="button" class="chip" data-r="1:1">1:1</button><button type="button" class="chip" data-r="4:5">4:5</button></div></div>\n'
          '          <div class="vt-row"><span class="vt-l">%s</span><div class="vt-chips" id="rvMode" role="group" aria-label="%s">%s</div></div>\n'
          '          <div class="vt-row"><label for="rvFocus">%s</label><input type="range" id="rvFocus" min="0" max="100"></div>\n'
          '          <div class="vt-row" id="rvZoomRow"><label for="rvZoom">%s</label><input type="range" id="rvZoom" min="100" max="180"></div>\n'
          '          <div class="vt-row" id="rvBgRow"><label for="rvBg">%s</label><input type="color" id="rvBg"></div>\n'
          '          <div class="vt-row"><span class="vt-l"></span><div class="vt-checks"><label><input type="checkbox" id="rvRound"> %s</label></div></div>\n'
          '          <div id="rvTitleRow"><div class="vt-row"><label for="rvTitle">%s</label><input type="text" id="rvTitle" maxlength="90" dir="auto"></div><p class="vt-hint">%s</p>\n'
          '          <div class="vt-row" style="margin-top:10px"><label for="rvAccent">%s</label><input type="color" id="rvAccent"></div></div>\n        </div>\n      </div>\n') % (
          t["s2"], t["fmt"], t["fmt"], t["mode"], t["mode"], "".join('<button type="button" class="chip" data-m="%s">%s</button>' % m for m in t["modes"]),
          t["focus"], t["zoom"], t["bg"], t["round"], t["title"], t["titleHint"], t["accent"])
    s += ('      <div class="vt-stage" id="rvStage" hidden>\n        <div class="vt-screen" id="rvScreen"><canvas id="rvCanvas" width="540" height="960" role="img" aria-label="%s"></canvas></div>\n'
          '        <video id="rvVideo" playsinline preload="auto" hidden></video>\n'
          '        <div class="vt-ctrl"><button type="button" class="round" id="rvPlay" aria-label="Play / pause">▶</button><div class="vt-trim"><input type="range" id="rvA" min="0" max="1" step="0.1" aria-label="Start"><input type="range" id="rvB" min="0" max="1" step="0.1" aria-label="End"></div><span id="rvTrim"></span></div>\n'
          '        <div class="vt-out"><button type="button" class="btn" id="rvGo" disabled>%s</button></div>\n'
          '        <div class="vt-bar" id="rvBar" hidden><i id="rvBarFill"></i></div><div class="vt-status" id="rvStatus" role="status" aria-live="polite"></div>\n%s      </div>\n    </div>\n  </div>\n') % (
          t["crumb"], t["go"], nxt("rv", t, [(SUB[L][0], SUB[L][1], t["subs"]), (SL[L][0], SL[L][1], t["sil"])]))
    return s + SCRIPTS % "reels" + tail(t)
def sl(L):
    t, ar = S[L], L == "ar"
    s = head(t, ar) + '  <div class="tool-panel" id="tool">\n    <div class="vt">\n      <div class="vt-col">\n'
    s += '        <div class="vt-card vt-c1"><h2>%s</h2>\n%s        </div>\n' % (t["s1"], drop("sl", t))
    s += ('        <div class="vt-card vt-c2"><h2>%s</h2>\n'
          '          <div class="vt-row"><label for="slThr">%s</label><div><input type="range" id="slThr" min="-60" max="-18" step="1"> <output id="slThrV"></output> <button type="button" class="chip" id="slAuto">%s</button></div></div>\n'
          '          <div class="vt-row"><label for="slMin">%s</label><div><input type="range" id="slMin" min="0.15" max="1.5" step="0.05"> <output id="slMinV"></output></div></div>\n'
          '          <div class="vt-row"><label for="slPad">%s</label><div><input type="range" id="slPad" min="0" max="0.3" step="0.01"> <output id="slPadV"></output></div></div>\n'
          '          <div class="vt-row"><span class="vt-l"></span><div class="vt-checks"><label><input type="checkbox" id="slSkip" checked> %s</label></div></div>\n        </div>\n      </div>\n') % (
          t["s2"], t["thr"], t["auto"], t["min"], t["pad"], t["skip"])
    s += ('      <div class="vt-stage" id="slStage" hidden>\n        <video id="slVideo" class="vt-src" playsinline controls preload="auto"></video>\n'
          '        <canvas id="slWave" aria-hidden="true"></canvas><div class="vt-legend"><span><i style="background:#3be2ff"></i>%s</span><span><i style="background:rgba(255,80,110,.85)"></i>%s</span></div>\n'
          '        <div id="slStats" aria-live="polite"></div>\n        <div class="vt-out"><button type="button" class="btn" id="slGo" disabled>%s</button></div>\n'
          '        <div class="vt-bar" id="slBar" hidden><i id="slBarFill"></i></div><div class="vt-status" id="slStatus" role="status" aria-live="polite"></div>\n%s      </div>\n    </div>\n  </div>\n') % (
          t["kept"], t["cut"], t["go"], nxt("sl", t, [(SUB[L][0], SUB[L][1], t["subs"]), (RV[L][0], RV[L][1], t["vert"])]))
    return s + SCRIPTS % "silence" + tail(t)
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("vt_style.html", CSS); w("rv_en.html", rv("en")); w("rv_ar.html", rv("ar")); w("sr_en.html", sl("en")); w("sr_ar.html", sl("ar"))
print("bodies written")
