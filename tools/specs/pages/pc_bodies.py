# Writes the EN/AR bodies + style for the percentage calculator.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .pc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,420px),1fr));gap:14px}
    .pc-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:rgba(255,255,255,.025)}
    .pc-card.pc-focus{border-color:rgba(123,123,255,.6);box-shadow:0 0 0 3px rgba(107,107,255,.15)}
    .pc-card h2{margin:0 0 12px;font-size:15px;color:var(--text-dim)}
    .pc-line{display:flex;flex-wrap:wrap;align-items:center;gap:8px;font-size:16px}
    .pc-line input{width:110px;text-align:center;font-size:17px;font-weight:600;direction:ltr}
    .pc-line select{width:auto}
    .pc-res{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding:12px 14px;border-radius:14px;background:linear-gradient(135deg,rgba(107,107,255,.16),rgba(59,226,255,.06));border:1px solid rgba(123,123,255,.3)}
    .pc-r{font-size:26px;font-weight:800;direction:ltr;font-variant-numeric:tabular-nums}
    .pc-up{color:#7ff0b0}.pc-down{color:#ffb3b3}
    .pc-f{font:12.5px var(--mono);color:var(--muted);margin-top:6px;direction:ltr;text-align:start}
    .pc-copy{all:unset;cursor:pointer;font-size:12.5px;color:#9fa3ff;padding:4px 8px;border-radius:8px}
    .pc-copy:hover{background:rgba(107,107,255,.15)}
  </style>
"""
def card(title, line, rid, fid, copy):
    return ('      <div class="pc-card"><h2>%s</h2><div class="pc-line">%s</div>'
            '<div class="pc-res"><span class="pc-r" id="%s">—</span><button type="button" class="pc-copy" data-copy="%s">%s</button></div><div class="pc-f" id="%s"></div></div>\n') % (title, line, rid, rid, copy, fid)
inp = lambda i, v: '<input type="text" inputmode="decimal" id="%s" value="%s">' % (i, v)
T = {
 "en": dict(home="/", homeL="Home", crumb="Percentage Calculator", sw="", b=("Math", "Runs in your browser", "Free"),
   h1="Percentage Calculator — Percent Of, Percent Change, Discounts",
   p="Work out any percentage in seconds: what is 15% of 200, what percent one number is of another, the percent increase or decrease between two numbers, and prices after a discount or tax. Results update as you type, with the formula shown.",
   cards=[("What is X% of Y?", "What is " + inp("pc1p", "15") + " % of " + inp("pc1x", "200") + " ?", "pc1r", "pc1f"),
          ("X is what percent of Y?", inp("pc2a", "30") + " is what % of " + inp("pc2b", "200") + " ?", "pc2r", "pc2f"),
          ("Percentage change (increase / decrease)", "From " + inp("pc3a", "80") + " to " + inp("pc3b", "100"), "pc3r", "pc3f"),
          ("Add or subtract a percentage (discount, tax, tip)", inp("pc4x", "200") + ' <select id="pc4dir"><option value="down">− minus</option><option value="up">+ plus</option></select> ' + inp("pc4p", "25") + " %", "pc4r", "pc4f")],
   copy="Copy", strings="",
   content="""    <h2>Percentage formulas</h2>
    <ul class="benefits">
      <li><span><strong>X% of Y</strong> = X ÷ 100 × Y. Example: 15% of 200 = 30.</span></li>
      <li><span><strong>X is what % of Y</strong> = X ÷ Y × 100. Example: 30 of 200 = 15%.</span></li>
      <li><span><strong>Percent change</strong> = (new − old) ÷ old × 100. From 80 to 100 = +25%; from 100 to 80 = −20%.</span></li>
      <li><span><strong>Discount</strong>: price × (1 − discount ÷ 100). 200 with 25% off = 150.</span></li>
    </ul>
    <h2>Frequently asked questions</h2>
    <details class="faq-item"><summary>Why is a 20% drop not undone by a 20% rise?</summary><p>Because the second percentage is taken from a smaller number: 100 − 20% = 80, and 80 + 20% = 96. To get back to 100 you need +25%.</p></details>
    <details class="faq-item"><summary>How do I calculate VAT?</summary><p>Use “add a percentage” with your VAT rate, or the dedicated <a href="/ar/vat-calculator">VAT calculator</a> (Arabic) for invoices and extracting VAT from a total.</p></details>""",
   related=[("/discount-calculator", "Discount Calculator"), ("/word-counter", "Word Counter"), ("/timestamp-converter", "Timestamp Converter")], relT="More tools"),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="حاسبة النسبة المئوية", sw="<!--LANG-SWITCH-->\n", b=("رياضيات", "تعمل داخل متصفحك", "مجانية"),
   h1="حاسبة النسبة المئوية — حساب النسبة والزيادة والخصم",
   p="احسب أي نسبة مئوية في ثوانٍ: كم يساوي 15% من 200، وكم نسبة رقم من رقم آخر، ونسبة الزيادة أو النقصان بين رقمين، والسعر بعد الخصم أو الضريبة. النتيجة تظهر فورًا مع طريقة الحساب.",
   cards=[("كم يساوي X% من Y؟", "كم يساوي " + inp("pc1p", "15") + " % من " + inp("pc1x", "200") + " ؟", "pc1r", "pc1f"),
          ("كم نسبة X من Y؟", inp("pc2a", "30") + " كم نسبته من " + inp("pc2b", "200") + " ؟", "pc2r", "pc2f"),
          ("نسبة التغيّر (زيادة أو نقصان)", "من " + inp("pc3a", "80") + " إلى " + inp("pc3b", "100"), "pc3r", "pc3f"),
          ("إضافة أو خصم نسبة (خصم، ضريبة، بقشيش)", inp("pc4x", "200") + ' <select id="pc4dir"><option value="down">− خصم</option><option value="up">+ إضافة</option></select> ' + inp("pc4p", "25") + " %", "pc4r", "pc4f")],
   copy="نسخ", strings='  <script>window.QT_STRINGS = {increase:"زيادة",decrease:"نقصان",added:"المضاف",saved:"توفّر",copied:"تم النسخ"};</script>\n',
   content="""    <h2>قوانين النسبة المئوية</h2>
    <ul class="benefits">
      <li><span><strong>X% من Y</strong> = X ÷ 100 × Y. مثال: 15% من 200 = 30.</span></li>
      <li><span><strong>نسبة X من Y</strong> = X ÷ Y × 100. مثال: 30 من 200 = 15%.</span></li>
      <li><span><strong>نسبة التغيّر</strong> = (الجديد − القديم) ÷ القديم × 100. من 80 إلى 100 = زيادة 25%، ومن 100 إلى 80 = نقصان 20%.</span></li>
      <li><span><strong>السعر بعد الخصم</strong> = السعر × (1 − نسبة الخصم ÷ 100). 200 بخصم 25% = 150.</span></li>
    </ul>
    <h2>أسئلة شائعة</h2>
    <details class="faq-item"><summary>كيف أحسب النسبة المئوية للدرجات؟</summary><p>استخدم «كم نسبة X من Y»: درجتك ÷ الدرجة الكاملة × 100. مثال: 45 من 50 = 90%.</p></details>
    <details class="faq-item"><summary>كيف أحسب ضريبة القيمة المضافة؟</summary><p>استخدم «إضافة نسبة» بنسبة الضريبة، أو <a href="/ar/vat-calculator">حاسبة ضريبة القيمة المضافة</a> للفواتير واستخراج الضريبة من سعر شامل.</p></details>""",
   related=[("/ar/discount-calculator", "حاسبة الخصم"), ("/ar/vat-calculator", "حاسبة ضريبة القيمة المضافة"), ("/ar/zakat-calculator", "حاسبة الزكاة")], relT="حاسبات أخرى"),
}
io.open(os.path.join(here, "pc_style.html"), "w", encoding="utf-8", newline="\n").write(STYLE)
for lang, t in T.items():
    cards = "".join(card(c[0], c[1], c[2], c[3], t["copy"]) for c in t["cards"])
    rel = "".join('      <a href="%s">%s%s</a>\n' % (u, n, GO) for u, n in t["related"])
    b = f"""<div class="wrap">
  <div class="breadcrumb"><a href="{t['home']}">{t['homeL']}</a> <span>/</span><span style="color:var(--text-dim)">{t['crumb']}</span></div>
{t['sw']}  <section class="hero compact">
    <div class="hero-badges"><span class="badge">{t['b'][0]}</span><span class="badge local">{LOCK}{t['b'][1]}</span><span class="badge">{t['b'][2]}</span></div>
    <h1>{t['h1']}</h1>
    <p>{t['p']}</p>
  </section>

  <div class="tool-panel" id="tool">
    <div class="pc-grid">
{cards}    </div>
    <div id="pcStatus" class="result" aria-live="polite"></div>
  </div>
{t['strings']}  <script src="/percent.js"></script>

  <div class="content">
{t['content']}
  </div>

  <div class="section related-section">
    <h2 class="related-title">{t['relT']}</h2>
    <div class="related-grid">
{rel}    </div>
  </div>
</div>
"""
    io.open(os.path.join(here, "pc_body_%s.html" % lang), "w", encoding="utf-8", newline="\n").write(b)
print("percentage bodies written")
