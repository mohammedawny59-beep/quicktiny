# Guide articles (EN + AR). Each: slug, lang, title (SEO), h1, lede, desc, tool (url, label), body (HTML), faq [(q, a)], date.
# Numbers in examples were produced by the site's own calculators (ar-calcs.js, life-calcs.js) so they match the tools.
DATE = "2026-11-10"
GUIDES = [
# ---------------------------------------------------------------- Arabic
dict(slug="heic-to-jpg-windows-android", lang="ar",
 title="كيف أحول صور الآيفون HEIC إلى JPG على ويندوز وأندرويد — 3 طرق مجانية | QuickTiny",
 h1="كيف تحوّل صور الآيفون HEIC إلى JPG على ويندوز وأندرويد",
 lede="صورة من الآيفون لا تفتح على اللابتوب أو ترفضها منصة حكومية؟ السبب صيغة HEIC. هذه أسهل ثلاث طرق لتحويلها إلى JPG مجانًا، مع الطريقة التي تمنع المشكلة من الأساس.",
 desc="شرح خطوة بخطوة لتحويل صور HEIC من الآيفون إلى JPG على ويندوز وأندرويد مجانًا وبدون برامج، ولماذا تظهر هذه الصيغة، وكيف تجعل الآيفون يحفظ الصور JPG مباشرة.",
 tool=("/ar/heic-to-jpg", "حوّل صورك من HEIC إلى JPG الآن"),
 body="""<h2>لماذا تظهر صورك بصيغة HEIC؟</h2>
<p>منذ iOS 11 يحفظ الآيفون الصور بصيغة HEIC (أو HEIF) لأنها أصغر بنحو النصف من JPG بنفس الجودة. المشكلة أن كثيرًا من برامج ويندوز وأجهزة أندرويد القديمة ومواقع التقديم لا تفتحها، فتظهر لك الصورة كملف غريب أو ترفض المنصة رفعها.</p>
<h2>الطريقة 1: من المتصفح مباشرة (الأسرع، بدون برامج)</h2>
<ol><li>انقل الصور من الآيفون إلى الكمبيوتر أو الجوال (كابل، AirDrop، أو واتساب كـ«مستند» حتى لا تُضغط).</li>
<li>افتح <a href="/ar/heic-to-jpg">أداة تحويل HEIC إلى JPG</a> واسحب الصور إليها — تقدر تسحب عشرات الصور مرة واحدة.</li>
<li>اترك الجودة على 88% (لا فرق مرئي عن الأصل) واضغط تنزيل، أو نزّل الكل في ملف ZIP.</li></ol>
<p>التحويل يتم داخل متصفحك، فالصور لا تُرفع لأي خادم — مهم لصور الهويات والمستندات. وكبونص: الصور الناتجة بدون بيانات الموقع الجغرافي (GPS).</p>
<h2>الطريقة 2: تطبيق الصور في ويندوز</h2>
<p>في ويندوز 10 و11 يمكن تثبيت «HEIF Image Extensions» من متجر مايكروسوفت، ثم فتح الصورة في تطبيق الصور واختيار «حفظ باسم» بصيغة JPG. تعمل جيدًا لصورة أو صورتين، لكنها بطيئة مع عدد كبير.</p>
<h2>الطريقة 3: اجعل الآيفون يرسل JPG تلقائيًا</h2>
<ul><li><strong>للصور الجديدة:</strong> الإعدادات ← الكاميرا ← التنسيقات ← «الأكثر توافقًا». من الآن ستُحفظ الصور JPG.</li>
<li><strong>عند النقل للكمبيوتر:</strong> الإعدادات ← الصور ← «النقل إلى Mac أو PC» ← «تلقائي»، فيحوّلها الآيفون أثناء النقل بالكابل.</li></ul>
<p>هذه الإعدادات لا تحوّل الصور القديمة الموجودة أصلًا — لها استخدم الطريقة الأولى.</p>
<h2>هل يقل وضوح الصورة بعد التحويل؟</h2>
<p>بجودة 85–92% لا يظهر أي فرق للعين. الملف الناتج يكون أكبر قليلًا من HEIC الأصلي لأن JPG أقل كفاءة في الضغط، وهذا طبيعي. إذا كانت المنصة تشترط حجمًا معينًا، استخدم بعدها <a href="/ar/compress-image-to-kb">تصغير الصورة لحجم معين</a>.</p>""",
 faq=[("هل تحويل HEIC إلى JPG مجاني؟", "نعم، أداة QuickTiny مجانية بالكامل وبدون تسجيل أو علامة مائية، وتعمل على ويندوز وأندرويد والماك."),
      ("هل يمكن تحويل صور Live Photos؟", "تُحوّل الصورة الثابتة فقط؛ الجزء المتحرك من Live Photo ملف فيديو منفصل."),
      ("لماذا ترفض المنصة صورتي رغم أنها JPG؟", "غالبًا بسبب الحجم أو الأبعاد؛ صغّرها إلى الحجم المطلوب بأداة تصغير الصورة لحجم معين.")]),

dict(slug="reduce-image-size-100kb", lang="ar",
 title="كيف أصغر حجم الصورة إلى 100 كيلوبايت للتقديم على الوظائف والجامعات | QuickTiny",
 h1="كيف تصغّر حجم الصورة إلى 100 كيلوبايت (أو أقل) للتقديم",
 lede="«يجب ألا يتجاوز حجم الصورة 100 كيلوبايت» — شرط يظهر في منصات التوظيف والجامعات والتأشيرات. هذه الطريقة الصحيحة لتصغير الصورة دون أن تفقد وضوحها، وما الفرق بين الحجم والأبعاد.",
 desc="طريقة تصغير حجم الصورة إلى 100 أو 200 أو 50 كيلوبايت لمنصات التوظيف والجامعات والتأشيرات بدون فقدان الوضوح، والفرق بين حجم الملف وأبعاد الصورة، وأخطاء شائعة.",
 tool=("/ar/compress-image-to-100kb", "صغّر صورتك إلى 100 كيلوبايت الآن"),
 body="""<h2>الحجم غير الأبعاد</h2>
<p><strong>حجم الملف</strong> يُقاس بالكيلوبايت (KB) أو الميجابايت (MB)، أما <strong>الأبعاد</strong> فبالبكسل (مثل 600×800). صورة الجوال المعتادة تكون 3–5 ميجابايت وأبعادها 4000×3000 بكسل تقريبًا، أي أكبر بثلاثين مرة من حد 100 كيلوبايت.</p>
<h2>الطريقة الصحيحة في 3 خطوات</h2>
<ol><li>افتح <a href="/ar/compress-image-to-kb">أداة تصغير الصورة لحجم معين</a> واختر الحجم المطلوب (100 KB مثلًا).</li>
<li>إذا اشترطت المنصة أبعادًا محددة (مثل 200×230 لصورة شخصية)، اكتبها في «أقصى عرض/ارتفاع».</li>
<li>اسحب الصورة ونزّل الناتج — تعرض لك الأداة الحجم النهائي والأبعاد والجودة.</li></ol>
<p>الأداة لا «تخمّن»: تبحث عن <strong>أعلى جودة ممكنة</strong> تحت الحد، ولا تصغّر الأبعاد إلا عند الحاجة. في تجربتنا على صورة جوال حجمها 3.6 ميجابايت كانت النتيجة 97.8 كيلوبايت بأبعاد 1210×907 وجودة 65% — واضحة تمامًا لصورة تقديم.</p>
<h2>لماذا يرفض النظام صورتي رغم أنها «100 كيلوبايت»؟</h2>
<p>بعض المنصات تحسب الكيلوبايت = 1024 بايت وأخرى = 1000. ملف حجمه 101,000 بايت قد يظهر لك «99 KB» ويُرفض. لذلك تعتبر الأداة 100 كيلوبايت = 100,000 بايت بالضبط، فيكون الملف تحت الحد بأي طريقة حساب.</p>
<h2>أحجام شائعة</h2>
<ul><li>صورة شخصية لمنصات التوظيف: <a href="/ar/compress-image-to-50kb">50 كيلوبايت</a> إلى <a href="/ar/compress-image-to-100kb">100 كيلوبايت</a>.</li>
<li>صور الهوية والتأشيرات: حتى <a href="/ar/compress-image-to-200kb">200 كيلوبايت</a> غالبًا.</li>
<li>التوقيع الممسوح: 10–30 كيلوبايت عادة.</li></ul>
<h2>أخطاء تجنّبها</h2>
<ul><li>لا تلتقط «لقطة شاشة» للصورة لتصغيرها — تفقد الجودة وتغيّر الأبعاد.</li>
<li>لا ترسل الصورة لنفسك على واتساب لتصغيرها — يضغطها بشكل عشوائي وقد تبقى فوق الحد.</li>
<li>صورة الآيفون بصيغة HEIC؟ <a href="/ar/heic-to-jpg">حوّلها إلى JPG</a> أولًا.</li></ul>""",
 faq=[("كيف أعرف حجم الصورة؟", "على ويندوز: زر الفأرة الأيمن ← خصائص. على الآيفون: في تطبيق الصور اسحب الصورة للأعلى. والأداة تعرض الحجم قبل وبعد."),
      ("هل تقل جودة الصورة كثيرًا؟", "لا، الأداة تختار أعلى جودة ضمن الحد، وتصغّر الأبعاد تدريجيًا فقط عند الحاجة."),
      ("هل تُرفع صورتي إلى الإنترنت؟", "لا، المعالجة كلها داخل متصفحك.")]),

dict(slug="gold-zakat-calculation", lang="ar",
 title="طريقة حساب زكاة الذهب عيار 21 و18 و24 بالأمثلة ونصاب الذهب | QuickTiny",
 h1="طريقة حساب زكاة الذهب بالأمثلة (عيار 24 و21 و18)",
 lede="متى تجب زكاة الذهب، وكيف تحوّل عيار 21 أو 18 إلى ذهب خالص، وكيف تحسب المبلغ بالضبط؟ شرح مبسط بأمثلة محسوبة، مع الإشارة لمسألة ذهب الزينة.",
 desc="شرح طريقة حساب زكاة الذهب: نصاب 85 غرامًا من الذهب الخالص، تحويل عيار 21 و18 إلى عيار 24، ضم النقود، وأمثلة محسوبة خطوة بخطوة، مع حكم ذهب الزينة.",
 tool=("/ar/zakat-calculator", "احسب زكاتك بالحاسبة"),
 body="""<h2>الشروط باختصار</h2>
<ul><li><strong>النصاب:</strong> 85 غرامًا من الذهب الخالص (عيار 24).</li>
<li><strong>الحول:</strong> أن يمرّ على المال سنة هجرية كاملة وهو في ملكك.</li>
<li><strong>المقدار:</strong> ربع العشر = 2.5% من القيمة.</li></ul>
<h2>تحويل العيار إلى ذهب خالص</h2>
<p>الذهب الخالص = الوزن بالغرام × العيار ÷ 24.</p>
<ul><li>100 غرام عيار 21 = 100 × 21 ÷ 24 = <strong>87.5 غرامًا خالصًا</strong>.</li>
<li>80 غرامًا عيار 18 = 80 × 18 ÷ 24 = <strong>60 غرامًا خالصًا</strong>.</li></ul>
<h2>مثال 1: ذهب ونقود</h2>
<p>عندك 100 غرام عيار 21 و5,000 ريال نقدًا، وسعر غرام عيار 24 اليوم 420 ريالًا:</p>
<ol><li>الذهب الخالص = 87.5 غرامًا، وقيمته 87.5 × 420 = 36,750 ريالًا.</li>
<li>المجموع مع النقود = 41,750 ريالًا.</li>
<li>النصاب = 85 × 420 = 35,700 ريال ← المال بلغ النصاب.</li>
<li>الزكاة = 41,750 × 2.5% = <strong>1,043.75 ريالًا</strong>.</li></ol>
<h2>مثال 2: ذهب أقل من النصاب</h2>
<p>80 غرامًا عيار 18 فقط = 60 غرامًا خالصًا بقيمة 25,200 ريال، والنصاب 35,700 ← <strong>لا زكاة فيه</strong> ما لم يُضم إليه مال آخر يكمل النصاب.</p>
<h2>ذهب الزينة (الحُلي)</h2>
<p>جمهور الفقهاء (المالكية والشافعية والحنابلة) لا يوجبون الزكاة في الحُلي المعدّ للاستعمال المباح، والحنفية وبعض المعاصرين يوجبونها. من أراد الاحتياط أخرجها. أما الذهب المدّخر أو المعدّ للتجارة ففيه الزكاة باتفاق.</p>
<h2>الحساب بالأداة</h2>
<p>في <a href="/ar/zakat-calculator">حاسبة الزكاة</a> أدخل سعر غرام الذهب اليوم ووزن ذهبك لكل عيار ونقودك وديونك الحالّة، فتحصل على المبلغ بالأرقام والحروف. الحساب تقديري؛ ارجع لأهل العلم في الحالات الخاصة.</p>""",
 faq=[("كم نصاب الذهب بالغرام؟", "85 غرامًا من الذهب الخالص، أي قرابة 97.1 غرامًا من عيار 21 أو 113.3 غرامًا من عيار 18."),
      ("هل أحسب الزكاة بسعر الشراء أم سعر اليوم؟", "بسعر يوم إخراج الزكاة (سعر البيع في السوق)، لا بسعر الشراء."),
      ("هل تُضم النقود إلى الذهب في النصاب؟", "نعم عند جمهور العلماء تُضم النقود والذهب والفضة وعروض التجارة لإكمال النصاب.")]),

dict(slug="saudi-end-of-service-calculation", lang="ar",
 title="طريقة حساب مكافأة نهاية الخدمة في السعودية بالأمثلة (استقالة وإنهاء) | QuickTiny",
 h1="طريقة حساب مكافأة نهاية الخدمة في نظام العمل السعودي — بالأمثلة",
 lede="كم تستحق إذا استقلت بعد 4 سنوات؟ وما الفرق إذا أنهى صاحب العمل العقد؟ شرح المادتين 84 و85 بأمثلة محسوبة على راتب 8,000 ريال.",
 desc="شرح طريقة حساب مكافأة نهاية الخدمة في السعودية وفق المادة 84 و85 و87 من نظام العمل: نصف شهر عن أول 5 سنوات وشهر عن كل سنة بعدها، وأثر الاستقالة، بأمثلة محسوبة.",
 tool=("/ar/end-of-service-calculator", "احسب مكافأتك بالحاسبة"),
 body="""<h2>القاعدة الأساسية (المادة 84)</h2>
<ul><li>أجر <strong>نصف شهر</strong> عن كل سنة من السنوات الخمس الأولى.</li>
<li>أجر <strong>شهر كامل</strong> عن كل سنة بعد الخامسة.</li>
<li>أجزاء السنة تُحسب بنسبتها، والأجر هو آخر أجر فعلي (الأساسي مع البدلات الثابتة) ما لم ينص العقد على غير ذلك.</li></ul>
<h2>عند الاستقالة (المادة 85)</h2>
<ul><li>أقل من سنتين: لا شيء.</li><li>من سنتين إلى أقل من 5 سنوات: <strong>ثلث</strong> المكافأة.</li>
<li>من 5 إلى أقل من 10 سنوات: <strong>ثلثا</strong> المكافأة.</li><li>10 سنوات فأكثر: المكافأة كاملة.</li></ul>
<h2>أمثلة على راتب 8,000 ريال</h2>
<table class="guide-table"><thead><tr><th>مدة الخدمة</th><th>سبب الانتهاء</th><th>المكافأة</th></tr></thead><tbody>
<tr><td>8 سنوات</td><td>انتهاء العقد / إنهاء من صاحب العمل</td><td>5 × 4,000 + 3 × 8,000 = <strong>44,000</strong></td></tr>
<tr><td>8 سنوات</td><td>استقالة</td><td>44,000 × ⅔ = <strong>29,333.33</strong></td></tr>
<tr><td>4 سنوات</td><td>استقالة</td><td>(4 × 4,000) × ⅓ = <strong>5,333.33</strong></td></tr>
<tr><td>12 سنة</td><td>استقالة</td><td>5 × 4,000 + 7 × 8,000 = <strong>76,000</strong> (كاملة)</td></tr></tbody></table>
<h2>حالات المكافأة الكاملة رغم ترك العمل (المادة 87)</h2>
<p>تستحق المكافأة كاملة إذا تُرك العمل بسبب قوة قاهرة، أو إذا استقالت العاملة خلال ستة أشهر من عقد الزواج أو ثلاثة أشهر من الوضع.</p>
<h2>متى تسقط المكافأة؟</h2>
<p>عند الفصل وفق المادة 80 (حالات الإخلال الجسيم المحددة نظامًا).</p>
<p>احسب حالتك بالأيام والأشهر الدقيقة في <a href="/ar/end-of-service-calculator">حاسبة نهاية الخدمة</a> — تعرض الخطوات والمبلغ بالحروف. النتيجة تقديرية؛ عند الخلاف ارجع لوزارة الموارد البشرية.</p>""",
 faq=[("هل تُحسب المكافأة على الراتب الأساسي أم الإجمالي؟", "في السعودية على آخر أجر فعلي (الأساسي مع البدلات الثابتة كالسكن والنقل) ما لم ينص العقد على غير ذلك."),
      ("استقلت قبل سنتين، هل أستحق شيئًا؟", "لا يستحق العامل المستقيل مكافأة إذا كانت خدمته أقل من سنتين، إلا في حالات المادة 87."),
      ("هل يختلف الحساب في الإمارات؟", "نعم: 21 يومًا من الأجر الأساسي عن أول 5 سنوات و30 يومًا بعدها بحد أقصى أجر سنتين — والحاسبة تدعم الإمارات أيضًا.")]),

dict(slug="vat-15-calculation", lang="ar",
 title="طريقة حساب ضريبة القيمة المضافة 15% واستخراجها من السعر الشامل | QuickTiny",
 h1="طريقة حساب ضريبة القيمة المضافة 15% — إضافتها واستخراجها",
 lede="كيف تضيف 15% على السعر، وكيف تستخرج الضريبة من مبلغ شامل بالطريقة الصحيحة؟ مع الخطأ الشائع الذي يقع فيه كثيرون، وأمثلة للإمارات (5%).",
 desc="شرح حساب ضريبة القيمة المضافة 15% في السعودية: إضافة الضريبة للسعر، واستخراج الضريبة من السعر الشامل بالقسمة على 1.15، والخطأ الشائع، مع أمثلة محسوبة.",
 tool=("/ar/vat-calculator", "احسب الضريبة بالحاسبة"),
 body="""<h2>إضافة الضريبة على السعر</h2>
<p>السعر شامل الضريبة = السعر × 1.15. مثال: منتج بـ250 ريالًا ← الضريبة 37.50 والإجمالي <strong>287.50 ريالًا</strong>.</p>
<h2>استخراج الضريبة من سعر شامل</h2>
<p>السعر قبل الضريبة = السعر الشامل ÷ 1.15، والضريبة = الشامل − ما قبل الضريبة. مثال: فاتورة بـ575 ريالًا شاملة ← 575 ÷ 1.15 = 500، والضريبة <strong>75 ريالًا</strong>.</p>
<h2>الخطأ الشائع</h2>
<p>ضرب السعر الشامل في 15% مباشرة: 575 × 15% = 86.25 — وهذا <strong>خطأ</strong> لأن الـ15% محسوبة على السعر قبل الضريبة لا بعده. الصحيح: الشامل × 15 ÷ 115 = 75.</p>
<h2>النسب في دول الخليج والمنطقة</h2>
<ul><li>السعودية 15%، الإمارات 5% (الشامل ÷ 1.05)، البحرين 10%، عُمان 5%.</li>
<li>الأردن 16% ضريبة مبيعات عامة، مصر 14%.</li></ul>
<h2>عدة بنود في فاتورة واحدة</h2>
<p>الأدق أن تجمع البنود أولًا ثم تحسب الضريبة على المجموع وتقرّب مرة واحدة، حتى لا تظهر فروقات هللات بين المجموع والضريبة. <a href="/ar/vat-calculator">حاسبة الضريبة</a> تعمل هكذا تلقائيًا، وتكتب الإجمالي بالحروف، ويمكنك إنشاء <a href="/ar/tax-invoice-generator">فاتورة ضريبية مع QR</a> مباشرة.</p>""",
 faq=[("كيف أحسب 15% من مبلغ؟", "اضرب المبلغ في 0.15. مثال: 15% من 1000 = 150."),
      ("كيف أعرف السعر قبل الضريبة؟", "اقسم السعر الشامل على 1.15 في السعودية، أو على 1.05 في الإمارات."),
      ("هل الضريبة على كل المنتجات؟", "لا، هناك سلع وخدمات معفاة أو بنسبة صفر حسب نظام كل دولة؛ تحقق من الجهة الضريبية.")]),

dict(slug="simplified-tax-invoice-qr", lang="ar",
 title="كيف أعمل فاتورة ضريبية مبسطة مع رمز QR هيئة الزكاة — المتطلبات والخطوات | QuickTiny",
 h1="كيف تُصدر فاتورة ضريبية مبسطة مع رمز QR هيئة الزكاة",
 lede="ما الذي يجب أن تحتويه الفاتورة الضريبية المبسطة، وماذا يوجد داخل رمز QR، ومتى تحتاج نظامًا مرتبطًا بالهيئة؟ دليل عملي للمحلات الصغيرة والمستقلين.",
 desc="دليل إصدار الفاتورة الضريبية المبسطة في السعودية مع رمز QR بصيغة هيئة الزكاة والضريبة والجمارك: محتويات الفاتورة، الحقول الخمسة في الرمز، الفرق بين المرحلة الأولى والثانية.",
 tool=("/ar/tax-invoice-generator", "أنشئ فاتورتك الآن"),
 body="""<h2>ما هي الفاتورة الضريبية المبسطة؟</h2>
<p>هي الفاتورة التي تُصدر عادة للمستهلك الفرد (B2C)، ولا تشترط بيانات المشتري. أما الفاتورة الضريبية الكاملة (B2B) فتتطلب اسم المشتري ورقمه الضريبي وتفاصيل إضافية.</p>
<h2>ماذا تحتوي الفاتورة المبسطة عادة؟</h2>
<ul><li>عنوان «فاتورة ضريبية مبسطة»، ورقم تسلسلي فريد، وتاريخ ووقت الإصدار.</li>
<li>اسم البائع وعنوانه ورقم تسجيله الضريبي.</li><li>وصف السلع أو الخدمات وكمياتها وأسعارها.</li>
<li>الإجمالي شامل الضريبة ومبلغ الضريبة.</li><li>رمز QR.</li></ul>
<h2>ماذا يوجد داخل رمز QR؟</h2>
<p>في المرحلة الأولى (الإصدار)، يحتوي الرمز خمسة حقول مرمّزة بصيغة TLV ثم Base64: اسم البائع، الرقم الضريبي (15 رقمًا يبدأ وينتهي بـ3)، تاريخ ووقت الفاتورة، الإجمالي مع الضريبة، ومبلغ الضريبة. أداة QuickTiny تبني الرمز بهذه الصيغة، وطابقناها مع المثال المرجعي المنشور.</p>
<h2>الخطوات</h2>
<ol><li>افتح <a href="/ar/tax-invoice-generator">مولّد الفاتورة الضريبية</a> وأدخل اسم منشأتك ورقمك الضريبي (يُحفظان في متصفحك للمرة القادمة).</li>
<li>أضف البنود واختر إن كانت الأسعار قبل الضريبة أو شاملة.</li>
<li>اضغط «طباعة / حفظ PDF» — تُطبع الفاتورة وحدها مع الرمز والمبلغ بالحروف.</li></ol>
<h2>المرحلة الأولى والثانية</h2>
<p>المرحلة الثانية (الربط والتكامل) تُلزم المنشآت المشمولة بإصدار الفواتير من نظام فوترة إلكترونية مرتبط بمنصة «فاتورة» يوقّع كل فاتورة رقميًا، وتُستدعى المنشآت على موجات حسب حجم إيراداتها. إذا كانت منشأتك ضمن موجة ملزمة فأنت تحتاج نظامًا متوافقًا — والأداة هنا تناسب الفواتير اليدوية والمنشآت غير المستدعاة بعد. تحقق من حالتك في موقع الهيئة.</p>
<h2>تحقق من فاتورة وصلتك</h2>
<p>في تبويب «قراءة رمز فاتورة» ارفع صورة الرمز لترى بياناته وتتحقق من صيغة الرقم الضريبي ومن أن الضريبة 15% من الصافي — أو استخدم <a href="/ar/zatca-qr-reader">صفحة قراءة باركود الفاتورة</a> مباشرة.</p>""",
 faq=[("هل يمكن إصدار الفاتورة بدون برنامج محاسبي؟", "للفواتير اليدوية وغير الملزمين بالمرحلة الثانية نعم، بشرط احتوائها على البيانات المطلوبة ورمز QR."),
      ("هل رمز QR إلزامي؟", "نعم، الفواتير الضريبية المبسطة الصادرة إلكترونيًا يجب أن تحتوي رمز QR منذ المرحلة الأولى."),
      ("هل تُحفظ فواتيري عندكم؟", "لا، كل شيء داخل متصفحك.")]),

# ---------------------------------------------------------------- English
dict(slug="convert-heic-to-jpg-windows", lang="en",
 title="How to Convert HEIC to JPG on Windows (Free, No Software) | QuickTiny",
 h1="How to Convert HEIC to JPG on Windows — Free, No Software",
 lede="iPhone photos arrive as .heic files that many Windows apps and upload forms refuse. Here are three free ways to turn them into JPGs — plus the iPhone setting that stops the problem.",
 desc="Step-by-step: convert iPhone HEIC photos to JPG on Windows 10/11 for free — in the browser with no install, with the Photos app, or by changing iPhone settings. Batch conversion included.",
 tool=("/heic-to-jpg", "Convert HEIC to JPG now"),
 body="""<h2>Why your photos are HEIC</h2>
<p>Since iOS 11, iPhones save photos as HEIC (High Efficiency Image Container): about half the size of JPG at the same quality. Windows only opens them with an extra codec, and many websites, government portals and older Android phones don't support them at all.</p>
<h2>Method 1: in your browser (fastest, nothing to install)</h2>
<ol><li>Copy the photos to your PC (cable, iCloud, or email them as files).</li>
<li>Open the <a href="/heic-to-jpg">HEIC to JPG converter</a> and drop the files — dozens at once is fine.</li>
<li>Keep quality at 88% (indistinguishable from the original) and download each file or one ZIP.</li></ol>
<p>Conversion happens on your computer; nothing is uploaded. The JPGs also have their GPS location data removed, which is safer for sharing.</p>
<h2>Method 2: the Windows Photos app</h2>
<p>Install “HEIF Image Extensions” from the Microsoft Store, open the photo in Photos and use “Save as” → JPG. Fine for one or two photos; slow for a whole album.</p>
<h2>Method 3: stop it at the source</h2>
<ul><li><strong>New photos as JPG:</strong> Settings → Camera → Formats → Most Compatible.</li>
<li><strong>Convert on transfer:</strong> Settings → Photos → Transfer to Mac or PC → Automatic.</li></ul>
<p>These don't convert photos you already have — use method 1 for those.</p>
<h2>Will I lose quality?</h2>
<p>At 85–92% JPG quality there's no visible difference. The JPG is usually a bit larger than the HEIC because JPG compresses less efficiently. If a form needs a size limit, run the result through <a href="/compress-image-to-kb">compress image to KB</a>.</p>""",
 faq=[("Is it really free?", "Yes — no sign-up, no watermark, no file limit."),
      ("Does it work on Android and Mac too?", "Yes, it runs in any modern browser. Safari on Mac can decode HEIC natively; other browsers use a built-in decoder that loads once."),
      ("What about Live Photos?", "Only the still image is converted; the motion part is a separate video file.")]),

dict(slug="compress-photo-under-100kb", lang="en",
 title="How to Compress a Photo Under 100 KB for Online Forms (Without Blurring It) | QuickTiny",
 h1="How to Compress a Photo to Under 100 KB for Online Forms",
 lede="Job portals, exam registrations and visa forms often reject photos over 100 KB (or 50 KB, or 20 KB). Here's how to hit the limit while keeping the photo sharp — and why “99 KB” files sometimes still fail.",
 desc="Compress a photo to under 100 KB, 50 KB or 20 KB for job, exam and visa forms without blurring it: size vs dimensions, the KB vs KiB trap, recommended sizes and mistakes to avoid.",
 tool=("/compress-image-to-100kb", "Compress to 100 KB now"),
 body="""<h2>File size vs dimensions</h2>
<p><strong>File size</strong> is in KB/MB; <strong>dimensions</strong> are in pixels (e.g. 600×800). A typical phone photo is 3–5 MB at about 4000×3000 px — 30–50× over a 100 KB limit.</p>
<h2>Three steps</h2>
<ol><li>Open the <a href="/compress-image-to-kb">compress-to-KB tool</a> and choose the limit (100 KB, 50 KB, 20 KB…).</li>
<li>If the form also requires dimensions (e.g. 200×230 px), enter them as max width/height.</li>
<li>Drop the photo and download. The tool shows the final size, dimensions and quality.</li></ol>
<p>It searches for the <strong>highest quality that fits</strong> and only shrinks dimensions when quality alone isn't enough. In our test a 3.6 MB phone photo became 97.8 KB at 1210×907 px and 65% quality — perfectly clear for an application photo.</p>
<h2>The “99 KB but rejected” trap</h2>
<p>Some systems count 1 KB as 1,000 bytes, others as 1,024. A 101,000-byte file shows as “99 KB” in Windows but fails a 100,000-byte check. The tool targets 100,000 bytes exactly, so it passes either way.</p>
<h2>Typical limits</h2>
<ul><li>Signatures: <a href="/compress-image-to-20kb">20 KB</a> or less.</li>
<li>Passport-size photos: <a href="/compress-image-to-50kb">50 KB</a> to <a href="/compress-image-to-100kb">100 KB</a>.</li>
<li>Visa and ID uploads: often up to <a href="/compress-image-to-200kb">200 KB</a>.</li></ul>
<h2>Avoid</h2>
<ul><li>Screenshots of the photo (changes dimensions and adds blur).</li>
<li>Sending it through messaging apps to “shrink” it — the result is unpredictable.</li>
<li>HEIC files from iPhones — <a href="/heic-to-jpg">convert to JPG</a> first.</li></ul>""",
 faq=[("How do I check a photo's size?", "Windows: right-click → Properties. Mac: Get Info. The tool also shows before/after sizes."),
      ("Will the photo look blurry?", "It keeps the highest quality that fits and shrinks dimensions only as much as needed."),
      ("Is my photo uploaded?", "No, compression happens in your browser.")]),

dict(slug="flat-rate-vs-apr", lang="en",
 title="Flat Rate vs APR: How to Compare Personal Loan Offers (With Examples) | QuickTiny",
 h1="Flat Rate vs APR — Which Personal Loan Is Really Cheaper?",
 lede="A 4% flat-rate loan sounds cheaper than a 7% APR loan. Often it isn't. Here's why, with worked numbers, and how to compare any two offers in a minute.",
 desc="Flat interest rate vs APR explained with examples: why a 4% flat rate costs about 7.5% APR, how to compare personal loan offers, and the formulas for monthly payments.",
 tool=("/loan-calculator", "Compare offers in the loan calculator"),
 body="""<h2>Two ways to quote interest</h2>
<ul><li><strong>Flat rate:</strong> interest is charged on the <em>original</em> amount for the whole term, even though you repay part of it every month.</li>
<li><strong>APR / reducing balance:</strong> interest is charged only on what you still owe, so it shrinks every month.</li></ul>
<h2>Worked example: 50,000 over 4 years</h2>
<table class="guide-table"><thead><tr><th>Offer</th><th>Monthly</th><th>Total interest</th><th>Real APR</th></tr></thead><tbody>
<tr><td>4% flat</td><td>1,208.33</td><td>8,000.00</td><td><strong>≈ 7.47%</strong></td></tr>
<tr><td>7% APR</td><td>1,197.31</td><td>7,470.99</td><td>7.00%</td></tr></tbody></table>
<p>The “4%” offer is actually <strong>more expensive</strong> than the 7% one. As a rule of thumb, a flat rate costs a little under twice its headline number in APR terms.</p>
<h2>The formulas</h2>
<ul><li>Flat: monthly = (P + P × rate × years) ÷ months.</li>
<li>Amortized: monthly = P × r ÷ (1 − (1 + r)<sup>−n</sup>), with r = annual rate ÷ 12 and n = months.</li></ul>
<h2>Don't forget fees</h2>
<p>Upfront admin fees raise the real cost because you receive less money but repay the same instalments. The <a href="/loan-calculator">loan calculator</a> includes fees in the APR and shows a yearly schedule, so you can compare offers on the same basis.</p>""",
 faq=[("Is a flat rate always worse?", "For the same headline number, yes — compare offers by APR instead."),
      ("What is a good APR?", "It depends on your country and credit; compare at least two or three offers by APR and total cost."),
      ("Does Islamic murabaha financing use flat rates?", "Profit is usually quoted as a fixed (flat) rate on the original amount; the calculator shows its APR equivalent for comparison.")]),

dict(slug="percentage-increase-decrease", lang="en",
 title="How to Calculate Percentage Increase and Decrease (With Examples) | QuickTiny",
 h1="How to Calculate Percentage Increase and Decrease",
 lede="The one formula behind price rises, discounts, growth and grade changes — with examples, the most common mistake, and why a 20% drop isn't undone by a 20% rise.",
 desc="Percentage increase and decrease explained: the formula, worked examples, reverse percentages, percentage points vs percent, and why -20% then +20% doesn't get you back.",
 tool=("/percentage-calculator", "Open the percentage calculator"),
 body="""<h2>The formula</h2>
<p><strong>Percent change = (new − old) ÷ old × 100.</strong> Positive means an increase, negative a decrease.</p>
<ul><li>80 → 100: (100 − 80) ÷ 80 × 100 = <strong>+25%</strong>.</li>
<li>100 → 80: (80 − 100) ÷ 100 × 100 = <strong>−20%</strong>.</li></ul>
<h2>Why −20% then +20% doesn't get you back</h2>
<p>The second percentage is taken from a smaller number: 100 − 20% = 80, then 80 + 20% = 96. To return to 100 you need +25%.</p>
<h2>Adding or removing a percentage</h2>
<ul><li>Add 15%: multiply by 1.15 (200 → 230).</li><li>Take 25% off: multiply by 0.75 (200 → 150).</li>
<li>Remove a percentage that was already added (e.g. tax): divide by 1.15, don't subtract 15%.</li></ul>
<h2>Percent vs percentage points</h2>
<p>If an interest rate goes from 4% to 5%, that's a rise of <strong>1 percentage point</strong> but a <strong>25% increase</strong>. News reports often mix these up.</p>
<h2>Do it instantly</h2>
<p>The <a href="/percentage-calculator">percentage calculator</a> covers all four cases — X% of Y, X is what % of Y, percent change, and add/subtract a percentage — and shows the formula. For shopping, the <a href="/discount-calculator">discount calculator</a> shows what you save.</p>""",
 faq=[("How do I calculate a percentage of a number?", "Multiply by the percentage and divide by 100: 15% of 200 = 15 × 200 ÷ 100 = 30."),
      ("How do I find the original price before a discount?", "Divide the sale price by (1 − discount): 150 after 25% off → 150 ÷ 0.75 = 200."),
      ("Can percent change be more than 100%?", "Yes — going from 50 to 150 is a 200% increase.")]),
]
