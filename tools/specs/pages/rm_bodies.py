# Writes the EN/AR bodies + style for the Ramadan pack: Ramadan / iftar countdown and zakat al-fitr calculator.
import io, os
here = os.path.dirname(os.path.abspath(__file__))
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
LOCK = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>'
STYLE = """  <style>
    .rc-card{position:relative;overflow:hidden;border:1px solid rgba(255,209,102,.28);border-radius:22px;padding:22px 20px;text-align:center;
      background:radial-gradient(120% 90% at 50% 0%,rgba(255,209,102,.13),transparent 60%),linear-gradient(160deg,rgba(107,107,255,.14),rgba(12,15,34,.4))}
    .rc-card::before{content:"";position:absolute;width:120px;height:120px;border-radius:50%;top:-34px;inset-inline-end:-26px;box-shadow:-22px 16px 0 0 rgba(255,209,102,.85);opacity:.85;animation:rcMoon 6s ease-in-out infinite}
    @keyframes rcMoon{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(6px) rotate(-4deg)}}
    .rc-stars{position:absolute;inset:0;pointer-events:none;background-image:radial-gradient(1.5px 1.5px at 12% 22%,#fff,transparent),radial-gradient(1px 1px at 28% 70%,#fff,transparent),radial-gradient(1.5px 1.5px at 55% 15%,#fff,transparent),radial-gradient(1px 1px at 78% 60%,#fff,transparent),radial-gradient(1px 1px at 90% 85%,#fff,transparent),radial-gradient(1.2px 1.2px at 40% 88%,#fff,transparent);opacity:.55;animation:rcTw 3.5s ease-in-out infinite alternate}
    @keyframes rcTw{from{opacity:.25}to{opacity:.7}}
    .rc-top{position:relative;display:flex;justify-content:center;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px}
    .rc-top select{width:auto;max-width:100%}
    .rc-label{position:relative;font-size:17px;font-weight:800;color:#ffd166;margin:4px 0 14px}
    .rc-digits{position:relative;display:flex;justify-content:center;gap:10px;direction:ltr}
    .rc-u{min-width:76px;padding:12px 8px 8px;border-radius:16px;background:rgba(5,7,20,.55);border:1px solid rgba(255,255,255,.1);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
    .rc-u b{display:block;font-size:40px;font-weight:800;line-height:1.05;font-variant-numeric:tabular-nums;color:#fff}
    .rc-u span{font-size:12px;color:var(--muted);font-weight:700}
    .rm-flip{animation:rmFlip .45s cubic-bezier(.16,1,.3,1)}
    @keyframes rmFlip{0%{transform:translateY(-35%);opacity:.2}100%{transform:none;opacity:1}}
    .rc-bar{position:relative;margin:16px auto 0;max-width:460px}
    .rc-bar-track{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
    .rc-bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#ffd166,#ff9f59);transition:width 1s linear}
    .rc-bar-txt{font-size:12.5px;color:var(--muted);margin-top:6px;font-weight:700}
    .rc-today{position:relative;color:var(--text-dim);font-weight:700;margin-top:10px}
    .rc-today:empty{display:none}
    .rc-actions{position:relative;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:16px}
    .rc-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:10px;margin-top:14px}
    .rc-i{border:1px solid var(--line);border-radius:14px;padding:12px 14px;background:rgba(255,255,255,.025)}
    .rc-i span{display:block;font-size:12.5px;color:var(--muted);font-weight:700}
    .rc-i b{font-size:16px;color:var(--text)}
    .rc-i b.ltr{direction:ltr;display:inline-block}
    .rc-note{font-size:13px;color:var(--muted);margin-top:12px}
    .zf-grid{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(250px,1fr);gap:16px;align-items:start}
    @media(max-width:860px){.zf-grid{grid-template-columns:1fr}}
    .zf-card{border:1px solid var(--line);border-radius:18px;padding:16px 18px;background:rgba(255,255,255,.025)}
    .zf-card h2{margin:0 0 12px;font-size:15px;color:var(--text-dim)}
    .zf-row{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0}
    .zf-row label{flex:1 1 210px;font-weight:600}
    .zf-row input{width:110px;text-align:center;direction:ltr;font-weight:700}
    .zf-step{display:inline-flex;align-items:center;gap:6px}
    .zf-step button{width:38px;height:38px;border-radius:12px;border:1px solid var(--line-strong);background:var(--card);color:var(--text);font-size:20px;font-weight:700;cursor:pointer}
    .zf-step button:hover{border-color:var(--accent)}
    .zf-step input{width:70px}
    #zfKgChips{display:inline-flex;gap:6px;flex-wrap:wrap}
    #zfPeople{display:flex;flex-wrap:wrap;gap:4px;min-height:26px;margin:4px 0 2px}
    .zf-p{width:16px;height:24px;position:relative;animation:zfIn .35s cubic-bezier(.16,1,.3,1) both}
    .zf-p::before{content:"";position:absolute;top:0;left:3px;width:10px;height:10px;border-radius:50%;background:#ffd166}
    .zf-p::after{content:"";position:absolute;bottom:0;left:0;width:16px;height:12px;border-radius:8px 8px 3px 3px;background:#ffd166;opacity:.8}
    .zf-more{font-weight:800;color:#ffd166;align-self:center;font-size:13px}
    @keyframes zfIn{from{opacity:0;transform:translateY(6px) scale(.6)}to{opacity:1;transform:none}}
    .zf-res{text-align:center}
    .zf-big{font-size:38px;font-weight:800;unicode-bidi:plaintext;font-variant-numeric:tabular-nums;color:#ffd166;line-height:1.1}
    .zf-kv{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--line);font-size:14px;color:var(--text-dim);text-align:start}
    .zf-kv b{color:var(--text);direction:ltr;font-variant-numeric:tabular-nums}
    .zf-f{font:12.5px var(--mono);color:var(--muted);unicode-bidi:plaintext;margin:4px 0 8px}
    .rm-pop{animation:rmPop .4s cubic-bezier(.16,1,.3,1)}
    @keyframes rmPop{0%{transform:scale(1)}40%{transform:scale(1.08)}100%{transform:scale(1)}}
    @media(max-width:520px){.rc-card::before{width:78px;height:78px;top:-40px;inset-inline-end:-30px;box-shadow:-14px 12px 0 0 rgba(255,209,102,.85)}.rc-u{min-width:64px}.rc-u b{font-size:30px}.rc-digits{gap:6px}.zf-row label{min-width:100%}}
    @media (prefers-reduced-motion:reduce){.rc-card::before,.rc-stars,.rm-flip,.rm-pop,.zf-p{animation:none}}
  </style>
"""
def related(title, links):
    return ('  <div class="section related-section">\n    <h2 class="related-title">%s</h2>\n    <div class="related-grid">\n' % title
            + "".join('      <a href="%s">%s%s</a>\n' % (h, t, GO) for h, t in links) + "    </div>\n  </div>\n")
def hero(t, ar):
    return ('<div class="wrap">\n  <div class="breadcrumb"><a href="%s">%s</a> <span>/</span><span style="color:var(--text-dim)">%s</span></div>\n'
            '%s  <section class="hero compact">\n    <div class="hero-badges"><span class="badge">%s</span><span class="badge local">%s%s</span><span class="badge">%s</span></div>\n'
            '    <h1>%s</h1>\n    <p>%s</p>\n  </section>\n\n') % (t["home"], t["homeL"], t["crumb"], "<!--LANG-SWITCH-->\n" if ar else "", t["b"][0], LOCK, t["b"][1], t["b"][2], t["h1"], t["intro"])
def content(t):
    return ('  <div class="content">\n    <h2>%s</h2>\n    <ul class="benefits">\n%s    </ul>\n    <h2>%s</h2>\n%s  </div>\n\n'
            % (t["howT"], "".join("      <li><span>%s</span></li>\n" % h for h in t["how"]), t["faqT"],
               "".join('    <details class="faq-item"><summary>%s</summary><p>%s</p></details>\n' % (q, a) for q, a in t["faq"])))

C = {
 "en": dict(home="/", homeL="Home", crumb="Ramadan Countdown", b=("Ramadan", "Runs in your browser", "Free"),
   h1="Ramadan Countdown — Days Until Ramadan, Iftar &amp; Suhoor Timer",
   intro="How many days until Ramadan? A live countdown to the start of Ramadan for your city, and during Ramadan a second-by-second timer to iftar (Maghrib) and to the end of suhoor (Fajr), with today's fasting hours.",
   city="City", units=("Days", "Hours", "Min", "Sec"), share="Share the countdown",
   info=("Ramadan starts (expected)", "Eid al-Fitr (expected)", "Imsak today", "Fajr today", "Maghrib (iftar) today", "Fasting hours today"),
   note="Dates follow the Umm al-Qura calendar. The actual start of Ramadan and Eid is announced after the moon sighting and can differ by a day in your country.",
   howT="How the countdown works",
   how=["Before Ramadan it counts down to the start of 1 Ramadan in your city's time zone (Umm al-Qura calendar).",
        "During Ramadan it switches automatically: to <strong>iftar</strong> (Maghrib) during the day and to the <strong>end of suhoor</strong> (Fajr) at night.",
        "Prayer times use each city's official method (Umm al-Qura for Saudi Arabia, Egyptian authority for Egypt, and so on)."],
   faqT="Frequently asked questions",
   faq=[("When does Ramadan 2027 start?", "On the Umm al-Qura calendar, 1 Ramadan 1448 AH falls on Monday 8 February 2027, so the first tarawih is on the evening of 7 February. The official start depends on the moon sighting."),
        ("When is iftar today?", "Iftar is at Maghrib. Pick your city and the page shows today's Maghrib time and a live countdown to it during Ramadan."),
        ("When does suhoor end?", "Suhoor ends at Fajr. Many timetables show imsak about 10 minutes earlier as a precaution."),
        ("Is my location sent anywhere?", "No. You choose a city from the list and everything is calculated in your browser.")],
   rel="More for Ramadan", links=[("/ramadan-timetable", "Ramadan Timetable"), ("/zakat-al-fitr-calculator", "Zakat al-Fitr Calculator"), ("/prayer-times", "Prayer Times"), ("/qibla-direction", "Qibla Direction")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="كم باقي على رمضان", b=("رمضان", "تعمل داخل متصفحك", "مجانية"),
   h1="كم باقي على رمضان؟ عداد رمضان والإفطار والسحور",
   intro="عدّاد تنازلي مباشر لبداية شهر رمضان في مدينتك، وفي رمضان يتحول تلقائيًا إلى عداد ثانية بثانية لموعد الإفطار (أذان المغرب) ونهاية السحور (أذان الفجر)، مع عدد ساعات الصيام اليوم.",
   city="المدينة", units=("يوم", "ساعة", "دقيقة", "ثانية"), share="شارك العدّاد",
   info=("بداية رمضان (المتوقعة)", "عيد الفطر (المتوقع)", "الإمساك اليوم", "الفجر اليوم", "المغرب (الإفطار) اليوم", "ساعات الصيام اليوم"),
   note="التواريخ حسب تقويم أم القرى، والبداية الفعلية لرمضان والعيد تُعلن بعد تحري الهلال وقد تختلف يومًا في بلدك.",
   howT="كيف يعمل العداد؟",
   how=["قبل رمضان يعدّ تنازليًا حتى ليلة 1 رمضان بتوقيت مدينتك حسب تقويم أم القرى.",
        "في رمضان يتحول تلقائيًا: إلى <strong>الإفطار</strong> (المغرب) في النهار، وإلى <strong>نهاية السحور</strong> (الفجر) في الليل.",
        "المواقيت محسوبة بالطريقة الرسمية لكل مدينة (أم القرى للسعودية، الهيئة المصرية لمصر، وهكذا)."],
   faqT="أسئلة شائعة",
   faq=[("متى رمضان 2027؟", "حسب تقويم أم القرى يوافق 1 رمضان 1448 هـ يوم الاثنين 8 فبراير 2027، فتكون أول تراويح مساء الأحد 7 فبراير. الموعد الرسمي يُعلن بعد تحري الهلال."),
        ("كم باقي على الفطور اليوم؟", "اختر مدينتك وسيظهر وقت أذان المغرب اليوم، وفي رمضان يظهر عداد مباشر حتى الإفطار."),
        ("متى ينتهي السحور؟", "ينتهي السحور بأذان الفجر، وتعرض الإمساكيات وقت الإمساك قبله بنحو 10 دقائق احتياطًا."),
        ("هل يُرسل موقعي؟", "لا. تختار مدينتك من القائمة وكل الحسابات تتم في متصفحك.")],
   rel="المزيد لرمضان", links=[("/ar/guides/ramadan-2027-date", "متى رمضان 2027؟ التواريخ وساعات الصيام"), ("/ar/ramadan-imsakiya", "إمساكية رمضان"), ("/ar/zakat-al-fitr-calculator", "حساب زكاة الفطر"), ("/ar/prayer-times", "مواقيت الصلاة"), ("/ar/qibla-direction", "اتجاه القبلة")]),
}
def countdown_body(L, ar):
    t = C[L]; u = t["units"]; i = t["info"]
    s = hero(t, ar)
    s += ('  <div class="tool-panel" id="tool">\n    <div class="rc-card" id="rcCard" aria-live="polite">\n      <div class="rc-stars" aria-hidden="true"></div>\n'
          '      <div class="rc-top"><label for="rcCity">%s</label><select id="rcCity"></select></div>\n'
          '      <div class="rc-label" id="rcLabel">…</div>\n'
          '      <div class="rc-digits"><div class="rc-u" id="rcDBox"><b id="rcD">0</b><span>%s</span></div><div class="rc-u"><b id="rcH">00</b><span>%s</span></div><div class="rc-u"><b id="rcM">00</b><span>%s</span></div><div class="rc-u"><b id="rcS">00</b><span>%s</span></div></div>\n'
          '      <div class="rc-bar" id="rcBar" hidden><div class="rc-bar-track"><div class="rc-bar-fill" id="rcBarFill"></div></div><div class="rc-bar-txt" id="rcBarTxt"></div></div>\n'
          '      <div class="rc-today" id="rcToday"></div>\n'
          '      <div class="rc-actions"><button type="button" class="btn" id="rcShare">%s</button></div>\n      <div id="rcStatus" class="result" aria-live="polite"></div>\n    </div>\n'
          '    <div class="rc-info">\n      <div class="rc-i"><span>%s</span><b id="rcStart">—</b></div>\n      <div class="rc-i"><span>%s</span><b id="rcEid">—</b></div>\n'
          '      <div class="rc-i"><span>%s</span><b class="ltr" id="rcImsak">—</b></div>\n      <div class="rc-i"><span>%s</span><b class="ltr" id="rcFajr">—</b></div>\n'
          '      <div class="rc-i"><span>%s</span><b class="ltr" id="rcMaghrib">—</b></div>\n      <div class="rc-i"><span>%s</span><b id="rcFast">—</b></div>\n    </div>\n'
          '    <p class="rc-note">%s <a id="rcLink" href="%s">…</a></p>\n  </div>\n'
          '  <script src="/hijri.js"></script>\n  <script src="/prayer-cities.js"></script>\n  <script src="/prayer-times.js"></script>\n  <script src="/ramadan.js"></script>\n\n'
          ) % (t["city"], u[0], u[1], u[2], u[3], t["share"], i[0], i[1], i[2], i[3], i[4], i[5], t["note"], "/ar/prayer-times" if ar else "/prayer-times")
    return s + content(t) + related(t["rel"], t["links"]) + "</div>\n"

Z = {
 "en": dict(home="/", homeL="Home", crumb="Zakat al-Fitr Calculator", b=("Ramadan", "Runs in your browser", "Free"),
   h1="Zakat al-Fitr Calculator — Fitrana for Your Family (kg &amp; cash)",
   intro="Work out zakat al-fitr (fitrana) for everyone you support: the amount of staple food in kilograms, its value at your local price, or the official cash amount per person announced in your country. Includes a fidya calculator for missed fasts.",
   fT="Zakat al-fitr", persons="People in your household", kg="Food per person (kg)", price="Price of 1 kg of staple food", cash="Official cash amount per person (optional)",
   rT="Your zakat al-fitr", rKg="Food to give", rCash="Value at your price", rOff="Using the official amount",
   dT="Fidya for missed fasts", days="Days not fasted", meal="Cost of one meal", rFid="Fidya to give",
   note="Amounts are estimates. The sa' is measured by volume, so its weight depends on the food; follow the figures your local fatwa authority publishes each year.",
   howT="How zakat al-fitr is calculated",
   how=["Zakat al-fitr is <strong>one sa' of staple food</strong> (rice, wheat, dates…) for each person you support, including children.",
        "The sa' is usually estimated at <strong>about 2.5 to 3 kg</strong> depending on the food and the scholarly body.",
        "Many countries announce an <strong>official cash amount per person</strong> each Ramadan for those who give money.",
        "It should be given before the Eid prayer; many give it in the last days of Ramadan."],
   faqT="Frequently asked questions",
   faq=[("How much is zakat al-fitr per person?", "One sa' of staple food — about 2.5 to 3 kg. If you give cash, use the amount your country's official body announces for this year."),
        ("Who do I pay zakat al-fitr for?", "For yourself and everyone you are responsible for supporting, such as your spouse and children, if you have food beyond your needs for the day of Eid."),
        ("When is the deadline?", "Before the Eid al-Fitr prayer. Giving it a day or two before Eid is widely accepted."),
        ("What is fidya?", "For someone who can't fast and won't be able to make the days up (e.g. chronic illness or old age), fidya is feeding one poor person for each day missed. Enter the days and the cost of a meal.")],
   rel="More for Ramadan", links=[("/ramadan-countdown", "Ramadan Countdown"), ("/ramadan-timetable", "Ramadan Timetable"), ("/prayer-times", "Prayer Times"), ("/percentage-calculator", "Percentage Calculator")]),
 "ar": dict(home="/ar", homeL="الرئيسية", crumb="حساب زكاة الفطر", b=("رمضان", "تعمل داخل متصفحك", "مجانية"),
   h1="حساب زكاة الفطر لك ولأسرتك — بالكيلو والقيمة النقدية",
   intro="احسب زكاة الفطر عن كل من تعولهم: كمية الطعام بالكيلوغرام، وقيمتها بسعر بلدك، أو المبلغ النقدي الرسمي للفرد الذي تعلنه الجهات المختصة في بلدك. ومعها حاسبة فدية الصيام.",
   fT="زكاة الفطر", persons="عدد أفراد الأسرة", kg="مقدار الطعام للفرد (كغ)", price="سعر الكيلو من قوت البلد", cash="المبلغ النقدي الرسمي للفرد (اختياري)",
   rT="زكاة الفطر عن أسرتك", rKg="كمية الطعام", rCash="قيمتها بسعرك", rOff="بالمبلغ الرسمي",
   dT="فدية الصيام", days="عدد الأيام", meal="تكلفة إطعام مسكين ليوم", rFid="الفدية",
   note="المقادير تقريبية؛ الصاع مكيال حجم فيختلف وزنه باختلاف الطعام. اتبع ما تعلنه جهة الفتوى في بلدك كل عام.",
   howT="طريقة حساب زكاة الفطر",
   how=["زكاة الفطر <strong>صاع من قوت البلد</strong> (أرز، قمح، تمر…) عن كل فرد تعوله، صغيرًا كان أو كبيرًا.",
        "يُقدَّر الصاع غالبًا بـ<strong>نحو 2.5 إلى 3 كيلوغرامات</strong> بحسب نوع الطعام والجهة المُفتية.",
        "تعلن جهات رسمية في كثير من الدول <strong>قيمة نقدية للفرد</strong> كل رمضان لمن يخرجها نقدًا.",
        "وقت إخراجها قبل صلاة العيد، ويجوز تقديمها بيوم أو يومين."],
   faqT="أسئلة شائعة",
   faq=[("كم مقدار زكاة الفطر للشخص الواحد؟", "صاع من قوت البلد، ويقدّر بنحو 2.5 إلى 3 كغ. ومن يخرجها نقدًا يعتمد المبلغ الذي تعلنه الجهة الرسمية في بلده لهذا العام."),
        ("عن من أُخرج زكاة الفطر؟", "عن نفسك وعن كل من تلزمك نفقته كالزوجة والأولاد، إذا كان عندك ما يزيد عن قوت يوم العيد وليلته."),
        ("متى آخر وقت لإخراج زكاة الفطر؟", "قبل صلاة عيد الفطر، ويجوز إخراجها قبل العيد بيوم أو يومين."),
        ("ما هي فدية الصيام؟", "لمن لا يستطيع الصيام ولا يُرجى قضاؤه كالمريض مرضًا مزمنًا والكبير في السن: إطعام مسكين عن كل يوم. أدخل عدد الأيام وتكلفة الوجبة.")],
   rel="المزيد لرمضان", links=[("/ar/guides/zakat-al-fitr-amount", "شرح: مقدار زكاة الفطر بالكيلو"), ("/ar/ramadan-countdown", "كم باقي على رمضان"), ("/ar/ramadan-imsakiya", "إمساكية رمضان"), ("/ar/zakat-calculator", "حاسبة زكاة المال"), ("/ar/prayer-times", "مواقيت الصلاة")]),
}
def fitr_body(L, ar):
    t = Z[L]
    kgu = "كغ" if ar else "kg"
    s = hero(t, ar)
    s += ('  <div class="tool-panel" id="tool">\n    <div class="zf-grid">\n      <div>\n        <div class="zf-card">\n          <h2>%s</h2>\n'
          '          <div class="zf-row"><label for="zfPersons">%s</label><span class="zf-step"><button type="button" id="zfMinus" aria-label="−">−</button><input type="text" inputmode="numeric" id="zfPersons" value="5"><button type="button" id="zfPlus" aria-label="+">+</button></span></div>\n'
          '          <div id="zfPeople" aria-hidden="true"></div>\n'
          '          <div class="zf-row"><label for="zfKg">%s</label><input type="text" inputmode="decimal" id="zfKg" value="3"><span id="zfKgChips"><button type="button" class="chip" data-kg="2.5">2.5 %s</button><button type="button" class="chip" data-kg="3">3 %s</button></span></div>\n'
          '          <div class="zf-row"><label for="zfPrice">%s</label><input type="text" inputmode="decimal" id="zfPrice" placeholder="%s"></div>\n'
          '          <div class="zf-row"><label for="zfCash">%s</label><input type="text" inputmode="decimal" id="zfCash" placeholder="—"></div>\n'
          '        </div>\n'
          '        <div class="zf-card" style="margin-top:14px">\n          <h2>%s</h2>\n'
          '          <div class="zf-row"><label for="fdDays">%s</label><input type="text" inputmode="numeric" id="fdDays" placeholder="%s"></div>\n'
          '          <div class="zf-row"><label for="fdMeal">%s</label><input type="text" inputmode="decimal" id="fdMeal" placeholder="%s"></div>\n'
          '          <div class="zf-kv"><span>%s</span><b id="fdOut">—</b></div><div class="zf-f" id="fdF"></div>\n'
          '        </div>\n      </div>\n'
          '      <div class="zf-card zf-res" aria-live="polite">\n        <h2>%s</h2>\n        <div class="zf-big" id="zfKgOut">—</div>\n        <div class="zf-f" id="zfWho"></div>\n'
          '        <div class="zf-kv"><span>%s</span><b id="zfCashOut">—</b></div>\n        <div class="zf-kv"><span>%s</span><b id="zfOfficial">—</b></div>\n'
          '        <p class="rc-note">%s</p>\n      </div>\n    </div>\n  </div>\n  <script src="/ramadan.js"></script>\n\n'
          ) % (t["fT"], t["persons"], t["kg"], kgu, kgu, t["price"], ("مثال: 8" if ar else "e.g. 8"), t["cash"], t["dT"], t["days"], ("مثال: 10" if ar else "e.g. 10"), t["meal"], ("مثال: 15" if ar else "e.g. 15"), t["rFid"], t["rT"], t["rCash"], t["rOff"], t["note"])
    return s + content(t) + related(t["rel"], t["links"]) + "</div>\n"

def w(name, text): io.open(os.path.join(here, name), "w", encoding="utf-8", newline="\n").write(text)
w("rm_style.html", STYLE)
w("rm_count_en.html", countdown_body("en", False)); w("rm_count_ar.html", countdown_body("ar", True))
w("rm_fitr_en.html", fitr_body("en", False)); w("rm_fitr_ar.html", fitr_body("ar", True))
print("bodies written")
