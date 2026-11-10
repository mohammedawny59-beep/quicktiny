# Generates SEO landing pages from an existing tool page: new head/hero/intro/FAQ + a preset.
# usage: landing.py <repo>
import io, re, sys, os, json
root = sys.argv[1]; os.chdir(root)
B = "https://quicktinyv2.vercel.app"

def faq(items):
    return "".join('<details class="faq-item"><summary>%s</summary><p>%s</p></details>' % (q, a) for q, a in items)

PAGES = [
 # ---------- PDF ----------
 dict(base="pdf-tools", slug="merge-pdf", preset={"tab": "merge"}, crumb="Merge PDF",
  title="Merge PDF Files Free — Combine PDFs Without Uploading | QuickTiny",
  desc="Combine multiple PDF files into one in your browser. Reorder files, keep full quality, no upload, no sign-up, no watermark.",
  h1="Merge PDF Files — Free, Private, No Upload",
  intro="Combine two or more PDFs into a single file in seconds. Drop your files, drag them into order and download one merged PDF — everything happens in your browser, so contracts, invoices and scans never leave your device.",
  about="<h2>How to merge PDF files</h2><ol><li>Drop two or more PDFs into the box (or click to choose).</li><li>Use ↑ and ↓ to put them in the order you want.</li><li>Click <strong>Merge PDFs</strong> and download the combined file.</li></ol><p>Pages are copied exactly as they are, so text stays selectable and images keep their original quality. There's no file-count or size paywall.</p>",
  faq=[("Is it safe to merge confidential PDFs here?", "Yes — the files are processed by your own browser and are never uploaded to a server."), ("Can I merge PDFs on my phone?", "Yes, it works in mobile Chrome and Safari. Very large files depend on your phone's memory."), ("Is there a limit on files or size?", "No paywall and no fixed limit — only your device's memory. Hundreds of pages merge fine on a normal laptop.")],
  alts={"ar": "ar/merge-pdf"}),
 dict(base="pdf-tools", slug="split-pdf", preset={"tab": "pages", "pagesMode": "split"}, crumb="Split PDF",
  title="Split PDF — Separate Every Page Into Its Own File | QuickTiny",
  desc="Split a PDF into single pages or extract a page range like 1-3, 5, 8- — free, in your browser, nothing uploaded.",
  h1="Split PDF Into Separate Pages",
  intro="Turn one PDF into one file per page, or pull out just the pages you need. Works on any PDF that isn't password-protected, right in your browser.",
  about="<h2>Two ways to split</h2><ul class='benefits'><li><strong>One file per page</strong> — every page becomes its own PDF, ready to download.</li><li><strong>Extract a range</strong> — switch the mode to “Keep only these pages” and type ranges like <code>1-3, 5, 8-</code>.</li></ul>",
  faq=[("What range format can I use?", "Separate items with commas and use a dash for ranges: 1-3, 5, 8- means pages 1 to 3, page 5 and everything from 8 to the end."), ("Does splitting reduce quality?", "No. Pages are copied without re-compressing.")],
  alts={"ar": "ar/split-pdf"}),
 dict(base="pdf-tools", slug="jpg-to-pdf", preset={"tab": "images"}, crumb="JPG to PDF",
  title="JPG to PDF — Convert Images to a PDF Free | QuickTiny",
  desc="Convert JPG, PNG or WebP photos into one PDF. Choose A4, Letter or image size, set margins, reorder pages. Free and private.",
  h1="Convert JPG to PDF — Images to One PDF",
  intro="Turn photos of receipts, documents or homework into a single tidy PDF. Pick A4, US Letter or keep each image's size, add a margin, and put the pages in order before you download.",
  about="<h2>Good to know</h2><ul class='benefits'><li>Landscape photos automatically get landscape pages.</li><li>PNG and WebP work too — WebP is converted to JPG inside the PDF.</li><li>Your images are never uploaded.</li></ul>",
  faq=[("How many images can I add?", "As many as your device's memory allows — dozens of phone photos are fine."), ("Can I make one PDF page per image?", "Yes, that's exactly how it works: each image becomes one page.")],
  alts={"ar": "ar/jpg-to-pdf"}),
 dict(base="pdf-tools", slug="rotate-pdf", preset={"tab": "rotate"}, crumb="Rotate PDF",
  title="Rotate PDF Pages — Fix Sideways or Upside-Down Pages | QuickTiny",
  desc="Rotate all pages or just some pages of a PDF by 90°, 180° or 270° and save it. Free, private, in your browser.",
  h1="Rotate PDF Pages and Save",
  intro="Fix scanned pages that came out sideways or upside down. Rotate every page, or only the ones you list, then download the corrected PDF.",
  about="<h2>Rotate only some pages</h2><p>Type the pages in the box — for example <code>2, 4-6</code> — and only those turn. Leave it empty to rotate the whole document.</p>",
  faq=[("Is the rotation permanent?", "Yes, the downloaded PDF keeps the new orientation in any viewer."), ("Will it change file size?", "Barely — rotation is stored as a page setting, nothing is re-compressed.")]),
 dict(base="pdf-tools", slug="delete-pdf-pages", preset={"tab": "pages", "pagesMode": "remove"}, crumb="Delete PDF Pages",
  title="Delete Pages From a PDF — Remove Pages Free | QuickTiny",
  desc="Remove unwanted pages from a PDF by number or range and download the trimmed file. Free, no upload, no sign-up.",
  h1="Delete Pages From a PDF",
  intro="Remove blank pages, ads or anything you don't need. Type the page numbers to delete and download a clean PDF.",
  about="<h2>Examples</h2><ul class='benefits'><li><code>1</code> — remove the cover page.</li><li><code>2, 4</code> — remove pages 2 and 4.</li><li><code>10-</code> — remove everything from page 10 on.</li></ul>",
  faq=[("Can I undo it?", "Your original file is untouched — the tool creates a new PDF.")]),
 # ---------- QR ----------
 dict(base="qr-code-generator", slug="wifi-qr-code", preset={"type": "wifi"}, crumb="Wi-Fi QR Code",
  title="Wi-Fi QR Code Generator — Guests Join Without Typing | QuickTiny",
  desc="Create a QR code that connects phones to your Wi-Fi in one scan. Add your logo and a “Scan for Wi-Fi” frame. Free, never expires, nothing uploaded.",
  h1="Wi-Fi QR Code Generator",
  intro="Print one code and guests join your Wi-Fi by pointing their camera at it — no spelling out passwords. Perfect for cafés, offices, rentals and home.",
  about="<h2>How Wi-Fi QR codes work</h2><p>The code stores your network name, password and security type in the standard format phones understand. iPhone and Android cameras show a “Join network” prompt. Your password is turned into the code inside your browser and never sent to us.</p><h2>Tips</h2><ul class='benefits'><li>Use the frame with “SCAN FOR WI-FI” so people know what it is.</li><li>If you change your password, make a new code.</li></ul>",
  faq=[("Is my Wi-Fi password stored anywhere?", "No. The code is generated in your browser; we never see your password."), ("Does it work on iPhone?", "Yes — the built-in Camera app reads Wi-Fi QR codes on iOS 11 and later, and Android cameras do too.")],
  alts={"ar": "ar/wifi-qr-code"}),
 dict(base="qr-code-generator", slug="whatsapp-qr-code", preset={"type": "whatsapp"}, crumb="WhatsApp QR Code",
  title="WhatsApp QR Code Generator — Start a Chat With One Scan | QuickTiny",
  desc="Make a QR code that opens a WhatsApp chat with your number and a pre-filled message. Great for shops, menus and flyers. Free and never expires.",
  h1="WhatsApp QR Code Generator",
  intro="Customers scan and land straight in a WhatsApp chat with you — with a message like “Hi, I'd like to order” already typed. Ideal for menus, packaging, business cards and shop windows.",
  about="<h2>What you need</h2><ul class='benefits'><li>Your number with country code (e.g. +962 79…).</li><li>An optional message that's filled in for the customer.</li></ul><p>The code opens <code>wa.me</code> links, which work on phones with WhatsApp installed and on WhatsApp Web.</p>",
  faq=[("Can I use a WhatsApp Business number?", "Yes, any WhatsApp or WhatsApp Business number works."), ("Will the code stop working?", "No — it's a static code that contains the link itself.")],
  alts={"ar": "ar/whatsapp-qr-code"}),
 dict(base="qr-code-generator", slug="vcard-qr-code", preset={"type": "vcard"}, crumb="Contact (vCard) QR Code",
  title="vCard QR Code — Business Card QR to Save Your Contact | QuickTiny",
  desc="Create a QR code that saves your name, phone, email, company and website to a phone's contacts in one tap. Free, private, never expires.",
  h1="vCard QR Code for Business Cards",
  intro="Put a QR code on your business card or email signature so people save your details instantly — name, phone, email, company, title and website.",
  about="<h2>Why a vCard QR?</h2><p>Nobody has to type your number. Phones recognise the vCard format and offer to add a new contact. Arabic names work too.</p>",
  faq=[("Does it update if my number changes?", "No — static codes can't change. Create a new one when your details change.")]),
 dict(base="qr-code-generator", slug="qr-code-with-logo", preset={"pane": "logo"}, crumb="QR Code With Logo",
  title="QR Code With Logo — Add Your Logo, Colors and Frame | QuickTiny",
  desc="Put your logo in the middle of a QR code, pick brand colors and add a call-to-action frame. Every code is scan-tested before you download. Free.",
  h1="Create a QR Code With Your Logo",
  intro="Upload your logo, choose your brand colors and a frame like “SCAN ME” — the generator raises error correction automatically and tests that the code still scans.",
  about="<h2>Logo QR codes that still scan</h2><ul class='benefits'><li>Keep the logo at 25% or less of the code width.</li><li>Use the white plate behind the logo for busy logos.</li><li>Watch the scan-test badge — it turns red if the design hurts readability.</li></ul>",
  faq=[("What logo format should I use?", "PNG with a transparent background looks best; JPG and SVG work too.")]),
 # ---------- Sensitivity ----------
 dict(base="sensitivity-converter", slug="valorant-to-cs2-sensitivity", preset={"from": "valorant", "to": "cs2"}, crumb="Valorant to CS2 Sens",
  title="Valorant to CS2 Sensitivity Converter — Exact Same Aim | QuickTiny",
  desc="Convert your Valorant sensitivity to CS2 instantly (multiply by 3.18). See cm/360 and eDPI, and change DPI if you need. Free.",
  h1="Valorant to CS2 Sensitivity Converter",
  intro="Moving from Valorant to Counter-Strike 2? Your CS2 sensitivity is your Valorant sensitivity × 3.1818 at the same DPI. Enter yours below to get the exact number.",
  about="<h2>The formula</h2><p>Valorant turns 0.07° per mouse count, CS2 turns 0.022°. So <strong>CS2 sens = Valorant sens × 0.07 ÷ 0.022 ≈ × 3.18</strong>. Example: Valorant 0.35 at 800 DPI = CS2 1.11.</p>",
  faq=[("Do I need to change DPI?", "No — keep the same DPI and the converted sens gives the same cm/360."), ("Is scoped sensitivity converted?", "No, this converts hip-fire sensitivity. Zoom multipliers work differently in each game.")]),
 dict(base="sensitivity-converter", slug="cs2-to-valorant-sensitivity", preset={"from": "cs2", "to": "valorant", "sens": "1"}, crumb="CS2 to Valorant Sens",
  title="CS2 to Valorant Sensitivity Converter — Divide by 3.18 | QuickTiny",
  desc="Convert CS2 sensitivity to Valorant: Valorant sens = CS2 sens ÷ 3.18. Instant result with cm/360 and eDPI.",
  h1="CS2 to Valorant Sensitivity Converter",
  intro="Switching from Counter-Strike 2 to Valorant? Divide your CS2 sensitivity by 3.1818 at the same DPI. The converter below does it for you.",
  about="<h2>Example</h2><p>CS2 sens 1.0 at 800 DPI → Valorant 0.314. Both give 52 cm per 360° turn.</p>",
  faq=[("Why does it feel different even with the same cm/360?", "Field of view differs between games, so small movements feel different at first.")]),
 dict(base="sensitivity-converter", slug="apex-to-valorant-sensitivity", preset={"from": "apex", "to": "valorant", "sens": "1.5"}, crumb="Apex to Valorant Sens",
  title="Apex Legends to Valorant Sensitivity Converter | QuickTiny",
  desc="Convert Apex Legends sensitivity to Valorant with the exact same 360° distance. Shows cm/360 and eDPI. Free.",
  h1="Apex Legends to Valorant Sensitivity",
  intro="Apex uses the same 0.022° yaw as CS2, so Valorant sens = Apex sens ÷ 3.18 at the same DPI.",
  about="<h2>Quick example</h2><p>Apex 1.5 at 800 DPI → Valorant 0.471.</p>",
  faq=[("Does it include ADS sensitivity?", "No — only hip-fire (look) sensitivity is converted.")]),
 dict(base="sensitivity-converter", slug="overwatch-to-valorant-sensitivity", preset={"from": "ow2", "to": "valorant", "sens": "5"}, crumb="Overwatch 2 to Valorant Sens",
  title="Overwatch 2 to Valorant Sensitivity Converter | QuickTiny",
  desc="Convert Overwatch 2 sensitivity to Valorant: Valorant sens = OW2 sens × 0.0943. Exact cm/360 match. Free.",
  h1="Overwatch 2 to Valorant Sensitivity",
  intro="Overwatch 2 turns 0.0066° per count, so Valorant sens = OW2 sens × 0.0943 at the same DPI.",
  about="<h2>Example</h2><p>Overwatch 2 at 5.00 and 800 DPI → Valorant 0.471.</p>",
  faq=[("Is this for Valorant hip-fire?", "Yes — scoped sensitivity is a separate multiplier in Valorant.")]),
 # ---------- Image ----------
 dict(base="social-image-resizer", slug="instagram-story-size", preset={"sizes": ["ig-story", "tt-video", "fb-story", "wa-status"]}, crumb="Instagram Story Size",
  title="Instagram Story Size (1080×1920) — Resize Any Image | QuickTiny",
  desc="Resize any photo to the Instagram Story size 1080×1920 (9:16) with a focal point or blurred background, and see the safe zones. Free.",
  h1="Instagram Story Size: 1080 × 1920 px",
  intro="Instagram Stories and Reels are 1080 × 1920 pixels (9:16). Drop any image to resize it — keep the subject in frame with the focal point, or fit the whole photo on a blurred background — and check the safe zones hidden by Instagram's buttons.",
  about="<h2>Story safe zones</h2><p>Keep text and faces out of the top ~14% (profile and progress bar) and the bottom ~20% (reply box and buttons). The red overlay shows exactly where.</p><p>The same 9:16 size works for TikTok, Facebook Stories and WhatsApp Status, which are pre-selected too.</p>",
  faq=[("What's the best format for Stories?", "JPG for photos; PNG for graphics with text.")],
  alts={"ar": "ar/instagram-story-size"}),
 dict(base="social-image-resizer", slug="youtube-thumbnail-size", preset={"sizes": ["yt-thumb", "yt-banner"]}, crumb="YouTube Thumbnail Size",
  title="YouTube Thumbnail Size (1280×720) — Resize Your Image | QuickTiny",
  desc="Resize an image to the YouTube thumbnail size 1280×720 (16:9) and channel banner 2560×1440. Focal-point crop, free download.",
  h1="YouTube Thumbnail Size: 1280 × 720 px",
  intro="YouTube recommends 1280 × 720 pixels (16:9) for thumbnails. Drop your image, set the focal point on your face or product, and download a perfectly sized thumbnail — plus the 2560 × 1440 channel banner if you need it.",
  about="<h2>Thumbnail checklist</h2><ul class='benefits'><li>1280 × 720 px, 16:9.</li><li>Under 2 MB — choose JPG at 85–90% quality.</li><li>Big, readable text and a clear face or object.</li></ul>",
  faq=[("Why 1280×720?", "It's YouTube's recommended size; smaller images look blurry on TVs and large screens.")]),
 dict(base="product-photo-studio", slug="remove-background-from-image", preset={"removeBg": True}, crumb="Remove Background",
  title="Remove Background From Image Free — No Upload, On-Device AI | QuickTiny",
  desc="Remove the background from product photos with AI that runs on your device — nothing is uploaded. Put it on white or transparent, resize for Shopify or Amazon.",
  h1="Remove Background From an Image — Free and Private",
  intro="Cut out the subject of your photo with an AI model that runs inside your browser — your image is never uploaded. Then place it on pure white, a color or a transparent PNG.",
  about="<h2>Why on-device?</h2><p>Most background removers upload your photo to their servers and charge for full resolution. Here the AI model downloads once (about 19 MB) and works offline in your browser, at full resolution, for free.</p>",
  faq=[("What works best?", "Products and objects on a plain, contrasting background. Fine hair and glass are harder."), ("Can I get a transparent PNG?", "Yes — choose “Transparent” background and PNG format.")]),
 # ---------- Mouse / data ----------
 dict(base="mouse-test", slug="cps-test", preset={"tab": "cps"}, crumb="CPS Test",
  title="CPS Test — Clicks Per Second Test (1, 5, 10, 30 s) | QuickTiny",
  desc="How fast can you click? Free CPS test with 1, 5, 10 and 30-second modes and your best score saved. Works with jitter and butterfly clicking.",
  h1="CPS Test — How Many Clicks Per Second?",
  intro="Click as fast as you can for 1, 5, 10 or 30 seconds and see your clicks per second. Your best score per duration is saved in your browser.",
  about="<h2>What's a good CPS?</h2><ul class='benefits'><li>6–8 CPS — typical normal clicking.</li><li>10–14 CPS — jitter clicking.</li><li>15+ CPS — butterfly or drag clicking.</li></ul>",
  faq=[("Does my mouse affect CPS?", "A light switch with low debounce helps; a worn switch can double-click — use the double-click test to check.")]),
 dict(base="mouse-test", slug="reaction-time-test", preset={"tab": "reaction"}, crumb="Reaction Time Test",
  title="Reaction Time Test — How Fast Are Your Reflexes? | QuickTiny",
  desc="Test your reaction time in milliseconds over 5 rounds. Wait for green, click fast. Average human reaction is about 250 ms.",
  h1="Reaction Time Test",
  intro="Wait for the box to turn green, then click as fast as you can. Five rounds are averaged so one lucky click doesn't count.",
  about="<h2>How do you compare?</h2><ul class='benefits'><li>Under 200 ms — excellent.</li><li>200–250 ms — faster than most people.</li><li>250–300 ms — average.</li></ul>",
  faq=[("Why is my score slower on a laptop?", "Display and input lag add a few milliseconds; a high-refresh monitor and wired mouse help.")]),
 dict(base="json-converter", slug="json-to-typescript", preset={"mode": "ts"}, crumb="JSON to TypeScript",
  title="JSON to TypeScript — Generate Interfaces From JSON | QuickTiny",
  desc="Paste JSON and get TypeScript interfaces with optional and nullable fields inferred from every array item. Free, instant, nothing uploaded.",
  h1="JSON to TypeScript Interface Generator",
  intro="Paste an API response and get clean TypeScript interfaces. Fields missing from some array items become optional, mixed values become unions, and nested objects get their own named interfaces.",
  about="<h2>Example</h2><p><code>[{\"id\":1,\"name\":\"Ada\"},{\"id\":2,\"age\":30}]</code> becomes an interface with <code>id: number</code>, <code>name?: string</code> and <code>age?: number</code>.</p>",
  faq=[("Can I get a Zod schema instead?", "Yes — switch the mode to JSON → Zod schema.")]),
]

AR_PAGES = [
 dict(base="ar/pdf-tools", slug="ar/merge-pdf", preset={"tab": "merge"}, crumb="دمج ملفات PDF",
  title="دمج ملفات PDF مجانًا — بدون رفع وبدون تسجيل | QuickTiny",
  desc="ادمج عدة ملفات PDF في ملف واحد داخل متصفحك. رتّب الملفات واحتفظ بالجودة الأصلية، بدون رفع وبدون علامة مائية.",
  h1="دمج ملفات PDF في ملف واحد — مجانًا وبخصوصية",
  intro="اجمع ملفين أو أكثر في ملف PDF واحد خلال ثوانٍ. اسحب الملفات، رتّبها، ثم نزّل الملف المدمج — كل شيء داخل متصفحك فلا تغادر العقود والفواتير جهازك.",
  about="<h2>طريقة دمج ملفات PDF</h2><ol><li>اسحب ملفين أو أكثر إلى المربع.</li><li>رتّبها بالأسهم ↑ و↓.</li><li>اضغط «دمج الملفات» ونزّل الملف.</li></ol>",
  faq=[("هل دمج ملفات سرية آمن هنا؟", "نعم، الملفات تُعالج داخل متصفحك ولا تُرفع إلى أي خادم."), ("هل يعمل على الجوال؟", "نعم، في كروم وسفاري على الجوال.")],
  alts={"en": "merge-pdf"}),
 dict(base="ar/pdf-tools", slug="ar/split-pdf", preset={"tab": "pages", "pagesMode": "split"}, crumb="تقسيم PDF",
  title="تقسيم ملف PDF إلى صفحات منفصلة — مجانًا | QuickTiny",
  desc="قسّم ملف PDF إلى ملف لكل صفحة أو استخرج صفحات محددة مثل 1-3, 5. مجاني وبدون رفع ملفاتك.",
  h1="تقسيم ملف PDF إلى صفحات منفصلة",
  intro="حوّل ملف PDF إلى ملف مستقل لكل صفحة، أو استخرج الصفحات التي تحتاجها فقط — داخل متصفحك وبدون رفع.",
  about="<h2>طريقتان للتقسيم</h2><ul class='benefits'><li><strong>ملف لكل صفحة</strong> — كل صفحة تصبح ملفًا مستقلًا.</li><li><strong>استخراج نطاق</strong> — اختر «الإبقاء على هذه الصفحات» واكتب مثل <code>1-3, 5</code>.</li></ul>",
  faq=[("هل يقلّ جودة الملف؟", "لا، تُنسخ الصفحات كما هي بدون ضغط.")],
  alts={"en": "split-pdf"}),
 dict(base="ar/pdf-tools", slug="ar/jpg-to-pdf", preset={"tab": "images"}, crumb="تحويل الصور إلى PDF",
  title="تحويل الصور إلى PDF — JPG إلى PDF مجانًا | QuickTiny",
  desc="حوّل صور JPG وPNG إلى ملف PDF واحد بمقاس A4 أو بحجم الصورة، مع هوامش وترتيب الصفحات. مجاني وبدون رفع.",
  h1="تحويل الصور إلى PDF — صور JPG في ملف واحد",
  intro="حوّل صور الإيصالات والمستندات والواجبات إلى ملف PDF مرتب. اختر A4 أو بحجم الصورة، أضف هامشًا، ورتّب الصفحات قبل التنزيل.",
  about="<h2>معلومات مفيدة</h2><ul class='benefits'><li>الصور العريضة تأخذ صفحات عريضة تلقائيًا.</li><li>تدعم PNG وWebP أيضًا.</li><li>صورك لا تُرفع إلى أي مكان.</li></ul>",
  faq=[("كم صورة يمكنني إضافتها؟", "عشرات الصور بدون مشكلة، حسب ذاكرة جهازك.")],
  alts={"en": "jpg-to-pdf"}),
 dict(base="ar/qr-code-generator", slug="ar/wifi-qr-code", preset={"type": "wifi"}, crumb="باركود الواي فاي",
  title="إنشاء باركود واي فاي — اتصال الضيوف بدون كتابة كلمة المرور | QuickTiny",
  desc="اصنع باركود QR يوصل الجوال بشبكة الواي فاي بمسحة واحدة. أضف شعارك وإطار «امسح للاتصال». مجاني ولا ينتهي.",
  h1="إنشاء باركود واي فاي",
  intro="اطبع كودًا واحدًا، وسيتصل ضيوفك بالواي فاي بمجرد توجيه الكاميرا — بدون تهجئة كلمة المرور. مثالي للمقاهي والمكاتب والشقق والمنزل.",
  about="<h2>كيف يعمل؟</h2><p>يحفظ الكود اسم الشبكة وكلمة المرور ونوع الحماية بالصيغة التي تفهمها الجوالات، فتظهر رسالة «الانضمام للشبكة». كلمة المرور تتحول إلى كود داخل متصفحك ولا تُرسل إلينا.</p>",
  faq=[("هل تُحفظ كلمة مرور الواي فاي؟", "لا، الكود يُنشأ داخل متصفحك ولا نرى كلمة المرور."), ("هل يعمل مع الآيفون؟", "نعم، كاميرا الآيفون والأندرويد تقرأ أكواد الواي فاي.")],
  alts={"en": "wifi-qr-code"}),
 dict(base="ar/qr-code-generator", slug="ar/whatsapp-qr-code", preset={"type": "whatsapp"}, crumb="باركود واتساب",
  title="إنشاء باركود واتساب — رابط محادثة برسالة جاهزة | QuickTiny",
  desc="اصنع باركود يفتح محادثة واتساب مع رقمك ورسالة جاهزة مثل «أريد الطلب». مثالي للمطاعم والمتاجر والمنيو. مجاني ولا ينتهي.",
  h1="إنشاء باركود واتساب",
  intro="يمسح العميل الكود فيفتح محادثة واتساب معك مباشرة ورسالة مثل «مرحبًا، أريد الطلب» مكتوبة مسبقًا. مثالي للمنيو والتغليف وبطاقات العمل.",
  about="<h2>ماذا تحتاج؟</h2><ul class='benefits'><li>رقمك مع رمز الدولة (مثل +962…).</li><li>رسالة جاهزة اختيارية — تدعم العربية.</li></ul>",
  faq=[("هل يعمل مع واتساب للأعمال؟", "نعم، مع أي رقم واتساب أو واتساب للأعمال.")],
  alts={"en": "whatsapp-qr-code"}),
 dict(base="ar/social-image-resizer", slug="ar/instagram-story-size", preset={"sizes": ["ig-story", "tt-video", "fb-story", "wa-status"]}, crumb="مقاس ستوري انستقرام",
  title="مقاس ستوري انستقرام 1080×1920 — غيّر مقاس صورتك | QuickTiny",
  desc="حوّل أي صورة إلى مقاس ستوري انستقرام 1080×1920 (9:16) مع نقطة تركيز أو خلفية ضبابية، وشاهد المناطق الآمنة. مجاني.",
  h1="مقاس ستوري انستقرام: 1080 × 1920 بكسل",
  intro="مقاس ستوري وريلز انستقرام هو 1080 × 1920 بكسل (9:16). ارفع أي صورة لتغيير مقاسها مع الحفاظ على الموضوع داخل الإطار، أو اعرضها كاملة على خلفية ضبابية، وشاهد المناطق التي تغطيها أزرار انستقرام.",
  about="<h2>المناطق الآمنة في الستوري</h2><p>أبعد النصوص والوجوه عن أعلى ~14% (صورة الحساب وشريط التقدم) وأسفل ~20% (خانة الرد والأزرار). المنطقة الحمراء توضح ذلك.</p><p>نفس المقاس يصلح لتيك توك وستوري فيسبوك وحالة واتساب.</p>",
  faq=[("ما أفضل صيغة للستوري؟", "JPG للصور العادية، وPNG للتصاميم التي فيها نصوص.")],
  alts={"en": "instagram-story-size"}),
]

def build(p):
    src = io.open(p["base"] + ".html", encoding="utf-8").read()
    url = B + "/" + p["slug"]; base_url = B + "/" + p["base"]
    s = src
    s = re.sub(r"<title>.*?</title>", lambda m: "<title>" + p["title"] + "</title>", s, count=1, flags=re.S)
    for pat in [r'(<meta name="description" content=")[^"]*', r'(<meta property="og:description" content=")[^"]*', r'(<meta name="twitter:description" content=")[^"]*']:
        s = re.sub(pat, lambda m: m.group(1) + p["desc"], s, count=1)
    for pat in [r'(<meta property="og:title" content=")[^"]*', r'(<meta name="twitter:title" content=")[^"]*']:
        s = re.sub(pat, lambda m: m.group(1) + p["title"], s, count=1)
    s = s.replace('href="%s"' % base_url, 'href="%s"' % url).replace('content="%s"' % base_url, 'content="%s"' % url)
    # hreflang: only the pairs we define
    s = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>', "", s)
    alts = p.get("alts")
    if alts:
        lang = "ar" if p["slug"].startswith("ar/") else "en"
        pairs = [(lang, p["slug"])] + list(alts.items())
        en = [x for x in pairs if x[0] == "en"][0][1]
        links = "".join('\n  <link rel="alternate" hreflang="%s" href="%s/%s">' % (l, B, sl) for l, sl in pairs) + '\n  <link rel="alternate" hreflang="x-default" href="%s/%s">' % (B, en)
        s = s.replace('<link rel="canonical" href="%s">' % url, '<link rel="canonical" href="%s">' % url + links, 1)
    # language switcher: point to the paired landing page or drop it
    if alts:
        lang = "ar" if p["slug"].startswith("ar/") else "en"
        en_sl = p["slug"] if lang == "en" else alts["en"]; ar_sl = p["slug"] if lang == "ar" else alts["ar"]
        sw = '<div class="lang-switch">\n    <a href="/%s"%s>EN</a>\n    <a href="/%s" lang="ar"%s>AR</a>\n  </div>\n' % (
            en_sl, ' class="active"' if lang == "en" else "", ar_sl, ' class="active"' if lang == "ar" else "")
        s = re.sub(r'<div class="lang-switch">.*?</div>\n', lambda m: sw, s, count=1, flags=re.S)
    else:
        s = re.sub(r'\s*<div class="lang-switch">.*?</div>\n', "\n", s, count=1, flags=re.S)
    # preset
    s = s.replace("</head>", "  <script>window.QT_PRESET = %s;</script>\n</head>" % json.dumps(p["preset"], ensure_ascii=False), 1)
    # breadcrumb last item
    s = re.sub(r'(<div class="breadcrumb">.*?<span style="color:var\(--text-dim\)">)[^<]*(</span>)', lambda m: m.group(1) + p["crumb"] + m.group(2), s, count=1, flags=re.S)
    # hero h1 + first paragraph
    s = re.sub(r'(<section class="hero compact">.*?<h1>).*?(</h1>\s*<p>).*?(</p>)', lambda m: m.group(1) + p["h1"] + m.group(2) + p["intro"] + m.group(3), s, count=1, flags=re.S)
    # unique section at the top of the content block
    block = p["about"] + ('<h2>%s</h2>' % ("أسئلة سريعة" if p["slug"].startswith("ar/") else "Quick answers")) + faq(p["faq"])
    s = s.replace('<div class="content">', '<div class="content">\n    ' + block, 1)
    # JSON-LD: breadcrumb name + app url
    s = s.replace('"url":"%s"' % base_url, '"url":"%s"' % url).replace('"item":"%s"' % base_url, '"item":"%s"' % url)
    s = s.replace('"url": "%s"' % base_url, '"url": "%s"' % url).replace('"item": "%s"' % base_url, '"item": "%s"' % url)
    os.makedirs(os.path.dirname(p["slug"]) or ".", exist_ok=True)
    io.open(p["slug"] + ".html", "w", encoding="utf-8", newline="").write(s)
    return p["slug"]

if len(sys.argv) > 2:  # optional: build only the pages in a JSON spec
    PAGES = json.load(io.open(sys.argv[2], encoding="utf-8")); AR_PAGES = []
out = [build(p) for p in PAGES + AR_PAGES]
print(len(out), "pages:", ", ".join(out))
