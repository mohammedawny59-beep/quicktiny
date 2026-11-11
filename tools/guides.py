# Builds guide articles (/guides/<slug>, /ar/guides/<slug>) and the two index pages from tools/specs/guides_content.py.
# English pages reuse compress-image.html's shell (like make_page.py, but in-process so non-ASCII text isn't mangled by
# Windows argv); Arabic pages go through make_ar.py. The WebApplication JSON-LD is replaced by Article JSON-LD.
# usage: python tools/guides.py <repo>
import io, os, sys, json, re, subprocess, tempfile, importlib.util
root = os.path.abspath(sys.argv[1]); os.chdir(root)
here = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("gc", os.path.join(here, "specs", "guides_content.py")); gc = importlib.util.module_from_spec(spec); spec.loader.exec_module(gc)
B = "https://quicktinyv2.vercel.app"
GO = '<svg class="go-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
STYLE = """  <style>
    .guide{max-width:780px}
    .guide p,.guide li{font-size:16.5px;line-height:1.85;color:var(--text)}
    .guide ol,.guide ul:not(.benefits){padding-inline-start:22px}
    .guide li{margin-bottom:6px}
    .guide a{color:#9fb0ff;text-decoration:underline;text-underline-offset:3px}
    .guide .btn{text-decoration:none;color:#fff}
    .guide-table{width:100%;border-collapse:collapse;margin:14px 0;font-size:15px}
    .guide-table th,.guide-table td{border:1px solid var(--line);padding:9px 10px;text-align:start;vertical-align:top}
    .guide-table th{background:rgba(255,255,255,.05);color:var(--text-dim)}
    .guide-cta{margin:26px 0;padding:18px 20px;border-radius:18px;background:linear-gradient(135deg,rgba(107,107,255,.18),rgba(59,226,255,.07));border:1px solid rgba(123,123,255,.35);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}
    .guide-cta b{font-size:17px}
    .guide .eq{display:inline-block;unicode-bidi:isolate;font-variant-numeric:tabular-nums;white-space:nowrap}
    @media(max-width:520px){.guide .eq{white-space:normal}}
    .guide-meta{font-size:13px;color:var(--muted);margin-top:6px}
    .guide-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px;margin-top:16px}
    .guide-card{display:block;padding:16px 18px;border-radius:16px;border:1px solid var(--line);background:rgba(255,255,255,.03);text-decoration:none;color:var(--text)}
    .guide-card:hover{border-color:var(--line-strong)}
    .guide-card b{display:block;font-size:16.5px;margin-bottom:6px}.guide-card span{font-size:14px;color:var(--text-dim);line-height:1.6}
    @media(max-width:520px){.guide-table{font-size:13.5px}.guide-table th,.guide-table td{padding:7px 6px}}
  </style>
"""
WRAP_START = '<div class="wrap" id="main" role="main" tabindex="-1">\n  <div class="breadcrumb">'

def article_ld(g, url):
    return json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": g["h1"], "description": g["desc"], "inLanguage": g["lang"],
        "datePublished": g.get("date", gc.DATE), "dateModified": g.get("date", gc.DATE), "mainEntityOfPage": url, "url": url, "image": B + ("/og-image-ar.png" if g["lang"] == "ar" else "/og-image.png"),
        "author": {"@type": "Organization", "name": "QuickTiny", "url": B + "/"}, "publisher": {"@type": "Organization", "name": "QuickTiny", "url": B + "/"}}, ensure_ascii=False)

def faq_html(items): return "".join('<details class="faq-item"><summary>%s</summary><p>%s</p></details>' % (q, a) for q, a in items)
def plain(s): return re.sub(r"<[^>]+>", "", s)

def make_en(slug, title, desc, crumb, body_html):
    src = io.open("compress-image.html", encoding="utf-8").read()
    header = src[:src.index(WRAP_START)]
    footer = src[src.index("<footer>"):src.index('<script type="application/ld+json">')]
    footer = footer.replace('<script src="/compress-image.js" defer></script>' + chr(10), "")
    url = B + "/" + slug
    header = re.sub(r"<title>.*?</title>", lambda m: "<title>" + title + "</title>", header, flags=re.S)
    for pat in [r'(<meta name="description" content=")[^"]*', r'(<meta property="og:description" content=")[^"]*', r'(<meta name="twitter:description" content=")[^"]*']:
        header = re.sub(pat, lambda m: m.group(1) + desc, header)
    for pat in [r'(<meta property="og:title" content=")[^"]*', r'(<meta name="twitter:title" content=")[^"]*']:
        header = re.sub(pat, lambda m: m.group(1) + title, header)
    header = header.replace(B + "/compress-image", url)
    header = re.sub(r'\s*<link rel="alternate" hreflang="[^"]*"[^>]*>', "", header)
    header = header.replace('<link rel="stylesheet" href="/styles.css">', '<link rel="stylesheet" href="/styles.css">\n' + STYLE.rstrip())
    ld = ('<script type="application/ld+json">{"@context": "https://schema.org", "@type": "WebApplication"}</script>\n'
          '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
              {"@type": "ListItem", "position": 1, "name": "Home", "item": B + "/"}, {"@type": "ListItem", "position": 2, "name": crumb, "item": url}]}, ensure_ascii=False) + "</script>\n</body>\n</html>\n")
    if os.path.dirname(slug): os.makedirs(os.path.dirname(slug), exist_ok=True)
    body_html = body_html.replace('<div class="wrap">', '<div class="wrap" id="main" role="main" tabindex="-1">', 1)
    io.open(slug + ".html", "w", encoding="utf-8", newline="").write(header + body_html + footer + ld)

def patch(path, g, url, faq=True):
    s = io.open(path, encoding="utf-8").read()
    s = re.sub(r'<script type="application/ld\+json">\{"@context": ?"https://schema.org", ?"@type": ?"WebApplication".*?</script>',
               lambda m: '<script type="application/ld+json">' + article_ld(g, url) + "</script>", s, count=1, flags=re.S)
    s = s.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    if faq and g.get("faq") and '"FAQPage"' not in s:
        s = s.replace("</body>", '<script type="application/ld+json">' + json.dumps({"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": plain(a)}} for q, a in g["faq"]]}, ensure_ascii=False) + "</script>\n</body>", 1)
    io.open(path, "w", encoding="utf-8", newline="").write(s)

def body(g, others):
    ar = g["lang"] == "ar"
    home, guides = ("/ar", "/ar/guides") if ar else ("/", "/guides")
    rel = "".join('      <a href="%s">%s%s</a>\n' % (("/ar/guides/" if ar else "/guides/") + o["slug"], o["h1"], GO) for o in others[:4])
    return f"""<div class="wrap">
  <div class="breadcrumb"><a href="{home}">{'الرئيسية' if ar else 'Home'}</a> <span>/</span><a href="{guides}">{'أدلة وشروحات' if ar else 'Guides'}</a> <span>/</span><span style="color:var(--text-dim)">{g['h1']}</span></div>
  <section class="hero compact">
    <div class="hero-badges"><span class="badge">{'دليل' if ar else 'Guide'}</span></div>
    <h1>{g['h1']}</h1>
    <p>{g['lede']}</p>
    <div class="guide-meta">{'آخر تحديث' if ar else 'Updated'}: {g.get('date', gc.DATE)}</div>
  </section>
  <article class="content guide">
    {g['body']}
    <div class="guide-cta"><b>{g['tool'][1]}</b><a class="btn" href="{g['tool'][0]}">{'افتح الأداة' if ar else 'Open the tool'} {GO}</a></div>
    <h2>{'أسئلة شائعة' if ar else 'Frequently asked questions'}</h2>
    {faq_html(g['faq'])}
  </article>
  <div class="section related-section">
    <h2 class="related-title">{'أدلة أخرى' if ar else 'More guides'}</h2>
    <div class="related-grid">
{rel}    </div>
  </div>
</div>
"""

def index_body(gs, ar):
    cards = "".join('<a class="guide-card" href="/%s%s"><b>%s</b><span>%s</span></a>' % ("ar/guides/" if ar else "guides/", g["slug"], g["h1"], g["lede"]) for g in gs)
    return f"""<div class="wrap">
  <div class="breadcrumb"><a href="{'/ar' if ar else '/'}">{'الرئيسية' if ar else 'Home'}</a> <span>/</span><span style="color:var(--text-dim)">{'أدلة وشروحات' if ar else 'Guides'}</span></div>
  <section class="hero compact"><h1>{'أدلة وشروحات عملية' if ar else 'Practical guides'}</h1><p>{'شروحات قصيرة بأمثلة محسوبة لأكثر الأسئلة التي يبحث عنها الناس — وكل دليل يوصلك للأداة المناسبة.' if ar else 'Short, worked-example answers to the questions people search for most — each one links to the right free tool.'}</p></section>
  <div class="guide-list">{cards}</div>
</div>
"""

tmp = tempfile.mkdtemp()
io.open(os.path.join(tmp, "g_style.html"), "w", encoding="utf-8").write(STYLE)
built = []
# English
en = [g for g in gc.GUIDES if g["lang"] == "en"]
for g in en:
    slug = "guides/" + g["slug"]
    make_en(slug, g["title"], g["desc"], g["h1"], body(g, [o for o in en if o is not g]))
    patch(slug + ".html", g, B + "/" + slug); built.append(slug)
make_en("guides", "Guides — Practical How-Tos With Worked Examples | QuickTiny", "Practical guides with worked examples: converting HEIC to JPG, compressing photos for forms, comparing loan offers, calculating percentages and more.", "Guides", index_body(en, False))
patch("guides.html", {"h1": "Practical guides", "desc": "Practical guides with worked examples.", "lang": "en"}, B + "/guides", faq=False); built.append("guides")
# Arabic (via make_ar.py with a spec file — no text on the command line)
ar = [g for g in gc.GUIDES if g["lang"] == "ar"]
specs = []
for g in ar:
    fn = "ar_%s.html" % g["slug"]
    io.open(os.path.join(tmp, fn), "w", encoding="utf-8").write(body(g, [o for o in ar if o is not g]))
    specs.append({"slug": "ar/guides/" + g["slug"], "title": g["title"], "desc": g["desc"], "app_name": "QuickTiny", "crumb": g["h1"], "category": "Article",
                  "body": fn, "style": "g_style.html", "alternates": [["ar", "ar/guides/" + g["slug"]], ["x-default", "ar/guides/" + g["slug"]]], "switch": [],
                  "faq": [[q, plain(a)] for q, a in g["faq"]]})
io.open(os.path.join(tmp, "ar_index.html"), "w", encoding="utf-8").write(index_body(ar, True))
specs.append({"slug": "ar/guides", "title": "أدلة وشروحات عملية بالأمثلة — المعدل والزكاة والضريبة والصور | QuickTiny",
              "desc": "شروحات عملية بأمثلة محسوبة: المعدل التراكمي من 5، النسبة الموزونة، زكاة الفطر وموعد رمضان، زكاة الذهب، ضريبة القيمة المضافة، نهاية الخدمة، وتحويل الصور وتصغيرها.",
              "app_name": "QuickTiny", "crumb": "أدلة وشروحات", "category": "Article", "body": "ar_index.html", "style": "g_style.html",
              "alternates": [["ar", "ar/guides"], ["x-default", "ar/guides"]], "switch": []})
sp = os.path.join(tmp, "spec_guides.json"); io.open(sp, "w", encoding="utf-8").write(json.dumps({"pages": specs}, ensure_ascii=False))
subprocess.run([sys.executable, "-I", os.path.join(here, "make_ar.py"), root, sp], check=True, stdout=subprocess.DEVNULL)
for g in ar: patch("ar/guides/%s.html" % g["slug"], g, B + "/ar/guides/" + g["slug"], faq=False); built.append("ar/guides/" + g["slug"])
patch("ar/guides.html", {"h1": "أدلة وشروحات", "desc": "شروحات عملية بأمثلة محسوبة.", "lang": "ar"}, B + "/ar/guides", faq=False); built.append("ar/guides")
io.open(os.path.join(here, "specs", "guides_built.json"), "w").write(json.dumps(built))
print(len(built), "pages:", ", ".join(built))
