# Generates landing specs for city prayer-time pages (+ Ramadan and Qibla intents). Feed outputs to tools/landing.py.
import json, io, os, math, re
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, "..", "..")
src = io.open(os.path.join(root, "prayer-cities.js"), encoding="utf-8").read()
cities = [dict(re.findall(r'(\w+): ("[^"]*"|-?[\d.]+)', m)) for m in re.findall(r"\{([^{}]+)\}", src.split("[", 1)[1])]
for c in cities:
    for k, v in list(c.items()): c[k] = v.strip('"') if v.startswith('"') else float(v)
MN = {"makkah": ("Umm al-Qura", "أم القرى"), "mwl": ("Muslim World League", "رابطة العالم الإسلامي"), "egypt": ("Egyptian General Authority of Survey", "الهيئة المصرية العامة للمساحة"),
      "karachi": ("University of Islamic Sciences, Karachi", "جامعة العلوم الإسلامية بكراتشي"), "isna": ("ISNA", "الجمعية الإسلامية لأمريكا الشمالية"), "dubai": ("UAE (Dubai)", "الإمارات"),
      "kuwait": ("Kuwait", "الكويت"), "qatar": ("Qatar", "قطر"), "jordan": ("Jordan Ministry of Awqaf", "وزارة الأوقاف الأردنية"), "turkey": ("Diyanet", "رئاسة الشؤون الدينية التركية"),
      "morocco": ("Morocco Ministry of Habous", "وزارة الأوقاف المغربية"), "algeria": ("Algeria", "الجزائر"), "tunisia": ("Tunisia", "تونس"), "singapore": ("MUIS / JAKIM", "سنغافورة وماليزيا"), "france": ("UOIF", "اتحاد المنظمات الإسلامية بفرنسا")}
K = (21.4225, 39.8262)
def qibla(lat, lng):
    p1, p2, dl = math.radians(lat), math.radians(K[0]), math.radians(K[1] - lng)
    return (math.degrees(math.atan2(math.sin(dl), math.cos(p1) * math.tan(p2) - math.sin(p1) * math.cos(dl))) + 360) % 360
def km(lat, lng):
    p1, p2 = math.radians(lat), math.radians(K[0]); dp, dl = p2 - p1, math.radians(K[1] - lng)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 6371 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
EN_SET = {"mecca", "medina", "riyadh", "jeddah", "dubai", "abu-dhabi", "doha", "kuwait-city", "amman", "cairo", "istanbul", "london", "paris", "berlin", "new-york", "toronto", "jakarta", "kuala-lumpur", "karachi", "lahore", "dhaka", "casablanca", "jerusalem", "muscat"}
ar, en = [], []
for c in cities:
    q, d = qibla(c["lat"], c["lng"]), km(c["lat"], c["lng"])
    men, mar = MN[c["method"]]
    in_mecca = c["slug"] == "mecca"
    ar_p = {"base": "ar/prayer-times", "slug": "ar/prayer-times/" + c["slug"], "preset": {"city": c["slug"]}, "crumb": "مواقيت الصلاة في " + c["ar"],
        "title": "مواقيت الصلاة في %s اليوم — أذان الفجر والمغرب وإمساكية رمضان | QuickTiny" % c["ar"],
        "desc": "مواقيت الصلاة في %s (%s) اليوم: الفجر والشروق والظهر والعصر والمغرب والعشاء بطريقة %s، مع العد التنازلي للأذان واتجاه القبلة والجدول الشهري وإمساكية رمضان." % (c["ar"], c["cAr"], mar),
        "h1": "مواقيت الصلاة في %s اليوم" % c["ar"],
        "intro": "أوقات الصلاة في %s، %s لهذا اليوم مع الوقت المتبقي على الأذان القادم. محسوبة بطريقة %s المعتمدة في %s، ويمكنك تغيير الطريقة أو مذهب العصر من الإعدادات." % (c["ar"], c["cAr"], mar, c["cAr"]),
        "about": "<h2>معلومات عن %s</h2><ul class='benefits'><li><span>الإحداثيات: %.4f، %.4f</span></li><li><span>طريقة الحساب: %s</span></li>%s</ul><p>تجد أسفل الصفحة الجدول الشهري لمواقيت الصلاة في %s وإمساكية رمضان قابلة للطباعة.</p>" % (
            c["ar"], c["lat"], c["lng"], mar, "" if in_mecca else "<li><span>اتجاه القبلة: %.1f° من الشمال الحقيقي — والمسافة إلى الكعبة نحو %s كم</span></li>" % (q, format(round(d), ",")), c["ar"]),
        "faq": [["ما طريقة حساب مواقيت الصلاة في %s؟" % c["ar"], "نستخدم طريقة %s المعتمدة في %s، ويمكنك تغييرها من الإعدادات." % (mar, c["cAr"])],
                ["كم وقت الإمساك في رمضان في %s؟" % c["ar"], "الإمساك قبل أذان الفجر بعشر دقائق، وتجده لكل أيام الشهر في الإمساكية أسفل الصفحة."]]}
    if c["slug"] in EN_SET: ar_p["alts"] = {"en": "prayer-times/" + c["slug"]}
    ar.append(ar_p)
    if c["slug"] in EN_SET:
        en.append({"base": "prayer-times", "slug": "prayer-times/" + c["slug"], "preset": {"city": c["slug"]}, "crumb": "Prayer Times in " + c["en"],
            "title": "Prayer Times in %s Today — Fajr, Maghrib, Isha & Ramadan Timetable | QuickTiny" % c["en"],
            "desc": "Today's prayer times in %s, %s: Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha (%s method), with next-prayer countdown, Qibla direction, monthly and Ramadan timetables." % (c["en"], c["cEn"], men),
            "h1": "Prayer Times in %s Today" % c["en"],
            "intro": "Salah times for %s, %s today with a live countdown to the next adhan. Calculated with the %s method used locally — you can change the method or Asr calculation in the settings." % (c["en"], c["cEn"], men),
            "about": "<h2>About %s</h2><ul class='benefits'><li><span>Coordinates: %.4f, %.4f</span></li><li><span>Method: %s</span></li>%s</ul><p>The monthly timetable and a printable Ramadan timetable for %s are further down the page.</p>" % (
                c["en"], c["lat"], c["lng"], men, "" if in_mecca else "<li><span>Qibla direction: %.1f° from true north — about %s km to the Kaaba</span></li>" % (q, format(round(d), ",")), c["en"]),
            "faq": [["Which method is used for %s?" % c["en"], "The %s method, which is standard in %s. You can switch methods in the settings." % (men, c["cEn"])]],
            "alts": {"ar": "ar/prayer-times/" + c["slug"]}})
extra_ar = [
 {"base": "ar/prayer-times", "slug": "ar/ramadan-imsakiya", "preset": {"tab": "ramadan"}, "crumb": "إمساكية رمضان",
  "title": "إمساكية رمضان 1448 — مواعيد الإمساك والإفطار لمدينتك | QuickTiny", "desc": "إمساكية رمضان 1448 هـ لمدينتك: وقت الإمساك والفجر والمغرب (الإفطار) والعشاء لكل أيام الشهر، قابلة للطباعة، مع العد التنازلي لرمضان والعيد.",
  "h1": "إمساكية رمضان 1448 هـ لمدينتك", "intro": "اختر مدينتك لتحصل على إمساكية رمضان كاملة: الإمساك والفجر والظهر والعصر والمغرب (موعد الإفطار) والعشاء لكل يوم من أيام الشهر — واطبعها أو احفظها PDF. ونعرض لك كم يومًا بقي على رمضان وعيد الفطر.",
  "about": "<h2>عن الإمساكية</h2><ul class='benefits'><li><span>بداية الشهر حسب تقويم أم القرى، وقد يختلف يومًا حسب رؤية الهلال في بلدك.</span></li><li><span>الإمساك قبل الفجر بعشر دقائق.</span></li><li><span>في طريقة أم القرى يكون العشاء بعد المغرب بساعتين في رمضان.</span></li></ul>",
  "faq": [["متى يبدأ رمضان 1448؟", "حسب تقويم أم القرى يبدأ تقريبًا في 8 فبراير 2027، والإعلان الرسمي يعتمد على رؤية الهلال."]], "alts": {"en": "ramadan-timetable"}},
 {"base": "ar/prayer-times", "slug": "ar/qibla-direction", "preset": {}, "crumb": "اتجاه القبلة",
  "title": "اتجاه القبلة من موقعي — بالدرجات والبوصلة | QuickTiny", "desc": "اعرف اتجاه القبلة من موقعك الحالي أو مدينتك بالدرجات من الشمال، والمسافة إلى الكعبة المشرفة، مع مواقيت الصلاة. مجاني وبدون تطبيق.",
  "h1": "اتجاه القبلة من موقعك", "intro": "اضغط «استخدم موقعي» أو اختر مدينتك لتعرف اتجاه القبلة بالدرجات من الشمال الحقيقي والمسافة إلى الكعبة. استخدم بوصلة جوالك ووجّه نفسك نحو الدرجة المعروضة.",
  "about": "<h2>كيف أستخدم الدرجة؟</h2><ul class='benefits'><li><span>افتح بوصلة الجوال وقف حتى تشير إلى الدرجة المعروضة.</span></li><li><span>ابتعد عن المعادن والأجهزة الكهربائية لأنها تؤثر على البوصلة.</span></li><li><span>الاتجاه محسوب بأقصر طريق على سطح الأرض (الدائرة العظمى).</span></li></ul>",
  "faq": [["كيف أعرف اتجاه القبلة بدون بوصلة؟", "عند تعامد الشمس على الكعبة (حوالي 28 مايو و16 يوليو الساعة 12:18 بتوقيت مكة) يكون ظل أي عمود عكس اتجاه القبلة."]], "alts": {"en": "qibla-direction"}}]
extra_en = [
 {"base": "prayer-times", "slug": "ramadan-timetable", "preset": {"tab": "ramadan"}, "crumb": "Ramadan Timetable",
  "title": "Ramadan Timetable 2027 (1448) — Suhoor &amp; Iftar Times for Your City | QuickTiny", "desc": "Printable Ramadan 2027 timetable for your city: Imsak (suhoor ends), Fajr, Iftar (Maghrib) and Isha for every day of the month, plus a countdown to Ramadan and Eid.",
  "h1": "Ramadan Timetable 2027 (1448 AH)", "intro": "Pick your city to get the full Ramadan timetable — Imsak, Fajr, Dhuhr, Asr, Iftar (Maghrib) and Isha for every day — and print it or save it as PDF. You'll also see how many days are left until Ramadan and Eid al-Fitr.",
  "about": "<h2>Good to know</h2><ul class='benefits'><li><span>Ramadan 1448 is expected to start around 8 February 2027 (Umm al-Qura); local moon sighting may shift it by a day.</span></li><li><span>Imsak is 10 minutes before Fajr.</span></li></ul>",
  "faq": [["When does Ramadan 2027 start?", "Around 8 February 2027 according to the Umm al-Qura calendar; the official start depends on the moon sighting in your country."]], "alts": {"ar": "ar/ramadan-imsakiya"}},
 {"base": "prayer-times", "slug": "qibla-direction", "preset": {}, "crumb": "Qibla Direction",
  "title": "Qibla Direction — Find the Qibla From Your Location | QuickTiny", "desc": "Find the Qibla direction from your current location or city in degrees from north, plus the distance to the Kaaba and today's prayer times. Free, no app needed.",
  "h1": "Qibla Direction From Your Location", "intro": "Tap “Use my location” or pick your city to see the Qibla direction in degrees from true north and the distance to the Kaaba. Turn until your phone's compass shows that number.",
  "about": "<h2>Tips</h2><ul class='benefits'><li><span>Hold the phone flat and away from metal or electronics.</span></li><li><span>The direction follows the shortest path on the globe (great circle) — from North America it points north-east.</span></li></ul>",
  "faq": [["Why does the Qibla from America point north-east?", "Because the shortest route on a globe isn't a straight line on a flat map."]], "alts": {"ar": "ar/qibla-direction"}}]
io.open(os.path.join(here, "landing_prayer_ar.json"), "w", encoding="utf-8").write(json.dumps(ar + extra_ar, ensure_ascii=False, indent=1))
io.open(os.path.join(here, "landing_prayer_en.json"), "w", encoding="utf-8").write(json.dumps(en + extra_en, ensure_ascii=False, indent=1))
print(len(ar) + len(extra_ar), "AR +", len(en) + len(extra_en), "EN specs")
