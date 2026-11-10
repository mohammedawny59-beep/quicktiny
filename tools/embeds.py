# Builds embeddable calculator widgets (/embed/*) and adds an "Embed on your site" box to the matching tool pages.
# The copy-paste snippet contains a normal text link under the iframe — that link is what counts as a backlink.
# usage: python tools/embeds.py <repo>
import io, os, sys, re
root = sys.argv[1]; os.chdir(root)
B = "https://quicktinyv2.vercel.app"
CSS = """*,*::before,*::after{box-sizing:border-box}html,body{margin:0;background:transparent}
body{font-family:system-ui,-apple-system,"Segoe UI",Tahoma,Roboto,Arial,sans-serif;color:#eef0fb;line-height:1.5;font-size:14px}
.card{background:#10131c;border:1px solid #232838;border-radius:14px;padding:14px}
h1{font-size:16px;margin:0 0 10px}
label{display:block;font-size:12px;color:#9aa3b8;margin:8px 0 4px}
input,select{width:100%;background:#0a0c12;border:1px solid #2a3142;color:#eef0fb;border-radius:9px;padding:8px 10px;font:inherit}
input:focus,select:focus{outline:2px solid #6b6bff;outline-offset:0}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px}
.out{margin-top:12px;padding:12px;border-radius:12px;background:linear-gradient(135deg,rgba(107,107,255,.18),rgba(59,226,255,.06));border:1px solid rgba(123,123,255,.35)}
.row{display:flex;justify-content:space-between;gap:8px;padding:2px 0}.row b{direction:ltr;font-variant-numeric:tabular-nums}
.big{font-size:24px;font-weight:800;direction:ltr;font-variant-numeric:tabular-nums}
.words{font-size:12.5px;color:#cfd3ff;margin-top:4px}
.foot{display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:11.5px;color:#7d869b}
.foot a{color:#9fa3ff;text-decoration:none}
.btn,.vt-del{cursor:pointer;background:#1b2030;border:1px solid #2a3142;color:#eef0fb;border-radius:9px;padding:6px 10px;font:inherit;font-size:12.5px}
table{width:100%;border-collapse:collapse}td{padding:2px}.vt-table td:nth-child(2){width:60px}.vt-table td:nth-child(3){width:90px}.vt-table td:nth-child(4){width:70px;font-size:12px;color:#9aa3b8;direction:ltr;text-align:right}.vt-table td:nth-child(5){width:30px}.vt-table th{display:none}
.vt-qty,.vt-price,.cl-num{direction:ltr;text-align:right}
.pc-card{border:1px solid #232838;border-radius:12px;padding:10px;margin-top:8px}.pc-card h2{font-size:13px;color:#9aa3b8;margin:0 0 6px}
.pc-line{display:flex;flex-wrap:wrap;gap:6px;align-items:center}.pc-line input{width:84px;text-align:center}.pc-line select{width:auto}
.pc-res{display:flex;justify-content:space-between;align-items:center;margin-top:6px}.pc-r{font-size:20px;font-weight:800;direction:ltr}.pc-f{font-size:11px;color:#7d869b;direction:ltr}.pc-copy{display:none}
[hidden]{display:none!important}"""
STUB = '<script>function qtCopy(t,el,l){try{navigator.clipboard.writeText(t);if(el)el.textContent=(l||"Copied")+" ✓"}catch(e){}}function qtTrack(){}</script>'
def strip_scripts_ids(s): return s
EMBEDS = {
 "vat-calculator": dict(lang="ar", title="حاسبة ضريبة القيمة المضافة", tool="/ar/vat-calculator", label="حاسبة ضريبة القيمة المضافة", height=430,
  scripts='<script src="/tafqeet.js"></script><script src="/ar-calcs.js"></script>',
  body="""<h1>حاسبة ضريبة القيمة المضافة</h1>
<div class="g"><div><label for="vtCountry">الدولة</label><select id="vtCountry"></select></div><div><label for="vtMode">الأسعار</label><select id="vtMode"><option value="exc">قبل الضريبة</option><option value="inc">شاملة الضريبة</option></select></div>
<div id="vtRateWrap" hidden><label for="vtRate">النسبة %</label><input id="vtRate" class="cl-num" value="15"></div><div id="vtCurWrap" hidden><label for="vtCur">العملة</label><select id="vtCur"></select></div></div>
<table class="vt-table" style="margin-top:8px"><tbody id="vtRows"></tbody></table><button type="button" class="btn" id="vtAdd" style="margin-top:6px">+ بند</button>
<div class="out"><div class="row"><span>قبل الضريبة</span><b><span id="vtNet"></span> <span class="vt-cur"></span></b></div><div class="row"><span>الضريبة (<span id="vtRateLbl"></span>)</span><b><span id="vtVat"></span> <span class="vt-cur"></span></b></div>
<div class="big"><span id="vtTotal"></span> <span class="vt-cur"></span></div><div class="words" id="vtWords"></div><div class="words" id="vtHint" hidden></div></div>
<div class="foot"><button type="button" class="btn" id="vtCopy">نسخ</button><span id="vtStatus"></span>__POWER__</div>"""),
 "zakat-calculator": dict(lang="ar", title="حاسبة الزكاة", tool="/ar/zakat-calculator", label="حاسبة الزكاة", height=560,
  scripts='<script src="/tafqeet.js"></script><script src="/ar-calcs.js"></script>',
  body="""<h1>حاسبة الزكاة</h1>
<div class="g"><div><label for="zkCur">العملة</label><select id="zkCur"><option value="SAR">ريال سعودي</option><option value="AED">درهم إماراتي</option><option value="KWD">دينار كويتي</option><option value="QAR">ريال قطري</option><option value="JOD">دينار أردني</option><option value="EGP">جنيه مصري</option><option value="USD">دولار</option></select></div>
<div><label for="zkGoldPrice">سعر غرام ذهب 24</label><input id="zkGoldPrice" class="cl-num" placeholder="420"></div><div><label for="zkSilverPrice">سعر غرام الفضة</label><input id="zkSilverPrice" class="cl-num"></div>
<div><label for="zkBasis">النصاب</label><select id="zkBasis"><option value="gold">ذهب 85غ</option><option value="silver">فضة 595غ</option></select></div>
<div><label for="zkCash">النقود</label><input id="zkCash" class="cl-num"></div><div><label for="zkG24">ذهب 24 (غ)</label><input id="zkG24" class="cl-num"></div><div><label for="zkG21">ذهب 21 (غ)</label><input id="zkG21" class="cl-num"></div><div><label for="zkG18">ذهب 18 (غ)</label><input id="zkG18" class="cl-num"></div>
<div hidden><input id="zkG22"><input id="zkSilver"><input id="zkTrade"><input id="zkRecv"><input id="zkInvest"></div><div><label for="zkDebts">ديون عليك</label><input id="zkDebts" class="cl-num"></div></div>
<div class="out" id="zkResult"><div class="row"><span>صافي المال</span><b><span id="zkNetV"></span> <span class="zk-cur"></span></b></div><div class="row"><span>النصاب</span><b><span id="zkNisab"></span></b></div><div hidden><span id="zkAssets"></span><span id="zkPure"></span></div>
<div class="big" id="zkAmount"></div><div class="words" id="zkWords"></div><div class="words" id="zkMsg"></div></div>
<div class="foot"><button type="button" class="btn" id="zkCopy">نسخ</button><span id="zkStatus"></span>__POWER__</div>"""),
 "percentage-calculator": dict(lang="en", title="Percentage Calculator", tool="/percentage-calculator", label="Percentage Calculator", height=470,
  scripts='<script src="/percent.js"></script>',
  body="""<h1>Percentage Calculator</h1>
<div class="pc-card"><h2>What is X% of Y?</h2><div class="pc-line">What is <input id="pc1p" value="15"> % of <input id="pc1x" value="200"> ?</div><div class="pc-res"><span class="pc-r" id="pc1r">—</span></div><div class="pc-f" id="pc1f"></div></div>
<div class="pc-card"><h2>X is what % of Y?</h2><div class="pc-line"><input id="pc2a" value="30"> is what % of <input id="pc2b" value="200"> ?</div><div class="pc-res"><span class="pc-r" id="pc2r">—</span></div><div class="pc-f" id="pc2f"></div></div>
<div class="pc-card"><h2>Percent change</h2><div class="pc-line">From <input id="pc3a" value="80"> to <input id="pc3b" value="100"></div><div class="pc-res"><span class="pc-r" id="pc3r">—</span></div><div class="pc-f" id="pc3f"></div></div>
<div class="pc-card"><h2>Discount / add %</h2><div class="pc-line"><input id="pc4x" value="200"> <select id="pc4dir"><option value="down">−</option><option value="up">+</option></select> <input id="pc4p" value="25"> %</div><div class="pc-res"><span class="pc-r" id="pc4r">—</span></div><div class="pc-f" id="pc4f"></div></div>
<div class="foot"><span id="pcStatus"></span>__POWER__</div>"""),
}
for slug, e in EMBEDS.items():
    ar = e["lang"] == "ar"
    power = '<a href="%s%s?utm_source=embed&amp;utm_medium=widget" target="_blank" rel="noopener">%s</a>' % (B, e["tool"], "بواسطة QuickTiny ↗" if ar else "Powered by QuickTiny ↗")
    html = f"""<!doctype html>
<html lang="{e['lang']}" dir="{'rtl' if ar else 'ltr'}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e['title']} — QuickTiny Embed</title>
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="{B}{e['tool']}">
<style>{CSS}</style>
</head>
<body><div class="card" id="tool">
{e['body'].replace('__POWER__', power)}
</div>
{STUB}
{e['scripts']}
<script>(function(){{function h(){{try{{parent.postMessage({{qtEmbed:"{slug}",height:document.documentElement.scrollHeight}},"*")}}catch(e){{}}}}addEventListener("load",h);new ResizeObserver(h).observe(document.body)}})();</script>
</body>
</html>
"""
    io.open("embed/%s.html" % slug, "w", encoding="utf-8", newline="\n").write(html)
    # "Embed on your site" box on the tool page
    page = e["tool"].lstrip("/") + ".html"
    s = io.open(page, encoding="utf-8").read()
    if 'id="qtEmbedBox"' not in s:
        snippet = ('<iframe src="%s/embed/%s" title="%s" width="100%%" height="%d" style="border:0;max-width:640px" loading="lazy"></iframe>\n'
                   '<p style="font-size:13px"><a href="%s%s">%s</a> %s</p>') % (B, slug, e["label"], e["height"], B, e["tool"], e["label"], "— أداة مجانية من QuickTiny" if ar else "— free tool by QuickTiny")
        esc = snippet.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        box = ('\n    <h2>%s</h2>\n    <p>%s</p>\n    <div id="qtEmbedBox"><textarea readonly rows="4" style="width:100%%;font:12.5px/1.5 var(--mono);direction:ltr" onclick="this.select()">%s</textarea>'
               '<div class="btn-row" style="margin-top:8px"><button class="btn btn-secondary" type="button" onclick="qtCopy(this.parentNode.previousElementSibling.value, null); this.textContent=\'%s\'">%s</button></div></div>\n') % (
            "ضع هذه الحاسبة في موقعك مجانًا" if ar else "Embed this calculator on your site",
            "انسخ الكود والصقه في أي صفحة (ووردبريس، بلوجر، موقعك). مجاني بدون تسجيل." if ar else "Copy the code into any page (WordPress, Blogger, your own site). Free, no sign-up.",
            esc, "تم النسخ ✓" if ar else "Copied ✓", "نسخ الكود" if ar else "Copy code")
        s = s.replace('  <div class="content">\n', '  <div class="content">\n' + box, 1)
        io.open(page, "w", encoding="utf-8", newline="").write(s)
    print("embed", slug)
