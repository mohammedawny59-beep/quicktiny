# Writes the EN/AR bodies + style for the student pack: GPA calculator and weighted grade / percentage calculator.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .st-grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);gap:16px;align-items:start}
    @media(max-width:860px){.st-grid{grid-template-columns:1fr}}
    .st-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:rgba(255,255,255,.025)}
    .st-card h2{margin:0 0 12px;font-size:15px;color:var(--text-dim)}
    .st-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px}
    .st-head label{font-weight:700;color:var(--text-dim);font-size:14px}
    .st-head select{width:auto}
    .gp-row,.wt-row{display:grid;gap:8px;align-items:center;margin-bottom:8px;transition:opacity .18s,transform .18s}
    .gp-row{grid-template-columns:minmax(0,1fr) 74px 128px 34px}
    .wt-row{grid-template-columns:minmax(0,1fr) 74px 74px 74px 34px}
    .gp-cols,.wt-cols{display:grid;gap:8px;font-size:12px;color:var(--muted);font-weight:700;margin-bottom:6px;padding-inline:2px}
    .gp-cols{grid-template-columns:minmax(0,1fr) 74px 128px 34px}
    .wt-cols{grid-template-columns:minmax(0,1fr) 74px 74px 74px 34px}
    .gp-row input,.gp-row select,.wt-row input{min-width:0;padding:9px 10px}
    .gp-cr,.wt-s,.wt-m,.wt-w{text-align:center;direction:ltr;font-weight:600}
    .gp-gr{direction:ltr}
    .gp-rm{all:unset;cursor:pointer;width:34px;height:34px;display:grid;place-items:center;border-radius:10px;color:var(--muted);font-size:20px;line-height:1}
    .gp-rm:hover{background:rgba(255,107,107,.12);color:#ffb3b3}
    .gp-in{animation:stIn .3s cubic-bezier(.16,1,.3,1)}
    .gp-out{opacity:0;transform:translateX(12px)}
    @keyframes stIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
    .st-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
    .st-actions .btn{padding:8px 14px;font-size:13.5px}
    .st-res{position:sticky;top:84px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px}
    .st-ring{--p:0;width:170px;height:170px;border-radius:50%;display:grid;place-items:center;margin:4px auto 6px;
      background:conic-gradient(from -90deg,var(--cyan),var(--accent) calc(var(--p)*360deg),rgba(255,255,255,.07) 0);transition:--p .6s;
      -webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 14px),#000 calc(100% - 13px));mask:radial-gradient(farthest-side,transparent calc(100% - 14px),#000 calc(100% - 13px))}
    .st-ring-wrap{position:relative;width:170px;height:170px;margin:0 auto}
    .st-ring-wrap .st-ring{position:absolute;inset:0;margin:0}
    .st-ring-in{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
    .st-big{font-size:36px;font-weight:800;direction:ltr;font-variant-numeric:tabular-nums;line-height:1.05;background:linear-gradient(135deg,#fff,#9fe9ff);-webkit-background-clip:text;background-clip:text;color:transparent}
    .st-sub{font-size:13px;color:var(--muted);direction:ltr}
    .st-pop{animation:stPop .4s cubic-bezier(.16,1,.3,1)}
    @keyframes stPop{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
    .st-kv{display:flex;justify-content:space-between;width:100%;padding:8px 0;border-top:1px solid var(--line);font-size:14px;color:var(--text-dim)}
    .st-kv b{color:var(--text);direction:ltr;font-variant-numeric:tabular-nums}
    .st-rate{display:inline-block;padding:5px 12px;border-radius:999px;background:rgba(127,240,176,.12);color:#7ff0b0;font-weight:800;font-size:14px}
    .st-line{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:15px;margin-top:8px}
    .st-line input{width:96px;text-align:center;direction:ltr;font-weight:600}
    .st-note{margin-top:10px;font-weight:700;font-size:14px;min-height:1px}
    .st-note:empty{display:none}
    .st-note.ok{color:#7ff0b0}.st-note.mid{color:#ffd166}.st-note.bad{color:#ffb3b3}
    .st-f{font:12.5px var(--mono);color:var(--muted);direction:ltr;margin-top:4px;word-break:break-word}
    .sw-off{opacity:.45}
    #swPresets{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px}
    .sw-row{display:grid;grid-template-columns:minmax(0,1fr) 96px 74px;gap:8px;align-items:center;margin-bottom:8px;transition:opacity .2s}
    .sw-row input{text-align:center;direction:ltr;font-weight:600;min-width:0}
    .sw-row span{font-weight:600}
    .st-saved{font-size:12px;color:var(--muted);margin-top:8px}
    @media(max-width:560px){.gp-cols{grid-template-columns:64px minmax(0,1fr) 30px}.wt-cols{grid-template-columns:repeat(3,minmax(0,1fr)) 30px}.gp-cols span:first-child,.wt-cols span:first-child{display:none}.st-big{font-size:30px}.gp-row{grid-template-columns:64px minmax(0,1fr) 30px;padding-bottom:10px;border-bottom:1px solid var(--line)}.gp-name,.wt-name{grid-column:1/-1}.wt-row{grid-template-columns:repeat(3,minmax(0,1fr)) 30px;padding-bottom:10px;border-bottom:1px solid var(--line)}.sw-row{grid-template-columns:minmax(0,1fr) 72px 60px}.st-ring-wrap{width:150px;height:150px}.st-line input{width:80px}}
    @media (prefers-reduced-motion:reduce){.gp-in,.st-pop{animation:none}}
  </style>
"""
def related(title, links):
    return ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % title
            + "".join('      <a href="%s">%s%s</a>\n' % (h, t, GO) for h, t in links) + "    </div>\n  </div>\n")
def hero(home, homeL, crumb, badges, h1, intro, ar):
    return ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
            '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
            '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (home, homeL, crumb, "<!--LANG-SWITCH-->\n" if ar else "", badges[0], LOCK, badges[1], badges[2], h1, intro)
def ring(rid, bid, sub_id=None, sub=""):
    return ('      <div class="st-ring-wrap"><div class="st-ring" id="%s"></div><div class="st-ring-in"><span class="st-big" id="%s">—</span>%s</div></div>\n'
            % (rid, bid, '<span class="st-sub" id="%s">%s</span>' % (sub_id, sub) if sub_id else ""))
def faq(items):
    return "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in items)

# ---------------- GPA ----------------
G = {
 "en": dict(home="/", homeL="Home", crumb="GPA Calculator", b=("Students", "Runs in your browser", "Free"),
   h1="GPA Calculator — Semester &amp; Cumulative GPA (4.0 and 5.0 scales)",
   intro="Add your courses, credit hours and letter grades to get your semester GPA, then your new cumulative GPA. Works with the 4.0 scale and the 5.0 scale used by Saudi universities, and tells you the semester GPA you need to reach a target.",
   scale="Scale", s4="4.0 scale (A = 4)", s5="5.0 scale (A+ = 5)", cols=("Course", "Credits", "Grade", ""), add="+ Add course", reset="Start over",
   prevT="Previous record (optional)", prev="Cumulative GPA so far", prevCr="credits completed",
   tgtT="Target", tgt="I want a cumulative GPA of", nextCr="next semester credits",
   semL="Semester GPA", semCr="Credits this semester", cumL="Cumulative GPA", cumCr="Total credits", saved="Your courses are saved on this device only.",
   howT="How GPA is calculated",
   how=["<strong>Quality points</strong> = credit hours × grade points. A 3-credit A on the 4.0 scale is 3 × 4 = 12 points.",
        "<strong>Semester GPA</strong> = total quality points ÷ total credit hours.",
        "<strong>Cumulative GPA</strong> = (previous GPA × previous credits + this semester's points) ÷ all credits.",
        "<strong>Needed GPA</strong> = (target × (old + new credits) − current GPA × old credits) ÷ new credits."],
   tableT="Grade points", faqT="Frequently asked questions",
   faq=[("What is the difference between the 4.0 and 5.0 scales?", "On the 4.0 scale an A is worth 4 points. Saudi universities commonly use a 5.0 scale where A+ = 5, A = 4.75, B+ = 4.5, B = 4, C+ = 3.5, C = 3, D+ = 2.5, D = 2 and F = 1."),
        ("Does a failed course count in my GPA?", "Yes. An F adds its credit hours with 0 points on the 4.0 scale (1 point on the Saudi 5.0 scale), which pulls the GPA down until the course is repeated, depending on your university's rules."),
        ("Can I raise my GPA from 2.5 to 3.0 in one semester?", "Use the Target box: enter your cumulative GPA, completed credits, the GPA you want and next semester's credits. If the required semester GPA is above the scale maximum it isn't possible in one semester."),
        ("Is my data uploaded?", "No. Everything is calculated in your browser and your courses are only saved in this browser so you can come back next semester.")],
   rel="More tools for students", links=[("/weighted-grade-calculator", "Weighted Grade Calculator"), ("/percentage-calculator", "Percentage Calculator"), ("/word-counter", "Word Counter"), ("/pdf-tools", "PDF Tools")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="حساب المعدل التراكمي", b=("للطلاب", "تعمل داخل متصفحك", "مجانية"),
   h1="حساب المعدل التراكمي والفصلي — من 5 ومن 4",
   intro="أضف موادك وساعاتها وتقديراتك لتعرف معدلك الفصلي ثم معدلك التراكمي الجديد فورًا. تدعم نظام الجامعات السعودية من 5 ونظام 4، وتخبرك بالمعدل الذي تحتاجه في الفصل القادم لتصل إلى هدفك.",
   scale="النظام", s4="من 4 (A = 4)", s5="من 5 (A+ = 5)", cols=("المادة", "الساعات", "التقدير", ""), add="+ أضف مادة", reset="ابدأ من جديد",
   prevT="سجلك السابق (اختياري)", prev="المعدل التراكمي الحالي", prevCr="الساعات المجتازة",
   tgtT="هدفك", tgt="أريد معدلًا تراكميًا قدره", nextCr="ساعات الفصل القادم",
   semL="المعدل الفصلي", semCr="ساعات هذا الفصل", cumL="المعدل التراكمي", cumCr="مجموع الساعات", saved="تُحفظ موادك على هذا الجهاز فقط لتعود إليها لاحقًا.",
   howT="طريقة حساب المعدل التراكمي",
   how=["<strong>النقاط</strong> = عدد الساعات × وزن التقدير. مادة 3 ساعات بتقدير أ+ في نظام 5 = 3 × 5 = 15 نقطة.",
        "<strong>المعدل الفصلي</strong> = مجموع النقاط ÷ مجموع ساعات الفصل.",
        "<strong>المعدل التراكمي</strong> = (المعدل السابق × الساعات السابقة + نقاط هذا الفصل) ÷ كل الساعات.",
        "<strong>المعدل المطلوب</strong> = (الهدف × (الساعات السابقة + الجديدة) − المعدل الحالي × الساعات السابقة) ÷ الساعات الجديدة."],
   tableT="أوزان التقديرات", faqT="أسئلة شائعة",
   faq=[("كيف أحسب المعدل التراكمي من 5؟", "اضرب ساعات كل مادة في وزن تقديرها (أ+ = 5، أ = 4.75، ب+ = 4.5، ب = 4، ج+ = 3.5، ج = 3، د+ = 2.5، د = 2، هـ = 1)، اجمع النقاط واقسمها على مجموع الساعات. الحاسبة تفعل ذلك تلقائيًا."),
        ("ما تقدير معدلي من 5؟", "في أغلب الجامعات السعودية: ممتاز من 4.50، جيد جدًا من 3.75، جيد من 2.75، مقبول من 2.00. قد تختلف بعض الجامعات قليلًا، فراجع لائحة جامعتك."),
        ("هل تُحسب المادة الراسب فيها في المعدل؟", "نعم، تُحسب ساعاتها بوزن هـ (1 في نظام 5 و0 في نظام 4) فتخفض المعدل، وتختلف قواعد استبدالها عند الإعادة بين الجامعات."),
        ("كيف أرفع معدلي التراكمي؟", "اكتب معدلك الحالي وساعاتك المجتازة في «سجلك السابق»، ثم المعدل الذي تريده وساعات الفصل القادم في «هدفك»، وستعرف المعدل الفصلي المطلوب وهل يمكن تحقيقه في فصل واحد."),
        ("هل تُرفع بياناتي؟", "لا. الحساب يتم في متصفحك، وموادك تُحفظ على جهازك فقط.")],
   rel="أدوات أخرى للطلاب", links=[("/ar/guides/gpa-5-calculation", "شرح: حساب المعدل من 5 بالأمثلة"), ("/ar/guides/raise-gpa", "كيف ترفع معدلك التراكمي"), ("/ar/weighted-percentage-calculator", "حساب النسبة الموزونة"), ("/ar/percentage-calculator", "حاسبة النسبة المئوية"), ("/ar/word-counter", "عداد الكلمات"), ("/ar/pdf-tools", "أدوات PDF")]),
}
def gpa_body(L, ar):
    t = G[L]
    pts4 = "A+ 4 · A 4 · A- 3.7 · B+ 3.3 · B 3 · B- 2.7 · C+ 2.3 · C 2 · C- 1.7 · D+ 1.3 · D 1 · D- 0.7 · F 0"
    pts5 = ("أ+ 5 · أ 4.75 · ب+ 4.5 · ب 4 · ج+ 3.5 · ج 3 · د+ 2.5 · د 2 · هـ 1" if ar else "A+ 5 · A 4.75 · B+ 4.5 · B 4 · C+ 3.5 · C 3 · D+ 2.5 · D 2 · F 1")
    s = hero(t["home"], t["homeL"], t["crumb"], t["b"], t["h1"], t["intro"], ar)
    s += ('  <div class="tool-panel" id="tool">\n    <div class="st-grid">\n      <div>\n        <div class="st-card">\n'
          '          <div class="st-head"><label for="gpScale">%s</label><select id="gpScale"><option value="%s">%s</option><option value="%s">%s</option></select></div>\n'
          '          <div class="gp-cols"><span>%s</span><span>%s</span><span>%s</span><span></span></div>\n'
          '          <div id="gpRows"></div>\n'
          '          <div class="st-actions"><button type="button" class="btn btn-secondary" id="gpAdd">%s</button><button type="button" class="btn btn-secondary" id="gpReset">%s</button></div>\n'
          '        </div>\n') % (t["scale"], "5" if ar else "4", t["s5"] if ar else t["s4"], "4" if ar else "5", t["s4"] if ar else t["s5"], t["cols"][0], t["cols"][1], t["cols"][2], t["add"], t["reset"])
    s += ('        <div class="st-card" style="margin-top:14px"><h2>%s</h2>\n          <div class="st-line"><span>%s</span><input type="text" inputmode="decimal" id="gpPrev" placeholder="%s"><span>·</span><input type="text" inputmode="decimal" id="gpPrevCr" placeholder="60"><span>%s</span></div>\n        </div>\n'
          '        <div class="st-card" style="margin-top:14px"><h2>%s</h2>\n          <div class="st-line"><span>%s</span><input type="text" inputmode="decimal" id="gpTarget" placeholder="%s"><span>·</span><input type="text" inputmode="decimal" id="gpNextCr" placeholder="15"><span>%s</span></div>\n          <div class="st-note" id="gpNeed" aria-live="polite"></div>\n        </div>\n      </div>\n'
          ) % (t["prevT"], t["prev"], "4.10" if ar else "3.20", t["prevCr"], t["tgtT"], t["tgt"], "4.50" if ar else "3.50", t["nextCr"])
    s += ('      <div class="st-card st-res" aria-live="polite">\n        <h2>%s</h2>\n' % t["cumL"]
          + ring("gpRing", "gpCum", "gpMax", "/ 4")
          + '        <span class="st-rate" id="gpRate" hidden></span>\n'
          '        <div class="st-kv"><span>%s</span><b id="gpSem">—</b></div>\n        <div class="st-kv"><span>%s</span><b id="gpSemCr">0</b></div>\n        <div class="st-kv"><span>%s</span><b id="gpCumCr">0</b></div>\n'
          '        <p class="st-saved">%s</p>\n      </div>\n    </div>\n  </div>\n  <script src="/student.js"></script>\n\n') % (t["semL"], t["semCr"], t["cumCr"], t["saved"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n    <ul class="benefits">\n      <li><span><strong>%s</strong> %s</span></li>\n      <li><span><strong>%s</strong> %s</span></li>\n    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          ) % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["tableT"], t["s5"] + ":", pts5, t["s4"] + ":", pts4, t["faqT"], faq(t["faq"]))
    return s + related(t["rel"], t["links"]) + "</div>\n"

# ---------------- Weighted ----------------
W = {
 "en": dict(home="/", homeL="Home", crumb="Weighted Grade Calculator", b=("Students", "Runs in your browser", "Free"),
   h1="Weighted Grade Calculator — and What You Need on the Final",
   intro="Enter each assignment or exam with its score and weight to get your weighted course grade. Leave future items blank to see your grade so far, then find the score you need on the final exam to reach the grade you want.",
   cardT="Your grades", cols=("Item", "Score", "Out of", "Weight %", ""), add="+ Add item", reset="Start over", resL="Weighted grade",
   finT="What do I need on the final?", fin1="My grade so far", fin2="the final is worth", fin3="I want", saved="Saved on this device only.",
   howT="How a weighted grade is calculated",
   how=["Turn each score into a percentage: <strong>score ÷ out of × 100</strong>.",
        "Multiply each percentage by its weight and add them up: <strong>Σ (percentage × weight)</strong>.",
        "Divide by the total weight. If the weights add up to 100%, that's your final grade; if they add up to less, it's your grade so far.",
        "<strong>Final exam needed</strong> = (target − grade so far × (1 − final weight)) ÷ final weight."],
   faqT="Frequently asked questions",
   faq=[("What if my weights don't add up to 100%?", "The calculator divides by the total weight you entered, so with only some items graded you get your current average. It shows the weight total so you can spot a typo."),
        ("How do I calculate my grade so far?", "Fill in the items you already have and leave the rest blank. The result is the weighted average of the graded items."),
        ("How much do I need on the final to pass?", "In the final-exam box, enter your current grade, how much the final is worth and the grade you need (e.g. 60). The answer is the minimum final score."),
        ("Is anything uploaded?", "No. It all runs in your browser and your rows are saved only on this device.")],
   rel="More tools for students", links=[("/gpa-calculator", "GPA Calculator"), ("/percentage-calculator", "Percentage Calculator"), ("/word-counter", "Word Counter"), ("/pdf-tools", "PDF Tools")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="حساب النسبة الموزونة", b=("للطلاب", "تعمل داخل متصفحك", "مجانية"),
   h1="حساب النسبة الموزونة — ثانوي وقدرات وتحصيلي",
   intro="احسب نسبتك الموزونة للقبول الجامعي من نسبة الثانوية ودرجة القدرات ودرجة التحصيلي بالأوزان التي تطلبها جامعتك، واحسب درجتك الموزونة في أي مادة والدرجة التي تحتاجها في الاختبار النهائي.",
   swT="النسبة الموزونة للقبول الجامعي", swP="أوزان شائعة:", hs="نسبة الثانوية", gat="القدرات العامة", saat="التحصيلي الدراسي", wl="الوزن %",
   swNote="تختلف الأوزان بين الجامعات والكليات وتتغير أحيانًا كل عام — تأكد منها في دليل القبول لجامعتك.",
   cardT="درجة موزونة لأي مادة", cols=("البند", "الدرجة", "من", "الوزن %", ""), add="+ أضف بندًا", reset="ابدأ من جديد", resL="الدرجة الموزونة",
   finT="كم أحتاج في الاختبار النهائي؟", fin1="درجتي الحالية %", fin2="وزن النهائي %", fin3="أريد في المجموع %", saved="تُحفظ على هذا الجهاز فقط.",
   howT="طريقة حساب النسبة الموزونة",
   how=["<strong>النسبة الموزونة</strong> = (نسبة الثانوية × وزنها) + (درجة القدرات × وزنها) + (درجة التحصيلي × وزنها).",
        "مثال بأوزان 30% / 30% / 40%: ثانوية 96 وقدرات 82 وتحصيلي 88 ← 28.8 + 24.6 + 35.2 = <strong>88.6%</strong>.",
        "للتخصصات التي لا تشترط التحصيلي تُستخدم غالبًا أوزان مثل 50% ثانوية و50% قدرات.",
        "<strong>الدرجة المطلوبة في النهائي</strong> = (الهدف − الدرجة الحالية × (1 − وزن النهائي)) ÷ وزن النهائي."],
   faqT="أسئلة شائعة",
   faq=[("كيف أحسب النسبة الموزونة؟", "اضرب نسبة الثانوية في وزنها، والقدرات في وزنها، والتحصيلي في وزنه، ثم اجمع النتائج. مثلًا بأوزان 30/30/40: 96×0.3 + 82×0.3 + 88×0.4 = 88.6%."),
        ("ما أوزان النسبة الموزونة في الجامعات السعودية؟", "الأشهر 30% ثانوي و30% قدرات و40% تحصيلي للكليات العلمية والصحية، و40/30/30 أو 50/50 بدون تحصيلي لكليات أخرى. الأوزان تختلف حسب الجامعة والكلية، فراجع دليل القبول."),
        ("هل النسبة الموزونة هي نفسها نسبة القبول؟", "النسبة الموزونة هي ما تقارنه الجامعة بالحد الأدنى للقبول في كل تخصص، وقد يختلف الحد الأدنى من عام لآخر حسب المتقدمين."),
        ("كيف أحسب درجتي في مادة لها أعمال سنة ونصفي ونهائي؟", "استخدم «درجة موزونة لأي مادة»: أدخل كل بند بدرجته ومن كم ووزنه، واترك ما لم يُرصد بعد فارغًا لتعرف درجتك حتى الآن."),
        ("هل تُرفع بياناتي؟", "لا. كل الحسابات تتم في متصفحك.")],
   rel="أدوات أخرى للطلاب", links=[("/ar/guides/weighted-percentage-calculation", "شرح: حساب النسبة الموزونة بالأمثلة"), ("/ar/guides/final-exam-grade-needed", "كم تحتاج في الاختبار النهائي؟"), ("/ar/gpa-calculator", "حساب المعدل التراكمي"), ("/ar/percentage-calculator", "حاسبة النسبة المئوية"), ("/ar/word-counter", "عداد الكلمات"), ("/ar/pdf-tools", "أدوات PDF")]),
}
def wt_body(L, ar):
    t = W[L]
    s = hero(t["home"], t["homeL"], t["crumb"], t["b"], t["h1"], t["intro"], ar)
    s += '  <div class="tool-panel" id="tool">\n'
    if ar:
        s += ('    <div class="st-grid">\n      <div class="st-card">\n        <h2>%s</h2>\n        <div id="swPresets"><span style="color:var(--muted);font-size:13px;font-weight:700;align-self:center">%s</span>'
              '<button type="button" class="chip" data-w="30,30,40">30 / 30 / 40</button><button type="button" class="chip" data-w="40,30,30">40 / 30 / 30</button><button type="button" class="chip" data-w="25,25,50">25 / 25 / 50</button><button type="button" class="chip" data-w="50,50,0">50 / 50 — بدون تحصيلي</button></div>\n'
              '        <div class="sw-row" style="font-size:12px;color:var(--muted);font-weight:700;margin-bottom:4px"><span></span><span style="text-align:center">الدرجة</span><span style="text-align:center">%s</span></div>\n'
              '        <div class="sw-row"><span>%s</span><input type="text" inputmode="decimal" id="swHs" value="96" aria-label="%s"><input type="text" inputmode="decimal" id="swW1" value="30" aria-label="%s"></div>\n'
              '        <div class="sw-row"><span>%s</span><input type="text" inputmode="decimal" id="swGat" value="82" aria-label="%s"><input type="text" inputmode="decimal" id="swW2" value="30" aria-label="%s"></div>\n'
              '        <div class="sw-row" id="swRow3"><span>%s</span><input type="text" inputmode="decimal" id="swSaat" value="88" aria-label="%s"><input type="text" inputmode="decimal" id="swW3" value="40" aria-label="%s"></div>\n'
              '        <div class="st-note" id="swSum"></div>\n        <p class="st-saved">%s</p>\n      </div>\n'
              '      <div class="st-card st-res" aria-live="polite">\n        <h2>النسبة الموزونة</h2>\n%s        <div class="st-f" id="swF"></div>\n      </div>\n    </div>\n'
              ) % (t["swT"], t["swP"], t["wl"], t["hs"], t["hs"], t["wl"], t["gat"], t["gat"], t["wl"], t["saat"], t["saat"], t["wl"], t["swNote"], ring("swRing", "swOut"))
    s += ('    <div class="st-grid"%s>\n      <div class="st-card">\n        <h2>%s</h2>\n'
          '        <div class="wt-cols"><span>%s</span><span style="text-align:center">%s</span><span style="text-align:center">%s</span><span style="text-align:center">%s</span><span></span></div>\n'
          '        <div id="wtRows"></div>\n'
          '        <div class="st-actions"><button type="button" class="btn btn-secondary" id="wtAdd">%s</button><button type="button" class="btn btn-secondary" id="wtReset">%s</button></div>\n'
          '        <div class="st-note" id="wtSum"></div>\n'
          '        <h2 style="margin-top:18px">%s</h2>\n'
          '        <div class="st-line"><span>%s</span><input type="text" inputmode="decimal" id="fnCur" aria-label="%s" value="78"><span>·</span><span>%s</span><input type="text" inputmode="decimal" id="fnW" aria-label="%s" value="40"><span>·</span><span>%s</span><input type="text" inputmode="decimal" id="fnTarget" aria-label="%s" value="80"></div>\n'
          '        <div class="st-note" id="fnOut" aria-live="polite"></div>\n      </div>\n'
          '      <div class="st-card st-res" aria-live="polite">\n        <h2>%s</h2>\n%s        <span class="st-rate" id="wtLetter"></span>\n        <p class="st-saved">%s</p>\n      </div>\n    </div>\n  </div>\n  <script src="/student.js"></script>\n\n'
          ) % (' style="margin-top:16px"' if ar else "", t["cardT"], t["cols"][0], t["cols"][1], t["cols"][2], t["cols"][3], t["add"], t["reset"], t["finT"], t["fin1"], t["fin1"], t["fin2"], t["fin2"], t["fin3"], t["fin3"], t["resL"], ring("wtRing", "wtPct"), t["saved"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          ) % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"], faq(t["faq"]))
    return s + related(t["rel"], t["links"]) + "</div>\n"

def w(name, text): io.open(os.path.join(here, name), "w", encoding="utf-8", newline="\n").write(text)
w("st_style.html", STYLE)
w("st_gpa_en.html", gpa_body("en", False)); w("st_gpa_ar.html", gpa_body("ar", True))
w("st_wt_en.html", wt_body("en", False)); w("st_wt_ar.html", wt_body("ar", True))
print("bodies written")
