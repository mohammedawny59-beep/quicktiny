# Writes EN/AR bodies + shared style for the everyday calculators (dates, BMI, pregnancy, loan).
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .lc-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px}
    .lc-grid input,.lc-grid select{width:100%}
    .lc-out{margin-top:16px;padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,rgba(107,107,255,.16),rgba(59,226,255,.06));border:1px solid rgba(123,123,255,.35)}
    .lc-big{font-size:clamp(28px,5vw,44px);font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}
    .lc-sub{color:var(--text-dim);font-size:15px;margin-top:6px}
    .lc-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:10px;margin-top:14px}
    .lc-stat{padding:10px 12px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line)}
    .lc-stat span{display:block;font-size:12px;color:var(--muted)}.lc-stat b{font-size:18px;font-variant-numeric:tabular-nums}
    .lc-sec{border:1px solid var(--line);border-radius:16px;padding:14px 16px;margin-top:16px;background:rgba(255,255,255,.02)}
    .lc-sec h2{margin:0 0 10px;font-size:15px;color:var(--text-dim)}
    .lc-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.lc-chips .chip{padding:5px 11px;font-size:12.5px}
    .lc-table{width:100%;border-collapse:collapse;font-size:13.5px;margin-top:8px}
    .lc-table th,.lc-table td{padding:7px 8px;border-bottom:1px solid var(--line);text-align:start;font-variant-numeric:tabular-nums}
    .lc-table th{color:var(--muted);font-weight:600}
    .lc-scroll{overflow-x:auto}
    .bm-scale{position:relative;height:14px;border-radius:99px;margin:18px 0 6px;background:linear-gradient(90deg,#4fa3ff 0 14%,#3ddc97 14% 40%,#ffd166 40% 60%,#ff8c5a 60% 80%,#ff5a6e 80%)}
    [dir=rtl] .bm-scale{background:linear-gradient(-90deg,#4fa3ff 0 14%,#3ddc97 14% 40%,#ffd166 40% 60%,#ff8c5a 60% 80%,#ff5a6e 80%)}
    #bmPin{position:absolute;top:-6px;width:4px;height:26px;border-radius:3px;background:#fff;box-shadow:0 0 0 2px #05060f;transform:translateX(-50%)}
    [dir=rtl] #bmPin{transform:translateX(50%)}
    .bm-cat{font-size:20px;font-weight:700}.bm-normal{color:#7ff0b0}.bm-under{color:#8fc3ff}.bm-over{color:#ffd88a}.bm-ob1,.bm-ob2,.bm-ob3{color:#ffa3a3}
    .pg-track{height:10px;border-radius:99px;background:rgba(255,255,255,.08);margin-top:12px;overflow:hidden}
    #pgBar{height:100%;background:var(--grad);border-radius:99px;width:0}
    .lc-note{font-size:13px;color:var(--text-dim);margin-top:10px;line-height:1.6}
  </style>
"""
EN, AR = "en", "ar"
def stat(label, id_): return '<div class="lc-stat"><span>%s</span><b id="%s">—</b></div>' % (label, id_)
PAGES = {
 "dates": {
  EN: dict(crumb="Days Between Dates", badge="Date & time", h1="Days Between Two Dates — Calculator",
   p="Count the days between any two dates — with years, months, weeks, working days and hours — or add and subtract days from a date. Handy for deadlines, notice periods, trips and countdowns.",
   tool=f"""<div class="lc-grid">
      <div><label class="field-label" for="dtA">Start date</label><input type="date" id="dtA"></div>
      <div><label class="field-label" for="dtB">End date</label><input type="date" id="dtB"></div>
      <div><label class="field-label" for="dtWeekend">Weekend</label><select id="dtWeekend"><option value="0,6">Saturday + Sunday</option><option value="5,6">Friday + Saturday</option><option value="5">Friday only</option><option value="0">Sunday only</option></select></div>
    </div>
    <div class="checkline"><input type="checkbox" id="dtInc"><label for="dtInc">Include the end date (+1 day)</label></div>
    <div class="lc-out"><div class="lc-big"><span id="dtDays">—</span> days</div><div class="lc-sub"><span id="dtYmd"></span> <span id="dtDir"></span></div>
      <div class="lc-stats">{stat("Weeks", "dtWeeks")}{stat("Working days", "dtWork")}{stat("Hours", "dtHours")}</div></div>
    <div class="lc-sec"><h2>Add or subtract days</h2><div class="lc-grid">
      <div><label class="field-label" for="dtBase">From</label><input type="date" id="dtBase"></div>
      <div><label class="field-label" for="dtOp">Operation</label><select id="dtOp"><option value="add">Add</option><option value="sub">Subtract</option></select></div>
      <div><label class="field-label" for="dtN">Days</label><input type="text" inputmode="numeric" id="dtN" value="90"></div></div>
      <div class="lc-big" style="font-size:22px;margin-top:12px" id="dtAdd">—</div></div>""",
   content="""<h2>How the count works</h2><ul class="benefits"><li><span>By default the start date counts and the end date doesn't (like “nights” on a trip). Tick “include the end date” to count both.</span></li><li><span>Working days skip the weekend you choose — Saturday/Sunday or Friday/Saturday. Public holidays aren't removed.</span></li><li><span>Leap years are handled automatically.</span></li></ul>
    <h2>Frequently asked questions</h2><details class="faq-item"><summary>How many days until New Year?</summary><p>Set the start date to today and the end date to January 1 — the result updates instantly.</p></details><details class="faq-item"><summary>What date is 90 days from today?</summary><p>Use “Add or subtract days”: from today, add 90.</p></details>""",
   rel=[("/percentage-calculator", "Percentage Calculator"), ("/timestamp-converter", "Timestamp Converter"), ("/cron-explainer", "Cron Explainer")]),
  AR: dict(crumb="حساب الأيام بين تاريخين", badge="تاريخ ووقت", h1="حساب الأيام بين تاريخين — كم يوم بين تاريخين؟",
   p="احسب عدد الأيام بين أي تاريخين بالسنوات والأشهر والأسابيع وأيام العمل والساعات، أو أضف أيامًا إلى تاريخ واطرح منه. مفيدة للمواعيد النهائية ومدة الإشعار والإجازات والعد التنازلي.",
   tool=f"""<div class="lc-grid">
      <div><label class="field-label" for="dtA">تاريخ البداية</label><input type="date" id="dtA"></div>
      <div><label class="field-label" for="dtB">تاريخ النهاية</label><input type="date" id="dtB"></div>
      <div><label class="field-label" for="dtWeekend">عطلة نهاية الأسبوع</label><select id="dtWeekend"><option value="5,6">الجمعة والسبت</option><option value="5">الجمعة فقط</option><option value="0,6">السبت والأحد</option></select></div>
    </div>
    <div class="checkline"><input type="checkbox" id="dtInc"><label for="dtInc">احسب يوم النهاية أيضًا (+1 يوم)</label></div>
    <div class="lc-out"><div class="lc-big"><span id="dtDays">—</span> يوم</div><div class="lc-sub"><span id="dtYmd"></span> <span id="dtDir"></span></div>
      <div class="lc-stats">{stat("الأسابيع", "dtWeeks")}{stat("أيام العمل", "dtWork")}{stat("الساعات", "dtHours")}</div></div>
    <div class="lc-sec"><h2>إضافة أو طرح أيام</h2><div class="lc-grid">
      <div><label class="field-label" for="dtBase">من تاريخ</label><input type="date" id="dtBase"></div>
      <div><label class="field-label" for="dtOp">العملية</label><select id="dtOp"><option value="add">إضافة</option><option value="sub">طرح</option></select></div>
      <div><label class="field-label" for="dtN">عدد الأيام</label><input type="text" inputmode="numeric" id="dtN" value="90"></div></div>
      <div class="lc-big" style="font-size:22px;margin-top:12px" id="dtAdd">—</div></div>""",
   strings='{years:"سنة",years1:"سنة",months:"شهر",months1:"شهر",days:"يوم",days1:"يوم",and:" و",weeks:"أسبوع",past:"(تاريخ النهاية قبل البداية)"}',
   content="""<h2>كيف يتم الحساب؟</h2><ul class="benefits"><li><span>افتراضيًا يُحسب يوم البداية ولا يُحسب يوم النهاية (مثل عدد الليالي في السفر). فعّل «احسب يوم النهاية» لحساب الاثنين.</span></li><li><span>أيام العمل تستثني عطلة نهاية الأسبوع التي تختارها (الجمعة والسبت افتراضيًا)، ولا تستثني الإجازات الرسمية.</span></li><li><span>السنوات الكبيسة محسوبة تلقائيًا، والتاريخ الهجري يظهر بجانب الميلادي.</span></li></ul>
    <h2>أسئلة شائعة</h2><details class="faq-item"><summary>كم يومًا بقي على رمضان أو العيد؟</summary><p>ضع تاريخ اليوم في البداية وتاريخ المناسبة الميلادي في النهاية. لتحويل التاريخ الهجري استخدم <a href="/ar/hijri-converter">محوّل التاريخ</a>.</p></details><details class="faq-item"><summary>ما التاريخ بعد 90 يومًا من اليوم؟</summary><p>استخدم «إضافة أو طرح أيام»: من اليوم أضف 90.</p></details>""",
   rel=[("/ar/hijri-converter", "التاريخ الهجري"), ("/ar/age-calculator", "حساب العمر"), ("/ar/end-of-service-calculator", "حاسبة نهاية الخدمة")])},
 "bmi": {
  EN: dict(crumb="BMI Calculator", badge="Health", h1="BMI Calculator — Body Mass Index and Healthy Weight",
   p="Calculate your body mass index in metric or imperial units, see where it falls on the WHO scale, and the healthy weight range for your height.",
   tool=f"""<div class="lc-grid"><div><label class="field-label" for="bmUnits">Units</label><select id="bmUnits"><option value="met">kg / cm</option><option value="imp">lb / ft + in</option></select></div></div>
    <div class="lc-grid" id="bmMetric" style="margin-top:10px"><div><label class="field-label" for="bmKg">Weight (kg)</label><input type="text" inputmode="decimal" id="bmKg" value="70"></div><div><label class="field-label" for="bmCm">Height (cm)</label><input type="text" inputmode="decimal" id="bmCm" value="175"></div></div>
    <div class="lc-grid" id="bmImperial" hidden style="margin-top:10px"><div><label class="field-label" for="bmLb">Weight (lb)</label><input type="text" inputmode="decimal" id="bmLb" value="154"></div><div><label class="field-label" for="bmFt">Height (ft)</label><input type="text" inputmode="numeric" id="bmFt" value="5"></div><div><label class="field-label" for="bmIn">(in)</label><input type="text" inputmode="decimal" id="bmIn" value="9"></div></div>
    <div class="lc-out"><div class="lc-big" id="bmVal">—</div><div id="bmCat" class="bm-cat"></div><div class="bm-scale"><span id="bmPin"></span></div><div class="lc-sub" id="bmRange"></div></div>
    <p class="lc-note">BMI is a screening number for adults 18+. It doesn't distinguish muscle from fat and isn't a diagnosis — talk to a doctor about your health.</p>""",
   content="""<h2>BMI categories (WHO, adults)</h2><ul class="benefits"><li><span>Below 18.5 — underweight</span></li><li><span>18.5 – 24.9 — healthy weight</span></li><li><span>25 – 29.9 — overweight</span></li><li><span>30 and above — obesity (class I 30–34.9, II 35–39.9, III 40+)</span></li></ul>
    <h2>Frequently asked questions</h2><details class="faq-item"><summary>How is BMI calculated?</summary><p>Weight in kilograms divided by height in metres squared. 70 kg at 1.75 m = 70 ÷ 3.0625 = 22.9.</p></details><details class="faq-item"><summary>Is BMI accurate for athletes?</summary><p>Not always — muscle is heavy, so muscular people can show as “overweight”. Waist size is a useful second check.</p></details>""",
   rel=[("/percentage-calculator", "Percentage Calculator"), ("/days-between-dates", "Days Between Dates"), ("/pregnancy-due-date-calculator", "Due Date Calculator")]),
  AR: dict(crumb="حاسبة كتلة الجسم", badge="صحة", h1="حاسبة مؤشر كتلة الجسم BMI والوزن المثالي",
   p="احسب مؤشر كتلة جسمك بالكيلوغرام والسنتيمتر، واعرف تصنيفه حسب منظمة الصحة العالمية، والوزن المثالي المناسب لطولك.",
   tool=f"""<input type="hidden" id="bmUnits" value="met"><div class="lc-grid" id="bmMetric"><div><label class="field-label" for="bmKg">الوزن (كغ)</label><input type="text" inputmode="decimal" id="bmKg" value="70"></div><div><label class="field-label" for="bmCm">الطول (سم)</label><input type="text" inputmode="decimal" id="bmCm" value="170"></div></div>
    <div id="bmImperial" hidden><input id="bmLb"><input id="bmFt"><input id="bmIn"></div>
    <div class="lc-out"><div class="lc-big" id="bmVal">—</div><div id="bmCat" class="bm-cat"></div><div class="bm-scale"><span id="bmPin"></span></div><div class="lc-sub" id="bmRange"></div></div>
    <p class="lc-note">المؤشر للبالغين من 18 سنة فأكثر، ولا يفرّق بين العضلات والدهون، وليس تشخيصًا طبيًا — استشر طبيبك بخصوص صحتك.</p>""",
   strings='{under:"نقص في الوزن",normal:"وزن صحي",over:"زيادة في الوزن",ob1:"سمنة من الدرجة الأولى",ob2:"سمنة من الدرجة الثانية",ob3:"سمنة مفرطة",range:"الوزن الصحي لطولك:"}',
   content="""<h2>تصنيفات مؤشر كتلة الجسم (منظمة الصحة العالمية)</h2><ul class="benefits"><li><span>أقل من 18.5 — نقص في الوزن</span></li><li><span>18.5 – 24.9 — وزن صحي</span></li><li><span>25 – 29.9 — زيادة في الوزن</span></li><li><span>30 فأكثر — سمنة (الأولى 30–34.9، الثانية 35–39.9، المفرطة 40+)</span></li></ul>
    <h2>أسئلة شائعة</h2><details class="faq-item"><summary>كيف أحسب كتلة الجسم؟</summary><p>الوزن بالكيلوغرام ÷ مربع الطول بالمتر. 70 كغ وطول 1.70 م = 70 ÷ 2.89 = 24.2.</p></details><details class="faq-item"><summary>ما هو الوزن المثالي لطولي؟</summary><p>تظهره الأداة مباشرة تحت النتيجة: المدى الذي يجعل مؤشرك بين 18.5 و24.9.</p></details>""",
   rel=[("/ar/pregnancy-calculator", "حاسبة الحمل"), ("/ar/age-calculator", "حساب العمر"), ("/ar/percentage-calculator", "حاسبة النسبة المئوية")])},
 "due": {
  EN: dict(crumb="Due Date Calculator", badge="Pregnancy", h1="Pregnancy Due Date Calculator — How Many Weeks Pregnant Am I?",
   p="Estimate your due date from the first day of your last period (adjusted for cycle length) or from the conception date, see how far along you are, and the dates of key milestones.",
   tool=f"""<div class="lc-grid"><div><label class="field-label" for="pgMode">Calculate from</label><select id="pgMode"><option value="lmp">First day of last period</option><option value="conception">Conception date</option></select></div>
      <div id="pgLmpWrap"><label class="field-label" for="pgLmp">First day of last period</label><input type="date" id="pgLmp"></div>
      <div><label class="field-label" for="pgCycle">Cycle length (days)</label><input type="text" inputmode="numeric" id="pgCycle" value="28"></div>
      <div id="pgConWrap" hidden><label class="field-label" for="pgCon">Conception date</label><input type="date" id="pgCon"></div></div>
    <div class="lc-out"><div class="lc-sub">Estimated due date</div><div class="lc-big" style="font-size:clamp(22px,3.6vw,32px)" id="pgDue">—</div><div class="lc-sub" id="pgNow"></div><div class="pg-track"><div id="pgBar"></div></div></div>
    <div class="lc-sec"><h2>Milestones</h2><table class="lc-table"><tbody id="pgMs"></tbody></table></div>
    <p class="lc-note">Only about 1 in 25 babies arrive on the due date — most come within two weeks either side. An early ultrasound gives the most accurate date; follow your doctor or midwife.</p>""",
   content="""<h2>How the due date is calculated</h2><ul class="benefits"><li><span>Naegele's rule: first day of the last period + 280 days (40 weeks).</span></li><li><span>Longer or shorter cycles move the date: a 32-day cycle adds 4 days.</span></li><li><span>From conception: + 266 days (38 weeks).</span></li></ul>
    <h2>Frequently asked questions</h2><details class="faq-item"><summary>Why do weeks count from my last period?</summary><p>It's the standard medical convention — the first two “weeks” happen before conception.</p></details>""",
   rel=[("/days-between-dates", "Days Between Dates"), ("/bmi-calculator", "BMI Calculator"), ("/percentage-calculator", "Percentage Calculator")]),
  AR: dict(crumb="حاسبة الحمل", badge="حمل", h1="حاسبة الحمل والولادة — موعد الولادة وفي أي أسبوع أنا؟",
   p="احسبي موعد الولادة المتوقع من أول يوم في آخر دورة (مع مراعاة طول الدورة) أو من تاريخ الإخصاب، واعرفي في أي أسبوع من الحمل أنتِ، ومواعيد المراحل المهمة بالميلادي والهجري.",
   tool=f"""<div class="lc-grid"><div><label class="field-label" for="pgMode">الحساب من</label><select id="pgMode"><option value="lmp">أول يوم من آخر دورة</option><option value="conception">تاريخ الإخصاب</option></select></div>
      <div id="pgLmpWrap"><label class="field-label" for="pgLmp">أول يوم من آخر دورة</label><input type="date" id="pgLmp"></div>
      <div><label class="field-label" for="pgCycle">طول الدورة (أيام)</label><input type="text" inputmode="numeric" id="pgCycle" value="28"></div>
      <div id="pgConWrap" hidden><label class="field-label" for="pgCon">تاريخ الإخصاب</label><input type="date" id="pgCon"></div></div>
    <div class="lc-out"><div class="lc-sub">موعد الولادة المتوقع</div><div class="lc-big" style="font-size:clamp(20px,3.4vw,30px)" id="pgDue">—</div><div class="lc-sub" id="pgNow"></div><div class="pg-track"><div id="pgBar"></div></div></div>
    <div class="lc-sec"><h2>المراحل المهمة</h2><table class="lc-table"><tbody id="pgMs"></tbody></table></div>
    <p class="lc-note">حوالي طفل واحد من كل 25 يولد في الموعد المتوقع بالضبط، وأغلب الولادات خلال أسبوعين قبله أو بعده. السونار المبكر أدق طريقة لتحديد الموعد — اتبعي إرشادات طبيبتك.</p>""",
   strings='{now:"الآن:",w:"أسبوع",d:"يوم",tri1:"الثلث الأول",tri2:"الثلث الثاني",tri3:"الثلث الثالث",left:"يومًا متبقيًا",past42:"أكثر من 42 أسبوعًا — تأكدي من التاريخ المُدخل.",ms_t1End:"نهاية الثلث الأول (الأسبوع 13)",ms_scan20:"سونار الأسبوع 20 (التشوهات)",ms_t2End:"بداية الثلث الثالث (الأسبوع 28)",ms_term37:"اكتمال الحمل (الأسبوع 37)",ms_due:"موعد الولادة (الأسبوع 40)",ms_late42:"الأسبوع 42"}',
   content="""<h2>كيف يُحسب موعد الولادة؟</h2><ul class="benefits"><li><span>قاعدة نيجل: أول يوم من آخر دورة + 280 يومًا (40 أسبوعًا).</span></li><li><span>الدورة الأطول أو الأقصر تغيّر الموعد: دورة 32 يومًا تضيف 4 أيام.</span></li><li><span>من تاريخ الإخصاب: + 266 يومًا (38 أسبوعًا).</span></li></ul>
    <h2>أسئلة شائعة</h2><details class="faq-item"><summary>لماذا تُحسب أسابيع الحمل من آخر دورة؟</summary><p>هذا هو المعيار الطبي المعتمد — أول أسبوعين يكونان قبل حدوث الحمل فعليًا.</p></details>""",
   rel=[("/ar/days-between-dates", "حساب الأيام بين تاريخين"), ("/ar/bmi-calculator", "حاسبة كتلة الجسم"), ("/ar/hijri-converter", "التاريخ الهجري")])},
 "loan": {
  EN: dict(crumb="Loan Calculator", badge="Finance", h1="Loan Calculator — Monthly Payment, Total Interest and Real APR",
   p="Work out the monthly payment and total cost of a loan or personal finance, see a yearly schedule, and compare flat-rate offers with their real (reducing-balance) annual rate.",
   tool=f"""<div class="lc-grid">
      <div><label class="field-label" for="lnAmt">Loan amount</label><input type="text" inputmode="decimal" id="lnAmt" value="100000"></div>
      <div><label class="field-label" for="lnRate">Annual rate %</label><input type="text" inputmode="decimal" id="lnRate" value="5"></div>
      <div><label class="field-label" for="lnYears">Years</label><input type="text" inputmode="numeric" id="lnYears" value="5"></div>
      <div><label class="field-label" for="lnMonths">+ months</label><input type="text" inputmode="numeric" id="lnMonths" value="0"></div>
      <div><label class="field-label" for="lnMethod">Rate type</label><select id="lnMethod"><option value="reducing">Reducing balance (APR)</option><option value="flat">Flat rate</option></select></div>
      <div><label class="field-label" for="lnFee">Upfront fees (optional)</label><input type="text" inputmode="decimal" id="lnFee" value="0"></div></div>
    <div class="lc-out"><div class="lc-sub">Monthly payment</div><div class="lc-big" id="lnMonthly">—</div>
      <div class="lc-stats">{stat("Total repaid", "lnTotal")}{stat("Total interest", "lnInt")}{stat("Real annual rate (APR)", "lnApr")}</div>
      <p class="lc-note" id="lnAprNote" hidden>A flat rate is charged on the full amount for the whole term, so the real annual rate is almost double — compare offers by APR.</p></div>
    <div class="lc-sec"><h2>Yearly schedule</h2><div class="lc-scroll"><table class="lc-table"><thead><tr><th>Year</th><th>Paid</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody id="lnSched"></tbody></table></div></div>""",
   content="""<h2>Flat rate vs reducing balance</h2><ul class="benefits"><li><span><strong>Reducing balance (APR):</strong> interest is charged only on what you still owe, so it shrinks every month.</span></li><li><span><strong>Flat rate:</strong> interest is charged on the original amount for the entire term. A 3% flat rate over 5 years costs about the same as 5.6% APR.</span></li></ul>
    <h2>Frequently asked questions</h2><details class="faq-item"><summary>How is the monthly payment calculated?</summary><p>Payment = P × r ÷ (1 − (1 + r)^−n), where r is the monthly rate and n the number of months.</p></details>""",
   rel=[("/percentage-calculator", "Percentage Calculator"), ("/days-between-dates", "Days Between Dates"), ("/ar/vat-calculator", "VAT Calculator (Arabic)")]),
  AR: dict(crumb="حاسبة التمويل والقروض", badge="تمويل", h1="حاسبة التمويل الشخصي والقروض — القسط الشهري والتكلفة الحقيقية",
   p="احسب القسط الشهري وإجمالي ما ستدفعه في التمويل الشخصي أو القرض، مع جدول سنوي، وقارن عروض النسبة الثابتة (المرابحة) بالنسبة السنوية الحقيقية APR التي تكشف التكلفة الفعلية.",
   tool=f"""<div class="lc-grid">
      <div><label class="field-label" for="lnAmt">مبلغ التمويل</label><input type="text" inputmode="decimal" id="lnAmt" value="100000"></div>
      <div><label class="field-label" for="lnRate">النسبة السنوية %</label><input type="text" inputmode="decimal" id="lnRate" value="3"></div>
      <div><label class="field-label" for="lnYears">المدة (سنوات)</label><input type="text" inputmode="numeric" id="lnYears" value="5"></div>
      <div><label class="field-label" for="lnMonths">+ أشهر</label><input type="text" inputmode="numeric" id="lnMonths" value="0"></div>
      <div><label class="field-label" for="lnMethod">نوع النسبة</label><select id="lnMethod"><option value="flat">ثابتة / مرابحة (Flat)</option><option value="reducing">متناقصة (APR)</option></select></div>
      <div><label class="field-label" for="lnFee">رسوم إدارية (اختياري)</label><input type="text" inputmode="decimal" id="lnFee" value="0"></div></div>
    <div class="lc-out"><div class="lc-sub">القسط الشهري</div><div class="lc-big" id="lnMonthly">—</div>
      <div class="lc-stats">{stat("إجمالي المدفوع", "lnTotal")}{stat("إجمالي الأرباح/الفوائد", "lnInt")}{stat("النسبة السنوية الحقيقية APR", "lnApr")}</div>
      <p class="lc-note" id="lnAprNote" hidden>النسبة الثابتة تُحسب على كامل المبلغ طوال المدة، لذلك تكون النسبة الحقيقية تقريبًا ضعفها — قارن العروض دائمًا بالـ APR.</p></div>
    <div class="lc-sec"><h2>الجدول السنوي</h2><div class="lc-scroll"><table class="lc-table"><thead><tr><th>السنة</th><th>المدفوع</th><th>من الأصل</th><th>الأرباح</th><th>المتبقي</th></tr></thead><tbody id="lnSched"></tbody></table></div></div>
    <p class="lc-note">النتائج تقديرية للمقارنة — العقد والرسوم والتأمين لدى البنك تحدد المبلغ النهائي.</p>""",
   content="""<h2>الفرق بين النسبة الثابتة والمتناقصة</h2><ul class="benefits"><li><span><strong>الثابتة (المرابحة):</strong> تُحسب الأرباح على المبلغ الأصلي كاملًا طوال المدة. تمويل 100,000 بنسبة 3% لمدة 5 سنوات = 15,000 أرباح.</span></li><li><span><strong>المتناقصة (APR):</strong> تُحسب على المتبقي فقط فتقل كل شهر. نسبة 3% ثابتة لـ 5 سنوات تعادل تقريبًا 5.6% متناقصة.</span></li></ul>
    <h2>أسئلة شائعة</h2><details class="faq-item"><summary>كيف أحسب قسط التمويل الشخصي؟</summary><p>في النسبة الثابتة: (المبلغ + المبلغ × النسبة × السنوات) ÷ عدد الأشهر. مثال: (100,000 + 15,000) ÷ 60 = 1,916.67 شهريًا.</p></details><details class="faq-item"><summary>ما هي النسبة السنوية APR؟</summary><p>التكلفة الحقيقية للتمويل سنويًا بعد احتساب طريقة السداد والرسوم، وهي الأفضل لمقارنة عروض البنوك.</p></details>""",
   rel=[("/ar/percentage-calculator", "حاسبة النسبة المئوية"), ("/ar/vat-calculator", "حاسبة ضريبة القيمة المضافة"), ("/ar/end-of-service-calculator", "حاسبة نهاية الخدمة")])},
}
io.open(os.path.join(here, "life_style.html"), "w", encoding="utf-8", newline="\n").write(STYLE)
for key, langs in PAGES.items():
    for lang, t in langs.items():
        home, homeL = ("/ar", "الرئيسية") if lang == AR else ("/", "Home")
        badges = (t["badge"], "تعمل داخل متصفحك" if lang == AR else "Runs in your browser", "مجانية" if lang == AR else "Free")
        rel = "".join('      <a href="%s">%s%s</a>\n' % (u, n, GO) for u, n in t["rel"])
        strings = '  <script>window.QT_STRINGS = %s;</script>\n' % t["strings"] if t.get("strings") else ""
        hijri = '  <script src="/hijri.js"></script>\n' if lang == AR else ""
        b = f"""<div class="wrap">
  <div class="breadcrumb"><a href="{home}">{homeL}</a> <span>/</span><span style="color:var(--text-dim)">{t['crumb']}</span></div>
{'<!--LANG-SWITCH-->' + chr(10) if lang == AR else ''}  <section class="hero compact">
    <div class="hero-badges"><span class="badge">{badges[0]}</span><span class="badge local">{LOCK}{badges[1]}</span><span class="badge">{badges[2]}</span></div>
    <h1>{t['h1']}</h1>
    <p>{t['p']}</p>
  </section>

  <div class="tool-panel" id="tool">
    {t['tool']}
  </div>
{strings}{hijri}  <script src="/life-calcs.js"></script>

  <div class="content">
    {t['content']}
  </div>

  <div class="section related-section">
    <h2 class="related-title">{'أدوات أخرى' if lang == AR else 'More tools'}</h2>
    <div class="related-grid">
{rel}    </div>
  </div>
</div>
"""
        io.open(os.path.join(here, "life_%s_%s.html" % (key, lang)), "w", encoding="utf-8", newline="\n").write(b)
print("life calc bodies written")
