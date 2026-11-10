# Writes EN/AR bodies + style for the prayer times tool.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .pt-bar{display:grid;grid-template-columns:minmax(0,2fr) auto minmax(0,1.4fr) minmax(0,1fr);gap:10px;align-items:end}
    @media(max-width:860px){.pt-bar{grid-template-columns:1fr 1fr}}
    .pt-bar input,.pt-bar select{width:100%}
    #ptGeoMsg{font-size:12.5px;color:var(--text-dim);min-height:1px}
    .pt-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-top:18px}
    #ptPlace{font-size:22px;font-weight:800;margin:0}
    #ptDate{color:var(--text-dim);font-size:14px}
    #ptNext{font-size:15px;padding:8px 14px;border-radius:999px;background:rgba(107,107,255,.14);border:1px solid rgba(123,123,255,.35)}
    .pt-cd{font-variant-numeric:tabular-nums;font-weight:800;color:#3be2ff;direction:ltr;display:inline-block}
    #ptGrid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-top:14px}
    @media(max-width:760px){#ptGrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
    .pt-cell{padding:14px 10px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.03);text-align:center}
    .pt-cell span{display:block;color:var(--text-dim);font-size:14px}
    .pt-cell b{display:block;font-size:24px;font-variant-numeric:tabular-nums;direction:ltr;margin-top:2px}
    .pt-cell.pt-sun{opacity:.7}
    .pt-cell.pt-next{background:linear-gradient(135deg,rgba(107,107,255,.35),rgba(59,226,255,.15));border-color:rgba(123,123,255,.6);box-shadow:0 14px 34px -18px rgba(91,91,255,.9)}
    .pt-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.4fr);gap:14px;margin-top:16px}
    @media(max-width:760px){.pt-row{grid-template-columns:1fr}}
    .pt-box{border:1px solid var(--line);border-radius:16px;padding:14px 16px;background:rgba(255,255,255,.02)}
    .pt-box h2{margin:0 0 10px;font-size:15px;color:var(--text-dim)}
    .pt-qibla{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
    .pt-compass{width:150px;height:150px;border-radius:50%;position:relative;flex:none;background:radial-gradient(circle,rgba(255,255,255,.05),transparent 70%);transition:transform .25s linear}
    .pt-compass .pt-ring{position:absolute;inset:0;border-radius:50%;border:2px solid var(--line-strong)}
    .pt-c{position:absolute;font-size:12px;font-weight:800;color:var(--muted);line-height:1;direction:ltr}
    .pt-c.n{top:6px;left:50%;transform:translateX(-50%);color:#ff8f8f}.pt-c.s{bottom:6px;left:50%;transform:translateX(-50%)}
    .pt-c.e{right:7px;top:50%;transform:translateY(-50%)}.pt-c.w{left:7px;top:50%;transform:translateY(-50%)}
    #ptNeedle{position:absolute;inset:0;transition:transform .4s}
    #ptNeedle::before{content:"";position:absolute;left:50%;top:26px;width:4px;height:50px;margin-left:-2px;border-radius:3px;background:var(--grad)}
    #ptNeedle::after{content:"🕋";position:absolute;left:50%;top:6px;transform:translateX(-50%);font-size:20px}
    .pt-hub{position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;border-radius:50%;background:#fff}
    .pt-compass.pt-on{box-shadow:0 0 0 3px rgba(59,226,255,.35)}
    .pt-compass.pt-aligned{box-shadow:0 0 0 4px rgba(60,220,140,.7)}
    #ptFrom{font-size:13px;color:var(--text-dim);margin-top:4px}
    #ptFrom.pt-warn{color:#ffd88a}
    #ptCompassMsg{font-size:14px;font-weight:700;margin-top:8px;min-height:1px}
    #ptCompassMsg.ok{color:#7ff0b0}
    .pt-howto{font-size:12.5px;color:var(--text-dim);margin-top:8px;line-height:1.6}
    #ptQibla{font-size:26px;font-weight:800;direction:ltr;display:inline-block}
    #ptCount{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .pt-ev{padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid var(--line);text-align:center}
    .pt-ev span{display:block;font-size:13px;color:var(--text-dim)}.pt-ev b{display:block;font-size:20px}.pt-ev small{color:var(--muted);font-size:11.5px}
    .pt-tablewrap{overflow-x:auto}
    .pt-table{width:100%;border-collapse:collapse;font-size:13.5px;font-variant-numeric:tabular-nums}
    .pt-table th,.pt-table td{padding:7px 6px;border-bottom:1px solid var(--line);text-align:center;white-space:nowrap}
    .pt-table th{color:var(--muted);font-weight:600;position:sticky;top:0;background:var(--bg)}
    .pt-table tr.pt-today td{background:rgba(107,107,255,.16);font-weight:700}
    .pt-sec{margin-top:18px}
    .pt-sec-head{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
    .pt-sec-head h2{margin:0;font-size:17px}
    #ptMeta{font-size:12px;color:var(--muted);margin-top:12px}
    @media print{
      @page{margin:10mm}
      html,body{background:#fff !important;color:#000 !important}
      body[data-print] .site-header,body[data-print] footer,body[data-print] .aurora,body[data-print] .grain,body[data-print] .breadcrumb,body[data-print] .hero,body[data-print] .content,body[data-print] .related-section,body[data-print] .lang-switch{display:none !important}
      body[data-print] #tool > *:not(.pt-print){display:none !important}
      body[data-print="month"] #ptRamadan,body[data-print="ramadan"] #ptMonthSec{display:none !important}
      body[data-print] .tool-panel{background:none !important;border:0 !important;box-shadow:none !important;backdrop-filter:none !important;padding:0 !important}
      body[data-print] .pt-table th,body[data-print] .pt-table td{color:#000 !important;border-color:#bbb !important;background:#fff !important}
      body[data-print] .pt-sec-head button,body[data-print] .pt-sec-head input{display:none !important}
      body[data-print] .pt-sec-head h2{color:#000}
      body[data-print] .wrap > .section{display:none !important}
      body[data-print] .pt-table{font-size:10.5px}
      body[data-print] .pt-table th,body[data-print] .pt-table td{padding:3.5px 4px !important}
      body[data-print] .pt-sec{margin-top:0}
    }
  </style>
"""
T = {
 "en": dict(home="/", homeL="Home", crumb="Prayer Times", badge="Islamic", h1="Prayer Times Today — Fajr, Dhuhr, Asr, Maghrib, Isha",
   p="Accurate daily prayer times for your city or exact location, with the next prayer countdown, Qibla direction, a monthly timetable and a printable Ramadan timetable. Calculated on your device with official methods (Umm al-Qura, MWL, Egyptian, ISNA and more).",
   search="City", ph="Type a city, e.g. London", geo="Use my location", method="Calculation method", asr="Asr", asr1="Standard (Shafi'i, Maliki, Hanbali)", asr2="Hanafi", h12="12-hour clock",
   qibla="Qibla direction", live="Live compass (phone)", howto="Without the live compass: lay the phone flat and turn it until N on the dial points north, then face the 🕋 arrow — or turn until your phone's compass app shows the degree above.", qiblaNote="degrees clockwise from true north · distance to the Kaaba:", events="Countdown", month="Monthly timetable", printM="Print", ramadan="Ramadan", printR="Print timetable",
   cols=["Day", "Hijri", "Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"], rcols=["Day", "Date", "Imsak", "Fajr", "Dhuhr", "Asr", "Iftar (Maghrib)", "Isha"],
   content="""<h2>How are these prayer times calculated?</h2>
    <ul class="benefits"><li><span>From the sun's position for your coordinates and date, using the method's Fajr and Isha angles (e.g. Umm al-Qura: Fajr 18.5°, Isha 90 minutes after Maghrib, 120 in Ramadan).</span></li>
    <li><span>Official minute adjustments are included where countries publish them (Jordan, UAE, Morocco, Turkey).</span></li>
    <li><span>Checked against a widely used reference service: within 0–2 minutes for most cities and methods (Asr can differ by up to 3 minutes at high latitudes).</span></li>
    <li><span>Imsak is shown 10 minutes before Fajr. Always follow your local mosque or official authority if they differ.</span></li></ul>
    <h2>Frequently asked questions</h2>
    <details class="faq-item"><summary>Which method should I choose?</summary><p>The tool picks your country's usual method automatically. Saudi Arabia uses Umm al-Qura, Egypt the Egyptian Authority, North America ISNA, and most of Europe the Muslim World League.</p></details>
    <details class="faq-item"><summary>Does it need my location?</summary><p>Only if you tap “Use my location” — the coordinates stay in your browser. You can just pick a city instead.</p></details>""",
   rel=[("/ar/prayer-times", "مواقيت الصلاة (Arabic)"), ("/ar/hijri-converter", "Hijri converter"), ("/ar/zakat-calculator", "Zakat calculator")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="مواقيت الصلاة", badge="إسلامي", h1="مواقيت الصلاة اليوم — الفجر والظهر والعصر والمغرب والعشاء",
   p="مواقيت صلاة دقيقة لمدينتك أو لموقعك الحالي، مع العد التنازلي للصلاة القادمة، واتجاه القبلة، وجدول شهري، وإمساكية رمضان قابلة للطباعة. تُحسب على جهازك بالطرق المعتمدة (أم القرى، رابطة العالم الإسلامي، الهيئة المصرية وغيرها).",
   search="المدينة", ph="اكتب اسم المدينة، مثل الرياض", geo="استخدم موقعي", method="طريقة الحساب", asr="العصر", asr1="الجمهور (الشافعي والمالكي والحنبلي)", asr2="الحنفي", h12="نظام 12 ساعة",
   qibla="اتجاه القبلة", live="بوصلة حية (للجوال)", howto="بدون البوصلة الحية: ضع الجوال مسطحًا وأدره حتى يشير حرف N في الدائرة إلى الشمال، ثم اتجه نحو سهم 🕋 — أو افتح تطبيق البوصلة في جوالك واستدر حتى تظهر الدرجة المكتوبة أعلاه.", qiblaNote="درجة باتجاه عقارب الساعة من الشمال الحقيقي · المسافة إلى الكعبة:", events="العد التنازلي", month="الجدول الشهري", printM="طباعة", ramadan="إمساكية رمضان", printR="طباعة الإمساكية",
   cols=["اليوم", "الهجري", "الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"], rcols=["اليوم", "التاريخ", "الإمساك", "الفجر", "الظهر", "العصر", "المغرب (الإفطار)", "العشاء"],
   content="""<h2>كيف تُحسب مواقيت الصلاة؟</h2>
    <ul class="benefits"><li><span>من موقع الشمس حسب إحداثيات مدينتك والتاريخ، بزوايا الفجر والعشاء الخاصة بكل طريقة (أم القرى: الفجر 18.5° والعشاء بعد المغرب بـ90 دقيقة، و120 دقيقة في رمضان).</span></li>
    <li><span>نطبّق التعديلات الرسمية بالدقائق في الدول التي تعتمدها (الأردن، الإمارات، المغرب، تركيا).</span></li>
    <li><span>قارنّا النتائج بخدمة مرجعية واسعة الاستخدام: الفرق بين 0 و2 دقيقة لأغلب المدن والطرق.</span></li>
    <li><span>الإمساك قبل الفجر بعشر دقائق. اتبع دائمًا مسجدك أو الجهة الرسمية في بلدك عند وجود اختلاف.</span></li></ul>
    <h2>أسئلة شائعة</h2>
    <details class="faq-item"><summary>أي طريقة حساب أختار؟</summary><p>تختار الأداة طريقة بلدك تلقائيًا: السعودية أم القرى، مصر الهيئة المصرية، الأردن وزارة الأوقاف، وهكذا. ويمكنك تغييرها.</p></details>
    <details class="faq-item"><summary>هل تحتاج الأداة موقعي؟</summary><p>فقط إذا ضغطت «استخدم موقعي»، والإحداثيات تبقى في متصفحك. يمكنك اختيار مدينتك من القائمة بدلًا من ذلك.</p></details>
    <details class="faq-item"><summary>متى يبدأ رمضان والعيد؟</summary><p>التواريخ المعروضة حسب تقويم أم القرى، والإعلان الرسمي يعتمد على رؤية الهلال في بلدك وقد يختلف يومًا.</p></details>""",
   rel=[("/ar/hijri-converter", "التاريخ الهجري"), ("/ar/zakat-calculator", "حاسبة الزكاة"), ("/ar/days-between-dates", "حساب الأيام بين تاريخين")]),
}
io.open(os.path.join(here, "pt_style.html"), "w", encoding="utf-8", newline="\n").write(STYLE)
for lang, t in T.items():
    ar = lang == "ar"
    rel = "".join('      <a href="%s">%s%s</a>\n' % (u, n, GO) for u, n in t["rel"])
    th = "".join("<th>%s</th>" % c for c in t["cols"]); rth = "".join("<th>%s</th>" % c for c in t["rcols"])
    b = f"""<div class="wrap">
  <div class="breadcrumb"><a href="{t['home']}">{t['homeL']}</a> <span>/</span><span style="color:var(--text-dim)">{t['crumb']}</span></div>
<!--LANG-SWITCH-->
  <section class="hero compact">
    <div class="hero-badges"><span class="badge">{t['badge']}</span><span class="badge local">{LOCK}{'تُحسب على جهازك' if ar else 'Calculated on your device'}</span><span class="badge">{'مجاني' if ar else 'Free'}</span></div>
    <h1>{t['h1']}</h1>
    <p>{t['p']}</p>
  </section>

  <div class="tool-panel" id="tool">
    <div class="pt-bar">
      <div><label class="field-label" for="ptSearch">{t['search']}</label><input type="text" id="ptSearch" list="ptCities" placeholder="{t['ph']}" autocomplete="off"><datalist id="ptCities"></datalist></div>
      <div><button type="button" class="btn btn-secondary" id="ptGeo">📍 {t['geo']}</button></div>
      <div><label class="field-label" for="ptMethod">{t['method']}</label><select id="ptMethod"></select></div>
      <div><label class="field-label" for="ptAsr">{t['asr']}</label><select id="ptAsr"><option value="1">{t['asr1']}</option><option value="2">{t['asr2']}</option></select></div>
    </div>
    <div id="ptGeoMsg" aria-live="polite"></div>
    <div class="checkline"><input type="checkbox" id="ptH12"><label for="ptH12">{t['h12']}</label></div>
    <div class="pt-head"><div><h2 id="ptPlace"></h2><div id="ptDate"></div></div><div id="ptNext" aria-live="polite"></div></div>
    <div id="ptGrid"></div>
    <div class="pt-row">
      <div class="pt-box"><h2>{t['qibla']}</h2><div class="pt-qibla"><div class="pt-compass" id="ptDial"><span class="pt-ring"></span><span class="pt-c n">N</span><span class="pt-c e">E</span><span class="pt-c s">S</span><span class="pt-c w">W</span><div id="ptNeedle"></div><span class="pt-hub"></span></div><div style="flex:1;min-width:180px"><div id="ptQibla"></div><div id="ptFrom"></div><div style="font-size:12.5px;color:var(--text-dim)">{t['qiblaNote']} <b id="ptKm"></b></div>
        <button type="button" class="btn btn-secondary" id="ptCompassBtn" style="margin-top:10px">🧭 {t['live']}</button><div id="ptCompassMsg" aria-live="polite"></div></div></div>
        <p class="pt-howto" id="ptHowto">{t['howto']}</p></div>
      <div class="pt-box"><h2>{t['events']}</h2><div id="ptCount"></div></div>
    </div>
    <div class="pt-sec pt-print" id="ptMonthSec"><div class="pt-sec-head"><h2>{t['month']}</h2><div style="display:flex;gap:8px"><input type="month" id="ptMonth"><button type="button" class="btn btn-secondary" data-print="month">{t['printM']}</button></div></div>
      <div class="pt-tablewrap"><table class="pt-table"><thead><tr>{th}</tr></thead><tbody id="ptMonthBody"></tbody></table></div></div>
    <div class="pt-sec pt-print" id="ptRamadan"><div class="pt-sec-head"><h2 id="ptRamadanTitle">{t['ramadan']}</h2><button type="button" class="btn" data-print="ramadan">{t['printR']}</button></div>
      <div class="pt-tablewrap"><table class="pt-table"><thead><tr>{rth}</tr></thead><tbody id="ptRamadanBody"></tbody></table></div></div>
    <div id="ptMeta"></div>
  </div>
  <script src="/hijri.js"></script>
  <script src="/prayer-cities.js"></script>
  <script src="/prayer-times.js"></script>

  <div class="content">
    {t['content']}
  </div>

  <div class="section related-section">
    <h2 class="related-title">{'أدوات أخرى' if ar else 'More tools'}</h2>
    <div class="related-grid">
{rel}    </div>
  </div>
</div>
"""
    io.open(os.path.join(here, "pt_body_%s.html" % lang), "w", encoding="utf-8", newline="\n").write(b)
print("prayer bodies written")
