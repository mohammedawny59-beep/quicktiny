# Writes the EN/AR bodies + style for the unit converter.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
SWAP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v14M3 14l4 4 4-4M17 20V6M13 10l4-4 4 4"/></svg>'
STYLE = """  <style>
    #ucCats{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px}
    .uc-box{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:end}
    @media(max-width:640px){.uc-box{grid-template-columns:1fr}.uc-swap{justify-self:center}}
    .uc-side{border:1px solid var(--line);border-radius:18px;padding:14px 16px;background:var(--card)}
    .uc-side label{display:block;font-size:13px;font-weight:700;color:var(--muted);margin-bottom:6px}
    .uc-side input{font-size:24px;font-weight:800;text-align:center;direction:ltr;margin:0 0 8px}
    .uc-side select{margin:0}
    .uc-res{display:flex;flex-direction:column;justify-content:center;min-height:104px}
    .uc-big{font-size:30px;font-weight:800;direction:ltr;text-align:center;font-variant-numeric:tabular-nums;line-height:1.15;word-break:break-all;background:var(--grad-text);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent}
    .uc-unit{text-align:center;color:var(--text-dim);font-weight:700;font-size:14px;margin-top:4px}
    .uc-swap{width:46px;height:46px;border-radius:50%;border:1px solid var(--line-strong);background:var(--card);color:var(--text);cursor:pointer;display:grid;place-items:center;margin-bottom:40px;transition:border-color .15s}
    .uc-swap:hover{border-color:var(--accent)}
    .uc-swap svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transform:rotate(90deg)}
    @media(max-width:640px){.uc-swap{margin:0}.uc-swap svg{transform:none}}
    .uc-swap.spin svg{animation:ucSpin .45s cubic-bezier(.16,1,.3,1)}
    @keyframes ucSpin{from{transform:rotate(90deg) scale(.7)}to{transform:rotate(270deg)}}
    @media(max-width:640px){@keyframes ucSpin{from{transform:scale(.7)}to{transform:rotate(180deg)}}}
    .uc-line{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:12px;font:13px var(--mono);color:var(--muted);flex-wrap:wrap}
    .uc-line span{direction:ltr;unicode-bidi:plaintext}
    .uc-all{width:100%;border-collapse:collapse;margin-top:14px;font-size:14.5px}
    .uc-all td{padding:8px 10px;border-bottom:1px solid var(--line)}
    .uc-all td:last-child{text-align:end;font-variant-numeric:tabular-nums;font-weight:700}
    .uc-all tr.on td{color:var(--accent-hover)}
    @media (prefers-reduced-motion:reduce){.uc-swap.spin svg{animation:none}}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Unit Converter", b=("Utility", "Runs in your browser", "Free"),
   h1="Unit Converter — Length, Weight, Temperature, Area &amp; More",
   intro="Convert centimetres to inches, kilograms to pounds, Celsius to Fahrenheit, feddan and dunam to square metres, litres to gallons, km/h to mph and GB to GiB. Results update as you type, with every other unit listed below.",
   from_="From", to="To", swap="Swap units", copy="Copy", allT="Same value in every unit",
   howT="Handy conversions to remember",
   how=["<strong>1 inch</strong> = 2.54 cm · <strong>1 foot</strong> = 30.48 cm · <strong>1 mile</strong> = 1.609 km",
        "<strong>1 kg</strong> = 2.2046 lb · <strong>1 lb</strong> = 453.6 g · <strong>1 troy ounce</strong> (gold) = 31.10 g",
        "<strong>°F</strong> = °C × 9/5 + 32 · <strong>°C</strong> = (°F − 32) × 5/9",
        "<strong>1 feddan</strong> (Egypt) = 4,200.83 m² · <strong>1 dunam</strong> = 1,000 m² · <strong>1 acre</strong> = 4,046.86 m²",
        "<strong>1 GB</strong> = 1,000,000,000 bytes, while <strong>1 GiB</strong> = 1,073,741,824 bytes, which is why a 1 TB drive shows about 931 GiB."],
   faqT="Frequently asked questions",
   faq=[("How many centimetres are in an inch?", "Exactly 2.54 cm, by international definition since 1959."),
        ("How do I convert Celsius to Fahrenheit?", "Multiply by 9/5 and add 32: 37 °C × 1.8 + 32 = 98.6 °F."),
        ("Is a pound the same as a kilogram?", "No. 1 kg = 2.2046 lb, so a pound is about 0.4536 kg."),
        ("Why does my 1 TB drive show 931 GB?", "Manufacturers count 1 TB as 10¹² bytes; Windows divides by 1024³ (GiB) but labels it GB.")],
   rel="More calculators", links=[("/percentage-calculator", "Percentage Calculator"), ("/bmi-calculator", "BMI Calculator"), ("/days-between-dates", "Days Between Dates"), ("/loan-calculator", "Loan Calculator")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="تحويل الوحدات", b=("أدوات", "تعمل داخل متصفحك", "مجانية"),
   h1="تحويل الوحدات — الطول والوزن والحرارة والمساحة وغيرها",
   intro="حوّل السنتيمتر إلى إنش، والكيلو إلى رطل، والمئوية إلى فهرنهايت، والفدان والدونم إلى متر مربع، واللتر إلى جالون، وكم/ساعة إلى ميل/ساعة. النتيجة تظهر فورًا مع قيمة الرقم بكل الوحدات الأخرى.",
   from_="من", to="إلى", swap="تبديل الوحدتين", copy="نسخ", allT="نفس القيمة بكل الوحدات",
   howT="تحويلات مفيدة تحفظها",
   how=["<strong>1 إنش</strong> = 2.54 سم · <strong>1 قدم</strong> = 30.48 سم · <strong>1 ميل</strong> = 1.609 كم",
        "<strong>1 كيلو</strong> = 2.2046 رطل · <strong>1 رطل</strong> = 453.6 غرام · <strong>أونصة الذهب</strong> = 31.10 غرام",
        "<strong>الفهرنهايت</strong> = المئوية × 9/5 + 32 · <strong>المئوية</strong> = (الفهرنهايت − 32) × 5/9",
        "<strong>الفدان</strong> (مصر) = 4,200.83 م² · <strong>الدونم</strong> = 1,000 م² · <strong>الهكتار</strong> = 10 دونمات",
        "<strong>1 جيجابايت</strong> = مليار بايت، أما <strong>1 جيبيبايت</strong> = 1,073,741,824 بايت — لذلك يظهر قرص 1 تيرابايت بحوالي 931 في ويندوز."],
   faqT="أسئلة شائعة",
   faq=[("كم سنتيمتر في الإنش؟", "الإنش = 2.54 سم بالضبط حسب التعريف الدولي."),
        ("كيف أحول من مئوية إلى فهرنهايت؟", "اضرب في 9/5 وأضف 32: حرارة 37 مئوية × 1.8 + 32 = 98.6 فهرنهايت."),
        ("كم متر مربع في الفدان؟", "الفدان المصري = 4,200.83 مترًا مربعًا تقريبًا، أي 24 قيراطًا."),
        ("كم كيلو في الرطل؟", "الرطل (الباوند) = 0.4536 كيلو تقريبًا، والكيلو = 2.2046 رطل.")],
   rel="حاسبات أخرى", links=[("/ar/percentage-calculator", "حاسبة النسبة المئوية"), ("/ar/bmi-calculator", "حاسبة كتلة الجسم"), ("/ar/days-between-dates", "حساب الأيام بين تاريخين"), ("/ar/loan-calculator", "حاسبة التمويل")]),
}
def body(L, ar):
    t = T[L]
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += ('  <div class="tool-panel" id="tool">\n    <div id="ucCats" role="tablist"></div>\n    <div class="uc-box">\n'
          '      <div class="uc-side"><label for="ucValue">%s</label><input type="text" inputmode="decimal" id="ucValue" value="1"><select id="ucFrom" aria-label="%s"></select></div>\n'
          '      <button type="button" class="uc-swap" id="ucSwap" aria-label="%s" title="%s">%s</button>\n'
          '      <div class="uc-side uc-res" aria-live="polite"><label for="ucTo">%s</label><div class="uc-big" id="ucOut">—</div><div class="uc-unit" id="ucOutUnit"></div><select id="ucTo"></select></div>\n'
          '    </div>\n    <div class="uc-line"><span id="ucLine"></span><button type="button" class="btn btn-secondary" id="ucCopy">%s</button></div>\n    <div id="ucStatus" class="result" aria-live="polite"></div>\n'
          '    <h2 style="font-size:15px;color:var(--text-dim);margin:18px 0 0">%s</h2>\n    <table class="uc-all"><tbody id="ucAll"></tbody></table>\n  </div>\n  <script src="/units.js"></script>\n\n'
          ) % (t["from_"], t["from_"], t["swap"], t["swap"], SWAP, t["to"], t["copy"], t["allT"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("uc_style.html", STYLE); w("uc_en.html", body("en", False)); w("uc_ar.html", body("ar", True))
print("bodies written")
