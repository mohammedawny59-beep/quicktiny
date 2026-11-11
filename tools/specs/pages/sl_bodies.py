# Writes the EN/AR bodies + style for the Saudi salary & GOSI calculator.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .sl-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(270px,1fr);gap:16px;align-items:start}
    @media(max-width:860px){.sl-grid{grid-template-columns:1fr}}
    .sl-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:var(--card)}
    .sl-card h2{margin:0 0 12px;font-size:15px;color:var(--text-dim)}
    .sl-row{display:grid;grid-template-columns:minmax(0,1fr) 150px;gap:10px;align-items:center;margin-bottom:10px}
    .sl-row label{font-weight:600}
    .sl-row label small{display:block;color:var(--muted);font-weight:500;font-size:12.5px}
    .sl-row input,.sl-row select{margin:0;text-align:center;direction:ltr;font-weight:700}
    .sl-row select{direction:inherit;text-align:start;font-weight:600}
    .sl-chips{display:inline-flex;gap:6px;margin-top:4px}
    .sl-chips .chip{padding:3px 9px;font-size:12px}
    .sl-res{position:sticky;top:84px;text-align:center}
    .sl-big{font-size:38px;font-weight:800;direction:ltr;font-variant-numeric:tabular-nums;background:var(--grad-text);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1.15}
    .sl-cur{color:var(--muted);font-weight:700;font-size:13px}
    .sl-bar{height:10px;border-radius:999px;background:rgba(255,107,107,.35);overflow:hidden;margin:12px 0 4px}
    .sl-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--accent),var(--cyan));transition:width .5s cubic-bezier(.16,1,.3,1)}
    .sl-kv{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-top:1px solid var(--line);font-size:14px;color:var(--text-dim);text-align:start}
    .sl-kv b{color:var(--text);direction:ltr;font-variant-numeric:tabular-nums}
    .sl-table{width:100%;border-collapse:collapse;margin-top:14px;font-size:14px}
    .sl-table th,.sl-table td{padding:8px 8px;border-bottom:1px solid var(--line);text-align:start}
    .sl-table td+td,.sl-table th+th{text-align:end;direction:ltr;font-variant-numeric:tabular-nums}
    .sl-table th{color:var(--muted);font-size:12.5px}
    .sl-tot td{font-weight:800;color:var(--text)}
    .sl-pct{color:var(--muted);font-size:12px;direction:ltr;display:inline-block}
    .sl-note{font-size:13px;color:var(--muted);margin-top:10px}
    @media(max-width:520px){.sl-row{grid-template-columns:1fr}}
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Saudi Salary & GOSI Calculator", b=("Finance", "Runs in your browser", "Free"),
   h1="Saudi Salary &amp; GOSI Calculator — Net Salary and Employer Cost",
   intro="Enter basic salary and allowances to see the GOSI deductions, your net monthly salary and the employer's total cost. Covers Saudi and non-Saudi employees and the old and new social insurance systems.",
   inT="Salary details", basic="Basic salary", housing="Housing allowance", housingS="often 25% of basic", transport="Transport allowance", transportS="often 10% of basic",
   other="Other allowances", nat="Nationality", saudi="Saudi", non="Non-Saudi", sys="Registered with GOSI", old="Before 3 July 2024", new="On/after 3 July 2024 (new system)",
   ann="Annuity rate override %", annS="optional — leave empty for the default", resT="Net monthly salary", cur="SAR",
   gross="Gross salary", base="GOSI contribution wage", ded="Your GOSI deduction", cost="Employer's total cost", year="Net per year",
   note="Rates as published for 2026; GOSI may change them. Check gosi.gov.sa for your exact contribution.",
   howT="How GOSI is calculated",
   how=["<strong>Contribution wage</strong> = basic salary + housing allowance (other allowances don't count), capped at 45,000 SAR a month.",
        "<strong>Saudi employees</strong> pay annuities (pension) 9% + SANED 0.75% = <strong>9.75%</strong>; the employer pays the same plus 2% occupational hazards = <strong>11.75%</strong>.",
        "<strong>New system</strong> (registered on or after 3 July 2024): the annuity rate starts at 9% each and rises 0.5 points every 3 July until 11% — 10% each from July 2026.",
        "<strong>Non-Saudi employees</strong> pay nothing; the employer pays 2% occupational hazards."],
   faqT="Frequently asked questions",
   faq=[("Is GOSI deducted from the transport allowance?", "No. Only basic salary and housing allowance form the contribution wage."),
        ("How much GOSI does a Saudi employee pay?", "9.75% of basic + housing in the old system (9% annuities + 0.75% SANED). In the new system it's 10.75% from July 2026."),
        ("Do expats pay GOSI?", "Non-Saudi employees have no deduction; the employer pays 2% for occupational hazards."),
        ("What is the maximum GOSI wage?", "45,000 SAR a month; any amount above it isn't subject to contributions.")],
   rel="More finance tools", links=[("/loan-calculator", "Loan Calculator"), ("/percentage-calculator", "Percentage Calculator"), ("/ar/end-of-service-calculator", "End of Service (Arabic)"), ("/ar/vat-calculator", "VAT Calculator (Arabic)")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="حاسبة الراتب والتأمينات", b=("مالية", "تعمل داخل متصفحك", "مجانية"),
   h1="حاسبة الراتب الصافي وخصم التأمينات الاجتماعية (GOSI)",
   intro="أدخل الراتب الأساسي والبدلات لتعرف خصم التأمينات الاجتماعية وراتبك الصافي الشهري والتكلفة الكاملة على صاحب العمل. للسعوديين وغير السعوديين، وللنظام القديم والجديد.",
   inT="بيانات الراتب", basic="الراتب الأساسي", housing="بدل السكن", housingS="غالبًا 25% من الأساسي", transport="بدل النقل", transportS="غالبًا 10% من الأساسي",
   other="بدلات أخرى", nat="الجنسية", saudi="سعودي", non="غير سعودي", sys="تاريخ التسجيل في التأمينات", old="قبل 3 يوليو 2024", new="في 3 يوليو 2024 أو بعده (النظام الجديد)",
   ann="نسبة المعاشات يدويًا %", annS="اختياري — اتركه فارغًا للنسبة الافتراضية", resT="الراتب الصافي الشهري", cur="ريال",
   gross="إجمالي الراتب", base="الأجر الخاضع للاشتراك", ded="خصم التأمينات من راتبك", cost="التكلفة الكاملة على صاحب العمل", year="الصافي في السنة",
   note="النسب حسب المعلن لعام 2026 وقد تعدّلها التأمينات؛ تحقق من اشتراكك الفعلي في موقع التأمينات الاجتماعية.",
   howT="طريقة حساب التأمينات الاجتماعية",
   how=["<strong>الأجر الخاضع للاشتراك</strong> = الراتب الأساسي + بدل السكن فقط (لا تدخل بقية البدلات)، وبحد أعلى 45,000 ريال شهريًا.",
        "<strong>الموظف السعودي</strong> يُخصم منه المعاشات 9% + ساند 0.75% = <strong>9.75%</strong>، ويدفع صاحب العمل مثلها + الأخطار المهنية 2% = <strong>11.75%</strong>.",
        "<strong>النظام الجديد</strong> (المسجلون من 3 يوليو 2024): تبدأ نسبة المعاشات 9% لكل طرف وتزيد 0.5% كل 3 يوليو حتى 11%، فتكون 10% من يوليو 2026.",
        "<strong>غير السعودي</strong> لا يُخصم منه شيء، ويدفع صاحب العمل 2% للأخطار المهنية."],
   faqT="أسئلة شائعة",
   faq=[("هل تُخصم التأمينات من بدل النقل؟", "لا، الأجر الخاضع للاشتراك هو الأساسي + بدل السكن فقط."),
        ("كم نسبة خصم التأمينات للسعودي؟", "9.75% من الأساسي والسكن في النظام القديم (9% معاشات + 0.75% ساند)، و10.75% في النظام الجديد من يوليو 2026."),
        ("هل يُخصم من غير السعودي تأمينات؟", "لا يُخصم من الموظف، ويدفع صاحب العمل 2% للأخطار المهنية."),
        ("ما الحد الأعلى للأجر الخاضع للتأمينات؟", "45,000 ريال شهريًا، وما زاد عنه لا تُحسب عليه اشتراكات.")],
   rel="أدوات مالية أخرى", links=[("/ar/end-of-service-calculator", "حاسبة نهاية الخدمة"), ("/ar/loan-calculator", "حاسبة التمويل"), ("/ar/vat-calculator", "حاسبة الضريبة"), ("/ar/zakat-calculator", "حاسبة الزكاة")]),
}
def body(L, ar):
    t = T[L]
    inp = lambda i, v="": '<input type="text" inputmode="decimal" id="%s" value="%s">' % (i, v)
    s = ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
         '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
         '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
    s += '  <div class="tool-panel" id="tool">\n    <div class="sl-grid">\n      <div class="sl-card">\n        <h2>%s</h2>\n' % t["inT"]
    s += '        <div class="sl-row"><label for="slBasic">%s</label>%s</div>\n' % (t["basic"], inp("slBasic", "10000"))
    s += ('        <div class="sl-row"><label for="slHousing">%s<small>%s</small><span class="sl-chips"><button type="button" class="chip" data-pct="25" data-for="slHousing">25%%</button></span></label>%s</div>\n'
          % (t["housing"], t["housingS"], inp("slHousing", "2500")))
    s += ('        <div class="sl-row"><label for="slTransport">%s<small>%s</small><span class="sl-chips"><button type="button" class="chip" data-pct="10" data-for="slTransport">10%%</button></span></label>%s</div>\n'
          % (t["transport"], t["transportS"], inp("slTransport", "1000")))
    s += '        <div class="sl-row"><label for="slOther">%s</label>%s</div>\n' % (t["other"], inp("slOther", "0"))
    s += '        <div class="sl-row"><label for="slNat">%s</label><select id="slNat"><option value="saudi">%s</option><option value="non">%s</option></select></div>\n' % (t["nat"], t["saudi"], t["non"])
    s += '        <div class="sl-row" id="slSysRow"><label for="slSys">%s</label><select id="slSys"><option value="old">%s</option><option value="new">%s</option></select></div>\n' % (t["sys"], t["old"], t["new"])
    s += ('        <div class="sl-row"><label for="slAnnuity">%s<small id="slAnnHint">%s</small></label><input type="text" inputmode="decimal" id="slAnnuity" placeholder="—"></div>\n'
          % (t["ann"], t["annS"]))
    s += '      </div>\n'
    s += ('      <div class="sl-card sl-res" aria-live="polite">\n        <h2>%s</h2>\n        <div class="sl-big" id="slNet">—</div><div class="sl-cur">%s</div>\n'
          '        <div class="sl-bar" aria-hidden="true"><i id="slBarNet"></i></div>\n'
          '        <div class="sl-kv"><span>%s</span><b id="slGross">—</b></div>\n        <div class="sl-kv"><span>%s</span><b id="slBase">—</b></div>\n'
          '        <div class="sl-kv"><span>%s</span><b id="slDed">—</b></div>\n        <div class="sl-kv"><span>%s</span><b id="slCost">—</b></div>\n'
          '        <div class="sl-kv"><span>%s</span><b id="slYear">—</b></div>\n'
          '        <table class="sl-table" id="slTable"></table>\n        <p class="sl-note">%s</p>\n      </div>\n    </div>\n  </div>\n  <script src="/salary.js"></script>\n\n'
          ) % (t["resT"], t["cur"], t["gross"], t["base"], t["ded"], t["cost"], t["year"], t["note"])
    s += ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
          % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
             "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))
    s += ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % t["rel"]
          + "".join('      <a href="%s">%s%s</a>\n' % (h, x, GO) for h, x in t["links"]) + "    </div>\n  </div>\n</div>\n")
    return s
def w(n, x): io.open(os.path.join(here, n), "w", encoding="utf-8", newline="\n").write(x)
w("sl_style.html", STYLE); w("sl_en.html", body("en", False)); w("sl_ar.html", body("ar", True))
print("bodies written")
